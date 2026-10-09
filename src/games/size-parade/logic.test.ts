import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { SIZE_PLANS, sizeOrder, sizeScale, sizeTouch } from './logic';

describe('Size Parade', () => {
  it('orders ranks from smallest or biggest, and bigger ranks are bigger', () => {
    expect(sizeOrder(3, 'small')).toEqual([0, 1, 2]);
    expect(sizeOrder(3, 'big')).toEqual([2, 1, 0]);
    for (let n = 2; n <= 5; n++) for (let r = 1; r < n; r++) expect(sizeScale(r, n)).toBeGreaterThan(sizeScale(r - 1, n));
  });

  it('the ghost finger finds the biggest or smallest friend, and lines every level up in order, touching no wrong friend', () => {
    for (const plan of SIZE_PLANS) {
      for (let seed = 1; seed <= 40; seed++) {
        const rng = new Rng(seed);
        const order = sizeOrder(plan.count, plan.order);
        // The friends in the row are shuffled; the pick levels deal four of them, the line levels one row.
        const rows = plan.mode === 'pick' ? 4 : 1;
        for (let row = 0; row < rows; row++) {
          const friends = rng.shuffle([...order]).map((rank) => ({ rank, placed: false }));
          let step = 0;
          while (step < (plan.mode === 'pick' ? 1 : order.length)) {
            const i = sizeTouch(order, step, friends);
            expect(i, `${plan.name}: a friend to touch`).not.toBeNull();
            expect(friends[i!].rank, 'the right size').toBe(order[step]);
            expect(friends[i!].placed).toBe(false);
            if (plan.mode === 'line') friends[i!].placed = true;
            step++;
          }
        }
      }
    }
  });
});
