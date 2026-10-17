import { Container, Graphics } from 'pixi.js';
import type { WoodlandStep } from '../content/world';
import { Critter, CRITTERS } from './critter';
import { makeHazel } from './lands';
import { cream, grass, ink, swatch, wood, type ColorName } from './palette';
import { blanketArt } from './picnic';

/** Art for the Woodland Picnic, Hazel's story in Wonder Woods. Everything is drawn with feet (or center) at (0, 0). */

const line = (color: number, width = 5) => ({ width, color, join: 'round' as const, cap: 'round' as const });

/** One friend's house colors, in invitation order. */
export const HOUSE_COLORS: ColorName[] = ['red', 'purple', 'blue'];

/** A small round-doored house at the clearing's edge, about 120 wide; its flag shows once its invitation is delivered. */
export class WoodHouse extends Container {
  readonly flag: Graphics;

  constructor(color: ColorName) {
    super();
    const sw = swatch[color];
    const g = new Graphics().roundRect(-48, -70, 96, 70, 10).fill(wood.light).stroke(line(wood.line));
    g.poly([-62, -66, 0, -118, 62, -66]).fill(sw.fill).stroke(line(sw.line));
    g.moveTo(-16, 0).lineTo(-16, -26).arc(0, -26, 16, Math.PI, 0).lineTo(16, 0).closePath().fill(wood.line);
    g.roundRect(22, -54, 18, 18, 3).fill(swatch.yellow.light).stroke(line(wood.line, 3));
    this.flag = new Graphics().moveTo(38, -96).lineTo(38, -150).stroke(line(wood.line, 4)).poly([38, -150, 74, -138, 38, -126]).fill(sw.fill).stroke(line(sw.line, 3));
    this.flag.visible = false;
    this.addChild(this.flag, g);
  }
}

/** A flat stepping stone; `lit` glows yellow, as the path to the clearing lights up. */
export function stoneArt(lit: boolean, g = new Graphics()): Graphics {
  return g.clear().ellipse(0, 0, 26, 12).fill(lit ? swatch.yellow.light : 0xd9d2c4).stroke(line(lit ? swatch.yellow.line : 0xb3aa98, 3));
}

function basket(g: Graphics, x: number, y: number) {
  g.moveTo(x - 20, y - 4).bezierCurveTo(x - 20, y - 36, x + 20, y - 36, x + 20, y - 4).stroke(line(wood.line, 6));
  g.poly([x - 30, y - 6, x + 30, y - 6, x + 23, y + 28, x - 23, y + 28]).fill(wood.fill).stroke(line(wood.line, 4));
  g.rect(x - 32, y - 12, 64, 9).fill(swatch.red.fill);
  g.circle(x - 10, y - 14, 7).fill(swatch.red.fill).circle(x + 8, y - 16, 7).fill(swatch.green.fill);
}

/** Two packed baskets hanging level from a carrying pole on two forked sticks, about 220 wide. */
export function basketPoleArt(): Graphics {
  const g = new Graphics();
  for (const x of [-100, 100]) g.moveTo(x, 0).lineTo(x, -112).moveTo(x, -104).lineTo(x - 14, -124).moveTo(x, -104).lineTo(x + 14, -124).stroke(line(wood.line, 7));
  g.moveTo(-118, -110).lineTo(118, -110).stroke(line(wood.fill, 9));
  for (const x of [-48, 48]) g.moveTo(x, -110).lineTo(x, -78).stroke(line(ink, 3));
  basket(g, -48, -50);
  basket(g, 48, -50);
  return g;
}

/** A tree stump with a drum and a bell on it, about 150 wide. */
export function stumpArt(): Graphics {
  const g = new Graphics().roundRect(-62, -48, 124, 48, 10).fill(wood.fill).stroke(line(wood.line));
  g.ellipse(0, -48, 62, 16).fill(wood.light).stroke(line(wood.line, 4)).ellipse(0, -48, 34, 8).stroke(line(wood.line, 3));
  // The drum.
  g.roundRect(-52, -94, 52, 40, 8).fill(swatch.red.fill).stroke(line(swatch.red.line, 4));
  g.ellipse(-26, -94, 26, 8).fill(cream).stroke(line(swatch.red.line, 4));
  g.moveTo(-50, -88).lineTo(-36, -58).lineTo(-22, -88).lineTo(-8, -58).stroke(line(0xffffff, 3));
  // The bell.
  g.moveTo(14, -58).lineTo(18, -86).quadraticCurveTo(30, -104, 42, -86).lineTo(46, -58).closePath().fill(swatch.yellow.fill).stroke(line(swatch.yellow.line, 4));
  g.circle(30, -56, 6).fill(swatch.yellow.line);
  return g;
}

