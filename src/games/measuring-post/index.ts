/**
 * Measuring Post: friends bring questions to a measuring counter. Level 1 picks the tool that answers how long, how heavy
 * or how much (the rope, the balance, the cup), watches it measure, and sends the answer; level 2 sees one thing measured
 * by two friends, in big and in little units, after one big unit is shown to match two little ones, and taps whose units
 * were smaller (the last friend asks whose were bigger). Rules: ./logic.ts; definition: docs/definitions/measuring-post.md.
 */
import { Container, Graphics, Rectangle, Text } from 'pixi.js';
import { Critter, CRITTERS, type CritterName } from '../../art/critter';
import { ink, swatch } from '../../art/palette';
import { STYLES } from '../../audio/music';
import { sfx } from '../../audio/sfx';
import type { LineId } from '../../content/voice-script';
import { onTap } from '../../engine/input';
import type { View } from '../../engine/view';
import { rangeFor, type BandLevels } from '../../progress/difficulty';
import { RoundButton } from '../../ui/buttons';
import { FONT } from '../../ui/text';
import { WigglyIcon } from '../shared';
import type { Game, GameContext, GameModule, TouchIntent } from '../types';
import {
  cupArt, drawBalance, handIcon, hubArt, jugArt, LITTLE, objectArt, padArt, parcelArt, ribbonArt, sendIcon, speakerIcon,
  stickerArt, toolArt, unitArt,
} from './art';
import {
  answerRow, commonExact, compareAnswer, GLOW_AFTER, helpId, HelpTally, planFor, remeasure, tasksFor, TOOL_FOR, TOOLS,
  toolAnswers, UNIT_VALUE, type Attribute, type LevelPlan, type MeasureRecord, type Pick, type Step, type Task, type Tool,
  type UnitSize,
} from './logic';

const LEVELS: BandLevels = { school: { min: 1, max: 4 } };
const SIZES: readonly UnitSize[] = ['big', 'little'];

/** Seconds between units laid, poured or stacked while a tool measures. */
const STEP = 0.4;
/** Seconds the level-2 "one big is two little" strip takes before the records measure. */
const EQUIV = 1.2;

const TOOL_PAD = { w: 140, h: 110 };

interface Pt { x: number; y: number }
interface Box { x: number; y: number; w: number; h: number }

/**
 * Where things go. Landscape centres the 1024×768 plan; portrait stretches the 768×1024 plan over the view (positions
 * only: pads and buttons keep their size).
 */
interface Layout {
  landscape: boolean;
  board: Box;
  /** The one-big-is-two-little strip and the two record slots (level 2); level 1 uses the whole board. */
  strip: Box;
  slots: [Box, Box];
  /** Level 3's two objects, side by side (landscape) or stacked (portrait), over the whole board. */
  pair: [Box, Box];
  tools: Pt[];
  /** Level 3's two unit tokens, big then little. */
  units: [Pt, Pt];
  answers: [Pt, Pt];
  answerSize: { w: number; h: number };
  help: Pt;
  replay: Pt;
  send: Pt;
}

function layoutFor(v: View): Layout {
  if (v.w >= v.h) {
    const ox = (v.w - 1024) / 2, oy = (v.h - 768) / 2;
    const P = (x: number, y: number): Pt => ({ x: ox + x, y: oy + y });
    const board = { x: ox + 180, y: oy + 150, w: 780, h: 330 };
    const strip = { x: board.x, y: board.y, w: board.w, h: 90 };
    const slotY = strip.y + strip.h, slotH = board.y + board.h - slotY;
    return {
      landscape: true, board, strip,
      slots: [{ x: board.x, y: slotY, w: board.w / 2, h: slotH }, { x: board.x + board.w / 2, y: slotY, w: board.w / 2, h: slotH }],
      pair: [{ ...board, w: board.w / 2 }, { ...board, x: board.x + board.w / 2, w: board.w / 2 }],
      tools: [P(340, 555), P(520, 555), P(700, 555)], units: [P(430, 555), P(610, 555)],
      answers: [P(375, 555), P(765, 555)], answerSize: { w: 320, h: 110 },
      help: P(340, 700), replay: P(550, 700), send: P(800, 700),
    };
  }
  const sx = v.w / 768, sy = v.h / 1024;
  const P = (x: number, y: number): Pt => ({ x: x * sx, y: y * sy });
  const board = { x: 170 * sx, y: 150 * sy, w: 560 * sx, h: 460 * sy };
  const strip = { x: board.x, y: board.y, w: board.w, h: 100 * sy };
  const slotY = strip.y + strip.h, slotH = (board.y + board.h - slotY) / 2;
  return {
    landscape: false, board, strip,
    slots: [{ x: board.x, y: slotY, w: board.w, h: slotH }, { x: board.x, y: slotY + slotH, w: board.w, h: slotH }],
    pair: [{ ...board, h: board.h / 2 }, { ...board, y: board.y + board.h / 2, h: board.h / 2 }],
    tools: [P(260, 700), P(440, 700), P(620, 700)], units: [P(350, 700), P(530, 700)],
    answers: [P(450, 672), P(450, 800)], answerSize: { w: 540, h: 110 },
    help: P(260, 930), replay: P(440, 930), send: P(620, 930),
  };
}

