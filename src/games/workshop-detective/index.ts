import { Container, Graphics, Rectangle, type Text } from 'pixi.js';
import { cream, ink, swatch, wood } from '../../art/palette';
import { STYLES } from '../../audio/music';
import { sfx } from '../../audio/sfx';
import type { LineId } from '../../content/voice-script';
import { onTap } from '../../engine/input';
import type { View } from '../../engine/view';
import { missOnRequest, hinted, newRequestTally, tally } from '../../progress/coach';
import { rangeFor } from '../../progress/difficulty';
import { label } from '../../ui/text';
import { WigglyIcon } from '../shared';
import type { Game, GameContext, GameModule, TouchIntent } from '../types';
import { benchLayout, type Box } from './layout';
import {
  LEVELS,
  LINE,
  NO_MARKS,
  OPENING,
  PAIRS,
  check,
  describeLevel,
  drawLook,
  hintFor,
  hintWords,
  lampFor,
  leverName,
  missKey,
  predicts,
  recordLines,
  recordState,
  rightMarks,
  sameSetup,
  toggle,
  tryOn,
  verdictWords,
  type Hint,
  type Look,
  type Mark,
  type Marks,
  type Note,
  type Setup,
} from './logic';

/** Every line id the round speaks is in `voice.ts`; `voice.test.ts` checks each one the case can produce. */
const line = (id: string) => id as LineId;

type Symbol = (typeof PAIRS)[keyof typeof PAIRS][number];

/** A carved lever picture about 40 units across at scale 1, centred on (x, y). */
function carve(g: Graphics, kind: Symbol, x: number, y: number, s: number) {
  const c = swatch.brown;
  if (kind === 'shell') {
    g.moveTo(x - 18 * s, y + 8 * s)
      .arc(x, y + 8 * s, 18 * s, Math.PI, 0)
      .closePath()
      .fill(swatch.peach.fill)
      .stroke({ color: c.line, width: 2.5 * s });
    for (const a of [-0.6, -0.2, 0.2, 0.6])
      g.moveTo(x, y + 12 * s)
        .lineTo(x + Math.sin(a) * 16 * s, y + 8 * s - Math.cos(a) * 16 * s)
        .stroke({ color: c.line, width: 2 * s });
    g.roundRect(x - 5 * s, y + 8 * s, 10 * s, 7 * s, 2 * s).fill(c.line);
  } else if (kind === 'feather') {
    g.ellipse(x, y, 8 * s, 20 * s)
      .fill(swatch.white.fill)
      .stroke({ color: c.line, width: 2.5 * s });
    g.moveTo(x, y + 24 * s)
      .lineTo(x, y - 18 * s)
      .stroke({ color: c.line, width: 2 * s });
    for (const k of [-10, -2, 6]) {
      g.moveTo(x, y + k * s)
        .lineTo(x - 7 * s, y + (k - 5) * s)
        .stroke({ color: c.line, width: 1.5 * s });
      g.moveTo(x, y + k * s)
        .lineTo(x + 7 * s, y + (k - 5) * s)
        .stroke({ color: c.line, width: 1.5 * s });
    }
  } else if (kind === 'star') {
    g.star(x, y, 5, 19 * s, 8 * s)
      .fill(swatch.yellow.fill)
      .stroke({ color: c.line, width: 2.5 * s });
  } else {
    g.circle(x, y, 17 * s)
      .fill(swatch.lavender.fill)
      .stroke({ color: c.line, width: 2.5 * s });
    g.circle(x + 9 * s, y - 5 * s, 14 * s).fill(swatch.white.light);
  }
}

/** A lamp of height about 120 × s, centred on (x, y): bright with rays, dim without, or a question mark before a try. */
function drawLamp(g: Graphics, x: number, y: number, s: number, shade: number, light: boolean | null) {
  if (light) {
    g.circle(x, y + 6 * s, 52 * s).fill({ color: swatch.yellow.light, alpha: 0.9 });
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      g.moveTo(x + Math.cos(a) * 44 * s, y + 6 * s + Math.sin(a) * 44 * s)
        .lineTo(x + Math.cos(a) * 60 * s, y + 6 * s + Math.sin(a) * 60 * s)
        .stroke({ color: swatch.yellow.line, width: 5 * s, cap: 'round' });
    }
  }
  const glass = light ? swatch.yellow : swatch.white;
  g.circle(x, y + 8 * s, 24 * s)
    .fill(light === false ? swatch.white.light : glass.fill)
    .stroke({ color: light === false ? swatch.white.line : glass.line, width: 3 * s });
  // The shade above the glass, in the round's colour.
  g.poly([x - 38 * s, y - 6 * s, x + 38 * s, y - 6 * s, x + 18 * s, y - 40 * s, x - 18 * s, y - 40 * s])
    .fill(shade)
    .stroke({ color: wood.line, width: 3 * s });
  g.roundRect(x - 22 * s, y + 34 * s, 44 * s, 12 * s, 4 * s).fill(wood.line);
}

