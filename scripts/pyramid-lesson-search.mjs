// Writes src/games/pyramid-solitaire/pools.ts: Pyramid Solitaire's frozen lesson deals. Level 9 *One way in* is dealt
// as level 2 deals (four rows, a seeded clearing order, so every one clears) and kept when `oneWayIn` holds: three or
// more opening pairs, no open king, exactly one safe opening, and every losing opening strands one card the lesson line
// can name. Level 10 *Count the copies* is dealt as level 3 (five rows) and kept when `countTheCopies` finds its shape.
// A deal with five of a rank is not a pack and is skipped, and a deal read right to left counts once. At most two deals
// share a shape (the same deal with its pairs renamed, a jack-and-two for a six-and-seven, or mirrored), and the first pass
// takes one of each, so rounds vary: level 9 has only 16 shapes in two million seeds. Random dealing
// meets these properties too rarely (about 1 deal in 50 at five rows) to search while she waits, so they are frozen.
// Reproducible:
//   node scripts/pyramid-lesson-search.mjs
import { writeFileSync } from 'node:fs';
import { Rng } from '../src/engine/random.ts';
import {
  PACK_LIMIT,
  at,
  countTheCopies,
  dealCandidate,
  decodeDeal,
  encodeDeal,
  oneWayIn,
} from '../src/games/pyramid-solitaire/logic.ts';

const PER_POOL = 24;
const MAX_TRIES = 2000000;
const PER_SHAPE = 2;
const POOLS = [
  { name: 'one-way', dealtAs: 2, rows: 4, holds: oneWayIn },
  { name: 'copies', dealtAs: 3, rows: 5, holds: (p) => countTheCopies(p) !== null },
];

/** The deal read right to left in every row. */
function mirror(deal, rows) {
  let out = '';
  for (let row = 0; row < rows; row++) for (let col = 0; col <= row; col++) out += deal[at(row, row - col)];
  return out;
}

/** The deal with its pairs renamed in order of first appearance: kings stay K, a pair is a letter, its partner primed. */
function shape(deal) {
  const names = new Map();
  return [...deal]
    .map((c) => {
      if (c === 'K') return 'K';
      const rank = 'A23456789TJQ'.indexOf(c) + 1,
        low = Math.min(rank, 13 - rank);
      if (!names.has(low)) names.set(low, [String.fromCharCode(97 + names.size), rank]);
      const [name, first] = names.get(low);
      return rank === first ? name : `${name}'`;
    })
    .join(' ');
}

const found = {};
for (const pool of POOLS) {
  const seen = new Set(),
    shapes = new Map(),
    deals = [];
  let tries = 0;
  for (let cap = 1; cap <= PER_SHAPE && deals.length < PER_POOL; cap++)
    for (let seed = 1; deals.length < PER_POOL && seed <= MAX_TRIES; seed++) {
      tries = Math.max(tries, seed);
      const { puzzle } = dealCandidate(pool.dealtAs, new Rng(seed));
      const counts = new Map();
      for (const r of puzzle.ranks) counts.set(r, (counts.get(r) ?? 0) + 1);
      if ([...counts.values()].some((n) => n > PACK_LIMIT)) continue;
      const deal = encodeDeal(puzzle),
        flip = mirror(deal, pool.rows),
        key = [deal, flip].sort()[0],
        form = [shape(deal), shape(flip)].sort()[0];
      if (seen.has(key) || (shapes.get(form) ?? 0) >= cap || !pool.holds(decodeDeal(pool.rows, deal)))
        continue;
      seen.add(key);
      shapes.set(form, (shapes.get(form) ?? 0) + 1);
      deals.push(deal);
    }
  console.log(`${pool.name}: ${deals.length} deals, ${shapes.size} shapes, from ${tries} seeds`);
  found[pool.name] = deals;
}

const lines = [
  '// Written by scripts/pyramid-lesson-search.mjs; do not edit by hand. Each string is one frozen lesson deal: a card per',
  '// pyramid position, top first and left to right in each row, as A23456789TJQK (T is ten). `one-way` is level 9 (four',
  '// rows), `copies` level 10 (five rows).',
  'export const POOLS = {',
  ...POOLS.flatMap((pool) => [
    `  ${pool.name.includes('-') ? `'${pool.name}'` : pool.name}: [`,
    ...found[pool.name].map((d) => `    '${d}',`),
    '  ],',
  ]),
  '} as const;',
  '',
];
writeFileSync(new URL('../src/games/pyramid-solitaire/pools.ts', import.meta.url), lines.join('\n'));
