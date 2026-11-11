/**
 * Festival Signals and Fix the lantern (Sorting Machine levels 8–9): build a four-part machine that lights the festival
 * lantern for a friend with just one badge, test it on any friend, then Check it on all four. The overview shows the whole
 * machine; tapping a slot opens its inspector under it. Rules: ./flat.ts; definition: docs/definitions/festival-signals.md.
 */
import { Container, Graphics, Rectangle } from 'pixi.js';
import type { Critter } from '../../art/critter';
import { cream, swatch, wood } from '../../art/palette';
import { Backdrop } from '../../art/scenery';
import { sfx } from '../../audio/sfx';
import type { LineId } from '../../content/voice-script';
import { onTap } from '../../engine/input';
import { ease } from '../../engine/tween';
import type { View } from '../../engine/view';
import { finish, RoundButton } from '../../ui/buttons';
import { arrowIcon, checkIcon } from '../../ui/icons';
import type { Game, GameContext, TouchIntent } from '../types';
import { cardArt, failBadge, fixtureCritter, METAL, sendArt, slotFrame, turtleArt, valueToken } from './art';
import { buntingArt, clearArt, lanternArt, numberBadge, partTile, sourceChip } from './festival-art';
import {
  applyFix,
  arity,
  checkFlat,
  firstDifference,
  firstEmpty,
  flatBrief,
  flatLayout,
  helpFlat,
  LANES,
  nextFlatMove,
  PART_OPS,
  read,
  rowKey,
  setInput,
  setOut,
  setPart,
  sourcesFor,
  wantedFlat,
  type Flat,
  type FlatBrief,
  type FlatLayout,
  type PartOp,
  type Reading,
  type Selection,
  type Src,
} from './flat';
import { centre, Tally, type Pt, type Rect, type Value } from './logic';

const CRITTER_SCALE = 0.35;
/** Seconds each stage of a run takes: the sensors, each slot on the lantern's path, the lantern. */
const STAGE = 0.45;
/** A part's picture on an inspector button. */
const PICK_ART = 92;
const WIRE = { width: 4, color: METAL.line, cap: 'round' as const, join: 'round' as const };

type Stage = 'sources' | 'lantern' | number;

interface Run {
  fixture: number;
  reading: Reading;
  stages: Stage[];
  at: number;
  t: number;
  /** Slow: the run rests here until Send is tapped again. */
  waiting: boolean;
}

export class FestivalSignals implements Game {
  readonly brief: FlatBrief;
  readonly tally = new Tally();
  machine: Flat;
  private history: Flat[] = [];
  /** Per fixture: sent at least once this round. */
  sent: boolean[];
  /** Per fixture: what the lantern last did for it, or null. */
  results: (boolean | null)[];
  /** Fixtures a failed Check marked. */
  failing = new Set<number>();
  /** The friend on stage. */
  friend: number | null = null;
  /** What the inspector is open on. */
  selection: Selection = null;
  /** A friend has been sent since the machine last changed. */
  tested = false;
  /** The fixture whose settled reading the tiles show. */
  private shown: number | null = null;
  slow = false;
  busy = false;
  finished = false;
  run: Run | null = null;
  private alive = true;
  private epoch = 0;
  private clock = 0;
  private view: View;
  private relayout = false;
  layoutNow: FlatLayout | null = null;

  private readonly backdrop: Backdrop;
  private readonly board = new Container();
  private readonly glow = new Graphics();
  cardNodes: Container[] = [];
  critters: Critter[] = [];
  private marks: Container[] = [];
  private badges: Container[] = [];
  slotNodes: Container[] = [];
  lanternNode: Container | null = null;
  /** The inspector's part row: AND, OR, NOT, Clear. */
  partNodes: Container[] = [];
  /** The inspector's input rows, a then b. */
  inputNodes: [Container[], Container[]] = [[], []];
  /** The lantern's inspector: one button per slot. */
  wireNodes: Container[] = [];
  private sourceTokens: Container[] = [];
  private slotTokens: Container[] = [];
  private lanternArtAt: Container | null = null;
  sendButton: Container | null = null;
  checkButton: RoundButton | null = null;
  undoButton: RoundButton | null = null;
  slowButton: Container | null = null;

