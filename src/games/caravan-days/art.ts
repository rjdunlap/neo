/** Caravan Days' code-drawn pieces: the camel that kneels, bales, landmark oases, the home tent, the city gate, suns, the waterskin, flags, Go, icon and sticker. */
import { Container, Graphics, Text } from 'pixi.js';
import { cream, ink, shadow, swatch, type ColorName } from '../../art/palette';
import { finish } from '../../ui/buttons';
import { SKIN, type Good, type Landmark } from './logic';

const line = (color: number, width = 5) => ({ width, color, join: 'round' as const, cap: 'round' as const });
export const SAND = { fill: 0xf2d9a4, line: 0xc99d58, dark: 0xd9b472 };
export const CAMEL_COLORS = { fill: 0xd9a66b, line: 0x8f6134, dark: 0xb9834f, light: 0xeec48c };
const WATER = { fill: 0x8fd0ea, line: 0x4fa3c7 };
const PALM = { trunk: 0xa0683a, leaf: 0x5fae4e };
const ROCK = { fill: 0xd2694d, line: 0x9c3f2b };
const TILE = { fill: 0x5aa6d8, line: 0x2f6f9e, light: 0x9fd3f2 };
const FLAG = { fill: 0xf26d6d, line: 0xb03a3a };

function label(text: string, size = 30, fill: number = ink): Text {
  const t = new Text({ text, style: { fontFamily: 'Nunito, sans-serif', fontSize: size, fontWeight: '800', fill, align: 'center' } });
  t.anchor.set(0.5);
  t.eventMode = 'none';
  return t;
}

// ——— The camel ———

/**
 * A tan camel with two humps, a long neck that dips to drink, a sleepy eye with long lashes, and legs that fold under it
 * when it kneels. Origin at the ground under its chest, facing right; `scale` sets its size (1 is 260 × 200 standing).
 */
export class Camel extends Container {
  private readonly legs: Graphics[] = [];
  private readonly body = new Container();
  private readonly neck = new Container();
  private readonly bells = new Graphics();
  /** Bales ride here, above the humps. */
  readonly load = new Container();
  /** 0 standing, 1 kneeling. */
  fold = 0;
  /** Neck dip, 0 up to 1 at the water. */
  dip = 0;
  /** Walking sway. */
  sway = 0;

