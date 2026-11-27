/** Caravan Days' code-drawn pieces: the camel that kneels, bales, landmark oases, the home tent, the city gate, suns, the waterskin, flags, Go, icon and sticker. */
import { Container, Graphics, Text } from 'pixi.js';
import { cream, ink, shadow, swatch, type ColorName } from '../../art/palette';
import { darken } from '../../art/paper';
import { finish } from '../../ui/buttons';
import { SKIN, type Good, type Landmark } from './logic';

const line = (color: number, width = 5) => ({ width, color, join: 'round' as const, cap: 'round' as const });
export const SAND = { fill: 0xf2d9a4, line: 0xc99d58, dark: 0xd9b472 };
export const CAMEL_COLORS = { fill: 0xd9a66b, line: 0x8f6134, dark: 0xb9834f, light: 0xeec48c };
const WATER = { fill: 0x8fd0ea, line: 0x4fa3c7 };
const PALM = { trunk: 0xa0683a, ring: 0x74471f, leaf: 0x6cba52, back: 0x3f8f45, date: 0xb4532a };
const ROCK = { fill: 0xd2694d, line: 0x9c3f2b };
const TILE = { fill: 0x5aa6d8, line: 0x2f6f9e, light: 0x9fd3f2 };
const FLAG = { fill: 0xf26d6d, line: 0xb03a3a };

function label(text: string, size = 30, fill: number = ink): Text {
  const t = new Text({
    text,
    style: { fontFamily: 'Nunito, sans-serif', fontSize: size, fontWeight: '800', fill, align: 'center' },
  });
  t.anchor.set(0.5);
  t.eventMode = 'none';
  return t;
}

// ——— The camel ———

type P = [number, number];
const flatPts = (pts: P[]) => pts.flat();

/** A closed shape through `pts`, smoothed with curves through the midpoints (a cut-paper silhouette). */
function smooth(g: Graphics, pts: P[]): Graphics {
  const n = pts.length;
  const mid = (a: P, b: P): P => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  const start = mid(pts[n - 1], pts[0]);
  g.moveTo(start[0], start[1]);
  for (let i = 0; i < n; i++) {
    const m = mid(pts[i], pts[(i + 1) % n]);
    g.quadraticCurveTo(pts[i][0], pts[i][1], m[0], m[1]);
  }
  return g.closePath();
}

/** A shaggy tuft: a fan of points along a base line, for the camel's forelock, throat and tail tip. */
function tuft(g: Graphics, x: number, y: number, w: number, h: number, tips: number, lean = 0): Graphics {
  const pts: P[] = [[x - w / 2, y]];
  for (let i = 0; i < tips; i++) {
    const t = (i + 0.5) / tips;
    pts.push([x - w / 2 + w * t + lean, y - h * (0.75 + 0.25 * Math.sin(i * 2.3 + 1))]);
    if (i < tips - 1) pts.push([x - w / 2 + (w * (i + 1)) / tips, y - h * 0.35]);
  }
  pts.push([x + w / 2, y]);
  return g.poly(flatPts(pts), true);
}

const BLANKET = { fill: 0xb5563c, stripe: 0xf1e2bd, tassel: 0xe8b04a };
const TUFT = 0xa8763f;

