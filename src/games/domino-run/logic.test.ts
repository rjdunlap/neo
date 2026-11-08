import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { computeView } from '../../engine/view';
import { VOICE } from './voice';
import {
  arrangements,
  describe as name,
  dominoLayout,
  emptyPlacement,
  END_SIZE,
  FIRST,
  fits,
  hintPlacement,
  lane,
  LOOK_END,
  LOOK_LINE,
  looksFor,
  makeLine,
  makeRound,
  MOODS,
  passes,
  PITCH,
  PLANS,
  planFor,
  puddleGiantSlot,
  puddles,
  remaining,
  rings,
  run,
  runLane,
  slotBox,
  solutions,
  SLOT_H,
  stallReason,
  standing,
  stopsAt,
  TRAY_W,
  type Line,
  type Placement,
} from './logic';

const VIEWS = {
  landscape: computeView(1024, 768),
  portrait: computeView(768, 1024),
  phone: computeView(844, 390),
  notch: computeView(844, 390, { top: 0, right: 47, bottom: 21, left: 47 }),
};

/** A placement from pictures, one per lane: a digit per slot (0 for none), the starter first. */
const at = (line: Line, ...lanes: Record<number, number>[]): Placement => {
  const p = emptyPlacement(line);
  lanes.forEach((l, k) => Object.entries(l).forEach(([s, v]) => (p[k][+s] = v)));
  return p;
};
const pictures = (sols: Placement[]) => sols.map((p) => p.map((l) => l.join('')).join('|')).sort();

describe('Domino Run tipping rule', () => {
  it('reaches by size and pushes at most one size bigger', () => {
    for (const h of [1, 2, 3]) {
      for (let gap = 1; gap <= 4; gap++) {
        for (let s = 1; s <= 4; s++) {
          const why = stallReason(0, h, gap, s);
          if (gap > h) expect(why).toBe('too-far');
          else if (s > h + 1) expect(why).toBe('too-heavy');
          else expect(why).toBeNull();
        }
      }
    }
  });

  it('the bell is pushed like a small, the gong only by a giant', () => {
    const bell = lane('SB'),
      gong = lane('SO');
    expect(runLane(bell, [0, 0, 0]).rung).toBe(true);
    expect(runLane(gong, [0, 0, 0]).stall?.reason).toBe('too-heavy');
    expect(runLane(lane('GO'), [0, 0, 0]).stall?.reason).toBe('too-heavy'); // the small starter cannot push a giant
    expect(runLane(lane('TGO'), [0, 0, 0, 0]).rung).toBe(true);
  });

  it('a stall names the gap for too-far and the heavy piece for too-heavy, and leaves the placement alone', () => {
    const l = lane('S_SB');
    const p = [0, 0, 0, 0, 0];
    expect(runLane(l, p).stall).toEqual({ from: 1, reason: 'too-far', at: 2 });
    expect(runLane(lane('SGSB'), [0, 0, 0, 0, 0]).stall).toEqual({ from: 1, reason: 'too-heavy', at: 2 });
    expect(p).toEqual([0, 0, 0, 0, 0]);
  });

  it('the fork starts both lanes, each from its own small at slot 0', () => {
    const line: Line = { lanes: [lane('_SB'), lane('SSB')], tray: [1] };
    const r = run(line, emptyPlacement(line));
    expect(r[0].stall?.reason).toBe('too-far');
    expect(r[1].rung).toBe(true);
  });

  it('is deterministic', () => {
    const line = FIRST[8];
    const p = at(line, { 2: 2, 3: 3 }, { 3: 2 });
    expect(run(line, p)).toEqual(run(line, p));
  });
});

