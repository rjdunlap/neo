import { Container, Graphics, Rectangle, Text } from 'pixi.js';
import { ink, swatch, wood, type ColorName } from '../../art/palette';
import { Backdrop } from '../../art/scenery';
import { puffs } from '../../art/shapes';
import { sfx } from '../../audio/sfx';
import { onTap } from '../../engine/input';
import type { View } from '../../engine/view';
import type { Game, GameContext, TouchIntent } from '../types';
import { Bloom } from './bloom';
import { drawKind } from './kinds';
import {
  CONDITIONS,
  RULER,
  differing,
  fairAnswer,
  fairHint,
  flipped,
  growthHeight,
  judgeFair,
  makeCompare,
  makeFair,
  moreOf,
  planFor,
  type CompareRound,
  type Condition,
  type FlowerKind,
  type GardenPlan,
  type Setup,
} from './logic';

/** Ruler steps are drawn this tall in a bed's own units; a plant of height 5 has the usual 130-unit stem. */
const STEP = 26;
const CARD = 110;
const CARD_GAP = 16;
const WORD: Record<Condition, string> = { light: 'sun', water: 'water' };

type Step = 'pick' | 'grow' | 'which' | 'fair' | 'free';

/** A bed under the seed packet: soil, its plant, a ruler, a hit area, and the two condition cards below. */
interface Plot {
  /** The bed itself, drawn in its own units and scaled to fit the screen. */
  bed: Container;
  bloom: Bloom;
  ruler: Container;
  flag: Graphics;
  cards: Record<Condition, Container>;
  cardRow: Container;
  setup: Setup;
}

function drawCard(g: Graphics, cond: Condition, setup: Setup): Graphics {
  g.roundRect(-CARD / 2, -CARD / 2, CARD, CARD, 20)
    .fill(0xfff8ec)
    .stroke({ width: 5, color: wood.line });
  if (cond === 'light') {
    if (setup.light === 'sun') {
      for (let i = 0; i < 8; i++) {
        const a = (i * Math.PI) / 4;
        g.moveTo(Math.cos(a) * 28, Math.sin(a) * 28)
          .lineTo(Math.cos(a) * 42, Math.sin(a) * 42)
          .stroke({ width: 6, color: swatch.yellow.line, cap: 'round' });
      }
      g.circle(0, 0, 23).fill(swatch.yellow.fill).stroke({ width: 4, color: swatch.yellow.line });
    } else {
      // Shade: a dim, small sun hiding behind a grey cloud.
      g.circle(14, -16, 14).fill({ color: swatch.yellow.fill, alpha: 0.45 });
      puffs(
        g,
        [
          [-18, 6, 18],
          [4, -2, 24],
          [24, 8, 17],
        ],
        0xb9c3d3,
        0x7c8aa0,
        4,
      );
    }
  } else {
    const drop = (x: number, y: number, r: number) =>
      g
        .moveTo(x, y - r * 1.7)
        .quadraticCurveTo(x + r * 1.1, y - r * 0.2, x + r, y + r * 0.3)
        .arc(x, y + r * 0.3, r, 0, Math.PI)
        .quadraticCurveTo(x - r * 1.1, y - r * 0.2, x, y - r * 1.7)
        .fill(swatch.blue.fill)
        .stroke({ width: 3, color: swatch.blue.line });
    if (setup.water === 'more') {
      drop(-24, 14, 11);
      drop(24, 14, 11);
      drop(0, -6, 13);
    } else drop(0, 4, 15);
  }
  return g;
}

/** The seed packet above both beds: one picture, so "same seeds" can be seen. */
const drawPacket = (kind: FlowerKind, color: ColorName) => {
  const c = new Container();
  const sw = swatch[color];
  c.addChild(
    new Graphics()
      .roundRect(-48, -62, 96, 124, 14)
      .fill(0xfff8ec)
      .stroke({ width: 5, color: wood.line })
      .roundRect(-48, -62, 96, 22, 14)
      .fill(sw.fill),
  );
  const flower = drawKind(new Graphics(), kind, 24, sw.fill, sw.line);
  flower.position.set(0, 12);
  c.addChild(flower);
  return c;
};

