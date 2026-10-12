import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { repairPuzzle, repairMove, swapPictures, CAUSES, CAUSE_IDS, causePuzzle, LEVEL_PLANS, isCause, pictureText, nextPicture, nextSlot, sameCard, STORIES, STORY_FAMILY, STORY_IDS, STORY_PLANS, storyPuzzle, type StoryCard } from './logic';

describe('Story Steps', () => {
  it('lays out a story in order, with every picture it needs among the choices and any extras from another story', () => {
    for (const plan of STORY_PLANS) {
      for (let seed = 1; seed <= 100; seed++) {
        const puzzle = storyPuzzle(plan, new Rng(seed));
        expect(puzzle.sequence).toHaveLength(plan.count);
        expect(puzzle.choices).toHaveLength(plan.count - puzzle.fixed.length + plan.distractors);
        for (const [i, card] of puzzle.sequence.entries()) {
          if (!puzzle.fixed.includes(i)) expect(puzzle.choices.some((c) => sameCard(c, card))).toBe(true);
        }
        const extras = puzzle.choices.filter((c) => !puzzle.sequence.some((s) => sameCard(s, c)));
        expect(extras).toHaveLength(plan.distractors);
        for (const e of extras) expect(e.story).not.toBe(puzzle.story);
        for (const c of puzzle.sequence) expect(pictureText(c)).toBeTruthy();
      }
    }
  });

  it('has a bot that finishes the story in order, never picks a picture from another story, and so makes no miss (what the ghost finger plays)', () => {
    for (const plan of LEVEL_PLANS) {
      for (let seed = 1; seed <= 100; seed++) {
        const puzzle = storyPuzzle(plan, new Rng(seed));
        const placed = new Set<number>(puzzle.fixed);
        const choices = puzzle.choices.map((card) => ({ card, placed: false }));
        let moves = 0;
        for (let next = nextPicture(puzzle.sequence, placed, choices); next; next = nextPicture(puzzle.sequence, placed, choices)) {
          // The game accepts a picture only for the first empty slot, and only if it is that slot's own picture.
          expect(next.slot).toBe(nextSlot(puzzle.sequence, placed));
          expect(sameCard(next.choice.card, puzzle.sequence[next.slot] as StoryCard), `${plan.name} seed ${seed}`).toBe(true);
          placed.add(next.slot);
          next.choice.placed = true;
          moves++;
        }
        expect(placed.size).toBe(plan.count);
        expect(moves).toBe(plan.count - puzzle.fixed.length);
        // Pictures from the other story were left alone.
        expect(choices.filter((c) => !c.placed)).toHaveLength('kind' in plan ? 2 : plan.distractors);
      }
    }
  });

  it('offers exactly one plausible cause, with three distinct choices, a shown effect and a reachable hint', () => {
    const seen = new Set<string>();
    expect(CAUSE_IDS).toHaveLength(8);
    for (let seed = 1; seed <= 300; seed++) {
      const p = causePuzzle(new Rng(seed));
      expect(causePuzzle(new Rng(seed))).toEqual(p);
      seen.add(p.cause);
      expect(p.fixed).toEqual([1]);
      expect(p.sequence).toEqual([{ story: p.cause, stage: 0 }, { story: p.cause, stage: 1 }]);
      expect(p.choices).toHaveLength(3);
      expect(new Set(p.choices.map((c) => c.story)).size).toBe(3);
      const plausible = CAUSES[p.cause].plausible as readonly string[];
      for (const id of plausible) expect(CAUSE_IDS).toContain(id);
      expect(p.choices.every((c) => c.stage === 0)).toBe(true);
      const answers = p.choices.filter((c) => plausible.includes(c.story));
      expect(answers).toEqual([{ story: p.cause, stage: 0 }]);
      const hint = nextPicture(p.sequence, new Set(p.fixed), p.choices.map((card) => ({ card, placed: false })));
      expect(hint?.choice.card).toEqual(answers[0]);
      expect(hint?.slot).toBe(0);
      for (const card of [...p.sequence, ...p.choices]) {
        expect(isCause(card.story)).toBe(true);
        expect(pictureText(card)).toMatch(/^[A-Z].*[.!?]$/);
      }
      expect(CAUSES[p.cause].because).toContain('because');
    }
    expect([...seen].sort()).toEqual([...CAUSE_IDS].sort());
  });

  it('has ten stories, each a real sequence of four different, spoken sentences', () => {
    expect(STORY_IDS).toHaveLength(10);
    for (const id of STORY_IDS) {
      const { name, steps } = STORIES[id];
      expect(steps, id).toHaveLength(4);
      expect(new Set(steps).size, id).toBe(4);
      for (const step of steps) expect(step, `${id}: ${step}`).toMatch(/^[A-Z].*[.!?]$/);
      // The title is spoken as "{name}!", so it needs no ending of its own and no stray punctuation.
      expect(name, id).toMatch(/^[A-Z][A-Za-z ]+$/);
      expect(STORY_FAMILY[id], id).toBeTruthy();
    }
    expect(new Set(STORY_IDS.map((id) => STORIES[id].name)).size).toBe(10);
  });

  it('draws every level from a non-empty pool of known stories, and the youngest levels from building stories only', () => {
    for (const plan of STORY_PLANS) {
      expect(plan.stories.length, plan.name).toBeGreaterThan(0);
      for (const id of plan.stories) expect(STORY_IDS, plan.name).toContain(id);
    }
    for (const plan of STORY_PLANS.slice(0, 2)) {
      for (const id of plan.stories) expect(['stack', 'seed']).toContain(STORY_FAMILY[id]);
    }
    for (const id of STORY_PLANS[0].stories) expect(STORY_FAMILY[id], 'level 1 is enabling orders only').toBe('stack');
    // Every story is told somewhere below the last levels, and each of the ten shows up in the full-pool levels.
    for (const id of STORY_IDS) expect(STORY_PLANS.some((plan) => (plan.stories as readonly string[]).includes(id))).toBe(true);
  });

  it('never fills a round with a lookalike: extra pictures are from other families, and a mixed round takes its two from two families', () => {
    for (const plan of STORY_PLANS) {
      const seen = new Set<string>();
      for (let seed = 1; seed <= 150; seed++) {
        const puzzle = storyPuzzle(plan, new Rng(seed));
        seen.add(puzzle.story);
        expect(plan.stories, `${plan.name} seed ${seed}`).toContain(puzzle.story);
        const extras = puzzle.choices.filter((c) => !puzzle.sequence.some((s) => sameCard(s, c)));
        for (const e of extras) expect(STORY_FAMILY[e.story], `${plan.name} seed ${seed}`).not.toBe(STORY_FAMILY[puzzle.story]);
        if (plan.mixed) {
          expect(extras).toHaveLength(2);
          expect(STORY_FAMILY[extras[0].story]).not.toBe(STORY_FAMILY[extras[1].story]);
        }
      }
      // Over many seeds a level shows every story in its pool (not just one or two).
      expect(seen.size, plan.name).toBe(plan.stories.length);
    }
  });
});

