import { MAX_CREATURES } from '../creatures/species';
import type { Band } from '../progress/bands';
import type { SaveData } from '../progress/save';
import { newcomerFor, showsContinue, welcomeFriend } from './welcome';

type GoalSave = Pick<SaveData, 'projects' | 'creatures'>;

/** Goals name a built path and read its outcome directly from the profile. */
export const WELCOME_GOAL = {
  id: 'friend:welcome',
  kind: 'friend',
  reachable: (save: GoalSave, band: Band) =>
    save.creatures.owned.length < MAX_CREATURES && showsContinue(save.projects.welcome, band),
  done: (save: GoalSave) => welcomeFriend(save.creatures.owned) !== null,
  species: (save: GoalSave) =>
    welcomeFriend(save.creatures.owned)?.species ??
    save.projects.welcome.newcomer ??
    newcomerFor(save.creatures.owned),
  path: { project: true },
} as const;

export const GOALS = [WELCOME_GOAL] as const;
export type Goal = (typeof GOALS)[number];
export type GoalId = Goal['id'];

export const isGoalId = (value: unknown): value is GoalId => GOALS.some((goal) => goal.id === value);
