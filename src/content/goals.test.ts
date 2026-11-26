import { describe, expect, it } from 'vitest';
import { BANDS } from '../progress/bands';
import { defaults, MAX_CREATURES, meetIn, migrate } from '../progress/save';
import { COLOUR_GOALS, FORM_GOALS, GOALS, isGoalId, WELCOME_GOAL } from './goals';
import { RECIPES } from '../games/paint-mixer/logic';
import { MIXED_COLORS } from './world';
import { beginWelcome, showsContinue, WELCOME_MET_AT } from './welcome';

describe('the welcome goal', () => {
  it('uses the open project, including a project started before moving bands', () => {
    const save = defaults();
    for (const { id } of BANDS)
      expect(WELCOME_GOAL.reachable(save, id), id).toBe(showsContinue(save.projects.welcome, id));
    beginWelcome(save.projects.welcome, 'prek', save.creatures.owned);
    expect(WELCOME_GOAL.reachable(save, 'school')).toBe(true);
    save.projects.welcome.ended = true;
    expect(WELCOME_GOAL.reachable(save, 'school')).toBe(false);
  });

  it('matches the project newcomer before and after the project fixes its species', () => {
    const save = defaults();
    expect(WELCOME_GOAL.species(save)).toBe('river');
    meetIn(save.creatures, 'river', 'Ripple', 'orange', 'start', () => 'rivr');
    expect(WELCOME_GOAL.species(save)).toBe('glider');
    beginWelcome(save.projects.welcome, 'prek', save.creatures.owned);
    meetIn(save.creatures, 'glider', 'Wisp', 'purple', 'other', () => 'glid');
    expect(WELCOME_GOAL.species(save)).toBe('glider');
    expect(WELCOME_GOAL.done(save)).toBe(false);
    meetIn(save.creatures, 'glider', 'Breeze', 'purple', WELCOME_MET_AT, () => 'grdn');
    expect(WELCOME_GOAL.done(save)).toBe(true);
  });

  it('hides the path at capacity, where the project cannot adopt', () => {
    const save = defaults();
    for (let i = 0; i < MAX_CREATURES; i++)
      meetIn(save.creatures, 'sprout', 'Pip', 'teal', `test:${i}`, () => `test${i}`);
    expect(save.creatures.owned).toHaveLength(MAX_CREATURES);
    expect(WELCOME_GOAL.reachable(save, 'prek')).toBe(false);
  });

  it('repairs old saves and bad ids and keeps known choices at other bands', () => {
    expect(migrate({ version: 3 }).book).toEqual({ goal: null });
    for (const goal of [1, {}, 'friend:missing', 'colour:red'])
      expect(migrate({ book: { goal } }).book).toEqual({ goal: null });
    expect(migrate({ profile: { band: 'school' }, book: { goal: WELCOME_GOAL.id } }).book.goal).toBe(
      WELCOME_GOAL.id,
    );
  });

  it('has one colour goal per paint-shelf recipe, at school, done exactly when the journal holds the colour', () => {
    expect(COLOUR_GOALS.map((goal) => goal.colour)).toEqual([...MIXED_COLORS]);
    expect(COLOUR_GOALS.map((goal) => goal.path.recipe).sort()).toEqual(RECIPES.map((r) => r.name).sort());
    expect(new Set(GOALS.map((goal) => goal.id)).size).toBe(GOALS.length);
    const save = defaults();
    for (const goal of COLOUR_GOALS) {
      expect(goal.id).toBe(`colour:${goal.colour}`);
      expect(isGoalId(goal.id)).toBe(true);
      expect(goal.path).toEqual({ game: 'paint-mixer', level: 5, recipe: goal.colour });
      for (const { id } of BANDS) expect(goal.reachable(save, id), id).toBe(id === 'school');
      expect(goal.done(save)).toBe(false);
    }
    save.journal.found.push('paint-mixer:peach');
    expect(COLOUR_GOALS.filter((goal) => goal.done(save)).map((goal) => goal.id)).toEqual(['colour:peach']);
    // A chosen colour goal survives repair, at any band.
    expect(migrate({ profile: { band: 'prek' }, book: { goal: 'colour:lilac' } }).book.goal).toBe(
      'colour:lilac',
    );
  });

  it('has one form goal per blossom, at preschool and pre-K, for a profile with a sprout, until it is grown', () => {
    expect(FORM_GOALS.map((goal) => goal.id)).toEqual(['form:sprout:sun', 'form:sprout:moon']);
    expect(FORM_GOALS.map((goal) => goal.path)).toEqual([
      { game: 'garden-grow', level: 2, flower: 'sunflower' },
      { game: 'garden-grow', level: 2, flower: 'tulip' },
    ]);
    const save = defaults();
    for (const goal of FORM_GOALS) expect(isGoalId(goal.id)).toBe(true);
    // No sprout yet: nothing to grow a blossom on.
    for (const { id } of BANDS) for (const goal of FORM_GOALS) expect(goal.reachable(save, id)).toBe(false);
    meetIn(save.creatures, 'sprout', 'Pip', 'teal', 'test:sprout', () => 'sprt');
    for (const { id } of BANDS)
      for (const goal of FORM_GOALS)
        expect(goal.reachable(save, id), id).toBe(id === 'preschool' || id === 'prek');
    // Growing one leaves the other offered, and the grown one is done and no longer offered.
    save.creatures.forms.push('sprout:sun');
    expect(FORM_GOALS.map((goal) => goal.done(save))).toEqual([true, false]);
    expect(FORM_GOALS.map((goal) => goal.reachable(save, 'prek'))).toEqual([false, true]);
    expect(migrate({ profile: { band: 'prek' }, book: { goal: 'form:sprout:moon' } }).book.goal).toBe(
      'form:sprout:moon',
    );
  });

  it('keeps the goal table out of game results', () => {
    const files = import.meta.glob<string>(
      ['../app/scenes/GameScene.ts', '../app/result-layout.ts', '../app/origin.ts', '../ui/origin-art.ts'],
      { query: '?raw', import: 'default', eager: true },
    );
    expect(Object.keys(files)).toHaveLength(4);
    for (const [file, source] of Object.entries(files))
      expect(source, file).not.toMatch(/(?:content\/goals|creatures\/book-layout|BookScene)/);
  });
});
