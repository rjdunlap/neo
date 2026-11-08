import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { rangeFor, stepLevel } from '../../progress/difficulty';
import { SCRIPT } from '../../content/voice-script';
import {
  anySolution,
  flowersOnTwoArms,
  replaceThing,
  tiltable,
  traceAll,
  whyNot,
  DX,
  DY,
  beamEnd,
  hintThing,
  LEVELS,
  materialPuzzle,
  materialsRound,
  MATERIALS,
  meetsGoal,
  outcome,
  owlCell,
  POOLS,
  shadowCells,
  whyNotMaterial,
  type MaterialBoard,
  type Stuff,
  boardWith,
  cloudCells,
  DROP_TILT,
  fewestPlaced,
  findLines,
  fits,
  mirrorAt,
  flowerCount,
  freeCells,
  nearestPlacement,
  placeHint,
  hintMirror,
  makePuzzle,
  minTurns,
  mirrorPuzzle,
  nearestSolutions,
  planFor,
  PLANS,
  predictionChoices,
  reflect,
  solved,
  tiltFor,
  trace,
  type Dir,
  type LightPuzzle,
  type Placed,
  type Tilt,
} from './logic';

/** Levels 1–10: the mirror boards `makePuzzle` builds (level 11's come from `materialsRound`; level 12's split boards have their own tests). */
const BOARD_PLANS = PLANS.filter((p) => p.mode !== 'materials' && !p.split);
/** Levels 1–7: every mirror is already on the board, for her to turn. */
const TILT_PLANS = BOARD_PLANS.filter((p) => !p.tray && p.mode !== 'find');

const mirrorIndices = (p: LightPuzzle) => p.things.flatMap((t, i) => (t.kind === 'mirror' ? [i] : []));