/**
 * A tan camel cut from paper: a lumpy two-hump back with a woven blanket over the saddle, a long bowed neck that dips
 * to drink, a droopy-lipped head with a heavy sleepy lid and long lashes, shaggy tufts, knobbly knees and wide flat
 * feet that fold under it when it kneels. Origin at the ground under its chest, facing right; `scale` sets its size
 * (1 is about 260 × 200 standing).
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
      // The two far legs are a shade darker, so the near pair reads in front.
      const far = i % 2 === 0;
      const tone = far ? CAMEL_COLORS.dark : CAMEL_COLORS.fill;
      const leg = new Graphics();
      smooth(leg, [
        [-16, -24],
        [15, -24],
        [12, 24],
        [12, 36],
        [9, 50],
        [8, 64],
        [-7, 64],
        [-9, 50],
        [-13, 36],
        [-12, 24],
      ]).fill(tone);
      // A knobbly knee and a wide, split foot pad.
      leg.ellipse(0, 43, 7, 5).fill(darken(tone, 0.16));
      smooth(leg, [
        [-12, 82],
        [-12, 70],
        [-6, 63],
        [7, 63],
        [14, 70],
        [16, 82],
      ]).fill(darken(tone, 0.28));
      leg
        .moveTo(2, 72)
        .lineTo(2, 81)
        .stroke(line(darken(tone, 0.5), 2));
      this.legs.push(leg);
      this.addChild(leg);
    }
    // The neck sits behind the chest, so its base tucks under the body; it pivots at the chest.
    const neck = new Graphics();
    smooth(neck, [
      [-26, 12],
      [-22, -20],
      [-10, -58],
      [2, -96],
      [16, -122],
      [36, -118],
      [40, -96],
      [44, -62],
      [40, -28],
      [28, 14],
    ]).fill(CAMEL_COLORS.fill);
    // A shaggy throat beard down the front of the neck.
    neck
      .poly(
        flatPts([
          [36, -96],
          [50, -88],
          [42, -80],
          [54, -70],
          [44, -64],
          [54, -52],
          [42, -46],
          [44, -30],
          [36, -40],
        ]),
        true,
      )
      .fill(TUFT);
    const head = new Graphics();
    // Ears first, so the skull overlaps their roots.
    smooth(head, [
      [14, -138],
      [6, -156],
      [20, -150],
      [28, -138],
    ]).fill(CAMEL_COLORS.dark);
    smooth(head, [
      [10, -118],
      [14, -140],
      [32, -152],
      [56, -148],
      [74, -134],
      [92, -122],
      [100, -110],
      [96, -98],
      [86, -96],
      [80, -100],
      [74, -92],
      [58, -90],
      [36, -94],
      [18, -100],
    ]).fill(CAMEL_COLORS.fill);
    // The lighter muzzle and droopy lip.
    smooth(head, [
      [62, -120],
      [86, -122],
      [99, -110],
      [95, -99],
      [86, -97],
      [80, -101],
      [72, -94],
      [58, -98],
    ]).fill(CAMEL_COLORS.light);
    tuft(head, 34, -146, 30, 16, 4, 3).fill(TUFT);
    // The sleepy eye: a dark almond, a heavy lid over its top half and three long lashes.
    head.ellipse(52, -124, 8, 7).fill(0x3a2a22);
    head.circle(55, -126, 2.4).fill(0xffffff);
    head.moveTo(43, -126).quadraticCurveTo(52, -133, 61, -125).lineTo(43, -126).fill(CAMEL_COLORS.dark);
    head.moveTo(44, -125).quadraticCurveTo(52, -131, 60, -125).stroke(line(0x3a2a22, 2.5));
    head
      .moveTo(47, -126)
      .quadraticCurveTo(46, -121, 43, -118)
      .moveTo(52, -125)
      .quadraticCurveTo(52, -120, 50, -116)
      .moveTo(57, -125)
      .quadraticCurveTo(58, -120, 57, -116)
      .stroke(line(0x3a2a22, 2));
    // A slit nostril and a contented mouth.
    head.moveTo(88, -116).quadraticCurveTo(93, -114, 94, -109).stroke(line(CAMEL_COLORS.line, 3));
    head.moveTo(70, -100).quadraticCurveTo(78, -96, 84, -100).stroke(line(CAMEL_COLORS.line, 2.5));
    // A rope collar with two brass bells.
    this.bells.moveTo(4, -56).quadraticCurveTo(24, -48, 44, -60).stroke(line(BLANKET.fill, 4));
    this.bells.circle(18, -42, 9).fill(swatch.yellow.fill);
    this.bells.circle(34, -46, 8).fill(swatch.yellow.fill);
    this.bells
      .moveTo(14, -40)
      .lineTo(22, -40)
      .moveTo(30, -44)
      .lineTo(38, -44)
      .stroke(line(swatch.yellow.line, 2));
    this.neck.addChild(neck, head, this.bells);
    this.neck.position.set(84, -40);
    this.body.addChild(this.neck);

    const torso = new Graphics();
    // One silhouette: rump, a taller back hump, the dip of the saddle, a rounder front hump, withers, chest and belly.
    smooth(torso, [
      [-70, 6],
      [-92, -6],
      [-102, -30],
      [-98, -58],
      [-86, -82],
      [-78, -106],
      [-62, -124],
      [-42, -126],
      [-26, -114],
      [-17, -96],
      [-8, -86],
      [2, -102],
      [16, -122],
      [36, -128],
      [54, -118],
      [64, -98],
      [78, -80],
      [94, -64],
      [102, -44],
      [96, -20],
      [82, -2],
      [50, 6],
      [10, 8],
      [-30, 6],
    ]).fill(CAMEL_COLORS.fill);
    tuft(torso, -52, -114, 26, 11, 3, -3).fill(TUFT);
    tuft(torso, 28, -120, 26, 11, 3, -3).fill(TUFT);
    // The woven blanket over the saddle: cream with a red-brown stripe, a fringed hem and tassels.
    const blanket = new Graphics();
    smooth(blanket, [
      [-36, -86],
      [-12, -74],
      [14, -86],
      [26, -66],
      [24, -36],
      [-4, -32],
      [-38, -36],
      [-42, -66],
    ]).fill(BLANKET.fill);
    blanket
      .moveTo(-41, -62)
      .quadraticCurveTo(-8, -57, 25, -62)
      .lineTo(25, -50)
      .quadraticCurveTo(-8, -45, -40, -50)
      .closePath()
      .fill(BLANKET.stripe);
    // A zigzag woven along the stripe, and a fringe of tassels under the hem.
    blanket.moveTo(-34, -56);
    for (let x = -34, up = true; x <= 20; x += 6, up = !up) blanket.lineTo(x, up ? -58 : -52);
    blanket.stroke(line(BLANKET.fill, 2.5));
    for (const x of [-32, -18, -4, 10, 22]) {
      const y = x === -4 ? -33 : -36;
      blanket
        .moveTo(x, y)
        .lineTo(x, y + 9)
        .stroke(line(BLANKET.tassel, 2.5));
      blanket.circle(x, y + 12, 4).fill(BLANKET.tassel);
    }
    const tail = new Graphics();
    smooth(tail, [
      [-96, -54],
      [-112, -44],
      [-118, -18],
      [-112, -18],
      [-106, -42],
      [-94, -46],
    ]).fill(CAMEL_COLORS.dark);
    tuft(tail, -115, -4, 16, -18, 3).fill(TUFT);
    this.body.addChild(tail, torso, blanket);
    this.load.position.set(-8, -118);
    this.body.addChild(this.load);
    this.addChild(this.body);
    // Every drawn part lets a touch fall through; only a bale on the back (a child of `load`) takes one.
    for (const part of [ground, ...this.legs, torso, blanket, tail, neck, head, this.bells])
      part.eventMode = 'none';
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
  g.roundRect(-w / 2, -h / 2, w, h, 16)
    .fill(sw.fill)
    .stroke(line(sw.line, 5));
  g.moveTo(-w / 2, -h * 0.15)
    .lineTo(w / 2, -h * 0.15)
    .moveTo(-w / 2, h * 0.15)
    .lineTo(w / 2, h * 0.15)
    .stroke(line(sw.line, 3));
  g.moveTo(-w * 0.2, -h / 2)
    .lineTo(-w * 0.2, h / 2)
    .moveTo(w * 0.2, -h / 2)
    .lineTo(w * 0.2, h / 2)
    .stroke(line(sw.line, 3));
  g.roundRect(-w * 0.28, -h * 0.05, w * 0.56, h * 0.1, 4).fill(sw.light);
  return g;
}

// ——— Places ———

/**
 * One palm frond: a curved, drooping leaf from `at` with its lower edge cut into leaflets (notches), so it reads as
 * snipped paper rather than a stroke. `i` only varies the notch rhythm between fronds.
 */