/**
 * Garden Grow levels 12–13 (docs/definitions/growing-conditions.md). Two beds grow from the same seed packet; each bed has a
 * sun-or-shade card and a lot-or-a-little-water card. Level 12 reads a comparison; level 13 asks her to set the second bed so
 * that only the one asked thing differs. The plants are all healthy: the shorter ones are only smaller.
 */
export class ConditionsGarden implements Game {
  private readonly plan: GardenPlan;
  private readonly compare: boolean;
  private readonly backdrop: Backdrop;
  private readonly glow = new Graphics();
  private readonly packet = new Container();
  private readonly question = new Container();
  private readonly token = new Container();
  private readonly undo = new Container();
  private readonly next = new Container();
  private readonly plots: Plot[] = [];
  private view: View;
  private step: Step = 'pick';
  private clock = 0;
  private round = -1;
  private rounds: {
    compare?: CompareRound;
    a?: Setup;
    ask?: Condition;
    kind: FlowerKind;
    color: ColorName;
  }[] = [];
  private lastCompare: CompareRound | undefined;
  private lastAsk: Condition | undefined;
  private lastKind: FlowerKind | undefined;
  private misses = 0;
  private hints = 0;
  /** Misses at the current step; the second one lights the answer, counted as one hint. */
  private wrongs = 0;
  private hintOn = false;
  /** The pair of cards the round's one difference is on (level 12), lit once found. */
  private found = false;
  private grown = false;
  private busy = true;
  private finished = false;
  private scale = 1;

  constructor(private readonly ctx: GameContext) {
    this.view = ctx.view;
    this.plan = planFor(ctx.level);
    this.compare = this.plan.mode === 'compare';
    this.backdrop = new Backdrop(
      {
        sky: [0x8fd3f7, 0xe9f7ff],
        hills: [0xc8ecb0, 0x9edb86],
        horizon: 0.5,
        clouds: 1,
        sun: true,
        seed: 41,
      },
      ctx.view,
    );
    this.glow.eventMode = 'none';
    ctx.stage.addChild(this.backdrop, this.packet, this.question);
    for (let i = 0; i < 2; i++) this.plots.push(this.makePlot());
    this.buildButtons();
    ctx.stage.addChild(this.token, this.undo, this.next, this.glow);
    this.rounds = this.makeRounds();
  }

  private makeRounds() {
    const out: ConditionsGarden['rounds'] = [];
    for (let i = 0; i < this.plan.requests; i++) {
      if (this.compare) {
        const r = makeCompare(
          this.ctx.rng,
          this.lastCompare && { changed: this.lastCompare.changed, taller: this.lastCompare.taller },
          this.lastKind,
        );
        this.lastCompare = r;
        this.lastKind = r.kind;
        out.push({ compare: r, kind: r.kind, color: r.color });
      } else {
        const r = makeFair(this.ctx.rng, this.lastAsk, this.lastKind);
        this.lastAsk = r.ask;
        this.lastKind = r.kind;
        out.push({ a: r.a, ask: r.ask, kind: r.kind, color: r.color });
      }
    }
    return out;
  }