describe('Light Lab', () => {
  it('mirrors turn the beam a quarter, and the right tilt is found for every turn', () => {
    expect(reflect(0, 0)).toBe(3); // right into "/" goes up
    expect(reflect(0, 1)).toBe(1); // right into "\" goes down
    expect(reflect(1, 0)).toBe(2);
    expect(reflect(3, 1)).toBe(2);
    for (const from of [0, 1, 2, 3] as Dir[])
      for (const to of [(from + 1) % 4, (from + 3) % 4] as Dir[])
        expect(reflect(from, tiltFor(from, to))).toBe(to);
  });

  it('every puzzle has a known answer and starts unsolved, with the planned pieces', () => {
    for (const plan of BOARD_PLANS) {
      for (let seed = 1; seed <= 300; seed++) {
        const p = makePuzzle(plan, new Rng(seed));
        expect(solved(...boardWith(p, p.solution, p.tray)), `${plan.name} ${seed}`).toBe(true);
        // Level 10 turns nothing: its start is the answer, hidden under the cloud.
        expect(solved(p, p.start)).toBe(plan.mode === 'find');
        expect(flowerCount(p)).toBe(plan.flowers);
        expect(p.pathMirrors).toHaveLength(plan.turns - plan.tray);
        expect(p.tray).toHaveLength(plan.tray);
        expect(p.things.filter((t) => t.kind === 'mirror')).toHaveLength(
          plan.turns - plan.tray + plan.decoys,
        );
        expect(p.things.filter((t) => t.kind === 'rock')).toHaveLength(plan.rocks);
        // Nothing overlaps, nothing sits on the sun's column, everything is on the board.
        expect(new Set(p.things.map((t) => `${t.x},${t.y}`)).size).toBe(p.things.length);
        expect([0, p.cols - 1]).toContain(p.sunCol);
        expect(p.sunDir).toBe(p.sunCol === 0 ? 0 : 2);
        for (const t of p.things) {
          expect(t.x).not.toBe(p.sunCol);
          expect(t.x).toBeGreaterThanOrEqual(0);
          expect(t.x).toBeLessThan(p.cols);
          expect(t.y).toBeGreaterThanOrEqual(0);
          expect(t.y).toBeLessThan(p.rows);
        }
      }
    }
  });

  it('colored glass matters: without passing through it, the pink flower stays asleep', () => {
    const plan = PLANS.find((p) => p.glass)!;
    for (let seed = 1; seed <= 100; seed++) {
      const p = makePuzzle(plan, new Rng(seed));
      const pink = p.things.findIndex((t) => t.kind === 'flower' && t.wants === 'pink');
      const glass = p.things.find((t) => t.kind === 'glass' && t.tint === 'pink')!;
      const path = trace(p, p.solution).cells;
      const g = path.findIndex((c) => c.x === glass.x && c.y === glass.y);
      const f = path.findIndex((c) => c.x === p.things[pink].x && c.y === p.things[pink].y);
      expect(g).toBeGreaterThanOrEqual(0);
      expect(g).toBeLessThan(f);
    }
  });

  it('following the hints always reaches the answer', () => {
    for (const plan of TILT_PLANS) {
      for (let seed = 1; seed <= 100; seed++) {
        const p = makePuzzle(plan, new Rng(seed));
        const tilts = [...p.start] as Tilt[];
        for (let step = 0; step < 10 && !solved(p, tilts); step++) {
          const m = hintMirror(p, tilts);
          expect(m).toBeGreaterThanOrEqual(0);
          tilts[m] = (1 - tilts[m]) as Tilt;
        }
        expect(solved(p, tilts)).toBe(true);
      }
    }
  });

  it('level 7 predictions have three distinct reachable endpoints, including the real one', () => {
    const plan = planFor(7);
    for (let seed = 1; seed <= 200; seed++) {
      const p = makePuzzle(plan, new Rng(seed));
      const answer = beamEnd(p, p.start);
      const choices = predictionChoices(p);
      expect(solved(p, p.solution), `seed ${seed}`).toBe(true);
      expect(solved(p, p.start), `seed ${seed}`).toBe(false);
      expect(answer.kind === 'loop').toBe(false);
      expect(choices.length, `seed ${seed}`).toBeGreaterThanOrEqual(3);
      expect(choices[0].key).toBe(answer.key);
      expect(new Set(choices.map((end) => `${end.targetX},${end.targetY}`)).size).toBe(choices.length);
      expect(choices.every((end) => end.kind === 'edge' || end.kind === 'rock')).toBe(true);
    }
  });

  it('starts are fair: at 4–7 no answer is fewer than two or three turns away, and at 4–5 no flower is awake yet', () => {
    for (let level = 1; level <= TILT_PLANS.length; level++) {
      const plan = planFor(level);
      for (let seed = 1; seed <= 400; seed++) {
        const p = makePuzzle(plan, new Rng(seed));
        expect(minTurns(p, p.start), `level ${level} seed ${seed}`).toBeGreaterThanOrEqual(plan.startWrong);
        if (plan.startDark) expect(trace(p, p.start).woken, `level ${level} seed ${seed}`).toHaveLength(0);
      }
    }
    expect(TILT_PLANS.map((p) => p.startWrong)).toEqual([1, 1, 1, 2, 2, 3, 3]);
  });

  it('hints follow the nearest answer: from the start or mid-play, following them takes exactly the fewest turns', () => {
    for (const plan of TILT_PLANS) {
      for (let seed = 1; seed <= 150; seed++) {
        const rng = new Rng(seed * 7 + 3);
        const p = makePuzzle(plan, new Rng(seed));
        const starts: Tilt[][] = [[...p.start]];
        // A random mid-play arrangement, as if she had tapped around.
        starts.push(
          p.start.map((t, i) => (p.things[i].kind === 'mirror' && rng.chance(0.5) ? ((1 - t) as Tilt) : t)),
        );
        for (const from of starts) {
          if (solved(p, from)) continue;
          const tilts = [...from];
          const fewest = minTurns(p, tilts);
          let steps = 0;
          while (!solved(p, tilts)) {
            const m = hintMirror(p, tilts);
            // The hint is a mirror some nearest answer turns, never one every nearest answer keeps.
            expect(
              nearestSolutions(p, tilts).some((s) => s[m] !== tilts[m]),
              `${plan.name} ${seed}`,
            ).toBe(true);
            tilts[m] = (1 - tilts[m]) as Tilt;
            steps++;
            expect(steps).toBeLessThanOrEqual(fewest);
          }
          expect(steps, `${plan.name} ${seed}`).toBe(fewest);
          expect(hintMirror(p, tilts)).toBe(-1);
        }
      }
    }
  });

  it('where a spare mirror opens a shorter way, the par and the hint take it instead of the built path', () => {
    let shortcuts = 0;
    for (const level of [6, 7]) {
      for (let seed = 1; seed <= 400; seed++) {
        const p = makePuzzle(planFor(level), new Rng(seed));
        const rng = new Rng(seed + 500);
        for (let k = 0; k < 4; k++) {
          const tilts =
            k === 0
              ? [...p.start]
              : p.start.map((t, i) =>
                  p.things[i].kind === 'mirror' && rng.chance(0.5) ? ((1 - t) as Tilt) : t,
                );
          if (solved(p, tilts)) continue;
          const built = mirrorIndices(p).filter((i) => tilts[i] !== p.solution[i]).length;
          if (minTurns(p, tilts) >= built) continue;
          shortcuts++;
          // The built answer is not among the nearest, so the hint must turn a mirror some shorter answer turns.
          const m = hintMirror(p, tilts);
          expect(nearestSolutions(p, tilts)[0][m]).not.toBe(tilts[m]);
        }
      }
    }
    expect(shortcuts).toBeGreaterThan(0);
  });

  it('a mirrored board solves exactly when the original does, with every tilt swapped', () => {
    for (const plan of TILT_PLANS) {
      for (let seed = 1; seed <= 60; seed++) {
        const p = makePuzzle(plan, new Rng(seed));
        const m = mirrorPuzzle(p);
        expect(mirrorPuzzle(m)).toEqual(p);
        expect(m.things.some((t) => t.x === m.sunCol)).toBe(false);
        const rng = new Rng(seed + 1000);
        for (let k = 0; k < 8; k++) {
          const tilts = p.things.map((t) => (t.kind === 'mirror' && rng.chance(0.5) ? 1 : 0) as Tilt);
          const swapped = tilts.map((t, i) => (p.things[i].kind === 'mirror' ? 1 - t : t) as Tilt);
          expect(solved(m, swapped)).toBe(solved(p, tilts));
          expect(trace(m, swapped).cells.map((c) => `${p.cols - 1 - c.x},${c.y}`)).toEqual(
            trace(p, tilts).cells.map((c) => `${c.x},${c.y}`),
          );
        }
      }
    }
  });

  it('the sun sits on either side from level 3, and on the left at levels 1–2', () => {
    for (let level = 1; level <= BOARD_PLANS.length; level++) {
      const sides = new Set<number>();
      for (let seed = 1; seed <= 100; seed++) sides.add(makePuzzle(planFor(level), new Rng(seed)).sunDir);
      expect([...sides].sort(), `level ${level}`).toEqual(level <= 2 ? [0] : [0, 2]);
    }
  });
  describe('tray levels 8–9', () => {
    /** Plays a tray board by its hints alone: a cell hint carries a tray mirror there (or moves a stray one), a mirror hint turns it. */
    const followHints = (p: LightPuzzle, tilts: Tilt[], placed: Placed[], limit = 12) => {
      for (let step = 0; step < limit; step++) {
        if (placed.length === p.tray.length && solved(...boardWith(p, tilts, placed))) return step;
        const h = placeHint(p, tilts, placed);
        if (!h) return -1;
        if ('cell' in h) {
          if (placed.length < p.tray.length) placed.push({ ...h.cell, tilt: DROP_TILT });
          else {
            // Every tray mirror is out: move one the nearest answer does not use.
            const near = nearestPlacement(p, tilts, placed)!;
            const stray = placed.findIndex((m) => !near.placed.some((w) => w.x === m.x && w.y === m.y));
            placed[stray] = { ...placed[stray], ...h.cell };
          }
        } else if ('mirror' in h) tilts[h.mirror] = (1 - tilts[h.mirror]) as Tilt;
        else placed[h.placed] = { ...placed[h.placed], tilt: (1 - placed[h.placed].tilt) as Tilt };
      }
      return -1;
    };

    it("every board needs every tray mirror: one answer with all placed, none with fewer, and the flower off the sun's row", () => {
      for (const level of [8, 9]) {
        const plan = planFor(level);
        for (let seed = 1; seed <= 120; seed++) {
          const p = makePuzzle(plan, new Rng(seed));
          expect(fewestPlaced(p), `level ${level} seed ${seed}`).toBe(plan.tray);
          for (const t of p.things) if (t.kind === 'flower') expect(t.y).not.toBe(p.sunRow);
          // The tray's answer cells are free, so she can drop a mirror on each.
          const free = freeCells(p).map((c) => `${c.x},${c.y}`);
          for (const m of p.tray) expect(free).toContain(`${m.x},${m.y}`);
          // Level 8 keeps one board mirror, tilted wrong; level 9's rock sits on the sun's row.
          if (level === 8) expect(p.pathMirrors.map((i) => p.start[i] !== p.solution[i])).toEqual([true]);
          if (level === 9)
            expect(p.things.filter((t) => t.kind === 'rock').map((t) => t.y)).toEqual([p.sunRow]);
        }
      }
    });

    it('the first hint is a cell for a tray mirror on the nearest answer, and a mirror there with some tilt is on the way to an answer', () => {
      for (const level of [8, 9]) {
        for (let seed = 1; seed <= 80; seed++) {
          const p = makePuzzle(planFor(level), new Rng(seed));
          const near = nearestPlacement(p, p.start, [])!;
          expect(solved(...boardWith(p, near.tilts, near.placed))).toBe(true);
          const h = placeHint(p, p.start, []);
          if (!h || !('cell' in h)) expect.unreachable(`level ${level} seed ${seed}: ${JSON.stringify(h)}`);
          else
            expect(
              near.placed.some((m) => m.x === h.cell.x && m.y === h.cell.y),
              `level ${level} seed ${seed}`,
            ).toBe(true);
        }
      }
    });

    it('following the hints from the start, or from mirrors dropped at random, always wakes the flower', () => {
      for (const level of [8, 9]) {
        for (let seed = 1; seed <= 80; seed++) {
          const p = makePuzzle(planFor(level), new Rng(seed));
          expect(
            followHints(p, [...p.start], []),
            `level ${level} seed ${seed} from the start`,
          ).toBeGreaterThan(0);
          const rng = new Rng(seed + 500);
          const placed: Placed[] = [];
          for (let k = 0; k < p.tray.length; k++) {
            const cells = freeCells(p, placed);
            placed.push({ ...cells[rng.int(0, cells.length - 1)], tilt: rng.chance(0.5) ? 1 : 0 });
          }
          const tilts = p.start.map((t, i) =>
            p.things[i].kind === 'mirror' && rng.chance(0.5) ? ((1 - t) as Tilt) : t,
          );
          expect(
            followHints(p, tilts, placed),
            `level ${level} seed ${seed} from random drops`,
          ).toBeGreaterThanOrEqual(0);
        }
      }
    });

    it("from the start, following the hints takes exactly the nearest answer's steps", () => {
      for (const level of [8, 9]) {
        for (let seed = 1; seed <= 60; seed++) {
          const p = makePuzzle(planFor(level), new Rng(seed));
          expect(followHints(p, [...p.start], [])).toBe(nearestPlacement(p, p.start, [])!.cost);
        }
      }
    });

    it('a mirrored tray board mirrors its tray answer too', () => {
      for (const level of [8, 9]) {
        for (let seed = 1; seed <= 30; seed++) {
          const p = makePuzzle(planFor(level), new Rng(seed));
          const m = mirrorPuzzle(p);
          expect(mirrorPuzzle(m)).toEqual(p);
          expect(solved(...boardWith(m, m.solution, m.tray))).toBe(true);
        }
      }
    });
  });

  describe("level 10, Where's the mirror?", () => {
    const plan = planFor(10);

    it("is a 6 by 4 find board of three, with one mirror on the sun's row and the flower on the top or bottom edge", () => {
      expect(plan.mode).toBe('find');
      expect([plan.cols, plan.rows, plan.puzzles]).toEqual([6, 4, 3]);
      for (let seed = 1; seed <= 400; seed++) {
        const p = makePuzzle(plan, new Rng(seed));
        const mirrors = p.things.filter((t) => t.kind === 'mirror');
        const flower = p.things.find((t) => t.kind === 'flower')!;
        expect(mirrors).toHaveLength(1);
        expect(mirrors[0].y).toBe(p.sunRow);
        expect([0, p.rows - 1]).toContain(flower.y);
        expect(flower.y).not.toBe(p.sunRow);
        // The beam reaches the flower and then leaves the board past it.
        const t = trace(p, p.solution);
        expect(t.woken).toHaveLength(1);
        expect(t.end).toBe('edge');
        const last = t.cells[t.cells.length - 1];
        expect(last.x).toBe(flower.x);
        expect(cloudCells(p)).toHaveLength(p.cols * p.rows - 2);
      }
    });

    it('exactly one cloud cell is consistent with where the beam goes in and comes out, and the hint lines cross at it', () => {
      for (let seed = 1; seed <= 400; seed++) {
        const p = makePuzzle(plan, new Rng(seed));
        const mirror = p.things.find((t) => t.kind === 'mirror')!;
        const fitting = cloudCells(p).filter((c) => fits(p, c));
        expect(fitting, `seed ${seed}`).toEqual([{ x: mirror.x, y: mirror.y }]);
        const { row, col } = findLines(p);
        expect([col, row]).toEqual([mirror.x, mirror.y]);
      }
    });

    it("a wrong cell's ghost beam never wakes the flower, and the sun sits on either side", () => {
      const sides = new Set<number>();
      for (let seed = 1; seed <= 200; seed++) {
        const p = makePuzzle(plan, new Rng(seed));
        sides.add(p.sunCol);
        const mirror = p.things.find((t) => t.kind === 'mirror')!;
        for (const c of cloudCells(p)) {
          if (c.x === mirror.x && c.y === mirror.y) continue;
          const ghost = trace(...mirrorAt(p, c));
          expect(ghost.woken).toEqual([]);
          expect(ghost.end).toBe('edge');
        }
      }
      expect([...sides].sort()).toEqual([0, 5]);
    });

    it('boards vary in where the mirror hides', () => {
      const spots = new Set<string>();
      for (let seed = 1; seed <= 100; seed++) {
        const p = makePuzzle(plan, new Rng(seed));
        const m = p.things.find((t) => t.kind === 'mirror')!;
        spots.add(`${m.x},${m.y},${p.sunCol}`);
      }
      expect(spots.size).toBeGreaterThan(20);
    });
  });
  describe('level 11, Through, bounce or stop?', () => {
    const SEEDS = 400;
    const allStuff: Stuff[] = MATERIALS.flatMap((material) =>
      POOLS[material].map((name) => ({ material, name })),
    );

    it('each material does its main thing to the straight beam', () => {
      for (let seed = 1; seed <= SEEDS; seed++) {
        const { board } = materialsRound(new Rng(seed));
        const far = { x: board.cols - 1, y: board.sunRow };
        for (const stuff of allStuff) {
          const p = materialPuzzle(board, stuff);
          const t = trace(p, []);
          const at = (c: { x: number; y: number }) =>
            p.things.findIndex((th) => th.kind === 'flower' && th.x === c.x && th.y === c.y);
          if (stuff.material === 'clear' || stuff.material === 'cloudy') {
            expect(t.woken).toEqual([at(far)]);
            const past = t.cells.filter((c) => c.x > board.stand);
            expect(past.every((c) => !!c.dim)).toBe(stuff.material === 'cloudy');
            expect(t.cells.filter((c) => c.x <= board.stand).some((c) => c.dim)).toBe(false);
          } else if (stuff.material === 'solid') {
            expect(t.end).toBe('rock');
            expect(t.woken).toEqual([]);
            const last = t.cells[t.cells.length - 1];
            expect([last.x, last.y]).toEqual([board.stand, board.sunRow]);
          } else {
            expect(t.woken).toEqual([at({ x: board.stand, y: board.bounceRow })]);
          }
          // The outcome table agrees with what the beam really does.
          const o =
            t.end === 'rock' ? 'stop' : t.cells.some((c) => c.y !== board.sunRow) ? 'bounce' : 'through';
          expect(o).toBe(outcome(stuff.material));
        }
        expect(materialPuzzle(board, null).things).toHaveLength(2);
      }
      expect(MATERIALS.map(outcome)).toEqual(['through', 'through', 'stop', 'bounce']);
    });

    it('three guesses of three different materials, on a board whose bounce stays on it', () => {
      for (let seed = 1; seed <= SEEDS; seed++) {
        const { board, guesses } = materialsRound(new Rng(seed));
        expect(guesses).toHaveLength(3);
        expect(new Set(guesses.map((g) => g.material)).size).toBe(3);
        for (const g of guesses) expect(POOLS[g.material]).toContain(g.name);
        expect([1, 2]).toContain(board.sunRow);
        expect([2, 3]).toContain(board.stand);
        expect([board.cols, board.rows]).toEqual([6, 4]);
        expect(board.bounceRow).toBe(board.sunRow === 1 ? 3 : 0);
        expect(shadowCells(board).map((c) => c.x)).toEqual(
          Array.from({ length: board.cols - 1 - board.stand }, (_, k) => board.stand + 1 + k),
        );
      }
    });

    it('every choice has exactly one tray thing that works, and every other has a line for what it did', () => {
      for (let seed = 1; seed <= SEEDS; seed++) {
        const { board, choices } = materialsRound(new Rng(seed));
        expect(choices).toHaveLength(2);
        for (const c of choices) {
          expect(c.tray).toHaveLength(3);
          expect(new Set(c.tray.map((s) => s.material)).size).toBe(3);
          const works = c.tray.map((s) => meetsGoal(board, c.goal, s));
          expect(works.filter(Boolean)).toHaveLength(1);
          expect(works[c.answer]).toBe(true);
          c.tray.forEach((s, i) => expect(whyNotMaterial(c.goal, s.material) === null).toBe(i === c.answer));
          // The owl's goal never offers the shiny thing, which would also leave it dark.
          if (c.goal === 'shade') expect(c.tray.some((s) => s.material === 'shiny')).toBe(false);
        }
      }
    });

    it('is fair: each choice asks for what a guess showed, and the two goals differ', () => {
      const goals = new Set<string>();
      for (let seed = 1; seed <= SEEDS; seed++) {
        const { guesses, choices } = materialsRound(new Rng(seed));
        const shown = guesses.map((g) => g.material);
        expect(choices[0].goal).not.toBe(choices[1].goal);
        for (const c of choices) {
          goals.add(c.goal);
          expect(shown).toContain(c.tray[c.answer].material);
        }
      }
      expect([...goals].sort()).toEqual(['bounce', 'shade', 'wake']);
    });

    it('the hint names the answer, and the owl sits where the far flower would', () => {
      for (let seed = 1; seed <= 50; seed++) {
        const { board, choices } = materialsRound(new Rng(seed));
        for (const c of choices) expect(hintThing(c)).toBe(c.answer);
        expect(owlCell(board)).toEqual({ x: board.cols - 1, y: board.sunRow });
      }
      const b: MaterialBoard = { cols: 6, rows: 4, sunRow: 1, stand: 2, tilt: 1, bounceRow: 3 };
      expect(meetsGoal(b, 'shade', { material: 'cloudy', name: 'wax' })).toBe(false);
      expect(meetsGoal(b, 'shade', { material: 'solid', name: 'book' })).toBe(true);
    });

    it('sits after level 4 in both bands: pre-K [1, 2, 3, 4, 11], school [2, 3, 4, 11, 5 … 10, 12]', () => {
      expect(planFor(11).mode).toBe('materials');
      expect(planFor(11).eitherSide).toBe(false);
      expect(() => makePuzzle(planFor(11), new Rng(1))).toThrow();
      expect(rangeFor(LEVELS, 'prek').order).toEqual([1, 2, 3, 4, 11]);
      expect(rangeFor(LEVELS, 'school').order).toEqual([2, 3, 4, 11, 5, 6, 7, 8, 9, 10, 12]);
      expect(stepLevel(4, 1, rangeFor(LEVELS, 'prek'))).toBe(11);
      expect(stepLevel(4, 1, rangeFor(LEVELS, 'school'))).toBe(11);
      expect(stepLevel(11, 1, rangeFor(LEVELS, 'school'))).toBe(5);
      expect(stepLevel(5, -1, rangeFor(LEVELS, 'school'))).toBe(11);
      expect(PLANS).toHaveLength(12);
    });
  });
});

