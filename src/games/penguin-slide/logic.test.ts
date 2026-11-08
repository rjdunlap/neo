import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { levelsInOrder } from '../../progress/difficulty';
import { penguinSlide } from './index';
import {
  alone,
  movePair,
  solvePair,
  cellAt,
  makePrediction,
  PREDICTIONS,
  stopper,
  eatsTwoFromStart,
  FISH_COLORS,
  hasDeadEnd,
  PAIRED_BLOCK_PONDS,
  pickLook,
  ROCK_LOOKS,
  beside,
  eaten,
  makePuzzle,
  move,
  PLANS,
  slide,
  solve,
  solved,
  tapDirection,
  type Cell,
  type Dir,
  type SlidePuzzle,
} from './logic';

const tiny: SlidePuzzle = {
  cols: 4,
  rows: 3,
  rocks: [{ x: 3, y: 1 }],
  soft: [{ x: 1, y: 2 }],
  start: { x: 0, y: 0 },
  fish: [{ x: 2, y: 2 }],
  best: 0,
};

describe('Penguin Slide', () => {
  it('slides until a rock, the edge or soft snow, eating fish on the way', () => {
    expect(slide(tiny, { x: 0, y: 0 }, 0).to).toEqual({ x: 3, y: 0 });
    expect(slide(tiny, { x: 0, y: 1 }, 0).to).toEqual({ x: 2, y: 1 }); // stops before the rock
    expect(slide(tiny, { x: 1, y: 0 }, 1).to).toEqual({ x: 1, y: 2 }); // into the soft snow
    expect(slide(tiny, { x: 0, y: 0 }, 2).passed).toHaveLength(0); // already at the edge
    expect(eaten(tiny, slide(tiny, { x: 1, y: 2 }, 0).passed)).toBe(1);
    // Down to the corner, right into the soft snow, then right again past the fish.
    expect(solve(tiny, tiny.start)).toEqual({ moves: 3, first: 1 });
    // The soft snow is in the way here: without it, down then right slides straight past the fish.
    expect(solve({ ...tiny, soft: [] }, tiny.start)).toEqual({ moves: 2, first: 1 });
  });

  it('every puzzle needs the planned number of slides, with nothing stacked on anything else', () => {
    for (const plan of PLANS.filter((p) => !p.predict && !p.pal)) {
      for (let seed = 1; seed <= 150; seed++) {
        const p = makePuzzle(plan, new Rng(seed));
        expect(p.best).toBeGreaterThanOrEqual(plan.moves[0]);
        expect(p.best).toBeLessThanOrEqual(plan.moves[1]);
        expect(solve(p, p.start).moves).toBe(p.best);
        const all = [p.start, ...p.rocks, ...p.soft, ...p.fish, ...(p.blocks ?? [])].map(
          (c) => `${c.x},${c.y}`,
        );
        expect(new Set(all).size).toBe(all.length);
        expect(p.fish).toHaveLength(plan.fish);
        expect(p.blocks?.length ?? 0).toBe(plan.blocks ?? 0);
      }
    }
  }, 15000);

  it('following the hint arrow always eats every fish in the fewest slides', () => {
    for (const plan of PLANS.filter((p) => !p.predict && !p.pal)) {
      for (let seed = 1; seed <= 60; seed++) {
        const p = makePuzzle(plan, new Rng(seed));
        let at = p.start;
        let have = 0;
        let blocks = p.blocks ?? [];
        let used = 0;
        while (!solved(p, have, blocks)) {
          const { first } = solve(p, at, have, blocks);
          expect(first).not.toBe(-1);
          const m = move(p, at, first as Dir, blocks)!;
          expect(m).not.toBeNull();
          have |= eaten(p, m.passed);
          at = m.to;
          blocks = m.blocks;
          used++;
        }
        expect(used).toBe(p.best);
      }
    }
  });

  it('has a tap the ghost finger can make for every move of a fewest route, which does that move and finishes in the fewest', () => {
    for (const plan of PLANS.filter((p) => !p.predict && !p.pal)) {
      for (let seed = 1; seed <= 60; seed++) {
        const p = makePuzzle(plan, new Rng(seed));
        let at = p.start;
        let have = 0;
        let blocks = p.blocks ?? [];
        let moves = 0;
        while (!solved(p, have, blocks) && moves < 40) {
          const { first } = solve(p, at, have, blocks);
          expect(first).toBeGreaterThanOrEqual(0);
          const tap = beside(at, first as Dir);
          expect(tap.x).toBeGreaterThanOrEqual(0);
          expect(tap.x).toBeLessThan(p.cols);
          expect(tap.y).toBeGreaterThanOrEqual(0);
          expect(tap.y).toBeLessThan(p.rows);
          // The tap lands beside the penguin and the game reads it as the same direction.
          expect(tapDirection(tap.x - at.x, tap.y - at.y)).toBe(first);
          const m = move(p, at, tapDirection(tap.x - at.x, tap.y - at.y), blocks);
          expect(m).not.toBeNull();
          have |= eaten(p, m!.passed);
          at = m!.to;
          blocks = m!.blocks;
          moves++;
        }
        expect(moves).toBe(p.best);
      }
    }
  });
});

