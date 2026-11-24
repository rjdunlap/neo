import { Container, Graphics, Rectangle } from 'pixi.js';
import { cream, ink, swatch, wood } from '../../art/palette';
import { STYLES } from '../../audio/music';
import { sfx } from '../../audio/sfx';
import type { LineId } from '../../content/voice-script';
import { onTap } from '../../engine/input';
import type { View } from '../../engine/view';
import { rangeFor } from '../../progress/difficulty';
import { label } from '../../ui/text';
import { WigglyIcon } from '../shared';
import type { Game, GameContext, GameModule, TouchIntent } from '../types';
import { outcropLayout, type Box } from './layout';
import {
  LEVELS,
  answer,
  check,
  describeLevel,
  fits,
  hint,
  hintStep,
  look,
  makeRound,
  obsOf,
  predict,
  restart,
  rightAnswer,
  start,
  swap,
  type Card,
  type Contact,
  type Deposit,
  type Event,
  type LookId,
  type Pattern,
  type Reason,
  type Ribbon,
  type State,
  whyNot,
} from './logic';
import { cardLine, hintLine, playLines, previewLine, whyLine, type OutcropLine } from './voice';

const line = (id: OutcropLine) => id as LineId;

/** The five layer colours a round draws three from. */
const LAYER_COLOURS = [swatch.peach, swatch.teal, swatch.yellow, swatch.lavender, swatch.green] as const;
const DARK = { fill: 0x4a4458, line: 0x2b2440 };
const SAND = { fill: 0xf3dca0, line: 0xd9b56a };

interface Look {
  pattern: Record<Deposit, Pattern>;
  colour: Record<Deposit, number>;
  side: 'left' | 'right';
}

/** One layer's pattern drawn into a rectangle (x0, y0, w, h), in its colour. */
function drawPattern(
  g: Graphics,
  p: Pattern,
  x0: number,
  y0: number,
  w: number,
  h: number,
  c: { fill: number; line: number; light: number },
) {
  g.rect(x0, y0, w, h).fill(c.light);
  const s = Math.max(0.5, Math.min(1.2, h / 70));
  const mark = { color: c.line, width: 2.5 * s };
  if (p === 'dotted') {
    for (let y = y0 + 12 * s, row = 0; y < y0 + h - 6 * s; y += 18 * s, row++)
      for (let x = x0 + (row % 2 ? 18 : 9) * s; x < x0 + w - 4 * s; x += 18 * s)
        g.circle(x, y, 3.2 * s).fill(c.line);
  } else if (p === 'striped') {
    for (let y = y0 + 10 * s; y < y0 + h - 4 * s; y += 14 * s)
      g.moveTo(x0 + 3, y)
        .lineTo(x0 + w - 3, y)
        .stroke(mark);
  } else if (p === 'pebbled') {
    let k = 0;
    for (let y = y0 + 12 * s; y < y0 + h - 6 * s; y += 20 * s)
      for (let x = x0 + 12 * s + (k % 3) * 4 * s; x < x0 + w - 8 * s; x += 26 * s, k++)
        g.ellipse(x, y + ((k * 7) % 5) * s, (6 + (k % 3)) * s, 4.5 * s)
          .fill(c.fill)
          .stroke({ color: c.line, width: 1.5 * s });
  } else if (p === 'wavy') {
    for (let y = y0 + 12 * s; y < y0 + h - 6 * s; y += 16 * s) {
      g.moveTo(x0 + 3, y);
      for (let x = x0 + 3; x <= x0 + w - 3; x += 6) g.lineTo(x, y + Math.sin((x - x0) / (8 * s)) * 3.5 * s);
      g.stroke(mark);
    }
  } else {
    const q = 14 * s;
    for (let y = y0 + 3, r = 0; y < y0 + h - q / 2; y += q, r++)
      for (let x = x0 + 3 + (r % 2) * q; x < x0 + w - q / 2; x += 2 * q)
        g.rect(x, y, Math.min(q, x0 + w - 3 - x), Math.min(q, y0 + h - y)).fill(c.fill);
  }
}

