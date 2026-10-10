import { Container, Graphics, Rectangle, RenderTexture, Sprite, type FederatedPointerEvent, type Renderer } from 'pixi.js';
import { RAINBOW, swatch, wood, type ColorName } from '../../art/palette';
import { flower, starPoints } from '../../art/shapes';
import { textures } from '../../art/textures';
import { STYLES } from '../../audio/music';
import { stepFromUnit } from '../../audio/notes';
import { sfx } from '../../audio/sfx';
import { PAINTING_MAX_MARKS, type PaintingCreation, type PaintingMark } from '../../content/creations';
import { onTap, palmOnGlass } from '../../engine/input';
import { Rng } from '../../engine/random';
import { ease } from '../../engine/tween';
import type { View } from '../../engine/view';
import { RoundButton } from '../../ui/buttons';
import { frameIcon } from '../../ui/icons';
import type { Game, GameContext, GameModule, TouchIntent } from '../types';
import { BRUSH_RADIUS, Coverage, fillPath, MARGIN, mix, paintStep, PAINTED, pickThings, planFor, RECIPES, scribble, scribbleArea, SPACING, type PaintPlan, type Primary, type Thing } from './logic';
import { rangeFor, type BandLevels } from '../../progress/difficulty';

const PAPER = 0xfffdf6;
/** Degrees of hue per unit of stroke: the rainbow comes from moving. */
const HUE_PER_UNIT = 0.45;
const FLOWER_COLORS: ColorName[] = ['pink', 'purple', 'red', 'blue', 'orange', 'yellow'];
/** Rainbows, then pots, then coloring pages: named colors, remembered colors, mixed colors, and a recalled mix (`logic.ts`). */
const LEVELS: BandLevels = {
  lap: { min: 1, max: 2 },
  toddler: { min: 1, max: 3 },
  preschool: { min: 2, max: 5 },
  prek: { min: 3, max: 6 },
  school: { min: 5, max: 7 },
};
const POTS: (ColorName | 'rainbow')[] = ['rainbow', ...RAINBOW];
const PRIMARIES: Primary[] = ['red', 'yellow', 'blue'];
const LINE = 0x5a4a3c;

/** A coloring-page picture: an outline that stays on top of the paint, plus its painting progress. */
class Picture {
  readonly node = new Container();
  readonly coverage: Coverage;
  done = false;

  constructor(
    readonly thing: Thing,
    readonly x: number,
    readonly y: number,
    readonly scale: number,
    renderer: Renderer,
  ) {
    this.coverage = new Coverage(thing.circles);
    // The outline is a ring around the union of circles: draw it fat, then erase the inside.
    const pad = 12;
    const x0 = Math.min(...thing.circles.map(([cx, , r]) => cx - r)) - pad;
    const x1 = Math.max(...thing.circles.map(([cx, , r]) => cx + r)) + pad;
    const y0 = Math.min(...thing.circles.map(([, cy, r]) => cy - r)) - pad;
    const y1 = Math.max(...thing.circles.map(([, cy, r]) => cy + r)) + pad;
    const rt = RenderTexture.create({ width: Math.ceil(x1 - x0), height: Math.ceil(y1 - y0), resolution: 2 });
    const ring = new Graphics();
    for (const [cx, cy, r] of thing.circles) ring.circle(cx - x0, cy - y0, r + 3);
    ring.fill(LINE);
    const hole = new Graphics();
    for (const [cx, cy, r] of thing.circles) hole.circle(cx - x0, cy - y0, r - 3);
    hole.fill(0xffffff);
    hole.blendMode = 'erase';
    // The erase has to happen inside the same render as the ring for the blend to apply.
    const both = new Container();
    both.addChild(ring, hole);
    renderer.render({ container: both, target: rt, clear: true, clearColor: [0, 0, 0, 0] });
    both.destroy({ children: true });
    const outline = new Sprite(rt);
    outline.position.set(x0, y0);
    this.node.addChild(outline, decor(thing));
    this.node.position.set(x, y);
    this.node.scale.set(scale);
  }

  /** Paper coordinates to picture coordinates. */
  local(px: number, py: number) {
    return { x: (px - this.x) / this.scale, y: (py - this.y) / this.scale };
  }

  contains(px: number, py: number, reach = 0): boolean {
    const p = this.local(px, py);
    return this.thing.circles.some(([cx, cy, r]) => Math.hypot(p.x - cx, p.y - cy) <= r + reach / this.scale);
  }

