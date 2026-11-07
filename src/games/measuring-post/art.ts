/** Measuring Post's code-drawn pieces: the three objects, their units and the three tools on the shelf. */
import { Container, Graphics } from 'pixi.js';
import { cream, ink, swatch } from '../../art/palette';
import { stickerize } from '../../art/sticker';
import type { Attribute, Tool, UnitSize } from './logic';

/** One little unit's footprint along a row, in logical units at scale 1 (a big one is two of them). */
export const LITTLE = { length: 60, mass: 40, capacity: 44 } as const;

const eye = (g: Graphics, x: number, y: number, r = 4) => g.circle(x, y, r).fill(ink);

/** A measuring worm lying along +x from (0, 0): one little length, or two for a big one. */
export function wormArt(size: UnitSize): Graphics {
  const len = LITTLE.length * (size === 'big' ? 2 : 1) - 4;
  const h = size === 'big' ? 26 : 20;
  const g = new Graphics();
  g.roundRect(2, -h / 2, len, h, h / 2).fill(swatch.green.fill).stroke({ width: 3, color: swatch.green.line });
  const rings = size === 'big' ? 7 : 3;
  for (let i = 1; i <= rings; i++) g.moveTo(2 + (len * i) / (rings + 1), -h / 2 + 3).lineTo(2 + (len * i) / (rings + 1), h / 2 - 3);
  g.stroke({ width: 2, color: swatch.green.line });
  eye(g, len - h / 3, -2, size === 'big' ? 4 : 3);
  return g;
}

/** A weight block standing on (0, 0); a big block is a bigger cube with two pips, a little one has one. */
export function blockArt(size: UnitSize): Graphics {
  const s = size === 'big' ? 52 : 36;
  const g = new Graphics();
  g.roundRect(-s / 2, -s, s, s, 7).fill(swatch.purple.fill).stroke({ width: 3, color: swatch.purple.line });
  const pips = size === 'big' ? [-s / 5, s / 5] : [0];
  for (const x of pips) g.circle(x, -s / 2, 5).fill(swatch.purple.light);
  return g;
}

/** A measuring cup standing on (0, 0), full of water; a big cup is taller and wider. */
export function cupArt(size: UnitSize, full = true): Graphics {
  const [w, h] = size === 'big' ? [50, 62] : [36, 44];
  const g = new Graphics();
  g.poly([-w / 2, -h, w / 2, -h, w / 2 - 5, 0, -w / 2 + 5, 0]).fill(0xf6fbff).stroke({ width: 3, color: swatch.blue.line });
  if (full) g.poly([-w / 2 + 3, -h + 10, w / 2 - 3, -h + 10, w / 2 - 7, -3, -w / 2 + 7, -3]).fill(swatch.blue.light);
  g.moveTo(w / 2, -h + 8).arc(w / 2 + 2, -h / 2, h / 2 - 8, -Math.PI / 2, Math.PI / 2).stroke({ width: 4, color: swatch.blue.line });
  return g;
}

export function unitArt(attribute: Attribute, size: UnitSize): Graphics {
  return attribute === 'length' ? wormArt(size) : attribute === 'mass' ? blockArt(size) : cupArt(size);
}

/** The ribbon: a pink band `len` long from (0, 0) along +x with a bow at its start. */
export function ribbonArt(len: number): Graphics {
  const g = new Graphics();
  g.rect(0, -12, len, 24).fill(swatch.pink.fill).stroke({ width: 3, color: swatch.pink.line });
  g.poly([0, 0, -26, -18, -26, 18]).fill(swatch.pink.fill).stroke({ width: 3, color: swatch.pink.line });
  // Little ticks mark both ends, where measuring starts and stops.
  g.moveTo(0, -24).lineTo(0, 24).moveTo(len, -24).lineTo(len, 24).stroke({ width: 3, color: swatch.pink.line });
  return g;
}

/** The parcel standing on (0, 0): a box tied with string. */
export function parcelArt(): Graphics {
  const g = new Graphics();
  g.roundRect(-38, -62, 76, 62, 8).fill(swatch.brown.light).stroke({ width: 4, color: swatch.brown.line });
  g.moveTo(0, -62).lineTo(0, 0).moveTo(-38, -31).lineTo(38, -31).stroke({ width: 4, color: swatch.red.fill });
  g.circle(-8, -68, 8).circle(8, -68, 8).stroke({ width: 4, color: swatch.red.fill });
  return g;
}

