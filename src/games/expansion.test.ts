import { describe, expect, it } from 'vitest';
import { Rng } from '../engine/random';
import { BUG_PLANS, BUG_TOKENS, bugPuzzle } from './bug-builder/logic';
import { SIZE_PLANS, sizeOrder, sizeScale } from './size-parade/logic';
import { STORIES, STORY_PLANS, sameCard, storyPuzzle } from './story-steps/logic';

describe('Size Parade', () => {
  it('has distinct visible sizes with a unique answer at every step, in either direction', () => {
    for (const plan of SIZE_PLANS) {
      const order = sizeOrder(plan.count, plan.order);
      expect(new Set(order).size).toBe(plan.count);
      const sizes = order.map((rank) => sizeScale(rank, plan.count));
      for (let i = 1; i < sizes.length; i++) {
        expect(Math.abs(sizes[i] - sizes[i - 1])).toBeGreaterThan(0.14);
        expect(sizes[i] > sizes[i - 1]).toBe(plan.order === 'small');
      }
      expect(Math.min(...sizes)).toBeGreaterThan(0.4);
      expect(Math.max(...sizes)).toBe(1);
    }
  });
});

describe('Bug Builder', () => {
  it('generates solvable models and true horizontal reflections, including both columns', () => {
    for (const plan of BUG_PLANS) for (let seed = 1; seed <= 40; seed++) {
      const { model, targets } = bugPuzzle(plan, new Rng(seed));
      expect(new Set(targets.map((s) => s.token)).size).toBeGreaterThan(1);
      for (const t of targets) {
        expect(t.token).toBeLessThan(plan.colors);
        expect(BUG_TOKENS[t.token]).toBeDefined();
        const sourceX = plan.mode === 'mirror' ? -t.x : t.x;
        expect(model.find((s) => s.x === sourceX && s.y === t.y)?.token).toBe(t.token);
        if (plan.mode === 'mirror') expect(t.x).toBeGreaterThan(0);
        for (const other of targets) if (other !== t) expect(Math.hypot(t.x - other.x, t.y - other.y)).toBeGreaterThan(114);
      }
    }
  });
});

describe('Story Steps', () => {
  it('always offers exactly one card for each missing step and unambiguous distractors', () => {
    const seen = new Set<string>();
    for (const plan of STORY_PLANS) for (let seed = 1; seed <= 50; seed++) {
      const p = storyPuzzle(plan, new Rng(seed)); seen.add(p.story);
      expect(p.sequence).toHaveLength(plan.count);
      expect(new Set(p.choices.map((c) => `${c.story}.${c.stage}`)).size).toBe(p.choices.length);
      p.sequence.forEach((card, i) => {
        expect(STORIES[card.story].steps[card.stage].length).toBeGreaterThan(10);
        expect(p.choices.filter((c) => sameCard(c, card))).toHaveLength(p.fixed.includes(i) ? 0 : 1);
        if (i > 0) expect(card.stage).toBeGreaterThan(p.sequence[i - 1].stage);
      });
      const distractors = p.choices.filter((c) => !p.sequence.some((s) => sameCard(s, c)));
      expect(distractors).toHaveLength(plan.distractors);
      expect(distractors.every((c) => c.story !== p.story)).toBe(true);
    }
    expect([...seen].sort()).toEqual(Object.keys(STORIES).sort());
  });
});
