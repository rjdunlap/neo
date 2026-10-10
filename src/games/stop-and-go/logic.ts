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

/** The light's own cycle, in seconds: long greens and reds, a short yellow. */
export const CYCLE: { light: Light; seconds: number }[] = [
  { light: 'green', seconds: 3.5 },
  { light: 'yellow', seconds: 1.4 },
  { light: 'red', seconds: 3.5 },
];

/** Which light shows `t` seconds into the cycle. */
export function lightAt(t: number): Light {
  const total = CYCLE.reduce((a, c) => a + c.seconds, 0);
  let x = ((t % total) + total) % total;
  for (const c of CYCLE) {
    if (x < c.seconds) return c.light;
    x -= c.seconds;
  }
  return 'red';
}

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