/** The jug standing on (0, 0), filled to `fill` (0 to 1). */
export function jugArt(fill: number, h = 150): Graphics {
  const w = 96;
  const g = new Graphics();
  g.roundRect(-w / 2, -h, w, h, 18).fill(0xf6fbff);
  const f = Math.max(0, Math.min(1, fill));
  if (f > 0) g.roundRect(-w / 2 + 6, -6 - (h - 18) * f, w - 12, (h - 18) * f, 10).fill(swatch.blue.light);
  g.roundRect(-w / 2, -h, w, h, 18).stroke({ width: 5, color: swatch.blue.line });
  g.poly([-w / 2 + 4, -h + 6, -w / 2 - 18, -h - 8, -w / 2 + 16, -h + 2]).fill(0xf6fbff).stroke({ width: 4, color: swatch.blue.line });
  g.moveTo(w / 2, -h + 24).arc(w / 2 + 4, -h / 2, h / 2 - 24, -Math.PI / 2, Math.PI / 2).stroke({ width: 7, color: swatch.blue.line });
  return g;
}

export function objectArt(attribute: Attribute, len = 4 * LITTLE.length): Graphics {
  return attribute === 'length' ? ribbonArt(len) : attribute === 'mass' ? parcelArt() : jugArt(1, 110);
}

/**
 * An equal-arm balance with its post at (0, 0) and its pans `arm` either side; `tilt` > 0 drops the left pan.
 * Returns the pans' resting points so the caller can stand things on them.
 */
export function drawBalance(g: Graphics, x: number, y: number, arm: number, tilt: number): { left: { x: number; y: number }; right: { x: number; y: number } } {
  const top = y - 90;
  g.poly([x - 34, y, x + 34, y, x + 8, top, x - 8, top]).fill(swatch.brown.fill).stroke({ width: 4, color: swatch.brown.line });
  const dy = Math.sin(tilt) * arm, dx = Math.cos(tilt) * arm;
  const l = { x: x - dx, y: top + dy }, r = { x: x + dx, y: top - dy };
  g.moveTo(l.x, l.y).lineTo(r.x, r.y).stroke({ width: 9, color: swatch.brown.line, cap: 'round' });
  g.circle(x, top, 9).fill(swatch.yellow.fill).stroke({ width: 3, color: swatch.yellow.line });
  const pans = { left: { x: l.x, y: l.y + 40 }, right: { x: r.x, y: r.y + 40 } };
  for (const [p, q] of [[l, pans.left], [r, pans.right]] as const) {
    g.moveTo(p.x, p.y).lineTo(q.x - 40, q.y).moveTo(p.x, p.y).lineTo(q.x + 40, q.y).stroke({ width: 3, color: swatch.brown.line });
    g.roundRect(q.x - 52, q.y - 4, 104, 12, 6).fill(swatch.yellow.fill).stroke({ width: 3, color: swatch.yellow.line });
  }
  return { left: { x: pans.left.x, y: pans.left.y - 4 }, right: { x: pans.right.x, y: pans.right.y - 4 } };
}

/** The shelf's tools, centred on (0, 0) inside a 120×100 pad. */
export function toolArt(tool: Tool): Graphics {
  const g = new Graphics();
  if (tool === 'rope') {
    // A knotted measuring rope, coiled on the left and stretched out with even knots.
    g.circle(-30, 0, 18).stroke({ width: 7, color: swatch.orange.line });
    g.moveTo(-14, 6).lineTo(42, 6).stroke({ width: 7, color: swatch.orange.line, cap: 'round' });
    for (const x of [0, 14, 28, 42]) g.circle(x, 6, 6).fill(swatch.orange.fill).stroke({ width: 2, color: swatch.orange.line });
  } else if (tool === 'balance') {
    g.poly([-10, 34, 10, 34, 4, -18, -4, -18]).fill(swatch.brown.fill).stroke({ width: 3, color: swatch.brown.line });
    g.moveTo(-40, -18).lineTo(40, -18).stroke({ width: 6, color: swatch.brown.line, cap: 'round' });
    for (const x of [-40, 40]) {
      g.moveTo(x, -18).lineTo(x - 14, 6).moveTo(x, -18).lineTo(x + 14, 6).stroke({ width: 2, color: swatch.brown.line });
      g.roundRect(x - 18, 4, 36, 7, 3).fill(swatch.yellow.fill).stroke({ width: 2, color: swatch.yellow.line });
    }
  } else {
    const cup = cupArt('big', false);
    cup.position.set(-6, 30);
    g.addChild(cup);
    for (const y of [-12, 0, 12]) g.moveTo(-26, y + 6).lineTo(-14, y + 6);
    g.stroke({ width: 3, color: swatch.blue.line });
  }
  return g;
}

