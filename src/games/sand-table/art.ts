import { Container, Graphics } from 'pixi.js';
import { swatch, wood } from '../../art/palette';
import type { Invitation } from './logic';

export const SAND = 0xf2cf8a;
export const SAND_LINE = 0xd4a95a;
const stroke = (color: number, width = 5) => ({ width, color, join: 'round' as const, cap: 'round' as const });

/** A grain of sand: a small dot. */
export function grainDot(): Graphics {
  return new Graphics().circle(0, 0, 7).fill(SAND).stroke(stroke(SAND_LINE, 2));
}

/** The bucket over the tray: a blue pail with its sand showing. It is decoration, not a target. `full` is 0..1. */
export function drawBucket(g: Graphics, full: number) {
  g.clear();
  const w = 150;
  const h = 110;
  // body, wider at the mouth
  g.poly([-w / 2, -h / 2, w / 2, -h / 2, w / 2 - 22, h / 2, -w / 2 + 22, h / 2]).fill(swatch.blue.fill).stroke(stroke(swatch.blue.line));
  if (full > 0) {
    const top = h / 2 - 8 - (h - 26) * full;
    const inset = (y: number) => 22 * ((h / 2 - y) / h);
    g.poly([-w / 2 + 8 + inset(top), top, w / 2 - 8 - inset(top), top, w / 2 - 30, h / 2 - 8, -w / 2 + 30, h / 2 - 8]).fill(SAND);
  }
  g.roundRect(-w / 2, -h / 2 - 12, w, 20, 10).fill(swatch.blue.light).stroke(stroke(swatch.blue.line, 4));
  g.moveTo(-w / 2 + 10, -h / 2 - 12).quadraticCurveTo(0, -h / 2 - 40, w / 2 - 10, -h / 2 - 12).stroke(stroke(swatch.blue.line, 5));
}

/** The spill pail: a small red pail whose sand shows. `n` of 48 sets the level. */
export function drawPail(g: Graphics, n: number) {
  g.clear();
  const w = 96;
  const h = 84;
  g.poly([-w / 2, -h / 2, w / 2, -h / 2, w / 2 - 14, h / 2, -w / 2 + 14, h / 2]).fill(swatch.red.fill).stroke(stroke(swatch.red.line));
  const level = Math.min(1, n / 12);
  const top = h / 2 - 8 - (h - 22) * level;
  g.poly([-w / 2 + 8, top, w / 2 - 8, top, w / 2 - 20, h / 2 - 8, -w / 2 + 20, h / 2 - 8]).fill(SAND);
  g.roundRect(-w / 2, -h / 2 - 8, w, 14, 7).fill(swatch.red.light).stroke(stroke(swatch.red.line, 3));
}

/** A paddle under a bay: a little wooden board with a scoop and an arrow that lifts away. */
export function paddleArt(w: number, h: number): Container {
  const c = new Container();
  const g = new Graphics().roundRect(-w / 2, -h / 2, w, h, 22).fill(wood.fill).stroke(stroke(wood.line));
  // shovel: blade at the bottom, handle up
  g.roundRect(-8, -26, 16, 36, 6).fill(wood.light).stroke(stroke(wood.line, 3));
  g.poly([-26, 6, 26, 6, 18, 34, -18, 34]).fill(swatch.blue.fill).stroke(stroke(swatch.blue.line, 4));
  g.ellipse(0, 6, 26, 7).fill(SAND).stroke(stroke(SAND_LINE, 3));
  // arrow up, to the side
  g.moveTo(w / 2 - 38, 28).lineTo(w / 2 - 38, -22).stroke(stroke(swatch.green.line, 7));
  g.poly([w / 2 - 38, -34, w / 2 - 54, -14, w / 2 - 22, -14]).fill(swatch.green.fill).stroke(stroke(swatch.green.line, 3));
  c.addChild(g);
  return c;
}

/** The flag button: a red flag on a pole in a round white button. */
export function flagArt(size: number): Container {
  const c = new Container();
  const r = size / 2;
  c.addChild(new Graphics().circle(0, 0, r).fill(0xffffff).stroke(stroke(swatch.green.line, 7)));
  const g = new Graphics();
  g.moveTo(-r * 0.3, r * 0.55).lineTo(-r * 0.3, -r * 0.6).stroke(stroke(wood.line, 7));
  g.poly([-r * 0.3, -r * 0.6, r * 0.5, -r * 0.3, -r * 0.3, 0]).fill(swatch.red.fill).stroke(stroke(swatch.red.line, 4));
  g.circle(-r * 0.3, -r * 0.62, 7).fill(swatch.yellow.fill);
  c.addChild(g);
  return c;
}

/** A pictured invitation: one tall hill, two hills or a flat road. A suggestion only; nothing checks it. */
export function invitationCard(kind: Invitation): Container {
  const c = new Container();
  const w = 140;
  const h = 100;
  c.addChild(new Graphics().roundRect(-w / 2, -h / 2, w, h, 16).fill(0xfffaf0).stroke(stroke(wood.line, 5)));
  const g = new Graphics();
  const base = h / 2 - 14;
  if (kind === 'flat') g.roundRect(-w / 2 + 14, base - 10, w - 28, 12, 6).fill(SAND).stroke(stroke(SAND_LINE, 3));
  else if (kind === 'tall') g.poly([-46, base, 0, -h / 2 + 16, 46, base]).fill(SAND).stroke(stroke(SAND_LINE, 4));
  else {
    g.poly([-52, base, -26, -h / 2 + 24, 0, base]).fill(SAND).stroke(stroke(SAND_LINE, 4));
    g.poly([0, base, 26, -h / 2 + 24, 52, base]).fill(SAND).stroke(stroke(SAND_LINE, 4));
  }
  c.addChild(g);
  c.eventMode = 'none';
  return c;
}

/** A heap in a pail with a scoop, for the hub and the sticker. */
export function sandPicture(heights: number[], shell: boolean): Container {
  const c = new Container();
  const w = 260;
  const step = w / (heights.length - 1);
  const g = new Graphics();
  g.roundRect(-w / 2 - 20, 0, w + 40, 26, 10).fill(wood.fill).stroke(stroke(wood.line, 4));
  const pts: number[] = [-w / 2, 0];
  heights.forEach((v, i) => pts.push(-w / 2 + i * step, -v * 22));
  pts.push(w / 2, 0);
  g.poly(pts).fill(SAND).stroke(stroke(SAND_LINE, 4));
  c.addChild(g);
  if (shell) {
    const peak = heights.indexOf(Math.max(...heights));
    const s = new Graphics().ellipse(0, 0, 18, 14).fill(swatch.pink.fill).stroke(stroke(swatch.pink.line, 3));
    s.position.set(-w / 2 + peak * step, -Math.max(...heights) * 22 - 10);
    c.addChild(s);
  }
  return c;
}