/**
 * What the round is doing now. Taps only act in `tool`, `send` (level 1), `answer` (levels 2–3) and `unit` (level 3:
 * pick the units to measure both objects; `remeasure` animates them, `between` explains a unit that does not fit).
 */
type Phase = 'tool' | 'wrong' | 'measure' | 'unit' | 'remeasure' | 'between' | 'send' | 'answer' | 'sending' | 'done';

const FRIENDS: CritterName[] = ['bunny', 'bear', 'duck'];
const ROW_FRIENDS: [CritterName, CritterName] = ['cat', 'dog'];

const label = (text: string, size = 34) => {
  const t = new Text({ text, style: { fontFamily: FONT, fontSize: size, fontWeight: '800', fill: ink } });
  t.anchor.set(0.5);
  t.eventMode = 'none';
  return t;
};

function friendHead(kind: CritterName, scale = 0.32): Container {
  const c = new Critter(CRITTERS[kind]);
  c.alive = false;
  c.scale.set(scale);
  c.eventMode = 'none';
  return c;
}

class MeasuringPost implements Game {
  readonly plan: LevelPlan;
  readonly tasks: Task[];
  task = 0;
  phase: Phase = 'tool';
  /** Misses across the round, and on the current task (which drive the glow). */
  misses = 0;
  taskMisses = 0;
  readonly tally = new HelpTally();
  /** Steps Help has already pointed at this round: Help again there does the step. An automatic glow is not pointing. */
  private readonly pointed = new Set<string>();
  /** Seconds since the current measurement began. */
  private t = 0;
  private clock = 0;
  private started = false;
  private alive = true;
  private glowAt: { p: Pt; w: number; h: number } | null = null;
  private drawnKey = '';
  layout!: Layout;

  private readonly background = new Graphics();
  private readonly board = new Container();
  private readonly glow = new Graphics();
  readonly toolPads = new Map<Tool, Container>();
  readonly answerPads: Container[] = [];
  /** Level 3: the big and little unit tokens, and the three comparison pads (left object, the same, right object). */
  readonly unitPads = new Map<UnitSize, Container>();
  readonly comparePads: Container[] = [];
  /** Level 3: the unit she remeasured both objects with (kept on the board while she picks again), or null. */
  commonSize: UnitSize | null = null;
  /** Level 3: a gentle offer of the little units after big ones fell between marks; not a hint. */
  private offerAt: { p: Pt; w: number; h: number } | null = null;
  readonly helpButton: RoundButton;
  readonly replayButton: RoundButton;
  readonly sendButton: RoundButton;

  constructor(private readonly ctx: GameContext) {
    this.plan = planFor(ctx.level);
    this.tasks = tasksFor(this.plan, ctx.rng);
    this.board.eventMode = 'none';
    this.glow.eventMode = 'none';
    ctx.stage.addChild(this.background, this.board);
    for (const tool of TOOLS) {
      const pad = new Container();
      pad.addChild(padArt(TOOL_PAD.w, TOOL_PAD.h), toolArt(tool));
      pad.hitArea = new Rectangle(-TOOL_PAD.w / 2, -TOOL_PAD.h / 2, TOOL_PAD.w, TOOL_PAD.h);
      onTap(pad, () => this.pickTool(tool), { cooldown: 300 });
      this.toolPads.set(tool, pad);
      ctx.stage.addChild(pad);
    }
    for (let i = 0; i < 2; i++) {
      const pad = new Container();
      onTap(pad, () => this.pickRow(i), { cooldown: 300 });
      this.answerPads.push(pad);
      ctx.stage.addChild(pad);
    }
    for (const size of SIZES) {
      const pad = new Container();
      pad.hitArea = new Rectangle(-TOOL_PAD.w / 2, -TOOL_PAD.h / 2, TOOL_PAD.w, TOOL_PAD.h);
      pad.visible = false;
      onTap(pad, () => this.pickUnit(size), { cooldown: 300 });
      this.unitPads.set(size, pad);
      ctx.stage.addChild(pad);
    }
    for (let i = 0; i < 3; i++) {
      const pad = new Container();
      pad.hitArea = new Rectangle(-TOOL_PAD.w / 2, -TOOL_PAD.h / 2, TOOL_PAD.w, TOOL_PAD.h);
      pad.visible = false;
      onTap(pad, () => this.pickCompare(i as Pick), { cooldown: 300 });
      this.comparePads.push(pad);
      ctx.stage.addChild(pad);
    }
    this.helpButton = new RoundButton(handIcon(), swatch.orange, 50, () => this.help());
    this.replayButton = new RoundButton(speakerIcon(), swatch.white, 50, () => this.replay());
    this.sendButton = new RoundButton(sendIcon(), swatch.green, 50, () => this.send());
    ctx.stage.addChild(this.helpButton, this.replayButton, this.sendButton, this.glow);
    this.layout = layoutFor(ctx.view);
  }

