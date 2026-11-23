import { Container, Graphics } from 'pixi.js';
import { cream, ink, swatch, wood } from '../../art/palette';
import type { Good } from './logic';

export function crate(): Graphics {
  const g = new Graphics();
  g.roundRect(-18, -15, 36, 30, 3).fill(wood.light).stroke({ width: 3, color: wood.line });
  g.moveTo(-14, -11).lineTo(14, 11).moveTo(-14, 11).lineTo(14, -11).stroke({ width: 3, color: wood.line });
  return g;
}

export function boat(): Graphics {
  const g = new Graphics();
  g.moveTo(-25, -6)
    .lineTo(25, -6)
    .quadraticCurveTo(17, 16, 0, 16)
    .quadraticCurveTo(-17, 16, -25, -6)
    .closePath()
    .fill(swatch.blue.fill)
    .stroke({ width: 3, color: swatch.blue.line });
  g.moveTo(-18, -2).lineTo(18, -2).stroke({ width: 3, color: swatch.blue.light });
  g.moveTo(-9, 5).lineTo(12, -17).stroke({ width: 4, color: wood.line, cap: 'round' });
  return g;
}

export const goodArt = (good: Good) => (good === 0 ? crate() : boat());

export function workshopArt(row: number): Graphics {
  const g = new Graphics();
  if (row === 0) {
    g.moveTo(-15, 11).lineTo(11, -13).stroke({ width: 5, color: cream, cap: 'round' });
    g.ellipse(-13, 8, 7, 11).fill(swatch.yellow.fill).stroke({ width: 2, color: wood.line });
  } else {
    g.circle(0, -11, 4).stroke({ width: 3, color: cream });
    g.moveTo(0, -7)
      .lineTo(0, 13)
      .moveTo(-6, -3)
      .lineTo(6, -3)
      .moveTo(-13, 5)
      .quadraticCurveTo(-11, 14, 0, 14)
      .quadraticCurveTo(11, 14, 13, 5)
      .stroke({ width: 3, color: cream, cap: 'round' });
  }
  return g;
}

export function closedDoor(): Graphics {
  const g = new Graphics();
  g.roundRect(-19, -25, 38, 50, 5).fill(wood.light).stroke({ width: 3, color: wood.line });
  g.moveTo(-7, -21).lineTo(-7, 21).moveTo(5, -21).lineTo(5, 21).stroke({ width: 2, color: wood.fill });
  g.circle(11, 1, 3).fill(ink);
  return g;
}

export function icon(): Container {
  const card = new Graphics()
    .roundRect(-57, -130, 114, 104, 12)
    .fill(cream)
    .stroke({ width: 5, color: wood.line });
  card.roundRect(-18, -137, 36, 16, 4).fill(swatch.teal.line);
  const box = crate();
  const hull = boat();
  box.position.set(-23, -90);
  hull.position.set(23, -61);
  const node = new Container();
  node.addChild(card, box, hull);
  return node;
}

export function dock(w: number, h: number): Graphics {
  const g = new Graphics();
  g.roundRect(-w / 2, -h / 2, w, h, 28).fill(swatch.teal.light);
  for (const x of [0, w * 0.17, w * 0.35]) {
    g.moveTo(x, -h / 2 + 18)
      .quadraticCurveTo(x + 10, -h / 2 + 11, x + 20, -h / 2 + 18)
      .stroke({ width: 3, color: swatch.teal.fill, cap: 'round' });
  }
  g.roundRect(-w / 2 + 8, -20, w * 0.37, 52, 8)
    .fill(wood.light)
    .stroke({ width: 3, color: wood.line });
  for (let i = 1; i < 5; i++) {
    const x = -w / 2 + 8 + w * 0.37 * (i / 5);
    g.moveTo(x, -18).lineTo(x, 29).stroke({ width: 2, color: wood.line });
  }
  return g;
}
