import { Container, Graphics } from 'pixi.js';
import { ink, swatch, wood } from '../../art/palette';
import { CORE_R, haloAlpha, haloRadius, sideGlow, type Rect } from './logic';

const NIGHT = 0x27305a;
const NIGHT_LOW = 0x1c2446;
const WATER = 0x2f4a7a;
const GLOW = 0xfff1a8;
const CORE = 0xfffbe6;

/** The side strip: night sky over the lake, seen from the side. */
export function stripArt(r: Rect): Graphics {
  const g = new Graphics();
  g.roundRect(r.x, r.y, r.w, r.h, 26).fill(NIGHT).stroke({ width: 5, color: ink, alpha: 0.6 });
  g.rect(r.x + 4, r.y + r.h * 0.55, r.w - 8, r.h * 0.45 - 4).fill({ color: WATER, alpha: 0.7 });
  for (let i = 0; i < 12; i++) g.circle(r.x + 30 + ((i * 97) % (r.w - 60)), r.y + 14 + ((i * 53) % 40), 2).fill({ color: 0xffffff, alpha: 0.6 });
  return g;
}

/** The little house with its round window, at the strip's left end. */
export function houseArt(r: Rect): Container {
  const c = new Container();
  const g = new Graphics();
  const roofY = r.y + r.h * 0.25;
  g.poly([r.x + 6, roofY, r.x + r.w / 2, r.y + 6, r.x + r.w - 6, roofY]).fill(swatch.red.fill).stroke({ width: 4, color: swatch.red.line });
  g.roundRect(r.x + 14, roofY, r.w - 28, r.h - (roofY - r.y) - 6, 10).fill(wood.fill).stroke({ width: 4, color: wood.line });
  g.circle(r.x + r.w - 32, r.y + r.h / 2, 22).fill(0xfff6c8).stroke({ width: 5, color: wood.line });
  g.moveTo(r.x + r.w - 54, r.y + r.h / 2).lineTo(r.x + r.w - 10, r.y + r.h / 2).stroke({ width: 3, color: wood.line });
  c.addChild(g);
  return c;
}

/** A stop's post in one lane: one to four dots, counted from the window outward (no reading). */
export function postArt(x: number, y: number, stop: number): Graphics {
  const g = new Graphics();
  g.roundRect(x - 5, y + 18, 10, 44, 4).fill(wood.fill).stroke({ width: 2, color: wood.line });
  for (let i = 0; i < stop; i++) g.circle(x - (stop - 1) * 6 + i * 12, y + 54, 4).fill(0xffffff);
  return g;
}

/** A stop's glow when two misses point at it (level 4). */
export function postGlow(x: number, y: number): Graphics {
  return new Graphics().circle(x, y, 64).fill({ color: GLOW, alpha: 0.35 }).stroke({ width: 5, color: GLOW, alpha: 0.9 });
}

/** A light in the side view: the same at every stop, with a soft face. */
export function sideLight(): Container {
  const c = new Container();
  const s = sideGlow();
  const g = new Graphics();
  g.circle(0, 0, s.glow).fill({ color: GLOW, alpha: 0.45 });
  g.circle(0, 0, s.core).fill(CORE).stroke({ width: 3, color: 0xf2c94c });
  g.circle(-5, -2, 2.2).fill(ink).circle(5, -2, 2.2).fill(ink);
  g.arc(0, 2, 5, 0.3, Math.PI - 0.3).stroke({ width: 2, color: ink });
  c.addChild(g);
  return c;
}

/** The touch-down ring around a light. */
export function touchRing(r: number): Graphics {
  return new Graphics().circle(0, 0, r).stroke({ width: 6, color: 0xffffff, alpha: 0.9 });
}

