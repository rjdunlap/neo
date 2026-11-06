import { CRITTERS, type CritterName } from '../../art/critter';
import { PENTATONIC } from '../../audio/notes';
import type { Rng } from '../../engine/random';

/**
 * Hat Band's rules (music M5, docs/definitions/hat-band.md): two friends on a stage, a rack of hats, and each hat a
 * musical job. A drum hat plays a beat, a tune hat plays notes; she decides who wears which. Nothing is ever wrong:
 * every part is authored on the pentatonic scale, so any mix fits. The model never touches Web Audio; `advance`
 * returns the beats to voice and `index.ts` plays them.
 */

export type Role = 'drum' | 'tune';
export type HatId = 'steady' | 'skippy' | 'cuckoo' | 'rain';
export const BEATS = 4;
/** Fixed pace: pace belongs to Little Conductor. A bar (one loop) is 3 seconds. */
export const BPM = 80;
export const PER_BEAT = 60 / BPM;

export interface Hat {
  id: HatId;
  role: Role;
  /** A drum loop: a hit or a rest each beat. */
  hits?: readonly boolean[];
  /** A tune loop: a note of the major pentatonic (semitones above C, inside one octave) or a rest each beat. */
  notes?: readonly (number | null)[];
}

export const HATS: Record<HatId, Hat> = {
  steady: { id: 'steady', role: 'drum', hits: [true, false, true, false] },
  skippy: { id: 'skippy', role: 'drum', hits: [true, false, true, true] },
  cuckoo: { id: 'cuckoo', role: 'tune', notes: [7, 4, 7, null] },
  rain: { id: 'rain', role: 'tune', notes: [2, 4, 7, 4] },
};
export const HAT_IDS = Object.keys(HATS) as HatId[];

/** A pentatonic note (semitones above C) as a scale step in the octave above middle C, for `sfx.marimba`. */
export const noteStep = (semitones: number): number => 5 + PENTATONIC.indexOf(semitones);

export interface Plan { level: number; name: string; mode: 'put' | 'swap' | 'alone' }
const PLANS: Plan[] = [
  { level: 1, name: 'Put on a hat: a drum hat and a tune hat; put one on a friend to hear their part, then make a band', mode: 'put' },
  { level: 2, name: 'Swap a hat: four hats; swap, spotlight one friend, hear two different bands, then finish with the one she likes', mode: 'swap' },
  { level: 3, name: 'Alone, then together: both friends play; hear each one alone with the spotlight, then the two together', mode: 'alone' },
];
export const planFor = (level: number): Plan => PLANS[Math.max(0, Math.min(PLANS.length - 1, level - 1))];

export interface Round {
  cast: [CritterName, CritterName];
  /** The hats in their rack order. */
  rack: HatId[];
}
/** The band's friends: anyone except the mountain's host bear and the pip (the companion's look). */
const FRIENDS: CritterName[] = (Object.keys(CRITTERS) as CritterName[]).filter((n) => n !== 'bear' && n !== 'pip');

/** A seeded round: who stands on stage and which hats hang where. Level 1 has one hat of each role, levels 2–3 all four. */
export function makeRound(rng: Rng, level: number): Round {
  const friends = rng.shuffle([...FRIENDS]);
  const hats = level <= 1 ? [rng.pick(['steady', 'skippy'] as HatId[]), rng.pick(['cuckoo', 'rain'] as HatId[])] : [...HAT_IDS];
  return { cast: [friends[0], friends[1]], rack: rng.shuffle(hats) };
}

export type Worn = [HatId | null, HatId | null];
export type Friend = 0 | 1;

/** What is sounding: the hats on the friends and the spotlight, as one snapshot. */
export interface Mix { worn: Worn; solo: Friend | null }

