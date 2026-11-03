import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { contradictsClues, detectiveDoor, candidates, DOORS, doorKinds, ignoredClues, makeCode, nextMove, PLANS, rowsThatFit, ruledOut, score, suggestion, visibleRows, type Guess } from './logic';

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

  it('never charges a miss for a mark that has scrolled out of sight, but still does for one on screen', () => {
    const plan = PLANS[4]; // level 5: four slots, five colors
    // The 1024 by 768 landscape view puts the door at 460: four past tries fit; the detective door's three clues always fit.
    expect(rowsThatFit(460)).toBe(4);
    expect(rowsThatFit(430)).toBeGreaterThanOrEqual(3);
    const code = [0, 1, 2, 3];
    // Only the first try puts stone 1 in slot 0; the four after it never do.
    const history: Guess[] = [[1, 0, 3, 2], [2, 3, 0, 1], [3, 2, 1, 0], [2, 0, 3, 1], [3, 0, 1, 2]].map((stones) => ({ stones, marks: score(code, stones, plan.yellow) }));
    const shown = visibleRows(history, rowsThatFit(460));
    expect(shown).toEqual(history.slice(1));
    expect(ignoredClues(plan, history, [1, 4, 4, 4])).toEqual([0]);
    expect(ignoredClues(plan, shown, [1, 4, 4, 4])).toEqual([]);
    // Stone 3 in slot 0 was ruled out by the newest try, still on screen.
    expect(ignoredClues(plan, shown, [3, 4, 4, 4])).toEqual([0]);
    expect(visibleRows(history.slice(0, 2), 4)).toEqual(history.slice(0, 2));
  });

  it('keeps the faint-stone idea up to date: after every try it fits every mark, and following it ignores no clue on screen', () => {
    for (const plan of PLANS.filter((p) => !p.detective)) {
      for (let seed = 1; seed <= 60; seed++) {
        const rng = new Rng(seed);
        const code = makeCode(plan, rng);
        const history: Guess[] = [];
        for (let turn = 0; turn < plan.slots + 4; turn++) {
          const guess = Array.from({ length: plan.slots }, () => rng.int(0, plan.colors - 1));
          history.push({ stones: guess, marks: score(code, guess, plan.yellow) });
          const idea = suggestion(plan, history, code);
          for (const h of history) expect(score(idea, h.stones, plan.yellow)).toEqual(h.marks);
          for (const fit of [3, 4, 6]) expect(ignoredClues(plan, visibleRows(history, fit), idea)).toEqual([]);
        }
      }
    }
  });

  it('picks a seeded door, garden gate or treasure chest, different for each door, without changing any code', () => {
    const seen = new Set<string>();
    for (const plan of PLANS) {
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
});
