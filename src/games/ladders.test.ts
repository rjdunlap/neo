import { describe, expect, it } from 'vitest';

// A game's level ladder lives in its logic.ts, where a test can read it without loading Pixi (codebase review item 5;
// `node scripts/ladders-into-logic.mjs <id>` moves one). Both lists only shrink: a game that is moved must leave them.
const SOURCES = import.meta.glob<string>('./*/index.ts', { query: '?raw', import: 'default', eager: true });
const source = (id: string) => SOURCES[`./${id}/index.ts`];
const ids = Object.keys(SOURCES).map((p) => p.split('/')[1]).sort();

/** Games whose index.ts still declares `const LEVELS`, for the codemod's sweep. */
const TABLE_IN_INDEX = [
  'adventure-walk', 'attic-finds', 'beat-builder', 'block-garden', 'block-topple', 'block-tower', 'bolt-boards',
  'bond-beads', 'bounce-back', 'bouncy-launch', 'bubble-pop', 'bumper-garden', 'caravan-days', 'chain-reaction',
  'circuit-garden', 'clap-syllables', 'clock-tower', 'color-garden', 'critter-crossing', 'critter-sort', 'crossword',
  'cue-studio', 'day-by-day', 'domino-run', 'dot-link', 'duck-pond', 'duckling-parade', 'egg-catch', 'example-express',
  'far-lights', 'ferry-jam', 'fill-dump', 'fluffy-salon', 'food-web-workshop', 'fossil-dig', 'fruit-slice',
  'gadget-bench', 'garden-grow', 'garden-rows', 'gear-garden', 'gem-swap', 'goodnight-room', 'habitat-helpers',
  'hat-band', 'helper-house', 'inchworm', 'island-bridges', 'jar-sort', 'jelly-drums', 'keep-house', 'lantern-lights',
  'lasso-loops', 'lemonade-stand', 'lift-it', 'little-conductor', 'little-helpers', 'little-loom', 'logic-grid',
  'look-it-up', 'lost-layers', 'mail-carrier', 'market-stall', 'meadow-pens', 'measuring-post', 'monster-munch',
  'moon-window', 'movie-night', 'opposites', 'orchard-rows', 'owl-walk', 'pattern-train', 'peekaboo-barn',
  'peekaround-island', 'peg-garden', 'penguin-slide', 'pet-kitchen', 'pet-says', 'photo-safari', 'picture-graph',
  'picture-logic', 'pile-match', 'pixel-pictures', 'playdate-workshop', 'pond-conga', 'puddle-gobble', 'puddle-lens',
  'pyramid-solitaire', 'quick-tricks', 'rainbow-fingers', 'ramp-race', 'read-do', 'ready-for-adventure', 'relay-woods',
  'rhyme-time', 'rhythm-neighbors', 'river-tablets', 'robot-path', 'roundup', 'sand-table', 'scoop-shop',
  'second-chance-shed', 'secret-code', 'seed-travelers', 'seesaw-balance', 'sense-detective', 'shape-sorter',
  'sing-along-barn', 'size-parade', 'snowball-merge', 'sorting-machine', 'sound-garden', 'species-comeback',
  'splish-splash', 'sprout-shuffle', 'stop-and-go', 'story-steps', 'story-weaver', 'sudoku-garden', 'swap-meet',
  'swing-pals', 'thought-bubbles', 'tile-pairs', 'timeline-trail', 'trackway-tales', 'treasure-map', 'village-vote',
  'vine-snip', 'water-road', 'weather-wardrobe', 'welcome-ways', 'word-glue', 'word-monsters', 'word-search',
];

/**
 * Games whose `levels:` is an inline table or ternary. A ternary's last branch covers every band it does not name,
 * where `rangeFor` gives a missing band { min: 1, max: 1 }, so moving one is a hand job that names every band.
 */
const INLINE_LADDER = [
  'bug-builder', 'log-roll', 'melt-freeze', 'mossy-path', 'number-nook', 'puzzle-pals', 'ribbon-workshop', 'song-maker',
  'stamp-studio', 'tangram-town',
];

const declaresTable = (src: string) => /\bconst LEVELS\b/.test(src);
const inlineLadder = (src: string) => /levels:[^\n]*\bmin:\s*\d/.test(src) || /rangeFor\(\{/.test(src);

describe('level ladders', () => {
  it('keep each table in logic.ts, outside the listed games still to move', () => {
    expect(ids.filter((id) => declaresTable(source(id)) && !TABLE_IN_INDEX.includes(id))).toEqual([]);
    expect(ids.filter((id) => inlineLadder(source(id)) && !INLINE_LADDER.includes(id))).toEqual([]);
  });

  it('drop a game from the lists once it has moved', () => {
    expect(TABLE_IN_INDEX.filter((id) => !source(id) || !declaresTable(source(id)))).toEqual([]);
    expect(INLINE_LADDER.filter((id) => !source(id) || !inlineLadder(source(id)))).toEqual([]);
  });
});
