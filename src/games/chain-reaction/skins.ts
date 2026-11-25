import type { ChainPlan } from './logic';

/**
 * What rides the machine and where it lands. Same board, same rule: only the picture and the words change, so a
 * machine can be a marble to a bell, an acorn to a squirrel's bowl or a duckling to the pond.
 */
export type SkinId = 'marble' | 'acorn' | 'duckling';

export interface Skin {
  id: SkinId;
  /** What rides down the ramps, as the voice says it ("the marble"). */
  cargo: string;
  /** Where it should finish ("the bell"). */
  goal: string;
}

export const SKINS: readonly Skin[] = [
  { id: 'marble', cargo: 'marble', goal: 'bell' },
  { id: 'acorn', cargo: 'acorn', goal: 'bowl' },
  { id: 'duckling', cargo: 'duckling', goal: 'pond' },
];

/** The skin each plain machine wears: machines in a round cycle through the three from a seeded offset. */
export function skinFor(offset: number, machine: number): Skin {
  return SKINS[(((offset + machine) % SKINS.length) + SKINS.length) % SKINS.length];
}

/**
 * Only the plain single-cargo machines are reskinned. Bells are the point of the prediction level, two coloured marbles
 * need their colours, and the chime and gate are built around a bell, so those keep the marble and the bell.
 */
export function skinnable(plan: ChainPlan): boolean {
  return !plan.predict && !plan.two && !plan.chime && !plan.gate;
}

/** The voice slots for a machine: the wording follows the skin, or stays "marble" and "bell" where it cannot change. */
export function skinVars(skin: Skin): { cargo: string; goal: string } {
  return { cargo: skin.cargo, goal: skin.goal };
}

/** Pentatonic steps for the k-th ramp the cargo meets in one run, so a finished machine plays a short rising run. */
export function rampStep(ramp: 'left' | 'right', k: number): number {
  return (ramp === 'left' ? 3 : 7) + Math.min(k, 2);
}
