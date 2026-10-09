import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { FREE_SONG, freeNote, JELLIES, jellyToTap, makeTune, PLANS } from './logic';

describe('Jelly Drums', () => {
  it('grows from free play to longer tunes', () => {
    const echo = PLANS.filter((p) => p.mode === 'echo');
    expect(PLANS.slice(0, 3).every((p) => p.mode === 'free')).toBe(true);
    for (let i = 1; i < echo.length; i++) expect(echo[i].length).toBeGreaterThanOrEqual(echo[i - 1].length);
    expect(echo[0].length).toBe(2);
    expect(echo.at(-1)!.length).toBe(5);
  });

  it('makes tunes on real jellies, never one note over and over, with no repeats in short tunes', () => {
    const used = new Set<number>();
    for (const plan of PLANS.filter((p) => p.mode === 'echo')) {
      for (let seed = 1; seed <= 300; seed++) {
        const tune = makeTune(new Rng(seed), plan.length);
        expect(tune).toHaveLength(plan.length);
        for (const i of tune) {
          expect(i).toBeGreaterThanOrEqual(0);
          expect(i).toBeLessThan(JELLIES);
          used.add(i);
        }
        expect(new Set(tune).size).toBeGreaterThan(1);
        if (plan.length <= 3) for (let k = 1; k < tune.length; k++) expect(tune[k]).not.toBe(tune[k - 1]);
      }
    }
    expect(used.size).toBe(JELLIES);
  });

  describe("the ghost finger's bot", () => {
    it('plays free play as a scale up and down: every note a real jelly next door, all five used, looping for as long as it takes', () => {
      expect(new Set(FREE_SONG).size).toBe(JELLIES);
      for (let n = 0; n < 100; n++) {
        const i = freeNote(n);
        expect(i).toBeGreaterThanOrEqual(0);
        expect(i).toBeLessThan(JELLIES);
        expect(Math.abs(i - freeNote(n + 1)), `note ${n}`).toBe(1);
      }
    });

    it('waits through the first pause and the tune, then copies it note for note, with no wrong tap', () => {
      for (const plan of PLANS.filter((p) => p.mode === 'echo')) {
        const tune = makeTune(new Rng(7), plan.length);
        for (const phase of ['play', 'listen', 'done'] as const) expect(jellyToTap('echo', phase, tune, 0, 0)).toBeNull();
        const copy: number[] = [];
        for (let at = 0; at < tune.length; at++) copy.push(jellyToTap('echo', 'turn', tune, at, 0)!);
        expect(copy).toEqual(tune);
        expect(jellyToTap('echo', 'turn', tune, tune.length, 0)).toBeNull();
      }
    });

    it('reaches the goal of every free level in exactly that many taps, then stops', () => {
      for (const plan of PLANS.filter((p) => p.mode === 'free')) {
        let notes = 0;
        while (jellyToTap('free', notes < plan.goal ? 'play' : 'done', [], 0, notes) !== null) notes++;
        expect(notes).toBe(plan.goal);
      }
    });
  });
});
