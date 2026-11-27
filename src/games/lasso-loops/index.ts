import { Circle, Container, Graphics, Rectangle, type FederatedPointerEvent } from 'pixi.js';
import { ink, swatch, wood } from '../../art/palette';
import { paperRect, U } from '../../art/paper';
import { Backdrop } from '../../art/scenery';
import { STYLES } from '../../audio/music';
import { sfx } from '../../audio/sfx';
import { onTap, palmOnGlass } from '../../engine/input';
import { Rng } from '../../engine/random';
import { ease } from '../../engine/tween';
import type { View } from '../../engine/view';
import { rangeFor } from '../../progress/difficulty';
import { RoundButton } from '../../ui/buttons';
import { checkIcon } from '../../ui/icons';
import { label } from '../../ui/text';
import { WigglyIcon } from '../shared';
import type { Game, GameContext, GameModule, TouchIntent } from '../types';
import {
  DONE_R,
  GUESS_HIT,
  JAR_H,
  JAR_W,
  LEAF_HIT,
  LEVELS,
  RANGE_HIT,
  choices,
  compareGuess,
  demoLoop,
  guessCards,
  gridFor,
  hasLeaf,
  inside,
  lassoLayout,
  leafSlot,
  makeCountLine,
  makeHint,
  makeLoop,
  makeNext,
  makeRound,
  makeTotal,
  nearestGroup,
  planFor,
  rangeCards,
  rangeSide,
  scatter,
  shiftHint,
  shiftMistake,
  shiftTargets,
  tallField,
  type LassoLayout,
  type LassoPlan,
  type LassoRound,
  type MakeState,
  type Point,
} from './logic';

const line = (color: number, width = 5) => ({ width, color, join: 'round' as const, cap: 'round' as const });

/** A glowing little bug: a yellow tail light, a dark head and see-through wings. */
class Firefly extends Container {
  readonly halo = new Graphics().circle(0, 0, 30).fill({ color: swatch.yellow.light, alpha: 0.45 });
  readonly ring = new Graphics().circle(0, 0, 32).stroke({ width: 5, color: 0xffffff });
  /** Where it hovers, in play-area fractions; null once caught. */
  spot: Point | null;
  /** Where it started, so a firefly let go at level 8 can fly back. */
  readonly home: Point;
  caught = false;
  private clock = Math.random() * 6;
  private readonly body = new Container();

  constructor(spot: Point) {
    super();
    this.spot = spot;
    this.home = spot;
    const g = new Graphics()
      .ellipse(-9, -10, 9, 6)
      .ellipse(9, -10, 9, 6)
      .fill({ color: 0xffffff, alpha: 0.7 })
      .ellipse(0, 4, 9, 12)
      .fill(swatch.yellow.fill)
      .stroke(line(swatch.yellow.line, 3))
      .circle(0, -8, 7)
      .fill(ink);
    this.body.addChild(g);
    this.ring.visible = false;
    this.addChild(this.halo, this.ring, this.body);
  }

  update(dt: number) {
    this.clock += dt;
    this.halo.alpha = 0.6 + 0.35 * Math.sin(this.clock * 3);
    this.body.y = this.caught ? 0 : 5 * Math.sin(this.clock * 1.7);
    this.body.x = this.caught ? 0 : 3 * Math.sin(this.clock * 1.1);
    if (this.ring.visible) this.ring.alpha = 0.5 + 0.5 * Math.sin(this.clock * 7);
  }
}

/** The jar's pale paper and its crayon edge. */
const JAR_GLASS = 0xe4f0f4;
const JAR_EDGE = 0x8fb0c0;

class Jar extends Container {
  readonly glow = new Graphics()
    .roundRect(-JAR_W / 2 - 14, -JAR_H - 34, JAR_W + 28, JAR_H + 48, 26)
    .fill({ color: 0xfff3a0, alpha: 0.85 });
  readonly flies: Firefly[] = [];
  private readonly tag = new Container();

  constructor(readonly want: number) {
    super();
    this.glow.visible = false;
    // A paper jar: a pale sheet with a soft blue crayon edge and a flat paper strip for the shine (not glossy glass),
    // so it sits with the paper hills; the fireflies fly in front of it.
    const g = new Graphics();
    paperRect(g, -JAR_W / 2, -JAR_H, JAR_W, JAR_H, 22, JAR_GLASS, { line: JAR_EDGE, amp: 0.8 * U });
    paperRect(g, -JAR_W / 2 + 12, -JAR_H + 18, 10, JAR_H - 46, 5, 0xffffff, { flat: true, alpha: 0.7 });
    paperRect(g, -JAR_W / 2 + 8, -JAR_H - 22, JAR_W - 16, 24, 8, wood.fill);
    this.addChild(this.glow, g, this.tag);
    this.setTag(want ? String(want) : '');
  }

  /** The jar's number: how many it wants, then how many it holds. */
  setTag(text: string) {
    this.tag.removeChildren().forEach((c) => c.destroy());
    if (!text) return;
    const badge = new Graphics()
      .circle(0, -JAR_H - 46, 26)
      .fill(0xffffff)
      .stroke(line(wood.line, 4));
    const t = label(text, 30, ink);
    t.position.set(0, -JAR_H - 46);
    this.tag.addChild(badge, t);
  }

  /** Where the k-th firefly sits inside, two to a row from the bottom. */
  slot(k: number, of: number) {
    const cols = of > 2 ? 2 : 1;
    const rows = Math.ceil(of / cols);
    const r = Math.floor(k / cols);
    const c = k % cols;
    return { x: (c - (cols - 1) / 2) * 42, y: -20 - (r * (JAR_H - 40)) / Math.max(1, rows - 1) };
  }
}

class Pad extends Container {
  readonly glow = new Graphics().circle(0, 0, 76).fill({ color: 0xfff3a0, alpha: 0.85 });

  constructor(readonly value: number) {
    super();
    this.glow.visible = false;
    const n = label(String(value), 52, 0xffffff);
    n.style.stroke = { color: swatch.purple.line, width: 8, join: 'round' };
    this.addChild(
      this.glow,
      new Graphics().circle(0, 0, 60).fill(swatch.purple.fill).stroke(line(swatch.purple.line, 6)),
      n,
    );
    this.hitArea = new Circle(0, 0, 70);
  }
}

/** Estimates use wooden signs, distinct from the purple count pads; level 7's five number cards are a smaller size. */
class GuessCard extends Container {
  readonly glow: Graphics;