  constructor() {
    super();
    // Passive: the camel itself takes no touch (the scene's own tap area sits under it), but bales on its back do.
    this.eventMode = 'passive';
    const ground = new Graphics().ellipse(0, 6, 110, 18).fill({ color: shadow, alpha: 0.16 });
    this.addChild(ground);
    for (let i = 0; i < 4; i++) {
      const leg = new Graphics();
      leg.roundRect(-13, 0, 26, 78, 10).fill(CAMEL_COLORS.dark).stroke(line(CAMEL_COLORS.line, 4));
      leg.roundRect(-16, 64, 32, 18, 8).fill(CAMEL_COLORS.line);
      this.legs.push(leg);
      this.addChild(leg);
    }
    const torso = new Graphics();
    torso.roundRect(-96, -70, 192, 84, 40).fill(CAMEL_COLORS.fill).stroke(line(CAMEL_COLORS.line, 5));
    torso.ellipse(-44, -82, 42, 36).fill(CAMEL_COLORS.fill).stroke(line(CAMEL_COLORS.line, 5));
    torso.ellipse(30, -84, 42, 38).fill(CAMEL_COLORS.fill).stroke(line(CAMEL_COLORS.line, 5));
    torso.roundRect(-96, -70, 192, 84, 40).fill(CAMEL_COLORS.fill);
    torso.ellipse(-44, -78, 36, 26).fill(CAMEL_COLORS.light);
    torso.ellipse(30, -80, 36, 28).fill(CAMEL_COLORS.light);
    const tail = new Graphics().moveTo(-96, -50).quadraticCurveTo(-120, -40, -118, -12).stroke(line(CAMEL_COLORS.line, 6));
    tail.circle(-118, -10, 9).fill(CAMEL_COLORS.line);
    this.body.addChild(torso, tail);
    // The neck rises from the chest and carries the head; it pivots at the chest.
    const neck = new Graphics();
    neck.moveTo(0, 0).quadraticCurveTo(26, -60, 28, -110).stroke(line(CAMEL_COLORS.fill, 34));
    neck.moveTo(0, 0).quadraticCurveTo(26, -60, 28, -110).stroke({ width: 44, color: CAMEL_COLORS.line, cap: 'round', join: 'round', alpha: 0 });
    const head = new Graphics();
    head.roundRect(10, -140, 72, 44, 20).fill(CAMEL_COLORS.fill).stroke(line(CAMEL_COLORS.line, 5));
    head.ellipse(40, -112, 32, 20).fill(CAMEL_COLORS.light);
    head.circle(26, -148, 9).fill(CAMEL_COLORS.fill).stroke(line(CAMEL_COLORS.line, 4));
    head.circle(42, -150, 9).fill(CAMEL_COLORS.fill).stroke(line(CAMEL_COLORS.line, 4));
    head.circle(50, -126, 7).fill(ink);
    head.moveTo(44, -134).lineTo(40, -140).moveTo(52, -135).lineTo(52, -142).moveTo(58, -132).lineTo(63, -138).stroke(line(ink, 3));
    head.ellipse(76, -112, 7, 5).fill(CAMEL_COLORS.line);
    head.moveTo(60, -104).quadraticCurveTo(70, -98, 80, -104).stroke(line(CAMEL_COLORS.line, 3));
    this.bells.circle(14, -72, 8).fill(swatch.yellow.fill).stroke(line(swatch.yellow.line, 3));
    this.bells.circle(26, -60, 8).fill(swatch.yellow.fill).stroke(line(swatch.yellow.line, 3));
    this.neck.addChild(neck, head, this.bells);
    this.neck.position.set(84, -40);
    this.body.addChild(this.neck);
    this.load.position.set(-8, -118);
    this.body.addChild(this.load);
    this.addChild(this.body);
    // Every drawn part lets a touch fall through; only a bale on the back (a child of `load`) takes one.
    for (const part of [ground, ...this.legs, torso, tail, neck, head, this.bells]) part.eventMode = 'none';
    for (const group of [this.body, this.neck, this.load]) group.eventMode = 'passive';
    this.pose();
  }

  /** Lay the parts out for the current fold, dip and sway. */
  pose() {
    const f = this.fold;
    const legLength = 1 - 0.8 * f;
    const xs = [-70, -46, 36, 62];
    this.legs.forEach((leg, i) => {
      const step = this.sway * (i % 2 ? 1 : -1) * 10;
      leg.position.set(xs[i] + step, -78 * legLength - 2);
      leg.scale.y = legLength;
      leg.rotation = this.sway * (i % 2 ? 0.18 : -0.18);
    });
    this.body.position.set(0, -78 * legLength + Math.sin(this.sway * Math.PI) * -4);
    this.body.rotation = f * 0.04;
    this.neck.rotation = this.dip * 1.15;
  }
}

/** A tied bale of goods. */
export function baleArt(color: ColorName, size = 110): Graphics {
  const sw = swatch[color];
  const g = new Graphics();
  const w = size * 0.8;
  const h = size * 0.62;
  g.ellipse(0, h * 0.5, w * 0.5, 10).fill({ color: shadow, alpha: 0.14 });
  g.roundRect(-w / 2, -h / 2, w, h, 16).fill(sw.fill).stroke(line(sw.line, 5));
  g.moveTo(-w / 2, -h * 0.15).lineTo(w / 2, -h * 0.15).moveTo(-w / 2, h * 0.15).lineTo(w / 2, h * 0.15).stroke(line(sw.line, 3));
  g.moveTo(-w * 0.2, -h / 2).lineTo(-w * 0.2, h / 2).moveTo(w * 0.2, -h / 2).lineTo(w * 0.2, h / 2).stroke(line(sw.line, 3));
  g.roundRect(-w * 0.28, -h * 0.05, w * 0.56, h * 0.1, 4).fill(sw.light);
  return g;
}

