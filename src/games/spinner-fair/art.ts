/** Spinner Fair's spinners and bars, code-drawn from the palette. Colour is never the only cue: every section and bar carries its critter. */
import { Container, Graphics } from 'pixi.js';
import { Critter, CRITTERS } from '../../art/critter';
import { ink, swatch, wood, type ColorName } from '../../art/palette';
import { label } from '../../ui/text';
import {
  CARD_H,
  CARD_W,
  COLOR_OF,
  sections,
  STAND,
  WEDGE_DEG,
  WEDGES as WEDGE_COUNT,
  type Card,
  type Kind,
  type NumWheel,
  type Wheel,
} from './logic';

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
    stand
      .roundRect(-14, 0, 28, r + STAND - 6, 8)
      .fill(wood.fill)
      .stroke({ width: 4, color: wood.line });
    stand
      .roundRect(-r * 0.45, r + STAND - 14, r * 0.9, 20, 10)
      .fill(wood.fill)
      .stroke({ width: 4, color: wood.line });
  }
  const wheel = new Container();
  const g = new Graphics();
  g.circle(0, 0, r + 8)
    .fill(0xffffff)
    .stroke({ width: 6, color: ink });
  if (opts.bare) {
    wheel.addChild(g);
    const pointer = new Graphics();
    pointer
      .poly([-22, -r - 30, 22, -r - 30, 0, -r + 16])
      .fill(swatch.red.fill)
      .stroke({ width: 5, color: ink, join: 'round' });
    const glow = new Graphics();
    glow.eventMode = 'none';
    node.addChild(stand, wheel, glow, pointer);
    return { node, wheel, glow };
  }
  // A wheel's wedge is its own share of the turn: 60° on six wedges, 45° on eight.
  const deg = 360 / w.length;
  for (const s of sections(w)) {
    const a0 = rad(s.start * deg),
      a1 = rad((s.start + s.count) * deg);
    const c = sw(s.kind);
    // A whole wheel of one critter (level 4's sure spinner) is a plain disc, with no seam from the hub.
    if (s.count === w.length) g.circle(0, 0, r).fill(c.fill).stroke({ width: 4, color: c.line });
    else g.moveTo(0, 0).arc(0, 0, r, a0, a1).closePath().fill(c.fill).stroke({ width: 4, color: c.line });
  }
  wheel.addChild(g);
  for (const s of sections(w)) {
    const mid = rad((s.start + s.count / 2) * deg);
    const at = s.count >= 3 ? 0.55 : 0.62;
    const f = face(s.kind, r * (s.count === 1 ? 0.42 : 0.5));
    f.position.set(Math.cos(mid) * r * at, Math.sin(mid) * r * at);
    f.rotation = mid + Math.PI / 2;
    wheel.addChild(f);
  }
  const hub = new Graphics();
  hub
    .circle(0, 0, r * 0.1)
    .fill(swatch.red.fill)
    .stroke({ width: 4, color: swatch.red.line });
  wheel.addChild(hub);
  const glow = new Graphics();
  glow.eventMode = 'none';
  const pointer = new Graphics();
  pointer
    .poly([-22, -r - 30, 22, -r - 30, 0, -r + 16])
    .fill(swatch.red.fill)
    .stroke({ width: 5, color: ink, join: 'round' });
  node.addChild(stand, wheel, glow, pointer);
  return { node, wheel, glow };
}

/** Draw a pulsing ring over the wedges of `kind` on a wheel of radius `r` (in the wheel's own turned frame). */
export function glowSection(g: Graphics, w: Wheel, kind: Kind, r: number, rotation: number, width: number) {
  g.clear();
  const s = sections(w).find((x) => x.kind === kind);
  if (!s) return;
  const deg = 360 / w.length;
  const a0 = rad(s.start * deg) + rotation,
    a1 = rad((s.start + s.count) * deg) + rotation;
  g.moveTo(0, 0)
    .arc(0, 0, r + 4, a0, a1)
    .closePath()
    .stroke({ width, color: swatch.yellow.fill, join: 'round' });
}

/** One block of a bar, `w` × `h`, in the critter's colours, its bottom edge on (0, 0). */
export function block(kind: Kind, w: number, h: number): Graphics {
  const c = sw(kind);
  return new Graphics()
    .roundRect(-w / 2, -h + 2, w, h - 4, 6)
    .fill(c.fill)
    .stroke({ width: 3, color: c.line });
}

