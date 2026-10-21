import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { computeView } from '../../engine/view';
import {
  alignments, allGreen, authored, BTN_H, BTN_W, CARD_H, CARD_W, claim, COL_W, commitLook, cove, currentStep, fits, glowing, glowTarget,
  gull, help, informative, layersLayout, LENS_R, LOOK_H, LOOK_W, LOOKS, lostRow, makeCase, move, nearestRow, petCorner, PICTURES,
  problems, ROW_H, roundState, rowY, shellButtons, SLOT_H, SLOT_W, story, ties, valid, type Case, type Placement, type Rect, type RoundState,
} from './logic';

const VIEWS = {
  landscape: computeView(1024, 768),
  portrait: computeView(768, 1024),
  phone: computeView(844, 390),
  notch: computeView(844, 390, { top: 0, right: 47, bottom: 21, left: 47 }),
};

const cases = (level: number, n = 500): Case[] => Array.from({ length: n }, (_, i) => makeCase(level, new Rng(i + 1)));
const triples = (): Placement[] => {
  const out: Placement[] = [];
  for (let a = 1; a <= 6; a++) for (let b = 1; b <= 6; b++) for (let c = 1; c <= 6; c++) if (a !== b && b !== c && a !== c) out.push([a, b, c]);
  return out;
};
const put = (s: RoundState, rows: Placement) => rows.forEach((r, i) => move(s, i, r));

describe('pictures and columns', () => {
  it('draws three distinct pictures, the lost one only at Gull Cliff', () => {
    for (const level of [1, 2]) {
      const layouts = new Set<string>();
      const roles = [new Set<string>(), new Set<string>(), new Set<string>()];
      for (const c of cases(level)) {
        expect(new Set(c.pictures).size).toBe(3);
        const g = gull(c), b = cove(c);
        expect(g).toHaveLength(6);
        const pics = g.map((l) => l.picture).filter(Boolean);
        expect(new Set(pics).size).toBe(pics.length);
        expect(pics).toContain(c.pictures[1]);
        expect(b.map((l) => l.picture)).toEqual([c.pictures[0], null, c.pictures[2]]);
        layouts.add(c.layout);
        c.pictures.forEach((p, i) => roles[i].add(p));
        expect(new Set(c.looks)).toEqual(new Set(LOOKS));
      }
      expect(layouts).toEqual(new Set(['low', 'high']));
      for (const r of roles) expect(r).toEqual(new Set(PICTURES));
    }
  });

  it('is deterministic from its seed', () => {
    for (const level of [1, 2]) expect(makeCase(level, new Rng(42))).toEqual(makeCase(level, new Rng(42)));
  });
});

describe('validity', () => {
  const c = authored(1);
  it('rejects a broken order, a picture off its twin and a squeezed wavy line', () => {
    expect(valid(c, [3, 1, 6])).toBe(false);
    expect(problems(c, [3, 1, 6])[0].reason).toBe('out-of-order');
    expect(problems(c, [2, 4, 6]).map((p) => p.reason)).toContain('picture-off-twin');
    expect(problems(c, [1, 2, 6]).map((p) => p.reason)).toEqual(['wavy-squeezed']);
    expect(problems(c, [1, 5, 6]).map((p) => p.reason)).toEqual(['wavy-squeezed']);
  });
  it('accepts the plain piece on a pictured row', () => {
    expect(valid(c, [1, 3, 6])).toBe(true);
  });
  it('enforces the stripe both ways after the look', () => {
    for (const stripe of [true, false]) {
      const k: Case = { ...authored(2), stripe };
      const on: Placement = [1, lostRow(k), 6];
      const off: Placement = [1, lostRow(k) === 3 ? 4 : 3, 6];
      expect(valid(k, on, true)).toBe(stripe);
      expect(valid(k, off, true)).toBe(!stripe);
      expect(valid(k, on)).toBe(true);
      expect(valid(k, off)).toBe(true);
    }
  });
});

describe('level 1: two stories fit', () => {
  it('always has exactly the two fits, one of each story', () => {
    for (const c of cases(1)) {
      const a = alignments(c);
      expect(a).toEqual([[1, 3, 6], [1, 4, 6]]);
      expect(new Set(a.map((p) => story(c, p)))).toEqual(new Set(['in-the-mud', 'washed-away']));
      for (const r of [2, 5]) expect(problems(c, [1, r, 6]).map((p) => p.reason)).toEqual(['wavy-squeezed']);
    }
  });
});

