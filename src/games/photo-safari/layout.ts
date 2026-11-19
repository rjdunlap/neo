import type { View } from '../../engine/view';

/**
 * Where Photo Safari puts its tray, as pure functions of the view so a test can check every level on the upright phone
 * views (chunk 31, docs/definitions/phone-portrait.md). On a wide view the numbers are what the scene always used; held
 * upright (768 wide) the question cards go three to a row above the Tell button instead of five across, which needed
 * 806 units beside the guide's corner.
 */
export interface Point {
  x: number;
  y: number;
}

/** The pitch of the picture-word cards (150 wide with a gap). */
export const CARD_PITCH = 156;
/** The tray's bottom row stands this far up from the bottom edge, and each row above it a card's height more. */
export const TRAY_FOOT = 78;
export const ROW_PITCH = 140;
/** The pet's corner takes this much from the left on every view. */
export const GUIDE_X = 150;
/** Cards in a row on a narrow view: three 156-unit cards fit between the guide's corner and the right margin. */
export const NARROW_PER_ROW = 3;
/** The most cards a tell scene shows (three animals: up to three doing words and three places). */
export const MAX_TELL_CHIPS = 6;

/** Tell me which / both: five cards and the button across, in one row, need 806 units beside the guide. */
export const tellIsWide = (v: Pick<View, 'w'>): boolean => v.w - 190 >= 806;

/** The card rows a tell scene may use above its bottom row (the worst case, so the meadow never moves with the cards). */
export const tellRowsReserved = (v: Pick<View, 'w'>): number =>
  tellIsWide(v) ? 0 : Math.ceil(MAX_TELL_CHIPS / NARROW_PER_ROW);

export interface TellLayout {
  chips: Point[];
  button: Point;
}

/** Card centres for `n` cards and the Tell button; a chosen card rises 16, which the scene adds. */
export function tellLayout(v: Pick<View, 'w' | 'h'>, n: number): TellLayout {
  const foot = v.h - TRAY_FOOT;
  if (tellIsWide(v)) {
    const start = (GUIDE_X + v.w - 40 - 806) / 2;
    return {
      chips: Array.from({ length: n }, (_, i) => ({ x: start + 70 + i * CARD_PITCH, y: foot })),
      button: { x: start + 721, y: foot },
    };
  }
  const mid = (GUIDE_X + v.w - 40) / 2;
  const rows = Math.ceil(n / NARROW_PER_ROW);
  const chips: Point[] = [];
  for (let r = 0; r < rows; r++) {
    const inRow = Math.min(NARROW_PER_ROW, n - r * NARROW_PER_ROW);
    // The first row is the topmost; the Tell button has the bottom row to itself.
    for (let i = 0; i < inRow; i++)
      chips.push({
        x: mid + (i - (inRow - 1) / 2) * CARD_PITCH,
        y: foot - ROW_PITCH * (rows - r),
      });
  }
  return { chips, button: { x: mid, y: foot } };
}

/** Mystery Friend on a phone upright or any narrow view: the tray takes two rows and the meadow lifts. */
export const mysteryTwoRows = (v: Pick<View, 'w'>, best: boolean): boolean =>
  v.w < 900 || (best ? 5 : 4) * CARD_PITCH > v.w - 190;

/** The Mystery tray: doing words over places in two rows (centred beside the guide), or one row when wide. */
export function mysteryLayout(
  v: Pick<View, 'w' | 'h'>,
  best: boolean,
  actions: number,
  spots: number,
): { two: boolean; chips: Point[] } {
  const two = mysteryTwoRows(v, best);
  const mid = (GUIDE_X + v.w - 40) / 2;
  const foot = v.h - TRAY_FOOT;
  const rows = two ? [actions, spots] : [actions + spots];
  const chips: Point[] = [];
  rows.forEach((count, r) => {
    for (let i = 0; i < count; i++)
      chips.push({ x: mid + (i - (count - 1) / 2) * CARD_PITCH, y: foot - (two && r === 0 ? ROW_PITCH : 0) });
  });
  return { two, chips };
}

/** The meadow's ground line for the tell and mystery levels, lifted over the tray; other levels stand at 78%. */
export function groundLine(
  v: Pick<View, 'w' | 'h'>,
  kind: 'plain' | 'tell' | 'mystery',
  best = false,
): number {
  if (kind === 'plain') return v.h * 0.78;
  const lift = kind === 'tell' ? tellRowsReserved(v) * ROW_PITCH : mysteryTwoRows(v, best) ? ROW_PITCH : 0;
  return Math.min(v.h * 0.78, v.h - 200) - lift;
}
