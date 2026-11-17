import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { computeView } from '../../engine/view';
import { SCRIPT } from '../../content/voice-script';
import {
  askable,
  asking,
  bare,
  CARD,
  chipReason,
  CHIPS,
  CLUE_PLACES,
  detail,
  LATER_PLACES,
  LEVELS,
  picturesWith,
  RIBBON_H,
  stillHere,
  compareFaces,
  faceOf,
  inTray,
  mistHides,
  MISTY,
  MIST_PLACES,
  MIST_STAGES,
  fittingGaps,
  GAP_H,
  GAP_W,
  gapCount,
  lineLayout,
  nextCard,
  overlaps,
  PLACE_IDS,
  PLACES,
  PlaceBag,
  place,
  planFor,
  PROOF_PLACES,
  proofLayout,
  proofSpots,
  proves,
  proving,
  roundFor,
  spotAt,
  spotReason,
  Tally,
  validGaps,
  type ProofPlace,
  type Rect,
  type Round,
} from './logic';

const VIEWS = {
  landscape: computeView(1024, 768),
  portrait: computeView(768, 1024),
  phone: computeView(844, 390),
  notch: computeView(844, 390, { top: 0, right: 47, bottom: 21, left: 47 }),
};

describe('the places', () => {
  it('have four stages each, every neighbour differing in a named element, with no number, date or time word', () => {
    expect(PLACE_IDS).toEqual(['shore', 'tree', 'nest']);
    for (const id of [...PLACE_IDS, ...LATER_PLACES]) {
      const p = PLACES[id];
      expect(p.stages.length).toBe(4);
      p.stages.forEach((s, i) => {
        expect(s.id).toBe(`${id}-${i}`);
        expect(s.changes.length).toBeGreaterThan(0);
        if (i > 0) expect(s.changes).not.toBe(p.stages[i - 1].changes);
        for (const text of [s.caption, s.changes]) {
          expect(text).not.toMatch(/\d/);
          expect(text).not.toMatch(/\b(year|month|week|day|hour|minute|ago|century)s?\b/i);
        }
        expect(SCRIPT[`trail.card.${s.id}` as keyof typeof SCRIPT]).toBeDefined();
        // What changed is something the picture is listed as showing.
        expect(
          s.shows.some((e) => s.changes.includes(e)),
          s.id,
        ).toBe(true);
        expect(new Set(s.shows).size).toBe(s.shows.length);
      });
    }
  });

  it('list what is still here: the element in every stage, one for each later place and the rock on the shore', () => {
    expect(stillHere('green')).toEqual(['big rock']);
    expect(stillHere('oven')).toEqual(['stone oven']);
    expect(stillHere('shore')).toEqual(['rock']);
    expect(stillHere('tree')).toEqual(['grass']);
    for (const id of LATER_PLACES)
      for (const e of stillHere(id)) expect(picturesWith(id, e)).toBe(PLACES[id].stages.length);
  });

  it('make the later places grander in the middle than at the end, and tell the plainer stage by the thing that grows', () => {
    expect(LATER_PLACES.map((id) => PLACES[id].stages.map((_s, i) => detail(id, i)))).toEqual([
      [2, 4, 3, 4],
      [2, 5, 3, 4],
    ]);
    for (const id of LATER_PLACES) {
      expect(detail(id, 1)).toBeGreaterThan(detail(id, 2));
      expect(detail(id, 1)).toBeGreaterThanOrEqual(detail(id, 3));
      // A reason about stage 2 never names the bench or the table: those could be built at any time.
      expect(PLACES[id].stages[2].changes).toMatch(/taller tree|longer vine/);
      // The grand thing is in one picture only, and no chip is the growing thing.
      expect(picturesWith(id, CHIPS[id].grand)).toBe(1);
      for (const e of [CHIPS[id].grand, ...CHIPS[id].others]) expect(e).not.toMatch(/tree|sapling|vine/);
    }
  });

  it('come from a bag that gives all three before any repeats, which rounds share across a session', () => {
    const bag = new PlaceBag(new Rng(7));
    for (let round = 0; round < 5; round++) {
      const seen = new Set([bag.next(), bag.next(), bag.next()]);
      expect(seen.size).toBe(3);
    }
    const places = Array.from({ length: 9 }, (_, i) => roundFor(1 + (i % 3), new Rng(i)).place);
    for (let i = 0; i < 9; i += 3) expect(new Set(places.slice(i, i + 3)).size).toBe(3);
  });
});

