/** Spinner Fair's spinners and bars, code-drawn from the palette. Colour is never the only cue: every section and bar carries its critter. */
import { Container, Graphics } from 'pixi.js';
import { Critter, CRITTERS } from '../../art/critter';
import { ink, swatch, wood, type ColorName } from '../../art/palette';
import { CARD_H, CARD_W, COLOR_OF, sections, STAND, WEDGE_DEG, type Card, type Kind, type Wheel } from './logic';

export const sw = (k: Kind) => swatch[COLOR_OF[k] as ColorName];

/** A still critter whose middle sits on (0, 0), `size` units tall. */
export function face(kind: Kind, size: number): Critter {
  const c = new Critter(CRITTERS[kind]);
  c.alive = false;
  const s = size / 250;
  c.scale.set(s);
  c.pivot.set(0, -125);
  return c;
}

/** Clockwise from the top: the wheel's wedge-0 edge points up at rotation 0. */
const rad = (deg: number) => ((deg - 90) * Math.PI) / 180;

export interface SpinnerArt {
  node: Container;
  /** The part that turns: sections, faces and hub. */
  wheel: Container;
  /** The glow over one critter's section (help), redrawn by the game. */
  glow: Graphics;
}

export interface SpinnerOptions {
  /** Draw the post and foot (levels 1–3); levels 4–5 stack or crowd spinners, so they go without. */
  stand?: boolean;
  /** Leave the sections out: level 5 draws each wedge as its own movable piece on top. */
  bare?: boolean;
}

/** A spinner of radius `r` on a stand, with the fixed pointer at the top; one section per critter, its face at the middle. */
export function spinner(w: Wheel, r: number, opts: SpinnerOptions = {}): SpinnerArt {
  const node = new Container();
  const stand = new Graphics();
  if (opts.stand !== false) {
    stand.roundRect(-14, 0, 28, r + STAND - 6, 8).fill(wood.fill).stroke({ width: 4, color: wood.line });
    stand.roundRect(-r * 0.45, r + STAND - 14, r * 0.9, 20, 10).fill(wood.fill).stroke({ width: 4, color: wood.line });
  }
  const wheel = new Container();
  const g = new Graphics();
  g.circle(0, 0, r + 8).fill(0xffffff).stroke({ width: 6, color: ink });
  if (opts.bare) {
    wheel.addChild(g);
    const pointer = new Graphics();
    pointer.poly([-22, -r - 30, 22, -r - 30, 0, -r + 16]).fill(swatch.red.fill).stroke({ width: 5, color: ink, join: 'round' });
    const glow = new Graphics();
    glow.eventMode = 'none';
    node.addChild(stand, wheel, glow, pointer);
    return { node, wheel, glow };
  }
  for (const s of sections(w)) {
    const a0 = rad(s.start * WEDGE_DEG), a1 = rad((s.start + s.count) * WEDGE_DEG);
    const c = sw(s.kind);
    g.moveTo(0, 0).arc(0, 0, r, a0, a1).closePath().fill(c.fill).stroke({ width: 4, color: c.line });
  }
  wheel.addChild(g);
  for (const s of sections(w)) {
    const mid = rad((s.start + s.count / 2) * WEDGE_DEG);
    const at = s.count >= 3 ? 0.55 : 0.62;
    const f = face(s.kind, r * (s.count === 1 ? 0.42 : 0.5));
    f.position.set(Math.cos(mid) * r * at, Math.sin(mid) * r * at);
    f.rotation = mid + Math.PI / 2;
    wheel.addChild(f);
  }
  const hub = new Graphics();
  hub.circle(0, 0, r * 0.1).fill(swatch.red.fill).stroke({ width: 4, color: swatch.red.line });
  wheel.addChild(hub);
  const glow = new Graphics();
  glow.eventMode = 'none';
  const pointer = new Graphics();
  pointer.poly([-22, -r - 30, 22, -r - 30, 0, -r + 16]).fill(swatch.red.fill).stroke({ width: 5, color: ink, join: 'round' });
  node.addChild(stand, wheel, glow, pointer);
  return { node, wheel, glow };
}

/** Draw a pulsing ring over the wedges of `kind` on a wheel of radius `r` (in the wheel's own turned frame). */
export function glowSection(g: Graphics, w: Wheel, kind: Kind, r: number, rotation: number, width: number) {
  g.clear();
  const s = sections(w).find((x) => x.kind === kind);
  if (!s) return;
  const a0 = rad(s.start * WEDGE_DEG) + rotation, a1 = rad((s.start + s.count) * WEDGE_DEG) + rotation;
  g.moveTo(0, 0).arc(0, 0, r + 4, a0, a1).closePath().stroke({ width, color: swatch.yellow.fill, join: 'round' });
}

