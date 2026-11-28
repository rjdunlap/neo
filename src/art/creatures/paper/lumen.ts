import { LUMEN_ART as A } from '../cast';
import type { Expression } from '../illustrated';
import {
  almondPts,
  type Ctx,
  ellipsePts,
  eye,
  line,
  mouth,
  paperArtSet,
  piece,
  pieceUnion,
  shade,
  spot,
} from './canvas';

type Pt = [number, number];

const LILAC = 0xb9a1ea;
const PINK = 0xf7abc9;
const SPOT = 0xffd96a;
const FUZZ = 0xfdf0d8;
const GLOW = 0xfff4bf;
const CHEEK = 'rgba(255,143,163,0.55)';

/** A wing from its root at `base` out to a broad round end at `tip`, `w` across. */
function wingPts(base: Pt, tip: Pt, w: number, n = 40): Pt[] {
  const [dx, dy] = [tip[0] - base[0], tip[1] - base[1]];
  const len = Math.hypot(dx, dy);
  const [ux, uy] = [dx / len, dy / len];
  return Array.from({ length: n }, (_, i) => {
    const t = (i / n) * Math.PI * 2;
    const u = (len / 2) * (1 + Math.cos(t));
    const v = (w / 2) * Math.sin(t) * ((1 + 0.6 * Math.cos(t)) / 1.6);
    return [base[0] + ux * u - uy * v, base[1] + uy * u + ux * v] as Pt;
  });
}

const lerp = (a: Pt, b: Pt, t: number): Pt => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];

/** One wing: a lilac sheet, a pink one inside it toward the root, and round yellow spots. */
function wing(x: Ctx, base: Pt, tip: Pt, w: number, spots: [number, number, number][], seed: string) {
  piece(x, wingPts(base, tip, w), LILAC, `${seed}-outer`, { amp: 3 });
  piece(x, wingPts(lerp(base, tip, 0.04), lerp(base, tip, 0.88), w * 0.8), PINK, `${seed}-inner`, {
    noShadow: true,
    amp: 2.5,
  });
  // Spots by (along, across, radius), across in units of the half-width.
  const [dx, dy] = [tip[0] - base[0], tip[1] - base[1]];
  const len = Math.hypot(dx, dy);
  const [ux, uy] = [dx / len, dy / len];
  spots.forEach(([a, c, r], i) => {
    const [px, py] = [base[0] + ux * a * len - uy * c * (w / 2), base[1] + uy * a * len + ux * c * (w / 2)];
    piece(x, ellipsePts(px, py, r, r), SPOT, `${seed}-spot${i}`, { noShadow: true, small: true, amp: 1.2 });
  });
}

/** A feathery antenna from `root` to `tip`: a stem, then a pink feather with a lilac edge. */
function antenna(x: Ctx, root: Pt, tip: Pt, seed: string) {
  const mid = lerp(root, tip, 0.22);
  line(x, [root, lerp(root, mid, 0.5), mid], shade(FUZZ, 0.4), 4);
  piece(x, almondPts(mid, tip, 58), LILAC, `${seed}-edge`, { small: true, amp: 1.5 });
  piece(x, almondPts(lerp(mid, tip, 0.02), lerp(mid, tip, 0.85), 40), PINK, `${seed}-feather`, {
    small: true,
    noShadow: true,
    noOutline: true,
    amp: 1,
  });
  line(x, [mid, lerp(mid, tip, 0.85)], shade(PINK, 0.3), 2);
}

/** The body, the ruff and the head: centre, radii and turn. */
const SHAPE: [number, number, number, number, number][] = [
  [326, 366, 142, 72, 0.06],
  [430, 328, 68, 76, 0],
  [506, 292, 78, 70, 0],
];

/**
 * The moth as a paper cut-out (docs/ART-STYLE.md), on the prepared sprite's points (`LUMEN_ART`): a fluffy cream body
 * with a soft pale halo for its glow (a flat paper sheet, no gradient), two big lilac-and-pink wings with yellow spots
 * and two feathery antennae. Each wing and antenna reaches from its part's root toward its tip inside its region, so
 * they flutter and sway; the face sits on the table's eyes and mouth.
 */
export function drawLumen(x: Ctx, ex: Expression) {
  const [big, back, ant0, ant1] = A.parts;
  const P = (p: { x: number; y: number }): Pt => [p.x, p.y];

  // The far wing (behind), then the near big wing.
  wing(
    x,
    [back.root.x + 20, back.root.y + 10],
    [back.tip.x - 30, back.tip.y + 8],
    168,
    [
      [0.6, -0.15, 22],
      [0.78, 0.3, 13],
      [0.45, 0.4, 10],
    ],
    'lumen-wing1',
  );
  wing(
    x,
    [big.root.x + 40, big.root.y + 30],
    [big.tip.x - 10, big.tip.y - 30],
    340,
    [
      [0.62, 0.05, 34],
      [0.45, -0.45, 21],
      [0.32, -0.05, 14],
    ],
    'lumen-wing0',
  );

  // The antennae, behind the head.
  antenna(x, P(ant0.root), [ant0.tip.x - 4, ant0.tip.y - 2], 'lumen-ant0');
  antenna(x, P(ant1.root), [ant1.tip.x - 6, ant1.tip.y + 2], 'lumen-ant1');

  // The glow: a flat pale halo just round the body, ruff and head.
  for (const [cx, cy, rx, ry, rot] of SHAPE)
    piece(x, ellipsePts(cx, cy, rx + 18, ry + 18, rot), GLOW, `lumen-glow${cx}`, {
      noShadow: true,
      noOutline: true,
      amp: 3,
    });

  // The fuzzy body, then the ruff, then the round head, each its own soft piece.
  const [head, ...trunk] = [...SHAPE].reverse();
  pieceUnion(
    x,
    trunk.map(([cx, cy, rx, ry, rot]) => ellipsePts(cx, cy, rx, ry, rot)),
    FUZZ,
    'lumen-body',
    4,
  );
  piece(x, ellipsePts(head[0], head[1], head[2], head[3], head[4]), FUZZ, 'lumen-head', { amp: 1.6 });
  // Two little feet.
  for (const fx of [318, 380])
    piece(x, ellipsePts(fx, 430, 18, 13), FUZZ, `lumen-foot${fx}`, { small: true, amp: 1.5 });

  // The face.
  spot(x, 478, 304, 15, 10, CHEEK);
  A.eyes.forEach((e, i) => eye(x, e, ex, `lumen-eye${i}`));
  mouth(x, { x: A.mouth.x - 6, y: A.mouth.y + 2 }, ex, 11);
}

export default () => paperArtSet(A.width, A.height, drawLumen);