  /** The neat solid fill, for baking into the painting when it's done. */
  fill(): Graphics {
    const sw = swatch[this.thing.color];
    const g = new Graphics();
    for (const [cx, cy, r] of this.thing.circles) g.circle(cx, cy, r);
    g.fill(sw.fill);
    g.position.set(this.x, this.y);
    g.scale.set(this.scale);
    return g;
  }
}

/** Stems, rays and veins drawn on top of a picture. */
function decor(thing: Thing): Graphics {
  const g = new Graphics();
  const line = { width: 6, color: LINE, cap: 'round' as const, join: 'round' as const };
  switch (thing.id) {
    case 'sun':
      for (let i = 0; i < 10; i++) {
        const a = (i / 10) * Math.PI * 2;
        g.moveTo(Math.cos(a) * 100, Math.sin(a) * 100).lineTo(Math.cos(a) * 128, Math.sin(a) * 128);
      }
      g.stroke({ ...line, color: swatch.yellow.line, width: 9 });
      break;
    case 'apple':
      g.moveTo(0, -46).quadraticCurveTo(4, -76, 14, -90).stroke({ ...line, color: wood.line, width: 9 });
      g.moveTo(10, -74).quadraticCurveTo(44, -104, 66, -78).quadraticCurveTo(40, -58, 10, -74).fill(swatch.green.fill).stroke(line);
      break;
    case 'leaf':
      g.moveTo(-132, 66).lineTo(96, -48).stroke(line);
      for (const t of [-0.45, 0, 0.45]) {
        const [x, y] = [t * 170, -t * 85];
        g.moveTo(x, y).lineTo(x + 12, y + 30).moveTo(x, y).lineTo(x - 16, y - 28);
      }
      g.stroke({ ...line, width: 4 });
      break;
    case 'pumpkin':
      g.moveTo(-20, -40).quadraticCurveTo(-30, 10, -20, 70).moveTo(20, -40).quadraticCurveTo(30, 10, 20, 70).stroke({ ...line, width: 4 });
      g.roundRect(-10, -88, 20, 34, 6).fill(swatch.green.fill).stroke(line);
      break;
    case 'grapes':
      g.moveTo(0, -72).quadraticCurveTo(4, -96, 20, -108).stroke({ ...line, color: wood.line, width: 9 });
      g.moveTo(8, -88).quadraticCurveTo(-40, -120, -60, -84).quadraticCurveTo(-24, -70, 8, -88).fill(swatch.green.fill).stroke(line);
      break;
    case 'blueberry':
      g.poly(starPoints(26, 11, 5).map((v, i) => v + (i % 2 ? -52 : 0))).fill(swatch.blue.line).stroke({ ...line, width: 4 });
      g.ellipse(-34, -28, 16, 10).fill({ color: 0xffffff, alpha: 0.5 });
      break;
  }
  return g;
}

/** A paint pot with its color on top; the rainbow pot is striped. */
function paintPot(color: ColorName | 'rainbow'): Container {
  const c = new Container();
  const jar = new Graphics()
    .roundRect(-30, -22, 60, 50, 12)
    .fill(0xffffff)
    .stroke({ width: 5, color: 0xb9b2a6 });
  const top = new Graphics().ellipse(0, -22, 30, 12);
  if (color === 'rainbow') {
    top.fill(0xffffff);
    RAINBOW.forEach((c2, i) => top.rect(-27 + i * 9, -32, 9, 20).fill(swatch[c2].fill));
    top.ellipse(0, -22, 30, 12).stroke({ width: 4, color: 0xb9b2a6 });
  } else {
    top.fill(swatch[color].fill).stroke({ width: 4, color: swatch[color].line });
  }
  const drip = new Graphics().roundRect(10, -22, 8, 22, 4).fill(color === 'rainbow' ? swatch.purple.fill : swatch[color].fill);
  c.addChild(jar, drip, top);
  return c;
}

interface Stroke {
  x: number;
  y: number;
  /** Each finger runs its own rainbow. */
  hue: number;
  /** A picked color, or null for rainbow. */
  color: number | null;
  travelled: number;
  startedAt: number;
  lastStep: number;
  lastNoteAt: number;
  sparkleIn: number;
}

/** h in degrees, s and l in 0..1. */
function hsl(h: number, s: number, l: number): number {
  const k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return (Math.round(f(0) * 255) << 16) | (Math.round(f(8) * 255) << 8) | Math.round(f(4) * 255);
}

