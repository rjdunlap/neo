import type { Expression } from '../illustrated';
import { GLIDER_ART as A } from '../glider-illustrated';
import {
  type Ctx,
  dense,
  ellipsePts,
  eye,
  hexCss,
  mouth,
  paperArtSet,
  piece,
  pieceUnion,
  spot,
} from './canvas';

type Pt = [number, number];

const BODY = 0xb3a1e6;
const FIN = 0xa792de;
const CREAM = 0xfbf1e8;
const CLOUD = 0xfbf4f8;
const RIBBON = 0xd3bbf3;
const RIBBON_PINK = 0xf5a3c4;
const EAR = 0xf3b8d0;
const CHEEK = 'rgba(255,143,163,0.6)';

/**
 * The great wing, clockwise from where its leading edge leaves the body: up and left to the tip, down the trailing
 * edge (kept right of the rig's tip → lower-tip line, so no wing lies where the ribbons ripple), round the lower tip
 * and back under the body.
 */
const WING: Pt[] = [
  ...curve([590, 122], [330, 6], [148, 44], 14),
  [138, 48],
  ...curve([150, 58], [292, 172], [366, 330], 16),
  ...curve([382, 328], [440, 280], [560, 266], 8),
];

/** Points along a quadratic curve from `a` to `b` bent toward `c`, ends included. */
function curve(a: Pt, c: Pt, b: Pt, n: number): Pt[] {
  return Array.from({ length: n + 1 }, (_, i) => {
    const t = i / n;
    const u = 1 - t;
    return [
      u * u * a[0] + 2 * u * t * c[0] + t * t * b[0],
      u * u * a[1] + 2 * u * t * c[1] + t * t * b[1],
    ] as Pt;
  });
}

/** The head and body, over the pinned polygon. */
const TORSO: Pt[] = [
  [560, 112],
  [640, 114],
  [700, 120],
  [735, 140],
  [752, 172],
  [738, 204],
  [700, 236],
  [640, 264],
  [560, 270],
  [506, 246],
  [504, 170],
];

/**
 * A wavy ribbon from x = `from` (under the wing) to its round tip at x = `to`, its centre on `y(x)`, `w` wide.
 */
function ribbon(from: number, to: number, y: (x: number) => number, w: number): Pt[] {
  const n = 40;
  const centre: Pt[] = [];
  for (let i = 0; i <= n; i++) {
    const x = from + ((to - from) * i) / n;
    centre.push([x, y(x)]);
  }
  const half = (t: number) => (w / 2) * (t > 0.9 ? Math.sqrt(Math.max(0, 1 - ((t - 0.9) / 0.1) ** 2)) : 1);
  const left: Pt[] = [];
  const right: Pt[] = [];
  centre.forEach((c, i) => {
    const a = centre[Math.max(0, i - 1)];
    const b = centre[Math.min(n, i + 1)];
    const [dx, dy] = [b[0] - a[0], b[1] - a[1]];
    const l = Math.hypot(dx, dy) || 1;
    const h = Math.max(3, half(i / n));
    left.push([c[0] - (dy / l) * h, c[1] + (dx / l) * h]);
    right.push([c[0] + (dy / l) * h, c[1] - (dx / l) * h]);
  });
  return [...left, ...right.reverse()];
}

/** A puffy cloud: a few circles on a flat base, cut as one piece. */
function cloud(x: Ctx, cx: number, cy: number, k: number, seed: string) {
  pieceUnion(
    x,
    [
      ellipsePts(cx - 36 * k, cy + 4 * k, 24 * k, 22 * k),
      ellipsePts(cx - 4 * k, cy - 14 * k, 32 * k, 30 * k),
      ellipsePts(cx + 32 * k, cy + 2 * k, 24 * k, 22 * k),
      ellipsePts(cx, cy + 14 * k, 58 * k, 14 * k),
    ],
    CLOUD,
    seed,
    2,
  );
}

/**
 * The cloud glider (a little ray) as a paper cut-out (docs/ART-STYLE.md), on the prepared sprite's points
 * (`GLIDER_ART`): the two ribbons trail behind the wing's trailing edge, the upper above the rig's gap and the lower
 * below it; the wing reaches from the body to the table's tip and lower tip; the dorsal and ventral fins stand on the
 * table's fins; the head and face sit in the pinned polygon.
 */
