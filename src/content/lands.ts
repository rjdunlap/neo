import type { ColorName } from '../art/palette';
import type { BackdropStyle } from '../art/scenery';
import type { CritterName } from '../art/critter';
import { STYLES, type MusicStyle } from '../audio/music';
import type { GameModule } from '../games/types';
import { bandRank, lowestBand, type Band } from '../progress/bands';
import type { LineId } from './voice-script';

/**
 * The island is a world of themed lands, after JumpStart's rooms and Neopets' lands. A person's profile sets
 * their age; a land shows its games for that age and younger, played at their own levels, and a signpost leads
 * to the land's games for bigger kids. Nothing here gates anything. A land has its own id apart from a game's
 * subject (`region`), so a later land can hold games from several subjects.
 */
export const LAND_IDS = ['bubble-beach', 'music-mountain', 'treehouse', 'barnyard', 'counting-cove', 'cozy-village', 'rainbow-meadow', 'puzzle-peaks', 'story-grove', 'tinker-lab'] as const;
export type LandId = (typeof LAND_IDS)[number];

/** Who greets her in a land: a critter in a color, or one of the island's named friends. */
export type HostKind = CritterName | 'juniper' | 'hazel';

export interface Land {
  id: LandId;
  /** Kid-facing name; the spoken line says it. */
  name: string;
  line: LineId;
  host: { kind: HostKind; color?: ColorName };
  backdrop: BackdropStyle;
  music: MusicStyle;
  /** Its games, by id, in the order they stand. Every island game lives in exactly one land (a test checks). */
  games: readonly string[];
}

const tune = (seed: number, lead: MusicStyle['lead'], bpm: number): MusicStyle => ({ ...STYLES.hub, seed, lead, bpm });

