/** Sorting Machine's code-drawn pieces: toy accessories, the machine, its door, value tokens, marks, the sign and icons. */
import { Container, Graphics } from 'pixi.js';
import { Critter, CRITTERS, type CritterName } from '../../art/critter';
import { cream, ink, shadow, swatch, wood, type ColorName } from '../../art/palette';
import { starPoints } from '../../art/shapes';
import type { Fixture, Op, Prop, Value } from './logic';

const line = (color: number, width = 5) => ({ width, color, join: 'round' as const, cap: 'round' as const });

export const HAT = { fill: 0xf2545b, line: 0xc23a40, band: 0xffd54a };
export const WHISKER = 0x2b2b3a;
export const BOOT = { fill: 0xffd54a, line: 0xd9a520 };
export const BRASS = { fill: 0xf4d9a6, line: 0xc9a86a };
export const METAL = { fill: 0xd6dbe6, line: 0x8a93a6, dark: 0xb3bac9 };

// ——— Accessories, in critter body coordinates (feet at (0, 0), about 250 tall) ———

/** A party hat: a cone with a yellow band and a pompom. */
export function hatArt(): Graphics {
  const g = new Graphics();
  g.moveTo(-56, -232).lineTo(0, -330).lineTo(56, -232).closePath().fill(HAT.fill).stroke(line(HAT.line, 5));
  g.moveTo(-34, -270).lineTo(34, -270).stroke(line(HAT.band, 10));
  g.circle(0, -332, 12).fill(HAT.band).stroke(line(HAT.line, 4));
  g.ellipse(0, -232, 60, 12).fill(HAT.fill).stroke(line(HAT.line, 5));
  return g;
}

/** Toy whiskers: three stiff lines each side, clipped on with a little dot. */
export function whiskersArt(): Graphics {
  const g = new Graphics();
  for (const side of [-1, 1]) {
    g.moveTo(side * 54, -104).lineTo(side * 112, -118).stroke(line(WHISKER, 5));
    g.moveTo(side * 54, -96).lineTo(side * 116, -96).stroke(line(WHISKER, 5));
    g.moveTo(side * 54, -88).lineTo(side * 112, -74).stroke(line(WHISKER, 5));
    g.circle(side * 54, -96, 7).fill(swatch.pink.fill).stroke(line(swatch.pink.line, 3));
  }
  return g;
}

/** Yellow rain boots over the feet. */
export function bootsArt(): Graphics {
  const g = new Graphics();
  for (const side of [-1, 1]) {
    const x = side * 46;
    g.roundRect(x - 26, -44, 52, 40, 10).fill(BOOT.fill).stroke(line(BOOT.line, 5));
    g.roundRect(x - 34, -14, 68, 20, 9).fill(BOOT.fill).stroke(line(BOOT.line, 5));
    g.roundRect(x - 26, -44, 52, 10, 4).fill(BOOT.line);
  }
  return g;
}

export function accessory(prop: Prop): Graphics {
  return prop === 'hat' ? hatArt() : prop === 'whiskers' ? whiskersArt() : bootsArt();
}

/** A fixture's critter with its toys on, at scale 1. */
export function fixtureCritter(f: Fixture, props: [Prop, Prop]): Critter {
  const c = new Critter({ ...CRITTERS[f.species], color: f.color });
  if (f.p) c.attach(accessory(props[0]));
  if (f.q) c.attach(accessory(props[1]));
  return c;
}

// ——— Property pictures (slot, picker, sign) ———