export interface Band {
  /** The clock, in beats; beat k sounds when it reaches k. Global: a loop's place is `index mod 4`. */
  beat: number;
  /** Whole beats sounded so far, which is the index of the next one. */
  played: number;
  /** What she sees: changed the moment she places, takes off or spotlights. */
  worn: Worn;
  solo: Friend | null;
  /** What is heard: `worn` and `solo` as they were at the last beat boundary. */
  sounding: Mix;
  /** Beats heard of the sounding mix since it last changed. */
  heardMix: number;
  /** The audible mixes (by hat set) that have been heard for a whole loop. */
  mixes: string[];
  /** Hats heard on their own for a whole loop since they were last put on. */
  heardAlone: HatId[];
}

export const newBand = (): Band => ({
  beat: 0, played: 0, worn: [null, null], solo: null,
  sounding: { worn: [null, null], solo: null }, heardMix: 0, mixes: [], heardAlone: [],
});

/** The hats still on the rack, in rack order: every hat is on the rack or on exactly one friend. */
export const onRack = (round: Round, band: Band): HatId[] => round.rack.filter((h) => !band.worn.includes(h));

/** True while what she sees has not reached the band yet: it joins at the next beat. */
export const pending = (band: Band): boolean =>
  band.worn[0] !== band.sounding.worn[0] || band.worn[1] !== band.sounding.worn[1] || band.solo !== band.sounding.solo;

/** How much of a beat is left before a pending change joins (0–1). */
export const waitLeft = (band: Band): number => (pending(band) ? Math.max(0, band.played - band.beat) : 0);

/**
 * Put a hat on a friend. A hat the other friend wears moves across; a hat the friend already wears goes back to the rack.
 * Any change of hats ends the spotlight, and the hat put on has to be heard alone again.
 */
export function wear(band: Band, friend: Friend, hat: HatId): Band {
  if (band.worn[friend] === hat) return band;
  const worn: Worn = [band.worn[0] === hat ? null : band.worn[0], band.worn[1] === hat ? null : band.worn[1]];
  worn[friend] = hat;
  return { ...band, worn, solo: null, heardAlone: band.heardAlone.filter((h) => h !== hat) };
}

/** Take a friend's hat off; it goes back to the rack. */
export function takeOff(band: Band, friend: Friend): Band {
  if (band.worn[friend] === null) return band;
  const worn: Worn = [...band.worn];
  worn[friend] = null;
  return { ...band, worn, solo: null };
}

/** The spotlight: hear one friend alone, or (tapping the same star) the whole band again. A bare friend has nothing to play. */
export function spotlight(band: Band, friend: Friend): Band {
  if (band.solo === friend) return { ...band, solo: null };
  if (band.worn[friend] === null) return band;
  return { ...band, solo: friend };
}

/** The friends whose parts are heard in a mix. */
export const voices = (mix: Mix): Friend[] => ([0, 1] as Friend[]).filter((f) => mix.worn[f] !== null && (mix.solo === null || mix.solo === f));

/** A mix's identity is the set of hats heard, not who wears them: the voice is the hat's. Empty for silence. */
export const mixKey = (mix: Mix): string => voices(mix).map((f) => mix.worn[f]!).sort().join('+');

export interface BeatEvent {
  /** Which beat of the round this is (0, 1, 2…). */
  index: number;
  /** Which beat of the loop (0–3). */
  step: number;
  friend: Friend;
  hat: HatId;
  role: Role;
  /** The marimba's scale step for a tune note; null for a drum hit. */
  pitch: number | null;
  /** Seconds into this `advance` call that the beat landed at. */
  at: number;
}

/** The events one friend plays on a loop step: a drum hit, a tune note, or nothing on a rest. */
function partOn(hat: HatId, step: number): { pitch: number | null } | null {
  const h = HATS[hat];
  if (h.role === 'drum') return h.hits![step] ? { pitch: null } : null;
  const n = h.notes![step];
  return n === null ? null : { pitch: noteStep(n) };
}

/**
 * Moves the clock on by `dt` seconds and returns every whole beat it crossed, each exactly once and in order. A change
 * she made since the last beat joins at the first beat it reaches, and hats play at the global loop place (`index mod 4`),
 * so one that joins mid-bar comes in step with the others.
 */
