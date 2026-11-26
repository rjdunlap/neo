import { FORMS, FORM_FLOWER, formSpecies, type FormId } from '../creatures/forms';
import { MAX_CREATURES } from '../creatures/species';
import type { Band } from '../progress/bands';
import type { SaveData } from '../progress/save';
import { mixedColors } from './journal';
import { newcomerFor, showsContinue, welcomeFriend } from './welcome';
import { MIXED_COLORS, type MixedColor } from './world';

type GoalSave = Pick<SaveData, 'projects' | 'creatures' | 'journal'>;

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

/** The band where Paint Mixer's paint shelf (level 5) plays. */
const PAINT_SHELF_BAND: Band = 'school';

export interface ColourGoal {
  id: `colour:${MixedColor}`;
  kind: 'colour';
  colour: MixedColor;
  reachable(save: GoalSave, band: Band): boolean;
  done(save: GoalSave): boolean;
  path: { game: 'paint-mixer'; level: 5; recipe: MixedColor };
}

/**
 * One goal per paint-shelf colour (RW10 slice 2): mixed at Paint Mixer level 5 with that recipe requested, done once the
 * journal holds the colour (help included), and then a colour a friend can wear in Dress.
 */
export const COLOUR_GOALS: readonly ColourGoal[] = MIXED_COLORS.map((colour) => ({
  id: `colour:${colour}`,
  kind: 'colour',
  colour,
  reachable: (_save, band) => band === PAINT_SHELF_BAND,
  done: (save) => mixedColors(save.journal).includes(colour),
  path: { game: 'paint-mixer', level: 5, recipe: colour },
}));

/** The bands whose book shows a form goal: Garden Grow's rain-and-bloom level 2 is the path (preschool and pre-K, RW11). */
const FORM_BANDS: readonly Band[] = ['preschool', 'prek'];

export interface FormGoal {
  id: `form:${FormId}`;
  kind: 'form';
  form: FormId;
  reachable(save: GoalSave, band: Band): boolean;
  done(save: GoalSave): boolean;
  path: { game: 'garden-grow'; level: 2; flower: string };
}

/**
 * One goal per blossom (RW11 slice 2): reachable at preschool and pre-K for a profile with a sprout and without the form,
 * done (derived, never stored) once `creatures.forms` holds it. Both blossoms stay offered until each is grown.
 */
export const FORM_GOALS: readonly FormGoal[] = FORMS.map((form) => ({
  id: `form:${form}` as const,
  kind: 'form',
  form,
  reachable: (save, band) =>
    FORM_BANDS.includes(band) &&
    !save.creatures.forms.includes(form) &&
    save.creatures.owned.some((who) => who.species === formSpecies(form)),
  done: (save) => save.creatures.forms.includes(form),
  path: { game: 'garden-grow', level: 2, flower: FORM_FLOWER[form] },
}));

export type Goal = typeof WELCOME_GOAL | ColourGoal | FormGoal;
export const GOALS: readonly Goal[] = [WELCOME_GOAL, ...COLOUR_GOALS, ...FORM_GOALS];
export type GoalId = Goal['id'];

export const isGoalId = (value: unknown): value is GoalId => GOALS.some((goal) => goal.id === value);