  private makePlot(): Plot {
    const bed = new Container();
    const soil = new Graphics().ellipse(0, 6, 80, 26).fill(wood.line).ellipse(0, 0, 74, 22).fill(0x8a5a36);
    const ruler = new Container();
    ruler.addChild(
      new Graphics()
        .moveTo(-100, -10)
        .lineTo(-100, -10 - STEP * RULER)
        .stroke({ width: 4, color: wood.line, cap: 'round' }),
    );
    for (let k = 1; k <= RULER; k++) {
      ruler.addChild(
        new Graphics()
          .moveTo(-112, -10 - STEP * k)
          .lineTo(-88, -10 - STEP * k)
          .stroke({ width: 4, color: wood.line, cap: 'round' }),
      );
      const t = new Text({
        text: String(k),
        style: { fontFamily: 'sans-serif', fontSize: 16, fontWeight: '700', fill: wood.line },
      });
      t.anchor.set(1, 0.5);
      t.position.set(-118, -10 - STEP * k);
      ruler.addChild(t);
    }
    const flag = new Graphics().poly([-100, 0, -76, -8, -100, -16]).fill(swatch.red.fill);
    flag.visible = false;
    ruler.addChild(flag);
    ruler.visible = false;
    const bloom = new Bloom('red', 'blossom');
    bloom.setStage(1);
    bed.addChild(soil, ruler, bloom);
    bed.hitArea = new Rectangle(-125, -10 - STEP * RULER - 70, 250, STEP * RULER + 120);
    const cardRow = new Container();
    const plot: Plot = {
      bed,
      bloom,
      ruler,
      flag,
      cards: { light: new Container(), water: new Container() },
      cardRow,
      setup: { light: 'sun', water: 'more' },
    };
    CONDITIONS.forEach((c, i) => {
      const card = plot.cards[c];
      card.position.set((i - 0.5) * (CARD + CARD_GAP), 0);
      card.hitArea = new Rectangle(-CARD / 2, -CARD / 2, CARD, CARD);
      cardRow.addChild(card);
    });
    onTap(bed, () => void this.tapBed(this.plots.indexOf(plot)), { cooldown: 300 });
    for (const c of CONDITIONS)
      onTap(plot.cards[c], () => void this.tapCard(this.plots.indexOf(plot), c), { cooldown: 200 });
    this.ctx.stage.addChild(bed, cardRow);
    return plot;
  }

  private buildButtons() {
    const t = puffs(
      new Graphics(),
      [
        [-34, 14, 30],
        [0, 0, 40],
        [38, 14, 30],
      ],
      0xffffff,
      0xc9d6e6,
      5,
    );
    const sun = new Graphics()
      .circle(-34, -34, 24)
      .fill(swatch.yellow.fill)
      .stroke({ width: 4, color: swatch.yellow.line });
    this.token.addChild(sun, t);
    this.token.hitArea = new Rectangle(-80, -70, 160, 130);
    onTap(this.token, () => void this.tapToken(), { cooldown: 500 });

    this.undo.addChild(
      new Graphics()
        .roundRect(-55, -55, 110, 110, 26)
        .fill(0xfff8ec)
        .stroke({ width: 5, color: wood.line })
        .arc(0, 4, 22, Math.PI * 0.9, Math.PI * 2.3)
        .stroke({ width: 8, color: ink, cap: 'round' })
        .poly([14, -26, 34, -16, 18, -2])
        .fill(ink),
    );
    this.undo.hitArea = new Rectangle(-55, -55, 110, 110);
    onTap(this.undo, () => this.tapUndo(), { cooldown: 300 });

    this.next.addChild(
      new Graphics()
        .roundRect(-55, -55, 110, 110, 26)
        .fill(swatch.green.fill)
        .stroke({ width: 5, color: swatch.green.line })
        .poly([-16, -26, 28, 0, -16, 26])
        .fill(0xffffff),
    );
    this.next.hitArea = new Rectangle(-55, -55, 110, 110);
    onTap(this.next, () => void this.tapNext(), { cooldown: 500 });
    this.undo.visible = false;
    this.next.visible = false;
  }

  start() {
    void this.begin();
  }

  private get cur() {
    return this.rounds[this.round];
  }