  constructor(private readonly ctx: GameContext) {
    this.view = ctx.view;
    this.brief = flatBrief(ctx.level, ctx.rng);
    this.machine = this.brief.machine;
    this.sent = this.brief.fixtures.map(() => false);
    this.results = this.brief.fixtures.map(() => null);
    this.backdrop = new Backdrop(
      {
        sky: [0xc8f0ec, 0xfff6e0],
        hills: [0xa9e0d6, 0xc5e7a8],
        horizon: 0.5,
        clouds: 2,
        sun: true,
        seed: 191,
      },
      ctx.view,
    );
    this.glow.eventMode = 'none';
    ctx.stage.addChild(this.backdrop, this.board);
  }

  get level() {
    return this.brief.level;
  }

  private get pair() {
    return this.brief.props.join('-');
  }

  start() {
    this.build();
    void this.ctx.instruct(`sm.fs.instruct.${this.level}.${this.pair}` as LineId);
  }

  destroy() {
    this.alive = false;
  }

  resize(v: View) {
    this.view = v;
    this.backdrop.resize(v);
    if (!this.layoutNow && !this.cardNodes.length) return;
    if (this.busy || this.finished) {
      this.relayout = true;
      return;
    }
    this.build();
  }

  private get locked() {
    return this.finished || this.busy || this.run !== null;
  }

  // ——— Drawing ———

  /** Every node of the board, from the model and the layout. */
  private build() {
    this.epoch++;
    this.relayout = false;
    this.run = null;
    for (const c of this.critters) this.ctx.untrack(c);
    this.cardNodes = [];
    this.critters = [];
    this.marks = [];
    this.badges = [];
    this.slotNodes = [];
    this.partNodes = [];
    this.inputNodes = [[], []];
    this.wireNodes = [];
    this.sourceTokens = [];
    this.slotTokens = [];
    this.lanternNode = this.lanternArtAt = null;
    this.sendButton = this.checkButton = this.undoButton = this.slowButton = null;
    this.glow.removeFromParent();
    for (const c of this.board.removeChildren()) c.destroy({ children: true });
    if (this.finished) return;
    const l = flatLayout(this.view);
    this.layoutNow = l;
    if (!l) return;

    if (!l.wide && l.fixtures[0].y >= 110) {
      const bunting = buntingArt(this.view.w - 170);
      bunting.position.set(150, 24);
      this.board.addChild(bunting);
    }
    this.drawOverview(l);
    this.drawInspector(l);

    // The friends: a card each, the critter standing on it, the sign's lantern and the last result beneath.
    this.brief.fixtures.forEach((_f, i) => {
      const r = l.fixtures[i];
      const c = centre(r);
      const card = new Container();
      card.addChild(cardArt(r.w, r.h, this.friend === i));
      card.position.set(c.x, c.y);
      card.hitArea = new Rectangle(-r.w / 2, -r.h / 2, r.w, r.h);
      onTap(card, () => this.select(i), { cooldown: 200 });
      this.board.addChild(card);
      this.cardNodes.push(card);
      const badge = failBadge();
      badge.eventMode = 'none';
      badge.position.set(c.x - r.w / 2 + 18, c.y - r.h / 2 + 18);
      this.board.addChild(badge);
      this.badges.push(badge);
    });
    const critterLayer = new Container();
    critterLayer.eventMode = 'none';
    this.board.addChild(critterLayer);
    this.brief.fixtures.forEach((f, i) => {
      const critter = fixtureCritter(f, this.brief.props);
      critter.scale.set(CRITTER_SCALE);
      const r = l.fixtures[i];
      critter.position.set(r.x + r.w / 2 - 22, r.y + r.h - 30);
      critterLayer.addChild(this.ctx.track(critter));
      this.critters.push(critter);
      // Beside the friend: the lantern the sign wants (on its little board), and under it what the lantern last did.
      const marks = new Container();
      marks.eventMode = 'none';
      marks.position.set(r.x + r.w - 26, r.y + r.h / 2);
      this.board.addChild(marks);
      this.marks.push(marks);
    });

    // Controls.
    const send = new Container();
    send.addChild(finish({ w: l.send.w, h: l.send.h, corner: 30 }, swatch.blue), sendArt());
    send.position.copyFrom(centre(l.send));
    send.hitArea = new Rectangle(-l.send.w / 2 - 6, -l.send.h / 2 - 6, l.send.w + 12, l.send.h + 12);
    onTap(send, () => this.send(), { cooldown: 250 });
    this.board.addChild(send);
    this.sendButton = send;
    this.checkButton = new RoundButton(checkIcon(), swatch.green, l.check.w / 2, () => this.check());
    this.checkButton.position.copyFrom(centre(l.check));
    this.undoButton = new RoundButton(arrowIcon(-1), swatch.yellow, l.undo.w / 2, () => this.undo());
    this.undoButton.position.copyFrom(centre(l.undo));
    const slow = new Container();
    slow.position.copyFrom(centre(l.slow));
    slow.hitArea = new Rectangle(-l.slow.w / 2, -l.slow.h / 2, l.slow.w, l.slow.h);
    onTap(slow, () => this.toggleSlow(), { cooldown: 250 });
    this.slowButton = slow;
    this.board.addChild(this.checkButton, this.undoButton, slow, this.glow);
    this.drawSlow();
    this.redraw();
    if (this.shown !== null) this.reveal(this.reading(this.shown), 'all');
  }