  get hints(): number {
    return this.tally.count;
  }

  get current(): Task {
    return this.tasks[this.task];
  }

  // ---- Choices ----

  pickTool(tool: Tool) {
    // Taps while a tool measures, or after, do nothing; while a wrong tool is explained, only the right one acts.
    if (this.phase !== 'tool' && this.phase !== 'wrong') return;
    const task = this.current;
    const pad = this.toolPads.get(tool)!;
    if (toolAnswers(task, tool)) {
      this.press(pad);
      sfx.pop(7);
      this.glowAt = null;
      this.phase = 'measure';
      this.t = 0;
      this.redraw();
      return;
    }
    if (this.phase === 'wrong') return;
    // Another tool measures its own attribute, which does not answer this question: one miss, then try again.
    sfx.boing();
    this.miss('tool');
    this.phase = 'wrong';
    this.shake(pad);
    void Promise.all([this.ctx.say(`measure.wrong.${tool}.${task.attribute}` as LineId), this.ctx.tw.wait(0.6)]).then(() => {
      if (this.alive && this.phase === 'wrong') { this.phase = 'tool'; this.redraw(); }
    });
    this.redraw();
  }

  pickRow(i: number) {
    if (this.phase !== 'answer' || this.plan.mode !== 'rows') return;
    const task = this.current;
    const pad = this.answerPads[i];
    if (i === answerRow(task)) {
      this.press(pad);
      sfx.bell(9, 0.3);
      this.ctx.pet.cheer();
      this.glowAt = null;
      this.phase = 'sending';
      this.redraw();
      void Promise.all([this.ctx.say(`measure.right.${task.ask}` as LineId), this.ctx.tw.wait(0.8)]).then(() => this.alive && this.next());
      return;
    }
    sfx.boing();
    this.shake(pad);
    this.miss('answer');
    void this.ctx.say(`measure.hint.row.${task.attribute}.${task.ask}` as LineId);
  }

  /** Level 3: remeasure both objects in big or little units. Either is allowed; a unit that does not fit is no miss. */
  pickUnit(size: UnitSize) {
    if (this.phase !== 'unit') return;
    this.press(this.unitPads.get(size)!);
    sfx.pop(size === 'big' ? 5 : 8);
    this.glowAt = null;
    this.offerAt = null;
    this.commonSize = size;
    this.phase = 'remeasure';
    this.t = 0;
    this.redraw();
  }

  /** Level 3: tap the longer, heavier or fuller one, or "the same"; only after both are in one unit. */
  pickCompare(i: Pick) {
    if (this.phase !== 'answer' || this.plan.mode !== 'common') return;
    const task = this.current;
    const pad = this.comparePads[i];
    if (i === compareAnswer(task, this.commonSize!)) {
      this.press(pad);
      sfx.bell(9, 0.3);
      this.ctx.pet.cheer();
      this.glowAt = null;
      this.phase = 'sending';
      this.redraw();
      void Promise.all([this.ctx.say(`measure.right3.${task.attribute}` as LineId), this.ctx.tw.wait(0.8)]).then(() => this.alive && this.next());
      return;
    }
    sfx.boing();
    this.shake(pad);
    this.miss('answer');
    void this.ctx.say(this.compareHint());
  }

  private compareHint(): LineId {
    return `measure.hint.compare.${this.current.attribute}.${this.commonSize ?? 'little'}` as LineId;
  }

  /** Touch-down feedback: the pad lifts a little and settles. */
  private press(pad: Container) {
    this.ctx.tw.kill(pad.scale);
    pad.scale.set(1.08);
    void this.ctx.tw.to(pad.scale, { x: 1, y: 1 }, { duration: 0.15 });
  }

  private shake(pad: Container) {
    void this.ctx.tw.to(pad, { rotation: 0.12 }, { duration: 0.08 }).then(() => { if (this.alive) void this.ctx.tw.to(pad, { rotation: 0 }, { duration: 0.12 }); });
  }

  send() {
    if (this.phase !== 'send') return;
    sfx.whoosh();
    this.glowAt = null;
    this.phase = 'sending';
    this.redraw();
    void this.ctx.tw.wait(0.5).then(() => this.alive && this.next());
  }

