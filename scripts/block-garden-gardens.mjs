// Writes src/games/block-garden/puzzles.ts: Block Garden's frozen gardens for levels 5–8, each a seeded candidate from
// `candidate()` (built from the level's template, then checked by the solver and the level's filter). Reproducible:
//   node scripts/block-garden-gardens.mjs
import { writeFileSync } from 'node:fs';
import { Rng } from '../src/engine/random.ts';
import { candidate, encode, planFor } from '../src/games/block-garden/logic.ts';

const PER_LEVEL = 14;
const CAP = 2_000_000;
const out = {};
for (const level of [5, 6, 7, 8]) {
  const plan = planFor(level);
  const seen = new Set();
  const list = [];
  for (let seed = 1; list.length < PER_LEVEL && seed < 20000; seed++) {
    const g = candidate(plan, new Rng(level * 100003 + seed), CAP);
    if (!g) continue;
    const text = encode(g);
    const bed = text.split(':')[0];
    if (seen.has(bed)) continue;
    seen.add(bed);
    list.push(text);
  }
  out[level] = list;
  console.log(`level ${level}: ${list.length}`);
}

const body = Object.entries(out).map(([level, list]) => `  ${level}: [\n${list.map((t) => `    '${t}',`).join('\n')}\n  ],`).join('\n');
writeFileSync(new URL('../src/games/block-garden/puzzles.ts', import.meta.url), `/**
 * Block Garden's frozen gardens for levels 5–8, written by \`node scripts/block-garden-gardens.mjs\`: each a seeded candidate built
 * from its level's template and kept only when the solver finds its par inside the level's range and the level's filter passes.
 * Format: \`encode()\` in \`logic.ts\` (bed rows, pieces in arrival order, the solver's shortest solution). \`logic.test.ts\` checks
 * every one again. A round picks one and may show it under one of the square's symmetries.
 */
export const GARDENS: Record<number, readonly string[]> = {
${body}
};
`);
