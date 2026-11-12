#!/usr/bin/env node
// READY's "Next ten": one file per line in docs/ready/next/, so sessions landing neighbouring lines never conflict.
//   node scripts/ready.mjs                                  # the lines in pick order (the first unclaimed one is next)
//   node scripts/ready.mjs add "**`game`, what** (tier): …"  # a new line after the last one (refill)
//   node scripts/ready.mjs add --before=020 "…"             # a new line ahead of 020 (a playtest fix under the phone lines)
// Landing a line: `git rm` its file. Claiming one: edit its own file. Order is the file number (010, 020, …);
// links inside a file are relative to docs/ready/next/ (so `../../deep-dives/x.md`).
import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
export const nextDir = join(root, 'docs', 'ready', 'next');
export const NAME = /^(\d{3})-[a-z0-9]+(?:-[a-z0-9]+)*\.md$/;

/** A filename slug from a line's bold title: lower case words joined by dashes, at most about 50 characters. */
export function slug(line) {
  const title = /^\*\*(.+?)\*\*/.exec(line)?.[1] ?? line;
  const words = title
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  let out = '';
  for (const w of words) {
    if (out && out.length + 1 + w.length > 50) break;
    out = out ? `${out}-${w}` : w;
  }
  return out || 'line';
}

/** The lines' files in pick order. */
export function lines(dir = nextDir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((f) => NAME.test(f))
    .sort();
}

/** The number for a new line: after the last (in steps of 10), or halfway below `before`. */
export function numberFor(existing, before) {
  const nums = existing.map((f) => Number(f.slice(0, 3)));
  if (before === undefined) return Math.min(999, (nums.length ? Math.max(...nums) : 0) + 10);
  const lower = Math.max(0, ...nums.filter((n) => n < before));
  const n = Math.floor((lower + before) / 2);
  if (n <= lower) throw new Error(`no number free between ${lower} and ${before}: renumber by hand`);
  return n;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  const [cmd] = args;
  if (!cmd || cmd === 'list') {
    for (const f of lines()) {
      const text = readFileSync(join(nextDir, f), 'utf8').trim().replace(/\s+/g, ' ');
      console.log(`docs/ready/next/${f}\n  ${text.length > 240 ? text.slice(0, 240) + '…' : text}`);
    }
  } else if (cmd === 'add') {
    const before = args.find((a) => a.startsWith('--before='))?.slice(9);
    const text = args
      .slice(1)
      .filter((a) => !a.startsWith('--'))
      .join(' ')
      .trim()
      .replace(/^- /, '');
    if (!text || (before !== undefined && !/^\d{1,3}$/.test(before))) {
      console.error('usage: node scripts/ready.mjs add [--before=NNN] "**`game`, what** (tier): …"');
      process.exit(2);
    }
    mkdirSync(nextDir, { recursive: true });
    const n = numberFor(lines(), before === undefined ? undefined : Number(before));
    const path = join(nextDir, `${String(n).padStart(3, '0')}-${slug(text)}.md`);
    writeFileSync(path, text + '\n');
    console.log(path);
  } else {
    console.error('usage: node scripts/ready.mjs [list] | add [--before=NNN] "line"');
    process.exit(2);
  }
}
