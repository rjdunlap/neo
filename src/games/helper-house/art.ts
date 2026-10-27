/** Helper House's code-drawn pieces: sensors, reading and action pictures, cards, chips, sockets, the house, the sky mark, icons. */
import { Container, Graphics } from 'pixi.js';
import { Critter, CRITTERS, type CritterName } from '../../art/critter';
import { cream, ink, shadow, swatch, wood, type ColorName } from '../../art/palette';
import { starPoints } from '../../art/shapes';
import type { Action, Reading, SensorKind, SunLevel } from './logic';

const line = (color: number, width = 5) => ({ width, color, join: 'round' as const, cap: 'round' as const });
export const BRASS = { fill: 0xf4d9a6, line: 0xc9a86a };
export const METAL = { fill: 0xd6dbe6, line: 0x8a93a6 };
const NIGHT = 0x1d2552;
const LAMP = { lit: 0xfff1a8, glow: 0xffe066, dark: 0xb3bac9 };

// ——— Small pictures ———

/** An eye: open (with a pupil) or lidded. */
function eyeArt(open: boolean, r: number): Graphics {
  const g = new Graphics();
  g.ellipse(0, 0, r, r * 0.68).fill(0xffffff).stroke(line(ink, Math.max(3, r * 0.14)));
  if (open) {
    g.circle(0, 0, r * 0.4).fill(swatch.teal.line);
    g.circle(0, 0, r * 0.2).fill(ink);
    g.circle(-r * 0.1, -r * 0.14, r * 0.07).fill(0xffffff);
  } else {
    g.moveTo(-r * 0.9, 0).quadraticCurveTo(0, r * 0.6, r * 0.9, 0).stroke(line(ink, Math.max(3, r * 0.14)));
    g.ellipse(0, -r * 0.3, r, r * 0.4).fill(swatch.pink.light);
  }
  return g;
}

function sunArt(r: number, half = false): Graphics {
  const g = new Graphics();
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    if (half && Math.sin(a) > 0.1) continue;
    g.moveTo(Math.cos(a) * r * 1.25, Math.sin(a) * r * 1.25).lineTo(Math.cos(a) * r * 1.6, Math.sin(a) * r * 1.6).stroke(line(swatch.orange.fill, Math.max(3, r * 0.16)));
  }
  if (half) {
    g.moveTo(-r, 0).arc(0, 0, r, Math.PI, 0).closePath().fill(swatch.yellow.fill).stroke(line(swatch.orange.line, Math.max(3, r * 0.12)));
    g.moveTo(-r * 1.7, 0).lineTo(r * 1.7, 0).stroke(line(swatch.teal.line, Math.max(3, r * 0.14)));
  } else {
    g.circle(0, 0, r).fill(swatch.yellow.fill).stroke(line(swatch.orange.line, Math.max(3, r * 0.12)));
  }
  return g;
}

function moonArt(r: number): Graphics {
  const g = new Graphics();
  g.circle(0, 0, r).fill(0xfff6c8).stroke(line(swatch.yellow.line, Math.max(3, r * 0.12)));
  g.circle(r * 0.45, -r * 0.3, r * 0.75).fill(NIGHT);
  g.poly(starPoints(r * 0.26, r * 0.11)).fill(swatch.yellow.fill);
  const star = new Graphics().poly(starPoints(r * 0.22, r * 0.09)).fill(swatch.yellow.fill);
  star.position.set(r * 1.1, r * 0.6);
  g.addChild(star);
  return g;
}