  private reading(fixture: number): Reading {
    const f = this.brief.fixtures[fixture];
    return read(this.machine, f.p, f.q);
  }

  /** Where a signal leaves its source and the lane its wire runs along. */
  private outlet(l: FlatLayout, src: Src): { from: Pt; lane: number } {
    const top = l.slots[0].y;
    if (src === 'P') return { from: { x: l.sources[0].x + l.sources[0].w / 2, y: top }, lane: top - 38 };
    if (src === 'Q') {
      const r = l.sources[1];
      return { from: { x: r.x + r.w / 2, y: r.y + r.h }, lane: r.y + r.h + 8 };
    }
    const r = l.slots[src];
    return { from: { x: r.x + r.w - 20, y: top }, lane: top - 30 + 8 * src };
  }

  /** The machine's picture: the two sensors, four slot tiles, the lantern and the wires between them. */
  private drawOverview(l: FlatLayout) {
    const { onPath } = read(this.machine, 0, 0);
    // A pale panel behind the machine, so its wires and dimmed tiles read over the sky.
    const panel = new Graphics();
    panel.eventMode = 'none';
    const top = l.slots[0].y - LANES.above;
    panel
      .roundRect(
        l.sources[0].x - 12,
        top,
        l.lantern.x + l.lantern.w - l.sources[0].x + 24,
        LANES.above + l.slots[0].h + LANES.below + 6,
        24,
      )
      .fill({ color: 0xffffff, alpha: 0.82 });
    this.board.addChild(panel);
    const wires = new Graphics();
    wires.eventMode = 'none';
    this.machine.slots.forEach((part, i) => {
      if (!part) return;
      const r = l.slots[i];
      const n = arity(part.op);
      [part.a, part.b].slice(0, n).forEach((src, k) => {
        if (src === null) return;
        const x = r.x + r.w / 2 + (n === 1 ? 0 : k ? 22 : -22);
        const o = this.outlet(l, src);
        const below = src === 'Q';
        wires
          .moveTo(o.from.x, o.from.y)
          .lineTo(o.from.x, o.lane)
          .lineTo(x, o.lane)
          .lineTo(x, below ? r.y + r.h : r.y)
          .stroke({
            ...WIRE,
            ...(this.selection === i ? { color: swatch.blue.line, width: 5 } : {}),
            alpha: onPath[i] ? 1 : 0.35,
          });
      });
    });
    // The lantern's wire: from its slot, under the tiles, up into the lantern.
    const from = l.slots[this.machine.out];
    const lc = centre(l.lantern);
    const lane = from.y + from.h + 16;
    wires
      .moveTo(from.x + from.w / 2 + 34, from.y + from.h)
      .lineTo(from.x + from.w / 2 + 34, lane)
      .lineTo(lc.x, lane)
      .lineTo(lc.x, l.lantern.y + l.lantern.h)
      .stroke({
        ...WIRE,
        color: this.selection === 'lantern' ? swatch.blue.line : swatch.orange.line,
        width: 5,
      });
    this.board.addChild(wires);

    l.sources.forEach((r, k) => {
      const c = centre(r);
      const node = new Container();
      node.eventMode = 'none';
      node.addChild(slotFrame(r.w, false), sourceChip(k ? 'Q' : 'P', this.brief.props, r.w * 0.66));
      node.position.set(c.x, c.y);
      const token = new Container();
      token.eventMode = 'none';
      token.position.set(c.x + r.w / 2 - 6, c.y - r.h / 2 + 6);
      this.board.addChild(node);
      this.sourceTokens.push(token);
    });

    this.machine.slots.forEach((part, i) => {
      const r = l.slots[i];
      const c = centre(r);
      const node = new Container();
      node.addChild(slotFrame(r.w, part === null));
      if (part) {
        const tile = partTile(part.op, 84);
        tile.y = -12;
        node.addChild(tile);
        const n = arity(part.op);
        [part.a, part.b].slice(0, n).forEach((src, k) => {
          const chip = src === null ? valueToken('incomplete', 11) : sourceChip(src, this.brief.props, 26);
          chip.eventMode = 'none';
          chip.position.set(n === 1 ? 0 : k ? 22 : -22, 40);
          node.addChild(chip);
        });
      }
      const number = numberBadge(i + 1);
      number.position.set(-r.w / 2 + 16, -r.h / 2 + 16);
      node.addChild(number);
      if (this.selection === i) {
        const ring = new Graphics();
        ring
          .roundRect(-r.w / 2 - 5, -r.h / 2 - 5, r.w + 10, r.h + 10, 22)
          .stroke({ width: 8, color: swatch.blue.line });
        node.addChild(ring);
      }
      node.alpha = onPath[i] ? 1 : 0.6;
      node.position.set(c.x, c.y);
      node.hitArea = new Rectangle(-r.w / 2, -r.h / 2, r.w, r.h);
      onTap(node, () => this.selectSlot(i), { cooldown: 200 });
      const token = new Container();
      token.eventMode = 'none';
      token.position.set(c.x + r.w / 2 - 14, c.y - r.h / 2 + 14);
      this.board.addChild(node);
      this.slotNodes.push(node);
      this.slotTokens.push(token);
    });

    const lantern = new Container();
    const socket = this.level === 9;
    if (socket) {
      lantern.addChild(finish({ w: l.lantern.w, h: l.lantern.h, corner: 22 }, swatch.white, cream));
      if (this.selection === 'lantern') {
        const ring = new Graphics();
        ring
          .roundRect(-l.lantern.w / 2 - 5, -l.lantern.h / 2 - 5, l.lantern.w + 10, l.lantern.h + 10, 26)
          .stroke({ width: 8, color: swatch.blue.line });
        lantern.addChild(ring);
      }
      lantern.hitArea = new Rectangle(-l.lantern.w / 2, -l.lantern.h / 2, l.lantern.w, l.lantern.h);
      onTap(lantern, () => this.selectLantern(), { cooldown: 200 });
    } else {
      lantern.eventMode = 'none';
    }
    const art = new Container();
    art.eventMode = 'none';
    art.addChild(lanternArt(null, 96));
    lantern.addChild(art);
    lantern.position.copyFrom(lc);
    this.board.addChild(lantern, ...this.sourceTokens, ...this.slotTokens);
    this.lanternNode = lantern;
    this.lanternArtAt = art;
  }

