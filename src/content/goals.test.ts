import { describe, expect, it } from 'vitest';
import { BANDS } from '../progress/bands';
import { defaults, MAX_CREATURES, meetIn, migrate } from '../progress/save';
import { WELCOME_GOAL } from './goals';
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