/** A reading's picture: the eye near a friend or far, a moon, a half sun, a full sun. */
export function readingArt(reading: Reading, size = 80): Container {
  const r = size * 0.32;
  if (reading === 'near') {
    const c = new Container();
    c.addChild(eyeArt(true, r));
    const friend = new Graphics().circle(0, 0, r * 0.55).fill(swatch.pink.fill).stroke(line(swatch.pink.line, 3));
    friend.circle(-r * 0.18, -r * 0.1, r * 0.08).fill(ink).circle(r * 0.18, -r * 0.1, r * 0.08).fill(ink);
    friend.position.set(r * 1.3, r * 0.5);
    c.addChild(friend);
    return c;
  }
  if (reading === 'far') return eyeArt(false, r);
  if (reading === 'dark') {
    const c = new Container();
    const back = new Graphics().roundRect(-size / 2 + 6, -size / 2 + 6, size - 12, size - 12, 16).fill(NIGHT);
    c.addChild(back, moonArt(r * 0.8));
    return c;
  }
  return sunArt(r * 0.8, reading === 'dim');
}

/** An action's picture: an open door, a lit lamp, a dark lamp. */
export function actionArt(action: Action, size = 80): Graphics {
  const g = new Graphics();
  const s = size * 0.42;
  if (action === 'open') {
    g.roundRect(-s * 0.6, -s, s * 1.2, s * 2, 8).fill(wood.light).stroke(line(wood.line, 4));
    g.roundRect(-s * 0.6, -s, s * 0.5, s * 2, 6).fill(wood.fill).stroke(line(wood.line, 4));
    g.circle(-s * 0.2, s * 0.1, s * 0.1).fill(swatch.yellow.fill);
    return g;
  }
  const lit = action === 'on';
  if (lit) g.circle(0, -s * 0.25, s * 1.1).fill({ color: LAMP.glow, alpha: 0.35 });
  g.circle(0, -s * 0.25, s * 0.62).fill(lit ? LAMP.lit : LAMP.dark).stroke(line(lit ? swatch.yellow.line : METAL.line, 4));
  g.roundRect(-s * 0.28, s * 0.3, s * 0.56, s * 0.42, 6).fill(METAL.fill).stroke(line(METAL.line, 4));
  if (lit) {
    for (let i = 0; i < 5; i++) {
      const a = Math.PI + (i / 4) * Math.PI;
      g.moveTo(Math.cos(a) * s * 0.8, -s * 0.25 + Math.sin(a) * s * 0.8).lineTo(Math.cos(a) * s * 1.05, -s * 0.25 + Math.sin(a) * s * 1.05).stroke(line(swatch.yellow.line, 4));
    }
  } else {
    g.moveTo(-s * 0.25, -s * 0.45).lineTo(s * 0.25, -s * 0.05).moveTo(s * 0.25, -s * 0.45).lineTo(-s * 0.25, -s * 0.05).stroke(line(METAL.line, 4));
  }
  return g;
}

/** A sensor's picture: an eye on a bracket, or a little sun panel. */
export function sensorArt(kind: SensorKind, size = 80): Container {
  const c = new Container();
  const r = size * 0.3;
  if (kind === 'eye') {
    const bracket = new Graphics().roundRect(-r * 1.3, -r * 0.95, r * 2.6, r * 1.9, r * 0.5).fill(METAL.fill).stroke(line(METAL.line, 4));
    c.addChild(bracket, eyeArt(true, r));
    return c;
  }
  const panel = new Graphics().roundRect(-r * 1.3, -r * 1.1, r * 2.6, r * 2.2, r * 0.4).fill(swatch.blue.light).stroke(line(swatch.blue.line, 4));
  panel.moveTo(-r * 1.3, 0).lineTo(r * 1.3, 0).moveTo(0, -r * 1.1).lineTo(0, r * 1.1).stroke(line(swatch.blue.line, 3));
  const sun = sunArt(r * 0.45);
  c.addChild(panel, sun);
  return c;
}

// ——— Frames ———

/** A card: a cream plate; lit while it is the matched row; dashed inside when empty. */
export function cardArt(w: number, h: number, lit = false, empty = false): Graphics {
  const g = new Graphics();
  g.roundRect(-w / 2 + 4, -h / 2 + 8, w, h, 18).fill({ color: shadow, alpha: 0.1 });
  g.roundRect(-w / 2, -h / 2, w, h, 18).fill(lit ? swatch.yellow.light : cream).stroke(line(lit ? swatch.yellow.line : wood.line, lit ? 6 : 4));
  if (empty) dashedBox(g, w - 28, h - 28, 12);
  return g;
}

