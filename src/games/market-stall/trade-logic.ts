import { AWNING, fewest, stallLayout, TRADE_COINS } from './logic';

export { makeTradeOrders, TRADE_COINS } from './logic';

export const TRADE_CELL = 100;
export const TRADE_MAT = { w: 6 * TRADE_CELL, h: 2 * TRADE_CELL };

export function tradeLayout(view: Parameters<typeof stallLayout>[0]) {
  const base = stallLayout(view);
  // Leave room below the mat for the caption bubble, even on a short view.
  const cy = Math.min(base.cy, Math.max(100, view.h - 690));
  const awningTop = view.upright ? Math.max(210, cy - AWNING.drop) : Math.max(0, cy - 105);
  return { ...base, cy, awningTop };
}

export function tradeButtons(view: { w: number; h: number }) {
  const first = Math.max(220, view.w / 2 - 170);
  return [0, 1, 2].map((i) => ({ x: first + i * 170, y: view.h - 85 }));
}

export function tradeSlot(index: number) {
  return { x: ((index % 6) - 2.5) * TRADE_CELL, y: (Math.floor(index / 6) - 0.5) * TRADE_CELL };
}

const total = (heap: readonly number[]) => heap.reduce((a, b) => a + b, 0);

export function tradeTo(selection: readonly number[]): number | null {
  const value = total(selection);
  return selection.length >= 2 && TRADE_COINS.includes(value) ? value : null;
}

export function trade(heap: readonly number[], indices: readonly number[]): number[] | null {
  const picked = new Set(indices);
  if (
    picked.size !== indices.length ||
    indices.some((i) => !Number.isInteger(i) || i < 0 || i >= heap.length)
  )
    return null;
  const value = tradeTo(indices.map((i) => heap[i]));
  if (value === null) return null;
  const first = Math.min(...indices);
  return heap.flatMap((coin, i) => (i === first ? [value] : picked.has(i) ? [] : [coin]));
}

export function isFewestTrade(heap: readonly number[]): boolean {
  return heap.length === fewest(total(heap), TRADE_COINS).length;
}

function* legalGroups(
  heap: readonly number[],
  start = 0,
  picked: number[] = [],
  value = 0,
): Generator<number[]> {
  const seen = new Set<number>();
  for (let i = start; i < heap.length; i++) {
    const sum = value + heap[i];
    if (sum > 10 || seen.has(heap[i])) continue;
    seen.add(heap[i]);
    const group = [...picked, i];
    if (group.length >= 2 && TRADE_COINS.includes(sum)) yield group;
    if (sum < 10) yield* legalGroups(heap, i + 1, group, sum);
  }
}

/** Breadth-first search over coin multisets. Keep the original indices only for the first move. */
export function nextTrade(heap: readonly number[]): number[] | null {
  const goal = fewest(total(heap), TRADE_COINS).length;
  if (heap.length === goal) return null;
  const queue: { coins: readonly number[]; first: number[] | null }[] = [{ coins: heap, first: null }];
  const seen = new Set<string>();
  for (const { coins, first } of queue) {
    for (const group of legalGroups(coins)) {
      const next = trade(coins, group)!;
      if (next.length === goal) return first ?? group;
      const key = [...next].sort().join(',');
      if (seen.has(key)) continue;
      seen.add(key);
      queue.push({ coins: next, first: first ?? group });
    }
  }
  return null;
}

export const stuck = (heap: readonly number[]) => !isFewestTrade(heap) && nextTrade(heap) === null;
