import { Container, Graphics } from 'pixi.js';
import { ink, swatch, wood } from '../../art/palette';
import { Rng } from '../../engine/random';
import {
  arrivesCooked,
  melts,
  type Bin,
  type Box,
  type Guess,
  type SortDiscovery,
  type Substance,
} from './logic';

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
  lolly: swatch.pink,
  shell: { fill: swatch.orange.light, line: swatch.brown.line, light: swatch.white.fill },
  bread: { fill: swatch.white.fill, line: wood.line, light: wood.light },
  kernel: { fill: swatch.yellow.fill, line: swatch.orange.line, light: swatch.yellow.light },
};

/** A thing in its hard form, about 100 units across with its base on (0, 0). */
export function solidArt(s: Substance, size = 100): Graphics {
  const g = new Graphics();
  const c = COLORS[s];
  const k = size / 100;
  switch (s) {
    case 'ice':
      g.roundRect(-40 * k, -80 * k, 80 * k, 80 * k, 12 * k)
        .fill({ color: c.fill, alpha: 0.9 })
        .stroke({ width: 5 * k, color: c.line });
      g.roundRect(-28 * k, -70 * k, 14 * k, 30 * k, 6 * k).fill({ color: c.light, alpha: 0.9 });
      break;
    case 'butter':
      g.roundRect(-46 * k, -60 * k, 92 * k, 60 * k, 8 * k)
        .fill(c.fill)
        .stroke({ width: 5 * k, color: c.line });
      g.roundRect(-46 * k, -60 * k, 92 * k, 14 * k, 6 * k).fill(c.light);
      break;
    case 'chocolate':
      g.roundRect(-44 * k, -56 * k, 88 * k, 56 * k, 8 * k)
        .fill(c.fill)
        .stroke({ width: 5 * k, color: c.line });
      g.moveTo(0, -56 * k)
        .lineTo(0, 0)
        .moveTo(-44 * k, -28 * k)
        .lineTo(44 * k, -28 * k)
        .stroke({ width: 4 * k, color: c.line });
      for (const [x, y] of [
        [-22, -42],
        [22, -42],
        [-22, -14],
        [22, -14],
      ])
        g.roundRect((x - 14) * k, (y - 8) * k, 28 * k, 16 * k, 4 * k).fill(c.light);
      break;
    case 'stone':
      g.ellipse(0, -34 * k, 46 * k, 34 * k)
        .fill(c.fill)
        .stroke({ width: 5 * k, color: c.line });
      g.ellipse(-14 * k, -46 * k, 14 * k, 8 * k).fill({ color: c.light, alpha: 0.8 });
      break;
    case 'spoon':
      g.ellipse(0, -72 * k, 26 * k, 20 * k)
        .fill(c.fill)
        .stroke({ width: 5 * k, color: c.line });
      g.roundRect(-8 * k, -56 * k, 16 * k, 56 * k, 8 * k)
        .fill(c.fill)
        .stroke({ width: 5 * k, color: c.line });
      g.ellipse(0, -72 * k, 14 * k, 9 * k).fill({ color: c.light, alpha: 0.8 });
      break;
    case 'lolly':
      g.roundRect(-6 * k, -30 * k, 12 * k, 30 * k, 5 * k)
        .fill(wood.light)
        .stroke({ width: 4 * k, color: wood.line });
      g.roundRect(-28 * k, -96 * k, 56 * k, 72 * k, 24 * k)
        .fill(c.fill)
        .stroke({ width: 5 * k, color: c.line });
      g.roundRect(-16 * k, -84 * k, 10 * k, 34 * k, 5 * k).fill({ color: c.light, alpha: 0.9 });
      break;
    case 'shell':
      g.moveTo(-12 * k, 0)
        .lineTo(-46 * k, -34 * k)
        .quadraticCurveTo(-42 * k, -78 * k, 0, -80 * k)
        .quadraticCurveTo(42 * k, -78 * k, 46 * k, -34 * k)
        .lineTo(12 * k, 0)
        .closePath()
        .fill(c.fill)
        .stroke({ width: 5 * k, color: c.line, join: 'round' });
      for (const x of [-30, -15, 0, 15, 30])
        g.moveTo(x * 0.25 * k, -8 * k).lineTo(x * k, (-70 + Math.abs(x) * 0.5) * k);
      g.stroke({ width: 3 * k, color: c.line, alpha: 0.7, cap: 'round' });
      break;
    case 'bread':
      slice(g, k)
        .fill(c.fill)
        .stroke({ width: 6 * k, color: c.light, join: 'round' });
      break;
    case 'kernel':
      g.moveTo(0, 0)
        .quadraticCurveTo(-26 * k, -6 * k, -22 * k, -34 * k)
        .quadraticCurveTo(0, -56 * k, 22 * k, -34 * k)
        .quadraticCurveTo(26 * k, -6 * k, 0, 0)
        .fill(c.fill)
        .stroke({ width: 5 * k, color: c.line, join: 'round' });
      g.ellipse(-6 * k, -30 * k, 7 * k, 10 * k).fill({ color: c.light, alpha: 0.9 });
      break;
  }
  return g;
}