function frond(g: Graphics, at: P, angle: number, len: number, droop: number, color: number, i: number) {
  const dx = Math.cos(angle),
    dy = Math.sin(angle);
  const end: P = [at[0] + dx * len, at[1] + dy * len + len * droop];
  const ctl: P = [at[0] + dx * len * 0.55, at[1] + dy * len * 0.55 - len * 0.18];
  const along = (t: number): [P, P] => {
    const u = 1 - t;
    const p: P = [
      u * u * at[0] + 2 * u * t * ctl[0] + t * t * end[0],
      u * u * at[1] + 2 * u * t * ctl[1] + t * t * end[1],
    ];
    const tx = 2 * u * (ctl[0] - at[0]) + 2 * t * (end[0] - ctl[0]);
    const ty = 2 * u * (ctl[1] - at[1]) + 2 * t * (end[1] - ctl[1]);
    const m = Math.hypot(tx, ty) || 1;
    return [p, [-ty / m, tx / m]];
  };
  const width = len * 0.2;
  const steps = 9;
  const upper: P[] = [];
  const lower: P[] = [];
  for (let k = 0; k <= steps; k++) {
    const t = k / steps;
    const [p, n] = along(t);
    const w = width * Math.pow(Math.sin(Math.PI * Math.min(0.97, t * 0.92 + 0.06)), 0.7);
    // The side away from the sky is the notched one.
    const side = n[1] > 0 ? 1 : -1;
    upper.push([p[0] - n[0] * side * w * 0.55, p[1] - n[1] * side * w * 0.55]);
    const deep = (k + i) % 2 === 0 ? 1.15 : 0.45;
    lower.push([p[0] + n[0] * side * w * deep, p[1] + n[1] * side * w * deep]);
  }
  g.poly([...upper, ...lower.reverse()].flat(), true).fill(color);
  const [m0] = along(0.05);
  const [m1] = along(0.5);
  const [m2] = along(0.92);
  g.moveTo(m0[0], m0[1])
    .quadraticCurveTo(m1[0], m1[1], m2[0], m2[1])
    .stroke(line(darken(color, 0.3), 2));
}