  /** One inspector button: a plate with its picture, lit when it is the current choice. */
  private pickButton(r: Rect, picture: Container, on: boolean, tap: () => void): Container {
    const n = new Container();
    n.addChild(
      finish(
        { w: r.w, h: r.h, corner: 22 },
        on ? swatch.green : swatch.white,
        on ? swatch.green.light : cream,
      ),
      picture,
    );
    n.position.copyFrom(centre(r));
    n.hitArea = new Rectangle(-r.w / 2, -r.h / 2, r.w, r.h);
    onTap(n, tap, { cooldown: 200 });
    this.board.addChild(n);
    return n;
  }

  /** The selected slot's part row and one row per input, or the lantern's row of slots. Nothing is selected: nothing shows. */
  private drawInspector(l: FlatLayout) {
    const sel = this.selection;
    if (sel === null) return;
    if (sel === 'lantern') {
      this.wireNodes = l.parts.map((r, k) =>
        this.pickButton(r, numberBadge(k + 1, 30), this.machine.out === k, () => this.pickWire(k)),
      );
      return;
    }
    const part = this.machine.slots[sel];
    this.partNodes = [
      ...PART_OPS.map((op, k) =>
        this.pickButton(l.parts[k], partTile(op, PICK_ART), part?.op === op, () => this.pickPart(op)),
      ),
      this.pickButton(l.parts[3], clearArt(PICK_ART), false, () => this.pickPart(null)),
    ];
    if (!part) return;
    const srcs = sourcesFor(sel);
    const rows: ('a' | 'b')[] = arity(part.op) === 1 ? ['a'] : ['a', 'b'];
    rows.forEach((which, k) => {
      // Fewer than five choices sit centred under the part row.
      const shift = ((5 - srcs.length) * (l.inputs[k][1].x - l.inputs[k][0].x)) / 2;
      this.inputNodes[k] = srcs.map((src, j) =>
        this.pickButton(
          { ...l.inputs[k][j], x: l.inputs[k][j].x + shift },
          sourceChip(src, this.brief.props, typeof src === 'number' ? 72 : 76),
          part[which] === src,
          () => this.pickInput(which, src),
        ),
      );
    });
  }

