import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { computeView } from '../../engine/view';
import {
  answer, authored, BADGE_R, BRUSH, BRUSH_SPOTS, CARD, CASES, caseOf, cellCenter, check, CHECK_R, COLS, digLayout, digState, edgeCells,
  edgePoint, FLAG, FLAGS, glowing, glowTarget, help, leafCells, leafOf, LEAVES, MAG_R, makeRound, matches, nextBrush, pat, patCells,
  petCorner, pickLeaf, PLANS, planFor, returnLeaf, revealed, ROWS, shellButtons, SHOWN_AT, SLOT, stepOf, stoneAt, STONE_H, STONE_W, tapFlag,
  whereAnswer, type DigState, type Pt, type Rect, type Round,
} from './logic';

const VIEWS = {
  landscape: computeView(1024, 768),
  portrait: computeView(768, 1024),
  phone: computeView(844, 390),
  notch: computeView(844, 390, { top: 0, right: 47, bottom: 21, left: 47 }),
};

const circle = (p: Pt, r: number): Rect => ({ x: p.x - r, y: p.y - r, w: 2 * r, h: 2 * r });
const box = (p: Pt, w: number, h = w): Rect => ({ x: p.x - w / 2, y: p.y - h / 2, w, h });
const overlap = (a: Rect, b: Rect) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
const inside = (a: Rect, v: { w: number; h: number }) => a.x >= 0 && a.y >= 0 && a.x + a.w <= v.w && a.y + a.h <= v.h;

/** Brush with the bot's path until the find shows; returns the pats used. */
function brushOut(s: DigState): number {
  let n = 0;
  for (let p = nextBrush(s.cleared, caseOf(s.round.caseId).find); p; p = nextBrush(s.cleared, caseOf(s.round.caseId).find)) {
    pat(s, p);
    n++;
    if (n > 20) break;
  }
  return n;
}

describe('leaves and features', () => {
  it('three distinct leaves, and each feature takes both values', () => {
    expect(new Set(LEAVES.map((l) => `${l.outline}/${l.margin}`)).size).toBe(3);
    expect(new Set(LEAVES.map((l) => l.outline))).toEqual(new Set(['lobed', 'unlobed']));
    expect(new Set(LEAVES.map((l) => l.margin))).toEqual(new Set(['toothed', 'smooth']));
  });
});

describe('cases', () => {
  it('two distinct references, the find among them, exactly one match, and the distractor shares the other feature', () => {
    for (const c of CASES) {
      expect(new Set(c.references).size).toBe(2);
      expect(c.references).toContain(c.find);
      const find = leafOf(c.find);
      const hits = c.references.filter((r) => matches(find, leafOf(r), c.feature));
      expect(hits).toEqual([answer(c)]);
      const other = c.feature === 'outline' ? 'margin' : 'outline';
      const distractor = c.references.find((r) => r !== answer(c))!;
      expect(leafOf(distractor)[other]).toBe(find[other]);
      expect(c.feature).toBe(planFor(c.level).feature);
    }
  });
  it('the answer is not always the same leaf at a level', () => {
    for (const p of PLANS) expect(new Set(CASES.filter((c) => c.level === p.id).map(answer)).size).toBe(2);
  });
});

describe('rounds', () => {
  for (const level of [1, 2] as const) {
    it(`level ${level}: seeded rounds are valid, repeatable and varied`, () => {
      const cases = new Set<string>(), sites = new Set<number>(), orders = new Set<string>();
      for (let seed = 1; seed <= 500; seed++) {
        const r = makeRound(level, new Rng(seed));
        expect(caseOf(r.caseId).level).toBe(level);
        expect([0, 1, 2]).toContain(r.site);
        expect([...r.order].sort()).toEqual([...caseOf(r.caseId).references].sort());
        expect(edgeCells(caseOf(r.caseId).find)).toContain(r.preCleared);
        expect(makeRound(level, new Rng(seed))).toEqual(r);
        cases.add(r.caseId); sites.add(r.site); orders.add(r.order.join());
      }
      expect(cases.size).toBe(2);
      expect(sites.size).toBe(3);
      expect(orders.size).toBe(2);
    });
  }
  it('the authored first rounds are the definition’s', () => {
    expect(authored(1)).toMatchObject({ caseId: 'L1-star', site: 1, order: ['ribbon', 'star'] });
    expect(authored(2)).toMatchObject({ caseId: 'L2-saw', site: 2 });
    expect(makeRound(1, new Rng(3), true)).toEqual(authored(1));
  });
});

