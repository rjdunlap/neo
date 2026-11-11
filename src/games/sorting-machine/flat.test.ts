import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { computeView, type View } from '../../engine/view';
import { levelsInOrder, rangeFor } from '../../progress/difficulty';
import { uprightProblems, UPRIGHT_VIEWS } from '../upright-check';
import { ACCEPTED } from './accepted';
import { enumerate, partsFor } from './flat-enumerate';
import {
  ACCEPTED_MACHINES,
  agrees,
  applyFix,
  checkFlat,
  decode,
  EMPTY,
  encode,
  evaluateFlat,
  firstDifference,
  firstEmpty,
  flatBrief,
  flatLayout,
  flatTargets,
  helpFlat,
  NEARLY,
  nearest,
  nextFlatMove,
  read,
  setInput,
  setOut,
  setPart,
  SLOTS,
  sourcesFor,
  type Flat,
  type Selection,
} from './flat';
import { corners, isFlat, LEVELS, overlaps, PAIRS, planFor, Tally, TUPLES } from './logic';
import { sortingMachine } from './index';

const ROWS = TUPLES.map(([p, q]) => ({ p, q }));
const pass = (m: Flat) => checkFlat(m, ROWS).status === 'pass';
const m = (text: string) => decode(text);

describe('Festival Signals: the grammar', () => {
  it('lets a slot read only the sensors and earlier slots, so every machine is acyclic', () => {
    for (let i = 0; i < SLOTS; i++) {
      expect(sourcesFor(i)).toEqual(['P', 'Q', ...Array.from({ length: i }, (_, k) => k)]);
      const part = setPart(EMPTY, i, 'AND');
      for (const bad of [i, i + 1, 7]) expect(setInput(part, i, 'a', bad)).toBe(part);
      expect(setInput(part, i, 'a', 'Q').slots[i]).toEqual({ op: 'AND', a: 'Q', b: null });
    }
    expect(setOut(EMPTY, 9)).toBe(EMPTY);
    expect(setOut(EMPTY, 1).out).toBe(1);
  });

  it('keeps the inputs a new part can still read, and Clear returns them to unchosen', () => {
    let x = setInput(setInput(setPart(EMPTY, 2, 'AND'), 2, 'a', 0), 2, 'b', 'Q');
    x = setPart(x, 2, 'OR');
    expect(x.slots[2]).toEqual({ op: 'OR', a: 0, b: 'Q' });
    x = setPart(x, 2, 'NOT');
    expect(x.slots[2]).toEqual({ op: 'NOT', a: 0, b: null });
    expect(setInput(x, 2, 'b', 'P')).toBe(x);
    expect(setPart(setPart(x, 2, null), 2, 'AND').slots[2]).toEqual({ op: 'AND', a: null, b: null });
  });

  it('reads an empty slot or input on the lantern path as incomplete, never false, and ignores slots off it', () => {
    expect(evaluateFlat(EMPTY, { p: 1, q: 1 })).toBe('incomplete');
    // AND of a false signal and an empty slot is still incomplete.
    const gap = m('AND(P,Q) - - AND(1,2) >4');
    for (const f of ROWS) expect(evaluateFlat(gap, f)).toBe('incomplete');
    expect(firstEmpty(gap)).toBe(1);
    const half = m('OR(P,_) - - - >1');
    expect(evaluateFlat(half, { p: 1, q: 0 })).toBe('incomplete');
    expect(firstEmpty(half)).toBe(0);
    // Slots 2–4 are off the path: whatever they hold, the lantern reads slot 1.
    const off = m('OR(P,Q) NOT(_) - AND(1,2) >1');
    expect(read(off, 1, 0).onPath).toEqual([true, false, false, false]);
    expect(firstEmpty(off)).toBeNull();
    expect(ROWS.map((f) => evaluateFlat(off, f))).toEqual([false, true, true, true]);
  });

  it('round-trips a machine through its text', () => {
    for (const text of [...ACCEPTED, 'OR(P,_) - NOT(_) AND(3,1) >2', '- - - - >4'])
      expect(encode(decode(text))).toBe(text);
  });
});

