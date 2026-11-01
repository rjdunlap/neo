/** Not Always's crate, sign pictograms, card creatures, stamp and marks, code-drawn from the palette. */
import { Container, Graphics } from 'pixi.js';
import { Critter, type CritterSpec } from '../../art/critter';
import { cream, ink, swatch, wood } from '../../art/palette';
import { hatArt } from '../../art/props';
import { COLORS, type Attr, type Card, type Claim, type Color } from './logic';

const line = (color: number, width = 5) => ({ width, color, join: 'round' as const, cap: 'round' as const });

/** Every card is this one creature with only colour, hat, wings and spots changed, so no claim is about the kind. */
const BASE: Omit<CritterSpec, 'color'> = { ears: 'round', snout: 'nose', noseColor: ink, belly: true };

/** A card's creature, feet on (0, 0), at `scale`. */
export function cardCritter(c: Card, scale: number, alive = false): Critter {
  const k = new Critter({ ...BASE, color: c.color, spots: c.spots, wings: c.wings });
  if (c.hat) k.attach(hatArt());
  k.scale.set(scale);
  k.alive = alive;
  return k;
}

/** The wooden crate the friend stands on, its top centre at (0, 0). */
export function crateArt(w = 150, h = 46): Graphics {
  const g = new Graphics().roundRect(-w / 2, 0, w, h, 6).fill(wood.fill).stroke(line(wood.line, 4));
  g.moveTo(-w / 2 + 8, 8).lineTo(w / 2 - 8, h - 8).moveTo(w / 2 - 8, 8).lineTo(-w / 2 + 8, h - 8).stroke(line(wood.line, 3));
  return g;
}

/** An attribute's picture, about 70 units across, centred on (0, 0). Colours are told apart by name and lightness. */
export function attrIcon(a: Attr): Container {
  const c = new Container();
  if (COLORS.includes(a as Color)) {
    const sw = swatch[a as Color];
    c.addChild(new Graphics().circle(0, 0, 30).fill(sw.fill).stroke(line(ink, 5)));
  } else if (a === 'hat') {
    const h = hatArt();
    h.scale.set(0.42);
    h.y = 116;
    c.addChild(h);
  } else if (a === 'wings') {
    c.addChild(new Graphics()
      .moveTo(-30, 14).quadraticCurveTo(-14, -34, 32, -26).lineTo(22, -12).lineTo(32, -2).lineTo(16, 6).lineTo(22, 16).quadraticCurveTo(-8, 28, -30, 14)
      .fill(swatch.white.fill).stroke(line(swatch.white.line, 4)));
  } else {
    const g = new Graphics().ellipse(0, 0, 32, 26).fill(swatch.white.light).stroke(line(ink, 4));
    for (const [x, y, r] of [[-12, -8, 7], [10, -10, 6], [4, 10, 8], [-16, 10, 5]]) g.circle(x, y, r).fill(ink);
    c.addChild(g);
  }
  return c;
}

export type SignMark = 'every' | 'none' | 'not-all';

/** The quantifier picture: a hand sweeping over three dots (every), the dots crossed (none), or one dot popped out and circled (not all). */
export function quantIcon(m: SignMark): Graphics {
  const g = new Graphics();
  const dots = m === 'not-all' ? [[-24, 14], [0, 18], [30, -12]] : [[-24, 14], [0, 18], [24, 14]];
  for (const [x, y] of dots) g.circle(x, y, 8).fill(ink);
  if (m === 'none') for (const [x, y] of dots) g.moveTo(x - 11, y - 11).lineTo(x + 11, y + 11).moveTo(x + 11, y - 11).lineTo(x - 11, y + 11).stroke(line(swatch.red.fill, 4));
  if (m === 'not-all') g.circle(30, -12, 15).stroke(line(swatch.red.fill, 4));
  // The sweeping hand: an arc over the dots with a little palm at its end.
  g.moveTo(-34, -6).quadraticCurveTo(0, -30, m === 'not-all' ? 12 : 34, -6).stroke(line(swatch.blue.fill, 5));
  g.circle(m === 'not-all' ? 12 : 34, -6, 7).fill(swatch.orange.light).stroke(line(swatch.orange.line, 3));
  return g;
}

/** A sign card for a claim (or the not-all sign after a break), `w` by `h`, centred on (0, 0). */
export function claimSign(claim: Claim, w: number, h: number, mark: SignMark = claim.q): Container {
  const c = new Container();
  c.addChild(new Graphics().roundRect(-w / 2, -h / 2, w, h, 16).fill(0xffffff).stroke(line(wood.line, 6)));
  const q = quantIcon(mark);
  q.x = -w / 4;
  q.scale.set(Math.min(1.2, h / 100));
  const a = attrIcon(claim.attr);
  a.x = w / 4;
  a.scale.set(Math.min(1.1, h / 100));
  c.addChild(q, a);
  return c;
}

/** The sign's post down to the friend's crate. */
export function postArt(h: number): Graphics {
  return new Graphics().rect(-6, 0, 12, h).fill(wood.fill).stroke(line(wood.line, 3));
}

/** The big tick printed across the sign by the stamp. */
export function everyMark(): Graphics {
  return new Graphics().circle(0, 0, 46).fill({ color: swatch.green.light, alpha: 0.9 }).stroke(line(swatch.green.line, 6))
    .moveTo(-22, 2).lineTo(-6, 20).lineTo(26, -18).stroke(line(swatch.green.line, 10));
}

/** The wooden rubber stamp, `s` square, centred on (0, 0): a handle above an inked face with the every sign and a tick. */
export function stampArt(s: number): Container {
  const c = new Container();
  c.addChild(new Graphics()
    .roundRect(-s * 0.18, -s / 2, s * 0.36, s * 0.42, 12).fill(wood.fill).stroke(line(wood.line, 4))
    .roundRect(-s / 2, -s * 0.1, s, s * 0.6, 14).fill(cream).stroke(line(wood.line, 5)));
  const q = quantIcon('every');
  q.scale.set(0.8);
  q.position.set(-s * 0.18, s * 0.2);
  const t = new Graphics().moveTo(-12, 0).lineTo(-3, 10).lineTo(14, -10).stroke(line(swatch.green.line, 7));
  t.position.set(s * 0.28, s * 0.2);
  c.addChild(q, t);
  return c;
}
