// RW02b (docs/rework/GENERATED-CREATURE-PILOT.md): rebuilds the illustrated cloud glider from the
// generated concept sheet. A thin wrapper over `prepare-sprite.mjs` with the pilot's box (the
// "Illustrated adventure" glider on the 1536 × 1024 sheet) and seed (the white of its eye), kept so
// `node scripts/creature-art/prepare-glider.mjs [--check]` writes the same bytes as the pilot did.
import { run } from './prepare-sprite.mjs';

await run([
  '--in', 'docs/rework/concepts/art-directions-2026-10-16.png',
  '--out', 'src/art/creatures/illustrated/glider.png',
  '--box', '528,262,462,194',
  '--seed', '925,360',
  '--bg', 'paper',
  '--pad', '8',
  '--scale', '0.83',
  '--previews', 'test-results/rw02b-glider',
  ...process.argv.slice(2),
]).catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
