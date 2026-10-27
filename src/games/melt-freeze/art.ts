import { Container, Graphics } from 'pixi.js';
import { ink, swatch, wood } from '../../art/palette';
import { Rng } from '../../engine/random';
import type { Box, Substance } from './logic';

/** A big warm sun, about 110 units across, centred on (0, 0). */
export function sunArt(): Graphics {
  const g = new Graphics();
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    g.moveTo(Math.cos(a) * 40, Math.sin(a) * 40).lineTo(Math.cos(a) * 56, Math.sin(a) * 56);
  }
  g.stroke({ width: 10, color: swatch.orange.fill, cap: 'round' });
  g.circle(0, 0, 36).fill(swatch.yellow.fill).stroke({ width: 5, color: swatch.orange.line });
  g.circle(-12, -4, 4).fill(ink).circle(12, -4, 4).fill(ink);
  g.moveTo(-12, 10).quadraticCurveTo(0, 20, 12, 10).stroke({ width: 4, color: ink, cap: 'round' });
  return g;
}

/** A cool snowflake, about 110 units across, centred on (0, 0). */
export function snowArt(): Graphics {
  const g = new Graphics();
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    const [dx, dy] = [Math.cos(a), Math.sin(a)];
    g.moveTo(0, 0).lineTo(dx * 52, dy * 52);
    for (const s of [-1, 1]) {
      const b = a + s * 0.5;
      g.moveTo(dx * 30, dy * 30).lineTo(dx * 30 + Math.cos(b) * 16, dy * 30 + Math.sin(b) * 16);
    }
  }
  g.stroke({ width: 9, color: swatch.blue.fill, cap: 'round' });
  g.circle(0, 0, 10).fill(swatch.white.fill).stroke({ width: 4, color: swatch.blue.line });
  return g;
}

const COLORS: Record<Substance, { fill: number; line: number; light: number }> = {
  ice: { fill: 0xd6f1ff, line: swatch.blue.line, light: swatch.white.fill },
  butter: { fill: swatch.yellow.fill, line: swatch.yellow.line, light: swatch.yellow.light },
  chocolate: { fill: 0x7a4a2a, line: 0x55301a, light: 0xa8704a },
  stone: { fill: 0xa9a9b4, line: 0x6f6f7c, light: 0xd3d3da },
  spoon: { fill: wood.fill, line: wood.line, light: wood.light },
};

/** A thing in its hard form, about 100 units across with its base on (0, 0). */
export function solidArt(s: Substance, size = 100): Graphics {
  const g = new Graphics();
  const c = COLORS[s];
  const k = size / 100;
  switch (s) {
    case 'ice':
      g.roundRect(-40 * k, -80 * k, 80 * k, 80 * k, 12 * k).fill({ color: c.fill, alpha: 0.9 }).stroke({ width: 5 * k, color: c.line });
      g.roundRect(-28 * k, -70 * k, 14 * k, 30 * k, 6 * k).fill({ color: c.light, alpha: 0.9 });
      break;
    case 'butter':
      g.roundRect(-46 * k, -60 * k, 92 * k, 60 * k, 8 * k).fill(c.fill).stroke({ width: 5 * k, color: c.line });
      g.roundRect(-46 * k, -60 * k, 92 * k, 14 * k, 6 * k).fill(c.light);
      break;
    case 'chocolate':
      g.roundRect(-44 * k, -56 * k, 88 * k, 56 * k, 8 * k).fill(c.fill).stroke({ width: 5 * k, color: c.line });
      g.moveTo(0, -56 * k).lineTo(0, 0).moveTo(-44 * k, -28 * k).lineTo(44 * k, -28 * k).stroke({ width: 4 * k, color: c.line });
      for (const [x, y] of [[-22, -42], [22, -42], [-22, -14], [22, -14]]) g.roundRect((x - 14) * k, (y - 8) * k, 28 * k, 16 * k, 4 * k).fill(c.light);
      break;
    case 'stone':
      g.ellipse(0, -34 * k, 46 * k, 34 * k).fill(c.fill).stroke({ width: 5 * k, color: c.line });
      g.ellipse(-14 * k, -46 * k, 14 * k, 8 * k).fill({ color: c.light, alpha: 0.8 });
      break;
    case 'spoon':
      g.ellipse(0, -72 * k, 26 * k, 20 * k).fill(c.fill).stroke({ width: 5 * k, color: c.line });
      g.roundRect(-8 * k, -56 * k, 16 * k, 56 * k, 8 * k).fill(c.fill).stroke({ width: 5 * k, color: c.line });
      g.ellipse(0, -72 * k, 14 * k, 9 * k).fill({ color: c.light, alpha: 0.8 });
      break;
  }
  return g;
}

/** The thing's melted form: a puddle at (0, 0), about 110 units wide. Only things that melt have one. */
export function puddleArt(s: Substance, size = 100): Graphics {
  const g = new Graphics();
  const c = COLORS[s];
  const k = size / 100;
  g.ellipse(0, 0, 56 * k, 20 * k).fill({ color: c.fill, alpha: s === 'ice' ? 0.75 : 1 }).stroke({ width: 4 * k, color: c.line, alpha: 0.8 });
  g.ellipse(-18 * k, -5 * k, 16 * k, 5 * k).fill({ color: c.light, alpha: 0.7 });
  return g;
}

/** The faint outline of the hard thing above its puddle, so a puddle is always seen as that thing's puddle. */
export function ghostArt(s: Substance, size = 100): Graphics {
  const g = solidArt(s, size);
  g.alpha = 0.22;
  return g;
}

/** A rounded tabletop with a front edge. */
export function drawTable(g: Graphics, box: Box) {
  g.clear().roundRect(box.x, box.y, box.w, box.h, 28).fill(wood.light).stroke({ width: 6, color: wood.line });
  g.roundRect(box.x + 10, box.y + box.h - 44, box.w - 20, 34, 14).fill(wood.fill);
}

/** A request card's picture: the thing hard or melted, with a small sun or snowflake badge for the tool the picture needs. */
export function targetArt(s: Substance, melted: boolean): Container {
  const c = new Container();
  const pic = melted ? puddleArt(s, 80) : solidArt(s, 80);
  pic.y = melted ? 20 : 36;
  c.addChild(pic);
  if (melted) {
    const ghost = ghostArt(s, 80);
    ghost.y = 20;
    c.addChild(ghost);
  }
  return c;
}

/** A cube beside a puddle: the hub icon and sticker. */
export function iconArt(seed = 1): Container {
  const rng = new Rng(seed);
  const c = new Container();
  const thing = rng.pick(['ice', 'butter', 'chocolate'] as const);
  const puddle = puddleArt(thing, 70);
  puddle.position.set(26, -4);
  const cube = solidArt(thing, 70);
  cube.position.set(-30, 0);
  const sun = sunArt();
  sun.scale.set(0.42);
  sun.position.set(34, -70);
  c.addChild(puddle, cube, sun);
  return c;
}

/** The journal card: the thing hard beside its puddle, or the stone and spoon side by side for the ones that stay. */
export function meltJournalPicture(key: Substance | 'stays'): Container {
  const c = new Container();
  if (key === 'stays') {
    const stone = solidArt('stone', 80);
    stone.position.set(-34, 30);
    const spoon = solidArt('spoon', 80);
    spoon.position.set(36, 30);
    c.addChild(stone, spoon);
    return c;
  }
  const puddle = puddleArt(key, 80);
  puddle.position.set(30, 26);
  const cube = solidArt(key, 80);
  cube.position.set(-30, 30);
  c.addChild(puddle, cube);
  return c;
}