export const LANDS: readonly Land[] = [
  {
    id: 'bubble-beach',
    name: 'Bubble Beach',
    line: 'subject.senses',
    host: { kind: 'duck' },
    backdrop: { sky: [0x9fd8f5, 0xfff6e0], hills: [0x9fd8f5, 0x7cc7ec, 0xffe7a3], horizon: 0.4, clouds: 3, sun: true, seed: 101 },
    music: tune(23, 'pluck', 104),
    games: ['bubble-pop', 'peg-garden', 'bounce-back', 'bumper-garden'],
  },
  {
    id: 'music-mountain',
    name: 'Music Mountain',
    line: 'subject.music',
    host: { kind: 'bear' },
    backdrop: { sky: [0xd9c8f2, 0xfff6e0], hills: [0xc9b5ec, 0xb7e3d4, 0xa8dc8f], horizon: 0.4, clouds: 2, sun: true, seed: 103 },
    music: tune(31, 'marimba', 100),
    games: ['jelly-drums', 'song-maker', 'sound-garden', 'rhythm-neighbors', 'beat-builder'],
  },
  {
    id: 'treehouse',
    name: 'Paint Pier',
    line: 'subject.art',
    host: { kind: 'cat' },
    backdrop: { sky: [0xffd6e3, 0xfff6e0], hills: [0xb8e1f7, 0x8fd0ef, 0xf3dcb0], horizon: 0.4, clouds: 3, sun: true, seed: 107 },
    music: tune(41, 'bell', 84),
    games: ['rainbow-fingers', 'fluffy-salon', 'stamp-studio', 'pixel-pictures'],
  },
  {
    id: 'barnyard',
    name: 'Barnyard',
    line: 'subject.animals',
    host: { kind: 'cow' },
    backdrop: { sky: [0xbfe6fb, 0xfff6e0], hills: [0xcde8a4, 0xa8dc8f, 0x8fcf73], horizon: 0.4, clouds: 3, sun: true, seed: 109 },
    music: tune(53, 'marimba', 96),
    games: ['peekaboo-barn', 'duckling-parade', 'roundup', 'egg-catch', 'animal-snack', 'critter-sort'],
  },
  {
    id: 'counting-cove',
    name: 'Counting Cove',
    line: 'subject.numbers',
    host: { kind: 'pig' },
    backdrop: { sky: [0xb7ecf0, 0xfff6e0], hills: [0x8fd9df, 0x9fe0c9, 0xf6e3ad], horizon: 0.4, clouds: 2, sun: true, seed: 113 },
    music: tune(61, 'pluck', 98),
    games: ['duck-pond', 'monster-munch', 'little-helpers', 'pet-kitchen', 'frog-hop', 'picture-graph', 'lasso-loops'],
  },
  {
    id: 'cozy-village',
    name: 'Cozy Village',
    line: 'subject.everyday',
    host: { kind: 'hazel' },
    backdrop: { sky: [0xffe2c4, 0xfff6e0], hills: [0xd8ecb0, 0xbfe39a, 0xa8dc8f], horizon: 0.4, clouds: 2, sun: true, seed: 127 },
    music: tune(71, 'bell', 92),
    games: ['splish-splash', 'feelings-faces', 'weather-wardrobe', 'scoop-shop', 'mail-carrier', 'teddy-doctor', 'market-stall', 'clock-tower', 'stop-and-go', 'pet-says', 'lemonade-stand'],
  },
  {
    id: 'rainbow-meadow',
    name: 'Rainbow Meadow',
    line: 'subject.shapes',
    host: { kind: 'juniper' },
    backdrop: { sky: [0xc4ecff, 0xfff6e0], hills: [0xf5d0e6, 0xbfe39a, 0x9ad77e], horizon: 0.4, clouds: 3, sun: true, seed: 131 },
    music: tune(83, 'bell', 96),
    games: ['shape-sorter', 'color-garden', 'dot-link', 'tangram-town', 'garden-grow', 'treasure-map', 'owl-walk'],
  },
  {
    id: 'puzzle-peaks',
    name: 'Puzzle Peaks',
    line: 'subject.puzzles',
    host: { kind: 'dog' },
    backdrop: { sky: [0xcfe0ff, 0xfff6e0], hills: [0xb3c7f2, 0x9ed6c6, 0xa8dc8f], horizon: 0.4, clouds: 2, sun: true, seed: 137 },
    music: tune(97, 'marimba', 92),
    games: ['pattern-train', 'memory-match', 'size-parade', 'puzzle-pals', 'quick-tricks', 'peekaround-island', 'penguin-slide', 'secret-code', 'garden-rows', 'ferry-jam', 'critter-crossing'],
  },
  {
    id: 'story-grove',
    name: 'Story Grove',
    line: 'subject.stories',
    host: { kind: 'bunny', color: 'purple' },
    backdrop: { sky: [0xd6efc8, 0xfff6e0], hills: [0x9fd3a8, 0x86c98f, 0x8fcf73], horizon: 0.4, clouds: 2, sun: true, seed: 139 },
    music: tune(103, 'bell', 80),
    games: ['letter-trails', 'story-steps', 'word-monsters', 'photo-safari', 'goodnight-room', 'rhyme-time', 'opposites', 'clap-syllables'],
  },
  {
    id: 'tinker-lab',
    name: 'Tinker Lab',
    line: 'subject.science',
    host: { kind: 'cat', color: 'blue' },
    backdrop: { sky: [0xc8f0ec, 0xfff6e0], hills: [0xa9e0d6, 0xc5e7a8, 0xa8dc8f], horizon: 0.4, clouds: 2, sun: true, seed: 149 },
    music: tune(113, 'pluck', 100),
    games: ['robot-path', 'bug-builder', 'sink-float', 'bouncy-launch', 'seesaw-balance', 'light-lab', 'ramp-race', 'inchworm', 'block-tower', 'chain-reaction', 'habitat-helpers'],
  },
];

export const landFor = (id: LandId): Land => LANDS.find((l) => l.id === id) ?? LANDS[0];
export const isLandId = (id: unknown): id is LandId => LAND_IDS.includes(id as LandId);
/** The land a game lives in. */
export const landOf = (gameId: string): Land | undefined => LANDS.find((l) => l.games.includes(gameId));

/** Whether a game is for this age or a younger one: younger favorites never disappear as she grows. */
export const forAgeOrYounger = (mod: Pick<GameModule, 'bands'>, band: Band) => bandRank(lowestBand(mod.bands)) <= bandRank(band);

/** A land's games for her age and younger, in the land's order. */
export function visibleIn(land: Land, band: Band, games: readonly GameModule[]): GameModule[] {
  return land.games.map((id) => games.find((g) => g.id === id)).filter((g): g is GameModule => !!g && forAgeOrYounger(g, band));
}

