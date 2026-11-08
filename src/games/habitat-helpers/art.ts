import { Container, Graphics } from 'pixi.js';
import { Critter, CRITTERS } from '../../art/critter';
import { ink, swatch, wood } from '../../art/palette';
import { anemone, barnacle, crab, kelp, ROCK, ROCK_LINE } from '../../art/shore';
import type { Need, PieceId, Place, ShoreFriend } from './logic';

const line = (color: number, width = 4) => ({ width, color, join: 'round' as const, cap: 'round' as const });

function pool(g: Graphics) {
  g.ellipse(0, 18, 42, 17).fill(swatch.blue.light).stroke(line(swatch.blue.line));
  g.moveTo(-28, 15)
    .quadraticCurveTo(-10, 8, 7, 15)
    .quadraticCurveTo(23, 23, 34, 15)
    .stroke(line(swatch.white.fill, 3));
}

function reeds(g: Graphics, x = 0) {
  for (const dx of [-22, -7, 9, 24]) {
    const h = 38 + ((dx + 22) % 3) * 8;
    g.moveTo(x + dx, 22)
      .lineTo(x + dx + 3, 22 - h)
      .stroke(line(swatch.green.line, 5));
    g.ellipse(x + dx + (dx < 0 ? -4 : 5), 24 - h, 5, 12)
      .fill(wood.fill)
      .stroke(line(wood.line, 2));
  }
}

/** A code-drawn garden feature, centered near (0, 0), for the tray, garden, icon and sticker. */
export function pieceArt(id: PieceId): Container {
  const c = new Container();
  const g = new Graphics();
  switch (id) {
    case 'clover':
      for (const [x, y, r] of [
        [-18, -4, -0.6],
        [16, -7, 0.6],
        [0, -25, 0],
      ] as const) {
        g.ellipse(x, y, 17, 12).fill(swatch.green.fill).stroke(line(swatch.green.line, 3));
        g.moveTo(x, y + 4)
          .lineTo(x + Math.sin(r) * 10, 35)
          .stroke(line(swatch.green.line, 4));
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
      ] as const)
        g.moveTo(x1, y1).lineTo(x2, y2).stroke(line(color, 9));
      g.poly([-44, 26, 0, -34, 44, 26]).stroke(line(wood.line, 5));
      break;
    case 'seed-grass':
      for (const x of [-28, -14, 0, 14, 28]) {
        const h = 46 - Math.abs(x) * 0.35;
        g.moveTo(x, 30)
          .quadraticCurveTo(x - 5, 4, x + 2, 30 - h)
          .stroke(line(swatch.green.line, 4));
        for (let i = 0; i < 3; i++)
          g.ellipse(x + (i % 2 ? 6 : -5), 2 - h + i * 10, 5, 3)
            .fill(swatch.yellow.fill)
            .stroke(line(swatch.yellow.line, 1.5));
      }
      break;
    case 'tall-reeds':
      reeds(g);
      break;
    case 'berry-hedge':
      for (const [x, y, r] of [
        [-28, 5, 28],
        [0, -12, 35],
        [31, 6, 28],
      ] as const)
        g.circle(x, y, r).fill(swatch.green.fill).stroke(line(swatch.green.line, 4));
      for (const [x, y] of [
        [-30, -4],
        [-12, 9],
        [5, -24],
        [20, 3],
        [38, 10],
      ])
        g.circle(x, y, 6).fill(swatch.red.fill).stroke(line(swatch.red.line, 2));
      g.rect(-5, 20, 10, 24).fill(wood.fill);
      break;
    case 'pond-reeds':
      pool(g);
      reeds(g, 12);
      break;
    case 'dandelions':
      // Yellow flower heads on stems over a rosette of toothed leaves.
      for (const [x, lean] of [
        [-24, -6],
        [0, 0],
        [24, 6],
      ] as const) {
        g.moveTo(x, 32)
          .quadraticCurveTo(x - 4, 0, x + lean, -18)
          .stroke(line(swatch.green.line, 4));
      }
      for (const dx of [-30, -12, 12, 30])
        g.poly([dx * 0.3, 34, dx, 20, dx * 0.9, 26, dx * 1.2, 14, dx * 0.6, 30])
          .fill(swatch.green.fill)
          .stroke(line(swatch.green.line, 2.5));
      for (const [x, y, r] of [
        [-30, -18, 13],
        [0, -26, 15],
        [30, -12, 13],
      ] as const) {
        g.circle(x, y, r).fill(swatch.yellow.fill).stroke(line(swatch.yellow.line, 3));
        g.circle(x, y, r * 0.4).fill(swatch.orange.fill);
      }
      break;
    case 'log-burrow':
      // A hollow log lying on its side, its dark opening a place to hide.
      g.roundRect(-44, -18, 80, 46, 22).fill(wood.fill).stroke(line(wood.line, 4));
      for (const x of [-26, -8, 10])
        g.moveTo(x, -14)
          .quadraticCurveTo(x + 4, 4, x, 24)
          .stroke(line(wood.line, 2.5));
      g.ellipse(34, 5, 15, 23).fill(wood.light).stroke(line(wood.line, 4));
      g.ellipse(34, 7, 9, 15).fill(ink);
      g.moveTo(-34, -18).lineTo(-40, -32).stroke(line(swatch.green.line, 4));
      g.ellipse(-44, -34, 7, 4).fill(swatch.green.fill).stroke(line(swatch.green.line, 2));
      break;
    case 'pond-weed':
      // A floating mat of green weed on a patch of water.
      g.ellipse(0, 16, 44, 18).fill(swatch.blue.light).stroke(line(swatch.blue.line));
      for (const [x, y, rx] of [
        [-20, 12, 16],
        [6, 18, 20],
        [22, 8, 12],
        [-4, 4, 12],
      ] as const)
        g.ellipse(x, y, rx, 7).fill(swatch.teal.fill).stroke(line(swatch.green.line, 2.5));
      for (const x of [-26, -6, 14, 28])
        g.moveTo(x, 12)
          .quadraticCurveTo(x + 6, -6, x - 2, -18)
          .stroke(line(swatch.green.line, 3.5));
      break;
    case 'reed-island':
      // A small mound of earth in the water with a reed tuft growing on it.
      g.ellipse(0, 22, 46, 14).fill(swatch.blue.light).stroke(line(swatch.blue.line));
      g.ellipse(0, 16, 30, 12).fill(swatch.brown.fill).stroke(line(swatch.brown.line, 3));
      reeds(g, 2);
      break;
  }
  c.addChild(g);
  return c;
}

