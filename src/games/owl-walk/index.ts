import { Circle, Container, Graphics, Rectangle, type FederatedPointerEvent } from 'pixi.js';
import { Critter, type CritterSpec } from '../../art/critter';
import { ink, swatch, wood, type ColorName } from '../../art/palette';
import { Backdrop, Sun } from '../../art/scenery';
import { puffs, shapePath, type ShapeKind } from '../../art/shapes';
import { STYLES } from '../../audio/music';
import { sfx } from '../../audio/sfx';
import { onTap, palmOnGlass } from '../../engine/input';
import { Rng } from '../../engine/random';
import { ease } from '../../engine/tween';
import type { View } from '../../engine/view';
import { rangeFor, type BandLevels } from '../../progress/difficulty';
import { label } from '../../ui/text';
import { WigglyIcon } from '../shared';
import type { Game, GameContext, GameModule, TouchIntent } from '../types';
import { allHome, drawCardFor, farthest, hop, hops, judgeStone, makePath, owlOf, owlToHop, planFor, type OwlPlan, type Spot } from './logic';

const LEVELS: BandLevels = {
  toddler: { min: 1, max: 2 },
  preschool: { min: 1, max: 3 },
  prek: { min: 2, max: 4 },
};

/** Each stone color also has its own shape, so the match never rests on hue alone. */
const MARK: Partial<Record<ColorName, ShapeKind>> = { red: 'heart', blue: 'circle', yellow: 'star', green: 'triangle' };
const OWL_COLORS: ColorName[] = ['purple', 'brown', 'pink'];
const OWL_SCALE = 0.3;
const line = (color: number, width = 5) => ({ width, color, join: 'round' as const, cap: 'round' as const });

const owlSpec = (color: ColorName): CritterSpec => ({ color, ears: 'pointy', snout: 'none', wings: true, belly: true });

/** A baby owl: a critter with eye rings, a little beak and ear tufts. */
function makeOwl(color: ColorName): Critter {
  const c = new Critter(owlSpec(color));
  const face = new Graphics()
    .circle(-40, -142, 36).circle(40, -142, 36).stroke({ width: 7, color: swatch.yellow.light, alpha: 0.9 })
    .poly([-12, -112, 12, -112, 0, -92]).fill(swatch.orange.fill).stroke(line(swatch.orange.line, 3));
  c.attach(face);
  return c;
}

function stoneArt(color: ColorName): Graphics {
  const sw = swatch[color];
  const g = new Graphics().ellipse(0, 6, 44, 20).fill({ color: 0x000000, alpha: 0.18 }).ellipse(0, 0, 44, 22).fill(sw.fill).stroke(line(sw.line, 4));
  const mark = MARK[color];
  if (mark) {
    const m = shapePath(new Graphics(), mark, 11).fill(sw.light);
    m.scale.set(1, 0.7);
    g.addChild(m);
  }
  return g;
}

function cardFace(color: ColorName): Container {
  const sw = swatch[color];
  const c = new Container();
  c.addChild(new Graphics().roundRect(-56, -76, 112, 152, 14).fill(0xffffff).stroke(line(sw.line, 6)).roundRect(-44, -64, 88, 128, 10).fill(sw.fill));
  const mark = MARK[color];
  if (mark) c.addChild(shapePath(new Graphics(), mark, 30).fill(sw.light).stroke(line(sw.line, 4)));
  return c;
}

