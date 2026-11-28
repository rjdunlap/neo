import { Circle, Container, Graphics, Rectangle, type FederatedPointerEvent } from 'pixi.js';
import type { Critter } from '../../art/critter';
import { owlArt } from '../../art/animals';
import { cream, ink, swatch, wood, type ColorName } from '../../art/palette';
import { Backdrop, Sun } from '../../art/scenery';
import { oneArt, twoArt } from '../../art/seats';
import { puffs, shapePath } from '../../art/shapes';
import { STYLES } from '../../audio/music';
import { sfx } from '../../audio/sfx';
import { onTap, palmOnGlass } from '../../engine/input';
import { Rng } from '../../engine/random';
import { ease } from '../../engine/tween';
import type { View } from '../../engine/view';
import { rangeFor } from '../../progress/difficulty';
import { label } from '../../ui/text';
import { WigglyIcon } from '../shared';
import type { Game, GameContext, GameModule, TouchIntent } from '../types';
import {
  ENTRY_LEVELS,
  LEVELS,
  MARK,
  NEST_REACH,
  allHome,
  assignTotal,
  bestPairs,
  cardName,
  drawCard,
  drawCardFor,
  farthest,
  fits,
  hop,
  hops,
  isShapeCard,
  judgeCheck,
  judgeStone,
  makePath,
  mismatchWords,
  nextProposalBest,
  owlOf,
  owlToHop,
  nestPointIn,
  pairCards,
  planFor,
  proposalFor,
  seatStep,
  stepTo,
  stoneLayout,
  stoneReach,
  stoneScale,
  walkers,
  type PairPlan,
  type StoneVerdict,
  type Card,
  type OwlPlan,
  type Spot,
  type Stone,
} from './logic';

const OWL_COLORS: ColorName[] = ['purple', 'brown', 'pink'];
const OWL_SCALE = 0.3;
const line = (color: number, width = 5) => ({ width, color, join: 'round' as const, cap: 'round' as const });

/**
 * A stone in its color with its shape on top. On the color levels the shape is a small light mark (every color has its
 * own); on Color or shape it is a big white mark with an ink edge, read on any color, because it matters as much.
 */
function stoneArt(stone: Stone, bold = false): Graphics {
  const sw = swatch[stone.color];
  const g = new Graphics()
    .ellipse(0, 6, 44, 20)
    .fill({ color: 0x000000, alpha: 0.18 })
    .ellipse(0, 0, 44, 22)
    .fill(sw.fill)
    .stroke(line(sw.line, 4));
  const m = bold
    ? shapePath(new Graphics(), stone.shape, 16).fill(0xffffff).stroke(line(ink, 3))
    : shapePath(new Graphics(), stone.shape, 11).fill(sw.light);
  m.scale.set(1, bold ? 0.8 : 0.7);
  g.addChild(m);
  return g;
}

/**
 * The turned card. On the color levels it shows the color with its shape; on Color or shape it shows only one: a plain
 * panel of the color, or a white panel with an ink-edged white shape, so neither card carries the other attribute.
 */
function cardFace(card: Card, plan: OwlPlan): Container {
  const c = new Container();
  if (plan.mode === 'either' && isShapeCard(card)) {
    c.addChild(
      new Graphics()
        .roundRect(-56, -76, 112, 152, 14)
        .fill(0xffffff)
        .stroke(line(ink, 6))
        .roundRect(-44, -64, 88, 128, 10)
        .fill(cream),
      shapePath(new Graphics(), card, 34).fill(0xffffff).stroke(line(ink, 6)),
    );
    return c;
  }
  const sw = swatch[card as ColorName];
  c.addChild(
    new Graphics()
      .roundRect(-56, -76, 112, 152, 14)
      .fill(0xffffff)
      .stroke(line(sw.line, 6))
      .roundRect(-44, -64, 88, 128, 10)
      .fill(sw.fill),
  );
  const mark = plan.mode === 'either' ? undefined : MARK[card as ColorName];
  if (mark) c.addChild(shapePath(new Graphics(), mark, 30).fill(sw.light).stroke(line(sw.line, 4)));
  return c;
}

function cardBack(): Graphics {
  return new Graphics()
    .roundRect(-56, -76, 112, 152, 14)
    .fill(swatch.purple.fill)
    .stroke(line(swatch.purple.line, 6))
    .circle(0, 0, 26)
    .fill(swatch.yellow.light)
    .circle(12, -8, 22)
    .fill(swatch.purple.fill);
}

interface Owl {
  critter: Critter;
  spot: Spot;
  glow: Graphics;
  /** A halo under the owl whose turn it is, or the one she has picked. */
  ring: Graphics;
}

/** Where a tap landed: the nearest thing it could mean. */
type Hit = { kind: 'stone'; i: number } | { kind: 'owl'; i: number } | { kind: 'nest' };

/** How far from a stone's, an owl's or the nest's middle a touch still means it: stones are 78 units apart at the most crowded level, so the nearest wins. */
const OWL_REACH = 62;

/** Level 7's first pair of a play session is only a look: it hops whatever she placed and charges nothing (Light Lab 7's rule). */
let pairsSeen = false;
/** For tests and a fresh play session. */
export const resetPairsSeen = () => (pairsSeen = false);
const RING_REACH = 44;

class OwlWalk implements Game {
  readonly plan: OwlPlan;
  readonly path: Stone[];
  readonly owls: Owl[] = [];
  readonly stones: Graphics[] = [];
  readonly deck = new Container();
  /** Takes every touch on the path: the nearest stone, owl or the nest is what was meant. */
  readonly touch = new Container();
  /** The card turned up this turn, or null. */
  card: Card | null = null;
  /** The cards turned so far, newest last: Color or shape never deals three of one kind in a row. */
  private readonly dealt: Card[] = [];
  /** Whose turn it is: the child's, or the pet's (from level 2). */
  turn: 'child' | 'pet' = 'child';
  /** The owl she has picked to hop on the levels that ask which one (3 and 4). */
  selected: number | null = null;
  /** Turns taken so far, by both players. */
  index = 0;
  misses = 0;
  hints = 0;
  busy = true;
  /** Her card's instruction, waiting behind its `owl.color` (U7 R4); `askGen` drops a stale wait. */
  private unasked: (() => Promise<void>) | null = null;
  private askGen = 0;
  finished = false;

