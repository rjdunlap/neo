import { describe, expect, it } from 'vitest';
import {
  cleanShells,
  earnShells,
  earnsShells,
  emptyShells,
  MAX_BALANCE,
  SHELLS_PER_GAME_PER_DAY,
  SHELLS_PER_ROUND,
} from './shells';
import { defaults, migrate } from '../progress/save';
import type { Band } from '../progress/bands';

const DAY = '2026-11-25';

describe('shells', () => {
  it('only grown-ups earn them for now', () => {
    const bands: Band[] = ['lap', 'toddler', 'preschool', 'prek', 'school', 'grownup'];
    expect(bands.filter(earnsShells)).toEqual(['grownup']);
    for (const band of bands.filter((b) => b !== 'grownup')) {
      const r = earnShells(emptyShells(), 'sudoku-garden', band, DAY);
      expect(r.shells).toBe(0);
      expect(r.next).toEqual(emptyShells());
    }
  });

  it('pays a round, then stops at the cap per game per day', () => {
    let save = emptyShells();
    const paid: number[] = [];
    for (let i = 0; i < 5; i++) {
      const r = earnShells(save, 'sudoku-garden', 'grownup', DAY);
      paid.push(r.shells);
      save = r.next;
    }
    expect(paid).toEqual([5, 5, 5, 0, 0]);
    expect(save.balance).toBe(SHELLS_PER_GAME_PER_DAY);
    expect(SHELLS_PER_GAME_PER_DAY / SHELLS_PER_ROUND).toBe(3);
    // Another game has its own cap the same day.
    expect(earnShells(save, 'word-search', 'grownup', DAY).shells).toBe(5);
  });

  it('starts the counts again on a new day without touching the balance', () => {
    const capped = { balance: 40, day: DAY, earned: { 'sudoku-garden': 15 } };
    const r = earnShells(capped, 'sudoku-garden', 'grownup', '2026-11-26');
    expect(r.shells).toBe(5);
    expect(r.next).toEqual({ balance: 45, day: '2026-11-26', earned: { 'sudoku-garden': 5 } });
  });

  it('never goes past the largest balance', () => {
    const full = { balance: MAX_BALANCE - 2, day: DAY, earned: {} };
    expect(earnShells(full, 'tile-pairs', 'grownup', DAY).shells).toBe(2);
    expect(earnShells({ ...full, balance: MAX_BALANCE }, 'tile-pairs', 'grownup', DAY).shells).toBe(0);
  });

  it('repairs a damaged record', () => {
    expect(cleanShells(undefined)).toEqual(emptyShells());
    expect(cleanShells('lots')).toEqual(emptyShells());
    expect(
      cleanShells({
        balance: 12.7,
        day: DAY,
        earned: { 'tile-pairs': 99, 'Bad Id': 5, 'word-search': -3, crossword: 'x', 'log-roll': 10 },
      }),
    ).toEqual({ balance: 12, day: DAY, earned: { 'tile-pairs': 15, 'log-roll': 10 } });
    expect(cleanShells({ balance: -5, day: 'yesterday', earned: { 'tile-pairs': 5 } })).toEqual(
      emptyShells(),
    );
    expect(cleanShells({ balance: 1e12 }).balance).toBe(MAX_BALANCE);
  });

  it('an older save starts at none, and the save keeps shells through a reload', () => {
    const old = defaults() as unknown as Record<string, unknown>;
    delete old.shells;
    expect(migrate(old).shells).toEqual(emptyShells());
    const d = defaults();
    d.shells = { balance: 30, day: DAY, earned: { 'tile-pairs': 10 } };
    expect(migrate(JSON.parse(JSON.stringify(d))).shells).toEqual(d.shells);
  });
});