describe('Domino Run first lines', () => {
  it('match the definition', () => {
    expect(rings(FIRST[1], emptyPlacement(FIRST[1]))).toBe(true);
    expect(pictures(solutions(FIRST[2]))).toEqual(['0001000']);
    expect(pictures(solutions(FIRST[3]))).toEqual(['0011010']);
    expect(pictures(solutions(FIRST[4]))).toEqual(['0020010']);
    expect(pictures(solutions(FIRST[5]))).toEqual(['0000100|0010000']);
    expect(pictures(solutions(FIRST[6]))).toEqual(['0020300', '0023000']);
    expect(pictures(solutions(FIRST[7]))).toEqual(['0020200']);
    expect(pictures(solutions(FIRST[8]))).toEqual(['0020300|0002000', '0023000|0002000']);
    expect(pictures(solutions(FIRST[9]))).toEqual(['0001000']);
    expect(stopsAt(FIRST[9])).toEqual({ slot: 2, reason: 'too-far' });
    expect(pictures(solutions(FIRST[10]))).toEqual(['0023000']);
    expect(puddles(FIRST[10].lanes[0])).toEqual([{ from: 4, to: 5 }]);
    expect(pictures(solutions(FIRST[11]))).toEqual(['0001230']);
    expect(FIRST[11].lanes[0].low).toEqual([3]);
  });

  it('their named wrong arrangements stall for the named reason', () => {
    expect(run(FIRST[3], emptyPlacement(FIRST[3]))[0].stall?.reason).toBe('too-far');
    expect(run(FIRST[6], at(FIRST[6], { 2: 3 }))[0].stall?.reason).toBe('too-heavy');
    expect(run(FIRST[7], at(FIRST[7], { 2: 2, 3: 2 }))[0].stall?.reason).toBe('too-far');
    expect(run(FIRST[8], at(FIRST[8], { 2: 2, 3: 3 }, { 3: 3 }))[1].stall?.reason).toBe('too-heavy');
    // Level 10: a tall alone, a giant straight after the pinned small, a giant alone.
    expect(run(FIRST[10], at(FIRST[10], { 2: 2 }))[0].stall).toMatchObject({ reason: 'too-far', at: 3 });
    expect(run(FIRST[10], at(FIRST[10], { 2: 3 }))[0].stall).toMatchObject({ reason: 'too-heavy', at: 2 });
    expect(run(FIRST[10], at(FIRST[10], { 3: 3 }))[0].stall).toMatchObject({ reason: 'too-far', at: 2 });
    // Level 11: the small under the pier pushing the giant straight away.
    expect(run(FIRST[11], at(FIRST[11], { 3: 1, 4: 3 }))[0].stall).toMatchObject({
      reason: 'too-heavy',
      at: 4,
    });
  });

  it('pass their own plan filters', () => {
    for (const plan of PLANS) expect(passes(plan, FIRST[plan.id]), `level ${plan.id}`).toBe(true);
  });
});

describe('Domino Run generation', () => {
  it('every plan over 500 seeds: well formed, unsolved at the start, solvable, passes its filter, never the fallback', () => {
    for (const plan of PLANS) {
      for (let seed = 1; seed <= 500; seed++) {
        const { line, fallback } = makeLine(plan, new Rng(seed));
        const where = `level ${plan.id} seed ${seed}`;
        expect(fallback, where).toBe(false);
        expect(passes(plan, line), where).toBe(true);
        expect(line.lanes, where).toHaveLength(plan.fork ? 2 : 1);
        for (const l of line.lanes) {
          expect(l.n, where).toBeLessThanOrEqual(6);
          expect(l.sockets.length, where).toBeLessThanOrEqual(5);
        }
        expect(line.tray.length, where).toBeLessThanOrEqual(3);
        if (plan.id > 1) {
          expect(rings(line, emptyPlacement(line)), where).toBe(false);
          expect(solutions(line).length, where).toBeGreaterThan(0);
        }
        expect(name(makeLine(plan, new Rng(seed)).line), where).toBe(name(line));
      }
    }
  });

  it("a round starts with the authored line and has the plan's number of lines", () => {
    for (const plan of PLANS) {
      const round = makeRound(plan, new Rng(7));
      expect(round[0]).toBe(FIRST[plan.id]);
      expect(round).toHaveLength(plan.lines);
    }
    expect(planFor(0).id).toBe(1);
    expect(planFor(99).id).toBe(11);
  });
});

describe('Domino Run level 9, Where will it stop?', () => {
  const plan = planFor(9);
  const lines = [FIRST[9], ...Array.from({ length: 500 }, (_, i) => makeLine(plan, new Rng(i + 1)).line)];

  it('every line as it stands stops once, at least two dominoes in, at a domino she can tap, with a reason', () => {
    for (const line of lines) {
      const stop = stopsAt(line)!;
      expect(stop, name(line)).not.toBeNull();
      expect(stop.slot).toBeGreaterThanOrEqual(2);
      expect(standing(line.lanes[0])).toContain(stop.slot);
      expect(['too-far', 'too-heavy']).toContain(stop.reason);
      expect(run(line, emptyPlacement(line))[0].fallen.at(-1)).toBe(stop.slot);
    }
  });

  it('a too-heavy stop in at least a third of the lines', () => {
    const heavy = lines.filter((l) => stopsAt(l)!.reason === 'too-heavy').length;
    expect(heavy).toBeGreaterThanOrEqual(lines.length / 3);
    expect(lines.length - heavy).toBeGreaterThanOrEqual(lines.length / 3);
  });

  it('exactly one tray piece in one socket fixes it, from a tray of one or two', () => {
    for (const line of lines) {
      expect(line.tray.length).toBeLessThanOrEqual(2);
      const sols = solutions(line);
      expect(sols, name(line)).toHaveLength(1);
      expect(sols[0][0].filter(Boolean)).toHaveLength(1);
    }
  });

  it('every guess is a whole slot column of at least 100 units, apart from its neighbours, at every view', () => {
    for (const v of Object.values(VIEWS)) {
      const lay = dominoLayout(1, v);
      for (const line of lines.slice(0, 50)) {
        const boxes = standing(line.lanes[0]).map((s) => slotBox(lay.lanes[0], s));
        for (const b of boxes) expect(Math.min(b.w, b.h)).toBeGreaterThanOrEqual(100);
        boxes.slice(1).forEach((b, i) => expect(b.x).toBeGreaterThanOrEqual(boxes[i].x + boxes[i].w));
      }
    }
  });
});

