import { Graphics } from 'pixi.js';
import { ink, swatch, type ColorName } from '../../art/palette';
import { flower, shapePath } from '../../art/shapes';
import {
  SCENES,
  stampLine,
  traceShape,
  type Pt,
  type SceneId,
  type StampKind,
  type TraceMakerId,
} from './logic';
export function stampArt(kind: StampKind, color: ColorName, radius = 48) {
  const g = new Graphics(),
    s = { fill: swatch[color].fill, line: stampLine(color, swatch[color].line) };
  if (kind === 'star') shapePath(g, 'star', radius).fill(s.fill).stroke({ width: 4, color: s.line });
  if (kind === 'flower') flower(g, radius, s.fill, s.line);
  if (kind === 'fish') {
    g.poly([-radius * 0.5, 0, -radius, -radius * 0.6, -radius, radius * 0.6])
      .fill(s.fill)
      .stroke({ width: 4, color: s.line });
    g.ellipse(0, 0, radius * 0.85, radius * 0.55)
      .fill(s.fill)
      .stroke({ width: 4, color: s.line })
      .circle(radius * 0.4, -radius * 0.1, 5)
      .fill(ink);
  }
  if (kind === 'cat') {
    g.poly([-radius * 0.8, -radius * 0.2, -radius * 0.8, -radius, -radius * 0.1, -radius * 0.45])
      .fill(s.fill)
      .stroke({ width: 4, color: s.line });
    g.poly([radius * 0.8, -radius * 0.2, radius * 0.8, -radius, radius * 0.1, -radius * 0.45])
      .fill(s.fill)
      .stroke({ width: 4, color: s.line });
    g.ellipse(0, 0, radius, radius * 0.75)
      .fill(s.fill)
      .stroke({ width: 4, color: s.line });
    for (const x of [-0.4, 0.4]) g.circle(radius * x, -6, 5).fill(ink);
    g.poly([-5, 5, 5, 5, 0, 11]).fill(swatch.pink.line);
  }
  if (kind === 'duck') {
    const tail = [
      -radius * 0.55,
      radius * 0.05,
      -radius * 0.9,
      -radius * 0.16,
      -radius * 0.72,
      radius * 0.34,
    ];
    // Stroke the silhouette at double width before filling so body, tail and head share one clean outline.
    g.poly(tail)
      .ellipse(-radius * 0.12, radius * 0.22, radius * 0.64, radius * 0.44)
      .circle(radius * 0.3, -radius * 0.28, radius * 0.35)
      .stroke({ width: 8, color: s.line, join: 'round' })
      .poly(tail)
      .ellipse(-radius * 0.12, radius * 0.22, radius * 0.64, radius * 0.44)
      .circle(radius * 0.3, -radius * 0.28, radius * 0.35)
      .fill(s.fill);
    // An orange bill, a curved wing line and an eye.
    g.poly([
      radius * 0.6,
      -radius * 0.34,
      radius * 0.96,
      -radius * 0.26,
      radius * 0.96,
      -radius * 0.14,
      radius * 0.58,
      -radius * 0.14,
    ])
      .fill(swatch.orange.fill)
      .stroke({ width: 4, color: swatch.orange.line, join: 'round' });
    g.moveTo(-radius * 0.36, radius * 0.14)
      .quadraticCurveTo(-radius * 0.08, radius * 0.42, radius * 0.22, radius * 0.2)
      .stroke({ width: 3.5, color: s.line, cap: 'round' });
    g.circle(radius * 0.4, -radius * 0.36, 4.5).fill(ink);
  }
  if (kind === 'whale') {
    const tail = [-radius * 0.55, radius * 0.1, -radius * 1.0, -radius * 0.45, -radius * 0.95, radius * 0.35];
    g.poly(tail)
      .ellipse(0, radius * 0.12, radius * 0.8, radius * 0.5)
      .stroke({ width: 8, color: s.line, join: 'round' })
      .poly(tail)
      .ellipse(0, radius * 0.12, radius * 0.8, radius * 0.5)
      .fill(s.fill);
    g.ellipse(radius * 0.05, radius * 0.34, radius * 0.55, radius * 0.18).fill({
      color: 0xffffff,
      alpha: 0.6,
    });
    g.circle(radius * 0.45, -radius * 0.02, 4.5).fill(ink);
    for (const dx of [-0.12, 0.12])
      g.moveTo(radius * 0.3, -radius * 0.34)
        .quadraticCurveTo(radius * (0.3 + dx * 3), -radius * 0.75, radius * (0.3 + dx * 4), -radius * 0.85)
        .stroke({ width: 4, color: swatch.blue.line, cap: 'round' });
  }
  if (kind === 'crab') {
    for (const sx of [-1, 1]) {
      for (const y of [0.1, 0.35, 0.6])
        g.moveTo(sx * radius * 0.5, radius * (y - 0.05))
          .lineTo(sx * radius * 0.95, radius * (y + 0.1))
          .stroke({ width: 5, color: s.line, cap: 'round' });
      g.moveTo(sx * radius * 0.45, -radius * 0.1)
        .lineTo(sx * radius * 0.85, -radius * 0.55)
        .stroke({ width: 5, color: s.line, cap: 'round' });
      g.circle(sx * radius * 0.88, -radius * 0.65, radius * 0.24)
        .fill(s.fill)
        .stroke({ width: 4, color: s.line });
      g.moveTo(sx * radius * 0.2, -radius * 0.28)
        .lineTo(sx * radius * 0.2, -radius * 0.55)
        .stroke({ width: 4, color: s.line, cap: 'round' });
      g.circle(sx * radius * 0.2, -radius * 0.6, 6)
        .fill(0xffffff)
        .stroke({ width: 3, color: s.line })
        .circle(sx * radius * 0.2, -radius * 0.6, 2.5)
        .fill(ink);
    }
    g.ellipse(0, radius * 0.2, radius * 0.7, radius * 0.5)
      .fill(s.fill)
      .stroke({ width: 4, color: s.line });
    g.moveTo(-radius * 0.18, radius * 0.3)
      .quadraticCurveTo(0, radius * 0.5, radius * 0.18, radius * 0.3)
      .stroke({ width: 3.5, color: s.line, cap: 'round' });
  }
  if (kind === 'starfish') {
    const pts: number[] = [];
    for (let i = 0; i < 10; i++) {
      const a = -Math.PI / 2 + (i * Math.PI) / 5;
      const r = i % 2 ? radius * 0.42 : radius;
      pts.push(Math.cos(a) * r, Math.sin(a) * r);
    }
    g.poly(pts).fill(s.fill).stroke({ width: 4, color: s.line, join: 'round' });
    for (let i = 0; i < 5; i++) {
      const a = -Math.PI / 2 + (i * 2 * Math.PI) / 5;
      g.circle(Math.cos(a) * radius * 0.5, Math.sin(a) * radius * 0.5, 3.5).fill(s.line);
    }
    g.circle(0, 0, 4).fill(s.line);
  }
  if (kind === 'shell') {
    const ribs = 5;
    g.poly([
      -radius * 0.22,
      radius * 0.7,
      radius * 0.22,
      radius * 0.7,
      radius * 0.18,
      radius * 0.5,
      -radius * 0.18,
      radius * 0.5,
    ])
      .fill(s.fill)
      .stroke({ width: 4, color: s.line, join: 'round' });
    g.moveTo(-radius * 0.95, radius * 0.45)
      .arc(0, radius * 0.45, radius * 0.95, Math.PI, 0)
      .lineTo(0, radius * 0.5)
      .closePath()
      .fill(s.fill)
      .stroke({ width: 4, color: s.line, join: 'round' });
    for (let i = 1; i < ribs; i++) {
      const a = Math.PI + (i * Math.PI) / ribs;
      g.moveTo(0, radius * 0.5)
        .lineTo(Math.cos(a) * radius * 0.9, radius * 0.45 + Math.sin(a) * radius * 0.9)
        .stroke({ width: 3.5, color: s.line, cap: 'round' });
    }
  }
  if (kind === 'boat') {
    g.poly([
      -radius * 0.9,
      radius * 0.1,
      radius * 0.9,
      radius * 0.1,
      radius * 0.6,
      radius * 0.7,
      -radius * 0.6,
      radius * 0.7,
    ])
      .fill(s.fill)
      .stroke({ width: 4, color: s.line, join: 'round' });
    g.moveTo(0, radius * 0.1)
      .lineTo(0, -radius * 0.95)
      .stroke({ width: 5, color: swatch.brown.line, cap: 'round' });
    g.poly([radius * 0.1, -radius * 0.85, radius * 0.1, -radius * 0.05, radius * 0.8, -radius * 0.05])
      .fill(0xffffff)
      .stroke({ width: 4, color: s.line, join: 'round' });
    g.poly([-radius * 0.1, -radius * 0.6, -radius * 0.1, -radius * 0.05, -radius * 0.6, -radius * 0.05])
      .fill(0xffffff)
      .stroke({ width: 4, color: s.line, join: 'round' });
  }
  if (kind === 'cow') {
    const legL = [-radius * 0.56, radius * 0.36, radius * 0.18, radius * 0.44, 5];
    const legR = [radius * 0.12, radius * 0.36, radius * 0.18, radius * 0.44, 5];
    // Seamless silhouette outline first, then fill.
    g.roundRect(legL[0], legL[1], legL[2], legL[3], legL[4])
      .roundRect(legR[0], legR[1], legR[2], legR[3], legR[4])
      .ellipse(-radius * 0.14, radius * 0.16, radius * 0.64, radius * 0.42)
      .circle(radius * 0.42, -radius * 0.2, radius * 0.34)
      .stroke({ width: 8, color: s.line, join: 'round' })
      .roundRect(legL[0], legL[1], legL[2], legL[3], legL[4])
      .roundRect(legR[0], legR[1], legR[2], legR[3], legR[4])
      .ellipse(-radius * 0.14, radius * 0.16, radius * 0.64, radius * 0.42)
      .circle(radius * 0.42, -radius * 0.2, radius * 0.34)
      .fill(s.fill);
    // Tail, horns and ears.
    g.moveTo(-radius * 0.74, radius * 0.08)
      .quadraticCurveTo(-radius * 0.96, radius * 0.16, -radius * 0.9, radius * 0.42)
      .stroke({ width: 4, color: s.line, cap: 'round' });
    g.circle(-radius * 0.9, radius * 0.44, 5).fill(s.line);
    for (const dx of [-0.18, 0.18])
      g.poly([
        radius * (0.42 + dx * 0.6),
        -radius * 0.5,
        radius * (0.42 + dx * 1.4),
        -radius * 0.72,
        radius * (0.42 + dx * 1.6),
        -radius * 0.44,
      ])
        .fill(swatch.yellow.light)
        .stroke({ width: 3.5, color: s.line, join: 'round' });
    g.ellipse(radius * 0.1, -radius * 0.34, radius * 0.16, radius * 0.09)
      .fill(s.fill)
      .stroke({ width: 3.5, color: s.line });
    // Cow spots, muzzle and eye.
    g.ellipse(-radius * 0.32, radius * 0.12, radius * 0.18, radius * 0.13).fill({
      color: s.line,
      alpha: 0.75,
    });
    g.circle(radius * 0.08, radius * 0.02, radius * 0.12).fill({ color: s.line, alpha: 0.75 });
    g.ellipse(radius * 0.56, -radius * 0.04, radius * 0.24, radius * 0.17)
      .fill(swatch.pink.light)
      .stroke({ width: 3.5, color: s.line });
    g.circle(radius * 0.5, -radius * 0.04, 2.5).fill(ink);
    g.circle(radius * 0.64, -radius * 0.04, 2.5).fill(ink);
    g.circle(radius * 0.48, -radius * 0.28, 4.5).fill(ink);
  }
  if (kind === 'pig') {
    const legL = [-radius * 0.46, radius * 0.36, radius * 0.16, radius * 0.36, 5];
    const legR = [radius * 0.08, radius * 0.36, radius * 0.16, radius * 0.36, 5];
    g.roundRect(legL[0], legL[1], legL[2], legL[3], legL[4])
      .roundRect(legR[0], legR[1], legR[2], legR[3], legR[4])
      .ellipse(-radius * 0.08, radius * 0.1, radius * 0.64, radius * 0.48)
      .circle(radius * 0.36, -radius * 0.08, radius * 0.36)
      .stroke({ width: 8, color: s.line, join: 'round' })
      .roundRect(legL[0], legL[1], legL[2], legL[3], legL[4])
      .roundRect(legR[0], legR[1], legR[2], legR[3], legR[4])
      .ellipse(-radius * 0.08, radius * 0.1, radius * 0.64, radius * 0.48)
      .circle(radius * 0.36, -radius * 0.08, radius * 0.36)
      .fill(s.fill);
    // Curly tail and ears.
    g.moveTo(-radius * 0.7, 0)
      .quadraticCurveTo(-radius * 0.96, -radius * 0.18, -radius * 0.84, -radius * 0.32)
      .quadraticCurveTo(-radius * 0.72, -radius * 0.36, -radius * 0.88, -radius * 0.48)
      .stroke({ width: 4, color: s.line, cap: 'round' });
    g.poly([radius * 0.18, -radius * 0.36, radius * 0.06, -radius * 0.66, radius * 0.34, -radius * 0.42])
      .fill(s.fill)
      .stroke({ width: 4, color: s.line, join: 'round' });
    g.poly([radius * 0.42, -radius * 0.38, radius * 0.44, -radius * 0.66, radius * 0.6, -radius * 0.36])
      .fill(s.fill)
      .stroke({ width: 4, color: s.line, join: 'round' });
    // Snout and eye.
    g.ellipse(radius * 0.68, -radius * 0.02, radius * 0.19, radius * 0.15)
      .fill(swatch.pink.light)
      .stroke({ width: 4, color: s.line });
    g.circle(radius * 0.64, -radius * 0.03, 2.5).fill(ink);
    g.circle(radius * 0.74, -radius * 0.03, 2.5).fill(ink);
    g.circle(radius * 0.44, -radius * 0.2, 4.5).fill(ink);
  }
  if (kind === 'hen') {
    const tail = [
      -radius * 0.48,
      radius * 0.02,
      -radius * 0.92,
      -radius * 0.36,
      -radius * 0.76,
      -radius * 0.04,
      -radius * 0.95,
      -radius * 0.06,
      -radius * 0.66,
      radius * 0.28,
    ];
    // Thin orange legs underneath.
    for (const lx of [-radius * 0.2, radius * 0.08]) {
      g.moveTo(lx, radius * 0.5)
        .lineTo(lx, radius * 0.76)
        .moveTo(lx - 8, radius * 0.76)
        .lineTo(lx + 10, radius * 0.76)
        .stroke({ width: 4, color: swatch.orange.line, cap: 'round' });
    }
    // Red comb on head.
    for (const [cx, cy, r] of [
      [0.24, -0.54, 0.11],
      [0.36, -0.58, 0.12],
      [0.48, -0.5, 0.1],
    ])
      g.circle(radius * cx, radius * cy, radius * r)
        .fill(swatch.red.fill)
        .stroke({ width: 3.5, color: swatch.red.line });
    // Seamless body, tail and head.
    g.poly(tail)
      .ellipse(-radius * 0.08, radius * 0.16, radius * 0.58, radius * 0.44)
      .circle(radius * 0.34, -radius * 0.22, radius * 0.3)
      .stroke({ width: 8, color: s.line, join: 'round' })
      .poly(tail)
      .ellipse(-radius * 0.08, radius * 0.16, radius * 0.58, radius * 0.44)
      .circle(radius * 0.34, -radius * 0.22, radius * 0.3)
      .fill(s.fill);
    // Beak, wing curve and eye.
    g.poly([radius * 0.62, -radius * 0.28, radius * 0.94, -radius * 0.18, radius * 0.6, -radius * 0.1])
      .fill(swatch.orange.fill)
      .stroke({ width: 3.5, color: swatch.orange.line, join: 'round' });
    g.moveTo(-radius * 0.34, radius * 0.1)
      .quadraticCurveTo(-radius * 0.06, radius * 0.4, radius * 0.24, radius * 0.16)
      .stroke({ width: 3.5, color: s.line, cap: 'round' });
    g.circle(radius * 0.42, -radius * 0.28, 4.5).fill(ink);
  }
  if (kind === 'barn') {
    const body = [
      -radius * 0.74,
      radius * 0.76,
      -radius * 0.74,
      -radius * 0.1,
      -radius * 0.48,
      -radius * 0.52,
      0,
      -radius * 0.84,
      radius * 0.48,
      -radius * 0.52,
      radius * 0.74,
      -radius * 0.1,
      radius * 0.74,
      radius * 0.76,
    ];
    g.poly(body).fill(s.fill).stroke({ width: 4, color: s.line, join: 'round' });
    // Roof eaves.
    g.poly(
      [
        -radius * 0.84,
        -radius * 0.06,
        -radius * 0.52,
        -radius * 0.55,
        0,
        -radius * 0.88,
        radius * 0.52,
        -radius * 0.55,
        radius * 0.84,
        -radius * 0.06,
      ],
      false,
    ).stroke({ width: 6, color: s.line, cap: 'round', join: 'round' });
    // Hayloft window and double X-framed doors.
    g.rect(-radius * 0.16, -radius * 0.44, radius * 0.32, radius * 0.26)
      .fill(0xffffff)
      .stroke({ width: 3.5, color: s.line, join: 'round' });
    const dw = radius * 0.72,
      dh = radius * 0.68,
      dy = radius * 0.08;
    g.rect(-dw / 2, dy, dw, dh)
      .fill(0xffffff)
      .stroke({ width: 4, color: s.line, join: 'round' })
      .moveTo(0, dy)
      .lineTo(0, dy + dh)
      .moveTo(-dw / 2, dy)
      .lineTo(dw / 2, dy + dh)
      .moveTo(dw / 2, dy)
      .lineTo(-dw / 2, dy + dh)
      .stroke({ width: 3.5, color: s.line });
  }
  return g;
}

