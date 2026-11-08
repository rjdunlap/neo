import { Container, Graphics } from 'pixi.js';
import { Critter, type CritterSpec } from './critter';
import { ink, swatch, type ColorName, type Swatch } from './palette';

/**
 * Animal drawings shared between games: Frog Hop's frog, Penguin Slide's penguin, Mossy Path's turtle and Bubble Pop's
 * fish (and Owl Walk's owl), moved here unchanged so Who Am I? can draw the same friends; River Tablets' sheep and Keep House's
 * hens, moved so Maker Lane draws the same ones.
 */

export function frogArt(): Container {
  const c = new Container();
  const g = new Graphics();
  g.ellipse(-26, 4, 16, 9).ellipse(26, 4, 16, 9).fill(swatch.green.line);
  g.ellipse(0, -22, 38, 28).fill(swatch.green.fill).stroke({ width: 5, color: swatch.green.line });
  g.circle(-18, -50, 13)
    .circle(18, -50, 13)
    .fill(swatch.green.fill)
    .stroke({ width: 4, color: swatch.green.line });
  g.circle(-18, -50, 7).circle(18, -50, 7).fill(0xffffff).circle(-17, -49, 4).circle(19, -49, 4).fill(ink);
  g.moveTo(-14, -18)
    .quadraticCurveTo(0, -8, 14, -18)
    .stroke({ width: 4, color: swatch.green.line, cap: 'round' });
  g.circle(-24, -26, 5).circle(24, -26, 5).fill({ color: swatch.pink.fill, alpha: 0.6 });
  c.addChild(g);
  return c;
}

export function penguinArt(): Container {
  const c = new Container();
  const g = new Graphics();
  g.ellipse(-14, 34, 13, 7).ellipse(14, 34, 13, 7).fill(swatch.orange.fill);
  g.ellipse(0, 0, 32, 38).fill(ink);
  g.ellipse(0, 8, 22, 28).fill(0xffffff);
  g.ellipse(-30, 6, 8, 20).ellipse(30, 6, 8, 20).fill(ink);
  g.circle(-10, -14, 6).circle(10, -14, 6).fill(0xffffff).circle(-9, -13, 3).circle(11, -13, 3).fill(ink);
  g.poly([-8, -4, 8, -4, 0, 6])
    .fill(swatch.orange.fill)
    .stroke({ width: 2, color: swatch.orange.line, join: 'round' });
  g.circle(-18, 2, 5).circle(18, 2, 5).fill({ color: swatch.pink.fill, alpha: 0.6 });
  c.addChild(g);
  return c;
}

/** Mossy Path's turtle; Species Comeback passes other shell colors. */
export function turtleArt(size: number, shell: Swatch = swatch.teal): Graphics {
  const u = size / 100,
    g = new Graphics();
  for (const x of [-22, 22])
    for (const y of [-24, 24]) g.ellipse(x * u, y * u, 12 * u, 9 * u).fill(swatch.green.fill);
  g.circle(0, -36 * u, 15 * u)
    .fill(swatch.green.light)
    .stroke({ width: 2 * u, color: swatch.green.line });
  g.ellipse(0, 0, 30 * u, 34 * u)
    .fill(shell.fill)
    .stroke({ width: 3 * u, color: shell.line });
  g.poly([-15 * u, -9 * u, 0, -20 * u, 15 * u, -9 * u, 15 * u, 9 * u, 0, 20 * u, -15 * u, 9 * u]).stroke({
    width: 2 * u,
    color: shell.line,
  });
  g.circle(-5 * u, -39 * u, 2.5 * u)
    .circle(5 * u, -39 * u, 2.5 * u)
    .fill(ink);
  g.eventMode = 'none';
  return g;
}

/** A small cartoon fish facing right, drawn around its middle. */
export function fishArt(color: Swatch): Container {
  const c = new Container();
  const g = new Graphics()
    .poly([-30, 0, -58, -20, -58, 20])
    .fill(color.line)
    .ellipse(0, 0, 38, 24)
    .fill(color.fill)
    .stroke({ width: 4, color: color.line })
    .circle(16, -5, 6)
    .fill(0xffffff)
    .circle(18, -5, 3)
    .fill(ink);
  c.addChild(g);
  return c;
}

