import type { LineId } from './voice-script';
import type { WoodlandStep } from './world';

/**
 * The Woodland Picnic, the second Island Errands story, for the school band in Wonder Woods. Hazel the squirrel
 * postkeeper is throwing a picnic and asks for three jobs, in any order, each an ordinary round of a game she knows:
 *
 * - **invitations**, Mail Carrier 6: the Wonder Woods picture map, a letter to each friend.
 * - **baskets**, Seesaw Balance 7: two identical boxes, weighed to pack two baskets the same.
 * - **beat**, Beat Builder 3: copy a beat by ear on the picnic stage.
 *
 * Finishing a round completes its step whatever its misses and hints. The round's result carries only misses and
 * hints, so each consequence in the clearing is a fixed picture, and the ending plays the stated `PICNIC_BEAT`,
 * not her copy. Every level is in its game's `school` range (a test reads the game's own levels).
 */
export interface WoodlandGameStep {
  id: WoodlandStep;
  game: string;
  level: number;
}

export const WOODLAND_GAME_STEPS: WoodlandGameStep[] = [
  { id: 'invitations', game: 'mail-carrier', level: 6 },
  { id: 'baskets', game: 'seesaw-balance', level: 7 },
  { id: 'beat', game: 'beat-builder', level: 3 },
];

/** The band the story belongs to; its spot is only on that band's home spot, Wonder Woods. */
export const WOODLAND_BAND = 'school' as const;

export const woodlandLine: Record<WoodlandStep, { ask: LineId; done: LineId; recap: LineId }> = {
  invitations: { ask: 'woodland.invitations', done: 'woodland.invitations-done', recap: 'woodland.invitations-recap' },
  baskets: { ask: 'woodland.baskets', done: 'woodland.baskets-done', recap: 'woodland.baskets-recap' },
  beat: { ask: 'woodland.beat', done: 'woodland.beat-done', recap: 'woodland.beat-recap' },
};

/** The friends the invitations go to, one house each on the clearing's edge (critter names). */
export const WOODLAND_FRIENDS = ['bear', 'bunny', 'duck'] as const;

/** The picnic beat, eight steps long: a drum, a bell (on a pentatonic step) or a rest. It plays when the friends arrive. */
export type BeatHit = { drum: true } | { bell: number } | null;
export const PICNIC_BEAT: BeatHit[] = [{ drum: true }, null, { bell: 7 }, null, { drum: true }, { drum: true }, { bell: 9 }, null];
