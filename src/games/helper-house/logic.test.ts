import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { computeView } from '../../engine/view';
import {
  ARRIVALS, STEPS, SUN_SCRIPTS, Tally, briefFor, candidateBoards, complete, corners, dayFor, glowFor, helpFor, houseLayout, meetsGoal,
  nextMove, offersSetup, openRows, overlaps, placeSensor, runDay, setRow, solutions, startBoard, type Board, type Day, type SunLevel,
} from './logic';

const SEEDS = Array.from({ length: 120 }, (_, i) => i);
const briefs = (level: number) => SEEDS.map((s) => briefFor(level, new Rng(s)));
const day = (sun: number, arrivals: number[] = []): Day => ({ sun: SUN_SCRIPTS[sun].slice(), arrivals });
const level3 = (reading: SunLevel | null): Board => setRow(startBoard(3), 1, reading);

describe('the step model', () => {
  it('runs world, read, rules, act in order: the eye at the door lets each friend in at its own step', () => {
    const d = day(0, [2, 5, 8]);
    const { trace, met, failure } = runDay(placeSensor(startBoard(1), 'eye', 'door'), d);
    expect(trace).toHaveLength(STEPS);
    expect(trace.map((t) => t.reading)).toEqual(['far', 'far', 'near', 'far', 'far', 'near', 'far', 'far', 'near', 'far', 'far', 'far']);
    expect(trace.map((t) => t.matched)).toEqual([null, null, 0, null, null, 0, null, null, 0, null, null, null]);
    expect(trace.map((t) => t.inside)).toEqual([0, 0, 1, 1, 1, 2, 2, 2, 3, 3, 3, 3]);
    expect(trace.every((t) => t.waiting === 0)).toBe(true);
    expect(trace.map((t) => t.opened)).toEqual(trace.map((t) => t.matched === 0));
    expect(trace.every((t) => !t.helperOn)).toBe(true);
    expect(met).toBe(true);
    expect(failure).toBeNull();
  });
  it('reads far from the window or the bench, so the friends wait all day', () => {
    const d = day(0, [2, 5, 8]);
    for (const socket of ['window', null] as const) {
      const { trace, failure } = runDay(placeSensor(startBoard(1), 'eye', socket), d);
      expect(trace.every((t) => t.reading === 'far' && t.matched === null && !t.helperOn)).toBe(true);
      expect(trace[STEPS - 1]).toMatchObject({ waiting: 3, inside: 0 });
      expect(failure).toBe('friend-waiting');
    }
  });
  it('keeps the helper where it was when no row matches: the lamp stays on after dusk', () => {
    const d = day(0);
    const { trace } = runDay(placeSensor(startBoard(2), 'sun', 'post'), d);
    const firstDark = d.sun.indexOf('dark');
    trace.forEach((t, i) => expect(t.helperOn).toBe(i >= firstDark));
    expect(trace.filter((t) => t.matched === 0)).toHaveLength(d.sun.filter((s) => s === 'dark').length);
  });
  it('lets the later of two matching rows win: dark → off under dark → on never lights the lamp', () => {
    const { trace, failure } = runDay(level3('dark'), day(1));
    expect(trace.every((t) => !t.helperOn)).toBe(true);
    expect(trace.filter((t) => t.sun === 'dark').every((t) => t.matched === 1)).toBe(true);
    expect(failure).toBe('lamp-off-at-night');
  });
  it('never matches an empty row', () => {
    const { trace } = runDay(level3(null), day(2));
    expect(trace.every((t) => t.matched !== 1)).toBe(true);
    expect(trace[STEPS - 1].helperOn).toBe(true);
  });
});

