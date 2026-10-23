import { overlaps, type Rect } from '../../content/lands';

/**
 * Whether a land's floor still has a clearing for a decor thing `w` across and `h` high, its feet between `top` and
 * `bottom`, on screen, below `ground` and off everything in `keepOut`. A scene test uses it to ask for a land's
 * signature decor (a bench, a pool) only where the games' touch areas leave room: a land with a dozen games can fill
 * its whole floor, and that is the layout doing its job (`landLayout` never shrinks a target), not a decor bug.
 * Callers pass the smallest size the scene tries, plus some margin, so a seeded search that just misses a tight gap
 * does not turn into a flaky test.
 */
export function hasRoom(keepOut: readonly Rect[], view: { w: number; h: number }, ground: number, size: { w: number; h: number }, top: number, bottom: number): boolean {
  const step = 4;
  for (let y = top; y <= bottom; y += step) {
    for (let x = 0; x + size.w <= view.w; x += step) {
      const r = { x, y: y - size.h, w: size.w, h: size.h };
      if (r.y > ground + 4 && !keepOut.some((k) => overlaps(r, k))) return true;
    }
  }
  return false;
}
