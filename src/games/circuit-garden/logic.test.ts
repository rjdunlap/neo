import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import {
  bypass,
  checkBoard,
  conductors,
  doneReady,
  dressingFor,
  gaps,
  GLOW_AFTER,
  HelpTally,
  initialState,
  lit,
  litWith,
  nextHelp,
  nextMove,
  planFor,
  PLANS,
  type BoardState,
  type Edge,
  type Seen,
} from './logic';

const state = (supply: boolean, ret: boolean, closed = false): BoardState => ({
  filled: { supply, return: ret },
  closed,
});
const nothing: Seen = { on: false, off: false };

describe('the terminal graph', () => {
  it('lights only through both lamp terminals, either way round', () => {
    expect(
      litWith([
        ['P', 'L'],
        ['R', 'N'],
      ]),
    ).toBe(true);
    expect(
      litWith([
        ['P', 'R'],
        ['L', 'N'],
      ]),
    ).toBe(true);
    // A stub from the battery, joined lamp terminals alone, or a loop away from the battery never lights it.
    expect(litWith([['P', 'L']])).toBe(false);
    expect(litWith([['L', 'R']] as Edge[])).toBe(false);
    expect(
      litWith([
        ['P', 'L'],
        ['L', 'N'],
      ]),
    ).toBe(false);
    expect(
      litWith([
        ['U', 'L'],
        ['R', 'V'],
        ['U', 'V'],
      ]),
    ).toBe(false);
  });

  it('rejects a wire that bypasses the lamp', () => {
    const edges: Edge[] = [
      ['P', 'L'],
      ['R', 'N'],
      ['P', 'N'],
    ];
    expect(bypass(edges)).toBe(true);
    expect(litWith(edges)).toBe(false);
  });

  it('no level board ever bypasses the lamp, in any state', () => {
    for (const plan of PLANS)
      for (const s of [
        state(false, false),
        state(true, true, true),
        state(true, false, true),
        state(false, true, false),
      ]) {
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
      if ('flip' in m) {
        s.closed = !s.closed;
        flips++;
      }
    }
    expect(flips).toBe(1);
    expect(doneReady(plan, seen)).toBe(true);
  });
});

describe('level 3, mend the lantern', () => {
  const plan = planFor(3);
  const states: [boolean, boolean, boolean][] = [
    [false, false, false],
    [true, false, false],
    [false, true, false],
    [true, true, true],
  ];

  it('has two empty gaps, no fixed wires and a Check', () => {
    expect(plan.fixed).toEqual([]);
    expect(plan.check).toBe(true);
    expect(gaps(plan, initialState())).toEqual(['supply', 'return']);
  });

  it('lights only with both bridges filled, and never bypasses', () => {
    for (const [supply, ret, on] of states) {
      expect(lit(plan, state(supply, ret))).toBe(on);
      expect(bypass(conductors(plan, state(supply, ret)))).toBe(false);
    }
  });

  it('a wrong Check names the supply break first, then return; a right one only when lit', () => {
    expect(checkBoard(plan, state(false, false))).toEqual({ right: false, brk: 'supply' });
    expect(checkBoard(plan, state(false, true))).toEqual({ right: false, brk: 'supply' });
    expect(checkBoard(plan, state(true, false))).toEqual({ right: false, brk: 'return' });
    expect(checkBoard(plan, state(true, true))).toEqual({ right: true });
    expect(GLOW_AFTER).toBe(2);
  });

  it('Done ignores what was seen and needs a correct Check', () => {
    for (const seen of [nothing, { on: true, off: true }]) {
      expect(doneReady(plan, seen)).toBe(false);
      expect(doneReady(plan, seen, false)).toBe(false);
      expect(doneReady(plan, seen, true)).toBe(true);
    }
  });

  it('help goes supply, return, then nothing, and each identity counts once', () => {
    expect(nextHelp(plan, state(false, false), nothing)).toBe('supply');
    expect(nextHelp(plan, state(true, false), nothing)).toBe('return');
    expect(nextHelp(plan, state(false, true), nothing)).toBe('supply');
    expect(nextHelp(plan, state(true, true), nothing)).toBeNull();
    const t = new HelpTally();
    t.give('supply');
    t.give('supply');
    t.give('return');
    expect(t.count).toBe(2);
  });

  it('either fill order lights the lantern', () => {
    for (const order of [
      ['supply', 'return'],
      ['return', 'supply'],
    ] as const) {
      const s = initialState();
      order.forEach((slot, i) => {
        s.filled[slot] = true;
        expect(lit(plan, s)).toBe(i === 1);
      });
    }
  });

  it('a bot following nextMove fills both, checks, then is done, with no wrong Check', () => {
    const s = initialState();
    let checked = false,
      wrong = 0;
    const moves: string[] = [];
    for (let i = 0; i < 10; i++) {
      const m = nextMove(plan, s, nothing, checked);
      moves.push(Object.keys(m)[0] + ('fill' in m ? `:${m.fill}` : ''));
      if ('done' in m) break;
      if ('fill' in m) s.filled[m.fill] = true;
      if ('check' in m) {
        if (checkBoard(plan, s).right) checked = true;
        else wrong++;
      }
    }
    expect(moves).toEqual(['fill:supply', 'fill:return', 'check', 'done']);
    expect(wrong).toBe(0);
  });

  it('levels 1 and 2 ignore the checked default', () => {
    expect(doneReady(planFor(1), { on: true, off: false })).toBe(true);
    expect(doneReady(planFor(2), { on: true, off: false })).toBe(false);
    expect(nextMove(planFor(1), initialState(), nothing)).toEqual({ fill: 'return' });
    expect(nextMove(planFor(2), initialState(), nothing)).toEqual({ flip: true });
  });
});

describe('help accounting', () => {
  it('counts each identity once, however often it is given', () => {
    const t = new HelpTally();
    t.give('return');
    t.give('return');
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
