import { BRAMBLE_ART as A } from '../cast';
import type { Expression } from '../illustrated';
import {
  type Ctx,
  ellipsePts,
  eye,
  hexCss,
  line,
  mouth,
  paperArtSet,
  piece,
  pieceUnion,
  shade,
  spot,
} from './canvas';

type Pt = [number, number];

const QUILL = 0xa48be0;
const QUILL_LIGHT = 0xbba7f0;
const CREAM = 0xfdf0dc;
const EAR = 0xf4b2a8;
const NOSE = 0x3a2a35;
const CHEEK = 'rgba(255,143,163,0.55)';

/** The middle of the quill mound, which the tufts fan out from. */
const MID: Pt = [228, 238];
/** Where the tufts point away from: behind the face. */
const FACE: Pt = [400, 300];

/** A rounded tuft from `base` to `tip`, `w` across, fuller toward its tip. */
function eggPts(base: Pt, tip: Pt, w: number, n = 36): Pt[] {
  const [dx, dy] = [tip[0] - base[0], tip[1] - base[1]];
  const len = Math.hypot(dx, dy);
  const [ux, uy] = [dx / len, dy / len];
  return Array.from({ length: n }, (_, i) => {
    const t = (i / n) * Math.PI * 2;
    const u = (len / 2) * (1 + Math.cos(t));
    const v = (w / 2) * Math.sin(t) * ((1 + 0.45 * Math.cos(t)) / 1.45);
    return [base[0] + ux * u - uy * v, base[1] + uy * u + ux * v] as Pt;
  });
}

/**
 * The hedgehog as a paper cut-out (docs/ART-STYLE.md), on the prepared sprite's points (`BRAMBLE_ART`): a round lilac
 * mound of quill tufts behind a cream face and tummy. The mound fans out from behind the pinned body into the quill
 * part's region, so its bristle bends the tufts about their root; the face sits on the table's eyes, nose and mouth.
 */
export function drawBramble(x: Ctx, ex: Expression) {
  // The little tail, under the mound.
  piece(x, ellipsePts(74, 386, 30, 26), QUILL, 'bramble-tail');

  // The quill mound: a sheet behind, then rows of rounded tufts laid like shingles from the back toward the face, so
  // the outer row makes the scalloped edge.
  pieceUnion(
    x,
    [ellipsePts(MID[0], MID[1], 160, 156), ellipsePts(350, 150, 90, 50)],
    QUILL,
    'bramble-quills',
  );
  const rows: [number, number, number, number, number][] = [
    // [reach from the middle, colour, length, width, first angle]
    [1, QUILL, 150, 112, 118],
    [0.58, QUILL_LIGHT, 130, 100, 150],
  ];
  rows.forEach(([k, color, len, w, from], r) => {
    for (let deg = from; deg <= 345; deg += r ? 36 : 25) {
      const tip: Pt = [
        MID[0] + Math.cos((deg * Math.PI) / 180) * 190 * k,
        MID[1] + Math.sin((deg * Math.PI) / 180) * 182 * k,
      ];
      const [dx, dy] = [FACE[0] - tip[0], FACE[1] - tip[1]];
      const l = Math.hypot(dx, dy);
      const base: Pt = [tip[0] + (dx / l) * len, tip[1] + (dy / l) * len];
      piece(x, eggPts(base, tip, w), color, `bramble-tuft${r}-${deg}`, { amp: 2 });
    }
  });

  // Ears, behind the face.
  piece(x, ellipsePts(250, 190, 36, 34), CREAM, 'bramble-ear0', { amp: 2.5 });
  spot(x, 252, 194, 19, 18, hexCss(EAR));
  piece(x, ellipsePts(462, 160, 24, 24), CREAM, 'bramble-ear1', { amp: 2 });
  spot(x, 463, 163, 12, 12, hexCss(EAR));

  // The face and tummy, cut as one cream piece.
  pieceUnion(x, [ellipsePts(380, 238, 108, 92), ellipsePts(356, 374, 88, 90)], CREAM, 'bramble-body', 4);

  // The little paws on the tummy.
  for (const [px, py, s] of [
    [338, 356, 0],
    [410, 360, 1],
  ] as const) {
    piece(x, ellipsePts(px, py, 26, 22), CREAM, `bramble-paw${s}`, { small: true });
    for (const k of [-1, 1])
      line(
        x,
        [
          [px + k * 7, py + 10],
          [px + k * 7, py + 18],
        ],
        shade(CREAM, 0.38),
        2.5,
      );
  }

  // Feet, in front.
  for (const [fx, fy, rx, i] of [
    [266, 446, 46, 0],
    [380, 450, 42, 1],
  ] as const) {
    piece(x, ellipsePts(fx, fy, rx, 22), CREAM, `bramble-foot${i}`, { amp: 3 });
    for (const k of [0, 1])
      line(
        x,
        [
          [fx + 8 + k * 14, fy + 6],
          [fx + 8 + k * 14, fy + 18],
        ],
        shade(CREAM, 0.38),
        2.5,
      );
  }

  // The face.
  spot(x, 318, 270, 20, 13, CHEEK);
  spot(x, 470, 250, 12, 11, CHEEK);
  A.eyes.forEach((e, i) => eye(x, e, ex, `bramble-eye${i}`));
  piece(x, ellipsePts(A.nose.x, A.nose.y, 12, 9), NOSE, 'bramble-nose', {
    small: true,
    noShadow: true,
    amp: 1,
  });
  spot(x, A.nose.x - 4, A.nose.y - 3, 4, 2.5, 'rgba(255,255,255,0.7)');
  mouth(x, { x: A.mouth.x, y: A.mouth.y }, ex, 13);
}

export default () => paperArtSet(A.width, A.height, drawBramble);
