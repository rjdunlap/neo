import { Container, Graphics, Rectangle, type FederatedPointerEvent } from 'pixi.js';
import { Critter, CRITTERS, type CritterName } from '../../art/critter';
import { ink, swatch, wood, type ColorName } from '../../art/palette';
import { Backdrop } from '../../art/scenery';
import { STYLES } from '../../audio/music';
import { sfx } from '../../audio/sfx';
import { onTap } from '../../engine/input';
import { Rng } from '../../engine/random';
import type { View } from '../../engine/view';
import { rangeFor, type BandLevels } from '../../progress/difficulty';
import { RoundButton } from '../../ui/buttons';
import { label } from '../../ui/text';
import { tile, WigglyIcon } from '../shared';
import type { Game, GameContext, GameModule, TouchIntent } from '../types';
import { choicesFor, graphMove, makeGraph, planFor, questionsFor, type Graph, type GraphPlan, type Question } from './logic';

const LEVELS: BandLevels = {
  prek: { min: 1, max: 2 },
  school: { min: 1, max: 4 },
};

const COL_W = 110;
const BLOCK_H = 34;
const COLORS: ColorName[] = ['orange', 'teal', 'pink', 'purple'];
const NAMES: Partial<Record<CritterName, string>> = { duck: 'ducks', pig: 'pigs', bunny: 'bunnies', cat: 'cats', cow: 'cows', dog: 'dogs' };

function checkArt(): Graphics {
  return new Graphics().moveTo(-20, 0).lineTo(-6, 16).lineTo(22, -16).stroke({ width: 10, color: 0xffffff, cap: 'round', join: 'round' });
}

class PictureGraph implements Game {
  readonly plan: GraphPlan;
  graph!: Graph;
  /** Blocks in each column. */
  bars: number[] = [];
  index = -1;
  misses = 0;
  hints = 0;
  busy = true;
  finished = false;
  questions: Question[] = [];
  q = 0;
  readonly columns: Container[] = [];
  readonly pads: { n: number; node: Container }[] = [];
  readonly check: RoundButton;

  private readonly backdrop: Backdrop;
  private readonly meadow = new Container();
  private readonly chart = new Container();
  private readonly blocks = new Graphics();
  private readonly glow = new Graphics();
  private critters: { kind: number; node: Critter }[] = [];
  private view: View;
  private wrongs = 0;
  /** Hint: the column whose critters glow, or the column/pad to tap. */
  private hint: number | null = null;
  private clock = 0;

  constructor(private readonly ctx: GameContext) {
    this.view = ctx.view;
    this.plan = planFor(ctx.level);
    this.backdrop = new Backdrop({ sky: [0x8fd3f7, 0xe9f7ff], hills: [0xc8ecb0, 0x9edb86], horizon: 0.3, clouds: 2, sun: true, seed: 81 }, ctx.view);
    this.glow.eventMode = 'none';
    this.meadow.eventMode = 'none';
    this.chart.addChild(this.blocks);
    this.check = new RoundButton(checkArt(), swatch.green, 56, () => void this.checkGraph());
    ctx.stage.addChild(this.backdrop, this.meadow, this.chart, this.glow, this.check);
  }

  start() {
    void this.next();
  }

  private baseY() {
    return this.view.h - 110;
  }

  private colX(i: number) {
    return this.view.w / 2 - 60 - ((this.graph.kinds.length - 1) * (COL_W + 20)) / 2 + i * (COL_W + 20);
  }

  resize(v: View) {
    this.view = v;
    this.backdrop.resize(v);
    if (!this.graph) return;
    this.columns.forEach((c, i) => c.position.set(this.colX(i), this.baseY()));
    this.check.position.set(v.w - 90, this.baseY() - 40);
    this.pads.forEach((p, i) => p.node.position.set(v.w - 110, v.h * 0.32 + i * 125));
    this.draw();
  }

