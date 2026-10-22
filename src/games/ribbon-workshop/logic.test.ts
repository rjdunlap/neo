import { describe, expect, it } from 'vitest';
import { SCRIPT } from '../../content/voice-script';
import { Rng } from '../../engine/random';
import {
  actions, AMOUNTS, apply, CAPACITY, compositionKey, GiftTally, hintAction, judge, LEVEL_IDS, planFor, roundFor, solve, startState, total, trayLayout, TRAY_LEFT, UNIT, Workbench,
  type Action, type GiftCase, type RibbonState,
} from './logic';

const casesOf = (level: number) => { const p = planFor(level); return [...p.first, ...(p.second ? [p.second] : [])]; };
const keyOf = (s: RibbonState) => `${s.tray.map(p => p.size).join('')}|${s.bench.map(p => p.size).join('')}`;

/** Every state reachable from a case's start by any legal place, return or snip. */
function reachable(c: GiftCase, canSnip: boolean): RibbonState[] {
  const start = startState(c), out = [start], seen = new Set([keyOf(start)]);
  for (let i = 0; i < out.length; i++) {
    const s = out[i];
    const all: Action[] = [...s.tray.map(p => ({ kind: 'place' as const, id: p.id })), ...s.bench.map(p => ({ kind: 'return' as const, id: p.id })), ...(canSnip ? s.tray.map(p => ({ kind: 'snip' as const, id: p.id })) : [])];
    for (const a of all) { const n = apply(s, a); if (n && !seen.has(keyOf(n))) { seen.add(keyOf(n)); out.push(n); } }
  }
  return out;
}

/** Brute force: every multiset of pieces the tray can give (halves kept or snipped into quarters) that sums to the target. */
function bruteCompositions(c: GiftCase, canSnip: boolean): string[] {
  const halves = c.tray.filter(s => s === 2).length, quarters = c.tray.filter(s => s === 1).length, out = new Set<string>();
  for (let keep = 0; keep <= halves; keep++) {
    const maxQ = quarters + (canSnip ? 2 * (halves - keep) : 0);
    for (let h = 0; h <= keep; h++) for (let q = 0; q <= maxQ; q++) if (h + q > 0 && 2 * h + q === c.target && 2 * h + q <= CAPACITY) out.add('h'.repeat(h) + 'q'.repeat(q));
  }
  return [...out].sort();
}

const distance = (s: RibbonState, c: GiftCase, canSnip: boolean) => judge(s, c.target) === 'right' ? 0 : solve(s, c.target, canSnip)!.length;