/**
 * A scene's backdrop on a paper of `w` by `h` with its top-left at the origin, drawn behind the stamps. The colors are
 * light tints, so every stamp color and its outline still read on top.
 */
export function sceneArt(id: SceneId, w: number, h: number) {
  const g = new Graphics();
  if (id === 'sea') {
    const y = h * SCENES.sea.horizon;
    g.rect(0, 0, w, h).fill(swatch.blue.light);
    for (const [fx, fy] of [
      [0.12, 0.2],
      [0.55, 0.12],
      [0.85, 0.42],
      [0.3, 0.55],
      [0.7, 0.68],
    ])
      g.moveTo(w * fx - 18, h * fy)
        .quadraticCurveTo(w * fx - 9, h * fy - 7, w * fx, h * fy)
        .quadraticCurveTo(w * fx + 9, h * fy + 7, w * fx + 18, h * fy)
        .stroke({ width: 3, color: swatch.blue.fill, alpha: 0.5, cap: 'round' });
    g.rect(0, y, w, h - y).fill(swatch.yellow.light);
    g.moveTo(0, y).lineTo(w, y).stroke({ width: 3, color: swatch.yellow.line, alpha: 0.6 });
  }
  if (id === 'farm') {
    const y = h * SCENES.farm.horizon;
    g.rect(0, 0, w, y).fill(swatch.blue.light);
    // Soft sky clouds.
    for (const [cx, cy, s] of [
      [0.24, 0.18, 1],
      [0.76, 0.22, 0.85],
    ]) {
      g.circle(w * cx - 18 * s, h * cy + 4 * s, 18 * s)
        .circle(w * cx, h * cy - 4 * s, 22 * s)
        .circle(w * cx + 20 * s, h * cy + 4 * s, 16 * s)
        .fill({ color: 0xffffff, alpha: 0.8 });
    }
    // Green field below the horizon, then a pond on the right.
    g.rect(0, y, w, h - y).fill(swatch.green.light);
    g.moveTo(0, y).lineTo(w, y).stroke({ width: 3, color: swatch.green.line, alpha: 0.5 });
    for (const [gx, gy] of [
      [0.18, 0.62],
      [0.42, 0.82],
      [0.3, 0.52],
    ])
      g.moveTo(w * gx - 8, h * gy)
        .lineTo(w * gx - 12, h * gy - 12)
        .moveTo(w * gx, h * gy)
        .lineTo(w * gx, h * gy - 14)
        .moveTo(w * gx + 8, h * gy)
        .lineTo(w * gx + 12, h * gy - 11)
        .stroke({ width: 2.5, color: swatch.green.line, alpha: 0.45, cap: 'round' });
    const [px, py, rx, ry] = [w * 0.72, h * 0.76, w * 0.18, h * 0.13];
    g.ellipse(px, py, rx, ry)
      .fill(swatch.blue.light)
      .stroke({ width: 3, color: swatch.blue.line, alpha: 0.55 });
    g.moveTo(px - rx * 0.35, py)
      .quadraticCurveTo(px, py - 6, px + rx * 0.35, py)
      .stroke({ width: 2.5, color: swatch.blue.fill, alpha: 0.45, cap: 'round' });
  }
  g.eventMode = 'none';
  return g;
}

