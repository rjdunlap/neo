// Brings generated images (ChatGPT downloads, or any image tool's) into the repository in one step.
//
//   node scripts/art/import-inbox.mjs [--dry-run] [--choose <file>]... [--tool "<text>"] [--inbox <dir>]
//
// 1. Reads every PNG in docs/rework/concepts/inbox/ (git ignores that folder's images).
// 2. Refuses a name the art queue does not list, or an image under the art bible's size, and leaves it there.
// 3. Moves each original, byte for byte, to docs/rework/concepts/generated/<stem>-<n>.png (the next free n)
//    and adds a manifest row to docs/rework/concepts/generated/README.md.
// 4. A stem with one new candidate and nothing chosen is chosen; several candidates wait for
//    `--choose <stem>-<n>.png` (a coding session picks with the art bible's review checklist).
// 5. Prepares every chosen file it touched: a backdrop becomes src/art/locations/<land-id>.webp and a
//    480 × 360 Places card <land-id>-card.webp (sharp, as src/art/home/README.md does); a creature or
//    friend set runs scripts/creature-art/prepare-sprite.mjs --set <name> --shrink 2 into its folder.
//
// Wiring a prepared texture into a scene is code, done once per kind by its build slice
// (docs/rework/POLISH.md); after that slice, a new file of that kind needs only this script.
// Rules and tests: inbox-core.mjs. Pipeline: docs/rework/art-requests/IMPORT.md.

import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, readFileSync, renameSync, statSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chosenFor, insertRows, parseName, plan, setChosen } from './inbox-core.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const at = (p) => resolve(root, p);
const require = createRequire(import.meta.url);

const args = process.argv.slice(2);
const opt = { dryRun: false, choose: [], tool: 'ChatGPT (developer); model as shown in ChatGPT', inbox: 'docs/rework/concepts/inbox' };
for (let i = 0; i < args.length; i++) {
  const a = args[i];
  if (a === '--dry-run') opt.dryRun = true;
  else if (a === '--choose') opt.choose.push(args[++i]);
  else if (a === '--tool') opt.tool = args[++i];
  else if (a === '--inbox') opt.inbox = args[++i];
  else throw new Error(`unknown argument ${a}`);
}

const generated = at('docs/rework/concepts/generated');
const manifestPath = join(generated, 'README.md');
let manifest = readFileSync(manifestPath, 'utf8');
const sharp = require('sharp');

const inbox = at(opt.inbox);
const drops = [];
for (const file of existsSync(inbox) ? readdirSync(inbox) : []) {
  if (file.startsWith('.') || file === 'README.md') continue;
  const path = join(inbox, file);
  if (!statSync(path).isFile()) continue;
  let size = null;
  if (/\.png$/i.test(file)) {
    const m = await sharp(path).metadata();
    size = { w: m.width, h: m.height };
  }
  drops.push({ file, size });
}

const date = new Date().toISOString().slice(0, 10);
const p = plan(drops, { existing: readdirSync(generated), manifest, date, tool: opt.tool });

for (const r of p.refused) console.log(`refused  ${r.file}: ${r.reason}`);
for (const m of p.moves) console.log(`import   ${m.from} → generated/${m.to}${m.chosen ? ' (chosen)' : ''}`);

const touched = new Set(p.moves.filter((m) => m.chosen).map((m) => m.info.stem));
const infoFor = new Map(p.moves.map((m) => [m.info.stem, m.info]));
for (const file of opt.choose) {
  const stem = file.replace(/-\d+\.png$/, '');
  touched.add(stem);
  if (!infoFor.has(stem)) infoFor.set(stem, parseName(`${stem}.png`));
}

if (opt.dryRun) {
  for (const w of p.waiting) console.log(`waiting  ${w.stem}: several candidates; pick one with --choose ${w.files[0]}`);
  console.log('dry run: nothing moved or written');
  process.exit(0);
}

for (const m of p.moves) renameSync(join(inbox, m.from), join(generated, m.to));
manifest = p.rows.length ? insertRowsOnce(manifest, p.rows) : manifest;
for (const file of opt.choose) manifest = setChosen(manifest, file);
writeFileSync(manifestPath, manifest);
for (const w of p.waiting) if (!opt.choose.some((f) => f.startsWith(`${w.stem}-`))) console.log(`waiting  ${w.stem}: several candidates; pick one with --choose ${w.files[0]}`);

// Prepare what is chosen. A creature or friend set is prepared once per group, from every chosen file.
const sets = new Map();
for (const stem of touched) {
  const info = infoFor.get(stem);
  const chosen = chosenFor(manifest, stem);
  if (!info || !chosen.length) continue;
  if (info.kind === 'backdrop') {
    const src = join(generated, chosen[0]);
    mkdirSync(at('src/art/locations'), { recursive: true });
    const out = at(`src/art/locations/${info.landId}.webp`);
    await sharp(src).webp({ quality: 82, effort: 6 }).toFile(out);
    await sharp(src).resize(480, 360, { fit: 'cover' }).webp({ quality: 80, effort: 6 }).toFile(at(`src/art/locations/${info.landId}-card.webp`));
    const kb = Math.round(statSync(out).size / 1024);
    console.log(`prepared src/art/locations/${info.landId}.webp (${kb} KB) and its card`);
    if (kb > 1024) console.log(`warning  ${info.landId}.webp is over 1 MiB; lower the quality (the precache limit is 3 MiB a file)`);
  } else {
    sets.set(info.group, info.outDir);
  }
}
for (const [group, outDir] of sets) {
  console.log(`prepare  ${group} set → ${outDir}`);
  execFileSync('node', ['scripts/creature-art/prepare-sprite.mjs', '--set', group, '--shrink', '2', '--out-dir', outDir], { cwd: root, stdio: 'inherit' });
}

function insertRowsOnce(text, rows) {
  const fresh = rows.filter((r) => !text.includes(r.split('|')[1]));
  return fresh.length ? insertRows(text, fresh) : text;
}