class RainbowFingers implements Game {
  /** The easel (later the wall) behind the paper. */
  private readonly backing = new Graphics();
  private readonly paper = new Container();
  private readonly sheet = new Graphics();
  private readonly canvas = new Sprite();
  private readonly live = new Container();
  private readonly stamps = new Container();
  private readonly pool: Sprite[] = [];
  private readonly strokes = new Map<number, Stroke>();
  /** A bounded, normalized replay of free painting for the treehouse picture board. */
  private paintingMarks: PaintingMark[] = [];
  private dabCount = 0;
  private dabEvery = 3;
  private readonly frameButton: RoundButton;
  private readonly pots = new Container();
  private readonly potRing = new Graphics();
  private readonly potGlow = new Graphics();
  private readonly potNodes = new Map<ColorName | 'rainbow', Container>();
  private readonly bowl = new Container();
  private readonly bowlPaint = new Graphics();
  /** What's been poured into the mixing bowl (two at most). */
  private poured: Primary[] = [];
  private readonly plan: PaintPlan;
  private readonly things: Thing[];
  private readonly pictureLayer = new Container();
  private pictures: Picture[] = [];
  private current = 0;
  private glowing: (ColorName | 'rainbow')[] = [];
  private misses = 0;
  private hints = 0;
  private lastNag = -10;
  private sinceAsk = 0;
  private wrongs = 0;
  /** The picked color, or null for rainbow. */
  private brush: number | null = null;
  private brushName: ColorName | null = null;
  private rt: RenderTexture | null = null;
  private view: View;
  private hue = Math.random() * 360;
  private finished = 0;
  private clock = 0;
  private done = false;
  private readonly endStroke = (e: PointerEvent | FederatedPointerEvent) => this.lift(e.pointerId);

  constructor(private readonly ctx: GameContext) {
    this.view = ctx.view;
    this.paper.eventMode = 'static';
    this.plan = planFor(ctx.level);
    this.things = pickThings(this.plan, ctx.rng);
    this.paper.addChild(this.sheet, this.canvas, this.pictureLayer, this.live);
    this.paper.on('pointerdown', (e) => this.press(e));
    this.paper.on('globalpointermove', (e) => this.move(e));
    this.paper.on('pointerup', this.endStroke);
    this.paper.on('pointerupoutside', this.endStroke);
    window.addEventListener('pointerup', this.endStroke);
    window.addEventListener('pointercancel', this.endStroke);

    this.frameButton = new RoundButton(frameIcon(), swatch.white, 52, () => void this.hangItUp());
    this.frameButton.visible = false;
    ctx.stage.addChild(this.backing, this.paper, this.frameButton);
    if (this.plan.mode !== 'free') this.buildPots();
  }

  start() {
    if (this.plan.mode === 'free') void this.ctx.instruct('paint.start');
    else if (this.plan.mode === 'pots') void this.ctx.instruct('paint.pots');
    else void this.ask();
  }

  private get picture(): Picture | undefined {
    return this.pictures[this.current];
  }

  private buildPots() {
    const mixing = this.plan.mode === 'mix' || this.plan.mode === 'recall-mix';
    const list: (ColorName | 'rainbow')[] = mixing ? PRIMARIES : POTS;
    const slots = list.length + (mixing ? 1.4 : 0);
    this.pots.addChild(this.potGlow, this.potRing);
    list.forEach((color, i) => {
      const pot = paintPot(color);
      pot.x = (i - (slots - 1) / 2) * 92;
      onTap(pot, () => this.pick(color, pot, i), { radius: 46, cooldown: 250 });
      this.pots.addChild(pot);
      this.potNodes.set(color, pot);
    });
    this.potRing.circle(0, -6, 46).fill({ color: 0xffffff, alpha: 0.7 }).stroke({ width: 4, color: wood.line });
    if (mixing) {
      this.potRing.visible = false;
      const dish = new Graphics()
        .moveTo(-66, -14)
        .quadraticCurveTo(-60, 40, 0, 42)
        .quadraticCurveTo(60, 40, 66, -14)
        .closePath()
        .fill(0xffffff)
        .stroke({ width: 5, color: 0xb9b2a6, join: 'round' });
      this.bowl.addChild(dish, this.bowlPaint);
      this.bowl.x = (slots - 1) / 2 * 92 - 10;
      this.drawBowl();
      onTap(this.bowl, () => this.emptyBowl(), { radius: 70, cooldown: 300 });
      this.pots.addChild(this.bowl);
    } else {
      this.pots.children[2].y = -14;
      this.potRing.x = this.pots.children[2].x;
    }
    this.ctx.stage.addChild(this.pots);
  }

  private pick(color: ColorName | 'rainbow', pot: Container, i: number) {
    sfx.bell(4 + i, 0.25);
    if (this.plan.mode === 'mix' && color !== 'rainbow') {
      void this.pour(color as Primary, pot);
      return;
    }
    this.setBrush(color === 'rainbow' ? null : color);
    this.potRing.position.set(pot.x, 0);
    this.potNodes.forEach((p) => (p.y = 0));
    pot.y = -14;
    void this.ctx.say(color === 'rainbow' ? 'paint.rainbow' : `color.${color}`);
  }