describe('Festival Signals: the accepted set', () => {
  const all = enumerate();

  it('finds exactly the 24 checked-in machines among all 2,005,696 fillings', () => {
    expect(partsFor(0)).toHaveLength(11);
    expect(all.total).toBe(2_005_696);
    expect(all.accepted).toEqual([...ACCEPTED]);
    expect(ACCEPTED).toHaveLength(24);
  });

  it('accepts each of them, all four parts long with the lantern on the last slot; eight keep P or Q in slot 1', () => {
    for (const x of ACCEPTED_MACHINES) {
      expect(pass(x)).toBe(true);
      expect(x.out).toBe(3);
      expect(x.slots.every((s) => s !== null)).toBe(true);
      expect(read(x, 0, 0).onPath).toEqual([true, true, true, true]);
    }
    expect(ACCEPTED_MACHINES.filter((x) => x.slots[0]!.op === 'OR')).toHaveLength(8);
    expect(ACCEPTED[0]).toBe('OR(P,Q) AND(P,Q) NOT(2) AND(1,3) >4');
  });

  it('passes no machine with fewer than four parts (the enumeration includes every empty slot and every wire)', () => {
    expect(all.machines.every((x) => x.slots.every((s) => s !== null))).toBe(true);
  });

  it('tells each nearly-right machine from the sign with one friend', () => {
    const fails = (x: Flat) => {
      const v = checkFlat(x, ROWS);
      return v.status === 'fail' ? v.rows.map((i) => `${ROWS[i].p}${ROWS[i].q}`) : [];
    };
    expect(fails(NEARLY)).toEqual(['11']);
    expect(fails(m('AND(P,Q) - - - >1'))).toEqual(['01', '10', '11']);
  });
});

describe('Festival Signals: Check', () => {
  it('judges every row whatever the order, incomplete before fail, one failing submission one miss', () => {
    const rng = new Rng(5);
    for (let i = 0; i < 20; i++) {
      const rows = rng.shuffle([...ROWS]);
      expect(checkFlat(ACCEPTED_MACHINES[i], rows)).toEqual({ status: 'pass' });
      const v = checkFlat(NEARLY, rows);
      expect(v).toEqual({ status: 'fail', rows: [rows.findIndex((f) => f.p === 1 && f.q === 1)] });
    }
    // A machine that is wrong on rows too, but has a gap, is incomplete first.
    expect(checkFlat(m('AND(P,Q) - - AND(1,2) >4'), ROWS)).toEqual({ status: 'incomplete', slot: 1 });
    const t = new Tally();
    expect(checkFlat(m('AND(P,Q) - - - >1'), ROWS)).toMatchObject({ status: 'fail', rows: [1, 2, 3] });
    t.miss();
    expect(t.misses).toBe(1);
    expect(t.glowing).toBe(false);
    expect(t.miss()).toBe(true);
    expect([t.misses, t.hints, t.glowing]).toEqual([2, 1, true]);
  });
});

/** Every machine one edit away: a part, an input or (level 9) the wire. */
function edits(x: Flat, wire: boolean): Flat[] {
  const out: Flat[] = [];
  for (let i = 0; i < SLOTS; i++) {
    for (const op of ['AND', 'OR', 'NOT', null] as const) out.push(setPart(x, i, op));
    for (const which of ['a', 'b'] as const)
      for (const s of sourcesFor(i)) out.push(setInput(x, i, which, s));
  }
  if (wire) for (let k = 0; k < SLOTS; k++) out.push(setOut(x, k));
  return out.filter((y) => y !== x);
}

/** Presses of Help after the first, until the machine passes: how many fixes, and that none undid an agreeing slot. */
function fixesToPass(start: Flat): number {
  let x = start;
  let fixes = 0;
  while (!pass(x)) {
    const h = helpFlat(x, ROWS, 2 + fixes);
    expect(h.kind, encode(x)).toBe('fix');
    if (h.kind !== 'fix') return 99;
    const target = nearest(x);
    if ('slot' in h.fix) expect(agrees(x.slots[h.fix.slot], target.slots[h.fix.slot])).toBe(false);
    const next = applyFix(x, h.fix);
    // Every slot that agreed with the nearest machine is left as it was.
    x.slots.forEach((s, i) => {
      if (agrees(s, target.slots[i])) expect(next.slots[i]).toEqual(s);
    });
    x = next;
    fixes++;
    if (fixes > 6) break;
  }
  expect(helpFlat(x, ROWS, 2 + fixes)).toEqual({ kind: 'check' });
  return fixes;
}

