/** The number tray's columns beside the bed. */
export const COLS = 3;
/** The smallest touch target in a grown-up game, in logical units. */
export const MIN_TOUCH = 64;
/** Touch play: the number tiles, then Marks, Erase, Hint and Start over (and Fill marks on a 9 by 9 bed), each a target of its own. */
export type SlotKind = 'digit' | 'marks' | 'erase' | 'hint' | 'again' | 'fill';
export interface Slot {
  kind: SlotKind;
  d: number;
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface TouchLayout {
  /** A square of the bed, and a number tile. */
  cell: number;
  tile: number;
  /** The bed's top-left corner. */
  x: number;
  y: number;
  beside: boolean;
  slots: Slot[];
  /** Where the hint's words go and how wide they wrap. */
  banner: { x: number; y: number; wrap: number };
}

/**
 * Touch layout for an `n` by `n` bed in a `w` × `h` view. Beside the bed when it fits (the tray in a column), else under it
 * (a row of numbers, then a row of buttons), so every square and every button is at least 64 across at 6 by 6 and 9 by 9,
 * upright or sideways. On a view too narrow for the bed beside Home and "?" (an upright phone, chunk 31) the bed starts
 * below them.
 */
export function touchLayout(n: number, w: number, h: number, fill: boolean): TouchLayout {
  const LEFT = 172;
  const trayAt = (tile: number) => COLS * tile + (COLS - 1) * 10;
  const tile = n > 6 ? MIN_TOUCH : 72;
  const side = Math.min(96, Math.floor((h - 150) / n), Math.floor((w - LEFT - 20 - 44 - trayAt(tile)) / n));
  // Under it wins only on a tall view, where it is bigger.
  const rowLeft = 140,
    margin = 12;
  const tw = Math.max(MIN_TOUCH, Math.min(88, Math.floor((w - margin - rowLeft - (n - 1) * 5) / n)));
  // The bed keeps clear of the home and help buttons at the left, so it is no wider than the view less that margin on both sides.
  const stack = Math.min(
    96,
    Math.floor((w - 2 * rowLeft) / n),
    Math.floor((h - 128 - 16 - 20 - tw - 10 - 72 - 20 - (fill ? 82 : 0)) / n),
  );
  const slots: Slot[] = [];
  if (side >= MIN_TOUCH && side + 8 > stack) {
    const bed = n * side,
      trayW = trayAt(tile),
      x = Math.max(LEFT, (w - (bed + 44 + trayW)) / 2),
      y = Math.max(100, Math.floor((h - bed) / 2)),
      tx = x + bed + 44,
      ty = y + 6;
    for (let d = 1; d <= n; d++)
      slots.push({
        kind: 'digit',
        d,
        x: tx + ((d - 1) % COLS) * (tile + 10),
        y: ty + Math.floor((d - 1) / COLS) * (tile + 10),
        w: tile,
        h: tile,
      });
    const half = (trayW - 10) / 2,
      rows = Math.ceil(n / COLS) * (tile + 10);
    const pair = (a: SlotKind, b: SlotKind, py: number) => {
      [a, b].forEach((kind, k) =>
        slots.push({ kind, d: 0, x: tx + k * (half + 10), y: py, w: half, h: tile }),
      );
    };
    pair('marks', 'erase', ty + rows);
    pair('hint', 'again', ty + rows + tile + 10);
    if (fill) slots.push({ kind: 'fill', d: 0, x: tx, y: ty + rows + 2 * (tile + 10), w: trayW, h: tile });
    const bottom = ty + rows + (fill ? 3 : 2) * (tile + 10);
    return {
      cell: side,
      tile,
      x,
      y,
      beside: true,
      slots,
      banner: { x: tx, y: bottom + 8, wrap: Math.max(180, w - tx - 36) },
    };
  }
  // A tall view: the bed centred, the numbers in a row under it and four buttons under them, clear of the pet in the corner.
  const cell = Math.max(MIN_TOUCH, stack),
    bed = n * cell,
    rowW = n * tw + (n - 1) * 5,
    x = (w - bed) / 2;
  // On an upright phone (chunk 31) a bed reaching into the column of Home and "?" starts below them; the wide area is unchanged.
  const top = w < 1000 && x < 120 ? 220 : 128;
  const dx = Math.max(rowLeft, (w - rowW) / 2),
    dy = top + bed + 16 + 20;
  for (let d = 1; d <= n; d++)
    slots.push({ kind: 'digit', d, x: dx + (d - 1) * (tw + 5), y: dy, w: tw, h: tw });
  const kinds: SlotKind[] = ['marks', 'erase', 'hint', 'again'],
    bx = 150,
    bw = Math.floor((w - margin - bx - 30) / 4);
  kinds.forEach((kind, k) =>
    slots.push({ kind, d: 0, x: bx + k * (bw + 10), y: dy + tw + 10, w: bw, h: 72 }),
  );
  // Fill marks under Hint and Start over, at the right, away from the pet in the corner.
  if (fill)
    slots.push({ kind: 'fill', d: 0, x: bx + 2 * (bw + 10), y: dy + tw + 10 + 82, w: 2 * bw + 10, h: 72 });
  // The hint's words sit above the bed, beside the home button.
  return {
    cell,
    tile: tw,
    x,
    y: top,
    beside: false,
    slots,
    banner: { x: 140, y: 8, wrap: Math.max(230, w - 140 - 36) },
  };
}
