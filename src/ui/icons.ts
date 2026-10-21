import { Graphics } from 'pixi.js';
import { ink, swatch, wood } from '../art/palette';
import { shapePath, starPoints } from '../art/shapes';

export function islandIcon(): Graphics {
  return new Graphics().ellipse(0, 18, 30, 12).fill(swatch.blue.fill).ellipse(0, 12, 24, 10).fill(swatch.yellow.light)
    .moveTo(0, 10).quadraticCurveTo(9, -8, 0, -22).stroke({ width: 6, color: wood.line })
    .poly([0, -22, -28, -12, -14, -30, 0, -22, 27, -18, 12, -34]).fill(swatch.green.fill);
}

/** Simple pictograms for pre-readers, drawn about 60 units across, centered on (0, 0). */
const line = (width = 7, color = ink) => ({ width, color, join: 'round' as const, cap: 'round' as const });

export function houseIcon(color = ink): Graphics {
  return new Graphics()
    .poly([-28, -2, 0, -26, 28, -2])
    .stroke(line(7, color))
    .roundRect(-19, -6, 38, 32, 4)
    .stroke(line(7, color))
    .roundRect(-6, 8, 12, 18, 3)
    .fill(color);
}

export function againIcon(color = ink): Graphics {
  const r = 21;
  const [a0, a1] = [-Math.PI / 2 + 0.55, Math.PI * 1.5 - 0.35];
  const g = new Graphics()
    .moveTo(Math.cos(a0) * r, Math.sin(a0) * r)
    .arc(0, 0, r, a0, a1)
    .stroke(line(8, color));
  // Arrowhead at the end of the arc, pointing along it.
  const [px, py] = [Math.cos(a1) * r, Math.sin(a1) * r];
  const [tx, ty] = [-Math.sin(a1), Math.cos(a1)];
  const [nx, ny] = [Math.cos(a1), Math.sin(a1)];
  return g.poly([px + tx * 14, py + ty * 14, px + nx * 12, py + ny * 12, px - nx * 12, py - ny * 12]).fill(color).stroke(line(3, color));
}

/** "Next": a triangle running into a bar, the skip-forward mark (the again arrow is a circle, so the two are not alike). */
export function nextIcon(color = ink): Graphics {
  return new Graphics()
    .poly([-18, -22, 12, 0, -18, 22])
    .fill(color)
    .stroke(line(5, color))
    .roundRect(15, -22, 8, 44, 3)
    .fill(color);
}

export function frameIcon(): Graphics {
  return new Graphics()
    .roundRect(-28, -24, 56, 48, 6)
    .fill(0xffffff)
    .stroke(line(7, 0x9c6b3c))
    .poly([-20, 16, -6, -2, 4, 8, 12, 0, 20, 16])
    .fill(0x8bd86a)
    .circle(10, -10, 6)
    .fill(0xffd54a);
}

export function bookIcon(): Graphics {
  return new Graphics()
    .roundRect(-26, -30, 52, 60, 6)
    .fill(0xff9ac1)
    .stroke(line(5, 0xd96a96))
    .rect(-26, -30, 10, 60)
    .fill(0xd96a96)
    .poly([4, -14, 8, -4, 18, -3, 10, 4, 13, 14, 4, 8, -5, 14, -2, 4, -10, -3, 0, -4])
    .fill(0xffd54a)
    .stroke(line(3, 0xd9a520));
}

export function arrowIcon(dir: 1 | -1, color = ink): Graphics {
  return new Graphics().poly([-12 * dir, -22, 16 * dir, 0, -12 * dir, 22]).fill(color).stroke(line(6, color));
}

export function playIcon(color = 0xffffff): Graphics {
  return new Graphics().poly([-16, -26, 28, 0, -16, 26]).fill(color).stroke(line(8, color));
}

/** A picnic basket: the way back to the Windy Picnic. */
export function basketIcon(): Graphics {
  return new Graphics()
    .moveTo(-20, -4).bezierCurveTo(-20, -34, 20, -34, 20, -4).stroke(line(6, wood.line))
    .poly([-30, -6, 30, -6, 23, 26, -23, 26]).fill(wood.fill).stroke(line(5, wood.line))
    .moveTo(-27, 8).lineTo(27, 8).stroke(line(4, wood.line))
    .rect(-31, -10, 62, 9).fill(swatch.red.fill)
    .rect(-19, -10, 9, 9).rect(1, -10, 9, 9).fill(0xffffff)
    .rect(-31, -10, 62, 9).stroke(line(3, swatch.red.line));
}