/** One wedge of a level-5 or level-9 wheel (of `wedges` wedges) as its own piece: the sector of wedge `i` drawn around its middle at mid-radius, its critter's face on it. */
export function wedgePiece(
  kind: Kind,
  i: number,
  r: number,
  wedges = WEDGE_COUNT,
): { node: Container; mid: { x: number; y: number }; points: number[] } {
  const deg = 360 / wedges;
  const a0 = rad(i * deg),
    a1 = rad((i + 1) * deg),
    am = (a0 + a1) / 2;
  const mid = { x: Math.cos(am) * r * 0.58, y: Math.sin(am) * r * 0.58 };
  const c = sw(kind);
  const node = new Container();
  const g = new Graphics();
  g.moveTo(-mid.x, -mid.y)
    .arc(-mid.x, -mid.y, r, a0, a1)
    .closePath()
    .fill(c.fill)
    .stroke({ width: 4, color: ink, alpha: 0.7 });
  node.addChild(g);
  const f = face(kind, r * (wedges > WEDGE_COUNT ? 0.3 : 0.36));
  f.rotation = am + Math.PI / 2;
  node.addChild(f);
  // The grab area: the sector beyond the hub, in the piece's own frame.
  const points: number[] = [];
  const hub = r * 0.14;
  for (let k = 0; k <= 8; k++) {
    const a = a0 + ((a1 - a0) * k) / 8;
    points.push(Math.cos(a) * r - mid.x, Math.sin(a) * r - mid.y);
  }
  for (let k = 8; k >= 0; k--) {
    const a = a0 + ((a1 - a0) * k) / 8;
    points.push(Math.cos(a) * hub - mid.x, Math.sin(a) * hub - mid.y);
  }
  node.position.set(mid.x, mid.y);
  return { node, mid, points };
}

/** The hub cap, drawn over the wedge pieces. */
export function hubCap(r: number): Graphics {
  const g = new Graphics()
    .circle(0, 0, r * 0.1)
    .fill(swatch.red.fill)
    .stroke({ width: 4, color: swatch.red.line });
  g.eventMode = 'none';
  return g;
}

/** A level-4 card: the pet's face beaming (sure), shrugging (maybe) or shaking its head (no way), on a card with its sign. */
export function cardArt(card: Card): Container {
  const c = new Container();
  const tint = card === 'sure' ? swatch.green : card === 'maybe' ? swatch.yellow : swatch.red;
  const g = new Graphics();
  g.roundRect(-CARD_W / 2, -CARD_H / 2, CARD_W, CARD_H, 18)
    .fill(0xffffff)
    .stroke({ width: 6, color: tint.line });
  g.roundRect(-CARD_W / 2 + 8, CARD_H / 2 - 44, CARD_W - 16, 36, 12).fill(tint.light);
  // The face.
  const fy = -18;
  g.circle(0, fy, 40).fill(swatch.orange.light).stroke({ width: 4, color: ink });
  g.circle(-14, fy - 8, 5)
    .circle(14, fy - 8, 5)
    .fill(ink);
  if (card === 'sure')
    g.moveTo(-20, fy + 8)
      .quadraticCurveTo(0, fy + 30, 20, fy + 8)
      .stroke({ width: 5, color: ink, cap: 'round' });
  else if (card === 'maybe')
    g.moveTo(-16, fy + 16)
      .lineTo(16, fy + 12)
      .stroke({ width: 5, color: ink, cap: 'round' });
  else
    g.moveTo(-18, fy + 22)
      .quadraticCurveTo(0, fy + 6, 18, fy + 22)
      .stroke({ width: 5, color: ink, cap: 'round' });
  // The sign under the face: a tick, a shrug (two arms up) or a cross; pictured, never read.
  const sy = CARD_H / 2 - 26;
  if (card === 'sure')
    g.moveTo(-16, sy)
      .lineTo(-4, sy + 10)
      .lineTo(18, sy - 10)
      .stroke({ width: 7, color: tint.line, cap: 'round', join: 'round' });
  else if (card === 'maybe') {
    g.moveTo(-34, sy + 6)
      .lineTo(-18, sy - 8)
      .lineTo(-6, sy + 2)
      .stroke({ width: 6, color: tint.line, cap: 'round', join: 'round' });
    g.moveTo(34, sy + 6)
      .lineTo(18, sy - 8)
      .lineTo(6, sy + 2)
      .stroke({ width: 6, color: tint.line, cap: 'round', join: 'round' });
  } else
    g.moveTo(-12, sy - 10)
      .lineTo(12, sy + 10)
      .moveTo(12, sy - 10)
      .lineTo(-12, sy + 10)
      .stroke({ width: 7, color: tint.line, cap: 'round' });
  c.addChild(g);
  return c;
}

