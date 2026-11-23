// Writes src/games/fence-the-field/pools.json: Fence the Field's start positions for levels 1–4, one per symmetry
// class (docs/definitions/fence-the-field.md). Each try lays random rails on an empty field without completing a plot
// until the open-rail count is one the level allows, solves the result and keeps it when `fits` says it passes the
// level's test. Levels 2 and 3 start with no plot ready, which rails laid that freely almost never leave (68 of 35,542
// classes measured), so level 2's tries also never lay a plot's third rail, and level 3, whose every plot has exactly
// two rails open, is counted in full instead of sampled (2,604 positions in 342 classes). The first PER_POOL classes
// found for each level are written, as 24-bit numbers in the order found.
// Prints how many classes were tried, how many passed and how many are kept. Reproducible:
//   node scripts/fence-the-field-pool.mjs
import { writeFileSync } from 'node:fs';
import { Rng } from '../src/engine/random.ts';
import {
  FULL,
  PLANS,
  PLOTS,
  RAILS,
  RAIL_PLOTS,
  canonical,
  clearSolver,
  completes,
  countOpen,
  fits,
  plotOpen,
} from '../src/games/fence-the-field/logic.ts';

const PER_POOL = 60;
const TRIES = 40000;

/**
 * Random rails on an empty field, never completing a plot (`noneReady`: never laying a plot's third rail either), down
 * to `open` open rails; null when it gets stuck.
 */
function fenced(rng, open, noneReady) {
  let mask = 0;
  const allowed = (e) =>
    noneReady ? RAIL_PLOTS[e].every((p) => plotOpen(mask, p) > 2) : !completes(mask, e).length;
  while (countOpen(mask) > open) {
    const rails = [];
    for (let e = 0; e < RAILS; e++) if (!(mask & (1 << e)) && allowed(e)) rails.push(e);
    if (!rails.length) return null;
    mask |= 1 << rng.pick(rails);
  }
  return mask;
}

const pools = {};
for (const plan of PLANS) {
  const rng = new Rng(2300 + plan.level);
  const classes = [];
  const seen = new Set();
  let passed = 0;
  const tryOne = (mask) => {
    const klass = canonical(mask);
    if (seen.has(klass)) return;
    seen.add(klass);
    if (seen.size % 500 === 0) clearSolver();
    if (!fits(plan.level, klass)) return;
    passed++;
    classes.push(klass);
  };
  if (plan.level === 3) {
    for (let mask = 0; mask <= FULL; mask++)
      if ([...Array(PLOTS).keys()].every((p) => plotOpen(mask, p) === 2)) tryOne(mask);
    // Counted in full, so the kept ones are a seeded sample rather than the lowest numbers.
    rng.shuffle(classes);
  } else
    for (let t = 0; t < TRIES; t++) {
      const mask = fenced(rng, rng.int(plan.open[0], plan.open[1]), plan.level === 2);
      if (mask !== null) tryOne(mask);
    }
  classes.length = Math.min(classes.length, PER_POOL);
  pools[plan.level] = classes;
  console.log(
    `level ${plan.level} ${plan.name}: ${seen.size} classes tried, ${passed} pass, ${classes.length} kept`,
  );
}
writeFileSync(
  new URL('../src/games/fence-the-field/pools.json', import.meta.url),
  `${JSON.stringify(pools)}\n`,
);
