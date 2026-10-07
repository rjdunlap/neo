import { Container, Graphics } from 'pixi.js';
import type { Pattern } from '../content/picnic';
import { Critter, CRITTERS, type CritterName } from './critter';
import { grass, ink, swatch, wood } from './palette';
import { flower, puffs } from './shapes';

/** Art for the Windy Picnic: blankets, the places the wind dropped them, plates, Juniper's hat and the photo. */

const line = (color: number, width = 5) => ({ width, color, join: 'round' as const, cap: 'round' as const });

/** Each pattern also has its own color, so they differ by more than hue. */
export const PATTERN_SWATCH = { stripes: swatch.red, spots: swatch.blue, checks: swatch.green } satisfies Record<Pattern, unknown>;

/** A flat blanket, `w` × `h`, centered on (0, 0). */
export function blanketArt(pattern: Pattern, w: number, h: number): Graphics {
  const sw = PATTERN_SWATCH[pattern];
  const g = new Graphics().roundRect(-w / 2, -h / 2, w, h, 8).fill(pattern === 'spots' ? sw.light : swatch.white.fill);
  const x0 = -w / 2;
  const y0 = -h / 2;
  if (pattern === 'stripes') {
    const band = w / 7;
    for (let i = 1; i < 7; i += 2) g.rect(x0 + i * band, y0, band, h).fill(sw.fill);
  } else if (pattern === 'spots') {
    const step = w / 4;
    for (let r = 0; r < 3; r++) for (let c = 0; c < 4; c++) g.circle(x0 + step * (c + (r % 2 ? 0.25 : 0.75)), y0 + (h / 3) * (r + 0.5), Math.min(w, h) * 0.085).fill(sw.fill);
  } else {
    const n = 5;
    for (let i = 0; i < n; i += 2) {
      g.rect(x0 + (w / n) * i, y0, w / n, h).fill({ color: sw.fill, alpha: 0.55 });
      g.rect(x0, y0 + (h / n) * i, w, h / n).fill({ color: sw.fill, alpha: 0.55 });
    }
  }
  return g.roundRect(-w / 2, -h / 2, w, h, 8).stroke(line(sw.line, 4));
}

/** A blanket caught somewhere, hanging from its top edge at (0, 0), flapping in the wind. */
export class HangingBlanket extends Container {
  readonly glow = new Graphics().roundRect(-78, -14, 156, 128, 22).fill({ color: 0xfff3a0, alpha: 0.9 });
  private readonly cloth: Graphics;
  private clock = Math.random() * 6;
  private shake = 0;

  constructor(readonly pattern: Pattern) {
    super();
    this.cloth = blanketArt(pattern, 124, 92);
    this.cloth.pivot.set(0, -46);
    this.glow.visible = false;
    this.addChild(this.glow, this.cloth);
  }

  wobble() {
    this.shake = 1;
  }

  update(dt: number) {
    this.clock += dt;
    this.shake = Math.max(0, this.shake - dt * 2.5);
    this.cloth.skew.x = 0.08 * Math.sin(this.clock * 2.2) + 0.2 * this.shake * Math.sin(this.shake * 30);
    this.cloth.scale.y = 1 + 0.04 * Math.sin(this.clock * 3.1);
    this.glow.alpha = 0.6 + 0.35 * Math.sin(this.clock * 5);
  }
}

/** A round tree whose crown is centered `crown` above the ground at (0, 0). */
export function treeArt(crown: number, r: number): Graphics {
  const g = new Graphics().roundRect(-20, -crown, 40, crown + 6, 10).fill(wood.fill).stroke(line(wood.line, 5));
  g.moveTo(0, -crown * 0.55).lineTo(34, -crown * 0.78).stroke(line(wood.line, 9));
  return puffs(g, [[-r * 0.55, -crown + 10, r * 0.62], [r * 0.5, -crown + 16, r * 0.6], [0, -crown - r * 0.35, r * 0.7], [0, -crown + r * 0.2, r * 0.6]], swatch.green.fill, swatch.green.line, 6);
}