/** A pool of water with its landmark above: a palm, a red rock or a little spring. */
export function oasisArt(landmark: Landmark, size = 120, glow = false): Container {
  const c = new Container();
  const g = new Graphics();
  const r = size / 2;
  if (glow) g.ellipse(0, r * 0.35, r * 1.15, r * 0.6).fill({ color: swatch.yellow.fill, alpha: 0.55 });
  g.ellipse(0, r * 0.35, r * 0.95, r * 0.42)
    .fill(WATER.fill)
    .stroke(line(WATER.line, 5));
  g.ellipse(-r * 0.3, r * 0.28, r * 0.3, r * 0.1).fill({ color: 0xffffff, alpha: 0.5 });
  c.addChild(g);
  const mark = new Graphics();
  if (landmark === 'palm') {
    // A date palm: a leaning ringed trunk, a hanging bunch of dates, and fronds cut with notched edges in two greens.
    const crown: P = [r * 0.02, -r * 0.92];
    smooth(mark, [
      [r * 0.1, r * 0.24],
      [r * 0.26, -r * 0.2],
      [r * 0.16, -r * 0.62],
      [crown[0] + r * 0.08, crown[1]],
      [crown[0] - r * 0.07, crown[1] + r * 0.02],
      [r * 0.03, -r * 0.6],
      [r * 0.12, -r * 0.2],
      [-r * 0.06, r * 0.26],
    ]).fill(PALM.trunk);
    for (let i = 1; i <= 5; i++) {
      const t = i / 6;
      const x = r * (0.03 + 0.17 * Math.sin(t * Math.PI * 0.9)) + (crown[0] - r * 0.0) * t;
      const y = r * 0.22 + (crown[1] - r * 0.22) * t;
      const w = r * (0.12 - 0.05 * t);
      mark
        .moveTo(x - w, y - 3)
        .quadraticCurveTo(x, y + 3, x + w, y - 3)
        .stroke(line(PALM.ring, 2.5));
    }
    const fronds: [number, number, number][] = [
      // angle (0 is right, up is negative), length, droop
      [-2.5, 0.78, 0.5],
      [-0.55, 0.8, 0.5],
      [-1.95, 0.7, 0.35],
      [-1.15, 0.62, 0.25],
      [-2.95, 0.66, 0.65],
      [-0.05, 0.7, 0.7],
    ];
    fronds.forEach(([a, len, droop], i) =>
      frond(mark, crown, a, len * r * 1.25, droop, i < 3 ? PALM.back : PALM.leaf, i),
    );
    for (const [x, y] of [
      [-0.06, -0.8],
      [0.04, -0.76],
      [0.12, -0.8],
      [0.0, -0.69],
      [0.09, -0.68],
    ])
      mark.circle(crown[0] + x * r, y * r, r * 0.065).fill(PALM.date);
  } else if (landmark === 'rock') {
    mark
      .moveTo(-r * 0.55, r * 0.05)
      .lineTo(-r * 0.35, -r * 0.75)
      .lineTo(-r * 0.05, -r * 0.5)
      .lineTo(r * 0.2, -r * 0.95)
      .lineTo(r * 0.55, r * 0.05)
      .closePath()
      .fill(ROCK.fill)
      .stroke(line(ROCK.line, 5));
    mark
      .moveTo(-r * 0.3, -r * 0.2)
      .lineTo(-r * 0.05, -r * 0.5)
      .stroke(line(0xffffff, 3));
  } else {
    mark
      .roundRect(-r * 0.45, -r * 0.5, r * 0.9, r * 0.45, 12)
      .fill(SAND.dark)
      .stroke(line(SAND.line, 4));
    mark
      .moveTo(0, -r * 0.5)
      .quadraticCurveTo(-r * 0.2, -r * 0.95, 0, -r * 1.05)
      .quadraticCurveTo(r * 0.2, -r * 0.95, 0, -r * 0.5)
      .fill(WATER.fill)
      .stroke(line(WATER.line, 4));
    mark
      .circle(-r * 0.3, -r * 0.85, 5)
      .circle(r * 0.32, -r * 0.8, 5)
      .fill(WATER.fill);
  }
  c.addChild(mark);
  return c;
}

/** The home tent the caravan sets out from. */
export function homeArt(size = 120): Graphics {
  const g = new Graphics();
  const r = size / 2;
  g.ellipse(0, r * 0.4, r * 0.9, r * 0.2).fill({ color: shadow, alpha: 0.12 });
  g.moveTo(-r * 0.9, r * 0.35)
    .lineTo(0, -r * 0.8)
    .lineTo(r * 0.9, r * 0.35)
    .closePath()
    .fill(swatch.orange.light)
    .stroke(line(swatch.orange.line, 5));
  g.moveTo(-r * 0.3, r * 0.35)
    .lineTo(0, -r * 0.2)
    .lineTo(r * 0.3, r * 0.35)
    .closePath()
    .fill(swatch.orange.line);
  g.moveTo(0, -r * 0.8)
    .lineTo(0, -r * 1.05)
    .stroke(line(swatch.orange.line, 4));
  g.moveTo(0, -r * 1.05)
    .lineTo(r * 0.3, -r * 0.95)
    .lineTo(0, -r * 0.85)
    .closePath()
    .fill(FLAG.fill);
  return g;
}

/** The blue-tiled city wall with its gate, open or shut. */
export function cityArt(size = 120, open = false): Graphics {
  const g = new Graphics();
  const r = size / 2;
  g.ellipse(0, r * 0.45, r, r * 0.2).fill({ color: shadow, alpha: 0.12 });
  g.roundRect(-r, -r * 0.5, r * 2, r * 0.95, 10)
    .fill(TILE.fill)
    .stroke(line(TILE.line, 5));
  for (let i = 0; i < 5; i++)
    g.rect(-r + i * r * 0.4 + r * 0.08, -r * 0.72, r * 0.24, r * 0.26)
      .fill(TILE.fill)
      .stroke(line(TILE.line, 4));
  for (let y = 0; y < 3; y++)
    for (let x = 0; x < 4; x++)
      g.rect(-r * 0.86 + x * r * 0.46 + (y % 2) * r * 0.2, -r * 0.38 + y * r * 0.26, r * 0.22, r * 0.14).fill(
        TILE.light,
      );
  g.roundRect(-r * 0.3, -r * 0.1, r * 0.6, r * 0.55, 14).fill(open ? WATER.fill : TILE.line);
  if (open) {
    g.rect(-r * 0.3, -r * 0.1, r * 0.1, r * 0.55).fill(SAND.line);
    g.rect(r * 0.2, -r * 0.1, r * 0.1, r * 0.55).fill(SAND.line);
  } else {
    g.moveTo(0, -r * 0.1)
      .lineTo(0, r * 0.45)
      .stroke(line(TILE.light, 3));
  }
  g.moveTo(-r * 0.9, -r * 0.72)
    .lineTo(-r * 0.9, -r * 1.05)
    .stroke(line(TILE.line, 4));
  g.moveTo(-r * 0.9, -r * 1.05)
    .lineTo(-r * 0.6, -r * 0.95)
    .lineTo(-r * 0.9, -r * 0.85)
    .closePath()
    .fill(TILE.light);
  return g;
}

