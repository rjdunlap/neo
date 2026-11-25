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
