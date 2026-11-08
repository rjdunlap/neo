import { Container, Graphics, Rectangle } from 'pixi.js';
import { Critter, CRITTERS } from '../../art/critter';
import { ink, swatch, wood, type ColorName } from '../../art/palette';
import { Backdrop } from '../../art/scenery';
import { sfx } from '../../audio/sfx';
import { onTap } from '../../engine/input';
import type { View } from '../../engine/view';
import { label } from '../../ui/text';
import type { Game, GameContext, TouchIntent } from '../types';
import {
  makePairRound,
  MEADOWS,
  pairLayout,
  pairMove,
  pairWhy,
  PAIR_ROWS,
  planFor,
  sameHint,
  sameTap,
  type GraphPlan,
  type PairRound,
  type SmallGraph,
} from './logic';

const COLORS: ColorName[] = ['orange', 'teal', 'pink', 'purple'];
/** How far a graph lifts when it is the first pick. */
const LIFT = 14;

/** A kind's tally marks from (x, y): a group of five (four lines and one across), then single lines. */
function marks(g: Graphics, x: number, y: number, n: number, color: number) {
  const half = 18;
  const fives = Math.floor(n / 5);
  let at = x;
  for (let f = 0; f < fives; f++) {
    for (let k = 0; k < 4; k++) g.moveTo(at + 6 + k * 10, y - half).lineTo(at + 6 + k * 10, y + half);
    g.stroke({ width: 5, color, cap: 'round' });
    g.moveTo(at, y + half - 4)
      .lineTo(at + 42, y - half + 4)
      .stroke({ width: 6, color, cap: 'round' });
    at += 56;
  }
  for (let k = 0; k < n % 5; k++) g.moveTo(at + 6 + k * 14, y - half).lineTo(at + 6 + k * 14, y + half);
  g.stroke({ width: 5, color, cap: 'round' });
}

/**
 * Level 10, Two pictures, one meadow: a tally card of one meadow's critters and three finished graphs. One is plain,
 * one has a key (each block is two), and one is plain but exactly as tall as the keyed one, so it shows half the
 * critters. She taps the two graphs that show the card: the first tap lifts a graph, a tap on it again lowers it free, a
 * tap on another makes the pair. A wrong pair is a miss; after two, both right graphs glow and the keyed graph's first
 * bar is counted aloud by twos beside the card.
 */
export class TwoPictures implements Game {
  readonly plan: GraphPlan;
  round!: PairRound;
  index = -1;
  misses = 0;
  hints = 0;
  busy = true;
  finished = false;
  /** The lifted graph, waiting for its pair. */
  first: number | null = null;
  readonly graphs: Container[] = [];

  private readonly backdrop: Backdrop;
  private readonly card = new Container();
  private readonly layer = new Container();
  private readonly glow = new Graphics();
  private view: View;
  private wrongs = 0;
  private hint = false;
  /** While the keyed bar is counted aloud by twos, its blocks and the card's row glow. */
  private counting = false;
  private clock = 0;

  constructor(private readonly ctx: GameContext) {
    this.view = ctx.view;
    this.plan = planFor(ctx.level);
    this.backdrop = new Backdrop(
      {
        sky: [0x8fd3f7, 0xe9f7ff],
        hills: [0xc8ecb0, 0x9edb86],
        horizon: 0.3,
        clouds: 2,
        sun: true,
        seed: ctx.rng.pick(MEADOWS),
      },
      ctx.view,
    );
    this.card.eventMode = 'none';
    this.glow.eventMode = 'none';
    ctx.stage.addChild(this.backdrop, this.card, this.layer, this.glow);
  }

  start() {
    void this.next();
  }

  private layout() {
    return pairLayout(this.view.w, this.view.h, this.plan.kinds);
  }

  resize(v: View) {
    this.view = v;
    this.backdrop.resize(v);
    if (!this.round) return;
    this.drawCard();
    this.drawGraphs();
  }