const owlSpec = (color: ColorName): CritterSpec => ({
  color,
  ears: 'pointy',
  snout: 'none',
  wings: true,
  belly: true,
});

/** Owl Walk's baby owl: a critter with eye rings, a little beak and ear tufts. */
export function owlArt(color: ColorName): Critter {
  const c = new Critter(owlSpec(color));
  const face = new Graphics()
    .circle(-40, -142, 36)
    .circle(40, -142, 36)
    .stroke({ width: 7, color: swatch.yellow.light, alpha: 0.9 })
    .poly([-12, -112, 12, -112, 0, -92])
    .fill(swatch.orange.fill)
    .stroke({ width: 3, color: swatch.orange.line, join: 'round', cap: 'round' });
  c.attach(face);
  return c;
}

const henLine = (color: number, width = 5) => ({
  width,
  color,
  join: 'round' as const,
  cap: 'round' as const,
});

/** A sheep standing on (0, 0), about `size` tall: a fleece puff with a dark face and legs. */
export function sheepArt(color: ColorName = 'white', size = 110): Container {
  const c = new Container();
  const g = new Graphics();
  const sw = swatch[color];
  const w = size * 0.95;
  const h = size * 0.6;
  // Legs.
  for (const x of [-w * 0.3, -w * 0.12, w * 0.12, w * 0.3])
    g.roundRect(x - size * 0.045, -h * 0.5, size * 0.09, h * 0.55, 6).fill(0x4a4454);
  // Fleece: a cloud of circles.
  const puffs: [number, number, number][] = [
    [-w * 0.3, -h * 0.75, h * 0.42],
    [0, -h * 0.9, h * 0.5],
    [w * 0.3, -h * 0.75, h * 0.42],
    [-w * 0.15, -h * 0.5, h * 0.4],
    [w * 0.15, -h * 0.5, h * 0.4],
  ];
  for (const [x, y, r] of puffs) g.circle(x, y, r + 3).fill(sw.line);
  for (const [x, y, r] of puffs) g.circle(x, y, r).fill(sw.fill);
  // Head.
  const hx = w * 0.46;
  const hy = -h * 0.95;
  g.ellipse(hx, hy, size * 0.17, size * 0.2).fill(0x4a4454);
  g.ellipse(hx - size * 0.14, hy - size * 0.1, size * 0.08, size * 0.045).fill(0x4a4454);
  g.ellipse(hx + size * 0.12, hy - size * 0.12, size * 0.08, size * 0.045).fill(0x4a4454);
  g.circle(hx + size * 0.06, hy - size * 0.03, size * 0.035).fill(0xffffff);
  g.circle(hx + size * 0.07, hy - size * 0.03, size * 0.018).fill(ink);
  g.circle(hx + size * 0.06, hy + size * 0.1, size * 0.02).fill(0xff8fa3);
  c.addChild(g);
  c.eventMode = 'none';
  return c;
}

/** A hen drawn into `g`, standing on (x, y), facing right (or left with `flip` -1). */
export function henArt(g: Graphics, x: number, y: number, color: number, flip = 1) {
  g.ellipse(x, y - 18, 22, 16)
    .fill(color)
    .stroke(henLine(ink, 3));
  g.circle(x + flip * 16, y - 34, 11)
    .fill(color)
    .stroke(henLine(ink, 3));
  g.moveTo(x + flip * 26, y - 34)
    .lineTo(x + flip * 36, y - 30)
    .lineTo(x + flip * 26, y - 28)
    .fill(swatch.orange.fill);
  g.circle(x + flip * 19, y - 37, 2).fill(ink);
  for (const d of [-1, 1]) g.circle(x + flip * 16 + d * 3, y - 46, 4).fill(swatch.red.fill);
  for (const d of [-6, 6])
    g.moveTo(x + d, y - 4)
      .lineTo(x + d, y)
      .stroke(henLine(swatch.orange.fill, 3));
}
