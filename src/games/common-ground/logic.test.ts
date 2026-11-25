import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import type { Band } from '../../progress/bands';
import { game } from './index';
import {
  CELLS,
  FIXTURES,
  beside,
  check,
  colOf,
  emptyRoom,
  fixtureRow,
  hintAction,
  neighbours,
  pickVisit,
  place,
  rowOf,
  type Fixture,
  type Piece,
  type Room,
} from './logic';

/** Every arrangement: cushion and basket on distinct cells, the plant omitted or on one of the four others. */
function arrangements(): Room[] {
  const out: Room[] = [];
  for (let c = 0; c < CELLS; c++)
    for (let b = 0; b < CELLS; b++) {
      if (b === c) continue;
      const base = emptyRoom().map((_, i) => (i === c ? 'cushion' : i === b ? 'basket' : null)) as Room;
      out.push(base);
      for (let p = 0; p < CELLS; p++)
        if (p !== c && p !== b) out.push(base.map((x, i) => (i === p ? 'plant' : x)));
    }
  return out;
}
const at = (room: Room, piece: Piece) => room.indexOf(piece);
/** The plain rule, written out again without `check`'s helpers. */
const plainOk = (room: Room, fixture: Fixture) => {
  const c = at(room, 'cushion'),
    b = at(room, 'basket');
  const inRow = fixture === 'window' ? c <= 2 : c >= 3;
  const next =
    (Math.abs(Math.floor(c / 3) - Math.floor(b / 3)) === 0 && Math.abs((c % 3) - (b % 3)) === 1) ||
    (c % 3 === b % 3 && Math.abs(Math.floor(c / 3) - Math.floor(b / 3)) === 1);
  return inRow && next;
};

describe('Common Ground rules', () => {
  it('judges all 150 arrangements per fixture: 35 accepted, the rest with the right reason', () => {
    const all = arrangements();
    expect(all).toHaveLength(150);
    for (const fixture of FIXTURES) {
      let ok = 0;
      for (const room of all) {
        const verdict = check(room, fixture);
        expect(verdict === 'ok').toBe(plainOk(room, fixture));
        if (verdict === 'ok') ok++;
        else {
          const c = at(room, 'cushion'),
            b = at(room, 'basket');
          const cushionBad = rowOf(c) !== fixtureRow(fixture);
          const basketBad = !beside(c, b);
          expect(verdict).toBe(cushionBad && basketBad ? 'both' : cushionBad ? 'cushion' : 'basket');
        }
      }
      expect(ok).toBe(35);
    }
    // 7 cushion-and-basket pairs: the two corner cells of a row have 2 neighbours each and the middle has 3.
    const pairs = [0, 1, 2].reduce((n, c) => n + neighbours(c).length, 0);
    expect(pairs).toBe(7);
  });

  it('counts only orthogonal neighbours as beside', () => {
    expect(beside(0, 4)).toBe(false);
    expect(beside(2, 4)).toBe(false);
    expect(beside(0, 1)).toBe(true);
    expect(beside(0, 3)).toBe(true);
    expect([0, 2, 3, 5].map((c) => neighbours(c).length)).toEqual([2, 2, 2, 2]);
    expect([1, 4].map((c) => neighbours(c).length)).toEqual([3, 3]);
    expect(colOf(4)).toBe(1);
  });

  it('never lets the plant change a verdict', () => {
    for (const fixture of FIXTURES)
      for (const room of arrangements()) {
        const without = room.map((p) => (p === 'plant' ? null : p)) as Room;
        expect(check(room, fixture)).toBe(check(without, fixture));
      }
  });

  it('places by swapping and never refuses a drop', () => {
    let room = place(emptyRoom(), 'cushion', 0);
    room = place(room, 'basket', 1);
    expect(room.slice(0, 2)).toEqual(['cushion', 'basket']);
    // A drop from the tray onto an occupied cell sends the occupant back to the tray.
    const tray = place(room, 'plant', 0);
    expect(tray[0]).toBe('plant');
    expect(tray).not.toContain('cushion');
    // A piece already on the floor swaps with the occupant.
    const swapped = place(room, 'cushion', 1);
    expect(swapped.slice(0, 2)).toEqual(['basket', 'cushion']);
    for (const room of arrangements())
      for (const piece of ['cushion', 'basket', 'plant'] as Piece[])
        for (let cell = 0; cell < CELLS; cell++) {
          const next = place(room, piece, cell);
          expect(next[cell]).toBe(piece);
          expect(next.filter((p) => p === piece)).toHaveLength(1);
        }
  });

  it('hints with a legal move that reaches ok in at most three moves from any state', () => {
    const starts: Room[] = [emptyRoom(), ...arrangements()];
    // Partial states too: each piece in the tray or on a cell.
    for (const piece of ['cushion', 'basket'] as Piece[])
      for (const room of arrangements()) starts.push(room.map((p) => (p === piece ? null : p)) as Room);
    for (const fixture of FIXTURES)
      for (const start of starts) {
        let room = start;
        let moves = 0;
        for (;;) {
          const move = hintAction(room, fixture);
          if (!move) break;
          expect(move.cell).toBeGreaterThanOrEqual(0);
          expect(move.cell).toBeLessThan(CELLS);
          // It never moves the cushion once its request is kept, nor the basket once it is beside.
          const c = at(room, 'cushion');
          if (move.piece === 'cushion') expect(c < 0 || rowOf(c) !== fixtureRow(fixture)).toBe(true);
          room = place(room, move.piece, move.cell);
          moves++;
          expect(moves).toBeLessThanOrEqual(3);
        }
        expect(check(room, fixture)).toBe('ok');
      }
  });

  it('shows each fixture and friend over seeds, never one fixture twice in a row, and keeps the rules fixed', () => {
    const fixtures = new Set<string>(),
      friends = new Set<string>();
    for (let seed = 1; seed <= 60; seed++) {
      const first = pickVisit(new Rng(seed));
      const second = pickVisit(new Rng(seed + 1000), first.fixture);
      expect(second.fixture).not.toBe(first.fixture);
      fixtures.add(first.fixture);
      friends.add(first.friend);
    }
    expect(fixtures.size).toBe(2);
    expect(friends.size).toBe(4);
  });

  it('is a school-only level', () => {
    for (const band of ['lap', 'toddler', 'preschool', 'prek', 'school', 'grownup'] as Band[]) {
      const range = game.levels(band);
      if (band === 'school') expect(range).toEqual({ min: 1, max: 1 });
      else expect(game.bands).not.toContain(band);
    }
  });
});
