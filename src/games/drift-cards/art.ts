import { Container, Graphics, Text } from 'pixi.js';
import { CRITTERS, Critter } from '../../art/critter';
import { frogArt, penguinArt, turtleArt } from '../../art/animals';
import { ink, swatch } from '../../art/palette';
import { Rng } from '../../engine/random';
import type { Beach, Dir } from './logic';

export const SEA = 0x6cc3e8;
export const SEA_DARK = 0x4aa6d3;
export const SAND = 0xf3dc9c;
export const SAND_LINE = 0xd9b964;
export const WALL = 0xb8aec8;
export const WALL_LINE = 0x7f7596;
export const WOOD = 0xd9a066;
export const WOOD_LINE = 0x9b6a3a;
export const FOG = 0xf4f7fb;

/** A broad chevron for a current, drawn round (x, y) in a cell of size `s`: shape, never colour alone. */
export function arrow(g: Graphics, x: number, y: number, s: number, d: Dir, alpha = 1) {
  const a = d === 'e' ? 0 : d === 's' ? Math.PI / 2 : Math.PI;
  const cos = Math.cos(a),
    sin = Math.sin(a);
  const p = (u: number, v: number) => [x + u * cos - v * sin, y + u * sin + v * cos];
  const k = s / 100;
  const pts = [
    p(-30 * k, -26 * k),
    p(4 * k, -26 * k),
    p(30 * k, 0),
    p(4 * k, 26 * k),
    p(-30 * k, 26 * k),
    p(-4 * k, 0),
  ].flat();
  g.poly(pts)
    .fill({ color: 0xffffff, alpha: 0.85 * alpha })
    .stroke({ color: SEA_DARK, width: 3, join: 'round', alpha });
}

/** The little wooden drift card with its number, centred on (0, 0). */
export function cardArt(n: number, scale = 1): Container {
  const c = new Container();
  const g = new Graphics();
  g.roundRect(-26, -18, 52, 36, 6).fill(WOOD).stroke({ color: WOOD_LINE, width: 3 });
  g.moveTo(-18, -8)
    .lineTo(18, -8)
    .moveTo(-18, 8)
    .lineTo(10, 8)
    .stroke({ color: WOOD_LINE, width: 1.5, alpha: 0.5 });
  const t = new Text({
    text: String(n),
    style: { fontFamily: 'Nunito, sans-serif', fontSize: 28, fontWeight: '800', fill: ink },
  });
  t.anchor.set(0.5);
  c.addChild(g, t);
  c.scale.set(scale);
  return c;
}

/** A little boat on the harbour wall, its feet (keel) on (0, 0), about 100 wide. */
export function boatArt(color = swatch.red): Graphics {
  const g = new Graphics();
  g.moveTo(-48, -22)
    .lineTo(48, -22)
    .lineTo(34, 0)
    .lineTo(-34, 0)
    .closePath()
    .fill(color.fill)
    .stroke({ color: color.line, width: 4, join: 'round' });
  g.rect(-3, -78, 6, 56).fill(WOOD_LINE);
  g.poly([3, -76, 36, -32, 3, -32]).fill(0xffffff).stroke({ color: 0xc9c9d6, width: 3, join: 'round' });
  return g;
}

/** The friend on each beach: turtle, frog, duck and penguin, standing on (0, 0), about 90 tall. */
export function friendArt(beach: Beach): Container {
  const c = new Container();
  if (beach === 'W') {
    const t = turtleArt(110);
    t.rotation = -Math.PI / 2 + 0.3;
    t.y = -40;
    c.addChild(t);
  } else if (beach === 'S' || beach === 'SW') {
    const f = frogArt();
    f.scale.set(1.1);
    f.y = -8;
    c.addChild(f);
  } else if (beach === 'E') {
    const p = penguinArt();
    p.scale.set(1.1);
    p.y = -42;
    c.addChild(p);
  } else {
    const d = new Critter(CRITTERS.duck);
    d.alive = false;
    d.scale.set(0.36);
    c.addChild(d);
  }
  return c;
}

/**
 * A 112-unit square of sea with arrows bending a card round to a sandy corner. The hub icon at seed 0; a sticker turns the
 * arrows and moves the card from its seed.
 */
