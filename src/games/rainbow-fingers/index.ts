import { Container, Graphics, Rectangle, RenderTexture, Sprite, type FederatedPointerEvent } from 'pixi.js';
import { RAINBOW, swatch, wood, type ColorName } from '../../art/palette';
import type { Band } from '../../progress/bands';
import { flower } from '../../art/shapes';
import { textures } from '../../art/textures';
import { STYLES } from '../../audio/music';
import { stepFromUnit } from '../../audio/notes';
import { sfx } from '../../audio/sfx';
import { onTap, palmOnGlass } from '../../engine/input';
import { Rng } from '../../engine/random';
import { ease } from '../../engine/tween';
import type { View } from '../../engine/view';
import { RoundButton } from '../../ui/buttons';
import { frameIcon } from '../../ui/icons';
import type { Game, GameContext, GameModule } from '../types';

const PAPER = 0xfffdf6;
const MARGIN = 18;
const BRUSH_RADIUS = 24;
/** Brush stamps are this far apart along a stroke, in logical units. */
const SPACING = 5;
/** Degrees of hue per unit of stroke: the rainbow comes from moving. */
const HUE_PER_UNIT = 0.45;
const FLOWER_COLORS: ColorName[] = ['pink', 'purple', 'red', 'blue', 'orange', 'yellow'];
/** Level 1 paints rainbows; level 2 adds pots to pick a color from, each saying its name. */
const LEVELS: Record<Band, { min: number; max: number }> = {
  lap: { min: 1, max: 1 },
  toddler: { min: 1, max: 2 },
  preschool: { min: 2, max: 2 },
  prek: { min: 2, max: 2 },
};
const POTS: (ColorName | 'rainbow')[] = ['rainbow', ...RAINBOW];

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
  private readonly frameButton: RoundButton;
  private readonly pots = new Container();
  private readonly potRing = new Graphics();
  /** The picked color, or null for rainbow. */
  private brush: number | null = null;
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
    this.paper.addChild(this.sheet, this.canvas, this.live);
    this.paper.on('pointerdown', (e) => this.press(e));
    this.paper.on('globalpointermove', (e) => this.move(e));
    this.paper.on('pointerup', this.endStroke);
    this.paper.on('pointerupoutside', this.endStroke);
    window.addEventListener('pointerup', this.endStroke);
    window.addEventListener('pointercancel', this.endStroke);

    this.frameButton = new RoundButton(frameIcon(), swatch.white, 52, () => void this.hangItUp());
    this.frameButton.visible = false;
    ctx.stage.addChild(this.backing, this.paper, this.frameButton);
    if (ctx.level >= 2) this.buildPots();
  }

  start() {
    void this.ctx.instruct(this.ctx.level >= 2 ? 'paint.pots' : 'paint.start');
  }

  private buildPots() {
    this.pots.addChild(this.potRing);
    POTS.forEach((color, i) => {
      const pot = paintPot(color);
      pot.x = (i - (POTS.length - 1) / 2) * 92;
      onTap(
        pot,
        () => {
          this.brush = color === 'rainbow' ? null : swatch[color].fill;
          this.potRing.position.set(pot.x, 0);
          this.pots.children.forEach((p) => p !== this.potRing && (p.y = 0));
          pot.y = -14;
          sfx.bell(4 + i, 0.25);
          void this.ctx.say(color === 'rainbow' ? 'paint.rainbow' : `color.${color}`);
        },
        { radius: 46, cooldown: 250 },
      );
      this.pots.addChild(pot);
      if (i === 0) pot.y = -14;
    });
    this.potRing.circle(0, -6, 46).fill({ color: 0xffffff, alpha: 0.7 }).stroke({ width: 4, color: wood.line });
    this.potRing.x = this.pots.children[1].x;
    this.ctx.stage.addChild(this.pots);
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
    if (!this.done && !this.frameButton.visible && (this.finished >= 5 || (this.finished >= 1 && this.clock > 25))) {
      this.frameButton.visible = true;
      this.frameButton.scale.set(0);
      void this.ctx.tw.to(this.frameButton.scale, { x: 1, y: 1 }, { duration: 0.5, ease: ease.outBack });
      sfx.sparkle();
    }
    if (this.frameButton.visible && !this.done) this.frameButton.rotation = 0.06 * Math.sin(this.clock * 3);
    this.flush();
  }

  destroy() {
    window.removeEventListener('pointerup', this.endStroke);
    window.removeEventListener('pointercancel', this.endStroke);
    this.pool.forEach((s) => s.destroy());
    this.stamps.destroy({ children: true });
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
    const color = swatch[FLOWER_COLORS[Math.floor(Math.random() * FLOWER_COLORS.length)]];
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
    this.ctx.finish({ misses: 0, hints: 0 });
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
  bands: ['lap', 'toddler', 'preschool', 'prek'],
  levels: (band) => LEVELS[band],
  describeLevel: (level) => (level >= 2 ? 'Paint pots: pick a color and hear its name' : 'Rainbow painting'),
  music: STYLES.paint,
  coplayHint: 'Guide {name}\'s finger in big swoops, then let go and watch.',
  offScreen: 'Finger-paint with yogurt and a drop of food coloring on the high-chair tray.',
  hubIcon: () => new Easel(),
  sticker,
  create: (ctx) => new RainbowFingers(ctx),
};
