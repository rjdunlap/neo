import type { Rng } from '../../engine/random';

/**
 * Little Helpers, after Pikmin: tap a fruit and one little helper runs over to carry it.
 * Bigger fruit needs more helpers. Later levels wait for a whistle, so the child has to
 * send exactly enough: too few can't lift it, extras walk back.
 */
export type HelperMode = 'tap' | 'two' | 'count' | 'numeral' | 'more';

export interface HelperPlan {
  mode: HelperMode;
  fruits: number;
  /** How many helpers a fruit can need. */
  min: number;
  max: number;
  name: string;
}

export const PLANS: HelperPlan[] = [
  { mode: 'tap', fruits: 5, min: 1, max: 1, name: 'Tap a fruit and a helper carries it home' },
  { mode: 'two', fruits: 4, min: 1, max: 2, name: 'Send one or two helpers (dots show how many); it lifts when there are enough' },
  { mode: 'count', fruits: 4, min: 2, max: 4, name: 'Send exactly 2 to 4 helpers, then blow the whistle (dots)' },
  { mode: 'numeral', fruits: 4, min: 2, max: 5, name: 'Send exactly the number shown, then blow the whistle' },
  { mode: 'more', fruits: 4, min: 3, max: 6, name: 'Some are already helping: how many more?' },
];

export const planFor = (level: number) => PLANS[Math.min(PLANS.length, Math.max(1, level)) - 1];

/** Enough helpers for the biggest fruit, with one to spare. */
export const CROWD = 7;

export interface Fruit {
  need: number;
  /** Helpers already carrying when the fruit appears ('more' levels). */
  already: number;
}

export function makeFruits(plan: HelperPlan, rng: Rng): Fruit[] {
  const out: Fruit[] = [];
  for (let i = 0; i < plan.fruits; i++) {
    let need = rng.int(plan.min, plan.max);
    // A new number each time, so counting matters.
    for (let tries = 0; need === out[i - 1]?.need && plan.max > plan.min && tries < 10; tries++) need = rng.int(plan.min, plan.max);
    const already = plan.mode === 'more' ? rng.int(1, need - 1) : 0;
    out.push({ need, already });
  }
  return out;
}

/** Whether the helpers lift when there are enough, or wait for the whistle. */
export const usesWhistle = (plan: HelperPlan) => plan.mode === 'count' || plan.mode === 'numeral' || plan.mode === 'more';

export type Lift = 'lift' | 'short' | 'extra';

export function tryLift(need: number, helpers: number): Lift {
  return helpers === need ? 'lift' : helpers < need ? 'short' : 'extra';
}