describe('rounds', () => {
  it('level 1 shows two loose cards at least one stage apart and nothing hung', () => {
    for (let seed = 0; seed < 500; seed++) {
      const r = roundFor(1, new Rng(seed));
      expect(r.cards.length).toBe(2);
      expect(r.cards[1] - r.cards[0]).toBeGreaterThanOrEqual(2);
      expect(r.hung).toEqual([]);
      expect([...r.loose].sort()).toEqual([...r.cards].sort());
    }
  });

  it('level 2 hangs two of three stages and leaves one loose, which can be any of the three', () => {
    const loosePositions = new Set<number>();
    for (let seed = 0; seed < 500; seed++) {
      const r = roundFor(2, new Rng(seed));
      expect(r.cards.length).toBe(3);
      expect(r.hung.length).toBe(2);
      expect(r.loose.length).toBe(1);
      expect([...r.hung, ...r.loose].sort()).toEqual(r.cards);
      loosePositions.add(r.cards.indexOf(r.loose[0]));
    }
    expect([...loosePositions].sort()).toEqual([0, 1, 2]);
  });

  it('level 3 uses every stage, hangs the first and shuffles the other three', () => {
    const orders = new Set<string>();
    for (let seed = 0; seed < 500; seed++) {
      const r = roundFor(3, new Rng(seed));
      expect(r.cards).toEqual([0, 1, 2, 3]);
      expect(r.hung).toEqual([0]);
      expect([...r.loose].sort()).toEqual([1, 2, 3]);
      orders.add(r.loose.join(''));
    }
    expect(orders.size).toBe(6);
  });

  it('level 4 hangs one of the shore and the tree at two times and leaves the other place loose at the other two', () => {
    const hungSets = new Set<string>();
    const hungPlaces = new Set<string>();
    for (let seed = 0; seed < 500; seed++) {
      const r = roundFor(4, new Rng(seed));
      expect(CLUE_PLACES).toContain(r.place);
      expect(r.other).toBe(CLUE_PLACES.find((p) => p !== r.place));
      expect(r.cards).toEqual([0, 1, 2, 3]);
      expect(r.hung.length).toBe(2);
      expect(r.loose.length).toBe(2);
      expect([...r.hung, ...r.loose].sort()).toEqual(r.cards);
      for (const t of r.hung) expect(faceOf(r, t).place).toBe(r.place);
      for (const t of r.loose) expect(faceOf(r, t).place).toBe(r.other);
      hungSets.add(r.hung.join(''));
      hungPlaces.add(r.place);
    }
    expect(hungSets.size).toBe(6);
    expect(hungPlaces.size).toBe(2);
    // Level 4 does not take a place from the session's bag; a nest asked for still gives the shore and the tree.
    expect(CLUE_PLACES).toContain(roundFor(4, new Rng(1), 'nest').place);
  });

  it('is the same round for the same seed', () => {
    for (const level of [1, 2, 3, 4])
      expect(roundFor(level, new Rng(42), 'tree')).toEqual(roundFor(level, new Rng(42), 'tree'));
  });

  it('clamps levels to the plans', () => {
    expect(planFor(0).level).toBe(1);
    expect(planFor(9).level).toBe(7);
    expect(planFor(6).name).toBe('We can’t tell');
    expect(planFor(5).name).toBe('Still here');
    expect(planFor(4).name).toBe('A clue inside');
    expect(planFor(2).name).toBe('Hang it between');
  });
});

/** Every legal build order of a round's loose cards. */
function orders(loose: number[]): number[][] {
  if (loose.length <= 1) return [loose];
  return loose.flatMap((s) => orders(loose.filter((o) => o !== s)).map((rest) => [s, ...rest]));
}

describe('valid gaps and placement', () => {
  it('give every card exactly one valid gap at every level, and the hung line stays in order', () => {
    for (const level of [1, 2, 3, 4]) {
      for (let seed = 0; seed < 200; seed++) {
        const r = roundFor(level, new Rng(seed));
        for (const order of orders(r.loose)) {
          let line: number[] = [...r.hung];
          for (const stage of order) {
            const valid = validGaps(r, line, stage);
            expect(valid.length).toBe(1);
            expect(valid[0]).toBeLessThan(gapCount(r, line));
            const res = place(r, line, stage, valid[0]);
            expect(res.ok).toBe(true);
            if (res.ok) line = res.line;
            expect(line).toEqual([...line].sort((a, b) => a - b));
          }
          expect(line).toEqual(r.cards);
        }
      }
    }
  });

  it('answers any other gap with a reason built from the pictures and never changes the line', () => {
    for (const level of [2, 3]) {
      for (let seed = 0; seed < 200; seed++) {
        const r = roundFor(level, new Rng(seed), PLACE_IDS[seed % 3]);
        const line = [...r.hung];
        for (const stage of r.loose) {
          const [valid] = validGaps(r, line, stage);
          for (let gap = 0; gap < gapCount(r, line); gap++) {
            if (gap === valid) continue;
            const res = place(r, line, stage, gap);
            expect(res.ok).toBe(false);
            if (res.ok) continue;
            expect(res.line).toEqual(line);
            const stages = PLACES[r.place].stages;
            if (gap < valid) {
              // Too early: it already has what the hung card after the gap lacks.
              expect(res.reason).toContain(`already has the ${stages[stage].changes}`);
              expect(res.reason).toContain(`after the ${bare(stages[line[gap]].caption)}`);
            } else {
              expect(res.reason).toContain(`has no ${stages[line[gap - 1]].changes} yet`);
              expect(res.reason).toContain(`before the ${bare(stages[line[gap - 1]].caption)}`);
            }
          }
        }
      }
    }
  });

  it('never reads "the a" or "the an" in a reason', () => {
    for (const level of [1, 2, 3, 4])
      for (let seed = 0; seed < 100; seed++) {
        const r = roundFor(level, new Rng(seed), PLACE_IDS[seed % 3]);
        const line = level === 1 ? [] : [...r.hung];
        for (const stage of r.loose)
          for (let gap = 0; gap < gapCount(r, line); gap++) {
            const res = place(r, line, stage, gap);
            if (!res.ok) expect(res.reason).not.toMatch(/\bthe (a|an|the) /i);
          }
      }
  });

  it("at level 1 the older card belongs on the left post and the newer called 'long ago' is the only miss", () => {
    for (let seed = 0; seed < 200; seed++) {
      const r = roundFor(1, new Rng(seed));
      const [older, newer] = r.cards;
      expect(gapCount(r, [])).toBe(2);
      expect(validGaps(r, [], older)).toEqual([0]);
      expect(validGaps(r, [], newer)).toEqual([1]);
      const wrong = place(r, [], newer, 0);
      expect(wrong.ok).toBe(false);
      if (!wrong.ok)
        expect(wrong.reason).toContain(`already has the ${PLACES[r.place].stages[newer].changes}`);
      const right = place(r, [], older, 0);
      expect(right.ok && right.line).toEqual([older]);
      // The other card then belongs on the other post.
      expect(validGaps(r, [older], newer)).toEqual([1]);
      expect(place(r, [older], newer, 1).ok).toBe(true);
    }
  });

  it('the ghost finger takes the oldest loose card, so its build is always legal', () => {
    for (let seed = 0; seed < 100; seed++) {
      const r = roundFor(3, new Rng(seed));
      let line = [...r.hung];
      let loose = [...r.loose];
      while (loose.length) {
        const stage = nextCard(r, loose)!;
        expect(stage).toBe(Math.min(...loose));
        const res = place(r, line, stage, validGaps(r, line, stage)[0]);
        expect(res.ok).toBe(true);
        if (res.ok) line = res.line;
        loose = loose.filter((s) => s !== stage);
      }
      expect(nextCard(r, loose)).toBeNull();
      const r1 = roundFor(1, new Rng(seed));
      expect(nextCard(r1, r1.loose)).toBe(r1.cards[0]);
    }
  });
});