/** A level-5 racer: the critter on a round cushion, `size` across. */
export function racerArt(kind: Kind, size: number): Container {
  const c = new Container();
  const k = sw(kind);
  c.addChild(
    new Graphics()
      .roundRect(-size / 2, -size / 2, size, size, 26)
      .fill(0xffffff)
      .stroke({ width: 6, color: k.line }),
  );
  const f = face(kind, size * 0.78);
  c.addChild(f);
  return c;
}

/** Level 6's share strip, drawn from (0, 0): the favourite's part of `total` spins from the left, the friend's after it. Empty before the first spin. */
export function drawStrip(
  g: Graphics,
  w: number,
  h: number,
  fav: Kind,
  friend: Kind,
  count: number,
  total: number,
) {
  g.clear();
  const r = Math.min(14, h / 2);
  g.roundRect(0, 0, w, h, r).fill(0xffffff);
  if (total > 0) {
    const split = (w * count) / total;
    if (split > 0) g.roundRect(0, 0, split, h, r).fill(sw(fav).fill);
    if (split < w) g.roundRect(split, 0, w - split, h, r).fill(sw(friend).fill);
    // Square the seam between the two colours, so the split reads as one straight edge.
    if (split > r && split < w - r) {
      g.rect(split - r, 0, r, h).fill(sw(fav).fill);
      g.rect(split, 0, r, h).fill(sw(friend).fill);
      g.moveTo(split, 0).lineTo(split, h).stroke({ width: 4, color: ink });
    }
  }
  g.roundRect(0, 0, w, h, r).stroke({ width: 5, color: ink });
}

/**
 * The strip's fixed ruler (a tick at every one of `of` parts: sixths at level 6, eighths at level 9) and the dashed
 * marker at the wheel's share, `k` parts, with its arrow underneath; no marker while `k` is null.
 */
export function stripRuler(w: number, h: number, k: number | null, of = WEDGE_COUNT): Graphics {
  const g = new Graphics();
  g.eventMode = 'none';
  for (let i = 0; i <= of; i++) {
    const x = (w * i) / of;
    g.moveTo(x, h + 4)
      .lineTo(x, h + 16)
      .stroke({ width: 4, color: ink, alpha: 0.6, cap: 'round' });
  }
  if (k === null) return g;
  const x = (w * k) / of;
  for (let y = -8; y < h + 8; y += 16)
    g.moveTo(x, y)
      .lineTo(x, y + 9)
      .stroke({ width: 5, color: swatch.red.line, cap: 'round' });
  g.poly([x, h + 12, x - 13, h + 32, x + 13, h + 32])
    .fill(swatch.red.fill)
    .stroke({ width: 4, color: ink, join: 'round' });
  return g;
}

/** The Check button's plate: a green tick on a white plate. */
export function checkButton(w: number, h: number): Graphics {
  return new Graphics()
    .roundRect(-w / 2, -h / 2, w, h, 20)
    .fill(0xffffff)
    .stroke({ width: 6, color: swatch.green.line })
    .moveTo(-24, 0)
    .lineTo(-6, 18)
    .lineTo(26, -18)
    .stroke({ width: 11, color: swatch.green.fill, cap: 'round', join: 'round' });
}

/** A small heart: the pet's favourite. */
export function heart(): Graphics {
  return new Graphics().circle(-8, 0, 9).circle(8, 0, 9).poly([-16, 4, 16, 4, 0, 20]).fill(swatch.red.fill);
}

/** `n` of `of` pips filled in `color`, in rows of four from (0, 0) at the first pip's middle: a count that reads without its numeral. */
export function drawPips(g: Graphics, n: number, of: number, color: { fill: number; line: number }, r = 7) {
  g.clear();
  for (let i = 0; i < of; i++) {
    const x = (i % 4) * (2 * r + 5),
      y = Math.floor(i / 4) * (2 * r + 5);
    g.circle(x, y, r)
      .fill(i < n ? color.fill : 0xffffff)
      .stroke({ width: 3, color: i < n ? color.line : ink, alpha: i < n ? 1 : 0.45 });
  }
}

