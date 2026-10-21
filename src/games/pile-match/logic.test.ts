import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { computeView } from '../../engine/view';
import {
  accepted, askedKind, assign, budget, clearable, covers, free, freePieces, fullMask, HIT, hintFor, KINDS, makeBoard, pieceAt, pileLayout,
  PLANS, planFor, present, putBack, RADIUS, SLOT_H, SLOT_W, take, tray, trayPieces, trayTotal, type Board,
} from './logic';
import { SHAPES } from './shapes';

const VIEWS = {
  landscape: computeView(1024, 768),
  portrait: computeView(768, 1024),
  phone: computeView(844, 390),
  notch: computeView(844, 390, { top: 0, right: 47, bottom: 21, left: 47 }),
};

/** Random play from a fresh board, put-backs included; returns every mask it passed through. */
function wander(board: Board, t: number, rng: Rng, steps: number, asked = false): number[] {
  let mask = fullMask(board.cells.length);
  const seen = [mask];
  for (let s = 0; s < steps && mask; s++) {
    const back = trayPieces(board, mask);
    if (!asked && back.length && rng.chance(0.25)) {
      mask = putBack(board, mask, rng.pick(back))!;
    } else {
      const a = asked ? askedKind(board, mask) : undefined;
      const options = freePieces(board.cells, mask).map((i) => take(board, mask, i, t, a)).filter(accepted);
      if (!options.length) break;
      mask = rng.pick(options).mask;
    }
    seen.push(mask);
  }
  return seen;
}

/** Follow hints alone (put-backs included) and count the taps until the heap is clear. */
function followHints(board: Board, mask: number, t: number, cap?: number): number {
  let fallback = false, taps = 0;
  while (mask) {
    const h = hintFor(board, mask, t, { fallback, cap });
    if (!h) throw new Error('no hint on an uncleared heap');
    fallback = h.fallback;
    if ('back' in h) mask = putBack(board, mask, h.back)!;
    else {
      const r = take(board, mask, h.take, t);
      if (!accepted(r)) throw new Error(`hint refused: ${r.refused}`);
      mask = r.mask;
    }
    if (++taps > 200) throw new Error('hints loop');
  }
  return taps;
}

