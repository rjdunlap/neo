import { Container, Graphics } from 'pixi.js';
import { swatch, wood } from '../../art/palette';
import type { Invitation } from './logic';

export const SAND = 0xf2cf8a;
export const SAND_LINE = 0xd4a95a;
const stroke = (color: number, width = 5) => ({
  width,
  color,
  join: 'round' as const,
  cap: 'round' as const,
});

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
  g.poly([-w / 2, -h / 2, w / 2, -h / 2, w / 2 - 22, h / 2, -w / 2 + 22, h / 2])
    .fill(swatch.blue.fill)
    .stroke(stroke(swatch.blue.line));
  if (full > 0) {
    const top = h / 2 - 8 - (h - 26) * full;
    const inset = (y: number) => 22 * ((h / 2 - y) / h);
    g.poly([
      -w / 2 + 8 + inset(top),
      top,
      w / 2 - 8 - inset(top),
      top,
      w / 2 - 30,
      h / 2 - 8,
      -w / 2 + 30,
      h / 2 - 8,
    ]).fill(SAND);
  }
  g.roundRect(-w / 2, -h / 2 - 12, w, 20, 10)
    .fill(swatch.blue.light)
    .stroke(stroke(swatch.blue.line, 4));
  g.moveTo(-w / 2 + 10, -h / 2 - 12)
    .quadraticCurveTo(0, -h / 2 - 40, w / 2 - 10, -h / 2 - 12)
    .stroke(stroke(swatch.blue.line, 5));
}

/** The spill pail: a small red pail whose sand shows. `n` of 48 sets the level. */
export function drawPail(g: Graphics, n: number) {
  g.clear();
  const w = 96;
  const h = 84;
  g.poly([-w / 2, -h / 2, w / 2, -h / 2, w / 2 - 14, h / 2, -w / 2 + 14, h / 2])
    .fill(swatch.red.fill)
    .stroke(stroke(swatch.red.line));
  const level = Math.min(1, n / 12);
  const top = h / 2 - 8 - (h - 22) * level;
  g.poly([-w / 2 + 8, top, w / 2 - 8, top, w / 2 - 20, h / 2 - 8, -w / 2 + 20, h / 2 - 8]).fill(SAND);
  g.roundRect(-w / 2, -h / 2 - 8, w, 14, 7)
    .fill(swatch.red.light)
    .stroke(stroke(swatch.red.line, 3));
}

/** A paddle under a bay: a little wooden board with a scoop and an arrow that lifts away. */
export function paddleArt(w: number, h: number): Container {
  const c = new Container();
  const g = new Graphics()
    .roundRect(-w / 2, -h / 2, w, h, 22)
    .fill(wood.fill)
    .stroke(stroke(wood.line));
  // shovel: blade at the bottom, handle up
  g.roundRect(-8, -26, 16, 36, 6).fill(wood.light).stroke(stroke(wood.line, 3));
  g.poly([-26, 6, 26, 6, 18, 34, -18, 34]).fill(swatch.blue.fill).stroke(stroke(swatch.blue.line, 4));
  g.ellipse(0, 6, 26, 7).fill(SAND).stroke(stroke(SAND_LINE, 3));
  // arrow up, to the side
  g.moveTo(w / 2 - 38, 28)
    .lineTo(w / 2 - 38, -22)
    .stroke(stroke(swatch.green.line, 7));
  g.poly([w / 2 - 38, -34, w / 2 - 54, -14, w / 2 - 22, -14])
    .fill(swatch.green.fill)
    .stroke(stroke(swatch.green.line, 3));
  c.addChild(g);
  return c;
}

/** The flag button: a red flag on a pole in a round white button. */
export function flagArt(size: number): Container {
  const c = new Container();
  const r = size / 2;
  c.addChild(new Graphics().circle(0, 0, r).fill(0xffffff).stroke(stroke(swatch.green.line, 7)));
  const g = new Graphics();
  g.moveTo(-r * 0.3, r * 0.55)
    .lineTo(-r * 0.3, -r * 0.6)
    .stroke(stroke(wood.line, 7));
  g.poly([-r * 0.3, -r * 0.6, r * 0.5, -r * 0.3, -r * 0.3, 0])
    .fill(swatch.red.fill)
    .stroke(stroke(swatch.red.line, 4));
  g.circle(-r * 0.3, -r * 0.62, 7).fill(swatch.yellow.fill);
  c.addChild(g);
  return c;
}