  /** The two setups on screen: the round's (level 12) or A and B (level 13). */
  private async begin() {
    this.round++;
    if (this.round >= this.rounds.length) return void this.finale();
    const r = this.cur;
    this.busy = true;
    this.wrongs = 0;
    this.hintOn = false;
    this.found = false;
    this.grown = false;
    this.undo.visible = false;
    this.next.visible = false;
    // The packet is drawn once, above both beds: the same seeds.
    this.packet.removeChildren().forEach((c) => c.destroy({ children: true }));
    this.packet.addChild(drawPacket(r.kind, r.color));
    this.plots.forEach((p, i) => {
      p.bed.removeChild(p.bloom);
      p.bloom.destroy({ children: true });
      p.bloom = new Bloom(r.color, r.kind);
      p.bloom.setStage(1);
      p.bloom.setReach(1);
      p.bed.addChild(p.bloom);
      p.ruler.visible = false;
      p.flag.visible = false;
      p.setup = this.compare ? (i === 0 ? r.compare!.a : r.compare!.b) : { ...r.a! };
      this.paintCards(p);
    });
    this.paintQuestion();
    this.layout();
    this.step = this.compare ? 'pick' : 'fair';
    this.busy = false;
    if (this.compare) return this.ctx.instruct('grow.cond.look');
    return this.ctx.instruct('grow.fair.ask', { what: WORD[r.ask!] });
  }

  private paintCards(p: Plot) {
    for (const c of CONDITIONS) {
      const card = p.cards[c];
      card.removeChildren().forEach((x) => x.destroy());
      card.addChild(drawCard(new Graphics(), c, p.setup));
    }
  }

  private paintQuestion() {
    this.question.removeChildren().forEach((c) => c.destroy({ children: true }));
    if (this.compare) return;
    const ask = this.cur.ask!;
    const g = new Graphics()
      .roundRect(-CARD / 2, -CARD / 2, CARD, CARD, 20)
      .fill(0xfff8ec)
      .stroke({ width: 5, color: swatch.purple.line });
    const pic = drawCard(
      new Graphics(),
      ask,
      ask === 'light' ? { light: 'sun', water: 'less' } : { light: 'sun', water: 'more' },
    );
    pic.scale.set(0.62);
    pic.position.set(-6, 8);
    const q = new Text({
      text: '?',
      style: { fontFamily: 'sans-serif', fontSize: 40, fontWeight: '800', fill: swatch.purple.line },
    });
    q.anchor.set(0.5);
    q.position.set(34, -34);
    this.question.addChild(g, pic, q);
  }

  resize(v: View) {
    this.view = v;
    this.backdrop.resize(v);
    this.layout();
  }

  private layout() {
    const { w, h } = this.view;
    const s = Math.min(1.6, (h * 0.3) / (STEP * RULER + 60));
    this.scale = s;
    const base = h * 0.5;
    const xs = [w * 0.27, w * 0.73];
    this.plots.forEach((p, i) => {
      p.bed.position.set(xs[i], base);
      p.bed.scale.set(s);
      p.cardRow.position.set(xs[i], base + 120);
    });
    this.packet.position.set(this.compare ? w / 2 : w / 2 - 80, Math.max(90, base - STEP * RULER * s - 120));
    this.packet.scale.set(0.85);
    this.question.position.set(w / 2 + 80, this.packet.y + 4);
    const bottom = h - (this.view.upright ? 170 : 110);
    this.token.position.set(w / 2, bottom);
    this.undo.position.set(w - 90, bottom);
    this.next.position.set(w - 90, bottom);
  }

  /** The card centre in stage coordinates, for the glow. */
  private cardAt(plot: number, c: Condition) {
    const p = this.plots[plot];
    return { x: p.cardRow.x + p.cards[c].x, y: p.cardRow.y };
  }

  update(dt: number) {
    this.clock += dt;
    for (const p of this.plots) {
      p.bloom.step(dt);
      p.bloom.head.rotation = this.grown ? 0.06 * Math.sin(this.clock * 2 + p.bed.x) : 0;
    }
    const g = this.glow.clear();
    if (this.busy || this.finished) return;
    const pulse = 6 + 2 * Math.sin(this.clock * 6);
    const ring = (x: number, y: number, w: number, h: number, color: number, width = pulse) =>
      g.roundRect(x - w / 2, y - h / 2, w, h, 24).stroke({ width, color });
    if (this.compare && this.found)
      for (let i = 0; i < 2; i++) {
        const c = this.cur.compare!.changed;
        const at = this.cardAt(i, c);
        ring(at.x, at.y, CARD + 14, CARD + 14, swatch.green.fill, 6);
      }
    if (this.hintOn) this.paintHint(ring, pulse);
    // The token calls once there is something to grow.
    const ready =
      this.step === 'grow' || (this.step === 'fair' && this.fairVerdict() === 'fair' && !this.grown);
    if (ready) ring(this.token.x, this.token.y - 4, 190, 150, swatch.yellow.fill, pulse);
  }