describe('the day scripts', () => {
  it('start dim, hold four bright steps, a dim dusk, three dark steps, a dim dawn, and end bright', () => {
    for (const s of SUN_SCRIPTS) {
      expect(s).toHaveLength(STEPS);
      expect(s[0]).toBe('dim');
      expect(s[STEPS - 1]).toBe('bright');
      const firstDark = s.indexOf('dark');
      const lastDark = s.lastIndexOf('dark');
      expect(s.slice(firstDark, lastDark + 1).every((x) => x === 'dark')).toBe(true);
      expect(lastDark - firstDark + 1).toBeGreaterThanOrEqual(3);
      expect(s[firstDark - 1]).toBe('dim');
      expect(s[lastDark + 1]).toBe('dim');
      const brightRun = s.slice(1, firstDark - 1);
      expect(brightRun.filter((x) => x === 'bright').length).toBeGreaterThanOrEqual(4);
      expect(brightRun.join(',')).toMatch(/bright,bright,bright,bright/);
    }
  });
  it('bring exactly three friends at distinct steps among 1–10, at least two steps apart', () => {
    for (const a of ARRIVALS) {
      expect(a).toHaveLength(3);
      expect(a.every((s) => s >= 1 && s <= 10)).toBe(true);
      expect(a[1] - a[0]).toBeGreaterThanOrEqual(2);
      expect(a[2] - a[1]).toBeGreaterThanOrEqual(2);
    }
  });
  it('are seeded: the same seed gives the same day and cast, and every script appears', () => {
    for (const s of SEEDS.slice(0, 20)) {
      expect(briefFor(3, new Rng(s))).toEqual(briefFor(3, new Rng(s)));
      expect(briefFor(1, new Rng(s))).toEqual(briefFor(1, new Rng(s)));
    }
    const sunSeen = new Set(briefs(2).map((b) => b.day.sun.join('')));
    expect(sunSeen.size).toBe(SUN_SCRIPTS.length);
    const arrivalsSeen = new Set(briefs(1).map((b) => b.day.arrivals.join('')));
    expect(arrivalsSeen.size).toBe(ARRIVALS.length);
    expect(dayFor(1, new Rng(1)).sun).toEqual(SUN_SCRIPTS[0]);
  });
});

describe('the board space', () => {
  const sizes: Record<number, number> = { 1: 3, 2: 3, 3: 4 };
  it('is enumerated and bounded, with the starting board failing and an accepted board on every day', () => {
    for (const level of [1, 2, 3]) {
      for (const b of briefs(level)) {
        const boards = candidateBoards(b);
        expect(boards).toHaveLength(sizes[level]);
        expect(boards.some((x) => !complete(x))).toBe(true);
        expect(meetsGoal(b.board, b.day)).toBe(false);
        const right = solutions(b);
        expect(right.length).toBeGreaterThan(0);
        for (const r of right) expect(complete(r)).toBe(true);
      }
    }
  });
  it('accepts only the eye at the door (1), only the sun sensor (2), and exactly bright → off and dim → off (3)', () => {
    for (const b of briefs(1)) expect(solutions(b).map((s) => s.sensor.socket)).toEqual(['door']);
    for (const b of briefs(2)) expect(solutions(b).map((s) => s.sensor.kind)).toEqual(['sun']);
    for (const b of briefs(3)) {
      expect(solutions(b).map((s) => s.rows[1].reading).sort()).toEqual(['bright', 'dim']);
      for (const r of ['bright', 'dim'] as const) {
        const { trace } = runDay(level3(r), b.day);
        expect(trace.filter((t) => t.sun === 'dark').every((t) => t.helperOn)).toBe(true);
        expect(trace[STEPS - 1].helperOn).toBe(false);
      }
    }
  });
  it('has the overlap property at level 3: the given row alone is sensible and still leaves the lamp on at step 11', () => {
    for (const b of briefs(3)) {
      const { trace, failure } = runDay(b.board, b.day);
      expect(trace.filter((t) => t.sun === 'dark').every((t) => t.helperOn)).toBe(true);
      expect(failure).toBe('lamp-on-at-morning');
    }
  });
  it('names one failure for every failing board', () => {
    for (const level of [1, 2, 3]) {
      for (const b of briefs(level).slice(0, 10)) {
        for (const board of candidateBoards(b)) {
          const o = runDay(board, b.day);
          expect(o.failure === null).toBe(o.met);
        }
      }
    }
    expect(runDay(placeSensor(startBoard(2), 'eye', 'post'), day(0)).failure).toBe('sensor-blind');
    expect(runDay(startBoard(2), day(0)).failure).toBe('sensor-blind');
  });
  it('never changes a given row', () => {
    const b = setRow(startBoard(3), 0, 'bright');
    expect(b.rows[0].reading).toBe('dark');
    expect(openRows(b)).toEqual([1]);
    expect(placeSensor(startBoard(3), 'eye', 'door')).toEqual(startBoard(3));
  });
});