function dashedBox(g: Graphics, w: number, h: number, r: number) {
  const steps = 10;
  const perim = 2 * (w + h);
  for (let i = 0; i < steps * 2; i += 2) {
    const a = (i / (steps * 2)) * perim;
    const b = a + perim / (steps * 4);
    g.moveTo(...onBox(a, w, h)).lineTo(...onBox(b, w, h)).stroke(line(METAL.line, 4));
  }
  g.roundRect(-w / 2, -h / 2, w, h, r);
}

function onBox(d: number, w: number, h: number): [number, number] {
  if (d < w) return [-w / 2 + d, -h / 2];
  if (d < w + h) return [w / 2, -h / 2 + (d - w)];
  if (d < 2 * w + h) return [w / 2 - (d - w - h), h / 2];
  return [-w / 2, h / 2 - (d - 2 * w - h)];
}

/** A chip or a bench tile: a white rounded square. */
export function tileArt(size: number, lit = false): Graphics {
  const g = new Graphics();
  g.roundRect(-size / 2 + 3, -size / 2 + 6, size, size, 20).fill({ color: shadow, alpha: 0.1 });
  g.roundRect(-size / 2, -size / 2, size, size, 20).fill(lit ? swatch.yellow.light : 0xffffff).stroke(line(lit ? swatch.yellow.line : METAL.line, 4));
  return g;
}

/** A socket on the house: a brass frame, dashed inside while empty, lit while a dragged sensor is near. */
export function socketArt(size: number, empty: boolean, near = false): Graphics {
  const g = new Graphics();
  g.roundRect(-size / 2, -size / 2, size, size, 18).fill(near ? swatch.yellow.light : empty ? cream : BRASS.fill).stroke(line(near ? swatch.yellow.line : BRASS.line, 6));
  if (empty) dashedBox(g, size - 30, size - 30, 10);
  return g;
}

/** A small speech bubble that holds the sensor's reading during a step. */
export function bubbleArt(size: number): Graphics {
  const g = new Graphics();
  g.roundRect(-size / 2, -size / 2, size, size, 16).fill(0xffffff).stroke(line(ink, 4));
  g.moveTo(-10, size / 2).lineTo(0, size / 2 + 14).lineTo(10, size / 2).fill(0xffffff).stroke(line(ink, 4));
  return g;
}

// ——— The house ———

export interface HouseGeometry {
  w: number;
  h: number;
  /** Whether the house has a lamp post (levels 2–3) or a door with sockets (level 1). */
  lamp: boolean;
}

/** The house, drawn in a rect of w × h with its top-left at (0, 0): walls, roof, door, window, lamp post. */
export class House extends Container {
  private readonly door = new Graphics();
  private readonly lampLight = new Graphics();
  private readonly lampHead = new Graphics();
  private readonly windowFaces = new Container();
  readonly doorAt: { x: number; y: number };
  readonly windowAt: { x: number; y: number };
  readonly lampAt: { x: number; y: number };
  /** Where a friend stands in front of the door, or under the lamp. */
  readonly friendAt: { x: number; y: number };
  readonly groundY: number;
  private open = 0;