/** A property drawn alone in a square about `size` across, centred on (0, 0). */
export function propPicture(prop: Prop, size = 80): Container {
  const c = new Container();
  const g = new Graphics();
  const s = size / 100;
  if (prop === 'hat') {
    g.moveTo(-34 * s, 22 * s).lineTo(0, -40 * s).lineTo(34 * s, 22 * s).closePath().fill(HAT.fill).stroke(line(HAT.line, 5));
    g.moveTo(-20 * s, -2 * s).lineTo(20 * s, -2 * s).stroke(line(HAT.band, 8 * s));
    g.circle(0, -42 * s, 8 * s).fill(HAT.band).stroke(line(HAT.line, 3));
    g.ellipse(0, 22 * s, 38 * s, 8 * s).fill(HAT.fill).stroke(line(HAT.line, 5));
  } else if (prop === 'whiskers') {
    g.circle(0, 0, 10 * s).fill(swatch.pink.fill).stroke(line(swatch.pink.line, 3));
    for (const side of [-1, 1]) {
      g.moveTo(side * 10 * s, -4 * s).lineTo(side * 44 * s, -18 * s).stroke(line(WHISKER, 5));
      g.moveTo(side * 10 * s, 0).lineTo(side * 46 * s, 0).stroke(line(WHISKER, 5));
      g.moveTo(side * 10 * s, 4 * s).lineTo(side * 44 * s, 18 * s).stroke(line(WHISKER, 5));
    }
  } else {
    for (const side of [-1, 1]) {
      const x = side * 22 * s;
      g.roundRect(x - 16 * s, -30 * s, 32 * s, 42 * s, 8 * s).fill(BOOT.fill).stroke(line(BOOT.line, 5));
      g.roundRect(x - 22 * s, 4 * s, 44 * s, 18 * s, 8 * s).fill(BOOT.fill).stroke(line(BOOT.line, 5));
      g.roundRect(x - 16 * s, -30 * s, 32 * s, 8 * s, 3 * s).fill(BOOT.line);
    }
  }
  c.addChild(g);
  return c;
}

/** A gate's picture (level 3 later): two arms joining (AND) or either arm (OR). Kept with the pictures so the slot art is complete. */
export function gatePicture(op: Op, size = 80): Graphics {
  const g = new Graphics();
  const s = size / 100;
  g.moveTo(-36 * s, -30 * s).lineTo(0, 0).lineTo(36 * s, -30 * s).stroke(line(ink, 7));
  g.moveTo(0, 0).lineTo(0, 36 * s).stroke(line(ink, 7));
  if (op === 'OR') g.circle(0, 0, 14 * s).fill(cream).stroke(line(ink, 5));
  else g.circle(0, 0, 10 * s).fill(ink);
  return g;
}

// ——— Machine parts ———

/** The machine's cabinet: a rounded metal box with rivets and a brass plate. */
export function cabinetArt(w: number, h: number): Graphics {
  const g = new Graphics();
  g.roundRect(-w / 2 + 6, -h / 2 + 10, w, h, 28).fill({ color: shadow, alpha: 0.12 });
  g.roundRect(-w / 2, -h / 2, w, h, 28).fill(METAL.fill).stroke(line(METAL.line, 6));
  g.roundRect(-w / 2 + 14, -h / 2 + 14, w - 28, h - 28, 20).stroke(line(METAL.dark, 3));
  for (const [x, y] of [[-w / 2 + 24, -h / 2 + 24], [w / 2 - 24, -h / 2 + 24], [-w / 2 + 24, h / 2 - 24], [w / 2 - 24, h / 2 - 24]]) {
    g.circle(x, y, 6).fill(METAL.line);
  }
  return g;
}

/** A slot's frame: a brass square with a dashed inside when empty. */
export function slotFrame(size: number, empty: boolean): Graphics {
  const g = new Graphics();
  g.roundRect(-size / 2, -size / 2, size, size, 18).fill(empty ? cream : BRASS.fill).stroke(line(BRASS.line, 6));
  if (empty) {
    const r = size / 2 - 18;
    for (let i = 0; i < 12; i++) {
      const a0 = (i / 12) * Math.PI * 2;
      const a1 = a0 + Math.PI / 18;
      g.moveTo(Math.cos(a0) * r, Math.sin(a0) * r).lineTo(Math.cos(a1) * r, Math.sin(a1) * r).stroke(line(METAL.line, 4));
    }
  }
  return g;
}