  update(dt: number) {
    this.clock += dt;
    const g = this.glow.clear();
    if (this.hint === null || this.busy) return;
    const pulse = 6 + 2 * Math.sin(this.clock * 5);
    if (this.questions.length && this.q < this.questions.length) {
      // On questions, the answer glows: a column or a number pad.
      const p = this.pads.find((x) => x.n === this.hint);
      if (p) g.roundRect(p.node.x - 66, p.node.y - 60, 132, 120, 22).stroke({ width: pulse, color: swatch.yellow.fill });
      else g.roundRect(this.colX(this.hint) - COL_W / 2 - 8, this.baseY() - 8 * BLOCK_H - 20, COL_W + 16, 8 * BLOCK_H + 90, 20).stroke({ width: pulse, color: swatch.yellow.fill });
      return;
    }
    for (const c of this.critters.filter((x) => x.kind === this.hint)) g.circle(c.node.x, c.node.y - 30, 40).stroke({ width: pulse, color: swatch.yellow.fill });
  }

  /**
   * The ghost finger: add a block above a short bar (quick taps, they belong together), press the check, then answer
   * each question by its column or its number.
   */
  autotouch(): TouchIntent | null {
    if (this.busy || this.finished || !this.graph) return null;
    const move = graphMove(this.plan, this.graph, this.bars, this.questions[this.q], this.firstSame);
    if (!move) return null;
    if (move.do === 'check') return { tap: { on: this.check } };
    if (move.do === 'number') {
      const pad = this.pads.find((p) => p.n === move.n);
      return pad ? { tap: { on: pad.node } } : null;
    }
    const column = this.columns[move.kind];
    if (!column) return null;
    // A tap above the bar adds a block there, where the next one will sit.
    if (move.do === 'add') return { tap: { on: column, x: 0, y: -(this.bars[move.kind] + 0.5) * BLOCK_H }, pause: 0.15 };
    return { tap: { on: column, x: 0, y: -Math.max(1, this.bars[move.kind]) * BLOCK_H * 0.5 } };
  }

  destroy() {}

  private async next() {
    this.busy = true;
    this.index++;
    this.wrongs = 0;
    this.hint = null;
    this.q = 0;
    this.questions = [];
    if (this.index >= this.plan.graphs) return void this.finale();
    this.graph = makeGraph(this.plan, this.ctx.rng);
    const read = this.plan.mode === 'read';
    this.bars = read ? [...this.graph.counts] : this.graph.kinds.map(() => 0);
    this.buildMeadow(!read);
    this.buildColumns();
    this.clearPads();
    this.check.visible = !read;
    this.resize(this.view);
    this.busy = false;
    if (read) return this.askNext();
    return this.ctx.instruct('graph.build');
  }

  /** The critters, scattered in the meadow above the graph. */
  private buildMeadow(show: boolean) {
    for (const c of this.critters) {
      this.ctx.untrack(c.node);
      c.node.destroy({ children: true });
    }
    this.critters = [];
    if (!show) return;
    const v = this.view;
    const spots: { x: number; y: number }[] = [];
    this.graph.counts.forEach((n, kind) => {
      for (let k = 0; k < n; k++) {
        let p = { x: 0, y: 0 };
        for (let tries = 0; tries < 60; tries++) {
          // Clear of the number pads and the check on the right.
          p = { x: this.ctx.rng.range(190, v.w - 230), y: this.ctx.rng.range(170, Math.min(v.h * 0.5, 380)) };
          if (spots.every((s) => Math.hypot(s.x - p.x, s.y - p.y) > 70)) break;
        }
        spots.push(p);
        const node = new Critter(CRITTERS[this.graph.kinds[kind]]);
        node.scale.set(0.22);
        node.position.set(p.x, p.y);
        this.ctx.track(node);
        this.meadow.addChild(node);
        this.critters.push({ kind, node });
      }
    });
  }

  /** One column per kind, with a face underneath; tap above the bar to add, on it to take away. */
  private buildColumns() {
    for (const c of this.columns.splice(0)) c.destroy({ children: true });
    this.graph.kinds.forEach((kind, i) => {
      const col = new Container();
      const face = new Critter(CRITTERS[kind]);
      face.alive = false;
      face.scale.set(0.2);
      face.y = 58;
      col.addChild(face);
      col.hitArea = new Rectangle(-COL_W / 2, -8 * BLOCK_H - 20, COL_W, 8 * BLOCK_H + 80);
      onTap(col, (e) => this.tapColumn(i, e), { cooldown: 120 });
      this.columns.push(col);
      this.chart.addChild(col);
    });
  }