/** The outline of a slice of bread, base on (0, 0), about 90 units wide and 86 tall. */
function slice(g: Graphics, k: number): Graphics {
  return g
    .moveTo(-36 * k, 0)
    .lineTo(-36 * k, -52 * k)
    .quadraticCurveTo(-52 * k, -62 * k, -42 * k, -78 * k)
    .quadraticCurveTo(0, -96 * k, 42 * k, -78 * k)
    .quadraticCurveTo(52 * k, -62 * k, 36 * k, -52 * k)
    .lineTo(36 * k, 0)
    .closePath();
}

/**
 * A thing that arrives already changed for good, base on (0, 0): a slice of toast, or a popped kernel. Only the changed
 * thing is drawn: nothing glows, smokes or steams, and nothing shows how it was made.
 */
export function cookedArt(s: Substance, size = 100): Graphics {
  const g = new Graphics();
  const k = size / 100;
  if (s === 'kernel') {
    // A fluffy white burst with the kernel's golden husk at its foot.
    g.ellipse(0, -8 * k, 16 * k, 10 * k)
      .fill(swatch.yellow.fill)
      .stroke({ width: 4 * k, color: swatch.orange.line });
    for (const [x, y, r] of [
      [-26, -36, 24],
      [24, -34, 26],
      [0, -62, 28],
      [-2, -30, 22],
    ])
      g.circle(x * k, y * k, r * k)
        .fill(swatch.white.fill)
        .stroke({ width: 4 * k, color: wood.line, alpha: 0.6 });
    for (const [x, y, r] of [
      [-26, -36, 20],
      [24, -34, 22],
      [0, -62, 24],
      [-2, -30, 20],
    ])
      g.circle(x * k, y * k, r * k).fill(swatch.white.fill);
    return g;
  }
  slice(g, k)
    .fill(wood.fill)
    .stroke({ width: 6 * k, color: wood.line, join: 'round' });
  g.roundRect(-22 * k, -66 * k, 44 * k, 48 * k, 14 * k).fill({ color: wood.line, alpha: 0.28 });
  return g;
}

