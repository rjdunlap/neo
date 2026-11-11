import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { computeView } from '../../engine/view';
import { uprightProblems, UPRIGHT_VIEWS, type Target } from '../upright-check';
import {
  actionFor,
  allSettings,
  apply,
  briefFor,
  contrastSeen,
  deskAt,
  deskLayout,
  describeLevel,
  distance,
  EMPTY,
  hatchBriefs,
  hatchLayout,
  helpFor,
  keep,
  LEVELS,
  nearestSolution,
  nextMove,
  passes,
  repairOf,
  replay,
  run,
  setInput,
  show,
  solutions,
  stateAfter,
  step,
  TOKENS,
  type Action,
  type Brief,
  type HatchBrief,
  type Rect,
  type Slot,
  type State,
} from './logic';

const SLOTS: Slot[] = [null, 'shell', 'leaf'];
const STATES: State[] = SLOTS.flatMap((input) =>
  SLOTS.flatMap((stored) => SLOTS.map((output) => ({ input, stored, output }))),
);
const set = (token: 'shell' | 'leaf'): Action => ({ kind: 'set', token });
const KEEP: Action = { kind: 'keep' };
const SHOW: Action = { kind: 'show' };
const ACTIONS: Action[] = [set('shell'), set('leaf'), KEEP, SHOW];

/** Every list of up to `n` presses over two tokens. */
function* histories(n: number, prefix: Action[] = []): Generator<Action[]> {
  yield prefix;
  if (prefix.length < n) for (const a of ACTIONS) yield* histories(n, [...prefix, a]);
}

describe('Memory Desk level 1: the three actions', () => {
  it('putting a token on the tray changes only the tray', () => {
    for (const s of STATES)
      for (const t of ['shell', 'leaf'] as const) expect(setInput(s, t)).toEqual({ ...s, input: t });
  });

  it('Keep copies the tray into the drawer and never empties the tray', () => {
    for (const s of STATES) {
      const after = keep(s);
      expect(after.input).toBe(s.input);
      expect(after.output).toBe(s.output);
      expect(after.stored).toBe(s.input ?? s.stored);
    }
  });

  it('Keep on an empty tray changes nothing', () => {
    for (const s of STATES.filter((s) => s.input === null)) expect(keep(s)).toEqual(s);
  });

  it('Show copies the drawer into the window, never empties the drawer and never reads the tray', () => {
    for (const s of STATES) {
      const after = show(s);
      expect(after).toEqual({ ...s, output: s.stored });
      for (const input of SLOTS) expect(show({ ...s, input }).output).toBe(after.output);
    }
  });

  it('Show on an empty drawer changes nothing but the window, which shows nothing', () => {
    for (const s of STATES.filter((s) => s.stored === null)) expect(show(s)).toEqual({ ...s, output: null });
  });

  it('replay keeps each press with the desk on both sides of it', () => {
    const h = replay([set('shell'), KEEP, set('leaf'), SHOW]);
    expect(h.map((e) => e.after)).toEqual([
      { input: 'shell', stored: null, output: null },
      { input: 'shell', stored: 'shell', output: null },
      { input: 'leaf', stored: 'shell', output: null },
      { input: 'leaf', stored: 'shell', output: 'shell' },
    ]);
    h.forEach((e, i) => expect(e.before).toEqual(i ? h[i - 1].after : EMPTY));
    expect(stateAfter(h)).toEqual(h[3].after);
    expect(stateAfter([])).toEqual(EMPTY);
  });
});

describe('Memory Desk level 1: the contrast', () => {
  const seen = (...actions: Action[]) => contrastSeen(replay(actions));

  it('is seen after Keep, a different tray, then Show', () => {
    expect(seen(set('shell'), KEEP, set('leaf'), SHOW)).toBe(true);
    expect(seen(set('leaf'), KEEP, set('shell'), SHOW)).toBe(true);
  });

  it('is not seen without all three parts in order', () => {
    expect(seen()).toBe(false);
    expect(seen(set('shell'), KEEP, SHOW)).toBe(false); // no change of tray
    expect(seen(set('shell'), set('leaf'), SHOW)).toBe(false); // a change with nothing kept
    expect(seen(set('shell'), KEEP, set('leaf'), KEEP, SHOW)).toBe(false); // the new one was kept before Show
    expect(seen(set('shell'), KEEP, set('leaf'))).toBe(false); // no Show yet
    expect(seen(set('shell'), KEEP, set('leaf'), set('shell'), SHOW)).toBe(false); // the tray went back
    expect(seen(KEEP, set('leaf'), SHOW)).toBe(false); // an empty Keep kept nothing
    expect(seen(set('shell'), SHOW, KEEP, set('leaf'))).toBe(false); // Show came first
  });

  it('over every history of up to six presses, is exactly "some Show put a kept token in the window beside a different tray"', () => {
    let seenCount = 0;
    for (const actions of histories(6)) {
      const h = replay(actions);
      const plain = h.some(
        (e) =>
          e.action.kind === 'show' &&
          e.after.output !== null &&
          e.after.input !== null &&
          e.after.output !== e.after.input,
      );
      expect(contrastSeen(h)).toBe(plain);
      if (plain) seenCount++;
    }
    expect(seenCount).toBeGreaterThan(0);
  });

  it('once seen, stays seen whatever is pressed next', () => {
    const base = [set('shell'), KEEP, set('leaf'), SHOW];
    for (const more of histories(3)) expect(contrastSeen(replay([...base, ...more]))).toBe(true);
  });
});