describe('level 4, a clue inside', () => {
  it('gives every card a clue: the other place at the same time', () => {
    for (let seed = 0; seed < 100; seed++) {
      const r = roundFor(4, new Rng(seed));
      for (const n of r.cards) {
        const f = faceOf(r, n);
        expect(f.stage).toBe(n);
        expect(f.clue).toEqual({ place: f.place === r.place ? r.other : r.place, stage: n });
      }
    }
    // Levels 1–3 cards carry no clue.
    for (const level of [1, 2, 3])
      for (const n of roundFor(level, new Rng(3)).cards)
        expect(faceOf(roundFor(level, new Rng(3)), n).clue).toBeUndefined();
  });

  it('is decided by the clue: without the little pictures, whichever loose card goes first fits more than one gap', () => {
    for (let seed = 0; seed < 500; seed++) {
      const r = roundFor(4, new Rng(seed));
      for (const first of r.loose) {
        expect(fittingGaps(r, r.hung, first, true).length).toBe(1);
        expect(fittingGaps(r, r.hung, first, false).length).toBeGreaterThan(1);
        // Without the clue nothing in the two places' own pictures compares them.
        for (const m of r.hung) expect(compareFaces(faceOf(r, first), faceOf(r, m), false)).toBeNull();
      }
    }
  });

  it('builds the line in time order from either loose card first, the second one fitting one gap', () => {
    for (let seed = 0; seed < 500; seed++) {
      const r = roundFor(4, new Rng(seed));
      for (const order of orders(r.loose)) {
        let line = [...r.hung];
        for (const n of order) {
          const fits = validGaps(r, line, n);
          expect(fits.length).toBe(1);
          const res = place(r, line, n, fits[0]);
          expect(res.ok).toBe(true);
          if (res.ok) line = res.line;
        }
        expect(line).toEqual([0, 1, 2, 3]);
      }
    }
  });

  it('answers a wrong gap with a reason from the little picture when the neighbour is the other place', () => {
    let clueReasons = 0;
    for (let seed = 0; seed < 300; seed++) {
      const r = roundFor(4, new Rng(seed));
      const line = [...r.hung];
      for (const n of r.loose) {
        const [valid] = validGaps(r, line, n);
        for (let gap = 0; gap <= line.length; gap++) {
          if (gap === valid) continue;
          const res = place(r, line, n, gap);
          expect(res.ok).toBe(false);
          if (res.ok) continue;
          expect(res.line).toEqual(line);
          const neighbour = gap < valid ? line[gap] : line[gap - 1];
          const them = faceOf(r, neighbour);
          const theirs = PLACES[them.place].stages;
          // The neighbour hung first, so it is the other place: the reason reads the little picture.
          expect(them.place).not.toBe(faceOf(r, n).place);
          expect(res.reason).toMatch(/^In the little picture, the (shore|tree) /);
          if (gap < valid) {
            expect(res.reason).toContain(`already has the ${theirs[n].changes}`);
            expect(res.reason).toContain(`after the ${bare(theirs[neighbour].caption)}`);
          } else {
            expect(res.reason).toContain(`has no ${theirs[neighbour].changes} yet`);
            expect(res.reason).toContain(`before the ${bare(theirs[neighbour].caption)}`);
          }
          clueReasons++;
        }
      }
    }
    expect(clueReasons).toBeGreaterThan(0);
  });

  it('has the clue line and a level-4 instruction in the script', () => {
    expect(SCRIPT['trail.instruct.4' as keyof typeof SCRIPT]).toBeDefined();
    expect(SCRIPT['trail.clue' as keyof typeof SCRIPT]).toBeDefined();
  });
});

