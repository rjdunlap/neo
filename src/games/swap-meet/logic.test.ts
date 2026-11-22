import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { computeView } from '../../engine/view';
import {
  accepted,
  actions,
  CASES,
  deadEnd,
  goal,
  hint,
  hintLine,
  LEVELS,
  netTrades,
  routeReply,
  identity,
  layout,
  reachable,
  roundFor,
  solve,
  start,
  step,
  Tally,
  type Action,
  type Case,
  type State,
} from './logic';
const holds = (s: State) =>
  [...s.frame.basket.map((b) => b.hold), ...s.frame.friends.map((f) => f.hold)].sort();
/** Everything in the round but the purse: basket, friends and the stall's shelf, as a multiset. */
const goods = (s: State) =>
  [...holds(s), ...(s.frame.stall?.shelf ?? [])].filter((x) => x && x !== 'purse').sort();
/** Shortest whole round per level: level 6 is three trades with friends, then two at the stall. */
const SHORTEST: Record<number, number> = { 1: 3, 2: 2, 3: 2, 4: 2, 5: 3, 6: 5 };
const CAP: Record<number, number> = { 1: 3, 2: 2, 3: 2, 4: 2, 5: 3, 6: 3 };
/** Independent authored invariants catch bad transitions, not merely solver agreement. */
function valid(c: Case, s: State): boolean {
  const f = s.frame,
    original = c.stages[f.stage];
  if (JSON.stringify(goods(s)) !== JSON.stringify(goods({ frame: original, history: [] }))) return false;
  if (
    holds(s).filter((x) => x === 'purse').length +
      (s.frame.stall?.shelf.filter((x) => x === 'purse').length ?? 0) >
    1
  )
    return false;
  if (!goal(c, s) && new Set(holds(s)).size !== holds(s).length) return false;
  if (s.history.length > CAP[c.level]) return false;
  if (!!f.stall?.open !== (f.stage === 1 && c.level === 6)) return false;
  if (f.friends.some((t) => t.done && t.hold !== t.want)) return false;
  if (c.level === 3 && f.friends.filter((t) => t.done).length % 2) return false;
  if (
    c.level === 1 &&
    JSON.stringify(f.rewards) !== JSON.stringify(c.stages.slice(0, f.stage).map((st) => st.friends[0].hold))
  )
    return false;
  return true;
}
function expectedOffers(c: Case, s: State): Action[] {
  if (goal(c, s)) return [];
  const offers: Action[] = [];
  const stall = s.frame.stall;
  if (stall?.open) {
    if (s.frame.basket[0].hold !== 'purse') offers.push({ sell: true });
    else stall.shelf.forEach((x, buy) => x && offers.push({ buy }));
  }
  for (const to of s.frame.friends.filter((f) => !f.done)) {
    if (c.level === 3) {
      for (const from of s.frame.friends.filter((f) => !f.done && f.id !== to.id))
        if (from.hold === to.want && to.hold === from.want) offers.push({ from: from.id, to: to.id });
    } else
      s.frame.basket.forEach((b, i) => {
        if (b.active && b.hold === to.want) offers.push({ from: i, to: to.id });
      });
  }
  if (s.history.length) offers.push({ undo: true });
  return offers;
}
const keys = (xs: Action[]) => xs.map((a) => JSON.stringify(a)).sort();
describe('Swap Meet authored transactions and complete state graph', () => {
  for (const c of CASES)
    it(`${c.id}: all reachable states, independent conservation/acceptance, exact Undo and shortest hints`, () => {
      const initial = start(c),
        states = reachable(c),
        byKey = new Map(states.map((s) => [identity(s), s]));
      expect(solve(c, initial)?.length).toBe(SHORTEST[c.level]);
      const reverse = new Map<string, string[]>();
      for (const s of states) {
        expect(valid(c, s), identity(s)).toBe(true);
        expect(keys(actions(c, s))).toEqual(keys(expectedOffers(c, s)));
        if (c.level === 4 && goal(c, s)) {
          expect(s.frame.basket[0].hold).toBe(c.goal);
          expect(s.history.length).toBe(2);
        }
        for (const a of actions(c, s)) {
          const n = step(c, s, a);
          expect(valid(c, n)).toBe(true);
          expect(byKey.has(identity(n))).toBe(true);
          const prev = reverse.get(identity(n)) ?? [];
          prev.push(identity(s));
          reverse.set(identity(n), prev);
          const crossed = n.frame.stage !== s.frame.stage && c.level === 6,
            dropped = c.level === 6 && s.history.length === CAP[6];
          if (!('undo' in a) && !goal(c, n) && !crossed) {
            const back = step(c, n, { undo: true });
            // Level 6 drops the oldest entry past three, so trading back restores the frame but not that entry.
            if (dropped) expect(back.frame).toEqual(s.frame);
            else expect(back).toEqual(s);
          }
          if (crossed) expect(n.history).toEqual([]);
          if ('undo' in a) {
            expect(n.frame).toEqual(s.history.at(-1));
            expect(n.history).toEqual(s.history.slice(0, -1));
          }
        }
        const invalid = { from: 99, to: s.frame.friends[0].id };
        expect(accepted(c, s, invalid)).toBe(false);
        expect(step(c, s, invalid)).toBe(s);
      }
      // Reverse breadth-first distances computed independently from the entire directed graph.
      const distances = new Map<string, number>(),
        queue = states.filter((s) => goal(c, s)).map(identity);
      queue.forEach((k) => distances.set(k, 0));
      for (let i = 0; i < queue.length; i++)
        for (const p of reverse.get(queue[i]) ?? [])
          if (!distances.has(p)) {
            distances.set(p, distances.get(queue[i])! + 1);
            queue.push(p);
          }
      expect(distances.size).toBe(states.length);
      for (const s of states) {
        const path = solve(c, s);
        expect(path).not.toBeNull();
        expect(path!.length).toBe(distances.get(identity(s)));
        const a = hint(c, s);
        if (goal(c, s)) {
          expect(a).toBeNull();
          expect(actions(c, s)).toEqual([]);
        } else {
          expect(a).not.toBeNull();
          expect(accepted(c, s, a!)).toBe(true);
          expect(distances.get(identity(step(c, s, a!)))).toBe(distances.get(identity(s))! - 1);
        }
      }
    });
  it('accepts both pair directions/orders and either simultaneous request first', () => {
    const pairs = CASES[2];
    expect(actions(pairs, start(pairs))).toHaveLength(4);
    for (const first of actions(pairs, start(pairs))) {
      const next = step(pairs, start(pairs), first);
      const forwards = actions(pairs, next).filter((a) => !('undo' in a));
      expect(forwards).toHaveLength(2);
      for (const a of forwards) expect(goal(pairs, step(pairs, next, a))).toBe(true);
    }
    const c = CASES[1];
    for (const a of actions(c, start(c))) {
      const n = step(c, start(c), a);
      expect(actions(c, n).filter((a) => !('undo' in a))).toHaveLength(1);
      expect(solve(c, n)).toHaveLength(1);
    }
  });
  it('covers seeded case/position/stage permutations without changing authored wants or quantities', () => {
    const positions = new Set<string>(),
      variants = new Set<string>(),
      stages = new Set<string>();
    for (let seed = 1; seed <= 64; seed++)
      for (let level = 1; level <= 6; level++) {
        const c = roundFor(level, new Rng(seed));
        expect(solve(c, start(c))).toHaveLength(SHORTEST[level]);
        if (level === 6)
          expect(c.stages[1].friends.map((f) => f.id)).toEqual(c.stages[0].friends.map((f) => f.id));
        if (level >= 5) variants.add(c.id);
        expect(valid(c, start(c))).toBe(true);
        for (const s of reachable(c)) expect(valid(c, s)).toBe(true);
        if (level === 4) {
          variants.add(c.id);
          positions.add(c.stages[0].friends[0].want === c.stages[0].basket[0].hold ? 'first' : 'second');
        }
        if (level === 1) stages.add(c.stages.map((s) => s.friends[0].id).join(','));
      }
    expect(variants.size).toBe(6);
    expect(positions.size).toBe(2);
    expect(stages.size).toBe(6);
  });
  it('rejects intentionally broken conservation, Undo, reciprocal acceptance and goal fixtures', () => {
    const c = CASES[0],
      s = start(c),
      n = step(c, s, actions(c, s)[0]);
    const bad = structuredClone(n);
    bad.frame.basket[0].hold = bad.frame.friends[0].hold;
    expect(valid(c, bad)).toBe(false);
    expect({ ...step(c, n, { undo: true }), frame: n.frame }).not.toEqual(s);
    const pairs = CASES[2],
      p = start(pairs);
    expect(accepted(pairs, p, { from: 'otter', to: 'bunny' })).toBe(false);
    const chain = CASES[3],
      one = step(chain, start(chain), actions(chain, start(chain))[0]);
    expect(goal(chain, one)).toBe(false);
    expect(one.frame.basket[0].hold).not.toBe(chain.goal);
  });
  it('never merges identical current holds with different Undo histories', () => {
    const s = start(CASES[1]);
    expect(identity(s)).not.toBe(identity({ ...s, history: [s.frame] }));
  });
});
describe('support accounting', () => {
  it('keeps level1 misses zero, coalesces automatic/manual help and preserves it through Undo', () => {
    const c = CASES[0],
      s = start(c),
      t = new Tally();
    t.reject(c, s);
    t.reject(c, s);
    t.help(c, s);
    expect([t.misses, t.hints, t.glowing]).toEqual([0, 1, true]);
    const n = step(c, s, hint(c, s)!);
    t.changed();
    t.help(c, n);
    expect(t.hints).toBe(2);
    t.changed();
    t.help(c, step(c, n, { undo: true }));
    expect(t.hints).toBe(2);
  });
  it('counts only explicit rejection calls and caps assistance across distinct tasks', () => {
    for (const c of CASES.filter((c) => c.level > 1)) {
      const t = new Tally(),
        s = start(c);
      t.reject(c, s);
      expect([t.misses, t.hints]).toEqual([1, 0]);
      t.reject(c, s);
      t.help(c, s);
      t.help(c, s);
      expect([t.misses, t.hints]).toEqual([2, 1]);
      const n = step(c, s, hint(c, s)!);
      t.changed();
      t.help(c, n);
      expect(t.hints).toBe(2);
      t.changed();
      t.help(c, s);
      expect(t.hints).toBe(2);
    }
  });
});
describe('full-size control layout', () => {
  for (const view of [
    computeView(1024, 768),
    computeView(768, 1024),
    computeView(844, 390),
    computeView(844, 390, { top: 0, right: 47, bottom: 21, left: 47 }),
  ])
    for (const c of CASES)
      it(`${view.w}x${view.h} ${c.id}`, () => {
        const l = layout(view, c.stages[0].friends.length, c.stages[0].basket.length),
          points = [...l.friends, ...l.basket, l.undo, l.help];
        for (const [i, p] of points.entries()) {
          expect(p.x - 64).toBeGreaterThanOrEqual(0);
          expect(p.y - 64).toBeGreaterThanOrEqual(0);
          expect(p.x + 64).toBeLessThanOrEqual(view.w);
          expect(p.y + 64).toBeLessThanOrEqual(view.h);
          expect(p.x - 75 >= 210 || p.y + 75 <= view.h - 208).toBe(true);
          for (const q of points.slice(i + 1))
            expect(Math.abs(p.x - q.x) >= 128 || Math.abs(p.y - q.y) >= 128).toBe(true);
        }
      });
});
describe('levels 5–6: a chain of three and the shell stall', () => {
  const five = CASES.filter((c) => c.level === 5),
    six = CASES.filter((c) => c.level === 6);
  it('level 5: the side trade is tempting from a shortest-path state and leads only to Undo', () => {
    const tempts = new Set<number>();
    for (const c of five) {
      // Walk the solver's own route; at some state on it the side friend also wants the carried object.
      let s = start(c);
      const side = c.stages[0].friends.find(
        (f) => f.hold !== c.goal && !c.stages[0].friends.some((g) => g.want === f.hold),
      )!;
      for (let i = 0; i < 3; i++) {
        const offer = { from: 0, to: side.id } as const;
        if (accepted(c, s, offer)) {
          tempts.add(i);
          const dead = step(c, s, offer);
          expect(deadEnd(c, dead)).toBe(true);
          expect(actions(c, dead)).toEqual([{ undo: true }]);
          expect(hintLine(c, dead)?.line).toBe('swap-meet.hint-undo');
          expect(solve(c, dead)).toHaveLength(1 + solve(c, s)!.length);
        }
        s = step(c, s, hint(c, s)!);
      }
      expect(goal(c, s)).toBe(true);
      // The side friend is still waiting, and that does not block the goal.
      expect(s.frame.friends.find((f) => f.id === side.id)!.done).toBe(false);
    }
    expect([...tempts].sort()).toEqual([0, 1]);
  });
  it('level 5: the Undo cap never drops an entry, and the backward clue names who holds the goal', () => {
    for (const c of five) {
      for (const s of reachable(c))
        for (const a of actions(c, s))
          if (!('undo' in a)) expect(step(c, s, a).history).toHaveLength(s.history.length + 1);
      const s = start(c),
        holder = s.frame.friends.find((f) => f.hold === c.goal)!;
      expect(hintLine(c, s)).toEqual({
        line: 'swap-meet.clue',
        params: { friend: holder.id, goal: c.goal, want: holder.want },
      });
      let n = s;
      while (n.frame.basket[0].hold !== holder.want) n = step(c, n, hint(c, n)!);
      expect(hintLine(c, n)?.line).toBe('swap-meet.hint');
    }
  });
  it('level 6: three trades with friends, then two at the stall, and every stall state is two from the goal', () => {
    for (const c of six) {
      const s = start(c);
      expect(
        solve(c, s)!
          .slice(0, 3)
          .every((a) => 'from' in a),
      ).toBe(true);
      // Stage 1: the shut stall offers nothing; three barter trades open stage 2 with an empty Undo.
      let n = s;
      for (let i = 0; i < 3; i++) {
        expect(actions(c, n).some((a) => 'sell' in a || 'buy' in a)).toBe(false);
        n = step(c, n, hint(c, n)!);
      }
      expect(n.frame.stage).toBe(1);
      expect(n.history).toEqual([]);
      expect(n.frame.basket[0].hold).toBe(c.stages[0].basket[0].hold);
      expect(solve(c, n)).toEqual([{ sell: true }, { buy: 0 }]);
      expect(hintLine(c, n)).toEqual({
        line: 'swap-meet.hint-sell',
        params: { thing: n.frame.basket[0].hold },
      });
      expect(hintLine(c, step(c, n, { sell: true }))).toEqual({
        line: 'swap-meet.hint-buy',
        params: { thing: c.goal },
      });
      // The barter chain still finishes stage 2 in three.
      let barter = n;
      for (let i = 0; i < 3; i++) {
        const a = actions(c, barter).find((a) => 'from' in a)!;
        barter = step(c, barter, a);
      }
      expect(goal(c, barter)).toBe(true);
      // Stage 2's graph, with its bounded history, is finite; no state needs more than sell then buy.
      const stage2 = reachable(c, n);
      expect(stage2.length).toBeGreaterThan(20);
      for (const st of stage2) if (!goal(c, st)) expect(solve(c, st)!.length).toBeLessThanOrEqual(2);
      // Buying the ball is legal and never a miss; selling it back or Undo recovers.
      const ball = step(c, step(c, n, { sell: true }), { buy: 1 });
      expect(ball.frame.basket[0].hold).toBe('ball');
      expect(solve(c, ball)).toHaveLength(2);
    }
  });
  it('rejected offers leave the state unchanged, the purse included', () => {
    const c = six[0];
    let s = start(c);
    for (let i = 0; i < 3; i++) s = step(c, s, hint(c, s)!);
    s = step(c, s, { sell: true });
    for (const t of s.frame.friends) {
      const a = { from: 0, to: t.id } as const;
      expect(accepted(c, s, a)).toBe(false);
      expect(step(c, s, a)).toBe(s);
    }
    expect(step(c, s, { sell: true })).toBe(s);
    expect(s.frame.stall!.shelf).toEqual([c.stages[1].stall!.shelf[0], 'ball', s.frame.stall!.shelf[2]]);
    expect(step(c, s, { buy: 3 })).toBe(s);
  });
  it('net counts follow trades and Undo, and the closing reply is unscored', () => {
    const seq: Action[] = [{ sell: true }, { buy: 1 }, { undo: true }, { buy: 0 }];
    expect(seq.reduce(netTrades, 0)).toBe(2);
    expect(routeReply(3, 2)).toEqual({ line: 'swap-meet.fewer', params: {} });
    expect(routeReply(3, 3)).toEqual({ line: 'swap-meet.same', params: {} });
    expect(routeReply(3, 5)).toEqual({ line: 'swap-meet.more', params: { second: '5' } });
    const t = new Tally();
    routeReply(3, 2);
    expect([t.misses, t.hints, t.streak]).toEqual([0, 0, 0]);
  });
  it('school grows to 6; the other bands and levels 1–4 keep their ranges', () => {
    expect(LEVELS).toEqual({
      toddler: { min: 1, max: 2 },
      preschool: { min: 2, max: 3 },
      prek: { min: 3, max: 4 },
      school: { min: 4, max: 6 },
    });
  });
});
