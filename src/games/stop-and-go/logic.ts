/**
 * Stop and Go: a traffic light and friendly cars. First the light is a toy (tap it and the car
 * stops or goes). Then the light changes by itself and the child sends a car only on green: the
 * skill is waiting. Then "red light, green light" with the pet, and finally a crossing with two
 * roads where the child lets one road go at a time.
 *
 * Nothing is timed: the light keeps cycling as long as she likes, and waiting is never wrong.
 */
export type GoMode = 'lamps' | 'toy' | 'send' | 'walk' | 'cross' | 'lanes' | 'busy';

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
  { mode: 'lanes', goal: 6, name: 'Whose light? A car lane and a bike lane each have their own light: send the front one whose own light is green' },
  { mode: 'busy', goal: 8, name: 'Busy crossing: cars arrive one at a time on both roads; hand over one road at a time' },
];

/** The two crossing levels: the preset crossing (4) and the busy one where cars arrive (6). */
export const isCross = (mode: GoMode) => mode === 'cross' || mode === 'busy';

/** Lap's first level, 9 (the easiest, so it sits outside PLANS): two lamps, a looping car, nothing to get wrong. */
export const LAMPS_LEVEL = 9;
export const LAMPS_PLAN: GoPlan = { mode: 'lamps', goal: 8, name: 'Go car, stop car: tap the green lamp to make the car go and the red lamp to make it stop (lap\'s first level)' };

export const planFor = (level: number) => (level === LAMPS_LEVEL ? LAMPS_PLAN : PLANS[Math.min(PLANS.length, Math.max(1, level)) - 1]);

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
export const GO_TARGET = { lamps: 'lamp', toy: 'light', send: 'car', walk: 'step', lanes: 'car' } as const;

/**
 * Whether a tap that lands now is right: the toy light answers every tap, but a car or a step is only right on green
 * (yellow is a nudge and red the one miss). The demonstration's hand waits over its target until this is true.
 */
export const rightNow = (mode: GoMode, light: Light) => mode === 'lamps' || mode === 'toy' || judgeGo(light) === 'go';

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
  if (mode === 'lamps') return 'toot';
  if (mode === 'toy') return light === 'green' ? 'drive' : 'toot';
  if ((mode !== 'send' && mode !== 'lanes') || !front) return 'toot';
  const j = judgeGo(light);
  return j === 'go' ? 'send' : j === 'wait' ? 'nudge' : 'miss';
}

/** At the toy level a touch on the light or a car counts toward the round; elsewhere only a send or a step does. */
export const touchCounts = (mode: GoMode, answer: CarAnswer | 'light') => (mode === 'toy' || mode === 'lamps') && (answer === 'light' || answer === 'drive' || answer === 'toot');

/**
 * The lap level's two lamps: green sets the looping car going, red brakes it (and a second touch of the same lamp keeps
 * it so). Both lamps and the car answer every touch, so there is no miss.
 */
export type Lamp = 'green' | 'red';
export const lampRolls = (lamp: Lamp) => lamp === 'green';
/** The ghost finger's lamp: the one the car is not already obeying, so green and red both get shown. */
export const nextLamp = (rolling: boolean): Lamp => (rolling ? 'red' : 'green');

/**
 * Where the hint glow sits once two misses have turned it on: on the thing to touch, and only while touching it is
 * right (green), so the glow leads to the action. The crossing's glow is on a light instead (`null` here).
 */
export const hintOn = (mode: GoMode, light: Light): 'car' | 'step' | null =>
  (mode === 'send' || mode === 'lanes') && light === 'green' ? 'car' : mode === 'walk' && light === 'green' ? 'step' : null;

/** The line said when the round is done: the walk ends at the flag, the other levels with the cars. */
export const doneLine = (mode: GoMode) => (mode === 'walk' ? 'go.done.walk' : 'go.done');


// Whose light? ------------------------------------------------------------------------------------

export type Lane = 'car' | 'bike';
export const LANES: Lane[] = ['car', 'bike'];

/**
 * The two lanes' own cycles, seeded. The lights take turns: the car light is green, then yellow, then both are red for a
 * moment, then the bike light, so one light is always green or about to be, and both are red at some moment of every cycle.
 */
export function laneCycles(rng: { range(min: number, max: number): number }): Record<Lane, Cycle> {
  const a = rng.range(PHASE.min, PHASE.max);
  const b = rng.range(PHASE.min, PHASE.max);
  const gap = rng.range(1, 1.8);
  const y = PHASE.yellow;
  return {
    car: [{ light: 'green', seconds: a }, { light: 'yellow', seconds: y }, { light: 'red', seconds: gap + b + y + gap }],
    bike: [{ light: 'red', seconds: a + y + gap }, { light: 'green', seconds: b }, { light: 'yellow', seconds: y }, { light: 'red', seconds: gap }],
  };
}

/** The lane to send next at time `t`: the one whose light is green, else the one that turns green first. */
export function nextGreenLane(cycles: Record<Lane, Cycle>, t: number): Lane {
  for (let s = 0; s < 40; s += 0.05) for (const lane of LANES) if (lightAt(t + s, cycles[lane]) === 'green') return lane;
  return 'car';
}

// Busy crossing ------------------------------------------------------------------------------------

/** Most cars that wait on one road. */
export const MAX_WAITING = 3;

/** The roads the busy crossing's cars arrive on, one at a time, seeded: half on each so both roads need a turn. */
export function arrivalOrder(rng: { shuffle<T>(a: T[]): T[] }, total: number): Road[] {
  const half = Math.floor(total / 2);
  const roads: Road[] = [...Array<Road>(half).fill('ew'), ...Array<Road>(total - half).fill('ns')];
  return rng.shuffle(roads);
}

/** A car arrives only if its road has room; otherwise it waits its turn out of sight. */
export const canArrive = (waiting: Record<Road, number>, road: Road) => waiting[road] < MAX_WAITING;

/** Seconds of both-red with cars waiting before the helper points at the busier road's light. */
export const IDLE_POINT = 6;
