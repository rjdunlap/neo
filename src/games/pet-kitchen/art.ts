import { Container, Graphics } from 'pixi.js';
import { cream, swatch } from '../../art/palette';
import type { KitchenDiscovery } from './logic';

/** One rectangle of sandwich: crust, bread and a strip of lettuce. */
function bread(g: Graphics, x: number, y: number, w: number, h: number) {
  g.roundRect(x, y, w, h, 8).fill(swatch.brown.fill).stroke({ width: 4, color: swatch.brown.line });
  g.roundRect(x + 6, y + 6, w - 12, h - 12, 5).fill(cream);
  g.moveTo(x + 9, y + h / 2).lineTo(x + w - 9, y + h / 2).stroke({ width: 5, color: swatch.green.fill });
}

/**
 * The journal card's picture for a kitchen discovery: two halves side by side making a whole sandwich, two quarters
 * making the same half, or a pizza in three equal slices.
 */
export function kitchenJournalPicture(key: KitchenDiscovery): Container {
  const c = new Container(), g = new Graphics();
  if (key === 'half') { bread(g, -64, -50, 60, 100); bread(g, 4, -50, 60, 100); }
  else if (key === 'quarter') { bread(g, -64, -30, 60, 60); bread(g, 4, -30, 60, 60); }
  else {
    g.circle(0, 0, 62).fill(swatch.brown.fill).stroke({ width: 5, color: swatch.brown.line });
    g.circle(0, 0, 52).fill(swatch.yellow.light).stroke({ width: 3, color: swatch.yellow.line });
    for (const a of [-Math.PI / 2, Math.PI / 6, 5 * Math.PI / 6]) g.moveTo(0, 0).lineTo(Math.cos(a) * 52, Math.sin(a) * 52);
    g.stroke({ width: 4, color: swatch.brown.line });
    for (const a of [Math.PI / 2, -Math.PI / 6, 7 * Math.PI / 6]) g.circle(Math.cos(a) * 28, Math.sin(a) * 28, 6).fill(swatch.red.fill).stroke({ width: 2, color: swatch.red.line });
  }
  c.addChild(g);
  return c;
}