/** A land's games for bigger kids: what its signpost shows. */
export function olderIn(land: Land, band: Band, games: readonly GameModule[]): GameModule[] {
  return land.games.map((id) => games.find((g) => g.id === id)).filter((g): g is GameModule => !!g && !forAgeOrYounger(g, band));
}

/** Every game for her age and younger, in catalog order: what the home spot lists. */
export const visibleGames = (band: Band, games: readonly GameModule[]): GameModule[] => games.filter((g) => forAgeOrYounger(g, band));

/**
 * What a land's host suggests: a game she has not finished a round of yet, else the one she played longest ago
 * (never played counts as longest), never the one suggested just before unless it is the only one.
 */
export function suggest(
  choices: readonly GameModule[],
  stats: Readonly<Record<string, { plays: number; history: readonly { at: number }[] }>>,
  last?: string,
): GameModule | null {
  const pool = choices.length > 1 ? choices.filter((g) => g.id !== last) : choices;
  if (!pool.length) return null;
  const fresh = pool.find((g) => !((stats[g.id]?.plays ?? 0) > 0));
  if (fresh) return fresh;
  const lastAt = (g: GameModule) => stats[g.id]?.history.at(-1)?.at ?? 0;
  return pool.reduce((a, b) => (lastAt(b) < lastAt(a) ? b : a));
}

// Layout --------------------------------------------------------------------------------------------

export interface Spot {
  x: number;
  y: number;
}

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Box {
  w: number;
  h: number;
}

/** A spot's touch area: the drawing's box standing on the spot (feet at y), with room around it. Always over 100 units. */
export const spotRect = (s: Spot, box: Box): Rect => ({ x: s.x - box.w / 2 - 15, y: s.y - box.h - 20, w: box.w + 30, h: box.h + 45 });

export const overlaps = (a: Rect, b: Rect) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;

/** The bottom-left corner where the guide pet stands in a land and on the home spot's path. */
export const petCorner = (h: number): Rect => ({ x: 0, y: h - 205, w: 200, h: 205 });

/** The corner buttons of a land: the map (top-left) and the sticker book (top-right), as squares round their circles. */
export const landButtons = (w: number): Rect[] => [
  { x: 0, y: 0, w: 130, h: 130 },
  { x: w - 130, y: 0, w: 130, h: 130 },
];

export interface LandLayout {
  /** The size every drawing is fitted into. */
  box: Box;
  host: Spot;
  games: Spot[];
  /** The signpost to the bigger kids' games, when there are any. */
  sign: Spot | null;
}

/** Drawing sizes to try, largest first. The touch areas stay over 100 units at every one. */
const BOXES: Box[] = [
  { w: 170, h: 155 },
  { w: 160, h: 146 },
  { w: 150, h: 138 },
  { w: 140, h: 130 },
];

/**
 * Where the host, the games and the signpost stand in a land of `games` games, on one screen. Rows start on the
 * ground (`ground`, the backdrop's horizon) and below the corner buttons, end above the bottom edge, and keep
 * clear of the pet's corner. The host stands first and the signpost last. Null if they cannot fit at any
 * size; a test makes sure every land fits at every band, so a new game that would crowd a land fails a test
 * instead of shrinking the targets.
 */
