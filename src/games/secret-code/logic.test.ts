import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { landing, stepLevel } from '../../progress/difficulty';
import { secretCode } from './index';
import {
  contradictsClues,
  crossedOut,
  detectiveDoor,
  candidates,
  DOORS,
  doorKinds,
  ignoredClues,
  demoCode,
  madeCode,
  makeCode,
  nextMark,
  nextMove,
  petTries,
  petTry,
  PLANS,
  planFor,
  rowsThatFit,
  ruledOut,
  quickCode,
  score,
  solverTries,
  suggestion,
  swapResult,
  visibleRows,
  wrongMarks,
  type Guess,
  type Mark,
} from './logic';

describe('Secret Code', () => {
  it('marks right places green, misplaced stones yellow (never more than are missing), and the rest gray', () => {
    expect(score([0, 1, 2], [0, 1, 2], true)).toEqual(['green', 'green', 'green']);
    expect(score([0, 1, 2], [2, 0, 1], true)).toEqual(['yellow', 'yellow', 'yellow']);
    expect(score([0, 1, 2], [0, 3, 1], true)).toEqual(['green', 'gray', 'yellow']);
    // The code's only red is already green, so the second red is gray, not yellow.
    expect(score([1, 0, 2], [0, 0, 3], true)).toEqual(['gray', 'green', 'gray']);
    expect(score([0, 0, 1], [1, 0, 0], true)).toEqual(['yellow', 'green', 'yellow']);
    expect(score([0, 0, 1], [0, 1, 1], true)).toEqual(['green', 'gray', 'green']);
    // Early levels: just yes or no for each slot.
    expect(score([0, 1, 2], [2, 0, 1], false)).toEqual(['gray', 'gray', 'gray']);
  });

  it('makes codes that fit the level: distinct colors, or a real repeat when repeats are the point', () => {
    for (const plan of Object.values(PLANS)) {
      for (let seed = 1; seed <= 200; seed++) {
        const code = makeCode(plan, new Rng(seed));
        expect(code).toHaveLength(plan.slots);
        for (const c of code) expect(c).toBeLessThan(plan.colors);
        if (plan.repeats) expect(new Set(code).size).toBeLessThan(plan.slots);
        else expect(new Set(code).size).toBe(plan.slots);
      }
    }
  });

  it('only counts a miss for ignoring a clue, and the real code never ignores one', () => {
    for (const plan of Object.values(PLANS)) {
      for (let seed = 1; seed <= 100; seed++) {
        const rng = new Rng(seed);
        const code = makeCode(plan, rng);
        const history: Guess[] = [];
        for (let turn = 0; turn < 4; turn++) {
          const guess = Array.from({ length: plan.slots }, () => rng.int(0, plan.colors - 1));
          history.push({ stones: guess, marks: score(code, guess, plan.yellow) });
          expect(ignoredClues(plan, history, code)).toEqual([]);
          for (let s = 0; s < plan.slots; s++) expect(ruledOut(plan, history, s).has(code[s])).toBe(false);
        }
      }
    }
  });

  it('suggested guesses agree with every clue, and following them opens the door', () => {
    for (const plan of Object.values(PLANS)) {
      for (let seed = 1; seed <= 60; seed++) {
        const code = makeCode(plan, new Rng(seed));
        const history: Guess[] = [];
        let guesses = 0;
        for (; guesses < 12; guesses++) {
          const g = suggestion(plan, history, code);
          expect(candidates(plan, history).map((c) => c.join())).toContain(g.join());
          const marks = score(code, g, plan.yellow);
          history.push({ stones: g, marks });
          if (marks.every((m) => m === 'green')) break;
        }
        expect(guesses).toBeLessThan(12);
      }
    }
  });

  it('has a player who reasons from the clues crack every code without once ignoring a clue', () => {
    for (const plan of Object.values(PLANS)) {
      for (let seed = 1; seed <= 60; seed++) {
        const code = makeCode(plan, new Rng(seed));
        const history: Guess[] = [];
        let guess: (number | null)[] = Array(plan.slots).fill(null);
        let turns = 0;
        for (let step = 0; step < 200 && turns < 12; step++) {
          const move = nextMove(plan, history, code, guess);
          if ('stone' in move) {
            guess[guess.indexOf(null)] = move.stone;
            continue;
          }
          const stones = guess as number[];
          expect(ignoredClues(plan, history, stones), `${plan.name} seed ${seed}`).toEqual([]);
          const marks = score(code, stones, plan.yellow);
          history.push({ stones: [...stones], marks });
          turns++;
          if (marks.every((m) => m === 'green')) break;
          guess = Array(plan.slots).fill(null);
        }
        expect(
          history.at(-1)?.marks.every((m) => m === 'green'),
          `${plan.name} seed ${seed}`,
        ).toBe(true);
      }
    }
  });

  it('level 8: four slots and five colors, every code holds a repeat, and reasoning cracks each within six tries', () => {
    const plan = planFor(8);
    expect(plan).toMatchObject({ slots: 4, colors: 5, yellow: true, repeats: true });
    for (let seed = 1; seed <= 300; seed++) {
      const code = makeCode(plan, new Rng(seed));
      expect(new Set(code).size).toBeLessThan(4);
      const history: Guess[] = [];
      let guess: (number | null)[] = Array(4).fill(null);
      while (history.length < 6) {
        const move = nextMove(plan, history, code, guess);
        if ('stone' in move) {
          guess[guess.indexOf(null)] = move.stone;
          continue;
        }
        const stones = guess as number[];
        expect(ignoredClues(plan, visibleRows(history, 3), stones)).toEqual([]);
        history.push({ stones: [...stones], marks: score(code, stones, plan.yellow) });
        if (history.at(-1)!.marks.every((m) => m === 'green')) break;
        guess = Array(4).fill(null);
      }
      expect(history.at(-1)!.stones, `seed ${seed}`).toEqual(code);
    }
  });
});