/** Two poles and a sagging line between (0, 0) and (w, 0), the pole tops. */
export function clotheslineArt(w: number, h: number): Graphics {
  const g = new Graphics();
  for (const x of [0, w]) g.roundRect(x - 7, 0, 14, h, 5).fill(wood.fill).stroke(line(wood.line, 4));
  return g.moveTo(0, 6).quadraticCurveTo(w / 2, 34, w, 6).stroke(line(swatch.white.line, 4));
}

/** The line's height at `x` along it, matching the sag drawn above. */
export const lineSag = (x: number, w: number) => {
  const u = x / w;
  return 6 + 2 * u * (1 - u) * 28;
};

export function bushArt(w: number): Graphics {
  const g = new Graphics();
  puffs(g, [[-w * 0.32, -w * 0.18, w * 0.25], [w * 0.3, -w * 0.16, w * 0.24], [0, -w * 0.28, w * 0.3], [-w * 0.05, -w * 0.08, w * 0.26]], swatch.green.fill, swatch.green.line, 6);
  for (const [x, y] of [[-w * 0.3, -w * 0.3], [w * 0.22, -w * 0.36], [w * 0.05, -w * 0.1]]) g.circle(x, y, 7).fill(swatch.red.fill);
  return g;
}

/** A plate with two sandwich halves. */
export function plateArt(): Graphics {
  const g = new Graphics().ellipse(0, 4, 46, 20).fill(swatch.white.line).ellipse(0, 0, 46, 20).fill(swatch.white.fill).stroke(line(swatch.white.line, 3));
  for (const dx of [-15, 15]) {
    g.poly([dx - 20, 4, dx + 18, 4, dx - 2, -26]).fill(wood.light).stroke(line(wood.line, 3));
    g.moveTo(dx - 13, -2).lineTo(dx + 10, -2).stroke(line(swatch.green.fill, 4));
  }
  return g;
}

/** Juniper's straw sun hat, in critter body coordinates. */
export function strawHat(): Graphics {
  const g = new Graphics().ellipse(0, -236, 104, 22).fill(wood.light).stroke(line(wood.line, 5));
  g.moveTo(-54, -238).bezierCurveTo(-54, -300, 54, -300, 54, -238).closePath().fill(wood.light).stroke(line(wood.line, 5));
  g.rect(-54, -258, 108, 14).fill(swatch.green.fill);
  const f = flower(new Graphics(), 13, swatch.pink.fill, swatch.pink.line);
  f.position.set(36, -254);
  g.addChild(f);
  return g;
}

/** Juniper the gardener: a bunny in a straw hat. */
export function makeGardener(): Critter {
  const c = new Critter(CRITTERS.bunny);
  c.attach(strawHat());
  return c;
}

export const FRIENDS: CritterName[] = ['cat', 'duck', 'bear'];

/** Pictures for the three requests, about 70 units across. */
export function requestArt(step: 'blanket' | 'sandwiches' | 'invitation'): Container {
  if (step === 'blanket') {
    const g = blanketArt('stripes', 76, 58);
    g.rotation = -0.12;
    return g;
  }
  if (step === 'sandwiches') {
    const g = plateArt();
    g.scale.set(0.95);
    g.y = 8;
    return g;
  }
  const g = new Graphics().roundRect(-38, -26, 76, 52, 8).fill(0xffffff).stroke(line(0xb9c6d1, 4));
  g.moveTo(-38, -26).lineTo(0, 4).lineTo(38, -26).stroke(line(0xd6dde4, 3));
  g.circle(14, 14, 7).fill(swatch.purple.fill).rect(19, -12, 4, 26).fill(swatch.purple.fill);
  g.moveTo(21, -12).quadraticCurveTo(32, -6, 30, 4).stroke(line(swatch.purple.fill, 4));
  return g;
}