/**
 * Level 9's order, drawn on the empty strip: the pet's favourite with its heart, then `n` of `of` pips filled ("3 out
 * of every 8", "1 out of every 4"), so the share asked for can be seen as well as heard.
 */
export function rigOrder(fav: Kind, n: number, of: number): Container {
  const c = new Container();
  c.eventMode = 'none';
  const f = face(fav, 56);
  f.position.set(-of * 16 - 34, 0);
  const h = heart();
  h.scale.set(0.7);
  h.position.set(f.x + 26, -22);
  const pips = new Graphics();
  for (let i = 0; i < of; i++)
    pips
      .circle(-of * 16 + 22 + i * 32, 0, 12)
      .fill(i < n ? sw(fav).fill : 0xffffff)
      .stroke({ width: 3, color: i < n ? sw(fav).line : ink, alpha: i < n ? 1 : 0.5 });
  c.addChild(f, h, pips);
  return c;
}

/** A level-6 answer card: about `n` of sixty, its numeral over a small strip drawn at that share, so it reads without the numeral. */
export function aboutCard(n: number, fav: Kind, friend: Kind, w: number, h: number): Container {
  const c = new Container();
  c.addChild(
    new Graphics()
      .roundRect(-w / 2, -h / 2, w, h, 18)
      .fill(0xffffff)
      .stroke({ width: 6, color: swatch.blue.line }),
  );
  const num = label(String(n), 58);
  num.position.set(0, -22);
  const strip = new Graphics();
  drawStrip(strip, w - 36, 26, fav, friend, n, 60);
  strip.position.set(-(w - 36) / 2, h / 2 - 44);
  c.addChild(num, strip);
  return c;
}

/** The fast-forward button: two arrowheads on a rounded plate. */
export function fastButton(w: number, h: number): Container {
  const c = new Container();
  const g = new Graphics()
    .roundRect(-w / 2, -h / 2, w, h, 22)
    .fill(swatch.green.fill)
    .stroke({ width: 6, color: swatch.green.line });
  for (const x of [-34, 4])
    g.poly([x, -26, x + 32, 0, x, 26])
      .fill(0xffffff)
      .stroke({ width: 4, color: swatch.green.line, join: 'round' });
  c.addChild(g);
  return c;
}

// ---- level 7: two dice ----

/** The two dice's soft colours: the first die (the grid's rows) and the second (its columns). */
export const DIE_COLORS: readonly [ColorName, ColorName] = ['blue', 'red'];

/** A sum's colour on the grid, the bars and the cards: seven is yellow; the others cycle, so neighbouring diagonals differ. */
export function sumColor(sum: number): ColorName {
  const cycle: ColorName[] = ['teal', 'purple', 'green', 'orange', 'pink'];
  return sum === 7 ? 'yellow' : cycle[(sum - 2) % 6];
}

const PIPS: readonly (readonly [number, number])[][] = [
  [[0, 0]],
  [
    [-1, -1],
    [1, 1],
  ],
  [
    [-1, -1],
    [0, 0],
    [1, 1],
  ],
  [
    [-1, -1],
    [1, -1],
    [-1, 1],
    [1, 1],
  ],
  [
    [-1, -1],
    [1, -1],
    [0, 0],
    [-1, 1],
    [1, 1],
  ],
  [
    [-1, -1],
    [1, -1],
    [-1, 0],
    [1, 0],
    [-1, 1],
    [1, 1],
  ],
];

/** Draws a die face of `value` pips, `size` across and centred on (0, 0), in a soft colour. */
export function drawDie(g: Graphics, value: number, size: number, color: ColorName) {
  const c = swatch[color];
  g.clear()
    .roundRect(-size / 2, -size / 2, size, size, size * 0.2)
    .fill(c.light)
    .stroke({ width: Math.max(3, size * 0.05), color: c.line });
  for (const [x, y] of PIPS[value - 1]) g.circle(x * size * 0.26, y * size * 0.26, size * 0.09).fill(ink);
}

export function die(value: number, size: number, color: ColorName): Graphics {
  const g = new Graphics();
  drawDie(g, value, size, color);
  return g;
}