// ——— Places ———

/** A pool of water with its landmark above: a palm, a red rock or a little spring. */
export function oasisArt(landmark: Landmark, size = 120, glow = false): Container {
  const c = new Container();
  const g = new Graphics();
  const r = size / 2;
  if (glow) g.ellipse(0, r * 0.35, r * 1.15, r * 0.6).fill({ color: swatch.yellow.fill, alpha: 0.55 });
  g.ellipse(0, r * 0.35, r * 0.95, r * 0.42).fill(WATER.fill).stroke(line(WATER.line, 5));
  g.ellipse(-r * 0.3, r * 0.28, r * 0.3, r * 0.1).fill({ color: 0xffffff, alpha: 0.5 });
  c.addChild(g);
  const mark = new Graphics();
  if (landmark === 'palm') {
    mark.moveTo(r * 0.25, r * 0.2).quadraticCurveTo(r * 0.3, -r * 0.4, r * 0.1, -r * 0.9).stroke(line(PALM.trunk, 10));
    for (const a of [-1.1, -0.6, -0.1, 0.4, 0.9]) {
      const x = r * 0.1 + Math.cos(a - 1.2) * r * 0.55;
      const y = -r * 0.9 + Math.sin(a - 1.2) * r * 0.45 + r * 0.15;
      mark.moveTo(r * 0.1, -r * 0.9).quadraticCurveTo((r * 0.1 + x) / 2, y - r * 0.25, x, y).stroke(line(PALM.leaf, 9));
    }
  } else if (landmark === 'rock') {
    mark.moveTo(-r * 0.55, r * 0.05).lineTo(-r * 0.35, -r * 0.75).lineTo(-r * 0.05, -r * 0.5).lineTo(r * 0.2, -r * 0.95).lineTo(r * 0.55, r * 0.05).closePath().fill(ROCK.fill).stroke(line(ROCK.line, 5));
    mark.moveTo(-r * 0.3, -r * 0.2).lineTo(-r * 0.05, -r * 0.5).stroke(line(0xffffff, 3));
  } else {
    mark.roundRect(-r * 0.45, -r * 0.5, r * 0.9, r * 0.45, 12).fill(SAND.dark).stroke(line(SAND.line, 4));
    mark.moveTo(0, -r * 0.5).quadraticCurveTo(-r * 0.2, -r * 0.95, 0, -r * 1.05).quadraticCurveTo(r * 0.2, -r * 0.95, 0, -r * 0.5).fill(WATER.fill).stroke(line(WATER.line, 4));
    mark.circle(-r * 0.3, -r * 0.85, 5).circle(r * 0.32, -r * 0.8, 5).fill(WATER.fill);
  }
  c.addChild(mark);
  return c;
}

/** The home tent the caravan sets out from. */
export function homeArt(size = 120): Graphics {
  const g = new Graphics();
  const r = size / 2;
  g.ellipse(0, r * 0.4, r * 0.9, r * 0.2).fill({ color: shadow, alpha: 0.12 });
  g.moveTo(-r * 0.9, r * 0.35).lineTo(0, -r * 0.8).lineTo(r * 0.9, r * 0.35).closePath().fill(swatch.orange.light).stroke(line(swatch.orange.line, 5));
  g.moveTo(-r * 0.3, r * 0.35).lineTo(0, -r * 0.2).lineTo(r * 0.3, r * 0.35).closePath().fill(swatch.orange.line);
  g.moveTo(0, -r * 0.8).lineTo(0, -r * 1.05).stroke(line(swatch.orange.line, 4));
  g.moveTo(0, -r * 1.05).lineTo(r * 0.3, -r * 0.95).lineTo(0, -r * 0.85).closePath().fill(FLAG.fill);
  return g;
}