  private paintHint(
    ring: (x: number, y: number, w: number, h: number, color: number, width?: number) => Graphics,
    pulse: number,
  ) {
    const r = this.cur;
    if (this.step === 'pick') {
      for (let i = 0; i < 2; i++) {
        const at = this.cardAt(i, r.compare!.changed);
        ring(at.x, at.y, CARD + 14, CARD + 14, swatch.yellow.fill, pulse);
      }
    } else if (this.step === 'which') {
      const i = r.compare!.taller === 'a' ? 0 : 1;
      const p = this.plots[i];
      ring(p.bed.x, p.bed.y - 70 * this.scale, 250 * this.scale, 210 * this.scale, swatch.yellow.fill, pulse);
    } else if (this.step === 'fair') {
      const c = fairHint(this.plots[0].setup, this.plots[1].setup, r.ask!);
      if (c) {
        const at = this.cardAt(1, c);
        ring(at.x, at.y, CARD + 14, CARD + 14, swatch.yellow.fill, pulse);
      }
    }
  }

  private fairVerdict() {
    return judgeFair(this.plots[0].setup, this.plots[1].setup, this.cur.ask!);
  }

  private async miss(say: () => Promise<void>) {
    this.busy = true;
    this.misses++;
    this.wrongs++;
    sfx.boing();
    await say();
    if (this.wrongs >= 2 && !this.hintOn) {
      this.hints++;
      this.hintOn = true;
    }
    this.busy = false;
  }

  private setStep(step: Step) {
    this.step = step;
    this.wrongs = 0;
    this.hintOn = false;
  }

  private async tapCard(plot: number, c: Condition) {
    if (this.busy || this.finished) return;
    const r = this.cur;
    if (this.compare) {
      if (this.step !== 'pick') return;
      if (c === r.compare!.changed) {
        this.found = true;
        this.setStep('grow');
        sfx.sparkle();
        return void this.ctx.say('grow.cond.grow');
      }
      return this.miss(() => this.ctx.say('grow.cond.same'));
    }
    // Level 13: only the second bed's cards flip, before the round and after it (free exploration).
    if (plot !== 1 || (this.step !== 'fair' && this.step !== 'free')) return;
    const p = this.plots[1];
    p.setup = flipped(p.setup, c);
    sfx.pop();
    this.paintCards(p);
    this.hintOn = false;
    this.undo.visible = this.step === 'fair' && differing(this.plots[0].setup, p.setup).length > 0;
  }

  private tapUndo() {
    if (this.busy || this.step !== 'fair') return;
    this.plots[1].setup = { ...this.plots[0].setup };
    this.paintCards(this.plots[1]);
    this.undo.visible = false;
    sfx.pop();
  }

  private async tapToken() {
    if (this.busy || this.finished) return;
    if (this.compare) {
      if (this.step === 'pick') return void this.ctx.say('grow.cond.look');
      return this.growBoth();
    }
    if (this.step === 'free') return this.growBoth();
    const r = this.cur;
    const v = this.fairVerdict();
    const cond = WORD[r.ask!];
    const other = WORD[CONDITIONS.find((c) => c !== r.ask)!];
    if (v === 'none') return this.miss(() => this.ctx.say('grow.fair.none', { cond }));
    if (v === 'other') return this.miss(() => this.ctx.say('grow.fair.other', { cond, other }));
    if (v === 'two') return this.miss(() => this.ctx.say('grow.fair.two', { other }));
    // A fair test: both beds grow, the result is spoken, and the round counts.
    this.undo.visible = false;
    await this.growBoth();
    this.busy = true;
    sfx.sparkle();
    this.ctx.pet.cheer();
    await this.ctx.say('grow.fair.result', this.resultVars(r.ask!));
    this.setStep('free');
    this.next.visible = true;
    this.busy = false;
  }