/** A pictured invitation: one tall hill, two hills or a flat road. A suggestion only; nothing checks it. */
export function invitationCard(kind: Invitation): Container {
  const c = new Container();
  const w = 140;
  const h = 100;
  c.addChild(
    new Graphics()
      .roundRect(-w / 2, -h / 2, w, h, 16)
      .fill(0xfffaf0)
      .stroke(stroke(wood.line, 5)),
  );
  const g = new Graphics();
  const base = h / 2 - 14;
  if (kind === 'flat')
    g.roundRect(-w / 2 + 14, base - 10, w - 28, 12, 6)
      .fill(SAND)
      .stroke(stroke(SAND_LINE, 3));
  else if (kind === 'tall')
    g.poly([-46, base, 0, -h / 2 + 16, 46, base])
      .fill(SAND)
      .stroke(stroke(SAND_LINE, 4));
  else {
    g.poly([-52, base, -26, -h / 2 + 24, 0, base])
      .fill(SAND)
      .stroke(stroke(SAND_LINE, 4));
    g.poly([0, base, 26, -h / 2 + 24, 52, base])
      .fill(SAND)
      .stroke(stroke(SAND_LINE, 4));
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
  g.roundRect(-w / 2 - 20, 0, w + 40, 26, 10)
    .fill(wood.fill)
    .stroke(stroke(wood.line, 4));
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

/** Level 4's moved-grain tint: where the blown sand landed keeps this colour until the round ends. */
export const MOVED = swatch.orange.fill;
export const MOVED_LINE = swatch.orange.line;

/** A shell windmill: four shell-pink blades on a stick. `blades` turns while the breeze blows. */
export function windmill(size: number): { node: Container; blades: Graphics } {
  const node = new Container();
  const r = size / 2;
  const stick = new Graphics()
    .moveTo(0, 0)
    .lineTo(0, r * 1.05)
    .stroke(stroke(wood.line, Math.max(3, size / 18)));
  const blades = new Graphics();
  const colors = [swatch.pink, swatch.yellow, swatch.pink, swatch.yellow];
  colors.forEach((c, i) => {
    const a = (i * Math.PI) / 2;
    const tip = { x: Math.cos(a) * r * 0.9, y: Math.sin(a) * r * 0.9 };
    const side = { x: Math.cos(a + 0.9) * r * 0.45, y: Math.sin(a + 0.9) * r * 0.45 };
    blades.poly([0, 0, tip.x, tip.y, side.x, side.y]).fill(c.fill).stroke(stroke(c.line, 3));
  });
  blades
    .circle(0, 0, Math.max(4, size / 14))
    .fill(swatch.white.fill)
    .stroke(stroke(wood.line, 3));
  node.addChild(stick, blades);
  return { node, blades };
}

/** The Breeze button: a shell windmill in a round white button (level 4, in the flag's place). */
export function breezeButton(size: number): { node: Container; blades: Graphics } {
  const c = new Container();
  const r = size / 2;
  c.addChild(new Graphics().circle(0, 0, r).fill(0xffffff).stroke(stroke(swatch.teal.line, 7)));
  const w = windmill(size * 0.62);
  w.node.position.set(0, -r * 0.12);
  c.addChild(w.node);
  return { node: c, blades: w.blades };
}

/** The Replay button: a round arrow in a white button (level 4, in the pail's place, once the breeze has blown). */
export function replayButton(size: number): Container {
  const c = new Container();
  const r = size / 2;
  c.addChild(new Graphics().circle(0, 0, r).fill(0xffffff).stroke(stroke(swatch.blue.line, 7)));
  const g = new Graphics()
    .arc(0, 0, r * 0.45, -Math.PI * 0.35, Math.PI * 1.35)
    .stroke(stroke(swatch.blue.fill, 10));
  const a = -Math.PI * 0.35;
  const tx = Math.cos(a) * r * 0.45;
  const ty = Math.sin(a) * r * 0.45;
  g.poly([tx - 14, ty - 12, tx + 18, ty - 4, tx - 2, ty + 20])
    .fill(swatch.blue.fill)
    .stroke(stroke(swatch.blue.line, 3));
  c.addChild(g);
  return c;
}

/** An answer pad under a bay: a wooden board with a big arrow pointing up into the bay. */
export function answerPad(w: number, h: number): Container {
  const c = new Container();
  const g = new Graphics()
    .roundRect(-w / 2, -h / 2, w, h, 22)
    .fill(wood.light)
    .stroke(stroke(wood.line));
  g.moveTo(0, h / 2 - 18)
    .lineTo(0, -h / 2 + 34)
    .stroke(stroke(swatch.green.line, 12));
  g.poly([0, -h / 2 + 12, -30, -h / 2 + 44, 30, -h / 2 + 44])
    .fill(swatch.green.fill)
    .stroke(stroke(swatch.green.line, 4));
  c.addChild(g);
  return c;
}

/** Breeze lines at the upwind wall: three soft waves, `dir` 1 blowing right, -1 blowing left. */
export function drawBreezeLines(g: Graphics, x: number, y: number, dir: number, alpha: number) {
  g.clear();
  for (let i = 0; i < 3; i++) {
    const yy = y + i * 34;
    const x0 = x;
    const x1 = x + dir * (70 + i * 14);
    g.moveTo(x0, yy)
      .quadraticCurveTo((x0 + x1) / 2, yy - 14, x1, yy)
      .stroke({ width: 5, color: swatch.teal.line, alpha, cap: 'round' });
  }
}