  constructor(
    readonly value: number,
    selected: boolean,
    /** Level 7: the card's place in the row of five, kept as cards leave. */
    readonly slot = -1,
  ) {
    super();
    const small = slot >= 0;
    const w = small ? 120 : 130;
    this.glow = new Graphics()
      .roundRect(-w / 2 - 14, -69, w + 28, 138, 22)
      .fill({ color: 0xfff3a0, alpha: 0.85 });
    this.glow.visible = false;
    this.addChild(
      this.glow,
      new Graphics()
        .roundRect(-w / 2, -55, w, 110, 12)
        .fill(wood.fill)
        .stroke(line(wood.line, 5)),
      label(String(value), small ? 48 : 52, ink),
    );
    if (selected) this.addChild(new Graphics().roundRect(-70, -60, 140, 120, 16).stroke(line(0xffffff, 5)));
    const hit = small ? RANGE_HIT : GUESS_HIT;
    this.hitArea = new Rectangle(-hit.w / 2, -hit.h / 2, hit.w, hit.h);
  }
}

/** An empty jar drawn in dots: room on level 7's shelf. A picture, never a target. */
function jarOutline(): Graphics {
  const g = new Graphics();
  const x0 = -JAR_W / 2;
  const y0 = -JAR_H;
  const dots: Point[] = [];
  for (let x = x0; x <= -x0; x += 18) dots.push({ x, y: y0 }, { x, y: 0 });
  for (let y = y0 + 18; y < 0; y += 18) dots.push({ x: x0, y }, { x: -x0, y });
  for (const d of dots) g.circle(d.x, d.y, 4);
  g.fill({ color: 0xffffff, alpha: 0.75 });
  return g;
}

class LassoLoops implements Game {
  readonly plan: LassoPlan;
  readonly round: LassoRound;
  readonly flies: Firefly[] = [];
  readonly jars: Jar[] = [];
  pads: Pad[] = [];
  guessCards: GuessCard[] = [];
  guess: number | null = null;
  readonly guessSign = new Container();
  private readonly guessNumber = label('', 44, ink);
  private estimates?: { cards: number[]; near: number };
  /** Level 7's five number cards and the one that could be right. */
  private ranges?: { cards: number[]; possible: number };
  private guessPhase: 'first' | 'benchmark' | 'revise' | 'range' | 'count' = 'count';
  /** Level 7: the three empty jar outlines beside the full jar. */
  private readonly outlines = new Container();
  /** Level 7: taps on the card that could be right; separate from the loop counter, so it never rings a loop hint. */
  private rangeMisses = 0;
  /** Level 7 sideways: a soft dusk band behind the cards, so they read as a layer above the meadow. */
  private rangeBand: Graphics | null = null;
  private rangeHinted = false;
  private readonly guessLayer = new Container();
  /** The jar being filled. */
  index = 0;
  misses = 0;
  hints = 0;
  busy = true;
  finished = false;
  /** The next ask, waiting behind a count's or a guess's line (U7 R4): said when the line ends or the guide is tapped. */
  private unasked: (() => void) | null = null;
  /** The latest loop, in stage coordinates, for checks. */
  lastLoop: Point[] = [];
  readonly sky = new Graphics();
  readonly leaf = new Graphics();
  /** The fireflies resting on the leaf, in the order they landed. */
  readonly leafFlies: Firefly[] = [];
  /** Level 8: nine hollow places on the leaf, its hint glow, the tick, and the wrong ticks so far. */
  private readonly leafDots = new Graphics();
  readonly leafGlow = new Graphics().ellipse(0, -8, 112, 74).fill({ color: 0xfff3a0, alpha: 0.85 });
  doneButton: RoundButton | null = null;
  private makeWrongs = 0;
  private makeHinted = false;
  /** Level 9: the round's two numbers, which one is asked for now, and what the jars and the leaf held when it was asked. */
  private readonly shiftTargets: number[] = [];
  private shiftIndex = 0;
  private shiftFrom: MakeState = { jars: 0, leaf: 0 };

  private readonly backdrop: Backdrop;
  private readonly trail = new Graphics();
  private readonly flyLayer = new Container();
  private readonly padLayer = new Container();
  private touch: { id: number; points: Point[] } | null = null;
  private area = { x: 0, y: 0, w: 0, h: 0 };
  private L: LassoLayout;
  private wrongs = 0;
  private hinted = false;
  private readonly grid: { cols: number; rows: number };

