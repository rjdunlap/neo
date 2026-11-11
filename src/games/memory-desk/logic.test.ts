import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { computeView } from '../../engine/view';
import { uprightProblems, UPRIGHT_VIEWS, type Target } from '../upright-check';
import {
  actionFor,
  apply,
  briefFor,
  contrastSeen,
  deskLayout,
  describeLevel,
  EMPTY,
  keep,
  LEVELS,
  nextMove,
  replay,
  setInput,
  show,
  stateAfter,
  TOKENS,
  type Action,
  type Brief,
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

describe('Memory Desk ladder', () => {
  it('is one school level with a name', () => {
    expect(LEVELS).toEqual({ school: { min: 1, max: 1 } });
    expect(describeLevel(1)).toBe('Keep one');
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
