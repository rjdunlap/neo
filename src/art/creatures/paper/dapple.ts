import { DAPPLE_ART as A } from '../cast';
import type { Expression } from '../illustrated';
import { type Ctx, ellipsePts, eye, hexCss, mouth, paperArtSet, piece, pieceUnion, spot } from './canvas';

const BODY = 0x9cd965;
const FAR = 0x86c752;
const CREAM = 0xfdf0cf;
const BLUE = 0x8cc8f2;
const PINK = 0xf6a6b8;
const YELLOW = 0xfad55c;
const CHEEK = 'rgba(255,128,150,0.5)';

type Pt = [number, number];

/** A band along a centre line, `w(t)` wide at each point: its outline, down one side and back up the other. */
function band(centre: Pt[], w: (t: number) => number): Pt[] {
  const a: Pt[] = [];
  const b: Pt[] = [];
  centre.forEach((m, i) => {
    const [p, q] = [centre[Math.max(0, i - 1)], centre[Math.min(centre.length - 1, i + 1)]];
    const l = Math.hypot(q[0] - p[0], q[1] - p[1]) || 1;
    const [nx, ny] = [-(q[1] - p[1]) / l, (q[0] - p[0]) / l];
    const h = w(i / (centre.length - 1)) / 2;
    a.push([m[0] + nx * h, m[1] + ny * h]);
    b.push([m[0] - nx * h, m[1] - ny * h]);
  });
  // Round caps on both ends.
  const cap = (m: Pt, p: Pt, h: number): Pt[] => {
    const d = Math.atan2(m[1] - p[1], m[0] - p[0]);
    return Array.from({ length: 7 }, (_, k) => {
      const a2 = d + Math.PI / 2 - ((k + 1) / 8) * Math.PI;
      return [m[0] + Math.cos(a2) * h, m[1] + Math.sin(a2) * h] as Pt;
    });
  };
  const n = centre.length;
  return [
    ...a,
    ...cap(centre[n - 1], centre[n - 2], w(1) / 2),
    ...b.reverse(),
    ...cap(centre[0], centre[1], w(0) / 2),
  ];
}

/** The tail's centre line: from the rump, round the bottom and up the left, curling in to its tip. */
function tailLine(): Pt[] {
  const [cx, cy] = [118, 212];
  const out: Pt[] = [];
  const n = 80;
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const a = 0.06 + t * 7.84;
    const r = 138 - 114 * t ** 0.85;
    out.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]);
  }
  return out;
}

/**
 * Dapple the spotted lizard as a paper cut-out (docs/ART-STYLE.md), on `DAPPLE_ART`'s points: the green body, crest
 * and big round head fill the pinned body, the spotted tail curls inside the tail's region about its base, and the
 * face sits on the table's eyes, nose and mouth.
 */
export function drawDapple(x: Ctx, ex: Expression) {
  // The curled tail, behind the body, with its spots.
  const centre = tailLine();
  piece(
    x,
    band(centre, (t) => 76 - t * 42),
    BODY,
    'dapple-tail',
    { amp: 3 },
  );
  for (const [t, c, r] of [
    [0.14, PINK, 21],
    [0.3, YELLOW, 21],
    [0.46, BLUE, 19],
    [0.62, PINK, 16],
  ] as [number, number, number][]) {
    const [px, py] = centre[Math.round(t * (centre.length - 1))];
    piece(x, ellipsePts(px, py, r, r * 0.92), c, `dapple-tspot${t}`, {
      small: true,
      noShadow: true,
      noOutline: true,
      amp: 1,
    });
  }

  // The far legs, behind the body.
  piece(x, ellipsePts(350, 360, 30, 40, 0.2), FAR, 'dapple-leg-far0', { amp: 2 });
  piece(x, ellipsePts(605, 352, 28, 40, -0.2), FAR, 'dapple-leg-far1', { amp: 2 });

  // The crest bumps along the back.
  for (const [i, bx, by, r] of [
    [0, 290, 172, 20],
    [1, 332, 150, 23],
    [2, 378, 128, 25],
    [3, 426, 108, 25],
  ] as [number, number, number, number][])
    piece(x, ellipsePts(bx, by, r, r * 0.82), BODY, `dapple-crest${i}`, { amp: 2 });

  // The body, its cream belly and its spots (cut to the body's edge).
  const body = piece(x, ellipsePts(386, 256, 166, 114, -0.2), BODY, 'dapple-body', { amp: 4 });
  x.save();
  x.clip(body);
  spot(x, 440, 330, 130, 42, hexCss(CREAM));
  for (const [sx, sy, rx, c] of [
    [292, 196, 34, PINK],
    [350, 222, 22, BLUE],
    [398, 150, 26, YELLOW],
    [262, 264, 18, YELLOW],
  ] as [number, number, number, number][])
    spot(x, sx, sy, rx, rx * 0.9, hexCss(c));
  x.restore();

  // The big round head with its crest, overlapping the shoulders, and its cream chin.
  const head = pieceUnion(
    x,
    [ellipsePts(590, 168, 136, 108, 0.05), ellipsePts(548, 76, 72, 46, 0.35)],
    BODY,
    'dapple-head',
    4,
  );
  x.save();
  x.clip(head);
  spot(x, 612, 236, 118, 50, hexCss(CREAM));
  x.restore();

  // The near legs in front, with round toes.
  for (const [i, lx, ly, rot] of [
    [0, 250, 372, 0.35],
    [1, 455, 372, -0.1],
    [2, 660, 362, -0.25],
  ] as [number, number, number, number][]) {
    piece(x, ellipsePts(lx - Math.sin(rot) * 20, ly - 40, 34, 58, rot), BODY, `dapple-leg${i}`, { amp: 2 });
    pieceUnion(
      x,
      [-1, 0, 1].map((k) => ellipsePts(lx + k * 24, ly + 14 - (k === 0 ? 2 : 0), 16, 13)),
      BODY,
      `dapple-foot${i}`,
      1,
    );
  }

  // The face.
  spot(x, 520, 222, 26, 15, CHEEK);
  spot(x, 716, 186, 10, 14, CHEEK);
  A.eyes.forEach((e, i) => eye(x, e, ex, `dapple-eye${i}`));
  spot(x, A.nose.x, A.nose.y, 5, 4, hexCss(0x3d5a2a));
  mouth(x, A.mouth, ex, 16);
}

export default () => paperArtSet(A.width, A.height, drawDapple);