/** What a frame shows: the layers bottom to top, how far up the dark rock reaches (in layers), and the sand drift. */
interface Section {
  layers: Deposit[];
  /** Null: no dark rock (yet). 0: a lump on the floor. 1–3: it cuts that many layers. */
  dark: number | null;
  sand: boolean;
  /** Red rings: two layers (the stack is wrong) or the dark rock's contact with a layer. */
  pulse: Reason | null;
}

/** A cross-section in a w × h frame centred on (0, 0). */
function drawSection(g: Graphics, w: number, h: number, look: Look, s: Section) {
  const x0 = -w / 2;
  const y0 = -h / 2;
  g.roundRect(x0, y0, w, h, 16).fill(swatch.blue.light).stroke({ color: wood.line, width: 4 });
  const floor = y0 + h - 10;
  const lh = (h - 70) / 3;
  const inner = { x: x0 + 10, w: w - 20 };
  g.rect(inner.x, floor, inner.w, 6).fill(wood.line);
  const yOf = (i: number) => floor - (i + 1) * lh;
  s.layers.forEach((d, i) => {
    drawPattern(g, look.pattern[d], inner.x, yOf(i), inner.w, lh, LAYER_COLOURS[look.colour[d]]);
    g.circle(inner.x + 18, yOf(i) + lh / 2, 14)
      .fill(swatch.white.fill)
      .stroke({ color: ink, width: 2 });
  });
  const darkX = (look.side === 'left' ? -0.18 : 0.18) * w;
  const darkW = Math.max(34, w * 0.15);
  if (s.dark !== null) {
    const top = s.dark === 0 ? floor - lh * 0.45 : floor - s.dark * lh;
    g.poly([
      darkX - darkW / 2 - 6,
      floor,
      darkX - darkW / 2,
      top + 6,
      darkX - darkW / 2 + 6,
      top,
      darkX + darkW / 2 - 6,
      top,
      darkX + darkW / 2,
      top + 6,
      darkX + darkW / 2 + 6,
      floor,
    ])
      .fill(DARK.fill)
      .stroke({ color: DARK.line, width: 3 });
    // Layers laid after the dark rock lie across its flat top.
    const covered = s.layers.slice(s.dark === 0 ? 0 : s.dark);
    if (covered.length)
      g.moveTo(darkX - darkW / 2 - 4, top)
        .lineTo(darkX + darkW / 2 + 4, top)
        .stroke({ color: DARK.line, width: 3 });
  }
  if (s.sand) {
    const y = floor - 1.5 * lh;
    g.ellipse(darkX, y + 4, darkW * 1.6, lh * 0.75)
      .fill(SAND.fill)
      .stroke({ color: SAND.line, width: 3 });
    for (const [dx, dy] of [
      [-0.6, -0.1],
      [0.3, 0.2],
      [0.8, -0.2],
      [-0.2, 0.35],
    ])
      g.circle(darkX + dx * darkW, y + dy * lh, 2.5).fill(SAND.line);
  }
  if (s.pulse) {
    const ring = { color: swatch.red.fill, width: 6 };
    const p = s.pulse;
    if (p.rule === 'stack') {
      const top = s.layers.indexOf(p.upper);
      const low = s.layers.indexOf(p.lower);
      for (const i of [top, low].filter((i) => i >= 0))
        g.roundRect(inner.x + 2, yOf(i) + 2, inner.w - 4, lh - 4, 8).stroke(ring);
    } else {
      const i = 'ABC'.indexOf(p.layer);
      const y = p.rule === 'cover' ? floor - i * lh : yOf(i) + lh / 2;
      g.circle(darkX, y, Math.max(darkW, lh * 0.55)).stroke(ring);
    }
  }
}