describe('Festival Signals: nearest and Help', () => {
  it('keeps her correct work: the nearest machine agrees with the most of her slots, whichever order she built in', () => {
    const hers = m('AND(Q,P) NOT(1) - - >4');
    const n = nearest(hers);
    expect(agrees(n.slots[0], hers.slots[0])).toBe(true);
    expect(agrees(n.slots[1], hers.slots[1])).toBe(true);
    expect(firstDifference(hers)).toEqual({ slot: 2, part: { op: 'OR', a: 'P', b: 'Q' } });
    expect(firstDifference(ACCEPTED_MACHINES[7])).toBeNull();
    // Level 9: the wire is the last thing to move.
    expect(firstDifference(m('OR(Q,P) AND(P,Q) NOT(2) AND(3,1) >1'))).toEqual({ out: 3 });
  });

  it('first shows a friend the machine gets wrong, or the first gap on the lantern path', () => {
    expect(helpFlat(NEARLY, ROWS, 1)).toEqual({ kind: 'run', fixture: 3 });
    expect(helpFlat(EMPTY, ROWS, 1)).toEqual({ kind: 'select', slot: 3 });
    expect(helpFlat(m('- - - AND(1,_) >4'), ROWS, 1)).toEqual({ kind: 'select', slot: 0 });
    expect(helpFlat(ACCEPTED_MACHINES[3], ROWS, 1)).toEqual({ kind: 'check' });
    for (const x of edits(NEARLY, true)) {
      const h = helpFlat(x, ROWS, 1);
      const v = checkFlat(x, ROWS);
      if (h.kind === 'run')
        expect(evaluateFlat(x, ROWS[h.fixture])).not.toBe(ROWS[h.fixture].p !== ROWS[h.fixture].q);
      else if (h.kind === 'select') expect(v).toEqual({ status: 'incomplete', slot: h.slot });
      else expect(v.status).toBe('pass');
    }
  });

  it('reaches a right machine from level 9 and anything two changes from it in at most five fixes', () => {
    const seen = new Map<string, Flat>([[encode(NEARLY), NEARLY]]);
    for (const a of edits(NEARLY, true)) {
      seen.set(encode(a), a);
      for (const b of edits(a, true)) seen.set(encode(b), b);
    }
    expect(seen.size).toBeGreaterThan(150);
    expect(fixesToPass(NEARLY)).toBe(4);
    for (const x of seen.values()) expect(fixesToPass(x), encode(x)).toBeLessThanOrEqual(5);
  });

  it('reaches a right machine from 2,000 seeded level-8 fillings in at most four fixes', () => {
    const rng = new Rng(88);
    const choices = Array.from({ length: SLOTS }, (_, i) => partsFor(i));
    for (let n = 0; n < 2000; n++) {
      const x: Flat = { slots: choices.map((c) => rng.pick(c)), out: 3 };
      expect(fixesToPass(x), encode(x)).toBeLessThanOrEqual(4);
    }
  });
});