  /** The bed with more of the condition grew taller. */
  private resultVars(c: Condition) {
    return { cond: WORD[c], what: moreOf(c) };
  }

  /** Both beds grow five stages at once, then the rulers show their heights. Free to replay. */
  private async growBoth() {
    this.busy = true;
    this.grown = false;
    sfx.whoosh();
    for (const p of this.plots) {
      p.ruler.visible = false;
      p.flag.visible = false;
      p.bloom.setReach(growthHeight(p.setup) / RULER);
      p.bloom.setStage(1);
    }
    for (let stage = 2; stage <= 5; stage++) {
      await this.ctx.tw.wait(0.6);
      for (const p of this.plots) p.bloom.setStage(stage);
    }
    await this.ctx.tw.wait(0.5);
    for (const p of this.plots) {
      p.ruler.visible = true;
      p.flag.visible = true;
      p.flag.y = -STEP * growthHeight(p.setup);
    }
    this.grown = true;
    if (this.compare && this.step === 'grow') {
      this.setStep('which');
      await this.ctx.say('grow.cond.which');
    } else if (!this.compare && this.step === 'free') {
      const d = differing(this.plots[0].setup, this.plots[1].setup);
      if (d.length === 2) await this.ctx.say('grow.fair.both');
      else if (d.length === 1) await this.ctx.say('grow.fair.result', this.resultVars(d[0]));
    }
    this.busy = false;
  }

  private async tapBed(plot: number) {
    if (this.busy || this.finished || !this.compare || this.step !== 'which') return;
    const r = this.cur.compare!;
    if (plot === (r.taller === 'a' ? 0 : 1)) {
      this.busy = true;
      sfx.sparkle();
      this.ctx.pet.cheer();
      await this.ctx.say('grow.cond.result', { what: moreOf(r.changed) });
      await this.ctx.tw.wait(0.3);
      return void this.begin();
    }
    const a = growthHeight(this.plots[plot].setup);
    const b = growthHeight(this.plots[1 - plot].setup);
    return this.miss(() => this.ctx.say('grow.cond.count', { a, b }));
  }

  private async tapNext() {
    if (this.busy || this.step !== 'free') return;
    this.busy = true;
    this.next.visible = false;
    await this.begin();
  }

  /** The ghost finger: find the difference, grow, and tap the taller bed (12); set the one fair flip, grow, go on (13). */
  autotouch(): TouchIntent | null {
    if (this.busy || this.finished || this.round < 0 || this.round >= this.rounds.length) return null;
    const r = this.cur;
    if (this.compare) {
      if (this.step === 'pick') return { tap: { on: this.plots[0].cards[r.compare!.changed] } };
      if (this.step === 'grow') return { tap: { on: this.token } };
      return { tap: { on: this.plots[r.compare!.taller === 'a' ? 0 : 1].bed } };
    }
    if (this.step === 'free') return { tap: { on: this.next } };
    const c = fairHint(this.plots[0].setup, this.plots[1].setup, r.ask!);
    if (c) return { tap: { on: this.plots[1].cards[c] }, pause: 0.35 };
    return { tap: { on: this.token } };
  }

  /** A test hook: the one B setup that answers the question. */
  get answer(): Setup {
    return fairAnswer(this.plots[0].setup, this.cur.ask!);
  }

  destroy() {}

  private async finale() {
    if (this.finished) return;
    this.finished = true;
    this.busy = true;
    sfx.tada();
    await this.ctx.say('grow.done');
    await this.ctx.tw.wait(0.4);
    this.ctx.finish({ misses: this.misses, hints: this.hints });
  }
}