  update(dt: number) {
    this.clock += dt;
    const g = this.glow.clear();
    if (!this.round || this.finished) return;
    const t = this.layout();
    const pulse = 6 + 2 * Math.sin(this.clock * 5);
    // The first pick has an outline, so she sees which one she chose.
    if (this.first !== null) {
      const x = t.graphX(this.first);
      g.roundRect(x - t.gw / 2 - 6, t.top - LIFT - 6, t.gw + 12, t.gh + 12, 22).stroke({
        width: 5,
        color: ink,
      });
    }
    if (!this.hint) return;
    for (const i of sameHint(this.first, this.round.answer)) {
      const x = t.graphX(i);
      g.roundRect(
        x - t.gw / 2 - 10,
        t.top - (this.first === i ? LIFT : 0) - 10,
        t.gw + 20,
        t.gh + 20,
        24,
      ).stroke({ width: pulse, color: swatch.yellow.fill });
    }
    if (!this.counting) return;
    // The keyed graph's first bar and the card's first row, counted together.
    const k = this.round.keyed;
    const lift = this.first === k ? LIFT : 0;
    const bx = t.graphX(k) + this.barX(0);
    for (let b = 0; b < this.round.graphs[k].bars[0]; b++)
      g.roundRect(bx - 24, t.base - (b + 1) * t.blockH - lift - 2, 48, t.blockH + 4, 8).stroke({
        width: pulse * 0.6,
        color: swatch.yellow.fill,
      });
    const y = t.card.rowY(0);
    g.roundRect(t.card.left + 4, y - 26, t.card.right - t.card.left - 8, 52, 12).stroke({
      width: pulse * 0.6,
      color: swatch.yellow.fill,
    });
  }

  /** The ghost finger: one right graph, then the other. */
  autotouch(): TouchIntent | null {
    if (this.busy || this.finished || !this.round) return null;
    const i = pairMove(this.round, this.first);
    return {
      tap: { on: this.graphs[i], x: 0, y: this.layout().gh / 2 },
      pause: this.first === null ? 0.4 : undefined,
    };
  }

  destroy() {}

  private async next() {
    this.busy = true;
    this.index++;
    this.wrongs = 0;
    this.hint = false;
    this.first = null;
    if (this.index >= this.plan.graphs) return void this.finale();
    this.round = makePairRound(this.plan, this.ctx.rng);
    this.buildGraphs();
    this.resize(this.view);
    this.busy = false;
    return this.ctx.instruct('graph.pair');
  }

  /** Three tap targets, each a whole graph. */
  private buildGraphs() {
    for (const c of this.graphs.splice(0)) c.destroy({ children: true });
    this.round.graphs.forEach((_, i) => {
      const c = new Container();
      onTap(c, () => void this.tapGraph(i), { cooldown: 200 });
      this.graphs.push(c);
      this.layer.addChild(c);
    });
  }

  /** A bar's centre across its graph. */
  private barX(k: number) {
    const t = this.layout();
    const step = (t.gw - 56) / this.plan.kinds;
    return -t.gw / 2 + 46 + step / 2 + k * step;
  }

  /** The tally card: a row for each kind, its face and its marks. */
  private drawCard() {
    for (const c of this.card.removeChildren()) c.destroy({ children: true });
    const t = this.layout().card;
    const g = new Graphics();
    g.roundRect(t.left, t.top, t.right - t.left, t.bottom - t.top, 16)
      .fill({ color: 0xffffff, alpha: 0.92 })
      .stroke({ width: 4, color: wood.line });
    this.card.addChild(g);
    this.round.card.kinds.forEach((kind, r) => {
      const y = t.rowY(r);
      marks(g, t.marksX, y, this.round.card.counts[r], swatch[COLORS[r % COLORS.length]].line);
      const face = new Critter(CRITTERS[kind]);
      face.alive = false;
      face.scale.set(0.14);
      face.position.set(t.faceX, y + 18);
      this.card.addChild(face);
    });
  }

  /** Each graph: its key at the top, the grid with numbers down the side, the bars, and the faces underneath. */
  private drawGraphs() {
    const t = this.layout();
    this.round.graphs.forEach((sg, i) => {
      const c = this.graphs[i];
      for (const child of c.removeChildren()) child.destroy({ children: true });
      c.position.set(t.graphX(i), t.top - (this.first === i ? LIFT : 0));
      c.hitArea = new Rectangle(-t.gw / 2, 0, t.gw, t.gh);
      this.drawGraph(c, sg);
    });
  }