function icon() {
  const g = new Graphics();
  g.roundRect(-54, 30, 108, 14, 6).fill(wood.fill);
  drawLamp(g, 0, -6, 0.7, swatch.teal.fill, true);
  for (const side of [-1, 1]) {
    g.moveTo(side * 40, 30)
      .lineTo(side * 48, 2)
      .stroke({ color: wood.line, width: 5, cap: 'round' });
    g.circle(side * 48, 0, 6).fill(swatch.brown.fill);
  }
  g.circle(30, -26, 13).stroke({ color: ink, width: 4 });
  g.moveTo(39, -17).lineTo(50, -6).stroke({ color: ink, width: 5, cap: 'round' });
  return new Container().addChild(g);
}

function button(root: Container, run: () => void, size = 26) {
  const node = new Container();
  const panel = new Graphics();
  const text = label('', size);
  panel.eventMode = text.eventMode = 'none';
  node.addChild(panel, text);
  onTap(node, run);
  root.addChild(node);
  return { node, panel, text };
}

type Button = ReturnType<typeof button>;

function place({ node }: Button, { x, y, w, h }: Box) {
  node.position.set(x, y);
  node.hitArea = new Rectangle(-w / 2, -h / 2, w, h);
}

function frame(
  b: Button,
  { w, h }: Box,
  color: { fill: number; line: number; light: number },
  strong = false,
) {
  b.panel
    .clear()
    .roundRect(-w / 2 + 3, -h / 2 + 3, w - 6, h - 6, 18)
    .fill(color.light)
    .stroke({ color: color.line, width: strong ? 6 : 3 });
}

/** A small up or down arrow beside a lever picture. */
function arrow(g: Graphics, x: number, y: number, s: number, up: boolean) {
  const d = up ? -1 : 1;
  g.poly([x - 8 * s, y + 2 * d * s, x + 8 * s, y + 2 * d * s, x, y + 12 * d * s]).fill(ink);
  g.rect(x - 3 * s, Math.min(y - 10 * d * s, y + 2 * d * s), 6 * s, 12 * s).fill(ink);
}

class Round implements Game {
  private readonly root = new Container();
  private readonly backdrop = new Graphics();
  private readonly lamp: Button;
  private readonly levers: Button[];
  private readonly tryButton: Button;
  private readonly status = label('', 24);
  private readonly cards: Button[];
  private readonly notes: (Button & { name: Text })[];
  private readonly toggles: Button[][];
  private readonly helpButton: Button;
  private readonly checkButton: Button;
  private readonly look: Look;
  private readonly counts = newRequestTally();
  private readonly rejected = new Set<string>();
  private readonly hintsShown = new Set<number>();
  private records: Setup[] = [...OPENING];
  private setting: [0 | 1, 0 | 1] = [0, 0];
  private light: boolean | null = null;
  private marks: Marks = NO_MARKS;
  private opened = false;
  private hint: Hint | null = null;
  private ringNotes = new Set<Note>();
  private ringRecords = new Set<number>();
  private pulse: Note[] = [];
  private lit: number | null = null;
  private latchFlash = false;
  private busy = false;
  /** Bumped by every touch, so a spoken sequence in progress stops when the player acts. */
  private turn = 0;
  private view: View;

  constructor(private readonly ctx: GameContext) {
    this.view = ctx.view;
    this.look = drawLook(ctx.rng);
    this.backdrop.eventMode = this.status.eventMode = 'none';
    this.status.style.wordWrap = true;
    this.root.addChild(this.backdrop, this.status);
    this.lamp = button(this.root, () => this.hearTag());
    this.levers = [0, 1].map((side) => button(this.root, () => this.flip(side)));
    this.tryButton = button(this.root, () => this.tryIt(), 32);
    this.tryButton.text.text = 'Try it';
    this.cards = [0, 1, 2, 3].map((i) => button(this.root, () => this.hearRecord(i)));
    this.notes = [0, 1].map((side) => {
      const b = button(this.root, () => this.hearNote(side));
      const name = label('', 22);
      name.eventMode = 'none';
      b.node.addChild(name);
      return { ...b, name };
    });
    this.toggles = [0, 1].map((side) =>
      (['fits', 'out'] as const).map((mark) => button(this.root, () => this.mark(side, mark), 22)),
    );
    this.helpButton = button(this.root, () => this.askForHint(), 30);
    this.helpButton.text.text = 'Help';
    this.checkButton = button(this.root, () => this.check(), 30);
    this.checkButton.text.text = 'Check';
    ctx.stage.addChild(this.root);
    this.render();
  }

