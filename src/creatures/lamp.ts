import type { FormId } from './forms';
import type { SpeciesId } from './species';

/**
 * RW11 slice 3 (docs/rework/FORMS-AND-TALENTS.md#the-talent-the-sun-and-moon-switch): how her friend answers the lamp in
 * creature play. Pixi-free, so a test holds the table. Every friend answers; nothing here is a prize or an action a game needs.
 *
 * - `glow`: a moon blossom opens in the evening and lights a circle of floor; it closes by day.
 * - `fold`: a sun blossom's petals fold in the evening and open wide by day.
 * - `rest`: any other friend (the plain sprout, the river, the glider) is sleepy in the evening and hops happily by day.
 */
export type LampAnswer = 'glow' | 'fold' | 'rest';

export function lampAnswer(species: SpeciesId, form: FormId | null): LampAnswer {
  if (species === 'sprout' && form === 'sprout:moon') return 'glow';
  if (species === 'sprout' && form === 'sprout:sun') return 'fold';
  return 'rest';
}

/** The blossom's scale for the room's light: the moon bud opens a little in the evening, the sun's petals fold in. */
export function blossomScale(answer: LampAnswer, evening: boolean): number {
  if (answer === 'glow') return evening ? 1.3 : 1;
  if (answer === 'fold') return evening ? 0.5 : 1;
  return 1;
}

/** The evening's dimming over the room, as the overlay's alpha: the room is never darker than a dusk. */
export const EVENING_ALPHA = 0.5;