/** One block of a bar, `w` × `h`, in the critter's colours, its bottom edge on (0, 0). */
export function block(kind: Kind, w: number, h: number): Graphics {
  const c = sw(kind);
  return new Graphics().roundRect(-w / 2, -h + 2, w, h - 4, 6).fill(c.fill).stroke({ width: 3, color: c.line });
}

/** One wedge of a level-5 wheel as its own piece: the sector of wedge `i` drawn around its middle at mid-radius, its critter's face on it. */
export function wedgePiece(kind: Kind, i: number, r: number): { node: Container; mid: { x: number; y: number }; points: number[] } {
  const a0 = rad(i * WEDGE_DEG), a1 = rad((i + 1) * WEDGE_DEG), am = (a0 + a1) / 2;
  const mid = { x: Math.cos(am) * r * 0.58, y: Math.sin(am) * r * 0.58 };
  const c = sw(kind);
  const node = new Container();
  const g = new Graphics();
  g.moveTo(-mid.x, -mid.y).arc(-mid.x, -mid.y, r, a0, a1).closePath().fill(c.fill).stroke({ width: 4, color: ink, alpha: 0.7 });
  node.addChild(g);
  const f = face(kind, r * 0.36);
  f.rotation = am + Math.PI / 2;
  node.addChild(f);
  // The grab area: the sector beyond the hub, in the piece's own frame.
  const points: number[] = [];
  const hub = r * 0.14;
  for (let k = 0; k <= 8; k++) { const a = a0 + ((a1 - a0) * k) / 8; points.push(Math.cos(a) * r - mid.x, Math.sin(a) * r - mid.y); }
  for (let k = 8; k >= 0; k--) { const a = a0 + ((a1 - a0) * k) / 8; points.push(Math.cos(a) * hub - mid.x, Math.sin(a) * hub - mid.y); }
  node.position.set(mid.x, mid.y);
  return { node, mid, points };
}

/** The hub cap, drawn over the wedge pieces. */
export function hubCap(r: number): Graphics {
  const g = new Graphics().circle(0, 0, r * 0.1).fill(swatch.red.fill).stroke({ width: 4, color: swatch.red.line });
  g.eventMode = 'none';
  return g;
}

/** A level-4 card: the pet's face beaming (sure), shrugging (maybe) or shaking its head (no way), on a card with its sign. */
export function cardArt(card: Card): Container {
  const c = new Container();
  const tint = card === 'sure' ? swatch.green : card === 'maybe' ? swatch.yellow : swatch.red;
  const g = new Graphics();
  g.roundRect(-CARD_W / 2, -CARD_H / 2, CARD_W, CARD_H, 18).fill(0xffffff).stroke({ width: 6, color: tint.line });
  g.roundRect(-CARD_W / 2 + 8, CARD_H / 2 - 44, CARD_W - 16, 36, 12).fill(tint.light);
  // The face.
  const fy = -18;
  g.circle(0, fy, 40).fill(swatch.orange.light).stroke({ width: 4, color: ink });
  g.circle(-14, fy - 8, 5).circle(14, fy - 8, 5).fill(ink);
  if (card === 'sure') g.moveTo(-20, fy + 8).quadraticCurveTo(0, fy + 30, 20, fy + 8).stroke({ width: 5, color: ink, cap: 'round' });
  else if (card === 'maybe') g.moveTo(-16, fy + 16).lineTo(16, fy + 12).stroke({ width: 5, color: ink, cap: 'round' });
  else g.moveTo(-18, fy + 22).quadraticCurveTo(0, fy + 6, 18, fy + 22).stroke({ width: 5, color: ink, cap: 'round' });
  // The sign under the face: a tick, a shrug (two arms up) or a cross; pictured, never read.
  const sy = CARD_H / 2 - 26;
  if (card === 'sure') g.moveTo(-16, sy).lineTo(-4, sy + 10).lineTo(18, sy - 10).stroke({ width: 7, color: tint.line, cap: 'round', join: 'round' });
  else if (card === 'maybe') {
    g.moveTo(-34, sy + 6).lineTo(-18, sy - 8).lineTo(-6, sy + 2).stroke({ width: 6, color: tint.line, cap: 'round', join: 'round' });
    g.moveTo(34, sy + 6).lineTo(18, sy - 8).lineTo(6, sy + 2).stroke({ width: 6, color: tint.line, cap: 'round', join: 'round' });
  } else g.moveTo(-12, sy - 10).lineTo(12, sy + 10).moveTo(12, sy - 10).lineTo(-12, sy + 10).stroke({ width: 7, color: tint.line, cap: 'round' });
  c.addChild(g);
  return c;
}

/** A level-5 racer: the critter on a round cushion, `size` across. */
export function racerArt(kind: Kind, size: number): Container {
  const c = new Container();
  const k = sw(kind);
  c.addChild(new Graphics().roundRect(-size / 2, -size / 2, size, size, 26).fill(0xffffff).stroke({ width: 6, color: k.line }));
  const f = face(kind, size * 0.78);
  c.addChild(f);
  return c;
}