  private setBrush(color: ColorName | null) {
    this.brushName = color;
    this.brush = color ? swatch[color].fill : null;
  }

  /** Pour a primary into the bowl. Two make a new color; a third starts over. */
  private async pour(color: Primary, pot: Container) {
    if (this.poured.length >= 2) this.poured = [];
    this.poured.push(color);
    void this.ctx.tw.to(pot, { rotation: 0.5 }, { duration: 0.15 }).then(() => this.ctx.tw.to(pot, { rotation: 0 }, { duration: 0.2 }));
    sfx.splash();
    const made = this.poured.length === 2 ? mix(this.poured[0], this.poured[1]) : color;
    this.setBrush(made);
    this.drawBowl();
    if (this.poured.length === 2) {
      const p = this.ctx.stage.toLocal(this.bowl.getGlobalPosition());
      this.ctx.particles.burst(p.x, p.y, { kind: 'star', colors: [swatch[made].fill, 0xffffff], count: 10, speed: [80, 200], gravity: 0, life: [0.4, 0.8] });
      sfx.sparkle();
      await this.ctx.say(`color.${made}`);
    } else {
      await this.ctx.say(`color.${color}`);
    }
  }

  private emptyBowl() {
    if (this.poured.length === 0) return;
    this.poured = [];
    this.setBrush(null);
    this.drawBowl();
    sfx.whoosh();
  }

  private drawBowl() {
    const g = this.bowlPaint.clear();
    if (this.poured.length === 0) return;
    if (this.poured.length === 1) {
      g.ellipse(0, -10, 52, 14).fill(swatch[this.poured[0]].fill);
    } else {
      const made = swatch[mix(this.poured[0], this.poured[1])];
      g.ellipse(0, -10, 56, 16).fill(made.fill).stroke({ width: 3, color: made.line });
      g.circle(-22, -12, 5).circle(18, -8, 4).fill({ color: 0xffffff, alpha: 0.6 });
    }
  }

  /** Lay the pictures out once, across the middle of the page above the pots. */
  private layoutPictures(v: View) {
    if (this.pictures.length || this.things.length === 0) return;
    const n = this.things.length;
    const top = MARGIN + 30;
    const bottom = v.h - 130;
    const slot = (v.w - MARGIN * 2 - 60) / n;
    const scale = Math.min(1.25, slot / 280, (bottom - top) / 270);
    this.pictures = this.things.map((thing, i) => {
      const pic = new Picture(thing, MARGIN + 30 + slot * (i + 0.5), (top + bottom) / 2 + (i % 2 ? 24 : -24), scale, this.ctx.renderer);
      this.pictureLayer.addChild(pic.node);
      return pic;
    });
  }

  private async ask() {
    const pic = this.picture;
    if (!pic) return;
    this.sinceAsk = 0;
    this.wrongs = 0;
    const s = pic.scale;
    void this.ctx.tw.to(pic.node.scale, { x: s * 1.12, y: s * 1.12 }, { duration: 0.25, ease: ease.outBack }).then(() => this.ctx.tw.to(pic.node.scale, { x: s, y: s }, { duration: 0.3 }));
    const { id: thing, color } = pic.thing;
    if (this.plan.mode === 'mix') {
      const [a, b] = RECIPES[color]!;
      await this.ctx.instruct('paint.mix', { thing, color, a, b });
    } else if (this.plan.mode === 'recall-mix') {
      await this.ctx.instruct('paint.remix', { thing });
    } else if (this.plan.mode === 'recall') {
      await this.ctx.instruct('paint.what', { thing });
    } else {
      await this.ctx.instruct('paint.ask', { thing, color });
    }
  }

  /** The pots that make the asked-for color. */
  private rightPots(): (ColorName | 'rainbow')[] {
    const color = this.picture?.thing.color;
    if (!color) return [];
    return this.plan.mode === 'mix' || this.plan.mode === 'recall-mix' ? [...RECIPES[color]!] : [color];
  }

  private showHint() {
    this.hints++;
    this.glowing = this.rightPots();
  }