  constructor(readonly geo: HouseGeometry, color: ColorName) {
    super();
    this.eventMode = 'none';
    const { w, h, lamp } = geo;
    const sw = swatch[color];
    const ground = h * 0.92;
    this.groundY = ground;
    const left = w * 0.1;
    const right = lamp ? w * 0.62 : w * 0.9;
    const top = h * 0.5;
    const peak = h * 0.25;
    const g = new Graphics();
    // Ground and a path.
    g.roundRect(-w * 0.05, ground - 6, w * 1.1, h * 0.12, 20).fill(0xa8dc8f);
    g.ellipse(w * 0.3, ground + 10, w * 0.14, 10).fill({ color: shadow, alpha: 0.1 });
    // Walls and roof.
    g.roundRect(left + 6, top + 10, right - left, ground - top, 14).fill({ color: shadow, alpha: 0.12 });
    g.roundRect(left, top, right - left, ground - top, 14).fill(sw.light).stroke(line(sw.line, 6));
    g.moveTo(left - 24, top + 6).lineTo((left + right) / 2, peak).lineTo(right + 24, top + 6).closePath().fill(sw.fill).stroke(line(sw.line, 6));
    g.roundRect(right - (right - left) * 0.3, peak + (top - peak) * 0.15, 36, 60, 6).fill(swatch.brown.fill).stroke(line(swatch.brown.line, 4));
    this.addChild(g);
    // The door: a frame and a leaf that swings open.
    const dx = lamp ? left + (right - left) * 0.68 : w * 0.3;
    const dw = Math.max(60, w * 0.16);
    const dh = Math.max(110, h * 0.3);
    const frame = new Graphics().roundRect(dx - dw / 2 - 6, ground - dh - 6, dw + 12, dh + 6, 10).fill(0x3a3350);
    this.addChild(frame);
    this.door.position.set(dx - dw / 2, ground - dh);
    this.addChild(this.door);
    this.doorAt = { x: dx, y: ground - dh / 2 };
    this.drawDoor(dw, dh);
    // The window with its sill, and the faces of the friends inside.
    const wx = lamp ? left + (right - left) * 0.26 : w * 0.72;
    const wy = top + (ground - top) * 0.38;
    const ws = Math.max(56, w * 0.14);
    const win = new Graphics();
    win.roundRect(wx - ws / 2, wy - ws / 2, ws, ws, 8).fill(0xbfe6ff).stroke(line(sw.line, 5));
    win.moveTo(wx, wy - ws / 2).lineTo(wx, wy + ws / 2).moveTo(wx - ws / 2, wy).lineTo(wx + ws / 2, wy).stroke(line(sw.line, 4));
    win.roundRect(wx - ws / 2 - 8, wy + ws / 2 - 2, ws + 16, 10, 4).fill(sw.line);
    this.addChild(win, this.windowFaces);
    this.windowAt = { x: wx, y: wy };
    this.windowFaces.position.set(wx, wy);
    // The lamp post (levels 2–3).
    const px = w * 0.8;
    const topY = h * 0.2;
    this.lampAt = { x: px, y: topY };
    if (lamp) {
      const post = new Graphics();
      post.roundRect(px - 9, topY, 18, ground - topY, 6).fill(METAL.fill).stroke(line(METAL.line, 4));
      post.roundRect(px - 30, ground - 16, 60, 20, 8).fill(METAL.fill).stroke(line(METAL.line, 4));
      this.addChild(this.lampLight, post, this.lampHead);
      this.setLamp(false);
    }
    this.friendAt = lamp ? { x: px - w * 0.14, y: ground } : { x: dx, y: ground + 8 };
  }

  private drawDoor(dw: number, dh: number) {
    const d = this.door;
    d.clear();
    const k = this.open;
    // Inside first (warm light), then the leaf, narrowing as it swings.
    d.roundRect(0, 0, dw, dh, 8).fill(k > 0.05 ? 0xffe6a8 : 0x6b5a7a);
    const leafW = dw * (1 - 0.8 * k);
    d.roundRect(0, 0, leafW, dh, 8).fill(wood.fill).stroke(line(wood.line, 5));
    d.roundRect(leafW * 0.2, dh * 0.12, leafW * 0.6, dh * 0.34, 6).stroke(line(wood.line, 3));
    d.circle(leafW * 0.8, dh * 0.55, Math.max(4, leafW * 0.07)).fill(swatch.yellow.fill);
  }

  /** How open the door is, 0–1. */
  setDoor(open: number) {
    this.open = Math.max(0, Math.min(1, open));
    const { w, h } = this.geo;
    this.drawDoor(Math.max(60, w * 0.16), Math.max(110, h * 0.3));
  }

