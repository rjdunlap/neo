import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import {
  allArrangements,
  makeShoreRounds,
  shoreAccepted,
  shoreHint,
  shoreSolutions,
  shoreTouch,
  type Arrangement,
  type Place,
  type ShoreRound,
} from './logic';
import {
  afterChange,
  CHANGES,
  EQUIVALENTS,
  habitatTouch,
  helpingPieces,
  lostNeed,
  makeRounds,
  missingNeeds,
  NEEDS,
  PIECES,
  PIECE_IDS,
  PLANS,
  PREDICTION_GARDENS,
  restores,
  solutions,
  visitorsFor,
  welcomes,
  type HabitatTouch,
  type Need,
  type PieceId,
  type Visitor,
} from './logic';

/** Levels 1–7 build gardens; the shore levels above them have their own rounds and tests. */
const GARDEN_LEVELS = PLANS.findIndex((p) => p.mode === 'shore');

describe('Habitat Helpers', () => {
  it('gives every pictured piece a spoken name and at least one explicit use', () => {
    for (const id of PIECE_IDS) {
      expect(PIECES[id].name.length).toBeGreaterThan(3);
      expect(Object.values(PIECES[id].for).flat().length).toBeGreaterThan(0);
    }
  });

  it('gives each new equivalent piece exactly one use, the same as its older partner', () => {
    for (const id of ['dandelions', 'log-burrow', 'pond-weed', 'reed-island'] as PieceId[])
      expect(Object.values(PIECES[id].for).flat()).toHaveLength(1);
    for (const visitor of ['bunny', 'duck'] as Visitor[]) {
      for (const [need, pair] of Object.entries(EQUIVALENTS[visitor])) {
        for (const id of pair) expect(PIECES[id].for, `${id}`).toEqual({ [visitor]: [need] });
      }
    }
  });

  it('offers exactly one working set at levels 1–3, one of each equivalent pair, and uses every new piece', () => {
    const seen = new Set<PieceId>();
    for (let level = 1; level <= 3; level++) {
      for (let seed = 1; seed <= 200; seed++) {
        for (const round of makeRounds(level, new Rng(seed))) {
          expect(round.offered).toHaveLength(level === 3 ? 5 : 3);
          expect(solutions(round), `level ${level}, seed ${seed}`).toHaveLength(1);
          for (const visitor of ['bunny', 'duck'] as Visitor[]) {
            for (const pair of Object.values(EQUIVALENTS[visitor]))
              expect(pair.filter((id) => round.offered.includes(id)).length).toBeLessThanOrEqual(1);
          }
          round.offered.forEach((id) => seen.add(id));
        }
      }
    }
    for (const id of ['dandelions', 'log-burrow', 'pond-weed', 'reed-island'] as PieceId[])
      expect(seen.has(id), id).toBe(true);
  });

  it('pools every two-piece garden that welcomes exactly one visitor, and level 4 never repeats one in a play', () => {
    const singles: string[] = [];
    PIECE_IDS.forEach((a, i) =>
      PIECE_IDS.slice(i + 1).forEach((b) => {
        const who = visitorsFor([a, b]);
        if (who.length === 1) singles.push(`${who[0]}:${[a, b].sort().join('+')}`);
      }),
    );
    const pooled = (['bunny', 'duck'] as Visitor[]).flatMap((v) =>
      PREDICTION_GARDENS[v].map((g) => `${v}:${[...g].sort().join('+')}`),
    );
    expect(pooled.sort()).toEqual(singles.sort());

    const used = new Set<string>();
    for (let seed = 1; seed <= 200; seed++) {
      const keys = makeRounds(4, new Rng(seed)).map((r) => [...r.prepared!].sort().join('+'));
      expect(new Set(keys).size, `seed ${seed}`).toBe(3);
      keys.forEach((k) => used.add(k));
    }
    expect(used.size).toBe(pooled.length);
  });

  it('builds the promised number of valid, solvable gardens at every level', () => {
    for (let level = 1; level <= GARDEN_LEVELS; level++) {
      for (let seed = 1; seed <= 200; seed++) {
        const rounds = makeRounds(level, new Rng(seed));
        expect(rounds, `level ${level}, seed ${seed}`).toHaveLength(PLANS[level - 1].rounds);
        for (const round of rounds) {
          expect(new Set(round.offered).size).toBe(round.offered.length);
          round.offered.forEach((id) => expect(PIECE_IDS).toContain(id));
          if (PLANS[level - 1].mode === 'change') {
            // One empty space beside the three-piece garden, and a two-card repair tray.
            expect(round.capacity).toBe(1);
            expect(round.offered).toHaveLength(2);
            expect([...round.prepared!].sort()).toEqual([...round.change!.garden].sort());
            continue;
          }
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
    expect(
      missingNeeds(['clover'], bunny.visitors)
        .map((m) => m.need)
        .sort(),
    ).toEqual(['shelter', 'water']);
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
    expect(solutions(together).map((s) => [...s].sort())).toEqual([
      ['berry-hedge', 'pond-reeds', 'seed-grass'].sort(),
    ]);
  });

  it('offers help that always supplies something still missing', () => {
    for (let level = 1; level <= GARDEN_LEVELS; level++) {
      for (const round of makeRounds(level, new Rng(level * 17))) {
        if (!round.offered.length || round.change) continue;
        const selected = round.offered.slice(0, Math.min(2, round.capacity));
        if (welcomes(selected, round.visitors)) continue;
        const helpers = helpingPieces(round, selected);
        expect(helpers.length).toBeGreaterThan(0);
        const before = missingNeeds(selected, round.visitors).length;
        helpers.forEach((piece) =>
          expect(missingNeeds([...selected, piece], round.visitors).length).toBeLessThan(before),
        );
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
    for (let level = 1; level <= GARDEN_LEVELS; level++) {
      for (let seed = 1; seed <= 60; seed++) {
        for (const round of makeRounds(level, new Rng(seed))) {
          if (!round.offered.length || round.change) continue;
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

  describe('level 7, something changed', () => {
    it('every change case works before the change, loses exactly one need after it, and names that need', () => {
      for (const c of CHANGES) {
        expect(welcomes([...c.garden], [c.visitor]), c.id).toBe(true);
        expect(c.garden).toContain(c.changed);
        const missing = missingNeeds(afterChange(c), [c.visitor]);
        expect(missing, c.id).toHaveLength(1);
        expect(lostNeed(c)).toBe(missing[0].need);
        expect(NEEDS).toContain(lostNeed(c));
      }
    });

    it('offers exactly one repair card that restores the need, and one that meets no missing need', () => {
      for (const c of CHANGES) {
        expect(
          c.repairs.filter((piece) => restores(c, piece)),
          c.id,
        ).toHaveLength(1);
        const other = c.repairs.find((piece) => !restores(c, piece))!;
        expect(
          missingNeeds(afterChange(c), [c.visitor]).some((m) =>
            PIECES[other].for[m.visitor]?.includes(m.need),
          ),
          `${c.id}: ${other}`,
        ).toBe(false);
        // Neither card is already in the garden, so the tray never shows a copy of a garden piece.
        c.repairs.forEach((piece) => expect(c.garden).not.toContain(piece));
      }
    });

    it('covers every need and both visitors across the four cases', () => {
      expect(new Set(CHANGES.map(lostNeed))).toEqual(new Set(NEEDS));
      expect(new Set(CHANGES.map((c) => c.visitor))).toEqual(new Set(['bunny', 'duck']));
      expect(new Set(CHANGES.map((c) => c.id)).size).toBe(4);
    });

    it('opens every play with the dried pool and draws a different second change, using every case over the seeds', () => {
      const seconds = new Set<string>();
      for (let seed = 1; seed <= 200; seed++) {
        const [a, b] = makeRounds(7, new Rng(seed));
        expect(a.change!.id).toBe('pool-dried');
        expect(b.change!.id).not.toBe('pool-dried');
        expect(b.visitors).toEqual([b.change!.visitor]);
        seconds.add(b.change!.id);
      }
      expect(seconds.size).toBe(3);
    });

    it('lets the bot take out a card that does not restore before placing the one that does', () => {
      const round = makeRounds(7, new Rng(2))[0];
      const wrong = round.offered.find((piece) => !restores(round.change!, piece))!;
      expect(habitatTouch(round, 'change', [wrong], null, true)).toEqual({ piece: wrong });
      expect(habitatTouch(round, 'change', [], null, false)).toEqual({ need: 'water' });
    });
  });

  describe('the ghost finger', () => {
    /** Play a whole round of touches against the rules, as the card's bot does. */
    function play(level: number, seed: number) {
      const out: HabitatTouch[][] = [];
      for (const round of makeRounds(level, new Rng(seed))) {
        const mode = PLANS[level - 1].mode;
        const selected: PieceId[] = mode === 'predict' ? [...round.prepared!] : [];
        let prediction: Visitor | null = null;
        let need: Need | null = null;
        const touches: HabitatTouch[] = [];
        for (
          let touch = habitatTouch(round, mode, selected, prediction, !!need);
          touch && touches.length < 12;
          touch = habitatTouch(round, mode, selected, prediction, !!need)
        ) {
          touches.push(touch);
          if (touch === 'gate') break;
          if ('piece' in touch) selected.push(touch.piece);
          else if ('need' in touch) need = touch.need;
          else prediction = touch.visitor;
        }
        out.push(touches);
        if (mode === 'predict')
          expect(prediction, `level ${level} seed ${seed}: the prediction is right`).toEqual(
            round.visitors[0],
          );
        else if (mode === 'change') {
          expect(need, `level ${level} seed ${seed}: the need named is the lost one`).toBe(
            lostNeed(round.change!),
          );
          expect(
            welcomes([...afterChange(round.change!), ...selected], round.visitors),
            `level ${level} seed ${seed}`,
          ).toBe(true);
        } else expect(welcomes(selected, round.visitors), `level ${level} seed ${seed}`).toBe(true);
        expect(touches.at(-1)).toBe('gate');
      }
      return out;
    }

    it('finishes every round at every level with a working garden or a right prediction, and opens the gate last', () => {
      for (let level = 1; level <= GARDEN_LEVELS; level++)
        for (let seed = 1; seed <= 100; seed++) play(level, seed);
    });

    it('takes only what the garden needs, never more pieces than it has spaces, and never a distractor', () => {
      for (let level = 1; level <= GARDEN_LEVELS; level++) {
        if (PLANS[level - 1].mode !== 'build') continue;
        for (let seed = 1; seed <= 50; seed++) {
          const rounds = makeRounds(level, new Rng(seed));
          play(level, seed).forEach((touches, i) => {
            const pieces = touches.flatMap((t) => (typeof t === 'object' && 'piece' in t ? [t.piece] : []));
            expect(pieces.length).toBeLessThanOrEqual(rounds[i].capacity);
            expect(new Set(pieces).size).toBe(pieces.length);
            expect(welcomes(pieces, rounds[i].visitors)).toBe(true);
            // Taking out any one piece would leave something missing, so the bot places no spare.
            pieces.forEach((_, k) =>
              expect(
                welcomes(
                  pieces.filter((__, j) => j !== k),
                  rounds[i].visitors,
                ),
              ).toBe(false),
            );
          });
        }
      }
    });

    it('shows the idea of the top level: one hedge, one seed grass and one pond with reeds', () => {
      const touches = play(6, 11)[0];
      expect(
        touches
          .filter((t) => typeof t === 'object' && 'piece' in t)
          .map((t) => (t as { piece: PieceId }).piece)
          .sort(),
      ).toEqual(['berry-hedge', 'pond-reeds', 'seed-grass']);
    });

    it('does nothing once the round is tested or the prediction round has no answer', () => {
      expect(
        habitatTouch({ visitors: ['bunny'], offered: [], capacity: 2, prepared: [] }, 'predict', [], null),
      ).toBeNull();
    });
  });
});

describe('Habitat Helpers, the rocky shore (levels 8–9)', () => {
  const key = (a: readonly (Place | null)[]) => a.join(',');
  const shore = (friends: ShoreRound['friends'], places: Place[], room: ShoreRound['room']): ShoreRound => ({
    friends,
    places,
    room,
  });

  it('makes two shore rounds at levels 8 and 9, with the pool holding one at level 9', () => {
    expect(PLANS.slice(GARDEN_LEVELS).map((p) => p.mode)).toEqual(['shore', 'shore']);
    for (let seed = 1; seed <= 100; seed++) {
      const eight = makeShoreRounds(8, new Rng(seed));
      expect(eight).toHaveLength(PLANS[7].rounds);
      for (const r of eight) expect([...r.places].sort()).toEqual(['high-rock', 'rock-pool']);
      const nine = makeShoreRounds(9, new Rng(seed));
      expect(nine).toHaveLength(PLANS[8].rounds);
      for (const r of nine) {
        expect(r.places).toHaveLength(3);
        expect(r.room['rock-pool']).toBe(1);
      }
      // No place ever holds more than two friends, so placed friends never overlap.
      for (const r of [...eight, ...nine])
        for (const place of r.places) expect(r.room[place]).toBeLessThanOrEqual(2);
    }
  });

  it('level 8 accepts exactly the hand-listed arrangements: the anemone in the pool, the barnacle anywhere', () => {
    const r = shore(['anemone', 'barnacle'], ['high-rock', 'rock-pool'], { 'high-rock': 2, 'rock-pool': 2 });
    expect(shoreSolutions(r).map(key).sort()).toEqual(['rock-pool,high-rock', 'rock-pool,rock-pool'].sort());
    // The anemone on the high rock is never accepted, wherever the barnacle goes.
    expect(shoreAccepted(r, ['high-rock', 'rock-pool'])).toBe(false);
    expect(shoreAccepted(r, ['high-rock', 'high-rock'])).toBe(false);
    // A friend still on the sand is not a finished shore.
    expect(shoreAccepted(r, ['rock-pool', null])).toBe(false);
    const r2 = shore(['anemone', 'barnacle', 'barnacle'], ['high-rock', 'rock-pool'], {
      'high-rock': 2,
      'rock-pool': 2,
    });
    expect(shoreSolutions(r2).map(key).sort()).toEqual(
      [
        'rock-pool,high-rock,high-rock',
        'rock-pool,high-rock,rock-pool',
        'rock-pool,rock-pool,high-rock',
      ].sort(),
    );
  });

  it('level 9 accepts exactly the hand-listed arrangements: the pool forces the anemone, the crab hides under seaweed', () => {
    const room = { 'rock-pool': 1, 'seaweed-rocks': 2, 'high-rock': 2 };
    const places: Place[] = ['rock-pool', 'seaweed-rocks', 'high-rock'];
    const r = shore(['barnacle', 'crab', 'anemone'], places, room);
    expect(shoreSolutions(r).map(key).sort()).toEqual(
      ['high-rock,seaweed-rocks,rock-pool', 'seaweed-rocks,seaweed-rocks,rock-pool'].sort(),
    );
    // The barnacle in the pool takes the anemone's only wet place.
    expect(shoreAccepted(r, ['rock-pool', 'seaweed-rocks', 'rock-pool'])).toBe(false);
    // The seaweed rocks give a hiding place but are not wet.
    expect(shoreAccepted(r, ['high-rock', 'seaweed-rocks', 'seaweed-rocks'])).toBe(false);
    // The crab on bare rock has nowhere to hide.
    expect(shoreAccepted(r, ['seaweed-rocks', 'high-rock', 'rock-pool'])).toBe(false);
    const r2 = shore(['barnacle', 'crab', 'anemone', 'barnacle'], places, room);
    expect(shoreSolutions(r2).map(key).sort()).toEqual(
      [
        'high-rock,seaweed-rocks,rock-pool,high-rock',
        'high-rock,seaweed-rocks,rock-pool,seaweed-rocks',
        'seaweed-rocks,seaweed-rocks,rock-pool,high-rock',
      ].sort(),
    );
  });

  it('every generated round has an accepted arrangement, and every accepted one meets every need', () => {
    for (const level of [8, 9]) {
      for (let seed = 1; seed <= 100; seed++) {
        for (const r of makeShoreRounds(level, new Rng(seed))) {
          expect(shoreSolutions(r).length).toBeGreaterThan(0);
          for (const a of shoreSolutions(r)) {
            a.forEach((place, i) => {
              if (r.friends[i] === 'anemone') expect(place).toBe('rock-pool');
              if (r.friends[i] === 'crab') expect(place).toBe('seaweed-rocks');
            });
          }
        }
      }
    }
  });

  it('following the hint from any arrangement, sand included, always reaches an accepted shore', () => {
    for (const level of [8, 9]) {
      for (const r of makeShoreRounds(level, new Rng(level))) {
        const starts: Arrangement[] = [r.friends.map(() => null), ...allArrangements(r)];
        for (const start of starts) {
          // Only starts a child could reach: no place over its room.
          if (r.places.some((p) => start.filter((s) => s === p).length > (r.room[p] ?? 0))) continue;
          const a = [...start];
          let steps = 0;
          while (!shoreAccepted(r, a)) {
            const move = shoreHint(r, a);
            expect(move, `level ${level} from ${key(start)}`).not.toBeNull();
            a[move!.friend] = move!.place === 'sand' ? null : move!.place;
            expect(r.places.every((p) => a.filter((s) => s === p).length <= (r.room[p] ?? 0))).toBe(true);
            expect(++steps).toBeLessThan(10);
          }
        }
      }
    }
  });

  it('the ghost finger finishes every shore round from the sand: friend, place, then the wave', () => {
    for (const level of [8, 9]) {
      for (let seed = 1; seed <= 50; seed++) {
        for (const r of makeShoreRounds(level, new Rng(seed))) {
          const a: Arrangement = r.friends.map(() => null);
          let held: number | null = null;
          let taps = 0;
          for (;;) {
            const t = shoreTouch(r, a, held);
            expect(t).not.toBeNull();
            if (t === 'tide') break;
            if ('friend' in t!) held = t.friend;
            else {
              expect(held).not.toBeNull();
              a[held!] = t!.place === 'sand' ? null : t!.place;
              held = null;
            }
            expect(++taps).toBeLessThan(20);
          }
          expect(shoreAccepted(r, a)).toBe(true);
        }
      }
    }
  });
});
