import { Container, Graphics } from 'pixi.js';
import { cream, ink, swatch, wood } from '../../art/palette';
import type { PartId, PropId } from './logic';

const stroke = (color: number, width = 5) => ({ width, color, join: 'round' as const, cap: 'round' as const });
const PATTERN_COLORS = [swatch.red, swatch.blue, swatch.purple] as const;

/** Stripes, dots or a zigzag over a cloth shape's bounding box. */
function pattern(g: Graphics, kind: number, x: number, y: number, w: number, h: number, color: number) {
  if (kind === 0) {
    for (let i = 1; i < 4; i++) g.moveTo(x + (w * i) / 4, y + 4).lineTo(x + (w * i) / 4, y + h - 4).stroke(stroke(color, 5));
  } else if (kind === 1) {
    for (const [fx, fy] of [[0.25, 0.3], [0.65, 0.3], [0.45, 0.7], [0.8, 0.7]]) g.circle(x + w * fx, y + h * fy, 6).fill(color);
  } else {
    g.moveTo(x + 4, y + h * 0.7);
    for (let i = 1; i <= 6; i++) g.lineTo(x + (w * i) / 6, y + h * (i % 2 ? 0.3 : 0.7));
    g.stroke(stroke(color, 5));
  }
}

/** The ribbon: a curved striped strip (a part, about 110 wide). */
export function ribbonPic(kind: number): Container {
  const c = new Container();
  const col = PATTERN_COLORS[kind % 3];
  const g = new Graphics();
  g.moveTo(-50, -10).quadraticCurveTo(-20, -45, 10, -10).quadraticCurveTo(40, 25, 50, -5).lineTo(50, 22).quadraticCurveTo(40, 40, 10, 14)
    .quadraticCurveTo(-20, -18, -50, 18).closePath().fill(col.fill).stroke(stroke(col.line));
  g.moveTo(-26, -20).lineTo(-26, 8).stroke(stroke(0xffffff, 5));
  g.moveTo(8, -6).lineTo(8, 18).stroke(stroke(0xffffff, 5));
  g.moveTo(34, 0).lineTo(34, 24).stroke(stroke(0xffffff, 5));
  c.addChild(g);
  return c;
}

/** The beater: a stick with a round head. */
export function beaterPic(): Container {
  const c = new Container();
  const g = new Graphics();
  g.moveTo(-42, 40).lineTo(22, -22).stroke(stroke(wood.line, 14));
  g.moveTo(-42, 40).lineTo(22, -22).stroke(stroke(wood.fill, 8));
  g.circle(34, -34, 24).fill(swatch.orange.fill).stroke(stroke(swatch.orange.line));
  g.circle(26, -42, 6).fill({ color: 0xffffff, alpha: 0.7 });
  c.addChild(g);
  return c;
}

/** A flag on a pole. Bare: the pole's knot loop is empty, with a dashed outline of the missing ribbon. */
export function flagPic(shape: number, ribbonKind: number, ready: boolean): Container {
  const c = new Container();
  const col = PATTERN_COLORS[ribbonKind % 3];
  const g = new Graphics();
  g.moveTo(-18, 68).lineTo(-18, -62).stroke(stroke(wood.line, 12));
  g.moveTo(-18, 68).lineTo(-18, -62).stroke(stroke(wood.fill, 6));
  g.circle(-18, -66, 9).fill(swatch.yellow.fill).stroke(stroke(swatch.yellow.line, 3));
  if (ready) {
    const x = -14, y = -58, w = 90, h = 62;
    const cloth = new Graphics();
    if (shape === 0) cloth.poly([x, y, x + w, y + h / 2, x, y + h]);
    else if (shape === 1) cloth.poly([x, y, x + w, y, x + w - 24, y + h / 2, x + w, y + h, x, y + h]);
    else cloth.rect(x, y, w, h);
    cloth.fill(col.fill).stroke(stroke(col.line));
    pattern(cloth, ribbonKind, x + 6, y, w - 20, h, 0xffffff);
    g.addChild(cloth);
  } else {
    g.circle(-18, -44, 13).stroke(stroke(swatch.red.line, 4)); // the empty knot loop
    const dash = new Graphics();
    for (let i = 0; i < 6; i++) dash.moveTo(0 + i * 14, -50 + (i % 2) * 4).lineTo(7 + i * 14, -50 + (i % 2) * 4).stroke({ width: 3, color: 0xb8b2a6, cap: 'round' });
    g.addChild(dash);
  }
  c.addChild(g);
  return c;
}

/** A drum. Bare: an empty clip on its side and a dashed beater outline. */
export function drumPic(patternKind: number, ready: boolean, beaterShown = false): Container {
  const c = new Container();
  const col = PATTERN_COLORS[patternKind % 3];
  const g = new Graphics();
  g.roundRect(-58, -30, 116, 78, 12).fill(col.fill).stroke(stroke(col.line));
  g.ellipse(0, -30, 58, 18).fill(cream).stroke(stroke(col.line));
  g.moveTo(-58, -26).lineTo(-30, 44).lineTo(0, -26).lineTo(30, 44).lineTo(58, -26).stroke(stroke(0xffffff, 3));
  if (ready || beaterShown) {
    g.moveTo(52, -10).lineTo(70, -48).stroke(stroke(wood.line, 8));
    g.circle(72, -52, 10).fill(swatch.orange.fill).stroke(stroke(swatch.orange.line, 3));
  } else {
    g.roundRect(54, -20, 14, 26, 6).stroke(stroke(swatch.red.line, 4)); // the empty clip
    g.moveTo(62, -30).lineTo(76, -56).stroke({ width: 3, color: 0xb8b2a6, cap: 'round' });
  }
  c.addChild(g);
  return c;
}