/** The blue-tiled city wall with its gate, open or shut. */
export function cityArt(size = 120, open = false): Graphics {
  const g = new Graphics();
  const r = size / 2;
  g.ellipse(0, r * 0.45, r, r * 0.2).fill({ color: shadow, alpha: 0.12 });
  g.roundRect(-r, -r * 0.5, r * 2, r * 0.95, 10).fill(TILE.fill).stroke(line(TILE.line, 5));
  for (let i = 0; i < 5; i++) g.rect(-r + i * r * 0.4 + r * 0.08, -r * 0.72, r * 0.24, r * 0.26).fill(TILE.fill).stroke(line(TILE.line, 4));
  for (let y = 0; y < 3; y++) for (let x = 0; x < 4; x++) g.rect(-r * 0.86 + x * r * 0.46 + (y % 2) * r * 0.2, -r * 0.38 + y * r * 0.26, r * 0.22, r * 0.14).fill(TILE.light);
  g.roundRect(-r * 0.3, -r * 0.1, r * 0.6, r * 0.55, 14).fill(open ? WATER.fill : TILE.line);
  if (open) {
    g.rect(-r * 0.3, -r * 0.1, r * 0.1, r * 0.55).fill(SAND.line);
    g.rect(r * 0.2, -r * 0.1, r * 0.1, r * 0.55).fill(SAND.line);
  } else {
    g.moveTo(0, -r * 0.1).lineTo(0, r * 0.45).stroke(line(TILE.light, 3));
  }
  g.moveTo(-r * 0.9, -r * 0.72).lineTo(-r * 0.9, -r * 1.05).stroke(line(TILE.line, 4));
  g.moveTo(-r * 0.9, -r * 1.05).lineTo(-r * 0.6, -r * 0.95).lineTo(-r * 0.9, -r * 0.85).closePath().fill(TILE.light);
  return g;
}

/** A sun for one day on the road. */
export function sunArt(size = 44, lit = true): Graphics {
  const g = new Graphics();
  const r = size / 2;
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    g.moveTo(Math.cos(a) * r * 0.7, Math.sin(a) * r * 0.7).lineTo(Math.cos(a) * r, Math.sin(a) * r).stroke(line(lit ? swatch.orange.fill : SAND.line, 4));
  }
  g.circle(0, 0, r * 0.55).fill(lit ? swatch.yellow.fill : SAND.dark).stroke(line(lit ? swatch.orange.fill : SAND.line, 4));
  return g;
}

/** The waterskin: a leather bag with `of` drop slots, `full` of them filled. */
export function skinArt(full: number, of = SKIN): Container {
  const c = new Container();
  c.eventMode = 'none';
  const g = new Graphics();
  const w = 60 + of * 46;
  g.roundRect(-w / 2, -32, w, 64, 26).fill(CAMEL_COLORS.dark).stroke(line(CAMEL_COLORS.line, 5));
  g.roundRect(-w / 2 - 14, -12, 20, 24, 8).fill(CAMEL_COLORS.line);
  c.addChild(g);
  for (let i = 0; i < of; i++) {
    const d = dropArt(i < full);
    d.position.set(-((of - 1) * 46) / 2 + i * 46, 2);
    c.addChild(d);
  }
  return c;
}

/** One day's water. */
export function dropArt(full = true): Graphics {
  const g = new Graphics();
  g.moveTo(0, -20).quadraticCurveTo(16, 4, 0, 18).quadraticCurveTo(-16, 4, 0, -20).fill(full ? WATER.fill : CAMEL_COLORS.light).stroke(line(full ? WATER.line : CAMEL_COLORS.line, 4));
  if (full) g.circle(-5, 2, 3).fill({ color: 0xffffff, alpha: 0.7 });
  return g;
}

