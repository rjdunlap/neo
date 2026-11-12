#!/usr/bin/env node
// Dated verification entries: one file each in docs/verification/, so parallel sessions never edit the same lines.
//   node scripts/verification.mjs new "Title of the change (PR #123)"   # writes docs/verification/<today>-<slug>.md
//   node scripts/verification.mjs new --date=2026-11-12 "Title"         # a given date
//   node scripts/verification.mjs latest [n]                            # the newest n entries (default 15), newest first
// docs/VERIFICATION.md keeps only the coverage summary; its rows link to these files.
import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
export const entriesDir = join(root, 'docs', 'verification');
export const NAME = /^(\d{4}-\d{2}-\d{2})-[a-z0-9]+(?:-[a-z0-9]+)*\.md$/;

/** A filename slug: lower case words joined by dashes, at most about 60 characters, without a trailing "(PR #n)". */
export function slug(title) {
  const words = title
    .replace(/\(PR #\d+\)\s*$/i, '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  let out = '';
  for (const w of words) {
    if (out && out.length + 1 + w.length > 60) break;
    out = out ? `${out}-${w}` : w;
  }
  return out || 'entry';
}

export const fileName = (date, title) => `${date}-${slug(title)}.md`;

/** The new entry's text: its heading and the three lines every entry carries. */
export const entryText = (date, title) => `# ${date} — ${title}\n\n**Changed:** \n**Ran:** \n**Not run:** \n`;

/** The entries on disk, newest first (by date, then by name). */
export function entries(dir = entriesDir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((f) => NAME.test(f))
    .sort((a, b) => (a < b ? 1 : a > b ? -1 : 0));
}

const today = () => new Date().toLocaleDateString('en-CA');

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [cmd, ...rest] = process.argv.slice(2);
  if (cmd === 'new') {
    const date = rest.find((a) => a.startsWith('--date='))?.slice(7) ?? today();
    const title = rest
      .filter((a) => !a.startsWith('--'))
      .join(' ')
      .trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !title) {
      console.error('usage: node scripts/verification.mjs new [--date=YYYY-MM-DD] "Title (PR #n)"');
      process.exit(2);
    }
    const path = join(entriesDir, fileName(date, title));
    if (existsSync(path)) {
      console.error(`${path} already exists: choose a more specific title`);
      process.exit(1);
    }
    mkdirSync(entriesDir, { recursive: true });
    writeFileSync(path, entryText(date, title));
    console.log(path);
  } else if (cmd === 'latest') {
    const n = Number(rest[0] ?? 15);
    for (const f of entries().slice(0, n)) {
      const head = readFileSync(join(entriesDir, f), 'utf8').split('\n', 1)[0].replace(/^#\s*/, '');
      console.log(`docs/verification/${f}  ${head}`);
    }
  } else {
    console.error('usage: node scripts/verification.mjs new "Title" | latest [n]');
    process.exit(2);
  }
}