  private readonly backdrop: Backdrop;
  private readonly dawn = new Graphics();
  private readonly sun = new Sun();
  private readonly moon = new Graphics();
  private readonly trail = new Graphics();
  private readonly nest = new Container();
  private readonly shown = new Container();
  private readonly previews = new Container();
  private readonly layer = new Container();
  private readonly flies = new Container();
  private readonly fx = new Container();
  private readonly hintGlow = new Graphics();
  private view: View;
  private wrongs = 0;
  private hinted = false;
  private told = false;
  private lastTap = -Infinity;
  private clock = 0;
  private fireflies: { g: Graphics; stone: number; phase: number; reach: number }[] = [];
  private hintAt: number | 'nest' | null = null;
  /** The seat button (levels 2 to 4): a grown-up has the pet's turns. Off by default, so solo play is the pet's. */
  private readonly seat = new Container();
  private partner = false;
  /** Set while the pet's turn waits for the grown-up's stone: the owl they hop and their own wrong taps (never hers). */
  private partnerWait: { best: number; color: Card; resolve: (hopped: boolean) => void } | null = null;
  private partnerWrongs = 0;
  /** Level 7: the two cards on the table, the owl each is given to (null while unplaced) and the card she has picked up. */
  private pair: { cards: Card[]; to: (number | null)[]; sel: number | null } | null = null;
  private readonly pairRow = new Container();
  private readonly minis = new Container();
  private readonly go = new Container();
  private readonly goArt = new Graphics();
  /** Level 8: the owl the pet proposes for this card (null when none is waiting), the bubble that shows it and this round's kinds of proposal. */
  private proposal: number | null = null;
  private readonly bubble = new Container();
  private readonly proposals: boolean[] = [];
  /** The seat button belongs to levels 2 to 4: the pair and check levels have no pet turn to hand over. */
  private get seated() {
    return this.plan.owls > 1 && this.plan.mode !== 'pairs' && this.plan.mode !== 'check';
  }
  private total: ReturnType<typeof label> | null = null;
  private faces: Container[] = [];
  private hintPlan: PairPlan | null = null;
  private scoredPair = true;

  constructor(private readonly ctx: GameContext) {
    this.view = ctx.view;
    this.plan = planFor(ctx.level);
    this.path = makePath(this.plan, ctx.rng);
    this.backdrop = ctx.track(
      new Backdrop(
        {
          sky: [swatch.purple.line, swatch.blue.line],
          hills: [swatch.teal.line, 0x3f7f2e, 0x4a9a35],
          horizon: 0.42,
          clouds: 0,
          sun: false,
          seed: 77,
        },
        ctx.view,
      ),
    );
    this.moon.circle(0, 0, 40).fill(swatch.yellow.light).circle(16, -10, 34).fill(swatch.purple.line);
    this.dawn.alpha = 0;
    this.sun.visible = false;
    for (const s of this.path) {
      const stone = stoneArt(s, this.plan.mode === 'either');
      stone.scale.set(stoneScale(this.plan));
      this.stones.push(stone);
    }
    const tree = new Graphics().roundRect(-24, -150, 48, 160, 12).fill(wood.fill).stroke(line(wood.line, 5));
    puffs(
      tree,
      [
        [-60, -170, 54],
        [55, -165, 52],
        [0, -215, 62],
      ],
      swatch.green.line,
      0x3f7f2e,
      5,
    );
    const nest = new Graphics().ellipse(0, -120, 92, 34).fill(wood.light).stroke(line(wood.line, 6));
    for (let k = -3; k <= 3; k++)
      nest
        .moveTo(k * 24 - 14, -132)
        .lineTo(k * 24 + 14, -108)
        .stroke(line(wood.line, 3));
    this.nest.addChild(tree, nest);
    this.deck.addChild(cardBack());
    const back2 = cardBack();
    back2.position.set(6, 6);
    this.deck.addChildAt(back2, 0);
    onTap(this.seat, () => this.toggleSeat(), { cooldown: 300 });
    this.deck.hitArea = new Circle(0, 0, 90);
    // The stepping stones have no cards: the deck is not there to tap.
    this.deck.visible = this.plan.mode !== 'free' && this.plan.mode !== 'pairs';
    onTap(this.deck, () => void this.flip('child'), { cooldown: 400 });
    if (this.seated) this.drawSeat();
    if (this.plan.mode === 'pairs' || this.plan.mode === 'check') this.buildGo();
    this.hintGlow.circle(0, 0, 66).fill({ color: 0xfff3a0, alpha: 0.85 });
    this.hintGlow.visible = false;
    for (const quiet of [
      this.previews,
      this.bubble,
      this.trail,
      this.dawn,
      this.hintGlow,
      this.flies,
      this.fx,
      this.minis,
    ])
      quiet.eventMode = 'none';
    this.touch.eventMode = 'static';
    this.touch.cursor = 'pointer';
    this.touch.on('pointerdown', (e: FederatedPointerEvent) => this.tapAt(e));
    ctx.stage.addChild(
      this.backdrop,
      this.moon,
      this.sun,
      this.dawn,
      this.nest,
      this.trail,
      this.hintGlow,
      ...this.stones,
      this.flies,
      this.previews,
      this.layer,
      this.touch,
      this.deck,
      this.shown,
      this.pairRow,
      this.minis,
      this.bubble,
      this.go,
      this.fx,
    );
    if (this.seated) ctx.stage.addChild(this.seat);
    for (let i = 0; i < this.plan.owls; i++) {
      const critter = ctx.track(owlArt(OWL_COLORS[i]));
      critter.scale.set(OWL_SCALE);
      const glow = new Graphics().circle(0, -130, 170).fill({ color: 0xfff3a0, alpha: 0.85 });
      glow.visible = false;
      const ring = new Graphics()
        .circle(0, -130, 185)
        .stroke({ width: 22, color: swatch[OWL_COLORS[i]].light, alpha: 0.95 });
      ring.visible = false;
      critter.addChildAt(ring, 0);
      critter.addChildAt(glow, 0);
      // Touches go through `touch`, which finds the nearest owl, stone or nest.
      critter.eventMode = 'none';
      this.owls.push({ critter, spot: -1, glow, ring });
      this.layer.addChild(critter);
    }
  }

  /** Level 7's go lily: a green lily with a check, dim until every card is given to an owl. */
  private buildGo() {
    this.goArt
      .circle(0, 0, 72)
      .fill(swatch.green.fill)
      .stroke(line(swatch.green.line, 6))
      .moveTo(-30, 2)
      .lineTo(-8, 26)
      .lineTo(32, -24)
      .stroke({ width: 14, color: 0xffffff, cap: 'round', join: 'round' });
    this.go.addChild(this.goArt);
    this.go.hitArea = new Circle(0, 0, 76);
    this.go.alpha = this.plan.mode === 'check' ? 1 : 0.4;
    this.go.visible = this.plan.mode !== 'check';
    onTap(this.go, () => void (this.plan.mode === 'check' ? this.agree() : this.tapGo()), { cooldown: 400 });
  }

  /** The seat button: one figure, "just us" (the pet plays its owl), or two, a grown-up plays it. Chosen, never guessed: the device cannot tell fingers apart. */
  private drawSeat() {
    this.seat.removeChildren().forEach((c) => c.destroy({ children: true }));
    const back = new Graphics()
      .circle(0, 0, 58)
      .fill(this.partner ? swatch.green.light : cream)
      .stroke(line(this.partner ? swatch.green.line : swatch.blue.line, 6));
    const art = this.partner ? twoArt() : oneArt();
    art.scale.set(1.1);
    art.y = -4;
    this.seat.addChild(back, art);
    this.seat.hitArea = new Circle(0, 0, 62);
  }

  private toggleSeat() {
    if (this.finished) return;
    this.partner = !this.partner;
    sfx.pop(this.partner ? 7 : 5);
    this.drawSeat();
    // A grown-up who hands the seat back while the pet waits for them: the pet plays on.
    if (!this.partner) this.partnerWait?.resolve(false);
    this.partnerWait = null;
    if (this.partner) void this.ctx.say('owl.grownup-seat');
  }

  /** Two rows: right to left along the bottom, a turn, then left to right up to the nest (`stoneLayout`). */
  stoneAt(i: number) {
    return stoneLayout(this.path.length, this.view.w, this.view.h)[i];
  }