/** A numbered flag planted on a stop. */
export function flagArt(n: number): Container {
  const c = new Container();
  c.eventMode = 'none';
  const g = new Graphics();
  g.moveTo(0, 0).lineTo(0, -70).stroke(line(ink, 5));
  g.moveTo(0, -70).lineTo(56, -54).lineTo(0, -34).closePath().fill(FLAG.fill).stroke(line(FLAG.line, 4));
  c.addChild(g);
  const t = label(String(n), 22, cream);
  t.position.set(20, -53);
  c.addChild(t);
  return c;
}

/** The Go button. */
export function goArt(w: number, h: number, live = true): Container {
  const c = new Container();
  const g = finish({ w, h, corner: 28 }, live ? swatch.green : swatch.white);
  c.addChild(g);
  const t = label('Go', 40, live ? cream : SAND.line);
  t.y = -2;
  c.addChild(t);
  c.alpha = live ? 1 : 0.8;
  return c;
}

// ——— Goods, bubbles, boards and loads (levels 4–5) ———

const GOOD_COLORS: Record<Good, { fill: number; line: number; light: number }> = {
  silk: { fill: 0xb57be0, line: 0x6f3fa0, light: 0xe2c6f6 },
  tea: { fill: 0x7a5236, line: 0x4a2f1c, light: 0xa9805f },
  salt: { fill: 0xffffff, line: 0x9aa7b4, light: 0xe6eef5 },
  glass: { fill: 0x6fcf8e, line: 0x2f8a4f, light: 0xc4f0d2 },
  paper: { fill: 0xfff4d6, line: 0xc9a86a, light: 0xffffff },
  beads: { fill: 0xf26d6d, line: 0xb03a3a, light: 0x5aa6d8 },
};

/** One pictured good, told apart by shape and colour: a rolled bolt, a pressed brick, a white block, a green jug, a roll, a string of beads. */
export function goodArt(good: Good, size = 90): Graphics {
  const c = GOOD_COLORS[good];
  const g = new Graphics();
  const r = size / 2;
  if (good === 'silk') {
    g.roundRect(-r * 0.85, -r * 0.4, r * 1.5, r * 0.8, r * 0.2).fill(c.fill).stroke(line(c.line, 4));
    g.ellipse(r * 0.65, 0, r * 0.22, r * 0.4).fill(c.light).stroke(line(c.line, 4));
    g.ellipse(r * 0.65, 0, r * 0.08, r * 0.15).fill(c.line);
    g.moveTo(-r * 0.6, -r * 0.4).quadraticCurveTo(-r * 0.4, 0, -r * 0.6, r * 0.4).stroke(line(c.light, 4));
  } else if (good === 'tea') {
    g.roundRect(-r * 0.8, -r * 0.55, r * 1.6, r * 1.1, 8).fill(c.fill).stroke(line(c.line, 4));
    g.roundRect(-r * 0.6, -r * 0.35, r * 1.2, r * 0.7, 6).stroke(line(c.light, 3));
    for (const [x, y] of [[-0.25, -0.1], [0.2, 0.1], [0, -0.05]]) g.ellipse(x * r, y * r, r * 0.16, r * 0.08).fill(c.light);
  } else if (good === 'salt') {
    g.moveTo(-r * 0.7, -r * 0.2).lineTo(-r * 0.2, -r * 0.6).lineTo(r * 0.75, -r * 0.6).lineTo(r * 0.75, r * 0.45).lineTo(r * 0.25, r * 0.7).lineTo(-r * 0.7, r * 0.7).closePath().fill(c.fill).stroke(line(c.line, 4));
    g.moveTo(-r * 0.7, -r * 0.2).lineTo(r * 0.25, -r * 0.2).lineTo(r * 0.75, -r * 0.6).moveTo(r * 0.25, -r * 0.2).lineTo(r * 0.25, r * 0.7).stroke(line(c.line, 3));
    g.moveTo(-r * 0.35, r * 0.1).lineTo(-r * 0.35, r * 0.4).moveTo(-r * 0.5, r * 0.25).lineTo(-r * 0.2, r * 0.25).stroke(line(TILE.fill, 3));
  } else if (good === 'glass') {
    g.moveTo(-r * 0.2, -r * 0.75).lineTo(r * 0.2, -r * 0.75).lineTo(r * 0.2, -r * 0.4).quadraticCurveTo(r * 0.75, -r * 0.2, r * 0.6, r * 0.45)
      .quadraticCurveTo(r * 0.5, r * 0.8, 0, r * 0.8).quadraticCurveTo(-r * 0.5, r * 0.8, -r * 0.6, r * 0.45).quadraticCurveTo(-r * 0.75, -r * 0.2, -r * 0.2, -r * 0.4).closePath()
      .fill({ color: c.fill, alpha: 0.9 }).stroke(line(c.line, 4));
    g.moveTo(r * 0.4, -r * 0.25).quadraticCurveTo(r * 0.95, -r * 0.1, r * 0.55, r * 0.3).stroke(line(c.line, 5));
    g.ellipse(-r * 0.25, r * 0.15, r * 0.1, r * 0.25).fill({ color: 0xffffff, alpha: 0.6 });
  } else if (good === 'paper') {
    g.roundRect(-r * 0.75, -r * 0.45, r * 1.4, r * 0.9, 6).fill(c.fill).stroke(line(c.line, 4));
    g.ellipse(-r * 0.75, 0, r * 0.18, r * 0.45).fill(c.light).stroke(line(c.line, 4));
    for (const y of [-0.2, 0, 0.2]) g.moveTo(-r * 0.4, y * r).lineTo(r * 0.45, y * r).stroke(line(c.line, 2));
  } else {
    g.circle(0, -r * 0.05, r * 0.6).stroke(line(c.line, 3));
    for (let i = 0; i < 9; i++) {
      const a = (i / 9) * Math.PI * 2;
      g.circle(Math.cos(a) * r * 0.6, -r * 0.05 + Math.sin(a) * r * 0.6, r * 0.17).fill(i % 2 ? c.light : c.fill).stroke(line(ink, 2));
    }
  }
  return g;
}

