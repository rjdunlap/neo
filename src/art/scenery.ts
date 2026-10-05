import { Container, Graphics, Sprite, Texture } from 'pixi.js';
import { Rng } from '../engine/random';
import type { View } from '../engine/view';
import { cheek, ink, swatch } from './palette';

export interface BackdropStyle {
  /** Sky gradient, top to horizon. */
  sky: [number, number];
  /** Hill colors from back to front; the last one is the ground. */
  hills: number[];
  /** Where the ground starts, as a fraction of the view height. */
  horizon: number;
  clouds?: number;
  sun?: boolean;
  seed?: number;
}

/** A vertical gradient as a tiny canvas texture, stretched to fill. */
export function gradientTexture(top: number, bottom: number): Texture {
  const c = document.createElement('canvas');
  c.width = 2;
  c.height = 256;
  const ctx = c.getContext('2d')!;
  const g = ctx.createLinearGradient(0, 0, 0, 256);
  g.addColorStop(0, cssColor(top));
  g.addColorStop(1, cssColor(bottom));
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 2, 256);
  return Texture.from(c);
}

const cssColor = (n: number) => `#${n.toString(16).padStart(6, '0')}`;

const CLOUD_PUFFS: [number, number, number][] = [
  [-50, 0, 34],
  [-15, -18, 44],
  [28, -8, 38],
  [58, 6, 26],
  [0, 10, 36],
];

export class Cloud extends Container {
  readonly baseScale: number;
  private readonly vx: number;
  private puff = 0;

  constructor(rng: Rng) {
    super();
    const g = new Graphics();
    for (const [x, y, r] of CLOUD_PUFFS) g.circle(x, y + 7, r).fill(0xdcecf7);
    for (const [x, y, r] of CLOUD_PUFFS) g.circle(x, y, r).fill(0xffffff);
    this.addChild(g);
    this.baseScale = rng.range(0.7, 1.1);
    this.scale.set(this.baseScale);
    this.vx = rng.range(6, 14);
  }

  poke() {
    this.puff = 1;
  }

  update(dt: number, view: View) {
    this.x += this.vx * dt;
    const half = 110 * this.baseScale;
    if (this.x - half > view.w) this.x = -half;
    this.puff = Math.max(0, this.puff - dt * 2);
    this.scale.set(this.baseScale * (1 + 0.2 * Math.sin((1 - this.puff) * Math.PI) * (this.puff > 0 ? 1 : 0)));
  }
}

export class Sun extends Container {
  private readonly rays = new Graphics();
  private spin = 0;
  private swell = 0;

  constructor() {
    super();
    const y = swatch.yellow;
    for (let i = 0; i < 10; i++) {
      const a = (i * Math.PI) / 5;
      this.rays.moveTo(Math.cos(a) * 74, Math.sin(a) * 74).lineTo(Math.cos(a) * 96, Math.sin(a) * 96);
    }
    this.rays.stroke({ width: 12, color: y.fill, cap: 'round' });
    const line = { width: 5, color: ink, cap: 'round' as const };
    const face = new Graphics()
      .circle(0, 0, 58)
      .fill(y.fill)
      .stroke({ width: 6, color: y.line })
      .moveTo(-27, -6)
      .quadraticCurveTo(-18, -18, -9, -6)
      .stroke(line)
      .moveTo(9, -6)
      .quadraticCurveTo(18, -18, 27, -6)
      .stroke(line)
      .ellipse(-34, 12, 10, 6)
      .ellipse(34, 12, 10, 6)
      .fill({ color: cheek, alpha: 0.6 })
      .moveTo(-14, 14)
      .quadraticCurveTo(0, 30, 14, 14)
      .stroke(line);
    this.addChild(this.rays, face);
  }

  poke() {
    this.spin = 7;
    this.swell = 1;
  }

  update(dt: number) {
    this.rays.rotation += (0.12 + this.spin) * dt;
    this.spin = Math.max(0, this.spin - dt * 6);
    this.swell = Math.max(0, this.swell - dt * 2);
    this.scale.set(1 + 0.15 * Math.sin(this.swell * Math.PI));
  }
}

/** Sky, sun, drifting clouds and rolling hills, rebuilt to fit any view. */
export class Backdrop extends Container {
  readonly clouds: Cloud[] = [];
  readonly sun: Sun | null = null;
  groundY = 0;

  private readonly sky = new Sprite();
  private readonly hills = new Graphics();
  private readonly phases: number[];
  private view: View;

  constructor(
    private readonly style: BackdropStyle,
    view: View,
  ) {
    super();
    this.view = view;
    const rng = new Rng(style.seed ?? 7);
    this.phases = style.hills.flatMap(() => [rng.range(0, 6.28), rng.range(0, 6.28)]);
    this.sky.texture = gradientTexture(style.sky[0], style.sky[1]);
    this.addChild(this.sky);
    if (style.sun) {
      this.sun = new Sun();
      this.addChild(this.sun);
    }
    const cloudLayer = new Container();
    this.addChild(cloudLayer, this.hills);
    for (let i = 0; i < (style.clouds ?? 0); i++) {
      const c = new Cloud(rng);
      c.position.set(rng.range(0, view.w), rng.range(80, view.h * style.horizon * 0.42));
      this.clouds.push(c);
      cloudLayer.addChild(c);
    }
    this.resize(view);
  }

  resize(view: View) {
    this.view = view;
    this.sky.width = view.w;
    this.sky.height = view.h;
    this.groundY = view.h * this.style.horizon;
    this.sun?.position.set(Math.max(230, view.w * 0.2), 150);

    const g = this.hills.clear();
    const layers = this.style.hills;
    layers.forEach((color, i) => {
      const depth = layers.length - 1 - i;
      const base = this.groundY - depth * 62;
      const amp = depth === 0 ? 10 : 24 + depth * 10;
      const [p1, p2] = [this.phases[i * 2], this.phases[i * 2 + 1]];
      g.moveTo(-20, view.h + 20);
      for (let x = -20; x <= view.w + 20; x += 20) {
        g.lineTo(x, base + amp * (0.6 * Math.sin(x * 0.004 + p1) + 0.4 * Math.sin(x * 0.011 + p2)));
      }
      g.lineTo(view.w + 20, view.h + 20).closePath().fill(color);
    });
  }

  update(dt: number) {
    this.sun?.update(dt);
    for (const c of this.clouds) c.update(dt, this.view);
  }
}
