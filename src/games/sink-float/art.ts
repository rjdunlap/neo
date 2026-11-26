import { Container, Graphics } from 'pixi.js';
import { cream, ink, swatch, wood } from '../../art/palette';
import { prop } from '../../art/props';
import { starPoints } from '../../art/shapes';
import type { ClayColor, ClayShape, SmallArt, Thing } from './logic';

const line = (color: number, width = 5) => ({ width, color, join: 'round' as const, cap: 'round' as const });

/** One thing to drop in the water, about 90 units across, centered on (0, 0). */
export function thingArt(thing: Thing): Container {
  const c = new Container();
  const g = new Graphics();
  switch (thing) {
    case 'duck': {
      const y = swatch.yellow;
      g.ellipse(0, 12, 40, 26).fill(y.fill).stroke(line(y.line));
      g.circle(22, -18, 20).fill(y.fill).stroke(line(y.line));
      g.poly([38, -20, 58, -14, 38, -8]).fill(swatch.orange.fill).stroke(line(swatch.orange.line, 3));
      g.circle(26, -24, 4).fill(ink);
      g.ellipse(-8, 8, 18, 10).fill(y.light);
      break;
    }
    case 'boat':
      g.moveTo(14, -48).lineTo(14, 8).stroke(line(wood.line, 5));
      g.poly([18, -46, 18, -2, 50, -2]).fill(swatch.white.fill).stroke(line(swatch.white.line, 4));
      g.poly([-48, 6, 48, 6, 34, 34, -34, 34]).fill(swatch.red.fill).stroke(line(swatch.red.line));
      break;
    case 'ball': {
      const colors = [
        swatch.red.fill,
        swatch.white.fill,
        swatch.blue.fill,
        swatch.white.fill,
        swatch.yellow.fill,
        swatch.white.fill,
      ];
      for (let i = 0; i < 6; i++) {
        const a0 = (i * Math.PI) / 3;
        g.moveTo(0, 0)
          .arc(0, 0, 40, a0, a0 + Math.PI / 3)
          .closePath()
          .fill(colors[i]);
      }
      g.circle(0, 0, 40)
        .stroke(line(swatch.white.line))
        .circle(0, 0, 8)
        .fill(swatch.white.fill)
        .stroke(line(swatch.white.line, 3));
      break;
    }
    case 'leaf':
      g.moveTo(-44, 10)
        .quadraticCurveTo(-10, -44, 44, -14)
        .quadraticCurveTo(10, 40, -44, 10)
        .closePath()
        .fill(swatch.green.fill)
        .stroke(line(swatch.green.line));
      g.moveTo(-50, 14).quadraticCurveTo(0, -4, 40, -12).stroke(line(swatch.green.line, 4));
      break;
    case 'apple':
      c.addChild(prop('apple', 'red'));
      c.scale.set(0.85);
      return c;
    case 'rock':
      g.moveTo(-42, 16)
        .quadraticCurveTo(-46, -20, -10, -28)
        .quadraticCurveTo(30, -36, 42, -6)
        .quadraticCurveTo(52, 26, 10, 30)
        .quadraticCurveTo(-30, 34, -42, 16)
        .closePath()
        .fill(swatch.white.line)
        .stroke(line(ink, 4));
      g.ellipse(-12, -12, 12, 6).fill({ color: swatch.white.fill, alpha: 0.35 });
      break;
    case 'key': {
      const k = swatch.yellow;
      g.circle(-26, 0, 22).fill(k.fill).stroke(line(k.line)).circle(-26, 0, 9).fill(swatch.white.light);
      g.roundRect(-6, -7, 54, 14, 5).fill(k.fill).stroke(line(k.line, 4));
      g.rect(30, 6, 8, 14).rect(42, 6, 8, 10).fill(k.fill);
      break;
    }
    case 'coin': {
      const k = swatch.yellow;
      g.circle(0, 0, 34).fill(k.fill).stroke(line(k.line)).circle(0, 0, 25).stroke(line(k.line, 3));
      g.poly(starPoints(13, 6)).fill(k.light);
      break;
    }
    case 'spoon':
      g.roundRect(-4, -6, 52, 12, 6).fill(swatch.white.line).stroke(line(ink, 3));
      g.ellipse(-24, 0, 26, 18).fill(swatch.white.light).stroke(line(swatch.white.line, 5));
      break;
    case 'feather': {
      const f = swatch.teal;
      // A curved vane on a quill, with a few notches in its edge.
      g.moveTo(-40, 32)
        .quadraticCurveTo(-34, -6, 38, -36)
        .quadraticCurveTo(26, 8, -40, 32)
        .closePath()
        .fill(f.fill)
        .stroke(line(f.line, 4));
      g.moveTo(-48, 40).quadraticCurveTo(-8, 4, 38, -36).stroke(line(f.line, 4));
      for (const [x, y] of [
        [-14, -2],
        [6, -18],
        [10, 10],
      ])
        g.moveTo(x, y)
          .lineTo(x + (y < 0 ? -10 : 8), y + (y < 0 ? -4 : 8))
          .stroke(line(f.light, 3));
      break;
    }
    case 'marble': {
      // A clear glass marble with a purple swirl, so it stands out against the water.
      const m = swatch.purple;
      g.circle(0, 0, 28).fill(swatch.white.fill).stroke(line(m.line));
      g.moveTo(-18, 12)
        .quadraticCurveTo(-4, -22, 20, -8)
        .quadraticCurveTo(4, 2, 12, 20)
        .stroke(line(m.fill, 7));
      g.ellipse(-12, -14, 7, 4).fill(m.light);
      break;
    }
    case 'log':
      // A short wooden log on its side: bark along the length, rings on the cut end.
      g.roundRect(-48, -20, 80, 40, 10).fill(swatch.brown.fill).stroke(line(swatch.brown.line));
      g.moveTo(-36, -6).lineTo(-4, -6).moveTo(-26, 8).lineTo(14, 8).stroke(line(swatch.brown.line, 3));
      g.ellipse(32, 0, 14, 20).fill(wood.light).stroke(line(swatch.brown.line));
      g.ellipse(32, 0, 7, 11).stroke(line(wood.line, 3)).circle(32, 0, 2).fill(wood.line);
      break;
    case 'ice': {
      const i = swatch.teal;
      // A cube seen from slightly above, with a shine on its front.
      g.poly([-30, -22, -16, -36, 36, -36, 22, -22]).fill(swatch.white.fill).stroke(line(i.line, 4));
      g.poly([22, -22, 36, -36, 36, 18, 22, 32]).fill(i.fill).stroke(line(i.line, 4));
      g.roundRect(-30, -22, 52, 54, 6).fill(i.light).stroke(line(i.line, 4));
      g.moveTo(-20, 18).lineTo(-20, -10).lineTo(-8, -14).stroke(line(swatch.white.fill, 4));
      break;
    }
    case 'paperclip': {
      // One bent wire: the small inner loop, then the long outer loop around it.
      const wire = (color: number, width: number) =>
        g
          .moveTo(16, 8)
          .lineTo(-26, 8)
          .arc(-26, 0, 8, Math.PI / 2, (3 * Math.PI) / 2)
          .lineTo(28, -8)
          .arc(28, 3, 11, -Math.PI / 2, Math.PI / 2)
          .lineTo(-30, 14)
          .arc(-30, 0, 14, Math.PI / 2, (3 * Math.PI) / 2)
          .lineTo(20, -14)
          .stroke(line(color, width));
      g.scale.set(1.25);
      wire(swatch.white.line, 6);
      wire(swatch.white.light, 2);
      break;
    }
  }
  c.addChild(g);
  return c;
}

