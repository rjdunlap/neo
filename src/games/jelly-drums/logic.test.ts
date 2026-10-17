import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { SCRIPT } from '../../content/voice-script';
import { awakeJellies, nearestAwake, WAKE_AT, WAKE_ORDER, FREE_SONG, freeNote, IdleNudge, JELLIES, jellyToTap, drawTune, NUDGE_AFTER, PLANS, SONGS, tunesOf, type Tune } from './logic';

const echoPlans = () => PLANS.filter((p) => p.mode === 'echo');
const round = (seed: number, length: number, goal: number) => {
  const rng = new Rng(seed);
  const played: Tune[] = [];
  for (let n = 0; n < goal; n++) played.push(drawTune(rng, length, played));
  return played;
};

describe('Jelly Drums', () => {
  it('never repeats a tune or a kind back to back within a round, at any echo level', () => {
    for (const plan of echoPlans()) {
      expect(tunesOf(plan.length).length, `level pool ${plan.length}`).toBeGreaterThanOrEqual(plan.goal);
      for (let seed = 1; seed <= 300; seed++) {
        const played = round(seed, plan.length, plan.goal);
        expect(new Set(played.map((t) => t.notes.join())).size).toBe(plan.goal);
        for (let k = 1; k < played.length; k++) expect(played[k].kind).not.toBe(played[k - 1].kind);
      }
    }
  });

  it('draws shapes only at level 4, Hot Cross Buns at 5–6, and the five-note songs at 9; every song is named aloud', () => {
    const kinds = (level: number) => new Set(tunesOf(PLANS[level - 1].length).map((t) => t.kind));
    expect([...kinds(4)].sort()).toEqual(['down', 'hop', 'up']);
    for (const level of [5, 6]) expect(kinds(level)).toContain('hot-cross-buns');
    expect([...kinds(7)].sort()).toEqual(['down', 'hop', 'up', 'wiggle']);
    for (const id of ['mary', 'jingle-bells'] as const) expect(kinds(9)).toContain(id);
    for (const song of SONGS) {
      expect(SCRIPT[song.title], song.id).toBeTruthy();
      expect(song.notes.length).toBeLessThanOrEqual(5);
    }
    const seen = new Set<string>();
    for (let seed = 1; seed <= 100; seed++) for (const t of round(seed, 5, 5)) seen.add(t.kind);
    expect(seen).toContain('mary');
  });

  it('keeps each shape true to its name', () => {
    for (const length of [2, 3, 4, 5]) {
      for (const t of tunesOf(length)) {
        const steps = t.notes.slice(1).map((n, k) => n - t.notes[k]);
        if (t.kind === 'up') expect(steps.every((d) => d === 1)).toBe(true);
        if (t.kind === 'down') expect(steps.every((d) => d === -1)).toBe(true);
        if (t.kind === 'hop') expect(steps.every((d, k) => Math.abs(d) >= 2 && (k === 0 || d === -steps[k - 1]))).toBe(true);
        if (t.kind === 'wiggle') expect(steps.every((d, k) => Math.abs(d) === 1 && (k === 0 || d === -steps[k - 1]))).toBe(true);
      }
    }
  });

  it('nudges only after quiet time in free play, never while she taps', () => {
    const nudge = new IdleNudge();
    for (let f = 0; f < 60 * 30; f++) {
      if (f % 60 === 0) nudge.touched(); // a tap every second
      expect(nudge.tick(1 / 60)).toBe(false);
    }
    const quiet = new IdleNudge();
    let fired = 0;
    for (let f = 0; f < 60 * (NUDGE_AFTER * 2 + 1); f++) if (quiet.tick(1 / 60)) fired++;
    expect(fired).toBe(2);
  });

  it('grows from free play to longer tunes', () => {
    const echo = PLANS.filter((p) => p.mode === 'echo');
    expect(PLANS.slice(0, 3).every((p) => p.mode === 'free')).toBe(true);
    for (let i = 1; i < echo.length; i++) expect(echo[i].length).toBeGreaterThanOrEqual(echo[i - 1].length);
    expect(echo[0].length).toBe(2);
    expect(echo.at(-1)!.length).toBe(5);
  });

  it('makes tunes on real jellies, never one note over and over, with no repeats in short tunes', () => {
    const used = new Set<number>();
    for (const plan of echoPlans()) {
      for (const { notes: tune } of tunesOf(plan.length)) {
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

  describe('one big jelly (level 10)', () => {
    const wake = PLANS[9];

    it('starts with one jelly, the big low one, and wakes all five one at a time, the little high one next', () => {
      expect(wake.mode).toBe('wake');
      expect(awakeJellies(0)).toEqual([0]);
      expect(awakeJellies(WAKE_AT[1] - 1)).toEqual([0]);
      expect(awakeJellies(WAKE_AT[1])).toEqual([0, 4]);
      expect(awakeJellies(wake.goal).sort()).toEqual([0, 1, 2, 3, 4]);
      for (let n = 1; n <= wake.goal; n++) expect(awakeJellies(n).length - awakeJellies(n - 1).length).toBeLessThanOrEqual(1);
      expect(WAKE_AT.every((at, k) => k === 0 || at > WAKE_AT[k - 1])).toBe(true);
      expect(WAKE_AT.at(-1)!).toBeLessThan(wake.goal);
      expect([...WAKE_ORDER].sort()).toEqual([0, 1, 2, 3, 4]);
    });

    it('sings the nearest awake jelly for a touch anywhere', () => {
      const xs = [-356, -178, 0, 178, 356];
      expect(nearestAwake(xs, [0], 300)).toBe(0);
      expect(nearestAwake(xs, [0, 4], 100)).toBe(4);
      expect(nearestAwake(xs, [0, 4], -10)).toBe(0);
      expect(nearestAwake(xs, [0, 1, 2, 3, 4], 170)).toBe(3);
    });

    it("has a bot that taps only awake jellies and ends at the goal", () => {
      for (let n = 0; n < wake.goal; n++) expect(awakeJellies(n)).toContain(jellyToTap('wake', 'play', [], 0, n)!);
      expect(jellyToTap('wake', 'done', [], 0, wake.goal)).toBeNull();
    });
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
        const tune = drawTune(new Rng(7), plan.length).notes;
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