/** A card holding one good: an offer at an oasis (level 4). */
export function offerArt(good: Good, size = 120, picked = false): Container {
  const c = new Container();
  const g = new Graphics();
  g.roundRect(-size / 2, -size / 2, size, size, 22).fill(picked ? 0xfff6c8 : cream).stroke(line(picked ? swatch.yellow.line : SAND.line, picked ? 7 : 5));
  c.addChild(g, goodArt(good, size * 0.72));
  return c;
}

/** The speech bubble above a stop: the good that stop wants. */
export function bubbleArt(good: Good, size = 110): Container {
  const c = new Container();
  const g = new Graphics();
  const r = size / 2;
  g.roundRect(-r, -r, size, size * 0.86, 26).fill(0xffffff).stroke(line(SAND.line, 4));
  g.moveTo(-10, r * 0.7).lineTo(0, r).lineTo(12, r * 0.7).closePath().fill(0xffffff);
  g.moveTo(-10, r * 0.72).lineTo(0, r).lineTo(12, r * 0.72).stroke(line(SAND.line, 4));
  const art = goodArt(good, size * 0.62);
  art.y = -r * 0.08;
  c.addChild(g, art);
  return c;
}

/** One shell, a counter worth one. */
export function shellArt(size = 18): Graphics {
  const g = new Graphics();
  const r = size / 2;
  g.moveTo(0, r).lineTo(-r, -r * 0.1).quadraticCurveTo(0, -r * 1.3, r, -r * 0.1).closePath().fill(0xffd9c9).stroke(line(0xd98a6a, 2));
  g.moveTo(0, r).lineTo(-r * 0.4, -r * 0.5).moveTo(0, r).lineTo(0, -r * 0.65).moveTo(0, r).lineTo(r * 0.4, -r * 0.5).stroke(line(0xd98a6a, 1.5));
  return g;
}

