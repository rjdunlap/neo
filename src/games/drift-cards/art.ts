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
  const cos = Math.cos(a), sin = Math.sin(a);
  const p = (u: number, v: number) => [x + u * cos - v * sin, y + u * sin + v * cos];
  const k = s / 100;
  const pts = [p(-30 * k, -26 * k), p(4 * k, -26 * k), p(30 * k, 0), p(4 * k, 26 * k), p(-30 * k, 26 * k), p(-4 * k, 0)].flat();
  g.poly(pts).fill({ color: 0xffffff, alpha: 0.85 * alpha }).stroke({ color: SEA_DARK, width: 3, join: 'round', alpha });
}

/** The little wooden drift card with its number, centred on (0, 0). */
export function cardArt(n: number, scale = 1): Container {
  const c = new Container();
  const g = new Graphics();
  g.roundRect(-26, -18, 52, 36, 6).fill(WOOD).stroke({ color: WOOD_LINE, width: 3 });
  g.moveTo(-18, -8).lineTo(18, -8).moveTo(-18, 8).lineTo(10, 8).stroke({ color: WOOD_LINE, width: 1.5, alpha: 0.5 });
  const t = new Text({ text: String(n), style: { fontFamily: 'Nunito, sans-serif', fontSize: 28, fontWeight: '800', fill: ink } });
  t.anchor.set(0.5);
  c.addChild(g, t);
  c.scale.set(scale);
  return c;
}

/** A little boat on the harbour wall, its feet (keel) on (0, 0), about 100 wide. */
export function boatArt(color = swatch.red): Graphics {
  const g = new Graphics();
  g.moveTo(-48, -22).lineTo(48, -22).lineTo(34, 0).lineTo(-34, 0).closePath().fill(color.fill).stroke({ color: color.line, width: 4, join: 'round' });
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
  g.moveTo(-56, 30).lineTo(56, 30).lineTo(56, 44).quadraticCurveTo(56, 56, 44, 56).lineTo(-44, 56).quadraticCurveTo(-56, 56, -56, 44).closePath().fill(SAND);
  const dirs: Dir[] = seed ? [rng.pick(['e', 's'] as Dir[]), 's', rng.pick(['e', 'w'] as Dir[])] : ['e', 's', 'w'];
  arrow(g, -30, -28, 40, dirs[0]);
  arrow(g, 0, -28, 40, dirs[1]);
  arrow(g, 0, 4, 40, dirs[2]);
  g.moveTo(-36, -2).quadraticCurveTo(10, -50, 6, 18).stroke({ color: 0xffffff, width: 4, cap: 'round', alpha: 0.7 });
  const card = cardArt(seed ? rng.int(1, 9) : 1, 0.6);
  card.position.set(seed ? rng.range(-24, 24) : 18, 40);
  card.rotation = seed ? rng.range(-0.3, 0.3) : -0.15;
  c.addChild(g, card);
  return c;
}
