import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { computeView } from '../../engine/view';
import {
  arrangements, describe as name, dominoLayout, emptyPlacement, FIRST, hintPlacement, lane, makeLine, makeRound, passes, PITCH, PLANS, planFor,
  remaining, rings, run, runLane, slotBox, solutions, SLOT_H, stallReason, TRAY_W, type Line, type Placement,
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
    const bell = lane('SB'), gong = lane('SO');
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
  });

  it('their named wrong arrangements stall for the named reason', () => {
    expect(run(FIRST[3], emptyPlacement(FIRST[3]))[0].stall?.reason).toBe('too-far');
    expect(run(FIRST[6], at(FIRST[6], { 2: 3 }))[0].stall?.reason).toBe('too-heavy');
    expect(run(FIRST[7], at(FIRST[7], { 2: 2, 3: 2 }))[0].stall?.reason).toBe('too-far');
    expect(run(FIRST[8], at(FIRST[8], { 2: 2, 3: 3 }, { 3: 3 }))[1].stall?.reason).toBe('too-heavy');
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

  it('a round starts with the authored line and has the plan\'s number of lines', () => {
    for (const plan of PLANS) {
      const round = makeRound(plan, new Rng(7));
      expect(round[0]).toBe(FIRST[plan.id]);
      expect(round).toHaveLength(plan.lines);
    }
    expect(planFor(0).id).toBe(1);
    expect(planFor(99).id).toBe(8);
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
        const keepsAll = sols.some((s) => s.every((l, k) => l.every((v, slot) => !p[k][slot] || p[k][slot] === v))
          && s.some((l, k) => l.some((v, slot) => v && !p[k][slot] && left.includes(v as 1))));
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
