import { describe, expect, it } from 'vitest';
import { CYCLE, judgeGo, lightAt, nextLight, safe } from './logic';

describe('Stop and Go', () => {
  it('cycles green, yellow, red, and back, with greens and reds long enough to wait for', () => {
    expect(lightAt(0)).toBe('green');
    expect(lightAt(3.6)).toBe('yellow');
    expect(lightAt(5)).toBe('red');
    const total = CYCLE.reduce((a, c) => a + c.seconds, 0);
    expect(lightAt(total + 0.1)).toBe('green');
    for (const c of CYCLE) if (c.light !== 'yellow') expect(c.seconds).toBeGreaterThanOrEqual(3);
    expect([nextLight('green'), nextLight('yellow'), nextLight('red')]).toEqual(['yellow', 'red', 'green']);
  });

  it('only counts going on red as a mistake; yellow is a nudge', () => {
    expect(judgeGo('green')).toBe('go');
    expect(judgeGo('yellow')).toBe('wait');
    expect(judgeGo('red')).toBe('stop');
    expect(safe({ ns: 'green', ew: 'red' })).toBe(true);
    expect(safe({ ns: 'green', ew: 'green' })).toBe(false);
  });
});
