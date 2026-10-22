import { Container, Graphics } from 'pixi.js';
import { ink, swatch, wood } from '../../art/palette';
import { prop } from '../../art/props';
import { blendColor, MASH, type Bowl, type Ingredient, type Topper } from './logic';

/** Code-drawn workshop pieces: each centred on (0, 0) and sized for its box in the layout. */

const POT = { fill: 0xe9d3b5, line: 0xa57b52 };
const BOWL = { fill: 0x8fc9e8, line: 0x3f8bb5, rim: 0xd8eef8 };

/** A pot of pretend mash, its picture on the front so colour is never the only cue. About 130 across. */
export function potArt(ing: Ingredient): Container {
  const c = new Container(), g = new Graphics();
  // The mash peeking over the rim.
  g.ellipse(0, -44, 50, 16).fill(MASH[ing]).stroke({ width: 3, color: ing === 'base' ? 0xc9c9d6 : POT.line });
  g.moveTo(-58, -40).lineTo(-48, 52).quadraticCurveTo(0, 66, 48, 52).lineTo(58, -40).quadraticCurveTo(0, -28, -58, -40)
    .fill(POT.fill).stroke({ width: 5, color: POT.line, join: 'round' });
  g.roundRect(-62, -50, 124, 16, 8).fill(POT.fill).stroke({ width: 5, color: POT.line });
  c.addChild(g);
  c.addChild(picture(ing, 0.5, 14));
  return c;
}

/** The ingredient's picture: the fruit prop, or a white cloud-swirl dollop for the base. */
export function picture(ing: Ingredient, scale: number, y = 0): Container {
  if (ing === 'base') {
    const g = new Graphics();
    const s = scale * 2;
    g.circle(-14 * s, 4 * s, 14 * s).circle(14 * s, 4 * s, 14 * s).circle(0, -8 * s, 16 * s).fill(0xffffff).stroke({ width: 3, color: 0xa5a5b8 });
    g.moveTo(-8 * s, -6 * s).quadraticCurveTo(0, -16 * s, 8 * s, -6 * s).quadraticCurveTo(2 * s, 0, -2 * s, -6 * s).stroke({ width: 3, color: 0xa5a5b8, cap: 'round' });
    g.y = y;
    return g;
  }
  const p = prop(ing === 'berries' ? 'blueberries' : ing, ing === 'berries' ? 'blue' : ing === 'apple' ? 'red' : 'orange');
  p.scale.set(scale);
  p.y = y;
  return p;
}

/** The wooden spoon, about 130 tall, tilted. */
export function spoonArt(): Container {
  const c = new Container(), g = new Graphics();
  g.roundRect(-8, -60, 16, 90, 8).fill(wood.fill).stroke({ width: 4, color: wood.line });
  g.ellipse(0, 40, 24, 30).fill(wood.fill).stroke({ width: 4, color: wood.line });
  g.ellipse(0, 42, 14, 19).fill(wood.light);
  g.rotation = -0.5;
  c.addChild(g);
  return c;
}

export function drawStar(g: Graphics, x: number, y: number, r: number) {
  const pts: number[] = [];
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5, rr = i % 2 ? r * 0.48 : r;
    pts.push(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
  }
  g.poly(pts).fill(swatch.yellow.fill).stroke({ width: Math.max(2, r / 8), color: swatch.yellow.line, join: 'round' });
}

export function drawLeaf(g: Graphics, x: number, y: number, r: number) {
  g.moveTo(x - r, y).quadraticCurveTo(x, y - r * 0.9, x + r, y).quadraticCurveTo(x, y + r * 0.9, x - r, y)
    .fill(swatch.green.fill).stroke({ width: Math.max(2, r / 8), color: swatch.green.line, join: 'round' });
  g.moveTo(x - r * 0.8, y).lineTo(x + r * 0.7, y).stroke({ width: Math.max(2, r / 10), color: swatch.green.line });
}

export function topperArt(t: Topper, r = 40): Container {
  const g = new Graphics();
  if (t === 'star') drawStar(g, 0, 0, r); else drawLeaf(g, 0, 0, r);
  return g;
}

/** Undo: a round arrow on a white button, about 100 across. */
export function undoArt(): Container {
  const g = new Graphics();
  g.circle(0, 0, 50).fill(0xffffff).stroke({ width: 5, color: swatch.blue.line });
  g.arc(0, 4, 26, Math.PI * 1.15, Math.PI * 2.6).stroke({ width: 9, color: swatch.blue.fill, cap: 'round' });
  g.poly([-36, -16, -10, -22, -26, 4]).fill(swatch.blue.fill);
  return g;
}

/** Serve: a bell on a round button, about 120 across. */
export function serveArt(): Container {
  const g = new Graphics();
  g.circle(0, 0, 58).fill(swatch.green.light).stroke({ width: 5, color: swatch.green.line });
  g.moveTo(-34, 18).quadraticCurveTo(-34, -26, 0, -26).quadraticCurveTo(34, -26, 34, 18).lineTo(-34, 18).fill(swatch.yellow.fill).stroke({ width: 4, color: swatch.yellow.line });
  g.roundRect(-42, 16, 84, 10, 5).fill(swatch.yellow.line);
  g.circle(0, -30, 6).fill(swatch.yellow.line);
  return g;
}

