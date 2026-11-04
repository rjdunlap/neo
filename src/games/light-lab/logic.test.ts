import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { beamEnd, boardWith, cloudCells, DROP_TILT, fewestPlaced, findLines, fits, mirrorAt, flowerCount, freeCells, nearestPlacement, placeHint, hintMirror, makePuzzle, minTurns, mirrorPuzzle, nearestSolutions, planFor, PLANS, predictionChoices, reflect, solved, tiltFor, trace, type Dir, type LightPuzzle, type Placed, type Tilt } from './logic';

/** Levels 1–7: every mirror is already on the board, for her to turn. */
const TILT_PLANS = PLANS.filter((p) => !p.tray && p.mode !== 'find');

const mirrorIndices = (p: LightPuzzle) => p.things.flatMap((t, i) => (t.kind === 'mirror' ? [i] : []));

describe('Light Lab', () => {
  it('mirrors turn the beam a quarter, and the right tilt is found for every turn', () => {
    expect(reflect(0, 0)).toBe(3); // right into "/" goes up
    expect(reflect(0, 1)).toBe(1); // right into "\" goes down
    expect(reflect(1, 0)).toBe(2);
    expect(reflect(3, 1)).toBe(2);
    for (const from of [0, 1, 2, 3] as Dir[]) for (const to of [(from + 1) % 4, (from + 3) % 4] as Dir[]) expect(reflect(from, tiltFor(from, to))).toBe(to);
  });

  it('every puzzle has a known answer and starts unsolved, with the planned pieces', () => {
    for (const plan of PLANS) {
      for (let seed = 1; seed <= 300; seed++) {
        const p = makePuzzle(plan, new Rng(seed));
        expect(solved(...boardWith(p, p.solution, p.tray)), `${plan.name} ${seed}`).toBe(true);
        // Level 10 turns nothing: its start is the answer, hidden under the cloud.
        expect(solved(p, p.start)).toBe(plan.mode === 'find');
        expect(flowerCount(p)).toBe(plan.flowers);
        expect(p.pathMirrors).toHaveLength(plan.turns - plan.tray);
        expect(p.tray).toHaveLength(plan.tray);
        expect(p.things.filter((t) => t.kind === 'mirror')).toHaveLength(plan.turns - plan.tray + plan.decoys);
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
        starts.push(p.start.map((t, i) => (p.things[i].kind === 'mirror' && rng.chance(0.5) ? ((1 - t) as Tilt) : t)));
        for (const from of starts) {
          if (solved(p, from)) continue;
          const tilts = [...from];
          const fewest = minTurns(p, tilts);
          let steps = 0;
          while (!solved(p, tilts)) {
            const m = hintMirror(p, tilts);
            // The hint is a mirror some nearest answer turns, never one every nearest answer keeps.
            expect(nearestSolutions(p, tilts).some((s) => s[m] !== tilts[m]), `${plan.name} ${seed}`).toBe(true);
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
          const tilts = k === 0 ? [...p.start] : p.start.map((t, i) => (p.things[i].kind === 'mirror' && rng.chance(0.5) ? ((1 - t) as Tilt) : t));
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
          const swapped = tilts.map((t, i) => (p.things[i].kind === 'mirror' ? (1 - t) : t) as Tilt);
          expect(solved(m, swapped)).toBe(solved(p, tilts));
          expect(trace(m, swapped).cells.map((c) => `${p.cols - 1 - c.x},${c.y}`)).toEqual(trace(p, tilts).cells.map((c) => `${c.x},${c.y}`));
        }
      }
    }
  });

  it('the sun sits on either side from level 3, and on the left at levels 1–2', () => {
    for (let level = 1; level <= PLANS.length; level++) {
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

    it('every board needs every tray mirror: one answer with all placed, none with fewer, and the flower off the sun\'s row', () => {
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
          if (level === 9) expect(p.things.filter((t) => t.kind === 'rock').map((t) => t.y)).toEqual([p.sunRow]);
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
          else expect(near.placed.some((m) => m.x === h.cell.x && m.y === h.cell.y), `level ${level} seed ${seed}`).toBe(true);
        }
      }
    });

    it('following the hints from the start, or from mirrors dropped at random, always wakes the flower', () => {
      for (const level of [8, 9]) {
        for (let seed = 1; seed <= 80; seed++) {
          const p = makePuzzle(planFor(level), new Rng(seed));
          expect(followHints(p, [...p.start], []), `level ${level} seed ${seed} from the start`).toBeGreaterThan(0);
          const rng = new Rng(seed + 500);
          const placed: Placed[] = [];
          for (let k = 0; k < p.tray.length; k++) {
            const cells = freeCells(p, placed);
            placed.push({ ...cells[rng.int(0, cells.length - 1)], tilt: rng.chance(0.5) ? 1 : 0 });
          }
          const tilts = p.start.map((t, i) => (p.things[i].kind === 'mirror' && rng.chance(0.5) ? ((1 - t) as Tilt) : t));
          expect(followHints(p, tilts, placed), `level ${level} seed ${seed} from random drops`).toBeGreaterThanOrEqual(0);
        }
      }
    });

    it('from the start, following the hints takes exactly the nearest answer\'s steps', () => {
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

    it('is a 6 by 4 find board of three, with one mirror on the sun\'s row and the flower on the top or bottom edge', () => {
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

    it('a wrong cell\'s ghost beam never wakes the flower, and the sun sits on either side', () => {
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
});
