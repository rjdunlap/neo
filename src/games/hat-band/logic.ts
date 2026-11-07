import { CRITTERS, type CritterName } from '../../art/critter';
import { PENTATONIC } from '../../audio/notes';
import type { Rng } from '../../engine/random';
import type { BandLevels } from '../../progress/difficulty';

/**
 * Hat Band's rules (music M5, docs/definitions/hat-band.md): two friends on a stage, a rack of hats, and each hat a
 * musical job. A drum hat plays a beat, a tune hat plays notes; she decides who wears which. Nothing is ever wrong:
 * every part is authored on the pentatonic scale, so any mix fits. The model never touches Web Audio; `advance`
 * returns the beats to voice and `index.ts` plays them.
 */

export type Role = 'drum' | 'tune' | 'bass';
export type HatId = 'steady' | 'skippy' | 'cuckoo' | 'rain' | 'thump' | 'walk';
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
  /** A low loop (level 4): a scale step in middle C's octave (`stepToMidi`: 0 = C4, 2 = E4) or a rest each beat. */
  low?: readonly (number | null)[];
}

export const HATS: Record<HatId, Hat> = {
  steady: { id: 'steady', role: 'drum', hits: [true, false, true, false] },
  skippy: { id: 'skippy', role: 'drum', hits: [true, false, true, true] },
  cuckoo: { id: 'cuckoo', role: 'tune', notes: [7, 4, 7, null] },
  rain: { id: 'rain', role: 'tune', notes: [2, 4, 7, 4] },
  thump: { id: 'thump', role: 'bass', low: [0, null, 2, null] },
  walk: { id: 'walk', role: 'bass', low: [0, 1, 2, 1] },
};
/** The hats of levels 1–3. The low hats belong to level 4 only and never join their rack. */
export const HAT_IDS: HatId[] = ['steady', 'skippy', 'cuckoo', 'rain'];
export const LOW_IDS: HatId[] = ['thump', 'walk'];

/** A pentatonic note (semitones above C) as a scale step in the octave above middle C, for `sfx.marimba`. */
export const noteStep = (semitones: number): number => 5 + PENTATONIC.indexOf(semitones);

export interface Plan { level: number; name: string; mode: 'put' | 'swap' | 'alone' | 'arrange' }
const PLANS: Plan[] = [
  { level: 1, name: 'Put on a hat: a drum hat and a tune hat; put one on a friend to hear their part, then make a band', mode: 'put' },
  { level: 2, name: 'Swap a hat: four hats; swap, spotlight one friend, hear two different bands, then finish with the one she likes', mode: 'swap' },
  { level: 3, name: 'Alone, then together: both friends play; hear each one alone with the spotlight, then the two together', mode: 'alone' },
  { level: 4, name: 'Build a song: three friends (drum, tune and a low part) and a three-part song; start with the tune alone, end with everybody, the middle is hers; Check plays it through', mode: 'arrange' },
];

// Lap and toddler stay with Jelly Drums and Little Conductor; school starts at swapping (decision 2's default). Building a
// song (level 4) tops the school range and is the grown-ups' level (the 2026-10-23 placement, no new band).
export const LEVELS: BandLevels = {
  preschool: { min: 1, max: 2 },
  prek: { min: 1, max: 3 },
  school: { min: 2, max: 4 },
  grownup: { min: 4, max: 4 },
};
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
  if (h.role === 'bass') {
    const n = h.low![step];
    return n === null ? null : { pitch: n };
  }
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
  // Level 4 is judged by `check` on its song, never by this gate (its scene has no Done of this kind).
  if (mode === 'arrange') return false;
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

// ---------------------------------------------------------------------------------------------------------------------
// Level 4, *Build a song* (music M6, docs/definitions/hat-band.md#level-4-build-a-song-m6-definition-2026-11-06): three
// friends, each with one hat (a drum, a tune and a low part), and a song of three parts. Each part is the set of roles
// playing in it, kept as a bit mask. The brief asks for the tune alone first and everybody last; the middle is hers.

export type Part = 0 | 1 | 2;
export const PARTS: Part[] = [0, 1, 2];
export const ROLE_BIT: Record<Role, number> = { drum: 1, tune: 2, bass: 4 };
/** The order roles are tried in when a repair picks one: drum, tune, low. */
export const ROLE_ORDER: Role[] = ['drum', 'tune', 'bass'];
export const EVERYBODY = 7;
/** A song: which roles play in each of its three parts. */
export type Song = readonly [number, number, number];
/** The song she starts from: everybody in every part, so the first move is making space. */
export const START_SONG: Song = [EVERYBODY, EVERYBODY, EVERYBODY];
export const UNDO_LIMIT = 20;

export const has = (mask: number, role: Role): boolean => (mask & ROLE_BIT[role]) !== 0;
export const rolesIn = (mask: number): Role[] => ROLE_ORDER.filter((r) => has(mask, r));

