import { petSage } from '../../palette';
import type { Expression } from '../illustrated';
import { SPROUT_ART as A } from '../sprout-illustrated';
import {
  almondPts,
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

const BODY = petSage.fill;
const INNER = petSage.light;
const CREAM = 0xfef1d1;
const LEAF = 0x8ccf4e;
const PAD = 0xe6b8a2;

/**
 * The sprout as a paper cut-out (docs/ART-STYLE.md), drawn on the prepared sprite's points (`SPROUT_ART`): the two leaves
 * reach from the stem's fork to the table's tips, the arms are the table's ellipses, the feet stand on the foot slots and
 * the face sits on the table's eyes, nose and mouth, so the rig bends, blinks and dresses it as it did the painted set.
 * The round body covers the pinned polygon.
 */
export function drawSprout(x: Ctx, ex: Expression) {
  // The stem and its two leaves, behind the head.
  const fork: [number, number] = [A.leaves.fork.x, A.leaves.fork.y];
  line(
    x,
    [
      [A.leaves.root.x, A.leaves.root.y + 14],
      [A.leaves.fork.x + 3, (A.leaves.root.y + A.leaves.fork.y) / 2],
      fork,
    ],
    shade(LEAF, 0.4),
    10,
  );
  A.leaves.tips.forEach((tip, i) => {
    const t: [number, number] = [tip.x, tip.y];
    piece(x, almondPts(fork, t, i === 0 ? 74 : 64), LEAF, `sprout-leaf${i}`);
    line(
      x,
      [
        fork,
        [(fork[0] + t[0]) / 2, (fork[1] + t[1]) / 2 - (i === 0 ? 4 : 6)],
        [fork[0] * 0.2 + t[0] * 0.8, fork[1] * 0.2 + t[1] * 0.8],
      ],
      shade(LEAF, 0.32),
      3.5,
    );
  });

  // Ears behind the head.
  A.ears.forEach((e, i) => {
    piece(x, ellipsePts(e.x, e.y + 8, 44, 42), BODY, `sprout-ear${i}`);
    spot(x, e.x + (i === 0 ? 4 : -2), e.y + 12, 22, 20, hexCss(INNER));
  });

  // Head and body, cut as one round piece.
  pieceUnion(x, [ellipsePts(258, 258, 158, 128), ellipsePts(262, 350, 190, 112)], BODY, 'sprout-body', 4);
  // The cream tummy and muzzle.
  piece(x, ellipsePts(270, 368, 122, 86), CREAM, 'sprout-belly', { noShadow: true, amp: 3 });
  piece(x, ellipsePts(306, 262, 84, 46, -0.08), CREAM, 'sprout-muzzle', {
    noShadow: true,
    amp: 2,
    noOutline: true,
  });

  // Stubby arms resting on the body's sides, in front of it, so a mitten sits on a paw (the hand slots are the tips).
  A.arms.forEach((a, i) => {
    const [mx, my] = [(a.root.x + a.tip.x) / 2, (a.root.y + a.tip.y) / 2];
    const rot = Math.atan2(a.tip.y - a.root.y, a.tip.x - a.root.x) - Math.PI / 2;
    const len = Math.hypot(a.tip.x - a.root.x, a.tip.y - a.root.y) / 2 + 22;
    piece(x, ellipsePts(mx, my, 30, len, rot), BODY, `sprout-arm${i}`, { amp: 2.5 });
    for (const k of [-1, 1]) spot(x, a.tip.x + k * 9, a.tip.y + 4, 6, 7, hexCss(CREAM));
  });

  // Feet with their pads, in front.
  A.slots.feet.forEach((f, i) => {
    const [rx, ry] = i === 0 ? [62, 50] : [46, 44];
    piece(x, ellipsePts(f.x, f.y - 4, rx, ry), BODY, `sprout-foot${i}`);
    spot(x, f.x + 2, f.y + 6, rx * 0.4, ry * 0.36, hexCss(PAD));
    for (const k of [-1, 0, 1])
      spot(x, f.x + k * rx * 0.36, f.y - ry * 0.4, rx * 0.13, ry * 0.14, hexCss(PAD));
  });

  // The face.
  A.eyes.forEach((e, i) => eye(x, e, ex, `sprout-eye${i}`));
  spot(x, A.nose.x, A.nose.y, 10, 7, hexCss(0x4a2f2f));
  mouth(x, { x: A.mouth.x, y: A.mouth.y + 2 }, ex, 17);
}

export default () => paperArtSet(A.width, A.height, drawSprout);
