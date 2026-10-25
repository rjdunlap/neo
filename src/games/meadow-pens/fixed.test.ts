import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { computeView } from '../../engine/view';
import {
  BENT_FIELDS, COMPARISONS, COLS, ROWS, bentParts, cellAt, cellOf, cellRect, centre, connected,
  correctChoice, fenceEdges, fixedTasks, materialCount, meadowLayout, neighbours, rectangleCells,
  rowsOf, targets, xOf, yOf, type Cell, type Choice, type CompareTask, type Rect,
} from './logic';

const SEEDS = 200;
const permutations: Choice[][] = [
  ['a', 'b', 'same'], ['a', 'same', 'b'], ['b', 'a', 'same'],
  ['b', 'same', 'a'], ['same', 'a', 'b'], ['same', 'b', 'a'],
];
const set = (cells: readonly Cell[]) => new Set(cells);
const ordered = (cells: readonly Cell[]) => [...cells].sort((a, b) => a - b);
const rectangle = (cells: readonly Cell[]) => {
  const xs = cells.map(xOf), ys = cells.map(yOf);
  return (Math.max(...xs) - Math.min(...xs) + 1) * (Math.max(...ys) - Math.min(...ys) + 1) === cells.length;
};
const apart = (a: Rect, b: Rect, gap = 0) => a.x + a.w + gap <= b.x || b.x + b.w + gap <= a.x || a.y + a.h + gap <= b.y || b.y + b.h + gap <= a.y;

/** Independent boundary oracle: count exposed cardinal neighbours, including outside the model. */
function exposed(cells: readonly Cell[]): number {
  const occupied = set(cells);
  return cells.reduce((n, c) => n + 4 - neighbours(c).filter((p) => occupied.has(p)).length, 0);
}

describe('Meadow Pens comparison table', () => {
  it('keeps exact authored grass/fence counts and a full empty row between pens', () => {
    const counts = [
      [6, 6, 14, 10], [6, 8, 14, 12], [5, 8, 12, 12], [4, 4, 10, 8], [5, 6, 12, 10],
    ];
    COMPARISONS.forEach((f, i) => {
      const a = rectangleCells(f.a[0], f.a[1]), b = rectangleCells(f.b[0], f.b[1], 0, 2);
      expect([a.length, b.length, exposed(a), exposed(b)]).toEqual(counts[i]);
      expect(materialCount(a, 'grass')).toBe(counts[i][0]);
      expect(materialCount(b, 'grass')).toBe(counts[i][1]);
      expect(materialCount(a, 'fence')).toBe(counts[i][2]);
      expect(materialCount(b, 'fence')).toBe(counts[i][3]);
      expect(a.every((c) => yOf(c) === 0)).toBe(true);
      expect(b.every((c) => yOf(c) >= 2)).toBe(true);
      expect([...a, ...b].every((c) => c >= 0 && c < COLS * ROWS)).toBe(true);
      expect(new Set([...a, ...b]).size).toBe(a.length + b.length);
    });
  });

  it('has exactly one accepted card for every family/material, badge order and card permutation', () => {
    const expected: Choice[][] = [['same', 'a'], ['b', 'a'], ['b', 'same'], ['same', 'a'], ['b', 'a']];
    COMPARISONS.forEach((f, i) => {
      for (const material of ['grass', 'fence'] as const) {
        for (const badges of [['daisy', 'tulip'], ['tulip', 'daisy']] as const) {
          for (const cards of permutations) {
            const task: CompareTask = { kind: 'compare', id: f.id, material, badges: [...badges], cards, parts: [rectangleCells(f.a[0], f.a[1]), rectangleCells(f.b[0], f.b[1], 0, 2)] };
            expect(correctChoice(task)).toBe(expected[i][material === 'grass' ? 0 : 1]);
            expect(cards.filter((c) => c === correctChoice(task))).toHaveLength(1);
            // Reflecting both pens across the model leaves the material comparison unchanged.
            const reflected: CompareTask = { ...task, parts: task.parts.map((p) => p.map((c) => cellOf(COLS - 1 - xOf(c), yOf(c)))) as [Cell[], Cell[]] };
            expect(correctChoice(reflected)).toBe(correctChoice(task));
          }
        }
      }
    });
  });

  it('authors both C1 questions, both C3 questions, then opposing C2 grass', () => {
    for (let seed = 1; seed <= 20; seed++) {
      const tasks = fixedTasks(4, new Rng(seed));
      expect(tasks.map((t) => t.id)).toEqual(['C1', 'C1', 'C3', 'C3', 'C2']);
      expect(tasks.map((t) => t.kind === 'compare' && t.material)).toEqual(['grass', 'fence', 'grass', 'fence', 'grass']);
      expect(tasks.map(correctChoice)).toEqual(['same', 'a', 'b', 'same', 'b']);
    }
  });

  it('seeds reproducible five-question schedules, preserving the pair and response positions between its questions', () => {
    const seen = new Set<string>();
    const startMaterials = new Set<string>();
    const badgeOrders = new Set<string>();
    const cardOrders = new Set<string>();
    for (let seed = 1; seed <= SEEDS; seed++) {
      const tasks = fixedTasks(4, new Rng(seed), false) as CompareTask[];
      expect(tasks).toEqual(fixedTasks(4, new Rng(seed), false));
      expect(tasks).toHaveLength(5);
      expect(['C1', 'C4']).toContain(tasks[0].id);
      expect(tasks[1].id).toBe(tasks[0].id);
      expect(tasks[2].id).toBe('C3');
      expect(tasks[3].id).toBe('C3');
      expect(['C2', 'C5']).toContain(tasks[4].id);
      for (const [a, b] of [[0, 1], [2, 3]]) {
        expect(tasks[a].parts).toEqual(tasks[b].parts);
        expect(tasks[a].badges).toEqual(tasks[b].badges);
        expect(tasks[a].cards).toEqual(tasks[b].cards);
      }
      for (let i = 0; i < tasks.length; i++) {
        const t = tasks[i];
        if (i) expect(t.material).not.toBe(tasks[i - 1].material);
        expect(t.cards.filter((c) => c === correctChoice(t))).toHaveLength(1);
        seen.add(t.id);
        badgeOrders.add(t.badges.join(','));
        cardOrders.add(t.cards.join(','));
      }
      expect(tasks.filter((t) => t.material === 'grass' && correctChoice(t) === 'same')).toHaveLength(1);
      expect(tasks.filter((t) => t.material === 'fence' && correctChoice(t) === 'same')).toHaveLength(1);
      startMaterials.add(tasks[0].material);
    }
    expect(seen.size).toBe(5);
    expect(startMaterials.size).toBe(2);
    expect(badgeOrders.size).toBe(2);
    expect(cardOrders.size).toBe(6);
  });
});