/** A row of `n` shells centred on 0, wrapping after `per` shells. */
export function shellRow(n: number, size = 18, per = 5): Container {
  const c = new Container();
  c.eventMode = 'none';
  const rows = Math.ceil(n / per);
  for (let i = 0; i < n; i++) {
    const row = Math.floor(i / per);
    const inRow = Math.min(per, n - row * per);
    const s = shellArt(size);
    s.position.set((i % per - (inRow - 1) / 2) * (size + 2), (row - (rows - 1) / 2) * (size + 2));
    c.addChild(s);
  }
  return c;
}

/** A stop's price board: each good with as many shells as it costs there. */
export function boardArt(goods: [Good, Good], prices: [number, number], w = 150, h = 110, named = false): Container {
  const c = new Container();
  const g = new Graphics();
  g.roundRect(-w / 2, -h / 2, w, h, 16).fill(named ? 0xfff6c8 : cream).stroke(line(named ? swatch.yellow.line : SAND.line, named ? 6 : 4));
  c.addChild(g);
  goods.forEach((good, i) => {
    const y = -h / 4 + i * (h / 2);
    const art = goodArt(good, 40);
    art.position.set(-w / 2 + 28, y);
    const row = shellRow(prices[i], 16, 5);
    row.position.set(18, y);
    c.addChild(art, row);
  });
  return c;
}

/**
 * A three-bale load: each bale is its good; when `prices` is given (she has looked), each bale shows its shells at the
 * named stop underneath.
 */
export function loadArt(goods: Good[], w = 230, h = 150, prices: number[] | null = null, lifted = false): Container {
  const c = new Container();
  const g = new Graphics();
  g.roundRect(-w / 2, -h / 2, w, h, 22).fill(lifted ? 0xfff6c8 : cream).stroke(line(lifted ? swatch.yellow.line : SAND.line, lifted ? 7 : 5));
  c.addChild(g);
  const step = w / goods.length;
  goods.forEach((good, i) => {
    const x = -w / 2 + step * (i + 0.5);
    const art = goodArt(good, 58);
    art.position.set(x, prices ? -h * 0.2 : 0);
    c.addChild(art);
    if (prices) {
      const row = shellRow(prices[i], 14, 3);
      row.position.set(x, h * 0.26);
      c.addChild(row);
    }
  });
  return c;
}

// ——— Icon and sticker ———

/** A small camel with two bales and a sun. */
export function iconArt(): Container {
  const c = new Container();
  const sun = sunArt(40);
  sun.position.set(44, -74);
  const camel = new Camel();
  camel.scale.set(0.42);
  camel.position.set(0, 30);
  camel.load.addChild(baleArt('red', 70), baleArt('blue', 70));
  (camel.load.children[0] as Graphics).position.set(-46, -4);
  (camel.load.children[1] as Graphics).position.set(34, -4);
  c.addChild(sun, camel);
  return c;
}

/** A seeded sticker: the camel with its bales at a landmark oasis. */
export function stickerArt(landmark: Landmark, colors: ColorName[]): Container {
  const c = new Container();
  const g = new Graphics();
  g.roundRect(-110, -110, 220, 220, 26).fill(cream);
  g.roundRect(-96, -96, 192, 192, 22).fill(0xcfe9f7).stroke(line(SAND.line, 6));
  g.rect(-96, 20, 192, 76).fill(SAND.fill);
  c.addChild(g);
  const sun = sunArt(36);
  sun.position.set(-56, -56);
  const oasis = oasisArt(landmark, 90);
  oasis.position.set(48, 20);
  const camel = new Camel();
  camel.scale.set(0.48);
  camel.position.set(-30, 76);
  colors.slice(0, 3).forEach((color, i) => {
    const b = baleArt(color, 64);
    b.position.set(-40 + i * 40, -8 + (i % 2) * -10);
    camel.load.addChild(b);
  });
  c.addChild(sun, oasis, camel);
  return c;
}
