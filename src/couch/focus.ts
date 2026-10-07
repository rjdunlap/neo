/** Moving a focus ring between things scattered over a board, for games whose targets are not a tidy grid. */
export interface Spot { x: number; y: number }

const UX = [1, 0, -1, 0];
const UY = [0, 1, 0, -1];

/**
 * Where the ring goes from `from` when pushed toward `dir` (0 right, 1 down, 2 left, 3 up): the
 * nearest spot that way, preferring ones straight ahead over ones off to the side. Stays put when
 * nothing lies that way.
 */
export function nextSpot(spots: readonly Spot[], from: number, dir: number): number {
  const a = spots[from];
  let best = from, bestCost = Infinity;
  spots.forEach((s, i) => {
    if (i === from) return;
    const dx = s.x - a.x, dy = s.y - a.y;
    const along = dx * UX[dir] + dy * UY[dir];
    if (along <= 0) return;
    const across = Math.abs(dx * UY[dir] - dy * UX[dir]);
    const cost = along + 2 * across;
    if (cost < bestCost) { best = i; bestCost = cost; }
  });
  return best;
}

/** The first push of a shortest route from `from` to `to`, or -1 when already there (or no route). */
export function routeStep(spots: readonly Spot[], from: number, to: number): number {
  if (from === to) return -1;
  const first = new Map<number, number>();
  const queue = [from];
  for (let head = 0; head < queue.length; head++) {
    const at = queue[head];
    for (let dir = 0; dir < 4; dir++) {
      const next = nextSpot(spots, at, dir);
      if (next === at || next === from || first.has(next)) continue;
      first.set(next, at === from ? dir : first.get(at)!);
      if (next === to) return first.get(next)!;
      queue.push(next);
    }
  }
  return -1;
}
