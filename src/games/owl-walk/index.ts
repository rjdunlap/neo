import { Circle, Container, Graphics, type FederatedPointerEvent } from 'pixi.js';
import { Critter, type CritterSpec } from '../../art/critter';
import { ink, swatch, wood, type ColorName } from '../../art/palette';
import { Backdrop, Sun } from '../../art/scenery';
import { puffs, shapePath, type ShapeKind } from '../../art/shapes';
import { STYLES } from '../../audio/music';
import { sfx } from '../../audio/sfx';
import { onTap } from '../../engine/input';
import { Rng } from '../../engine/random';
import { ease } from '../../engine/tween';
import type { View } from '../../engine/view';
import { rangeFor, type BandLevels } from '../../progress/difficulty';
import { label } from '../../ui/text';
import { WigglyIcon } from '../shared';
import type { Game, GameContext, GameModule } from '../types';
import { allHome, drawCard, farthest, hop, hops, makePath, planFor, type OwlPlan, type Spot } from './logic';

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
}

class OwlWalk implements Game {
  readonly plan: OwlPlan;
  readonly path: ColorName[];
  readonly owls: Owl[] = [];
  readonly stones: Graphics[] = [];
  readonly deck = new Container();
  /** The card turned up this turn, or null. */
  card: ColorName | null = null;
  /** Whose turn it is: the child's, or the pet's (from level 2). */
  turn: 'child' | 'pet' = 'child';
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
  private view: View;
  private wrongs = 0;
  private hinted = false;
  private told = false;

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
    this.previews.eventMode = 'none';
    this.trail.eventMode = 'none';
    this.dawn.eventMode = 'none';
    ctx.stage.addChild(this.backdrop, this.moon, this.sun, this.dawn, this.nest, this.trail, ...this.stones, this.previews, this.layer, this.deck, this.shown);
    for (let i = 0; i < this.plan.owls; i++) {
      const critter = ctx.track(makeOwl(OWL_COLORS[i]));
      critter.scale.set(OWL_SCALE);
      const glow = new Graphics().circle(0, -130, 170).fill({ color: 0xfff3a0, alpha: 0.85 });
      glow.visible = false;
      critter.addChildAt(glow, 0);
      critter.hitArea = new Circle(0, -125, 190);
      critter.on('pointerdown', (e: FederatedPointerEvent) => this.tapOwl(e));
      critter.eventMode = 'static';
      critter.cursor = 'pointer';
      this.owls.push({ critter, spot: -1, glow });
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
    this.drawPreviews();
  }

  update() {}

  destroy() {}

  private async intro() {
    const lines = { one: 'owl.one', turns: 'owl.turns', choose: 'owl.turns', farthest: 'owl.farthest' } as const;
    await this.ctx.instruct(lines[this.plan.mode]);
    this.busy = false;
  }

  // A turn: flip a card, then hop an owl ------------------------------------------------------------

  private async flip(who: 'child' | 'pet') {
    if (this.finished || this.card || this.turn !== who || (who === 'child' && this.busy)) return;
    this.busy = true;
    const color = drawCard(this.plan, this.ctx.rng);
    this.card = color;
    sfx.whoosh();
    const face = cardFace(color);
    face.scale.set(0, 1);
    this.shown.addChild(face);
    await this.ctx.tw.to(face.scale, { x: 1 }, { duration: 0.25, ease: ease.outBack });
    sfx.pop(7);
    await this.ctx.say('owl.color', { color });
    this.drawPreviews();
    if (who === 'pet') return;
    this.busy = false;
    this.wrongs = 0;
    const moving = this.owls.filter((o) => o.spot < this.path.length);
    if (!this.told || moving.length === 1) {
      this.told = true;
      await this.ctx.instruct('owl.tap-owl', { color });
    }
  }

  /** Owls stand close together, so a touch goes to the nearest owl that can still move. */
  private tapOwl(e: FederatedPointerEvent) {
    if (this.busy || this.finished || this.turn !== 'child') return;
    const p = this.layer.toLocal(e.global);
    const near = this.owls
      .filter((o) => o.spot < this.path.length)
      .sort((a, b) => Math.hypot(a.critter.x - p.x, a.critter.y - 40 - p.y) - Math.hypot(b.critter.x - p.x, b.critter.y - 40 - p.y))[0];
    if (!near) return;
    if (!this.card) {
      near.critter.poke();
      void this.ctx.say('owl.flip-first');
      return;
    }
    void this.choose(this.owls.indexOf(near));
  }

  async choose(i: number) {
    const color = this.card;
    if (!color || this.busy) return;
    const spots = this.owls.map((o) => o.spot);
    if (this.plan.mode === 'farthest' && !farthest(this.path, spots, color).includes(i)) {
      // Comparing hops is the decision here: a shorter hop is a gentle miss with the numbers said aloud.
      this.misses++;
      this.wrongs++;
      sfx.boing();
      const h = hops(this.path, spots, color);
      const best = farthest(this.path, spots, color);
      this.owls[i].critter.poke();
      await this.ctx.say('owl.not-farthest', { a: h[i], b: h[best[0]] });
      if (this.wrongs >= 2) {
        if (!this.hinted) {
          this.hinted = true;
          this.hints++;
        }
        for (const b of best) this.owls[b].glow.visible = true;
      }
      return;
    }
    await this.move(i);
    await this.endTurn();
  }

  /** Hop by hop along the stones to the landing spot (or all the way home). */
  private async move(i: number) {
    this.busy = true;
    const owl = this.owls[i];
    const to = hop(this.path, this.owls.map((o) => o.spot), i, this.card!);
    for (const o of this.owls) o.glow.visible = false;
    this.previews.removeChildren().forEach((c) => c.destroy({ children: true }));
    const stops: Spot[] = [];
    for (let s = Math.max(0, owl.spot + 1); s < Math.min(to, this.path.length); s++) stops.push(s);
    stops.push(to);
    for (const s of stops) {
      const p = this.spotAt(s, i);
      owl.critter.hop(0.5);
      sfx.marimba(4 + Math.min(9, stops.indexOf(s)), 0.3);
      await this.ctx.tw.to(owl.critter, { x: p.x, y: p.y }, { duration: s === to && to >= this.path.length ? 0.6 : 0.24, ease: ease.inOutSine });
    }
    owl.spot = to;
    this.index++;
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

  /** The pet plays fair and shows good thinking: it hops the owl that goes the farthest. */
  private async petTurn() {
    this.ctx.pet.cheer();
    await this.ctx.say('owl.my-turn');
    await this.flip('pet');
    const best = farthest(this.path, this.owls.map((o) => o.spot), this.card!)[0];
    this.owls[best].glow.visible = true;
    await this.ctx.say('owl.pet-move', { color: this.card! });
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
  sticker,
  create: (ctx) => new OwlWalk(ctx),
};