export function bellPic(): Container {
  const c = new Container();
  const g = new Graphics();
  g.moveTo(-48, 38).quadraticCurveTo(-52, -54, 0, -54).quadraticCurveTo(52, -54, 48, 38).closePath().fill(swatch.yellow.fill).stroke(stroke(swatch.yellow.line));
  g.circle(0, 50, 11).fill(swatch.orange.fill).stroke(stroke(swatch.orange.line, 3));
  g.circle(0, -62, 8).stroke(stroke(swatch.yellow.line, 4));
  g.moveTo(-26, -10).quadraticCurveTo(-30, -34, -12, -38).stroke({ width: 5, color: 0xffffff, alpha: 0.7, cap: 'round' });
  c.addChild(g);
  return c;
}

export function ballPic(): Container {
  const c = new Container();
  const g = new Graphics();
  g.circle(0, 0, 54).fill(swatch.green.fill).stroke(stroke(swatch.green.line));
  g.moveTo(-50, -10).quadraticCurveTo(0, 20, 50, -10).stroke(stroke(0xffffff, 6));
  g.moveTo(-20, -48).quadraticCurveTo(10, -10, -10, 50).stroke(stroke(0xffffff, 6));
  c.addChild(g);
  return c;
}

export interface Look { flagShape: number; ribbonPattern: number; drumPattern: number }

export function propPic(id: PropId, ready: boolean, look: Look): Container {
  if (id === 'flag') return flagPic(look.flagShape, look.ribbonPattern, ready);
  if (id === 'drum') return drumPic(look.drumPattern, ready);
  return id === 'bell' ? bellPic() : ballPic();
}

export function partPic(id: PartId, look: Look): Container {
  return id === 'ribbon' ? ribbonPic(look.ribbonPattern) : beaterPic();
}

/** The satchel (230 wide, centred on 0,0). Open shows the lip; zipped shows a closed flap. */
export function drawBag(g: Graphics, zipped: boolean, wobble = 0) {
  g.clear();
  g.roundRect(-100, -70 + wobble, 200, 150, 28).fill(swatch.orange.fill).stroke(stroke(swatch.orange.line, 6));
  g.moveTo(-60, -70 + wobble).quadraticCurveTo(0, -150 + wobble, 60, -70 + wobble).stroke(stroke(swatch.orange.line, 10));
  if (zipped) {
    g.moveTo(-100, -40 + wobble).quadraticCurveTo(0, 10 + wobble, 100, -40 + wobble).lineTo(100, -70 + wobble).lineTo(-100, -70 + wobble).closePath().fill(swatch.orange.light).stroke(stroke(swatch.orange.line, 5));
    g.circle(0, -2 + wobble, 11).fill(swatch.yellow.fill).stroke(stroke(swatch.yellow.line, 3));
  } else {
    g.ellipse(0, -70 + wobble, 100, 22).fill(0x6b4a2a).stroke(stroke(swatch.orange.line, 5));
    g.roundRect(-50, 10 + wobble, 100, 40, 14).fill(swatch.orange.light).stroke(stroke(swatch.orange.line, 4));
  }
}

/** The wooden bench top. */
export function drawBench(g: Graphics, w: number, h: number) {
  g.clear();
  g.roundRect(0, 0, w, h, 22).fill(wood.fill).stroke(stroke(wood.line, 6));
  g.roundRect(8, 8, w - 16, 20, 12).fill({ color: wood.light, alpha: 0.7 });
}

/** The request card: the finished props' silhouettes, smaller. */
export function cardPic(request: readonly PropId[], look: Look): Container {
  const c = new Container();
  const bg = new Graphics().roundRect(-150, -80, 300, 160, 26).fill(cream).stroke(stroke(swatch.purple.line, 6));
  c.addChild(bg);
  const n = request.length;
  request.forEach((id, i) => {
    const p = propPic(id, true, look);
    p.scale.set(n > 1 ? 0.8 : 1);
    p.position.set(n > 1 ? (i - 0.5) * 140 : 0, 4);
    c.addChild(p);
  });
  return c;
}

/** The parade wagon (about 200 wide), props ride on it. */
export function wagonPic(): Container {
  const c = new Container();
  const g = new Graphics();
  g.roundRect(-100, -10, 200, 44, 12).fill(swatch.blue.fill).stroke(stroke(swatch.blue.line));
  g.circle(-62, 42, 20).fill(ink).stroke(stroke(0x555566, 3));
  g.circle(62, 42, 20).fill(ink).stroke(stroke(0x555566, 3));
  g.moveTo(-100, 10).lineTo(-140, 30).stroke(stroke(wood.line, 8));
  c.addChild(g);
  return c;
}

/** A tick mark for the status rail: a small coin, grey or green. */
export function railTick(done: boolean): Graphics {
  return new Graphics().circle(0, 0, 22).fill(done ? swatch.green.fill : 0xe6e1d6).stroke(stroke(done ? swatch.green.line : 0xb8b2a6, 4));
}

export function readySticker(seed: number): Container {
  const c = new Container();
  const flag = flagPic(seed % 3, (seed >> 2) % 3, true);
  flag.position.set(-30, 0);
  const second = seed % 2 ? drumPic((seed >> 3) % 3, true) : bellPic();
  second.scale.set(0.7);
  second.position.set(60, 28);
  c.addChild(flag, second);
  return c;
}