describe('Penguin Slide ice blocks', () => {
  //  P . . . . #      P the penguin, # a rock, ~ soft snow, F a fish
  //  . . . ~ . .
  //  . F . . . .
  const pond = (blocks: Cell[]): SlidePuzzle => ({
    cols: 6,
    rows: 3,
    rocks: [{ x: 5, y: 0 }],
    soft: [{ x: 3, y: 1 }],
    blocks,
    start: { x: 0, y: 0 },
    fish: [{ x: 1, y: 2 }],
    best: 0,
  });

  it('a block stops a slide like a rock, and pushing it skates it to its next stop while the penguin stays put', () => {
    const p = pond([{ x: 2, y: 0 }]);
    expect(slide(p, p.start, 0).to).toEqual({ x: 1, y: 0 });
    const push = move(p, { x: 1, y: 0 }, 0)!;
    expect(push.to).toEqual({ x: 1, y: 0 });
    expect(push.passed).toHaveLength(0);
    expect(push.pushed).toEqual({ index: 0, to: { x: 4, y: 0 } }); // stops before the rock
    expect(push.blocks).toEqual([{ x: 4, y: 0 }]);
    expect(p.blocks).toEqual([{ x: 2, y: 0 }]); // the puzzle itself is never changed
  });

  it('a block stops at the edge, in soft snow and before another block or a fish; one that cannot move is a rock', () => {
    expect(move(pond([{ x: 4, y: 2 }]), { x: 3, y: 2 }, 0)!.pushed!.to).toEqual({ x: 5, y: 2 }); // the edge
    expect(move(pond([{ x: 1, y: 1 }]), { x: 0, y: 1 }, 0)!.pushed!.to).toEqual({ x: 3, y: 1 }); // sinks into the snow
    expect(move(pond([{ x: 3, y: 2 }]), { x: 4, y: 2 }, 2)!.pushed!.to).toEqual({ x: 2, y: 2 }); // the fish is not covered
    expect(move(pond([{ x: 1, y: 1 }]), { x: 1, y: 0 }, 1)).toBeNull(); // the fish is right behind it
    expect(
      move(
        pond([
          { x: 1, y: 1 },
          { x: 2, y: 1 },
        ]),
        { x: 0, y: 1 },
        0,
      ),
    ).toBeNull(); // another block is right behind it
    expect(move(pond([{ x: 4, y: 0 }]), { x: 3, y: 0 }, 0)).toBeNull(); // a rock is right behind it
    expect(move(pond([]), { x: 0, y: 0 }, 2)).toBeNull(); // nothing at all: a bump
  });

  it('a block shut in front of the fish leaves no way, which the solver reports as stuck', () => {
    // P B F: the fish is right behind the block, so it will not move and the penguin cannot pass.
    const shut: SlidePuzzle = {
      cols: 3,
      rows: 1,
      rocks: [],
      soft: [],
      blocks: [{ x: 1, y: 0 }],
      start: { x: 0, y: 0 },
      fish: [{ x: 2, y: 0 }],
      best: 0,
    };
    expect(solve(shut, shut.start).moves).toBe(-1);
  });

  it('every block level needs a push: frozen blocks leave the fish out of reach or farther', () => {
    for (const plan of PLANS.filter((p) => p.blocks)) {
      expect(plan.blocks).toBeGreaterThan(0);
      for (let seed = 1; seed <= 150; seed++) {
        const p = makePuzzle(plan, new Rng(seed));
        const frozen = solve({ ...p, rocks: [...p.rocks, ...p.blocks!], blocks: [] }, p.start).moves;
        expect(frozen === -1 || frozen > p.best).toBe(true);
      }
    }
  }, 15000);
});

