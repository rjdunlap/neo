#!/usr/bin/env node
import { existsSync, lstatSync, mkdirSync, readFileSync, rmdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { barrels } from './content-barrels.mjs';

const templateDir = join(dirname(fileURLToPath(import.meta.url)), 'new-game');
const usage = `Usage: npm run new-game -- <kebab-id> --name "Game Name" --land <land-id> --region <subject-id> --band <band> --challenge <kind> [--dry-run]
Creates an unfinished starter in the current repository. See docs/NEW-GAME.md.`;

export function parseArgs(args) {
  const [id, ...rest] = args;
  if (!id || id.startsWith('-')) throw new Error(usage);
  const options = { id };
  for (let i = 0; i < rest.length; i++) {
    const flag = rest[i];
    const key = flag.slice(2);
    if (flag === '--dry-run' && !options.dryRun) { options.dryRun = true; continue; }
    if (!['name', 'land', 'region', 'band', 'challenge'].includes(key) || !flag.startsWith('--') || key in options) throw new Error(`Unknown or repeated option: ${flag}`);
    const value = rest[++i];
    if (!value || value.startsWith('--')) throw new Error(`Missing value for ${flag}`);
    options[key] = value;
  }
  return options;
}

function enumValues(root, path, key) {
  const text = readFileSync(join(root, path), 'utf8');
  if (key === 'BANDS') return [...text.matchAll(/\bid:\s*['"]([^'"]+)['"]/g)].map(m => m[1]);
  const match = text.match(new RegExp(`export\\s+const\\s+${key}\\s*=\\s*\\[([^\\]]+)\\]\\s*as const`));
  if (!match) throw new Error(`Cannot find ${key} in ${path}`);
  return [...match[1].matchAll(/['"]([^'"]+)['"]/g)].map(m => m[1]);
}

// Check every ancestor too: an existing symlink must never redirect generated files.
function safePath(root, relative) {
  let path = root;
  for (const part of relative.split('/')) {
    path = join(path, part);
    let stat;
    try { stat = lstatSync(path); } catch (error) { if (error.code !== 'ENOENT') throw error; }
    if (stat?.isSymbolicLink()) throw new Error(`Refusing symlink: ${relative}`);
  }
  return path;
}

/** Preview is pure; apply refuses existing outputs before it changes any file. */
export function planGame(root, options) {
  const { id, name, land, region, band, challenge } = options;
  if (!/^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/.test(id) || id.length > 64) throw new Error('ID must be lowercase kebab-case, at most 64 characters');
  if (typeof name !== 'string' || !name.trim() || name.length > 100 || /[\r\n\x00-\x1f]/.test(name)) throw new Error('Supply a one-line --name (1–100 characters)');
  for (const [value, path, key] of [
    [land, 'src/content/lands.ts', 'LAND_IDS'],
    [region, 'src/content/world.ts', 'REGION_IDS'],
    [band, 'src/progress/bands.ts', 'BANDS'],
    [challenge, 'src/games/types.ts', 'CHALLENGE_KINDS'],
  ]) {
    if (!enumValues(root, path, key).includes(value)) throw new Error(`Invalid ${key}: ${value}`);
  }
  const folder = `src/games/${id}`;
  if (existsSync(safePath(root, folder))) throw new Error(`Already exists: ${folder}`);
  // Barrel aliases remove hyphens, so reject IDs that collide after camel-casing too.
  const alias = value => value.replace(/-([a-z0-9])/g, (_, c) => c.toUpperCase());
  const voices = readFileSync(join(root, 'src/content/voice-script.ts'), 'utf8');
  if (new RegExp(`\\b${alias(id)}Voice\\b`).test(voices) || new RegExp(`["']game\\.${id}["']`).test(voices)) throw new Error(`Voice alias or title already exists: ${id}`);
  const quote = JSON.stringify;
  const tokens = {
    ID: id, ID_LITERAL: quote(id), NAME: quote(name), DISPLAY_NAME: name,
    TITLE: quote(`game.${id}`), INSTRUCTION: quote(`${id}.start`),
    LAND: quote(land), REGION: quote(region), BAND: quote(band), CHALLENGE: quote(challenge),
    METHOD: `${alias(id)}Play`,
  };
  const files = ['index.ts', 'logic.ts', 'logic.test.ts', 'voice.ts', 'howto.ts'].map(file => [file, `${folder}/${file}`]);
  files.push(['play.mjs', `scripts/browser/suites/${id}-play.mjs`], ['page.md', `docs/games/${id}.md`]);
  const writes = files.map(([template, path]) => {
    if (existsSync(safePath(root, path))) throw new Error(`Already exists: ${path}`);
    const text = readFileSync(join(templateDir, `${template}.txt`), 'utf8').replace(/@([A-Z_]+)@/g, (_, key) => {
      if (!(key in tokens)) throw new Error(`Unknown template token ${key}`);
      return tokens[key];
    });
    return { path, text, before: null };
  });
  const path = 'src/content/lands.ts';
  const before = readFileSync(safePath(root, path), 'utf8');
  const pattern = new RegExp(`(id:\\s*['"]${land}['"],[\\s\\S]*?games:\\s*\\[)([^\\]]*)(\\])`);
  const matches = [...before.matchAll(new RegExp(pattern.source, 'g'))];
  if (matches.length !== 1 || new RegExp(`["']${id}["']`).test(before)) throw new Error(`Cannot safely place ${id} in ${land}`);
  const text = before.replace(pattern, (_, start, entries, end) => `${start}${entries.trimEnd().replace(/,\s*$/, '')}${entries.trim() ? ', ' : ''}'${id}'${end}`);
  return [...writes, { path, text, before }];
}

export function scaffold(root, options) {
  const writes = planGame(root, options);
  // Validate both generated blocks before the first write; refresh after adding the folder.
  for (const path of ['src/content/voice-script.ts', 'src/content/howto.ts']) safePath(root, path);
  barrels(root);
  if (options.dryRun) return [...writes.map(w => w.path), 'src/content/voice-script.ts', 'src/content/howto.ts'];
  const gameDir = join(root, `src/games/${options.id}`);
  mkdirSync(gameDir); // exclusive: a concurrent creator must never become ours to roll back
  const applied = [];
  try {
    for (const write of writes) {
      mkdirSync(dirname(join(root, write.path)), { recursive: true });
      if (write.before !== null) applied.push(write);
      writeFileSync(join(root, write.path), write.text, write.before === null ? { flag: 'wx' } : undefined);
      if (write.before === null) applied.push(write);
    }
    for (const b of barrels(root)) {
      const before = readFileSync(join(root, b.path), 'utf8');
      applied.push({ ...b, before });
      writeFileSync(join(root, b.path), b.text);
    }
  } catch (error) {
    for (const w of applied.reverse()) {
      if (w.before === null) rmSync(join(root, w.path));
      else writeFileSync(join(root, w.path), w.before);
    }
    try { rmdirSync(gameDir); } catch { /* Preserve any files created by another process. */ }
    throw error;
  }
  return [...writes.map(w => w.path), 'src/content/voice-script.ts', 'src/content/howto.ts'];
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    if (process.argv.includes('--help')) console.log(usage);
    else {
      const options = parseArgs(process.argv.slice(2));
      console.log(`${options.dryRun ? 'Would write' : 'Wrote'}:\n${scaffold(process.cwd(), options).join('\n')}`);
      console.log('Starter only: implement rules/input/art/autotouch, fill todo tests, register the browser suite, then npm run game-docs. See docs/NEW-GAME.md.');
    }
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