/** The dice tray: a felt plate; the game sets the two dice on it. */
export function diceTray(w: number, h: number): Graphics {
  return new Graphics()
    .roundRect(-w / 2, -h / 2, w, h, 26)
    .fill(swatch.green.light)
    .stroke({ width: 7, color: wood.line });
}

/** One grid square, `cell` across and centred on (0, 0): its sum's colour and numeral. */
export function sumSquare(sum: number, cell: number): Container {
  const c = swatch[sumColor(sum)];
  const sq = new Container();
  sq.addChild(
    new Graphics()
      .roundRect(-cell / 2 + 2, -cell / 2 + 2, cell - 4, cell - 4, 8)
      .fill(sum === 7 ? c.fill : c.light)
      .stroke({ width: 3, color: c.line }),
    label(String(sum), cell * 0.5),
  );
  return sq;
}

/** A sum card: the numeral over a grid square in the sum's colour, so the card points at its diagonal of squares. */
export function sumCard(sum: number, size: number): Container {
  const c = swatch[sumColor(sum)];
  const card = new Container();
  card.addChild(
    new Graphics()
      .roundRect(-size / 2, -size / 2, size, size, 18)
      .fill(0xffffff)
      .stroke({ width: 6, color: swatch.blue.line }),
    new Graphics()
      .roundRect(-22, size / 2 - 50, 44, 34, 8)
      .fill(sum === 7 ? c.fill : c.light)
      .stroke({ width: 3, color: c.line }),
  );
  const num = label(String(sum), 60);
  num.position.set(0, -18);
  card.addChild(num);
  return card;
}

/** Draws a row of eleven sum bars from their baseline up: `counts[i]` blocks of `blockH` on bar `i`, in the sum's colour, over a ground line. */
export function drawSumBars(
  g: Graphics,
  bars: { x: number; base: number; pitch: number; w: number },
  counts: readonly number[],
  blockH: number,
) {
  g.clear();
  counts.forEach((n, i) => {
    const c = swatch[sumColor(i + 2)];
    const x = bars.x + i * bars.pitch;
    for (let k = 0; k < n; k++)
      g.roundRect(x + 1, bars.base - (k + 1) * blockH + 1, bars.w - 2, blockH - 2, Math.min(6, blockH / 3))
        .fill(c.fill)
        .stroke({ width: 2, color: c.line });
  });
  g.moveTo(bars.x - 6, bars.base)
    .lineTo(bars.x + 10 * bars.pitch + bars.w + 6, bars.base)
    .stroke({ width: 4, color: ink, alpha: 0.5, cap: 'round' });
}

/** The journal's two-dice card: a three and a four, which make seven. */
export function diceJournalPicture(): Container {
  const c = new Container();
  const a = die(3, 110, DIE_COLORS[0]),
    b = die(4, 110, DIE_COLORS[1]);
  a.position.set(-64, 8);
  a.rotation = -0.12;
  b.position.set(64, -8);
  b.rotation = 0.1;
  c.addChild(a, b);
  return c;
}

// ---- level 8: the number wheel and its towers ----

/** A number's colour on the wheel and on the blocks it stands as (yellow is kept for glows). */
export const NUM_COLORS: readonly ColorName[] = ['teal', 'purple', 'green', 'orange', 'pink', 'blue'];
export const numColor = (n: number) => swatch[NUM_COLORS[(n - 1) % NUM_COLORS.length]];