  /** The marks under every card and the cards' lit state, from the model. */
  private redraw() {
    const l = this.layoutNow;
    if (!l) return;
    this.brief.fixtures.forEach((f, i) => {
      const m = this.marks[i];
      for (const c of m.removeChildren()) c.destroy();
      const board = new Graphics();
      board.roundRect(-21, -66, 42, 58, 10).fill(wood.fill).stroke({ width: 3, color: wood.line });
      const target = lanternArt(wantedFlat(f), 44);
      target.position.set(0, -37);
      m.addChild(board, target);
      const r = this.results[i];
      if (r !== null) {
        const mark = lanternArt(r, 50);
        mark.position.set(0, 30);
        m.addChild(mark);
      }
      this.badges[i].visible = this.failing.has(i);
      const card = this.cardNodes[i];
      card.children[0].destroy();
      card.addChildAt(cardArt(l.fixtures[i].w, l.fixtures[i].h, this.friend === i), 0);
    });
  }

  private setToken(holder: Container | undefined, v: Value | null, r: number) {
    if (!holder) return;
    for (const c of holder.removeChildren()) c.destroy();
    if (v !== null) holder.addChild(valueToken(v, r));
  }

  /** Show a reading's tokens: one stage of it, all of it, or (null) none. */
  private reveal(reading: Reading | null, stage: Stage | 'all') {
    if (!reading) {
      this.sourceTokens.forEach((t) => this.setToken(t, null, 13));
      this.slotTokens.forEach((t) => this.setToken(t, null, 15));
      this.setLantern(null);
      return;
    }
    const f = this.brief.fixtures[this.shown ?? this.run?.fixture ?? 0];
    if (stage === 'all' || stage === 'sources') {
      this.setToken(this.sourceTokens[0], f.p === 1, 13);
      this.setToken(this.sourceTokens[1], f.q === 1, 13);
    }
    reading.slots.forEach((v, i) => {
      if (reading.onPath[i] && (stage === 'all' || stage === i)) this.setToken(this.slotTokens[i], v, 15);
    });
    if (stage === 'all' || stage === 'lantern')
      this.setLantern(reading.out === 'incomplete' ? null : reading.out);
  }