  constructor(private readonly ctx: GameContext) {
    this.plan = planFor(ctx.level);
    this.round = makeRound(this.plan, ctx.rng);
    this.backdrop = ctx.track(
      new Backdrop(
        {
          sky: [swatch.purple.line, swatch.blue.line],
          hills: [swatch.teal.line, swatch.green.line, 0x3f7f2e],
          horizon: 0.72,
          clouds: 0,
          sun: false,
          seed: 19,
        },
        ctx.view,
      ),
    );
    this.L = this.layout(ctx.view);
    // An upright phone's field is taller than wide, so the grid turns with it (the same number of cells).
    this.grid = gridFor(this.round.fireflies, tallField(this.L));
    for (const spot of scatter(this.round.fireflies, ctx.rng, this.grid.cols, this.grid.rows)) {
      const f = ctx.track(new Firefly(spot));
      this.flies.push(f);
      this.flyLayer.addChild(f);
    }
    for (const want of this.round.jars) {
      const jar = new Jar(want);
      this.jars.push(jar);
    }
    if (this.plan.range) {
      this.ranges = rangeCards(this.round.fireflies, ctx.rng);
      this.guessPhase = 'benchmark';
      this.jars.forEach((j, i) => (j.visible = i === 0));
      for (let k = 0; k < 3; k++) this.outlines.addChild(jarOutline());
    }
    if (this.plan.guess) {
      this.estimates = guessCards(this.round.fireflies, ctx.rng);
      this.guessPhase = 'first';
      this.jars.forEach((j) => (j.visible = false));
    }
    const make = this.plan.mode === 'make';
    if (this.plan.guess || this.plan.range || make) {
      const bug = new Firefly({ x: 0, y: 0 });
      bug.position.set(-52, 0);
      this.guessNumber.x = 24;
      this.guessSign.addChild(
        new Graphics().roundRect(-85, -45, 170, 90, 12).fill(wood.fill).stroke(line(wood.line, 4)),
        bug,
        this.guessNumber,
      );
    }
    this.guessSign.visible = false;
    this.guessSign.eventMode = 'none';
    this.outlines.eventMode = 'none';
    this.leaf.visible = false;
    this.leafGlow.visible = false;
    this.leafGlow.eventMode = 'none';
    this.leafDots.eventMode = 'none';
    if (make) {
      // The sign says the number; the leaf is out from the start with nine places, and a jar or the leaf is tapped to
      // let its fireflies go. They stand below the loop layer, whose touch area ends above them.
      this.guessNumber.text = String(this.round.target);
      this.guessSign.visible = true;
      this.leaf.visible = true;
      for (let k = 0; k < 9; k++) this.leafDots.circle(leafSlot(k).x, leafSlot(k).y, 11);
      this.leafDots.stroke({ width: 3, color: 0xffffff, alpha: 0.7 });
      this.leaf.hitArea = new Rectangle(-LEAF_HIT.w / 2, -8 - LEAF_HIT.h / 2, LEAF_HIT.w, LEAF_HIT.h);
      onTap(this.leaf, () => void this.release(this.leafFlies));
      for (const jar of this.jars) {
        jar.hitArea = new Rectangle(-JAR_W / 2, -JAR_H, JAR_W, JAR_H);
        onTap(jar, () => void this.release(jar.flies));
      }
      this.doneButton = new RoundButton(checkIcon(), swatch.green, DONE_R, () => void this.tapDone());
    }
    if (this.round.start) {
      // Level 9 opens with the number already caught: full jars and the ones on the leaf (`resize` places them). Each
      // keeps its place in the meadow as home, so a jar let go flies back there.
      this.shiftTargets = shiftTargets(this.round);
      this.shiftFrom = this.round.start;
      let k = 0;
      const hold = (into: Firefly[], small: boolean) => {
        const f = this.flies[k++];
        f.caught = true;
        f.spot = null;
        if (small) f.scale.set(0.72);
        into.push(f);
      };
      for (let j = 0; j < this.round.start.jars; j++)
        for (let i = 0; i < 10; i++) hold(this.jars[j].flies, true);
      for (let i = 0; i < this.round.start.leaf; i++) hold(this.leafFlies, false);
    }
    this.sky.eventMode = 'static';
    this.sky.on('pointerdown', (e) => this.down(e));
    this.sky.on('globalpointermove', (e) => this.move(e));
    this.sky.on('pointerup', (e) => this.up(e));
    this.sky.on('pointerupoutside', (e) => this.up(e));
    this.sky.on('pointercancel', (e) => this.cancel(e));
    this.trail.eventMode = 'none';
    this.flyLayer.eventMode = 'none';
    // The loop layer catches touches over the meadow; jars and answer pads sit above it.
    ctx.stage.addChild(
      this.backdrop,
      this.leafGlow,
      this.leaf,
      this.leafDots,
      this.outlines,
      ...this.jars,
      this.flyLayer,
      this.sky,
      this.trail,
      this.padLayer,
      this.guessLayer,
      this.guessSign,
    );
    if (this.doneButton) ctx.stage.addChild(this.doneButton);
  }

  start() {
    void this.intro();
  }

  resize(v: View) {
    this.backdrop.resize(v);
    const L = (this.L = this.layout(v));
    this.area = L.field;
    this.sky.hitArea = new Rectangle(L.sky.x, L.sky.y, L.sky.w, L.sky.h);
    for (const f of this.flies) if (f.spot && !this.ctx.tw.busy(f)) f.position.copyFrom(this.place(f.spot));
    this.jars.forEach((j, i) => {
      if (this.ctx.tw.busy(j)) return;
      j.position.copyFrom(this.onShelf && i === 0 ? L.shelf[0] : L.jars[i]);
      j.flies.forEach((f, k) => {
        if (this.ctx.tw.busy(f)) return;
        const s = j.slot(k, j.want || j.flies.length);
        f.position.set(j.x + s.x, j.y + s.y);
      });
    });
    this.leaf
      .clear()
      .moveTo(-90, 0)
      .bezierCurveTo(-60, -70, 60, -70, 90, 0)
      .bezierCurveTo(60, 50, -60, 50, -90, 0)
      .fill(swatch.green.fill)
      .stroke(line(swatch.green.line, 5))
      .moveTo(-80, 0)
      .lineTo(80, 0)
      .stroke(line(swatch.green.line, 4));
    this.leaf.position.copyFrom(L.leaf);
    this.leafDots.position.copyFrom(L.leaf);
    this.leafGlow.position.copyFrom(L.leaf);
    this.leafFlies.forEach((f, k) => {
      if (!this.ctx.tw.busy(f)) f.position.set(L.leaf.x + leafSlot(k).x, L.leaf.y + leafSlot(k).y);
    });
    this.doneButton?.position.copyFrom(L.done);
    this.outlines.children.forEach((o, k) => o.position.copyFrom(L.shelf[k + 1]));
    this.layoutPads();
    this.layoutGuesses();
    this.guessSign.position.copyFrom(L.sign);
  }

  private layout(v: View) {
    return lassoLayout(
      v,
      this.round.jars.length,
      hasLeaf(this.round),
      !!this.plan.guess,
      !!this.plan.range,
      this.plan.mode === 'make',
    );
  }

  /** Level 7 before the sensible guess: the full jar stands on the shelf beside the outlines. */
  private get onShelf() {
    return this.guessPhase === 'benchmark' || this.guessPhase === 'range';
  }

  private place(spot: Point) {
    return { x: this.area.x + spot.x * this.area.w, y: this.area.y + spot.y * this.area.h };
  }

  update() {}