describe('level 2: one more look', () => {
  it('leaves exactly one fit after the mud look, the stripe deciding which', () => {
    const seen = new Set<boolean>();
    for (const c of cases(2)) {
      expect(alignments(c)).toHaveLength(2);
      const after = alignments(c, true);
      expect(after).toHaveLength(1);
      expect(story(c, after[0]) === 'in-the-mud').toBe(c.stripe);
      seen.add(c.stripe);
      expect(LOOKS.filter((l) => informative(c, l))).toEqual(['lens-mud']);
    }
    expect(seen).toEqual(new Set([true, false]));
  });
});

describe('ties', () => {
  it('are all green exactly when the placement is valid, over every arrangement', () => {
    for (const c of [...cases(1, 20), ...cases(2, 20)]) {
      for (const looked of c.level >= 2 ? [false, true] : [false]) {
        for (const p of triples()) expect(allGreen(ties(c, p, looked)), `${p}`).toBe(valid(c, p, looked));
      }
    }
  });
  it('shows the squeezed band, and a slanted tie for a moved bottom piece', () => {
    const c = authored(1);
    expect(ties(c, [1, 2, 6]).bands.map((b) => b.red)).toEqual([true, false]);
    expect(ties(c, [1, 5, 6]).bands.map((b) => b.red)).toEqual([false, true]);
    const t = ties(c, [2, 4, 6]).ties.find((x) => x.piece === 0)!;
    expect([t.green, t.from, t.to]).toEqual([false, 2, 1]);
  });
});

describe('accounting and hints', () => {
  it("plays the definition's level-1 round: misses 2, hints 0", () => {
    const s = roundState(authored(1));
    expect(s.rows).toEqual([1, 2, 6]);
    expect(fits(s)).toMatchObject({ kind: 'red', reason: 'wavy-squeezed' });
    move(s, 1, 3);
    expect(fits(s)).toMatchObject({ kind: 'stamped', story: 'in-the-mud' });
    expect(fits(s)).toMatchObject({ kind: 'already' });
    expect(claim(s, 'cant-tell').kind).toBe('maybe');
    expect(claim(s, 'in-the-mud')).toMatchObject({ kind: 'other-fits', placement: [1, 4, 6] });
    expect(s.stamped).toHaveLength(2);
    expect(currentStep(s)).toBe('claim');
    expect(claim(s, 'cant-tell').kind).toBe('right');
    expect([s.misses, s.hints, s.done]).toEqual([2, 0, true]);
  });

  it('glows a fit after two red It fits, once, and a request then leaves it', () => {
    const s = roundState(authored(1));
    fits(s);
    expect(fits(s)).toMatchObject({ kind: 'red', glow: true });
    expect(s.hints).toBe(1);
    expect(glowing(s)).toEqual({ kind: 'fit', placement: [1, 3, 6] });
    expect(help(s)).toBe(false);
    expect(s.hints).toBe(1);
    put(s, [1, 3, 6]);
    fits(s);
    expect(glowing(s)).toEqual({ kind: 'fit', placement: [1, 4, 6] });
  });

  it("plays the definition's level-2 round: misses 1, hints 0", () => {
    const s = roundState(authored(2));
    expect(s.stamped).toHaveLength(2);
    expect(s.rows).toEqual([1, 3, 6]);
    expect(claim(s, 'cant-tell').kind).toBe('not-yet');
    expect(claim(s, 'in-the-mud').kind).toBe('not-yet');
    expect(commitLook(s, 'lens-wavy')).toMatchObject({ kind: 'useless', glow: false });
    expect(commitLook(s, 'lens-mud')).toEqual({ kind: 'informative', stripe: true });
    expect(commitLook(s, 'lens-shell').kind).toBe('ignored');
    move(s, 1, 4);
    expect(claim(s, 'in-the-mud').kind).toBe('right');
    expect([s.misses, s.hints]).toEqual([1, 0]);
  });

  it('two useless looks glow the mud look: misses 2, hints 1', () => {
    const s = roundState(authored(2));
    commitLook(s, 'lens-wavy');
    expect(commitLook(s, 'lens-shell')).toMatchObject({ glow: true });
    expect(glowing(s)).toEqual({ kind: 'look', look: 'lens-mud' });
    commitLook(s, 'lens-mud');
    expect(claim(s, 'in-the-mud').kind).toBe('right');
    expect([s.misses, s.hints]).toEqual([2, 1]);
  });

  it('a wrong level-2 claim shows the ruled-out story and counts', () => {
    for (const c of cases(2, 50)) {
      const s = roundState(c);
      commitLook(s, 'lens-mud');
      const r = claim(s, 'cant-tell');
      expect(r.kind).toBe('ruled-out');
      expect(valid(c, s.rows, true)).toBe(false);
      expect(s.misses).toBe(1);
    }
  });

  it('every glow leads somewhere: following it finishes its step', () => {
    for (const c of [...cases(1, 50), ...cases(2, 50)]) {
      const s = roundState(c);
      for (let guard = 0; guard < 6 && !s.done; guard++) {
        const g = glowTarget(s)!;
        if (g.kind === 'fit') { put(s, g.placement); expect(fits(s).kind).toBe('stamped'); }
        else if (g.kind === 'look') expect(commitLook(s, g.look).kind).toBe('informative');
        else expect(claim(s, g.claim).kind).toBe('right');
      }
      expect([s.done, s.misses]).toEqual([true, 0]);
    }
  });

  it('a requested hint counts once per step', () => {
    const s = roundState(authored(2));
    expect(help(s)).toBe(true);
    expect(help(s)).toBe(false);
    commitLook(s, 'lens-mud');
    expect(help(s)).toBe(true);
    expect(s.hints).toBe(2);
  });
});