describe('Detective doors', () => {
  it('shows two or three distinct non-answer guesses identifying exactly one code, reproducibly', () => {
    const plan = planFor(7);
    for (let seed = 1; seed <= 500; seed++) {
      const door = detectiveDoor(plan, new Rng(seed));
      expect(door).toEqual(detectiveDoor(plan, new Rng(seed)));
      expect(door.history.length).toBeGreaterThanOrEqual(2);
      expect(door.history.length).toBeLessThanOrEqual(3);
      expect(new Set(door.history.map((h) => h.stones.join())).size).toBe(door.history.length);
      for (const h of door.history) {
        expect(h.marks).toEqual(score(door.code, h.stones, plan.yellow));
        expect(h.stones).not.toEqual(door.code);
      }
      expect(candidates(plan, door.history)).toEqual([door.code]);
      expect(suggestion(plan, door.history, door.code)).toEqual(door.code);
      expect(contradictsClues(plan, door.history, door.code)).toBe(false);
      for (const other of candidates(plan, []))
        if (other.join() !== door.code.join()) {
          expect(contradictsClues(plan, door.history, other)).toBe(true);
        }
    }
  });

  it('level 11: four slots, five colors, three distinct shown guesses that leave exactly one code, generated quickly', () => {
    const plan = planFor(11);
    expect(plan).toMatchObject({
      slots: 4,
      colors: 5,
      repeats: false,
      detective: true,
      clues: { min: 3, max: 3 },
    });
    let slowest = 0;
    for (let seed = 1; seed <= 300; seed++) {
      const t0 = performance.now();
      const door = detectiveDoor(plan, new Rng(seed));
      slowest = Math.max(slowest, performance.now() - t0);
      expect(door).toEqual(detectiveDoor(plan, new Rng(seed)));
      expect(new Set(door.code).size).toBe(4);
      expect(door.history).toHaveLength(3);
      expect(new Set(door.history.map((h) => h.stones.join())).size).toBe(door.history.length);
      for (const h of door.history) {
        expect(h.marks).toEqual(score(door.code, h.stones, plan.yellow));
        expect(h.stones).not.toEqual(door.code);
      }
      expect(candidates(plan, door.history)).toEqual([door.code]);
      expect(contradictsClues(plan, door.history, door.code)).toBe(false);
      // A try that differs from the answer always contradicts some shown mark.
      expect(contradictsClues(plan, door.history, [...door.code].reverse())).toBe(true);
      // The reasoning bot (and the ghost finger) opens it on the first try.
      expect(nextMove(plan, door.history, door.code, [null, null, null, null])).toEqual({
        stone: door.code[0],
      });
    }
    // Generation happens between doors; it must never stall the round.
    expect(slowest).toBeLessThan(250);
  });

  it('shows every detective clue at full view on the smallest screen', () => {
    // Even at the door's highest place (430), every shown clue fits, so none is hidden or left out of the miss rule.
    for (const plan of Object.values(PLANS).filter((p) => p.detective))
      expect(rowsThatFit(430)).toBeGreaterThanOrEqual(plan.clues!.max);
  });

  it('never charges a miss for a mark that has scrolled out of sight, but still does for one on screen', () => {
    const plan = planFor(5); // level 5: four slots, five colors
    // The 1024 by 768 landscape view puts the door at 460: four past tries fit; the detective door's three clues always fit.
    expect(rowsThatFit(460)).toBe(4);
    expect(rowsThatFit(430)).toBeGreaterThanOrEqual(3);
    const code = [0, 1, 2, 3];
    // Only the first try puts stone 1 in slot 0; the four after it never do.
    const history: Guess[] = [
      [1, 0, 3, 2],
      [2, 3, 0, 1],
      [3, 2, 1, 0],
      [2, 0, 3, 1],
      [3, 0, 1, 2],
    ].map((stones) => ({ stones, marks: score(code, stones, plan.yellow) }));
    const shown = visibleRows(history, rowsThatFit(460));
    expect(shown).toEqual(history.slice(1));
    expect(ignoredClues(plan, history, [1, 4, 4, 4])).toEqual([0]);
    expect(ignoredClues(plan, shown, [1, 4, 4, 4])).toEqual([]);
    // Stone 3 in slot 0 was ruled out by the newest try, still on screen.
    expect(ignoredClues(plan, shown, [3, 4, 4, 4])).toEqual([0]);
    expect(visibleRows(history.slice(0, 2), 4)).toEqual(history.slice(0, 2));
  });

  it('keeps the faint-stone idea up to date: after every try it fits every mark, and following it ignores no clue on screen', () => {
    for (const plan of Object.values(PLANS).filter((p) => !p.detective)) {
      for (let seed = 1; seed <= 60; seed++) {
        const rng = new Rng(seed);
        const code = makeCode(plan, rng);
        const history: Guess[] = [];
        for (let turn = 0; turn < plan.slots + 4; turn++) {
          const guess = Array.from({ length: plan.slots }, () => rng.int(0, plan.colors - 1));
          history.push({ stones: guess, marks: score(code, guess, plan.yellow) });
          const idea = suggestion(plan, history, code);
          for (const h of history) expect(score(idea, h.stones, plan.yellow)).toEqual(h.marks);
          for (const fit of [3, 4, 6])
            expect(ignoredClues(plan, visibleRows(history, fit), idea)).toEqual([]);
        }
      }
    }
  });

  it('picks a seeded door, garden gate or treasure chest, different for each door, without changing any code', () => {
    const seen = new Set<string>();
    for (const plan of Object.values(PLANS)) {
      for (let seed = 1; seed <= 60; seed++) {
        const kinds = doorKinds(new Rng(seed), plan.codes);
        expect(kinds).toHaveLength(plan.codes);
        expect(doorKinds(new Rng(seed), plan.codes)).toEqual(kinds);
        expect(new Set(kinds).size).toBe(plan.codes);
        for (const k of kinds) expect(DOORS).toContain(k);
        seen.add(kinds[0]);
        const plain = new Rng(seed);
        const withDoors = new Rng(seed);
        doorKinds(withDoors, plan.codes);
        expect(makeCode(plan, withDoors)).toEqual(makeCode(plan, plain));
      }
    }
    expect(seen.size).toBe(DOORS.length);
  });

  it('level 9: the right marks are score(), any wrong or missing mark is caught, and the disc cycles gray, yellow, green', () => {
    expect(nextMark(null)).toBe('gray');
    expect(nextMark('gray')).toBe('yellow');
    expect(nextMark('yellow')).toBe('green');
    expect(nextMark('green')).toBe('gray');
    const plan = planFor(9);
    expect(plan.maker).toBe(true);
    for (let seed = 1; seed <= 100; seed++) {
      const rng = new Rng(seed);
      const code = madeCode(plan, rng);
      const stones = madeCode(plan, rng);
      const right = score(code, stones, true);
      expect(wrongMarks(code, stones, right)).toEqual([]);
      expect(wrongMarks(code, stones, [null, ...right.slice(1)])).toEqual([0]);
      const flipped: Mark[] = right.map((m, i) => (i === 2 ? nextMark(m) : m));
      expect(wrongMarks(code, stones, flipped)).toEqual([2]);
    }
    // Repeats are fine in her code; the second red earns gray when the code has only one.
    expect(wrongMarks([0, 1, 1], [0, 0, 1], ['green', 'gray', 'green'])).toEqual([]);
  });

  it('level 9: with right marks the pet cracks every code she could make within six tries, each try fitting every mark so far', () => {
    const plan = planFor(9);
    const codes = candidates(plan, []);
    expect(codes).toHaveLength(4 ** 3);
    let worst = 0;
    for (const code of codes) {
      for (let seed = 1; seed <= 40; seed++) {
        const rng = new Rng(seed * 7919 + code.join('').length);
        const history: Guess[] = [];
        for (;;) {
          const stones = petTry(plan, history, rng);
          expect(candidates(plan, history).map((c) => c.join())).toContain(stones.join());
          const marks = score(code, stones, true);
          history.push({ stones, marks });
          if (marks.every((m) => m === 'green')) break;
          expect(history.length).toBeLessThan(10);
        }
        worst = Math.max(worst, history.length);
      }
    }
    expect(worst).toBeLessThanOrEqual(6);
    // The ghost finger's code is one the pet cracks in at most three tries, without moving the round's generator.
    for (let seed = 1; seed <= 100; seed++) {
      const rng = new Rng(seed);
      const code = demoCode(plan, rng);
      expect(petTries(plan, code, rng.clone())).toBeLessThanOrEqual(3);
      expect(rng.int(0, 1000)).toBe(new Rng(seed).int(0, 1000));
    }
    // Seeded: the same marks and seed give the same try.
    expect(petTry(plan, [], new Rng(5))).toEqual(petTry(plan, [], new Rng(5)));
  });

  it("places level 9 after 4 and 12 after 9 in school's order and keeps pre-K at 1 to 3", () => {
    expect(secretCode.levels('school')).toEqual({ min: 2, max: 12, order: [2, 3, 4, 9, 12, 5, 6, 7, 8, 11] });
    expect(secretCode.levels('prek')).toEqual({ min: 1, max: 3 });
    expect(stepLevel(4, 1, secretCode.levels('school'))).toBe(9);
    expect(stepLevel(9, 1, secretCode.levels('school'))).toBe(12);
    expect(stepLevel(12, 1, secretCode.levels('school'))).toBe(5);
    expect(stepLevel(5, -1, secretCode.levels('school'))).toBe(12);
    expect(secretCode.describeLevel(9)).toMatch(/Be the door/);
  });

  it('level 10 opens preschool: one slot, three stones, and every door opens within three tries', () => {
    const plan = planFor(10);
    expect(plan).toMatchObject({ slots: 1, colors: 3, yellow: false, codes: 3, oneSlot: true });
    for (let seed = 1; seed <= 200; seed++) {
      const code = makeCode(plan, new Rng(seed));
      // The reasoning bot, and any child who never retries a crossed-out stone, opens it within three tries.
      const history: Guess[] = [];
      for (;;) {
        const move = nextMove(plan, history, code, [null]);
        expect('stone' in move).toBe(true);
        const stone = (move as { stone: number }).stone;
        expect(crossedOut(plan, history).has(stone)).toBe(false);
        const marks = score(code, [stone], false);
        history.push({ stones: [stone], marks });
        if (marks[0] === 'green') break;
      }
      expect(history.length).toBeLessThanOrEqual(3);
    }
  });

  it('level 10: a gray crosses out exactly that stone, and only on One slot', () => {
    const plan = planFor(10);
    for (const code of [[0], [1], [2]]) {
      const history: Guess[] = [];
      for (const stone of [0, 1, 2]) {
        if (stone === code[0]) continue;
        history.push({ stones: [stone], marks: score(code, [stone], false) });
        const out = crossedOut(plan, history);
        expect([...out].sort()).toEqual(history.map((h) => h.stones[0]).sort());
        expect(out.has(code[0])).toBe(false);
      }
      // The hidden stone is never crossed out, so the glowing hint always leads to the door.
      expect(candidates(plan, history)).toEqual([code]);
    }
    expect(crossedOut(planFor(1), [{ stones: [0, 1], marks: ['gray', 'gray'] }]).size).toBe(0);
  });

  it('preschool plays 10 then 1; pre-K and school leave 10 out and a carried 10 lands on their first level', () => {
    const pre = secretCode.levels('preschool');
    expect(pre).toEqual({ min: 1, max: 10, order: [10, 1] });
    expect(secretCode.bands).toContain('preschool');
    expect(secretCode.entryLevels).toEqual([10]);
    expect(stepLevel(10, 1, pre)).toBe(1);
    expect(stepLevel(1, -1, pre)).toBe(10);
    expect(landing(10, secretCode.levels('prek'), secretCode.entryLevels)).toBe(1);
    expect(landing(10, secretCode.levels('school'), secretCode.entryLevels)).toBe(2);
    expect(secretCode.describeLevel(10)).toMatch(/One slot/);
  });

  describe('level 12, Swap seats', () => {
    const plan = planFor(12);
    const all: number[][] = [];
    for (let a = 0; a < 4; a++) for (let b = 0; b < 4; b++) for (let c = 0; c < 4; c++) all.push([a, b, c]);

    it('is never smooth when two seats are played, and leaves the pet game alone', () => {
      for (let m = 0; m <= 6; m++) {
        for (let h = 0; h <= 3; h++) {
          const r = swapResult(true, m, h);
          expect(r.misses).toBe(m);
          expect(r.hints).toBeGreaterThanOrEqual(1);
          expect(r.hints).toBeGreaterThanOrEqual(h);
          expect(r.misses <= 1 && r.hints === 0).toBe(false);
          expect(swapResult(false, m, h)).toEqual({ misses: m, hints: h });
        }
      }
    });

    it('has the plan and all 64 codes', () => {
      expect(plan).toMatchObject({
        slots: 3,
        colors: 4,
        yellow: true,
        repeats: true,
        maker: true,
        swap: true,
        codes: 1,
      });
      expect(candidates(plan, [])).toHaveLength(64);
      for (let seed = 1; seed <= 200; seed++) {
        const code = madeCode(plan, new Rng(seed));
        expect(code).toHaveLength(3);
        for (const c of code) {
          expect(c).toBeGreaterThanOrEqual(0);
          expect(c).toBeLessThanOrEqual(3);
        }
      }
    });

    it('is cracked by the reasoning player within a small bound, every try fitting the marks so far', () => {
      let worst = 0;
      for (const code of all) {
        const tries = solverTries(plan, code);
        worst = Math.max(worst, tries);
        const history: Guess[] = [];
        for (let t = 0; t < tries; t++) {
          const guess: (number | null)[] = [null, null, null];
          for (
            let m = nextMove(plan, history, code, guess);
            'stone' in m;
            m = nextMove(plan, history, code, guess)
          )
            guess[guess.indexOf(null)] = m.stone;
          const stones = guess as number[];
          if (t > 0) expect(contradictsClues(plan, history, stones)).toBe(false);
          history.push({ stones, marks: score(code, stones, true) });
        }
        expect(history[history.length - 1].marks.every((m) => m === 'green')).toBe(true);
      }
      expect(worst).toBeLessThanOrEqual(6);
    });

    it('accepts her right marks for every code and stones, and catches a changed mark', () => {
      for (const code of all) {
        for (const stones of all) {
          const right = score(code, stones, true);
          expect(wrongMarks(code, stones, right)).toEqual([]);
          const changed = right.map((m, i) => (i === 0 ? nextMark(m) : m));
          expect(wrongMarks(code, stones, changed)).toEqual([0]);
        }
      }
    });

    it("quickCode picks a quick, seeded code without moving the round's generator", () => {
      let differ = 0;
      for (let seed = 1; seed <= 100; seed++) {
        const rng = new Rng(seed);
        const twin = rng.clone();
        const code = quickCode(plan, rng, 1);
        expect(rng.int(0, 1000000)).toBe(twin.int(0, 1000000));
        expect(quickCode(plan, new Rng(seed), 1)).toEqual(code);
        expect(code).toHaveLength(3);
        for (const c of code) {
          expect(c).toBeGreaterThanOrEqual(0);
          expect(c).toBeLessThanOrEqual(3);
        }
        const other = quickCode(plan, new Rng(seed), 2);
        if (other.join() !== code.join()) differ++;
        const draw = new Rng(new Rng(seed).int(1, 2 ** 31 - 1) ^ 1);
        expect(solverTries(plan, code)).toBeLessThanOrEqual(solverTries(plan, madeCode(plan, draw)));
      }
      expect(differ).toBeGreaterThan(50);
    });

    it('never lands out-of-range levels in the two-seat mode', () => {
      expect(planFor(13)).toBe(PLANS[11]);
      expect(planFor(13).swap).toBeFalsy();
      expect(planFor(12).swap).toBe(true);
    });
  });
});