/** A pad on the shelf or in the answer rows: a cream card the size of its hit area. */
export function padArt(w: number, h: number): Graphics {
  return new Graphics().roundRect(-w / 2, -h / 2 + 5, w, h, 20).fill(swatch.brown.line)
    .roundRect(-w / 2, -h / 2, w, h, 20).fill(cream).stroke({ width: 4, color: swatch.brown.line });
}

/** A paper-plane Send icon. */
export function sendIcon(): Graphics {
  return new Graphics().poly([-24, -4, 26, -20, 6, 24, 0, 6]).fill(0xffffff).stroke({ width: 3, color: ink, join: 'round' })
    .moveTo(0, 6).lineTo(26, -20).stroke({ width: 3, color: ink });
}

/** A tick: Check the chosen row. */
export function tickIcon(): Graphics {
  return new Graphics().moveTo(-20, 0).lineTo(-6, 16).lineTo(22, -18).stroke({ width: 8, color: 0xffffff, cap: 'round', join: 'round' });
}

/** The help hand. */
export function handIcon(): Graphics {
  const g = new Graphics();
  g.roundRect(-16, -6, 32, 30, 10).fill(0xffffff).stroke({ width: 3, color: ink });
  g.roundRect(-6, -28, 12, 30, 6).fill(0xffffff).stroke({ width: 3, color: ink });
  return g;
}

/** A speaker: say the result again. */
export function speakerIcon(): Graphics {
  return new Graphics().poly([-22, -8, -10, -8, 4, -20, 4, 20, -10, 8, -22, 8]).fill(ink)
    .moveTo(12, -10).arc(8, 0, 14, -0.8, 0.8).stroke({ width: 4, color: ink, cap: 'round' })
    .moveTo(16, -18).arc(8, 0, 24, -0.8, 0.8).stroke({ width: 4, color: ink, cap: 'round' });
}

export function hubArt(): Container {
  const c = new Container();
  const g = new Graphics();
  g.roundRect(-58, -60, 116, 120, 22).fill(cream).stroke({ width: 5, color: swatch.brown.line });
  c.addChild(g);
  const ribbon = ribbonArt(70);
  ribbon.position.set(-30, -30);
  ribbon.scale.set(0.8);
  const worm = wormArt('little');
  worm.position.set(-30, -6);
  const block = blockArt('little');
  block.position.set(-22, 44);
  const cup = cupArt('little');
  cup.position.set(26, 44);
  c.addChild(ribbon, worm, block, cup);
  return c;
}

export function stickerArt(seed = 0): Container {
  const c = new Container();
  const kinds: Attribute[] = ['length', 'mass', 'capacity'];
  const lead = kinds[Math.abs(seed) % 3];
  const g = new Graphics();
  if (lead === 'mass') {
    const pans = drawBalance(g, 0, 50, 46, 0);
    c.addChild(g);
    const p = parcelArt(); p.scale.set(0.45); p.position.copyFrom(pans.left);
    const b = blockArt('big'); b.scale.set(0.7); b.position.copyFrom(pans.right);
    c.addChild(p, b);
  } else if (lead === 'length') {
    c.addChild(g);
    const r = ribbonArt(100); r.position.set(-50, -14);
    const w1 = wormArt('little'); w1.position.set(-50, 18);
    const w2 = wormArt('little'); w2.position.set(-50 + LITTLE.length, 18);
    w1.scale.x = w2.scale.x = 100 / 120;
    w2.x = -50 + 50;
    c.addChild(r, w1, w2);
  } else {
    const j = jugArt(0.7, 100); j.position.set(-14, 50);
    const cup = cupArt('little'); cup.position.set(46, 50);
    c.addChild(j, cup);
  }
  return stickerize(c);
}
