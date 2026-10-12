import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { pictureText, sameCard } from './logic';
import { PREDICTIONS, predictionCard, predictionFeedback, predictionPuzzle } from './predictions';
import { storySteps } from './index';

describe('Story Steps clue endings', () => {
  it('authors eight distinct clues with three narrated pictures and two distinct, possible endings', () => {
    expect(PREDICTIONS).toHaveLength(8);
    expect(new Set(PREDICTIONS.map((s) => s.id)).size).toBe(8);
    for (const p of PREDICTIONS) {
      expect(p.opening).toHaveLength(3); expect(p.stages).toHaveLength(3);
      expect(p.endings).toHaveLength(2); expect(new Set(p.endings).size).toBe(2);
      expect(p.clue.length).toBeGreaterThan(8); expect(p.reason.length).toBeGreaterThan(20);
      expect(sameCard(predictionCard(p, 0), predictionCard(p, 1))).toBe(false);
      for (const c of [predictionCard(p, 0), predictionCard(p, 1)]) expect(pictureText(c)).toBeTruthy();
      for (const sentence of [...p.opening, ...p.endings, p.reason]) expect(sentence).toMatch(/^[A-Z].*[.!]$/);
    }
  });
  it('seeded draws cover every authored story, shuffle both sides, and contain exactly one supported ending', () => {
    const seen = new Set<string>(), sides = new Set<number>();
    for (let seed = 1; seed <= 200; seed++) {
      const p = predictionPuzzle(new Rng(seed));
      expect(predictionPuzzle(new Rng(seed))).toEqual(p);
      expect([...p.choices].sort()).toEqual([0, 1]);
      expect(p.choices.filter((e) => predictionFeedback(e, 0).complete)).toHaveLength(1);
      seen.add(p.story.id); sides.add(p.choices.indexOf(p.supported));
    }
    expect(seen.size).toBe(8); expect(sides.size).toBe(2);
  });
  it('does not penalize a first experiment, counts repeated unsupported choices, and records assistance once', () => {
    expect(predictionFeedback(1, 0)).toEqual({ complete: false, miss: false, hint: false });
    expect(predictionFeedback(1, 1)).toEqual({ complete: false, miss: true, hint: true });
    expect(predictionFeedback(1, 2)).toEqual({ complete: false, miss: true, hint: false });
    for (let attempts = 0; attempts < 10; attempts++) expect(predictionFeedback(0, attempts)).toEqual({ complete: true, miss: false, hint: false });
  });
  it('appends level 11 without changing younger ranges or existing level meanings', () => {
    expect(storySteps.levels('school')).toEqual({ min: 6, max: 11 });
    expect(storySteps.levels('toddler')).toEqual({ min: 1, max: 2 });
    expect(storySteps.levels('preschool')).toEqual({ min: 2, max: 5 });
    expect(storySteps.levels('prek')).toEqual({ min: 4, max: 8 });
    expect(storySteps.describeLevel(10)).toContain('two'); expect(storySteps.describeLevel(11)).toContain('clue');
  });
});