/** What a finished request changed, for the journal's recap: the blanket spread out, the plates, the friends. */
export function changeArt(step: 'blanket' | 'sandwiches' | 'invitation'): Container {
  const c = new Container();
  if (step === 'blanket') {
    const b = blanketArt('stripes', 170, 80);
    b.scale.y = 0.45;
    c.addChild(new Graphics().ellipse(0, 6, 100, 26).fill(grass), b);
  } else if (step === 'sandwiches') {
    for (const x of [-52, 0, 52]) {
      const p = plateArt();
      p.scale.set(0.55);
      p.position.set(x, x ? 6 : -6);
      c.addChild(p);
    }
  } else {
    FRIENDS.forEach((kind, i) => {
      const f = new Critter(CRITTERS[kind]);
      f.alive = false;
      f.scale.set(0.2);
      f.position.set(-56 + i * 56, 26);
      c.addChild(f);
    });
  }
  return c;
}

/** The keepsake: a photo of the finished picnic, `w` wide, centered on (0, 0). */
export function picnicPhoto(w = 240): Container {
  const s = w / 240;
  const c = new Container();
  const frame = new Graphics().roundRect(-120, -100, 240, 200, 10).fill(0xffffff).stroke(line(swatch.white.line, 4));
  frame.rect(-106, -86, 212, 150).fill(swatch.blue.light).rect(-106, 10, 212, 54).fill(grass);
  frame.circle(70, -58, 16).fill(swatch.yellow.fill);
  c.addChild(frame);
  const blanket = blanketArt('stripes', 150, 70);
  blanket.scale.y = 0.42;
  blanket.position.set(0, 42);
  c.addChild(blanket);
  FRIENDS.forEach((kind, i) => {
    const f = new Critter(CRITTERS[kind]);
    f.alive = false;
    f.scale.set(0.16);
    f.position.set(-60 + i * 60, 30);
    c.addChild(f);
  });
  const juniper = makeGardener();
  juniper.alive = false;
  juniper.scale.set(0.18);
  juniper.position.set(88, 58);
  c.addChild(juniper);
  for (const x of [-34, 34]) {
    const p = plateArt();
    p.scale.set(0.32);
    p.position.set(x, 52);
    c.addChild(p);
  }
  // A heart in the corner, like a photo someone loved.
  const heart = new Graphics().moveTo(-96, 78).bezierCurveTo(-110, 66, -100, 54, -96, 64).bezierCurveTo(-92, 54, -82, 66, -96, 78).fill(swatch.pink.fill);
  c.addChild(heart);
  c.scale.set(s);
  return c;
}

/** A fluttering check mark on a green disc, for finished requests. */
export function checkBadge(r = 22): Graphics {
  return new Graphics().circle(0, 0, r).fill(swatch.green.fill).stroke(line(swatch.green.line, 4)).moveTo(-r * 0.45, 0).lineTo(-r * 0.1, r * 0.38).lineTo(r * 0.5, -r * 0.36).stroke(line(0xffffff, 6));
}

/** The map's landmark: a striped blanket with a basket, a kite in the wind, and Juniper's hat. */
export function picnicLandmark(): Container {
  const c = new Container();
  const ground = new Graphics().ellipse(0, 26, 92, 26).fill(grass);
  c.addChild(ground);
  const b = blanketArt('stripes', 130, 70);
  b.scale.y = 0.45;
  b.position.set(-10, 14);
  c.addChild(b);
  const basket = new Graphics()
    .moveTo(16, 4).bezierCurveTo(16, -24, 50, -24, 50, 4).stroke(line(wood.line, 5))
    .poly([8, 2, 58, 2, 52, 28, 14, 28]).fill(wood.fill).stroke(line(wood.line, 4));
  c.addChild(basket);
  // A kite tugging on its string: it's windy here.
  const kite = new Graphics().poly([-52, -86, -28, -64, -52, -36, -76, -64]).fill(swatch.yellow.fill).stroke(line(swatch.yellow.line, 4));
  kite.moveTo(-52, -36).quadraticCurveTo(-30, -10, -40, 10).stroke(line(ink, 2));
  for (const [x, y] of [[-44, -20], [-36, -6]]) kite.poly([x - 6, y - 4, x + 6, y, x - 6, y + 4]).fill(swatch.red.fill);
  c.addChild(kite);
  const hat = strawHat();
  hat.scale.set(0.3);
  hat.position.set(46, 70);
  c.addChild(hat);
  return c;
}
