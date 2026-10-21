import { Container, Graphics } from 'pixi.js';
import { ink, swatch, type Swatch } from './palette';

/**
 * Animal drawings shared between games: Frog Hop's frog, Penguin Slide's penguin, Mossy Path's turtle and Bubble Pop's
 * fish, moved here unchanged so Who Am I? can draw the same friends.
 */

export function frogArt(): Container {
  const c = new Container();
  const g = new Graphics();
  g.ellipse(-26, 4, 16, 9).ellipse(26, 4, 16, 9).fill(swatch.green.line);
  g.ellipse(0, -22, 38, 28).fill(swatch.green.fill).stroke({ width: 5, color: swatch.green.line });
  g.circle(-18, -50, 13).circle(18, -50, 13).fill(swatch.green.fill).stroke({ width: 4, color: swatch.green.line });
  g.circle(-18, -50, 7).circle(18, -50, 7).fill(0xffffff).circle(-17, -49, 4).circle(19, -49, 4).fill(ink);
  g.moveTo(-14, -18).quadraticCurveTo(0, -8, 14, -18).stroke({ width: 4, color: swatch.green.line, cap: 'round' });
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
  g.poly([-8, -4, 8, -4, 0, 6]).fill(swatch.orange.fill).stroke({ width: 2, color: swatch.orange.line, join: 'round' });
  g.circle(-18, 2, 5).circle(18, 2, 5).fill({ color: swatch.pink.fill, alpha: 0.6 });
  c.addChild(g);
  return c;
}

export function turtleArt(size: number): Graphics {
  const u = size / 100, g = new Graphics();
  for (const x of [-22, 22]) for (const y of [-24, 24]) g.ellipse(x * u, y * u, 12 * u, 9 * u).fill(swatch.green.fill);
  g.circle(0, -36 * u, 15 * u).fill(swatch.green.light).stroke({ width: 2 * u, color: swatch.green.line });
  g.ellipse(0, 0, 30 * u, 34 * u).fill(swatch.teal.fill).stroke({ width: 3 * u, color: swatch.teal.line });
  g.poly([-15 * u, -9 * u, 0, -20 * u, 15 * u, -9 * u, 15 * u, 9 * u, 0, 20 * u, -15 * u, 9 * u]).stroke({ width: 2 * u, color: swatch.teal.line });
  g.circle(-5 * u, -39 * u, 2.5 * u).circle(5 * u, -39 * u, 2.5 * u).fill(ink);
  g.eventMode = 'none'; return g;
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
