import { TRILL_ART as A } from '../cast';
import type { Expression } from '../illustrated';
import {
  almondPts,
  type Ctx,
  ellipsePts,
  eye,
  FACE_INK,
  hexCss,
  line,
  paperArtSet,
  piece,
  pieceUnion,
  shade,
  spot,
} from './canvas';

const BODY = 0xf8d64e;
const WING = 0xf2c53a;
const CREAM = 0xfdf0cc;
const PINK = 0xf79aac;
const BEAK = 0xf7953a;
const CHEEK = 'rgba(255,128,150,0.55)';

type Pt = [number, number];

/**
 * A streamer feather along the curve a → c → b: thin at the root `a`, widening to `w` near the rounded end `b`.
 */
function streamer(a: Pt, c: Pt, b: Pt, w: number, n = 28): Pt[] {
  const at = (t: number): Pt => [
    (1 - t) ** 2 * a[0] + 2 * (1 - t) * t * c[0] + t * t * b[0],
    (1 - t) ** 2 * a[1] + 2 * (1 - t) * t * c[1] + t * t * b[1],
  ];
  const side: Pt[] = [];
  const other: Pt[] = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const [p, q] = [at(Math.max(0, t - 0.01)), at(Math.min(1, t + 0.01))];
    const l = Math.hypot(q[0] - p[0], q[1] - p[1]) || 1;
    const [nx, ny] = [-(q[1] - p[1]) / l, (q[0] - p[0]) / l];
    // Narrow at the root, fullest at about three quarters, rounded at the end.
    const half =
      (w / 2) *
      (0.25 + 0.75 * Math.sin(Math.min(1, t / 0.78) * (Math.PI / 2))) *
      Math.sqrt(Math.max(0, 1 - Math.max(0, (t - 0.78) / 0.22) ** 2));
    const m = at(t);
    side.push([m[0] + nx * half, m[1] + ny * half]);
    other.push([m[0] - nx * half, m[1] - ny * half]);
  }
  return [...side, ...other.reverse()];
}

/**
 * Trill the songbird as a paper cut-out (docs/ART-STYLE.md), on `TRILL_ART`'s points: the round yellow body fills the
 * pinned body, the two pink tail streamers sway inside the tail's region and the three crest feathers fan inside
 * the crown's, the face and beak sit on the table's eyes, nose and mouth, and the feet stand still below.
 */
export function drawTrill(x: Ctx, ex: Expression) {
  const [tail, crest] = A.parts;
  // The tail streamers, behind the body.
  const r: Pt = [tail.root.x + 15, tail.root.y];
  piece(x, streamer(r, [140, 190], [26, 250], 72), PINK, 'trill-tail0', { amp: 2.5 });
  piece(x, streamer(r, [150, 370], [40, 330], 66), PINK, 'trill-tail1', { amp: 2.5 });

  // The crest feathers, behind the head.
  const c: Pt = [crest.root.x + 10, crest.root.y + 20];
  for (const [i, bend, tip, w] of [
    [0, [400, 128], [346, 100], 64],
    [1, [420, 80], [398, 30], 70],
    [2, [480, 70], [490, 24], 62],
  ] as [number, Pt, Pt, number][])
    piece(x, streamer(c, bend, tip, w), PINK, `trill-crest${i}`, { amp: 2 });

  // Legs and feet, still below the body.
  for (const [i, fx] of [
    [0, 405],
    [1, 528],
  ]) {
    line(
      x,
      [
        [fx, 420],
        [fx - 4, 452],
      ],
      hexCss(BEAK),
      12,
    );
    piece(x, ellipsePts(fx + 12, 462, 32, 13, 0.08), BEAK, `trill-foot${i}`, { amp: 1.5, small: true });
  }

  // The round body and head as one piece, the cream breast and face, and the wing.
  pieceUnion(
    x,
    [ellipsePts(462, 300, 178, 136, -0.42), ellipsePts(528, 226, 104, 100)],
    BODY,
    'trill-body',
    3.5,
  );
  piece(x, ellipsePts(540, 330, 82, 100, -0.15), CREAM, 'trill-breast', {
    noShadow: true,
    noOutline: true,
    amp: 3,
  });
  piece(x, ellipsePts(555, 238, 70, 46, -0.1), CREAM, 'trill-face', {
    noShadow: true,
    noOutline: true,
    amp: 2,
  });
  piece(x, almondPts([286, 338], [450, 296], 112), WING, 'trill-wing', { amp: 3 });
  line(
    x,
    [
      [314, 334],
      [370, 330],
      [420, 312],
    ],
    shade(WING, 0.3),
    4,
  );

  // The face: cheeks, eyes and the beak (open when happy or surprised).
  spot(x, 468, 258, 22, 13, CHEEK);
  spot(x, 626, 236, 9, 12, CHEEK);
  A.eyes.forEach((e, i) => eye(x, e, ex, `trill-eye${i}`));
  beak(x, ex);
}

function beak(x: Ctx, ex: Expression) {
  const [bx, by] = [A.nose.x - 26, A.nose.y + 2];
  const open = ex === 'happy' ? 12 : ex === 'surprised' ? 18 : 0;
  if (open) {
    const gap = new Path2D();
    gap.moveTo(bx, by);
    gap.lineTo(bx + 50, by + 2);
    gap.lineTo(bx + 4, by + 14 + open);
    gap.closePath();
    x.fillStyle = '#7a2e3e';
    x.fill(gap);
    piece(
      x,
      [
        [bx - 2, by + 10 + open * 0.4],
        [bx + 42, by + 8 + open],
        [bx + 4, by + 20 + open],
      ],
      BEAK,
      'trill-jaw',
      { small: true, amp: 0.5, noShadow: true },
    );
  }
  const [dip, up] = [ex === 'sad' ? 5 : 0, open ? 5 : 0];
  piece(
    x,
    [
      [bx - 4, by - 14 - up],
      [bx + 26, by - 14 - up],
      [bx + 60, by + 4 + dip - up],
      [bx + 24, by + 14 - up],
      [bx - 2, by + 10 - up],
    ],
    BEAK,
    'trill-beak',
    { small: true, amp: 0.6 },
  );
  if (ex === 'sad')
    line(
      x,
      [
        [bx + 4, by + 24],
        [bx + 16, by + 20],
        [bx + 28, by + 24],
      ],
      hexCss(FACE_INK),
      3.5,
    );
}

export default () => paperArtSet(A.width, A.height, drawTrill);
