import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { makeSong, PATTERNS, ROW_STEPS, SONG_PLANS } from './logic';

describe('Song Maker songs', () => {
  it('fit the grid, use one note per beat, and never sit on a single pitch', () => {
    for (const plan of SONG_PLANS.filter((p) => p.mode !== 'free')) {
      expect(ROW_STEPS[plan.rows]).toHaveLength(plan.rows);
      for (let seed = 1; seed <= 300; seed++) {
        const song = makeSong(plan, new Rng(seed));
        const cols = song.notes.map((n) => n.col);
        expect(new Set(cols).size, plan.name).toBe(cols.length);
        for (const n of song.notes) {
          expect(n.col >= 0 && n.col < plan.cols && n.row >= 0 && n.row < plan.rows).toBe(true);
        }
        expect(new Set(song.notes.map((n) => n.row)).size).toBeGreaterThan(1);
        if (plan.mode === 'ghost' || plan.mode === 'card') expect(song.notes).toHaveLength(plan.notes);
        if (plan.mode === 'listen') expect(cols).toEqual([...Array(plan.cols).keys()]);
      }
    }
  });

  it('continues a pattern from its first bar, so the rest of the song is predictable', () => {
    const plan = SONG_PLANS.find((p) => p.mode === 'pattern')!;
    for (const p of PATTERNS) for (const row of p.rows) expect(row).toBeLessThan(plan.rows);
    for (let seed = 1; seed <= 50; seed++) {
      const song = makeSong(plan, new Rng(seed));
      expect(song.given).toEqual(song.notes.slice(0, 4));
      for (const n of song.notes.slice(4)) expect(n.row).toBe(song.given[n.col % 4].row);
    }
  });

  it('keeps higher rows higher in pitch', () => {
    for (const steps of Object.values(ROW_STEPS)) steps.slice(1).forEach((s, i) => expect(s).toBeLessThan(steps[i]));
  });
});
