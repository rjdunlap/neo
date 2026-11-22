import type { Rng } from '../../engine/random';
import type { BandLevels } from '../../progress/difficulty';
import { VOICE } from './voice';

export const LEVELS: BandLevels = {
  preschool: { min: 1, max: 1 },
  prek: { min: 1, max: 2 },
  school: { min: 2, max: 3 },
};
export const BANDS = ['preschool', 'prek', 'school'] as const;

const descriptions = ['Spot the silly thing', 'Two silly things', 'Could it happen?'];
export const describeLevel = (level: number) => descriptions[level - 1] ?? descriptions[0];

export type Backdrop = 'pond' | 'beach' | 'farm';
export type Slot =
  'leftSky' | 'high' | 'canopy' | 'rightSky' | 'leftGround' | 'middleGround' | 'bank' | 'rightGround';
export type Art =
  | 'cloud'
  | 'gull'
  | 'owl'
  | 'duck'
  | 'flower'
  | 'lily'
  | 'frog'
  | 'turtle'
  | 'sandcastle'
  | 'shell'
  | 'pail'
  | 'crab'
  | 'fish'
  | 'sun'
  | 'pig'
  | 'hen'
  | 'sheep'
  | 'cow'
  | 'apple'
  | 'rain'
  | 'fishTree'
  | 'flyingTurtle'
  | 'risingRain'
  | 'cloudCrab'
  | 'walkingFish'
  | 'wingedPig'
  | 'fourLegHen'
  | 'risingApple'
  | 'dogHat'
  | 'bunnyPail'
  | 'roofCat';

type Reason = Extract<keyof typeof VOICE, `sillyscene.why.${string}`>;
interface Picture {
  slot: Slot;
  art: Art;
  why: Reason;
}
type Destination = 'water' | 'rock' | 'sand';
interface Impossible extends Picture {
  kind: 'impossible';
  wrong: 'place' | 'part' | 'direction';
  fix: { art: Art; to?: Destination };
}
export type Thing = Impossible | (Picture & { kind: 'fine' | 'possible' });
export interface Scene {
  backdrop: Backdrop;
  things: Thing[];
}

const fine = (slot: Slot, art: Art, reason: Reason): Thing => ({ kind: 'fine', slot, art, why: reason });
const possible = (slot: Slot, art: Art, why: Reason): Thing => ({ kind: 'possible', slot, art, why });
const wrong = (
  slot: Slot,
  art: Art,
  kind: Impossible['wrong'],
  why: Reason,
  fix: Impossible['fix'],
): Impossible => ({ kind: 'impossible', slot, art, wrong: kind, why, fix });

const POND_FISH = wrong('canopy', 'fishTree', 'place', 'sillyscene.why.fishTree', {
  art: 'fish',
  to: 'water',
});
const CLOUD_CRAB = wrong('high', 'cloudCrab', 'place', 'sillyscene.why.cloudCrab', {
  art: 'crab',
  to: 'sand',
});
const WALKING_FISH = wrong('middleGround', 'walkingFish', 'part', 'sillyscene.why.walkingFish', {
  art: 'fish',
  to: 'water',
});
const WINGED_PIG = wrong('middleGround', 'wingedPig', 'part', 'sillyscene.why.wingedPig', { art: 'pig' });
const RISING_APPLE = wrong('canopy', 'risingApple', 'direction', 'sillyscene.why.risingApple', {
  art: 'apple',
});