/** A card's picture in a w × h card centred on (0, 0). */
function drawCard(g: Graphics, card: Card, w: number, h: number, look: Look) {
  const k = Math.min(w / 160, h / 144);
  if (card === 'X') {
    g.rect(-55 * k, 18 * k, 110 * k, 26 * k).fill(swatch.brown.light);
    g.poly([-16 * k, 44 * k, -12 * k, -22 * k, 12 * k, -22 * k, 16 * k, 44 * k])
      .fill(DARK.fill)
      .stroke({ color: DARK.line, width: 3 });
    g.poly([-14 * k, -26 * k, 14 * k, -26 * k, 0, -46 * k]).fill(DARK.line);
    return;
  }
  drawPattern(g, look.pattern[card], -55 * k, 0, 110 * k, 40 * k, LAYER_COLOURS[look.colour[card]]);
  g.rect(-55 * k, 0, 110 * k, 40 * k).stroke({ color: ink, width: 2 });
  g.poly([
    -10 * k,
    -36 * k,
    10 * k,
    -36 * k,
    10 * k,
    -20 * k,
    18 * k,
    -20 * k,
    0,
    -6 * k,
    -18 * k,
    -20 * k,
    -10 * k,
    -20 * k,
  ]).fill(ink);
}

/** The lens's close-up: what a look shows. */
function drawLensView(g: Graphics, r: number, kind: LookId, truth: Contact, look: Look) {
  g.circle(0, 0, r + 10)
    .fill(wood.fill)
    .stroke({ color: wood.line, width: 6 });
  g.circle(0, 0, r).fill(swatch.blue.light);
  const band = (d: Deposit, y0: number, h: number) =>
    drawPattern(g, look.pattern[d], -r * 0.85, y0, r * 1.7, h, LAYER_COLOURS[look.colour[d]]);
  if (kind === 'look-top') {
    band('C', -r * 0.1, r * 0.8);
    for (const x of [-0.5, -0.1, 0.35]) g.ellipse(x * r, -r * 0.14, 12, 7).fill(swatch.white.line);
    return;
  }
  const lower: Deposit = kind === 'look-low' ? 'A' : 'B';
  band(lower, -r * 0.4, r * 0.8);
  const reaches = kind === 'look-low' || truth === 'cut';
  const top = reaches ? -r * 0.6 : -r * 0.4;
  if (!reaches) band('A', r * 0.4, r * 0.45);
  g.rect(-r * 0.22, reaches ? top : r * 0.4 - r * 0.5, r * 0.44, reaches ? r * 1.5 : r * 0.5).fill(DARK.fill);
  if (!reaches)
    g.moveTo(-r * 0.3, r * 0.4 - r * 0.5)
      .lineTo(r * 0.3, r * 0.4 - r * 0.5)
      .stroke({ color: DARK.line, width: 4 });
}

function icon() {
  const g = new Graphics();
  const look: Look = {
    pattern: { A: 'dotted', B: 'striped', C: 'pebbled' },
    colour: { A: 0, B: 1, C: 2 },
    side: 'left',
  };
  drawSection(g, 110, 110, look, { layers: ['A', 'B', 'C'], dark: 2, sand: false, pulse: null });
  g.circle(36, -30, 16).fill({ color: swatch.white.fill, alpha: 0.6 }).stroke({ color: ink, width: 4 });
  g.moveTo(47, -19).lineTo(60, -6).stroke({ color: ink, width: 6, cap: 'round' });
  const c = new Container().addChild(g);
  g.position.set(0, -60);
  return c;
}

