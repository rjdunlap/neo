import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import {
  bypass, conductors, doneReady, dressingFor, gaps, HelpTally, initialState, lit, litWith, nextHelp, nextMove, planFor, PLANS,
  type BoardState, type Edge, type Seen,
} from './logic';

const state = (supply: boolean, ret: boolean, closed = false): BoardState => ({ filled: { supply, return: ret }, closed });
const nothing: Seen = { on: false, off: false };

describe('the terminal graph', () => {
  it('lights only through both lamp terminals, either way round', () => {
    expect(litWith([['P', 'L'], ['R', 'N']])).toBe(true);
    expect(litWith([['P', 'R'], ['L', 'N']])).toBe(true);
    // A stub from the battery, joined lamp terminals alone, or a loop away from the battery never lights it.
    expect(litWith([['P', 'L']])).toBe(false);
    expect(litWith([['L', 'R']] as Edge[])).toBe(false);
    expect(litWith([['P', 'L'], ['L', 'N']])).toBe(false);
    expect(litWith([['U', 'L'], ['R', 'V'], ['U', 'V']])).toBe(false);
  });

  it('rejects a wire that bypasses the lamp', () => {
    const edges: Edge[] = [['P', 'L'], ['R', 'N'], ['P', 'N']];
    expect(bypass(edges)).toBe(true);
    expect(litWith(edges)).toBe(false);
  });

  it('no level board ever bypasses the lamp, in any state', () => {
    for (const plan of PLANS) for (const s of [state(false, false), state(true, true, true), state(true, false, true), state(false, true, false)]) {
      expect(bypass(conductors(plan, s))).toBe(false);
    }
  });
});

describe('level 1, a way back', () => {
  const plan = planFor(1);
  it('has one empty return bridge and the supply already drawn', () => {
    expect(plan.slots).toEqual(['return']);
    expect(plan.switch).toBe(false);
    expect(gaps(plan, initialState())).toEqual(['return']);
  });

  it('is off until the return gap is filled, then on', () => {
    expect(lit(plan, initialState())).toBe(false);
    expect(lit(plan, state(false, true))).toBe(true);
  });

  it('Done waits for one lit state seen, and stays ready after the piece comes out', () => {
    expect(doneReady(plan, nothing)).toBe(false);
    expect(doneReady(plan, { on: false, off: true })).toBe(false);
    expect(doneReady(plan, { on: true, off: true })).toBe(true);
  });

  it('help fills the return gap, then has nothing new to show', () => {
    expect(nextHelp(plan, initialState(), nothing)).toBe('return');
    expect(nextHelp(plan, state(false, true), { on: true, off: true })).toBeNull();
    // After the lit lantern was seen, taking the piece out leaves nothing to help with.
    expect(nextHelp(plan, initialState(), { on: true, off: true })).toBeNull();
  });

  it('the next move fills the gap and then finishes', () => {
    expect(nextMove(plan, initialState(), { on: false, off: true })).toEqual({ fill: 'return' });
    expect(nextMove(plan, state(false, true), { on: true, off: true })).toEqual({ done: true });
  });
});

describe('level 2, a switch changes it', () => {
  const plan = planFor(2);
  it('is fully wired with an open switch and no bridges', () => {
    expect(plan.slots).toEqual([]);
    expect(plan.switch).toBe(true);
    expect(initialState().closed).toBe(false);
  });

  it('open is off and closed is on', () => {
    expect(lit(plan, state(false, false, false))).toBe(false);
    expect(lit(plan, state(false, false, true))).toBe(true);
  });

  it('Done needs both an off and an on seen, in either order', () => {
    expect(doneReady(plan, { on: true, off: false })).toBe(false);
    expect(doneReady(plan, { on: false, off: true })).toBe(false);
    expect(doneReady(plan, { on: true, off: true })).toBe(true);
  });

  it('help shows the state not yet seen', () => {
    expect(nextHelp(plan, initialState(), { on: false, off: true })).toBe('show-on');
    expect(nextHelp(plan, state(false, false, true), { on: true, off: false })).toBe('show-off');
    expect(nextHelp(plan, initialState(), { on: true, off: true })).toBeNull();
  });

  it('the ghost finger flips until both are seen, then finishes', () => {
    expect(nextMove(plan, initialState(), { on: false, off: true })).toEqual({ flip: true });
    expect(nextMove(plan, initialState(), { on: true, off: true })).toEqual({ done: true });
  });

  it('a bot following nextMove from the opening frame finishes in one flip', () => {
    const s = initialState();
    const seen: Seen = { on: false, off: false };
    let flips = 0;
    for (let step = 0; step < 6; step++) {
      seen[lit(plan, s) ? 'on' : 'off'] = true;
      const m = nextMove(plan, s, seen);
      if ('done' in m) break;
      if ('flip' in m) { s.closed = !s.closed; flips++; }
    }
    expect(flips).toBe(1);
    expect(doneReady(plan, seen)).toBe(true);
  });
});

describe('help accounting', () => {
  it('counts each identity once, however often it is given', () => {
    const t = new HelpTally();
    t.give('return'); t.give('return');
    expect(t.count).toBe(1);
    t.give('show-on');
    expect(t.count).toBe(2);
  });
});

describe('dressing', () => {
  it('varies only the side and petals, never the plan', () => {
    const seen = new Set<string>();
    for (let seed = 1; seed < 40; seed++) {
      const d = dressingFor(new Rng(seed));
      seen.add(`${d.mirror}`);
      expect(['pink', 'purple', 'orange']).toContain(d.petals);
    }
    expect(seen.size).toBe(2);
  });

  it('clamps unknown levels to the plans that exist', () => {
    expect(planFor(0).level).toBe(1);
    expect(planFor(99).level).toBe(PLANS.length);
  });
});
