import type { Rng } from '../../engine/random';

/**
 * Egg Catch, after the Atari 2600's Big Bird's Egg Catch (made for preschoolers) and Kaboom!:
 * hens lay eggs that roll gently down to a basket. Missed eggs land in soft hay and hatch,
 * so nothing breaks. Later levels route eggs through chutes with flip gates.
 */
export type EggMode = 'tap' | 'catch' | 'brown' | 'route' | 'sort';

export interface EggPlan {
  mode: EggMode;
  /** Eggs to catch (or route) to finish. */
  eggs: number;
  /** Seconds for an egg to fall the whole way (catch levels). */
  fall: number;
  name: string;
}

export const PLANS: EggPlan[] = [
  { mode: 'tap', eggs: 5, fall: 2.4, name: 'Tap a hen; her egg rolls into the basket' },
  { mode: 'catch', eggs: 6, fall: 3.6, name: 'Slide the basket under falling eggs' },
  { mode: 'brown', eggs: 5, fall: 3.2, name: 'Catch only the brown eggs; white ones hatch in the hay' },
  { mode: 'route', eggs: 4, fall: 0, name: 'Flip the gates so the egg rolls into the basket' },
  { mode: 'sort', eggs: 5, fall: 0, name: 'Route brown eggs to the basket and white eggs to the nest' },
];

export const planFor = (level: number) => PLANS[Math.min(PLANS.length, Math.max(1, level)) - 1];

export const LANES = 4;
export type Shell = 'brown' | 'white';

export interface Egg {
  /** The hen (lane) it comes from. */
  lane: number;
  shell: Shell;
}

/** A stream of eggs. Brown levels mix in white eggs (never more than two whites in a row). */
export function makeEggs(plan: EggPlan, rng: Rng, count = 30): Egg[] {
  const out: Egg[] = [];
  for (let i = 0; i < count; i++) {
    let lane = rng.int(0, LANES - 1);
    if (lane === out[i - 1]?.lane) lane = (lane + rng.int(1, LANES - 1)) % LANES;
    let shell: Shell = plan.mode === 'brown' || plan.mode === 'sort' ? (rng.chance(0.55) ? 'brown' : 'white') : 'brown';
    if (shell === 'white' && out.slice(-2).length === 2 && out.slice(-2).every((e) => e.shell === 'white')) shell = 'brown';
    out.push({ lane, shell });
  }
  return out;
}

/** Catching: is the egg over the basket? Generous: the basket is wide and eggs are forgiving. */
export const caught = (eggX: number, basketX: number, reach = 95) => Math.abs(eggX - basketX) <= reach;

/**
 * Chutes: one entry splits at gate 0 into a left and right chute; gate 1 splits the left one
 * and gate 2 the right one, giving four exits. A gate is true when it points right.
 */
export function exitFor(gates: [boolean, boolean, boolean]): number {
  return gates[0] ? (gates[2] ? 3 : 2) : gates[1] ? 1 : 0;
}

/** The gate settings that send an egg to `exit` (the gate on the other branch doesn't matter). */
export function gatesFor(exit: number): { gate: number; right: boolean }[] {
  const right = exit >= 2;
  return [
    { gate: 0, right },
    { gate: right ? 2 : 1, right: exit % 2 === 1 },
  ];
}

/** Route levels: where the basket (and the nest, for sorting) wait for each egg. */
export function targetsFor(plan: EggPlan, rng: Rng): { basket: number; nest: number }[] {
  const out: { basket: number; nest: number }[] = [];
  for (let i = 0; i < plan.eggs * 3; i++) {
    let basket = rng.int(0, 3);
    if (basket === out[i - 1]?.basket) basket = (basket + 1 + rng.int(0, 2)) % 4;
    const nest = (basket + 1 + rng.int(0, 2)) % 4;
    out.push({ basket, nest });
  }
  return out;
}
