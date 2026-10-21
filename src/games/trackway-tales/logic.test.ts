import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { computeView } from '../../engine/view';
import {
  accepted, answer, caseById, CASES, check, CHECK_H, CHECK_W, colX, contacts, CARD_H, CARD_W, COLS, firstMismatch, fits, glowing, help,
  informativeColumn, inPuddle, LENS_R, makeRound, MARK, MOVE_IDS, MOVEMENTS, nearestCol, observed, petCorner, PLAY_R, remaining, roundState,
  rowY, shellButtons, SLOT_H, SLOT_W, stamp, trackLayout, type CardId, type Case, type Rect, type Round,
} from './logic';

const VIEWS = {
  landscape: computeView(1024, 768),
  portrait: computeView(768, 1024),
  phone: computeView(844, 390),
  notch: computeView(844, 390, { top: 0, right: 47, bottom: 21, left: 47 }),
};

const sig = (marks: { col: number; row: number; heading: number }[]) => marks.map((m) => `${m.col}${m.row ? 'b' : 't'}${m.heading > 0 ? '>' : '<'}`).join(' ');
const roundOf = (c: Case, cards: CardId[] = [...c.cards, ...(c.level >= 3 ? ['cant-tell' as const] : [])]): Round => ({ c, cards, magnified: null });

describe('the toy model', () => {
  it('stamps deterministically on 4, 6 and 8 columns', () => {
    for (const id of MOVE_IDS) for (const cols of [4, 6, 8]) expect(stamp(MOVEMENTS[id], cols)).toEqual(stamp(MOVEMENTS[id], cols));
  });

  it('walks one foot then the other, never two in a row on one half', () => {
    for (const cols of [4, 6, 8]) {
      const m = stamp(MOVEMENTS.walk, cols);
      expect(m).toHaveLength(cols);
      for (let i = 1; i < m.length; i++) expect(m[i].row).not.toBe(m[i - 1].row);
    }
    expect(sig(stamp(MOVEMENTS.walk, 4))).toBe('0t> 1b> 2t> 3b>');
  });

  it('hops with both feet in one column, then skips one', () => {
    for (const cols of [4, 6, 8]) {
      const m = stamp(MOVEMENTS.hop, cols);
      for (let c = 0; c < cols; c++) {
        const here = m.filter((x) => x.col === c).map((x) => x.row).sort();
        expect(here).toEqual(c % 2 === 0 ? [0, 1] : []);
      }
    }
  });

  it('leaves the same number of marks walking or hopping, over the same span', () => {
    for (const cols of [4, 6, 8]) {
      const w = stamp(MOVEMENTS.walk, cols), h = stamp(MOVEMENTS.hop, cols);
      expect(w.length).toBe(h.length);
      expect(Math.min(...w.map((x) => x.col))).toBe(Math.min(...h.map((x) => x.col)));
    }
  });

  it('standing still adds no mark and moves no column', () => {
    expect(sig(stamp(MOVEMENTS['walk-stand-walk'], 8))).toBe(sig(stamp(MOVEMENTS.walk, 8)));
    const stand = contacts(MOVEMENTS['walk-stand-walk'], 8).find((c) => c.gait === 'stand')!;
    expect(stand.marks).toEqual([]);
    expect(stand.col).toBe(3);
  });

  it('walking the other way presses the same pads in reverse order, every toe flipped', () => {
    for (const cols of [4, 6, 8]) {
      const fw = stamp(MOVEMENTS.walk, cols), bk = stamp(MOVEMENTS['walk-back'], cols);
      expect(bk.map((m) => m.col)).toEqual(fw.map((m) => m.col).reverse());
      for (const m of bk) {
        expect(m.heading).toBe(-1);
        expect(fw.find((f) => f.col === m.col)!.row).toBe(m.row);
      }
      expect(stamp(MOVEMENTS['hop-back'], cols).every((m) => m.heading === -1)).toBe(true);
    }
  });

  it('walks then hops as the table says', () => {
    expect(sig(stamp(MOVEMENTS['walk-then-hop'], 8))).toBe('0t> 1b> 2t> 3t> 3b> 5t> 5b> 7t> 7b>');
  });
});

