import { Container, Graphics } from 'pixi.js';
import { Critter, CRITTERS } from '../../art/critter';
import { ink, swatch, wood } from '../../art/palette';
import type { Need, PieceId } from './logic';

const line = (color: number, width = 4) => ({ width, color, join: 'round' as const, cap: 'round' as const });

function pool(g: Graphics) {
  g.ellipse(0, 18, 42, 17).fill(swatch.blue.light).stroke(line(swatch.blue.line));
  g.moveTo(-28, 15).quadraticCurveTo(-10, 8, 7, 15).quadraticCurveTo(23, 23, 34, 15).stroke(line(swatch.white.fill, 3));
}

function reeds(g: Graphics, x = 0) {
  for (const dx of [-22, -7, 9, 24]) {
    const h = 38 + ((dx + 22) % 3) * 8;
    g.moveTo(x + dx, 22).lineTo(x + dx + 3, 22 - h).stroke(line(swatch.green.line, 5));
    g.ellipse(x + dx + (dx < 0 ? -4 : 5), 24 - h, 5, 12).fill(wood.fill).stroke(line(wood.line, 2));
  }
}

/** A code-drawn garden feature, centered near (0, 0), for the tray, garden, icon and sticker. */
export function pieceArt(id: PieceId): Container {
  const c = new Container();
  const g = new Graphics();
  switch (id) {
    case 'clover':
      for (const [x, y, r] of [[-18, -4, -0.6], [16, -7, 0.6], [0, -25, 0]] as const) {
        g.ellipse(x, y, 17, 12).fill(swatch.green.fill).stroke(line(swatch.green.line, 3));
        g.moveTo(x, y + 4).lineTo(x + Math.sin(r) * 10, 35).stroke(line(swatch.green.line, 4));
      }
      break;
    case 'shallow-pool':
      pool(g);
      for (const x of [-34, 36]) g.ellipse(x, 28, 10, 6).fill(wood.light).stroke(line(wood.line, 2));
      break;
    case 'brush-pile':
      for (const [x1, y1, x2, y2, color] of [
        [-38, 22, 30, -24, wood.line],
        [-34, -12, 38, 24, wood.fill],
        [-42, 8, 34, -8, wood.fill],
        [-24, 28, 22, -30, wood.line],
      ] as const) g.moveTo(x1, y1).lineTo(x2, y2).stroke(line(color, 9));
      g.poly([-44, 26, 0, -34, 44, 26]).stroke(line(wood.line, 5));
      break;
    case 'seed-grass':
      for (const x of [-28, -14, 0, 14, 28]) {
        const h = 46 - Math.abs(x) * 0.35;
        g.moveTo(x, 30).quadraticCurveTo(x - 5, 4, x + 2, 30 - h).stroke(line(swatch.green.line, 4));
        for (let i = 0; i < 3; i++) g.ellipse(x + (i % 2 ? 6 : -5), 2 - h + i * 10, 5, 3).fill(swatch.yellow.fill).stroke(line(swatch.yellow.line, 1.5));
      }
      break;
    case 'tall-reeds':
      reeds(g);
      break;
    case 'berry-hedge':
      for (const [x, y, r] of [[-28, 5, 28], [0, -12, 35], [31, 6, 28]] as const) g.circle(x, y, r).fill(swatch.green.fill).stroke(line(swatch.green.line, 4));
      for (const [x, y] of [[-30, -4], [-12, 9], [5, -24], [20, 3], [38, 10]]) g.circle(x, y, 6).fill(swatch.red.fill).stroke(line(swatch.red.line, 2));
      g.rect(-5, 20, 10, 24).fill(wood.fill);
      break;
    case 'pond-reeds':
      pool(g);
      reeds(g, 12);
      break;
  }
  c.addChild(g);
  return c;
}

/** Food, water and shelter pictures used on the visitor's request sign. */
export function needIcon(need: Need, size = 42): Container {
  const c = new Container();
  const g = new Graphics();
  const s = size / 42;
  if (need === 'food') {
    g.moveTo(0, 18).quadraticCurveTo(-18, 0, -4, -20).quadraticCurveTo(18, -7, 0, 18).closePath().fill(swatch.green.fill).stroke(line(swatch.green.line, 3.5));
    g.moveTo(-2, 14).lineTo(8, -10).stroke(line(swatch.green.line, 3));
  } else if (need === 'water') {
    g.moveTo(0, -24).bezierCurveTo(-6, -8, -20, 3, -20, 14).bezierCurveTo(-20, 36, 20, 36, 20, 14).bezierCurveTo(20, 3, 6, -8, 0, -24).closePath().fill(swatch.blue.fill).stroke(line(swatch.blue.line, 3.5));
    g.ellipse(-7, 13, 4, 8).fill({ color: 0xffffff, alpha: 0.55 });
  } else {
    g.poly([-28, 3, 0, -25, 28, 3]).fill(swatch.orange.fill).stroke(line(swatch.orange.line, 4));
    g.roundRect(-22, 2, 44, 30, 5).fill(wood.light).stroke(line(wood.line, 3));
    g.roundRect(-8, 12, 16, 20, 7).fill(ink);
  }
  g.scale.set(s);
  c.addChild(g);
  return c;
}

/** The open-garden button: unlatch the gate and see who comes. */
export function gateIcon(): Container {
  const c = new Container();
  const g = new Graphics();
  g.moveTo(-34, 34).lineTo(-34, -26).quadraticCurveTo(0, -54, 34, -26).lineTo(34, 34).stroke(line(wood.line, 7));
  for (const x of [-20, 0, 20]) g.moveTo(x, 30).lineTo(x, -20).stroke(line(wood.fill, 8));
  g.moveTo(-28, 4).lineTo(28, 4).stroke(line(wood.line, 6));
  g.circle(18, 8, 4).fill(swatch.yellow.fill).stroke(line(swatch.yellow.line, 2));
  c.addChild(g);
  return c;
}

export function gardenPatch(): Graphics {
  return new Graphics()
    .ellipse(0, 12, 330, 120)
    .fill({ color: swatch.green.light, alpha: 0.96 })
    .stroke({ width: 8, color: swatch.green.line })
    .ellipse(0, 22, 285, 82)
    .fill({ color: wood.light, alpha: 0.4 });
}

/** A visitor beside the features its journal card remembers. */
export function habitatJournalPicture(visitor: 'bunny' | 'duck'): Container {
  const c = new Container();
  const water = pieceArt(visitor === 'bunny' ? 'shallow-pool' : 'pond-reeds');
  water.scale.set(0.75);
  water.position.set(36, 18);
  const food = pieceArt(visitor === 'bunny' ? 'berry-hedge' : 'seed-grass');
  food.scale.set(0.65);
  food.position.set(-42, 6);
  const friend = new Critter(CRITTERS[visitor]);
  friend.alive = false;
  friend.scale.set(0.3);
  friend.position.set(0, 80);
  c.addChild(food, water, friend);
  return c;
}