describe('Domino Run level 10, Over the puddle', () => {
  const plan = planFor(10);
  const lines = [FIRST[10], ...Array.from({ length: 500 }, (_, i) => makeLine(plan, new Rng(i + 1)).line)];

  it('every line has one two-wide puddle and ends in a bell', () => {
    for (const line of lines) {
      const l = line.lanes[0],
        wet = puddles(l);
      expect(l.end, name(line)).toBe('bell');
      expect(wet, name(line)).toHaveLength(1);
      expect(wet[0].to - wet[0].from, name(line)).toBe(1);
    }
  });

  it('every solution stands a giant from the tray directly before the puddle', () => {
    for (const line of lines) {
      const g = puddleGiantSlot(line.lanes[0])!;
      expect(line.lanes[0].sockets, name(line)).toContain(g);
      const sols = solutions(line);
      expect(sols.length, name(line)).toBeGreaterThan(0);
      for (const p of sols) expect(p[0][g], name(line)).toBe(3);
    }
  });

  it('no solution with the giant taken out of the tray', () => {
    for (const line of lines) {
      const tray = [...line.tray];
      tray.splice(tray.indexOf(3), 1);
      expect(
        line.tray.filter((t) => t === 3),
        name(line),
      ).toHaveLength(1);
      expect(solutions({ ...line, tray }), name(line)).toHaveLength(0);
    }
  });

  it('a tray of at most three with at most one decoy', () => {
    for (const line of lines) {
      expect(line.tray.length).toBeLessThanOrEqual(3);
      const most = Math.max(...solutions(line).map((p) => p[0].filter(Boolean).length));
      expect(line.tray.length - most, name(line)).toBeLessThanOrEqual(1);
    }
  });

  it("a tall just before the puddle stalls too far, at the puddle's near edge", () => {
    for (const line of lines) {
      const g = puddleGiantSlot(line.lanes[0])!;
      const p = solutions(line)[0].map((l) => [...l]);
      p[0][g] = 2;
      expect(run(line, p)[0].stall, name(line)).toMatchObject({ reason: 'too-far', from: g, at: g + 1 });
    }
  });

  it('the seeds give more than one picture', () => {
    expect(new Set(lines.map(name)).size).toBeGreaterThanOrEqual(6);
  });
});