  /** Where an owl stands: in the woods by the first stone, on a stone, or in the nest. */
  spotAt(spot: Spot, i: number) {
    const v = this.view;
    if (spot < 0) return { x: v.w - 140 + (i - 1) * 62, y: v.h - 30 - (i % 2) * 22 };
    if (spot >= this.path.length) return { x: this.nest.x + (i - 1) * 56, y: this.nest.y - 112 };
    const s = this.stoneAt(spot);
    return { x: s.x, y: s.y + 4 };
  }

  /** The middle of the nest basket, which is what she taps when no stone of the color is left. */
  private nestPoint() {
    return nestPointIn(this.view.w, this.view.h);
  }

  /** A stone's middle, or the nest's. */
  private targetPoint(at: number | 'nest') {
    return at === 'nest' ? this.nestPoint() : this.stoneAt(at);
  }

  start() {
    void this.intro();
  }

  resize(v: View) {
    this.view = v;
    this.pairRow.position.set(v.w * 0.3, 125);
    this.go.position.set(v.w * 0.3 + 380, 135);
    this.backdrop.resize(v);
    this.moon.position.set(v.w * 0.75, 120);
    this.sun.position.set(v.w * 0.75, v.h * 0.42);
    this.dawn
      .clear()
      .rect(0, 0, v.w, v.h * 0.45)
      .fill(swatch.orange.light);
    this.nest.position.set(v.w - 120, v.h - 330 + 10);
    this.stones.forEach((s, i) => s.position.copyFrom(this.stoneAt(i)));
    const t = this.trail.clear();
    const pts = this.path.map((_, i) => this.stoneAt(i));
    t.moveTo(pts[0].x, pts[0].y);
    for (const p of pts.slice(1)) t.lineTo(p.x, p.y);
    t.lineTo(this.nest.x - 40, this.nest.y - 20);
    t.stroke({ width: 18, color: wood.line, alpha: 0.35, cap: 'round', join: 'round' });
    this.owls.forEach((o, i) => {
      if (!this.ctx.tw.busy(o.critter)) o.critter.position.copyFrom(this.spotAt(o.spot, i));
    });
    this.deck.position.set(v.w * 0.36, 125);
    this.seat.position.set(Math.max(80, v.w * 0.36 - 190), 125);
    this.shown.position.set(v.w * 0.36 + 150, 125);
    this.touch.hitArea = new Rectangle(0, 0, v.w, v.h);
    if (this.hintAt !== null) this.hintGlow.position.copyFrom(this.targetPoint(this.hintAt));
    this.drawPreviews();
    this.drawMinis();
    this.placeBubble();
  }

  update(dt: number) {
    this.clock += dt;
    if (
      (this.plan.mode === 'pairs' || this.plan.mode === 'check') &&
      this.go.alpha === 1 &&
      this.go.visible
    ) {
      const k = 1 + 0.06 * Math.sin(this.clock * 5);
      this.go.scale.set(k);
    }
    if (!this.fireflies.length) return;
    for (const f of this.fireflies) {
      const p = this.stoneAt(f.stone);
      const a = this.clock * 1.4 + f.phase;
      f.g.position.set(p.x + Math.cos(a) * f.reach, p.y - 34 + Math.sin(a * 1.3) * f.reach * 0.7);
      f.g.alpha = 0.55 + 0.45 * Math.sin(this.clock * 3 + f.phase);
    }
  }

  /** The ghost finger: flip a card, pick the owl (on the levels that ask), then tap the stone it hops to, or the nest. The pet's turns play themselves. */
  /** Guided first play points at the bot's next move: `autotouch` here only reads the board. */
  showMove(): TouchIntent | null {
    return this.autotouch();
  }

  autotouch(): TouchIntent | null {
    if (this.busy || this.finished || this.unasked || this.turn !== 'child') return null;
    if (this.plan.mode === 'free') {
      // The stepping stones: the next stone ahead, one at a time, then the nest.
      const next = this.owls[0].spot + 1;
      return next >= this.path.length
        ? { tap: { on: this.nest, x: 0, y: -120 }, receiver: this.touch }
        : { tap: { on: this.stones[next] }, receiver: this.touch };
    }
    if (this.plan.mode === 'pairs') return this.pairTouch();
    if (!this.card) return { tap: { on: this.deck } };
    const spots = this.owls.map((o) => o.spot);
    // Checking the helper: agree when the proposal hops the farthest, else tap an owl that does.
    if (
      this.proposal !== null &&
      this.selected === null &&
      farthest(this.path, spots, this.card).includes(this.proposal)
    )
      return { tap: { on: this.go }, pause: 0.2 };
    const asks = this.plan.mode === 'choose' || this.plan.mode === 'farthest' || this.plan.mode === 'check';
    if (asks && this.selected === null && this.moving().length > 1) {
      const i = owlToHop(this.path, spots, this.card);
      // The owl's tap area is centered a little above its feet.
      return i === null
        ? null
        : { tap: { on: this.owls[i].critter, x: 0, y: -125 }, receiver: this.touch, pause: 0.2 };
    }
    const i = this.actorOwl();
    if (i === null) return null;
    const to = hop(this.path, spots, i, this.card);
    return to >= this.path.length
      ? { tap: { on: this.nest, x: 0, y: -120 }, receiver: this.touch }
      : { tap: { on: this.stones[to] }, receiver: this.touch };
  }

  destroy() {}

  private async intro() {
    const lines = {
      one: 'owl.one',
      turns: 'owl.turns',
      choose: 'owl.choose',
      farthest: 'owl.farthest',
      free: 'owl.free',
      either: 'owl.either',
      pairs: 'owl.pairs',
      check: 'owl.check',
    } as const;
    await this.ctx.instruct(lines[this.plan.mode]);
    this.busy = false;
    if (this.plan.mode === 'pairs') await this.dealPair();
  }

  private moving() {
    return this.owls.map((o, i) => (o.spot < this.path.length ? i : -1)).filter((i) => i >= 0);
  }

  /** The owl the child's stone tap is for: the only one on the one-owl levels, her own on level 2, the one she picked on the others. */
  private actorOwl(): number | null {
    const spots = this.owls.map((o) => o.spot);
    if (this.plan.owls === 1) return 0;
    if (this.plan.mode === 'turns') return owlOf(this.path, spots, 0);
    return this.selected;
  }

  /** A halo on the owl whose turn it is (one each) or the one picked (the levels that ask). */
  private setRing(only: number | null) {
    this.owls.forEach((o, i) => (o.ring.visible = i === only));
  }

  // A turn: flip a card, pick the owl, tap its stone --------------------------------------------