describe('the cases', () => {
  const intended: Record<string, string[]> = {
    'L1-walk': ['walk'], 'L1-hop': ['hop'], 'L2-left': ['walk-back'], 'L2-right': ['walk'],
    'L3-pause': ['walk', 'walk-stand-walk'], 'L3-switch': ['walk-then-hop'],
  };

  it('accepts exactly the intended cards', () => {
    for (const c of CASES) expect(accepted(c).sort(), c.id).toEqual([...intended[c.id]].sort());
  });

  it('the maker always fits its own marks, and every case has the level\'s column count', () => {
    for (const c of CASES) {
      expect(fits(MOVEMENTS[c.observedFrom], observed(c))).toBe(true);
      expect(c.cols).toBe(COLS[c.level]);
    }
  });

  it('names a first mismatch inside the visible span for every card that does not fit', () => {
    for (const c of CASES) {
      const o = observed(c);
      const lo = Math.min(...o.marks.map((m) => m.col)), hi = Math.max(...o.marks.map((m) => m.col));
      for (const id of c.cards) {
        const mm = firstMismatch(MOVEMENTS[id], o);
        if (accepted(c).includes(id)) expect(mm).toBeNull();
        else {
          expect(mm, `${c.id} ${id}`).not.toBeNull();
          expect(mm!.col).toBeGreaterThanOrEqual(lo);
          expect(mm!.col).toBeLessThanOrEqual(hi);
          expect(inPuddle(mm!.col, c.puddle)).toBe(false);
        }
      }
    }
  });

  it('gives the clue the walkthrough names', () => {
    const at = (cid: string, id: keyof typeof MOVEMENTS) => firstMismatch(MOVEMENTS[id], observed(caseById(cid as Case['id'])));
    expect(at('L1-walk', 'hop')).toEqual({ col: 0, kind: 'extra' });
    expect(at('L1-hop', 'walk')).toEqual({ col: 0, kind: 'missing' });
    expect(at('L2-left', 'walk')).toEqual({ col: 0, kind: 'toe' });
    expect(at('L2-left', 'hop-back')!.kind).toBe('extra');
    expect(at('L2-right', 'walk-back')!.kind).toBe('toe');
    expect(at('L3-pause', 'hop')).toEqual({ col: 0, kind: 'extra' });
    expect(at('L3-switch', 'walk')).toEqual({ col: 5, kind: 'missing' });
    expect(at('L3-switch', 'hop')).toEqual({ col: 0, kind: 'extra' });
  });

  it('a puddle never removes a card the whole trackway accepted, and L3-pause is ambiguous because standing leaves nothing', () => {
    for (const c of CASES) {
      const whole: Case = { ...c, puddle: undefined };
      for (const id of accepted(whole)) expect(accepted(c)).toContain(id);
    }
    const noPuddle: Case = { ...caseById('L3-pause'), puddle: undefined };
    expect(accepted(noPuddle).sort()).toEqual(['walk', 'walk-stand-walk']);
  });

  it("Can't tell is right in exactly one case and wrong in exactly one", () => {
    const l3 = CASES.filter((c) => c.level === 3);
    expect(l3.filter((c) => answer(c) === 'cant-tell').map((c) => c.id)).toEqual(['L3-pause']);
    expect(l3.filter((c) => answer(c) !== 'cant-tell').map((c) => c.id)).toEqual(['L3-switch']);
    for (const c of CASES) expect(answer(c) === 'cant-tell').toBe(accepted(c).length >= 2);
  });
});