  autotouch(): TouchIntent | null {
    if (this.busy || this.finished || this.touch) return null;
    if (this.guessCards.length && this.guessPhase === 'range') {
      // Tap away the lowest number that cannot be right; never the one that could be.
      const card = this.guessCards.find((c) => rangeSide(c.value) !== 'possible');
      return card ? { tap: { on: card }, pause: 0.12 } : null;
    }
    if (this.guessCards.length) {
      const value = this.guessPhase === 'first' ? this.estimates!.near : this.guess;
      const card = this.guessCards.find((c) => c.value === value);
      return card ? { tap: { on: card }, pause: 0.12 } : null;
    }
    if (this.pads.length) {
      const right = this.pads.find((p) => p.value === this.round.answer);
      return right ? { tap: { on: right }, pause: 0.12 } : null;
    }
    const free = this.free;
    if (this.plan.mode === 'make') {
      // Level 9: a whole jar in or out (the same steps as its hint), then the tick.
      const step = this.plan.shift ? shiftHint(this.target, this.makeState) : null;
      if (step?.part === 'jar-remove')
        return { tap: { on: this.lastFullJar!, x: 0, y: -JAR_H / 2 }, pause: 0.12 };
      if (step?.part === 'leaf-remove') return { tap: { on: this.leaf, x: 0, y: -8 }, pause: 0.12 };
      // Tens, then the ones, then the tick.
      const n = this.plan.shift
        ? step?.part === 'jar-add'
          ? 10
          : step?.part === 'ones'
            ? step.d
            : 0
        : makeNext(this.target, this.makeState);
      if (!n) return { tap: { on: this.doneButton! }, pause: 0.12 };
      const loop = demoLoop(
        free.map((f) => ({ x: f.x, y: f.y })),
        n,
        34,
      );
      if (!loop) return null;
      const via = loop.loop.map((p) => ({ on: this.sky, x: p.x, y: p.y }));
      return { trace: via[0], via: via.slice(1), pause: 0.12 };
    }
    const jar = this.jar;
    if (!jar || !free.length) return null;
    const want =
      this.plan.mode === 'free' ? Math.ceil(free.length / (this.jars.length - this.index)) : jar.want;
    const move = demoLoop(
      free.map((f) => ({ x: f.x, y: f.y })),
      want,
      34,
    );
    if (!move) return null;
    const spots = move.loop.map((p) => ({ on: this.sky, x: p.x, y: p.y }));
    return { trace: spots[0], via: spots.slice(1), pause: 0.12 };
  }

  destroy() {
    this.touch = null;
  }

  get jar(): Jar | undefined {
    // Level 8 lets jars go again, so the next jar is the first empty one.
    if (this.plan.mode === 'make') return this.jars.find((j) => !j.flies.length);
    return this.jars[this.index];
  }

  /** The jar a "let a jar go" hint glows: the last full one. */
  private get lastFullJar(): Jar | undefined {
    return [...this.jars].reverse().find((j) => j.flies.length);
  }

  /** Levels 8 and 9: the number on the sign (at level 9, the ask in hand). */
  get target(): number {
    return this.shiftTargets[this.shiftIndex] ?? this.round.target!;
  }

  /** Levels 8 and 9: the full jars and the fireflies on the leaf. */
  get makeState(): MakeState {
    return { jars: this.jars.filter((j) => j.flies.length).length, leaf: this.leafFlies.length };
  }

  get free(): Firefly[] {
    return this.flies.filter((f) => !f.caught);
  }

  private async intro() {
    if (this.plan.range) {
      this.markJar();
      await this.ctx.instruct('lasso.benchmark');
      this.busy = false;
      return;
    }
    if (this.plan.guess) {
      this.showGuesses();
      await this.ctx.instruct('lasso.guess');
      this.busy = false;
      return;
    }
    const r = this.round;
    if (this.plan.shift) {
      await this.askShift();
      this.busy = false;
      return;
    }
    if (this.plan.mode === 'make') {
      await this.ctx.instruct('lasso.make', { n: r.target! });
      this.busy = false;
      return;
    }
    switch (this.plan.mode) {
      case 'free':
        await this.ctx.instruct('lasso.free');
        break;
      case 'exact':
        await this.ctx.instruct('lasso.exact', { n: r.jars[0] });
        break;
      case 'fives':
        await this.ctx.instruct('lasso.fives');
        break;
      case 'tens':
        await this.ctx.instruct('lasso.tens');
        break;
      case 'groups':
        await this.ctx.instruct('lasso.groups', { g: r.group!.count, s: r.group!.size });
        break;
    }
    this.markJar();
    this.busy = false;
  }

  private layoutGuesses() {
    if (this.guessPhase === 'range') {
      for (const c of this.guessCards)
        if (!this.ctx.tw.busy(c)) c.position.copyFrom(this.L.rangeCards[c.slot]);
      // Upright the cards have their own row; sideways they stand over the fireflies.
      const spots = this.L.rangeCards;
      this.rangeBand?.clear();
      if (this.rangeBand && !this.L.upright)
        this.rangeBand
          .roundRect(
            spots[0].x - RANGE_HIT.w / 2 - 24,
            spots[0].y - RANGE_HIT.h / 2 - 16,
            spots[4].x - spots[0].x + RANGE_HIT.w + 48,
            RANGE_HIT.h + 32,
            28,
          )
          .fill({ color: swatch.purple.line, alpha: 0.55 });
      return;
    }
    const spots = this.guessPhase === 'revise' ? this.L.guessRevise : this.L.guessFirst;
    this.guessCards.forEach((c, i) => c.position.copyFrom(spots[i]));
  }

  // Level 7: tap away the numbers that cannot be right. ---------------------------------------------

  private showRangeCards() {
    // The band goes with the cards when the last one becomes the sign (the layer is emptied then).
    this.rangeBand = new Graphics();
    this.rangeBand.eventMode = 'none';
    this.guessLayer.addChild(this.rangeBand);
    this.guessCards = this.ranges!.cards.map((value, slot) => {
      const card = new GuessCard(value, false, slot);
      onTap(card, () => void this.tapRange(card));
      card.scale.set(0);
      this.guessLayer.addChild(card);
      void this.ctx.tw.to(card.scale, { x: 1, y: 1 }, { duration: 0.3, ease: ease.outBack });
      return card;
    });
    this.layoutGuesses();
  }

  private async tapRange(card: GuessCard) {
    if (this.busy || this.finished || !this.guessCards.includes(card)) return;
    this.busy = true;
    this.unasked = null;
    sfx.bell(6, 0.2);
    await this.ctx.tw.to(card.scale, { x: 0.9, y: 0.9 }, { duration: 0.08 });
    const side = rangeSide(card.value);
    if (side === 'possible') {
      // It could be right: one miss, it stays, and the jar and the shelf show why.
      this.misses++;
      this.rangeMisses++;
      sfx.boing();
      void this.ctx.tw.to(card.scale, { x: 1, y: 1 }, { duration: 0.12 });
      const x = card.x;
      void this.ctx.tw
        .to(card, { x: x + 12 }, { duration: 0.06 })
        .then(() => this.ctx.tw.to(card, { x }, { duration: 0.3, ease: ease.outElastic }));
      this.bounce(this.jars[0]);
      for (const o of this.outlines.children) this.bounce(o as Container);
      await this.ctx.say('lasso.could-be', { g: card.value });
      if (this.rangeMisses >= 2) {
        if (!this.rangeHinted) {
          this.rangeHinted = true;
          this.hints++;
        }
        for (const c of this.guessCards) c.glow.visible = rangeSide(c.value) !== 'possible';
        void this.ctx.say('lasso.range-hint');
      }
      this.busy = false;
      return;
    }
    // Too few or too many: the card leaves with its reason.
    sfx.pop(7);
    const line = this.ctx.say(side === 'few' ? 'lasso.too-few' : 'lasso.too-many', { g: card.value });
    await this.ctx.tw.to(card.scale, { x: 0, y: 0 }, { duration: 0.25, ease: ease.inQuad });
    this.guessCards = this.guessCards.filter((c) => c !== card);
    card.destroy();
    if (this.guessCards.length > 1) {
      this.busy = false;
      return;
    }
    await line;
    if (this.finished) return;
    await this.sensible(this.guessCards[0]);
  }