describe('level 5, still here', () => {
  it('takes the green and the oven in turn, the first stage hung and three loose, and is school only', () => {
    expect(LEVELS.school).toEqual({ min: 2, max: 7 });
    expect(LEVELS.prek).toEqual({ min: 1, max: 4 });
    const places = Array.from({ length: 8 }, (_, i) => roundFor(5, new Rng(i)).place);
    for (let i = 0; i < 8; i += 2) expect(new Set(places.slice(i, i + 2))).toEqual(new Set(LATER_PLACES));
    for (let seed = 0; seed < 500; seed++) {
      const r = roundFor(5, new Rng(seed));
      expect(LATER_PLACES).toContain(r.place);
      expect(r.cards).toEqual([0, 1, 2, 3]);
      expect(r.hung).toEqual([0]);
      expect([...r.loose].sort()).toEqual([1, 2, 3]);
    }
    expect(roundFor(5, new Rng(3), 'oven').place).toBe('oven');
    // A place from the three-place bag is not a level-5 place.
    expect(LATER_PLACES).toContain(roundFor(5, new Rng(3), 'shore').place);
  });

  it('offers one still-here chip and two that are in some pictures but not all, one of them the grand thing', () => {
    const thirds = new Set<string>();
    for (let seed = 0; seed < 500; seed++) {
      const r = roundFor(5, new Rng(seed));
      const n = PLACES[r.place].stages.length;
      expect(r.chips!.length).toBe(3);
      expect(new Set(r.chips).size).toBe(3);
      expect(r.chips!.filter((e) => picturesWith(r.place, e) === n)).toEqual([r.still]);
      for (const e of r.chips!) {
        expect(picturesWith(r.place, e)).toBeGreaterThanOrEqual(1);
        if (e !== r.still) {
          expect(picturesWith(r.place, e)).toBeLessThan(n);
          expect(chipReason(r.place, e)).toMatch(/only in one picture|not in every picture/);
        }
      }
      const place = r.place as (typeof LATER_PLACES)[number];
      expect(r.chips).toContain(CHIPS[place].grand);
      thirds.add(r.chips!.find((e) => e !== r.still && e !== CHIPS[place].grand)!);
    }
    // Every plainer thing turns up as the third chip.
    expect(thirds).toEqual(new Set(LATER_PLACES.flatMap((id) => CHIPS[id].others)));
    expect(chipReason('green', 'merry-go-round')).toBe('The merry-go-round is only in one picture.');
    expect(chipReason('green', 'bench')).toBe('The bench is not in every picture.');
  });

  it('defeats "more in the picture means later": that guess misplaces a card in every round, whatever the order', () => {
    for (let seed = 0; seed < 500; seed++) {
      const r = roundFor(5, new Rng(seed));
      for (const order of orders(r.loose)) {
        for (const tiesLater of [true, false]) {
          let line = [...r.hung];
          let wrong = 0;
          for (const card of order) {
            const d = detail(r.place, card);
            // The progress-only guess: after every hung picture that shows less (or as much).
            const guess = line.filter((m) => {
              const dm = detail(r.place, m);
              return dm < d || (tiesLater && dm === d);
            }).length;
            const [valid] = validGaps(r, line, card);
            if (guess !== valid) wrong++;
            line = (place(r, line, card, valid) as { line: number[] }).line;
          }
          expect(wrong, `seed ${seed} order ${order}`).toBeGreaterThanOrEqual(1);
          // And any legal build order fills the line, which then asks its question.
          expect(line).toEqual([0, 1, 2, 3]);
          expect(asking(r, line)).toBe(true);
        }
      }
    }
  });

  it('gives a wrong gap a true reason, never one that says the newer picture has more', () => {
    for (const id of LATER_PLACES) {
      const r = roundFor(5, new Rng(1), id);
      // The plainer stage 2 put before the grand stage 1: the growing thing is the reason.
      const early = place(r, [0, 1], 2, 1);
      expect(early.ok).toBe(false);
      if (!early.ok)
        expect(early.reason).toMatch(/already has the (taller tree|longer vine), so it comes after/);
      // The grand stage 1 put after stage 2.
      const late = place(r, [0, 2], 1, 2);
      expect(late.ok).toBe(false);
      if (!late.ok) expect(late.reason).toMatch(/has no (taller tree|longer vine) yet, so it comes before/);
    }
  });

  it('counts the chips as one more card: a miss per distinct wrong chip, the same again nothing, a glow after two', () => {
    const t = new Tally();
    expect(t.missed(Tally.CHIP_SET, 0)).toEqual({ counted: true, lit: false });
    expect(t.missed(Tally.CHIP_SET, 0)).toEqual({ counted: false, lit: false });
    expect(t.missed(Tally.CHIP_SET, 2)).toEqual({ counted: true, lit: true });
    expect(t.glowing).toBe(Tally.CHIP_SET);
    // Show a hint after the glow adds nothing.
    expect(t.help(Tally.CHIP_SET)).toBe(false);
    expect([t.misses, t.hints]).toEqual([2, 1]);
    t.hung(Tally.CHIP_SET);
    expect(t.glowing).toBeNull();
    // Show a hint first is the one hint; the glow does not count again.
    const u = new Tally();
    expect(u.help(Tally.CHIP_SET)).toBe(true);
    u.missed(Tally.CHIP_SET, 1);
    u.missed(Tally.CHIP_SET, 2);
    expect([u.misses, u.hints]).toEqual([2, 1]);
  });

  it('has its instruction, cards and still-here lines in the script', () => {
    for (const id of ['instruct.5', 'still-ask', 'still-yes', 'still-no', 'still-glow', 'still-help'])
      expect(SCRIPT[`trail.${id}` as keyof typeof SCRIPT], id).toBeDefined();
    expect(SCRIPT['trail.still-yes'][0]).toContain('{thing}');
    expect(SCRIPT['trail.still-no'][0]).toContain('{reason}');
  });
});