/** The thing's melted form: a puddle at (0, 0), about 110 units wide. Only things that melt have one. */
export function puddleArt(s: Substance, size = 100): Graphics {
  const g = new Graphics();
  const c = COLORS[s];
  const k = size / 100;
  g.ellipse(0, 0, 56 * k, 20 * k)
    .fill({ color: c.fill, alpha: s === 'ice' ? 0.75 : 1 })
    .stroke({ width: 4 * k, color: c.line, alpha: 0.8 });
  g.ellipse(-18 * k, -5 * k, 16 * k, 5 * k).fill({ color: c.light, alpha: 0.7 });
  // The lolly's stick is left lying in its puddle.
  if (s === 'lolly')
    g.roundRect(10 * k, -8 * k, 40 * k, 10 * k, 5 * k)
      .fill(wood.light)
      .stroke({ width: 3 * k, color: wood.line });
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

/**
 * A prediction card's picture, about 140 units tall and centred on (0, 0): this thing above an arrow to what the guess says
 * the sun will do, its puddle (it melts) or the same thing again (it stays). A picture of the thing on the table, never words.
 */
export function guessArt(s: Substance, guess: Guess): Container {
  const c = new Container();
  const from = solidArt(s, 56);
  from.y = -14;
  const arrow = new Graphics()
    .moveTo(0, -6)
    .lineTo(0, 12)
    .moveTo(-9, 4)
    .lineTo(0, 14)
    .lineTo(9, 4)
    .stroke({ width: 6, color: ink, cap: 'round', join: 'round' });
  // A thing that never melts has no puddle of its own, so the "it melts" card shows a plain puddle in its colour.
  const to = guess === 'stays' ? solidArt(s, 56) : melts(s) ? puddleArt(s, 85) : plainPuddle(s, 85);
  to.y = guess === 'stays' ? 70 : 46;
  c.addChild(from, arrow, to);
  return c;
}

function plainPuddle(s: Substance, size: number): Graphics {
  const c = COLORS[s];
  const k = size / 100;
  return new Graphics()
    .ellipse(0, 0, 56 * k, 20 * k)
    .fill(c.fill)
    .stroke({ width: 4 * k, color: c.line, alpha: 0.8 });
}

/**
 * A bin's sign, about 100 units wide and centred on (0, 0). Goes back: a round arrow that returns to its start.
 * Can't go back: a straight arrow that ends at a short bar. Pictures, never words.
 */
export function binArt(bin: Bin): Graphics {
  const g = new Graphics();
  if (bin === 'back') {
    // Most of a circle, clockwise from the upper right round to the top, with the head closing on where it began.
    const r = 26;
    const [from, to] = [-Math.PI * 0.25, Math.PI * 1.42];
    g.arc(0, 0, r, from, to).stroke({ width: 8, color: swatch.blue.line, cap: 'round' });
    const [tx, ty] = [Math.cos(to) * r, Math.sin(to) * r];
    // The way the line is travelling at its end; the head's two barbs lean back from it.
    const heading = to + Math.PI / 2;
    for (const lean of [-0.6, 0.6]) {
      const a = heading + Math.PI + lean;
      g.moveTo(tx + Math.cos(a) * 18, ty + Math.sin(a) * 18).lineTo(tx, ty);
    }
    g.stroke({ width: 8, color: swatch.blue.line, cap: 'round', join: 'round' });
    return g;
  }
  g.moveTo(-34, 0)
    .lineTo(18, 0)
    .moveTo(4, -14)
    .lineTo(18, 0)
    .lineTo(4, 14)
    .stroke({ width: 8, color: swatch.orange.line, cap: 'round', join: 'round' });
  g.moveTo(32, -20).lineTo(32, 20).stroke({ width: 9, color: swatch.orange.line, cap: 'round' });
  return g;
}

/** The small picture a bin keeps of a thing filed in it: the thing as it ended, hard again or still changed. */
export function filedArt(s: Substance): Graphics {
  return arrivesCooked(s) ? cookedArt(s, 44) : solidArt(s, 44);
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

/**
 * The journal card: the thing hard beside its puddle, the stone and spoon side by side for the ones that stay, a puddle
 * and its hard block under the round arrow for goes back, toast and a popped kernel for can't go back.
 */
export function meltJournalPicture(key: Substance | 'stays' | SortDiscovery): Container {
  const c = new Container();
  if (key === 'goes-back') {
    const sign = binArt('back');
    sign.scale.set(0.6);
    sign.y = -48;
    const puddle = puddleArt('butter', 62);
    puddle.position.set(-36, 30);
    const block = solidArt('butter', 62);
    block.position.set(36, 36);
    c.addChild(sign, puddle, block);
    return c;
  }
  if (key === 'cant-go-back') {
    const toast = cookedArt('bread', 74);
    toast.position.set(-36, 36);
    const popped = cookedArt('kernel', 66);
    popped.position.set(40, 36);
    c.addChild(toast, popped);
    return c;
  }
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