describe('Domino Run level 11, Under the pier', () => {
  const plan = planFor(11);
  const lines = [FIRST[11], ...Array.from({ length: 500 }, (_, i) => makeLine(plan, new Rng(i + 1)).line)];
  const pierOf = (line: Line) => line.lanes[0].low![0];

  it('levels 1–10 never have a pier, so their lines are unchanged', () => {
    for (const p of PLANS.filter((q) => q.id < 11)) {
      expect(
        FIRST[p.id].lanes.every((l) => !l.low),
        `level ${p.id}`,
      ).toBe(true);
      for (let seed = 1; seed <= 100; seed++)
        expect(makeLine(p, new Rng(seed)).line.lanes.every((l) => !l.low)).toBe(true);
    }
  });

  it('only a small fits under the pier, in every solution and every arrangement she can make', () => {
    for (const line of lines) {
      const l = line.lanes[0],
        P = pierOf(line);
      expect([1, 2, 3].map((s) => fits(l, P, s))).toEqual([true, false, false]);
      for (const p of arrangements(line)) expect(p[0][P], name(line)).toBeLessThanOrEqual(1);
    }
  });

  it('one pier socket with a small just before it, ending in a gong', () => {
    for (const line of lines) {
      const l = line.lanes[0],
        P = pierOf(line);
      expect(l.low, name(line)).toHaveLength(1);
      expect(l.sockets, name(line)).toContain(P);
      expect(l.fixed[P - 1], name(line)).toBe(1);
      expect(l.end, name(line)).toBe('gong');
    }
  });

  it('every solution stands a small under the pier, then climbs to a giant after it', () => {
    for (const line of lines) {
      const l = line.lanes[0],
        P = pierOf(line),
        sols = solutions(line);
      expect(sols.length, name(line)).toBeGreaterThan(0);
      for (const p of sols) {
        expect(p[0][P], name(line)).toBe(1);
        const after = runLane(l, p[0])
          .fallen.filter((s) => s >= P)
          .map((s) => p[0][s] || l.fixed[s]);
        expect(after[0]).toBe(1);
        expect(after[after.length - 1], name(line)).toBe(3);
        for (let i = 1; i < after.length; i++)
          expect(after[i], name(line)).toBeGreaterThanOrEqual(after[i - 1]);
      }
    }
  });

  it('the pier matters: without it, a bigger domino could stand there', () => {
    for (const line of lines) {
      const P = pierOf(line),
        free = solutions({ ...line, lanes: [{ ...line.lanes[0], low: undefined }] });
      expect(
        free.some((p) => p[0][P] > 1),
        name(line),
      ).toBe(true);
    }
  });

  it('a line where a tall stands before the pier, reaching over it, never passes', () => {
    expect(passes(plan, { lanes: [lane('TP__O')], tray: [1, 2, 3] })).toBe(false);
    expect(passes(plan, { lanes: [lane('S_P__O')], tray: [1, 2, 3] })).toBe(false);
  });

  it('a tray of at most three with at most one decoy, and more than one picture', () => {
    for (const line of lines) {
      const most = Math.max(...solutions(line).map((p) => p[0].filter(Boolean).length));
      expect(line.tray.length - most, name(line)).toBeLessThanOrEqual(1);
    }
    expect(new Set(lines.map(name)).size).toBeGreaterThanOrEqual(6);
  });

  it('following the hint from any state never asks for a big domino under the pier', () => {
    for (const line of lines.slice(0, 60)) {
      const P = pierOf(line),
        sols = solutions(line);
      for (const start of arrangements(line)) {
        const h = hintPlacement(line, start, sols);
        if (h.kind === 'place' && h.slot === P) expect(h.size, name(line)).toBe(1);
      }
    }
  });
});

describe('Domino Run hints', () => {
  /** Every placement state she can reach from the start: any tray pieces in any sockets. */
  const states = (line: Line) => arrangements(line);

  it('following the hint from any state reaches a ringing line within sockets + 3 steps', () => {
    for (const plan of PLANS.filter((p) => p.id > 1)) {
      const lines = [FIRST[plan.id], ...[11, 23, 37].map((s) => makeLine(plan, new Rng(s)).line)];
      for (const line of lines) {
        const sols = solutions(line);
        const sockets = line.lanes.reduce((n, l) => n + l.sockets.length, 0);
        for (const start of states(line)) {
          let p = start.map((l) => [...l]);
          let steps = 0;
          for (; steps <= sockets + 3; steps++) {
            const h = hintPlacement(line, p, sols);
            if (h.kind === 'run') break;
            expect(h.kind, `level ${plan.id} ${name(line)}`).not.toBe('none');
            if (h.kind === 'place') {
              expect(remaining(line, p)).toContain(h.size);
              expect(p[h.lane][h.slot]).toBe(0);
              p[h.lane][h.slot] = h.size;
            } else if (h.kind === 'remove') {
              p[h.lane][h.slot] = 0;
            }
            p = p.map((l) => [...l]);
          }
          expect(rings(line, p), `level ${plan.id} ${name(line)} from ${start.join('|')}`).toBe(true);
          expect(steps).toBeLessThanOrEqual(sockets + 3);
        }
      }
    }
  });

  it('never removes a domino some solution keeps while a free placement would do', () => {
    for (const plan of PLANS.filter((p) => p.id > 1)) {
      const line = FIRST[plan.id];
      const sols = solutions(line);
      for (const p of states(line)) {
        const h = hintPlacement(line, p, sols);
        if (h.kind !== 'remove') continue;
        const left = remaining(line, p);
        // A free placement "would do" when a solution keeps everything she placed and needs a piece she still has.
        const keepsAll = sols.some(
          (s) =>
            s.every((l, k) => l.every((v, slot) => !p[k][slot] || p[k][slot] === v)) &&
            s.some((l, k) => l.some((v, slot) => v && !p[k][slot] && left.includes(v as 1))),
        );
        expect(keepsAll, `level ${plan.id} ${p.join('|')}`).toBe(false);
      }
    }
  });
});