describe('level 6, we can’t tell', () => {
  /** The round with its ordinary loose card hung: the line the misty card meets. */
  const before = (r: Round) => {
    const [first] = r.loose;
    const res = place(r, r.hung, first, validGaps(r, r.hung, first)[0]);
    if (!res.ok) throw new Error('the ordinary card has a gap');
    return res.line;
  };

  it('takes the shore or the tree, hangs two of the three stages the mist leaves, and keeps the misty card for last', () => {
    const places = Array.from({ length: 8 }, (_, i) => roundFor(6, new Rng(i)).place);
    for (let i = 0; i < 8; i += 2) expect(new Set(places.slice(i, i + 2))).toEqual(new Set(MIST_PLACES));
    const ks = new Set<string>();
    for (let seed = 0; seed < 500; seed++) {
      const r = roundFor(6, new Rng(seed));
      expect(MIST_PLACES).toContain(r.place);
      const k = r.misty!.k;
      ks.add(`${r.place}-${k}`);
      expect(MIST_STAGES[r.place as 'shore' | 'tree']).toContain(k);
      const others = [0, 1, 2, 3].filter((i) => i !== k);
      expect(r.cards).toEqual([...others, MISTY]);
      expect(r.hung.length).toBe(2);
      expect(r.loose.length).toBe(2);
      expect(r.loose[1]).toBe(MISTY);
      expect([...r.hung, r.loose[0]].sort()).toEqual(others);
      // The misty card waits out of the tray until the other is hung, and the ghost finger takes it last.
      expect(inTray(r, r.loose)).toEqual([r.loose[0]]);
      expect(inTray(r, [MISTY])).toEqual([MISTY]);
      expect(nextCard(r, r.loose)).toBe(r.loose[0]);
      expect(faceOf(r, MISTY)).toEqual({ place: r.place, stage: k, could: [k, k + 1] });
    }
    // Every misted stage turns up: three on the shore, the swing on the tree.
    expect([...ks].sort()).toEqual(['shore-0', 'shore-1', 'shore-2', 'tree-2']);
    expect(roundFor(6, new Rng(3), 'tree').place).toBe('tree');
    expect(MIST_PLACES).toContain(roundFor(6, new Rng(3), 'nest').place);
  });

  it('gives the misty card exactly two gaps, either side of the card it might be, and every other card exactly one', () => {
    for (let seed = 0; seed < 500; seed++) {
      const r = roundFor(6, new Rng(seed));
      const k = r.misty!.k;
      expect(validGaps(r, r.hung, r.loose[0]).length).toBe(1);
      const line = before(r);
      expect(line).toEqual([0, 1, 2, 3].filter((i) => i !== k));
      const at = line.indexOf(k + 1);
      expect(validGaps(r, line, MISTY)).toEqual([at, at + 1]);
      // With the mist lifted and nothing under it, the same picture is plainly stage k and fits one gap only.
      const clear: Round = { ...r, misty: undefined, cards: [0, 1, 2, 3], loose: [k] };
      expect(validGaps(clear, line, k)).toEqual([at]);
    }
  });

  it('accepts either gap, counts nothing and keeps the side she chose', () => {
    for (let seed = 0; seed < 500; seed++) {
      const r = roundFor(6, new Rng(seed));
      const line = before(r);
      const at = line.indexOf(r.misty!.k + 1);
      const early = place(r, line, MISTY, at);
      const late = place(r, line, MISTY, at + 1);
      expect(early.ok && late.ok).toBe(true);
      if (!early.ok || !late.ok) continue;
      expect(early.line).toEqual([...line.slice(0, at), MISTY, ...line.slice(at)]);
      expect(late.line).toEqual([...line.slice(0, at + 1), MISTY, ...line.slice(at + 1)]);
      expect(early.line).not.toEqual(late.line);
      for (const full of [early.line, late.line]) {
        expect([...full].sort()).toEqual(r.cards);
        expect(lineLayout(r, full, 0, VIEWS.landscape)).not.toBeNull();
      }
    }
  });

  it('answers a third gap with a true reason from the nearest fitting gap, about what the misty picture does show', () => {
    for (let seed = 0; seed < 500; seed++) {
      const r = roundFor(6, new Rng(seed));
      const k = r.misty!.k;
      const stages = PLACES[r.place].stages;
      const line = before(r);
      const valid = validGaps(r, line, MISTY);
      for (let gap = 0; gap <= line.length; gap++) {
        if (valid.includes(gap)) continue;
        const res = place(r, line, MISTY, gap);
        expect(res.ok).toBe(false);
        if (res.ok) continue;
        expect(res.line).toEqual(line);
        if (gap < valid[0]) {
          // Too early: what shows through (stage k's own thing) is already past the card after the gap.
          expect(line[gap]).toBeLessThan(k);
          expect(res.reason).toContain(`already has the ${stages[k].changes}`);
          expect(res.reason).toContain(`after the ${bare(stages[line[gap]].caption)}`);
        } else {
          // Too late: the card before the gap shows something beyond even the later reading.
          expect(line[gap - 1]).toBeGreaterThan(k + 1);
          expect(res.reason).toContain(`has no ${stages[line[gap - 1]].changes} yet`);
        }
        // Never a claim about the hidden thing.
        expect(res.reason).not.toContain(`already has the ${stages[k + 1].changes}`);
        expect(res.reason).not.toContain(`has no ${stages[k + 1].changes} yet`);
      }
    }
  });

  it('counts two different wrong gaps as two misses and one hint, the same again nothing, and lights both gaps', () => {
    // The shore with the dock misted has two wrong gaps past its fitting pair.
    let r = roundFor(6, new Rng(0), 'shore');
    for (let seed = 1; r.misty!.k !== 0; seed++) r = roundFor(6, new Rng(seed), 'shore');
    const line = before(r);
    expect(validGaps(r, line, MISTY)).toEqual([0, 1]);
    const t = new Tally();
    expect(place(r, line, MISTY, 2).ok).toBe(false);
    expect(t.missed(MISTY, 2)).toEqual({ counted: true, lit: false });
    expect(t.missed(MISTY, 2)).toEqual({ counted: false, lit: false });
    expect(t.missed(MISTY, 3)).toEqual({ counted: true, lit: true });
    expect(t.help(MISTY)).toBe(false);
    expect([t.misses, t.hints]).toEqual([2, 1]);
    expect(t.glowing).toBe(MISTY);
    // The glow follows the card's fitting gaps: both of them.
    expect(validGaps(r, line, t.glowing!)).toEqual([0, 1]);
    t.hung(MISTY);
    expect(t.glowing).toBeNull();
  });

  it('says what hides the telling spot, and has its lines and how-to step', () => {
    expect(mistHides('shore', 0)).toBe('Sea mist hides the spot where a little dock would be.');
    expect(mistHides('shore', 2)).toBe('Sea mist hides the spot where a boat and lantern would be.');
    expect(mistHides('tree', 2)).toBe('Leaves hide the branch where a swing would hang.');
    for (const id of [
      'trail.instruct.6',
      'trail.mist-ask',
      'trail.mist',
      'trail.both-fit',
      'trail.both-glow',
    ])
      expect(SCRIPT[id as keyof typeof SCRIPT], id).toBeTruthy();
    expect(SCRIPT['trail.mist'][0]).toContain('{hides}');
  });
});

