import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { computeView } from '../../engine/view';
import { rangeFor } from '../../progress/difficulty';
import {
  act, askHint, blendColor, bowlAt, centre, check, doAction, emptyBowl, FRUITS, HOME_BOX, hintFor, INGREDIENTS, isEmpty, keyOf,
  LEVELS, makeRound, MAX_ONE, MAX_PORTIONS, MASH, newSlot, PET_CORNER, portions, restartState, roundState, serve, stepFor, targets,
  undo, workshopLayout, countOf, type Action, type Bowl, type Request, type Slot,
} from './logic';

const views = [computeView(1024, 768), computeView(768, 1024), computeView(844, 390), computeView(844, 390, { top: 0, right: 47, bottom: 21, left: 47 })];
const add = (ing: Action extends infer A ? A extends { kind: 'add'; ing: infer I } ? I : never : never): Action => ({ kind: 'add', ing });
const MIX: Action = { kind: 'mix' };
const STAR: Action = { kind: 'topper', topper: 'star' };
const LEAF: Action = { kind: 'topper', topper: 'leaf' };

function run(actions: Action[], slot: Slot = newSlot(null)): Slot {
  for (const a of actions) doAction(slot, a);
  return slot;
}

/** Every bowl reachable from empty with the counter's actions, within the bounds. */
function reachable(pots: readonly Action[]): Bowl[] {
  const seen = new Map<string, Bowl>([[keyOf(emptyBowl()), emptyBowl()]]);
  const queue = [emptyBowl()];
  while (queue.length) {
    const b = queue.shift()!;
    for (const a of pots) {
      const n = act(b, a);
      if (n && !seen.has(keyOf(n))) { seen.set(keyOf(n), n); queue.push(n); }
    }
  }
  return [...seen.values()];
}

/** Follow `hintFor` (undo when it says so) from a slot until the bowl passes. */
function followHints(slot: Slot, r: Request): number {
  for (let steps = 0; steps < 40; steps++) {
    const h = hintFor(slot.bowl, r);
    if (h.kind === 'serve') { expect(check(slot.bowl, r).kind).toBe('ok'); return steps; }
    if (h.kind === 'undo') expect(undo(slot)).toBe(true);
    else expect(doAction(slot, h.kind === 'add' ? add(h.ing) : h.kind === 'mix' ? MIX : { kind: 'topper', topper: h.topper })).toBe(true);
  }
  throw new Error('hints did not finish');
}

describe('the bowl', () => {
  it('passes the card in either order, and a late dollop needs one more stir', () => {
    const r: Request = { fruit: 'berries' };
    expect(check(run([add('berries'), add('base'), MIX]).bowl, r).kind).toBe('ok');
    expect(check(run([add('base'), add('berries'), MIX]).bowl, r).kind).toBe('ok');
    const late = run([add('berries'), MIX, add('base')]);
    expect(check(late.bowl, r).kind).toBe('notMixed');
    doAction(late, MIX);
    expect(check(late.bowl, r).kind).toBe('ok');
  });

  it('gives exactly one verdict for every reachable bowl, and oversupply is extra', () => {
    const pots = [add('apple'), add('base'), MIX, STAR, LEAF];
    const all = reachable(pots);
    expect(all.length).toBeGreaterThan(20);
    for (const b of all) {
      expect(portions(b)).toBeLessThanOrEqual(MAX_PORTIONS);
      for (const i of INGREDIENTS) expect(countOf(b, i)).toBeLessThanOrEqual(MAX_ONE);
      expect(check(b, { fruit: 'apple', topper: 'star' }).kind).toBeTruthy();
    }
    const r: Request = { fruit: 'apple' };
    expect(check(run([add('apple'), add('apple'), add('base'), MIX]).bowl, r)).toEqual({ kind: 'extra', ing: 'apple' });
    expect(check(run([add('apple'), add('base'), add('base'), MIX]).bowl, r)).toEqual({ kind: 'extra', ing: 'base' });
    expect(check(run([add('base')]).bowl, r)).toEqual({ kind: 'missing', ing: 'apple' });
    expect(check(emptyBowl(), r).kind).toBe('empty');
  });

  it('refuses a full bowl and a fourth of one thing, changing nothing', () => {
    const s = run([add('base'), add('base'), add('base')]);
    expect(act(s.bowl, add('base'))).toBeNull();
    doAction(s, add('berries'));
    expect(portions(s.bowl)).toBe(4);
    expect(act(s.bowl, add('apple'))).toBeNull();
  });

  it('mixing moves every loose portion and folds a topper in; twice is the same as once', () => {
    const s = run([add('berries'), add('base'), STAR]);
    const once = act(s.bowl, MIX)!;
    expect(once.loose).toEqual([]);
    expect(once.mixed).toEqual({ berries: 1, base: 1 });
    expect(once.top).toBeNull();
    expect(once.folded).toEqual(['star']);
    expect(act(once, MIX)).toBeNull();
    expect(act(emptyBowl(), MIX)).toBeNull();
    const topped = act(once, LEAF)!;
    expect(INGREDIENTS.map((i) => countOf(topped, i))).toEqual(INGREDIENTS.map((i) => countOf(once, i)));
  });

  it('blends from the mixed counts alone; the base lightens a fruit', () => {
    expect(blendColor(emptyBowl())).toBeNull();
    const mixed = act(run([add('berries'), add('base')]).bowl, MIX)!;
    const c = blendColor(mixed)!;
    expect(c).not.toBe(MASH.berries);
    expect((c >> 16) & 255).toBeGreaterThan((MASH.berries >> 16) & 255);
  });
});