  private async flip(who: 'child' | 'pet') {
    if (
      this.plan.mode === 'pairs' ||
      this.finished ||
      this.card ||
      this.turn !== who ||
      (who === 'child' && this.busy)
    )
      return;
    this.busy = true;
    this.wrongs = 0;
    this.hinted = false;
    this.selected = null;
    this.clearProposal();
    this.clearHint();
    const spots = this.owls.map((o) => o.spot);
    const assigned = this.plan.mode === 'turns' ? owlOf(this.path, spots, who === 'child' ? 0 : 1) : null;
    const movers = this.plan.owls === 1 ? [0] : assigned !== null ? [assigned] : this.moving();
    const color = drawCardFor(this.plan, this.ctx.rng, this.path, spots, movers, this.dealt);
    this.card = color;
    this.dealt.push(color);
    if (assigned !== null) this.setRing(assigned);
    sfx.whoosh();
    const face = cardFace(color, this.plan);
    face.scale.set(0, 1);
    this.shown.addChild(face);
    await this.ctx.tw.to(face.scale, { x: 1 }, { duration: 0.25, ease: ease.outBack });
    sfx.pop(7);
    const said = this.ctx.say('owl.color', { color });
    // The pet's own colour is heard out: its turn is a demonstration.
    if (who === 'pet') {
      await said;
      this.drawPreviews();
      if (this.plan.twinkle) this.twinkle(movers[0]);
      return;
    }
    // Hers starts as the card turns, and the previews and her stone tap open at once (U7 R4); the face shows the colour.
    this.drawPreviews();
    if (this.plan.twinkle) this.twinkle(movers[0]);
    this.busy = false;
    // One owl left walking: there is nothing to pick.
    if (
      (this.plan.mode === 'choose' || this.plan.mode === 'farthest' || this.plan.mode === 'check') &&
      movers.length === 1
    )
      this.select(movers[0], false);
    // What to do with the card waits for its colour, is dropped at her first tap, or is said by the guide.
    if (this.plan.mode === 'check' && movers.length > 1) this.propose(color);
    this.unasked = async () => {
      const i = this.actorOwl();
      if (this.proposal !== null) {
        await this.ctx.instruct('owl.propose', this.proposalWords(color, this.proposal));
        return;
      }
      if (i === null) {
        if (!this.told) {
          this.told = true;
          await this.ctx.instruct('owl.pick-owl', { color });
        }
        return;
      }
      await this.announce(i);
    };
    const gen = ++this.askGen;
    await said;
    if (gen === this.askGen) await this.askNow();
  }

  /** Says the waiting instruction, if there is one. */
  private askNow() {
    const say = this.unasked;
    if (!say || this.finished || !this.card) return Promise.resolve(false);
    this.unasked = null;
    this.askGen++;
    return say().then(() => true);
  }

  /** The guide was tapped while her card's instruction waits: say it, not the one before it. */
  sayWaitingAsk() {
    if (!this.unasked || this.finished || !this.card) return false;
    void this.askNow();
    return true;
  }

  /** What to do with this card: the stone to find, or, when none is left ahead, the nest. */
  private async announce(i: number) {
    const color = this.card!;
    const spots = this.owls.map((o) => o.spot);
    if (hop(this.path, spots, i, color) >= this.path.length) {
      await this.ctx.instruct('owl.no-match', { color });
      return;
    }
    if (!this.told || this.moving().length === 1) {
      this.told = true;
      await this.ctx.instruct('owl.tap-stone', { color });
    }
  }

  /** The nearest stone, owl or nest to a touch, if any is close enough to mean it. */
  private nearest(p: { x: number; y: number }): Hit | null {
    let best: Hit | null = null;
    let bestRatio = 1;
    const consider = (hit: Hit, at: { x: number; y: number }, reach: number) => {
      const r = Math.hypot(at.x - p.x, at.y - p.y) / reach;
      if (r <= bestRatio) {
        bestRatio = r;
        best = hit;
      }
    };
    // A stone with an owl on it belongs to the owl: touching either one means the owl.
    this.stones.forEach((_, i) => {
      if (!this.owls.some((o) => o.spot === i))
        consider({ kind: 'stone', i }, this.stoneAt(i), stoneReach(this.plan));
    });
    consider({ kind: 'nest' }, this.nestPoint(), NEST_REACH);
    this.owls.forEach((o, i) => {
      if (o.spot < this.path.length)
        consider({ kind: 'owl', i }, { x: o.critter.x, y: o.critter.y - 38 }, OWL_REACH);
    });
    // On the farthest level the numbered rings are the most eye-catching thing on the path: touching one means its owl.
    if ((this.plan.mode === 'farthest' || this.plan.mode === 'check') && this.card) {
      const spots = this.owls.map((o) => o.spot);
      this.owls.forEach((o, i) => {
        if (o.spot >= this.path.length) return;
        const at = this.spotAt(hop(this.path, spots, i, this.card!), i);
        consider({ kind: 'owl', i }, { x: at.x, y: at.y - 98 }, RING_REACH);
      });
    }
    return best;
  }

  private tapAt(e: FederatedPointerEvent) {
    const now = performance.now();
    if (now - this.lastTap < 150 || palmOnGlass()) return;
    this.lastTap = now;
    if (this.plan.mode === 'free' && this.busy && !this.finished) {
      // The stepping stones answer every touch, even mid-hop: a ring where the finger landed.
      const p = this.touch.toLocal(e.global);
      this.ripple(p.x, p.y);
      return;
    }
    if (this.partnerWait && !this.finished)
      return this.partnerTap(this.nearest(this.touch.toLocal(e.global)));
    if (this.busy || this.finished || this.turn !== 'child') return;
    const hit = this.nearest(this.touch.toLocal(e.global));
    if (this.plan.mode === 'free') return this.step(hit);
    if (!hit) return;
    // Touch-down answers at once, before the judgment: the stone squashes and a ring spreads.
    const at =
      hit.kind === 'owl'
        ? { x: this.owls[hit.i].critter.x, y: this.owls[hit.i].critter.y - 38 }
        : this.targetPoint(hit.kind === 'stone' ? hit.i : 'nest');
    this.ripple(at.x, at.y);
    if (hit.kind === 'stone') this.squash(this.stones[hit.i]);
    if (this.plan.mode === 'pairs') {
      if (hit.kind === 'owl') void this.giveOwl(hit.i);
      else sfx.tick();
      return;
    }
    if (!this.card) {
      if (hit.kind === 'owl') this.owls[hit.i].critter.poke();
      void this.ctx.say('owl.flip-first');
      void this.ctx.tw
        .to(this.deck.scale, { x: 1.12, y: 1.12 }, { duration: 0.12 })
        .then(() => this.ctx.tw.to(this.deck.scale, { x: 1, y: 1 }, { duration: 0.12 }));
      return;
    }
    // Her first tap drops the instruction still waiting behind the colour: her tap's own line takes its place.
    this.unasked = null;
    this.askGen++;
    if (hit.kind === 'owl') void this.pickOwl(hit.i);
    else void this.tapStone(hit.kind === 'stone' ? hit.i : 'nest');
  }

  /**
   * The stepping stones (level 5): every touch answers. A stone ahead hops the owl there and the nest flies it home; its own
   * stone, a stone behind or the owl itself is a soft tick and a little bounce, and a touch on nothing pokes the owl. Never a miss.
   */
  private step(hit: Hit | null) {
    const owl = this.owls[0];
    if (hit && hit.kind !== 'owl') {
      const tapped = hit.kind === 'stone' ? hit.i : 'nest';
      const at = this.targetPoint(tapped);
      this.ripple(at.x, at.y);
      if (hit.kind === 'stone') this.squash(this.stones[hit.i]);
      if (stepTo(this.path.length, owl.spot, tapped) !== 'stay') {
        void this.move(0, tapped === 'nest' ? this.path.length : tapped).then(() => this.endTurn());
        return;
      }
    }
    sfx.tick();
    owl.critter.poke();
  }