  /** Only the card that could be right is left: it becomes the guess, and the tens round checks it. */
  private async sensible(card: GuessCard) {
    this.guess = card.value;
    card.glow.visible = false;
    const line = this.ctx.say('lasso.sensible', { g: card.value });
    await this.ctx.tw.to(card, { x: this.guessSign.x, y: this.guessSign.y }, { duration: 0.4 });
    this.guessNumber.text = String(this.guess);
    this.guessSign.visible = true;
    this.guessCards = [];
    this.rangeBand = null;
    this.guessLayer.removeChildren().forEach((c) => c.destroy());
    await line;
    if (this.finished) return;
    // The outlines fade, the full jar (and its fireflies) moves to its place in the round, and the other jars come out.
    this.guessPhase = 'count';
    const jar = this.jars[0];
    const to = this.L.jars[0];
    const dx = to.x - jar.x;
    const dy = to.y - jar.y;
    void this.ctx.tw.to(this.outlines, { alpha: 0 }, { duration: 0.4 });
    for (const f of jar.flies)
      void this.ctx.tw.to(f, { x: f.x + dx, y: f.y + dy }, { duration: 0.5, ease: ease.inOutSine });
    await this.ctx.tw.to(jar, { x: to.x, y: to.y }, { duration: 0.5, ease: ease.inOutSine });
    if (this.finished) return;
    this.outlines.visible = false;
    this.jars.forEach((j) => (j.visible = true));
    this.resize(this.ctx.view);
    this.markJar();
    this.busy = false;
    void this.ctx.instruct('lasso.tens');
  }

  private showGuesses() {
    this.guessCards = this.estimates!.cards.map((value) => {
      const card = new GuessCard(value, value === this.guess);
      onTap(card, () => void this.chooseGuess(card));
      this.guessLayer.addChild(card);
      return card;
    });
    this.layoutGuesses();
  }

  private async chooseGuess(card: GuessCard) {
    if (this.busy || this.finished) return;
    this.busy = true;
    this.unasked = null;
    const first = this.guessPhase === 'first';
    const kept = card.value === this.guess;
    this.guess = card.value;
    sfx.bell(6, 0.2);
    await this.ctx.tw.to(card.scale, { x: 0.9, y: 0.9 }, { duration: 0.08 });
    await this.ctx.tw.to(card.scale, { x: 1, y: 1 }, { duration: 0.12 });
    // Her estimate's reaction never holds the board (U7 R4): the card flies to the sign while it plays, the loops open,
    // and the next instruction waits for the line.
    const line = this.ctx.say(first ? 'lasso.guessed' : kept ? 'lasso.keep' : 'lasso.changed', {
      g: this.guess,
    });
    await Promise.all(
      this.guessCards.map((c) =>
        c === card
          ? this.ctx.tw.to(c, { x: this.guessSign.x, y: this.guessSign.y }, { duration: 0.35 })
          : this.ctx.tw.to(c.scale, { x: 0, y: 0 }, { duration: 0.25 }),
      ),
    );
    this.guessNumber.text = String(this.guess);
    this.guessSign.visible = true;
    this.guessCards = [];
    this.guessLayer.removeChildren().forEach((c) => c.destroy());
    this.guessPhase = first ? 'benchmark' : 'count';
    this.jars.forEach((j, i) => (j.visible = !first || i === 0));
    this.markJar();
    this.busy = false;
    void this.askAfter(line, () => void this.ctx.instruct(first ? 'lasso.benchmark' : 'lasso.tens'));
  }

  /** The ask waits for `line`, unless she has answered it (a judged loop or card) or the guide said it first. */
  private async askAfter(line: Promise<unknown>, ask: () => void) {
    this.unasked = ask;
    await line;
    if (this.unasked === ask) this.askNow();
  }

  /** Says the waiting ask, if any; true when it did. */
  private askNow() {
    const ask = this.unasked;
    if (!ask || this.finished) return false;
    this.unasked = null;
    ask();
    return true;
  }

  /** The guide was tapped while the next ask waits: say that ask, not the last one. */
  sayWaitingAsk() {
    return this.askNow();
  }

  /** The jar to fill next glows (except on the free level, where any loop fills the next jar). */
  private markJar() {
    this.jars.forEach(
      (j, i) =>
        (j.glow.visible =
          this.plan.mode !== 'free' && this.plan.mode !== 'make' && i === this.index && !this.finished),
    );
  }

  // Drawing a loop: one finger, palm rejection, and a lost finger just drops the loop. ------------

  private down(e: FederatedPointerEvent) {
    if (this.busy || this.finished || this.guessCards.length || this.touch || palmOnGlass()) return;
    const p = this.ctx.stage.toLocal(e.global);
    this.touch = { id: e.pointerId, points: [{ x: p.x, y: p.y }] };
    sfx.tick();
  }

  private move(e: FederatedPointerEvent) {
    const t = this.touch;
    if (!t || e.pointerId !== t.id) return;
    const p = this.ctx.stage.toLocal(e.global);
    const last = t.points[t.points.length - 1];
    if (Math.hypot(p.x - last.x, p.y - last.y) < 8) return;
    t.points.push({ x: p.x, y: p.y });
    this.drawTrail(t.points);
  }

  private cancel(e: FederatedPointerEvent) {
    if (this.touch?.id !== e.pointerId) return;
    this.touch = null;
    this.trail.clear();
  }

  private up(e: FederatedPointerEvent) {
    const t = this.touch;
    if (!t || e.pointerId !== t.id) return;
    this.touch = null;
    void this.closeLoop(t.points);
  }