  private next() {
    if (this.task + 1 >= this.tasks.length) {
      this.phase = 'done';
      this.redraw();
      sfx.sparkle();
      this.ctx.pet.cheer();
      void this.ctx.tw.wait(0.6).then(() => this.alive && this.ctx.finish({ misses: this.misses, hints: this.tally.count }));
      return;
    }
    this.task++;
    this.taskMisses = 0;
    this.phase = 'tool';
    this.glowAt = null;
    this.offerAt = null;
    this.commonSize = null;
    this.redraw();
    this.askQuestion();
  }

  private askQuestion() {
    void this.ctx.say(`measure.${this.plan.mode === 'common' ? 'ask3' : 'ask'}.${this.current.attribute}` as LineId);
  }

  private miss(step: Step) {
    this.misses++;
    this.taskMisses++;
    // After two misses on a task, the useful next control glows: that is this step's hint, shared with Help.
    if (this.taskMisses >= GLOW_AFTER) {
      this.tally.give(helpId(this.task, step));
      this.glowUseful(step);
    }
  }

  private glowUseful(step: Step) {
    const L = this.layout;
    if (step === 'tool') this.glowAt = { p: L.tools[TOOLS.indexOf(TOOL_FOR[this.current.attribute])], w: TOOL_PAD.w, h: TOOL_PAD.h };
    else if (step === 'unit') this.glowAt = { p: L.units[1], ...TOOL_PAD };
    else if (step === 'answer' && this.plan.mode === 'common') this.glowAt = { p: L.tools[compareAnswer(this.current, this.commonSize!)], ...TOOL_PAD };
    else if (step === 'answer') this.glowAt = { p: L.answers[answerRow(this.current)], ...L.answerSize };
    else this.glowAt = { p: L.send, w: 100, h: 100 };
  }

  // ---- Help ----

  /** The step Help works on now, or null while a tool measures. */
  private get step(): Step | null {
    const p = this.phase;
    return p === 'tool' || p === 'wrong' ? 'tool' : p === 'unit' ? 'unit' : p === 'answer' ? 'answer' : p === 'send' ? 'send' : null;
  }

  /**
   * First Help on a step points at the useful control and says why (one hint); Help again on that step does it for her,
   * adding nothing. Send is not a step that counts: Help only points at it.
   */
  help() {
    const step = this.step;
    if (!step) return;
    const task = this.current;
    if (step === 'send') {
      this.glowUseful('send');
      void this.ctx.say('measure.send');
      return;
    }
    const id = helpId(this.task, step);
    const common = this.plan.mode === 'common';
    if (this.pointed.has(id)) {
      if (step === 'tool') this.pickTool(TOOL_FOR[task.attribute]);
      else if (step === 'unit') this.pickUnit('little');
      else if (common) this.pickCompare(compareAnswer(task, this.commonSize!));
      else this.pickRow(answerRow(task));
      return;
    }
    this.tally.give(id);
    this.pointed.add(id);
    this.offerAt = null;
    this.glowUseful(step);
    void this.ctx.say(step === 'tool' ? `measure.hint.tool.${task.attribute}` as LineId
      : step === 'unit' ? `measure.hint.unit.${task.attribute}` as LineId
        : common ? this.compareHint() : `measure.hint.row.${task.attribute}.${task.ask}` as LineId);
  }

  askForHint() {
    this.help();
  }

  replay() {
    const task = this.current;
    if (this.phase === 'tool' || this.phase === 'wrong') this.askQuestion();
    else if (this.phase === 'send') void this.ctx.say(`measure.result.1.${task.attribute}` as LineId);
    else if (this.phase === 'unit') void this.ctx.say(`measure.raw.${task.attribute}` as LineId);
    else if (this.phase === 'answer' && this.plan.mode === 'common') {
      void this.ctx.say(`measure.common.${task.attribute}.${this.commonSize}` as LineId).then(() => { if (this.alive) this.askQuestion(); });
    }
    else if (this.phase === 'answer') {
      void this.ctx.say(`measure.equal.${task.attribute}` as LineId).then(() => { if (this.alive) void this.ctx.say(`measure.result.2.${task.attribute}` as LineId); });
    }
  }

  // ---- Measuring ----

  /** How many units each record shows at time `t` of the measurement (level 2 waits for the strip first). */
  shownUnits(t = this.t): number[] {
    const records = this.shownRecords();
    if (this.phase === 'tool' || this.phase === 'wrong') return records.map(() => 0);
    if (this.phase !== 'measure' && this.phase !== 'remeasure') return records.map((r) => r.count);
    const start = this.plan.mode === 'rows' ? EQUIV : 0;
    return records.map((r) => Math.max(0, Math.min(r.count, Math.floor((t - start) / STEP) + 1)));
  }