describe('Memory Desk level 1: briefs, help and the ghost finger', () => {
  const brief: Brief = { level: 1, tokens: ['shell', 'leaf'] };

  it('the same seed gives the same two different tokens, and every token appears across seeds', () => {
    const seen = new Set<string>();
    for (let seed = 1; seed <= 60; seed++) {
      const b = briefFor(1, new Rng(seed));
      expect(briefFor(1, new Rng(seed))).toEqual(b);
      expect(b.tokens[0]).not.toBe(b.tokens[1]);
      for (const t of b.tokens) {
        expect(TOKENS).toContain(t);
        seen.add(t);
      }
    }
    expect([...seen].sort()).toEqual([...TOKENS].sort());
  });

  it('from an empty desk the moves are a picture, Keep, the other picture, Show, Done', () => {
    const h: Action[] = [];
    const moves = [];
    for (;;) {
      const m = nextMove(brief, replay(h));
      moves.push(m);
      if (m === 'done') break;
      h.push(actionFor(brief, m));
    }
    expect(moves).toEqual([{ card: 0 }, 'keep', { card: 1 }, 'show', 'done']);
  });

  it('from every desk she can reach, following the move reaches the contrast in at most four presses', () => {
    for (const actions of histories(5)) {
      const h = [...actions];
      let presses = 0;
      for (;;) {
        const m = nextMove(brief, replay(h));
        if (m === 'done') break;
        const before = stateAfter(replay(h));
        const a = actionFor(brief, m);
        // A hint never names a press that does nothing (a Show may repeat a window that is already right).
        if (m !== 'show') expect(apply(before, a)).not.toEqual(before);
        h.push(a);
        expect(++presses).toBeLessThanOrEqual(4);
      }
      expect(contrastSeen(replay(h))).toBe(true);
    }
  });

  it('names Done only once the contrast has been seen', () => {
    for (const actions of histories(5)) {
      const h = replay(actions);
      expect(nextMove(brief, h) === 'done').toBe(contrastSeen(h));
    }
  });
});

const SEEDS = Array.from({ length: 300 }, (_, i) => i + 1);
const briefsAt = (level: number): HatchBrief[] => SEEDS.flatMap((seed) => hatchBriefs(level, new Rng(seed)));

describe('Memory Desk levels 2–3: one step', () => {
  it('writes the arriving token only through an open hatch, and the window reads the drawer after the write', () => {
    for (const stored of SLOTS)
      for (const input of ['shell', 'leaf'] as const)
        for (const open of [true, false]) {
          const after = step(stored, input, open);
          expect(after.stored).toBe(open ? input : stored);
          expect(after.output).toBe(after.stored);
        }
  });

  it('a run keeps every step, and ends on the last open step or on what the drawer started with', () => {
    for (const brief of [...briefsAt(2), ...briefsAt(3)])
      for (const h of allSettings(brief.queue.length)) {
        const { trace, output } = run(brief, h);
        expect(trace.map((t) => t.input)).toEqual(brief.queue);
        expect(trace.map((t) => t.open)).toEqual(h);
        for (const t of trace) expect(t.output).toBe(t.stored);
        const last = h.lastIndexOf(true);
        expect(output).toBe(last < 0 ? brief.initialStored : brief.queue[last]);
      }
  });

  it('the desk part by part: arrive, then write, then read, ending where the run ends', () => {
    const brief = hatchBriefs(3, new Rng(7))[0];
    for (const h of allSettings(3)) {
      const { trace, output } = run(brief, h);
      expect(deskAt(brief, h, 0)).toEqual({ input: null, stored: brief.initialStored, output: null });
      trace.forEach((t, i) => {
        const before = i ? trace[i - 1] : { stored: brief.initialStored, output: null };
        // Arrived: only the tray has changed.
        expect(deskAt(brief, h, 3 * i + 1)).toEqual({
          input: t.input,
          stored: before.stored,
          output: before.output,
        });
        // Written: the drawer has changed (or held) and the window still shows the step before.
        expect(deskAt(brief, h, 3 * i + 2)).toEqual({
          input: t.input,
          stored: t.stored,
          output: before.output,
        });
        expect(deskAt(brief, h, 3 * i + 3)).toEqual({ input: t.input, stored: t.stored, output: t.output });
      });
      expect(deskAt(brief, h, 9).output).toBe(output);
    }
  });
});

