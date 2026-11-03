import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { beamEnd, flowerCount, hintMirror, makePuzzle, minTurns, mirrorPuzzle, nearestSolutions, planFor, PLANS, predictionChoices, reflect, solved, tiltFor, trace, type Dir, type LightPuzzle, type Tilt } from './logic';

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
        expect(solved(p, p.solution), `${plan.name} ${seed}`).toBe(true);
        expect(solved(p, p.start)).toBe(false);
        expect(flowerCount(p)).toBe(plan.flowers);
        expect(p.pathMirrors).toHaveLength(plan.turns);
        expect(p.things.filter((t) => t.kind === 'mirror')).toHaveLength(plan.turns + plan.decoys);
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
    for (const plan of PLANS) {
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
    for (let level = 1; level <= PLANS.length; level++) {
      const plan = planFor(level);
      for (let seed = 1; seed <= 400; seed++) {
        const p = makePuzzle(plan, new Rng(seed));
        expect(minTurns(p, p.start), `level ${level} seed ${seed}`).toBeGreaterThanOrEqual(plan.startWrong);
        if (plan.startDark) expect(trace(p, p.start).woken, `level ${level} seed ${seed}`).toHaveLength(0);
      }
    }
    expect(PLANS.map((p) => p.startWrong)).toEqual([1, 1, 1, 2, 2, 3, 3]);
  });

  it('hints follow the nearest answer: from the start or mid-play, following them takes exactly the fewest turns', () => {
    for (const plan of PLANS) {
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
    for (const plan of PLANS) {
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
});