/** The door: a wooden arch frame with a door that opens (`open` 0–1 swings it aside) inside. */
export class Door extends Container {
  private readonly leaf = new Graphics();
  private readonly frame = new Graphics();
  constructor(readonly w: number, readonly h: number) {
    super();
    const r = w / 2;
    this.frame.moveTo(-r - 12, h).lineTo(-r - 12, r).arc(0, r, r + 12, Math.PI, 0).lineTo(r + 12, h).closePath().fill(wood.light).stroke(line(wood.line, 6));
    this.frame.moveTo(-r, h).lineTo(-r, r).arc(0, r, r, Math.PI, 0).lineTo(r, h).closePath().fill(0x4a3b5c);
    this.addChild(this.frame, this.leaf);
    this.setOpen(0);
  }

  setOpen(t: number) {
    const { w, h } = this;
    const r = w / 2;
    const g = this.leaf.clear();
    // The leaf narrows as it swings away on its left hinge.
    const k = 1 - Math.min(1, Math.max(0, t)) * 0.92;
    g.moveTo(-r, h).lineTo(-r, r).arc(0, r, r, Math.PI, 0).lineTo(r, h).closePath();
    g.fill(wood.fill).stroke(line(wood.line, 5));
    g.scale.set(k, 1);
    g.x = -r + r * k;
    if (k > 0.3) g.circle(r * 0.55, h * 0.6, 7).fill(BRASS.fill).stroke(line(BRASS.line, 3));
  }
}

// ——— Values and marks ———

/** A value token: a raised star (true), a hollow dashed ring (false) or a dotted ring with "?" (incomplete). Never color alone. */
export function valueToken(v: Value, r = 28): Graphics {
  const g = new Graphics();
  if (v === true) {
    g.circle(0, 0, r).fill(swatch.yellow.light).stroke(line(swatch.yellow.line, 4));
    g.poly(starPoints(r * 0.7, r * 0.32)).fill(swatch.yellow.fill).stroke(line(swatch.yellow.line, 3));
    return g;
  }
  g.circle(0, 0, r).fill(cream).stroke(line(METAL.line, 3));
  const n = v === false ? 10 : 16;
  const span = v === false ? Math.PI / 9 : Math.PI / 30;
  for (let i = 0; i < n; i++) {
    const a0 = (i / n) * Math.PI * 2;
    g.moveTo(Math.cos(a0) * r * 0.62, Math.sin(a0) * r * 0.62).lineTo(Math.cos(a0 + span) * r * 0.62, Math.sin(a0 + span) * r * 0.62).stroke(line(ink, 5));
  }
  if (v === 'incomplete') {
    // A small question mark, drawn.
    g.moveTo(-6, -8).bezierCurveTo(-6, -16, 8, -16, 6, -6).bezierCurveTo(5, -2, 0, -2, 0, 4).stroke(line(ink, 4));
    g.circle(0, 10, 3).fill(ink);
  }
  return g;
}

/** A result or target mark: an open arch (in) or a flat bar with a hollow ring (stays out). */
export function doorMark(open: boolean, size = 34, faded = false): Graphics {
  const g = new Graphics();
  const a = faded ? 0.45 : 1;
  const s = size / 34;
  if (open) {
    g.moveTo(-14 * s, 16 * s).lineTo(-14 * s, -2 * s).arc(0, -2 * s, 14 * s, Math.PI, 0).lineTo(14 * s, 16 * s).closePath().fill({ color: swatch.green.light, alpha: a }).stroke({ ...line(swatch.green.line, 4), alpha: a });
    g.moveTo(-6 * s, 4 * s).lineTo(-1 * s, 10 * s).lineTo(8 * s, -4 * s).stroke({ ...line(swatch.green.line, 4), alpha: a });
  } else {
    g.roundRect(-16 * s, 8 * s, 32 * s, 8 * s, 4 * s).fill({ color: swatch.red.line, alpha: a });
    g.circle(0, -4 * s, 10 * s).stroke({ ...line(swatch.red.line, 4), alpha: a });
  }
  return g;
}