  /** A dab of paint landed. On the asked-for picture, the right color fills it; any other nudges gently. */
  private dab(x: number, y: number) {
    const pic = this.picture;
    if (!pic || pic.done || this.done || !pic.contains(x, y, BRUSH_RADIUS * 0.5)) return;
    if (this.brushName === pic.thing.color) {
      const p = pic.local(x, y);
      this.sinceAsk = 0;
      if (pic.coverage.paint(p.x, p.y, (BRUSH_RADIUS + 6) / pic.scale) >= PAINTED) void this.painted(pic);
      return;
    }
    if (this.clock - this.lastNag < 4) return;
    this.lastNag = this.clock;
    const { id: thing, color } = pic.thing;
    if (!this.brushName) {
      void this.ctx.say(this.plan.mode === 'mix' || this.plan.mode === 'recall-mix' ? 'paint.mixhow' : 'paint.pick', { color, ...this.recipeVars() });
      return;
    }
    this.misses++;
    this.wrongs++;
    sfx.boing();
    if (this.plan.mode === 'mix' || this.plan.mode === 'recall-mix') void this.ctx.say('paint.mixhow', { color, ...this.recipeVars() });
    else void this.ctx.say('paint.wrong', { wrong: this.brushName, thing, color });
    if (this.wrongs === 2) this.showHint();
  }

  private recipeVars(): Record<string, string> {
    const r = this.picture && RECIPES[this.picture.thing.color];
    return r ? { a: r[0], b: r[1] } : {};
  }

  private async painted(pic: Picture) {
    pic.done = true;
    this.glowing = [];
    const fill = pic.fill();
    if (this.rt) this.ctx.renderer.render({ container: fill, target: this.rt, clear: false });
    fill.destroy();
    this.ctx.particles.burst(pic.x, pic.y, { kind: 'star', colors: [swatch[pic.thing.color].fill, 0xffffff, 0xfff3a0], count: 16, speed: [120, 300], gravity: 0, life: [0.5, 0.9] });
    sfx.sparkle();
    this.ctx.pet.cheer();
    this.current++;
    await this.ctx.say('praise');
    if (this.picture) await this.ask();
    else await this.ctx.say('paint.finished');
  }

  resize(v: View) {
    this.view = v;
    this.backing.clear().rect(0, 0, v.w, v.h).fill(wood.fill);
    this.sheet
      .clear()
      .roundRect(MARGIN, MARGIN, v.w - MARGIN * 2, v.h - MARGIN * 2, 22)
      .fill(PAPER)
      .stroke({ width: 5, color: wood.line });
    this.paper.hitArea = new Rectangle(MARGIN, MARGIN, v.w - MARGIN * 2, v.h - MARGIN * 2);
    this.frameButton.position.set(v.w - 80, 80);
    this.pots.position.set(v.w / 2, v.h - 58);
    this.layoutPictures(v);

    // Grow the painting surface if the view got bigger, keeping what's already painted.
    const res = v.scale * Math.min(2, window.devicePixelRatio || 1);
    if (!this.rt || this.rt.width < v.w || this.rt.height < v.h) {
      const next = RenderTexture.create({ width: Math.ceil(v.w), height: Math.ceil(v.h), resolution: res });
      this.ctx.renderer.render({ container: new Container(), target: next, clear: true, clearColor: [0, 0, 0, 0] });
      if (this.rt) {
        const old = new Sprite(this.rt);
        this.ctx.renderer.render({ container: old, target: next, clear: false });
        old.destroy();
        this.rt.destroy(true);
      }
      this.rt = next;
      this.canvas.texture = next;
    }
  }

  update(dt: number) {
    this.clock += dt;
    const coloring = this.pictures.length > 0;
    const ready = coloring ? !this.picture : this.finished >= 5 || (this.finished >= 1 && this.clock > 25);
    if (coloring && this.picture && !this.done) {
      this.sinceAsk += dt;
      // Stuck for a while: light up the right pot.
      if (this.sinceAsk > 12 && this.glowing.length === 0) this.showHint();
    }
    this.drawGlow();
    if (!this.done && !this.frameButton.visible && ready) {
      this.frameButton.visible = true;
      this.frameButton.scale.set(0);
      void this.ctx.tw.to(this.frameButton.scale, { x: 1, y: 1 }, { duration: 0.5, ease: ease.outBack });
      sfx.sparkle();
    }
    if (this.frameButton.visible && !this.done) this.frameButton.rotation = 0.06 * Math.sin(this.clock * 3);
    this.flush();
  }

  private drawGlow() {
    const g = this.potGlow.clear();
    for (const color of this.glowing) {
      const pot = this.potNodes.get(color);
      if (pot) g.circle(pot.x, -6, 54 + 4 * Math.sin(this.clock * 8)).fill({ color: 0xfff3a0, alpha: 0.8 });
    }
  }