/** A sun for one day on the road. */
export function sunArt(size = 44, lit = true): Graphics {
  const g = new Graphics();
  const r = size / 2;
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    g.moveTo(Math.cos(a) * r * 0.7, Math.sin(a) * r * 0.7)
      .lineTo(Math.cos(a) * r, Math.sin(a) * r)
      .stroke(line(lit ? swatch.orange.fill : SAND.line, 4));
  }
  g.circle(0, 0, r * 0.55)
    .fill(lit ? swatch.yellow.fill : SAND.dark)
    .stroke(line(lit ? swatch.orange.fill : SAND.line, 4));
  return g;
}

/** The waterskin: a leather bag with `of` drop slots, `full` of them filled. */
export function skinArt(full: number, of = SKIN): Container {
  const c = new Container();
  c.eventMode = 'none';
  const g = new Graphics();
  const w = 60 + of * 46;
  g.roundRect(-w / 2, -32, w, 64, 26)
    .fill(CAMEL_COLORS.dark)
    .stroke(line(CAMEL_COLORS.line, 5));
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
  g.moveTo(0, -20)
    .quadraticCurveTo(16, 4, 0, 18)
    .quadraticCurveTo(-16, 4, 0, -20)
    .fill(full ? WATER.fill : CAMEL_COLORS.light)
    .stroke(line(full ? WATER.line : CAMEL_COLORS.line, 4));
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
export function goArt(w: number, h: number, live = true, text = 'Go'): Container {
  const c = new Container();
  const g = finish({ w, h, corner: 28 }, live ? swatch.green : swatch.white);
  c.addChild(g);
  const t = label(text, 40, live ? cream : SAND.line);
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
    g.roundRect(-r * 0.85, -r * 0.4, r * 1.5, r * 0.8, r * 0.2)
      .fill(c.fill)
      .stroke(line(c.line, 4));
    g.ellipse(r * 0.65, 0, r * 0.22, r * 0.4)
      .fill(c.light)
      .stroke(line(c.line, 4));
    g.ellipse(r * 0.65, 0, r * 0.08, r * 0.15).fill(c.line);
    g.moveTo(-r * 0.6, -r * 0.4)
      .quadraticCurveTo(-r * 0.4, 0, -r * 0.6, r * 0.4)
      .stroke(line(c.light, 4));
  } else if (good === 'tea') {
    g.roundRect(-r * 0.8, -r * 0.55, r * 1.6, r * 1.1, 8)
      .fill(c.fill)
      .stroke(line(c.line, 4));
    g.roundRect(-r * 0.6, -r * 0.35, r * 1.2, r * 0.7, 6).stroke(line(c.light, 3));
    for (const [x, y] of [
      [-0.25, -0.1],
      [0.2, 0.1],
      [0, -0.05],
    ])
      g.ellipse(x * r, y * r, r * 0.16, r * 0.08).fill(c.light);
  } else if (good === 'salt') {
    g.moveTo(-r * 0.7, -r * 0.2)
      .lineTo(-r * 0.2, -r * 0.6)
      .lineTo(r * 0.75, -r * 0.6)
      .lineTo(r * 0.75, r * 0.45)
      .lineTo(r * 0.25, r * 0.7)
      .lineTo(-r * 0.7, r * 0.7)
      .closePath()
      .fill(c.fill)
      .stroke(line(c.line, 4));
    g.moveTo(-r * 0.7, -r * 0.2)
      .lineTo(r * 0.25, -r * 0.2)
      .lineTo(r * 0.75, -r * 0.6)
      .moveTo(r * 0.25, -r * 0.2)
      .lineTo(r * 0.25, r * 0.7)
      .stroke(line(c.line, 3));
    g.moveTo(-r * 0.35, r * 0.1)
      .lineTo(-r * 0.35, r * 0.4)
      .moveTo(-r * 0.5, r * 0.25)
      .lineTo(-r * 0.2, r * 0.25)
      .stroke(line(TILE.fill, 3));
  } else if (good === 'glass') {
    g.moveTo(-r * 0.2, -r * 0.75)
      .lineTo(r * 0.2, -r * 0.75)
      .lineTo(r * 0.2, -r * 0.4)
      .quadraticCurveTo(r * 0.75, -r * 0.2, r * 0.6, r * 0.45)
      .quadraticCurveTo(r * 0.5, r * 0.8, 0, r * 0.8)
      .quadraticCurveTo(-r * 0.5, r * 0.8, -r * 0.6, r * 0.45)
      .quadraticCurveTo(-r * 0.75, -r * 0.2, -r * 0.2, -r * 0.4)
      .closePath()
      .fill({ color: c.fill, alpha: 0.9 })
      .stroke(line(c.line, 4));
    g.moveTo(r * 0.4, -r * 0.25)
      .quadraticCurveTo(r * 0.95, -r * 0.1, r * 0.55, r * 0.3)
      .stroke(line(c.line, 5));
    g.ellipse(-r * 0.25, r * 0.15, r * 0.1, r * 0.25).fill({ color: 0xffffff, alpha: 0.6 });
  } else if (good === 'paper') {
    g.roundRect(-r * 0.75, -r * 0.45, r * 1.4, r * 0.9, 6)
      .fill(c.fill)
      .stroke(line(c.line, 4));
    g.ellipse(-r * 0.75, 0, r * 0.18, r * 0.45)
      .fill(c.light)
      .stroke(line(c.line, 4));
    for (const y of [-0.2, 0, 0.2])
      g.moveTo(-r * 0.4, y * r)
        .lineTo(r * 0.45, y * r)
        .stroke(line(c.line, 2));
  } else {
    g.circle(0, -r * 0.05, r * 0.6).stroke(line(c.line, 3));
    for (let i = 0; i < 9; i++) {
      const a = (i / 9) * Math.PI * 2;
      g.circle(Math.cos(a) * r * 0.6, -r * 0.05 + Math.sin(a) * r * 0.6, r * 0.17)
        .fill(i % 2 ? c.light : c.fill)
        .stroke(line(ink, 2));
    }
  }
  return g;
}