describe('glow, help and the offer', () => {
  it('points each failure at a piece whose change reaches an accepted board', () => {
    for (const level of [1, 2, 3]) {
      for (const b of briefs(level).slice(0, 10)) {
        for (const board of candidateBoards(b)) {
          const o = runDay(board, b.day);
          if (o.met) continue;
          const piece = glowFor(board, o.failure!);
          const fixed = helpFor(board, b, 1);
          expect(fixed.placed).toBe(piece);
          expect(meetsGoal(fixed.board, b.day)).toBe(true);
        }
      }
    }
  });
  it('reaches an accepted board by the second press from every partial state, then has nothing left to place', () => {
    for (const level of [1, 2, 3]) {
      for (const b of briefs(level).slice(0, 10)) {
        for (const board of candidateBoards(b)) {
          const one = helpFor(board, b, 1);
          const two = helpFor(one.board, b, 2);
          expect(meetsGoal(two.board, b.day)).toBe(true);
          expect(two.placed).toBeNull();
        }
      }
    }
  });
  it('lights the piece after the same failure twice, not once, counts one hint, and resets when the piece changes', () => {
    const t = new Tally();
    const board = startBoard(3);
    expect(t.failed(board, 'lamp-on-at-morning')).toBe(false);
    expect(t.glowing).toBeNull();
    expect(t.hints).toBe(0);
    expect(t.failed(board, 'lamp-on-at-morning')).toBe(true);
    expect(t.glowing).toBe('row');
    expect(t.hints).toBe(1);
    expect(t.failed(board, 'lamp-on-at-morning')).toBe(false);
    expect(t.hints).toBe(1);
    t.changed('row');
    expect(t.glowing).toBeNull();
    expect(t.failed(level3('dark'), 'lamp-off-at-night')).toBe(false);
    expect(t.failed(level3('dark'), 'lamp-off-at-night')).toBe(true);
    expect(t.hints).toBe(2);
    expect(t.misses).toBe(0);
  });
  it('does not light on two different failures in a row', () => {
    const t = new Tally();
    expect(t.failed(level3('dark'), 'lamp-off-at-night')).toBe(false);
    expect(t.failed(level3(null), 'lamp-on-at-morning')).toBe(false);
    expect(t.glowing).toBeNull();
  });
  it('offers the set-up after three failed days, and counts Show me and the offer as hints', () => {
    const t = new Tally();
    t.failed(startBoard(1), 'friend-waiting');
    t.failed(startBoard(1), 'friend-waiting');
    expect(offersSetup(t)).toBe(false);
    t.failed(startBoard(1), 'friend-waiting');
    expect(offersSetup(t)).toBe(true);
    expect(t.help()).toBe(1);
    t.offered();
    expect(t.hints).toBe(3);
  });
});

