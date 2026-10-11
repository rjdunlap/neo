import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { CONCEPTS, CONCEPT_IDS, SUBJECTS, STICKER_CONCEPTS, poolFor, cardToTap, makeRounds, opposites, PLANS, word } from './logic';

describe('Opposites', () => {
  it('keeps spoken words unique and the lap pool at its original eight pairs', () => {
    const words = CONCEPT_IDS.flatMap((c) => [...CONCEPTS[c].words]);
    expect(new Set(words).size).toBe(words.length);
    expect(poolFor(1)).toEqual(['size', 'mood', 'height', 'lid', 'cup', 'temp', 'sky', 'speed']);
    expect(poolFor(2)).toEqual(CONCEPT_IDS);
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
          if (plan.mode === 'opposite' || plan.mode === 'pairs')
            expect(new Set(concepts.map((c) => CONCEPTS[c].family)).size).toBe(concepts.length);
        }
      }
      expect([...seen].sort()).toEqual([...pool].sort());
    }
  });

  it('varies every eligible subject and keeps both sides of a pair on the same animal', () => {
    const seen = { size: new Set<string>(), mood: new Set<string>() };
    for (const plan of PLANS) for (let seed = 1; seed <= 200; seed++) {
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
    for (const concept of ['size', 'mood'] as const) expect([...seen[concept]].sort()).toEqual([...SUBJECTS[concept]].sort());
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
            if (plan.mode === 'pairs') {
              if (picked === null) picked = i;
              else {
                expect(opposites(r.cards[picked], r.cards[i])).toBe(true);
                done[picked] = done[i] = true;
                picked = null;
              }
              continue;
            }
            // One right tap clears the round: the game moves on to the next one, so the bot is not asked again.
            done.fill(true);
            break;
          }
          expect(taps).toBe(plan.mode === 'pairs' ? 6 : 1);
          expect(done.every(Boolean)).toBe(true);
        }
      }
    }
  });
});
