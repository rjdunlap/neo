import { describe, expect, it } from 'vitest';
import {
  CAMP,
  TOUCHING_BOARD,
  at,
  checkCounts,
  choices,
  countError,
  hintFor,
  judge,
  packWhy,
  pairTrees,
  touchingPairs,
  treeSides,
  type Camp,
} from './logic';

describe('Campsite rules', () => {
  it('the authored camp has exactly one answer among the 286 ways to pitch three tents', () => {
    const all = choices(CAMP);
    expect(all).toHaveLength(286);
    const solved = all.filter((tents) => judge(CAMP, tents).kind === 'solved');
    expect(solved).toEqual([[at(1, 2), at(1, 4), at(3, 3)]]);
  });

  it('the scripted wrong board meets the counts and pairs every tree, but two tents touch', () => {
    expect(countError(CAMP, TOUCHING_BOARD)).toBeNull();
    expect(pairTrees(CAMP, TOUCHING_BOARD).ok).toBe(true);
    expect(judge(CAMP, TOUCHING_BOARD)).toEqual({ kind: 'touch', pair: [at(1, 2), at(1, 3)] });
  });

  it('tents meeting only at a corner touch', () => {
    expect(touchingPairs([at(1, 2), at(2, 1)])).toEqual([[at(1, 2), at(2, 1)]]);
    expect(touchingPairs([at(1, 2), at(3, 3)])).toEqual([]);
    // R3C3 and R4C4 meet only at a corner, and touching is judged before the counts.
    expect(judge(CAMP, [at(1, 4), at(3, 3), at(4, 4)])).toEqual({
      kind: 'touch',
      pair: [at(3, 3), at(4, 4)],
    });
  });

  it('a wrong count is named by its row first, then its column', () => {
    // Apart and paired, but row 3 gets two tents and row 1 only one.
    expect(judge(CAMP, [at(1, 2), at(3, 3), at(3, 1)])).toEqual({ kind: 'count', axis: 'row', line: 0 });
    // Rows right, columns wrong: R1C2, R1C4 and R3C2 (column 2 has two).
    expect(countError(CAMP, [at(1, 2), at(1, 4), at(3, 1)])).toEqual({ axis: 'col', line: 0 });
  });

  it('two trees competing for one tent are both named', () => {
    // A camp where two trees share one square between them and the third tent stands by neither.
    const camp: Camp = { trees: [at(1, 1), at(1, 3)], rows: [1, 0, 0, 1], cols: [0, 1, 0, 1], solution: [] };
    expect(judge(camp, [at(1, 2), at(4, 4)])).toEqual({ kind: 'pairing', trees: [at(1, 1), at(1, 3)] });
    expect(pairTrees(camp, [at(1, 2), at(4, 4)])).toEqual({ ok: false, trees: [at(1, 1), at(1, 3)] });
  });

  it('a tree with no tent beside it is named alone', () => {
    expect(pairTrees(CAMP, [at(1, 2), at(3, 3), at(4, 1)])).toEqual({ ok: false, trees: [at(2, 4)] });
  });

  it('a tent beside two trees serves one of them, whatever order the tents went up', () => {
    const camp: Camp = { trees: [at(1, 1), at(1, 3)], rows: [1, 1, 0, 0], cols: [0, 1, 1, 0], solution: [] };
    for (const tents of [
      [at(1, 2), at(2, 3)],
      [at(2, 3), at(1, 2)],
    ]) {
      const p = pairTrees(camp, tents);
      expect(p.ok).toBe(true);
      if (p.ok) {
        expect(p.tentOf.get(at(1, 3))).toBe(at(2, 3));
        expect(p.tentOf.get(at(1, 1))).toBe(at(1, 2));
      }
    }
    // In the authored camp the middle tree has three grass sides (row 2's zero rules out R2C2); R1C3 sits beside two trees.
    expect(treeSides(CAMP, at(2, 3))).toEqual([at(1, 3), at(2, 2), at(3, 3)]);
    expect(treeSides(CAMP, at(1, 1))).toEqual([at(1, 2), at(2, 1)]);
  });
});

describe('Campsite help', () => {
  it('follows the authored deductions in order, naming the count or tree each leans on', () => {
    const tents: number[] = [];
    const seen = [];
    for (let i = 0; i < 3; i++) {
      const h = hintFor(CAMP, tents);
      expect(h?.kind).toBe('pitch');
      if (h?.kind !== 'pitch') break;
      seen.push([h.step, h.cell, h.also]);
      tents.push(h.cell);
    }
    expect(seen).toEqual([
      ['first', at(1, 2), { tree: at(1, 1), row: 1 }],
      ['second', at(3, 3), { tree: at(2, 3) }],
      ['third', at(1, 4), { tree: at(2, 4), row: 2 }],
    ]);
    expect(judge(CAMP, tents).kind).toBe('solved');
    expect(hintFor(CAMP, tents)).toBeNull();
  });

  it('packs up the first misplaced tent in row order before anything else', () => {
    expect(hintFor(CAMP, TOUCHING_BOARD)).toEqual({ kind: 'pack', cell: at(1, 3) });
    expect(hintFor(CAMP, [at(3, 4), at(1, 2)])).toEqual({ kind: 'pack', cell: at(3, 4) });
    // After packing it up the hint goes on to the next deduction.
    expect(
      hintFor(
        CAMP,
        [at(1, 2), at(3, 4)].filter((t) => t !== at(3, 4)),
      ),
    ).toMatchObject({
      kind: 'pitch',
      cell: at(3, 3),
    });
  });

  it('following hints from any start reaches the answer', () => {
    for (const start of choices(CAMP)) {
      const tents = [...start];
      for (let guard = 0; guard < 10; guard++) {
        const h = hintFor(CAMP, tents);
        if (!h) break;
        if (h.kind === 'pack') tents.splice(tents.indexOf(h.cell), 1);
        else tents.push(h.cell);
      }
      expect(judge(CAMP, tents).kind).toBe('solved');
    }
  });
});

describe('Campsite misses', () => {
  it('part-full and repeated checks are free; each new full wrong board counts once; the answer is never a miss', () => {
    const checked = new Set<string>();
    expect(checkCounts(checked, CAMP, [at(1, 2)])).toBe(false);
    expect(checkCounts(checked, CAMP, TOUCHING_BOARD)).toBe(true);
    expect(checkCounts(checked, CAMP, [...TOUCHING_BOARD].reverse())).toBe(false);
    const other = [at(1, 2), at(3, 3), at(4, 1)];
    expect(checkCounts(checked, CAMP, other)).toBe(true);
    // Back to the first wrong board: still remembered for the round.
    expect(checkCounts(checked, CAMP, TOUCHING_BOARD)).toBe(false);
    expect(checkCounts(checked, CAMP, CAMP.solution)).toBe(false);
    expect(checked.size).toBe(2);
  });
});

describe('Campsite pack-up reasons', () => {
  it('name the zero sign first, then a tent with no tree, then a tent in another tree’s way', () => {
    expect(packWhy(CAMP, at(2, 2))).toBe('zero-row');
    expect(packWhy(CAMP, at(4, 1))).toBe('zero-row');
    expect(packWhy(CAMP, at(3, 1))).toBe('zero-col');
    expect(packWhy(CAMP, at(3, 2))).toBe('no-tree');
    expect(packWhy(CAMP, at(1, 3))).toBe('in-the-way');
    expect(packWhy(CAMP, at(3, 4))).toBe('in-the-way');
  });
});
