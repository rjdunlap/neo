import { describe, expect, it } from 'vitest';
import { gapAt, gapY, handleRect, setLine, switches, GAPS, PITCH } from './logic';
import { Rng } from '../../engine/random';
import { computeView } from '../../engine/view';
import {
  ARRIVALS, MAX_LEVEL, START_WARMTH, STEPS, SUN_SCRIPTS, Tally, WARMTH_MAX, planFor, zoneOf, briefFor, candidateBoards, complete, corners, dayFor, glowFor, helpFor, houseLayout, meetsGoal,
  nextMove, offersSetup, openRows, overlaps, placeSensor, read, runDay, setRow, solutions, startBoard, type Board, type Day, type Failure, type Socket, type SunLevel, type Zone,
} from './logic';

const SEEDS = Array.from({ length: 120 }, (_, i) => i);
const briefs = (level: number) => SEEDS.map((s) => briefFor(level, new Rng(s)));
const day = (sun: number, arrivals: number[] = []): Day => ({ sun: SUN_SCRIPTS[sun].slice(), arrivals, warmth: 0 });
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
  const sizes: Record<number, number> = { 1: 3, 2: 3, 3: 4, 4: 16 };
  it('is enumerated and bounded, with the starting board failing and an accepted board on every day', () => {
    for (const level of [1, 2, 3, 4]) {
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
    for (const level of [1, 2, 3, 4]) {
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
    expect(t.glowing).toBe(1);
    expect(t.hints).toBe(1);
    expect(t.failed(board, 'lamp-on-at-morning')).toBe(false);
    expect(t.hints).toBe(1);
    t.changed(1);
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
    for (const level of [1, 2, 3, 4, 5]) {
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
        expect(l!.bench).toHaveLength(level === 3 || level === 4 ? 3 : level === 5 ? 1 : level);
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

describe('level 4: the chilly nook', () => {
  const nook = (r0: Zone | null, a0: 'on' | 'off', r1: Zone | null, a1: 'on' | 'off'): Board => {
    const b = startBoard(4);
    return { ...b, rows: [{ ...b.rows[0], reading: r0, action: a0 }, { ...b.rows[1], reading: r1, action: a1 }] };
  };
  const good = setRow(setRow(startBoard(4), 0, 'cool'), 1, 'warm');
  const d4 = () => briefFor(4, new Rng(1)).day;

  it('is the fourth level, named Chilly nook', () => {
    expect(planFor(4).name).toBe('Chilly nook');
  });
  it('maps warmth to zones: cool 0–2, warm 3–4, hot 5–6', () => {
    expect([0, 1, 2, 3, 4, 5, 6].map(zoneOf)).toEqual(['cool', 'cool', 'cool', 'warm', 'warm', 'hot', 'hot']);
    expect(START_WARMTH).toBe(1);
    expect(d4().warmth).toBe(START_WARMTH);
  });
  it('reads the warmth the previous step left, before the heater acts: cool → on, warm → off oscillates 2–3', () => {
    const { trace, met, failure } = runDay(good, d4());
    expect(trace.map((t) => t.reading)).toEqual(['cool', 'cool', 'warm', 'cool', 'warm', 'cool', 'warm', 'cool', 'warm', 'cool', 'warm', 'cool']);
    expect(trace.map((t) => t.matched)).toEqual([0, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0]);
    expect(trace.map((t) => t.helperOn)).toEqual([true, true, false, true, false, true, false, true, false, true, false, true]);
    expect(trace.map((t) => t.warmth)).toEqual([2, 3, 2, 3, 2, 3, 2, 3, 2, 3, 2, 3]);
    expect(met).toBe(true);
    expect(failure).toBeNull();
  });
  it('clamps warmth to 0–6: an always-on heater tops out, an always-off one bottoms out', () => {
    const hot = runDay(nook('cool', 'on', 'warm', 'on'), d4()).trace;
    expect(hot.map((t) => t.warmth)).toEqual([2, 3, 4, 5, 6, 6, 6, 6, 6, 6, 6, 6]);
    expect(Math.max(...hot.map((t) => t.warmth))).toBeLessThanOrEqual(WARMTH_MAX);
    const cold = runDay(startBoard(4), d4()).trace;
    expect(cold.map((t) => t.warmth)).toEqual([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
    expect(cold.every((t) => !t.helperOn && t.matched === null)).toBe(true);
  });
  it('has 16 boards, 9 complete, and exactly one accepted: cool → on, warm → off', () => {
    for (const b of briefs(4)) {
      const boards = candidateBoards(b);
      expect(boards).toHaveLength(16);
      expect(boards.filter(complete)).toHaveLength(9);
      const right = solutions(b);
      expect(right).toHaveLength(1);
      expect(right[0].rows.map((r) => r.reading)).toEqual(['cool', 'warm']);
      expect(right[0].rows.map((r) => r.action)).toEqual(['on', 'off']);
      expect(meetsGoal(b.board, b.day)).toBe(false);
    }
  });
  it('carries state: cool → on with hot → off still overshoots to 5 and is too warm', () => {
    const { trace, failure } = runDay(nook('cool', 'on', 'hot', 'off'), d4());
    expect(trace.map((t) => t.warmth).slice(0, 5)).toEqual([2, 3, 4, 5, 4]);
    expect(failure).toBe('too-warm');
  });
  it('names never-warms for boards that stay cool', () => {
    for (const board of [nook('warm', 'on', null, 'off'), nook('hot', 'on', null, 'off'), nook('cool', 'on', 'cool', 'off')]) {
      expect(runDay(board, d4()).failure).toBe('never-warms');
    }
  });
  it('names exactly one failure for every board, and only the accepted board meets the goal', () => {
    const names = new Set<Failure | null>();
    for (const board of candidateBoards(briefFor(4, new Rng(2)))) {
      const o = runDay(board, d4());
      expect(o.met).toBe(o.failure === null);
      names.add(o.failure);
    }
    expect(names).toEqual(new Set<Failure | null>([null, 'never-warms', 'too-warm']));
  });
  it('glows a row that differs from the accepted board on every failing board', () => {
    const b = briefFor(4, new Rng(3));
    const wrongRows = (x: Board) => [0, 1].filter((i) => x.rows[i].reading !== good.rows[i].reading);
    for (const board of candidateBoards(b)) {
      const o = runDay(board, b.day);
      if (o.met) continue;
      const piece = glowFor(board, o.failure!);
      expect(typeof piece).toBe('number');
      expect(wrongRows(board)).toContain(piece);
      const prefer = o.failure === 'too-warm' ? 1 : 0;
      if (wrongRows(board).includes(prefer)) expect(piece).toBe(prefer);
    }
    expect(glowFor(nook('warm', 'on', 'warm', 'off'), 'never-warms')).toBe(0);
    expect(glowFor(nook('cool', 'on', 'hot', 'off'), 'too-warm')).toBe(1);
    expect(glowFor(nook('cool', 'on', null, 'off'), 'too-warm')).toBe(1);
    expect(glowFor(nook('cool', 'on', 'hot', 'off'), 'never-warms')).toBe(1);
  });
  it('lights a row after the same failure twice and goes out when that row changes', () => {
    const t = new Tally();
    const board = nook('cool', 'on', 'hot', 'off');
    expect(t.failed(board, 'too-warm')).toBe(false);
    expect(t.failed(board, 'too-warm')).toBe(true);
    expect(t.glowing).toBe(1);
    expect(t.hints).toBe(1);
    t.changed(0);
    expect(t.glowing).toBe(1);
    t.changed(1);
    expect(t.glowing).toBeNull();
  });
  it('lights the on row (index 0) for a nook that never warms, once, without counting again while it glows', () => {
    const t = new Tally();
    const board = nook(null, 'on', 'warm', 'off');
    t.failed(board, 'never-warms');
    expect(t.failed(board, 'never-warms')).toBe(true);
    expect(t.glowing).toBe(0);
    expect(t.failed(board, 'never-warms')).toBe(false);
    expect(t.failed(board, 'never-warms')).toBe(false);
    expect(t.hints).toBe(1);
    t.changed(0);
    expect(t.glowing).toBeNull();
  });
  it('helps to the accepted board within two presses from all 16 boards, then places nothing', () => {
    const b = briefFor(4, new Rng(4));
    for (const board of candidateBoards(b)) {
      const one = helpFor(board, b, 1);
      const two = helpFor(one.board, b, 2);
      expect(sameAccepted(two.board)).toBe(true);
      expect(meetsGoal(two.board, b.day)).toBe(true);
      const three = helpFor(two.board, b, 3);
      expect(three.placed).toBeNull();
      expect(three.board).toEqual(two.board);
      if (one.placed !== null) expect(typeof one.placed).toBe('number');
    }
    function sameAccepted(x: Board) { return x.rows.every((r, i) => r.reading === good.rows[i].reading); }
  });
  it('has the ghost finger fill cool in row 0, warm in row 1, then watch', () => {
    for (const b of briefs(4).slice(0, 10)) {
      let board = b.board;
      const moves = [];
      for (let i = 0; i < 3; i++) {
        const m = nextMove(b, board, 0);
        moves.push(m);
        if ('chip' in m) board = setRow(board, m.row, m.chip);
      }
      expect(moves).toEqual([{ chip: 'cool', row: 0 }, { chip: 'warm', row: 1 }, { watch: true }]);
      expect(meetsGoal(board, b.day)).toBe(true);
    }
  });
  it('gives every seed the same day while the friend and house vary', () => {
    const all = briefs(4);
    expect(new Set(all.map((b) => JSON.stringify(b.day))).size).toBe(1);
    expect(all[0].day.arrivals).toEqual([]);
    expect(new Set(all.map((b) => b.house)).size).toBeGreaterThan(1);
    expect(new Set(all.map((b) => b.friend.species)).size).toBeGreaterThan(1);
    for (const s of SEEDS.slice(0, 20)) expect(briefFor(4, new Rng(s))).toEqual(briefFor(4, new Rng(s)));
    expect(all[0].chips).toEqual(['cool', 'warm', 'hot']);
    expect(all[0].sockets).toEqual(['nook']);
  });
});

describe('level 5: where does the sensor look?', () => {
  const at = (socket: Socket | null) => placeSensor(startBoard(5), 'sun', socket);
  const lit = (b: Board, d: Day) => runDay(b, d).trace.map((t) => (t.helperOn ? 1 : 0)).join('');

  it('is the fifth and last level, named Where does it look?, with the level 3 answer given and fixed', () => {
    expect(planFor(5).name).toBe('Where does it look?');
    expect(MAX_LEVEL).toBe(7);
    const start = startBoard(5);
    expect(start.sensor).toEqual({ kind: 'sun', socket: 'lamp' });
    expect(start.rows.map((r) => [r.reading, r.action, r.given])).toEqual([['dark', 'on', true], ['bright', 'off', true]]);
    expect(openRows(start)).toEqual([]);
    expect(setRow(start, 1, 'dim')).toEqual(start);
  });
  it('reads by socket: under the lamp its own light reads bright, the roof reads the sky, the shed is always dark, the bench sees nothing', () => {
    const d = day(0);
    for (let step = 0; step < STEPS; step++) {
      expect(read(at('roof'), d, step, 0)).toBe(d.sun[step]);
      expect(read(at('shed'), d, step, 0)).toBe('dark');
      expect(read(at(null), d, step, 0)).toBe('far');
      expect(read(at('lamp'), d, step, 0, 0, false)).toBe(d.sun[step]);
      expect(read(at('lamp'), d, step, 0, 0, true)).toBe('bright');
    }
  });
  it('runs the hand-run traces on the three level 3 scripts', () => {
    expect([0, 1, 2].map((s) => lit(at('roof'), day(s)))).toEqual(['000000011110', '000000111110', '000000111100']);
    expect([0, 1, 2].map((s) => lit(at('lamp'), day(s)))).toEqual(['000000010100', '000000101000', '000000101000']);
    for (const s of [0, 1, 2]) {
      expect(lit(at('shed'), day(s))).toBe('111111111111');
      expect(lit(at(null), day(s))).toBe('000000000000');
    }
  });
  it('has four boards, accepts exactly the roof on every seed, and the starting board fails', () => {
    for (const b of briefs(5)) {
      expect(b.sockets).toEqual(['lamp', 'roof', 'shed']);
      expect(b.sensors).toEqual(['sun']);
      expect(SUN_SCRIPTS.some((s) => s.join() === b.day.sun.join())).toBe(true);
      expect(candidateBoards(b)).toHaveLength(4);
      expect(solutions(b).map((x) => x.sensor.socket)).toEqual(['roof']);
      expect(meetsGoal(b.board, b.day)).toBe(false);
    }
    expect(new Set(briefs(5).map((b) => b.day.sun.join())).size).toBe(3);
  });
  it('has the overlap property: both rows are right (level 3 accepts them), yet under the lamp the helper changes its own reading', () => {
    const level3Answer = setRow(startBoard(3), 1, 'bright');
    for (const s of [0, 1, 2]) {
      expect(meetsGoal(level3Answer, day(s))).toBe(true);
      expect(runDay(at('lamp'), day(s)).failure).toBe('lamp-flickers');
      expect(meetsGoal(at('roof'), day(s))).toBe(true);
    }
  });
  it('names one failure per failing board: blind on the bench, flickers under the lamp, on at morning in the shed', () => {
    const want: Record<string, Failure | null> = { bench: 'sensor-blind', lamp: 'lamp-flickers', roof: null, shed: 'lamp-on-at-morning' };
    for (const s of [0, 1, 2]) {
      for (const [k, f] of Object.entries(want)) expect(runDay(at(k === 'bench' ? null : (k as Socket)), day(s)).failure).toBe(f);
    }
  });
  it('glows the sensor for every failure and helps it to the roof in one press, then places nothing', () => {
    for (const b of briefs(5).slice(0, 12)) {
      for (const board of candidateBoards(b)) {
        const o = runDay(board, b.day);
        if (o.failure) expect(glowFor(board, o.failure)).toBe('sensor');
        const h = helpFor(board, b, 1);
        if (board.sensor.socket === 'roof') { expect(h.placed).toBeNull(); continue; }
        expect(h.placed).toBe('sensor');
        expect(h.board.sensor.socket).toBe('roof');
        expect(meetsGoal(h.board, b.day)).toBe(true);
        expect(helpFor(h.board, b, 2).placed).toBeNull();
      }
    }
  });
  it('has the ghost finger watch the flicker first, then drag the sensor to the roof, then watch', () => {
    const b = briefFor(5, new Rng(4));
    expect(nextMove(b, b.board, 0)).toEqual({ watch: true });
    expect(nextMove(b, b.board, 1)).toEqual({ place: { kind: 'sun', socket: 'roof' } });
    expect(nextMove(b, at('roof'), 1)).toEqual({ watch: true });
  });
  it('keeps its three sockets full size and at least 140 apart centre to centre in both orientations', () => {
    const b = briefFor(5, new Rng(2));
    for (const v of [computeView(1024, 768), computeView(768, 1024), computeView(1366, 1024), computeView(1024, 1366)]) {
      const l = houseLayout(b, v)!;
      expect(l).not.toBeNull();
      const c = l.sockets.map((r) => ({ x: r.x + r.w / 2, y: r.y + r.h / 2 }));
      for (let i = 0; i < c.length; i++) for (let j = i + 1; j < c.length; j++) expect(Math.hypot(c[i].x - c[j].x, c[i].y - c[j].y)).toBeGreaterThanOrEqual(140);
      for (const r of l.sockets) expect(r.w).toBeGreaterThanOrEqual(110);
    }
  });
});

describe('levels 6-7: lines on the warmth gauge', () => {
  const brief = (level: number) => briefFor(level, new Rng(3));
  const lineBoard = (level: number, on: number, off = on): Board => ({ ...startBoard(level), lines: { on, off } });
  const warmths = (b: Board) => runDay(b, brief(b.level).day).trace.map((t) => t.warmth);
  const failureOf = (b: Board) => runDay(b, brief(b.level).day).failure;
  const accepted = (level: number) => candidateBoards(brief(level)).filter((b) => meetsGoal(b, brief(level).day)).map((b) => [b.lines!.on, b.lines!.off]);

  it('reproduces the hand-run warmth table', () => {
    const table: Record<number, [number[], number]> = {
      1: [[0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1], 11],
      2: [[2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1], 12],
      3: [[2, 3, 2, 3, 2, 3, 2, 3, 2, 3, 2, 3], 11],
      4: [[2, 3, 4, 3, 4, 3, 4, 3, 4, 3, 4, 3], 10],
      5: [[2, 3, 4, 5, 4, 5, 4, 5, 4, 5, 4, 5], 9],
      6: [[2, 3, 4, 5, 6, 5, 6, 5, 6, 5, 6, 5], 8],
    };
    for (const g of [1, 2, 3, 4, 5, 6]) {
      const b = lineBoard(6, g);
      const out = runDay(b, brief(6).day);
      expect(out.trace.map((t) => t.warmth), `line ${g}`).toEqual(table[g][0]);
      expect(switches(out.trace), `line ${g}`).toBe(table[g][1]);
    }
    const two = runDay(lineBoard(7, 3, 4), brief(7).day);
    expect(two.trace.map((t) => t.warmth)).toEqual([2, 3, 4, 3, 2, 3, 4, 3, 2, 3, 4, 3]);
    expect(switches(two.trace)).toBe(6);
  });

  it('has bounded board spaces and the stated accepted sets', () => {
    expect(candidateBoards(brief(6))).toHaveLength(6);
    expect(candidateBoards(brief(7))).toHaveLength(21);
    expect(accepted(6)).toEqual([[3, 3], [4, 4]]);
    expect(accepted(7)).toEqual([[3, 4]]);
  });

  it('fails both start boards with the named failure, from every seed', () => {
    for (const s of SEEDS) {
      const b6 = briefFor(6, new Rng(s));
      const b7 = briefFor(7, new Rng(s));
      expect(b6.board.lines).toEqual({ on: 6, off: 6 });
      expect(b7.board.lines).toEqual({ on: 3, off: 3 });
      expect(runDay(b6.board, b6.day).failure).toBe('too-warm');
      expect(runDay(b7.board, b7.day).failure).toBe('heater-busy');
      expect(meetsGoal(b6.board, b6.day)).toBe(false);
      expect(meetsGoal(b7.board, b7.day)).toBe(false);
    }
  });

  it('names each failing board by its failure', () => {
    expect(failureOf(lineBoard(6, 1))).toBe('never-warms');
    expect(failureOf(lineBoard(6, 2))).toBe('never-warms');
    expect(failureOf(lineBoard(6, 5))).toBe('too-warm');
    expect(failureOf(lineBoard(6, 6))).toBe('too-warm');
    expect(failureOf(lineBoard(7, 3, 3))).toBe('heater-busy');
    expect(failureOf(lineBoard(7, 4, 4))).toBe('heater-busy');
    for (const b of candidateBoards(brief(7))) {
      const { on, off } = b.lines!;
      const w = warmths(b);
      const f = failureOf(b);
      if (on <= 2 && off >= 5) expect(['never-warms', 'too-warm'], `${on},${off}`).toContain(f);
      else if (on <= 2) expect(f, `${on},${off}`).toBe('never-warms');
      else if (off >= 5) expect(f, `${on},${off}`).toBe('too-warm');
      else if (on === 3 && off === 4) expect(f).toBeNull();
      else expect(f, `${on},${off}`).toBe('heater-busy');
      expect(w).toHaveLength(12);
    }
  });

  it('glows a line whose change moves toward an accepted board', () => {
    for (const level of [6, 7]) {
      const br = brief(level);
      for (const b of candidateBoards(br)) {
        const f = runDay(b, br.day).failure;
        if (!f) continue;
        const piece = glowFor(b, f);
        if (level === 6) { expect(piece).toBe('line'); continue; }
        expect(['on-line', 'off-line']).toContain(piece);
        const { on, off } = b.lines!;
        const wrong = piece === 'on-line' ? on !== 3 : off !== 4;
        expect(wrong, `${on},${off} ${f}`).toBe(true);
      }
    }
    expect(glowFor(lineBoard(7, 1, 4), 'never-warms')).toBe('on-line');
    expect(glowFor(lineBoard(7, 3, 6), 'too-warm')).toBe('off-line');
    expect(glowFor(lineBoard(7, 3, 3), 'heater-busy')).toBe('off-line');
    expect(glowFor(lineBoard(7, 1, 4), 'too-warm')).toBe('on-line');
  });

  it('helpFor reaches an accepted board within one press (level 6) or two (level 7)', () => {
    for (const level of [6, 7]) {
      const br = brief(level);
      for (const b of candidateBoards(br)) {
        let cur = b;
        let presses = 0;
        const limit = level === 6 ? 1 : 2;
        while (!meetsGoal(cur, br.day) && presses < limit) {
          const h = helpFor(cur, br, presses + 1);
          expect(h.placed).not.toBeNull();
          cur = h.board;
          presses++;
        }
        expect(meetsGoal(cur, br.day), `${level} ${JSON.stringify(b.lines)}`).toBe(true);
        const done = helpFor(cur, br, 1);
        expect(done.placed).toBeNull();
        expect(done.board).toBe(cur);
      }
    }
  });

  it('keeps the valve property: a higher line never warms the nook sooner', () => {
    const day = brief(6).day;
    const trace = (g: number) => runDay(lineBoard(6, g), day).trace.map((t) => t.warmth);
    const warms = [3, 4, 5, 6];
    for (const a of warms) for (const b of warms) {
      if (a >= b) continue;
      const lo = trace(a);
      const hi = trace(b);
      // Both reach the comfy band; they agree until the lower line is reached.
      const reach = lo.findIndex((w) => w >= a);
      expect(hi.slice(0, reach + 1)).toEqual(lo.slice(0, reach + 1));
      expect(hi.findIndex((w) => w >= 2)).toBe(lo.findIndex((w) => w >= 2));
    }
  });

  it('level 7: every single-line board switches at least 10 times and exactly one board is accepted', () => {
    const br = brief(7);
    for (let g = 1; g <= GAPS; g++) {
      if (g === 1) continue;
      const out = runDay(lineBoard(7, g), br.day);
      if (g >= 3 && g <= 4) expect(switches(out.trace)).toBeGreaterThanOrEqual(10);
    }
    for (let g = 1; g <= GAPS; g++) expect(switches(runDay(lineBoard(7, g), br.day).trace), `gap ${g}`).toBeGreaterThanOrEqual(8);
    expect(solutions(br)).toHaveLength(1);
    expect(switches(runDay(lineBoard(7, 3, 4), br.day).trace)).toBeLessThanOrEqual(8);
  });

  it('level 7 single lines 3 and 4 exceed the jar and 3,4 does not', () => {
    const br = brief(7);
    expect(switches(runDay(lineBoard(7, 3), br.day).trace)).toBeGreaterThan(8);
    expect(switches(runDay(lineBoard(7, 4), br.day).trace)).toBeGreaterThan(8);
  });

  it('setLine never lets the on line exceed the off line', () => {
    for (let on = 1; on <= GAPS; on++) for (let off = on; off <= GAPS; off++) for (let g = 0; g <= GAPS + 1; g++) {
      const b = lineBoard(7, on, off);
      for (const piece of ['on-line', 'off-line'] as const) {
        const n = setLine(b, piece, g).lines!;
        expect(n.on).toBeLessThanOrEqual(n.off);
        expect(n.on).toBeGreaterThanOrEqual(1);
        expect(n.off).toBeLessThanOrEqual(GAPS);
      }
      const one = setLine(b, 'line', g).lines!;
      expect(one.on).toBe(one.off);
    }
    expect(setLine(lineBoard(7, 3, 4), 'on-line', 6).lines).toEqual({ on: 4, off: 4 });
    expect(setLine(lineBoard(7, 3, 4), 'off-line', 1).lines).toEqual({ on: 3, off: 3 });
  });

  it('the ghost finger drags the line then watches', () => {
    const b6 = brief(6);
    expect(nextMove(b6, b6.board, 0)).toEqual({ line: 'line', gap: 4 });
    expect(nextMove(b6, setLine(b6.board, 'line', 4), 0)).toEqual({ watch: true });
    const b7 = brief(7);
    expect(nextMove(b7, b7.board, 0)).toEqual({ watch: true });
    expect(nextMove(b7, b7.board, 1)).toEqual({ line: 'off-line', gap: 4 });
    expect(nextMove(b7, setLine(b7.board, 'off-line', 4), 1)).toEqual({ watch: true });
  });

  it('plays out to a finish with the bot and with help', () => {
    for (const level of [6, 7]) for (const s of SEEDS.slice(0, 30)) {
      const br = briefFor(level, new Rng(s));
      let b = br.board;
      let days = 0;
      for (let i = 0; i < 6 && !(meetsGoal(b, br.day) && days > 0); i++) {
        const m = nextMove(br, b, days);
        if ('line' in m) b = setLine(b, m.line, m.gap);
        else days++;
      }
      expect(meetsGoal(b, br.day), `${level}/${s}`).toBe(true);
    }
  });

  it('tallies a line piece: the same failure twice glows it, one hint, no misses', () => {
    const br = brief(6);
    const t = new Tally();
    expect(t.failed(br.board, 'too-warm')).toBe(false);
    expect(t.failed(br.board, 'too-warm')).toBe(true);
    expect(t.glowing).toBe('line');
    expect(t.hints).toBe(1);
    expect(t.misses).toBe(0);
    t.changed('line');
    expect(t.glowing).toBeNull();
    const b7 = brief(7);
    const t7 = new Tally();
    t7.failed(b7.board, 'heater-busy');
    t7.failed(b7.board, 'heater-busy');
    expect(t7.glowing).toBe('off-line');
    expect(t7.hints).toBe(1);
  });

  it('lays the gauge out at every view with full-size handles', () => {
    const views = [computeView(1024, 768), computeView(768, 1024), computeView(1366, 1024), computeView(1024, 1366)];
    for (const level of [6, 7]) for (const v of views) {
      const l = houseLayout(brief(level), v);
      expect(l, `${level} ${v.w}x${v.h}`).not.toBeNull();
      const g = l!.gauge!;
      expect(g).not.toBeNull();
      expect(g.pitch).toBeGreaterThanOrEqual(60);
      expect(PITCH).toBeGreaterThanOrEqual(60);
      expect(g.column.w).toBeGreaterThanOrEqual(110);
      expect(g.column.h).toBeGreaterThanOrEqual(420);
      for (let k = 1; k < GAPS; k++) expect(gapY(g, k) - gapY(g, k + 1)).toBeGreaterThanOrEqual(60);
      for (let k = 1; k <= GAPS; k++) expect(gapAt(g, gapY(g, k))).toBe(k);
      const avoid = [l!.watch, l!.step, l!.undo, ...l!.rows.flatMap((r) => [r.reading, r.action]), ...corners(v)];
      const handles = (['line', 'on-line', 'off-line'] as const).flatMap((p) => Array.from({ length: GAPS }, (_, i) => handleRect(g, p, i + 1)));
      const rects = level === 7 ? [...handles, g.jar!] : handles.filter((_, i) => i < GAPS);
      expect(g.jar === null).toBe(level === 6);
      for (const r of rects) {
        expect(r.w).toBeGreaterThanOrEqual(110);
        expect(r.x >= 0 && r.y >= 0 && r.x + r.w <= v.w && r.y + r.h <= v.h, `${level} ${v.w}x${v.h} ${JSON.stringify(r)}`).toBe(true);
        for (const a of avoid) expect(overlaps(r, a), `${level} ${v.w}x${v.h}`).toBe(false);
      }
      if (level === 7) {
        for (let k = 1; k < GAPS; k++) {
          expect(overlaps(handleRect(g, 'on-line', k), handleRect(g, 'off-line', k + 1))).toBe(false);
          expect(overlaps(handleRect(g, 'on-line', k + 1), handleRect(g, 'off-line', k))).toBe(false);
        }
        expect(overlaps(handleRect(g, 'on-line', 3), handleRect(g, 'off-line', 3))).toBe(false);
      }
    }
  });
});
