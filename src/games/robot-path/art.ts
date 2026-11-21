import { Graphics } from 'pixi.js';
import { cream } from '../../art/palette';
import { arrowIcon } from '../../ui/icons';
import { DIRECTIONS, type Direction } from './logic';

/** A program arrow pointing the way `dir` goes. */
export function arrow(dir: Direction) {
  const g = arrowIcon(1);
  g.rotation = (DIRECTIONS.indexOf(dir) * Math.PI) / 2 - Math.PI / 2;
  return g;
}

/**
 * The call mark (level 15): three short bars, a little list of steps, in cream. The same mark sits in the palette, in the
 * Start here row and beside the Do this heading, so the purple tile always means "run that list".
 */
export function callMark(scale = 1): Graphics {
  const g = new Graphics();
  for (const dy of [-16, 0, 16]) g.roundRect(-22, dy - 4, dy === 0 ? 44 : 32, 8, 4).fill(cream);
  g.scale.set(scale);
  return g;
}
