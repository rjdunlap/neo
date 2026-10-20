import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { computeView } from '../../engine/view';
import { BOARDS } from './puzzles';
import {
  canonical, greedy, hintMove, HIT_W, jarLayout, legal, matLabels, move, moves, parse, PLANS, planFor, present, refusal, render, search, solve, solved,
  uniformFull, UNDO_INSET, type Board, type Labels,
} from './logic';

const VIEWS = {
  landscape: computeView(1024, 768),
  portrait: computeView(768, 1024),
  phone: computeView(844, 390),
  notch: computeView(844, 390, { top: 0, right: 47, bottom: 21, left: 47 }),
};

const count = (b: Board) => b.reduce((n, j) => n + j.length, 0);

/** Boards she could reach by wandering from a frozen board: a seeded random walk of legal moves, with the walk so far. */
function walk(b: Board, cap: number, steps: number, rng: Rng): { board: Board; history: Board[] } {
  const history: Board[] = [];
  let board = b;
  for (let i = 0; i < steps; i++) {
    const all = moves(board, cap);
    if (!all.length) break;
    const m = rng.pick(all);
    history.push(board);
    board = move(board, m.from, m.to);
  }
  return { board, history };
}

describe('Jar Sort rules', () => {
  it('moves only the top piece, onto the same kind or into an empty jar with room', () => {
    const b = parse('01|1|0|');
    expect(legal(b, 2, 0, 1)).toBe(true); // blueberry onto blueberry
    expect(legal(b, 2, 0, 2)).toBe(false); // blueberry onto strawberry
    expect(refusal(b, 2, 0, 2)).toBe('kind');
    expect(legal(b, 2, 0, 3)).toBe(true); // into the empty jar
    expect(legal(b, 2, 3, 0)).toBe(false); // nothing to lift
    expect(legal(b, 2, 0, 0)).toBe(false);
    const full = parse('01|11|1');
    expect(refusal(full, 2, 2, 1)).toBe('full');
    expect(refusal(full, 2, 0, 2)).toBeNull();
    const after = move(b, 0, 1);
    expect(render(after)).toBe('0|11|0|');
    expect(render(b)).toBe('01|1|0|'); // the old board is untouched, so undo is the board before
    expect(count(after)).toBe(count(b));
  });

  it('is solved when every jar is empty or full of one kind, and with mats when each kind is on its own', () => {
    expect(solved(parse('00|11|'), 2)).toBe(true);
    expect(solved(parse('0|011|'), 2)).toBe(false);
    expect(solved(parse('00|1|1'), 2)).toBe(false);
    const labels: Labels = [0, 1, null];
    expect(solved(parse('00|11|'), 2, labels)).toBe(true);
    expect(solved(parse('11|00|'), 2, labels)).toBe(false);
    expect(solved(parse('00||11'), 2, labels)).toBe(false); // the blueberries finished in the spare jar, not on their mat
  });

  it('solves level 1 the way the definition walks it', () => {
    expect(solve(parse(BOARDS[1][0]), 2)).toHaveLength(2);
    expect(solve(parse(BOARDS[1][1]), 2)).toHaveLength(3);
    expect(BOARDS[1]).toHaveLength(2);
  });

  it('keeps a frozen list where every board is well formed, solvable and inside its par range', () => {
    for (const plan of PLANS) {
      const list = BOARDS[plan.id];
      if (plan.id > 1) expect(list.length, `level ${plan.id}`).toBeGreaterThanOrEqual(12);
      const labels = matLabels(plan);
      for (const s of list) {
        const b = parse(s);
        expect(b, s).toHaveLength(plan.jars);
        expect(b.every((j) => j.length <= plan.cap), s).toBe(true);
        for (let k = 0; k < plan.kinds; k++) expect(b.flat().filter((x) => x === k), `${s} kind ${k}`).toHaveLength(plan.cap);
        expect(b.flat().every((k) => k >= 0 && k < plan.kinds), s).toBe(true);
        expect(b.some((j) => uniformFull(j, plan.cap)), `${s} starts with a finished jar`).toBe(false);
        const path = solve(b, plan.cap, labels);
        expect(path, s).not.toBeNull();
        expect(path!.length, `${s} at level ${plan.id}`).toBeGreaterThanOrEqual(plan.par[0]);
        expect(path!.length, `${s} at level ${plan.id}`).toBeLessThanOrEqual(plan.par[1]);
        // The path is real: replaying it on the real board finishes it.
        let at = b;
        for (const m of path!) {
          expect(legal(at, plan.cap, m.from, m.to)).toBe(true);
          at = move(at, m.from, m.to);
        }
        expect(solved(at, plan.cap, labels)).toBe(true);
      }
      expect(new Set(list.map((s) => canonical(parse(s), labels))).size, `level ${plan.id} repeats a board`).toBe(list.length);
    }
  });

  it('gives level 6 boards that the obvious same-kind-first player cannot finish', () => {
    const plan = planFor(6);
    for (const s of BOARDS[6]) expect(greedy(parse(s), plan.cap), s).toBe(false);
    // The obvious player does finish an easy board, so the check means something.
    expect(greedy(parse(BOARDS[1][0]), 2)).toBe(true);
  });

  it('keeps the shortest length when a round renames kinds and shuffles jars, and a seed repeats itself', () => {
    for (const plan of PLANS) {
      const labels = matLabels(plan);
      for (const s of BOARDS[plan.id].slice(0, 4)) {
        const fewest = solve(parse(s), plan.cap, labels)!.length;
        const a = present(s, plan, new Rng(7));
        const b = present(s, plan, new Rng(7));
        expect(render(a.board)).toBe(render(b.board));
        expect(solve(a.board, plan.cap, a.labels)!.length, s).toBe(fewest);
        if (plan.labels) {
          expect(a.labels!.filter((k) => k !== null)).toHaveLength(plan.kinds);
          expect(new Set(a.labels!.filter((k) => k !== null)).size).toBe(plan.kinds);
        }
      }
    }
    // Level 1 stays as authored.
    expect(render(present(BOARDS[1][0], planFor(1), new Rng(3)).board)).toBe(BOARDS[1][0]);
  });

  it('hints a legal move that brings the board one move closer, from boards she could wander to', () => {
    const rng = new Rng(11);
    for (const plan of PLANS) {
      const labels = matLabels(plan);
      for (const s of BOARDS[plan.id].slice(0, 3)) {
        for (let w = 0; w < 4; w++) {
          const { board, history } = walk(parse(s), plan.cap, 1 + w * 3, rng);
          if (solved(board, plan.cap, labels)) continue;
          const before = search(board, plan.cap, labels);
          const hint = hintMove(board, plan.cap, labels, history);
          if (!Array.isArray(before)) {
            expect(hint.kind, `${render(board)}`).not.toBe('move');
            continue;
          }
          expect(hint.kind).toBe('move');
          if (hint.kind !== 'move') continue;
          expect(legal(board, plan.cap, hint.move.from, hint.move.to)).toBe(true);
          const after = solve(move(board, hint.move.from, hint.move.to), plan.cap, labels)!;
          expect(after.length).toBe(before.length - 1);
        }
      }
    }
  });

  it('runs the worst top-level search well under the cap, and falls back to taking moves back past it', () => {
    let worst = 0, slowest = 0;
    for (const plan of PLANS.slice(4)) {
      const labels = matLabels(plan);
      for (const s of BOARDS[plan.id]) {
        const t = performance.now();
        expect(Array.isArray(search(parse(s), plan.cap, labels))).toBe(true);
        slowest = Math.max(slowest, performance.now() - t);
        worst = Math.max(worst, slowest);
      }
    }
    // 93 ms on the developer's Mac, 2026-10-20; the target is under 150 ms, and a generous bound keeps a busy machine from failing it.
    console.log(`Jar Sort slowest frozen-board search: ${slowest.toFixed(0)} ms`);
    expect(slowest).toBeLessThan(1500);
    // Past the cap: never nothing, always some moves back, no more than she made.
    const plan = planFor(7);
    const { board, history } = walk(parse(BOARDS[7][0]), plan.cap, 6, new Rng(5));
    const hint = hintMove(board, plan.cap, undefined, history, 5);
    expect(hint.kind).toBe('back');
    if (hint.kind === 'back') {
      expect(hint.steps).toBeGreaterThanOrEqual(1);
      expect(hint.steps).toBeLessThanOrEqual(history.length);
    }
  });

  it('keeps a hint quick from long wanders on the big boards', () => {
    const rng = new Rng(23);
    let slowest = 0, backs = 0;
    for (const plan of PLANS.slice(4)) {
      const labels = matLabels(plan);
      for (const s of BOARDS[plan.id].slice(0, 4)) {
        const { board, history } = walk(parse(s), plan.cap, 30 + rng.int(0, 10), rng);
        if (solved(board, plan.cap, labels)) continue;
        const t = performance.now();
        const hint = hintMove(board, plan.cap, labels, history);
        slowest = Math.max(slowest, performance.now() - t);
        if (hint.kind === 'back') backs++;
      }
    }
    console.log(`Jar Sort slowest hint after a long wander: ${slowest.toFixed(0)} ms, ${backs} fell back to undo`);
    expect(backs).toBe(0);
    expect(slowest).toBeLessThan(1500);
  });

  it('calls a board with no move, or no way out, stuck; a move back from there can still finish', () => {
    const stuck = parse('01|10');
    expect(moves(stuck, 2)).toHaveLength(0);
    expect(hintMove(stuck, 2, undefined, [parse('0|10|1')]).kind).toBe('stuck');
    expect(search(stuck, 2)).toBe('none');
    // One piece fewer in the way: the board before it has a way out.
    expect(solve(parse('0|1|01|'), 2)).not.toBeNull();
  });
});

