// Builds the guess-list block of src/games/word-code/words.ts: every five-letter lowercase entry of the system's
// /usr/share/dict/web2 (Webster's Second, 1934, public domain), plus four-letter entries with an S (simple plurals),
// the block list is applied when words.ts is read. Run: node scripts/word-code-guesses.mjs  (rewrites the GUESS_EXTRA block in place).
import { readFileSync, writeFileSync } from 'node:fs';

const file = new URL('../src/games/word-code/words.ts', import.meta.url);
const src = readFileSync(file, 'utf8');
const dict = readFileSync('/usr/share/dict/web2', 'utf8').split('\n');
const lower = new Set(dict.filter((w) => /^[a-z]+$/.test(w)));
const out = new Set();
for (const w of lower) {
  if (w.length === 5) out.add(w.toUpperCase());
  else if (w.length === 4 && !w.endsWith('s')) out.add(w.toUpperCase() + 'S');
}
const words = [...out].sort();
const lines = [];
for (let i = 0; i < words.length; i += 14) lines.push(words.slice(i, i + 14).join(' '));
const block = `/* GUESS_EXTRA:start */\nexport const GUESS_EXTRA = \`\n${lines.join('\n')}\n\`;\n/* GUESS_EXTRA:end */`;
const next = src.includes('/* GUESS_EXTRA:start */')
  ? src.replace(/\/\* GUESS_EXTRA:start \*\/[\s\S]*\/\* GUESS_EXTRA:end \*\//, block)
  : `${src}\n${block}\n`;
writeFileSync(file, next);
console.log(`${words.length} extra guess words`);
