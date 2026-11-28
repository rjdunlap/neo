import type { View } from '../../engine/view';

/**
 * Where Animal Charades puts things, as a pure function of the view so a test can check both orientations. The stage (the
 * pet's performance) is on top in portrait and on the left in landscape; three cards in a row of at least 100 units; the
 * buttons along the bottom edge from the right so the pet's bottom-left corner stays clear.
 */
export function charadesLayout(v: View) {
  const upright = v.h > v.w;
  const gap = 14;
  const card = upright
    ? Math.max(100, Math.min(190, (v.w - 60 - 2 * gap) / 3))
    : Math.max(100, Math.min(190, (v.w * 0.5 - 40 - 2 * gap) / 3));
  const stage = upright ? Math.min(340, v.w - 40) : 320;
  const stageC = upright ? { x: v.w / 2, y: 80 + stage / 2 } : { x: v.w * 0.26, y: v.h * 0.4 };
  const cx = upright ? v.w / 2 : v.w * 0.7;
  const cardY = upright ? stageC.y + stage / 2 + 40 + card / 2 : v.h * 0.4;
  const cards = [-1, 0, 1].map((i) => ({ x: cx + i * (card + gap), y: cardY }));
  const radius = 56;
  const buttonY = v.h - 100;
  const buttons = [0, 1, 2].map((i) => ({ x: v.w - 110 - i * 160, y: buttonY }));
  const seats = [-1, 1].map((i) => ({ x: v.w / 2 + i * 150, y: v.h * 0.45 }));
  return { upright, card, stage, stageC, cx, cards, cardY, buttons, radius, seats };
}