/** Three books standing on a little shelf, one leaning: the library at the root (RW08 slice 2). */
export function libraryIcon(): Graphics {
  return new Graphics()
    .roundRect(-30, -28, 16, 52, 3).fill(swatch.blue.fill).stroke(line(4, swatch.blue.line))
    .roundRect(-12, -34, 18, 58, 3).fill(swatch.orange.fill).stroke(line(4, swatch.orange.line))
    .rect(-12, -22, 18, 6).fill(swatch.orange.line)
    .moveTo(10, 24).lineTo(22, -26).lineTo(36, -22).lineTo(25, 26).closePath().fill(swatch.green.fill).stroke(line(4, swatch.green.line))
    .roundRect(-38, 24, 78, 10, 4).fill(0xc9925a).stroke(line(4, 0x8f5f32));
}

/** A little notebook with a leaf: the picnic journal. */
export function journalIcon(): Graphics {
  return new Graphics()
    .roundRect(-26, -30, 52, 60, 6).fill(swatch.green.light).stroke(line(5, swatch.green.line))
    .rect(-26, -30, 10, 60).fill(swatch.green.line)
    .ellipse(6, 0, 13, 7).fill(swatch.green.fill).stroke(line(3, swatch.green.line))
    .moveTo(-6, 6).lineTo(18, -6).stroke(line(3, swatch.green.line));
}

/** A tree with a little cabin in its branches: the way to the pet's treehouse. */
export function treehouseIcon(): Graphics {
  return new Graphics()
    .rect(-6, 4, 12, 26).fill(wood.line)
    .circle(0, -8, 26).fill(swatch.green.fill).stroke(line(4, swatch.green.line))
    .roundRect(-15, -10, 30, 22, 3).fill(wood.fill).stroke(line(3, wood.line))
    .poly([-19, -10, 0, -26, 19, -10]).fill(swatch.red.fill).stroke(line(3, swatch.red.line))
    .roundRect(-4, -2, 8, 14, 2).fill(wood.line);
}

/** A clothes hanger: dress a friend (RW06). */
export function hangerIcon(color = ink): Graphics {
  return new Graphics()
    .moveTo(-6, -22).bezierCurveTo(-6, -34, 10, -34, 10, -24).bezierCurveTo(10, -16, 0, -16, 0, -8).stroke(line(6, color))
    .poly([0, -8, 30, 16, -30, 16]).stroke(line(7, color));
}

/** Two arrows facing each other: turn a thing round. */
export function flipIcon(color = ink): Graphics {
  return new Graphics()
    .moveTo(-6, 0).lineTo(-26, 0).moveTo(-14, -12).lineTo(-26, 0).lineTo(-14, 12)
    .moveTo(6, 0).lineTo(26, 0).moveTo(14, -12).lineTo(26, 0).lineTo(14, 12)
    .stroke(line(6, color))
    .moveTo(0, -24).lineTo(0, 24).stroke({ width: 4, color, cap: 'round' });
}

/** A tick for "done" and "yes". */
export function checkIcon(color = 0xffffff): Graphics {
  return new Graphics().moveTo(-20, 2).lineTo(-6, 16).lineTo(22, -16).stroke({ width: 10, color, cap: 'round', join: 'round' });
}

/** A cross for "none" and "take away". */
export function crossIcon(color = ink): Graphics {
  return new Graphics().moveTo(-16, -16).lineTo(16, 16).moveTo(16, -16).lineTo(-16, 16).stroke({ width: 9, color, cap: 'round' });
}

/** A heart about 56 across: solid when it is kept, just an outline when it is not. */
export function heartIcon(color = 0xffffff, filled = true): Graphics {
  const g = shapePath(new Graphics(), 'heart', 26);
  return filled ? g.fill(color).stroke(line(4, color)) : g.stroke(line(6, color));
}