describe('layout', () => {
  const box = (p: { x: number; y: number }, w: number, h: number): Rect => ({ x: p.x - w / 2, y: p.y - h / 2, w, h });
  const overlap = (a: Rect, b: Rect) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
  const inside = (a: Rect, v: { w: number; h: number }) => a.x >= 0 && a.y >= 0 && a.x + a.w <= v.w && a.y + a.h <= v.h;
  for (const [name, v] of Object.entries(VIEWS)) {
    for (const level of [1, 2]) {
      it(`fits ${name} at level ${level}`, () => {
        const L = layersLayout(v, level);
        const top = L.bottom - 6 * ROW_H;
        const cols: [string, Rect][] = [['gull', { x: L.gullX, y: top, w: COL_W, h: 6 * ROW_H }], ['cove', { x: L.coveX, y: top, w: COL_W, h: 6 * ROW_H }]];
        const targets: [string, Rect][] = [
          ['action', box(L.action, BTN_W, BTN_H)], ['cant', box(L.cantTell, BTN_W, BTN_H)],
          ...L.cards.map((c, i): [string, Rect] => [`card${i}`, box(c, CARD_W, CARD_H)]),
        ];
        if (level >= 2) {
          targets.push(['slot', box(L.slot, SLOT_W, SLOT_H)]);
          L.looks.forEach((p, i) => targets.push([`look${i}`, box(p, LOOK_W, LOOK_H)]));
        }
        const fixed = [petCorner(v), ...shellButtons(v)];
        const all = [...cols, ...targets];
        for (const [n, r] of all) {
          expect(inside(r, v), `${n} inside`).toBe(true);
          for (const f of fixed) expect(overlap(r, f), `${n} vs shell`).toBe(false);
          expect(Math.min(r.w, r.h), n).toBeGreaterThanOrEqual(100);
        }
        for (let i = 0; i < all.length; i++) for (let j = i + 1; j < all.length; j++) expect(overlap(all[i][1], all[j][1]), `${all[i][0]} vs ${all[j][0]}`).toBe(false);
        expect(L.coveX - (L.gullX + COL_W)).toBeGreaterThanOrEqual(60);
        expect(inside(box(L.lens, 2 * LENS_R, 2 * LENS_R), v)).toBe(true);
        for (let r = 1; r <= 6; r++) expect(nearestRow(L, rowY(L, r) + 30)).toBe(r);
      });
    }
  }
});