describe('Domino Run layout', () => {
  it('big separate slots and tray places at every view, clear of the pet and the buttons, the same puzzle everywhere', () => {
    for (const lanes of [1, 2]) {
      for (const [view, v] of Object.entries(VIEWS)) {
        const lay = dominoLayout(lanes, v);
        const where = `${lanes} lanes ${view}`;
        const boxes = [
          ...lay.lanes.flatMap((l) => Array.from({ length: 7 }, (_, s) => slotBox(l, s))),
          ...lay.tray.map((t) => t.hit),
        ];
        for (const [i, b] of boxes.entries()) {
          expect(b.w, where).toBeGreaterThanOrEqual(PITCH);
          expect(b.h, where).toBeGreaterThanOrEqual(150);
          expect(b.x, where).toBeGreaterThanOrEqual(0);
          expect(b.x + b.w, where).toBeLessThanOrEqual(v.w);
          // Home and "?" sit in the top-left 130 × 130; nothing goes under them.
          expect(b.x >= 130 || b.y >= 130, `${where} box ${i} under the buttons`).toBe(true);
          expect(b.y, where).toBeGreaterThanOrEqual(110);
          // The pet's corner: the bottom-left 150 by 220.
          expect(b.x >= 150 || b.y + b.h <= v.h - 220, `${where} box ${i} in the pet's corner`).toBe(true);
          // A carried domino rides 40 above the finger: the finger at any box's bottom stays on screen.
          expect(b.y + b.h + 40, where).toBeLessThanOrEqual(v.h);
          for (const o of boxes.slice(i + 1)) {
            const apart = b.x + b.w <= o.x || o.x + o.w <= b.x || b.y + b.h <= o.y || o.y + o.h <= b.y;
            expect(apart, `${where} boxes ${i} overlap`).toBe(true);
          }
        }
        expect(lay.tray.every((t) => t.hit.w === TRAY_W)).toBe(true);
        expect(slotBox(lay.lanes[0], 0).h).toBe(SLOT_H);
      }
    }
  });
});

describe('Domino Run looks', () => {
  /** Every slot covered by a puddle, from its runs. */
  const covered = (l: Line['lanes'][number]) =>
    puddles(l).flatMap((r) => Array.from({ length: r.to - r.from + 1 }, (_, i) => r.from + i));

  it('a puddle on every empty slot that is not a socket, and never on a socket, a pinned domino, the starter or the end', () => {
    let seen = 0;
    for (const plan of PLANS) {
      const lines = [
        FIRST[plan.id],
        ...Array.from({ length: 500 }, (_, i) => makeLine(plan, new Rng(i + 1)).line),
      ];
      for (const line of lines)
        for (const l of line.lanes) {
          const wet = covered(l);
          const want = Array.from({ length: l.n - 1 }, (_, i) => i + 1).filter(
            (s) => !l.fixed[s] && !l.sockets.includes(s),
          );
          expect(wet, `level ${plan.id}`).toEqual(want);
          for (const s of wet) {
            expect(l.sockets).not.toContain(s);
            expect(l.fixed[s]).toBe(0);
          }
          for (const r of puddles(l)) expect(r.to >= r.from && r.from >= 1 && r.to < l.n).toBe(true);
          // Runs are separate: two puddles never touch, or they would be one wide puddle.
          puddles(l).forEach((r, i, a) => i > 0 && expect(r.from - a[i - 1].to).toBeGreaterThan(1));
          seen += wet.length;
        }
    }
    expect(seen, 'the generator leaves some puddles').toBeGreaterThan(0);
  });

  it('the authored first lines have no puddles, so the opening line looks as it always has', () => {
    // Level 10 is about the puddle, so its first line has one.
    for (const plan of PLANS.filter((p) => p.id < 10))
      for (const l of FIRST[plan.id].lanes) expect(puddles(l)).toEqual([]);
  });

  it('every end look is pushed like its end: bell looks by a small, drum and gong only by a giant', () => {
    expect(looksFor('bell').sort()).toEqual(['bell', 'chime', 'horn']);
    expect(looksFor('gong').sort()).toEqual(['drum', 'gong']);
    for (const [look, end] of Object.entries(LOOK_END)) {
      expect(END_SIZE[end], look).toBe(end === 'bell' ? 1 : 4);
      expect(looksFor(end)).toContain(look);
    }
  });

  it('every end look has a ringing line, and there are three moods', () => {
    for (const id of Object.values(LOOK_LINE)) expect(VOICE[id], id).toBeDefined();
    expect([...MOODS]).toEqual(['morning', 'sunset', 'low-tide']);
  });
});