  /**
   * The records on the board now: the friends' own (levels 1–3 before a common unit), or level 3's remeasure in the
   * common unit, where an object that ends between marks shows the whole units that fit.
   */
  shownRecords(): MeasureRecord[] {
    const task = this.current;
    if (!this.commonSize) return task.records;
    const size = this.commonSize;
    return task.objects!.map((o) => ({ unit: { attribute: task.attribute, size }, count: Math.floor(o.quantity / UNIT_VALUE[size]) }));
  }

  private measureLength(): number {
    const most = Math.max(...this.shownRecords().map((r) => r.count));
    return (this.plan.mode === 'rows' ? EQUIV : 0) + most * STEP + 0.3;
  }

  private measured() {
    const task = this.current;
    sfx.bell(7, 0.25);
    if (this.plan.mode === 'common') {
      if (this.phase === 'measure') {
        // The friends' own records, in different units: they cannot be compared yet.
        this.phase = 'unit';
        this.redraw();
        void this.ctx.say(`measure.raw.${task.attribute}` as LineId).then(() => { if (this.alive && this.phase === 'unit') void this.ctx.say('measure.unit'); });
        return;
      }
      const size = this.commonSize!;
      if (!commonExact(task, size)) {
        // Big units leave one object between marks: explore, no miss; offer the little ones.
        this.phase = 'between';
        this.redraw();
        void Promise.all([this.ctx.say(`measure.between.${task.attribute}` as LineId), this.ctx.tw.wait(0.6)]).then(() => {
          if (!this.alive || this.phase !== 'between') return;
          this.phase = 'unit';
          this.offerAt = { p: this.layout.units[1], ...TOOL_PAD };
          this.redraw();
        });
        return;
      }
      this.phase = 'answer';
      this.redraw();
      void this.ctx.say(`measure.common.${task.attribute}.${size}` as LineId).then(() => { if (this.alive && this.phase === 'answer') this.askQuestion(); });
      return;
    }
    if (this.plan.mode === 'tool') {
      this.phase = 'send';
      this.redraw();
      void this.ctx.say(`measure.result.1.${task.attribute}` as LineId);
      return;
    }
    this.phase = 'answer';
    this.redraw();
    void this.ctx.say(`measure.result.2.${task.attribute}` as LineId)
      .then(() => { if (this.alive) void this.ctx.instruct(task.ask === 'big' ? 'measure.instruct.2-big' : 'measure.instruct.2'); });
  }

  // ---- Drawing ----

  /** One record drawn at its natural size around (0, 0): the object and `shown` of its units. */
  private recordArt(attr: Attribute, quantity: number, rec: MeasureRecord, shown: number): Container {
    const c = new Container();
    const v = UNIT_VALUE[rec.unit.size];
    if (attr === 'length') {
      const len = quantity * LITTLE.length;
      const ribbon = ribbonArt(len);
      ribbon.position.set(-len / 2, -22);
      c.addChild(ribbon);
      for (let i = 0; i < shown; i++) {
        const w = unitArt(attr, rec.unit.size);
        w.position.set(-len / 2 + i * v * LITTLE.length, 22);
        c.addChild(w);
      }
      return c;
    }
    if (attr === 'mass') {
      const g = new Graphics();
      const placed = shown * v;
      const pans = drawBalance(g, 0, 70, 110, 0.32 * (1 - placed / quantity));
      c.addChild(g);
      const parcel = parcelArt();
      parcel.position.copyFrom(pans.left);
      c.addChild(parcel);
      // Two to a row on the right pan.
      const s = rec.unit.size === 'big' ? 52 : 36;
      for (let i = 0; i < shown; i++) {
        const b = unitArt(attr, rec.unit.size);
        b.position.set(pans.right.x + (i % 2 === 0 ? -s / 2 - 2 : s / 2 + 2), pans.right.y - Math.floor(i / 2) * s);
        c.addChild(b);
      }
      return c;
    }
    // Capacity: each cup pours into the jug and stands empty beside it.
    const jug = jugArt((shown * v) / quantity);
    const cupW = rec.unit.size === 'big' ? 58 : 44;
    const total = 110 + rec.count * cupW;
    jug.position.set(-total / 2 + 50, 70);
    c.addChild(jug);
    for (let i = 0; i < rec.count; i++) {
      const cup = cupArt(rec.unit.size, i >= shown);
      cup.position.set(-total / 2 + 110 + cupW / 2 + i * cupW, 70);
      cup.alpha = i < shown ? 1 : 0.35;
      c.addChild(cup);
    }
    return c;
  }

  /** Put `art` into `box`, scaled down to fit (never up past `max`). */
  private fit(art: Container, box: Box, max = 1.1, pad = 24, s = this.fitScale(art, box, max, pad)) {
    const b = art.getLocalBounds();
    art.scale.set(s);
    art.position.set(box.x + box.w / 2 - (b.x + b.width / 2) * s, box.y + box.h / 2 - (b.y + b.height / 2) * s);
    this.board.addChild(art);
  }