  /**
   * The ghost finger: wavy strokes and then the frame in the free levels; in the picture levels the pot (or the two primaries) for the
   * picture's color, then a fill over the whole picture, and the frame once the page is done. Never a stroke in a wrong color.
   */
  autotouch(): TouchIntent | null {
    if (this.done || this.strokes.size > 0) return null;
    const pic = this.picture;
    const move = paintStep({ mode: this.plan.mode, strokes: this.finished, brush: this.brushName, poured: this.poured, picture: pic?.thing.color ?? null, frame: this.frameButton.visible });
    if (!move) return null;
    if (move.do === 'frame') return { tap: { on: this.frameButton } };
    if (move.do === 'bowl') return { tap: { on: this.bowl } };
    if (move.do === 'pot') {
      const pot = this.potNodes.get(move.pot);
      return pot ? { tap: { on: pot } } : null;
    }
    const [start, ...via] = pic
      ? fillPath(pic.thing.circles, pic.scale).map((p) => ({ on: pic.node, x: p.x, y: p.y }))
      : scribble(this.finished, scribbleArea(this.view.w, this.view.h)).map((p) => ({ on: this.paper, x: p.x, y: p.y }));
    return { trace: start, via, receiver: this.paper };
  }

  destroy() {
    window.removeEventListener('pointerup', this.endStroke);
    window.removeEventListener('pointercancel', this.endStroke);
    this.pool.forEach((s) => s.destroy());
    this.stamps.destroy({ children: true });
    for (const pic of this.pictures) pic.node.destroy({ children: true, texture: true, textureSource: true });
    this.rt?.destroy(true);
  }

  private press(e: FederatedPointerEvent) {
    if (this.done || palmOnGlass() || this.strokes.size >= 5) return;
    const p = this.paper.toLocal(e.global);
    const step = this.stepAt(p.y);
    this.hue = (this.hue + 70) % 360;
    const stroke = { x: p.x, y: p.y, hue: this.hue, color: this.brush, travelled: 0, startedAt: this.clock, lastStep: step, lastNoteAt: this.clock, sparkleIn: 30 };
    this.strokes.set(e.pointerId, stroke);
    this.stamp(p.x, p.y, stroke.color ?? hsl(stroke.hue, 0.85, 0.62));
    this.dab(p.x, p.y);
    sfx.bell(step, 0.14);
  }

  private move(e: FederatedPointerEvent) {
    const s = this.strokes.get(e.pointerId);
    if (!s || this.done) return;
    const p = this.paper.toLocal(e.global);
    const dist = Math.hypot(p.x - s.x, p.y - s.y);
    if (dist < 1) return;
    // Lay stamps evenly from the last point to this one.
    const n = Math.floor(dist / SPACING);
    for (let i = 1; i <= n; i++) {
      const t = (i * SPACING) / dist;
      s.hue = (s.hue + SPACING * HUE_PER_UNIT) % 360;
      this.stamp(s.x + (p.x - s.x) * t, s.y + (p.y - s.y) * t, s.color ?? hsl(s.hue, 0.85, 0.62));
      if (i % 2 === 0) this.dab(s.x + (p.x - s.x) * t, s.y + (p.y - s.y) * t);
    }
    if (n > 0) {
      const t = (n * SPACING) / dist;
      s.x += (p.x - s.x) * t;
      s.y += (p.y - s.y) * t;
    }
    s.travelled += dist;

    // Sparkles now and then, and a note whenever the finger crosses into a new pitch.
    s.sparkleIn -= dist;
    if (s.sparkleIn <= 0) {
      s.sparkleIn = 45;
      this.ctx.particles.burst(p.x, p.y, { kind: 'star', colors: [0xffffff, 0xfff3a0], count: 1, speed: [30, 80], gravity: 0, size: [0.35, 0.6], life: [0.4, 0.7] });
    }
    const step = this.stepAt(p.y);
    if (step !== s.lastStep && this.clock - s.lastNoteAt > 0.07) {
      s.lastStep = step;
      s.lastNoteAt = this.clock;
      sfx.bell(step, 0.12);
    }
  }

  private lift(id: number) {
    const s = this.strokes.get(id);
    if (!s) return;
    this.strokes.delete(id);
    if (s.travelled < 14 && this.clock - s.startedAt < 0.5) this.bloom(s.x, s.y);
    else if (s.travelled > 40) this.finished++;
  }

  /** Higher on the page, higher the note. */
  private stepAt(y: number): number {
    return stepFromUnit(1 - y / this.view.h, 4, 10);
  }