/** The mooring rope that holds level 4's reference light. */
export function ropeArt(): Graphics {
  const g = new Graphics();
  g.moveTo(-34, 30).bezierCurveTo(-24, 10, -12, 18, 0, 12).stroke({ width: 4, color: wood.light });
  g.roundRect(-42, 26, 14, 18, 3).fill(wood.fill).stroke({ width: 2, color: wood.line });
  return g;
}

/** The window view's frame on the night lake. */
export function windowArt(r: Rect): Graphics {
  const g = new Graphics();
  g.roundRect(r.x - 10, r.y - 10, r.w + 20, r.h + 20, 40).fill(wood.fill).stroke({ width: 5, color: wood.line });
  g.roundRect(r.x, r.y, r.w, r.h, 32).fill(NIGHT_LOW);
  g.rect(r.x, r.y + r.h * 0.6, r.w, r.h * 0.4 - 32).fill({ color: WATER, alpha: 0.8 });
  g.roundRect(r.x, r.y + r.h - 40, r.w, 40, 32).fill({ color: WATER, alpha: 0.8 });
  for (let i = 0; i < 18; i++) g.circle(r.x + 24 + ((i * 131) % (r.w - 48)), r.y + 18 + ((i * 71) % (r.h * 0.35)), 1.8).fill({ color: 0xffffff, alpha: 0.5 });
  return g;
}

/** A light seen from the window: a fixed core in a halo whose size shows how bright it looks (never how big it is). */
export class WindowLight extends Container {
  private readonly halo = new Graphics();
  private readonly core = new Graphics();
  readonly ring: Graphics;
  /** How bright it looks now (animated). */
  shown = 0;
  constructor(touchR: number) {
    super();
    this.core.circle(0, 0, CORE_R).fill(CORE);
    this.ring = touchRing(CORE_R + 10);
    this.ring.alpha = 0;
    this.addChild(this.halo, this.core, this.ring);
    this.touchR = touchR;
  }
  readonly touchR: number;
  setLook(l: number) {
    this.shown = l;
    const r = haloRadius(l);
    this.halo.clear();
    this.halo.circle(0, 0, r).fill({ color: GLOW, alpha: haloAlpha(l) * 0.55 });
    this.halo.circle(0, 0, r * 0.6).fill({ color: GLOW, alpha: haloAlpha(l) * 0.6 });
  }
}

/** The answer glow behind a window light (level 3, after two misses). */
export function answerGlow(r: number): Graphics {
  return new Graphics().circle(0, 0, r).stroke({ width: 8, color: 0xfff3a0, alpha: 0.95 });
}

/** Level 4's Check button: a big tick. */
export function checkArt(size: number): Container {
  const c = new Container();
  const g = new Graphics();
  g.roundRect(-size / 2, -size / 2 + 5, size, size, 26).fill(swatch.green.line);
  g.roundRect(-size / 2, -size / 2, size, size, 26).fill(swatch.green.fill).stroke({ width: 5, color: swatch.green.line });
  g.moveTo(-size * 0.24, 0).lineTo(-size * 0.06, size * 0.2).lineTo(size * 0.26, -size * 0.2).stroke({ width: 14, color: 0xffffff, cap: 'round', join: 'round' });
  c.addChild(g);
  return c;
}

/** The hub icon and sticker: a round window with two halos, one big and one small. */
export function iconArt(size: number, nearLook = 1, farLook = 1 / 9): Container {
  const c = new Container();
  const k = size / 220;
  const g = new Graphics();
  g.circle(0, 0, 110 * k).fill(wood.fill).stroke({ width: 5, color: wood.line });
  g.circle(0, 0, 96 * k).fill(NIGHT_LOW);
  g.rect(-96 * k, 20 * k, 192 * k, 1).fill({ color: WATER, alpha: 0 });
  const near = { x: -34 * k, y: 10 * k };
  const far = { x: 46 * k, y: -20 * k };
  for (const [p, l] of [[near, nearLook], [far, farLook]] as const) {
    const r = haloRadius(l) * 0.55 * k;
    g.circle(p.x, p.y, r).fill({ color: GLOW, alpha: haloAlpha(l) * 0.6 });
    g.circle(p.x, p.y, CORE_R * 0.8 * k * 2).fill(CORE);
  }
  c.addChild(g);
  return c;
}