  /** Which note sits on a side: the left lever's note is on the left. */
  private noteAt(side: number): Note {
    return (side === 0) === this.look.pLeft ? 'P' : 'Q';
  }

  private sideOf(note: Note) {
    return this.noteAt(0) === note ? 0 : 1;
  }

  private get setup(): Setup {
    return [this.setting[0], this.setting[1]];
  }

  start() {
    const turn = this.turn;
    void (async () => {
      await this.ctx.say('lamp.new');
      if (!this.ctx.alive || turn !== this.turn) return;
      await this.ctx.say('lamp.tag');
      if (!this.ctx.alive || turn !== this.turn) return;
      await this.ctx.instruct('workshop-detective.start');
    })();
  }

  /** Speaks lines in order; any touch stops the rest. */
  private async sayAll(lines: string[], turn = this.turn) {
    for (const id of lines) {
      if (!this.ctx.alive || turn !== this.turn) return;
      await this.ctx.say(line(id));
    }
  }

  private touched() {
    this.turn++;
    this.pulse = [];
    this.latchFlash = false;
  }

  private clearRings() {
    this.ringNotes.clear();
    this.ringRecords.clear();
    this.hint = null;
  }

  private show(text: string) {
    this.status.text = text;
  }

  private hearTag() {
    if (this.busy) return;
    this.touched();
    this.show('A made-up lamp. It follows its own rule.');
    this.render();
    void this.ctx.say('lamp.tag');
  }

  private hearRecord(i: number) {
    if (this.busy || i >= this.records.length) return;
    this.touched();
    this.lit = i;
    this.render();
    void this.sayAll(recordLines(this.look, this.records[i]));
  }

  private hearNote(side: number) {
    if (this.busy) return;
    this.touched();
    void this.ctx.say(line(LINE.note(this.look.pair, this.noteAt(side))));
  }

  private latched() {
    this.latchFlash = true;
    this.show('Check the notes first.');
    this.render();
    void this.ctx.say('lamp.latched');
    for (const b of this.levers) {
      const node = b.node;
      void this.ctx.tw
        .to(node, { rotation: 0.08 }, { duration: 0.06 })
        .then(() => (this.ctx.alive ? this.ctx.tw.to(node, { rotation: 0 }, { duration: 0.12 }) : undefined));
    }
  }

  /** Flipping a lever is always free; before the opening Check it wiggles its latch instead. */
  private flip(side: number) {
    if (this.busy) return;
    this.touched();
    if (!this.opened) return this.latched();
    const i = this.noteAt(side) === 'P' ? 0 : 1;
    this.setting[i] = this.setting[i] ? 0 : 1;
    this.light = null;
    this.lit = null;
    sfx.pop(this.setting[i] ? 7 : 3);
    this.render();
  }

  /** Try it: the lamp lights as its rule says and the setup becomes a record, or lights its existing card. Free. */
  private tryIt() {
    if (this.busy) return;
    this.touched();
    if (!this.opened) return this.latched();
    const setup = this.setup;
    const bright = lampFor(this.look, setup);
    const result = tryOn(this.records, setup);
    this.records = result.records;
    this.light = bright;
    sfx.bell(bright ? 9 : 4);
    const lines = recordLines(this.look, setup);
    if (result.repeat !== null) {
      this.lit = result.repeat;
      this.show('Same setup, same light. A repeat adds nothing new.');
      lines.push('lamp.repeat');
    } else {
      this.lit = this.records.length - 1;
      if (this.hint?.step === 2) this.clearRings();
      this.show(`Record ${this.records.length}: ${this.setupText(setup)}, ${bright ? 'bright' : 'dim'}.`);
    }
    this.render();
    void this.sayAll(lines);
  }

  private setupText(s: Setup) {
    const [p, q] = PAIRS[this.look.pair];
    return `${p} ${s[0] ? 'up' : 'down'}, ${q} ${s[1] ? 'up' : 'down'}`;
  }