  private drawTrail(points: Point[], closed = false) {
    const g = this.trail.clear();
    if (points.length < 2) return;
    g.moveTo(points[0].x, points[0].y);
    for (const p of points.slice(1)) g.lineTo(p.x, p.y);
    if (closed) g.closePath();
    g.stroke({ width: 16, color: swatch.yellow.fill, alpha: 0.35, cap: 'round', join: 'round' });
    g.moveTo(points[0].x, points[0].y);
    for (const p of points.slice(1)) g.lineTo(p.x, p.y);
    if (closed) g.closePath();
    g.stroke({ width: 6, color: 0xffffff, alpha: 0.9, cap: 'round', join: 'round' });
  }

  /** The loop always closes back to where it started, so a nearly-closed loop still counts. */
  async closeLoop(points: Point[]) {
    if (this.busy || this.finished || this.guessCards.length) return;
    let length = 0;
    for (let i = 1; i < points.length; i++)
      length += Math.hypot(points[i].x - points[i - 1].x, points[i].y - points[i - 1].y);
    if (length < 120) {
      this.trail.clear();
      return;
    }
    this.lastLoop = points;
    this.drawTrail(points, true);
    void this.ctx.tw.wait(0.5).then(() => this.trail.clear());
    const got = this.free.filter((f) => inside(points, f.position));
    if (this.plan.mode === 'make') {
      if (!got.length) return void this.ctx.say('lasso.empty');
      return this.makeCatch(got);
    }
    const jar = this.jar;
    if (!jar) return;
    if (!got.length) return void this.ctx.say('lasso.empty');
    // A judged loop answers the waiting ask.
    this.unasked = null;
    if (this.plan.mode !== 'free' && got.length !== jar.want) return this.wrongLoop(got, jar.want);
    await this.catch(got, jar);
  }

  /** The wrong number: they blink, flutter, and stay free. */
  private async wrongLoop(got: Firefly[], want: number) {
    this.busy = true;
    this.misses++;
    this.wrongs++;
    sfx.boing();
    for (const f of got) {
      const x = f.x;
      void this.ctx.tw
        .to(f, { x: x + 10 }, { duration: 0.06 })
        .then(() => this.ctx.tw.to(f, { x }, { duration: 0.3, ease: ease.outElastic }));
    }
    await this.ctx.say('lasso.wrong', { got: got.length, n: want });
    if (this.wrongs >= 2) this.hint(want);
    this.busy = false;
  }

  private hint(n: number) {
    if (!this.hinted) {
      this.hinted = true;
      this.hints++;
    }
    const free = this.free;
    const pts = free.map((f) => ({ x: f.x, y: f.y }));
    const group = nearestGroup(
      pts,
      free.map((_, i) => i),
      n,
    );
    for (const f of this.flies) f.ring.visible = false;
    for (const i of group) free[i].ring.visible = true;
    void this.ctx.say('lasso.hint');
  }

  /** Into the jar they go, counted as they land. */
  private async catch(got: Firefly[], jar: Jar) {
    this.busy = true;
    this.wrongs = 0;
    for (const f of this.flies) f.ring.visible = false;
    await this.intoJar(got, jar);
    jar.setTag(String(got.length));
    jar.glow.visible = false;
    // The count is the lesson, so it plays over her next loop (U7 R4) rather than holding the board; only the last jar's
    // is heard out, before what follows would cut it.
    const line = this.ctx.say('count', { n: got.length });
    this.index++;
    if (this.guessPhase === 'benchmark' && this.plan.range) {
      this.guessPhase = 'range';
      this.showRangeCards();
      this.busy = false;
      void this.askAfter(line, () => void this.ctx.instruct('lasso.range'));
      return;
    }
    if (this.guessPhase === 'benchmark') {
      this.guessPhase = 'revise';
      this.showGuesses();
      this.busy = false;
      void this.askAfter(line, () => void this.ctx.instruct('lasso.change', { g: this.guess! }));
      return;
    }
    if (
      this.plan.mode === 'free'
        ? !this.free.length || this.index >= this.jars.length
        : this.index >= this.jars.length
    ) {
      await line;
      if (this.finished) return;
      return this.plan.mode === 'free' ? this.finale() : this.allFull();
    }
    this.markJar();
    this.busy = false;
    if (this.plan.mode === 'exact') {
      const n = this.jar!.want;
      void this.askAfter(line, () => void this.ctx.instruct('lasso.exact', { n }));
    }
  }

  /** The fireflies fly into the jar one after another, each with its bell. */
  private async intoJar(got: Firefly[], jar: Jar) {
    const of = jar.want || got.length;
    for (const [k, f] of got.entries()) {
      f.caught = true;
      f.spot = null;
      jar.flies.push(f);
      // A jar of ten is full of fireflies: they snuggle up a little smaller.
      if (of > 6) void this.ctx.tw.to(f.scale, { x: 0.72, y: 0.72 }, { duration: 0.45 });
      const s = jar.slot(k, of);
      sfx.bell(4 + Math.min(10, k), 0.2);
      void this.ctx.tw.to(f, { x: jar.x + s.x, y: jar.y + s.y }, { duration: 0.45, ease: ease.inOutSine });
      await this.ctx.tw.wait(0.08);
    }
    await this.ctx.tw.wait(0.4);
    sfx.pop(9);
    // A turn of the screen during the flight moved the jars: settle everything where it stands now.
    if (!this.finished) this.resize(this.ctx.view);
  }

  /** They fly to the leaf's next free places. */
  private async ontoLeaf(got: Firefly[]) {
    for (const f of got) {
      f.caught = true;
      f.spot = null;
      const s = leafSlot(this.leafFlies.length);
      this.leafFlies.push(f);
      void this.ctx.tw.to(
        f,
        { x: this.leaf.x + s.x, y: this.leaf.y + s.y },
        { duration: 0.45, ease: ease.inOutSine },
      );
    }
    await this.ctx.tw.wait(0.6);
    if (!this.finished) this.resize(this.ctx.view);
  }

  // Level 8, Make the number: loops are never wrong, a jar or the leaf can be let go, and the tick is the answer. ----