export function advance(band: Band, dt: number): { band: Band; events: BeatEvent[] } {
  const b: Band = { ...band, mixes: [...band.mixes], heardAlone: [...band.heardAlone] };
  const events: BeatEvent[] = [];
  let left = Math.max(0, dt);
  let at = 0;
  for (;;) {
    const toNext = (b.played - b.beat) * PER_BEAT;
    if (toNext > left + 1e-9) {
      b.beat += left / PER_BEAT;
      break;
    }
    left -= Math.max(0, toNext);
    at += Math.max(0, toNext);
    b.beat = b.played;
    if (pending(b)) {
      b.sounding = { worn: [...b.worn], solo: b.solo };
      b.heardMix = 0;
    }
    const step = b.played % BEATS;
    for (const f of voices(b.sounding)) {
      const hat = b.sounding.worn[f]!;
      const part = partOn(hat, step);
      if (part) events.push({ index: b.played, step, friend: f, hat, role: HATS[hat].role, pitch: part.pitch, at });
    }
    b.heardMix++;
    if (b.heardMix >= BEATS) {
      const key = mixKey(b.sounding);
      if (key && !b.mixes.includes(key)) b.mixes.push(key);
      const heard = voices(b.sounding);
      if (heard.length === 1) {
        const hat = b.sounding.worn[heard[0]]!;
        if (!b.heardAlone.includes(hat)) b.heardAlone.push(hat);
      }
    }
    b.played++;
  }
  return { band: b, events };
}

const settled = (band: Band) => !pending(band) && band.heardMix >= BEATS && mixKey(band.sounding) !== '';

/**
 * The heard gate for Done. Level 1: a band heard for a whole loop. Level 2: that, and two different bands heard whole.
 * Level 3: both friends wear hats and play together, heard whole, and each of their hats has been heard alone.
 */
export function canFinish(band: Band, level: number): boolean {
  if (!settled(band)) return false;
  const mode = planFor(level).mode;
  if (mode === 'put') return true;
  if (mode === 'swap') return band.mixes.length >= 2;
  return band.worn[0] !== null && band.worn[1] !== null && band.solo === null && band.worn.every((h) => band.heardAlone.includes(h!));
}

export type Early = 'empty' | 'hear-whole' | 'hear-other' | 'hear-alone' | 'both' | 'together';
/** What Done says while it is still dim: put a hat on, hear it a bit longer, hear another way, hear each alone, or play together. */
export function earlyDone(band: Band, level: number): Early {
  if (band.worn[0] === null && band.worn[1] === null) return 'empty';
  const mode = planFor(level).mode;
  if (mode === 'alone') {
    if (band.worn[0] === null || band.worn[1] === null) return 'both';
    // A friend in the spotlight whose part is still being heard alone: just listen.
    if (band.solo !== null && !band.heardAlone.includes(band.worn[band.solo]!)) return 'hear-whole';
    if (!band.worn.every((h) => band.heardAlone.includes(h!))) return 'hear-alone';
    if (band.solo !== null) return 'together';
  }
  if (mode === 'swap' && settled(band) && band.mixes.length < 2) return 'hear-other';
  return 'hear-whole';
}

/** Where the glow points after an early Done: a hat to put on, a friend's star, or nothing (just listen). */
export function nextStep(round: Round, band: Band, level: number): { hat?: HatId; star?: Friend } {
  const why = earlyDone(band, level);
  if (why === 'empty' || why === 'both' || why === 'hear-other') return { hat: onRack(round, band)[0] };
  if (why === 'together') return { star: band.solo! };
  if (why === 'hear-alone') return { star: ([0, 1] as Friend[]).find((f) => !band.heardAlone.includes(band.worn[f]!)) };
  return {};
}

export type BotMove = { hat: HatId } | { friend: Friend } | { star: Friend } | 'done';