describe('Memory Desk levels 2–3: briefs and Check', () => {
  it('level 2 asks for the second picture and then the first, from an empty drawer and shut hatches', () => {
    for (const seed of SEEDS) {
      const [a, b] = hatchBriefs(2, new Rng(seed));
      expect(a.queue).toHaveLength(2);
      expect(a.queue[0]).not.toBe(a.queue[1]);
      expect(b.queue).toEqual(a.queue);
      expect([a.target, b.target]).toEqual([a.queue[1], a.queue[0]]);
      for (const brief of [a, b]) {
        expect(brief.initialStored).toBeNull();
        expect(brief.preset).toEqual([false, false]);
        expect(passes(brief, brief.preset)).toBe(false);
      }
      expect(solutions(a)).toEqual([
        [false, true],
        [true, true],
      ]);
      // Write, then hold: the one setting the level is for.
      expect(solutions(b)).toEqual([[true, false]]);
    }
  });

  it('level 3 is two different repairs: three steps, a kept token, a wrong preset one hatch from an answer', () => {
    for (const seed of SEEDS) {
      const briefs = hatchBriefs(3, new Rng(seed));
      expect(briefs).toHaveLength(2);
      expect(repairOf(briefs[0])).not.toBe(repairOf(briefs[1]));
      for (const brief of briefs) {
        expect(brief.queue).toHaveLength(3);
        expect(brief.initialStored).not.toBeNull();
        expect(new Set([brief.initialStored, ...brief.queue]).size).toBe(3);
        expect([brief.initialStored, ...brief.queue]).toContain(brief.target);
        expect(brief.target).not.toBe(brief.queue[2]);
        expect(passes(brief, [true, true, true])).toBe(false);
        expect(passes(brief, brief.preset)).toBe(false);
        expect(Math.min(...solutions(brief).map((s) => distance(s, brief.preset)))).toBe(1);
      }
    }
  });

  it('solutions are exactly the settings that pass, by brute force, and there is always one', () => {
    for (const brief of [...briefsAt(2), ...briefsAt(3)]) {
      const brute = allSettings(brief.queue.length).filter((h) => run(brief, h).output === brief.target);
      expect(solutions(brief)).toEqual(brute);
      expect(brute.length).toBeGreaterThan(0);
    }
    expect(allSettings(2)).toHaveLength(4);
    expect(new Set(allSettings(3).map(String)).size).toBe(8);
  });

  it('the same seed gives the same briefs; across seeds every token and every kind of repair appears', () => {
    for (const level of [2, 3])
      expect(hatchBriefs(level, new Rng(11))).toEqual(hatchBriefs(level, new Rng(11)));
    const all = briefsAt(3);
    expect(new Set(all.flatMap((b) => b.queue)).size).toBe(TOKENS.length);
    expect(new Set(briefsAt(2).map((b) => b.target)).size).toBe(TOKENS.length);
    expect(new Set(all.map(repairOf))).toEqual(new Set(['held', 'first', 'second']));
    // The kept token is wanted (every hatch shut is the only answer), or the first or second to arrive is.
    for (const b of all.filter((b) => repairOf(b) === 'held'))
      expect(solutions(b)).toEqual([[false, false, false]]);
    expect(all.some((b) => b.target === b.queue[0])).toBe(true);
    expect(all.some((b) => b.target === b.queue[1])).toBe(true);
    expect(new Set(all.map((b) => String(b.preset))).size).toBeGreaterThan(3);
  });
});

