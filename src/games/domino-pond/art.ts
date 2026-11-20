import { Container, Graphics } from 'pixi.js';
import { cream, ink, swatch } from '../../art/palette';

export const PATCH_COLORS = [swatch.teal, swatch.purple, swatch.blue];
export const STONE_COLORS = [swatch.yellow, swatch.pink, swatch.green];
const DOTS = [
  [[0, 0]],
  [
    [-1, -1],
    [1, 1],
  ],
  [
    [-1, -1],
    [0, 0],
    [1, 1],
  ],
  [
    [-1, -1],
    [1, -1],
    [-1, 1],
    [1, 1],
  ],
];

export function pips(g: Graphics, x: number, y: number, count: number, size: number, color = ink) {
  for (const [dx, dy] of DOTS[count - 1]) {
    g.circle(x + dx * size, y + dy * size, size * 0.49).fill(color);
  }
}

export function duck() {
  return new Graphics()
    .ellipse(0, 12, 32, 9)
    .fill({ color: swatch.blue.line, alpha: 0.3 })
    .ellipse(-3, -2, 25, 15)
    .fill(swatch.yellow.fill)
    .ellipse(-9, -1, 13, 7)
    .fill(swatch.yellow.line)
    .circle(16, -16, 13)
    .fill(swatch.yellow.light)
    .ellipse(30, -12, 9, 4)
    .fill(swatch.orange.fill)
    .circle(20, -18, 2.4)
    .fill(ink);
}

export function pondIcon() {
  const picture = new Container();
  const g = new Graphics().ellipse(0, -23, 62, 38).fill(swatch.teal.fill);
  g.roundRect(-46, -35, 92, 34, 10).fill(swatch.yellow.fill).stroke({ color: swatch.yellow.line, width: 3 });
  g.moveTo(0, -33).lineTo(0, -3).stroke({ color: swatch.yellow.line, width: 3 });
  pips(g, -22, -18, 2, 7);
  pips(g, 22, -18, 3, 7);
  const bird = duck();
  bird.scale.set(0.85);
  bird.position.set(5, -52);
  picture.addChild(g, bird);
  return picture;
}

export function actionIcon(action: 'help' | 'turn' | 'undo' | 'check'): Graphics {
  const g = new Graphics();
  if (action === 'help') {
    return g
      .circle(0, -7, 13)
      .stroke({ color: ink, width: 5 })
      .moveTo(-6, 5)
      .lineTo(-5, 16)
      .lineTo(5, 16)
      .lineTo(6, 5)
      .stroke({ color: ink, width: 5 });
  }
  if (action === 'check') {
    return g
      .moveTo(-18, 0)
      .lineTo(-5, 13)
      .lineTo(18, -14)
      .stroke({ color: ink, width: 7, cap: 'round', join: 'round' });
  }
  if (action === 'turn') {
    return g
      .arc(0, 0, 16, 0.6, 6.15)
      .stroke({ color: ink, width: 5, cap: 'round' })
      .poly([16, -3, 5, -10, 17, -16])
      .fill(ink);
  }
  return g
    .moveTo(-19, -4)
    .lineTo(6, -4)
    .quadraticCurveTo(22, -4, 21, 16)
    .moveTo(-19, -4)
    .lineTo(-8, -16)
    .moveTo(-19, -4)
    .lineTo(-8, 8)
    .stroke({ color: ink, width: 5, cap: 'round', join: 'round' });
}

export function anchorMark(g: Graphics, x: number, y: number, color = cream) {
  g.poly([x, y - 7, x + 7, y, x, y + 7, x - 7, y]).fill(color);
}