/** A card holding one good: an offer at an oasis (level 4). */
export function offerArt(good: Good, size = 120, picked = false): Container {
  const c = new Container();
  const g = new Graphics();
  g.roundRect(-size / 2, -size / 2, size, size, 22)
    .fill(picked ? 0xfff6c8 : cream)
    .stroke(line(picked ? swatch.yellow.line : SAND.line, picked ? 7 : 5));
  c.addChild(g, goodArt(good, size * 0.72));
  return c;
}

/** The speech bubble above a stop: the good that stop wants. */
export function bubbleArt(good: Good, size = 110): Container {
  const c = new Container();
  const g = new Graphics();
  const r = size / 2;
  g.roundRect(-r, -r, size, size * 0.86, 26)
    .fill(0xffffff)
    .stroke(line(SAND.line, 4));
  g.moveTo(-10, r * 0.7)
    .lineTo(0, r)
    .lineTo(12, r * 0.7)
    .closePath()
    .fill(0xffffff);
  g.moveTo(-10, r * 0.72)
    .lineTo(0, r)
    .lineTo(12, r * 0.72)
    .stroke(line(SAND.line, 4));
  const art = goodArt(good, size * 0.62);
  art.y = -r * 0.08;
  c.addChild(g, art);
  return c;
}

/** One shell, a counter worth one. */
export function shellArt(size = 18): Graphics {
  const g = new Graphics();
  const r = size / 2;
  g.moveTo(0, r)
    .lineTo(-r, -r * 0.1)
    .quadraticCurveTo(0, -r * 1.3, r, -r * 0.1)
    .closePath()
    .fill(0xffd9c9)
    .stroke(line(0xd98a6a, 2));
  g.moveTo(0, r)
    .lineTo(-r * 0.4, -r * 0.5)
    .moveTo(0, r)
    .lineTo(0, -r * 0.65)
    .moveTo(0, r)
    .lineTo(r * 0.4, -r * 0.5)
    .stroke(line(0xd98a6a, 1.5));
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
    s.position.set(((i % per) - (inRow - 1) / 2) * (size + 2), (row - (rows - 1) / 2) * (size + 2));
    c.addChild(s);
  }
  return c;
}

