import { describe as group, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { describe, makeRequests, needs, PLANS, toolFor, type Strand } from './logic';

const head = (length: number, curl: number, color: Strand['color'], n = 20): Strand[] => Array.from({ length: n }, () => ({ length, curl, color }));

group('Fluffy Salon', () => {
  it('never starts a request already done, and names each look', () => {
    for (const plan of PLANS.filter((p) => p.requests > 0)) {
      for (let seed = 1; seed <= 200; seed++) {
        const rs = makeRequests(plan, new Rng(seed));
        expect(rs).toHaveLength(plan.requests);
        expect(new Set(rs.map((r) => describe(r.look))).size).toBe(rs.length);
        for (const r of rs) {
          const parts = Object.keys(r.look).length;
          expect(parts, plan.name).toBe(plan.mode === 'ask' ? 1 : plan.mode === 'two' ? 2 : 3);
          expect(needs(r.look, head(r.start.length, r.start.curl, r.start.color))).not.toBeNull();
        }
      }
    }
  });

  it('says what to fix first, and which tool fixes it', () => {
    const look = { length: 'long' as const, color: 'pink' as const, curl: 'curly' as const };
    expect(needs(look, head(60, 0.1, 'blue'))).toBe('longer');
    expect(needs(look, head(200, 0.1, 'blue'))).toBe('pink');
    expect(needs(look, head(200, 0.1, 'pink'))).toBe('curlier');
    expect(needs(look, head(200, 0.9, 'pink'))).toBeNull();
    expect(toolFor('longer')).toBe('grow');
    expect(toolFor('shorter')).toBe('cut');
    expect(toolFor('straighter')).toBe('comb');
    expect(toolFor('pink')).toBe('pink');
    expect(describe(look)).toBe('long, curly and pink');
    expect(describe({ length: 'short', color: 'blue' })).toBe('short and blue');
  });

  it('counts a color only when most of the fur has it', () => {
    const mixed = [...head(100, 0.3, 'pink', 15), ...head(100, 0.3, 'blue', 5)];
    expect(needs({ color: 'pink' }, mixed)).toBe('pink');
    expect(needs({ color: 'pink' }, [...head(100, 0.3, 'pink', 17), ...head(100, 0.3, 'blue', 3)])).toBeNull();
  });
});
