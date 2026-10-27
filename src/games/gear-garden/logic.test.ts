import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { computeView } from '../../engine/view';
import {
  BLOOM_TURNS, GearTally, Machine, PITCH, choiceLayout, contacts, corners, dropsInGap, filledWith, gapOf, gearLayout, helpFor,
  inputOf, lineBoard, mod, outputOf, overlaps, phases, roundFor, toScreen, validate,
  type Board, type MachineSpec, type Role, type Step,
} from './logic';

const SEEDS = Array.from({ length: 500 }, (_, i) => i + 1);
const views = {
  landscape: computeView(1024, 768),
  portrait: computeView(768, 1024),
  phone: computeView(844, 390),
  notch: computeView(844, 390, { top: 0, right: 47, bottom: 21, left: 47 }),
};

function machinesOf(steps: Step[]): MachineSpec[] {
  return steps.flatMap((s) => (s.kind === 'one' ? [s.machine] : [s.pair.a, s.pair.b]));
}
const dist = (b: Board, i: number, j: number) => Math.hypot(b.sockets[i].x - b.sockets[j].x, b.sockets[i].y - b.sockets[j].y);
const mk = (roles: Role[], tilt = 0, mirror = false) =>
  new Machine({ board: lineBoard(roles, tilt, mirror), flower: 'tulip', color: 'pink', visitor: 'duck' });

describe('boards and contacts', () => {
  it('validate passes and contacts are exactly the adjacent filled pairs', () => {
    for (const level of [1, 2, 3])
      for (const seed of SEEDS)
        for (const m of machinesOf(roundFor(level, new Rng(seed)))) {
          const b = m.board;
          expect(validate(b)).toBe(true);
          for (const looseIn of [false, true]) {
            const filled = filledWith(b, looseIn);
            const want: [number, number][] = [];
            for (let i = 0; i + 1 < b.sockets.length; i++) if (filled[i] && filled[i + 1]) want.push([i, i + 1]);
            expect(contacts(b, filled)).toEqual(want);
          }
          for (let i = 0; i < b.sockets.length; i++)
            for (let j = i + 1; j < b.sockets.length; j++)
              expect(dist(b, i, j)).toBeCloseTo(j - i === 1 ? 2 : 2 * (j - i), 6);
        }
  });

  it('the same seed gives the same round', () => {
    for (const level of [1, 2, 3]) expect(roundFor(level, new Rng(7))).toEqual(roundFor(level, new Rng(7)));
  });
});

describe('turning', () => {
  it('a quarter turn moves every connected gear one quarter, alternating sign, and turning back restores', () => {
    const m = mk(['input', 'idler', 'idler', 'output']);
    const { delta } = m.turn(1);
    expect(delta).toEqual([1, -1, 1, -1]);
    m.turn(-1);
    expect(m.turns).toEqual([0, 0, 0, 0]);
    m.turn(-1);
    expect(m.turns).toEqual([-1, 1, -1, 1]);
    m.turn(1);
    expect(m.turns).toEqual([0, 0, 0, 0]);
  });

  it('reset is deterministic', () => {
    const a = mk(['input', 'gap', 'output']);
    a.place(true);
    a.turn(1);
    a.reset();
    const b = mk(['input', 'gap', 'output']);
    expect(a.turns).toEqual(b.turns);
    expect(a.progress).toBe(0);
    expect(a.looseIn).toBe(false);
  });

  it('a gap left empty keeps the output at 0 and never blooms', () => {
    for (const seed of SEEDS.slice(0, 100)) {
      const rng = new Rng(seed);
      const m = new Machine(machinesOf(roundFor(3, new Rng(seed)))[rng.int(0, 1) ? 1 : 0]);
      for (let k = 0; k < 40; k++) m.turn(rng.chance(0.5) ? 1 : -1);
      expect(m.turns[outputOf(m.spec.board)]).toBe(0);
      expect(m.bloomed).toBe(false);
      expect(m.progress).toBe(0);
    }
  });

  it('any mix of four +-1 turns blooms a connected machine', () => {
    for (let mask = 0; mask < 16; mask++) {
      const m = mk(['input', 'output']);
      for (let k = 0; k < BLOOM_TURNS; k++) {
        expect(m.bloomed).toBe(false);
        m.turn(mask & (1 << k) ? 1 : -1);
      }
      expect(m.bloomed).toBe(true);
    }
  });
});

