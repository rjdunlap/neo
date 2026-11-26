import { MOSSBACK_ART as A } from '../cast';
import type { Expression } from '../illustrated';
import {
  almondPts,
  type Ctx,
  dense,
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

const BLUE = 0x84b9ec;
const CREAM = 0xfbedd3;
const SHELL = 0x5aa63c;
const PLATE = 0x8dcb57;
const MOSS = 0x6fbf45;
const PETAL = 0xf7a9bb;
const MIDDLE = 0xffd65a;
const CHEEK = 'rgba(255,143,163,0.55)';

/** A leg with three cream toes along its foot. */
function leg(x: Ctx, cx: number, cy: number, rx: number, ry: number, color: number, seed: string) {
  piece(x, ellipsePts(cx, cy, rx, ry), color, seed, { amp: 3 });
  for (const k of [-1, 0, 1])
    piece(x, ellipsePts(cx + k * rx * 0.5, cy + ry * 0.78, rx * 0.2, ry * 0.18), CREAM, `${seed}-toe${k}`, {
      small: true,
      noShadow: true,
      amp: 1,
    });
}

/**
 * The turtle as a paper cut-out (docs/ART-STYLE.md), on the prepared sprite's points (`MOSSBACK_ART`): a green dome
 * of shell plates with a mossy top and a flower, a cream underside, and a blue head on a long neck. The near legs and
 * the flower sit on the three parts' roots, inside their regions, so they plod and nod; the far legs stay behind.
 */
export function drawMossback(x: Ctx, ex: Expression) {
  const [front, back, flower] = A.parts;

  // The tail and the far legs, behind everything.
  piece(x, almondPts([96, 262], [12, 236], 46), BLUE, 'mossback-tail');
  leg(x, 212, 336, 40, 36, BLUE, 'mossback-farback');
  leg(x, 528, 342, 40, 42, BLUE, 'mossback-farfront');

  // The neck and head, cut as one; the shell covers the neck's root.
  pieceUnion(
    x,
    [ellipsePts(488, 252, 104, 64, -0.62), ellipsePts(568, 168, 100, 82, -0.08)],
    BLUE,
    'mossback-head',
    3,
  );
  piece(x, ellipsePts(530, 256, 80, 34, -0.66), CREAM, 'mossback-throat', {
    noShadow: true,
    noOutline: true,
    amp: 2,
  });
  piece(x, ellipsePts(598, 214, 70, 34, -0.12), CREAM, 'mossback-muzzle', {
    noShadow: true,
    noOutline: true,
    amp: 2,
  });

  // The cream underside, then the shell over it.
  piece(x, ellipsePts(292, 298, 168, 46), CREAM, 'mossback-belly', { amp: 3 });
  for (const sx of [210, 292, 374])
    line(
      x,
      [
        [sx, 280],
        [sx + 2, 312],
        [sx, 338],
      ],
      shade(CREAM, 0.3),
      2.5,
    );
  const dome: Pt[] = [];
  for (let i = 0; i <= 24; i++) {
    const a = Math.PI + (i / 24) * Math.PI;
    dome.push([250 + Math.cos(a) * 208, 262 + Math.sin(a) * 210]);
  }
  dome.push([420, 284], [250, 298], [80, 284]);
  piece(x, dense(dome, 18), SHELL, 'mossback-shell');
  // The plates: three on the dome and a row round the rim.
  const plates: [number, number, number, number][] = [
    [250, 150, 78, 62],
    [124, 182, 58, 66],
    [374, 166, 56, 66],
  ];
  plates.forEach(([px, py, rx, ry], i) =>
    piece(x, ellipsePts(px, py, rx, ry), PLATE, `mossback-plate${i}`, { noShadow: true, amp: 1.8 }),
  );
  [96, 176, 256, 336, 412].forEach((px, i) =>
    piece(x, ellipsePts(px, 258 - (i === 0 || i === 4 ? 6 : 0), 40, 22), PLATE, `mossback-rim${i}`, {
      noShadow: true,
      amp: 2,
    }),
  );

  // The flower nods on its stem (the third part), from the moss.
  const [fx, fy] = [flower.root.x - 2, flower.root.y - 28];
  line(
    x,
    [
      [flower.root.x, flower.root.y],
      [fx + 2, fy + 12],
      [fx, fy],
    ],
    shade(MOSS, 0.35),
    5,
  );
  // The moss patch on top, over the stem's foot; the flower stands in front.
  pieceUnion(
    x,
    [
      ellipsePts(248, 74, 70, 14),
      ellipsePts(192, 72, 20, 17),
      ellipsePts(222, 62, 21, 18),
      ellipsePts(258, 58, 22, 18),
      ellipsePts(292, 64, 21, 18),
      ellipsePts(312, 76, 15, 13),
    ],
    MOSS,
    'mossback-moss',
    2,
  );
  piece(x, almondPts([248, 56], [274, 34], 18, 16), MOSS, 'mossback-leaf', { small: true });
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2 - Math.PI / 2;
    piece(x, ellipsePts(fx + Math.cos(a) * 14, fy + Math.sin(a) * 14, 13, 13), PETAL, `mossback-petal${i}`, {
      small: true,
    });
  }
  spot(x, fx, fy, 8, 8, hexCss(MIDDLE));

  // The near legs plod about their roots (the first two parts).
  leg(x, front.root.x + 2, front.root.y + 32, 52, 54, BLUE, 'mossback-front');
  leg(x, back.root.x - 8, back.root.y + 30, 50, 52, BLUE, 'mossback-back');

  // The face.
  spot(x, 520, 212, 18, 12, CHEEK);
  spot(x, 662, 174, 7, 9, CHEEK);
  A.eyes.forEach((e, i) => eye(x, e, ex, `mossback-eye${i}`));
  spot(x, A.nose.x, A.nose.y, 9, 6, shade(BLUE, 0.45));
  mouth(x, { x: A.mouth.x, y: A.mouth.y }, ex, 14);
}

export default () => paperArtSet(A.width, A.height, drawMossback);