/** The brief's two pictured clauses, judged in this order. "Every part has somebody" is a precondition, not a clause. */
export type Clause = 'first' | 'last';
export const CLAUSES: { clause: Clause; part: Part; target: number }[] = [
  { clause: 'first', part: 0, target: ROLE_BIT.tune },
  { clause: 'last', part: 2, target: EVERYBODY },
];

export type Verdict = 'empty' | 'ok' | Clause;
/** Judge a song: a part with nobody in it, accepted, or the first clause it breaks. */
export function check(song: Song): Verdict {
  if (song.some((m) => m === 0)) return 'empty';
  for (const c of CLAUSES) if (song[c.part] !== c.target) return c.clause;
  return 'ok';
}

const bits = (m: number) => (m & 1) + ((m >> 1) & 1) + ((m >> 2) & 1);
/** How many hat toggles the song is from the nearest accepted one (any nonempty middle is accepted). */
export const distance = (song: Song): number => bits(song[0] ^ ROLE_BIT.tune) + (song[1] === 0 ? 1 : 0) + bits(song[2] ^ EVERYBODY);

export interface Repair { clause: 'empty' | Clause; part: Part; role: Role }
/**
 * One toggle toward an accepted song, inside the part that is wrong: the first empty part (an empty middle gets the
 * tune), else the first broken clause's part, the first role (drum, tune, low) that differs from its target. Never
 * touches another part, so her middle is never discarded. Null for an accepted song.
 */
export function repair(song: Song): Repair | null {
  const v = check(song);
  if (v === 'ok') return null;
  if (v === 'empty') {
    const part = song.findIndex((m) => m === 0) as Part;
    if (part === 1) return { clause: v, part, role: 'tune' };
    const target = CLAUSES.find((c) => c.part === part)!.target;
    return { clause: v, part, role: ROLE_ORDER.find((r) => has(target, r))! };
  }
  const c = CLAUSES.find((x) => x.clause === v)!;
  return { clause: v, part: c.part, role: ROLE_ORDER.find((r) => has(song[c.part], r) !== has(c.target, r))! };
}

export const toggle = (song: Song, part: Part, role: Role): Song =>
  song.map((m, i) => (i === part ? m ^ ROLE_BIT[role] : m)) as unknown as Song;

export interface SongRound {
  cast: [CritterName, CritterName, CritterName];
  /** Each friend's hat for the whole round, in stage order. */
  hats: [HatId, HatId, HatId];
}

/** A seeded level 4 round: three friends, one drum, one tune and one low hat, in a seeded order on the stage. */
export function makeSongRound(rng: Rng): SongRound {
  const friends = rng.shuffle([...FRIENDS]);
  const hats = rng.shuffle([rng.pick(['steady', 'skippy'] as HatId[]), rng.pick(['cuckoo', 'rain'] as HatId[]), rng.pick(LOW_IDS)]);
  return { cast: [friends[0], friends[1], friends[2]], hats: [hats[0], hats[1], hats[2]] };
}

/** Which friend wears a role's hat. */
export const friendFor = (round: SongRound, role: Role): number => round.hats.findIndex((h) => HATS[h].role === role);

export type Playing = 'loop' | 'song' | 'check';
export interface Arrange {
  beat: number;
  /** Whole beats sounded so far, which is the index of the next one. */
  played: number;
  song: Song;
  selected: Part;
  /** Loop: the selected part over and over. Song (Play) and Check: parts 1, 2, 3 once each, then back to the loop. */
  playing: Playing;
  /** The beat the current bar counting started on: a played song starts a fresh bar. */
  origin: number;
  undo: Song[];
  /** The part heard on the last beat (the playhead), and who played in it. */
  now: Part | null;
  mask: number;
}

export const newArrange = (): Arrange => ({ beat: 0, played: 0, song: START_SONG, selected: 0, playing: 'loop', origin: 0, undo: [], now: null, mask: 0 });

/** Tap a part card: free, not undone. During Play it stops the song so she hears the part she picked; during Check, ignored. */
export function select(a: Arrange, part: Part): Arrange {
  if (a.playing === 'check') return a;
  return { ...a, selected: part, playing: 'loop' };
}

/** Tap a friend: their hat goes on or off in the selected part. An edit stops a played song; Check ignores edits. */
export function toggleRole(a: Arrange, role: Role): Arrange {
  if (a.playing === 'check') return a;
  const undo = [...a.undo, a.song].slice(-UNDO_LIMIT);
  return { ...a, song: toggle(a.song, a.selected, role), undo, playing: 'loop' };
}

/** Undo: the song before the last toggle, exactly. Nothing to undo, or during Check, leaves it as it is. */
export function undoStep(a: Arrange): Arrange {
  if (a.playing === 'check' || a.undo.length === 0) return a;
  return { ...a, song: a.undo[a.undo.length - 1], undo: a.undo.slice(0, -1), playing: 'loop' };
}