const SKY = [
  fine('leftSky', 'sun', 'sillyscene.why.sun'),
  fine('high', 'gull', 'sillyscene.why.gull'),
  fine('rightSky', 'cloud', 'sillyscene.why.cloud'),
];
const POOLS = {
  pond: {
    impossible: [
      POND_FISH,
      wrong('high', 'flyingTurtle', 'part', 'sillyscene.why.flyingTurtle', { art: 'turtle', to: 'rock' }),
      wrong('rightSky', 'risingRain', 'direction', 'sillyscene.why.risingRain', { art: 'rain' }),
    ],
    possible: possible('rightGround', 'bunnyPail', 'sillyscene.why.bunnyPail'),
    fine: [
      ...SKY,
      fine('canopy', 'owl', 'sillyscene.why.owl'),
      fine('leftGround', 'flower', 'sillyscene.why.flower'),
      fine('middleGround', 'duck', 'sillyscene.why.duck'),
      fine('bank', 'lily', 'sillyscene.why.lily'),
      fine('rightGround', 'frog', 'sillyscene.why.frog'),
    ],
  },
  beach: {
    impossible: [CLOUD_CRAB, WALKING_FISH],
    possible: possible('rightGround', 'dogHat', 'sillyscene.why.dogHat'),
    fine: [
      ...SKY,
      fine('canopy', 'gull', 'sillyscene.why.gull'),
      fine('leftGround', 'sandcastle', 'sillyscene.why.sandcastle'),
      fine('middleGround', 'shell', 'sillyscene.why.shell'),
      fine('bank', 'crab', 'sillyscene.why.crab'),
      fine('rightGround', 'pail', 'sillyscene.why.pail'),
    ],
  },
  farm: {
    impossible: [
      WINGED_PIG,
      RISING_APPLE,
      wrong('bank', 'fourLegHen', 'part', 'sillyscene.why.fourLegHen', { art: 'hen' }),
    ],
    possible: possible('rightSky', 'roofCat', 'sillyscene.why.roofCat'),
    fine: [
      ...SKY,
      fine('canopy', 'owl', 'sillyscene.why.owl'),
      fine('leftGround', 'sheep', 'sillyscene.why.sheep'),
      fine('middleGround', 'pig', 'sillyscene.why.pig'),
      fine('bank', 'hen', 'sillyscene.why.hen'),
      fine('rightGround', 'cow', 'sillyscene.why.cow'),
    ],
  },
} satisfies Record<Backdrop, { impossible: Impossible[]; possible: Thing; fine: Thing[] }>;

const FIRST: { backdrop: Backdrop; impossible: Impossible[] }[] = [
  { backdrop: 'pond', impossible: [POND_FISH] },
  { backdrop: 'farm', impossible: [WINGED_PIG, RISING_APPLE] },
  { backdrop: 'beach', impossible: [CLOUD_CRAB, WALKING_FISH] },
];

export function makeScene(level: number, rng: Rng, authored = false): Scene {
  const first = FIRST[level - 1];
  const backdrop = authored ? first.backdrop : rng.pick<Backdrop>(['pond', 'beach', 'farm']);
  const pool = POOLS[backdrop];
  // Keep the single wrong thing in the middle third on the opening level.
  const candidates =
    level === 1
      ? pool.impossible.filter((thing) => thing.slot !== 'rightSky' && thing.slot !== 'bank')
      : pool.impossible;
  const candidatesInOrder = authored ? first.impossible : rng.shuffle([...candidates]);
  const selected: Impossible[] = [];
  for (const thing of candidatesInOrder) {
    if (selected.length < (level === 1 ? 1 : 2) && !selected.some((other) => other.wrong === thing.wrong)) {
      selected.push(thing);
    }
  }
  const things: Thing[] = [...selected];
  if (level === 3) things.push(pool.possible);
  const available = pool.fine.filter((item) => !things.some((thing) => thing.slot === item.slot));
  const fillers = authored ? available : rng.shuffle(available);
  things.push(...fillers.slice(0, (level === 1 ? 6 : 8) - things.length));
  return { backdrop, things };
}

export function glowFor(scene: Scene, found: ReadonlySet<Thing>, xFor: (slot: Slot) => number) {
  return scene.things
    .filter((thing) => thing.kind === 'impossible' && !found.has(thing))
    .sort((a, b) => xFor(a.slot) - xFor(b.slot))[0];
}