/** A number spinner of radius `r` with the fixed pointer at the top: one wedge per number, each with its die face and its numeral. */
export function numSpinner(w: NumWheel, r: number): SpinnerArt {
  const node = new Container();
  const wheel = new Container();
  const g = new Graphics();
  g.circle(0, 0, r + 8)
    .fill(0xffffff)
    .stroke({ width: 6, color: ink });
  w.forEach((n, i) => {
    const c = numColor(n);
    g.moveTo(0, 0)
      .arc(0, 0, r, rad(i * WEDGE_DEG), rad((i + 1) * WEDGE_DEG))
      .closePath()
      .fill(c.fill)
      .stroke({ width: 4, color: c.line });
  });
  wheel.addChild(g);
  w.forEach((n, i) => {
    const mid = rad((i + 0.5) * WEDGE_DEG);
    const face = new Graphics();
    const size = r * 0.34;
    face
      .roundRect(-size / 2, -size / 2, size, size, size * 0.2)
      .fill(0xffffff)
      .stroke({ width: 3, color: ink });
    for (const [x, y] of PIPS[n - 1]) face.circle(x * size * 0.26, y * size * 0.26, size * 0.09).fill(ink);
    face.position.set(Math.cos(mid) * r * 0.7, Math.sin(mid) * r * 0.7);
    face.rotation = mid + Math.PI / 2;
    const num = label(String(n), r * 0.2);
    num.position.set(Math.cos(mid) * r * 0.36, Math.sin(mid) * r * 0.36);
    num.rotation = mid + Math.PI / 2;
    wheel.addChild(face, num);
  });
  const hub = new Graphics();
  hub
    .circle(0, 0, r * 0.1)
    .fill(swatch.red.fill)
    .stroke({ width: 4, color: swatch.red.line });
  wheel.addChild(hub);
  const glow = new Graphics();
  glow.eventMode = 'none';
  const pointer = new Graphics();
  pointer
    .poly([-22, -r - 30, 22, -r - 30, 0, -r + 16])
    .fill(swatch.red.fill)
    .stroke({ width: 5, color: ink, join: 'round' });
  node.addChild(wheel, glow, pointer);
  return { node, wheel, glow };
}

/** One tower block, `w` × `h` and centred on (0, 0), in the colour of the number it was spun as, with one pip. */
export function pipBlock(n: number, w: number, h: number): Graphics {
  const c = numColor(n);
  return new Graphics()
    .roundRect(-w / 2, -h / 2 + 2, w, h - 4, 8)
    .fill(c.fill)
    .stroke({ width: 3, color: c.line })
    .circle(0, 0, h * 0.16)
    .fill(ink);
}

/** Draws a dashed outline block, `w` × `h` and centred on (x, y): a block that is not there (the gap the range counts). */
export function drawGapBlock(g: Graphics, x: number, y: number, w: number, h: number, color: number = ink) {
  const x0 = x - w / 2,
    y0 = y - h / 2 + 3,
    x1 = x + w / 2,
    y1 = y + h / 2 - 3;
  g.roundRect(x0, y0, w, y1 - y0, 8).fill({ color: 0xffffff, alpha: 0.55 });
  const dash = (ax: number, ay: number, bx: number, by: number) => {
    const len = Math.hypot(bx - ax, by - ay);
    const n = Math.max(1, Math.round(len / 18));
    for (let i = 0; i < n; i++) {
      const t0 = i / n,
        t1 = (i + 0.55) / n;
      g.moveTo(ax + (bx - ax) * t0, ay + (by - ay) * t0).lineTo(ax + (bx - ax) * t1, ay + (by - ay) * t1);
    }
  };
  dash(x0, y0, x1, y0);
  dash(x1, y0, x1, y1);
  dash(x1, y1, x0, y1);
  dash(x0, y1, x0, y0);
  g.stroke({ width: 4, color, cap: 'round' });
}

/**
 * A number card, `size` across and centred on (0, 0): the numeral with a picture of the same number beside it, so it
 * reads without the numeral. `gap` cards (the range, 0–5) stack that many outline blocks; `die` cards (the typical
 * spin, 1–6) show the die face.
 */
export function numCard(n: number, size: number, kind: 'gap' | 'die'): Container {
  const card = new Container();
  card.addChild(
    new Graphics()
      .roundRect(-size / 2, -size / 2, size, size, 18)
      .fill(0xffffff)
      .stroke({ width: 6, color: swatch.blue.line }),
  );
  const num = label(String(n), 60);
  num.position.set(-size * 0.2, 0);
  card.addChild(num);
  const art = new Graphics();
  if (kind === 'gap') {
    const bh = 19;
    for (let i = 0; i < n; i++) drawGapBlock(art, size * 0.24, ((n - 1) / 2 - i) * bh, 38, bh);
  } else {
    const d = 46;
    art
      .roundRect(size * 0.24 - d / 2, -d / 2, d, d, d * 0.2)
      .fill(numColor(n).light)
      .stroke({ width: 3, color: numColor(n).line });
    for (const [x, y] of PIPS[n - 1])
      art.circle(size * 0.24 + x * d * 0.26, y * d * 0.26, d * 0.09).fill(ink);
  }
  card.addChild(art);
  return card;
}