describe('solution sets', () => {
  it('level 2: of tray and gap only the gap completes', () => {
    for (const seed of SEEDS.slice(0, 100))
      for (const spec of machinesOf(roundFor(2, new Rng(seed)))) {
        for (const inGap of [false, true]) {
          const m = new Machine(spec);
          m.place(inGap);
          for (let k = 0; k < 6; k++) m.turn(1);
          expect(m.bloomed).toBe(inGap);
        }
      }
  });

  it('level 3: only the gap completes; A turns the same way as the handle, B the other', () => {
    const bGaps = new Set<number>();
    for (const seed of SEEDS) {
      for (const step of roundFor(3, new Rng(seed))) {
        if (step.kind !== 'choice') throw new Error('expected choice');
        const a = new Machine(step.pair.a);
        const b = new Machine(step.pair.b);
        bGaps.add(gapOf(b.spec.board));
        for (const m of [a, b]) {
          const bad = new Machine(m.spec);
          for (let k = 0; k < 6; k++) bad.turn(1);
          expect(bad.bloomed).toBe(false);
          m.place(true);
          for (let k = 0; k < 4; k++) m.turn(1);
          expect(m.bloomed).toBe(true);
        }
        expect(a.sameWay).toBe(true);
        expect(b.sameWay).toBe(false);
        expect(a.turns[outputOf(a.spec.board)]).toBe(4);
        expect(b.turns[outputOf(b.spec.board)]).toBe(-4);
      }
    }
    expect([...bGaps].sort()).toEqual([1, 2]);
  });
});

describe('teeth phase', () => {
  it('meshing teeth sit half a pitch apart, at rest and after any turns', () => {
    for (const seed of SEEDS.slice(0, 150))
      for (const spec of machinesOf(roundFor(1 + (seed % 3), new Rng(seed)))) {
        const b = spec.board;
        const ph = phases(b);
        const m = new Machine(spec);
        m.place(true);
        for (let k = 0; k < 7; k++) {
          for (let i = 0; i + 1 < b.sockets.length; i++) {
            const j = i + 1;
            const alpha = Math.atan2(b.sockets[j].y - b.sockets[i].y, b.sockets[j].x - b.sockets[i].x);
            const ti = ph[i] + (m.turns[i] * Math.PI) / 2;
            const tj = ph[j] + (m.turns[j] * Math.PI) / 2;
            const sum = mod(mod(alpha - ti, PITCH) + mod(alpha + Math.PI - tj, PITCH), PITCH);
            expect(Math.abs(sum - PITCH / 2)).toBeLessThan(1e-6);
          }
          m.turn(k % 3 === 0 ? -1 : 1);
        }
      }
  });
});

describe('help', () => {
  it('following helpFor from every reachable state completes the machine', () => {
    for (const seed of SEEDS.slice(0, 60))
      for (const spec of machinesOf(roundFor(1 + (seed % 3), new Rng(seed)))) {
        for (const placed of [false, true])
          for (let pre = 0; pre < 5; pre++) {
            const m = new Machine(spec);
            m.place(placed);
            for (let k = 0; k < pre; k++) m.turn(k % 2 ? -1 : 1);
            let steps = 0;
            while (!m.bloomed && steps++ < 20) {
              const h = helpFor(m);
              if (h === 'place') {
                expect(m.hasGap && !m.looseIn).toBe(true);
                m.place(true);
              } else {
                expect(h).toBe('turn');
                expect(m.hasGap && !m.looseIn).toBe(false);
                m.turn(1);
              }
            }
            expect(m.bloomed).toBe(true);
          }
      }
    expect(helpFor(null)).toBe('choose');
  });
});

describe('GearTally', () => {
  const still = (t: GearTally) => { const r = t.turned(false); t.touched(); return r; };

  it('is never a miss; two still trials glow with one hint, two more install without another', () => {
    const t = new GearTally();
    expect(still(t)).toBeNull();
    expect(t.hints).toBe(0);
    expect(still(t)).toBe('glow');
    expect(t.hints).toBe(1);
    expect(t.glowing).toBe(true);
    expect(still(t)).toBeNull();
    expect(still(t)).toBe('install');
    expect(t.hints).toBe(1);
    expect(t.misses).toBe(0);
  });

  it('consecutive still turns are one trial until touched()', () => {
    const t = new GearTally();
    for (let k = 0; k < 5; k++) expect(t.turned(false)).toBeNull();
    expect(t.hints).toBe(0);
    t.touched();
    expect(t.turned(false)).toBe('glow');
  });

  it('asked() after a glow adds nothing, and Start again never recounts', () => {
    const t = new GearTally();
    t.next(0);
    still(t);
    still(t);
    t.asked();
    expect(t.hints).toBe(1);
    t.next(1);
    t.asked();
    expect(t.hints).toBe(2);
    t.next(0);
    still(t);
    still(t);
    t.asked();
    expect(t.hints).toBe(2);
    expect(t.misses).toBe(0);
  });
});