  private setLantern(lit: boolean | null) {
    const at = this.lanternArtAt;
    if (!at) return;
    for (const c of at.removeChildren()) c.destroy();
    at.addChild(lanternArt(lit, 96));
  }

  private drawSlow() {
    const b = this.slowButton;
    const l = this.layoutNow;
    if (!b || !l) return;
    for (const c of b.removeChildren()) c.destroy();
    b.addChild(
      finish(
        { w: l.slow.w, h: l.slow.h, corner: 26 },
        this.slow ? swatch.green : swatch.white,
        this.slow ? swatch.green.light : cream,
      ),
      turtleArt(this.slow),
    );
  }

  private toggleSlow() {
    this.slow = !this.slow;
    // Turning Slow off lets a resting run carry on, so nothing looks stuck.
    if (!this.slow && this.run?.waiting) this.run.waiting = false;
    sfx.tick();
    this.drawSlow();
  }

  // ——— Friends and sending ———

  select(i: number) {
    if (this.locked) return;
    this.friend = i;
    this.shown = null;
    this.reveal(null, 'all');
    sfx.pop(6);
    this.critters[i].hop(0.6);
    this.redraw();
  }

  /** Send: run the friend on stage; during a run, step a slow run on, or jump to its settled picture. Never counted. */
  send() {
    if (this.finished) return;
    if (this.run) {
      if (this.run.waiting) {
        this.run.waiting = false;
        sfx.tick();
      } else this.settle();
      return;
    }
    if (this.busy) return;
    if (this.friend === null) {
      void this.ctx.say('sm.pick-friend');
      for (const c of this.critters) c.hop(0.5);
      return;
    }
    this.startRun(this.friend);
  }

  private startRun(i: number) {
    if (this.run || this.finished) return;
    const reading = this.reading(i);
    const stages: Stage[] = ['sources'];
    reading.onPath.forEach((on, k) => {
      if (on) stages.push(k);
    });
    stages.push('lantern');
    this.shown = null;
    this.reveal(null, 'all');
    this.run = { fixture: i, reading, stages, at: -1, t: STAGE, waiting: false };
    this.busy = true;
    this.critters[i].hop(0.7);
  }

  /** The run's picture at its end, at once. */
  private settle() {
    const r = this.run;
    if (!r) return;
    this.reveal(r.reading, 'all');
    this.finishRun(r);
  }

  private finishRun(r: Run) {
    this.run = null;
    this.busy = false;
    this.shown = r.fixture;
    this.sent[r.fixture] = true;
    this.tested = true;
    if (r.reading.out !== 'incomplete') {
      this.results[r.fixture] = r.reading.out;
      if (r.reading.out) this.critters[r.fixture].hop(0.9);
    } else {
      // A gap on the lantern's path: open the first one, so the next tap fills it.
      const gap = firstEmpty(this.machine);
      if (gap !== null) this.selection = gap;
      void this.ctx.say('sm.fs.empty-slot');
      this.build();
      return;
    }
    this.redraw();
    if (this.relayout) this.build();
  }