describe('undo', () => {
  it('restores the exact previous state after each action type', () => {
    for (const a of [add('orange'), MIX, STAR] as Action[]) {
      const s = run([add('orange'), add('base'), LEAF]);
      const before = keyOf(s.bowl);
      if (doAction(s, a)) { undo(s); expect(keyOf(s.bowl)).toBe(before); }
    }
  });

  it('pushes nothing for an unchanged bowl and never grows on a cycle', () => {
    const s = newSlot(null);
    expect(doAction(s, MIX)).toBe(false);
    expect(s.stack).toHaveLength(0);
    doAction(s, add('berries')); doAction(s, MIX);
    for (let i = 0; i < 10; i++) { doAction(s, STAR); doAction(s, MIX); }
    expect(s.stack.length).toBeLessThanOrEqual(4);
    expect(new Set(s.stack.map(keyOf)).size).toBe(s.stack.length);
    expect(s.stack.map(keyOf)).not.toContain(keyOf(s.bowl));
    while (undo(s));
    expect(isEmpty(s.bowl)).toBe(true);
  });

  it('reaches the empty bowl from every reachable state by repeated undo', () => {
    const rng = new Rng(7);
    const acts: Action[] = [add('berries'), add('base'), MIX, STAR, LEAF];
    for (let t = 0; t < 300; t++) {
      const s = newSlot(null);
      for (let k = 0; k < 12; k++) doAction(s, rng.pick(acts));
      while (undo(s));
      expect(isEmpty(s.bowl)).toBe(true);
    }
  });
});

describe('hints', () => {
  it('lead from every reachable state to a bowl that passes, starting with a legal step', () => {
    const rng = new Rng(3);
    for (const topper of [undefined, 'star', 'leaf'] as const) {
      for (const fruit of FRUITS) {
        const r: Request = { fruit, topper };
        const acts: Action[] = [add(fruit), add('base'), MIX, ...(topper ? [STAR, LEAF] : [])];
        for (let t = 0; t < 150; t++) {
          const s = newSlot(r);
          for (let k = 0, n = rng.int(0, 10); k < n; k++) doAction(s, rng.pick(acts));
          expect(followHints(s, r)).toBeLessThan(20);
        }
      }
    }
  });

  it('level 1 points at a pot, then Serve', () => {
    const s = newSlot(null);
    expect(stepFor(s, ['apple', 'base'])).toEqual({ kind: 'add', ing: 'apple' });
    doAction(s, add('apple'));
    expect(stepFor(s, ['apple', 'base'])).toEqual({ kind: 'serve' });
  });
});

describe('accounting', () => {
  it('counts a miss only for a failed non-empty Serve, and two give one glow and one hint', () => {
    const st = roundState(2, [{ fruit: 'berries' }]);
    expect(serve(st, 0).kind).toBe('empty');
    expect(st.misses).toBe(0);
    doAction(st.slots[0], add('base'));
    expect(serve(st, 0)).toMatchObject({ kind: 'miss', verdict: { kind: 'missing', ing: 'berries' }, newHint: false });
    const second = serve(st, 0);
    expect(second).toMatchObject({ kind: 'miss', newHint: true });
    expect(st.slots[0].glow).toBe(true);
    expect([st.misses, st.hints]).toEqual([2, 1]);
    serve(st, 0);
    expect([st.misses, st.hints]).toEqual([3, 1]);
    askHint(st);
    expect(st.hints).toBe(1);
    doAction(st.slots[0], add('berries')); doAction(st.slots[0], MIX);
    expect(serve(st, 0).kind).toBe('served');
    expect(st.done).toBe(true);
  });

  it('a requested hint counts once per bowl and goes to the bowl with most misses', () => {
    const st = roundState(3, [{ fruit: 'apple', topper: 'star' }, { fruit: 'apple', topper: 'leaf' }]);
    doAction(st.slots[1].bowl ? st.slots[1] : st.slots[1], add('apple'));
    serve(st, 1);
    expect(askHint(st)).toBe(1);
    expect(st.hints).toBe(1);
    expect(askHint(st)).toBe(1);
    expect(st.hints).toBe(1);
  });

  it('level 1 serves any non-empty bowl and counts nothing', () => {
    for (const b of reachable([add('orange'), add('base'), MIX])) {
      if (portions(b) === 0) continue;
      const st = roundState(1, [null]);
      st.slots[0].bowl = b;
      expect(serve(st, 0).kind).toBe('served');
    }
    const st = roundState(1, [null]);
    askHint(st);
    expect([st.misses, st.hints]).toEqual([0, 0]);
  });

  it('start again empties bowls and keeps misses and hints', () => {
    const st = roundState(2, [{ fruit: 'orange' }]);
    doAction(st.slots[0], add('base')); serve(st, 0); serve(st, 0);
    restartState(st);
    expect(isEmpty(st.slots[0].bowl)).toBe(true);
    expect(st.slots[0].stack).toEqual([]);
    expect([st.misses, st.hints]).toEqual([2, 1]);
  });
});