/** The picture on the "floats" basket: something bobbing on a wave. */
export function floatIcon(): Graphics {
  const g = new Graphics();
  g.ellipse(0, -6, 26, 16)
    .fill(swatch.yellow.fill)
    .stroke(line(swatch.yellow.line, 4))
    .circle(14, -24, 12)
    .fill(swatch.yellow.fill)
    .stroke(line(swatch.yellow.line, 4));
  g.moveTo(-44, 10)
    .quadraticCurveTo(-30, 0, -16, 10)
    .quadraticCurveTo(-2, 20, 12, 10)
    .quadraticCurveTo(26, 0, 40, 10)
    .stroke(line(swatch.blue.fill, 6));
  return g;
}

/**
 * The small one of a Big and small pair, drawn about 90 units across like `thingArt` and shown smaller (`PAIRS` sizes): a
 * thin twig of the log's wood, a smooth pebble of the rock's stone, and the same beach ball.
 */
export function smallArt(art: SmallArt): Container {
  if (art === 'little-ball') return thingArt('ball');
  const c = new Container();
  const g = new Graphics();
  if (art === 'twig') {
    g.moveTo(-46, 10)
      .quadraticCurveTo(0, -4, 46, -6)
      .stroke(line(swatch.brown.line, 14))
      .moveTo(-46, 10)
      .quadraticCurveTo(0, -4, 46, -6)
      .stroke(line(swatch.brown.fill, 8));
    g.moveTo(8, -2)
      .lineTo(26, -26)
      .stroke(line(swatch.brown.line, 10))
      .moveTo(8, -2)
      .lineTo(26, -26)
      .stroke(line(swatch.brown.fill, 5));
    g.moveTo(26, -26)
      .quadraticCurveTo(44, -40, 48, -24)
      .quadraticCurveTo(36, -14, 26, -26)
      .closePath()
      .fill(swatch.green.fill)
      .stroke(line(swatch.green.line, 3));
  } else {
    g.ellipse(0, 4, 44, 28).fill(swatch.white.line).stroke(line(ink, 4));
    g.ellipse(-14, -6, 14, 6).fill({ color: swatch.white.fill, alpha: 0.35 });
  }
  c.addChild(g);
  return c;
}

