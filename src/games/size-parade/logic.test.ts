import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { computeView } from '../../engine/view';
import { CRITTER_H, dropSpot, FRIEND_SCALE, paradeLayout, SIZE_PLANS, askRank, middleAsks, MIDDLE_ONE, sizePlan, TWO_IN_A_LINE, sizeBell, sizeOrder, sizeScale, sizeTouch, sizeWord, TARGET } from './logic';

/** An iPad sideways and upright, and a phone sideways: the logical width is never below the 1024 design width. */
const VIEWS = [computeView(1024, 768), computeView(768, 1024), computeView(844, 390)];

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

  it('asks for bigger or smaller between two friends, biggest or smallest among more', () => {
    for (const plan of SIZE_PLANS) {
      const word = sizeWord(plan);
      if (plan.count === 2) expect(word).toBe(plan.order === 'big' ? 'bigger' : 'smaller');
      else expect(word).toBe(plan.order === 'big' ? 'biggest' : 'smallest');
    }
  });

  it('chimes the biggest friend lowest, on steps that fall as size rises', () => {
    for (let n = 2; n <= 5; n++) {
      for (let r = 1; r < n; r++) expect(sizeBell(r, n)).toBeLessThan(sizeBell(r - 1, n));
      expect(sizeBell(0, n)).toBe(9);
      expect(sizeBell(n - 1, n)).toBe(5);
    }
  });

  it('pins the size steps: neighbours differ by at least 18 units, and the smallest friend keeps a full target', () => {
    for (const plan of SIZE_PLANS) {
      const h = (r: number) => sizeScale(r, plan.count) * FRIEND_SCALE * CRITTER_H;
      for (let r = 1; r < plan.count; r++) expect(h(r) - h(r - 1), plan.name).toBeGreaterThanOrEqual(18);
      expect(h(0)).toBeGreaterThan(55);
    }
    expect(TARGET.w).toBeGreaterThanOrEqual(100);
    expect(TARGET.h).toBeGreaterThanOrEqual(100);
  });

  it('lays every row out without overlapping targets, each at least 100 wide, and keeps the line spots apart', () => {
    for (const v of VIEWS) {
      expect(v.w).toBeGreaterThanOrEqual(1024);
      for (const plan of SIZE_PLANS) {
        const slots = plan.mode === 'line' ? plan.count : 0;
        const { friends, targetW, spots } = paradeLayout(plan.count, slots, v.w);
        expect(targetW, plan.name).toBeGreaterThanOrEqual(100);
        for (let i = 1; i < friends.length; i++) expect(friends[i] - friends[i - 1], plan.name).toBeGreaterThanOrEqual(targetW);
        expect(friends[0] - targetW / 2).toBeGreaterThanOrEqual(80);
        expect(friends[friends.length - 1] + targetW / 2).toBeLessThanOrEqual(v.w);
        for (let i = 1; i < spots.length; i++) expect(spots[i] - spots[i - 1]).toBeGreaterThanOrEqual(132);
      }
    }
  });

  it('takes a drop near the glowing spot as generously as before, and names another spot rather than counting it', () => {
    const { spots } = paradeLayout(5, 5, 1024), y = 300;
    for (let glowing = 0; glowing < 5; glowing++) {
      expect(dropSpot(spots[glowing], y, spots, y, glowing)).toBe(glowing);
      expect(dropSpot(spots[glowing] + 80, y + 90, spots, y, glowing)).toBe(glowing);
      for (let other = 0; other < 5; other++) if (Math.abs(other - glowing) > 1) expect(dropSpot(spots[other], y, spots, y, glowing)).toBe(other);
    }
    expect(dropSpot(spots[2], y + 200, spots, y, 2)).toBeNull();
    expect(dropSpot(spots[4] + 200, y, spots, y, 0)).toBeNull();
  });

  it('level 17 lines two friends up, smaller first, and the bot can do it; level 10 asks for the middle at least twice in four rows', () => {
    expect(sizePlan(17)).toBe(TWO_IN_A_LINE);
    expect(sizePlan(10)).toBe(MIDDLE_ONE);
    expect(sizePlan(4).count).toBe(4);
    const order = sizeOrder(2, 'small'), friends = [{ rank: 1, placed: false }, { rank: 0, placed: false }];
    expect(friends[sizeTouch(order, 0, friends)!].rank).toBe(0);
    friends[1].placed = true;
    expect(friends[sizeTouch(order, 1, friends)!].rank).toBe(1);
    for (let seed = 1; seed <= 200; seed++) {
      const asks = middleAsks(new Rng(seed));
      expect(asks).toHaveLength(4);
      expect(asks.filter((a) => a === 'middle').length).toBeGreaterThanOrEqual(2);
      expect(asks.some((a) => a !== 'middle')).toBe(true);
      for (const a of asks) expect([0, 1, 2]).toContain(askRank(a));
    }
    expect(askRank('middle')).toBe(1);
    expect(sizeWord(MIDDLE_ONE, 'middle')).toBe('middle-sized');
  });
});