  /** The owl step of levels 3 and 4: a free choice on 3, and on 4 it must be one that hops the farthest. */
  private async pickOwl(i: number) {
    const color = this.card;
    if (!color || this.busy) return;
    const mode = this.plan.mode;
    if (mode === 'one' || mode === 'turns' || mode === 'either') {
      // These levels choose the stone, not the owl: tapping an owl (what the old game taught) is never a miss; it answers and the voice says what to tap.
      this.owls[i].critter.poke();
      void this.ctx.say('owl.tap-stone', { color });
      return;
    }
    const spots = this.owls.map((o) => o.spot);
    if (mode === 'check' && this.proposal !== null) return this.checkOwl(i, color);
    if (mode === 'farthest' && !farthest(this.path, spots, color).includes(i)) {
      // Comparing hops is the decision here: a shorter hop is a gentle miss with the numbers said aloud.
      const h = hops(this.path, spots, color);
      const best = farthest(this.path, spots, color);
      this.owls[i].critter.poke();
      await this.miss(
        () => this.ctx.say('owl.not-farthest', { a: h[i], b: h[best[0]] }),
        () => {
          for (const b of best) this.owls[b].glow.visible = true;
        },
        async () => {
          await this.ctx.say('owl.together');
          this.busy = false;
          this.select(best[0], true);
        },
      );
      return;
    }
    this.select(i, true);
  }

  // Check the helper (level 8) -----------------------------------------------------------------

  /** The pet's proposal for this card: a best owl about half the time, and a shorter-hopping one the rest, shown in a bubble and a check. */
  private propose(card: Card) {
    const spots = this.owls.map((o) => o.spot);
    const wantBest = nextProposalBest(this.ctx.rng, this.proposals);
    const owl = proposalFor(this.ctx.rng, this.path, spots, card, wantBest);
    if (owl === null) return;
    this.proposals.push(farthest(this.path, spots, card).includes(owl));
    this.proposal = owl;
    this.go.visible = true;
    this.go.alpha = 1;
    const face = cardFace(card, this.plan);
    face.scale.set(0.42);
    this.bubble.removeChildren().forEach((c) => c.destroy({ children: true }));
    const back = new Graphics()
      .roundRect(-48, -62, 96, 124, 20)
      .fill({ color: 0xffffff, alpha: 0.95 })
      .stroke(line(ink, 4))
      .poly([-12, 60, 12, 60, 0, 84])
      .fill({ color: 0xffffff, alpha: 0.95 });
    face.y = -4;
    this.bubble.addChild(back, face);
    this.placeBubble();
    this.owls[owl].critter.hop(0.5);
  }

  private placeBubble() {
    if (this.proposal === null) return;
    const o = this.owls[this.proposal].critter;
    this.bubble.position.set(o.x, o.y - 190);
  }

  private clearProposal() {
    this.proposal = null;
    this.bubble.removeChildren().forEach((c) => c.destroy({ children: true }));
    this.go.visible = this.plan.mode !== 'check';
  }

  private proposalWords(card: Card, owl: number) {
    return { card: cardName(this.plan, card), owl: OWL_COLORS[owl] };
  }

  /** She tapped the green check: she agrees with the proposed owl. */
  private async agree() {
    if (this.busy || this.finished || this.turn !== 'child' || this.proposal === null || !this.card) return;
    this.unasked = null;
    this.askGen++;
    await this.checkOwl(this.proposal, this.card);
  }

  /** Her answer to the proposal, judged by how far the owl hops (`judgeCheck`); a wrong one says what the helper learned. */
  private async checkOwl(i: number, card: Card) {
    const proposed = this.proposal!;
    const spots = this.owls.map((o) => o.spot);
    const { right, result } = judgeCheck(this.path, spots, card, proposed, i);
    const h = hops(this.path, spots, card);
    const best = farthest(this.path, spots, card);
    if (right) {
      this.clearProposal();
      this.select(i, result !== 'corrected');
      // Her stone tap never waits for the praise: the instruction follows only if she has not already moved on.
      if (result === 'corrected')
        void this.ctx.say('owl.check-good', { a: h[proposed], b: h[i] }).then(() => {
          if (this.selected === i && this.card === card && !this.busy) void this.announce(i);
        });
      return;
    }
    this.owls[i].critter.poke();
    const line = () =>
      result === 'trusted-wrong'
        ? this.ctx.say('owl.check-trusted', { owl: OWL_COLORS[i], a: h[i], b: h[best[0]] })
        : result === 'spoiled'
          ? this.ctx.say('owl.check-spoiled', { owl: OWL_COLORS[proposed], a: h[proposed], b: h[i] })
          : this.ctx.say('owl.not-farthest', { a: h[i], b: h[best[0]] });
    await this.miss(
      line,
      () => {
        for (const b of best) this.owls[b].glow.visible = true;
      },
      async () => {
        await this.ctx.say('owl.together');
        this.busy = false;
        this.clearProposal();
        this.select(best[0], true);
      },
    );
  }

  private select(i: number, announce: boolean) {
    this.selected = i;
    this.wrongs = 0;
    this.setRing(i);
    for (const o of this.owls) o.glow.visible = false;
    sfx.pop(6);
    if (announce) {
      this.owls[i].critter.hop(0.5);
      void this.announce(i);
    }
  }

  /** The stone step: the next stone of the card's color, or the nest when none is left. */
  private async tapStone(tapped: number | 'nest') {
    const color = this.card;
    if (!color || this.busy) return;
    const i = this.actorOwl();
    if (i === null) {
      void this.ctx.say('owl.pick-owl', { color });
      return;
    }
    const spots = this.owls.map((o) => o.spot);
    const verdict = judgeStone(this.path, spots, i, color, tapped);
    if (verdict === 'next' || verdict === 'nest') {
      await this.move(i);
      await this.endTurn();
      return;
    }
    const to = hop(this.path, spots, i, color);
    await this.miss(
      () => this.wrongLine(verdict, tapped, color),
      () => {
        this.showHint(to >= this.path.length ? 'nest' : to);
        // With no fireflies to scan by on Color or shape, the hint brings them to the right stone.
        if (this.plan.mode === 'either' && to < this.path.length) this.twinkleOn([to]);
      },
      async () => {
        await this.ctx.say('owl.together');
        await this.move(i);
        await this.endTurn();
      },
    );
  }

  /** The spoken reason a stone was not the one: the other color or shape named, a closer stone, the owl only walks forward, a friend there, or one still ahead of the nest. */
  private wrongLine(verdict: Exclude<StoneVerdict, 'next' | 'nest'>, tapped: number | 'nest', color: Card) {
    const need = cardName(this.plan, color);
    if (verdict === 'mismatch') {
      const w = mismatchWords(this.plan, this.path[tapped as number], color);
      return this.ctx.say(w.line, { have: w.have, need: w.need });
    }
    if (verdict === 'far') return this.ctx.say('owl.far', { need });
    const id = { behind: 'owl.behind', occupied: 'owl.occupied', 'early-nest': 'owl.early-nest' } as const;
    return this.ctx.say(id[verdict], { color });
  }