describe('level 12, Split the sunbeam', () => {
  const plan = planFor(12);
  const seeds = (n: number) => Array.from({ length: n }, (_, i) => i + 1);
  const boards = (n: number) => seeds(n).map((seed) => ({ seed, p: makePuzzle(plan, new Rng(seed)) }));
  const randomTilts = (p: LightPuzzle, rng: Rng) =>
    p.things.map((_, i) => (tiltable(p).includes(i) ? (rng.chance(0.5) ? 1 : 0) : p.solution[i])) as Tilt[];
  const flip = (tilts: Tilt[]) => tilts.map((t) => (1 - t) as Tilt) as Tilt[];

  it('traceAll on a board with no half-mirror is one arm equal to trace, step = index + 1 (levels 1–10)', () => {
    for (const pl of BOARD_PLANS) {
      for (let seed = 1; seed <= 100; seed++) {
        const p = makePuzzle(pl, new Rng(seed));
        for (const tilts of [p.start, p.solution]) {
          const t = trace(p, tilts);
          const all = traceAll(p, tilts);
          expect(all.arms, `${pl.name} ${seed}`).toHaveLength(1);
          expect(all.arms[0].cells.map(({ step, ...c }) => c)).toEqual(t.cells);
          expect(all.arms[0].cells.map((c) => c.step)).toEqual(t.cells.map((_, i) => i + 1));
          expect(all.arms[0].end).toBe(t.end);
          expect([...all.woken].sort()).toEqual([...t.woken].sort());
          expect(all.split).toBe(false);
        }
      }
    }
  });

  it('a half-mirror passes the beam straight on and also turns it, for every direction and tilt', () => {
    // The sun shines right or left along a row; a mirror first turns it down or up to reach each direction.
    const cases: {
      sunCol: number;
      sunRow: number;
      sunDir: 0 | 2;
      pre?: { x: number; y: number; tilt: Tilt };
      dir: Dir;
    }[] = [
      { sunCol: 0, sunRow: 2, sunDir: 0, dir: 0 },
      { sunCol: 6, sunRow: 2, sunDir: 2, dir: 2 },
      { sunCol: 0, sunRow: 0, sunDir: 0, pre: { x: 3, y: 0, tilt: 1 }, dir: 1 },
      { sunCol: 0, sunRow: 4, sunDir: 0, pre: { x: 3, y: 4, tilt: 0 }, dir: 3 },
    ];
    for (const c of cases) {
      for (const tilt of [0, 1] as Tilt[]) {
        const things: LightPuzzle['things'] = [{ kind: 'half', x: 3, y: 2 }];
        const tilts: Tilt[] = [tilt];
        if (c.pre) (things.push({ kind: 'mirror', x: c.pre.x, y: c.pre.y }), tilts.push(c.pre.tilt));
        const p: LightPuzzle = {
          cols: 7,
          rows: 5,
          sunRow: c.sunRow,
          sunCol: c.sunCol,
          sunDir: c.sunDir,
          things,
          solution: tilts,
          start: tilts,
          pathMirrors: [],
          tray: [],
        };
        const all = traceAll(p, tilts);
        const turned = reflect(c.dir, tilt);
        expect(all.split).toBe(true);
        expect(all.arms.length).toBe(2);
        const [straight, bounced] = all.arms;
        expect(straight.parent).toBe(-1);
        expect(bounced.parent).toBe(0);
        expect(bounced.from).toBe(0);
        const halfIdx = straight.cells.findIndex((k) => k.x === 3 && k.y === 2);
        expect(halfIdx).toBeGreaterThanOrEqual(0);
        const after = straight.cells[halfIdx + 1];
        expect(after && { x: after.x, y: after.y }).toEqual({ x: 3 + DX[c.dir], y: 2 + DY[c.dir] });
        expect({ x: bounced.cells[0].x, y: bounced.cells[0].y }).toEqual({
          x: 3 + DX[turned],
          y: 2 + DY[turned],
        });
        // Both arms leave the half-mirror at the same step, and the bounced arm is dim.
        expect(bounced.cells[0].step).toBe(after.step);
        expect(bounced.cells.every((k) => k.dim)).toBe(true);
        expect(straight.cells.slice(halfIdx + 1).every((k) => k.dim)).toBe(true);
      }
    }
  });

  it('a rock stops only the arm that meets it, and an arm that leaves the board ends there', () => {
    const things: LightPuzzle['things'] = [
      { kind: 'half', x: 2, y: 2 },
      { kind: 'rock', x: 4, y: 2 },
      { kind: 'flower', x: 2, y: 0, wants: 'sun' },
    ];
    const p: LightPuzzle = {
      cols: 7,
      rows: 5,
      sunRow: 2,
      sunCol: 0,
      sunDir: 0,
      things,
      solution: [0, 0, 0],
      start: [0, 0, 0],
      pathMirrors: [],
      tray: [],
    };
    const all = traceAll(p, [0, 0, 0]);
    expect(all.arms[0].end).toBe('rock');
    expect(all.arms[1].end).toBe('edge');
    expect(all.woken).toEqual([2]);
  });

  it('an arm that returns the way another has gone ends as a loop, and the walk finishes', () => {
    // A square of mirrors around a half-mirror feeds the bounced beam back into the half-mirror.
    const things: LightPuzzle['things'] = [
      { kind: 'half', x: 2, y: 2 },
      { kind: 'mirror', x: 2, y: 0 },
      { kind: 'mirror', x: 4, y: 0 },
      { kind: 'mirror', x: 4, y: 2 },
      { kind: 'mirror', x: 4, y: 4 },
      { kind: 'mirror', x: 2, y: 4 },
    ];
    let loops = 0;
    for (let mask = 0; mask < 2 ** things.length; mask++) {
      const tilts = things.map((_, i) => ((mask >> i) & 1) as Tilt);
      const p: LightPuzzle = {
        cols: 7,
        rows: 5,
        sunRow: 2,
        sunCol: 0,
        sunDir: 0,
        things,
        solution: tilts,
        start: tilts,
        pathMirrors: [],
        tray: [],
      };
      const all = traceAll(p, tilts);
      expect(all.arms.length).toBeLessThanOrEqual(p.cols * p.rows * 4);
      if (all.arms.some((a) => a.end === 'loop')) loops++;
    }
    expect(loops).toBeGreaterThan(0);
  });

  it('level 12 is a split plan with two flowers, seven or fewer tiltables, and every seed makes a board', () => {
    expect(plan.split).toBe(true);
    expect(plan.flowers).toBe(2);
    for (const { seed, p } of boards(300)) {
      expect(p, `seed ${seed}`).toBeTruthy();
      expect(
        p.things.filter((t) => t.kind === 'half'),
        `seed ${seed}`,
      ).toHaveLength(1);
      expect(flowerCount(p)).toBe(2);
      expect(tiltable(p).length).toBeLessThanOrEqual(7);
    }
  });

  it('the known answer wakes both flowers, one on each arm, with no loop, and nothing sits in the sun column', () => {
    for (const { seed, p } of boards(400)) {
      const all = traceAll(p, p.solution);
      expect(all.woken, `seed ${seed}`).toHaveLength(2);
      expect(all.split).toBe(true);
      expect(flowersOnTwoArms(p, p.solution), `seed ${seed}`).toBe(true);
      expect(
        all.arms.some((a) => a.end === 'loop'),
        `seed ${seed}`,
      ).toBe(false);
      expect(solved(p, p.solution)).toBe(true);
      expect(new Set(p.things.map((t) => `${t.x},${t.y}`)).size).toBe(p.things.length);
      for (const t of p.things) {
        expect(t.x).not.toBe(p.sunCol);
        expect(t.x).toBeGreaterThanOrEqual(0);
        expect(t.x).toBeLessThan(p.cols);
        expect(t.y).toBeGreaterThanOrEqual(0);
        expect(t.y).toBeLessThan(p.rows);
      }
      expect(p.sunDir).toBe(p.sunCol === 0 ? 0 : 2);
      expect(p.solution).toHaveLength(p.things.length);
      expect(p.start).toHaveLength(p.things.length);
    }
  });

  it('the half-mirror is required: as a mirror of either tilt, or taken away, no arrangement wakes both flowers', () => {
    for (const { seed, p } of boards(300)) {
      const h = p.things.findIndex((t) => t.kind === 'half');
      expect(anySolution(p), `seed ${seed}`).toBe(true);
      expect(anySolution(replaceThing(p, h, 'mirror')), `mirror ${seed}`).toBe(false);
      expect(anySolution(replaceThing(p, h, null)), `none ${seed}`).toBe(false);
    }
  });

  it('the start is fair: unsolved, at least two turns from an answer, and no flower awake', () => {
    for (const { seed, p } of boards(400)) {
      expect(solved(p, p.start), `seed ${seed}`).toBe(false);
      expect(minTurns(p, p.start), `seed ${seed}`).toBeGreaterThanOrEqual(2);
      expect(traceAll(p, p.start).woken, `seed ${seed}`).toHaveLength(0);
    }
  });

  it('following the hint reaches an answer in exactly minTurns taps, from the start and from random arrangements', () => {
    const walk = (p: LightPuzzle, from: Tilt[], label: string) => {
      const tilts = [...from];
      const want = minTurns(p, tilts);
      let taps = 0;
      while (!solved(p, tilts)) {
        const i = hintMirror(p, tilts);
        expect(i, label).toBeGreaterThanOrEqual(0);
        expect(tiltable(p), label).toContain(i);
        tilts[i] = (1 - tilts[i]) as Tilt;
        expect(++taps, label).toBeLessThanOrEqual(8);
      }
      expect(taps, label).toBe(want);
    };
    for (const { seed, p } of boards(60)) {
      walk(p, p.start, `start ${seed}`);
      const rng = new Rng(seed * 7919);
      for (let k = 0; k < 20; k++) walk(p, randomTilts(p, rng), `random ${seed}.${k}`);
    }
  });

  it('the mirror image of a split board solves exactly when the original does, with mirrored tilts', () => {
    for (const { seed, p } of boards(100)) {
      const m = mirrorPuzzle(p);
      expect(solved(m, flip(p.solution)), `seed ${seed}`).toBe(true);
      expect(solved(m, flip(p.start))).toBe(solved(p, p.start));
      const rng = new Rng(seed);
      for (let k = 0; k < 10; k++) {
        const t = randomTilts(p, rng);
        expect(solved(m, flip(t)), `seed ${seed}.${k}`).toBe(solved(p, t));
      }
    }
  });

  it('whyNot says unsplit, sleeping or split, and each has a voice line', () => {
    const seen = new Set<string>();
    for (const { seed, p } of boards(200)) {
      expect(whyNot(p, p.solution)).toBe('none');
      const rng = new Rng(seed * 31);
      for (let k = 0; k < 20; k++) {
        const t = randomTilts(p, rng);
        const all = traceAll(p, t);
        const why = whyNot(p, t);
        seen.add(why);
        if (all.woken.length === 2) expect(why).toBe('none');
        else if (!all.split) expect(why, `seed ${seed}.${k}`).toBe('unsplit');
        else expect(why, `seed ${seed}.${k}`).toBe(all.woken.length ? 'sleeping' : 'split');
      }
    }
    expect([...seen].sort()).toEqual(expect.arrayContaining(['unsplit', 'sleeping', 'split']));
    for (const id of ['light.miss.unsplit', 'light.miss.sleeping', 'light.miss.split'] as const)
      expect(SCRIPT[id].length).toBeGreaterThan(0);
  });

  it('ladder: school ends [..., 10, 12], stepping up from 10 reaches 12, and pre-K is unchanged', () => {
    const school = rangeFor(LEVELS, 'school');
    expect(school.order).toEqual([2, 3, 4, 11, 5, 6, 7, 8, 9, 10, 12]);
    expect(school.order!.slice(-2)).toEqual([10, 12]);
    expect(stepLevel(10, 1, school)).toBe(12);
    expect(stepLevel(12, -1, school)).toBe(10);
    expect(rangeFor(LEVELS, 'prek').order).toEqual([1, 2, 3, 4, 11]);
    expect(rangeFor(LEVELS, 'prek').max).toBe(11);
  });
});