  private mark(side: number, mark: 'fits' | 'out') {
    if (this.busy) return;
    this.touched();
    this.marks = toggle(this.marks, this.noteAt(side), mark);
    sfx.pop(this.marks[this.noteAt(side)] ? 6 : 3);
    this.render();
  }

  private check() {
    if (this.busy) return;
    this.touched();
    const verdict = check(this.look, this.records, this.marks);
    const words = verdictWords(this.look, this.records, verdict);
    this.clearRings();
    this.show(words.caption);
    if (verdict.kind === 'incomplete') {
      this.pulse = verdict.unmarked;
      this.render();
      void this.ctx.say('lamp.mark-both');
      return;
    }
    if (verdict.kind === 'open') {
      this.opened = true;
      sfx.bell(7);
      this.render();
      void this.sayAll(words.lines);
      return;
    }
    if (verdict.kind === 'close') {
      void this.close(words.lines);
      return;
    }
    // A miss: one per distinct wrong mark set within a record state; the same marks again replay it, free.
    const key = missKey(this.records, this.marks);
    const first = !this.rejected.has(key);
    this.rejected.add(key);
    const due = first && missOnRequest(this.counts);
    if (first) sfx.boing();
    if (verdict.kind === 'miss-sofar') {
      this.ringNotes.add(verdict.note);
      this.ringRecords = new Set([0, 1]);
    } else if (verdict.kind === 'miss-both-sofar') {
      this.ringNotes = new Set(['P', 'Q']);
      this.ringRecords = new Set([0, 1]);
    } else if (verdict.kind === 'miss-ruled') {
      this.ringRecords.add(verdict.record);
      this.ringNotes.add(verdict.truth === 'P' ? 'Q' : 'P');
    } else if (verdict.kind === 'miss-true') this.ringNotes.add(verdict.truth);
    this.render();
    const turn = this.turn;
    // The assisted hint is owed once per round: a touch that cuts the explanation short still gets it, for the state
    // she is in now, unless the case is already closing.
    void this.sayAll(words.lines, turn).then(() => {
      if (!due || !this.ctx.alive || this.busy) return;
      this.giveHint(this.turn);
    });
  }

  /** The Help button, and the pause sheet's "show a hint". */
  askForHint() {
    if (this.busy) return;
    this.touched();
    this.giveHint(this.turn);
  }

  private giveHint(turn: number) {
    const hint = hintFor(this.look, this.records, this.marks, this.opened);
    this.clearRings();
    if (!hint) {
      this.show('These marks fit the records. Check them.');
      this.render();
      void this.ctx.say('lamp.marks-fit');
      return;
    }
    // Each hint counts once; asking again with no change replays it, free.
    if (!this.hintsShown.has(hint.step)) {
      this.hintsShown.add(hint.step);
      hinted(this.counts);
    }
    this.hint = hint;
    if (hint.step === 1) this.ringRecords = new Set([0, 1]);
    if (hint.step === 3) {
      this.ringRecords.add(hint.record);
      this.ringNotes.add(hint.out);
    }
    const words = hintWords(this.look, this.records, hint);
    this.show(words.caption);
    this.render();
    void this.sayAll(words.lines, turn);
  }

  private async close(lines: string[]) {
    const { ctx } = this;
    this.busy = true;
    this.light = true;
    this.render();
    sfx.bell(9);
    await this.sayAll(lines);
    if (!ctx.alive) return;
    await ctx.tw.wait(0.3);
    if (ctx.alive) ctx.finish(tally(this.counts));
  }