/** A magnifying glass with a star in its lens: the discovery journal. */
export function magnifierIcon(color = ink): Graphics {
  const g = new Graphics()
    .moveTo(10, 10).lineTo(26, 26).stroke(line(10, wood.line))
    .circle(-6, -6, 22).fill(swatch.blue.light).stroke(line(7, color))
    .poly(starPoints(10, 4.4, 5).map((v, i) => (i % 2 === 0 ? v - 6 : v - 5))).fill(swatch.yellow.fill);
  return g;
}

/** Two friends side by side: "who's playing?". */
export function peopleIcon(): Graphics {
  return new Graphics()
    .circle(-13, -12, 11).fill(swatch.teal.fill).stroke(line(4, swatch.teal.line))
    .roundRect(-27, 2, 28, 24, 12).fill(swatch.teal.fill).stroke(line(4, swatch.teal.line))
    .circle(14, -8, 12).fill(swatch.yellow.fill).stroke(line(4, swatch.yellow.line))
    .roundRect(-1, 8, 30, 22, 12).fill(swatch.yellow.fill).stroke(line(4, swatch.yellow.line));
}

/** Three meadow flowers: Explore, and the preview's way to Rainbow Meadow. */
export function meadowIcon(): Graphics {
  const g = new Graphics();
  for (const [x, color] of [[-20, swatch.red], [0, swatch.yellow], [20, swatch.pink]] as const) {
    g.moveTo(x, 26).lineTo(x, -2).stroke({ color: swatch.green.line, width: 4, cap: 'round' });
    for (let i = 0; i < 5; i++) {
      const a = (i * 2 * Math.PI) / 5;
      g.circle(x + Math.cos(a) * 8, -10 + Math.sin(a) * 8, 6.5).fill(color.fill);
    }
    g.circle(x, -10, 5).fill(swatch.yellow.light).stroke({ color: color.line, width: 2 });
  }
  return g;
}

/** Her friend's ball, `r` units in radius: a red and yellow beach ball. */
export function ballIcon(r = 24): Graphics {
  return new Graphics()
    .circle(0, 0, r).fill(swatch.red.fill)
    .moveTo(-r, 0).arc(0, 0, r, Math.PI, 0).lineTo(0, 0).closePath().fill(swatch.yellow.fill)
    .moveTo(-r * 0.35, -r * 0.94).quadraticCurveTo(r * 0.15, 0, -r * 0.35, r * 0.94).stroke({ width: Math.max(3, r * 0.1), color: 0xffffff })
    .circle(0, 0, r).stroke({ width: Math.max(4, r * 0.12), color: swatch.red.line })
    .circle(-r * 0.4, -r * 0.45, r * 0.16).fill({ color: 0xffffff, alpha: 0.7 });
}

/** The ball beside the basket: "play with your friend". */
export function playWithIcon(): Graphics {
  const g = ballIcon(17);
  g.position.set(-14, 8);
  const all = new Graphics();
  all.roundRect(4, -2, 34, 26, 6).fill(wood.light).stroke(line(4, wood.line)).moveTo(8, -2).quadraticCurveTo(21, -26, 34, -2).stroke(line(4, wood.line));
  all.addChild(g);
  all.x = -8;
  return all;
}

/** Four bright tiles: Explore's All games (RW08). */
export function tilesIcon(): Graphics {
  const g = new Graphics();
  for (const [x, y, c] of [[-15, -15, swatch.red], [15, -15, swatch.yellow], [-15, 15, swatch.teal], [15, 15, swatch.pink]] as const) {
    g.roundRect(x - 12, y - 12, 24, 24, 7).fill(c.fill).stroke(line(3, c.line));
  }
  return g;
}

/** A game controller: Explore's Family play, which needs one (or a keyboard). */
export function padIcon(): Graphics {
  return new Graphics()
    .roundRect(-30, -16, 60, 32, 16).fill(swatch.blue.fill).stroke(line(4, swatch.blue.line))
    .rect(-21, -3, 14, 6).fill(0xffffff)
    .rect(-17, -7, 6, 14).fill(0xffffff)
    .circle(13, -4, 4).fill(swatch.yellow.fill)
    .circle(21, 4, 4).fill(swatch.red.fill);
}