function button(root: Container, run: () => void, size = 26) {
  const node = new Container();
  const panel = new Graphics();
  const text = label('', size);
  panel.eventMode = text.eventMode = 'none';
  text.style.wordWrap = true;
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

function frame(b: Button, { w, h }: Box, color: { line: number; light: number }, strong = false) {
  b.panel
    .clear()
    .roundRect(-w / 2 + 3, -h / 2 + 3, w - 6, h - 6, 18)
    .fill(color.light)
    .stroke({ color: color.line, width: strong ? 6 : 3 });
}

const LOOK_LABEL: Record<LookId, string> = {
  'look-sand': 'Under the sand',
  'look-low': 'Where it meets A',
  'look-top': 'Top of C',
};

class Round implements Game {
  private readonly root = new Container();
  private readonly backdrop = new Graphics();
  private readonly cliff = new Graphics();
  private readonly story = new Graphics();
  private readonly sign = label('', 19, ink, '500');
  private readonly lens = new Container();
  private readonly lensArt = new Graphics();
  private readonly cards: Button[];
  private readonly play: Button;
  private readonly checkButton: Button;
  private readonly answers: Button[];
  private readonly lookCards: Button[];
  private readonly lookButton: Button;
  private readonly look: Look;
  private s: State;
  private lifted: number | null = null;
  /** How many cards of the current ribbon the story frame shows (0: empty). */
  private built = 0;
  private playing = false;
  private pulse: Reason | null = null;
  /** What glows: card indices (order steps), an answer, or a look card. */
  private glow: { card?: Card; slot?: number; answer?: 'yes' | 'unsure'; look?: LookId } = {};
  private picked: LookId | null = null;
  /** Another order the pet is playing in the story frame (level 1's wrong Not enough to tell); her ribbon stays. */
  private storyRibbon: Ribbon | null = null;
  private lensOpen = false;
  private busy = false;
  /** Bumped by every touch, so speech or a Play in progress stops when the player acts. */
  private turn = 0;
  private view: View;

  constructor(private readonly ctx: GameContext) {
    this.view = ctx.view;
    const round = makeRound(ctx.level, ctx.rng);
    this.look = { pattern: round.pattern, colour: round.colour, side: round.side };
    this.s = start(round);
    this.backdrop.eventMode = this.cliff.eventMode = this.story.eventMode = this.sign.eventMode = 'none';
    this.sign.text = 'Lower is older. Dark rock cuts what was already there.';
    this.sign.style.wordWrap = true;
    this.root.addChild(this.backdrop, this.cliff, this.story, this.sign);
    this.cards = [0, 1, 2, 3].map((i) => button(this.root, () => this.tapCard(i), 22));
    this.play = button(this.root, () => void this.playStory(), 30);
    this.play.text.text = '▶ Play';
    this.checkButton = button(this.root, () => this.check(), 30);
    this.checkButton.text.text = 'Check';
    this.answers = (['yes', 'unsure'] as const).map((a) => button(this.root, () => this.answer(a), 26));
    this.answers[0].text.text = 'Yes, only this story';
    this.answers[1].text.text = 'Not enough to tell';
    this.lookCards = [0, 1, 2].map((i) => button(this.root, () => this.pick(this.s.round.looks[i]), 18));
    this.lookButton = button(this.root, () => this.commitLook(), 30);
    this.lookButton.text.text = 'Look';
    this.lens.addChild(this.lensArt);
    this.lens.visible = false;
    this.lens.eventMode = 'static';
    onTap(this.lens, () => this.closeLens());
    this.root.addChild(this.lens);
    ctx.stage.addChild(this.root);
    this.render();
  }

  start() {
    void this.ctx.instruct(line(this.s.round.level === 1 ? 'outcrop.start.1' : 'outcrop.start.2'));
  }

  private get ribbon(): Ribbon {
    return this.s.ribbon;
  }

  private touched() {
    this.turn++;
    this.pulse = null;
    this.playing = false;
    if (this.storyRibbon) {
      this.storyRibbon = null;
      this.built = 0;
    }
  }

  /** Speaks lines in order; any touch stops the rest. */
  private async sayAll(lines: OutcropLine[], turn = this.turn) {
    for (const id of lines) {
      if (!this.ctx.alive || turn !== this.turn) return false;
      await this.ctx.say(line(id));
    }
    return this.ctx.alive && turn === this.turn;
  }

  private ordering() {
    return this.s.step === 'order' || this.s.step === 'again';
  }

  private tapCard(i: number) {
    if (this.busy) return;
    this.touched();
    const card = this.ribbon[i];
    if (!this.ordering()) {
      this.render();
      void this.ctx.say(line(cardLine(card)));
      return;
    }
    if (this.lifted === null) {
      this.lifted = i;
      sfx.pluck(4);
      this.render();
      void this.ctx.say(line(cardLine(card)));
      return;
    }
    if (this.lifted === i) {
      this.lifted = null;
      sfx.pluck(2);
      this.render();
      return;
    }
    this.s = swap(this.s, this.lifted, i);
    this.lifted = null;
    this.built = 0;
    this.glow = {};
    sfx.marimba(3);
    void this.ctx.tw.wait(0.12).then(() => this.ctx.alive && sfx.marimba(5));
    this.render();
  }

  /** Builds the story's cliff card by card. Free; any touch stops it. */
  private async playStory(turn?: number) {
    if (this.busy && turn === undefined) return;
    if (turn === undefined) {
      this.touched();
      turn = this.turn;
    }
    this.lifted = null;
    this.playing = true;
    const ribbon = this.storyRibbon ?? this.ribbon;
    const lines = playLines(ribbon);
    for (let i = 0; i < 4; i++) {
      if (!this.ctx.alive || turn !== this.turn) return false;
      this.built = i + 1;
      this.render();
      if (ribbon[i] === 'X') sfx.rumble();
      else sfx.marimba([2, 4, 6][i % 3]);
      await this.ctx.say(line(lines[i]));
      if (!this.ctx.alive || turn !== this.turn) return false;
      await this.ctx.tw.wait(0.25);
    }
    this.playing = false;
    return this.ctx.alive && turn === this.turn;
  }

  private apply(r: { state: State; events: Event[] }) {
    this.s = r.state;
    if (r.events.some((e) => e.kind === 'glow')) this.setGlow();
  }

  /** The current step's target glows (after two misses, or a hint). */
  private setGlow() {
    if (this.ordering()) {
      const step = hintStep(this.ribbon, obsOf(this.s));
      this.glow = step ? { card: step.card, slot: step.slot } : {};
    } else if (this.s.step === 'sure') this.glow = { answer: rightAnswer(this.s) };
    else if (this.s.step === 'look') this.glow = { look: 'look-sand' };
  }

  private check() {
    if (this.busy) return;
    this.touched();
    this.lifted = null;
    const r = check(this.s);
    const e = r.events[0];
    this.apply(r);
    if (e.kind === 'fit') {
      sfx.bell(9);
      this.glow = {};
      this.built = 4;
      this.render();
      if (e.last)
        return void this.close(this.s.round.truth === 'cut' ? 'outcrop.close.cut' : 'outcrop.close.covers');
      void this.sayAll([this.s.round.level === 1 ? 'outcrop.fit' : 'outcrop.fit.sand', 'outcrop.sure']);
      return;
    }
    if (e.kind !== 'wrong') return;
    sfx.boing();
    this.pulse = e.reason;
    this.built = 4;
    this.render();
    void this.sayAll([whyLine(e.reason)]);
  }

  private answer(a: 'yes' | 'unsure') {
    if (this.busy) return;
    this.touched();
    const r = answer(this.s, a);
    const e = r.events[0];
    this.apply(r);
    const level = this.s.round.level;
    if (e.kind === 'sure-right') {
      sfx.bell(8);
      this.glow = {};
      this.render();
      if (level === 1) return void this.close('outcrop.sure.right.1');
      void this.sayAll(['outcrop.sure.right.2']);
      return;
    }
    if (e.kind !== 'sure-wrong') return;
    sfx.boing();
    const turn = this.turn;
    if (a === 'yes') {
      // The ribbon is now the other story that fits: play it.
      this.built = 0;
      this.render();
      void this.playStory(turn).then((done) => done && this.sayAll(['outcrop.sure.wrong.2'], turn));
      return;
    }
    // Level 1: the pet plays one other order in the story frame (her ribbon stays) and shows where it breaks.
    const other = e.other;
    if (!other) return;
    this.storyRibbon = other;
    void this.playStory(turn).then(async (done) => {
      if (!done) return;
      this.pulse = whyNot(other, obsOf(this.s));
      this.render();
      await this.sayAll(['outcrop.sure.wrong.1'], turn);
    });
  }

  private pick(id: LookId) {
    if (this.busy || this.s.step !== 'look') return;
    this.touched();
    this.picked = id;
    sfx.pluck(6);
    this.render();
    void this.ctx.say(line(previewLine(id)));
  }

  private commitLook() {
    if (this.busy || this.s.step !== 'look') return;
    this.touched();
    if (!this.picked) {
      this.render();
      void this.ctx.say(line('outcrop.pick-look'));
      return;
    }
    const id = this.picked;
    const r = look(this.s, id);
    const e = r.events[0];
    this.apply(r);
    this.openLens(id);
    if (e.kind === 'look-wrong') {
      sfx.boing();
      this.render();
      void this.sayAll([`outcrop.result.${id as 'look-low' | 'look-top'}`]);
      return;
    }
    if (e.kind !== 'look-sand') return;
    sfx.brush();
    this.picked = null;
    this.glow = {};
    this.built = 0;
    const result: OutcropLine = e.truth === 'cut' ? 'outcrop.result.sand.cut' : 'outcrop.result.sand.covers';
    if (!e.stillFits)
      this.pulse = {
        rule: e.truth === 'cut' ? 'cut' : 'cover',
        layer: 'B',
        first: false,
        last: false,
      } as Reason;
    this.render();
    void this.sayAll([
      result,
      e.stillFits ? 'outcrop.again.fits' : e.truth === 'cut' ? 'outcrop.again.cut' : 'outcrop.again.covers',
    ]);
  }

  private openLens(id: LookId) {
    this.lensOpen = true;
    sfx.bell(12, 0.15);
    const l = outcropLayout(this.view);
    const r = Math.min(150, l.cliff.w / 2 - 6);
    this.lensArt.clear();
    drawLensView(this.lensArt, r, id, this.s.round.truth, this.look);
    this.lensArt.position.set(l.cliff.x, l.cliff.y);
    this.lens.hitArea = new Rectangle(0, 0, this.view.w, this.view.h);
    this.lens.visible = true;
  }

  private closeLens() {
    if (!this.lensOpen) return;
    this.lensOpen = false;
    this.lens.visible = false;
  }

  /** The pause sheet's Show a hint. */
  askForHint() {
    if (this.busy) return;
    this.touched();
    this.lifted = null;
    const step = this.s.step;
    const r = hint(this.s);
    const e = r.events[0];
    this.s = r.state;
    if (e.kind !== 'hint') return;
    if (step === 'order' || step === 'again') {
      if (!e.step) {
        this.render();
        void this.ctx.say(line('outcrop.hint.fits'));
        return;
      }
      this.built = 0;
      this.glow = { card: e.step.card, slot: e.step.slot };
      sfx.marimba(5);
      this.render();
      void this.sayAll([hintLine(e.step, this.s.record, this.s.round.truth)]);
      return;
    }
    this.setGlow();
    this.render();
    if (step === 'sure')
      void this.sayAll([this.s.round.level === 1 ? 'outcrop.hint.sure.1' : 'outcrop.hint.sure.2']);
    else void this.sayAll(['outcrop.hint.look']);
  }

  restart() {
    if (this.busy) return;
    this.touched();
    this.s = restart(this.s);
    this.lifted = null;
    this.built = 0;
    this.glow = {};
    this.picked = null;
    this.closeLens();
    this.render();
  }

  private async close(last: OutcropLine) {
    const { ctx } = this;
    this.busy = true;
    this.closeLens();
    this.render();
    const turn = this.turn;
    await this.sayAll(
      [last, ...(this.s.round.level === 1 && last !== 'outcrop.close.1' ? ['outcrop.close.1' as const] : [])],
      turn,
    );
    if (!ctx.alive) return;
    await ctx.tw.wait(0.3);
    if (ctx.alive) ctx.finish({ misses: this.s.misses, hints: this.s.hints });
  }

  private sectionFor(record: State['record']): Section {
    const truth = this.s.round.truth;
    const dark = record === 'seen' ? 2 : truth === 'cut' ? 2 : 1;
    return { layers: ['A', 'B', 'C'], dark, sand: record === 'sand', pulse: this.pulse };
  }

  private storySection(): Section {
    const ribbon = this.storyRibbon ?? this.ribbon;
    const shown = ribbon.slice(0, this.built);
    const p = predict(ribbon);
    const layers = shown.filter((c): c is Deposit => c !== 'X');
    return {
      layers,
      dark: shown.includes('X') ? p.cuts : null,
      sand: false,
      pulse: this.built === 4 ? this.pulse : null,
    };
  }

  private render() {
    const l = outcropLayout(this.view);
    const { w, h } = this.view;
    this.backdrop.clear().rect(0, 0, w, h).fill(cream);

    this.cliff.clear();
    drawSection(this.cliff, l.cliff.w, l.cliff.h, this.look, this.sectionFor(this.s.record));
    this.cliff.position.set(l.cliff.x, l.cliff.y);
    this.story.clear();
    drawSection(this.story, l.story.w, l.story.h, this.look, this.storySection());
    if (this.built === 0) this.story.circle(0, 0, 30).fill({ color: swatch.white.fill, alpha: 0.7 });
    this.story.position.set(l.story.x, l.story.y);
    this.sign.position.set(l.sign.x, l.sign.y);
    this.sign.style.fontSize = l.sign.size;
    this.sign.style.wordWrapWidth = l.sign.wrap;

    const ordering = this.ordering();
    this.cards.forEach((b, i) => {
      const box = l.cards[i];
      const card = this.ribbon[i];
      place(b, box);
      const lifted = this.lifted === i;
      const glow = this.glow.card === card || this.glow.slot === i;
      const helped = this.s.helped.includes(card);
      frame(b, box, glow ? swatch.yellow : lifted ? swatch.teal : swatch.white, glow || lifted);
      b.node.position.y = box.y - (lifted ? 12 : 0);
      drawCard(b.panel, card, box.w, box.h, this.look);
      if (helped)
        b.panel
          .star(box.w / 2 - 20, -box.h / 2 + 20, 5, 11, 5)
          .fill(swatch.yellow.fill)
          .stroke({ color: swatch.yellow.line, width: 2 });
      b.text.text = (l.numbered ? `${i + 1}. ` : '') + (card === 'X' ? 'dark rock' : `lay ${card}`);
      b.text.style.fontSize = Math.min(22, box.h / 6);
      b.text.position.set(0, box.h / 2 - 14);
      b.node.alpha = ordering ? 1 : 0.85;
    });

    place(this.play, l.play);
    frame(this.play, l.play, this.playing ? swatch.teal : swatch.white, this.playing);
    this.checkButton.node.visible = ordering;
    place(this.checkButton, l.check);
    frame(this.checkButton, l.check, swatch.teal, true);

    const sure = this.s.step === 'sure';
    (['yes', 'unsure'] as const).forEach((a, i) => {
      const b = this.answers[i];
      b.node.visible = sure;
      place(b, l.answers[i]);
      b.text.style.wordWrapWidth = l.answers[i].w - 20;
      frame(b, l.answers[i], this.glow.answer === a ? swatch.yellow : swatch.peach, this.glow.answer === a);
    });

    const looking = this.s.step === 'look';
    this.lookCards.forEach((b, i) => {
      const id = this.s.round.looks[i];
      const box = l.looks[i];
      b.node.visible = looking;
      place(b, box);
      const on = this.picked === id;
      const glow = this.glow.look === id;
      const missed = this.s.lookMissed.includes(id);
      frame(
        b,
        box,
        glow ? swatch.yellow : on ? swatch.teal : missed ? swatch.white : swatch.lavender,
        glow || on,
      );
      const k = Math.min(box.w, box.h) / 150;
      const y = id === 'look-top' ? -40 * k : id === 'look-low' ? -8 * k : -24 * k;
      b.panel.circle(0, y, 22 * k).stroke({ color: ink, width: 4 * k });
      b.panel
        .moveTo(15 * k, y + 15 * k)
        .lineTo(30 * k, y + 30 * k)
        .stroke({ color: ink, width: 6 * k, cap: 'round' });
      if (id === 'look-sand') b.panel.ellipse(0, y, 14 * k, 8 * k).fill(SAND.fill);
      b.node.alpha = missed ? 0.6 : 1;
      b.text.text = LOOK_LABEL[id];
      b.text.style.fontSize = Math.round(18 * Math.max(0.8, k));
      b.text.style.wordWrapWidth = box.w - 12;
      b.text.position.set(0, box.h / 2 - 30 * k);
    });
    this.lookButton.node.visible = looking;
    place(this.lookButton, l.look);
    frame(this.lookButton, l.look, this.picked ? swatch.teal : swatch.white, !!this.picked);
    this.root.addChild(this.lens);
  }

  update() {}

  resize(view: View) {
    this.view = view;
    if (this.lensOpen) this.closeLens();
    this.render();
  }

  /** The ghost finger: one wrong Check, then the hint walk's swaps by tap, Play, Check, the right answer and the sand look. */
  autotouch(): TouchIntent | null {
    if (this.busy) return null;
    if (this.lensOpen) return { tap: { on: this.lens } };
    const s = this.s;
    if (this.ordering()) {
      const obs = obsOf(s);
      if (fits(this.ribbon, obs)) {
        if (this.built < 4 && !this.playing) return { tap: { on: this.play.node } };
        if (this.playing) return null;
        return { tap: { on: this.checkButton.node } };
      }
      if (s.misses === 0 && s.step === 'order') return { tap: { on: this.checkButton.node } };
      const step = hintStep(this.ribbon, obs);
      if (!step) return null;
      const from = this.ribbon.indexOf(step.card);
      if (this.lifted === null) return { tap: { on: this.cards[from].node }, pause: 0.3 };
      if (this.lifted !== from) return { tap: { on: this.cards[this.lifted].node } };
      return { tap: { on: this.cards[step.slot].node } };
    }
    if (s.step === 'sure') return { tap: { on: this.answers[rightAnswer(s) === 'yes' ? 0 : 1].node } };
    if (s.step === 'look') {
      if (this.picked !== 'look-sand')
        return { tap: { on: this.lookCards[s.round.looks.indexOf('look-sand')].node }, pause: 0.4 };
      return { tap: { on: this.lookButton.node } };
    }
    return null;
  }

  destroy() {
    this.turn++;
    this.root.destroy({ children: true });
  }
}

export const game: GameModule = {
  id: 'outcrop-detective',
  name: 'Outcrop Detective',
  titleLine: 'game.outcrop-detective',
  region: 'tinker-lab',
  challenge: 'logic',
  skills: [
    'reading a cliff as a record of events',
    'ordering events by what lies lower and what cuts what',
    'telling missing evidence from contradicting evidence',
    'choosing the look that would decide',
  ],
  bands: ['school', 'grownup'],
  levels: (band) => rangeFor(LEVELS, band),
  describeLevel,
  music: STYLES.paint,
  hubIcon: () => new WigglyIcon(icon()),
  sticker: icon,
  upright: true,
  touchDemo: true,
  create: (ctx) => new Round(ctx),
};