describe('rounds', () => {
  it('draws the level\'s cases with every card order, a seeded magnifier and Can\'t tell last at level 3', () => {
    for (const level of [1, 2, 3]) {
      const ids = new Set<string>(), orders = new Set<string>();
      for (let i = 1; i <= 500; i++) {
        const r = makeRound(level, new Rng(i));
        expect(r.c.level).toBe(level);
        ids.add(r.c.id);
        const moves = r.cards.filter((x) => x !== 'cant-tell');
        expect([...moves].sort()).toEqual([...r.c.cards].sort());
        orders.add(`${r.c.id}:${moves.join(',')}`);
        expect(r.cards.includes('cant-tell')).toBe(level === 3);
        if (level === 3) expect(r.cards[r.cards.length - 1]).toBe('cant-tell');
        if (level >= 2) expect(observed(r.c).marks).toContainEqual(r.magnified);
        else expect(r.magnified).toBeNull();
        expect(makeRound(level, new Rng(i))).toEqual(r);
      }
      expect(ids.size).toBe(2);
      const perms = level === 1 ? 2 : 6;
      expect(orders.size).toBe(2 * perms);
    }
  });

  it('opens each level with its authored first round', () => {
    expect(makeRound(1, new Rng(1), true).cards).toEqual(['hop', 'walk']);
    const two = makeRound(2, new Rng(1), true);
    expect([two.c.id, two.magnified?.col]).toEqual(['L2-left', 5]);
    const three = makeRound(3, new Rng(1), true);
    expect([three.c.id, three.cards.join(',')]).toEqual(['L3-pause', 'walk-stand-walk,hop,walk,cant-tell']);
  });
});

describe('accounting', () => {
  it('level 1: hop then walk is one miss and no hint', () => {
    const s = roundState(roundOf(caseById('L1-walk')));
    expect(check(s, 'hop')).toMatchObject({ kind: 'wrong', mismatch: 'extra', glow: false });
    expect(check(s, 'walk')).toMatchObject({ kind: 'right' });
    expect([s.misses, s.hints, s.done]).toEqual([1, 0, true]);
  });

  it('an empty slot changes nothing, and a finished round ignores Check', () => {
    const s = roundState(roundOf(caseById('L1-hop')));
    expect(check(s, null).kind).toBe('empty');
    expect([s.misses, s.hints]).toEqual([0, 0]);
    check(s, 'hop');
    expect(check(s, 'walk').kind).toBe('ignored');
  });

  it('three wrong Checks glow the right card with one hint, and asking again keeps it at one', () => {
    const s = roundState(roundOf(caseById('L1-walk')));
    expect(check(s, 'hop')).toMatchObject({ glow: false });
    expect(glowing(s)).toBeNull();
    expect(check(s, 'hop')).toMatchObject({ glow: true });
    expect(glowing(s)).toBe('walk');
    check(s, 'hop');
    expect(help(s)).toBe(false);
    expect(check(s, glowing(s))).toMatchObject({ kind: 'right' });
    expect([s.misses, s.hints]).toEqual([3, 1]);
  });

  it('Show a hint counts once and lights the glow', () => {
    const s = roundState(roundOf(caseById('L3-pause')));
    expect(help(s)).toBe(true);
    expect(help(s)).toBe(false);
    expect(glowing(s)).toBe('cant-tell');
    expect(s.hints).toBe(1);
  });

  it("L3-pause: a fitting card shows the other fit for free, then Can't tell is right", () => {
    const s = roundState(roundOf(caseById('L3-pause')));
    expect(check(s, 'walk')).toEqual({ kind: 'both-fit', other: 'walk-stand-walk' });
    expect(check(s, 'cant-tell')).toMatchObject({ kind: 'right' });
    expect([s.misses, s.hints]).toEqual([0, 0]);
  });

  it("L3-switch: Can't tell is a miss, and the one fit is named", () => {
    const s = roundState(roundOf(caseById('L3-switch')));
    expect(check(s, 'cant-tell')).toEqual({ kind: 'cant-tell-wrong', fit: 'walk-then-hop', glow: false });
    expect(s.misses).toBe(1);
  });
});

