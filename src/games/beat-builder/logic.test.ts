import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { beatMove, differences, firstMismatch, mendCopy, empty, freeBeat, givenStep, hits, INSTRUMENTS, LONG_PHRASES, SHORT_PHRASES, roundPhrases, makeBeat, PLANS, repairs, replayTick, same } from './logic';

describe('Beat Builder', () => {
  it('makes beats that start on the drum, give every row a hit, and are never all sounds at once', () => {
    for (const plan of PLANS) {
      for (let seed = 1; seed <= 300; seed++) {
        const b = makeBeat(plan, new Rng(seed));
        expect(b).toHaveLength(plan.rows);
        for (const row of b) expect(row).toHaveLength(plan.steps), expect(row.some(Boolean)).toBe(true);
        expect(b[0][0]).toBe(true);
        if (plan.rows === 3) for (let s = 0; s < plan.steps; s++) expect(b.every((row) => row[s])).toBe(false);
        if (plan.mode === 'repeat') for (const row of b) expect(row.slice(4)).toEqual(row.slice(0, 4));
      }
    }
  });

  it('has twelve distinct short and eight distinct long named original scores with playable rests', () => {
    expect(INSTRUMENTS.map((i) => i.id)).toEqual(['drum', 'clap', 'bell']);
    const all = [...SHORT_PHRASES, ...LONG_PHRASES];
    expect(new Set(all.map((p) => p.id)).size).toBe(20);
    expect(new Set(all.map((p) => p.name)).size).toBe(20);
    for (const [pool, rows, steps, count] of [[SHORT_PHRASES, 2, 4, 12], [LONG_PHRASES, 3, 8, 8]] as const) {
      expect(pool).toHaveLength(count);
      expect(new Set(pool.map((p) => JSON.stringify(p.score))).size).toBe(count);
      for (const p of pool) {
        expect(p.name).toMatch(/^[A-Za-z ]+$/);
        expect(p.score).toHaveLength(rows);
        expect(p.score[0][0]).toBe(true);
        for (const row of p.score) {
          expect(row).toHaveLength(steps);
          expect(row.every((on) => typeof on === 'boolean')).toBe(true);
          expect(row.some(Boolean)).toBe(true);
          expect(row.filter(Boolean).length).toBeLessThanOrEqual(3);
          expect(row.some((on) => !on)).toBe(true);
        }
        if (rows === 3) for (let step = 0; step < steps; step++) expect(p.score.every((row) => row[step])).toBe(false);
      }
    }
  });

  it('draws deterministic, distinct round targets, reaches every phrase and doubles only the repeat unit', () => {
    for (const plan of PLANS.filter((p) => p.mode !== 'free')) {
      const pool = plan.rows === 3 ? LONG_PHRASES : SHORT_PHRASES;
      const seen = new Set<string>();
      for (let seed = 1; seed <= 300; seed++) {
        const round = roundPhrases(plan, new Rng(seed));
        expect(round).toEqual(roundPhrases(plan, new Rng(seed)));
        expect(round).toHaveLength(plan.beats);
        expect(new Set(round.map((p) => JSON.stringify(p.beat))).size).toBe(plan.beats);
        for (const p of round) {
          seen.add(p.id);
          const source = pool.find((entry) => entry.id === p.id)!;
          expect(p.name).toBe(source.name);
          expect(p.beat).toEqual(source.score.map((row) => plan.mode === 'repeat' ? [...row, ...row] : [...row]));
        }
      }
      expect([...seen].sort()).toEqual(pool.map((p) => p.id).sort());
    }
  });

  it('owns each editable score and leaves free-play randomness alone', () => {
    const rng = new Rng(77);
    const untouched = rng.clone();
    expect(roundPhrases(PLANS[0], rng)).toEqual([]);
    expect(rng.next()).toBe(untouched.next());
    const plan = PLANS[1];
    const original = roundPhrases(plan, new Rng(77));
    const changed = roundPhrases(plan, new Rng(77));
    changed[0].beat[0][0] = false;
    expect(original[0].beat[0][0]).toBe(true);
    expect(roundPhrases(plan, new Rng(77))).toEqual(original);
  });

  it('can repair missing and excess sounds in every authored target with the existing bot and hint', () => {
    for (const plan of PLANS.filter((p) => p.mode !== 'free')) {
      const pool = plan.rows === 3 ? LONG_PHRASES : SHORT_PHRASES;
      for (const p of pool) {
        const target = p.score.map((row) => plan.mode === 'repeat' ? [...row, ...row] : [...row]);
        const have = target.map((row) => row.map((on, step) => givenStep(plan, step) ? on : !on));
        expect(repairs(plan, target, have).some((c) => c.add)).toBe(true);
        expect(repairs(plan, target, have).some((c) => !c.add)).toBe(true);
        for (let remaining = repairs(plan, target, have).length; remaining > 0; remaining--) {
          const move = beatMove(plan, target, have, true);
          expect(move && move !== 'check').toBe(true);
          if (!move || move === 'check') break;
          expect(givenStep(plan, move.step)).toBe(false);
          have[move.row][move.step] = !have[move.row][move.step];
          expect(repairs(plan, target, have)).toHaveLength(remaining - 1);
        }
        expect(same(target, have)).toBe(true);
        expect(beatMove(plan, target, have, true)).toBe(plan.mode === 'hear' || plan.mode === 'mend' ? 'check' : null);
      }
    }
  });

  it('compares beats and finds the steps that differ', () => {
    const a = empty(2, 4);
    const b = empty(2, 4);
    a[0][0] = true;
    expect(same(a, b)).toBe(false);
    expect(differences(a, b)).toEqual([0]);
    b[0][0] = true;
    expect(same(a, b)).toBe(true);
  });

  it('traverses two full target loops including first and last hits, then returns to live playback', () => {
    for (const steps of [4, 8]) {
      let remaining = steps * 2 + 1;
      const trace = [];
      while (remaining) {
        const tick = replayTick(steps, remaining);
        trace.push([tick.step, tick.target]);
        remaining = tick.remaining;
      }
      expect(trace).toEqual([...Array.from({ length: steps * 2 }, (_, i) => [i % steps, true]), [0, false]]);
    }
  });

  it('names add/remove repairs, drops fixed cells after edits and never repairs the given half', () => {
    for (const plan of PLANS.filter((p) => p.mode !== 'free' && p.mode !== 'mend')) {
      const goal = makeBeat(plan, new Rng(42));
      const have = goal.map((row) => row.map((on) => !on));
      goal.forEach((row, r) => row.forEach((on, step) => { if (givenStep(plan, step)) have[r][step] = on; }));
      const help = repairs(plan, goal, have);
      expect(help.some((c) => c.add)).toBe(true);
      expect(help.some((c) => !c.add)).toBe(true);
      while (!same(goal, have)) {
        const move = beatMove(plan, goal, have, true);
        expect(move && move !== 'check').toBe(true);
        if (!move || move === 'check') break;
        expect(givenStep(plan, move.step)).toBe(false);
        const before = repairs(plan, goal, have).length;
        have[move.row][move.step] = !have[move.row][move.step];
        expect(repairs(plan, goal, have)).toHaveLength(before - 1);
      }
      expect(same(goal, have)).toBe(true);
    }
  });

  describe("the ghost finger's bot", () => {
    it('builds the beat to copy with only right squares, leaving the given half alone, and checks only where a check is asked for', () => {
      for (const plan of PLANS.filter((p) => p.mode !== 'free' && p.mode !== 'mend')) {
        for (let seed = 1; seed <= 100; seed++) {
          const target = makeBeat(plan, new Rng(seed));
          const beat = empty(plan.rows, plan.steps);
          target.forEach((row, r) => row.forEach((on, s) => (beat[r][s] = givenStep(plan, s) && on)));
          let taps = 0;
          let move = beatMove(plan, target, beat, true);
          while (move && move !== 'check') {
            expect(target[move.row][move.step], `${plan.name}: a right square`).toBe(true);
            expect(beat[move.row][move.step]).toBe(false);
            expect(givenStep(plan, move.step)).toBe(false);
            beat[move.row][move.step] = true;
            taps++;
            move = beatMove(plan, target, beat, true);
          }
          expect(same(target, beat), plan.name).toBe(true);
          expect(taps).toBeGreaterThan(0);
          // Levels that see their beat finish when it matches; the ear levels press the check.
          expect(move).toBe(plan.mode === 'hear' || plan.mode === 'mend' ? 'check' : null);
          if (plan.mode === 'hear') expect(beatMove(plan, target, beat, false)).toBeNull();
        }
      }
    });

    it('makes a free-play beat with enough sounds for the check to appear, then waits for it and presses it', () => {
      const plan = PLANS.find((p) => p.mode === 'free')!;
      const goal = freeBeat(plan);
      expect(hits(goal)).toBeGreaterThanOrEqual(3);
      expect(goal[0].some(Boolean) && goal[1].some(Boolean)).toBe(true);
      const beat = empty(plan.rows, plan.steps);
      for (let move = beatMove(plan, goal, beat, false); move && move !== 'check'; move = beatMove(plan, goal, beat, false)) beat[move.row][move.step] = true;
      expect(same(goal, beat)).toBe(true);
      expect(beatMove(plan, goal, beat, false)).toBeNull();
      expect(beatMove(plan, goal, beat, true)).toBe('check');
    });
  });

  it('mends: the copy differs from the model in exactly one square, both repairs come up, and the bot repairs it', () => {
    const plan = PLANS[5];
    for (let seed = 1; seed <= 200; seed++) {
      const rng = new Rng(seed);
      for (const [i, phrase] of SHORT_PHRASES.entries()) {
        const model = phrase.score.map((row) => [...row]);
        const copy = mendCopy(model, i, rng);
        const diff = differences(model, copy);
        expect(diff).toHaveLength(1);
        expect(repairs(plan, model, copy)).toHaveLength(1);
        expect(repairs(plan, model, copy)[0].add).toBe(i % 3 === 0 ? true : i % 3 === 1 ? false : repairs(plan, model, copy)[0].add);
        expect(hits(copy)).toBeGreaterThan(0);
        expect(firstMismatch(model, copy)).not.toBeNull();
        const have = copy.map((row) => [...row]);
        for (let move = beatMove(plan, model, have, false); move && move !== 'check'; move = beatMove(plan, model, have, false)) have[move.row][move.step] = !have[move.row][move.step];
        expect(same(model, have)).toBe(true);
        expect(beatMove(plan, model, have, true)).toBe('check');
        expect(same(model, copy)).toBe(false);
      }
    }
  });
});