/** The picture on the "sinks" basket: a rock resting at the bottom, bubbles rising. */
export function sinkIcon(): Graphics {
  const g = new Graphics();
  g.moveTo(-44, -26)
    .quadraticCurveTo(-30, -36, -16, -26)
    .quadraticCurveTo(-2, -16, 12, -26)
    .quadraticCurveTo(26, -36, 40, -26)
    .stroke(line(swatch.blue.fill, 6));
  g.ellipse(0, 18, 24, 14).fill(swatch.white.line).stroke(line(ink, 3));
  g.circle(-14, -6, 5).circle(-6, -14, 3).stroke(line(swatch.blue.fill, 3));
  g.moveTo(-44, 32).lineTo(44, 32).stroke(line(wood.line, 5));
  return g;
}

/**
 * The clay for Make it float, redrawn in place as she changes its shape: a ball, a flat pancake, a hollow boat, or a boat
 * with a hole and a crack. `water` (0 to 1) fills a leaky boat as it sinks. About 110 units across, centered on (0, 0).
 */
export function drawClay(g: Graphics, shape: ClayShape | 'ball', color: ClayColor, water = 0): Graphics {
  const s = swatch[color];
  g.clear();
  switch (shape) {
    case 'ball':
      g.circle(0, 0, 34).fill(s.fill).stroke(line(s.line));
      g.ellipse(-10, -12, 10, 6).fill({ color: s.light, alpha: 0.7 });
      break;
    case 'flat':
      g.ellipse(0, 14, 60, 13).fill(s.fill).stroke(line(s.line));
      g.ellipse(-16, 10, 18, 4).fill({ color: s.light, alpha: 0.7 });
      break;
    case 'boat':
    case 'leaky':
      // The hull, open at the top: the dark rim shows it is hollow.
      g.moveTo(-58, -6)
        .quadraticCurveTo(-52, 34, 0, 36)
        .quadraticCurveTo(52, 34, 58, -6)
        .closePath()
        .fill(s.fill)
        .stroke(line(s.line));
      g.ellipse(0, -6, 58, 12).fill(s.line).ellipse(0, -4, 50, 8).fill({ color: ink, alpha: 0.25 });
      if (water > 0) g.ellipse(0, -4, 50 * water, 8 * water).fill({ color: swatch.blue.fill, alpha: 0.8 });
      if (shape === 'leaky') {
        g.circle(14, 22, 7).fill(ink);
        g.moveTo(14, 22).lineTo(26, 12).lineTo(32, 16).stroke(line(ink, 3));
      }
      break;
  }
  return g;
}