describe('the ghost finger', () => {
  it('places the right piece then watches at levels 1–2, and at level 3 watches once before filling the row', () => {
    for (const b of briefs(1).slice(0, 5)) {
      expect(nextMove(b, b.board, 0)).toEqual({ place: { kind: 'eye', socket: 'door' } });
      expect(nextMove(b, placeSensor(b.board, 'eye', 'window'), 1)).toEqual({ place: { kind: 'eye', socket: 'door' } });
      expect(nextMove(b, placeSensor(b.board, 'eye', 'door'), 0)).toEqual({ watch: true });
    }
    for (const b of briefs(2).slice(0, 5)) {
      expect(nextMove(b, b.board, 0)).toEqual({ place: { kind: 'sun', socket: 'post' } });
      expect(nextMove(b, placeSensor(b.board, 'sun', 'post'), 0)).toEqual({ watch: true });
    }
    for (const b of briefs(3).slice(0, 5)) {
      expect(nextMove(b, b.board, 0)).toEqual({ watch: true });
      expect(nextMove(b, b.board, 1)).toEqual({ chip: 'bright', row: 1 });
      expect(nextMove(b, level3('dark'), 1)).toEqual({ chip: 'bright', row: 1 });
      expect(nextMove(b, level3('dim'), 1)).toEqual({ watch: true });
    }
  });
});

describe('the layout', () => {
  const views = { landscape: computeView(1024, 768), portrait: computeView(768, 1024) };
  const all = (l: NonNullable<ReturnType<typeof houseLayout>>) => [l.house, ...l.rows.flatMap((r) => [r.reading, r.action]), ...l.bench, l.watch, l.step, l.undo, ...l.sockets];
  it('holds full-size targets clear of the corners in both orientations at every level', () => {
    for (const level of [1, 2, 3]) {
      const b = briefFor(level, new Rng(7));
      for (const [name, v] of Object.entries(views)) {
        const l = houseLayout(b, v);
        expect(l, `${name} level ${level}`).not.toBeNull();
        for (const t of [...l!.bench, ...l!.sockets]) expect(Math.min(t.w, t.h)).toBeGreaterThanOrEqual(110);
        for (const r of l!.rows) { expect(r.reading.w).toBeGreaterThanOrEqual(130); expect(r.reading.h).toBeGreaterThanOrEqual(110); expect(r.action.w).toBeGreaterThanOrEqual(130); }
        expect(l!.watch.w).toBeGreaterThanOrEqual(120);
        expect(l!.watch.h).toBeGreaterThanOrEqual(100);
        expect(Math.min(l!.step.w, l!.undo.w)).toBeGreaterThanOrEqual(100);
        const buttons = [...l!.rows.flatMap((r) => [r.reading, r.action]), ...l!.bench, l!.watch, l!.step, l!.undo];
        for (const p of buttons) {
          expect(corners(v).some((c) => overlaps(p, c)), `${name} level ${level} under a corner`).toBe(false);
          expect(p.x >= 0 && p.y >= 0 && p.x + p.w <= v.w && p.y + p.h <= v.h).toBe(true);
        }
        expect(l!.sockets).toHaveLength(b.sockets.length);
        expect(l!.bench).toHaveLength(level === 3 ? 3 : level);
        const parts = all(l!).filter((p) => p !== l!.house);
        parts.forEach((p, i) => parts.forEach((q, j) => { if (i < j) expect(overlaps(p, q), `${name} level ${level} overlap ${i}/${j}`).toBe(false); }));
      }
    }
  });
  it('stacks the house above the board in portrait rather than shrinking anything', () => {
    const b = briefFor(3, new Rng(3));
    const l = houseLayout(b, views.portrait)!;
    expect(l.rows[0].reading.y).toBeGreaterThanOrEqual(l.house.y + l.house.h);
    const wide = houseLayout(b, views.landscape)!;
    expect(wide.rows[0].reading.x).toBeGreaterThanOrEqual(wide.house.x + wide.house.w);
    expect(wide.house.w).toBe(l.house.w === wide.house.w ? l.house.w : wide.house.w);
  });
  it('returns null rather than shrink on a phone', () => {
    expect(() => houseLayout(briefFor(3, new Rng(1)), computeView(844, 390))).not.toThrow();
  });
});