/**
 * The ghost finger's next tap, reading only what is on screen; `selected` is the hat lifted by a tap. A drum hat on the
 * first friend, heard whole, then a tune hat on the second. Level 2 then swaps in the other tune hat (another version);
 * level 3 lights each friend's star for a whole loop and turns it off again. Then Done. It waits (null) while a change is
 * pending or a loop is still playing.
 */
export function botMove(round: Round, band: Band, level: number, selected: HatId | null): BotMove | null {
  if (pending(band)) return null;
  const place = (hat: HatId, friend: Friend): BotMove => (selected === hat ? { friend } : { hat });
  const rack = onRack(round, band);
  const drum = rack.find((h) => HATS[h].role === 'drum');
  const tune = rack.find((h) => HATS[h].role === 'tune');
  const mode = planFor(level).mode;
  if (band.worn[0] === null && drum) return place(drum, 0);
  if (band.heardMix < BEATS) return null;
  if (band.worn[1] === null && tune) return place(tune, 1);
  if (mode === 'swap' && band.mixes.length < 3 && tune) return place(tune, 1);
  if (mode === 'alone') {
    const unheard = ([0, 1] as Friend[]).find((f) => !band.heardAlone.includes(band.worn[f]!));
    if (unheard !== undefined) return band.solo === unheard ? null : { star: unheard };
    if (band.solo !== null) return { star: band.solo };
  }
  return canFinish(band, level) ? 'done' : null;
}

export interface Rect { x: number; y: number; w: number; h: number }
export interface Disc { x: number; y: number; r: number }
export interface HatBandLayout {
  stage: Rect;
  /** Where each friend's feet stand, and the spot she taps or drops a hat on. */
  friends: { x: number; y: number }[];
  spots: Rect[];
  /** The rack's hat places, in rack order. */
  rack: Rect[];
  /** The spotlight stars under the friends (from level 2). */
  stars?: Disc[];
  done: Disc;
}

export const HAT = 120;
const HAT_GAP = 24;
export const SPOT = 160;
export const STAR = 50;
const DONE = 60;

/** Every rectangle on the screen, from the view, clear of the pet's bottom-left corner in both orientations. */
export function hatBandLayout(view: { w: number; h: number }, level: number, hats: number): HatBandLayout {
  const portrait = view.h > view.w;
  const cx = view.w / 2;
  const stageW = Math.min(view.w - 120, 760);
  const stageH = portrait ? Math.min(400, view.h * 0.36) : Math.min(330, view.h * 0.43);
  const stage: Rect = { x: cx - stageW / 2, y: portrait ? 100 : 60, w: stageW, h: stageH };
  const apart = 220;
  const feet = stage.y + stage.h - 30;
  const friends = [{ x: cx - apart, y: feet }, { x: cx + apart, y: feet }];
  const spotH = 280;
  const spots = friends.map((f) => ({ x: f.x - SPOT / 2, y: f.y - spotH + 20, w: SPOT, h: spotH }));
  const showStars = planFor(level).mode !== 'put';
  const starY = stage.y + stage.h + 20 + STAR;
  const stars = showStars ? friends.map((f) => ({ x: f.x, y: starY, r: STAR })) : undefined;
  const below = showStars ? starY + STAR + 40 : stage.y + stage.h + 50;
  let rack: Rect[];
  if (portrait && hats > 2) {
    const top = Math.max(below, view.h * 0.62 - HAT - HAT_GAP / 2);
    rack = [0, 1, 2, 3].slice(0, hats).map((i) => ({ x: cx + (i % 2 === 0 ? -HAT - HAT_GAP / 2 : HAT_GAP / 2), y: top + Math.floor(i / 2) * (HAT + HAT_GAP), w: HAT, h: HAT }));
  } else {
    const width = hats * HAT + (hats - 1) * HAT_GAP;
    const left = cx - width / 2;
    rack = Array.from({ length: hats }, (_, i) => ({ x: left + i * (HAT + HAT_GAP), y: below, w: HAT, h: HAT }));
  }
  const done: Disc = { x: view.w - DONE - 40, y: view.h - DONE - 50, r: DONE };
  return { stage, friends, spots, rack, stars, done };
}
