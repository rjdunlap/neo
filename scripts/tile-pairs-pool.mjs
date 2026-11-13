// Writes src/games/tile-pairs/pools.ts: Tile Pairs' frozen tricky deals. Level 10 *Tricky twins* uses level 5's
// twin terraces. Candidates are dealt as `deal` deals level 5 (complete pairs placed on a seeded clearing route, so
// every one clears), then kept only when (1) random play clears at most 30% of 400 play-outs, leaving room under
// the level's 35% band for a fresh measure, (2) some legal first pair leaves no clearing route, and (3) the fair-trap
// check passes: a player who keeps the most pairs open looking two pairs ahead clears it however they break ties.
// Deals equal under the left-right mirror or a renaming of pictures count once. Too few seeded deals meet the band
// (about 7% measured) to find one while she waits, which is why they are frozen.
//
// It also writes src/games/tile-pairs/puzzles.ts: the designed lesson boards of levels 17–19. Each lesson's sketch
// (`SKETCHES` in logic.ts) gets pictures placed as complete pairs on a seeded clearing route, so every one clears, and
// a placement is kept only when `lessonHolds` says it teaches the lesson on the first move. Reproducible:
//   node scripts/tile-pairs-pool.mjs
import { writeFileSync } from 'node:fs';
import { Rng } from '../src/engine/random.ts';
import {
  clearRate,
  fairTrap,
  layout,
  lessonHolds,
  losingFirstPairs,
  mirrorX,
  planFor,
  PUZZLE_PLANS,
  seededRoute,
} from '../src/games/tile-pairs/logic.ts';

const PER_POOL = 24;
const MAX_RATE = 0.3;
const PLAYOUTS = 400;
const POOLS = [{ name: 'twins', level: 10, dealtAs: 5 }];
const PER_LESSON = 8;
const MAX_TRIES = 200000;

/** The deal written with its pictures renamed in order of first appearance, so renamings compare equal. */
function canonical(kinds) {
  const names = new Map();
  return kinds.map((k) => (names.has(k) ? names.get(k) : (names.set(k, names.size), names.get(k)))).join('');
}

/** Seeded placements of a level's pictures on its layout, as `deal` places them: complete pairs on a clearing route. */
function place(level, layoutOf, seed) {
  const rng = new Rng(seed),
    tiles = layout(layoutOf),
    symbols = Array.from({ length: tiles.length / 2 }, (_, i) => i % planFor(level).kinds);
  rng.shuffle(symbols);
  seededRoute(tiles, rng).forEach((pair, k) => pair.forEach((i) => (tiles[i].kind = symbols[k])));
  return tiles;
}
/** The deal's key, the same for its mirror and for any renaming of its pictures. */
function keyOf(plan, tiles) {
  const at = new Map(tiles.map((t, i) => [`${t.x},${t.y},${t.z}`, i])),
    kinds = tiles.map((t) => t.kind),
    mirrored = tiles.map((t) => kinds[at.get(`${mirrorX(plan, t.x)},${t.y},${t.z}`)]);
  return [canonical(kinds), canonical(mirrored)].sort()[0];
}

const lessons = {};
for (const level of Object.keys(PUZZLE_PLANS).map(Number)) {
  const plan = planFor(level),
    kept = [],
    seen = new Set();
  let tried = 0;
  for (let seed = 1; kept.length < PER_LESSON && seed <= MAX_TRIES; seed++) {
    tried++;
    const tiles = place(level, level, seed),
      key = keyOf(plan, tiles);
    if (seen.has(key)) continue;
    seen.add(key);
    if (!lessonHolds(plan.puzzle, tiles)) continue;
    kept.push(canonical(tiles.map((t) => t.kind)));
  }
  console.log(`${plan.puzzle}: kept ${kept.length} of ${tried} seeded placements (${seen.size} distinct)`);
  if (kept.length < PER_LESSON) throw new Error(`Too few ${plan.puzzle} boards`);
  lessons[plan.puzzle] = kept;
}

const out = {};
for (const { name, level, dealtAs } of POOLS) {
  const plan = planFor(level),
    kept = [],
    seen = new Set();
  let tried = 0;
  for (let seed = 1; kept.length < PER_POOL; seed++) {
    tried++;
    const rng = new Rng(seed),
      tiles = layout(dealtAs),
      symbols = Array.from({ length: tiles.length / 2 }, (_, i) => i % plan.kinds);
    rng.shuffle(symbols);
    seededRoute(tiles, rng).forEach((pair, k) => pair.forEach((i) => (tiles[i].kind = symbols[k])));
    const at = new Map(tiles.map((t, i) => [`${t.x},${t.y},${t.z}`, i])),
      kinds = tiles.map((t) => t.kind),
      mirrored = tiles.map((t) => kinds[at.get(`${mirrorX(plan, t.x)},${t.y},${t.z}`)]),
      key = [canonical(kinds), canonical(mirrored)].sort()[0];
    if (seen.has(key)) continue;
    if (clearRate(tiles, new Rng(seed + 1e6), PLAYOUTS) > MAX_RATE) continue;
    if (!losingFirstPairs(tiles).length) continue;
    if (!fairTrap(tiles)) continue;
    seen.add(key);
    kept.push(canonical(kinds));
  }
  console.log(`${name}: kept ${kept.length} of ${tried} seeded deals`);
  out[name] = kept;
}

const body = Object.entries(out)
  .map(([name, deals]) => `  ${name}: [\n${deals.map((d) => `    '${d}',`).join('\n')}\n  ],`)
  .join('\n');
writeFileSync(
  new URL('../src/games/tile-pairs/pools.ts', import.meta.url),
  `// Written by scripts/tile-pairs-pool.mjs; do not edit by hand. Each string is one frozen deal: the picture (0–4)
// at each position of the level's layout, in \`layout()\` order.
export const POOLS = {
${body}
} as const satisfies Record<string, readonly string[]>;
`,
);

writeFileSync(
  new URL('../src/games/tile-pairs/puzzles.ts', import.meta.url),
  `// Written by scripts/tile-pairs-pool.mjs; do not edit by hand. Each string is one designed lesson board: the
// picture (0–3) at each position of the lesson's sketch, in \`layout()\` order. \`lessonHolds\` holds for each.
export const PUZZLES = {
${Object.entries(lessons)
  .map(([name, boards]) => `  ${name}: [\n${boards.map((d) => `    '${d}',`).join('\n')}\n  ],`)
  .join('\n')}
} as const satisfies Record<string, readonly string[]>;
`,
);
