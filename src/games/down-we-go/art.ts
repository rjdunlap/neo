import { Container, Graphics } from 'pixi.js';
import { ink, swatch } from '../../art/palette';
import { PETALS } from './logic';

/** A sun dial: eight petals round a centre. Open petals are raised and filled, shut ones flat outlines, so the count reads by shape. */
export function dialArt(open: number, r: number, faded = false): Graphics {
  const g = new Graphics();
  g.circle(0, 0, r).fill({ color: 0xffffff, alpha: faded ? 0.15 : 0.35 });
  for (let i = 0; i < PETALS; i++) {
    const a = (i / PETALS) * Math.PI * 2 - Math.PI / 2;
    const raised = i < open;
    const len = raised ? r * 0.78 : r * 0.5;
    const w = r * 0.2;
    const x = Math.cos(a) * r * 0.5;
    const y = Math.sin(a) * r * 0.5;
    const p = new Graphics().ellipse(0, 0, w, len / 2);
    if (raised) p.fill(swatch.yellow.fill).stroke({ width: 3, color: swatch.yellow.line });
    else p.stroke({ width: 3, color: 0xffffff, alpha: 0.7 });
    p.rotation = a + Math.PI / 2;
    p.position.set(x * (raised ? 1.1 : 1), y * (raised ? 1.1 : 1));
    g.addChild(p);
  }
  g.circle(0, 0, r * 0.16).fill(open > 0 ? swatch.orange.fill : 0xffffff);
  return g;
}

/** The lantern with its warm circle of light (a 110-unit piece). */
export function lanternArt(): Container {
  const c = new Container();
  const glow = new Graphics()
    .circle(0, 0, 70)
    .fill({ color: 0xffe28a, alpha: 0.28 })
    .circle(0, 0, 48)
    .fill({ color: 0xffe28a, alpha: 0.35 });
  const body = new Graphics()
    .roundRect(-20, -26, 40, 52, 10)
    .fill(swatch.yellow.fill)
    .stroke({ width: 5, color: swatch.orange.line })
    .roundRect(-12, -14, 24, 28, 8)
    .fill(0xfff6c8)
    .moveTo(-10, -26)
    .lineTo(0, -40)
    .lineTo(10, -26)
    .stroke({ width: 5, color: swatch.orange.line, cap: 'round', join: 'round' });
  c.addChild(glow, body);
  return c;
}

/** A seaweed sprout: three swaying strands, rooted at (0, 0) growing up. `droop` lays them over. */
export function sproutArt(droop = false): Graphics {
  const g = new Graphics();
  [-14, 0, 14].forEach((x, i) => {
    const h = 54 + i * (i === 1 ? 14 : -4);
    const bend = droop ? 40 : x * 0.5;
    const top = droop ? -h * 0.45 : -h;
    g.moveTo(x, 0)
      .quadraticCurveTo(x + bend, top * 0.5, x + (droop ? bend * 1.6 : -bend), top)
      .stroke({ width: 9, color: swatch.green.line, cap: 'round' });
    g.moveTo(x, 0)
      .quadraticCurveTo(x + bend, top * 0.5, x + (droop ? bend * 1.6 : -bend), top)
      .stroke({ width: 5, color: swatch.green.fill, cap: 'round' });
  });
  return g;
}

/** A small fish that glows by itself. */
export function glowFishArt(): Container {
  const c = new Container();
  const g = new Graphics()
    .circle(0, 0, 42)
    .fill({ color: 0xbff0ec, alpha: 0.3 })
    .poly([-16, 0, -34, -12, -34, 12])
    .fill(swatch.teal.line)
    .ellipse(0, 0, 22, 14)
    .fill(swatch.teal.light)
    .stroke({ width: 3, color: swatch.teal.line })
    .circle(9, -3, 3.5)
    .fill(ink)
    .circle(-2, -16, 4)
    .fill(0xfffbd0);
  c.addChild(g);
  return c;
}

/** A rock ledge, `w` × `h`, centered on (0, 0); a wall of rock behind it reaches to the right edge. */
export function ledgeArt(w: number, h: number, lit: boolean): Graphics {
  return new Graphics()
    .roundRect(-w / 2, -h / 2 + 18, w, h - 36, 18)
    .fill(lit ? swatch.brown.light : 0x9a8a9e)
    .stroke({ width: 5, color: lit ? swatch.brown.line : 0x6d5f78 });
}

/** The hub icon and sticker: a lantern on a knotted rope against deepening blue, with a seaweed sprout on a ledge. */
export function iconArt(): Container {
  const c = new Container();
  const bg = new Graphics();
  bg.roundRect(-56, -56, 112, 112, 22).fill(0x6cc4ee);
  bg.roundRect(-56, -8, 112, 64, 22).fill(0x3f6fc2);
  bg.roundRect(-56, 22, 112, 34, 22).fill(0x2e3f8f);
  bg.moveTo(-14, -56).lineTo(-14, 6).stroke({ width: 4, color: 0xffffff });
  [-30, -8].forEach((y) => bg.circle(-14, y, 5).fill(0xffffff));
  c.addChild(bg);
  const lantern = lanternArt();
  lantern.scale.set(0.5);
  lantern.position.set(-14, 14);
  const ledge = new Graphics()
    .roundRect(14, 24, 36, 12, 5)
    .fill(swatch.brown.light)
    .stroke({ width: 2, color: swatch.brown.line });
  const sprout = sproutArt();
  sprout.scale.set(0.36);
  sprout.position.set(32, 25);
  c.addChild(ledge, sprout, lantern);
  return c;
}