  /** The run, a stage at a time: the sensors settle, each slot on the path with its note, then the lantern. */
  private stepRun(dt: number) {
    const r = this.run;
    if (!r || r.waiting) return;
    r.t += dt;
    if (r.t < STAGE) return;
    r.t = 0;
    r.at++;
    if (r.at >= r.stages.length) {
      this.finishRun(r);
      return;
    }
    const stage = r.stages[r.at];
    this.reveal(r.reading, stage);
    if (stage === 'sources') sfx.pluck(1);
    else if (stage === 'lantern') {
      if (r.reading.out === true) sfx.sparkle();
      else sfx.pluck(0);
    } else {
      const v = r.reading.slots[stage];
      sfx.pluck(v === true ? 4 + stage : v === false ? 2 : 1);
      const node = this.slotNodes[stage];
      const epoch = this.epoch;
      void this.ctx.tw.to(node.scale, { x: 1.08, y: 1.08 }, { duration: 0.12 }).then(() => {
        if (this.alive && epoch === this.epoch && !node.destroyed) node.scale.set(1);
      });
    }
    if (this.slow && r.at < r.stages.length - 1) r.waiting = true;
  }

  // ——— The slots, the lantern's wire and the inspector ———

  selectSlot(i: number) {
    if (this.locked) return;
    this.selection = this.selection === i ? null : i;
    sfx.pop(8);
    const { onPath } = read(this.machine, 0, 0);
    if (this.selection === i && this.machine.slots[i] && !onPath[i] && firstEmpty(this.machine) === null)
      void this.ctx.say('sm.fs.off-path');
    this.build();
  }

  selectLantern() {
    if (this.locked || this.level !== 9) return;
    this.selection = this.selection === 'lantern' ? null : 'lantern';
    sfx.pop(8);
    this.build();
  }

  /** A change to the machine: Undo can take it back, old badges go and the tiles forget the last reading. */
  private change(next: Flat) {
    if (next === this.machine) return;
    this.history.push(this.machine);
    this.machine = next;
    this.afterChange();
  }

  private afterChange() {
    this.failing.clear();
    this.tested = false;
    this.shown = null;
    this.build();
  }

  pickPart(op: PartOp | null) {
    if (this.locked || typeof this.selection !== 'number') return;
    sfx.tick();
    const had = this.machine.slots[this.selection]?.op ?? null;
    this.change(setPart(this.machine, this.selection, op));
    if (op && op !== had) void this.ctx.say(`sm.fs.part.${op.toLowerCase()}` as LineId);
  }

  pickInput(which: 'a' | 'b', src: Src) {
    if (this.locked || typeof this.selection !== 'number') return;
    sfx.tick();
    this.change(setInput(this.machine, this.selection, which, src));
  }

  pickWire(k: number) {
    if (this.locked || this.selection !== 'lantern') return;
    sfx.tick();
    this.change(setOut(this.machine, k));
  }

  undo() {
    if (this.locked) return;
    const m = this.history.pop();
    if (!m) return;
    this.machine = m;
    sfx.pop(4);
    this.afterChange();
  }

  /** The pause sheet's Start again: the opening machine; Undo can bring hers back. Marks and counts stay. */
  restart() {
    if (this.locked) return;
    this.selection = null;
    this.change(this.brief.machine);
  }

  // ——— Check ———

  check() {
    if (this.locked) return;
    const v = checkFlat(this.machine, this.brief.fixtures);
    if (v.status === 'incomplete') {
      this.selection = v.slot;
      this.build();
      void this.ctx.say('sm.fs.empty-slot');
      void this.pulse(this.slotNodes[v.slot]);
      return;
    }
    if (v.status === 'pass') {
      void this.passed();
      return;
    }
    sfx.boing();
    this.tally.miss();
    this.failing = new Set(v.rows);
    const first = v.rows[0];
    void this.ctx.say(`sm.fs.check-fail.${rowKey(this.brief.fixtures[first])}.${this.pair}` as LineId);
    this.friend = first;
    this.redraw();
    this.startRun(first);
  }