/** "Same clay, same weight": a level two-pan scale with the ball's outline on one pan and the boat on the other. */
export function sameWeightIcon(color: ClayColor): Container {
  const c = new Container();
  const g = new Graphics();
  g.moveTo(0, 40)
    .lineTo(0, -30)
    .stroke(line(wood.line, 6))
    .moveTo(-30, 44)
    .lineTo(30, 44)
    .stroke(line(wood.line, 6));
  g.moveTo(-70, -30).lineTo(70, -30).stroke(line(wood.line, 6)).circle(0, -30, 6).fill(wood.fill);
  for (const x of [-56, 56])
    g.moveTo(x, -30)
      .lineTo(x - 22, 6)
      .moveTo(x, -30)
      .lineTo(x + 22, 6)
      .stroke(line(wood.line, 3))
      .moveTo(x - 30, 6)
      .quadraticCurveTo(x, 22, x + 30, 6)
      .stroke(line(wood.line, 5));
  g.circle(-56, -8, 14).stroke({ ...line(swatch[color].line, 4), alpha: 0.8 });
  const boat = drawClay(new Graphics(), 'boat', color);
  boat.scale.set(0.38);
  boat.position.set(56, -6);
  c.addChild(g, boat);
  return c;
}

/** Salty or fresh: a cream egg with a soft highlight, about 70 units tall, centered on (0, 0). */
export function eggArt(): Container {
  const c = new Container();
  const g = new Graphics();
  g.ellipse(0, 0, 28, 36).fill(cream).stroke(line(wood.line, 4));
  g.ellipse(-10, -14, 7, 11).fill({ color: swatch.white.fill, alpha: 0.8 });
  c.addChild(g);
  return c;
}

/** Salty or fresh: a salt shaker, a white body under a grey cap with holes, about 130 by 150 with its shadow. */
export function shakerArt(): Container {
  const c = new Container();
  const g = new Graphics();
  g.ellipse(0, 62, 46, 10).fill({ color: ink, alpha: 0.12 });
  g.moveTo(-38, 58)
    .lineTo(-30, -20)
    .lineTo(30, -20)
    .lineTo(38, 58)
    .closePath()
    .fill(swatch.white.fill)
    .stroke(line(swatch.white.line, 5));
  g.roundRect(-32, -56, 64, 38, 14).fill(swatch.white.line).stroke(line(ink, 4));
  for (const [x, y] of [
    [-14, -44],
    [0, -36],
    [14, -44],
    [-7, -28],
    [7, -28],
  ])
    g.circle(x, y, 3.5).fill(ink);
  g.moveTo(-18, 6).lineTo(-14, 44).stroke(line(swatch.white.light, 6));
  c.addChild(g);
  return c;
}

/** A thin dashed waterline drawn across a thing at the surface, `w` wide, centered on (x, y). */
export function waterlineMark(g: Graphics, x: number, y: number, w: number): Graphics {
  for (let dx = -w / 2; dx < w / 2; dx += 14) g.moveTo(x + dx, y).lineTo(x + Math.min(dx + 8, w / 2), y);
  return g.stroke({ width: 3, color: swatch.blue.line, cap: 'round' });
}

/** Garden Raft: a pot of herbs (or a pumpkin) with its weight as stones in a small basket, about 100 wide, base at y = 0. */
export function potArt(stones: 1 | 2 | 3, pumpkin = false): Container {
  const c = new Container();
  const g = new Graphics();
  if (pumpkin) {
    g.ellipse(0, -34, 44, 34).fill(swatch.orange.fill).stroke(line(swatch.orange.line));
    g.ellipse(-16, -34, 12, 30).stroke(line(swatch.orange.line, 3));
    g.ellipse(16, -34, 12, 30).stroke(line(swatch.orange.line, 3));
    g.roundRect(-5, -76, 10, 16, 4).fill(swatch.green.fill).stroke(line(swatch.green.line, 3));
  } else {
    g.poly([-26, -44, 26, -44, 20, 0, -20, 0]).fill(swatch.orange.light).stroke(line(swatch.orange.line));
    g.roundRect(-30, -54, 60, 14, 6).fill(swatch.orange.fill).stroke(line(swatch.orange.line, 4));
    for (const [x, h] of [
      [-14, 16],
      [0, 22],
      [14, 16],
    ])
      g.ellipse(x, -54 - h, 8, h)
        .fill(swatch.green.fill)
        .stroke(line(swatch.green.line, 3));
  }
  c.addChild(g);
  // The weight: one to three stones in a basket in front.
  const basket = new Graphics();
  basket.roundRect(-30, -18, 60, 18, 6).fill(wood.light).stroke(line(wood.line, 3));
  for (let i = 0; i < stones; i++)
    basket
      .circle((i - (stones - 1) / 2) * 17, -23, 9)
      .fill(swatch.white.light)
      .stroke(line(swatch.white.line, 3));
  c.addChild(basket);
  return c;
}