  private fitScale(art: Container, box: Box, max: number, pad: number): number {
    const b = art.getLocalBounds();
    return Math.min(max, (box.w - pad * 2) / Math.max(1, b.width), (box.h - pad * 2) / Math.max(1, b.height));
  }

  /** A count with its unit pictured beside it, at `p`. */
  private countBadge(attr: Attribute, rec: MeasureRecord, p: Pt, dim = false) {
    const c = new Container();
    if (dim) c.alpha = 0.55;
    c.addChild(new Graphics().roundRect(-62, -34, 124, 68, 18).fill({ color: 0xffffff, alpha: 0.9 }).stroke({ width: 3, color: swatch.white.line }));
    const n = label(String(rec.count));
    n.x = -32;
    const u = unitArt(attr, rec.unit.size);
    const ub = u.getLocalBounds();
    // One scale for both sizes (set by the big unit), so a big unit never looks smaller than a little one.
    const big = unitArt(attr, 'big'), bb = big.getLocalBounds();
    big.destroy();
    const us = Math.min(1, 56 / Math.max(bb.width, bb.height));
    u.scale.set(us);
    u.position.set(22 - (ub.x + ub.width / 2) * us, -(ub.y + ub.height / 2) * us);
    c.addChild(n, u);
    c.position.copyFrom(p);
    this.board.addChild(c);
  }

  /** The level-2 strip: one big unit matched by two little ones, in the task's attribute. */
  private stripArt(attr: Attribute): Container {
    const c = new Container();
    if (attr === 'length') {
      const big = unitArt(attr, 'big');
      big.position.set(-LITTLE.length, -18);
      c.addChild(big);
      for (let i = 0; i < 2; i++) { const w = unitArt(attr, 'little'); w.position.set(-LITTLE.length + i * LITTLE.length, 18); c.addChild(w); }
      return c;
    }
    if (attr === 'mass') {
      const g = new Graphics();
      const pans = drawBalance(g, 0, 60, 90, 0);
      c.addChild(g);
      const big = unitArt(attr, 'big'); big.position.copyFrom(pans.left); c.addChild(big);
      for (let i = 0; i < 2; i++) { const b = unitArt(attr, 'little'); b.position.set(pans.right.x + (i ? 20 : -20), pans.right.y); c.addChild(b); }
      return c;
    }
    const big = cupArt('big'); big.position.set(-60, 30); c.addChild(big);
    c.addChild(new Graphics().rect(-14, -10, 28, 6).rect(-14, 4, 28, 6).fill(ink));
    for (let i = 0; i < 2; i++) { const s = cupArt('little'); s.position.set(40 + i * 46, 30); c.addChild(s); }
    return c;
  }