export function iconArt(seed = 0): Container {
  const rng = new Rng(seed + 47);
  const c = new Container();
  const g = new Graphics();
  g.roundRect(-56, -56, 112, 112, 22).fill(SEA).stroke({ color: SEA_DARK, width: 3 });
  g.moveTo(-56, 30)
    .lineTo(56, 30)
    .lineTo(56, 44)
    .quadraticCurveTo(56, 56, 44, 56)
    .lineTo(-44, 56)
    .quadraticCurveTo(-56, 56, -56, 44)
    .closePath()
    .fill(SAND);
  const dirs: Dir[] = seed
    ? [rng.pick(['e', 's'] as Dir[]), 's', rng.pick(['e', 'w'] as Dir[])]
    : ['e', 's', 'w'];
  arrow(g, -30, -28, 40, dirs[0]);
  arrow(g, 0, -28, 40, dirs[1]);
  arrow(g, 0, 4, 40, dirs[2]);
  g.moveTo(-36, -2)
    .quadraticCurveTo(10, -50, 6, 18)
    .stroke({ color: 0xffffff, width: 4, cap: 'round', alpha: 0.7 });
  const card = cardArt(seed ? rng.int(1, 9) : 1, 0.6);
  card.position.set(seed ? rng.range(-24, 24) : 18, 40);
  card.rotation = seed ? rng.range(-0.3, 0.3) : -0.15;
  c.addChild(g, card);
  return c;
}

/** Level 3's fog over a 2×2 patch, its top-left at (0, 0): soft clouds, or with her patch laid in, only a dashed edge. */
export function fogArt(cell: number, open: boolean): Graphics {
  const g = new Graphics();
  const s = cell * 2;
  if (!open) {
    g.roundRect(2, 2, s - 4, s - 4, 18).fill(FOG);
    for (const [u, v, r] of [
      [0.25, 0.3, 0.26],
      [0.7, 0.25, 0.24],
      [0.3, 0.72, 0.25],
      [0.72, 0.7, 0.27],
      [0.5, 0.5, 0.22],
    ]) {
      g.circle(u * s, v * s, r * s).fill({ color: 0xffffff, alpha: 0.7 });
    }
    g.roundRect(2, 2, s - 4, s - 4, 18).stroke({ color: 0xc9d3df, width: 3 });
    return g;
  }
  // Her patch is in: a dashed orange edge marks the arrows she chose.
  const dash = 14;
  for (let t = 0; t < s; t += dash * 2) {
    const e = Math.min(s, t + dash);
    g.moveTo(t, 2)
      .lineTo(e, 2)
      .moveTo(t, s - 2)
      .lineTo(e, s - 2)
      .moveTo(2, t)
      .lineTo(2, e)
      .moveTo(s - 2, t)
      .lineTo(s - 2, e);
  }
  g.stroke({ color: swatch.orange.line, width: 5, cap: 'round' });
  return g;
}

/** A 160-unit patch card centred on (0, 0) showing its four arrows large; `children[0]` is the ring shown while it is in the fog. */
export function patchCardArt(patch: readonly Dir[]): Container {
  const c = new Container();
  const ring = new Graphics()
    .roundRect(-86, -86, 172, 172, 26)
    .stroke({ color: swatch.orange.line, width: 8 });
  ring.visible = false;
  const g = new Graphics();
  g.roundRect(-76, -76, 152, 152, 20).fill(SEA).stroke({ color: SEA_DARK, width: 4 });
  g.moveTo(0, -70)
    .lineTo(0, 70)
    .moveTo(-70, 0)
    .lineTo(70, 0)
    .stroke({ color: SEA_DARK, width: 2, alpha: 0.5 });
  patch.forEach((d, i) => arrow(g, (i % 2 ? 1 : -1) * 36, (i < 2 ? -1 : 1) * 36, 66, d));
  c.addChild(ring, g);
  return c;
}

/** Check: a 130-unit green button with a tick, centred on (0, 0). */
export function checkArt(): Graphics {
  const g = new Graphics();
  g.roundRect(-62, -62, 124, 124, 28).fill(swatch.green.fill).stroke({ color: swatch.green.line, width: 5 });
  g.moveTo(-30, 2)
    .lineTo(-8, 26)
    .lineTo(32, -24)
    .stroke({ color: 0xffffff, width: 14, cap: 'round', join: 'round' });
  return g;
}