  /**
   * A grown-up's tap while the pet's turn waits for them. The right stone takes the hop for the pet's owl; a wrong one is
   * the same gentle answer her own taps get, but nothing is added to her misses or hints (`seatStep`).
   */
  private partnerTap(hit: Hit | null) {
    const wait = this.partnerWait;
    if (!wait || !hit) return;
    if (hit.kind === 'owl') {
      this.owls[hit.i].critter.poke();
      return;
    }
    const tapped = hit.kind === 'stone' ? hit.i : 'nest';
    const at = this.targetPoint(tapped);
    this.ripple(at.x, at.y);
    if (hit.kind === 'stone') this.squash(this.stones[hit.i]);
    const spots = this.owls.map((o) => o.spot);
    const verdict = judgeStone(this.path, spots, wait.best, wait.color, tapped);
    const step = seatStep(verdict, this.partnerWrongs + 1);
    if (step === 'hop') {
      this.finishPartner(true);
      return;
    }
    this.partnerWrongs++;
    sfx.boing();
    const say = this.wrongLine(verdict as Exclude<StoneVerdict, 'next' | 'nest'>, tapped, wait.color);
    const to = hop(this.path, spots, wait.best, wait.color);
    if (step === 'hint') void say.then(() => this.showHint(to >= this.path.length ? 'nest' : to));
    else if (step === 'together')
      void say.then(async () => {
        await this.ctx.say('owl.together');
        this.finishPartner(true);
      });
  }

  private finishPartner(hopped: boolean) {
    const wait = this.partnerWait;
    this.partnerWait = null;
    this.clearHint();
    wait?.resolve(hopped);
  }

  /** A gentle miss: a boing and a spoken reason; after two, the answer glows (one hint a turn); a third has the pet hop it. */
  private async miss(say: () => Promise<void>, hint: () => void, together: () => void | Promise<void>) {
    this.misses++;
    this.wrongs++;
    sfx.boing();
    this.busy = true;
    await say();
    this.busy = false;
    if (this.wrongs >= 2 && !this.hinted) {
      this.hinted = true;
      this.hints++;
    }
    if (this.wrongs === 2) hint();
    else if (this.wrongs >= 3) {
      this.busy = true;
      await together();
    }
  }

  private showHint(at: number | 'nest') {
    this.hintAt = at;
    this.hintGlow.position.copyFrom(this.targetPoint(at));
    this.hintGlow.visible = true;
  }

  private clearHint() {
    this.hintAt = null;
    this.hintPlan = null;
    this.hintGlow.visible = false;
    for (const o of this.owls) o.glow.visible = false;
  }

  /** Matching stones ahead of the owl twinkle with fireflies when a card turns: the set to look through, never the answer. */
  private twinkle(i: number) {
    const spots = this.owls.map((o) => o.spot);
    const stones: number[] = [];
    for (let s = spots[i] + 1; s < this.path.length; s++) {
      if (fits(this.path[s], this.card!) && !spots.includes(s)) stones.push(s);
    }
    this.twinkleOn(stones);
  }

  private twinkleOn(stones: readonly number[]) {
    this.clearTwinkle();
    const card = this.card!;
    const light = isShapeCard(card) ? swatch.yellow.light : swatch[card].light;
    for (const s of stones) {
      for (let k = 0; k < 5; k++) {
        const g = new Graphics()
          .circle(0, 0, 15)
          .fill({ color: light, alpha: 0.35 })
          .circle(0, 0, 8)
          .fill(light)
          .circle(0, 0, 4)
          .fill(0xffffff);
        this.flies.addChild(g);
        this.fireflies.push({ g, stone: s, phase: k * 1.3 + s, reach: 26 + k * 6 });
      }
    }
  }

  private clearTwinkle() {
    this.fireflies = [];
    this.flies.removeChildren().forEach((c) => c.destroy());
  }

  private ripple(x: number, y: number) {
    const g = new Graphics().circle(0, 0, 30).stroke({ width: 8, color: 0xffffff, alpha: 0.9 });
    g.position.set(x, y);
    this.fx.addChild(g);
    void this.ctx.tw.to(g.scale, { x: 2.2, y: 2.2 }, { duration: 0.4, ease: ease.outQuad });
    void this.ctx.tw.to(g, { alpha: 0 }, { duration: 0.4 }).then(() => g.destroy());
  }

  private squash(stone: Graphics) {
    const s = stoneScale(this.plan);
    void this.ctx.tw
      .to(stone.scale, { x: s * 1.15, y: s * 0.8 }, { duration: 0.07 })
      .then(() => this.ctx.tw.to(stone.scale, { x: s, y: s }, { duration: 0.12, ease: ease.outBack }));
  }

  /** Hop by hop along the stones to the landing spot (or all the way home), counting the stones aloud. */
  private async move(
    i: number,
    to = hop(
      this.path,
      this.owls.map((o) => o.spot),
      i,
      this.card!,
    ),
  ) {
    this.busy = true;
    const owl = this.owls[i];
    this.clearHint();
    this.clearTwinkle();
    this.clearProposal();
    this.setRing(null);
    this.previews.removeChildren().forEach((c) => c.destroy({ children: true }));
    const stops: Spot[] = [];
    for (let s = Math.max(0, owl.spot + 1); s < Math.min(to, this.path.length); s++) stops.push(s);
    stops.push(to);
    // Counted aloud on the card levels; the stepping stones only sing, so a quick tap after tap stays music.
    const counted = to < this.path.length && this.plan.mode !== 'free';
    for (const s of stops) {
      const p = this.spotAt(s, i);
      const k = stops.indexOf(s);
      owl.critter.hop(0.5);
      sfx.marimba(4 + Math.min(9, k), 0.3);
      if (counted) void this.ctx.say('count', { n: k + 1 });
      await this.ctx.tw.to(
        owl.critter,
        { x: p.x, y: p.y },
        {
          duration:
            s === to && to >= this.path.length
              ? 0.6
              : counted
                ? this.plan.mode === 'pairs'
                  ? 0.2
                  : 0.28
                : 0.24,
          ease: ease.inOutSine,
        },
      );
    }
    owl.spot = to;
    this.index++;
    this.selected = null;
    if (to >= this.path.length) {
      owl.critter.cheer();
      sfx.sparkle();
      await this.ctx.say('owl.home');
    }
    this.card = null;
    // Only this card fades: a quick next turn may already be turning up another.
    for (const old of [...this.shown.children])
      void this.ctx.tw.to(old, { alpha: 0 }, { duration: 0.3 }).then(() => old.destroy({ children: true }));
  }

  private async endTurn() {
    if (
      allHome(
        this.path,
        this.owls.map((o) => o.spot),
      )
    )
      return this.finale();
    if (this.plan.owls === 1) {
      this.busy = false;
      return;
    }
    if (this.turn === 'child') {
      this.turn = 'pet';
      await this.petTurn();
    }
  }

  /** The pet plays fair and says what it looked for: its own owl on level 2, the owl that goes the farthest after that. */
  private async petTurn() {
    this.ctx.pet.cheer();
    await this.ctx.say('owl.my-turn');
    await this.flip('pet');
    const spots = this.owls.map((o) => o.spot);
    const color = this.card!;
    const best = this.plan.mode === 'turns' ? owlOf(this.path, spots, 1) : owlToHop(this.path, spots, color)!;
    const to = hop(this.path, spots, best, color);
    this.owls[best].glow.visible = true;
    if (this.partner && (await this.partnerHops(best, color))) {
      await this.move(best);
      return this.afterPetHop();
    }
    if (to >= this.path.length) await this.ctx.say('owl.pet-nest', { color });
    else if (this.plan.mode === 'turns')
      await this.ctx.say('owl.pet-look', { need: cardName(this.plan, color) });
    else await this.ctx.say('owl.pet-move', { color, n: to - spots[best] });
    // The pet touches the same place she would, so she sees the action she is learning.
    const at = this.targetPoint(to >= this.path.length ? 'nest' : to);
    this.ripple(at.x, at.y);
    await this.move(best);
    return this.afterPetHop();
  }

