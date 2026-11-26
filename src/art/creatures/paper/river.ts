import type { Expression } from '../illustrated';
import { RIVER_ART as A } from '../river-illustrated';
import {
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

const BODY = 0xd9945b;
const FAR = 0xc27f4a;
const CREAM = 0xfdeed0;
const TAIL = 0x9a6044;
const PAW = 0x8a5746;
const NOSE = 0x4d2a2e;
const CHEEK = 'rgba(255,143,163,0.6)';

/** The long body from the tail's root to the chest, with the neck rising into the head box (its cap under the head). */
const TORSO: Pt[] = [
  [590, 74],
  [560, 86],
  [530, 104],
  [495, 122],
  [455, 126],
  [415, 116],
  [370, 100],
  [320, 92],
  [270, 98],
  [225, 118],
  [192, 148],
  [180, 180],
  [192, 210],
  [225, 228],
  [280, 238],
  [340, 246],
  [400, 250],
  [460, 250],
  [520, 246],
  [570, 250],
  [612, 246],
  [645, 230],
  [662, 198],
  [664, 160],
  [656, 120],
  [640, 92],
  [620, 76],
];

/** The cream throat, chest and belly, one band from under the chin to the hind legs. */
const CREAM_BAND: Pt[] = [
  [596, 104],
  [640, 96],
  [670, 140],
  [670, 205],
  [650, 240],
  [612, 258],
  [560, 260],
  [480, 260],
  [400, 260],
  [330, 256],
  [340, 240],
  [400, 234],
  [480, 232],
  [545, 222],
  [588, 196],
  [604, 158],
  [600, 126],
];

/** A leg from its hip or shoulder down to its paw, as a rounded post. */
function leg(x: Ctx, top: Pt, paw: Pt, color: number, seed: string) {
  const [cx, cy] = [(top[0] + paw[0]) / 2, (top[1] + paw[1]) / 2 - 6];
  const rot = Math.atan2(paw[1] - top[1], paw[0] - top[0]) - Math.PI / 2;
  piece(x, ellipsePts(cx, cy, 27, Math.hypot(paw[0] - top[0], paw[1] - top[1]) / 2 + 8, rot), color, seed, {
    amp: 3,
  });
  piece(x, ellipsePts(paw[0] + 4, paw[1] - 2, 33, 16), PAW, `${seed}-paw`, { amp: 2 });
  for (const k of [-1, 0, 1])
    line(
      x,
      [
        [paw[0] + 4 + k * 11, paw[1] + 6],
        [paw[0] + 4 + k * 11, paw[1] + 12],
      ],
      shade(PAW, 0.45),
      2.5,
    );
}

/**
 * The river (an otter) as a paper cut-out (docs/ART-STYLE.md), on the prepared sprite's points (`RIVER_ART`): the flat
 * tail paddle lies left of its root, where only the tail swishes; the long body waves from the neck to the hips; the
 * chest, front paws and head sit in the pinned polygon. The head, its ears and face lie wholly inside the head box, clear
 * of its left and bottom edges (the cut), so the turning head layer and the body's `nohead` plate agree along the cut.
 */
export function drawRiverBody(x: Ctx) {
  // Far legs, in a darker shade, behind everything.
  leg(x, [242, 212], [215, 288], FAR, 'river-leg-hind-far');
  leg(x, [548, 214], [555, 300], FAR, 'river-leg-front-far');

  // The flat tail paddle, left of its root, with a few crayon ridges.
  const tail = piece(x, ellipsePts(100, 178, 94, 58, -0.11), TAIL, 'river-tail', { amp: 3 });
  x.save();
  x.clip(tail);
  for (const [a, b, c] of [
    [
      [30, 140],
      [95, 160],
      [178, 160],
    ],
    [
      [22, 196],
      [100, 186],
      [180, 178],
    ],
    [
      [52, 228],
      [110, 210],
      [178, 196],
    ],
  ] as Pt[][])
    line(x, [a, b, c], shade(TAIL, 0.3), 3);
  x.restore();

  // The long body, its neck rising into the head box.
  const body = pieceUnion(x, [dense(TORSO, 18)], BODY, 'river-body', 4);
  // Cream underside: the belly, and the throat and chest running up under the chin.
  x.save();
  x.clip(body);
  piece(x, dense(CREAM_BAND, 16), CREAM, 'river-cream', { noShadow: true, noOutline: true, amp: 2 });
  x.restore();

  // Near legs, in front.
  leg(x, [348, 214], [330, 290], BODY, 'river-leg-hind');
  leg(x, [618, 204], [610, 292], BODY, 'river-leg-front');
}

/** The head, ears and face, all inside the head box. */
export function drawRiverHead(x: Ctx, ex: Expression) {
  // Small round ears behind the head, on the ear slots.
  const ears: Pt[] = [
    [558, 30],
    [596, 16],
  ];
  ears.forEach(([ex0, ey], i) => {
    piece(x, ellipsePts(ex0, ey, 17, 15), BODY, `river-ear${i}`, { amp: 1.5, small: true });
    spot(x, ex0 + 1, ey + 2, 8, 7, hexCss(TAIL));
  });
  const head = pieceUnion(
    x,
    [ellipsePts(612, 64, 66, 54, -0.2), ellipsePts(664, 56, 40, 32, -0.4)],
    BODY,
    'river-head',
    3,
  );
  // The cream muzzle and chin.
  x.save();
  x.clip(head);
  piece(x, ellipsePts(652, 94, 64, 32, -0.35), CREAM, 'river-muzzle', {
    noShadow: true,
    noOutline: true,
    amp: 2,
  });
  x.restore();

  // Whiskers.
  for (const [a, b] of [
    [
      [690, 62],
      [736, 48],
    ],
    [
      [692, 70],
      [740, 68],
    ],
  ] as Pt[][])
    line(x, [a, b], shade(BODY, 0.5), 2);

  A.cheeks.forEach((c) => spot(x, c.x, c.y, 15, 9, CHEEK));
  A.eyes.forEach((e, i) => eye(x, { ...e, rx: 15, ry: 15 }, ex, `river-eye${i}`));
  spot(x, A.nose.x, A.nose.y + 2, 11, 8, hexCss(NOSE));
  mouth(x, A.mouth, ex, 11);
}

export default () =>
  paperArtSet(
    A.width,
    A.height,
    (x, ex) => {
      drawRiverBody(x);
      drawRiverHead(x, ex);
    },
    { nohead: drawRiverBody },
  );