// The next level combines block positioning with the existing two-fish planning rule.
it('level 7 preserves the board size and gives two-fish routes with meaningful block moves', () => {
  const p = PLANS[6];
  expect([p.cols, p.rows, p.fish, p.blocks, p.soft, p.rocks, p.puzzles]).toEqual([6, 5, 2, 1, 0, 4, 2]);
  expect(p.moves).toEqual([4, 6]);
  for (let seed = 1; seed <= 60; seed++) {
    const puzzle = makePuzzle(p, new Rng(seed));
    let at = puzzle.start,
      have = 0,
      blocks = puzzle.blocks!,
      pushes = 0;
    for (let step = 0; step < puzzle.best; step++) {
      const first = solve(puzzle, at, have, blocks).first;
      expect(first).toBeGreaterThanOrEqual(0);
      const m = move(puzzle, at, first as Dir, blocks)!;
      if (m.pushed) pushes++;
      have |= eaten(puzzle, m.passed);
      at = m.to;
      blocks = m.blocks;
      expect(solve(puzzle, at, have, blocks).moves).toBe(puzzle.best - step - 1);
    }
    expect(pushes).toBeGreaterThan(0);
    expect(have).toBe(3);
  }
});

it('level 8 combines useful snow stops with a useful block on every generated pond', () => {
  const plan = PLANS[7];
  expect([plan.fish, plan.blocks, plan.soft]).toEqual([2, 1, 1]);
  for (let seed = 1; seed <= 150; seed++) {
    const p = makePuzzle(plan, new Rng(seed));
    expect(solve({ ...p, soft: [] }, p.start).moves).not.toBe(p.best);
    const frozen = solve({ ...p, rocks: [...p.rocks, ...p.blocks!], blocks: [] }, p.start).moves;
    expect(frozen === -1 || frozen > p.best).toBe(true);
  }
});

it('paired-block ponds need each block, preserve their solver distance under seeded reflections, and vary', () => {
  const seen = new Set<string>();
  for (let seed = 1; seed <= 200; seed++) {
    const p = makePuzzle(PLANS[8], new Rng(seed)),
      signature = JSON.stringify(p);
    if (seen.has(signature)) continue;
    seen.add(signature);
    expect(solve(p, p.start).moves).toBe(p.best);
    for (let i = 0; i < 2; i++) {
      const frozen = solve(
        { ...p, rocks: [...p.rocks, p.blocks![i]], blocks: p.blocks!.filter((_, j) => j !== i) },
        p.start,
      ).moves;
      expect(frozen === -1 || frozen > p.best).toBe(true);
    }
    let at = p.start,
      have = 0,
      blocks = p.blocks!,
      pushed = new Set<number>();
    for (let step = 0; step < p.best; step++) {
      const d = solve(p, at, have, blocks).first;
      expect(d).toBeGreaterThanOrEqual(0);
      const m = move(p, at, d as Dir, blocks)!;
      if (m.pushed) pushed.add(m.pushed.index);
      at = m.to;
      blocks = m.blocks;
      have |= eaten(p, m.passed);
    }
    expect(have).toBe(1);
    expect(pushed.size).toBe(2);
  }
  expect(PAIRED_BLOCK_PONDS).toHaveLength(4);
  expect(seen.size).toBe(16);
});