  setLamp(on: boolean) {
    if (!this.geo.lamp) return;
    const { x, y } = this.lampAt;
    const head = this.lampHead;
    head.clear();
    head.roundRect(x - 30, y - 34, 60, 40, 12).fill(METAL.fill).stroke(line(METAL.line, 4));
    head.circle(x, y + 10, 22).fill(on ? LAMP.lit : LAMP.dark).stroke(line(on ? swatch.yellow.line : METAL.line, 4));
    const light = this.lampLight;
    light.clear();
    if (on) {
      light.moveTo(x - 18, y + 20).lineTo(x - this.geo.w * 0.22, this.groundY).lineTo(x + this.geo.w * 0.22, this.groundY).lineTo(x + 18, y + 20).closePath().fill({ color: LAMP.glow, alpha: 0.35 });
      light.circle(x, y + 10, 46).fill({ color: LAMP.glow, alpha: 0.45 });
    }
  }

  /** Faces in the window for the friends who came in. */
  setInside(n: number) {
    for (const c of this.windowFaces.removeChildren()) c.destroy();
    for (let i = 0; i < n; i++) {
      const f = new Graphics().circle(0, 0, 12).fill([swatch.pink.fill, swatch.teal.fill, swatch.orange.fill][i % 3]).stroke(line(ink, 3));
      f.circle(-4, -2, 2).fill(ink).circle(4, -2, 2).fill(ink);
      f.position.set((i - (n - 1) / 2) * 28, 6);
      this.windowFaces.addChild(f);
    }
  }
}

/** The sky's mark: a sun high, a sun on the hills, or a moon with stars. */
export class SkyMark extends Container {
  private art: Container | null = null;
  constructor(private readonly size: number) {
    super();
    this.eventMode = 'none';
    this.set('dim');
  }
  set(sun: SunLevel) {
    this.art?.destroy({ children: true });
    this.art = sun === 'dark' ? moonArt(this.size * 0.5) : sunArt(this.size * 0.5, sun === 'dim');
    this.addChild(this.art);
  }
}

// ——— Buttons and icons ———

export function watchArt(): Graphics {
  const g = new Graphics();
  g.moveTo(-18, -24).lineTo(26, 0).lineTo(-18, 24).closePath().fill(0xffffff);
  return g;
}

export function pauseArt(): Graphics {
  const g = new Graphics();
  g.roundRect(-22, -22, 16, 44, 5).fill(0xffffff).roundRect(6, -22, 16, 44, 5).fill(0xffffff);
  return g;
}

export function stepArt(): Graphics {
  const g = new Graphics();
  g.moveTo(-20, -18).lineTo(10, 0).lineTo(-20, 18).closePath().fill(ink);
  g.roundRect(14, -18, 8, 36, 3).fill(ink);
  return g;
}

/** The hub icon's picture: a small house with a lit window and an eye above the door; feet on (0, 0). */
export function iconArt(): Container {
  const c = new Container();
  const house = new House({ w: 150, h: 140, lamp: false }, 'yellow');
  house.position.set(-75, -130);
  house.setInside(1);
  const eye = sensorArt('eye', 46);
  eye.position.set(-75 + 150 * 0.3, -130 + 140 * 0.42);
  c.addChild(house, eye);
  return c;
}

/** A seeded sticker: a house with its lamp lit and a friend under it. */
export function stickerArt(color: ColorName, species: CritterName, critterColor: ColorName): Container {
  const c = new Container();
  const house = new House({ w: 200, h: 180, lamp: true }, color);
  house.position.set(-100, -170);
  house.setLamp(true);
  const critter = new Critter({ ...CRITTERS[species], color: critterColor });
  critter.alive = false;
  critter.scale.set(0.3);
  critter.position.set(house.x + house.friendAt.x, house.y + house.friendAt.y);
  c.addChild(house, critter);
  return c;
}
