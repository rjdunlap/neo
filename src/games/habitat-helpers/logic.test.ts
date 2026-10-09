import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { habitatTouch, helpingPieces, makeRounds, missingNeeds, PIECES, PIECE_IDS, PLANS, solutions, visitorsFor, welcomes, type HabitatTouch, type PieceId, type Visitor } from './logic';

describe('Habitat Helpers', () => {
  it('gives every pictured piece a spoken name and at least one explicit use', () => {
    for (const id of PIECE_IDS) {
      expect(PIECES[id].name.length).toBeGreaterThan(3);
      expect(Object.values(PIECES[id].for).flat().length).toBeGreaterThan(0);
    }
  });

  it('builds the promised number of valid, solvable gardens at every level', () => {
    for (let level = 1; level <= PLANS.length; level++) {
      for (let seed = 1; seed <= 200; seed++) {
        const rounds = makeRounds(level, new Rng(seed));
        expect(rounds, `level ${level}, seed ${seed}`).toHaveLength(PLANS[level - 1].rounds);
        for (const round of rounds) {
          expect(new Set(round.offered).size).toBe(round.offered.length);
          round.offered.forEach((id) => expect(PIECE_IDS).toContain(id));
          expect(round.capacity).toBeGreaterThanOrEqual(2);
          if (PLANS[level - 1].mode === 'build') {
            expect(round.prepared).toBeUndefined();
            expect(solutions(round).length, `level ${level}, seed ${seed}`).toBeGreaterThan(0);
          } else {
            expect(round.offered).toEqual([]);
            expect(round.prepared).toHaveLength(round.capacity);
          }
        }
      }
    }
  });

  it('teaches both visitors and all three needs before asking for compact habitats', () => {
    const level2 = makeRounds(2, new Rng(4));
    expect(level2.flatMap((r) => r.visitors).sort()).toEqual(['bunny', 'duck']);
    for (const round of level2) {
      expect(round.offered).toHaveLength(3);
      expect(welcomes(round.offered, round.visitors)).toBe(true);
    }

    const bunny = level2.find((r) => r.visitors[0] === 'bunny')!;
    expect(missingNeeds(['clover'], bunny.visitors).map((m) => m.need).sort()).toEqual(['shelter', 'water']);
    expect(welcomes(['clover', 'shallow-pool', 'brush-pile'], ['bunny'])).toBe(true);
    expect(welcomes(['seed-grass', 'shallow-pool', 'tall-reeds'], ['duck'])).toBe(true);
  });

  it('makes every prediction garden invite exactly the visitor it says it does', () => {
    const seen = new Set<string>();
    for (let seed = 1; seed <= 40; seed++) {
      for (const round of makeRounds(4, new Rng(seed))) {
        const actual = visitorsFor(round.prepared!);
        expect(actual).toEqual(round.visitors);
        seen.add(actual[0]);
      }
    }
    expect([...seen].sort()).toEqual(['bunny', 'duck']);
  });

  it('requires the multipurpose pieces in the compact and shared gardens', () => {
    const level5 = makeRounds(5, new Rng(8));
    const bunny = level5.find((r) => r.visitors[0] === 'bunny')!;
    const duck = level5.find((r) => r.visitors[0] === 'duck')!;
    expect(solutions(bunny).every((s) => s.includes('berry-hedge'))).toBe(true);
    expect(solutions(duck).every((s) => s.includes('pond-reeds'))).toBe(true);

    const together = makeRounds(6, new Rng(9))[0];
    expect(solutions(together).map((s) => [...s].sort())).toEqual([['berry-hedge', 'pond-reeds', 'seed-grass'].sort()]);
  });

  it('offers help that always supplies something still missing', () => {
    for (let level = 1; level <= PLANS.length; level++) {
      for (const round of makeRounds(level, new Rng(level * 17))) {
        if (!round.offered.length) continue;
        const selected = round.offered.slice(0, Math.min(2, round.capacity));
        if (welcomes(selected, round.visitors)) continue;
        const helpers = helpingPieces(round, selected);
        expect(helpers.length).toBeGreaterThan(0);
        const before = missingNeeds(selected, round.visitors).length;
        helpers.forEach((piece) => expect(missingNeeds([...selected, piece], round.visitors).length).toBeLessThan(before));
      }
    }
  });

  it('glows only the pieces that lead to a working garden, and the multipurpose piece when two spaces are all there is', () => {
    const bunny = makeRounds(5, new Rng(3)).find((r) => r.visitors[0] === 'bunny')!;
    expect(helpingPieces(bunny, []).sort()).toEqual(['berry-hedge', 'shallow-pool']);
    // Clover fills a space but leaves no way to finish in two: the glow points back to the arrangement that works.
    expect(helpingPieces(bunny, ['clover']).sort()).toEqual(['berry-hedge', 'shallow-pool']);
    const together = makeRounds(6, new Rng(5))[0];
    expect(helpingPieces(together, []).sort()).toEqual(['berry-hedge', 'pond-reeds', 'seed-grass']);
    expect(helpingPieces(together, ['berry-hedge', 'pond-reeds'])).toEqual(['seed-grass']);
  });

  it('lets the glow finish every garden: placing what glows, within the spaces, always works', () => {
    for (let level = 1; level <= PLANS.length; level++) {
      for (let seed = 1; seed <= 60; seed++) {
        for (const round of makeRounds(level, new Rng(seed))) {
          if (!round.offered.length) continue;
          let selected: PieceId[] = [];
          for (let n = 0; n < round.capacity + 1 && !welcomes(selected, round.visitors); n++) {
            const glow = helpingPieces(round, selected);
            expect(glow.length, `level ${level}, seed ${seed}: something glows`).toBeGreaterThan(0);
            selected = [...selected, glow[0]];
          }
          expect(welcomes(selected, round.visitors), `level ${level}, seed ${seed}`).toBe(true);
          expect(selected.length).toBeLessThanOrEqual(round.capacity);
        }
      }
    }
  });

  describe('the ghost finger', () => {
    /** Play a whole round of touches against the rules, as the card's bot does. */
    function play(level: number, seed: number) {
      const out: HabitatTouch[][] = [];
      for (const round of makeRounds(level, new Rng(seed))) {
        const mode = PLANS[level - 1].mode;
        const selected: PieceId[] = mode === 'predict' ? [...round.prepared!] : [];
        let prediction: Visitor | null = null;
        const touches: HabitatTouch[] = [];
        for (let touch = habitatTouch(round, mode, selected, prediction); touch && touches.length < 12; touch = habitatTouch(round, mode, selected, prediction)) {
          touches.push(touch);
          if (touch === 'gate') break;
          if ('piece' in touch) selected.push(touch.piece);
          else prediction = touch.visitor;
        }
        out.push(touches);
        if (mode === 'predict') expect(prediction, `level ${level} seed ${seed}: the prediction is right`).toEqual(round.visitors[0]);
        else expect(welcomes(selected, round.visitors), `level ${level} seed ${seed}`).toBe(true);
        expect(touches.at(-1)).toBe('gate');
      }
      return out;
    }

    it('finishes every round at every level with a working garden or a right prediction, and opens the gate last', () => {
      for (let level = 1; level <= PLANS.length; level++) for (let seed = 1; seed <= 100; seed++) play(level, seed);
    });

    it('takes only what the garden needs, never more pieces than it has spaces, and never a distractor', () => {
      for (let level = 1; level <= PLANS.length; level++) {
        if (PLANS[level - 1].mode !== 'build') continue;
        for (let seed = 1; seed <= 50; seed++) {
          const rounds = makeRounds(level, new Rng(seed));
          play(level, seed).forEach((touches, i) => {
            const pieces = touches.flatMap((t) => (typeof t === 'object' && 'piece' in t ? [t.piece] : []));
            expect(pieces.length).toBeLessThanOrEqual(rounds[i].capacity);
            expect(new Set(pieces).size).toBe(pieces.length);
            expect(welcomes(pieces, rounds[i].visitors)).toBe(true);
            // Taking out any one piece would leave something missing, so the bot places no spare.
            pieces.forEach((_, k) => expect(welcomes(pieces.filter((__, j) => j !== k), rounds[i].visitors)).toBe(false));
          });
        }
      }
    });

    it('shows the idea of the top level: one hedge, one seed grass and one pond with reeds', () => {
      const touches = play(6, 11)[0];
      expect(touches.filter((t) => typeof t === 'object' && 'piece' in t).map((t) => (t as { piece: PieceId }).piece).sort()).toEqual(['berry-hedge', 'pond-reeds', 'seed-grass']);
    });

    it('does nothing once the round is tested or the prediction round has no answer', () => {
      expect(habitatTouch({ visitors: ['bunny'], offered: [], capacity: 2, prepared: [] }, 'predict', [], null)).toBeNull();
    });
  });
});
