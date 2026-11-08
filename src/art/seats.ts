import { Graphics } from 'pixi.js';
import { swatch } from './palette';

/** The "Two of us" seat button: a grown-up and a child side by side (Secret Code's Swap seats, Shape Buddies' Your friend, my friend). */
export function twoArt(): Graphics {
  const g = new Graphics();
  g.circle(-14, -20, 11).fill(swatch.blue.fill).roundRect(-28, -6, 28, 34, 12).fill(swatch.blue.fill);
  return g.circle(16, -6, 9).fill(swatch.green.fill).roundRect(5, 6, 22, 22, 10).fill(swatch.green.fill);
}

/** The "Just me" seat button: one figure on its own. */
export function oneArt(): Graphics {
  return new Graphics()
    .circle(0, -16, 11)
    .fill(swatch.blue.fill)
    .roundRect(-14, -2, 28, 32, 12)
    .fill(swatch.blue.fill);
}
