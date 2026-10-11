import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { nextPicture, nextSlot, sameCard, STORIES, STORY_FAMILY, STORY_IDS, STORY_PLANS, storyPuzzle, type StoryCard } from './logic';

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
        for (const c of puzzle.sequence) expect(STORIES[c.story].steps[c.stage]).toBeTruthy();
      }
    }
  });

  it('has a bot that finishes the story in order, never picks a picture from another story, and so makes no miss (what the ghost finger plays)', () => {
    for (const plan of STORY_PLANS) {
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
        expect(choices.filter((c) => !c.placed)).toHaveLength(plan.distractors);
      }
    }
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
