import { Container, Graphics } from 'pixi.js';
import { swatch } from '../art/palette';

/**
 * A small key cap on a game's icon: it opens on couch play and needs a keyboard or a controller, not a finger. It is only a
 * picture (the return arrow of an Enter key) and never takes a touch. Its origin is its centre.
 */
export function keycap(size = 44): Container {
  const root = new Container();
  const h = size / 2;
  const cap = new Graphics()
    .roundRect(-h + 2, -h + 5, size - 4, size - 4, 9).fill(swatch.white.line)
    .roundRect(-h, -h, size - 4, size - 4, 9).fill(swatch.white.fill).stroke({ width: 3, color: swatch.teal.line });
  const a = size * 0.22;
  const arrow = new Graphics()
    .moveTo(a, -a).lineTo(a, a * 0.6).lineTo(-a, a * 0.6).stroke({ width: 4, color: swatch.teal.line, cap: 'round', join: 'round' })
    .moveTo(-a * 0.2, a * 0.1).lineTo(-a, a * 0.6).lineTo(-a * 0.2, a * 1.1).stroke({ width: 4, color: swatch.teal.line, cap: 'round', join: 'round' });
  cap.position.set(-2, -2); arrow.position.set(-2, -2);
  root.addChild(cap, arrow);
  root.eventMode = 'none';
  return root;
}
