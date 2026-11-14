import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { SCRIPT } from '../../content/voice-script';
import { landing, levelsInOrder, stepLevel } from '../../progress/difficulty';
import {
  BETWEEN_LEVEL,
  BETWEEN_PLAN,
  GRADABLE,
  MIDDLES,
  degree,
  BIG_LEVEL,
  BIG_PLAN,
  LEVELS,
  planFor,
  CONCEPTS,
  CONCEPT_IDS,
  SUBJECTS,
  STICKER_CONCEPTS,
  poolFor,
  cardToTap,
  makeRounds,
  opposites,
  PLANS,
  word,
} from './logic';

describe('Opposites', () => {
  it('level 6 opens lap with one big card: each of the eight lap pairs once, one card per touch', () => {
    expect(planFor(BIG_LEVEL)).toBe(BIG_PLAN);
    expect(BIG_PLAN).toMatchObject({ level: 6, mode: 'switch', big: true, rounds: 8 });
    expect(levelsInOrder(LEVELS.lap!)).toEqual([BIG_LEVEL, 1]);
    expect(stepLevel(BIG_LEVEL, 1, LEVELS.lap!)).toBe(1);
    // A saved 6 carried into toddler starts toddler at its own level 1; no other band reaches 6.
    expect(landing(BIG_LEVEL, LEVELS.toddler!, [BIG_LEVEL])).toBe(1);
    for (const band of ['toddler', 'preschool', 'prek'] as const)
      expect(levelsInOrder(LEVELS[band]!)).not.toContain(BIG_LEVEL);
    // The ladder's levels 1–5 are unchanged.
    for (let level = 1; level <= PLANS.length; level++) expect(planFor(level)).toBe(PLANS[level - 1]);
    expect(SCRIPT['opp.big']).toBeDefined();
    for (let seed = 1; seed <= 200; seed++) {
      const rounds = makeRounds(BIG_PLAN, new Rng(seed));
      expect(rounds).toHaveLength(8);
      for (const r of rounds) {
        expect(r.cards).toHaveLength(1);
        expect(r.ask).toBeUndefined();
        expect(cardToTap(BIG_PLAN, r, [false], null)).toBe(0);
      }
      expect(rounds.map((r) => r.cards[0].concept).sort()).toEqual([...poolFor(1)].sort());
    }
  });

  it('keeps spoken words unique and the lap pool at its original eight pairs', () => {
    const words = CONCEPT_IDS.flatMap((c) => [...CONCEPTS[c].words]);
    expect(new Set(words).size).toBe(words.length);
    expect(poolFor(1)).toEqual(['size', 'mood', 'height', 'lid', 'cup', 'temp', 'sky', 'speed']);
    expect(poolFor(2)).toEqual(CONCEPT_IDS.filter((c) => CONCEPTS[c].from <= 2));
    expect(poolFor(2)).toHaveLength(12);
    expect(poolFor(3)).toEqual(CONCEPT_IDS);
    expect(poolFor(4)).toHaveLength(16);
    expect(STICKER_CONCEPTS).toEqual(['sky', 'temp', 'cup', 'lid', 'stature', 'lamp', 'wake', 'basket']);
  });

  it('has enough families at every level, respects entry levels, and draws every eligible pair', () => {
    for (const plan of PLANS) {
      const pool = poolFor(plan.level);
      expect(new Set(pool.map((c) => CONCEPTS[c].family)).size).toBeGreaterThanOrEqual(3);
      const seen = new Set<string>();
      for (let seed = 1; seed <= 200; seed++) {
        const rounds = makeRounds(plan, new Rng(seed));
        expect(rounds).toEqual(makeRounds(plan, new Rng(seed)));
        expect(rounds).toHaveLength(plan.rounds);
        for (const round of rounds) {
          const cards = [...round.cards, ...(round.ask ? [round.ask] : [])];
          const concepts = [...new Set(cards.map((c) => c.concept))];
          for (const c of concepts) {
            seen.add(c);
            expect(CONCEPTS[c].from).toBeLessThanOrEqual(plan.level);
          }
          if (plan.mode === 'opposite' || plan.mode === 'pairs' || plan.mode === 'spot')
            expect(new Set(concepts.map((c) => CONCEPTS[c].family)).size).toBe(concepts.length);
        }
      }
      expect([...seen].sort()).toEqual([...pool].sort());
    }
  });

  it('varies every eligible subject and keeps both sides of a pair on the same animal', () => {
    const seen = { size: new Set<string>(), mood: new Set<string>() };
    for (const plan of PLANS)
      for (let seed = 1; seed <= 200; seed++) {
        for (const r of makeRounds(plan, new Rng(seed))) {
          const cards = [...r.cards, ...(r.ask ? [r.ask] : [])];
          for (const c of cards) {
            if (c.concept === 'size' || c.concept === 'mood') {
              expect(SUBJECTS[c.concept]).toContain(c.who);
              seen[c.concept].add(c.who!);
            } else expect(c.who).toBeUndefined();
            for (const other of cards.filter((x) => x.concept === c.concept)) expect(other.who).toBe(c.who);
          }
        }
      }
    for (const concept of ['size', 'mood'] as const)
      expect([...seen[concept]].sort()).toEqual([...SUBJECTS[concept]].sort());
  });

  it('asks only about pictures on screen, with exactly one right answer', () => {
    for (const plan of PLANS) {
      for (let seed = 1; seed <= 200; seed++) {
        for (const r of makeRounds(plan, new Rng(seed))) {
          if (plan.mode === 'find') {
            expect(r.cards.filter((c) => word(c) === word(r.ask!))).toHaveLength(1);
          }
          if (plan.mode === 'opposite') {
            expect(r.cards.filter((c) => opposites(c, r.ask!))).toHaveLength(1);
            expect(r.cards).toHaveLength(3);
          }
          if (plan.mode === 'spot') {
            expect(r.cards).toHaveLength(5);
            const matched = r.cards.filter((c) => r.cards.some((o) => opposites(o, c)));
            expect(matched).toHaveLength(2);
            expect(r.cards.filter((c) => !matched.includes(c))).toHaveLength(3);
          }
          if (plan.mode === 'pairs') {
            expect(r.cards).toHaveLength(6);
            for (const c of r.cards) expect(r.cards.filter((o) => opposites(o, c))).toHaveLength(1);
          }
        }
      }
    }
  });

  it("gives the ghost finger's bot only right taps, and clears every round: one card, the one named, the opposite, or each pair in turn", () => {
    for (const plan of PLANS) {
      for (let seed = 1; seed <= 100; seed++) {
        for (const r of makeRounds(plan, new Rng(seed))) {
          const done = r.cards.map(() => false);
          let picked: number | null = null;
          let taps = 0;
          for (let i = cardToTap(plan, r, done, picked); i !== null; i = cardToTap(plan, r, done, picked)) {
            expect(++taps).toBeLessThanOrEqual(6);
            expect(done[i]).toBe(false);
            if (plan.mode === 'find') expect(word(r.cards[i])).toBe(word(r.ask!));
            if (plan.mode === 'opposite') expect(opposites(r.cards[i], r.ask!)).toBe(true);
            if (plan.mode === 'pairs' || plan.mode === 'spot') {
              if (picked === null) picked = i;
              else {
                expect(opposites(r.cards[picked], r.cards[i])).toBe(true);
                done[picked] = done[i] = true;
                picked = null;
                if (plan.mode === 'spot') break;
              }
              continue;
            }
            // One right tap clears the round: the game moves on to the next one, so the bot is not asked again.
            done.fill(true);
            break;
          }
          expect(taps).toBe(plan.mode === 'pairs' ? 6 : plan.mode === 'spot' ? 2 : 1);
          if (plan.mode !== 'spot') expect(done.every(Boolean)).toBe(true);
        }
      }
    }
  });

  it('level 7, In between: pre-K steps 5 to 7, only gradable words, one middle, and the bot taps it', () => {
    expect(planFor(BETWEEN_LEVEL)).toBe(BETWEEN_PLAN);
    expect(BETWEEN_PLAN).toMatchObject({ level: 7, mode: 'between', rounds: 4 });
    expect(levelsInOrder(LEVELS.prek!)).toEqual([3, 4, 5, BETWEEN_LEVEL]);
    expect(stepLevel(5, 1, LEVELS.prek!)).toBe(BETWEEN_LEVEL);
    for (const band of ['lap', 'toddler', 'preschool'] as const)
      expect(levelsInOrder(LEVELS[band]!)).not.toContain(BETWEEN_LEVEL);
    // Only words with a real middle; never size (Size Parade), open/closed, on/off or awake/asleep.
    expect(GRADABLE.sort()).toEqual(['cup', 'height', 'sky', 'temp']);
    const all = [...CONCEPT_IDS.flatMap((c) => [...CONCEPTS[c].words]), ...Object.values(MIDDLES)];
    expect(new Set(all).size).toBe(all.length);
    for (const line of ['opp.between', 'opp.notbetween', 'opp.isbetween'] as const)
      expect(SCRIPT[line]).toBeDefined();
    const lefts = new Set<number>();
    for (let seed = 1; seed <= 200; seed++) {
      const rounds = makeRounds(BETWEEN_PLAN, new Rng(seed));
      expect(rounds).toEqual(makeRounds(BETWEEN_PLAN, new Rng(seed)));
      // Each gradable word once per round of four.
      expect(rounds.map((r) => r.cards[0].concept).sort()).toEqual([...GRADABLE].sort());
      for (const r of rounds) {
        expect(r.cards).toHaveLength(3);
        expect(new Set(r.cards.map((c) => c.concept))).toEqual(new Set([r.ask!.concept]));
        expect(r.ask!.mid).toBeUndefined();
        // Exactly one middle; the two ends are opposites, so the true order is end, middle, end.
        const mids = r.cards.filter((c) => c.mid);
        expect(mids).toHaveLength(1);
        const ends = r.cards.filter((c) => !c.mid);
        expect(opposites(ends[0], ends[1])).toBe(true);
        for (const c of r.cards) expect(opposites(c, mids[0])).toBe(false);
        expect(r.cards.map((c) => degree(c, r.ask!.side)).sort()).toEqual([0, 1, 2]);
        expect(word(mids[0])).toBe(MIDDLES[r.ask!.concept as keyof typeof MIDDLES]);
        // In their true order, the end named first on the left: the middle stands between the ends.
        expect(r.cards.map((c) => degree(c, r.ask!.side))).toEqual([0, 1, 2]);
        expect(r.cards[0]).toEqual(r.ask);
        lefts.add(r.ask!.side);
        const i = cardToTap(BETWEEN_PLAN, r, [false, false, false], null);
        expect(r.cards[i!].mid).toBe(true);
      }
    }
    // Either end can be named first and stand on the left (empty to full, or full to empty).
    expect([...lefts].sort()).toEqual([0, 1]);
  });
});
