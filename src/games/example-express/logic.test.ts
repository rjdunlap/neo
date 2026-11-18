import { describe, it, expect } from 'vitest';
import {
  PARCELS,
  RULES,
  fit,
  predict,
  seed,
  accepted,
  valid,
  solution,
  apply,
  actions,
  Round,
  SHELF,
  tray,
  shelfIds,
  consistent,
  requested,
  LEVELS,
  type Board,
  type Dock,
} from './logic';
const dock = (n: number): Dock => (n ? 'house' : 'tree');
const expected = [
  ['tree', 'tree', 'tree', 'tree', 'house', 'house', 'house', 'house'],
  ['house', 'house', 'house', 'house', 'tree', 'tree', 'tree', 'tree'],
  ['tree', 'tree', 'house', 'house', 'tree', 'tree', 'house', 'house'],
  ['house', 'house', 'tree', 'tree', 'house', 'house', 'tree', 'tree'],
  ['tree', 'house', 'tree', 'house', 'tree', 'house', 'tree', 'house'],
  ['house', 'tree', 'house', 'tree', 'house', 'tree', 'house', 'tree'],
];
function allStates(level: number) {
  const result = [seed(level)],
    seen = new Set([JSON.stringify(result[0])]);
  for (let i = 0; i < result.length; i++)
    for (const a of actions(level, result[i])) {
      const next = apply(result[i], a),
        k = JSON.stringify(next);
      if (!seen.has(k)) {
        result.push(next);
        seen.add(k);
      }
    }
  return result;
}
describe('finite Example Express D2 model', () => {
  it('has the exact eight parcels and all six predicates in permanent order', () => {
    expect(PARCELS.map((p) => [p.color, p.shape, p.stamp])).toEqual([
      ['blue', 'circle', 'leaf'],
      ['blue', 'circle', 'star'],
      ['blue', 'square', 'leaf'],
      ['blue', 'square', 'star'],
      ['yellow', 'circle', 'leaf'],
      ['yellow', 'circle', 'star'],
      ['yellow', 'square', 'leaf'],
      ['yellow', 'square', 'star'],
    ]);
    expect(RULES).toHaveLength(6);
    for (let r = 0; r < 6; r++) expect(PARCELS.map((p) => predict(r, p.id))).toEqual(expected[r]);
  });
  it('minimizes disagreement and breaks ties by index, ignoring empty/unlabelled slots and order', () => {
    expect(fit([null, { id: 0, dock: null }])).toBeNull();
    // Independent truth table is the oracle for every 1–4-card dataset, including noise.
    for (let mask = 1; mask < 256; mask++) {
      const ids = PARCELS.filter((p) => (mask >> p.id) & 1).map((p) => p.id);
      if (ids.length > 4) continue;
      for (let labels = 0; labels < 1 << ids.length; labels++) {
        const b = ids.map((id, i) => ({ id, dock: dock((labels >> i) & 1) }));
        const errors = expected.map((row) => b.reduce((n, e) => n + Number(row[e.id] !== e.dock), 0));
        expect(fit(b)).toBe(errors.indexOf(Math.min(...errors)));
        expect(fit([...b].reverse())).toBe(fit(b));
      }
    }
  });
  it('accepts only the correct L1 pair and all ten L2 repairs in either slot order', () => {
    for (const [a, b, r] of [
      [0, 0, 1],
      [0, 1, 2],
      [1, 0, 0],
      [1, 1, 0],
    ]) {
      const board = seed(1);
      board[2]!.dock = dock(a);
      board[3]!.dock = dock(b);
      expect(fit(board)).toBe(r);
      expect(accepted(1, board)).toBe(a === 0 && b === 1);
    }
    let count = 0;
    for (let mask = 0; mask < 16; mask++) {
      const ids = SHELF.filter((_, i) => (mask >> i) & 1);
      if (ids.length > 2) continue;
      const b = seed(2);
      ids.forEach((id, i) => (b[i + 2] = { id, dock: id === 4 || id === 5 ? 'tree' : 'house' }));
      expect(accepted(2, b)).toBe(ids.length > 0);
      if (ids.length) {
        count++;
        expect(fit(b)).toBe(2);
      }
      expect(accepted(2, [b[0], b[1], b[3], b[2]])).toBe(ids.length > 0);
    }
    expect(count).toBe(10);
    expect(predict(fit(seed(2))!, 4)).toBe('house');
  });
  it('enforces locked examples, uniqueness, fixed L1 identities, capacity and prelabelled shelf', () => {
    for (const level of [1, 2]) {
      const b = seed(level);
      expect(valid(level, b)).toBe(true);
      expect(valid(level, [...b, null])).toBe(false);
      const locked = structuredClone(b);
      locked[0]!.dock = 'house';
      expect(valid(level, locked)).toBe(false);
      const duplicate = structuredClone(b);
      duplicate[2] = { id: 0, dock: 'tree' };
      expect(valid(level, duplicate)).toBe(false);
    }
    const b = seed(1);
    b[2] = { id: 4, dock: 'tree' };
    expect(valid(1, b)).toBe(false);
    const c = seed(2);
    c[2] = { id: 4, dock: 'house' };
    expect(valid(2, c)).toBe(false);
    c[2] = { id: 1, dock: 'tree' };
    expect(valid(2, c)).toBe(false);
  });
  it('shortest help decreases remaining distance from every legal physical D2 state, without replacing fit', () => {
    const l1 = allStates(1),
      l2 = allStates(2);
    expect(l1).toHaveLength(9);
    expect(l2).toHaveLength(21);
    for (const [level, states] of [
      [1, l1],
      [2, l2],
    ] as const)
      for (const board of states) {
        const path = solution(level, board);
        expect(path.length).toBeLessThanOrEqual(2);
        if (!accepted(level, board)) {
          expect(path.length).toBeGreaterThan(0);
          const next = apply(board, path[0]);
          expect(solution(level, next)).toHaveLength(path.length - 1);
          expect(valid(level, next)).toBe(true);
          // BFS depth 1 oracle ensures no extra step where one change suffices.
          if (actions(level, board).some((a) => accepted(level, apply(board, a))))
            expect(path).toHaveLength(1);
        }
        let b = board;
        for (const a of path) b = apply(b, a);
        expect(accepted(level, b)).toBe(true);
      }
  });
});
describe('round accounting and cancellation', () => {
  function intro(r: Round) {
    r.begin('intro');
    r.complete();
  }
  it('free surprise, Test, edits, Undo, Reset and cancelled Check never count; a completed failed Check counts once', () => {
    const r = new Round(2);
    expect(r.edit({ slot: 2, example: { id: 4, dock: 'tree' } })).toBe(false);
    const trace = r.begin('intro');
    expect(trace).toEqual([{ id: 4, actual: 'house', required: 'tree' }]);
    r.stop();
    expect(r.surpriseSeen).toBe(false);
    intro(r);
    for (let i = 0; i < 3; i++) {
      r.begin('test', 4);
      r.complete();
    }
    expect([r.misses, r.hints, r.tests]).toEqual([0, 0, 3]);
    expect(r.rule).toBe(0);
    r.begin('check');
    expect(r.begin('check')).toBeNull();
    expect(r.edit({ slot: 2, example: { id: 4, dock: 'tree' } })).toBe(false);
    r.stop();
    expect(r.complete()).toBeNull();
    expect(r.misses).toBe(0);
    r.begin('check');
    const result = r.complete();
    expect(result?.first).toEqual({ id: 4, actual: 'house', required: 'tree' });
    expect(r.misses).toBe(1);
    expect(r.complete()).toBeNull();
    expect(r.glow).toBeUndefined();
    r.begin('check');
    r.complete();
    expect([r.misses, r.hints]).toEqual([2, 0]);
    expect(r.glow).toBeDefined();
    const useful = r.glow;
    expect(useful).toEqual(solution(2, r.board)[0]);
    r.help();
    expect([r.misses, r.hints, r.rule]).toEqual([2, 1, 2]);
    expect(r.glow).toBeUndefined();
    r.help();
    expect(r.hints).toBe(1);
    r.undo();
    expect(r.rule).toBe(0);
    expect(r.surpriseSeen).toBe(true);
    r.reset();
    expect([r.misses, r.hints, r.failures]).toEqual([2, 1, 2]);
  });
  it('incomplete deliberate checks have no invented route and count once; support terminates and finish is once only', () => {
    const r = new Round(1);
    expect(r.begin('check')?.every((t) => t.actual === null)).toBe(true);
    r.complete();
    expect(r.misses).toBe(1);
    r.help();
    r.help();
    expect([r.hints, r.rule]).toEqual([2, 2]);
    expect(r.finish()).toBeNull();
    r.begin('check');
    r.complete();
    expect(r.qualified).toBe(true);
    r.edit({ slot: 2, example: { id: 5, dock: 'house' } });
    expect(r.qualified).toBe(false);
    r.undo();
    expect(r.qualified).toBe(false);
    r.begin('check');
    r.complete();
    expect(r.finish()).toEqual({ misses: 1, hints: 2 });
    expect(r.finish()).toBeNull();
    expect(r.begin('check')).toBeNull();
  });
  it('destroy abandons pending verdict and rejects further actions', () => {
    const r = new Round(1);
    r.begin('check');
    r.destroy();
    expect(r.complete()).toBeNull();
    expect(r.misses).toBe(0);
    expect(r.reset()).toBe(false);
    expect(r.help()).toBeNull();
  });
});