function cardBack(): Graphics {
  return new Graphics()
    .roundRect(-56, -76, 112, 152, 14).fill(swatch.purple.fill).stroke(line(swatch.purple.line, 6))
    .circle(0, 0, 26).fill(swatch.yellow.light).circle(12, -8, 22).fill(swatch.purple.fill);
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
const STONE_REACH = 56;
const OWL_REACH = 62;
const NEST_REACH = 95;
const RING_REACH = 44;

/** "red heart": the color and the shape a stone carries, so a spoken miss can name what was touched. */
const stoneName = (color: ColorName) => (MARK[color] ? `${color} ${MARK[color]}` : color);

class OwlWalk implements Game {
  readonly plan: OwlPlan;
  readonly path: ColorName[];
  readonly owls: Owl[] = [];
  readonly stones: Graphics[] = [];
  readonly deck = new Container();
  /** Takes every touch on the path: the nearest stone, owl or the nest is what was meant. */
  readonly touch = new Container();
  /** The card turned up this turn, or null. */
  card: ColorName | null = null;
  /** Whose turn it is: the child's, or the pet's (from level 2). */
  turn: 'child' | 'pet' = 'child';
  /** The owl she has picked to hop on the levels that ask which one (3 and 4). */
  selected: number | null = null;
  /** Turns taken so far, by both players. */
  index = 0;
  misses = 0;
  hints = 0;
  busy = true;
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

  constructor(private readonly ctx: GameContext) {
    this.view = ctx.view;
    this.plan = planFor(ctx.level);
    this.path = makePath(this.plan, ctx.rng);
    this.backdrop = ctx.track(new Backdrop({ sky: [swatch.purple.line, swatch.blue.line], hills: [swatch.teal.line, 0x3f7f2e, 0x4a9a35], horizon: 0.42, clouds: 0, sun: false, seed: 77 }, ctx.view));
    this.moon.circle(0, 0, 40).fill(swatch.yellow.light).circle(16, -10, 34).fill(swatch.purple.line);
    this.dawn.alpha = 0;
    this.sun.visible = false;
    for (const color of this.path) this.stones.push(stoneArt(color));
    const tree = new Graphics().roundRect(-24, -150, 48, 160, 12).fill(wood.fill).stroke(line(wood.line, 5));
    puffs(tree, [[-60, -170, 54], [55, -165, 52], [0, -215, 62]], swatch.green.line, 0x3f7f2e, 5);
    const nest = new Graphics().ellipse(0, -120, 92, 34).fill(wood.light).stroke(line(wood.line, 6));
    for (let k = -3; k <= 3; k++) nest.moveTo(k * 24 - 14, -132).lineTo(k * 24 + 14, -108).stroke(line(wood.line, 3));
    this.nest.addChild(tree, nest);
    this.deck.addChild(cardBack());
    const back2 = cardBack();
    back2.position.set(6, 6);
    this.deck.addChildAt(back2, 0);
    this.deck.hitArea = new Circle(0, 0, 90);
    onTap(this.deck, () => void this.flip('child'), { cooldown: 400 });
    this.hintGlow.circle(0, 0, 66).fill({ color: 0xfff3a0, alpha: 0.85 });
    this.hintGlow.visible = false;
    for (const quiet of [this.previews, this.trail, this.dawn, this.hintGlow, this.flies, this.fx]) quiet.eventMode = 'none';
    this.touch.eventMode = 'static';
    this.touch.cursor = 'pointer';
    this.touch.on('pointerdown', (e: FederatedPointerEvent) => this.tapAt(e));
    ctx.stage.addChild(this.backdrop, this.moon, this.sun, this.dawn, this.nest, this.trail, this.hintGlow, ...this.stones, this.flies, this.previews, this.layer, this.touch, this.deck, this.shown, this.fx);
    for (let i = 0; i < this.plan.owls; i++) {
      const critter = ctx.track(makeOwl(OWL_COLORS[i]));
      critter.scale.set(OWL_SCALE);
      const glow = new Graphics().circle(0, -130, 170).fill({ color: 0xfff3a0, alpha: 0.85 });
      glow.visible = false;
      const ring = new Graphics().circle(0, -130, 185).stroke({ width: 22, color: swatch[OWL_COLORS[i]].light, alpha: 0.95 });
      ring.visible = false;
      critter.addChildAt(ring, 0);
      critter.addChildAt(glow, 0);
      // Touches go through `touch`, which finds the nearest owl, stone or nest.
      critter.eventMode = 'none';
      this.owls.push({ critter, spot: -1, glow, ring });
      this.layer.addChild(critter);
    }
  }

  /** Two rows: right to left along the bottom, a turn, then left to right up to the nest. */
  stoneAt(i: number) {
    const v = this.view;
    const n = this.path.length;
    const perRow = Math.ceil(n / 2);
    const left = 250;
    const right = v.w - 230;
    const step = (right - left) / (perRow - 1);
    const bottom = v.h - 110;
    const top = v.h - 330;
    return i < perRow ? { x: right - i * step, y: bottom } : { x: left + (i - perRow) * step, y: top };
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
    return { x: this.nest.x, y: this.nest.y - 120 };
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
    this.backdrop.resize(v);
    this.moon.position.set(v.w * 0.75, 120);
    this.sun.position.set(v.w * 0.75, v.h * 0.42);
    this.dawn.clear().rect(0, 0, v.w, v.h * 0.45).fill(swatch.orange.light);
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
    this.shown.position.set(v.w * 0.36 + 150, 125);
    this.touch.hitArea = new Rectangle(0, 0, v.w, v.h);
    if (this.hintAt !== null) this.hintGlow.position.copyFrom(this.targetPoint(this.hintAt));
    this.drawPreviews();
  }

  update(dt: number) {
    if (!this.fireflies.length) return;
    this.clock += dt;
    for (const f of this.fireflies) {
      const p = this.stoneAt(f.stone);
      const a = this.clock * 1.4 + f.phase;
      f.g.position.set(p.x + Math.cos(a) * f.reach, p.y - 34 + Math.sin(a * 1.3) * f.reach * 0.7);
      f.g.alpha = 0.55 + 0.45 * Math.sin(this.clock * 3 + f.phase);
    }
  }

  /** The ghost finger: flip a card, pick the owl (on the levels that ask), then tap the stone it hops to, or the nest. The pet's turns play themselves. */
  autotouch(): TouchIntent | null {
    if (this.busy || this.finished || this.turn !== 'child') return null;
    if (!this.card) return { tap: { on: this.deck } };
    const spots = this.owls.map((o) => o.spot);
    const asks = this.plan.mode === 'choose' || this.plan.mode === 'farthest';
    if (asks && this.selected === null && this.moving().length > 1) {
      const i = owlToHop(this.path, spots, this.card);
      // The owl's tap area is centered a little above its feet.
      return i === null ? null : { tap: { on: this.owls[i].critter, x: 0, y: -125 }, receiver: this.touch, pause: 0.2 };
    }
    const i = this.actorOwl();
    if (i === null) return null;
    const to = hop(this.path, spots, i, this.card);
    return to >= this.path.length ? { tap: { on: this.nest, x: 0, y: -120 }, receiver: this.touch } : { tap: { on: this.stones[to] }, receiver: this.touch };
  }

  destroy() {}

  private async intro() {
    const lines = { one: 'owl.one', turns: 'owl.turns', choose: 'owl.choose', farthest: 'owl.farthest' } as const;
    await this.ctx.instruct(lines[this.plan.mode]);
    this.busy = false;
  }

  private moving() {
    return this.owls.map((o, i) => (o.spot < this.path.length ? i : -1)).filter((i) => i >= 0);
  }

  /** The owl the child's stone tap is for: her own on the first levels, the one she picked on the others. */
  private actorOwl(): number | null {
    const spots = this.owls.map((o) => o.spot);
    if (this.plan.mode === 'one') return 0;
    if (this.plan.mode === 'turns') return owlOf(this.path, spots, 0);
    return this.selected;
  }

  /** A halo on the owl whose turn it is (one each) or the one picked (the levels that ask). */
  private setRing(only: number | null) {
    this.owls.forEach((o, i) => (o.ring.visible = i === only));
  }

  // A turn: flip a card, pick the owl, tap its stone --------------------------------------------

  private async flip(who: 'child' | 'pet') {
    if (this.finished || this.card || this.turn !== who || (who === 'child' && this.busy)) return;
    this.busy = true;
    this.wrongs = 0;
    this.hinted = false;
    this.selected = null;
    this.clearHint();
    const spots = this.owls.map((o) => o.spot);
    const assigned = this.plan.mode === 'turns' ? owlOf(this.path, spots, who === 'child' ? 0 : 1) : null;
    const movers = this.plan.mode === 'one' ? [0] : assigned !== null ? [assigned] : this.moving();
    const color = drawCardFor(this.plan, this.ctx.rng, this.path, spots, movers);
    this.card = color;
    if (assigned !== null) this.setRing(assigned);
    sfx.whoosh();
    const face = cardFace(color);
    face.scale.set(0, 1);
    this.shown.addChild(face);
    await this.ctx.tw.to(face.scale, { x: 1 }, { duration: 0.25, ease: ease.outBack });
    sfx.pop(7);
    await this.ctx.say('owl.color', { color });
    this.drawPreviews();
    if (this.plan.twinkle) this.twinkle(movers[0]);
    if (who === 'pet') return;
    this.busy = false;
    // One owl left walking: there is nothing to pick.
    if ((this.plan.mode === 'choose' || this.plan.mode === 'farthest') && movers.length === 1) this.select(movers[0], false);
    const i = this.actorOwl();
    if (i === null) {
      if (!this.told) {
        this.told = true;
        void this.ctx.instruct('owl.pick-owl', { color });
      }
      return;
    }
    await this.announce(i);
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
      if (!this.owls.some((o) => o.spot === i)) consider({ kind: 'stone', i }, this.stoneAt(i), STONE_REACH);
    });
    consider({ kind: 'nest' }, this.nestPoint(), NEST_REACH);
    this.owls.forEach((o, i) => {
      if (o.spot < this.path.length) consider({ kind: 'owl', i }, { x: o.critter.x, y: o.critter.y - 38 }, OWL_REACH);
    });
    // On the farthest level the numbered rings are the most eye-catching thing on the path: touching one means its owl.
    if (this.plan.mode === 'farthest' && this.card) {
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
    if (this.busy || this.finished || this.turn !== 'child') return;
    const hit = this.nearest(this.touch.toLocal(e.global));
    if (!hit) return;
    // Touch-down answers at once, before the judgment: the stone squashes and a ring spreads.
    const at = hit.kind === 'owl' ? { x: this.owls[hit.i].critter.x, y: this.owls[hit.i].critter.y - 38 } : this.targetPoint(hit.kind === 'stone' ? hit.i : 'nest');
    this.ripple(at.x, at.y);
    if (hit.kind === 'stone') this.squash(this.stones[hit.i]);
    if (!this.card) {
      if (hit.kind === 'owl') this.owls[hit.i].critter.poke();
      void this.ctx.say('owl.flip-first');
      void this.ctx.tw.to(this.deck.scale, { x: 1.12, y: 1.12 }, { duration: 0.12 }).then(() => this.ctx.tw.to(this.deck.scale, { x: 1, y: 1 }, { duration: 0.12 }));
      return;
    }
    if (hit.kind === 'owl') void this.pickOwl(hit.i);
    else void this.tapStone(hit.kind === 'stone' ? hit.i : 'nest');
  }

  /** The owl step of levels 3 and 4: a free choice on 3, and on 4 it must be one that hops the farthest. */
  private async pickOwl(i: number) {
    const color = this.card;
    if (!color || this.busy) return;
    const mode = this.plan.mode;
    if (mode === 'one' || mode === 'turns') {
      // These levels choose the stone, not the owl: tapping an owl (what the old game taught) is never a miss; it answers and the voice says what to tap.
      this.owls[i].critter.poke();
      void this.ctx.say('owl.tap-stone', { color });
      return;
    }
    const spots = this.owls.map((o) => o.spot);
    if (mode === 'farthest' && !farthest(this.path, spots, color).includes(i)) {
      // Comparing hops is the decision here: a shorter hop is a gentle miss with the numbers said aloud.
      const h = hops(this.path, spots, color);
      const best = farthest(this.path, spots, color);
      this.owls[i].critter.poke();
      await this.miss(() => this.ctx.say('owl.not-farthest', { a: h[i], b: h[best[0]] }), () => {
        for (const b of best) this.owls[b].glow.visible = true;
      }, async () => {
        await this.ctx.say('owl.together');
        this.busy = false;
        this.select(best[0], true);
      });
      return;
    }
    this.select(i, true);
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
    const need = stoneName(color);
    const have = tapped === 'nest' ? 'the nest' : `a ${stoneName(this.path[tapped])}`;
    const lines = {
      'wrong-color': () => this.ctx.say('owl.wrong-color', { have, need }),
      far: () => this.ctx.say('owl.far', { need }),
      behind: () => this.ctx.say('owl.behind', { color }),
      occupied: () => this.ctx.say('owl.occupied', { color }),
      'early-nest': () => this.ctx.say('owl.early-nest', { color }),
    } as const;
    const to = hop(this.path, spots, i, color);
    await this.miss(lines[verdict], () => this.showHint(to >= this.path.length ? 'nest' : to), async () => {
      await this.ctx.say('owl.together');
      await this.move(i);
      await this.endTurn();
    });
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
    this.hintGlow.visible = false;
    for (const o of this.owls) o.glow.visible = false;
  }

  /** Matching stones ahead of the owl twinkle with fireflies when a card turns: the set to look through, never the answer. */
  private twinkle(i: number) {
    this.clearTwinkle();
    const spots = this.owls.map((o) => o.spot);
    const light = swatch[this.card!].light;
    for (let s = spots[i] + 1; s < this.path.length; s++) {
      if (this.path[s] !== this.card || spots.includes(s)) continue;
      for (let k = 0; k < 5; k++) {
        const g = new Graphics().circle(0, 0, 15).fill({ color: light, alpha: 0.35 }).circle(0, 0, 8).fill(light).circle(0, 0, 4).fill(0xffffff);
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
    void this.ctx.tw.to(stone.scale, { x: 1.15, y: 0.8 }, { duration: 0.07 }).then(() => this.ctx.tw.to(stone.scale, { x: 1, y: 1 }, { duration: 0.12, ease: ease.outBack }));
  }

  /** Hop by hop along the stones to the landing spot (or all the way home), counting the stones aloud. */
  private async move(i: number) {
    this.busy = true;
    const owl = this.owls[i];
    const spots = this.owls.map((o) => o.spot);
    const to = hop(this.path, spots, i, this.card!);
    this.clearHint();
    this.clearTwinkle();
    this.setRing(null);
    this.previews.removeChildren().forEach((c) => c.destroy({ children: true }));
    const stops: Spot[] = [];
    for (let s = Math.max(0, owl.spot + 1); s < Math.min(to, this.path.length); s++) stops.push(s);
    stops.push(to);
    const counted = to < this.path.length;
    for (const s of stops) {
      const p = this.spotAt(s, i);
      const k = stops.indexOf(s);
      owl.critter.hop(0.5);
      sfx.marimba(4 + Math.min(9, k), 0.3);
      if (counted) void this.ctx.say('count', { n: k + 1 });
      await this.ctx.tw.to(owl.critter, { x: p.x, y: p.y }, { duration: s === to && to >= this.path.length ? 0.6 : counted ? 0.28 : 0.24, ease: ease.inOutSine });
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
    for (const old of [...this.shown.children]) void this.ctx.tw.to(old, { alpha: 0 }, { duration: 0.3 }).then(() => old.destroy({ children: true }));
  }

  private async endTurn() {
    if (allHome(this.path, this.owls.map((o) => o.spot))) return this.finale();
    if (this.plan.mode === 'one') {
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
    if (to >= this.path.length) await this.ctx.say('owl.pet-nest', { color });
    else if (this.plan.mode === 'turns') await this.ctx.say('owl.pet-look', { need: stoneName(color) });
    else await this.ctx.say('owl.pet-move', { color, n: to - spots[best] });
    // The pet touches the same place she would, so she sees the action she is learning.
    const at = this.targetPoint(to >= this.path.length ? 'nest' : to);
    this.ripple(at.x, at.y);
    await this.move(best);
    if (allHome(this.path, this.owls.map((o) => o.spot))) return this.finale();
    this.turn = 'child';
    this.busy = false;
    await this.ctx.instruct('owl.your-turn');
  }

  /** On the farthest level, each owl shows where this card would take it, and how many stones that is. */
  private drawPreviews() {
    this.previews.removeChildren().forEach((c) => c.destroy({ children: true }));
    if (this.plan.mode !== 'farthest' || !this.card) return;
    const spots = this.owls.map((o) => o.spot);
    const h = hops(this.path, spots, this.card);
    this.owls.forEach((o, i) => {
      if (o.spot >= this.path.length) return;
      const to = hop(this.path, spots, i, this.card!);
      const p = this.spotAt(to, i);
      const ring = new Graphics().circle(0, -28, 30).fill({ color: swatch[OWL_COLORS[i]].light, alpha: 0.85 }).stroke(line(swatch[OWL_COLORS[i]].line, 4));
      const n = label(String(h[i]), 26, ink);
      n.y = -28;
      ring.addChild(n);
      ring.position.set(p.x, p.y - 70);
      this.previews.addChild(ring);
    });
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
      const s = stoneArt(color as ColorName);
      s.position.set(-90 + i * 90, -10 - i * 18);
      c.addChild(s);
    });
    OWL_COLORS.slice(0, 2).forEach((color, i) => {
      const o = makeOwl(color);
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
    const o = makeOwl(OWL_COLORS[(i + seed) % OWL_COLORS.length]);
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
  skills: ['colors', 'taking turns', 'shared goals', 'comparing distances'],
  bands: ['toddler', 'preschool', 'prek'],
  levels: (band) => rangeFor(LEVELS, band),
  describeLevel: (level) => planFor(level).name,
  music: STYLES.lullaby,
  coplayHint: 'Take turns with {name}: you flip a card, then {name} does. Say the color together, and cheer each owl home.',
  offScreen: 'Play a cooperative board game together, like Hoot Owl Hoot! or First Orchard, where everyone wins together.',
  hubIcon: () => new OwlIcon(),
  touchDemo: true,
  sticker,
  create: (ctx) => new OwlWalk(ctx),
};