  /** The pet's turn waits for a grown-up's stone (seat button on); true when they hopped it, false when they gave the seat back. */
  private partnerHops(best: number, color: Card): Promise<boolean> {
    this.partnerWrongs = 0;
    void this.ctx.say('owl.grownup');
    return new Promise((resolve) => {
      this.partnerWait = { best, color, resolve };
    });
  }

  private async afterPetHop() {
    if (
      allHome(
        this.path,
        this.owls.map((o) => o.spot),
      )
    )
      return this.finale();
    this.turn = 'child';
    this.busy = false;
    await this.ctx.instruct('owl.your-turn');
  }

  /** On the farthest level, each owl shows where this card would take it, and how many stones that is. */
  private drawPreviews() {
    this.previews.removeChildren().forEach((c) => c.destroy({ children: true }));
    if (this.plan.mode === 'pairs') return this.pairPreviews();
    if ((this.plan.mode !== 'farthest' && this.plan.mode !== 'check') || !this.card) return;
    const spots = this.owls.map((o) => o.spot);
    const h = hops(this.path, spots, this.card);
    this.owls.forEach((o, i) => {
      if (o.spot >= this.path.length) return;
      const to = hop(this.path, spots, i, this.card!);
      const p = this.spotAt(to, i);
      const ring = new Graphics()
        .circle(0, -28, 30)
        .fill({ color: swatch[OWL_COLORS[i]].light, alpha: 0.85 })
        .stroke(line(swatch[OWL_COLORS[i]].line, 4));
      const n = label(String(h[i]), 26, ink);
      n.y = -28;
      ring.addChild(n);
      ring.position.set(p.x, p.y - 70);
      this.previews.addChild(ring);
    });
  }

  // Our two cards (level 7) ----------------------------------------------------------------------

  /** A number ring over the stone an owl would land on, in the owl's color: the preview of the hop it was given. */
  private ringAt(owl: number, to: Spot, count: number) {
    const p = this.spotAt(to, owl);
    const ring = new Graphics()
      .circle(0, -28, 30)
      .fill({ color: swatch[OWL_COLORS[owl]].light, alpha: 0.85 })
      .stroke(line(swatch[OWL_COLORS[owl]].line, 4));
    const n = label(String(count), 26, ink);
    n.y = -28;
    ring.addChild(n);
    ring.position.set(p.x, p.y - 70);
    this.previews.addChild(ring);
  }

  /** Each card given to an owl shows where it takes that owl, the first card's hop first, so the second preview already knows. */
  private pairPreviews() {
    const pair = this.pair;
    if (!pair) return;
    const cur = this.owls.map((o) => o.spot);
    pair.cards.forEach((card, k) => {
      const owl = pair.to[k];
      if (owl === null) return;
      const to = hop(this.path, cur, owl, card);
      this.ringAt(owl, to, to - cur[owl]);
      cur[owl] = to;
    });
  }

  /** The small copy of each given card beside its owl; the glowing hint shows the best way as ghosts. */
  private drawMinis() {
    this.minis.removeChildren().forEach((c) => c.destroy({ children: true }));
    const pair = this.pair;
    if (!pair) return;
    const put = (card: Card, owl: number, alpha: number) => {
      const mini = cardFace(card, this.plan);
      mini.scale.set(0.34);
      mini.alpha = alpha;
      const o = this.owls[owl].critter;
      mini.position.set(o.x + 52, o.y - 34);
      this.minis.addChild(mini);
    };
    pair.cards.forEach((card, k) => {
      const owl = pair.to[k];
      if (owl !== null) put(card, owl, 1);
    });
    if (this.hintPlan) pair.cards.forEach((card, k) => put(card, this.hintPlan![k], 0.55));
  }

  private pairComplete() {
    return !!this.pair && this.pair.to.every((o) => o !== null);
  }

  /** Cards, minis, previews, the total and the go lily, as the cards are given out. */
  private redrawPair() {
    const pair = this.pair;
    this.faces.forEach((f, k) => {
      const placed = pair?.to[k] != null;
      f.y = pair?.sel === k ? -22 : 0;
      f.alpha = placed ? 0.6 : 1;
    });
    this.drawPreviews();
    this.drawMinis();
    const done = this.pairComplete();
    this.go.alpha = done ? 1 : 0.4;
    if (!done) this.go.scale.set(1);
    if (this.total) {
      this.total.text = done ? `${this.pairTotal()} together` : '';
    }
    this.setRing(pair?.sel != null && pair.to[pair.sel] != null ? pair.to[pair.sel] : null);
  }

  private pairTotal() {
    const pair = this.pair!;
    const spots = this.owls.map((o) => o.spot);
    if (pair.cards.length === 1)
      return hop(this.path, spots, pair.to[0]!, pair.cards[0]) - spots[pair.to[0]!];
    return assignTotal(this.path, spots, [pair.cards[0], pair.cards[1]], [pair.to[0]!, pair.to[1]!]);
  }

  /** Two new cards turn (one, with a single owl left, given to it already). */
  private async dealPair() {
    if (this.finished) return;
    this.busy = true;
    this.wrongs = 0;
    this.hinted = false;
    this.clearHint();
    const spots = this.owls.map((o) => o.spot);
    const walking = walkers(this.path, spots);
    const cards: Card[] = pairCards(this.plan, this.ctx.rng, this.path, spots) ?? [
      drawCard(this.plan, this.ctx.rng),
    ];
    this.pair = { cards, to: walking.length === 1 ? [walking[0]] : cards.map(() => null), sel: null };
    this.scoredPair = pairsSeen || cards.length === 1;
    this.pairRow.removeChildren().forEach((c) => c.destroy({ children: true }));
    this.faces = cards.map((card, k) => {
      const face = new Container();
      const art = cardFace(card, this.plan);
      art.scale.set(1.1);
      face.addChild(art);
      face.hitArea = new Rectangle(-62, -84, 124, 168);
      face.x = k * 150;
      onTap(face, () => this.pickCard(k), { cooldown: 200 });
      this.pairRow.addChild(face);
      return face;
    });
    this.total = label('', 34, ink);
    this.total.position.set(((cards.length - 1) * 150) / 2, 125);
    this.pairRow.addChild(this.total);
    this.redrawPair();
    sfx.whoosh();
    for (const f of this.faces) {
      f.scale.set(0, 1);
      await this.ctx.tw.to(f.scale, { x: 1 }, { duration: 0.15, ease: ease.outBack });
    }
    sfx.pop(7);
    this.busy = false;
    if (cards.length === 1) void this.ctx.say('owl.pair-last', { color: cards[0] });
    else {
      await this.ctx.say('owl.color', { color: cards[0] });
      await this.ctx.say('owl.color', { color: cards[1] });
      if (this.pair?.cards === cards && !this.told) {
        this.told = true;
        await this.ctx.instruct('owl.pair-give');
      }
    }
  }

  private pickCard(k: number) {
    const pair = this.pair;
    if (!pair || this.busy || this.finished || pair.cards.length === 1) return;
    pair.sel = pair.sel === k ? null : k;
    sfx.pop(5);
    this.redrawPair();
  }