export function drawGlider(x: Ctx, ex: Expression) {
  // The ribbons, under the wing's trailing edge.
  // The rig parts them along y = 170 + 0.13x, blending over 12 px either side, and holds anything above y = 125 to the
  // wing: the upper keeps between the two, the lower below the parting, each a mesh cell clear of the blend.
  const [up, low] = A.ribbons;
  piece(
    x,
    ribbon(up.root.x, up.tip.x + 4, (rx) => 137 + 0.065 * rx * (1 + 0.9 * Math.sin(rx * 0.026 + 0.6)), 24),
    RIBBON,
    'glider-ribbon0',
    { amp: 2 },
  );
  piece(
    x,
    ribbon(low.root.x, low.tip.x + 4, (rx) => 219 + 0.13 * rx + 12 * Math.sin(rx * 0.026 + 2.4), 30),
    RIBBON_PINK,
    'glider-ribbon1',
    { amp: 2 },
  );

  // The fins, behind the body.
  const [dorsal, ventral] = A.fins;
  piece(
    x,
    [
      [dorsal.root.x + 2, dorsal.root.y + 44],
      [dorsal.root.x - 14, dorsal.root.y - 8],
      [dorsal.tip.x - 10, dorsal.tip.y + 6],
      [dorsal.tip.x + 10, dorsal.tip.y + 2],
      [dorsal.root.x + 40, dorsal.root.y + 6],
      [dorsal.root.x + 70, dorsal.root.y + 48],
    ],
    FIN,
    'glider-fin0',
    { amp: 2 },
  );
  piece(
    x,
    [
      [ventral.root.x + 14, ventral.root.y - 22],
      [ventral.root.x - 4, ventral.root.y + 10],
      [ventral.tip.x - 6, ventral.tip.y + 4],
      [ventral.tip.x + 6, ventral.tip.y + 2],
      [ventral.root.x + 24, ventral.root.y - 4],
      [ventral.root.x + 40, ventral.root.y - 22],
    ],
    FIN,
    'glider-fin1',
    { amp: 1.5, small: true },
  );

  // The pointed ear, behind the head.
  const e = A.ears[0];
  piece(
    x,
    [
      [e.x - 26, e.y + 26],
      [e.x - 10, e.y - 16],
      [e.x + 8, e.y - 18],
      [e.x + 22, e.y + 24],
    ],
    BODY,
    'glider-ear',
    { amp: 1.5, small: true },
  );
  spot(x, e.x - 1, e.y + 4, 8, 14, hexCss(EAR));

  // Wing, body and head, cut as one piece.
  const body = pieceUnion(
    x,
    [dense([...WING].reverse(), 20), dense(TORSO, 18), ellipsePts(690, 172, 60, 56)],
    BODY,
    'glider-body',
    4,
  );
  // The cream underside, from under the wing to the chin.
  x.save();
  x.clip(body);
  piece(x, ellipsePts(640, 248, 140, 46, -0.36), CREAM, 'glider-belly', {
    noShadow: true,
    noOutline: true,
    amp: 2,
  });
  piece(x, ellipsePts(712, 190, 44, 26, -0.3), CREAM, 'glider-muzzle', {
    noShadow: true,
    noOutline: true,
    amp: 2,
  });
  x.restore();

  // Two clouds on the wing.
  x.save();
  x.clip(body);
  cloud(x, 326, 104, 1.3, 'glider-cloud0');
  cloud(x, 470, 222, 1.15, 'glider-cloud1');
  x.restore();

  // The face.
  A.cheeks.forEach((c) => spot(x, c.x, c.y, 15, 10, CHEEK));
  A.eyes.forEach((e2, i) => eye(x, { ...e2, rx: 16, ry: 17 }, ex, `glider-eye${i}`));
  spot(x, A.nose.x, A.nose.y, 7, 5, hexCss(0x3a2a3e));
  mouth(x, A.mouth, ex, 10);
}

export default () => paperArtSet(A.width, A.height, drawGlider);
