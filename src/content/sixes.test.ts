import { describe, expect, it } from 'vitest';
import type { Band } from '../progress/bands';
import { defaults, migrate } from '../progress/save';
import { emptyShells, MAX_BALANCE } from './shells';
import {
  ALL_SIX_BONUS,
  cleanSixes,
  emptySixes,
  keyOf,
  monthGrid,
  recordAllSix,
  resultOn,
  shareLine,
} from './sixes';

const DAY = '2026-11-28';
const at = (h: number) => new Date(2026, 10, 28, h).getTime();

describe("Today's six extras", () => {
  it('pays the all-six bonus once a day, to a grown-up only', () => {
    const first = recordAllSix(emptySixes(), emptyShells(), DAY, 'grownup');
    expect(first.bonus).toBe(ALL_SIX_BONUS);
    expect(first.sixes.days).toEqual([DAY]);
    expect(first.shells.balance).toBe(ALL_SIX_BONUS);
    const again = recordAllSix(first.sixes, first.shells, DAY, 'grownup');
    expect(again.bonus).toBe(0);
    expect(again.sixes).toBe(first.sixes);
    const next = recordAllSix(first.sixes, first.shells, '2026-11-30', 'grownup');
    expect(next.sixes.days).toEqual([DAY, '2026-11-30']);
    for (const band of ['lap', 'toddler', 'preschool', 'prek', 'school'] as Band[])
      expect(recordAllSix(emptySixes(), emptyShells(), DAY, band).bonus).toBe(0);
    expect(
      recordAllSix(emptySixes(), { ...emptyShells(), balance: MAX_BALANCE - 5 }, DAY, 'grownup').bonus,
    ).toBe(5);
  });

  it('repairs a damaged save: real days, once each, in order', () => {
    expect(cleanSixes(null)).toEqual(emptySixes());
    expect(cleanSixes({ days: ['2026-11-30', 'soon', 7, DAY, DAY] })).toEqual({ days: [DAY, '2026-11-30'] });
    expect(defaults().sixes).toEqual(emptySixes());
    expect(migrate({ ...defaults(), sixes: { days: [DAY, 'x'] } }).sixes).toEqual({ days: [DAY] });
  });

  it('reads how each card went today', () => {
    const r = (misses: number, hints: number, h: number) => ({
      level: 1,
      misses,
      hints,
      seconds: 9,
      at: at(h),
    });
    expect(resultOn(undefined, DAY)).toBe('none');
    expect(resultOn([r(0, 0, 9)], '2026-11-27')).toBe('none');
    expect(resultOn([r(1, 0, 9)], DAY)).toBe('help');
    expect(resultOn([r(1, 0, 9), r(0, 0, 10)], DAY)).toBe('clean');
  });

  it('writes a share line with no game names', () => {
    expect(shareLine('Nov 28', ['clean', 'help', 'none', 'clean', 'clean', 'none'])).toBe(
      "Puddle Island · Today's six · Nov 28\n🟩🟨⬜🟩🟩⬜ 4/6",
    );
  });

  it('lays a month out in weeks from Monday', () => {
    const nov = monthGrid(2026, 10); // 1 November 2026 is a Sunday
    expect(nov[0]).toEqual([null, null, null, null, null, null, 1]);
    expect(nov.flat().filter((d) => d !== null)).toHaveLength(30);
    expect(nov.every((w) => w.length === 7)).toBe(true);
    expect(keyOf(2026, 0, 5)).toBe('2026-01-05');
  });
});