describe('Story Steps repair', () => {
  it('opens with exactly one reversed neighboring pair, draws every story, and is seeded', () => {
    const seen = new Set<string>();
    const pairs = new Set<number>();
    for (let seed = 1; seed <= 300; seed++) {
      const puzzle = repairPuzzle(new Rng(seed));
      expect(repairPuzzle(new Rng(seed))).toEqual(puzzle);
      seen.add(puzzle.story);
      expect(puzzle.sequence.map((c) => c.stage)).toEqual([0, 1, 2, 3]);
      expect(puzzle.strip.every((c) => c.story === puzzle.story)).toBe(true);
      const move = repairMove(puzzle.sequence, puzzle.strip)!;
      expect(move).not.toBeNull();
      expect(move[1]).toBe(move[0] + 1);
      pairs.add(move[0]);
      expect(swapPictures(puzzle.strip, ...move)).toEqual(puzzle.sequence);
      expect(puzzle.strip.filter((c, i) => !sameCard(c, puzzle.sequence[i]))).toHaveLength(2);
    }
    expect([...seen].sort()).toEqual([...STORY_IDS].sort());
    expect([...pairs].sort()).toEqual([0, 1, 2]);
  });
  it('gives useful hints and a bot solution within three swaps from every possible four-picture order', () => {
    const permutations = (values: number[]): number[][] => values.length === 0 ? [[]] : values.flatMap((v) => permutations(values.filter((x) => x !== v)).map((tail) => [v, ...tail]));
    for (const story of STORY_IDS) {
      const sequence = [0, 1, 2, 3].map((stage) => ({ story, stage }));
      for (const order of permutations([0, 1, 2, 3])) {
        let strip: StoryCard[] = order.map((i) => sequence[i]);
        let swaps = 0;
        for (let move = repairMove(sequence, strip); move; move = repairMove(sequence, strip)) {
          expect(sameCard(strip[move[0]], sequence[move[0]])).toBe(false);
          expect(sameCard(strip[move[1]], sequence[move[0]])).toBe(true);
          const wrongBefore = strip.filter((c, i) => !sameCard(c, sequence[i])).length;
          const previous = [...strip];
          strip = swapPictures(strip, ...move);
          expect(swapPictures(strip, ...move)).toEqual(previous); // undo restores the exact experiment
          expect(strip.filter((c, i) => !sameCard(c, sequence[i])).length).toBeLessThan(wrongBefore);
          expect(++swaps).toBeLessThanOrEqual(3);
        }
        expect(strip).toEqual(sequence);
      }
    }
  });
});