describe('Jar Sort layout', () => {
  it('fits every level at every view: big separate jars, clear of the pet and the round arrow, inside the screen', () => {
    for (const plan of PLANS) {
      for (const [name, v] of Object.entries(VIEWS)) {
        const spots = jarLayout(plan.jars, plan.cap, v);
        const where = `level ${plan.id} ${name}`;
        expect(spots, where).toHaveLength(plan.jars);
        for (const [i, s] of spots.entries()) {
          const h = s.hit;
          expect(h.w, where).toBeGreaterThanOrEqual(HIT_W);
          expect(h.h, where).toBeGreaterThanOrEqual(140 - 36); // a capacity-2 jar is 140 tall with its rim
          expect(h.x, where).toBeGreaterThanOrEqual(0);
          expect(h.x + h.w, where).toBeLessThanOrEqual(v.w);
          expect(h.y, where).toBeGreaterThanOrEqual(110);
          // Room for level 8's mat under the jar.
          expect(s.y + 30, where).toBeLessThanOrEqual(v.h);
          // The pet's corner: the bottom-left 150 by 220.
          expect(h.x >= 150 || h.y + h.h <= v.h - 220, `${where} jar ${i} in the pet's corner`).toBe(true);
          // The round arrow: a 54 circle 80 in from the bottom-right corner.
          const ux = v.w - UNDO_INSET, uy = v.h - UNDO_INSET;
          const clear = h.x + h.w <= ux - 54 || h.y + h.h <= uy - 54;
          expect(clear, `${where} jar ${i} under the round arrow`).toBe(true);
          for (const o of spots.slice(i + 1)) {
            const apart = h.x + h.w <= o.hit.x || o.hit.x + o.hit.w <= h.x || h.y + h.h <= o.hit.y || o.hit.y + o.hit.h <= h.y;
            expect(apart, `${where} jars overlap`).toBe(true);
          }
        }
      }
    }
    // The definition's arithmetic: six jars in one row on a sideways iPad, seven in two. Held upright the view is still 1024
    // wide (it grows taller instead), so the rows are the same.
    for (const v of [VIEWS.landscape, VIEWS.portrait]) {
      expect(new Set(jarLayout(6, 4, v).map((s) => s.y)).size).toBe(1);
      expect(new Set(jarLayout(7, 4, v).map((s) => s.y)).size).toBe(2);
    }
  });
});