/** Garden Raft: a float barrel, about 90 wide and 70 tall, centered on (0, 0). */
export function barrelArt(): Graphics {
  const g = new Graphics();
  g.roundRect(-44, -34, 88, 68, 24).fill(swatch.red.fill).stroke(line(swatch.red.line));
  g.rect(-44, -12, 88, 24).fill(swatch.white.fill);
  g.roundRect(-44, -34, 88, 68, 24).stroke(line(swatch.red.line));
  return g;
}

/** Garden Raft: a small plumb bob on a string, hanging down from (0, 0) by `drop`, for where the weight is. */
export function plumbArt(drop = 54): Graphics {
  const g = new Graphics();
  g.moveTo(0, 0).lineTo(0, drop).stroke(line(ink, 3));
  g.poly([0, drop + 24, -10, drop, 10, drop])
    .fill(swatch.purple.fill)
    .stroke(line(swatch.purple.line, 3));
  return g;
}

/** Build a Boat: a foil tray `cells` cells wide and `wall` tall, its base at y = 0 and centered on x = 0, with a seam per cell. */
export function boatArt(cells: number, cellW: number, wall: number): Container {
  const c = new Container();
  const w = cells * cellW;
  const g = new Graphics();
  g.poly([-w / 2, -wall, w / 2, -wall, w / 2 - 16, 0, -w / 2 + 16, 0])
    .fill(swatch.white.light)
    .stroke(line(swatch.white.line));
  g.moveTo(-w / 2 + 6, -wall + 10)
    .lineTo(w / 2 - 6, -wall + 10)
    .stroke(line(swatch.blue.light, 4));
  for (let i = 1; i < cells; i++)
    g.moveTo(-w / 2 + i * cellW, -wall + 4)
      .lineTo(-w / 2 + i * cellW + (i * cellW > w / 2 ? -4 : 4), -4)
      .stroke(line(swatch.white.line, 2));
  c.addChild(g);
  return c;
}

/** The marbles drawn as a row of dots (two rows past eight), centered on x and with its first row at y. */
export function marbleDots(g: Graphics, x: number, y: number, n: number): Graphics {
  const perRow = 8;
  for (let i = 0; i < n; i++) {
    const row = Math.floor(i / perRow);
    const inRow = Math.min(perRow, n - row * perRow);
    const col = i % perRow;
    g.circle(x + (col - (inRow - 1) / 2) * 24, y - row * 24, 10)
      .fill(swatch.purple.fill)
      .stroke(line(swatch.purple.line, 2));
  }
  return g;
}

/** Build a Boat: the bowl on the near bank, about 170 by 150, holding up to six marbles (what is left of the pile). */
export function marbleBowlArt(count: number): Container {
  const c = new Container();
  const g = new Graphics();
  g.roundRect(-85, -75, 170, 150, 30).fill({ color: swatch.white.fill, alpha: 0.6 });
  g.ellipse(0, 20, 64, 46).fill(wood.fill).stroke(line(wood.line));
  for (let i = 0; i < Math.min(count, 6); i++) {
    const col = i % 3;
    const row = Math.floor(i / 3);
    g.circle(-34 + col * 34, -2 + row * 26 - 6, 14)
      .fill(swatch.white.fill)
      .stroke(line(swatch.purple.line, 3));
    g.circle(-34 + col * 34 + 2, -2 + row * 26 - 4 - 6, 6).fill(swatch.purple.fill);
  }
  c.addChild(g);
  return c;
}
