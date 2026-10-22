import { Graphics } from 'pixi.js';
import { ink, swatch, type ColorName } from '../../art/palette';
import { flower, shapePath } from '../../art/shapes';
import { traceShape, type Pt, type StampKind, type TraceMakerId } from './logic';
export function stampArt(kind: StampKind, color: ColorName, radius = 48) {
  const g = new Graphics(), s = swatch[color];
  if (kind === 'star') shapePath(g, 'star', radius).fill(s.fill).stroke({ width: 4, color: s.line });
  if (kind === 'flower') flower(g, radius, s.fill, s.line);
  if (kind === 'fish') {
    g.poly([-radius * 0.5, 0, -radius, -radius * 0.6, -radius, radius * 0.6]).fill(s.fill).stroke({ width: 4, color: s.line });
    g.ellipse(0, 0, radius * 0.85, radius * 0.55).fill(s.fill).stroke({ width: 4, color: s.line }).circle(radius * 0.4, -radius * 0.1, 5).fill(ink);
  }
  if (kind === 'cat') {
    g.poly([-radius * 0.8, -radius * 0.2, -radius * 0.8, -radius, -radius * 0.1, -radius * 0.45]).fill(s.fill).stroke({ width: 4, color: s.line });
    g.poly([radius * 0.8, -radius * 0.2, radius * 0.8, -radius, radius * 0.1, -radius * 0.45]).fill(s.fill).stroke({ width: 4, color: s.line });
    g.ellipse(0, 0, radius, radius * 0.75).fill(s.fill).stroke({ width: 4, color: s.line });
    for (const x of [-0.4, 0.4]) g.circle(radius * x, -6, 5).fill(ink);
    g.poly([-5, 5, 5, 5, 0, 11]).fill(swatch.pink.line);
  }
  return g;
}

/** A Trace Prints maker as she sees it above the mud: the leaf (green, veined), the duck foot (orange) or the cat paw (pink). */
export function traceArt(id: TraceMakerId, scale = 1) {
  const g = new Graphics(), s = id === 'leaf' ? swatch.green : id === 'duck' ? swatch.orange : swatch.pink;
  const shape = traceShape(id), k = (p: Pt) => [p.x * scale, p.y * scale];
  for (const ps of shape.polys) g.poly(ps.flatMap(k)).fill(s.fill).stroke({ width: 5, color: s.line, join: 'round' });
  for (const c of shape.circles) g.circle(c.x * scale, c.y * scale, c.r * scale).fill(s.fill).stroke({ width: 5, color: s.line });
  for (const ps of shape.lines) g.poly(ps.flatMap(k), false).stroke({ width: 4, color: s.line, cap: 'round' });
  return g;
}
/** The dent a maker leaves: its outline pressed into the mud, a lighter rim up-left so it reads as pressed in, and its inner lines. */
export function printArt(id: TraceMakerId) {
  const g = new Graphics(), mud = swatch.brown, shape = traceShape(id);
  const rim = (p: Pt) => [p.x - 3, p.y - 3], at = (p: Pt) => [p.x, p.y];
  for (const ps of shape.polys) g.poly(ps.flatMap(rim)).stroke({ width: 5, color: mud.light, alpha: 0.9, join: 'round' });
  for (const c of shape.circles) g.circle(c.x - 3, c.y - 3, c.r).stroke({ width: 5, color: mud.light, alpha: 0.9 });
  for (const ps of shape.polys) g.poly(ps.flatMap(at)).fill({ color: mud.line, alpha: 0.45 });
  for (const c of shape.circles) g.circle(c.x, c.y, c.r).fill({ color: mud.line, alpha: 0.45 });
  for (const ps of shape.lines) g.poly(ps.flatMap(at), false).stroke({ width: 4, color: mud.line, alpha: 0.85, cap: 'round' });
  return g;
}