describe('level 7, show me why', () => {
  it('builds a line of four of a place with something that grows, never the shore, and is school only', () => {
    expect(planFor(7)).toMatchObject({ level: 7, name: 'Show me why', cards: 4, hungAtStart: 1 });
    expect(LEVELS).toEqual({
      preschool: { min: 1, max: 2 },
      prek: { min: 1, max: 4 },
      school: { min: 2, max: 7 },
    });
    expect(PROOF_PLACES).toEqual(['tree', 'nest', 'green', 'oven']);
    const seen = new Set<string>();
    for (let seed = 0; seed < 500; seed++) {
      const r = roundFor(7, new Rng(seed));
      seen.add(`${r.place}-${r.ask}`);
      expect(r.place).not.toBe('shore');
      expect(r.cards).toEqual([0, 1, 2, 3]);
      expect(r.hung).toEqual([0]);
      expect([...r.loose].sort()).toEqual([1, 2, 3]);
      // The asked card is never the first: something has to come before it.
      expect(r.ask).toBeGreaterThanOrEqual(1);
      expect(askable(r.place as ProofPlace)).toContain(r.ask);
      // Any build order fills the line in stage order, and only then is the question open.
      let line = [...r.hung];
      for (const c of r.loose) {
        expect(proving(r, line)).toBe(false);
        const [gap, ...more] = validGaps(r, line, c);
        expect(more).toEqual([]);
        line = (place(r, line, c, gap) as { line: number[] }).line;
      }
      expect(line).toEqual([0, 1, 2, 3]);
      expect(proving(r, line)).toBe(true);
    }
    // Every askable picture of every place turns up.
    expect([...seen].sort()).toEqual(PROOF_PLACES.flatMap((p) => askable(p).map((k) => `${p}-${k}`)).sort());
    const again = roundFor(7, new Rng(9), 'oven');
    expect(roundFor(7, new Rng(9), 'oven')).toEqual(again);
    expect(again.place).toBe('oven');
  });

  it('asks about what grows: the tree, the pet, the vine and the flowers prove; a thing built or in the picture before does not', () => {
    expect(PROOF_PLACES.map((p) => askable(p))).toEqual([
      [1, 2],
      [1, 2],
      [1, 2, 3],
      [1, 2, 3],
    ]);
    const frame = { x: 0, y: 0, w: 360, h: 360 };
    const proofs: Record<string, string[]> = {};
    for (const p of PROOF_PLACES)
      for (const k of askable(p)) {
        const where = `${p}-${k}`;
        const spots = proofSpots(p, k, frame);
        const shows = PLACES[p].stages[k].shows;
        expect(
          spots.some((s) => s.proves),
          where,
        ).toBe(true);
        expect(
          spots.some((s) => !s.proves),
          where,
        ).toBe(true);
        for (const s of spots) {
          expect(shows, where).toContain(s.element);
          expect(s.proves, where).toBe(proves(p, k, s.element));
          const reason = spotReason(p, k, s.element);
          expect(reason, where).not.toMatch(/undefined|\d/);
          // A thing that proves nothing gets a reason that says so; the proof says what has grown or changed.
          if (s.proves) expect(reason, where).toMatch(/grown|climbed|hatched/);
          else expect(reason, where).toMatch(/can’t tell us when|shows when\.$/);
          // The look of a thing is never called old or new.
          expect(reason, where).not.toMatch(/\b(old|new|older|newer)\b/i);
        }
        proofs[where] = [...new Set(spots.filter((s) => s.proves).map((s) => s.element))];
      }
    expect(proofs).toEqual({
      'tree-1': ['crown', 'trunk'],
      'tree-2': ['crown', 'trunk'],
      'nest-1': ['hatchling'],
      'nest-2': ['pet'],
      'green-1': ['tree'],
      'green-2': ['tree'],
      'green-3': ['tree', 'flower bed'],
      'oven-1': ['vine'],
      'oven-2': ['vine'],
      'oven-3': ['vine'],
    });
    // The grand things, the plain things and the cat prove nothing; what is still here says so in its own words.
    expect(spotReason('green', 1, 'merry-go-round')).toBe(
      'A merry-go-round can be built any time; the tree shows when.',
    );
    expect(spotReason('green', 2, 'bench')).toBe('A bench can be built any time; the tree shows when.');
    expect(spotReason('green', 3, 'bench')).toBe(
      'The bench is in the picture before too, so it can’t tell us when.',
    );
    expect(spotReason('green', 2, 'big rock')).toBe(
      'The big rock is in every picture, so it can’t tell us when.',
    );
    expect(spotReason('oven', 3, 'sleeping cat')).toBe(
      'A cat can nap there on any day; the vine shows when.',
    );
    expect(spotReason('nest', 1, 'nest')).toBe(
      'The nest is in the picture before too, so it can’t tell us when.',
    );
    expect(spotReason('tree', 2, 'grass')).toBe('The grass is in every picture, so it can’t tell us when.');
  });

  it('keeps every spot at least 100 units, inside the frame and apart, and the card before it full size, at the four views', () => {
    for (const [name, v] of Object.entries(VIEWS))
      for (const p of PROOF_PLACES)
        for (const k of askable(p)) {
          const where = `${p}-${k} ${name}`;
          const r: Round = { level: 7, place: p, cards: [0, 1, 2, 3], hung: [0], loose: [1, 2, 3], ask: k };
          const l = proofLayout(r, v)!;
          expect(l, where).not.toBeNull();
          expect(l.frame.w, where).toBeGreaterThanOrEqual(360);
          expect(l.spots.length, where).toBeGreaterThanOrEqual(2);
          for (const a of l.spots) {
            expect(Math.min(a.w, a.h), where).toBeGreaterThanOrEqual(100);
            expect(a.x, where).toBeGreaterThanOrEqual(l.frame.x);
            expect(a.y, where).toBeGreaterThanOrEqual(l.frame.y);
            expect(a.x + a.w, where).toBeLessThanOrEqual(l.frame.x + l.frame.w);
            expect(a.y + a.h, where).toBeLessThanOrEqual(l.frame.y + l.frame.h);
            for (const b of l.spots) if (a !== b) expect(overlaps(a, b), where).toBe(false);
            // A tap in the middle of a spot finds that spot.
            expect(spotAt(l.spots, { x: a.x + a.w / 2, y: a.y + a.h / 2 }), where).toBe(a);
          }
          // A corner of the frame's border is no spot: a tap there is free.
          expect(spotAt(l.spots, { x: l.frame.x + 2, y: l.frame.y + 2 }), where).toBeNull();
          expect([l.before.w, l.before.h], where).toEqual([CARD, CARD]);
          expect(l.before.x, where).toBeGreaterThanOrEqual(0);
          expect(l.before.y + l.before.h, where).toBeLessThanOrEqual(v.h);
          // The card before clears the frame's wooden rim, the pet's corner and the home button.
          const rim = { x: l.frame.x - 16, y: l.frame.y - 16, w: l.frame.w + 32, h: l.frame.h + 32 };
          expect(overlaps(l.before, rim), where).toBe(false);
          expect(overlaps(l.before, { x: 0, y: v.h - 150, w: 150, h: 150 }), where).toBe(false);
          expect(overlaps(l.before, { x: 0, y: 0, w: 120, h: 120 }), where).toBe(false);
        }
    // The shore is never asked, and a round of another level has no question.
    expect(proofLayout(roundFor(3, new Rng(1), 'shore'), VIEWS.landscape)).toBeNull();
  });

  it('counts a miss per distinct wrong thing, the same again nothing, and lights the proof after two or on Show a hint', () => {
    const t = new Tally();
    // Elements of the green's last picture, by index: the tree, the flower bed, the bench, the big rock.
    expect(t.missed(Tally.PROOF, 2)).toEqual({ counted: true, lit: false });
    expect(t.missed(Tally.PROOF, 2)).toEqual({ counted: false, lit: false });
    expect(t.missed(Tally.PROOF, 3)).toEqual({ counted: true, lit: true });
    expect(t.help(Tally.PROOF)).toBe(false);
    expect([t.misses, t.hints, t.glowing]).toEqual([2, 1, Tally.PROOF]);
    t.hung(Tally.PROOF);
    expect(t.glowing).toBeNull();
    // Show a hint first is the same single hint.
    const u = new Tally();
    expect(u.help(Tally.PROOF)).toBe(true);
    expect(u.help(Tally.PROOF)).toBe(false);
    expect([u.misses, u.hints]).toEqual([0, 1]);
  });

  it('has its instruction, question lines and how-to step', () => {
    for (const id of [
      'trail.instruct.7',
      'trail.proof-ask',
      'trail.proof-yes',
      'trail.proof-no',
      'trail.proof-again',
      'trail.proof-glow',
      'trail.proof-help',
    ])
      expect(SCRIPT[id as keyof typeof SCRIPT], id).toBeTruthy();
    expect(SCRIPT['trail.proof-ask'][0]).toContain('{caption}');
    expect(SCRIPT['trail.proof-no'][0]).toContain('{reason}');
  });
});

