/**
 * Stop and Go: a traffic light and friendly cars. First the light is a toy (tap it and the car
 * stops or goes). Then the light changes by itself and the child sends a car only on green: the
 * skill is waiting. Then "red light, green light" with the pet, and finally a crossing with two
 * roads where the child lets one road go at a time.
 *
 * Nothing is timed: the light keeps cycling as long as she likes, and waiting is never wrong.
 */
export type GoMode = 'toy' | 'send' | 'walk' | 'cross';

export interface GoPlan {
  mode: GoMode;
  /** Cars to send, steps to the flag, or cars to let through. */
  goal: number;
  name: string;
}

export const PLANS: GoPlan[] = [
  { mode: 'toy', goal: 8, name: 'Tap the traffic light: red stops the car, green makes it go' },
  { mode: 'send', goal: 5, name: 'The light changes by itself: tap a car only when the light is green' },
  { mode: 'walk', goal: 8, name: 'Red light, green light: step toward the flag on green, freeze on red' },
  { mode: 'cross', goal: 6, name: 'Traffic helper: let one road go at a time at the crossing' },
];

export const planFor = (level: number) => PLANS[Math.min(PLANS.length, Math.max(1, level)) - 1];

export type Light = 'green' | 'yellow' | 'red';

export type Cycle = { light: Light; seconds: number }[];

/** The light's own cycle, in seconds: long greens and reds, a short yellow. The middle of `cycleFor`'s range. */
export const CYCLE: Cycle = [
  { light: 'green', seconds: 3.5 },
  { light: 'yellow', seconds: 1.4 },
  { light: 'red', seconds: 3.5 },
];

/** The bounds of a seeded green or red: never shorter than 3 s, and a yellow plus the longest red stays under the hand's 6 s. */
export const PHASE = { min: 3, max: 4.2, yellow: 1.4 } as const;

/** One round's cycle, seeded: green and red each 3–4.2 s, so a round cannot be tapped by a rhythm learned in the last one. */
export const cycleFor = (rng: { range(min: number, max: number): number }): Cycle => [
  { light: 'green', seconds: rng.range(PHASE.min, PHASE.max) },
  { light: 'yellow', seconds: PHASE.yellow },
  { light: 'red', seconds: rng.range(PHASE.min, PHASE.max) },
];

/** Which light shows `t` seconds into the cycle. */
export function lightAt(t: number, cycle: Cycle = CYCLE): Light {
  const total = cycle.reduce((a, c) => a + c.seconds, 0);
  let x = ((t % total) + total) % total;
  for (const c of cycle) {
    if (x < c.seconds) return c.light;
    x -= c.seconds;
  }
  return 'red';
}

/** The vehicles that wait at the light, drawn per vehicle from the round's seed; each has the same face, headlamp and hit area. */
export const VEHICLES = ['car', 'bus', 'bike', 'tractor', 'van', 'digger'] as const;
export type Vehicle = (typeof VEHICLES)[number];

/** The toy light's order when tapped. */
export const nextLight = (l: Light): Light => (l === 'green' ? 'yellow' : l === 'yellow' ? 'red' : 'green');

/** Going is only right on green; yellow is "slow down", so a tap then is a nudge, never a miss. */
export function judgeGo(light: Light): 'go' | 'wait' | 'stop' {
  return light === 'green' ? 'go' : light === 'yellow' ? 'wait' : 'stop';
}

/** The crossing: which road may go. Both roads green is the one mistake; a car only drives on its own green. */
export interface Crossing {
  ns: Light;
  ew: Light;
}

export const safe = (c: Crossing) => !(c.ns === 'green' && c.ew === 'green');

/** What a capable child touches at each level but the crossing: the toy light, the car at the front, or the step button. */
export const GO_TARGET = { toy: 'light', send: 'car', walk: 'step' } as const;

/**
 * Whether a tap that lands now is right: the toy light answers every tap, but a car or a step is only right on green
 * (yellow is a nudge and red the one miss). The demonstration's hand waits over its target until this is true.
 */
export const rightNow = (mode: GoMode, light: Light) => mode === 'toy' || judgeGo(light) === 'go';

export type Road = 'ew' | 'ns';

/**
 * At the crossing, which road's light to tap next, or null to wait. Never turns a road green while the other is green
 * (the one mistake): a green road with nobody left waiting is turned red first, and only then the other road goes.
 * `waiting` counts the cars that have not begun to roll on each road.
 */
export function crossTouch(lights: Crossing, waiting: Record<Road, number>): Road | null {
  const other = (r: Road): Road => (r === 'ew' ? 'ns' : 'ew');
  for (const road of ['ew', 'ns'] as Road[]) {
    if (lights[road] !== 'green') continue;
    // Both green should never happen; if it does, give the road with fewer cars waiting its red.
    if (lights[other(road)] === 'green') return waiting[road] <= waiting[other(road)] ? road : other(road);
    return waiting[road] === 0 && waiting[other(road)] > 0 ? road : null;
  }
  // Nobody is green: let the road with more cars waiting go (the first road when level).
  if (waiting.ew === 0 && waiting.ns === 0) return null;
  return waiting.ns > waiting.ew ? 'ns' : 'ew';
}

/**
 * What a tap on a car does. Every touch answers: at the toy level the car toots, and on green drives round (both count
 * as one of the round's touches, as a light tap does); at the send level a car behind the front one toots and is
 * neither a send nor a miss, and the front car goes on green, gets a nudge on yellow and is the one miss on red.
 */
export type CarAnswer = 'drive' | 'toot' | 'send' | 'nudge' | 'miss';

export function carTap(mode: GoMode, light: Light, front: boolean): CarAnswer {
  if (mode === 'toy') return light === 'green' ? 'drive' : 'toot';
  if (mode !== 'send' || !front) return 'toot';
  const j = judgeGo(light);
  return j === 'go' ? 'send' : j === 'wait' ? 'nudge' : 'miss';
}

/** At the toy level a touch on the light or a car counts toward the round; elsewhere only a send or a step does. */
export const touchCounts = (mode: GoMode, answer: CarAnswer | 'light') => mode === 'toy' && (answer === 'light' || answer === 'drive' || answer === 'toot');

/**
 * Where the hint glow sits once two misses have turned it on: on the thing to touch, and only while touching it is
 * right (green), so the glow leads to the action. The crossing's glow is on a light instead (`null` here).
 */
export const hintOn = (mode: GoMode, light: Light): 'car' | 'step' | null =>
  mode === 'send' && light === 'green' ? 'car' : mode === 'walk' && light === 'green' ? 'step' : null;

/** The line said when the round is done: the walk ends at the flag, the other levels with the cars. */
export const doneLine = (mode: GoMode) => (mode === 'walk' ? 'go.done.walk' : 'go.done');