describe('Penguin Slide fair ponds', () => {
  it('spots a dead end: a slide that leaves the fish out of reach', () => {
    // A level-1 pond the old generator made: one slide right eats the fish, but down then along the
    // bottom row leaves the penguin circling the bottom corners and the top-left, never back.
    const trap: SlidePuzzle = {
      cols: 5,
      rows: 4,
      rocks: [
        { x: 2, y: 1 },
        { x: 1, y: 0 },
        { x: 4, y: 2 },
      ],
      soft: [],
      start: { x: 3, y: 1 },
      fish: [{ x: 4, y: 1 }],
      best: 1,
    };
    expect(solve(trap, trap.start).moves).toBe(1);
    expect(hasDeadEnd(trap)).toBe(true);
    expect(hasDeadEnd(tiny)).toBe(false);
  });

  it('levels 1–4 never strand the penguin, over 300 seeds', () => {
    for (const plan of PLANS.slice(0, 4)) {
      expect(plan.fair).toBe(true);
      for (let seed = 1; seed <= 300; seed++) {
        const p = makePuzzle(plan, new Rng(seed));
        expect(hasDeadEnd(p), `${plan.name} seed ${seed}`).toBe(false);
        expect(p.best).toBeGreaterThanOrEqual(plan.moves[0]);
        expect(p.best).toBeLessThanOrEqual(plan.moves[1]);
      }
    }
    // Soft snow and blocks keep their dead ends: undo is taught there.
    expect(PLANS.slice(4).some((plan) => plan.fair)).toBe(false);
  }, 30000);

  it('a level-1 round holds at most one single-slide pond, and still some', () => {
    const plan = PLANS[0];
    let singles = 0;
    for (let seed = 1; seed <= 300; seed++) {
      const rng = new Rng(seed);
      const round: SlidePuzzle[] = [];
      for (let i = 0; i < plan.puzzles; i++) round.push(makePuzzle(plan, rng, round));
      const ones = round.filter((p) => p.best === 1).length;
      expect(ones, `seed ${seed}`).toBeLessThanOrEqual(1);
      singles += ones;
    }
    expect(singles).toBeGreaterThan(50);
  }, 15000);

  it('seeded looks use every rock look and fish colour, and repeat for a seed', () => {
    const rocks = new Set<string>(),
      fish = new Set<string>();
    for (let seed = 1; seed <= 60; seed++) {
      const look = pickLook(new Rng(seed));
      expect(pickLook(new Rng(seed))).toEqual(look);
      rocks.add(look.rock);
      fish.add(look.fish);
    }
    expect([...rocks].sort()).toEqual([...ROCK_LOOKS].sort());
    expect([...fish].sort()).toEqual([...FISH_COLORS].sort());
  });
  it('level 10 has three fish, 5–8 slides, and no first slide that eats two, over 300 seeds', () => {
    const plan = PLANS[9];
    const bests = new Set<number>();
    for (let seed = 1; seed <= 300; seed++) {
      const p = makePuzzle(plan, new Rng(seed));
      expect(p.fish).toHaveLength(3);
      expect(p.best).toBeGreaterThanOrEqual(5);
      expect(p.best).toBeLessThanOrEqual(8);
      expect(solve(p, p.start).moves).toBe(p.best);
      expect(eatsTwoFromStart(p)).toBe(false);
      bests.add(p.best);
    }
    // The ponds vary in length, not one fixed route size.
    expect(bests.size).toBeGreaterThan(1);
  }, 15000);

  it('a first slide past two fish counts as eating two from the start', () => {
    const p: SlidePuzzle = {
      cols: 5,
      rows: 3,
      rocks: [],
      soft: [],
      start: { x: 0, y: 0 },
      fish: [
        { x: 1, y: 0 },
        { x: 3, y: 0 },
        { x: 0, y: 2 },
      ],
      best: 0,
    };
    expect(eatsTwoFromStart(p)).toBe(true);
    expect(
      eatsTwoFromStart({
        ...p,
        fish: [
          { x: 1, y: 0 },
          { x: 3, y: 1 },
          { x: 0, y: 2 },
        ],
      }),
    ).toBe(false);
  });
});