  private drawGraph(c: Container, sg: SmallGraph) {
    const t = this.layout();
    const base = t.base - t.top;
    const left = -t.gw / 2;
    const g = new Graphics();
    g.roundRect(left, 0, t.gw, t.gh, 18)
      .fill({ color: 0xffffff, alpha: 0.88 })
      .stroke({ width: 4, color: wood.line });
    // The key: a block = one dot, or two.
    g.roundRect(-58, 14, 46, 26, 6).fill(0xdde3ea).stroke({ width: 3, color: 0x8a97a6 });
    for (let k = 0; k < sg.per; k++) g.circle(28 + k * 28, 27, 10).fill(ink);
    c.addChild(g);
    const eq = label('=', 28, ink);
    eq.position.set(2, 27);
    c.addChild(eq);
    for (let n = 1; n <= PAIR_ROWS; n++)
      g.moveTo(left + 36, base - n * t.blockH)
        .lineTo(-left - 10, base - n * t.blockH)
        .stroke({ width: 2, color: ink, alpha: 0.12 });
    g.moveTo(left + 36, base)
      .lineTo(-left - 10, base)
      .stroke({ width: 4, color: ink, alpha: 0.6 });
    // Down the side, how many critters the bars stand for up to there: 2, 4, 6, 8 on a plain graph; 2, 4, 6... every row with the key.
    for (let n = sg.per > 1 ? 1 : 2; n <= PAIR_ROWS; n += sg.per > 1 ? 1 : 2) {
      const num = label(String(n * sg.per), 18, ink);
      num.position.set(left + 20, base - n * t.blockH);
      c.addChild(num);
    }
    const bw = Math.min(48, (t.gw - 56) / this.plan.kinds - 14);
    sg.bars.forEach((n, k) => {
      const x = this.barX(k);
      const sw = swatch[COLORS[k % COLORS.length]];
      for (let b = 0; b < n; b++)
        g.roundRect(x - bw / 2, base - (b + 1) * t.blockH + 2, bw, t.blockH - 4, 6)
          .fill(sw.fill)
          .stroke({ width: 3, color: sw.line });
      const face = new Critter(CRITTERS[this.round.card.kinds[k]]);
      face.alive = false;
      face.scale.set(0.13);
      face.position.set(x, base + 46);
      c.addChild(face);
    });
  }

  private async tapGraph(i: number) {
    if (this.busy || this.finished || !this.round) return;
    const was = this.first;
    const tap = sameTap(this.first, i, this.round.answer);
    this.first = tap.first;
    this.drawGraphs();
    if (tap.result === 'lift') return void sfx.pop(5);
    if (tap.result === 'lower') return void sfx.pop(2);
    if (tap.result === 'right') return this.right();
    return this.wrong(pairWhy(this.round, was!, i));
  }

  private async wrong(why: 'key' | 'look') {
    this.busy = true;
    this.misses++;
    this.wrongs++;
    sfx.boing();
    await this.ctx.say(why === 'key' ? 'graph.pair.key' : 'graph.pair.look');
    if (this.wrongs >= 2 && !this.hint) {
      this.hints++;
      this.hint = true;
      this.counting = true;
      const blocks = this.round.graphs[this.round.keyed].bars[0];
      for (let k = 1; k <= blocks; k++) await this.ctx.say('count', { n: k * 2 });
      this.counting = false;
    }
    this.busy = false;
  }

  private async right() {
    this.busy = true;
    this.hint = false;
    sfx.sparkle();
    this.ctx.pet.cheer();
    await this.ctx.say('graph.pair.yay');
    this.busy = false;
    return this.next();
  }

  private async finale() {
    if (this.finished) return;
    this.finished = true;
    sfx.tada();
    await this.ctx.say('graph.done');
    await this.ctx.tw.wait(0.4);
    this.ctx.finish({ misses: this.misses, hints: this.hints });
  }
}
