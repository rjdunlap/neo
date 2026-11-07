import { describe, expect, it } from 'vitest';
import type { RoundResult } from '../games/types';
import { HINT_AFTER, hinted, missEvery, missOnRequest, newRequestTally, newTally, nextRequest, tally } from './coach';

describe('coach', () => {
  it('brings the hint after two misses, the AGENTS.md rule', () => {
    expect(HINT_AFTER).toBe(2);
  });

  it('every-second cadence: due on misses 2, 4 and 6, never between', () => {
    const t = newTally();
    const due = Array.from({ length: 6 }, () => missEvery(t));
    expect(due).toEqual([false, true, false, true, false, true]);
    expect(t).toEqual({ misses: 6, hints: 0 });
  });

  it('a due miss is not a hint until the game shows one', () => {
    const t = newTally();
    missEvery(t);
    if (missEvery(t)) hinted(t);
    expect(t).toEqual({ misses: 2, hints: 1 });
  });

  it('per-request cadence: due once, at the second miss on a request', () => {
    const t = newRequestTally();
    expect([missOnRequest(t), missOnRequest(t), missOnRequest(t), missOnRequest(t)]).toEqual([false, true, false, false]);
    expect(t).toMatchObject({ misses: 4, roundMisses: 4, helped: true, hints: 0 });
  });

  it('a new request starts its misses over but keeps the round totals', () => {
    const t = newRequestTally();
    missOnRequest(t);
    if (missOnRequest(t)) hinted(t);
    nextRequest(t);
    expect(t).toEqual({ misses: 2, hints: 1, roundMisses: 0, helped: false });
    expect(missOnRequest(t)).toBe(false);
    expect(missOnRequest(t)).toBe(true);
    expect(t.misses).toBe(4);
  });

  it('a Help press or idle glow counts on its own, without a miss', () => {
    const t = newRequestTally();
    hinted(t);
    hinted(t);
    expect(t).toMatchObject({ misses: 0, hints: 2 });
    // It does not use up the request's own hint.
    missOnRequest(t);
    expect(missOnRequest(t)).toBe(true);
  });

  it('a different threshold moves both cadences', () => {
    const t = newRequestTally();
    expect([missEvery(t, 3), missEvery(t, 3), missEvery(t, 3)]).toEqual([false, false, true]);
    const r = newRequestTally();
    expect([missOnRequest(r, 3), missOnRequest(r, 3), missOnRequest(r, 3)]).toEqual([false, false, true]);
  });

  it('reports exactly what ctx.finish takes', () => {
    const t = newRequestTally();
    missOnRequest(t);
    hinted(t);
    const result: RoundResult = tally(t);
    expect(result).toEqual({ misses: 1, hints: 1 });
    expect(Object.keys(result).sort()).toEqual(['hints', 'misses']);
  });
});