  private draw() {
    const g = this.blocks.clear();
    const base = this.baseY();
    const left = this.colX(0) - COL_W / 2 - 30;
    const right = this.colX(this.graph.kinds.length - 1) + COL_W / 2 + 20;
    g.roundRect(left - 10, base - 8 * BLOCK_H - 30, right - left + 20, 8 * BLOCK_H + 110, 18).fill({ color: 0xffffff, alpha: 0.75 });
    // Grid lines with numbers, for reading the bars.
    for (let n = 1; n <= 8; n++) {
      g.moveTo(left + 20, base - n * BLOCK_H).lineTo(right, base - n * BLOCK_H).stroke({ width: 2, color: ink, alpha: 0.12 });
    }
    g.moveTo(left + 20, base).lineTo(right, base).stroke({ width: 4, color: ink, alpha: 0.6 });
    this.bars.forEach((n, i) => {
      const x = this.colX(i);
      const sw = swatch[COLORS[i % COLORS.length]];
      for (let k = 0; k < n; k++) g.roundRect(x - 40, base - (k + 1) * BLOCK_H + 2, 80, BLOCK_H - 4, 6).fill(sw.fill).stroke({ width: 3, color: sw.line });
    });
    // Number labels down the side.
    this.chart.children.filter((c) => (c as Container & { tag?: string }).tag === 'num').forEach((c) => c.destroy());
    for (let n = 2; n <= 8; n += 2) {
      const t = label(String(n), 20, ink) as unknown as Container & { tag?: string };
      t.tag = 'num';
      t.position.set(left + 6, base - n * BLOCK_H);
      this.chart.addChild(t);
    }
  }

  private tapColumn(i: number, e: FederatedPointerEvent) {
    if (this.busy || this.finished) return;
    // Answering "which one?" questions: tap a column.
    const q = this.questions[this.q];
    if (q && (q.ask === 'most' || q.ask === 'fewest' || q.ask === 'same')) return void this.answerColumn(i);
    if (this.plan.mode === 'read' || this.questions.length) return;
    const p = this.columns[i].toLocal(e.global);
    const top = -this.bars[i] * BLOCK_H;
    if (p.y < top && this.bars[i] < 8) {
      this.bars[i]++;
      sfx.pop(3 + this.bars[i]);
      void this.ctx.say('count', { n: this.bars[i] });
    } else if (this.bars[i] > 0) {
      this.bars[i]--;
      sfx.pop(2);
    }
    this.draw();
  }

  private async checkGraph() {
    if (this.busy || this.finished || this.plan.mode === 'read' || this.questions.length) return;
    const wrong = this.bars.findIndex((n, i) => n !== this.graph.counts[i]);
    if (wrong < 0) {
      this.busy = true;
      this.hint = null;
      sfx.sparkle();
      this.ctx.pet.cheer();
      await this.ctx.say('graph.built');
      this.wrongs = 0;
      this.questions = questionsFor(this.plan, this.graph, this.ctx.rng);
      this.check.visible = false;
      this.busy = false;
      if (!this.questions.length) return void this.next();
      return this.askNext();
    }
    this.busy = true;
    this.misses++;
    this.wrongs++;
    sfx.boing();
    await this.ctx.say('graph.recount', { kind: NAMES[this.graph.kinds[wrong]]! });
    if (this.wrongs >= 2 && this.hint === null) {
      this.hints++;
      this.hint = wrong;
    }
    this.busy = false;
  }