  /** Every friend's lantern matches the sign: the lanterns show, the friends hop, one sticker. */
  private async passed() {
    this.busy = true;
    const epoch = this.epoch;
    this.failing.clear();
    this.results = this.brief.fixtures.map((f) => wantedFlat(f));
    this.redraw();
    this.setLantern(true);
    sfx.tada();
    this.ctx.pet.cheer();
    this.critters.forEach((c) => {
      c.hop(1);
      this.ctx.particles.burst(c.x, c.y - 50, {
        colors: [swatch.yellow.fill, swatch.orange.fill, 0xffffff],
        count: 8,
      });
    });
    await this.ctx.say('sm.fs.check-pass');
    if (!this.alive || epoch !== this.epoch) return;
    this.finished = true;
    this.ctx.finish({ misses: this.tally.misses, hints: this.tally.hints });
  }

  private async pulse(node: Container | undefined) {
    if (!node) return;
    const epoch = this.epoch;
    await this.ctx.tw.to(node.scale, { x: 1.12, y: 1.12 }, { duration: 0.18, ease: ease.outBack });
    if (!this.alive || epoch !== this.epoch || node.destroyed) return;
    await this.ctx.tw.to(node.scale, { x: 1, y: 1 }, { duration: 0.2 });
  }

  // ——— Help ———

  hintLabel = 'Help me';

  /**
   * The pet's Help, one hint a press: first a friend the machine gets wrong (or the first gap on the lantern's path), then
   * one fix a press toward the nearest right machine, keeping her correct slots. A right machine is told to Check.
   */
  askForHint() {
    if (this.locked) return;
    const h = helpFlat(this.machine, this.brief.fixtures, this.tally.help());
    if (h.kind === 'check') {
      void this.ctx.say('sm.fs.help.check');
      void this.pulse(this.checkButton ?? undefined);
    } else if (h.kind === 'select') {
      this.selection = h.slot;
      this.build();
      void this.ctx.say('sm.fs.empty-slot');
    } else if (h.kind === 'run') {
      this.friend = h.fixture;
      this.redraw();
      void this.ctx.say('sm.fs.help.run');
      this.startRun(h.fixture);
    } else {
      this.selection = 'slot' in h.fix ? h.fix.slot : 'lantern';
      this.change(applyFix(this.machine, h.fix));
      void this.ctx.say('sm.fs.help.fixed');
    }
  }

  update(dt: number) {
    this.clock += dt;
    this.stepRun(dt);
    if (this.relayout && !this.busy && !this.finished && !this.run) this.build();
    this.glow.clear();
    const l = this.layoutNow;
    if (!this.tally.glowing || !l || this.finished) return;
    const fix = firstDifference(this.machine);
    if (!fix) return;
    const at = centre('slot' in fix ? l.slots[fix.slot] : l.lantern);
    const r = 74 * (1 + 0.05 * Math.sin(this.clock * 5));
    this.glow.circle(at.x, at.y, r).stroke({ width: 8, color: swatch.yellow.fill });
  }

  /** The ghost finger: the friend with both badges, Send; each slot's part and signals; the lantern's wire; Send; Check. */
  autotouch(): TouchIntent | null {
    if (this.locked || !this.layoutNow) return null;
    const m = nextFlatMove(this.brief, this.machine, {
      friend: this.friend,
      selection: this.selection,
      sent: this.sent,
      tested: this.tested,
    });
    const tap = (on: Container | null | undefined, pause?: number): TouchIntent | null =>
      on ? { tap: { on }, ...(pause ? { pause } : {}) } : null;
    if ('card' in m) return tap(this.cardNodes[m.card], 0.4);
    if ('send' in m) return tap(this.sendButton);
    if ('slot' in m) return tap(this.slotNodes[m.slot], 0.4);
    if ('lantern' in m) return tap(this.lanternNode, 0.4);
    if ('part' in m) return tap(this.partNodes[PART_OPS.indexOf(m.part)]);
    if ('input' in m) {
      const i = this.selection as number;
      return tap(this.inputNodes[m.input === 'a' ? 0 : 1][sourcesFor(i).indexOf(m.src)]);
    }
    if ('wire' in m) return tap(this.wireNodes[m.wire]);
    return tap(this.checkButton);
  }
}