/** Play (or Check) the whole song from the next beat. */
export const playSong = (a: Arrange, how: 'song' | 'check'): Arrange => ({ ...a, playing: how, origin: a.played });

export interface SongEvent {
  index: number;
  step: number;
  part: Part;
  friend: number;
  hat: HatId;
  role: Role;
  /** The marimba's step for a tune note, the pluck's for a low note; null for a drum hit. */
  pitch: number | null;
  at: number;
}

/**
 * Moves the song's clock on by `dt` seconds, returning every whole beat crossed, each once and in order, and `ended`
 * when a played or checked song finished its third part (then it loops the selected part again).
 */
export function advanceSong(round: SongRound, arrange: Arrange, dt: number): { arrange: Arrange; events: SongEvent[]; ended: 'song' | 'check' | null } {
  const a: Arrange = { ...arrange };
  const events: SongEvent[] = [];
  let ended: 'song' | 'check' | null = null;
  let left = Math.max(0, dt);
  let at = 0;
  for (;;) {
    const toNext = (a.played - a.beat) * PER_BEAT;
    if (toNext > left + 1e-9) {
      a.beat += left / PER_BEAT;
      break;
    }
    left -= Math.max(0, toNext);
    at += Math.max(0, toNext);
    a.beat = a.played;
    let k = a.played - a.origin;
    if (a.playing !== 'loop' && k >= BEATS * PARTS.length) {
      ended = a.playing;
      a.playing = 'loop';
      a.origin = a.played;
      k = 0;
    }
    const part: Part = a.playing === 'loop' ? a.selected : (Math.floor(k / BEATS) as Part);
    const step = ((k % BEATS) + BEATS) % BEATS;
    a.now = part;
    a.mask = a.song[part];
    round.hats.forEach((hat, friend) => {
      const role = HATS[hat].role;
      if (!has(a.mask, role)) return;
      const p = partOn(hat, step);
      if (p) events.push({ index: a.played, step, part, friend, hat, role, pitch: p.pitch, at });
    });
    a.played++;
  }
  return { arrange: a, events, ended };
}

export type SongMove = { part: Part } | { friend: number } | 'play' | 'check';
/**
 * The ghost finger's next tap at level 4, reading the brief and part strip: the repair's part card, then the friend
 * whose hat it toggles; once the song fits, Play to hear it whole, then Check. Waits (null) while a song is playing.
 */
export function songBotMove(round: SongRound, a: Arrange, heardSong: boolean): SongMove | null {
  if (a.playing !== 'loop') return null;
  const r = repair(a.song);
  if (r) return a.selected === r.part ? { friend: friendFor(round, r.role) } : { part: r.part };
  return heardSong ? 'check' : 'play';
}

export interface SongLayout {
  /** The brief: the first clause's card, the open middle, the last clause's card. */
  brief: Rect[];
  stage: Rect;
  friends: { x: number; y: number }[];
  spots: Rect[];
  /** The part strip, the song as it stands. */
  parts: Rect[];
  undo: Disc;
  play: Disc;
  check: Disc;
}

export const BRIEF_W = 120;
export const BRIEF_H = 100;
export const PART_W = 150;
export const PART_H = 120;
export const SONG_SPOT = 150;

/** Level 4's screen from the view: brief strip, stage of three, part strip, then Undo, Play and Check, clear of the pet. */
export function songLayout(view: { w: number; h: number }): SongLayout {
  const portrait = view.h > view.w;
  const cx = view.w / 2;
  const top = portrait ? Math.max(110, view.h * 0.1) : 14;
  const brief = [-1, 0, 1].map((i) => ({ x: cx + i * (BRIEF_W + 40) - BRIEF_W / 2, y: top, w: BRIEF_W, h: BRIEF_H }));
  const stageW = Math.min(view.w - 120, 700);
  const stage: Rect = { x: cx - stageW / 2, y: top + BRIEF_H + 14, w: stageW, h: portrait ? 300 : 250 };
  const feet = stage.y + stage.h - 30;
  const friends = [-1, 0, 1].map((i) => ({ x: cx + i * 200, y: feet }));
  const spotH = 210;
  const spots = friends.map((f) => ({ x: f.x - SONG_SPOT / 2, y: f.y - spotH + 20, w: SONG_SPOT, h: spotH }));
  const partsY = stage.y + stage.h + (portrait ? 40 : 18);
  const parts = [-1, 0, 1].map((i) => ({ x: cx + i * (PART_W + 30) - PART_W / 2, y: partsY, w: PART_W, h: PART_H }));
  const rowY = portrait ? partsY + PART_H + 120 : Math.min(view.h - 70, partsY + PART_H + 74);
  const undo: Disc = { x: cx - 200, y: rowY, r: 50 };
  const play: Disc = { x: cx, y: rowY, r: 60 };
  const check: Disc = { x: view.w - 100, y: rowY, r: 60 };
  return { brief, stage, friends, spots, parts, undo, play, check };
}
