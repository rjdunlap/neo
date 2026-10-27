// Moon Window's code-drawn art: the wooden wall and round window, the night sky, the Moon at a stop, the Later button,
// cards, the request card and the hub icon and sticker. Everything draws into Pixi Graphics with the shared palette.
import { Container, Graphics } from 'pixi.js';
import { swatch } from '../../art/palette';
import { amountOf, moonShape, type Box } from './logic';

export const SKY = 0x1e2a5a;
export const SKY_EDGE = 0x2d3f7a;
const STAR = 0xfff4c8;
const MOON_LIT = 0xfff3c4;
const MOON_LINE = 0xe3c97a;
const MOON_DARK = 0x4b5a8a;
const WOOD = swatch.brown.fill;
const WOOD_LINE = swatch.brown.line;

/** The wall behind the window: warm wood, with soft plank lines. */
export function drawWall(g: Graphics, w: number, h: number) {
  g.clear().rect(0, 0, w, h).fill(WOOD);
  for (let y = 90; y < h; y += 150) g.rect(0, y, w, 4).fill({ color: WOOD_LINE, alpha: 0.35 });
}

/** The round window: a sky disk with a few stars inside a wooden frame, centered on (0, 0). */
export function windowArt(d: number, stars: { x: number; y: number }[]): Graphics {
  const r = d / 2;
  const g = new Graphics();
  g.circle(0, 6, r + 22).fill(WOOD_LINE);
  g.circle(0, 0, r + 22).fill(swatch.brown.light).stroke({ width: 5, color: WOOD_LINE });
  g.circle(0, 0, r).fill(SKY).stroke({ width: 4, color: SKY_EDGE });
  for (const s of stars) g.circle(s.x * r, s.y * r, 3.5).fill(STAR);
  return g;
}

/** A sky disk for a card's small round frame. */
export function frameArt(r: number): Graphics {
  return new Graphics().circle(0, 0, r + 10).fill(swatch.brown.light).stroke({ width: 4, color: WOOD_LINE }).circle(0, 0, r).fill(SKY);
}

/** The Moon at stop `k`: the whole outline faintly, then the lit part. Nothing at k 0. Draws into `g`, centered on (0, 0). */
export function drawMoon(g: Graphics, k: number, r: number) {
  g.clear();
  const pts = moonShape(k, r);
  if (!pts.length) return g;
  g.circle(0, 0, r).fill(MOON_DARK).stroke({ width: 2, color: 0x6a78a8 });
  g.poly(pts.flatMap((p) => [p.x, p.y]), true).fill(MOON_LIT);
  if (amountOf(k) === 'full') g.circle(0, 0, r).stroke({ width: 3, color: MOON_LINE });
  return g;
}

/** An outline around the lit part, for a level-3 miss. */
export function drawLitOutline(g: Graphics, k: number, r: number) {
  g.clear();
  const pts = moonShape(k, r + 6);
  if (!pts.length) return g;
  g.poly(pts.flatMap((p) => [p.x, p.y]), true).stroke({ width: 6, color: swatch.yellow.fill });
  return g;
}

/** The Later button's picture: a curved arrow over three small dots (some days going by), never a clock. */
export function laterArt(): Graphics {
  const g = new Graphics();
  g.arc(0, -4, 42, Math.PI * 0.95, Math.PI * 1.95).stroke({ width: 12, color: swatch.blue.line, cap: 'round' });
  g.poly([40, -30, 58, 4, 22, 0], true).fill(swatch.blue.line);
  for (let i = -1; i <= 1; i++) g.circle(i * 24, 40, 7).fill(swatch.blue.line);
  return g;
}

/** The request card's picture: a big glowing Moon with an arrow up (more) or a small faint one with an arrow down (less). */
export function requestArt(ask: 'more' | 'less'): Container {
  const c = new Container();
  const g = new Graphics();
  if (ask === 'more') {
    g.circle(-30, 0, 44).fill({ color: MOON_LIT, alpha: 0.35 });
    g.circle(-30, 0, 32).fill(MOON_LIT).stroke({ width: 3, color: MOON_LINE });
    g.moveTo(40, 26).lineTo(40, -26).stroke({ width: 10, color: swatch.green.line, cap: 'round' });
    g.poly([40, -40, 58, -14, 22, -14], true).fill(swatch.green.line);
  } else {
    g.circle(-30, 0, 32).fill(MOON_DARK).stroke({ width: 2, color: 0x6a78a8 });
    g.circle(-30, 0, 10).fill({ color: MOON_LIT, alpha: 0.8 });
    g.moveTo(40, -26).lineTo(40, 26).stroke({ width: 10, color: swatch.purple.line, cap: 'round' });
    g.poly([40, 40, 58, 14, 22, 14], true).fill(swatch.purple.line);
  }
  c.addChild(g);
  return c;
}

/** The shutter that dims the window between views. */
export function shutterArt(r: number): Graphics {
  return new Graphics().circle(0, 0, r).fill({ color: 0x0b1230, alpha: 0.92 });
}

/** The hub icon: a round window with a half-lit Moon. */
export function iconArt(k = 2, size = 100): Container {
  const c = new Container();
  const r = size / 2;
  const win = windowArt(size, [{ x: -0.6, y: -0.5 }, { x: 0.55, y: -0.6 }, { x: 0.6, y: 0.55 }]);
  const moon = drawMoon(new Graphics(), k, r * 0.5);
  c.addChild(win, moon);
  c.y = -r - 10;
  return c;
}

/** The sticker: a seeded Moon stop in a little round frame. */
export function stickerArt(seed: number): Container {
  return iconArt(1 + (Math.abs(Math.floor(seed)) % 7), 96);
}

export const boxCenter = (b: Box) => ({ x: b.x + b.w / 2, y: b.y + b.h / 2 });