describe('the dust', () => {
  it('each print holds 18–26 cells inside the grid', () => {
    for (const l of LEAVES) {
      const c = leafCells(l.id);
      expect(c.length).toBeGreaterThanOrEqual(18);
      expect(c.length).toBeLessThanOrEqual(26);
      for (const i of c) expect(i >= 0 && i < COLS * ROWS).toBe(true);
    }
  });
  it('the bot path shows every find from every pre-cleared edge cell within 12 pats', () => {
    for (const c of CASES) {
      for (const pre of edgeCells(c.find)) {
        const s = digState({ level: c.level, caseId: c.id, site: 0, order: c.references, preCleared: pre });
        const n = brushOut(s);
        expect(n).toBeLessThanOrEqual(12);
        expect(s.shown).toBe(true);
        expect(revealed(s.cleared, c.find)).toBeGreaterThanOrEqual(SHOWN_AT);
      }
    }
  });
  it('the brush spots tile the stone: twelve pats clear every cell', () => {
    const cleared = new Array(COLS * ROWS).fill(false);
    for (const s of BRUSH_SPOTS) expect(patCells(cleared, s)).toHaveLength(4);
    expect(cleared.every(Boolean)).toBe(true);
  });
  it('a pat never clears a cell beyond its reach, and more pats never hide anything', () => {
    const rng = new Rng(7);
    const cleared = new Array(COLS * ROWS).fill(false);
    let last = 0;
    for (let k = 0; k < 60; k++) {
      const at = { x: rng.range(-STONE_W / 2, STONE_W / 2), y: rng.range(-STONE_H / 2, STONE_H / 2) };
      for (const i of patCells(cleared, at)) expect(Math.hypot(cellCenter(i).x - at.x, cellCenter(i).y - at.y)).toBeLessThanOrEqual(BRUSH);
      const r = revealed(cleared, 'star');
      expect(r).toBeGreaterThanOrEqual(last);
      last = r;
    }
  });
  it('the magnifier looks at a point on each leaf’s edge, inside the stone', () => {
    for (const l of LEAVES) {
      const p = edgePoint(l.id);
      expect(Math.abs(p.x) <= STONE_W / 2 && Math.abs(p.y) <= STONE_H / 2).toBe(true);
    }
  });
});

describe('the site', () => {
  it('the Where answer is the stone’s square’s flag, and the flags differ in colour and shape', () => {
    expect(new Set(FLAGS.map((f) => f.id)).size).toBe(3);
    expect(new Set(FLAGS.map((f) => f.shape)).size).toBe(3);
    for (const site of [0, 1, 2]) expect(whereAnswer({ ...authored(1), site })).toBe(FLAGS[site].id);
  });
});

const shownState = (r: Round): DigState => {
  const s = digState(r);
  brushOut(s);
  return s;
};

describe('accounting', () => {
  it('the first level-1 round: red, blue, ribbon Check, star Check gives 2 misses and no hints', () => {
    const s = digState(authored(1));
    expect(tapFlag(s, 'blue')).toBe('early');
    expect(check(s)).toBe('early');
    expect(pickLeaf(s, 'star')).toBe('early');
    brushOut(s);
    expect(stepOf(s)).toBe('where');
    expect(pickLeaf(s, 'star')).toBe('early');
    expect(check(s)).toBe('early');
    expect(tapFlag(s, 'red')).toBe('miss');
    expect(tapFlag(s, 'blue')).toBe('right');
    expect(tapFlag(s, 'blue')).toBe('ignored');
    expect(check(s)).toBe('empty');
    expect(pickLeaf(s, 'ribbon')).toBe('placed');
    expect(pickLeaf(s, 'star')).toBe('placed');
    expect(pickLeaf(s, 'star')).toBe('returned');
    expect(returnLeaf(s)).toBe(false);
    pickLeaf(s, 'ribbon');
    expect(check(s)).toBe('miss');
    expect(s.like).toBe(null);
    pickLeaf(s, 'star');
    expect(check(s)).toBe('right');
    expect([s.misses, s.hints, s.done]).toEqual([2, 0, true]);
    expect(check(s)).toBe('ignored');
  });
  it('two wrong flags glow the right one (one hint); asking again on that step leaves it at one', () => {
    const s = shownState(authored(1));
    tapFlag(s, 'red');
    expect(glowing(s)).toBe(null);
    tapFlag(s, 'yellow');
    expect(glowing(s)).toBe('blue');
    expect(s.hints).toBe(1);
    expect(help(s)).toBe(false);
    expect(s.hints).toBe(1);
    expect(tapFlag(s, glowTarget(s.round, 'where') as 'blue')).toBe('right');
    expect(glowing(s)).toBe(null);
  });
  it('help counts once per step, never while brushing, and following the glow finishes the step', () => {
    const s = digState(authored(2));
    expect(help(s)).toBe(false);
    brushOut(s);
    expect(help(s)).toBe(true);
    expect(help(s)).toBe(false);
    tapFlag(s, glowing(s) as 'yellow');
    expect(help(s)).toBe(true);
    expect(glowing(s)).toBe('saw-star');
    pickLeaf(s, glowing(s) as 'saw-star');
    expect(check(s)).toBe('right');
    expect([s.misses, s.hints]).toEqual([0, 2]);
  });
  it('two wrong Checks glow the matching leaf once', () => {
    const s = shownState(authored(2));
    tapFlag(s, 'yellow');
    pickLeaf(s, 'star'); check(s);
    pickLeaf(s, 'star'); check(s);
    expect([s.misses, s.hints, glowing(s)]).toEqual([2, 1, 'saw-star']);
  });
});