  private async makeCatch(got: Firefly[]) {
    const step = makeLoop(this.makeState, got.length);
    this.busy = true;
    this.unasked = null;
    if (step.kind === 'over' || step.kind === 'full') {
      // More than a jar holds: they flutter and stay free. Not a miss.
      sfx.boing();
      for (const f of got) {
        const x = f.x;
        void this.ctx.tw
          .to(f, { x: x + 10 }, { duration: 0.06 })
          .then(() => this.ctx.tw.to(f, { x }, { duration: 0.3, ease: ease.outElastic }));
      }
      if (step.kind === 'over') await this.ctx.say('lasso.make-over', { got: got.length });
      this.busy = false;
      return;
    }
    this.clearMakeGlow();
    if (step.kind === 'jar') {
      await this.intoJar(got, this.jar!);
      void this.ctx.say('count', { n: 10 });
    } else {
      got.forEach((_, k) => sfx.bell(4 + Math.min(10, k), 0.2));
      await this.ontoLeaf(got);
      if (step.kind === 'regroup') {
        // Ten on the leaf: the first ten fly into the next jar and the rest settle into the first places.
        void this.ctx.say('lasso.make-regroup');
        await this.intoJar(this.leafFlies.splice(0, 10), this.jar!);
        this.leafFlies.forEach((f, k) => {
          const s = leafSlot(k);
          void this.ctx.tw.to(f, { x: this.leaf.x + s.x, y: this.leaf.y + s.y }, { duration: 0.3 });
        });
        await this.ctx.tw.wait(0.35);
        this.resize(this.ctx.view);
      } else void this.ctx.say('count', { n: this.leafFlies.length });
    }
    this.busy = false;
  }

  /** A tapped jar or the leaf lets its fireflies fly home: a free undo. */
  private async release(held: Firefly[]) {
    if (this.busy || this.finished || this.touch || !held.length) return;
    this.busy = true;
    this.unasked = null;
    this.clearMakeGlow();
    sfx.pop(5);
    void this.ctx.say('lasso.make-undo');
    for (const f of held.splice(0)) {
      f.caught = false;
      f.spot = f.home;
      const to = this.place(f.home);
      void this.ctx.tw.to(f.scale, { x: 1, y: 1 }, { duration: 0.45 });
      void this.ctx.tw.to(f, { x: to.x, y: to.y }, { duration: 0.45, ease: ease.inOutSine });
    }
    await this.ctx.tw.wait(0.5);
    // A turn of the screen during the flight moved the meadow: settle them where it is now.
    for (const f of this.free) f.position.copyFrom(this.place(f.spot!));
    this.busy = false;
  }

  private clearMakeGlow() {
    for (const j of this.jars) j.glow.visible = false;
    this.leafGlow.visible = false;
  }

  /** Level 9: the sign shows the ask's number and the pet says it (ten more or ten less than what is held now). */
  private askShift() {
    this.guessNumber.text = String(this.target);
    return this.ctx.instruct(`lasso.shift-${this.round.asks![this.shiftIndex]}`, {
      n: makeTotal(this.shiftFrom),
      to: this.target,
    });
  }

  /** Level 9: a wrong tick is counted aloud, then named (only the ones changed, or a jar is the thing to move). */
  private async wrongShift(s: MakeState) {
    const ask = this.round.asks![this.shiftIndex];
    await this.ctx.say(`lasso.shift-${shiftMistake(this.shiftFrom, s)}-${ask}`);
    if (this.finished) return;
    if (this.makeWrongs >= 2) {
      // The second wrong tick of an ask glows the part to change; one hint an ask.
      if (!this.makeHinted) {
        this.makeHinted = true;
        this.hints++;
      }
      const hint = shiftHint(this.target, s)!;
      this.clearMakeGlow();
      if (hint.part === 'jar-add') this.jar!.glow.visible = true;
      else if (hint.part === 'jar-remove') this.lastFullJar!.glow.visible = true;
      else this.leafGlow.visible = true;
      if (hint.part === 'ones') void this.ctx.say('lasso.shift-hint-ones', { r: hint.r, d: hint.d });
      else if (hint.part === 'leaf-remove') void this.ctx.say('lasso.shift-hint-leaf-remove', { r: hint.r });
      else void this.ctx.say(`lasso.make-hint-${hint.part}`);
    }
    this.busy = false;
  }

  /** Level 9: the number is made. The first ask leads to the second, from what is held now; the second ends the round. */
  private async rightShift(s: MakeState) {
    const ask = this.round.asks![this.shiftIndex];
    await this.ctx.say(`lasso.shift-right-${ask}`, { from: makeTotal(this.shiftFrom), n: this.target });
    if (this.finished) return;
    if (this.shiftIndex + 1 >= this.shiftTargets.length) return this.finale();
    this.shiftIndex++;
    this.shiftFrom = s;
    this.makeWrongs = 0;
    this.makeHinted = false;
    this.bounce(this.guessSign);
    // The board opens with the ask (U7 R4): the line is the instruction the guide repeats.
    this.busy = false;
    void this.askShift();
  }

  /** The tick: right when the jars and the leaf make the number; otherwise one miss and the count aloud. */
  private async tapDone() {
    if (this.busy || this.finished || this.touch) return;
    const s = this.makeState;
    const n = this.target;
    const got = makeTotal(s);
    this.busy = true;
    this.unasked = null;
    for (const j of this.jars) if (j.flies.length) this.bounce(j);
    if (got === n) {
      this.clearMakeGlow();
      sfx.bell(10, 0.35);
      this.bounce(this.guessSign);
      if (this.plan.shift) return this.rightShift(s);
      if (!s.leaf) await this.ctx.say('lasso.make-right-tens', { t: s.jars, n });
      else if (s.jars === 1) await this.ctx.say('lasso.make-right-teen', { r: s.leaf, n });
      else await this.ctx.say('lasso.make-right-both', { t: s.jars, r: s.leaf, n });
      return this.finale();
    }
    this.misses++;
    this.makeWrongs++;
    sfx.boing();
    await this.ctx.say(`lasso.make-count-${makeCountLine(s)}`, {
      t: s.jars,
      tens: 10 * s.jars,
      r: s.leaf,
      got,
      n,
    });
    if (this.finished) return;
    if (this.plan.shift) return this.wrongShift(s);
    if (this.makeWrongs >= 2) {
      // The second wrong tick glows the part to change; one hint a round.
      if (!this.makeHinted) {
        this.makeHinted = true;
        this.hints++;
      }
      const hint = makeHint(n, s)!;
      this.clearMakeGlow();
      if (hint.part === 'jar-add') this.jar!.glow.visible = true;
      else if (hint.part === 'jar-remove') this.lastFullJar!.glow.visible = true;
      else this.leafGlow.visible = true;
      void this.ctx.say(`lasso.make-hint-${hint.part}`, { d: hint.part === 'more' ? hint.d : 0, n });
    }
    this.busy = false;
  }