/** A failing fixture's badge after a Check: a small red ring with a bar, worn at a card's corner. */
export function failBadge(): Graphics {
  const g = new Graphics();
  g.circle(0, 0, 16).fill(swatch.red.light).stroke(line(swatch.red.line, 3));
  g.moveTo(-8, 0).lineTo(8, 0).stroke(line(swatch.red.line, 4));
  return g;
}

/** A fixture's card: a cream plate with a stand. */
export function cardArt(w: number, h: number, lit = false): Graphics {
  const g = new Graphics();
  g.roundRect(-w / 2 + 4, -h / 2 + 8, w, h, 20).fill({ color: shadow, alpha: 0.1 });
  g.roundRect(-w / 2, -h / 2, w, h, 20).fill(lit ? swatch.yellow.light : cream).stroke(line(lit ? swatch.yellow.line : wood.line, lit ? 6 : 4));
  g.ellipse(0, h / 2 - 22, w * 0.36, 9).fill({ color: shadow, alpha: 0.12 });
  return g;
}

/** The sign: a wooden board on a post with the property and an open arch. */
export function signArt(prop: Prop, w: number, h: number): Container {
  const c = new Container();
  const g = new Graphics();
  g.roundRect(-10, h / 2 - 30, 20, 30, 4).fill(wood.fill).stroke(line(wood.line, 4));
  g.roundRect(-w / 2, -h / 2, w, h - 30, 18).fill(wood.light).stroke(line(wood.line, 6));
  g.roundRect(-w / 2 + 12, -h / 2 + 12, w - 24, h - 54, 12).fill(cream);
  c.addChild(g);
  const pic = propPicture(prop, Math.min(w, h) * 0.5);
  pic.position.set(-w * 0.2, -16);
  const arrow = new Graphics().moveTo(-14, -16).lineTo(10, -16).moveTo(0, -26).lineTo(12, -16).lineTo(0, -6).stroke(line(ink, 5));
  arrow.position.set(w * 0.07, 0);
  const mark = doorMark(true, 54);
  mark.position.set(w * 0.27, -10);
  c.addChild(pic, arrow, mark);
  return c;
}

/** A turtle for the Slow toggle. */
export function turtleArt(on: boolean): Graphics {
  const g = new Graphics();
  const sh = on ? swatch.green : swatch.white;
  g.ellipse(0, 4, 30, 20).fill(sh.fill).stroke(line(sh.line, 4));
  g.ellipse(0, 2, 18, 12).stroke(line(sh.line, 3));
  g.circle(32, 2, 10).fill(swatch.green.light).stroke(line(swatch.green.line, 3));
  g.circle(35, 0, 2).fill(ink);
  for (const x of [-18, 14]) g.roundRect(x, 14, 12, 10, 4).fill(swatch.green.light).stroke(line(swatch.green.line, 3));
  return g;
}

/** A hand-sized arrow for Send. */
export function sendArt(): Graphics {
  const g = new Graphics();
  g.moveTo(-34, 0).lineTo(22, 0).stroke(line(0xffffff, 12));
  g.moveTo(8, -20).lineTo(30, 0).lineTo(8, 20).stroke(line(0xffffff, 12));
  return g;
}

/** The hub icon's picture: a little gate with a door and a hat above it; feet on (0, 0). */
export function iconArt(): Container {
  const c = new Container();
  const box = cabinetArt(120, 120);
  box.position.set(0, -70);
  const door = new Door(56, 70);
  door.position.set(0, -98);
  door.setOpen(0.6);
  const hat = propPicture('hat', 56);
  hat.position.set(0, -150);
  c.addChild(box, door, hat);
  return c;
}

/** A seeded sticker: a door with a critter in it. */
export function stickerArt(species: CritterName, color: ColorName, prop: Prop): Container {
  const c = new Container();
  const door = new Door(88, 110);
  door.position.set(0, -100);
  door.setOpen(1);
  const f: Fixture = { p: 1, q: 0, species, color };
  const critter = fixtureCritter(f, [prop, prop === 'hat' ? 'boots' : 'hat']);
  critter.alive = false;
  critter.scale.set(0.36);
  critter.position.set(0, 10);
  c.addChild(door, critter);
  return c;
}