describe('Memory Desk levels 2–3: Help', () => {
  it('names the lowest hatch that differs from the nearest answer, and nothing once the setting passes', () => {
    for (const brief of [...briefsAt(2).slice(0, 40), ...briefsAt(3).slice(0, 120)])
      for (const h of allSettings(brief.queue.length)) {
        const at = helpFor(h, brief);
        if (passes(brief, h)) {
          expect(at).toBeNull();
          continue;
        }
        const near = nearestSolution(h, brief);
        expect(distance(h, near)).toBe(Math.min(...solutions(brief).map((s) => distance(s, h))));
        expect(at).toBe(near.findIndex((v, i) => v !== h[i]));
      }
  });

  it('from every setting, following it gets one hatch nearer each press and passes within as many presses as hatches', () => {
    for (const brief of [...briefsAt(2).slice(0, 40), ...briefsAt(3).slice(0, 120)])
      for (const start of allSettings(brief.queue.length)) {
        const h = [...start];
        const far = (x: boolean[]) => Math.min(...solutions(brief).map((s) => distance(s, x)));
        let presses = 0;
        for (let at = helpFor(h, brief); at !== null; at = helpFor(h, brief)) {
          const before = far(h);
          h[at] = !h[at];
          expect(far(h)).toBe(before - 1);
          presses++;
        }
        expect(passes(brief, h)).toBe(true);
        expect(presses).toBeLessThanOrEqual(brief.queue.length);
      }
  });

  it('a level 3 desk is one Help-named hatch from passing', () => {
    for (const brief of briefsAt(3)) {
      const h = [...brief.preset];
      const at = helpFor(h, brief)!;
      h[at] = !h[at];
      expect(passes(brief, h)).toBe(true);
    }
  });
});

describe('Memory Desk levels 2–3: layout', () => {
  const hit = (a: Rect, b: Rect) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
  const target = (what: string, r: Rect): Target => ({
    what,
    x: r.x + r.w / 2,
    y: r.y + r.h / 2,
    w: r.w,
    h: r.h,
  });
  const views = {
    landscape: computeView(1024, 768),
    portrait: computeView(768, 1024),
    'wide phone': computeView(844, 390),
    ...UPRIGHT_VIEWS,
  };
  const cases = Object.entries(views).flatMap(([name, v]) => [2, 3].map((n) => [name, n, v] as const));

  it.each(cases)(
    'on %s with %i steps every part is full size, in view, apart and clear of the corners',
    (_, n, v) => {
      const l = hatchLayout(n, v);
      expect(l.stacked).toBe(v.h > v.w);
      expect(l.scale).toBeGreaterThanOrEqual(1);
      const panels = [l.tray, l.drawer, l.window];
      for (const p of panels) expect(Math.min(p.w, p.h)).toBeGreaterThanOrEqual(140);
      for (const row of [l.cards, l.hatches, l.presetTrace, l.trace]) expect(row).toHaveLength(n);
      for (const h of l.hatches) expect(Math.min(h.w, h.h)).toBeGreaterThanOrEqual(110);
      const pictures = [
        ...panels.map((p, i) => target(['tray', 'drawer', 'window'][i], p)),
        target('sign', l.sign),
        ...l.cards.map((r, i) => target(`card ${i + 1}`, r)),
        ...l.presetTrace.map((r, i) => target(`preset trace ${i + 1}`, r)),
        ...l.trace.map((r, i) => target(`trace ${i + 1}`, r)),
      ];
      const targets = [
        ...l.hatches.map((r, i) => target(`hatch ${i + 1}`, r)),
        target('Step', l.step),
        target('Slow', l.slow),
        target('Undo', l.undo),
        target('Check', l.check),
      ];
      expect(uprightProblems(v, targets)).toEqual([]);
      // The pictures are not targets (some are small by design), but they stay in view, apart and off the chrome.
      expect(uprightProblems(v, [...targets, ...pictures], 0)).toEqual([]);
      const corners: Rect[] = [
        { x: 0, y: 0, w: 130, h: 215 },
        { x: 0, y: v.h - 170, w: 160, h: 170 },
      ];
      for (const t of [...targets, ...pictures])
        for (const c of corners)
          expect(hit({ x: t.x - t.w / 2, y: t.y - t.h / 2, w: t.w, h: t.h }, c), t.what).toBe(false);
    },
  );

  it('steps read left to right over the desk; an upright view stacks the panels and grows rather than shrinks', () => {
    const wide = hatchLayout(3, views.landscape);
    expect(wide.scale).toBe(1);
    expect(wide.tray.x).toBeLessThan(wide.drawer.x);
    expect(wide.drawer.x).toBeLessThan(wide.window.x);
    const tall = hatchLayout(3, UPRIGHT_VIEWS.phone);
    expect(tall.scale).toBeGreaterThan(1.3);
    expect(tall.tray.y).toBeLessThan(tall.drawer.y);
    expect(tall.drawer.y).toBeLessThan(tall.window.y);
    for (const l of [wide, tall])
      l.hatches.forEach((h, i) => {
        if (i) expect(h.x).toBeGreaterThan(l.hatches[i - 1].x);
        expect(l.cards[i].y).toBeLessThan(h.y);
        expect(h.y).toBeLessThan(l.presetTrace[i].y);
        expect(l.presetTrace[i].y).toBeLessThan(l.trace[i].y);
        expect(l.trace[i].y + l.trace[i].h).toBeLessThanOrEqual(l.tray.y);
      });
  });
});