export function landLayout(games: number, sign: boolean, view: { w: number; h: number }, ground: number): LandLayout | null {
  const need = games + 1 + (sign ? 1 : 0);
  for (const box of BOXES) {
    const colGap = box.w + 30 + 10;
    const rowGap = box.h + 45 + 10;
    const top = Math.max(150 + box.h + 20, ground + 18);
    const bottom = view.h - 30;
    const left = box.w / 2 + 30;
    const right = view.w - box.w / 2 - 30;
    if (bottom < top || right < left) continue;
    const maxRows = Math.floor((bottom - top) / rowGap) + 1;
    for (let rows = 1; rows <= maxRows; rows++) {
      // Rows sit together a little above the middle of the ground rather than pinned to its edges.
      const step = rows === 1 ? 0 : Math.min((bottom - top) / (rows - 1), rowGap * 1.3);
      const first = top + (bottom - top - step * (rows - 1)) * 0.45;
      const ys = Array.from({ length: rows }, (_, r) => first + r * step);
      // A row that reaches down into the pet's corner starts to the right of it.
      const pet = petCorner(view.h);
      const spans = ys.map((y) => {
        const probe = spotRect({ x: left, y }, box);
        const from = overlaps(probe, pet) ? pet.x + pet.w + box.w / 2 + 16 : left;
        return { y, from, cap: right >= from ? Math.floor((right - from) / colGap) + 1 : 0 };
      });
      if (spans.reduce((t, s) => t + s.cap, 0) < need) continue;
      // Fill rows from the top, as evenly as their room allows.
      const counts = spans.map(() => 0);
      let left2 = need;
      for (let r = 0; r < spans.length; r++) {
        const rest = spans.slice(r).reduce((t, s) => t + s.cap, 0);
        const share = Math.ceil(left2 / (spans.length - r));
        counts[r] = Math.min(spans[r].cap, Math.max(share, left2 - (rest - spans[r].cap)));
        left2 -= counts[r];
      }
      const spots: Spot[] = [];
      spans.forEach(({ y, from }, r) => {
        const n = counts[r];
        if (!n) return;
        // Spread a row across the land, but not so far that a short row looks scattered.
        const width = Math.min(right - from, (n - 1) * colGap * 1.7);
        const start = from + (right - from - width) / 2;
        for (let i = 0; i < n; i++) spots.push({ x: n === 1 ? (from + right) / 2 : start + (i * width) / (n - 1), y });
      });
      return { box, host: spots[0], games: spots.slice(1, 1 + games), sign: sign ? spots[spots.length - 1] : null };
    }
  }
  return null;
}

/** Everything on the map: the ten lands, the person's home spot and the Windy Picnic. */
export type MapSpotId = LandId | 'home' | 'picnic';

/** A map spot's touch circle. Two of them never overlap, and none reaches a corner button. */
export const MAP_RADIUS = 80;

/** Where each spot stands, as fractions of the map's usable rectangle, for a wide screen and an upright one. */
const MAP_WIDE: Record<MapSpotId, [number, number]> = {
  'music-mountain': [0.07, 0], 'puzzle-peaks': [0.37, 0], 'story-grove': [0.66, 0], 'tinker-lab': [0.95, 0],
  treehouse: [0, 0.5], 'cozy-village': [0.31, 0.5], home: [0.63, 0.5], barnyard: [1, 0.5],
  'bubble-beach': [0.17, 1], 'counting-cove': [0.4, 1], 'rainbow-meadow': [0.63, 1], picnic: [0.86, 1],
};
const MAP_TALL: Record<MapSpotId, [number, number]> = {
  'music-mountain': [0.08, 0], 'puzzle-peaks': [0.5, 0], 'story-grove': [0.92, 0],
  treehouse: [0.02, 1 / 3], home: [0.5, 1 / 3], 'tinker-lab': [0.98, 1 / 3],
  'cozy-village': [0, 2 / 3], barnyard: [0.5, 2 / 3], 'rainbow-meadow': [1, 2 / 3],
  'bubble-beach': [0.18, 1], 'counting-cove': [0.5, 1], picnic: [0.82, 1],
};

/**
 * The map's own buttons, as circles: "Who's playing?" (top-left), the treehouse (bottom-left), the book
 * (bottom-right), and the grown-ups' gear (top-right). The gear is plain HTML of a fixed size in CSS pixels
 * (52 across, 12 from the corner), so on a phone, where a logical unit is small, it covers more of the map.
 */
export const mapButtons = (view: { w: number; h: number; scale: number }) => [
  { x: 75, y: 70, r: 66 },
  { x: 75, y: view.h - 70, r: 66 },
  { x: view.w - 75, y: view.h - 70, r: 66 },
  { x: view.w - 38 / view.scale, y: 38 / view.scale, r: 26 / view.scale + 10 },
];

/** Where every map spot stands in a view. */
export function mapLayout(view: { w: number; h: number }): Record<MapSpotId, Spot> {
  const wide = view.w >= view.h;
  const table = wide ? MAP_WIDE : MAP_TALL;
  const x0 = 125;
  const x1 = view.w - 125;
  const y0 = 195;
  const y1 = view.h - (wide ? 110 : 120);
  const out = {} as Record<MapSpotId, Spot>;
  for (const [id, [fx, fy]] of Object.entries(table) as [MapSpotId, [number, number]][]) out[id] = { x: x0 + fx * (x1 - x0), y: y0 + fy * (y1 - y0) };
  return out;
}
