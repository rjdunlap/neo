// Writes src/games/dot-link/gardens.ts: Dot Link level 10's frozen boards (Clear the garden). A board is a seeded 4×4 of
// three colors, kept when the fewest lines that clear it (the exact solver) is 4 or 5, a player who always draws the
// line that pops the most needs at least two more than that (so the order of lines matters), and the solver looks at no
// more than 6,000 positions (so a hint is quick on a phone). A board is stored with its colors named in order of first
// appearance and only once with its mirror, so rounds differ. Reproducible:
//   node scripts/dot-link-gardens.mjs
import { writeFileSync } from 'node:fs';
import { Rng } from '../src/engine/random.ts';
import { gardenText, greedyGarden, parseGarden, solveGarden } from '../src/games/dot-link/logic.ts';

const WANT = 24;
const MAX_POSITIONS = 6000;
const canon = (text) => {
  const names = new Map();
  return [...text]
    .map((k) => (k === '/' ? k : (names.get(k) ?? names.set(k, 'abc'[names.size]).get(k))))
    .join('');
};
const mirror = (text) =>
  text
    .split('/')
    .map((row) => [...row].reverse().join(''))
    .join('/');
const kept = [];
const seen = new Set();
for (let seed = 1; kept.length < WANT && seed < 100000; seed++) {
  const rng = new Rng(seed);
  const board = Array.from({ length: 4 }, () => Array.from({ length: 4 }, () => rng.int(0, 2)));
  const text = canon(gardenText(board));
  if (seen.has(text) || new Set(text.replace(/\//g, '')).size < 3) continue;
  seen.add(text);
  seen.add(canon(mirror(text)));
  const g = parseGarden(text);
  const s = solveGarden(g);
  if (s.lines < 4 || s.lines > 5 || s.positions > MAX_POSITIONS) continue;
  if (greedyGarden(g) < s.lines + 2) continue;
  kept.push({ text, lines: s.lines });
}
const body = kept.map((k) => `  { board: '${k.text}', lines: ${k.lines} },`).join('\n');
writeFileSync(
  new URL('../src/games/dot-link/gardens.ts', import.meta.url),
  `// Written by scripts/dot-link-gardens.mjs; do not edit by hand. Level 10's boards, row by row from the top, colors a b c
// (the round's three colors in its shuffled order); \`lines\` is the fewest that clear it, from the exact solver.
export const GARDENS: readonly { board: string; lines: number }[] = [
${body}
];
`,
);
console.log(`${kept.length} gardens`, kept.map((k) => k.lines).join(' '));
