import { Container, Graphics } from 'pixi.js';
import { ink, swatch, wood } from '../../art/palette';
import { puffs } from '../../art/shapes';
import { label } from '../../ui/text';
import { weatherIcon } from '../weather-wardrobe';
import type { StandEvent, Weather } from './logic';

const line = (color: number, width = 4) => ({ width, color, join: 'round' as const, cap: 'round' as const });
const GLASS = 0x8fb8c8;

/** A cup of lemonade with a straw, about 44 wide and 56 tall, centered on (0, 0). `full: false` is just the glass. */
export function cupArt(full = true): Container {
  const c = new Container();
  const g = new Graphics();
  g.moveTo(8, -26).lineTo(15, -46).stroke(line(swatch.red.fill, 5));
  g.poly([-20, -24, 20, -24, 15, 26, -15, 26]).fill({ color: 0xffffff, alpha: 0.85 }).stroke(line(GLASS, 3.5));
  if (full) {
    g.poly([-18, -14, 18, -14, 14.2, 24, -14.2, 24]).fill(swatch.yellow.fill);
    g.ellipse(0, -14, 18, 3.5).fill(swatch.yellow.light);
    g.ellipse(-8, 6, 3, 9).fill({ color: 0xffffff, alpha: 0.55 });
  }
  // A lemon slice on the rim.
  g.circle(-18, -24, 9).fill(swatch.yellow.fill).stroke(line(swatch.yellow.line, 2.5));
  for (let i = 0; i < 3; i++) {
    const a = (i * Math.PI) / 3;
    g.moveTo(-18 - Math.cos(a) * 7, -24 - Math.sin(a) * 7).lineTo(-18 + Math.cos(a) * 7, -24 + Math.sin(a) * 7);
  }
  g.stroke(line(swatch.yellow.light, 1.6));
  c.addChild(g);
  return c;
}

/** A small picture of the weather. The sun and rain are the Weather Wardrobe pictures; the clouds are just clouds. */
export function forecastIcon(w: Weather, size = 80): Container {
  const c = new Container();
  if (w === 'cloudy') {
    const s = size / 60;
    const g = new Graphics();
    puffs(g, [[-22 * s, 6 * s, 17 * s], [0, -8 * s, 24 * s], [24 * s, 6 * s, 17 * s], [0, 10 * s, 19 * s]], swatch.white.light, swatch.white.line, 4 * s);
    c.addChild(g);
  } else {
    c.addChild(weatherIcon(w, size));
  }
  return c;
}

/** A ferry arriving with visitors, or a sleepy quiet day. */
export function eventIcon(e: StandEvent, size = 80): Container {
  const c = new Container();
  const s = size / 80;
  const g = new Graphics();
  if (e === 'ferry') {
    g.poly([-34, 4, 34, 4, 24, 26, -24, 26]).fill(swatch.red.fill).stroke(line(swatch.red.line, 4));
    g.roundRect(-18, -18, 36, 24, 5).fill(0xffffff).stroke(line(swatch.white.line, 3));
    g.rect(-5, -34, 10, 16).fill(swatch.yellow.fill).stroke(line(swatch.yellow.line, 3));
    for (const x of [-9, 9]) g.circle(x, -6, 4).fill(swatch.blue.light);
    g.moveTo(-40, 32).quadraticCurveTo(-20, 22, 0, 32).quadraticCurveTo(20, 42, 40, 32).stroke(line(swatch.blue.fill, 4));
    c.addChild(g);
  } else {
    // A sleepy bubble: "z z z" on a pale cloud.
    puffs(g, [[-22, 4, 16], [0, -6, 22], [22, 4, 16]], swatch.purple.light, swatch.purple.line, 4);
    c.addChild(g);
    const z = label('zzz', 30, swatch.purple.line);
    z.y = -2;
    c.addChild(z);
  }
  c.scale.set(s);
  return c;
}

/** A glass pitcher with a lemon, for the hub icon and the sticker. About 120 wide and 150 tall, feet on (0, 0). */
export function pitcherArt(): Container {
  const c = new Container();
  const g = new Graphics();
  g.roundRect(46, -104, 34, 74, 16).stroke(line(GLASS, 9));
  g.poly([-44, -140, 44, -140, 36, 0, -36, 0]).fill({ color: 0xffffff, alpha: 0.88 }).stroke(line(GLASS, 5));
  g.poly([-41, -96, 41, -96, 35, -4, -35, -4]).fill(swatch.yellow.fill);
  g.ellipse(0, -96, 41, 7).fill(swatch.yellow.light);
  g.ellipse(-20, -50, 5, 20).fill({ color: 0xffffff, alpha: 0.5 });
  g.poly([-52, -142, -34, -150, 34, -150, 52, -142, 44, -138, -44, -138]).fill(0xffffff).stroke(line(GLASS, 4));
  c.addChild(g);
  for (const [x, y] of [[-14, -62], [14, -40], [-4, -22]]) c.addChild(new Graphics().circle(x, y, 6).fill({ color: 0xffffff, alpha: 0.7 }));
  return c;
}

/** The little striped stand used by the hub icon. About 220 wide and 200 tall, feet on (0, 0). */
export function miniStand(): Container {
  const c = new Container();
  const g = new Graphics();
  for (let i = 0; i < 4; i++) g.rect(-100 + i * 50, -200, 50, 34).fill(i % 2 ? 0xffffff : swatch.yellow.fill);
  g.rect(-100, -200, 200, 34).stroke(line(swatch.yellow.line, 4));
  g.rect(-96, -166, 10, 120).rect(86, -166, 10, 120).fill(wood.fill);
  g.roundRect(-110, -60, 220, 34, 10).fill(wood.fill).stroke(line(wood.line, 5));
  g.rect(-100, -26, 200, 26).fill(wood.light).stroke(line(wood.line, 4));
  c.addChild(g);
  const cup = cupArt();
  cup.scale.set(1.3);
  cup.position.set(-30, -92);
  const cup2 = cupArt();
  cup2.scale.set(1.3);
  cup2.position.set(34, -92);
  c.addChild(cup, cup2);
  return c;
}

/** A chalkboard-style speech sign: a small round-cornered board. */
export function boardArt(w: number, h: number): Graphics {
  return new Graphics().roundRect(-w / 2, -h / 2 + 5, w, h, 18).fill(wood.line).roundRect(-w / 2, -h / 2, w, h, 18).fill(0xfffaf0).stroke(line(wood.line, 5));
}

/** A lightbulb for the Help button. */
export function bulbArt(): Container {
  const c = new Container();
  const g = new Graphics();
  g.circle(0, -6, 22).fill(swatch.yellow.light).stroke(line(ink, 4));
  g.poly([-11, 12, 11, 12, 8, 30, -8, 30]).fill(0xe9e9f0).stroke(line(ink, 4));
  g.moveTo(-7, -2).quadraticCurveTo(0, -14, 7, -2).stroke(line(swatch.yellow.line, 3));
  c.addChild(g);
  return c;
}