describe('Penguin Slide level 11, Where will it stop?', () => {
  const plan = PLANS[10];
  const same = (a: Cell, b: Cell) => a.x === b.x && a.y === b.y;

  it('is a small one-fish prediction pond, two ponds a round', () => {
    expect(plan.predict).toBe(true);
    expect([plan.cols, plan.rows, plan.fish, plan.rocks, plan.soft, plan.blocks ?? 0, plan.puzzles]).toEqual([
      5, 4, 1, 3, 0, 0, 2,
    ]);
  });

  it('shows three slides that each really move the penguin, the fish eaten only on the last', () => {
    for (let seed = 1; seed <= 300; seed++) {
      const { puzzle: p, slides } = makePrediction(plan, new Rng(seed));
      expect(slides).toHaveLength(PREDICTIONS);
      expect(p.fish).toHaveLength(1);
      expect(p.rocks).toHaveLength(3);
      // Nothing stacked: the start, rocks and fish are all different cells.
      const cells = [p.start, ...p.rocks, ...p.fish].map((c) => `${c.x},${c.y}`);
      expect(new Set(cells).size).toBe(cells.length);
      let at = p.start;
      slides.forEach((s, i) => {
        expect(s.from).toEqual(at);
        const m = move(p, at, s.dir);
        expect(m, `seed ${seed} slide ${i}`).not.toBeNull();
        expect(m!.passed.length).toBeGreaterThan(0); // a slide, never a bump
        expect(m!.to).toEqual(s.to);
        expect(eaten(p, m!.passed)).toBe(i === PREDICTIONS - 1 ? 1 : 0);
        if (i > 0) expect(s.dir).not.toBe((slides[i - 1].dir + 2) % 4); // never straight back
        at = s.to;
      });
    }
  });

  it('stops beyond the cell beside the penguin in at least two of three slides', () => {
    for (let seed = 1; seed <= 300; seed++) {
      const { slides } = makePrediction(plan, new Rng(seed));
      expect(slides.filter((s) => !same(s.to, beside(s.from, s.dir))).length).toBeGreaterThanOrEqual(2);
    }
  });

  it('names what stopped each slide: a rock beside the stop, or the edge', () => {
    for (let seed = 1; seed <= 100; seed++) {
      const { puzzle: p, slides } = makePrediction(plan, new Rng(seed));
      for (const s of slides) {
        const stop = stopper(p, s.to, s.dir);
        const next = beside(s.to, s.dir);
        const off = next.x < 0 || next.y < 0 || next.x >= p.cols || next.y >= p.rows;
        if (stop.kind === 'rock')
          expect(p.rocks.some((r) => same(r, stop.cell)) && same(stop.cell, next)).toBe(true);
        else expect(off).toBe(true);
      }
    }
  });

  it('takes a tap anywhere on a whole 100-unit cell as that cell, clamped to the pond', () => {
    const p = { cols: 5, rows: 4 };
    expect(cellAt(p, 0, 0, 100)).toEqual({ x: 0, y: 0 });
    expect(cellAt(p, 99, 199, 100)).toEqual({ x: 0, y: 1 });
    expect(cellAt(p, 250, 350, 100)).toEqual({ x: 2, y: 3 });
    expect(cellAt(p, -12, 510, 100)).toEqual({ x: 0, y: 3 }); // the white rim
    expect(cellAt(p, 512, -10, 100)).toEqual({ x: 4, y: 0 });
  });

  it('varies the ponds by seed', () => {
    const boards = new Set(
      Array.from({ length: 30 }, (_, i) => JSON.stringify(makePrediction(plan, new Rng(i + 1)))),
    );
    expect(boards.size).toBeGreaterThan(25);
  });
});

