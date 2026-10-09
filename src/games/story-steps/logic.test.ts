import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { nextPicture, nextSlot, sameCard, STORIES, STORY_PLANS, storyPuzzle, type StoryCard } from './logic';

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
});