/**
 * Level 7: how a garden piece looks after its change (a season or the weather). It gives nothing now, so it is drawn
 * dry, flat, bare or seedless in browns rather than removed, and the before card keeps the old picture.
 */
export function changedArt(id: PieceId): Container {
  const c = new Container();
  const g = new Graphics();
  switch (id) {
    case 'shallow-pool':
      // Dry cracked mud where the pool was.
      g.ellipse(0, 18, 42, 17).fill(swatch.brown.light).stroke(line(swatch.brown.line));
      for (const [x1, y1, x2, y2] of [
        [-26, 14, -8, 20],
        [-8, 20, 4, 10],
        [4, 10, 22, 18],
        [-8, 20, -2, 30],
        [22, 18, 30, 26],
      ] as const)
        g.moveTo(x1, y1).lineTo(x2, y2).stroke(line(swatch.brown.line, 2.5));
      for (const x of [-34, 36]) g.ellipse(x, 28, 10, 6).fill(wood.light).stroke(line(wood.line, 2));
      break;
    case 'tall-reeds':
      // The reeds blown flat, lying along the ground.
      for (const [dx, dy] of [
        [-30, 22],
        [-18, 14],
        [-6, 24],
        [6, 16],
      ] as const) {
        g.moveTo(dx, dy + 6)
          .lineTo(dx + 40, dy - 2)
          .stroke(line(wood.line, 5));
        g.ellipse(dx + 44, dy - 3, 11, 5)
          .fill(wood.fill)
          .stroke(line(wood.line, 2));
      }
      break;
    case 'clover':
      // Short bare stems with a few curled brown leaves.
      for (const [x, lean] of [
        [-18, -5],
        [0, 0],
        [16, 5],
      ] as const)
        g.moveTo(x, 35)
          .lineTo(x + lean, 8)
          .stroke(line(wood.line, 4));
      for (const [x, y] of [
        [-24, 8],
        [6, 4],
        [20, 10],
      ] as const)
        g.ellipse(x, y, 9, 5).fill(swatch.brown.light).stroke(line(swatch.brown.line, 2));
      break;
    case 'seed-grass':
      // The same stems, dry and with no seeds left.
      for (const x of [-28, -14, 0, 14, 28]) {
        const h = 46 - Math.abs(x) * 0.35;
        g.moveTo(x, 30)
          .quadraticCurveTo(x - 5, 4, x + 2, 30 - h)
          .stroke(line(wood.line, 4));
      }
      break;
    default:
      c.addChild(pieceArt(id));
      c.alpha = 0.45;
      return c;
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
    g.moveTo(0, 18)
      .quadraticCurveTo(-18, 0, -4, -20)
      .quadraticCurveTo(18, -7, 0, 18)
      .closePath()
      .fill(swatch.green.fill)
      .stroke(line(swatch.green.line, 3.5));
    g.moveTo(-2, 14).lineTo(8, -10).stroke(line(swatch.green.line, 3));
  } else if (need === 'water') {
    g.moveTo(0, -24)
      .bezierCurveTo(-6, -8, -20, 3, -20, 14)
      .bezierCurveTo(-20, 36, 20, 36, 20, 14)
      .bezierCurveTo(20, 3, 6, -8, 0, -24)
      .closePath()
      .fill(swatch.blue.fill)
      .stroke(line(swatch.blue.line, 3.5));
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
  g.moveTo(-34, 34)
    .lineTo(-34, -26)
    .quadraticCurveTo(0, -54, 34, -26)
    .lineTo(34, 34)
    .stroke(line(wood.line, 7));
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

/**
 * Levels 8–9: a shore friend about 100 units across, feet at (0, 30). `open` 0 is an anemone pulled in tight (left out of
 * the water); `hiding` tucks the crab behind a little rock so only its eyes peek out.
 */
export function shoreFriendArt(friend: ShoreFriend, open = 1): Graphics {
  const g = new Graphics();
  if (friend === 'anemone') {
    anemone(g, 0, 30, 4.2, open);
  } else if (friend === 'barnacle') {
    // A little cluster of barnacles on a pebble, drawn at a size she can tap.
    g.ellipse(0, 22, 42, 14).fill(ROCK).stroke(line(ROCK_LINE, 3));
    const big = new Graphics();
    for (const [dx, dy] of [
      [-18, 6],
      [0, 2],
      [18, 6],
      [-8, -6],
      [10, -6],
    ])
      barnacle(big, dx / 3.4, dy / 3.4);
    big.scale.set(3.4);
    big.y = 6;
    g.addChild(big);
  } else {
    const c = new Graphics();
    crab(c, 0, 0, 1);
    c.scale.set(2.2);
    c.position.set(-12, 30);
    g.addChild(c);
  }
  return g;
}

/** One place on the shore, about 240 wide and 150 tall round (0, 0), with its surface at y 40. */
export function shorePlaceArt(place: Place): Graphics {
  const g = new Graphics();
  if (place === 'rock-pool') {
    g.ellipse(0, 30, 120, 52).fill(ROCK).stroke(line(ROCK_LINE, 4));
    g.ellipse(0, 34, 100, 38).fill(0x8fd3ec).stroke(line(swatch.blue.line, 3));
    g.moveTo(-60, 22).lineTo(-26, 22).stroke(line(0xffffff, 4));
  } else if (place === 'high-rock') {
    g.moveTo(-118, 60)
      .quadraticCurveTo(-110, -20, -50, -60)
      .quadraticCurveTo(10, -86, 70, -50)
      .quadraticCurveTo(118, -10, 118, 60)
      .closePath()
      .fill(ROCK)
      .stroke(line(ROCK_LINE, 4));
    // Sun-dried streaks on the top.
    g.moveTo(-50, -40).quadraticCurveTo(0, -60, 50, -36).stroke(line(0xc9c3d8, 5));
  } else {
    for (const [x, w, h] of [
      [-62, 66, 56],
      [10, 80, 70],
      [80, 50, 44],
    ]) {
      g.moveTo(x - w, 60)
        .quadraticCurveTo(x - w, 60 - h, x, 60 - h)
        .quadraticCurveTo(x + w, 60 - h, x + w, 60)
        .closePath()
        .fill(ROCK)
        .stroke(line(ROCK_LINE, 4));
    }
    // Seaweed draped over the rocks: somewhere to hide.
    for (let x = -100; x <= 100; x += 34) kelp(g, x, 58, 2.4);
    g.moveTo(-118, 52).quadraticCurveTo(0, 34, 118, 52).stroke(line(0x5c8a4a, 10));
  }
  return g;
}

/** The tide button's icon: a wave rolling back out. */
export function tideIcon(): Container {
  const g = new Graphics();
  g.moveTo(-30, 8)
    .quadraticCurveTo(-18, -16, 0, -6)
    .quadraticCurveTo(-8, 4, 4, 8)
    .quadraticCurveTo(18, -14, 30, 8)
    .stroke(line(0xffffff, 7));
  g.moveTo(-30, 22)
    .quadraticCurveTo(-15, 14, 0, 22)
    .quadraticCurveTo(15, 30, 30, 22)
    .stroke(line(0xffffff, 5));
  const c = new Container();
  c.addChild(g);
  return c;
}