/** A pine for the clearing's edge. */
export function pineArt(h: number): Graphics {
  const g = new Graphics().rect(-8, -24, 16, 26).fill(wood.fill).stroke(line(wood.line, 3));
  for (const k of [0, 1, 2]) {
    const base = -20 - k * h * 0.26;
    const w = 60 - k * 14;
    g.poly([-w, base, 0, base - h * 0.42, w, base]).fill(swatch.teal.fill).stroke(line(swatch.teal.line, 4));
  }
  return g;
}

/** Pictures for Hazel's three request cards, about 80 units across. */
export function woodlandRequestArt(step: WoodlandStep): Container {
  if (step === 'invitations') {
    const g = new Graphics().roundRect(-38, -26, 76, 52, 8).fill(0xffffff).stroke(line(0xb9c6d1, 4));
    g.moveTo(-38, -26).lineTo(0, 4).lineTo(38, -26).stroke(line(0xd6dde4, 3));
    g.circle(0, 4, 9).fill(swatch.red.fill);
    return g;
  }
  if (step === 'baskets') {
    const g = new Graphics().moveTo(-46, -28).lineTo(46, -28).stroke(line(wood.fill, 7));
    basket(g, -22, 6);
    basket(g, 22, 6);
    g.scale.set(0.82);
    return g;
  }
  const g = stumpArt();
  g.scale.set(0.62);
  g.y = 30;
  return g;
}

/** The friends who come to the picnic, standing about 90 tall. */
export function friendCritter(kind: 'bear' | 'bunny' | 'duck'): Critter {
  const f = new Critter(CRITTERS[kind]);
  f.scale.set(0.36);
  return f;
}

/** The keepsake: a photo of the woodland picnic, `w` wide, centered on (0, 0). */
export function woodlandPhoto(w = 240): Container {
  const c = new Container();
  const frame = new Graphics().roundRect(-120, -100, 240, 200, 10).fill(0xffffff).stroke(line(swatch.white.line, 4));
  frame.rect(-106, -86, 212, 150).fill(swatch.green.light).rect(-106, 10, 212, 54).fill(grass);
  c.addChild(frame);
  for (const x of [-84, 84]) {
    const p = pineArt(90);
    p.scale.set(0.6);
    p.position.set(x, 20);
    c.addChild(p);
  }
  const blanket = blanketArt('checks', 150, 70);
  blanket.scale.y = 0.42;
  blanket.position.set(0, 44);
  c.addChild(blanket);
  (['bear', 'bunny', 'duck'] as const).forEach((kind, i) => {
    const f = new Critter(CRITTERS[kind]);
    f.alive = false;
    f.scale.set(0.15);
    f.position.set(-50 + i * 44, 32);
    c.addChild(f);
  });
  const hazel = makeHazel();
  hazel.critter.alive = false;
  hazel.node.scale.set(0.16);
  hazel.node.position.set(76, 58);
  c.addChild(hazel.node);
  const stump = stumpArt();
  stump.scale.set(0.3);
  stump.position.set(-80, 62);
  c.addChild(stump);
  const heart = new Graphics().moveTo(96, -60).bezierCurveTo(82, -72, 92, -84, 96, -74).bezierCurveTo(100, -84, 110, -72, 96, -60).fill(swatch.pink.fill);
  c.addChild(heart);
  c.scale.set(w / 240);
  return c;
}

/** The spot on Wonder Woods' path: a checked blanket under a pine, two baskets and a red flag. */
export function woodlandLandmark(): Container {
  const c = new Container();
  c.addChild(new Graphics().ellipse(0, 26, 92, 26).fill(grass));
  const pine = pineArt(120);
  pine.scale.set(0.8);
  pine.position.set(-56, 18);
  c.addChild(pine);
  const b = blanketArt('checks', 120, 66);
  b.scale.y = 0.45;
  b.position.set(14, 16);
  c.addChild(b);
  const g = new Graphics();
  basket(g, 26, 2);
  g.moveTo(70, 30).lineTo(70, -40).stroke(line(wood.line, 4)).poly([70, -40, 98, -30, 70, -20]).fill(swatch.red.fill).stroke(line(swatch.red.line, 3));
  c.addChild(g);
  return c;
}
