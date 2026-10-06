import { expect, it } from 'vitest';
import { REGION_PAGE_SIZE, regionPage } from './region-pages';

it('makes every landmark reachable exactly once as a region grows, and clamps stale pages', () => {
  for (let count = 0; count < 40; count++) {
    const first = regionPage(count, -1), visited: number[] = [];
    expect(first.page).toBe(0);
    for (let page = 0; page < first.pages; page++) {
      const p = regionPage(count, page);
      expect(p.end - p.start).toBeLessThanOrEqual(REGION_PAGE_SIZE);
      for (let i = p.start; i < p.end; i++) visited.push(i);
    }
    expect(visited).toEqual(Array.from({ length: count }, (_, i) => i));
    expect(regionPage(count, 99).page).toBe(first.pages - 1);
  }
});