describe('Meadow Pens two-part fields', () => {
  it('constructs the exact L once from either disjoint rectangular split, including reflection and the one-cell part', () => {
    const expectedParts = [[6, 2], [8, 2], [9, 1], [8, 4], [10, 3], [12, 6]];
    const expectedFence = [12, 14, 14, 16, 16, 20];
    BENT_FIELDS.forEach((f, i) => {
      expect(bentParts(f).map((p) => p.length)).toEqual(expectedParts[i]);
      for (const mirror of [false, true]) {
        const ox = Math.floor((COLS - f.w) / 2), oy = Math.floor((ROWS - f.h) / 2);
        const expected: Cell[] = [];
        for (let y = 0; y < f.h; y++) for (let x = 0; x < f.w; x++) {
          if (x >= f.w - f.cutW && y < f.cutH) continue;
          expected.push(cellOf(ox + (mirror ? f.w - 1 - x : x), oy + y));
        }
        for (const split of ['vertical', 'horizontal'] as const) {
          const parts = bentParts(f, mirror, split), all = parts.flat();
          expect(ordered(all)).toEqual(ordered(expected));
          expect(set(all).size).toBe(all.length);
          expect(all.length).toBe(f.w * f.h - f.cutW * f.cutH);
          expect(all.every((c) => c >= 0 && c < COLS * ROWS)).toBe(true);
          for (const part of parts) {
            expect(connected(part)).toBe(true);
            expect(rectangle(part)).toBe(true);
            for (const tall of [false, true]) {
              const rows = rowsOf(part, tall);
              expect(rows.flat()).toHaveLength(part.length);
              expect(set(rows.flat())).toEqual(set(part));
              expect(rows.every((r) => r.length === rows[0].length)).toBe(true);
              expect(rows.every((r) => r.every((c) => (tall ? xOf(c) : yOf(c)) === (tall ? xOf(r[0]) : yOf(r[0]))))).toBe(true);
            }
          }
          expect(connected(all)).toBe(true);
          const edges = fenceEdges(set(all));
          expect(edges).toHaveLength(expectedFence[i]);
          expect(edges.length).toBe(exposed(all));
          // A shared seam is counted in each separate rectangle but never in the whole L's fence.
          expect(parts.reduce((n, p) => n + exposed(p), 0)).toBeGreaterThan(edges.length);
          expect(new Set([all.length, edges.length, f.third]).size).toBe(3);
        }
      }
    });
  });

  it('authors L1 and seeds five distinct cases, with one correct number and valid distractors', () => {
    const seen = new Set<string>();
    for (let seed = 1; seed <= SEEDS; seed++) {
      for (const authored of [false, true]) {
        const tasks = fixedTasks(5, new Rng(seed), authored);
        expect(tasks).toEqual(fixedTasks(5, new Rng(seed), authored));
        expect(tasks).toHaveLength(5);
        expect(new Set(tasks.map((t) => t.id)).size).toBe(5);
        if (authored) {
          expect(tasks[0].id).toBe('L1');
          expect(tasks[0].cards).toEqual([8, 12, 9]);
          expect(tasks[0].parts).toEqual(bentParts(BENT_FIELDS[0]));
        }
        for (const t of tasks) {
          expect(t.kind).toBe('parts');
          if (t.kind !== 'parts') throw new Error('Expected a two-part field');
          expect(new Set(t.cards).size).toBe(3);
          expect(t.cards.every((v) => typeof v === 'number' && v > 0)).toBe(true);
          expect(t.cards.filter((v) => v === correctChoice(t))).toHaveLength(1);
          expect(correctChoice(t)).toBe(set(t.parts.flat()).size);
          expect(t.cards).toContain(exposed(t.parts.flat()));
          seen.add(t.id);
        }
      }
    }
    expect(seen.size).toBe(6);
  });
});