/** A stop's price board: each good with as many shells as it costs there. */
export function boardArt(
  goods: [Good, Good],
  prices: [number, number],
  w = 150,
  h = 110,
  named = false,
): Container {
  const c = new Container();
  const g = new Graphics();
  g.roundRect(-w / 2, -h / 2, w, h, 16)
    .fill(named ? 0xfff6c8 : cream)
    .stroke(line(named ? swatch.yellow.line : SAND.line, named ? 6 : 4));
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
export function loadArt(
  goods: Good[],
  w = 230,
  h = 150,
  prices: number[] | null = null,
  lifted = false,
): Container {
  const c = new Container();
  const g = new Graphics();
  g.roundRect(-w / 2, -h / 2, w, h, 22)
    .fill(lifted ? 0xfff6c8 : cream)
    .stroke(line(lifted ? swatch.yellow.line : SAND.line, lifted ? 7 : 5));
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
// ——— Mountains or sand, and wells (levels 6–7) ———

const SNOW = { fill: 0xffffff, line: 0x9aa7b4, peak: 0x9c8f87, peakLine: 0x6e625b };
const GREEN = { fill: 0x9fd77f, line: 0x5fae4e };
const TREE = { trunk: 0x8a5a33, back: 0x3f8f45, leaf: 0x5fae4e, light: 0x7cc35e };
const STONE = { fill: 0xc9c3bb, line: 0x7d756c };

/** Grey peaks with snowy tops, behind the pass road (scenery). */
export function peaksArt(w: number, h: number): Graphics {
  const g = new Graphics();
  const peaks = [
    [-0.38, 0.7],
    [-0.1, 1],
    [0.2, 0.85],
    [0.42, 0.6],
  ];
  for (const [x, t] of peaks) {
    const px = x * w;
    const top = -h * t;
    const half = w * 0.2;
    g.moveTo(px - half, 0)
      .lineTo(px, top)
      .lineTo(px + half, 0)
      .closePath()
      .fill(SNOW.peak)
      .stroke(line(SNOW.peakLine, 4));
    g.moveTo(px - half * 0.3, top + h * t * 0.3)
      .lineTo(px, top)
      .lineTo(px + half * 0.3, top + h * t * 0.3)
      .closePath()
      .fill(SNOW.fill);
  }
  return g;
}

/** The hut at the top of the pass. */
export function hutArt(size = 70): Graphics {
  const g = new Graphics();
  const s = size / 2;
  g.rect(-s * 0.8, -s * 0.6, s * 1.6, s * 1.1)
    .fill(0xa0683a)
    .stroke(line(0x6b3f1e, 4));
  g.moveTo(-s, -s * 0.5)
    .lineTo(0, -s * 1.2)
    .lineTo(s, -s * 0.5)
    .closePath()
    .fill(SNOW.fill)
    .stroke(line(SNOW.line, 4));
  g.rect(-s * 0.2, -s * 0.05, s * 0.4, s * 0.55).fill(0x4a2f1c);
  return g;
}

/** A snow day: a grey cloud with a flake and a grey sun under it, drawn before she chooses. */
export function snowArt(size = 90): Container {
  const c = new Container();
  c.eventMode = 'none';
  const g = new Graphics();
  const s = size / 2;
  g.circle(-s * 0.4, 0, s * 0.42)
    .circle(s * 0.15, -s * 0.2, s * 0.5)
    .circle(s * 0.55, s * 0.05, s * 0.36)
    .fill(0xd6dde4)
    .stroke(line(SNOW.line, 3));
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI;
    g.moveTo(Math.cos(a) * 10, s * 0.62 + Math.sin(a) * 10)
      .lineTo(-Math.cos(a) * 10, s * 0.62 - Math.sin(a) * 10)
      .stroke(line(0x5aa6d8, 3));
  }
  c.addChild(g);
  const sun = sunArt(40, false);
  sun.position.set(s * 0.95, s * 0.75);
  c.addChild(sun);
  return c;
}

/** The camel's red-brown blanket coat for the cold pass (scenery; the camel wears it on the walk). */
export function coatArt(size = 60): Graphics {
  const g = new Graphics();
  const s = size / 2;
  g.roundRect(-s, -s * 0.55, s * 2, s * 1.1, 10)
    .fill(0xa8452e)
    .stroke(line(0x6e2a1a, 4));
  for (let i = -2; i <= 2; i++)
    g.moveTo(i * s * 0.35, -s * 0.5)
      .lineTo(i * s * 0.35, s * 0.5)
      .stroke(line(0xe0a050, 3));
  return g;
}

/** A day card: the numeral and that many small suns; lifted when picked, a glow ring when it is the help. */
export function dayCardArt(n: number, size = 110, picked = false): Container {
  const c = new Container();
  const g = new Graphics();
  const s = size / 2;
  g.roundRect(-s, -s, size, size, 20)
    .fill(picked ? 0xfff1c4 : cream)
    .stroke(line(picked ? swatch.orange.fill : SAND.line, picked ? 7 : 5));
  c.addChild(g);
  const t = label(String(n), 46);
  t.y = -14;
  c.addChild(t);
  const per = Math.min(n, 4);
  for (let i = 0; i < n; i++) {
    const row = Math.floor(i / 4);
    const inRow = row === 0 ? per : n - 4;
    const sun = sunArt(18);
    sun.position.set(((i % 4) - (inRow - 1) / 2) * 20, 24 + row * 18);
    c.addChild(sun);
  }
  return c;
}

/** One hoofprint mark on the road. */
export function hoofArt(): Graphics {
  const g = new Graphics();
  g.ellipse(-5, 0, 4, 7).ellipse(5, 0, 4, 7).fill({ color: SAND.line, alpha: 0.8 });
  return g;
}

/** A green patch where a well can be dug. */
export function siteArt(size = 110): Graphics {
  const g = new Graphics();
  g.ellipse(0, 0, size * 0.42, size * 0.3)
    .fill({ color: GREEN.fill, alpha: 0.85 })
    .stroke(line(GREEN.line, 4));
  for (const [x, y] of [
    [-18, -6],
    [10, -10],
    [20, 6],
    [-6, 10],
  ])
    g.moveTo(x, y + 6)
      .lineTo(x - 3, y - 4)
      .moveTo(x, y + 6)
      .lineTo(x + 3, y - 4)
      .stroke(line(GREEN.line, 3));
  return g;
}

/** A well: a stone ring, a rope and a bucket; `ghost` is the faint fewest-wells hint. */
export function wellArt(size = 80, ghost = false): Graphics {
  const g = new Graphics();
  const s = size / 2;
  g.moveTo(-s * 0.7, -s * 0.9)
    .lineTo(-s * 0.7, 0)
    .moveTo(s * 0.7, -s * 0.9)
    .lineTo(s * 0.7, 0)
    .stroke(line(0x6b3f1e, 5));
  g.moveTo(-s * 0.8, -s * 0.9)
    .lineTo(s * 0.8, -s * 0.9)
    .stroke(line(0x6b3f1e, 6));
  g.moveTo(0, -s * 0.9)
    .lineTo(0, -s * 0.35)
    .stroke(line(ink, 2));
  g.roundRect(-s * 0.15, -s * 0.4, s * 0.3, s * 0.25, 4).fill(0xa0683a);
  g.ellipse(0, s * 0.1, s * 0.8, s * 0.4)
    .fill(STONE.fill)
    .stroke(line(STONE.line, 4));
  g.ellipse(0, s * 0.02, s * 0.55, s * 0.2).fill(WATER.fill);
  g.alpha = ghost ? 0.35 : 1;
  return g;
}

/** A shade tree sprouting beside a well on a road that works (decoration). */
export function treeArt(size = 70): Graphics {
  const g = new Graphics();
  const s = size / 2;
  // A forked trunk with a root flare, then a cloud of leaves cut as three lumpy pieces: a dark one behind, two lighter
  // ones in front, so the crown has depth like layered paper.
  smooth(g, [
    [-s * 0.3, s * 0.52],
    [-s * 0.1, s * 0.36],
    [-s * 0.1, -s * 0.05],
    [-s * 0.42, -s * 0.42],
    [-s * 0.3, -s * 0.48],
    [-s * 0.02, -s * 0.2],
    [s * 0.2, -s * 0.55],
    [s * 0.32, -s * 0.48],
    [s * 0.1, -s * 0.08],
    [s * 0.12, s * 0.36],
    [s * 0.34, s * 0.52],
  ]).fill(TREE.trunk);
  lumpy(g, 0, -s * 0.66, s * 0.62, s * 0.42, 7, 0.4).fill(TREE.back);
  lumpy(g, -s * 0.34, -s * 0.44, s * 0.4, s * 0.3, 5, 1.3).fill(TREE.leaf);
  lumpy(g, s * 0.3, -s * 0.5, s * 0.42, s * 0.32, 6, 2.2).fill(TREE.light);
  // A few leaf curls in each front piece, as if snipped and folded.
  for (const [x, y] of [
    [-s * 0.42, -s * 0.46],
    [-s * 0.24, -s * 0.36],
    [s * 0.22, -s * 0.56],
    [s * 0.4, -s * 0.42],
    [0, -s * 0.86],
  ])
    g.moveTo(x - 4, y + 2)
      .quadraticCurveTo(x, y - 4, x + 4, y + 2)
      .stroke(line(darken(TREE.leaf, 0.35), 2));
  return g;
}

/** A lumpy leaf-cloud piece: an ellipse with `bumps` rounded scallops round its edge, turned by `phase`. */
function lumpy(
  g: Graphics,
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  bumps: number,
  phase: number,
): Graphics {
  const pts: P[] = [];
  const n = bumps * 4;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + phase;
    const k = 1 + 0.13 * Math.cos(a * bumps - phase) + 0.05 * Math.sin(a * 3 + phase * 2);
    pts.push([cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k]);
  }
  return smooth(g, pts);
}