describe('two bowls', () => {
  it('serve in either order with interleaved work; a folded star plus a star on top passes', () => {
    for (const first of [0, 1]) {
      const st = roundState(3, [{ fruit: 'berries', topper: 'star' }, { fruit: 'berries', topper: 'leaf' }]);
      const [a, b] = st.slots;
      doAction(a, add('berries')); doAction(b, add('base')); doAction(a, STAR); doAction(b, add('berries'));
      doAction(a, add('base')); doAction(a, MIX); doAction(a, STAR); doAction(b, MIX); doAction(b, LEAF);
      expect(a.bowl.folded).toEqual(['star']);
      expect(serve(st, first).kind).toBe('served');
      expect(st.done).toBe(false);
      expect(serve(st, 1 - first).kind).toBe('served');
      expect(st.done).toBe(true);
      expect(st.misses).toBe(0);
    }
  });

  it('mixing after the topper folds it in, and the check asks for it again', () => {
    const st = roundState(3, [{ fruit: 'orange', topper: 'leaf' }, { fruit: 'orange', topper: 'star' }]);
    run([add('orange'), add('base'), LEAF, MIX], st.slots[0]);
    expect(serve(st, 0)).toMatchObject({ kind: 'miss', verdict: { kind: 'noTopper', topper: 'leaf' } });
    run([STAR], st.slots[0]);
    expect(serve(st, 0)).toMatchObject({ kind: 'miss', verdict: { kind: 'wrongTopper' } });
    expect(isEmpty(st.slots[1].bowl)).toBe(true);
  });
});

describe('rounds', () => {
  it('open on the authored counter and stay in each level\'s variation', () => {
    expect(makeRound(1, new Rng(1), true).round.pots).toEqual(['berries', 'base']);
    expect(makeRound(2, new Rng(1), true).requests).toEqual([{ fruit: 'berries' }]);
    expect(makeRound(3, new Rng(1), true).requests).toEqual([{ fruit: 'berries', topper: 'star' }, { fruit: 'berries', topper: 'leaf' }]);
    for (let seed = 0; seed < 200; seed++) {
      const one = makeRound(1, new Rng(seed), false).round;
      expect(new Set(one.pots).size).toBe(2);
      const two = makeRound(2, new Rng(seed), false);
      expect(two.round.pots).toEqual([two.requests[0]!.fruit, 'base']);
      const three = makeRound(3, new Rng(seed), false);
      expect(three.requests.map((r) => r!.topper).sort()).toEqual(['leaf', 'star']);
      expect(three.requests[0]!.fruit).toBe(three.requests[1]!.fruit);
      expect(three.round.friend).not.toBeNull();
    }
  });

  it('cover the bands the definition gives', () => {
    expect(rangeFor(LEVELS, 'toddler')).toEqual({ min: 1, max: 1 });
    expect(rangeFor(LEVELS, 'preschool')).toEqual({ min: 1, max: 2 });
    expect(rangeFor(LEVELS, 'prek')).toEqual({ min: 2, max: 3 });
  });
});

describe('layout', () => {
  it('fits every level in four views with large, separate targets clear of home and the guide', () => {
    for (const v of views) for (const level of [1, 2, 3]) {
      const L = workshopLayout(v, level)!;
      expect(L, `${v.w}x${v.h} level ${level}`).not.toBeNull();
      const all = targets(L);
      for (const [i, b] of all.entries()) {
        expect(Math.min(b.w, b.h)).toBeGreaterThanOrEqual(100);
        expect(b.x >= 0 && b.y >= 0 && b.x + b.w <= v.w && b.y + b.h <= v.h).toBe(true);
        expect(b.x >= HOME_BOX.w || b.y >= HOME_BOX.h).toBe(true);
        expect(b.x >= PET_CORNER || b.y + b.h <= v.h - PET_CORNER).toBe(true);
        for (const o of all.slice(i + 1)) {
          const apart = b.x + b.w + 30 <= o.x || o.x + o.w + 30 <= b.x || b.y + b.h + 30 <= o.y || o.y + o.h + 30 <= b.y;
          expect(apart, `${v.w}x${v.h} level ${level}: ${JSON.stringify(b)} vs ${JSON.stringify(o)}`).toBe(true);
        }
      }
      expect(Math.min(...L.pots.map((p) => p.w))).toBeGreaterThanOrEqual(130);
      expect(L.bowls[0].w).toBeGreaterThanOrEqual(level === 3 ? 220 : 260);
      L.bowls.forEach((b, i) => { const c = centre(b); expect(bowlAt(L, c.x, c.y)).toBe(i); });
    }
  });
});
