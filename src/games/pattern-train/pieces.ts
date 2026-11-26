import { Container, Graphics } from 'pixi.js';
import { Critter, CRITTERS, type CritterName } from '../../art/critter';
import { swatch } from '../../art/palette';
import { prop } from '../../art/props';
import type { AnimalSound } from '../../audio/sfx';
import { symbol, tile } from '../shared';
import { ANIMAL_TRIOS, FLOWERS, FRUITS, type PatternPlan } from './logic';

/** Each animal's own voice, for the car that is tapped. */
export const VOICE: Partial<Record<CritterName, AnimalSound>> = {
  cow: 'moo',
  duck: 'quack',
  pig: 'oink',
  cat: 'meow',
  dog: 'woof',
  bear: 'growl',
  bunny: 'hop',
};

/** One of a round's three pieces, made of the round's family of things (see `SHAPE_FAMILIES` and `ANIMAL_TRIOS`). */
export function pieceArt(
  kind: PatternPlan['kind'],
  family: number | undefined,
  value: number,
  size: number,
): Container {
  if (kind === 'shape' && family === 1) {
    const [fruit, color] = FRUITS[value % 3];
    const c = prop(fruit, color);
    c.scale.set(size / 48);
    return c;
  }
  if (kind === 'shape' && family === 2) {
    const c = prop('flower', FLOWERS[value % 3]);
    c.scale.set(size / 48);
    return c;
  }
  if (kind === 'animal' && family !== undefined) {
    const c = new Critter(CRITTERS[ANIMAL_TRIOS[family][value % 3]]);
    c.alive = false;
    c.scale.set(size / 150);
    c.y = size * 0.8;
    return c;
  }
  return symbol(kind as 'shape' | 'animal' | 'bell', value, size);
}

/** A train car at full size holding `art`: a white tile on two wheels. Scale it for a smaller train. */
export function trainCar(art: Container): Container {
  const car = new Container();
  car.addChild(tile(100, 108, 'white'), art);
  car.addChild(new Graphics().circle(-27, 65, 12).circle(27, 65, 12).fill(swatch.brown.line));
  return car;
}

/** The counters of a stack as a five-frame: two rows of five empty rings, the first `n` of them filled (row one first), so a stack is seen, not only counted. */
export function stackArt(n: number, size: number): Container {
  const c = new Container();
  const gap = size * 0.54,
    r = size * 0.21;
  for (let i = 0; i < 10; i++) {
    const x = ((i % 5) - 2) * gap,
      y = (Math.floor(i / 5) - 0.5) * gap;
    const dot = new Graphics().circle(x, y, r);
    if (i < n) dot.fill(swatch.orange.fill).stroke({ width: 3, color: swatch.orange.line });
    else dot.stroke({ width: 2, color: swatch.orange.light });
    c.addChild(dot);
  }
  return c;
}