  /** A tap on an owl: with a card picked up it is given to the owl (swapping with a card already there); with none, an owl holding a card picks it up. */
  private async giveOwl(owl: number) {
    const pair = this.pair;
    if (!pair || this.busy || pair.cards.length === 1) return;
    this.owls[owl].critter.poke();
    const held = pair.to.indexOf(owl);
    if (pair.sel === null) {
      if (held >= 0) pair.sel = held;
      else void this.ctx.say('owl.pair-pick');
    } else {
      const k = pair.sel;
      const other = 1 - k;
      if (pair.to[other] === owl) pair.to[other] = pair.to[k];
      pair.to[k] = owl;
      pair.sel = null;
      sfx.pop(6);
    }
    this.redrawPair();
  }

  /** Go: the first pair of a session only hops what she placed; after that only the most stones hops, and anything less is a gentle miss. */
  private async tapGo() {
    const pair = this.pair;
    if (!pair || this.busy || this.finished) return;
    if (!this.pairComplete()) {
      sfx.tick();
      void this.ctx.say('owl.pair-place');
      return;
    }
    const spots = this.owls.map((o) => o.spot);
    const plan = pair.to as number[];
    if (pair.cards.length === 1) return this.hopPair(plan);
    const cards: [Card, Card] = [pair.cards[0], pair.cards[1]];
    const total = this.pairTotal();
    const best = bestPairs(this.path, spots, cards)[0];
    const top = assignTotal(this.path, spots, cards, best);
    if (total === top) return this.hopPair(plan);
    if (!this.scoredPair) {
      pairsSeen = true;
      this.busy = true;
      await this.ctx.say('owl.pair-first', { n: total, m: top });
      return this.hopPair(plan);
    }
    await this.miss(
      () => this.ctx.say('owl.pair-total', { n: total, m: top }),
      () => {
        this.hintPlan = best;
        for (const b of best) this.owls[b].glow.visible = true;
        this.drawMinis();
      },
      async () => {
        await this.ctx.say('owl.together');
        pair.to = [...best];
        pair.sel = null;
        this.redrawPair();
        await this.hopPair(best);
      },
    );
  }

  /** The two owls hop one after the other, the first card's first; then the next pair turns, or everyone is home. */
  private async hopPair(plan: readonly number[]) {
    const pair = this.pair;
    if (!pair) return;
    pairsSeen = true;
    this.busy = true;
    this.pair = null;
    this.clearHint();
    this.minis.removeChildren().forEach((c) => c.destroy({ children: true }));
    this.go.alpha = 0.4;
    this.go.scale.set(1);
    for (const f of this.faces) void this.ctx.tw.to(f, { alpha: 0 }, { duration: 0.3 });
    if (this.total) this.total.text = '';
    for (let k = 0; k < plan.length; k++) {
      const owl = plan[k];
      const spots = this.owls.map((o) => o.spot);
      await this.move(owl, hop(this.path, spots, owl, pair.cards[k]));
    }
    if (
      allHome(
        this.path,
        this.owls.map((o) => o.spot),
      )
    )
      return this.finale();
    await this.dealPair();
  }

  /** The ghost finger: the best way, a card at a time (pick the card, tap its owl), then go. */
  private pairTouch(): TouchIntent | null {
    const pair = this.pair;
    if (!pair) return null;
    if (this.pairComplete()) return { tap: { on: this.go } };
    const spots = this.owls.map((o) => o.spot);
    const best = bestPairs(this.path, spots, [pair.cards[0], pair.cards[1]])[0];
    for (let k = 0; k < 2; k++) {
      if (pair.to[k] === best[k]) continue;
      if (pair.sel !== k) return { tap: { on: this.faces[k] }, pause: 0.15 };
      return { tap: { on: this.owls[best[k]].critter, x: 0, y: -125 }, receiver: this.touch, pause: 0.15 };
    }
    return null;
  }

  private async finale() {
    if (this.finished) return;
    this.finished = true;
    this.busy = true;
    this.setRing(null);
    // The sun comes up only now, when everyone is home: a happy ending, never a race.
    this.sun.visible = true;
    void this.ctx.tw.to(this.dawn, { alpha: 0.55 }, { duration: 1.2 });
    void this.ctx.tw.to(this.moon, { alpha: 0 }, { duration: 1 });
    void this.ctx.tw.to(this.sun, { y: 150 }, { duration: 1.4, ease: ease.outQuad });
    for (const o of this.owls) o.critter.cheer();
    this.ctx.pet.cheer();
    sfx.tada();
    await this.ctx.say('owl.all-home');
    await this.ctx.tw.wait(0.6);
    this.ctx.finish({ misses: this.misses, hints: this.hints });
  }
}

class OwlIcon extends WigglyIcon {
  constructor() {
    const c = new Container();
    ['red', 'blue', 'yellow'].forEach((color, i) => {
      const cName = color as ColorName;
      const s = stoneArt({ color: cName, shape: MARK[cName]! });
      s.position.set(-90 + i * 90, -10 - i * 18);
      c.addChild(s);
    });
    OWL_COLORS.slice(0, 2).forEach((color, i) => {
      const o = owlArt(color);
      o.alive = false;
      o.scale.set(0.4);
      o.position.set(-90 + i * 180, -14 - i * 36);
      c.addChild(o);
    });
    super(c);
  }
}

function sticker(seed: number): Container {
  const rng = new Rng(seed);
  const c = new Container();
  const nest = new Graphics().ellipse(0, 60, 110, 38).fill(wood.light).stroke(line(wood.line, 6));
  c.addChild(nest);
  const n = rng.int(2, 3);
  for (let i = 0; i < n; i++) {
    const o = owlArt(OWL_COLORS[(i + seed) % OWL_COLORS.length]);
    o.alive = false;
    o.scale.set(0.34);
    o.position.set((i - (n - 1) / 2) * 70, 62);
    c.addChild(o);
  }
  return c;
}

export const owlWalk: GameModule = {
  id: 'owl-walk',
  name: 'Owl Walk Home',
  titleLine: 'game.owl-walk',
  region: 'rainbow-meadow',
  challenge: 'logic',
  skills: ['colors', 'shapes', 'taking turns', 'shared goals', 'comparing distances', 'adding'],
  bands: ['lap', 'toddler', 'preschool', 'prek', 'school'],
  levels: (band) => rangeFor(LEVELS, band),
  entryLevels: ENTRY_LEVELS,
  describeLevel: (level) => planFor(level).name,
  music: STYLES.lullaby,
  coplayHint:
    'Take turns with {name}: you flip a card, then {name} does. Say the color together, and cheer each owl home.',
  // Lap plays the stepping stones (no cards): the tip and the off-screen idea are about hopping along, not turns.
  coplayHintLap:
    'Tap a stone together with {name} and watch the owl hop. Hum each note, and cheer when it reaches the nest.',
  offScreen: {
    all: 'Play a cooperative board game together, like Hoot Owl Hoot! or First Orchard, where everyone wins together.',
    lap: 'Lay cushions in a row on the floor and help {name} step or crawl from one to the next, all the way to a blanket nest.',
  },
  hubIcon: () => new OwlIcon(),
  touchDemo: true,
  sticker,
  create: (ctx) => new OwlWalk(ctx),
};