describe('Festival Signals: briefs, bands and the ghost finger', () => {
  it('gives the same brief for the same seed, and covers the three pairs at each level', () => {
    for (const level of [8, 9]) {
      const pairs = new Set<string>();
      for (let seed = 1; seed <= 40; seed++) {
        const a = flatBrief(level, new Rng(seed));
        expect(flatBrief(level, new Rng(seed))).toEqual(a);
        expect(a.fixtures.map((f) => `${f.p}${f.q}`).sort()).toEqual(['00', '01', '10', '11']);
        expect(new Set(a.fixtures.map((f) => f.species)).size).toBe(4);
        expect(PAIRS.map((p) => p.join('-'))).toContain(a.props.join('-'));
        expect(a.machine).toEqual(level === 9 ? NEARLY : EMPTY);
        pairs.add(a.props.join('-'));
      }
      expect(pairs.size).toBe(3);
    }
  });

  it('orders the grown-up band 3, 9, 8, leaves school alone and names the two levels by ID', () => {
    expect(levelsInOrder(rangeFor(LEVELS, 'grownup'))).toEqual([3, 9, 8]);
    expect(rangeFor(LEVELS, 'school')).toEqual({ min: 1, max: 3 });
    expect(sortingMachine.bands).toEqual(['school', 'grownup']);
    expect(sortingMachine.describeLevel(8)).toBe('Festival Signals');
    expect(sortingMachine.describeLevel(9)).toBe('Fix the lantern');
    expect([1, 2, 3, 8, 9].map((l) => planFor(l).level)).toEqual([1, 2, 3, 8, 9]);
    expect([1, 2, 3, 8, 9].map(isFlat)).toEqual([false, false, false, true, true]);
  });

  it('plays a whole round with the taps a player uses: both-badges friend, the parts, the wire, Send, Check', () => {
    for (const level of [8, 9]) {
      const brief = flatBrief(level, new Rng(3));
      let x = brief.machine;
      let friend: number | null = null;
      let selection: Selection = null;
      const sent = brief.fixtures.map(() => false);
      let tested = false;
      const taps: string[] = [];
      for (let step = 0; step < 60; step++) {
        const move = nextFlatMove(brief, x, { friend, selection, sent, tested });
        taps.push(Object.keys(move)[0]);
        if ('check' in move) break;
        if ('card' in move) friend = move.card;
        else if ('send' in move) {
          expect(friend).not.toBeNull();
          sent[friend!] = tested = true;
        } else if ('slot' in move) selection = move.slot;
        else if ('lantern' in move) selection = 'lantern';
        else {
          const before = x;
          if ('part' in move) x = setPart(x, selection as number, move.part);
          else if ('input' in move) x = setInput(x, selection as number, move.input, move.src);
          else x = setOut(x, move.wire);
          expect(x).not.toBe(before);
          tested = false;
        }
      }
      expect(taps.at(-1)).toBe('check');
      expect(taps.slice(0, 2)).toEqual(['card', 'send']);
      expect(taps.at(-2)).toBe('send');
      expect(brief.fixtures[friend!]).toMatchObject({ p: 1, q: 1 });
      expect(pass(x)).toBe(true);
      expect(taps.includes('wire')).toBe(level === 9);
      if (level === 9) expect(x.slots[0]).toEqual(NEARLY.slots[0]);
    }
  });
});

describe('Festival Signals: layout', () => {
  const views: Record<string, View> = {
    landscape: computeView(1024, 768),
    portrait: computeView(768, 1024),
    phone: computeView(844, 390),
    notch: computeView(844, 390, { top: 0, right: 47, bottom: 21, left: 47 }),
    desktop: computeView(1440, 900),
    ...Object.fromEntries(Object.entries(UPRIGHT_VIEWS).map(([k, v]) => [`upright ${k}`, v])),
  };

  it('fits every target at full size at every view, inside it, apart, and clear of the pet and the corner buttons', () => {
    for (const [name, v] of Object.entries(views)) {
      const l = flatLayout(v);
      expect(l, name).not.toBeNull();
      for (const level of [8, 9]) {
        const targets = flatTargets(l!, level);
        for (const t of targets) {
          const min = t.what.startsWith('part') || t.what.startsWith('input') ? 110 : 100;
          expect(Math.min(t.rect.w, t.rect.h), `${name}: ${t.what}`).toBeGreaterThanOrEqual(min);
          expect(
            t.rect.x >= 0 && t.rect.y >= 0 && t.rect.x + t.rect.w <= v.w && t.rect.y + t.rect.h <= v.h,
            `${name}: ${t.what}`,
          ).toBe(true);
          for (const c of corners(v)) expect(overlaps(t.rect, c), `${name}: ${t.what}`).toBe(false);
        }
        targets.forEach((a, i) =>
          targets
            .slice(i + 1)
            .forEach((b) => expect(overlaps(a.rect, b.rect), `${name}: ${a.what} / ${b.what}`).toBe(false)),
        );
        if (v.upright)
          expect(
            uprightProblems(
              v,
              targets.map((t) => ({
                what: t.what,
                x: t.rect.x + t.rect.w / 2,
                y: t.rect.y + t.rect.h / 2,
                w: t.rect.w,
                h: t.rect.h,
              })),
            ),
            name,
          ).toEqual([]);
      }
    }
  });

  it('returns null rather than shrink a target', () => {
    expect(flatLayout({ w: 600, h: 1024, scale: 1 })).toBeNull();
    expect(flatLayout({ w: 1024, h: 600, scale: 1 })).toBeNull();
  });
});