describe('Penguin Slide level 12, A block onto the star', () => {
  const plan = PLANS[11];
  const same = (a: Cell, b: Cell) => a.x === b.x && a.y === b.y;

  it('solved needs every fish eaten and every star covered by a block', () => {
    const base: SlidePuzzle = {
      cols: 4,
      rows: 1,
      rocks: [],
      soft: [],
      start: { x: 0, y: 0 },
      fish: [{ x: 3, y: 0 }],
      best: 0,
    };
    expect(solved(base, 0, [])).toBe(false);
    expect(solved(base, 1, [])).toBe(true); // no stars: fish only
    const starry: SlidePuzzle = { ...base, fish: [], stars: [{ x: 2, y: 0 }] };
    expect(solved(starry, 0, [{ x: 1, y: 0 }])).toBe(false); // block off the star
    expect(solved(starry, 0, [])).toBe(false);
    expect(solved(starry, 0, [{ x: 2, y: 0 }])).toBe(true);
    expect(solved({ ...starry, fish: base.fish }, 0, [{ x: 2, y: 0 }])).toBe(false); // star covered but fish not eaten
    expect(solved({ ...starry, fish: base.fish }, 1, [{ x: 2, y: 0 }])).toBe(true);
  });

  it('a one-fish pond with no stars still solves as before', () => {
    expect(solve(tiny, tiny.start)).toEqual({ moves: 3, first: 1 });
  });

  it('is a star-and-block plan with no fish', () => {
    expect([plan.fish, plan.soft, plan.rocks, plan.blocks, plan.stars, plan.puzzles]).toEqual([
      0, 1, 3, 1, 1, 2,
    ]);
    expect(plan.moves).toEqual([3, 6]);
  });

  it('every pond over 300 seeds is valid, needs the block pushed and the snow, and the hint arrow leads to the star', () => {
    for (let seed = 1; seed <= 300; seed++) {
      const p = makePuzzle(plan, new Rng(seed));
      const at = `seed ${seed}`;
      expect(p.best, at).toBeGreaterThanOrEqual(3);
      expect(p.best, at).toBeLessThanOrEqual(6);
      expect(solve(p, p.start).moves, at).toBe(p.best);
      expect(p.fish, at).toHaveLength(0);
      expect(p.stars, at).toHaveLength(1);
      expect(p.blocks, at).toHaveLength(1);
      const star = p.stars![0];
      expect(
        [...p.rocks, ...p.soft, ...p.blocks!, p.start].some((c) => same(c, star)),
        at,
      ).toBe(false);
      const all = [p.start, ...p.rocks, ...p.soft, ...p.blocks!, star].map((c) => `${c.x},${c.y}`);
      expect(new Set(all).size, at).toBe(all.length);
      // A frozen block can never reach the star (it starts elsewhere), so the block must be pushed.
      expect(solve({ ...p, rocks: [...p.rocks, ...p.blocks!], blocks: [] }, p.start).moves, at).toBe(-1);
      // The soft snow matters.
      expect(solve({ ...p, soft: [] }, p.start).moves, at).not.toBe(p.best);
      // Follow the hint arrow: ends solved in exactly `best` moves, each step one closer.
      let pos = p.start,
        have = 0,
        blocks = p.blocks!,
        used = 0;
      while (!solved(p, have, blocks) && used < 40) {
        const { first, moves } = solve(p, pos, have, blocks);
        expect(moves, at).toBe(p.best - used);
        expect(first, at).toBeGreaterThanOrEqual(0);
        const m = move(p, pos, first as Dir, blocks)!;
        expect(m, at).not.toBeNull();
        have |= eaten(p, m.passed);
        pos = m.to;
        blocks = m.blocks;
        used++;
      }
      expect(used, at).toBe(p.best);
      expect(solved(p, have, blocks), at).toBe(true);
      expect(same(blocks[0], star), at).toBe(true);
    }
  }, 30000);

  it('is the school ladder after level 10, with 12 then 13 last, and level 11 stays out of it', () => {
    const range = penguinSlide.levels('school');
    expect(range.max).toBe(13);
    const order = levelsInOrder(range);
    expect(order.indexOf(12)).toBe(order.indexOf(10) + 1);
    expect(order.indexOf(13)).toBe(order.indexOf(12) + 1);
    expect(order).not.toContain(11);
    expect(order[order.length - 1]).toBe(13);
  });

  it('level 13 puts a second penguin on the pond and needs both of them', () => {
    const plan = PLANS[12];
    expect(plan.pal).toBe(true);
    const same = (a: Cell, b: Cell) => a.x === b.x && a.y === b.y;
    for (let seed = 1; seed <= 300; seed++) {
      const at = `seed ${seed}`;
      const p = makePuzzle(plan, new Rng(seed));
      const pal = p.pal!;
      expect(pal, at).toBeDefined();
      expect(p.best, at).toBeGreaterThanOrEqual(4);
      expect(p.best, at).toBeLessThanOrEqual(7);
      expect(solvePair(p, [p.start, pal]).moves, at).toBe(p.best);
      expect(
        [...p.rocks, ...p.fish, p.start].some((c) => same(c, pal)),
        at,
      ).toBe(false);
      // Each penguin alone, with the other frozen like a rock, is stuck or slower.
      for (const m of alone(p)) expect(m === -1 || m > p.best, at).toBe(true);
      // Following the hint step by step eats every fish in exactly `best` slides, and switches penguin.
      let spots: Cell[] = [p.start, pal];
      let have = 0;
      let used = 0;
      const whos: number[] = [];
      while (!solved(p, have, [])) {
        const { first } = solvePair(p, spots, have);
        expect(first, at).not.toBeNull();
        const m = movePair(p, spots, first!.who, first!.dir)!;
        expect(m, at).not.toBeNull();
        have |= eaten(p, m.passed);
        spots = m.spots;
        whos.push(first!.who);
        used++;
        expect(used, at).toBeLessThanOrEqual(p.best);
      }
      expect(used, at).toBe(p.best);
      expect(
        whos.some((w) => w !== whos[0]),
        at,
      ).toBe(true);
      // A penguin never lands on or slides through the other one.
      for (const who of [0, 1] as const) {
        for (const dir of [0, 1, 2, 3] as Dir[]) {
          const from = [p.start, pal];
          const other = from[1 - who];
          const m = movePair(p, from, who, dir);
          if (same(beside(from[who], dir), other)) expect(m, at).toBeNull();
          if (m) {
            expect(same(m.spots[who], other), at).toBe(false);
            expect(
              m.passed.some((c) => same(c, other)),
              at,
            ).toBe(false);
            expect(same(m.spots[1 - who], other), at).toBe(true);
          }
        }
      }
    }
  }, 60000);
});