  private stamp(x: number, y: number, tint: number) {
    this.recordDab(x, y, tint);
    const s = this.pool.pop() ?? new Sprite(textures().brush);
    s.anchor.set(0.5);
    s.position.set(x, y);
    s.tint = tint;
    s.scale.set((BRUSH_RADIUS * 2) / s.texture.width);
    this.stamps.addChild(s);
  }

  /** Bake this frame's stamps into the painting in one draw. */
  private flush() {
    if (!this.rt || this.stamps.children.length === 0) return;
    this.ctx.renderer.render({ container: this.stamps, target: this.rt, clear: false });
    for (const s of this.stamps.removeChildren()) this.pool.push(s as Sprite);
  }

  /** A quick tap grows a flower, which then becomes part of the painting. */
  private bloom(x: number, y: number) {
    const colorName = FLOWER_COLORS[Math.floor(Math.random() * FLOWER_COLORS.length)];
    const color = swatch[colorName];
    this.recordMark({ shape: 'flower', ...this.normalized(x, y), r: 26 / this.paperSize(), color: colorName });
    const f = flower(new Graphics(), 26, color.fill, color.line);
    f.position.set(x, y);
    f.scale.set(0);
    this.live.addChild(f);
    sfx.bell(this.stepAt(y) + 2, 0.2);
    this.ctx.particles.burst(x, y, { colors: [color.fill, 0xffffff], count: 10, speed: [80, 200], gravity: 200, size: [0.25, 0.45], life: [0.4, 0.8] });
    void this.ctx.tw.to(f.scale, { x: 1, y: 1 }, { duration: 0.45, ease: ease.outBack }).then(async () => {
      await this.ctx.tw.wait(0.4);
      if (!this.rt || f.destroyed) return;
      this.live.removeChild(f);
      this.ctx.renderer.render({ container: f, target: this.rt, clear: false });
      f.destroy();
    });
  }

  /** Free levels can be kept without storing a bitmap: sample and normalize the marks the child actually made. */
  private recordDab(x: number, y: number, color: number) {
    if (this.plan.count !== 0 || this.dabCount++ % this.dabEvery !== 0) return;
    this.recordMark({ shape: 'dab', ...this.normalized(x, y), r: BRUSH_RADIUS / this.paperSize(), color });
  }

  private recordMark(mark: PaintingMark) {
    if (this.plan.count !== 0) return;
    if (this.paintingMarks.length >= PAINTING_MAX_MARKS) {
      // Keep the whole painting represented instead of retaining only its beginning. Future dabs are sampled at
      // the same coarser interval; flowers remain in the sequence but are bounded with everything else.
      this.paintingMarks = this.paintingMarks.filter((_, i) => i % 2 === 0);
      this.dabEvery *= 2;
    }
    this.paintingMarks.push(mark);
  }

  private normalized(x: number, y: number) {
    const w = Math.max(1, this.view.w - MARGIN * 2);
    const h = Math.max(1, this.view.h - MARGIN * 2);
    return { x: Math.min(1, Math.max(0, (x - MARGIN) / w)), y: Math.min(1, Math.max(0, (y - MARGIN) / h)) };
  }

  private paperSize() {
    return Math.max(1, Math.min(this.view.w - MARGIN * 2, this.view.h - MARGIN * 2));
  }

  private painting(): PaintingCreation | undefined {
    if (this.plan.count !== 0 || this.paintingMarks.length < 3) return;
    const w = Math.max(1, this.view.w - MARGIN * 2);
    const h = Math.max(1, this.view.h - MARGIN * 2);
    return { kind: 'picture', aspect: w / h, marks: this.paintingMarks.map((mark) => ({ ...mark })) };
  }

  /** Done: the painting shrinks into a wooden frame on the wall. */
  private async hangItUp() {
    if (this.done) return;
    this.done = true;
    this.strokes.clear();
    void this.ctx.tw.to(this.frameButton.scale, { x: 0, y: 0 }, { duration: 0.2 });
    this.pots.visible = false;
    const v = this.view;
    const k = 0.72;
    const [x0, y0, w, h] = [MARGIN - 14, MARGIN - 14, v.w - MARGIN * 2 + 28, v.h - MARGIN * 2 + 28];
    const nail = { x: v.w / 2, y: y0 - 90 };
    const frame = new Graphics()
      .moveTo(x0 + 60, y0)
      .lineTo(nail.x, nail.y)
      .lineTo(x0 + w - 60, y0)
      .stroke({ width: 6, color: wood.line, join: 'round' })
      .roundRect(x0, y0, w, h, 20)
      .stroke({ width: 30, color: wood.fill })
      .roundRect(x0 - 15, y0 - 15, w + 30, h + 30, 28)
      .stroke({ width: 5, color: wood.line })
      .circle(nail.x, nail.y, 10)
      .fill(0x8c8c9c);
    frame.alpha = 0;
    this.paper.addChild(frame);
    this.backing.clear().rect(0, 0, v.w, v.h).fill(0xf6e7d0);
    this.paper.pivot.set(v.w / 2, v.h / 2);
    this.paper.position.set(v.w / 2, v.h / 2);
    void this.ctx.tw.to(frame, { alpha: 1 }, { duration: 0.4 });
    await this.ctx.tw.to(this.paper.scale, { x: k, y: k }, { duration: 0.7, ease: ease.outBack });
    this.ctx.pet.cheer();
    sfx.sparkle();
    await this.ctx.say('paint.done');
    await this.ctx.tw.wait(0.6);
    this.ctx.finish({ misses: this.misses, hints: this.hints, creation: this.painting() });
  }
}