/** The day stick: a sun over four hoofprints, a day's walk. */
export function dayStickArt(w = 160, h = 110, marks = 4): Container {
  const c = new Container();
  const g = new Graphics();
  g.roundRect(-w / 2, -h / 2, w, h, 20)
    .fill(cream)
    .stroke(line(SAND.line, 5));
  g.moveTo(-w * 0.38, 26)
    .lineTo(w * 0.38, 26)
    .stroke(line(SAND.line, 4));
  c.addChild(g);
  const sun = sunArt(38);
  sun.y = -22;
  c.addChild(sun);
  for (let i = 0; i < marks; i++) {
    const hoof = hoofArt();
    hoof.position.set((i - (marks - 1) / 2) * 30, 12);
    c.addChild(hoof);
  }
  return c;
}

/** A counter pill: a sun (days walked) or a well (wells dug) and the number. */
export function counterArt(n: number, kind: 'sun' | 'well'): Container {
  const c = new Container();
  c.eventMode = 'none';
  const g = new Graphics();
  g.roundRect(-58, -34, 116, 68, 30).fill(cream).stroke(line(SAND.line, 4));
  c.addChild(g);
  const icon = kind === 'sun' ? sunArt(40) : wellArt(48);
  icon.position.set(-26, kind === 'sun' ? 0 : 8);
  c.addChild(icon);
  const t = label(String(n), 36);
  t.x = 24;
  c.addChild(t);
  return c;
}

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
