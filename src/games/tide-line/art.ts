import { Container, Graphics } from 'pixi.js';
import { swatch } from '../../art/palette';
import { pail, star, wrack } from '../../art/shore';
import { Rng } from '../../engine/random';

export const SAND = 0xf3dc9c;
export const WET_SAND = 0xe2c27a;
export const SEA = 0x58b8e0;
export const SEA_DEEP = 0x3d97c7;
export const GRASS_GREEN = 0x9ccc6a;
export const DUNE = 0xdcbd72;

/**
 * A small shore in a 112-unit square round (0, 0): sand sloping up from the sea, a seaweed line and a pail above it, with a
 * sea star on the sand. The hub icon at seed 0; a sticker shifts the line, the pail's colour and the star from its seed.
 */
export function iconArt(seed = 0): Container {
  const rng = new Rng(seed + 31);
  const c = new Container();
  const g = new Graphics();
  g.roundRect(-56, -56, 112, 112, 22).fill(SAND).stroke({ color: swatch.yellow.line, width: 3 });
  g.roundRect(-56, -56, 112, 22, 22).fill(GRASS_GREEN);
  const lineY = seed ? rng.range(-6, 8) : 2;
  wrack(g, -50, 50, lineY, 10, seed + 3);
  // The sea at the bottom, with a foam crest.
  g.moveTo(-56, 30).quadraticCurveTo(-28, 22, 0, 30).quadraticCurveTo(28, 38, 56, 30).lineTo(56, 44).quadraticCurveTo(56, 56, 44, 56).lineTo(-44, 56).quadraticCurveTo(-56, 56, -56, 44).closePath().fill(SEA);
  g.moveTo(-56, 30).quadraticCurveTo(-28, 22, 0, 30).quadraticCurveTo(28, 38, 56, 30).stroke({ color: 0xffffff, width: 4, cap: 'round' });
  const p = new Graphics();
  pail(p, 0, 0, seed ? rng.pick([swatch.red, swatch.blue, swatch.green, swatch.purple]) : swatch.red);
  p.scale.set(0.34);
  p.position.set(seed ? rng.range(-22, 22) : 12, lineY - 12);
  star(g, seed ? rng.range(-34, -20) : -30, 20, 0.9, seed ? rng.pick([swatch.orange, swatch.purple, swatch.pink]) : swatch.orange);
  c.addChild(g, p);
  return c;
}