describe('hints', () => {
  it('ring a column where a remaining card differs from the mud, ruling it out', () => {
    for (const c of CASES) {
      const o = observed(c);
      const col = informativeColumn(c, c.cards);
      expect(col, c.id).not.toBeNull();
      expect(inPuddle(col!, c.puddle)).toBe(false);
      const ruled = c.cards.filter((id) => {
        const s = stamp(MOVEMENTS[id], c.cols).filter((m) => m.col === col).map((m) => `${m.row}${m.heading}`).sort().join();
        const ob = o.marks.filter((m) => m.col === col).map((m) => `${m.row}${m.heading}`).sort().join();
        return s !== ob;
      });
      expect(ruled.length).toBeGreaterThanOrEqual(1);
      for (const id of ruled) expect(accepted(c)).not.toContain(id);
    }
  });

  it('following the glow finishes every case', () => {
    for (const c of CASES) {
      const s = roundState(roundOf(c));
      help(s);
      expect(check(s, glowing(s))).toMatchObject({ kind: 'right' });
    }
  });

  it('a card shown wrong leaves the remaining list', () => {
    const s = roundState(roundOf(caseById('L2-left')));
    check(s, 'walk');
    expect(remaining(s).sort()).toEqual(['hop-back', 'walk-back']);
  });
});

describe('layout', () => {
  const box = (p: { x: number; y: number }, w: number, h: number): Rect => ({ x: p.x - w / 2, y: p.y - h / 2, w, h });
  const overlap = (a: Rect, b: Rect) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
  const inside = (a: Rect, v: { w: number; h: number }) => a.x >= 0 && a.y >= 0 && a.x + a.w <= v.w && a.y + a.h <= v.h;
  for (const [name, v] of Object.entries(VIEWS)) {
    for (const level of [1, 2, 3]) {
      it(`fits ${name} at level ${level}`, () => {
        const L = trackLayout(v, level);
        const cols = COLS[level];
        const targets: [string, Rect][] = [
          ['practice', L.practice], ['mud', L.mud],
          ...L.cards.map((c, i): [string, Rect] => [`card${i}`, box(c, CARD_W, CARD_H)]),
          ['slot', box(L.slot, SLOT_W, SLOT_H)], ['check', box(L.check, CHECK_W, CHECK_H)],
        ];
        expect(L.cards).toHaveLength(level === 3 ? 4 : level === 2 ? 3 : 2);
        const fixed = [petCorner(v), ...shellButtons(v)];
        for (const [n, r] of targets) {
          expect(inside(r, v), `${n} inside`).toBe(true);
          for (const f of fixed) expect(overlap(r, f), `${n} vs shell`).toBe(false);
          expect(Math.min(r.w, r.h), n).toBeGreaterThanOrEqual(100);
        }
        for (let i = 0; i < targets.length; i++) for (let j = i + 1; j < targets.length; j++) {
          expect(overlap(targets[i][1], targets[j][1]), `${targets[i][0]} vs ${targets[j][0]}`).toBe(false);
        }
        // The card above its Play button is a target of its own, and the Play button is round and full size.
        expect(CARD_H - 2 * PLAY_R - 10).toBeGreaterThanOrEqual(100);
        expect(2 * PLAY_R).toBeGreaterThanOrEqual(100);
        L.plays.forEach((p, i) => {
          expect(p.x).toBe(L.cards[i].x);
          expect(p.y + PLAY_R).toBeLessThanOrEqual(L.cards[i].y + CARD_H / 2);
          expect(p.y - PLAY_R - (L.cards[i].y - CARD_H / 2)).toBeGreaterThanOrEqual(100);
        });
        // Eight 70-unit pads fit their columns, and both rows fit the strip.
        expect(L.colW).toBeGreaterThanOrEqual(MARK + 10);
        expect(L.mud.w).toBeCloseTo(L.colW * cols);
        expect(rowY(L.mud, 0) - MARK / 2).toBeGreaterThanOrEqual(L.mud.y - 1);
        expect(rowY(L.mud, 1) + MARK / 2).toBeLessThanOrEqual(L.mud.y + L.mud.h + 1);
        for (let c = 0; c < cols; c++) expect(nearestCol(L, colX(L, c) + 20, cols)).toBe(c);
        expect(inside(box(L.lens, 2 * LENS_R, 2 * LENS_R), v)).toBe(true);
      });
    }
  }
});
