#!/usr/bin/env node
// Each game keeps its spoken lines in src/games/<id>/voice.ts (`VOICE`) and its how-to card in
// src/games/<id>/howto.ts (`HOW_TO`). This writes the marked blocks in src/content/voice-script.ts and
// src/content/howto.ts that gather them, so SCRIPT, LineId and HOW_TO stay static (the voice-clip renderer loads
// voice-script.ts in plain Node, which is why the imports carry `.ts`).
//
//   node scripts/content-barrels.mjs           # rewrite the blocks after adding or removing a game's file
//   node scripts/content-barrels.mjs --check   # exit 1 if a block is stale (src/content/barrels.test.ts runs it)
import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const defaultRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');

/** `fill-dump` → `fillDump`. */
export const camel = (id) => id.replace(/-([a-z0-9])/g, (_, c) => c.toUpperCase());

/** Game folders that have `file`, sorted. */
export function gamesWith(file, root = defaultRoot) {
  const gamesDir = join(root, 'src/games');
  return readdirSync(gamesDir)
    .filter((d) => statSync(join(gamesDir, d)).isDirectory() && existsSync(join(gamesDir, d, file)))
    .sort();
}

const BLOCKS = [
  {
    path: 'src/content/voice-script.ts',
    file: 'voice.ts',
    imports: (ids) => ids.map((id) => `import { VOICE as ${camel(id)}Voice } from '../games/${id}/voice.ts';`),
    entries: (ids) => ids.map((id) => `  ...${camel(id)}Voice,`),
  },
  {
    path: 'src/content/howto.ts',
    file: 'howto.ts',
    imports: (ids) => ids.map((id) => `import { HOW_TO as ${camel(id)}HowTo } from '../games/${id}/howto.ts';`),
    entries: (ids) => ids.map((id) => `  '${id}': ${camel(id)}HowTo,`),
  },
];

function fill(text, name, lines, path) {
  const begin = `// BEGIN ${name} (scripts/content-barrels.mjs)`;
  const end = `// END ${name}`;
  const re = new RegExp(`^([ \\t]*)${begin.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\n[\\s\\S]*?^[ \\t]*${end}$`, 'm');
  const m = re.exec(text);
  if (!m) throw new Error(`${path}: no "${begin}" … "${end}" block`);
  return text.replace(re, [`${m[1]}${begin}`, ...lines, `${m[1]}${end}`].join('\n'));
}

/** The files as they should be: [{ path, text, stale }]. */
export function barrels(root = defaultRoot) {
  return BLOCKS.map((b) => {
    const ids = gamesWith(b.file, root);
    const old = readFileSync(join(root, b.path), 'utf8');
    let text = fill(old, 'game imports', b.imports(ids), b.path);
    text = fill(text, 'game entries', b.entries(ids), b.path);
    return { path: b.path, text, stale: text !== old };
  });
}

const isMain = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const check = process.argv.includes('--check');
  let stale = 0;
  for (const b of barrels()) {
    if (!b.stale) continue;
    stale++;
    if (check) console.log(`${b.path} is stale: run node scripts/content-barrels.mjs`);
    else writeFileSync(join(defaultRoot, b.path), b.text);
  }
  if (!check) console.log(stale ? `rewrote ${stale} file(s)` : 'barrels current');
  process.exit(check && stale ? 1 : 0);
}