describe('Ribbon Workshop', () => {
  it('every case at every level is solvable, and the solver ends on an exact match', () => {
    for (const level of LEVEL_IDS) for (const c of casesOf(level)) {
      let s = startState(c);
      const path = solve(s, c.target, planFor(level).snip);
      expect(path, `level ${level} target ${c.target}`).not.toBeNull();
      for (const a of path!) s = apply(s, a)!;
      expect(judge(s, c.target)).toBe('right');
    }
  });

  it('accepts exactly the compositions the tray can make', () => {
    for (const level of LEVEL_IDS) for (const c of casesOf(level)) {
      const snip = planFor(level).snip;
      const made = [...new Set(reachable(c, snip).filter(s => judge(s, c.target) === 'right').map(s => compositionKey(s.bench)))].sort();
      expect(made, `level ${level} ${c.tray.join('')}→${c.target}`).toEqual(bruteCompositions(c, snip));
    }
    // Level 1's wholes: two halves, a half and two quarters, four quarters, as far as each tray allows.
    expect(planFor(1).first.map(c => [...new Set(reachable(c, false).filter(s => judge(s, 4) === 'right').map(s => compositionKey(s.bench)))].sort()))
      .toEqual([['hh', 'hqq', 'qqqq'], ['hqq', 'qqqq'], ['hh', 'hqq']]);
  });

  it('teaches the snip: the second gift at levels 2–3 needs one, and level 2 has a half made only of quarters', () => {
    for (const level of [2, 3]) {
      const c = planFor(level).second!;
      expect(solve(startState(c), c.target, false), `level ${level}`).toBeNull();
      expect(solve(startState(c), c.target, true)!.some(a => a.kind === 'snip')).toBe(true);
    }
    expect(planFor(2).first.some(c => !c.tray.includes(2))).toBe(true);
    expect(planFor(1).snip).toBe(false);
  });

  it('a snip keeps the tray total and position, and undo restores the exact earlier state', () => {
    const s = startState({ target: 3, tray: [1, 2, 2] });
    const cut = apply(s, { kind: 'snip', id: 1 })!;
    expect(total(cut.tray)).toBe(total(s.tray));
    expect(cut.tray.map(p => p.size)).toEqual([1, 1, 1, 2]);
    expect(cut.tray[0].id).toBe(0);
    expect(apply(s, { kind: 'snip', id: 0 })).toBeNull();
    // Undo after any action sequence restores the exact earlier state, step by step back to the start.
    const rng = new Rng(7);
    for (let trial = 0; trial < 60; trial++) {
      const w = new Workbench({ target: 3, tray: [2, 2, 1, 1] }), seen: RibbonState[] = [];
      for (let i = 0; i < 8; i++) {
        const s = w.state;
        const options: Action[] = [...s.tray.map(p => ({ kind: rng.chance(0.3) ? 'snip' as const : 'place' as const, id: p.id })), ...s.bench.map(p => ({ kind: 'return' as const, id: p.id }))];
        const before = structuredClone(s);
        if (w.act(options[rng.int(0, options.length - 1)])) seen.push(before);
        else expect(w.state).toEqual(before);
      }
      while (seen.length) { expect(w.undo()).toBe(true); expect(w.state).toEqual(seen.pop()); }
      expect(w.undo()).toBe(false);
      expect(w.state).toEqual(startState({ target: 3, tray: [2, 2, 1, 1] }));
    }
  });

  it('equality does not depend on bench order', () => {
    let a = startState({ target: 3, tray: [2, 1] }), b = a;
    a = apply(apply(a, { kind: 'place', id: 0 })!, { kind: 'place', id: 1 })!;
    b = apply(apply(b, { kind: 'place', id: 1 })!, { kind: 'place', id: 0 })!;
    expect(judge(a, 3)).toBe('right');
    expect(judge(b, 3)).toBe('right');
    expect(compositionKey(a.bench)).toBe(compositionKey(b.bench));
  });

  it('the hint lowers the distance by exactly one from every reachable state, and from an overfull bench it is a return', () => {
    for (const level of LEVEL_IDS) for (const c of casesOf(level)) {
      const snip = planFor(level).snip;
      for (const s of reachable(c, snip)) {
        const h = hintAction(s, c.target, snip)!;
        expect(h).not.toBeNull();
        if (judge(s, c.target) === 'right') { expect(h.kind).toBe('check'); continue; }
        if (total(s.bench) > c.target) expect(h.kind).toBe('return');
        const next = apply(s, h as Action)!;
        expect(next).not.toBeNull();
        expect(distance(next, c, snip)).toBe(distance(s, c, snip) - 1);
      }
    }
  });

  it('refuses a place past the bench capacity and leaves the state unchanged', () => {
    let s = startState({ target: 4, tray: [2, 2, 2, 1] });
    for (const id of [0, 1, 2]) s = apply(s, { kind: 'place', id })!;
    expect(total(s.bench)).toBe(CAPACITY);
    expect(apply(s, { kind: 'place', id: 3 })).toBeNull();
    // The solver never offers a place on an overfull bench.
    expect(actions(s, 4, false).every(a => a.kind === 'return')).toBe(true);
  });

  it('seeded rounds pick two different gifts, the snip gift second at levels 2–3', () => {
    for (const level of LEVEL_IDS) for (let seed = 0; seed < 200; seed++) {
      const [g1, g2] = roundFor(level, new Rng(seed));
      const plan = planFor(level);
      const sorted = (c: GiftCase) => `${c.target}:${[...c.tray].sort().join('')}`;
      expect(sorted(g1)).not.toBe(sorted(g2));
      expect(plan.first.map(sorted)).toContain(sorted(g1));
      if (plan.second) expect(sorted(g2)).toBe(sorted(plan.second));
      else expect(plan.first.map(sorted)).toContain(sorted(g2));
      for (const g of [g1, g2]) expect(solve(startState(g), g.target, plan.snip)).not.toBeNull();
    }
  });

  it('counts a wrong check once, the glow once per gift, and nothing for an empty check or a request under the glow', () => {
    const t = new GiftTally();
    t.check('empty');
    expect([t.misses, t.hints, t.glow]).toEqual([0, 0, false]);
    t.check('short');
    expect([t.misses, t.hints, t.glow]).toEqual([1, 0, false]);
    t.check('long');
    expect([t.misses, t.hints, t.glow]).toEqual([2, 1, true]);
    expect(t.ask()).toBe(false);
    t.check('short');
    expect([t.misses, t.hints]).toEqual([3, 1]);
    t.nextGift();
    expect(t.ask()).toBe(true);
    t.check('short'); t.check('short');
    expect([t.misses, t.hints]).toEqual([5, 2]);
  });

  it('has a spoken line for every accepted composition and every target', () => {
    for (const level of LEVEL_IDS) for (const c of casesOf(level)) {
      expect(SCRIPT).toHaveProperty([`ribbon.ask.${AMOUNTS[c.target]}`]);
      for (const s of reachable(c, planFor(level).snip)) if (judge(s, c.target) === 'right') expect(SCRIPT).toHaveProperty([`ribbon.made.${compositionKey(s.bench)}`]);
    }
  });

  it('lays every reachable tray in at most two rows, clear of the pet and the button column', () => {
    for (const level of LEVEL_IDS) for (const c of casesOf(level)) for (const s of reachable(c, planFor(level).snip)) {
      const spots = trayLayout(s.tray);
      expect(Math.max(-1, ...spots.map(p => p.row))).toBeLessThan(2);
      spots.forEach((spot, i) => {
        const half = (s.tray[i].size * UNIT) / 2;
        expect(spot.x - half).toBeGreaterThanOrEqual(TRAY_LEFT);
        expect(spot.x + half).toBeLessThanOrEqual(800);
      });
    }
  });
});