  private redraw() {
    const shown = this.shownUnits();
    const key = `${this.task}|${this.phase}|${this.commonSize}|${shown.join(',')}|${this.t > (this.plan.mode === 'rows' ? EQUIV : 0) ? 1 : 0}`;
    if (key === this.drawnKey) return;
    this.drawnKey = key;
    const L = this.layout, task = this.current, attr = task.attribute;
    this.board.removeChildren().forEach((c) => c.destroy({ children: true }));
    const measuring = this.phase !== 'tool' && this.phase !== 'wrong';

    if (this.plan.mode === 'common') {
      this.drawPair(task, shown, measuring);
    } else if (this.plan.mode === 'tool') {
      // The friend with the question, the object and (once measured) its units and count.
      const friend = friendHead(FRIENDS[this.task % FRIENDS.length]);
      friend.position.set(L.board.x + 70, L.board.y + L.board.h - 24);
      this.board.addChild(friend);
      const area = { x: L.board.x + 130, y: L.board.y, w: L.board.w - 130, h: L.board.h };
      this.fit(measuring ? this.recordArt(attr, task.quantity, task.records[0], shown[0]) : objectArt(attr), area, 1.3);
      if (measuring && shown[0] === task.records[0].count) this.countBadge(attr, task.records[0], { x: L.board.x + L.board.w - 80, y: L.board.y + 50 });
    } else if (!measuring) {
      const friend = friendHead(FRIENDS[this.task % FRIENDS.length]);
      friend.position.set(L.board.x + 70, L.board.y + L.board.h - 24);
      this.board.addChild(friend);
      this.fit(objectArt(attr, task.quantity * LITTLE.length), { x: L.board.x + 130, y: L.board.y, w: L.board.w - 130, h: L.board.h }, 1.3);
    } else {
      // The strip first (one big is two little), then both friends' records.
      this.fit(this.stripArt(attr), L.strip, 0.9, 8);
      if (this.phase !== 'measure' || this.t >= EQUIV) {
        task.records.forEach((rec, i) => {
          const slot = L.slots[i];
          const friend = friendHead(ROW_FRIENDS[i], 0.22);
          friend.position.set(slot.x + 44, slot.y + slot.h - 10);
          this.board.addChild(friend);
          this.fit(this.recordArt(attr, task.quantity, rec, shown[i]), { x: slot.x + 70, y: slot.y, w: slot.w - 70, h: slot.h }, 1, 14);
          if (shown[i] === rec.count) this.countBadge(attr, rec, { x: slot.x + slot.w - 70, y: slot.y + 38 });
        });
      }
    }

    // The shelf shows only while a tool is wanted; the answer rows only on level 2's answer.
    const shelf = this.phase === 'tool' || this.phase === 'wrong';
    for (const pad of this.toolPads.values()) { pad.visible = shelf; pad.alpha = this.phase === 'wrong' ? 0.7 : 1; }
    const unit = this.phase === 'unit';
    for (const [size, pad] of this.unitPads) {
      pad.visible = unit;
      pad.removeChildren().forEach((c) => c.destroy({ children: true }));
      if (!unit) continue;
      // The same scale for both sizes, so the big unit looks bigger.
      const u = unitArt(attr, size), b = u.getLocalBounds();
      u.scale.set(attr === 'length' ? 0.9 : 1.2);
      u.position.set(-(b.x + b.width / 2) * u.scale.x, -(b.y + b.height / 2) * u.scale.y);
      pad.addChild(padArt(TOOL_PAD.w, TOOL_PAD.h), u);
    }
    const compare = this.plan.mode === 'common' && (this.phase === 'answer' || this.phase === 'sending');
    this.comparePads.forEach((pad, i) => {
      pad.visible = compare;
      pad.removeChildren().forEach((c) => c.destroy({ children: true }));
      if (compare) pad.addChild(padArt(TOOL_PAD.w, TOOL_PAD.h), this.compareFace(i, attr));
    });
    const rows = this.plan.mode === 'rows' && (this.phase === 'answer' || this.phase === 'sending');
    this.answerPads.forEach((pad, i) => {
      pad.visible = rows;
      pad.removeChildren().forEach((c) => c.destroy({ children: true }));
      if (!rows) return;
      const { w, h } = L.answerSize;
      const rec = task.records[i];
      pad.addChild(padArt(w, h));
      const f = friendHead(ROW_FRIENDS[i], 0.2);
      f.position.set(-w / 2 + 50, h / 2 - 6);
      pad.addChild(f);
      const n = label(String(rec.count), 40);
      n.x = 10;
      const u = unitArt(attr, rec.unit.size);
      const ub = u.getLocalBounds();
      u.position.set(w / 2 - 70 - (ub.x + ub.width / 2), -(ub.y + ub.height / 2));
      pad.addChild(n, u);
      pad.hitArea = new Rectangle(-w / 2, -h / 2, w, h);
    });
    this.sendButton.visible = this.phase === 'send';
  }

  /**
   * Level 3's board: each object with its friend and the count it was first measured with, kept in view; once a common
   * unit is chosen, the object shows those units and their count beside the first one.
   */
  private drawPair(task: Task, shown: number[], measuring: boolean) {
    const L = this.layout, attr = task.attribute;
    const records = this.shownRecords();
    const raw = this.commonSize === null && measuring;
    const areas = L.pair.map((box) => ({ x: box.x + 70, y: box.y + 70, w: box.w - 80, h: box.h - 76 }));
    const arts = task.objects!.map((o, i) => measuring ? this.recordArt(attr, o.quantity, records[i], shown[i]) : objectArt(attr, o.quantity * LITTLE.length));
    // One scale for both, so a longer ribbon looks longer.
    const scale = Math.min(...arts.map((a, i) => this.fitScale(a, areas[i], 1, 10)));
    task.objects!.forEach((_, i) => {
      const box = L.pair[i];
      const friend = friendHead(ROW_FRIENDS[i], 0.24);
      friend.position.set(box.x + 44, box.y + box.h - 14);
      this.board.addChild(friend);
      const rec = records[i];
      this.fit(arts[i], areas[i], 1, 10, scale);
      // The first record stays; the common-unit count sits beside it once those units are all laid.
      const first = { x: box.x + 80, y: box.y + 40 };
      if (measuring && (!raw || shown[i] === rec.count)) this.countBadge(attr, task.records[i], first, this.commonSize !== null);
      const fits = this.commonSize !== null && remeasure(task, this.commonSize)[i] !== null;
      if (fits && this.phase !== 'remeasure') this.countBadge(attr, rec, { x: first.x + 140, y: first.y });
    });
  }