  private render() {
    const l = benchLayout(this.view);
    const { look } = this;
    const shade = swatch[look.shade].fill;
    this.backdrop.clear().rect(0, 0, this.view.w, this.view.h).fill(cream);
    // The bench under the lamp strip.
    this.backdrop
      .roundRect(l.lamp.x - 260, l.lamp.y + l.lamp.h / 2 - 22, 520, 26, 10)
      .fill(wood.fill)
      .stroke({ color: wood.line, width: 3 });

    // The lamp and its made-up tag.
    place(this.lamp, l.lamp);
    const s = l.lamp.h / 230;
    this.lamp.panel.clear();
    drawLamp(this.lamp.panel, 0, -10 * s, s * 1.15, shade, this.light);
    const tagX = l.lamp.w / 2 - 34;
    const tagY = -l.lamp.h / 2 + 22;
    this.lamp.panel
      .moveTo(14 * s, -48 * s)
      .lineTo(tagX - 12, tagY)
      .stroke({ color: wood.line, width: 2 })
      .roundRect(tagX - 24, tagY - 14, 52, 30, 6)
      .fill(swatch.white.fill)
      .stroke({ color: wood.line, width: 2 })
      .star(tagX - 10, tagY + 1, 6, 9, 6)
      .fill(swatch.white.line);
    this.lamp.text.text = this.light === null ? '?' : '';
    this.lamp.text.style.fontSize = 44;
    this.lamp.text.position.set(0, -2 * s);

    // The levers: angle shows up or down; a latch shows before the opening Check.
    this.levers.forEach((b, side) => {
      const box = l.levers[side];
      const note = this.noteAt(side);
      const up = this.setting[note === 'P' ? 0 : 1] === 1;
      const target =
        this.hint?.step === 2 && this.hint.setup[note === 'P' ? 0 : 1] !== this.setting[note === 'P' ? 0 : 1];
      place(b, box);
      const g = b.panel.clear();
      g.roundRect(-box.w / 2 + 4, -box.h / 2 + 4, box.w - 8, box.h - 8, 18)
        .fill(target ? swatch.yellow.light : swatch.white.light)
        .stroke({ color: target ? swatch.yellow.line : wood.line, width: target ? 6 : 3 });
      const baseY = box.h / 2 - 30;
      const angle = up ? -0.45 : 0.45;
      const len = box.h * 0.55;
      const tipX = Math.sin(angle) * len * 0.3;
      const tipY = baseY - Math.cos(angle) * len * (up ? 1 : 0.35);
      g.roundRect(-30, baseY - 6, 60, 18, 6).fill(wood.line);
      g.moveTo(0, baseY).lineTo(tipX, tipY).stroke({ color: wood.line, width: 9, cap: 'round' });
      g.circle(tipX, tipY, 26).fill(swatch.brown.light).stroke({ color: swatch.brown.line, width: 3 });
      carve(g, leverName(look.pair, note), tipX, tipY, 0.85);
      if (!this.opened) {
        const c = this.latchFlash ? swatch.coral : swatch.white;
        g.roundRect(-22, baseY - 28, 44, 20, 6)
          .fill(c.fill)
          .stroke({ color: c.line, width: 2 });
        g.circle(0, baseY - 18, 4).fill(ink);
      }
      b.text.text = up ? 'up' : 'down';
      b.text.style.fontSize = 20;
      b.text.position.set(0, -box.h / 2 + 18);
    });

    place(this.tryButton, l.tryIt);
    frame(this.tryButton, l.tryIt, this.opened ? swatch.teal : swatch.white, this.hint?.step === 2);
    this.tryButton.node.alpha = this.opened ? 1 : 0.6;

    this.status.position.set(l.status.x, l.status.y);
    this.status.style.wordWrapWidth = l.status.wrap;
    this.status.style.fontSize = l.status.size;

    // The bench: one card per record, left lever first.
    this.cards.forEach((b, i) => {
      const box = l.records[i];
      const s = this.records[i];
      b.node.visible = !!s;
      if (!s) return;
      place(b, box);
      const ringed = this.ringRecords.has(i);
      const color = ringed ? swatch.coral : this.lit === i ? swatch.teal : swatch.white;
      frame(b, box, color, ringed || this.lit === i);
      const g = b.panel;
      const k = Math.min(box.w / 160, box.h / 100);
      const compact = box.w < 120;
      [0, 1].forEach((side) => {
        const note = this.noteAt(side);
        const up = s[note === 'P' ? 0 : 1] === 1;
        const x = compact ? -box.w / 4 + side * (box.w / 2) : -box.w / 2 + 26 + side * 44 * k;
        const y = compact ? -box.h / 2 + 28 : -8;
        carve(g, leverName(look.pair, note), x, y, 0.55 * k);
        arrow(g, x, y + 26 * k, 0.8 * k, up);
      });
      const bright = lampFor(look, s);
      drawLamp(g, compact ? 0 : box.w / 2 - 34 * k, compact ? box.h / 2 - 30 : -4, 0.32 * k, shade, bright);
      b.text.text = `${i + 1}`;
      b.text.style.fontSize = 16;
      b.text.position.set(-box.w / 2 + 12, -box.h / 2 + 14);
      // Hint 1 shows both notes' predictions beside the opening records.
      if (this.hint?.step === 1 && i < 2) b.text.text = `${i + 1} · both say ${bright ? 'bright' : 'dim'}`;
      if (this.hint?.step === 1 && i < 2) b.text.position.set(0, box.h / 2 - 12);
    });

    // The notes: picture rule, name, then the fits and ruled-out toggles.
    this.notes.forEach((b, side) => {
      const note = this.noteAt(side);
      const box = l.notes[side];
      place(b, box);
      const ringed = this.ringNotes.has(note) || this.pulse.includes(note);
      frame(b, box, ringed ? swatch.coral : swatch.peach, ringed);
      const g = b.panel;
      const k = box.h / 100;
      const lever = leverName(look.pair, note);
      carve(g, lever, -box.w / 2 + 40, -8 * k, 0.8 * k);
      arrow(g, -box.w / 2 + 68, -6 * k, 0.9 * k, true);
      g.moveTo(-box.w / 2 + 86, -6 * k)
        .lineTo(-box.w / 2 + 104, -6 * k)
        .stroke({ color: ink, width: 3 });
      drawLamp(g, -box.w / 2 + 132, -6 * k, 0.32 * k, shade, true);
      b.text.text = '';
      b.name.text = `${lever[0].toUpperCase()}${lever.slice(1)} note`;
      b.name.style.fontSize = box.w < 200 ? 18 : 22;
      if (box.w < 200) b.name.position.set(0, box.h / 2 - 18);
      else b.name.position.set(box.w / 2 - 80, 0);
      // A hint 2 forecast for the hinted setup sits on each note.
      if (this.hint?.step === 2) {
        b.name.text += ` says ${predicts(note, this.hint.setup) ? 'bright' : 'dim'}`;
      }

      (['fits', 'out'] as const).forEach((mark: Exclude<Mark, null>, j) => {
        const t = this.toggles[side][j];
        const tb = l.toggles[side][j];
        place(t, tb);
        const on = this.marks[note] === mark;
        const c = on ? (mark === 'fits' ? swatch.green : swatch.red) : swatch.white;
        frame(t, tb, c, on);
        t.text.text = `${mark === 'fits' ? '✓' : '✗'} ${mark === 'fits' ? 'fits' : tb.w < 120 ? 'out' : 'ruled out'}`;
        t.text.style.fontSize = tb.w < 120 ? 20 : 22;
      });
    });

    for (const [b, box, main] of [
      [this.helpButton, l.help, false],
      [this.checkButton, l.check, true],
    ] as const) {
      place(b, box);
      frame(b, box, main ? swatch.teal : swatch.white, main);
      b.node.alpha = this.busy ? 0.55 : 1;
    }
  }