describe('Meadow Pens fixed-field layouts', () => {
  const views = [
    computeView(1024, 768), computeView(768, 1024), computeView(844, 390),
    computeView(844, 390, { top: 0, right: 47, bottom: 21, left: 47 }),
    computeView(820, 1180),
  ];
  it('keeps the actual logical orientation branches and full-size answer/count targets clear', () => {
    const orientations = new Set<boolean>();
    for (const level of [4, 5]) for (const view of views) {
      const l = meadowLayout(view, level);
      expect(l).not.toBeNull();
      if (!l) continue;
      orientations.add(l.tall);
      expect(l.tall).toBe(view.h > view.w && view.h >= 1150);
      expect(l.stack).toBeNull();
      expect(l.fixed).toBe(true);
      expect(l.cards).toHaveLength(3);
      expect(targets(l)).not.toContain(l.bell);
      for (let i = 0; i < 3; i++) {
        const card = l.cards![i];
        expect(card.w).toBeGreaterThanOrEqual(130);
        expect(card.h).toBeGreaterThanOrEqual(130);
        expect(card.x).toBeGreaterThanOrEqual(0);
        expect(card.y).toBeGreaterThanOrEqual(0);
        expect(card.x + card.w).toBeLessThanOrEqual(view.w);
        expect(card.y + card.h).toBeLessThanOrEqual(view.h);
        for (let j = i + 1; j < 3; j++) expect(apart(card, l.cards![j], 30)).toBe(true);
      }
      // Check each field, not only the authored L1: L3's small part is exactly one full cell.
      const tasks = level === 4
        ? COMPARISONS.map((f) => ({ parts: [rectangleCells(f.a[0], f.a[1]), rectangleCells(f.b[0], f.b[1], 0, 2)] }))
        : BENT_FIELDS.flatMap((f) => [false, true].map((mirror) => ({ parts: bentParts(f, mirror) })));
      for (const t of tasks) for (const part of t.parts) {
        expect(part.length).toBeGreaterThan(0);
        for (const c of part) {
          const r = cellRect(l, c), p = centre(r);
          expect(r.w).toBeGreaterThanOrEqual(100);
          expect(r.h).toBeGreaterThanOrEqual(100);
          expect(cellAt(l, p.x, p.y)).toBe(c);
          expect(r.x).toBeGreaterThanOrEqual(0);
          expect(r.y).toBeGreaterThanOrEqual(0);
          expect(r.x + r.w).toBeLessThanOrEqual(view.w);
          expect(r.y + r.h).toBeLessThanOrEqual(view.h);
          for (const card of l.cards!) expect(apart(r, card, 30)).toBe(true);
        }
      }
    }
    expect(orientations).toEqual(new Set([false, true]));
  });
});