/** The hub's easel, with a rainbow already started. */
class Easel extends Container {
  private clock = 0;
  private readonly board = new Container();

  constructor() {
    super();
    const legs = new Graphics()
      .moveTo(-70, 0)
      .lineTo(-30, -230)
      .moveTo(70, 0)
      .lineTo(30, -230)
      .moveTo(0, -40)
      .lineTo(0, -230)
      .stroke({ width: 12, color: wood.line, cap: 'round' })
      .roundRect(-92, -78, 184, 14, 6)
      .fill(wood.fill)
      .stroke({ width: 4, color: wood.line });
    const art = new Graphics().roundRect(-80, -150, 160, 124, 10).fill(PAPER).stroke({ width: 6, color: wood.line });
    RAINBOW.forEach((c, i) => {
      const r = 58 - i * 8;
      art.moveTo(-r, -46).arc(0, -46, r, Math.PI, 0).stroke({ width: 8, color: swatch[c].fill, cap: 'round' });
    });
    art.circle(-52, -126, 12).fill(swatch.yellow.fill);
    const blobs = new Graphics()
      .circle(-60, -66, 9)
      .fill(swatch.red.fill)
      .circle(-36, -68, 9)
      .fill(swatch.blue.fill)
      .circle(56, -66, 9)
      .fill(swatch.green.fill);
    this.board.addChild(art);
    this.board.y = 0;
    this.addChild(legs, this.board, blobs);
  }

  update(dt: number) {
    this.clock += dt;
    this.board.rotation = 0.015 * Math.sin(this.clock * 1.4);
  }
}

function sticker(seed: number): Container {
  const rng = new Rng(seed);
  const c = new Container();
  const palette = new Graphics()
    .moveTo(-90, 10)
    .bezierCurveTo(-100, -80, 60, -100, 92, -30)
    .bezierCurveTo(110, 10, 60, 20, 40, 10)
    .bezierCurveTo(20, 0, 10, 40, 30, 60)
    .bezierCurveTo(-20, 90, -84, 70, -90, 10)
    .closePath()
    .fill(wood.light)
    .stroke({ width: 8, color: wood.line, join: 'round' });
  rng
    .shuffle([...RAINBOW])
    .slice(0, 4)
    .forEach((col, i) => palette.circle([-52, -12, 30, -58][i], [-30, -60, -50, 30][i], 18).fill(swatch[col].fill));
  c.addChild(palette);
  return c;
}

export const rainbowFingers: GameModule = {
  id: 'rainbow-fingers',
  name: 'Rainbow Fingers',
  titleLine: 'game.rainbow-fingers',
  region: 'treehouse',
  skills: ['fine-motor', 'creativity'],
  bands: ['lap', 'toddler', 'preschool', 'prek', 'school'],
  levels: (band) => rangeFor(LEVELS, band),
  describeLevel: (level) => {
    const p = planFor(level);
    if (p.mode === 'free') return 'Rainbow painting';
    if (p.mode === 'pots') return 'Paint pots: pick a color and hear its name';
    if (p.mode === 'named') return `Coloring page: "paint the sun yellow", ${p.count} pictures`;
    if (p.mode === 'recall') return `Coloring page: "paint the apple" (remember its color), ${p.count} pictures`;
    if (p.mode === 'mix') return 'Mixing colors: red and yellow make orange';
    return 'Paint the pumpkin: remember orange, then mix red and yellow';
  },
  music: STYLES.paint,
  touchDemo: true,
  coplayHint: 'Guide {name}\'s finger in big swoops, then let go and watch.',
  offScreen: 'Finger-paint with yogurt and a drop of food coloring on the high-chair tray.',
  hubIcon: () => new Easel(),
  sticker,
  create: (ctx) => new RainbowFingers(ctx),
};
