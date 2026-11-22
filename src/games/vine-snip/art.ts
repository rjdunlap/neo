import type { Container } from 'pixi.js';
import type { ColorName } from '../../art/palette';
import { prop } from '../../art/props';
import { Backdrop } from '../../art/scenery';
import type { View } from '../../engine/view';
import type { FriendKind, Kind } from './logic';

/** Art and names every Vine Snip scene shares (levels 1–5 in index.ts, level 6 in where.ts). */
export const COLOR: Record<Kind, ColorName> = {
  apple: 'red',
  orange: 'orange',
  lemon: 'yellow',
  pear: 'green',
};
export const NAME: Record<FriendKind, string> = {
  bunny: 'Bunny',
  bear: 'Bear',
  duck: 'Duck',
  pig: 'Pig',
  dog: 'Dog',
  cat: 'Cat',
};
/** Each friend rings its own pentatonic step when it munches. */
export const NOTE: Record<FriendKind, number> = { bunny: 5, bear: 6, duck: 7, pig: 8, dog: 9, cat: 10 };
export const FRIEND_SCALE = 0.76;
/** A friend's mouth is this far above its feet at `FRIEND_SCALE`. */
export const MOUTH_UP = 88 * FRIEND_SCALE;

export function fruitArt(kind: Kind): Container {
  return prop(kind, COLOR[kind]);
}

export const backdrop = (view: View) =>
  new Backdrop(
    {
      sky: [0x9fd8f5, 0xe9f7e0],
      hills: [0xb8e3a8, 0x8fcf7f, 0x7cc06c],
      horizon: 0.86,
      clouds: 3,
      sun: true,
      seed: 211,
    },
    view,
  );
