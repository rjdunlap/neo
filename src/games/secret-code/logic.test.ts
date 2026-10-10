import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { contradictsClues, detectiveDoor, candidates, ignoredClues, makeCode, nextMove, PLANS, ruledOut, score, suggestion, type Guess } from './logic';

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
    for (const plan of PLANS) {
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
    for (const plan of PLANS) {
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
    for (const plan of PLANS) {
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
    for (const plan of PLANS) {
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
        expect(history.at(-1)?.marks.every((m) => m === 'green'), `${plan.name} seed ${seed}`).toBe(true);
      }
    }
  });
});

describe('Detective doors', () => {
  it('shows two or three distinct non-answer guesses identifying exactly one code, reproducibly', () => {
    const plan = PLANS[6];
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
      for (const other of candidates(plan, [])) if (other.join() !== door.code.join()) {
        expect(contradictsClues(plan, door.history, other)).toBe(true);
      }
    }
  });
});