  /** Every jar is full: the ones go to the leaf (or the extras fly home), then the question. */
  private async allFull() {
    const r = this.round;
    const rest = this.free;
    if (this.plan.mode === 'exact') return this.finale();
    if (r.ones) {
      this.leaf.visible = true;
      await this.ontoLeaf(rest);
      await this.ctx.say('lasso.left', { r: r.ones });
    } else if (!r.group) {
      // Fives and tens that come out even: no leaf at all.
      await this.ctx.say('lasso.none');
    } else {
      // Groups: the spare fireflies wander off home.
      for (const f of rest) {
        f.caught = true;
        void this.ctx.tw.to(f, { x: f.x + 400, y: f.y - 300, alpha: 0 }, { duration: 1, ease: ease.inQuad });
      }
    }
    this.pads = choices(r, this.ctx.rng).map((n) => {
      const pad = new Pad(n);
      onTap(pad, () => void this.answer(pad), { cooldown: 400 });
      pad.scale.set(0);
      this.padLayer.addChild(pad);
      void this.ctx.tw.to(pad.scale, { x: 1, y: 1 }, { duration: 0.3, ease: ease.outBack });
      return pad;
    });
    this.layoutPads();
    if (r.group) await this.ctx.instruct('lasso.groups-total', { g: r.group.count, s: r.group.size });
    else await this.ctx.instruct('lasso.total');
    this.busy = false;
  }

  private layoutPads() {
    this.pads.forEach((p, i) => p.position.copyFrom(this.L.pads[i]));
  }

  private async answer(pad: Pad) {
    if (this.busy || this.finished) return;
    const r = this.round;
    if (pad.value === r.answer) {
      this.busy = true;
      pad.glow.visible = true;
      sfx.bell(10, 0.35);
      await this.ctx.say('lasso.right', { n: r.answer });
      if (this.plan.range && this.guess !== null) {
        for (const j of this.jars) this.bounce(j);
        this.bounce(this.guessSign);
        await this.ctx.say('lasso.range-end', { g: this.guess, n: r.answer! });
      } else if (this.guess !== null) {
        for (const j of this.jars) this.bounce(j);
        this.bounce(this.guessSign);
        await this.ctx.say(`lasso.guess-${compareGuess(this.guess, r.answer!)}`, {
          g: this.guess,
          n: r.answer!,
        });
      }
      return this.finale();
    }
    this.busy = true;
    this.misses++;
    this.wrongs++;
    sfx.boing();
    await this.countAloud();
    if (this.wrongs >= 2 && !this.hinted) {
      this.hinted = true;
      this.hints++;
    }
    if (this.wrongs >= 2) this.pads.find((p) => p.value === r.answer)!.glow.visible = true;
    this.busy = false;
  }

  /** Count the way the jars show it: by fives or tens or groups, then the ones on the leaf. */
  private async countAloud() {
    const r = this.round;
    if (this.plan.mode === 'tens') {
      for (const j of this.jars) this.bounce(j);
      const t = this.jars.length;
      if (!r.ones) await this.ctx.say('lasso.count-tens-none', { t, n: r.answer! });
      else if (t === 1) await this.ctx.say('lasso.count-teen', { r: r.ones, n: r.answer! });
      else await this.ctx.say('lasso.count-tens', { t, tens: t * 10, r: r.ones, n: r.answer! });
      return;
    }
    let total = 0;
    for (const j of this.jars) {
      total += j.want;
      this.bounce(j);
      sfx.bell(5 + Math.min(8, Math.round(total / 5)), 0.25);
      await this.ctx.say('count', { n: total });
    }
    for (let k = 0; k < r.ones; k++) {
      total++;
      sfx.bell(6 + k, 0.2);
      await this.ctx.say('count', { n: total });
    }
  }

  private bounce(node: Container) {
    void this.ctx.tw
      .to(node.scale, { x: 1.08, y: 1.08 }, { duration: 0.15 })
      .then(() => this.ctx.tw.to(node.scale, { x: 1, y: 1 }, { duration: 0.15 }));
  }

  private async finale() {
    if (this.finished) return;
    this.finished = true;
    this.markJar();
    sfx.tada();
    for (const f of [...this.jars.flatMap((j) => j.flies), ...this.leafFlies])
      this.ctx.particles.burst(f.x, f.y, {
        kind: 'star',
        colors: [0xffd54a, 0xffffff],
        count: 2,
        speed: [60, 140],
        gravity: -30,
        life: [0.5, 0.9],
      });
    await this.ctx.say('lasso.done');
    await this.ctx.tw.wait(0.5);
    this.ctx.finish({ misses: this.misses, hints: this.hints });
  }
}

class LassoIcon extends WigglyIcon {
  constructor() {
    const c = new Container();
    const jar = new Jar(0);
    jar.scale.set(0.8);
    jar.position.set(30, 0);
    c.addChild(jar);
    const loop = new Graphics().ellipse(-60, -150, 62, 44).stroke({ width: 6, color: 0xffffff, alpha: 0.9 });
    c.addChild(loop);
    for (const [x, y] of [
      [-80, -160],
      [-45, -140],
      [-62, -175],
      [30, -40],
      [16, -80],
    ]) {
      const f = new Firefly({ x: 0, y: 0 });
      f.caught = true;
      f.position.set(x, y);
      c.addChild(f);
    }
    super(c);
  }
}

function sticker(seed: number): Container {
  const rng = new Rng(seed);
  const c = new Container();
  const jar = new Jar(0);
  jar.position.set(0, 80);
  c.addChild(jar);
  const n = rng.int(3, 6);
  for (let k = 0; k < n; k++) {
    const f = new Firefly({ x: 0, y: 0 });
    f.caught = true;
    const s = jar.slot(k, n);
    f.position.set(s.x, 80 + s.y);
    c.addChild(f);
  }
  return c;
}

export const lassoLoops: GameModule = {
  id: 'lasso-loops',
  name: 'Lasso Loops',
  titleLine: 'game.lasso-loops',
  region: 'counting-cove',
  challenge: 'numbers',
  skills: ['grouping', 'counting by fives and tens', 'place value', 'equal groups', 'estimating'],
  bands: ['preschool', 'prek', 'school'],
  levels: (band) => rangeFor(LEVELS, band),
  describeLevel: (level) => planFor(level).name,
  music: STYLES.lullaby,
  coplayHint:
    'Draw loops around groups of toys or pasta with {name}, then count the groups: "ten, twenty, and three more!"',
  offScreen:
    'Bundle straws or sticks into tens with rubber bands, then count the bundles and the loose ones.',
  hubIcon: () => new LassoIcon(),
  sticker,
  touchDemo: true,
  upright: true,
  create: (ctx) => new LassoLoops(ctx),
};