  update() {}

  resize(view: View) {
    this.view = view;
    this.render();
  }

  /** The ghost finger follows the hint walk: marks, Check, levers, Try it, marks, Check. */
  /** Guided first play points at the bot's next move: `autotouch` here only reads the board. */
  showMove(): TouchIntent | null {
    return this.autotouch();
  }

  autotouch(): TouchIntent | null {
    if (this.busy) return null;
    const want = rightMarks(this.look, this.records);
    if (recordState(this.records) === 'undecided' && this.opened) {
      const target = hintFor(this.look, this.records, this.marks, true);
      const setup = target && target.step === 2 ? target.setup : ([1, 0] as Setup);
      if (!sameSetup(this.setup, setup)) {
        const i = this.setting[0] !== setup[0] ? 0 : 1;
        const side = this.sideOf(i === 0 ? 'P' : 'Q');
        return { tap: { on: this.levers[side].node } };
      }
      return { tap: { on: this.tryButton.node } };
    }
    for (const note of ['P', 'Q'] as Note[])
      if (this.marks[note] !== want[note]) {
        const side = this.sideOf(note);
        return { tap: { on: this.toggles[side][want[note] === 'fits' ? 0 : 1].node } };
      }
    return { tap: { on: this.checkButton.node } };
  }

  destroy() {
    this.root.destroy({ children: true });
  }
}

export const game: GameModule = {
  id: 'workshop-detective',
  name: 'Workshop Detective',
  titleLine: 'game.workshop-detective',
  region: 'tinker-lab',
  challenge: 'logic',
  skills: [
    'deciding what two records can show',
    'choosing a test that tells two explanations apart',
    'claiming only what the records support',
  ],
  bands: ['grownup'],
  levels: (band) => rangeFor(LEVELS, band),
  describeLevel,
  music: STYLES.quiet,
  hubIcon: () => new WigglyIcon(icon()),
  sticker: icon,
  upright: true,
  touchDemo: true,
  create: (ctx) => new Round(ctx),
};
