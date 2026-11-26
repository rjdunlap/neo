import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { SCRIPT } from '../../content/voice-script';
import { firstLevel, landing, levelsInOrder, stepLevel } from '../../progress/difficulty';
import {
  BETWEEN_LEVEL,
  BETWEEN_PLAN,
  ORDER_LEVEL,
  ORDER_PLAN,
  inTurn,
  GRADABLE,
  MIDDLES,
  degree,
  BIG_LEVEL,
  ONE_PAIR_LEVEL,
  ONE_PAIR_PLAN,
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
  WORD_LEVEL,
  WORD_PLAN,
  UN_CONCEPTS,
  UN_LEVEL,
  UN_PLAN,
  TWO,
  TWO_DECOYS,
  TWO_LEVEL,
  TWO_PLAN,
  TWO_WORDS,
  unParts,
  word,
} from './logic';

describe('Opposites', () => {
  it('level 6 opens lap with one big card: each of the eight lap pairs once, one card per touch', () => {
    expect(planFor(BIG_LEVEL)).toBe(BIG_PLAN);
    expect(BIG_PLAN).toMatchObject({ level: 6, mode: 'switch', big: true, rounds: 8 });
    expect(levelsInOrder(LEVELS.lap!)).toEqual([ONE_PAIR_LEVEL, BIG_LEVEL, 1]);
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

  it('level 12 opens lap below level 6: four flips of one pair, the same friend, sides alternating', () => {
    expect(planFor(ONE_PAIR_LEVEL)).toBe(ONE_PAIR_PLAN);
    expect(levelsInOrder(LEVELS.lap!)[0]).toBe(ONE_PAIR_LEVEL);
    expect(stepLevel(ONE_PAIR_LEVEL, 1, LEVELS.lap!)).toBe(BIG_LEVEL);
    expect(landing(ONE_PAIR_LEVEL, LEVELS.toddler!, [BIG_LEVEL, ONE_PAIR_LEVEL])).toBe(1);
    for (const band of ['toddler', 'preschool', 'prek', 'school'] as const)
      expect(levelsInOrder(LEVELS[band]!)).not.toContain(ONE_PAIR_LEVEL);
    const seen = new Set<string>();
    for (let seed = 1; seed <= 200; seed++) {
      const rounds = makeRounds(ONE_PAIR_PLAN, new Rng(seed));
      expect(rounds).toHaveLength(4);
      const cards = rounds.map((r) => r.cards[0]);
      expect(new Set(cards.map((c) => c.concept)).size).toBe(1);
      expect(new Set(cards.map((c) => c.who)).size).toBe(1);
      expect(['size', 'temp']).toContain(cards[0].concept);
      cards.forEach((c, i) => i && expect(c.side).not.toBe(cards[i - 1].side));
      for (const r of rounds) {
        expect(r.cards).toHaveLength(1);
        expect(r.ask).toBeUndefined();
        expect(cardToTap(ONE_PAIR_PLAN, r, [false], null)).toBe(0);
      }
      seen.add(`${cards[0].concept}${cards[0].side}${cards[0].who ?? ''}`);
    }
    expect(seen.size).toBeGreaterThan(4);
  });

  it('keeps spoken words unique and the lap pool at its original eight pairs', () => {
    const words = CONCEPT_IDS.flatMap((c) => [...CONCEPTS[c].words]);
    expect(new Set(words).size).toBe(words.length);
    expect(poolFor(1)).toEqual(['size', 'mood', 'height', 'lid', 'cup', 'temp', 'sky', 'speed']);
    expect(poolFor(2)).toEqual(CONCEPT_IDS.filter((c) => CONCEPTS[c].from <= 2));
    expect(poolFor(2)).toHaveLength(12);
    expect(poolFor(3)).toEqual(CONCEPT_IDS.filter((c) => CONCEPTS[c].family !== 'un'));
    expect(poolFor(4)).toHaveLength(16);
    // The un- words enter only at level 10, so no earlier level's pool grows.
    expect(poolFor(WORD_LEVEL)).toEqual(poolFor(3));
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
    expect(levelsInOrder(LEVELS.prek!)).toEqual([3, 4, 5, BETWEEN_LEVEL, ORDER_LEVEL]);
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

  it('level 8, Line them up: pre-K steps 7 to 8, the three shuffled, both directions fair, and only a prefix of the true order is accepted', () => {
    expect(planFor(ORDER_LEVEL)).toBe(ORDER_PLAN);
    expect(ORDER_PLAN).toMatchObject({ level: 8, mode: 'order', rounds: 4 });
    expect(stepLevel(BETWEEN_LEVEL, 1, LEVELS.prek!)).toBe(ORDER_LEVEL);
    expect(LEVELS.prek!.max).toBe(ORDER_LEVEL);
    for (const band of ['lap', 'toddler', 'preschool'] as const)
      expect(levelsInOrder(LEVELS[band]!)).not.toContain(ORDER_LEVEL);
    for (const line of ['opp.order', 'opp.notfirst', 'opp.notnext', 'opp.lined'] as const)
      expect(SCRIPT[line]).toBeDefined();
    const firsts = new Set<string>();
    for (let seed = 1; seed <= 300; seed++) {
      const rounds = makeRounds(ORDER_PLAN, new Rng(seed));
      expect(rounds).toEqual(makeRounds(ORDER_PLAN, new Rng(seed)));
      // Each gradable word once (never size); the end named first alternates, so two rounds each way.
      expect(rounds.map((r) => r.ask!.concept).sort()).toEqual([...GRADABLE].sort());
      expect(rounds.filter((r) => r.ask!.side === 0)).toHaveLength(2);
      rounds.forEach((r, i) => i > 0 && expect(r.ask!.side).not.toBe(rounds[i - 1].ask!.side));
      for (const r of rounds) {
        firsts.add(`${r.ask!.concept}:${r.ask!.side}`);
        expect(r.cards).toHaveLength(3);
        expect(new Set(r.cards.map((c) => c.concept))).toEqual(new Set([r.ask!.concept]));
        expect(r.cards.filter((c) => c.mid)).toHaveLength(1);
        const degrees = r.cards.map((c) => degree(c, r.ask!.side));
        expect([...degrees].sort()).toEqual([0, 1, 2]);
        // Shuffled: never already standing in the asked order.
        expect(degrees).not.toEqual([0, 1, 2]);
        // Every tap sequence: accepted exactly while it follows the true order from the end named first.
        const perms = [
          [0, 1, 2],
          [0, 2, 1],
          [1, 0, 2],
          [1, 2, 0],
          [2, 0, 1],
          [2, 1, 0],
        ];
        for (const seq of perms) {
          let placed = 0;
          for (const k of seq) {
            const ok = inTurn(r, r.cards[k], placed);
            expect(ok).toBe(degrees[k] === placed);
            if (!ok) break;
            placed++;
          }
        }
        // The bot lines them up: fed back its own taps, it clears the round in three right taps.
        const done = [false, false, false];
        for (let step = 0; step < 3; step++) {
          const i = cardToTap(ORDER_PLAN, r, done, null)!;
          expect(inTurn(r, r.cards[i], step)).toBe(true);
          done[i] = true;
        }
        expect(cardToTap(ORDER_PLAN, r, done, null)).toBeNull();
      }
    }
    // Every word is asked both ways across seeds (empty to full, and full to empty).
    expect(firsts.size).toBe(GRADABLE.length * 2);
  });

  it('level 9, Only the word: school opens at 8 and steps to 9; one opposite by its spoken word, no arguable card, and the bot taps it', () => {
    expect(planFor(WORD_LEVEL)).toBe(WORD_PLAN);
    expect(WORD_PLAN.mode).toBe('opposite');
    expect(WORD_PLAN.hidden).toBe(true);
    expect(stepLevel(ORDER_LEVEL, 1, LEVELS.school!)).toBe(WORD_LEVEL);
    // A new school player starts at the window's start, Line them up, shared with pre-K's top.
    expect(firstLevel(LEVELS.school!, [BIG_LEVEL])).toBe(ORDER_LEVEL);
    for (const band of ['lap', 'toddler', 'preschool', 'prek'] as const)
      expect(levelsInOrder(LEVELS[band]!)).not.toContain(WORD_LEVEL);
    // Only the word draws from every pair, so the heard word is never limited to the pictures she already knows.
    const pictures = CONCEPT_IDS.filter((c) => !UN_CONCEPTS.includes(c));
    expect(new Set(poolFor(WORD_LEVEL))).toEqual(new Set(pictures));
    const asked = new Set<string>();
    for (let seed = 1; seed <= 300; seed++) {
      for (const r of makeRounds(WORD_PLAN, new Rng(seed))) {
        const heard = word(r.ask!);
        asked.add(heard);
        const opposite = word({ ...r.ask!, side: (1 - r.ask!.side) as 0 | 1 });
        // Heard alone, the word has one answer by its spoken word: exactly one card says the opposite.
        expect(r.cards.filter((c) => word(c) === opposite)).toHaveLength(1);
        expect(r.cards.filter((c) => opposites(c, r.ask!))).toHaveLength(1);
        // No card shares the heard word's family (tall next to "small" would be arguable) or says the word itself.
        const family = CONCEPTS[r.ask!.concept].family;
        expect(r.cards.filter((c) => CONCEPTS[c.concept].family === family)).toHaveLength(1);
        expect(r.cards.some((c) => word(c) === heard)).toBe(false);
        // The picture revealed after the first miss is the ask's own: the same concept and side as the word heard.
        expect(CONCEPTS[r.ask!.concept].words[r.ask!.side]).toBe(heard);
        // The bot's tap is unchanged: the opposite, in one tap.
        const i = cardToTap(WORD_PLAN, r, [false, false, false], null)!;
        expect(opposites(r.cards[i], r.ask!)).toBe(true);
      }
    }
    // Across seeds every word of every pair is heard.
    expect(asked.size).toBe(pictures.length * 2);
    expect(SCRIPT['opp.heard']).toBeDefined();
  });

  it('level 10, Un- words: school steps 9 to 10; every pair is a word and un + that word, the un- one asked, and the bot taps it', () => {
    expect(planFor(UN_LEVEL)).toBe(UN_PLAN);
    expect(UN_PLAN).toMatchObject({ level: 10, mode: 'un', rounds: 4 });
    expect(levelsInOrder(LEVELS.school!)).toEqual([ORDER_LEVEL, WORD_LEVEL, UN_LEVEL, TWO_LEVEL]);
    expect(stepLevel(WORD_LEVEL, 1, LEVELS.school!)).toBe(UN_LEVEL);
    expect(firstLevel(LEVELS.school!, [BIG_LEVEL])).toBe(ORDER_LEVEL);
    for (const band of ['lap', 'toddler', 'preschool', 'prek'] as const)
      expect(levelsInOrder(LEVELS[band]!)).not.toContain(UN_LEVEL);
    // Only reversible words a picture can show done and undone; happy/unhappy stays out ("happy" is the mood pair's).
    expect([...UN_CONCEPTS].sort()).toEqual(['button', 'fold', 'lock', 'tie', 'wrap', 'zip']);
    for (const c of UN_CONCEPTS) {
      const [base, un] = CONCEPTS[c].words;
      expect(un).toBe(`un${base}`);
      expect(unParts(c)).toEqual(['un', base]);
      expect(CONCEPTS[c].from).toBe(UN_LEVEL);
    }
    for (const line of ['opp.un', 'opp.notun', 'opp.isun'] as const) expect(SCRIPT[line]).toBeDefined();
    const asked = new Set<string>();
    for (let seed = 1; seed <= 300; seed++) {
      const rounds = makeRounds(UN_PLAN, new Rng(seed));
      expect(rounds).toEqual(makeRounds(UN_PLAN, new Rng(seed)));
      expect(rounds).toHaveLength(4);
      // Four different words a round.
      expect(new Set(rounds.map((r) => r.ask!.concept)).size).toBe(4);
      for (const r of rounds) {
        expect(UN_CONCEPTS).toContain(r.ask!.concept);
        // The two cards are the word and its un- word, and the un- one is asked for: exactly one card says it.
        expect(r.cards).toHaveLength(2);
        expect(new Set(r.cards.map((c) => c.concept))).toEqual(new Set([r.ask!.concept]));
        expect(opposites(r.cards[0], r.cards[1])).toBe(true);
        expect(r.ask!.side).toBe(1);
        expect(word(r.ask!).startsWith('un')).toBe(true);
        expect(r.cards.filter((c) => word(c) === word(r.ask!))).toHaveLength(1);
        asked.add(r.ask!.concept);
        const i = cardToTap(UN_PLAN, r, [false, false], null)!;
        expect(word(r.cards[i])).toBe(word(r.ask!));
      }
    }
    // Every un- word comes up across seeds.
    expect([...asked].sort()).toEqual([...UN_CONCEPTS].sort());
  });

  it('level 11, Two answers: school steps 10 to 11; each word once with exactly two opposites, one picture of itself, one unrelated; the bot taps both', () => {
    expect(planFor(TWO_LEVEL)).toBe(TWO_PLAN);
    expect(TWO_PLAN).toMatchObject({ level: 11, mode: 'two', rounds: 3 });
    expect(levelsInOrder(LEVELS.school!)).toEqual([ORDER_LEVEL, WORD_LEVEL, UN_LEVEL, TWO_LEVEL]);
    expect(stepLevel(UN_LEVEL, 1, LEVELS.school!)).toBe(TWO_LEVEL);
    for (const band of ['lap', 'toddler', 'preschool', 'prek'] as const)
      expect(levelsInOrder(LEVELS[band]!)).not.toContain(TWO_LEVEL);
    expect(TWO_WORDS.sort()).toEqual(['light', 'old', 'short']);
    // The three words, their opposites and the pictures of the word itself stay as authored, with unique spoken words.
    const spoken = TWO_WORDS.flatMap((w) => [w, ...TWO[w].right, ...TWO[w].same]);
    expect(new Set(spoken).size).toBe(spoken.length);
    // No unrelated picture can be read as one of the words: none shares a family with the pairs level 11's words overlap.
    for (const d of TWO_DECOYS)
      expect(['size', 'container', 'sky', 'lamp', 'position']).not.toContain(CONCEPTS[d].family);
    const seen = new Set<string>();
    for (let seed = 1; seed <= 25; seed++) {
      const rounds = makeRounds(TWO_PLAN, new Rng(seed));
      expect(rounds).toEqual(makeRounds(TWO_PLAN, new Rng(seed)));
      expect(rounds).toHaveLength(3);
      expect(new Set(rounds.map((r) => r.ask!.two!.w)).size).toBe(3);
      for (const r of rounds) {
        const w = r.ask!.two!.w;
        expect(r.cards).toHaveLength(4);
        const right = r.cards.filter((c) => c.two?.kind === 'right');
        expect(right.map((c) => word(c)).sort()).toEqual([...TWO[w].right].sort());
        expect(r.cards.filter((c) => c.two?.kind === 'same')).toHaveLength(1);
        const loose = r.cards.filter((c) => !c.two);
        expect(loose).toHaveLength(1);
        expect(TWO_DECOYS).toContain(loose[0].concept);
        // The bot taps one opposite, then the other, never the picture of the word itself.
        const done = r.cards.map(() => false);
        for (let n = 0; n < 2; n++) {
          const i = cardToTap(TWO_PLAN, r, done, null)!;
          expect(r.cards[i].two?.kind).toBe('right');
          done[i] = true;
        }
        expect(cardToTap(TWO_PLAN, r, done, null)).toBeNull();
        seen.add(word(r.cards.find((c) => c.two?.kind === 'same')!));
      }
    }
    // Both pictures of each word itself come up across seeds.
    expect([...seen].sort()).toEqual(TWO_WORDS.flatMap((w) => [...TWO[w].same]).sort());
  });
});