describe('authored first rounds', () => {
  it('level 1', () => {
    for (const seed of SEEDS.slice(0, 50)) {
      const [a, b, c] = machinesOf(roundFor(1, new Rng(seed)));
      expect([a.flower, a.board.tilt, a.board.mirror, a.board.sockets.length]).toEqual(['tulip', 0, false, 2]);
      expect([b.flower, b.board.tilt, b.board.mirror]).toEqual(['daisy', 15, true]);
      expect(c.flower).toBe('sunflower');
    }
  });
  it('level 2', () => {
    for (const seed of SEEDS.slice(0, 50)) {
      const a = machinesOf(roundFor(2, new Rng(seed)))[0];
      expect(a.flower).toBe('daisy');
      expect(a.board.tilt).toBe(0);
      expect(a.board.sockets.map((s) => s.role)).toEqual(['input', 'gap', 'output']);
    }
  });
  it('level 3 first case B has its gap at index 1', () => {
    for (const seed of SEEDS.slice(0, 50)) {
      const s = roundFor(3, new Rng(seed))[0];
      if (s.kind !== 'choice') throw new Error('choice');
      expect(gapOf(s.pair.b.board)).toBe(1);
      expect(s.pair.b.board.sockets).toHaveLength(4);
      expect(s.pair.a.board.sockets).toHaveLength(3);
    }
  });
});

describe('layout', () => {
  const roleSets: [Role[], boolean][] = [
    [['input', 'output'], false],
    [['input', 'gap', 'output'], false],
    [['input', 'gap', 'output'], true],
    [['input', 'gap', 'idler', 'output'], true],
    [['input', 'idler', 'gap', 'output'], true],
  ];
  for (const [name, v] of Object.entries(views))
    it(`every board fits at ${name}`, () => {
      for (const [roles, withCard] of roleSets)
        for (const tilt of [0, 15, -15])
          for (const mirror of [false, true]) {
            const board = lineBoard(roles, tilt, mirror);
            const l = gearLayout(v, board, withCard);
            expect(l).not.toBeNull();
            if (!l) continue;
            expect(l.r).toBeGreaterThanOrEqual(45);
            expect(l.r).toBeLessThanOrEqual(90);
            const hasGap = gapOf(board) >= 0;
            const parts = [l.face, l.back, ...(hasGap ? [l.tray] : []), ...(l.card ? [l.card] : [])];
            expect(Boolean(l.card)).toBe(withCard);
            for (const p of parts) {
              expect(p.x).toBeGreaterThanOrEqual(0);
              expect(p.y).toBeGreaterThanOrEqual(0);
              expect(p.x + p.w).toBeLessThanOrEqual(v.w);
              expect(p.y + p.h).toBeLessThanOrEqual(v.h);
              for (const k of corners(v)) expect(overlaps(p, k)).toBe(false);
            }
            parts.forEach((p, i) => parts.forEach((q, j) => { if (i < j) expect(overlaps(p, q)).toBe(false); }));
            expect(l.back.w).toBeGreaterThanOrEqual(100);
            expect(l.back.h).toBeGreaterThanOrEqual(100);
            expect(l.tray.w).toBeGreaterThanOrEqual(100);
            expect(l.tray.h).toBeGreaterThanOrEqual(100);
            if (l.card) {
              expect(l.card.w).toBeGreaterThanOrEqual(120);
              expect(l.card.h).toBeGreaterThanOrEqual(120);
            }
          }
    });

  for (const [name, v] of Object.entries(views))
    it(`choice panels fit at ${name}`, () => {
      const p = choiceLayout(v);
      expect(p).not.toBeNull();
      if (!p) return;
      for (const r of p) {
        expect(r.w).toBeGreaterThanOrEqual(300);
        expect(r.h).toBeGreaterThanOrEqual(220);
        expect(r.x).toBeGreaterThanOrEqual(0);
        expect(r.y).toBeGreaterThanOrEqual(0);
        expect(r.x + r.w).toBeLessThanOrEqual(v.w);
        expect(r.y + r.h).toBeLessThanOrEqual(v.h);
        for (const k of corners(v)) expect(overlaps(r, k)).toBe(false);
      }
      expect(overlaps(p[0], p[1])).toBe(false);
    });

  it('dropsInGap is true at the gap centre and false 1.3r away', () => {
    const board = lineBoard(['input', 'gap', 'output']);
    const l = gearLayout(views.landscape, board)!;
    const c = toScreen(l, board.sockets[gapOf(board)]);
    expect(dropsInGap(l, board, c.x, c.y)).toBe(true);
    expect(dropsInGap(l, board, c.x + 1.3 * l.r, c.y)).toBe(false);
    expect(dropsInGap(l, board, c.x, c.y + 1.3 * l.r)).toBe(false);
    expect(inputOf(board)).toBe(0);
  });
});
