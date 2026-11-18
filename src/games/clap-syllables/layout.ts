import { spread, type View } from '../../engine/view';
import { CARS, type ClapMode } from './logic';

export const CARD_SIZE: Record<ClapMode, number> = {
  along: 260,
  solo: 260,
  sort: 140,
  match: 180,
  compare: 180,
  train: 150,
};
export const PAD_RADIUS = 104;
export const REPLAY_RADIUS = 52;
export const BIN_HEIGHT = 156;
export const binWidth = (bins: number) => (bins === 4 ? 166 : 200);
export const CAR_GAP = 182;
export const CAR_Y = -70;
export const ENGINE_X = (CARS - 1) * CAR_GAP + 164;

export const sortedSlot = (slot: number) => ({
  x: -52 + (slot % 3) * 52,
  y: -118 - Math.floor(slot / 3) * 40,
});

export function clapLayout(
  { w, h, upright }: Pick<View, 'w' | 'h' | 'upright'>,
  mode: ClapMode,
  cards: number,
  bins: number,
  beads: number,
) {
  const center = w / 2;
  const clap = mode === 'along' || mode === 'solo';
  const twoRows = upright ? cards > 4 : cards > 5;
  const perRow = twoRows ? Math.ceil(cards / 2) : cards;
  // A short portrait round still needs to clear Home and Help above the first row.
  const firstRow = upright ? Math.max(292, h * 0.23) : h * 0.15;
  const rowStep = h * (upright ? 0.18 : 0.21);
  let cardPositions: { x: number; y: number }[];
  if (mode === 'sort') {
    cardPositions = Array.from({ length: twoRows ? 2 : 1 }, (_, row) => {
      const count = Math.min(perRow, cards - row * perRow);
      const xs = upright ? spread(count, 40, w - 40, 170) : spread(count, 100, w - 100, 160);
      const y = twoRows ? firstRow + row * rowStep : h * 0.3;
      return xs.map((x) => ({ x, y }));
    }).flat();
  } else if (clap) {
    cardPositions = [{ x: center, y: h * 0.34 }];
  } else if (mode === 'train') {
    const margin = upright ? 65 : 160;
    const lifts = [0, 34, -18];
    const y = upright ? Math.max(306, h * 0.27) : h * 0.27;
    cardPositions = spread(cards, margin, w - margin, 230).map((x, i) => ({
      x,
      y: y + lifts[i % lifts.length],
    }));
  } else {
    cardPositions = spread(cards, upright ? 30 : 190, w - (upright ? 30 : 90), 230).map((x) => ({
      x,
      y: h * 0.62,
    }));
  }
  const binXs = upright
    ? spread(bins, 24, w - 24, bins === 4 ? 185 : 222)
    : spread(bins, bins === 4 ? 150 : 0, w - (bins === 4 ? 24 : 0), bins === 4 ? 206 : 250);
  // Leave room above each bin for its two rows of sorted cards.
  const binY = upright ? Math.max(h * 0.71, firstRow + rowStep + 264) : h * 0.72;

  return {
    cards: cardPositions,
    bins: binXs.map((x) => ({ x, y: binY })),
    beads: Array.from({ length: beads }, (_, i) => ({
      x: center + (i - (beads - 1) / 2) * 76,
      y: clap ? h * 0.34 + 214 : h * 0.25,
    })),
    pad: { x: center, y: h * 0.82 },
    replay: { x: w - 80, y: 90 },
    caption: { x: center, y: h * 0.34 + 160 },
    // The first wagon extends 87 units left; the engine lamp reaches 104 units past its center.
    train: { x: center - (ENGINE_X + 104 - 87) / 2, y: h * 0.66 },
  };
}