describe('misses and hints', () => {
  it('count one miss per distinct wrong drop and at most one hint per card, from the glow or Show a hint', () => {
    const t = new Tally();
    expect(t.missed(2, 0)).toEqual({ counted: true, lit: false });
    expect(t.missed(2, 0)).toEqual({ counted: false, lit: false });
    expect([t.misses, t.hints, t.glowing]).toEqual([1, 0, null]);
    expect(t.missed(2, 3)).toEqual({ counted: true, lit: true });
    expect([t.misses, t.hints, t.glowing]).toEqual([2, 1, 2]);
    expect(t.help(2)).toBe(false);
    expect(t.help(2)).toBe(false);
    expect([t.misses, t.hints]).toEqual([2, 1]);
    expect(t.missed(2, 1)).toEqual({ counted: true, lit: false });
    expect([t.misses, t.hints]).toEqual([3, 1]);
    t.hung(2);
    expect(t.glowing).toBeNull();
    // Another card: Show a hint first, then its misses add nothing to hints.
    expect(t.help(3)).toBe(true);
    expect(t.missed(3, 0)).toEqual({ counted: true, lit: false });
    expect(t.missed(3, 1)).toEqual({ counted: true, lit: false });
    expect([t.misses, t.hints, t.glowing]).toEqual([5, 2, 3]);
  });

  it('lets the same card and gap count again after another card was hung', () => {
    const t = new Tally();
    t.missed(1, 0);
    t.hung(2);
    expect(t.missed(1, 0).counted).toBe(true);
    expect(t.misses).toBe(2);
  });
});