/** Levels 5–6: the curtain over the side strip, folds hanging from a rail; it lifts by squashing up toward the rail. */
export function curtainArt(r: Rect): Container {
  const c = new Container();
  c.position.set(r.x, r.y);
  const g = new Graphics();
  g.roundRect(0, 0, r.w, r.h, 26).fill(swatch.purple.fill).stroke({ width: 5, color: swatch.purple.line });
  const folds = Math.max(4, Math.round(r.w / 70));
  for (let i = 1; i < folds; i++) {
    const x = (r.w / folds) * i;
    g.moveTo(x, 14).bezierCurveTo(x - 8, r.h * 0.4, x + 8, r.h * 0.7, x, r.h - 10).stroke({ width: 4, color: swatch.purple.line, alpha: 0.5 });
  }
  g.roundRect(-6, -6, r.w + 12, 16, 8).fill(wood.fill).stroke({ width: 3, color: wood.line });
  c.addChild(g);
  return c;
}

/** The curtain's tassel: a cord from the rail ending in a big round tassel, with a touch-down ring. */
export class Tassel extends Container {
  readonly ring = touchRing(56);
  readonly glow = new Graphics().circle(0, 0, 60).fill({ color: GLOW, alpha: 0.3 }).stroke({ width: 6, color: GLOW, alpha: 0.95 });
  constructor(cordUp: number) {
    super();
    const g = new Graphics();
    g.moveTo(0, -cordUp).lineTo(0, -26).stroke({ width: 5, color: swatch.yellow.line });
    g.circle(0, -20, 10).fill(swatch.yellow.fill).stroke({ width: 3, color: swatch.yellow.line });
    g.poly([-10, -14, 10, -14, 26, 34, -26, 34]).fill(swatch.yellow.fill).stroke({ width: 4, color: swatch.yellow.line, join: 'round' });
    for (const x of [-14, -5, 5, 14]) g.moveTo(x * 0.6, -10).lineTo(x * 1.4, 32).stroke({ width: 2, color: swatch.yellow.line, alpha: 0.7 });
    this.glow.visible = false;
    this.ring.alpha = 0;
    this.addChild(this.glow, g, this.ring);
  }
}

/** Level 6: a light's order mark, one to three dots on a dark pill under it (no numbers to read). */
export function orderDots(n: number, y: number): Graphics {
  const g = new Graphics();
  if (n <= 0) return g;
  const w = 20 + n * 22;
  g.roundRect(-w / 2, y - 17, w, 34, 17).fill({ color: ink, alpha: 0.75 }).stroke({ width: 3, color: 0xffffff });
  for (let i = 0; i < n; i++) g.circle(-(n - 1) * 11 + i * 22, y, 7).fill(0xffffff);
  return g;
}

/** Level 6: the ring that shows a light has a mark (a hint's mark gets a solid gold ring). */
export function markRing(r: number, locked: boolean): Graphics {
  return new Graphics().circle(0, 0, r).stroke({ width: locked ? 7 : 5, color: locked ? 0xf2c94c : 0xffffff, alpha: 0.85 });
}

/** Level 6's strip has three thin lanes, so each stop is a faint line with its dots along the bottom (no posts). */
export function stopTicks(stopX: readonly number[], r: Rect): Graphics {
  const g = new Graphics();
  stopX.forEach((x, k) => {
    g.moveTo(x, r.y + 12).lineTo(x, r.y + r.h - 24).stroke({ width: 2, color: 0xffffff, alpha: 0.18 });
    for (let i = 0; i <= k; i++) g.circle(x - k * 6 + i * 12, r.y + r.h - 12, 4).fill(0xffffff);
  });
  return g;
}