/**
 * Draws a bowl filling the box `w`×`h` centred on (0, 0): the blend as one band with a swirl, each loose portion as its own
 * bumpy layer above it, folded toppers as specks, and the topper on top.
 */
export function drawBowl(g: Graphics, b: Bowl, w: number, h: number) {
  g.clear();
  const rim = -h / 2 + h * 0.42, inner = w * 0.8, band = Math.min(26, (h * 0.42) / 2.2);
  let top = rim + 4;
  const blend = blendColor(b), mixedN = Object.values(b.mixed).reduce((n, x) => n + (x ?? 0), 0);
  g.ellipse(0, rim, w / 2 - 6, 18).fill(0x5e9fc2);
  if (blend !== null) {
    const hh = band * mixedN, y = top - hh;
    g.roundRect(-inner / 2, y, inner, hh + 10, 16).fill(blend).stroke({ width: 3, color: shade(blend) });
    // A swirl says "stirred together".
    g.moveTo(-inner * 0.28, y + hh * 0.5).quadraticCurveTo(-inner * 0.1, y + 2, inner * 0.1, y + hh * 0.45)
      .quadraticCurveTo(inner * 0.25, y + hh * 0.85, inner * 0.3, y + hh * 0.3).stroke({ width: 4, color: 0xffffff, alpha: 0.7, cap: 'round' });
    b.folded.forEach((t, i) => {
      const col = t === 'star' ? swatch.yellow.fill : swatch.green.fill;
      for (let k = 0; k < 4; k++) g.circle(-inner * 0.36 + (k * inner * 0.24) + i * 12, y + hh * (0.3 + 0.3 * ((k + i) % 2)), 4).fill(col);
    });
    top = y;
  }
  b.loose.forEach((ing, i) => {
    const wv = inner * (0.94 - 0.06 * i), y = top - band;
    const col = MASH[ing], line = ing === 'base' ? 0xa5a5b8 : shade(col);
    g.roundRect(-wv / 2, y + 2, wv, band + 6, 10).fill(col).stroke({ width: 3, color: line });
    // Bumps along the top: a dollop, not a stirred band.
    for (let k = 0; k < 4; k++) g.circle(-wv / 2 + wv * (0.14 + 0.24 * k), y + 4, band * 0.38).fill(col);
    top = y;
  });
  if (b.top === 'star') drawStar(g, 0, top - 22, 26);
  else if (b.top === 'leaf') drawLeaf(g, 0, top - 18, 28);
  // The bowl's front, over the bottom of what is in it.
  g.moveTo(-w / 2, rim).quadraticCurveTo(-w / 2 + 6, h / 2, 0, h / 2).quadraticCurveTo(w / 2 - 6, h / 2, w / 2, rim)
    .quadraticCurveTo(0, rim + 12, -w / 2, rim).fill(BOWL.fill).stroke({ width: 5, color: BOWL.line, join: 'round' });
  g.moveTo(-w / 2 + 4, rim).quadraticCurveTo(0, rim + 12, w / 2 - 4, rim).stroke({ width: 7, color: BOWL.rim, cap: 'round' });
  g.circle(-w * 0.25, rim + h * 0.25, 6).circle(0, rim + h * 0.32, 6).circle(w * 0.25, rim + h * 0.25, 6).fill(BOWL.rim);
}

function shade(c: number): number {
  const f = 0.72;
  return (Math.round(((c >> 16) & 255) * f) << 16) | (Math.round(((c >> 8) & 255) * f) << 8) | Math.round((c & 255) * f);
}

/** A white card with a rounded border. */
export function panel(g: Graphics, x: number, y: number, w: number, h: number) {
  g.roundRect(x, y, w, h, 24).fill(0xffffff).stroke({ width: 5, color: swatch.teal.line });
}

/** A small plus or arrow between card pictures. */
export function plus(g: Graphics, x: number, y: number) {
  g.moveTo(x - 10, y).lineTo(x + 10, y).moveTo(x, y - 10).lineTo(x, y + 10).stroke({ width: 5, color: ink, cap: 'round' });
}

/** The counter, the shelf and the wall. */
export function drawWorkshop(g: Graphics, w: number, h: number, shelfY: number, tableY: number) {
  g.clear();
  g.rect(0, 0, w, h).fill(0xfff1dc);
  for (let x = 0; x < w; x += 64) g.rect(x, 0, 32, tableY).fill({ color: 0xffe4c2, alpha: 0.6 });
  g.roundRect(-10, shelfY, w + 20, 18, 6).fill(wood.fill).stroke({ width: 4, color: wood.line });
  g.rect(0, tableY, w, h - tableY).fill(wood.light);
  g.rect(0, tableY, w, 16).fill(wood.fill);
}