  /** A comparison pad's face: the left friend, "the same" (two equal bars), or the right friend. */
  private compareFace(i: number, attr: Attribute): Container {
    const c = new Container();
    if (i === 1) {
      c.addChild(new Graphics().roundRect(-30, -18, 60, 12, 6).roundRect(-30, 6, 60, 12, 6).fill(ink));
      return c;
    }
    const f = friendHead(ROW_FRIENDS[i === 0 ? 0 : 1], 0.2);
    f.position.set(-30, 40);
    const o = objectArt(attr, attr === 'length' ? 100 : undefined);
    const b = o.getLocalBounds();
    const sc = Math.min(0.5, 60 / Math.max(b.width, b.height));
    o.scale.set(sc);
    o.position.set(30 - (b.x + b.width / 2) * sc, -(b.y + b.height / 2) * sc);
    c.addChild(f, o);
    return c;
  }

  // ---- Game ----

  start() {
    this.started = true;
    this.redraw();
    void this.ctx.instruct(`measure.instruct.${this.plan.level}` as LineId).then(() => this.alive && this.askQuestion());
  }

  update(dt: number) {
    this.clock += dt;
    if (this.started && (this.phase === 'measure' || this.phase === 'remeasure')) {
      const before = this.t;
      this.t += dt;
      if (this.plan.mode === 'rows' && before < EQUIV && this.t >= 0.2 && before < 0.2) void this.ctx.say(`measure.equal.${this.current.attribute}` as LineId);
      if (this.t >= this.measureLength()) this.measured();
      else { if (this.shownUnits(this.t).join() !== this.shownUnits(before).join()) sfx.tick(); this.redraw(); }
    }
    const g = this.glow.clear();
    const at = this.glowAt ?? this.offerAt;
    if (at) {
      g.roundRect(at.p.x - at.w / 2 - 10, at.p.y - at.h / 2 - 10, at.w + 20, at.h + 20, 26)
        .stroke({ width: 8, color: swatch.yellow.line, alpha: 0.6 + 0.4 * Math.sin(this.clock * 4) });
    }
  }

  resize(v: View) {
    this.layout = layoutFor(v);
    const L = this.layout;
    this.background.clear().rect(0, 0, v.w, v.h).fill(0xf3efe2);
    this.background.roundRect(L.board.x, L.board.y, L.board.w, L.board.h, 32).fill(0xfffdf6).stroke({ width: 4, color: swatch.brown.light });
    TOOLS.forEach((tool, i) => this.toolPads.get(tool)!.position.copyFrom(L.tools[i]));
    this.answerPads.forEach((pad, i) => pad.position.copyFrom(L.answers[i]));
    SIZES.forEach((size, i) => this.unitPads.get(size)!.position.copyFrom(L.units[i]));
    this.comparePads.forEach((pad, i) => pad.position.copyFrom(L.tools[i]));
    this.helpButton.position.copyFrom(L.help);
    this.replayButton.position.copyFrom(L.replay);
    this.sendButton.position.copyFrom(L.send);
    // A glow keeps its control; positions move with the layout.
    if (this.glowAt) this.glowUseful(this.step ?? 'send');
    if (this.offerAt) this.offerAt = { p: L.units[1], ...TOOL_PAD };
    this.drawnKey = '';
    this.redraw();
  }

  /**
   * The ghost finger: tap the tool that answers the question, then Send, or the row with the asked-for units, or (level
   * 3) the little units for both and then the longer, heavier or fuller one, or the same.
   */
  autotouch(): TouchIntent | null {
    if (!this.started) return null;
    if (this.phase === 'tool') return { tap: { on: this.toolPads.get(TOOL_FOR[this.current.attribute])! } };
    if (this.phase === 'send') return { tap: { on: this.sendButton } };
    if (this.phase === 'unit') return { tap: { on: this.unitPads.get('little')! } };
    if (this.phase === 'answer' && this.plan.mode === 'common') return { tap: { on: this.comparePads[compareAnswer(this.current, this.commonSize!)] } };
    if (this.phase === 'answer') return { tap: { on: this.answerPads[answerRow(this.current)] } };
    return null;
  }

  destroy() {
    this.alive = false;
  }
}

export const measuringPost: GameModule = {
  id: 'measuring-post',
  name: 'Measuring Post',
  titleLine: 'game.measuring-post',
  region: 'tinker-lab',
  challenge: 'numbers',
  skills: ['measurement', 'choose-a-tool', 'unit-size'],
  bands: ['school'],
  levels: (band) => rangeFor(LEVELS, band),
  describeLevel: (level) => planFor(level).name,
  music: STYLES.quiet,
  touchDemo: true,
  coplayHint: 'Take turns: one of you asks a friend\'s question, the other runs the counter and picks the tool, then swap.',
  hubIcon: () => new WigglyIcon(hubArt()),
  sticker: (seed) => stickerArt(seed),
  create: (ctx) => new MeasuringPost(ctx),
};