describe('Pile Match rules', () => {
  it('a piece under anything present is not free, and taking pieces never covers a free one', () => {
    const rng = new Rng(3);
    for (const shapes of Object.values(SHAPES)) for (const cells of shapes) {
      for (let k = 0; k < 40; k++) {
        const mask = rng.int(0, fullMask(cells.length));
        cells.forEach((c, i) => {
          const blocked = cells.some((d, j) => j !== i && present(mask, j) && covers(d, c));
          expect(free(cells, mask, i)).toBe(present(mask, i) && !blocked);
          if (!free(cells, mask, i)) return;
          const fewer = mask & rng.int(0, fullMask(cells.length));
          if (present(fewer, i)) expect(free(cells, fewer, i)).toBe(true);
        });
      }
    }
  });

  it('take refuses covered pieces, other kinds when asked and a full tray, and three of a kind pop', () => {
    const board = makeBoard(4, new Rng(11));
    const full = fullMask(board.cells.length);
    const covered = board.cells.findIndex((_, i) => !free(board.cells, full, i));
    expect(take(board, full, covered, 5)).toEqual({ refused: 'covered' });
    const open = freePieces(board.cells, full)[0];
    const other = (board.kinds[open] + 1) % KINDS.length;
    expect(take(board, full, open, 5, other)).toEqual({ refused: 'wrong-kind' });
    const rng = new Rng(5);
    for (let s = 0; s < 200; s++) {
      const b = makeBoard(rng.int(3, 8), rng);
      for (const mask of wander(b, 5, rng, 60)) {
        expect(trayTotal(b, mask)).toBeLessThanOrEqual(5);
        const counts = tray(b, mask);
        for (const i of freePieces(b.cells, mask)) {
          const r = take(b, mask, i, 5);
          if (counts[b.kinds[i]] === 2) expect(r).toEqual({ mask: mask & ~(1 << i), pop: b.kinds[i] });
          else if (trayTotal(b, mask) >= 5) expect(r).toEqual({ refused: 'full' });
          if (accepted(r)) expect(putBack(b, r.mask, i) ?? r.mask).toBe(r.pop === null ? mask : r.mask);
        }
      }
    }
  });

  it('the tray is what was taken, mod 3, and a popped kind cannot be put back', () => {
    const b = makeBoard(5, new Rng(8));
    let mask = fullMask(b.cells.length);
    const route = b.route;
    for (const i of route.slice(0, 3)) mask = (take(b, mask, i, 5) as { mask: number }).mask;
    expect(trayTotal(b, mask)).toBe(0);
    expect(putBack(b, mask, route[0])).toBeNull();
    mask = (take(b, mask, route[3], 5) as { mask: number }).mask;
    expect(trayPieces(b, mask)).toEqual([route[3]]);
    expect(putBack(b, mask, route[3])).toBe(mask | (1 << route[3]));
  });

  it('every frozen shape matches its plan, lies on its grid and has a clearing route', () => {
    for (const plan of PLANS) {
      const shapes = SHAPES[plan.id];
      expect(shapes.length).toBeGreaterThanOrEqual(6);
      for (const cells of shapes) {
        expect(cells.length).toBe(plan.pieces);
        expect(cells.length).toBeLessThanOrEqual(24);
        expect(new Set(cells.map((c) => c.z)).size).toBe(plan.layers);
        for (const c of cells) {
          const off = c.z % 2 ? 0.5 : 0;
          expect(Number.isInteger(c.x - off) && Number.isInteger(c.y - off)).toBe(true);
          expect(c.x >= 0 && c.x <= 4 && c.y >= 0 && c.y <= 2).toBe(true);
          // An upper piece rests on something on the layer below it.
          if (c.z > 0) expect(cells.some((d) => d.z === c.z - 1 && covers(c, d))).toBe(true);
        }
        cells.forEach((a, i) => cells.forEach((b, j) => {
          if (i < j && a.z === b.z) expect(Math.hypot(a.x - b.x, a.y - b.y)).toBeGreaterThanOrEqual(1);
        }));
      }
    }
  });

  it('every dealt board has three of each kind, distinct kinds, and clears along its route with a three-slot tray', () => {
    const rng = new Rng(21);
    for (const plan of PLANS) for (let s = 0; s < 60; s++) {
      const b = makeBoard(plan.id, rng);
      const counts = new Map<number, number>();
      b.kinds.forEach((k) => counts.set(k, (counts.get(k) ?? 0) + 1));
      expect(counts.size).toBe(plan.kinds);
      for (const n of counts.values()) expect(n).toBe(3);
      let mask = fullMask(b.cells.length);
      for (const i of b.route) {
        const r = take(b, mask, i, 3);
        expect(accepted(r)).toBe(true);
        mask = (r as { mask: number }).mask;
        expect(trayTotal(b, mask)).toBeLessThanOrEqual(2);
      }
      expect(mask).toBe(0);
    }
  });

  it('the same seed deals the same board, and level 1 asks for apples then shells', () => {
    expect(makeBoard(6, new Rng(77))).toEqual(makeBoard(6, new Rng(77)));
    for (let s = 0; s < 20; s++) {
      const b = makeBoard(1, new Rng(s));
      const full = fullMask(b.cells.length);
      expect(KINDS[askedKind(b, full)!]).toBe('apple');
      let mask = full;
      for (const i of b.route.slice(0, 3)) mask &= ~(1 << i);
      expect(KINDS[askedKind(b, mask)!]).toBe('shell');
    }
  });

  it('level 3 can never fill its tray; from level 4 a full tray is reachable', () => {
    const reach = (b: Board, t: number) => {
      const seen = new Set<number>(), stack = [fullMask(b.cells.length)];
      let full = false;
      while (stack.length) {
        const m = stack.pop()!;
        if (seen.has(m)) continue;
        seen.add(m);
        for (const i of freePieces(b.cells, m)) {
          const r = take(b, m, i, t);
          if (accepted(r)) stack.push(r.mask);
          else if (r.refused === 'full') full = true;
        }
        for (const i of trayPieces(b, m)) stack.push(putBack(b, m, i)!);
      }
      return full;
    };
    const rng = new Rng(2);
    for (let s = 0; s < 40; s++) expect(reach(makeBoard(3, rng), 5)).toBe(false);
    for (const level of [4, 5]) expect(Array.from({ length: 20 }, () => reach(makeBoard(level, rng), 5)).some(Boolean)).toBe(true);
  });

  it('in asked mode the asked kind always has a free piece', () => {
    const rng = new Rng(13);
    for (const level of [1, 2]) for (let s = 0; s < 100; s++) {
      const b = makeBoard(level, rng);
      for (const mask of wander(b, 3, rng, 20, true)) {
        if (!mask) continue;
        const a = askedKind(b, mask)!;
        expect(b.cells.some((_, i) => b.kinds[i] === a && free(b.cells, mask, i))).toBe(true);
        expect(hintFor(b, mask, 3, { asked: a })).not.toBeNull();
      }
    }
  });

  it('hints are legal, keep the heap clearable, and clear it without looping', () => {
    const rng = new Rng(31);
    for (const plan of PLANS.filter((p) => !p.asked)) for (let s = 0; s < 12; s++) {
      const b = makeBoard(plan.id, rng);
      for (const mask of wander(b, plan.tray, rng, plan.pieces * 2).filter((_, k) => k % 3 === 0)) {
        if (!mask) continue;
        const h = hintFor(b, mask, plan.tray)!;
        if ('take' in h) {
          const r = take(b, mask, h.take, plan.tray);
          expect(accepted(r)).toBe(true);
          if (!h.fallback) expect(clearable(b, (r as { mask: number }).mask, plan.tray)).toBe(true);
        } else expect(trayPieces(b, mask)).toContain(h.back);
        if (trayTotal(b, mask) === plan.tray && !freePieces(b.cells, mask).some((i) => tray(b, mask)[b.kinds[i]] === 2)) {
          expect('back' in h).toBe(true);
        }
        expect(followHints(b, mask, plan.tray)).toBeLessThanOrEqual(plan.pieces + 2 * plan.tray);
      }
    }
  });

  it('putting back the whole tray always leaves a heap that clears along the route, and the fallback alone clears every board', () => {
    const rng = new Rng(41);
    for (const plan of PLANS.filter((p) => !p.asked)) for (let s = 0; s < 12; s++) {
      const b = makeBoard(plan.id, rng);
      for (const mask of wander(b, plan.tray, rng, plan.pieces * 2)) {
        let m = mask;
        for (const i of trayPieces(b, m)) m = putBack(b, m, i)!;
        for (const i of b.route.filter((r) => present(m, r))) {
          const r = take(b, m, i, 3);
          expect(accepted(r)).toBe(true);
          m = (r as { mask: number }).mask;
        }
        expect(m).toBe(0);
      }
      for (const mask of wander(b, plan.tray, rng, plan.pieces * 2)) expect(followHints(b, mask, plan.tray, 0)).toBeLessThanOrEqual(plan.pieces + plan.tray);
    }
  });

  it('the level-8 hint search stays quick, and a capped search returns the fallback rather than nothing', () => {
    const rng = new Rng(51);
    let worst = 0;
    for (let s = 0; s < 30; s++) {
      const b = makeBoard(8, rng);
      for (const mask of wander(b, 5, rng, 40).filter((_, k) => k % 5 === 0)) {
        const t0 = performance.now();
        hintFor(b, mask, 5);
        worst = Math.max(worst, performance.now() - t0);
        if (mask) expect(followHints(b, mask, 5, 0)).toBeLessThanOrEqual(24 + 5);
      }
    }
    console.log(`Pile Match level-8 worst hint: ${worst.toFixed(1)} ms`);
    expect(worst).toBeLessThan(250);
    expect(clearable(makeBoard(8, new Rng(1)), fullMask(24), 5, budget(1))).toBeNull();
  });

  it('lays out at every view: pieces 100+ across, free hit areas apart, tray slots 104 × 120, clear of the pet', () => {
    for (const [name, v] of Object.entries(VIEWS)) for (const plan of PLANS) for (const cells of SHAPES[plan.id]) {
      const L = pileLayout(cells, plan.tray, plan.asked, v);
      expect(L.scale, name).toBe(1);
      expect(2 * RADIUS * L.scale).toBeGreaterThanOrEqual(100);
      for (const p of L.pieces) {
        expect(p.x - RADIUS >= 150 && p.x + RADIUS <= v.w - 40, `${name} level ${plan.id}`).toBe(true);
        expect(p.y - RADIUS >= 120 && p.y + RADIUS <= L.slots[0].y - 20, `${name} level ${plan.id}`).toBe(true);
      }
      const rects = [...L.slots, L.basket, ...(L.tag ? [L.tag] : [])];
      for (const r of rects) expect(r.x >= 150 && r.x + r.w <= v.w - 40 && r.y + r.h <= v.h).toBe(true);
      for (const s of L.slots) expect([s.w, s.h]).toEqual([SLOT_W, SLOT_H]);
      // Free pieces never share a hit area: two that are both free are at least 120 apart.
      const rng = new Rng(plan.id);
      const b = assign(cells, Array.from({ length: cells.length / 3 }, (_, k) => k), rng);
      for (let k = 0; k < 20; k++) {
        const mask = rng.int(0, fullMask(cells.length));
        const open = freePieces(cells, mask);
        open.forEach((i) => open.forEach((j) => {
          if (i < j) expect(Math.hypot(L.pieces[i].x - L.pieces[j].x, L.pieces[i].y - L.pieces[j].y)).toBeGreaterThanOrEqual(2 * HIT - 1e-9);
        }));
        for (const i of open) expect(pieceAt(b, mask, L, L.pieces[i].x + 30, L.pieces[i].y - 30)).toEqual({ i, free: true });
      }
    }
  });

  it('plans: preschool to school ladder names', () => {
    expect(PLANS.map((p) => p.id)).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
    expect(planFor(8).pieces).toBe(24);
    expect(SHAPES[8][0].filter((c) => c.z === 0).length).toBe(15);
  });
});