  private askNext(): Promise<void> | void {
    this.hint = null;
    this.wrongs = 0;
    this.clearPads();
    const q = this.questions.length ? this.questions[this.q] : undefined;
    if (!q && this.plan.mode === 'read') {
      this.questions = questionsFor(this.plan, this.graph, this.ctx.rng);
      return this.askNext();
    }
    if (!q) return void this.next();
    const name = (i: number) => NAMES[this.graph.kinds[i]]!;
    if (q.ask === 'more' || q.ask === 'total') {
      for (const n of choicesFor(q.answer, this.ctx.rng)) {
        const node = new Container();
        node.addChild(tile(116, 104, 'white'), label(String(n), 46, ink));
        node.hitArea = new Rectangle(-62, -56, 124, 112);
        onTap(node, () => void this.answerNumber(n), { cooldown: 300 });
        this.pads.push({ n, node });
        this.ctx.stage.addChild(node);
      }
      this.resize(this.view);
    }
    if (q.ask === 'most') return this.ctx.instruct('graph.most');
    if (q.ask === 'fewest') return this.ctx.instruct('graph.fewest');
    if (q.ask === 'same') return this.ctx.instruct('graph.same');
    if (q.ask === 'total') return this.ctx.instruct('graph.total');
    if (q.ask === 'more') return this.ctx.instruct('graph.more', { a: name(q.a), b: name(q.b) });
  }

  private clearPads() {
    for (const p of this.pads.splice(0)) p.node.destroy({ children: true });
  }

  /** "Same" questions need two columns: the first tap is remembered. */
  firstSame: number | null = null;

  private async answerColumn(i: number) {
    const q = this.questions[this.q];
    if (q.ask === 'same') {
      if (this.firstSame === null) {
        this.firstSame = i;
        sfx.pop(5);
        return;
      }
      const pair = [this.firstSame, i].sort();
      this.firstSame = null;
      if (pair[0] === q.answer[0] && pair[1] === q.answer[1]) return void this.right();
      return void this.wrong(q.answer[0]);
    }
    if (i === q.answer) return void this.right();
    return void this.wrong(q.answer);
  }

  private async answerNumber(n: number) {
    if (this.busy || this.finished) return;
    const q = this.questions[this.q] as Extract<Question, { answer: number }>;
    if (n === q.answer) return void this.right();
    return void this.wrong(q.answer);
  }

  private async wrong(answer: number) {
    this.busy = true;
    this.misses++;
    this.wrongs++;
    sfx.boing();
    await this.ctx.say('graph.look');
    if (this.wrongs >= 2 && this.hint === null) {
      this.hints++;
      this.hint = answer;
    }
    this.busy = false;
  }

  private async right() {
    this.busy = true;
    sfx.sparkle();
    this.ctx.pet.cheer();
    await this.ctx.say('graph.yay');
    this.q++;
    this.busy = false;
    if (this.q >= this.questions.length) return void this.next();
    return this.askNext();
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

class GraphIcon extends WigglyIcon {
  constructor() {
    const c = new Container();
    const g = new Graphics().roundRect(-100, -190, 200, 180, 18).fill(0xffffff).stroke({ width: 5, color: wood.line });
    [3, 5, 2].forEach((n, i) => {
      for (let k = 0; k < n; k++) g.roundRect(-70 + i * 55, -40 - k * 26, 40, 22, 5).fill(swatch[COLORS[i]].fill);
    });
    c.addChild(g);
    super(c);
  }
}

function sticker(seed: number): Container {
  const rng = new Rng(seed);
  const c = new Container();
  for (let i = 0; i < 3; i++) {
    const n = rng.int(1, 5);
    for (let k = 0; k < n; k++) c.addChild(new Graphics().roundRect(-90 + i * 64, 60 - k * 30, 52, 26, 6).fill(swatch[COLORS[i]].fill).stroke({ width: 3, color: swatch[COLORS[i]].line }));
  }
  return c;
}

export const pictureGraph: GameModule = {
  id: 'picture-graph',
  name: 'Picture Graph',
  titleLine: 'game.picture-graph',
  region: 'counting-cove',
  skills: ['counting', 'data', 'graphs', 'comparing'],
  bands: ['prek', 'school'],
  levels: (band) => rangeFor(LEVELS, band),
  describeLevel: (level) => planFor(level).name,
  music: STYLES.hub,
  coplayHint: 'Point and count together, crossing off each critter in your head: "one duck, two ducks..."',
  offScreen: 'Make a graph of the family\'s favorite fruits with sticky notes or blocks. Which is the most popular?',
  hubIcon: () => new GraphIcon(),
  touchDemo: true,
  sticker,
  create: (ctx) => new PictureGraph(ctx),
};