describe('layout', () => {
  for (const [name, v] of Object.entries(VIEWS)) {
    for (const level of [1, 2]) {
      it(`fits ${name} at level ${level}: targets ≥100, clear of each other, the stone, the pet and the shell`, () => {
        const L = digLayout(v, level);
        const fixed = [petCorner(v), ...shellButtons(v)];
        const targets: [string, Rect][] = [
          ...L.flags.map((f, i): [string, Rect] => [`flag${i}`, box(f, FLAG)]),
          ...L.cards.map((c, i): [string, Rect] => [`card${i}`, box(c, CARD)]),
          ...L.badges.map((b, i): [string, Rect] => [`badge${i}`, circle(b, BADGE_R)]),
          ['where', box(L.whereSlot, SLOT)], ['like', box(L.likeSlot, SLOT)], ['check', circle(L.check, CHECK_R)],
        ];
        for (const [n, r] of targets) {
          expect(Math.min(r.w, r.h), n).toBeGreaterThanOrEqual(100);
          expect(inside(r, v), `${n} inside`).toBe(true);
          for (const f of fixed) expect(overlap(r, f), `${n} vs shell`).toBe(false);
        }
        for (let i = 0; i < targets.length; i++) {
          for (let j = i + 1; j < targets.length; j++) {
            const a = targets[i][0], b = targets[j][0];
            if (['where', 'like', 'check'].includes(a) && ['where', 'like', 'check'].includes(b)) continue;
            expect(overlap(targets[i][1], targets[j][1]), `${a} vs ${b}`).toBe(false);
          }
        }
        for (const slot of [box(L.whereSlot, SLOT), box(L.likeSlot, SLOT), circle(L.check, CHECK_R)]) {
          expect(slot.x >= L.record.x && slot.x + slot.w <= L.record.x + L.record.w).toBe(true);
        }
        expect(overlap(box(L.whereSlot, SLOT), box(L.likeSlot, SLOT))).toBe(false);
        expect(overlap(box(L.likeSlot, SLOT), circle(L.check, CHECK_R))).toBe(false);
        for (const site of [0, 1, 2]) {
          const stone = box(stoneAt(L, site), STONE_W * L.scale, STONE_H * L.scale);
          expect(Math.min(stone.w, stone.h)).toBeGreaterThanOrEqual(100);
          expect(inside(stone, v)).toBe(true);
          const sq = L.squares[site];
          expect(stone.x >= sq.x && stone.x + stone.w <= sq.x + sq.w && stone.y >= sq.y && stone.y + stone.h <= sq.y + sq.h, 'stone in its square').toBe(true);
          for (const [n, r] of targets) expect(overlap(stone, r), `stone ${site} vs ${n}`).toBe(false);
          for (const f of fixed) expect(overlap(stone, f)).toBe(false);
          const mag = circle(L.magnifier[site], MAG_R);
          expect(inside(mag, v), 'magnifier inside').toBe(true);
          expect(overlap(mag, stone), 'magnifier off the stone').toBe(false);
        }
        expect(inside(L.book, v)).toBe(true);
        for (const f of fixed) expect(overlap(L.book, f), 'notebook vs shell').toBe(false);
      });
    }
  }
});
