/** Festival Signals' pictures (levels 8–9): the parts, the signal chips, the lantern and the bunting. Code-drawn. */
import { Container, Graphics } from 'pixi.js';
import { cream, ink, swatch } from '../../art/palette';
import { label } from '../../ui/text';
import { BRASS, gatePicture, METAL, propPicture } from './art';
import type { PartOp, Src } from './flat';
import type { Prop } from './logic';

const line = (color: number, width: number) => ({
  width,
  color,
  cap: 'round' as const,
  join: 'round' as const,
});

/** NOT's picture: a signal goes in, turns round and comes out flipped. */
function flipPicture(size: number): Graphics {
  const g = new Graphics();
  const s = size / 100;
  g.arc(0, 0, 28 * s, Math.PI * 0.15, Math.PI * 1.55).stroke(line(ink, 7));
  const tip = { x: Math.cos(Math.PI * 1.55) * 28 * s, y: Math.sin(Math.PI * 1.55) * 28 * s };
  g.moveTo(tip.x - 2 * s, tip.y - 14 * s)
    .lineTo(tip.x + 14 * s, tip.y)
    .lineTo(tip.x - 2 * s, tip.y + 14 * s)
    .stroke(line(ink, 7));
  return g;
}

/** A part with its word under it; the picture alone is abstract, so it never stands alone. */
export function partTile(op: PartOp, size: number): Container {
  const c = new Container();
  const pic = op === 'NOT' ? flipPicture(size * 0.52) : gatePicture(op, size * 0.52);
  pic.y = -size * 0.14;
  const word = label(op.toLowerCase(), Math.round(size * 0.2), ink);
  word.y = size * 0.26;
  c.addChild(pic, word);
  c.eventMode = 'none';
  return c;
}

/** Clear's picture: a cross. */
export function clearArt(size: number): Graphics {
  const g = new Graphics();
  const r = size * 0.2;
  g.moveTo(-r, -r).lineTo(r, r).moveTo(r, -r).lineTo(-r, r).stroke(line(swatch.red.line, 9));
  g.eventMode = 'none';
  return g;
}

/** A slot's number in a small round badge. */
export function numberBadge(n: number, r = 15): Container {
  const c = new Container();
  const g = new Graphics();
  g.circle(0, 0, r).fill(METAL.fill).stroke(line(METAL.line, 3));
  c.addChild(g, label(String(n), Math.round(r * 1.25), ink));
  c.eventMode = 'none';
  return c;
}

/** Where a signal comes from: a badge's toy, or an earlier slot's number. */
export function sourceChip(src: Src, props: [Prop, Prop], size: number): Container {
  if (typeof src === 'number') return numberBadge(src + 1, size * 0.42);
  const c = propPicture(src === 'P' ? props[0] : props[1], size);
  c.eventMode = 'none';
  return c;
}

/**
 * The festival lantern, hanging from (0, -size / 2): lit (a glow, rays and a flame), resting (dark, with a hollow ring), or
 * not yet read (plain paper). Never colour alone.
 */
export function lanternArt(lit: boolean | null, size: number, alpha = 1): Graphics {
  const g = new Graphics();
  const s = size / 100;
  const paper = lit === true ? swatch.yellow.light : lit === false ? METAL.dark : cream;
  const edge = lit === true ? swatch.orange.line : lit === false ? METAL.line : BRASS.line;
  if (lit === true) {
    g.circle(0, 4 * s, 46 * s).fill({ color: swatch.yellow.fill, alpha: 0.35 * alpha });
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      g.moveTo(Math.cos(a) * 40 * s, 4 * s + Math.sin(a) * 40 * s)
        .lineTo(Math.cos(a) * 48 * s, 4 * s + Math.sin(a) * 48 * s)
        .stroke({ ...line(swatch.orange.fill, 4), alpha });
    }
  }
  g.moveTo(0, -48 * s)
    .lineTo(0, -30 * s)
    .stroke({ ...line(edge, 4), alpha });
  g.roundRect(-14 * s, -32 * s, 28 * s, 8 * s, 3 * s).fill({ color: edge, alpha });
  g.ellipse(0, 4 * s, 26 * s, 30 * s)
    .fill({ color: paper, alpha })
    .stroke({ ...line(edge, 4), alpha });
  g.moveTo(-12 * s, -22 * s)
    .quadraticCurveTo(-22 * s, 4 * s, -12 * s, 30 * s)
    .moveTo(12 * s, -22 * s)
    .quadraticCurveTo(22 * s, 4 * s, 12 * s, 30 * s)
    .stroke({ ...line(edge, 2), alpha: 0.6 * alpha });
  g.roundRect(-12 * s, 32 * s, 24 * s, 7 * s, 3 * s).fill({ color: edge, alpha });
  if (lit === true)
    g.moveTo(0, -8 * s)
      .quadraticCurveTo(10 * s, 6 * s, 0, 16 * s)
      .quadraticCurveTo(-10 * s, 6 * s, 0, -8 * s)
      .fill({ color: swatch.orange.fill, alpha });
  if (lit === false) g.circle(0, 4 * s, 10 * s).stroke({ ...line(ink, 4), alpha });
  g.eventMode = 'none';
  return g;
}

/** A row of festival flags across `w`, hanging from y = 0. */
export function buntingArt(w: number): Graphics {
  const g = new Graphics();
  const n = Math.max(4, Math.round(w / 90));
  const sag = (t: number) => 26 * Math.sin(t * Math.PI);
  const colors = [swatch.red.fill, swatch.yellow.fill, swatch.teal.fill, swatch.pink.fill, swatch.blue.fill];
  g.moveTo(0, 0);
  for (let i = 1; i <= 24; i++) g.lineTo((i / 24) * w, sag(i / 24));
  g.stroke(line(ink, 3));
  for (let i = 0; i < n; i++) {
    const t = (i + 0.5) / n;
    const x = t * w;
    const y = sag(t);
    g.moveTo(x - 22, y)
      .lineTo(x + 22, y)
      .lineTo(x, y + 40)
      .closePath()
      .fill(colors[i % colors.length])
      .stroke(line(ink, 2));
  }
  g.eventMode = 'none';
  return g;
}