describe('Memory Desk ladder', () => {
  it('is three school levels, each with a name', () => {
    expect(LEVELS).toEqual({ school: { min: 1, max: 3 } });
    expect([1, 2, 3].map(describeLevel)).toEqual(['Keep one', 'Open or shut', 'Fix the desk']);
  });
});

describe('Memory Desk layout', () => {
  const overlaps = (a: Rect, b: Rect) =>
    a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
  const target = (what: string, r: Rect): Target => ({
    what,
    x: r.x + r.w / 2,
    y: r.y + r.h / 2,
    w: r.w,
    h: r.h,
  });
  const views = {
    landscape: computeView(1024, 768),
    portrait: computeView(768, 1024),
    'wide phone': computeView(844, 390),
    ...UPRIGHT_VIEWS,
  };

  it.each(Object.entries(views))(
    'on %s every part is full size, in view, apart and clear of the corners',
    (_, v) => {
      const l = deskLayout(1, v);
      expect(l.stacked).toBe(v.h > v.w);
      const panels = [l.tray, l.drawer, l.window];
      for (const p of panels) expect(Math.min(p.w, p.h)).toBeGreaterThanOrEqual(140);
      for (const c of l.cards) expect(Math.min(c.w, c.h)).toBeGreaterThanOrEqual(110);
      for (const b of [l.keep, l.show]) {
        expect(b.w).toBeGreaterThanOrEqual(120);
        expect(b.h).toBeGreaterThanOrEqual(100);
      }
      const targets = [
        target('card 1', l.cards[0]),
        target('card 2', l.cards[1]),
        target('Keep', l.keep),
        target('Show', l.show),
        target('Undo', l.undo),
        target('Done', l.done),
      ];
      // The panels are pictures, not targets, but nothing may sit on them and they stay clear of the chrome too.
      expect(
        uprightProblems(v, [...targets, ...panels.map((p, i) => target(['tray', 'drawer', 'window'][i], p))]),
      ).toEqual([]);
      // Sorting Machine's wider corners (the home column 130 × 215, the guide 160 × 170).
      const corners: Rect[] = [
        { x: 0, y: 0, w: 130, h: 215 },
        { x: 0, y: v.h - 170, w: 160, h: 170 },
      ];
      for (const r of [...panels, ...l.cards, l.keep, l.show, l.undo, l.done])
        for (const c of corners) expect(overlaps(r, c)).toBe(false);
    },
  );

  it('grows the stack on a tall phone instead of leaving it small, and never shrinks it', () => {
    expect(deskLayout(1, views.landscape).scale).toBe(1);
    for (const v of Object.values(views)) expect(deskLayout(1, v).scale).toBeGreaterThanOrEqual(1);
    const phone = deskLayout(1, UPRIGHT_VIEWS.phone);
    expect(phone.scale).toBeGreaterThan(1.3);
    expect(phone.tray.w).toBeCloseTo(176 * phone.scale);
  });

  it('reads tray, drawer, window left to right in landscape and top to bottom when stacked', () => {
    const wide = deskLayout(1, views.landscape);
    expect(wide.tray.x).toBeLessThan(wide.drawer.x);
    expect(wide.drawer.x).toBeLessThan(wide.window.x);
    expect(wide.keep.x).toBeGreaterThan(wide.tray.x);
    expect(wide.keep.x + wide.keep.w).toBeLessThan(wide.window.x);
    const tall = deskLayout(1, UPRIGHT_VIEWS.phone);
    expect(tall.tray.y).toBeLessThan(tall.keep.y);
    expect(tall.keep.y).toBeLessThan(tall.drawer.y);
    expect(tall.drawer.y).toBeLessThan(tall.show.y);
    expect(tall.show.y).toBeLessThan(tall.window.y);
  });
});
