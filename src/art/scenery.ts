import { Container, Graphics, Sprite, Texture } from 'pixi.js';
import { Rng } from '../engine/random';
import type { View } from '../engine/view';
import { swatch, toward } from './palette';
import { drawFibre } from './paper';
import { bakePaper } from './paperize';

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

const skies = new Map<string, Texture>();

/**
 * A sky or wall to stretch over a view. In the paper look (docs/ART-STYLE.md) there are no gradients: it is one flat
 * sheet in the colour between `top` and `bottom` (a touch nearer the top), with the paper fibre over it. Drawn once per
 * pair at the design area's size, so stretching it to a view barely changes the fibre.
 */
export function gradientTexture(top: number, bottom: number): Texture {
  const key = `${top}:${bottom}`;
  const known = skies.get(key);
  if (known) return known;
  const c = document.createElement('canvas');
  c.width = 1024;
  c.height = 768;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = cssColor(toward(top, bottom, 0.4));
  ctx.fillRect(0, 0, c.width, c.height);
  ctx.globalAlpha = 0.35;
  if (typeof ctx.quadraticCurveTo === 'function') drawFibre(ctx, 1024, 768);
  const t = Texture.from(c);
  skies.set(key, t);
  return t;
}

const cssColor = (n: number) => `#${n.toString(16).padStart(6, '0')}`;

const CLOUD_SHAPE: [number, number][] = [
  [-88, 26],
  [-96, 6],
  [-82, -22],
  [-56, -34],
  [-38, -26],
  [-34, -50],
  [-10, -66],
  [16, -56],
  [24, -44],
  [46, -46],
  [66, -30],
  [74, -16],
  [92, -8],
  [96, 18],
  [70, 32],
  [-60, 32],
];

/**
 * A cut-paper cloud about 192 × 100 at scale 1, centred on (x, y): one silhouette with a flat underside and a lumpy
 * top, on a darker piece peeking out below it, rather than a stack of circles. The sky's clouds and weather icons.
 */
export function cutCloud(g: Graphics, x: number, y: number, k: number, fill = 0xffffff, under = 0xc9dcea) {
  const n = CLOUD_SHAPE.length;
  const cut = (dy: number) => {
    // Rounded through the midpoints, so each lump is a soft scissor curve.
    const at = (i: number): [number, number] => [
      x + CLOUD_SHAPE[i % n][0] * k,
      y + (CLOUD_SHAPE[i % n][1] + dy) * k,
    ];
    const mid = (i: number): [number, number] => {
      const [ax, ay] = at(i),
        [bx, by] = at(i + 1);
      return [(ax + bx) / 2, (ay + by) / 2];
    };
    g.moveTo(...mid(n - 1));
    for (let i = 0; i < n; i++) g.quadraticCurveTo(...at(i), ...mid(i));
    return g.closePath();
  };
  cut(9).fill(under);
  cut(0).fill(fill);
  return g;
}

/**
 * Twelve snipped paper rays, long orange and short yellow by turns and none quite alike, round a disc of radius 54 × k
 * at (x, y) (the disc itself is the caller's). The sky's sun and weather icons.
 */
export function sunRays(g: Graphics, x: number, y: number, k: number) {
  for (let i = 0; i < 12; i++) {
    const a = (i * Math.PI) / 6 + (i % 3) * 0.04;
    const long = i % 2 === 0;
    const r0 = 38 * k,
      r1 = (long ? 96 - (i % 4) * 3 : 82 + (i % 3) * 2) * k;
    const half = long ? 0.3 : 0.24;
    g.poly(
      [
        x + Math.cos(a - half) * r0,
        y + Math.sin(a - half) * r0,
        x + Math.cos(a) * r1,
        y + Math.sin(a) * r1,
        x + Math.cos(a + half) * r0,
        y + Math.sin(a + half) * r0,
      ],
      true,
    ).fill(long ? swatch.orange.fill : swatch.yellow.fill);
  }
  return g;
}

/** A falling raindrop, its point up. */
export function drop(g: Graphics, x: number, y: number, h: number, color: number) {
  const w = h * 0.36;
  g.moveTo(x, y - h / 2)
    .bezierCurveTo(x + w * 0.4, y - h * 0.1, x + w, y + h * 0.1, x, y + h / 2)
    .bezierCurveTo(x - w, y + h * 0.1, x - w * 0.4, y - h * 0.1, x, y - h / 2)
    .closePath()
    .fill(color);
}

export class Cloud extends Container {
  readonly baseScale: number;
  private readonly vx: number;
  private puff = 0;

  constructor(rng: Rng) {
    super();
    // One cut silhouette (a flat underside and lumpy top), on a blue-grey piece peeking out below it, rather than a
    // stack of circles.
    const g = new Graphics();
    cutCloud(g, 0, 0, 1);
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
    this.scale.set(
      this.baseScale * (1 + 0.2 * Math.sin((1 - this.puff) * Math.PI) * (this.puff > 0 ? 1 : 0)),
    );
  }
}

export class Sun extends Container {
  private readonly rays = new Graphics();
  private spin = 0;
  private swell = 0;

  constructor() {
    super();
    // A cut-paper sun: twelve snipped rays, long and short by turns and none quite alike, behind a yellow disc. No face or blush: it is a sun, not a sticker.
    const y = swatch.yellow;
    sunRays(this.rays, 0, 0, 1);
    const face = new Graphics().circle(0, 0, 54).fill(y.fill);
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
      g.lineTo(view.w + 20, view.h + 20)
        .closePath()
        .fill(color);
    });
    bakePaper(this.hills, view);
  }

  update(dt: number) {
    this.sun?.update(dt);
    for (const c of this.clouds) c.update(dt, this.view);
  }
}

/**
 * The Barnyard's barn seen from far off (visual identity V1): the map barn's gable in a quieter red than
 * playable objects, its white trim, and from 60 units tall its X door and round loft. `base` is the ground
 * it stands on; the barn is `height * 1.1` wide. Pass a darker `body` and `trim` for an evening sky.
 */
export function drawFarBarn(
  g: Graphics,
  x: number,
  base: number,
  height: number,
  body: number = swatch.red.line,
  trim: number = swatch.white.light,
) {
  const w = height * 1.1;
  g.poly([
    x - w / 2,
    base,
    x - w / 2,
    base - height * 0.58,
    x,
    base - height,
    x + w / 2,
    base - height * 0.58,
    x + w / 2,
    base,
  ]).fill(body);
  g.moveTo(x - w / 2 - 4, base - height * 0.58)
    .lineTo(x, base - height)
    .lineTo(x + w / 2 + 4, base - height * 0.58)
    .stroke({ color: trim, width: 5, cap: 'round', join: 'round' });
  if (height >= 60) {
    const door = height * 0.34;
    g.rect(x - door / 2, base - door, door, door).stroke({ color: trim, width: 3 });
    g.moveTo(x - door / 2, base - door)
      .lineTo(x + door / 2, base)
      .moveTo(x + door / 2, base - door)
      .lineTo(x - door / 2, base)
      .stroke({ color: trim, width: 3 });
    g.circle(x, base - height * 0.65, height * 0.075).fill(trim);
  }
  return g;
}