/** A Trace Prints maker as she sees it above the mud: the leaf (green, veined), the duck foot (orange) or the cat paw (pink). */
export function traceArt(id: TraceMakerId, scale = 1) {
  const g = new Graphics(),
    s = id === 'leaf' ? swatch.green : id === 'duck' ? swatch.orange : swatch.pink;
  const shape = traceShape(id),
    k = (p: Pt) => [p.x * scale, p.y * scale];
  for (const ps of shape.polys)
    g.poly(ps.flatMap(k)).fill(s.fill).stroke({ width: 5, color: s.line, join: 'round' });
  for (const c of shape.circles)
    g.circle(c.x * scale, c.y * scale, c.r * scale)
      .fill(s.fill)
      .stroke({ width: 5, color: s.line });
  for (const ps of shape.lines)
    g.poly(ps.flatMap(k), false).stroke({ width: 4, color: s.line, cap: 'round' });
  return g;
}
/** The dent a maker leaves: its outline pressed into the mud, a lighter rim up-left so it reads as pressed in, and its inner lines. */
export function printArt(id: TraceMakerId) {
  const g = new Graphics(),
    mud = swatch.brown,
    shape = traceShape(id);
  const rim = (p: Pt) => [p.x - 3, p.y - 3],
    at = (p: Pt) => [p.x, p.y];
  for (const ps of shape.polys)
    g.poly(ps.flatMap(rim)).stroke({ width: 5, color: mud.light, alpha: 0.9, join: 'round' });
  for (const c of shape.circles)
    g.circle(c.x - 3, c.y - 3, c.r).stroke({ width: 5, color: mud.light, alpha: 0.9 });
  for (const ps of shape.polys) g.poly(ps.flatMap(at)).fill({ color: mud.line, alpha: 0.45 });
  for (const c of shape.circles) g.circle(c.x, c.y, c.r).fill({ color: mud.line, alpha: 0.45 });
  for (const ps of shape.lines)
    g.poly(ps.flatMap(at), false).stroke({ width: 4, color: mud.line, alpha: 0.85, cap: 'round' });
  return g;
}
