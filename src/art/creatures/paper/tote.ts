import { TOTE_ART as A } from '../cast';
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

const SHELL = 0xf7d36a;
const WHORL = 0xfbe08e;
const LIP = 0xf7a9a4;
const BODY = 0xf98a3e;
const CREAM = 0xfde9c6;
const CHEEK = 'rgba(255,128,140,0.55)';

type Pt = [number, number];

/** A crab claw: a round palm with a smaller thumb on its upper side, cut as two pieces so the pincer's seam shows. */
function claw(x: Ctx, palm: Pt, s: number, thumb: Pt, rot: number, seed: string) {
  piece(x, ellipsePts(palm[0], palm[1], s, s * 0.84, rot), BODY, `${seed}-palm`, { amp: 3 });
  piece(x, ellipsePts(thumb[0], thumb[1], s * 0.62, s * 0.46, rot - 0.6), BODY, `${seed}-thumb`, { amp: 2 });
}

/**
 * Tote the hermit crab as a paper cut-out (docs/ART-STYLE.md), on `TOTE_ART`'s points: the yellow spiral shell and
 * its pink lip fill the pinned body, the orange head peeks out of the shell's mouth on the table's face, the far
 * claw waves inside its region and the two back legs shuffle inside theirs; the big near claw and the front legs
 * stand still below the shell.
 */
export function drawTote(x: Ctx, ex: Expression) {
  // The far claw, behind the head (the rig's first part).
  const [, legA, legB] = A.parts;
  piece(x, ellipsePts(526, 284, 28, 17, 0.75), BODY, 'tote-arm', { amp: 2 });
  claw(x, [566, 322], 46, [546, 290], 0.3, 'tote-far');

  // The two back legs that shuffle (the rig's other parts), and the still front legs.
  [legA, legB].forEach((l, i) => {
    const [cx, cy] = [(l.root.x + l.tip.x) / 2, (l.root.y + l.tip.y) / 2];
    piece(x, ellipsePts(cx, cy, 26, 50, 0.12), BODY, `tote-leg${i}`, { amp: 2.5 });
  });
  piece(x, ellipsePts(466, 352, 24, 44, -0.15), BODY, 'tote-leg2', { amp: 2.5 });

  // The shell: one big round piece, a paler whorl and the spiral's tip.
  piece(x, ellipsePts(185, 170, 162, 148, -0.1), SHELL, 'tote-shell');
  piece(x, ellipsePts(118, 188, 94, 104, 0.15), WHORL, 'tote-whorl', { amp: 3 });
  piece(x, ellipsePts(78, 186, 44, 50), SHELL, 'tote-tip', { amp: 2 });
  line(
    x,
    [
      [80, 186],
      [70, 176],
      [58, 188],
      [70, 204],
      [92, 200],
    ],
    shade(SHELL, 0.4),
    5,
  );
  // A shine stripe on the big shell.
  line(
    x,
    [
      [215, 55],
      [265, 70],
      [300, 105],
    ],
    'rgba(255,255,255,0.55)',
    10,
  );

  // The orange underside, under the shell's rim.
  piece(x, ellipsePts(240, 316, 118, 26, -0.05), BODY, 'tote-under', { amp: 2 });

  // The pink lip of the shell's mouth, a ring round the head.
  piece(x, ellipsePts(380, 198, 142, 112, -0.55), LIP, 'tote-lip');

  // Body and head as one orange piece, coming out of the shell.
  pieceUnion(x, [ellipsePts(415, 222, 100, 98), ellipsePts(345, 290, 120, 36, -0.08)], BODY, 'tote-body', 3);
  piece(x, ellipsePts(436, 248, 78, 60, -0.12), CREAM, 'tote-face', {
    noShadow: true,
    noOutline: true,
    amp: 2,
  });
  // The front leg between the claws, and the big near claw in front.
  piece(x, ellipsePts(296, 362, 25, 46, 0.15), BODY, 'tote-leg3', { amp: 2.5 });
  claw(x, [382, 342], 62, [352, 312], 0.1, 'tote-near');

  // The face.
  [
    [352, 246],
    [507, 228],
  ].forEach(([cx, cy], i) => spot(x, cx, cy, i ? 10 : 20, 13, CHEEK));
  A.eyes.forEach((e, i) => eye(x, e, ex, `tote-eye${i}`));
  spot(x, A.nose.x, A.nose.y, 6, 5, hexCss(0x4a2f2f));
  mouth(x, A.mouth, ex, 14);
}

export default () => paperArtSet(A.width, A.height, drawTote);