describe('level 3, Choose the lesson', () => {
  type Card = { id: number; dock: Dock };
  // Independent oracle: the truth table above picks the rule, never the game's own fit().
  const rule = (cards: Card[]) => {
    const errors = expected.map((row) => cards.reduce((n, e) => n + Number(row[e.id] !== e.dock), 0));
    return errors.indexOf(Math.min(...errors));
  };
  const passes = (cards: Card[]) => cards.length > 0 && rule(cards) === 2;
  const sets: Card[][] = [];
  for (let mask = 0; mask < 256; mask++) {
    const ids = PARCELS.filter((p) => (mask >> p.id) & 1).map((p) => p.id);
    if (ids.length > 4) continue;
    for (let labels = 0; labels < 1 << ids.length; labels++)
      sets.push(ids.map((id, i) => ({ id, dock: dock((labels >> i) & 1) })));
  }
  const name = (cards: Card[]) =>
    [...cards]
      .sort((a, b) => a.id - b.id)
      .map((e) => `${e.id}${e.dock[0]}`)
      .join(' ');
  const board = (cards: Card[]): Board => [0, 1, 2, 3].map((i) => (cards[i] ? { ...cards[i] } : null));
  const clean = (cards: Card[]) => cards.every((e) => e.dock === requested(e.id));
  // Distance to the nearest passing lesson over unordered sets: remove, relabel, or insert below four.
  const far = new Map<string, number>(),
    cleanFar = new Map<string, number>();
  for (const [table, goal] of [
    [far, passes],
    [cleanFar, (c: Card[]) => passes(c) && clean(c)],
  ] as const) {
    const byName = new Map(sets.map((c) => [name(c), c]));
    const queue = sets.filter(goal);
    for (const c of queue) table.set(name(c), 0);
    for (let i = 0; i < queue.length; i++) {
      const c = queue[i],
        d = table.get(name(c))!;
      const near: Card[][] = [];
      c.forEach((e, j) => {
        near.push(c.filter((_, k) => k !== j));
        near.push(c.map((o, k) => (k === j ? { id: e.id, dock: e.dock === 'tree' ? 'house' : 'tree' } : o)));
      });
      if (c.length < 4)
        for (const p of PARCELS)
          if (!c.some((e) => e.id === p.id))
            for (const k of [0, 1]) near.push([...c, { id: p.id, dock: dock(k) }]);
      for (const n of near) {
        const key = name(n);
        if (!table.has(key)) {
          table.set(key, d + 1);
          queue.push(byName.get(key)!);
        }
      }
    }
  }
  it('opens school level 3 with four empty slots, the whole shelf and the practice tray', () => {
    expect(LEVELS.school).toEqual({ min: 1, max: 3 });
    expect(seed(3)).toEqual([null, null, null, null]);
    expect(tray(3)).toEqual([0, 3, 5, 6]);
    expect(tray(3).map(requested)).toEqual(['tree', 'house', 'tree', 'house']);
    expect(shelfIds(3)).toEqual([0, 1, 2, 3, 4, 5, 6, 7]);
    expect(shelfIds(2)).toEqual(SHELF);
    expect(new Round(3).surpriseSeen).toBe(true);
    expect(new Round(7).level).toBe(3);
  });
  it('accepts exactly the 212 lessons that fit the shape rule, in any slots, noisy labels included', () => {
    const counts = [0, 0, 0, 0, 0],
      cleanCounts = [0, 0, 0, 0, 0];
    for (const cards of sets) {
      const b = board(cards);
      expect(accepted(3, b)).toBe(passes(cards));
      // Passing the visible tray and fitting the shape rule are the same thing.
      const r = fit(b);
      expect(accepted(3, b)).toBe(r !== null && tray(3).every((id) => expected[r][id] === requested(id)));
      expect(accepted(3, [...b].reverse())).toBe(passes(cards));
      expect(consistent(b)).toBe(clean(cards));
      if (passes(cards)) {
        counts[cards.length]++;
        if (clean(cards)) cleanCounts[cards.length]++;
      }
    }
    expect(counts).toEqual([0, 0, 16, 48, 148]);
    expect(cleanCounts).toEqual([0, 0, 16, 48, 68]);
    // A lesson with one label against the request still passes: the sorter used shape.
    const noisy: Board = [
      { id: 0, dock: 'tree' },
      { id: 1, dock: 'tree' },
      { id: 2, dock: 'house' },
      { id: 7, dock: 'tree' },
    ];
    expect([fit(noisy), accepted(3, noisy), consistent(noisy)]).toEqual([2, true, false]);
  });
  it('keeps parcels unique within four slots, lets any slot change, and holds a waiting card out of the fit', () => {
    expect(valid(3, [{ id: 0, dock: 'tree' }, { id: 0, dock: 'house' }, null, null])).toBe(false);
    expect(valid(3, [null, null, null, null, null])).toBe(false);
    expect(valid(3, [{ id: 8, dock: 'tree' }, null, null, null])).toBe(false);
    const waiting: Board = [{ id: 0, dock: 'tree' }, { id: 2, dock: 'house' }, { id: 5, dock: null }, null];
    expect(valid(3, waiting)).toBe(true);
    expect(fit(waiting)).toBe(2);
    expect(accepted(3, waiting)).toBe(false);
    expect(solution(3, waiting)).toEqual([{ slot: 2, example: null }]);
    const full: Board = [0, 1, 2, 3].map((id) => ({ id, dock: 'tree' as Dock }));
    expect(actions(3, full).every((a) => a.example === null || a.example.id === full[a.slot]!.id)).toBe(true);
    expect(actions(3, seed(3))).toHaveLength(4 * 16);
    const r = new Round(3);
    expect(r.edit({ slot: 0, example: { id: 0, dock: null } })).toBe(true);
    expect(r.rule).toBeNull();
    expect(r.edit({ slot: 1, example: { id: 0, dock: 'tree' } })).toBe(false);
    expect(r.edit({ slot: 0, example: { id: 0, dock: 'tree' } })).toBe(true);
    expect(r.edit({ slot: 0, example: { id: 0, dock: 'house' } })).toBe(true);
    expect(r.edit({ slot: 0, example: null })).toBe(true);
    expect(r.board).toEqual(seed(3));
  });
  it('Show me takes a shortest path from every lesson, to a request-labelled lesson when one is as near', () => {
    expect(solution(3, seed(3))).toEqual([
      { slot: 0, example: { id: 0, dock: 'tree' } },
      { slot: 1, example: { id: 2, dock: 'house' } },
    ]);
    let deepest = 0;
    for (const cards of sets) {
      const d = far.get(name(cards))!;
      deepest = Math.max(deepest, d);
      // Slot order must not change the distance: try the cards packed left and packed right.
      for (const b of [board(cards), board(cards).reverse()]) {
        const path = solution(3, b);
        expect(path).toHaveLength(d);
        let at = b;
        for (const [i, a] of path.entries()) {
          expect(actions(3, at)).toContainEqual(a);
          at = apply(at, a);
          expect(valid(3, at)).toBe(true);
          expect(solution(3, at)).toHaveLength(d - i - 1);
        }
        if (d) {
          expect(accepted(3, at)).toBe(true);
          if (cleanFar.get(name(cards)) === d) expect(consistent(at)).toBe(true);
        }
      }
    }
    expect(deepest).toBe(4);
  });
  it('counts an empty, a waiting and a failed Check once each, never a Test, and finishes once with help', () => {
    const r = new Round(3);
    expect(r.begin('test', 5)).toEqual([{ id: 5, actual: null, required: 'tree' }]);
    r.complete();
    expect(r.begin('check')?.every((t) => t.actual === null)).toBe(true);
    expect(r.complete()).toEqual({ kind: 'check', ok: false, first: null });
    expect([r.misses, r.hints, r.tests]).toEqual([1, 0, 1]);
    r.edit({ slot: 0, example: { id: 0, dock: 'tree' } });
    r.edit({ slot: 1, example: { id: 4, dock: 'house' } });
    expect(r.rule).toBe(0);
    r.begin('check');
    // Tray order 0, 3, 5, 6: the blue square is the first parcel the color rule sends wrong.
    expect(r.complete()?.first).toEqual({ id: 3, actual: 'tree', required: 'house' });
    expect([r.misses, r.failures]).toEqual([2, 2]);
    expect(r.glow).toEqual(solution(3, r.board)[0]);
    let steps = 0;
    while (r.help()) steps++;
    expect(steps).toBe(r.hints);
    expect(steps).toBeGreaterThan(0);
    expect(r.rule).toBe(2);
    expect(r.help()).toBeNull();
    expect(r.finish()).toBeNull();
    r.begin('check');
    expect(r.complete()?.ok).toBe(true);
    expect(r.finish()).toEqual({ misses: 2, hints: steps });
    expect(r.finish()).toBeNull();
  });
});