describe('layout', () => {
  const inside = (r: Rect, w: number, h: number) => r.x >= 0 && r.y >= 0 && r.x + r.w <= w && r.y + r.h <= h;

  it('keeps full-size posts, gaps, cards and tray apart and on screen on the iPad, in every line state of every level', () => {
    for (const level of [1, 2, 3, 4, 5, 6, 7]) {
      for (let seed = 0; seed < 20; seed++) {
        const r = roundFor(level, new Rng(seed));
        let line: number[] = [...r.hung];
        let loose = [...r.loose];
        for (;;) {
          for (const [name, v] of Object.entries({ landscape: VIEWS.landscape, portrait: VIEWS.portrait })) {
            const where = `level ${level} seed ${seed} ${name} hung ${line.length}`;
            const tray = inTray(r, loose);
            const l = lineLayout(r, line, tray.length, v);
            expect(l, where).not.toBeNull();
            if (!l) continue;
            expect(l.gaps.length, where).toBe(gapCount(r, line));
            expect(l.cards.length, where).toBe(line.length);
            expect(l.tray.length, where).toBe(tray.length);
            for (const g of l.gaps) {
              expect(g.w, where).toBeGreaterThanOrEqual(GAP_W);
              expect(g.h, where).toBeGreaterThanOrEqual(GAP_H);
            }
            for (const c of [...l.cards, ...l.tray]) expect([c.w, c.h], where).toEqual([CARD, CARD]);
            const all: Rect[] =
              level === 1
                ? [...l.tray, ...l.gaps]
                : [...l.cards, ...l.gaps, ...l.tray, ...l.chips, l.posts.left, l.posts.right];
            if (l.ribbon) all.push(l.ribbon);
            // Level 5's full line swaps its gaps for the ribbon and three chips, all full size.
            expect(!!l.ribbon, where).toBe(asking(r, line));
            expect(l.chips.length, where).toBe(asking(r, line) ? 3 : 0);
            for (const c of l.chips) expect([c.w, c.h], where).toEqual([CARD, CARD]);
            if (l.ribbon) {
              expect(l.ribbon.h, where).toBe(RIBBON_H);
              expect(l.ribbon.w, where).toBeGreaterThanOrEqual(4 * CARD);
              expect(l.rows.length, where).toBe(1);
            }
            for (const a of all) expect(inside(a, v.w, v.h), where).toBe(true);
            for (const a of all) for (const b of all) if (a !== b) expect(overlaps(a, b), where).toBe(false);
            // The pet's corner (bottom-left 150 square) and the home button (top-left 120 square) stay clear of touch targets.
            const pet = { x: 0, y: v.h - 150, w: 150, h: 150 };
            const home = { x: 0, y: 0, w: 120, h: 120 };
            for (const a of [...l.gaps, ...l.tray, ...l.chips]) {
              expect(overlaps(a, pet), where).toBe(false);
              expect(overlaps(a, home), where).toBe(false);
            }
            expect(l.rows.length, where).toBeLessThanOrEqual(2);
          }
          if (!loose.length) break;
          const stage = nextCard(r, loose)!;
          line = (place(r, line, stage, validGaps(r, line, stage)[0]) as { line: number[] }).line;
          loose = loose.filter((s) => s !== stage);
          if (level === 1) {
            line = [...r.cards];
            loose = [];
          }
        }
      }
    }
  });

  it('wraps a level-3 line of three hung cards into two rows in portrait and keeps a level-2 line on one row in landscape', () => {
    const r3: Round = { level: 3, place: 'nest', cards: [0, 1, 2, 3], hung: [0], loose: [1, 2, 3] };
    expect(lineLayout(r3, [0, 1, 2], 1, VIEWS.portrait)!.rows.length).toBe(2);
    expect(lineLayout(r3, [0, 1, 2], 1, VIEWS.landscape)!.rows.length).toBe(2);
    const r2: Round = { level: 2, place: 'tree', cards: [0, 1, 3], hung: [0, 3], loose: [1] };
    expect(lineLayout(r2, [0, 3], 1, VIEWS.landscape)!.rows.length).toBe(1);
  });

  it("lays out level 5's ribbon and chips at full size on a phone held sideways, notch or not", () => {
    const r = roundFor(5, new Rng(4));
    for (const v of [VIEWS.phone, VIEWS.notch]) {
      const l = lineLayout(r, [0, 1, 2, 3], 0, v)!;
      expect(l).not.toBeNull();
      expect(l.ribbon!.h).toBe(RIBBON_H);
      expect(l.chips.map((c) => [c.w, c.h])).toEqual(Array(3).fill([CARD, CARD]));
      const all = [...l.cards, ...l.chips, l.ribbon!];
      for (const a of all) {
        expect(inside(a, v.w, v.h)).toBe(true);
        for (const b of all) if (a !== b) expect(overlaps(a, b)).toBe(false);
      }
    }
  });

  it('returns null rather than shrink on a phone', () => {
    const r3: Round = { level: 3, place: 'shore', cards: [0, 1, 2, 3], hung: [0], loose: [1, 2, 3] };
    for (const v of [VIEWS.phone, VIEWS.notch]) {
      const l = lineLayout(r3, [0], 3, v);
      if (!l) continue;
      for (const c of [...l.cards, ...l.tray]) expect([c.w, c.h]).toEqual([CARD, CARD]);
    }
  });
});
