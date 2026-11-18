import { readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

// The docs map (docs/README.md) and the archive index stay complete, and the session guide stays readable by
// section. docs/SESSION-GUIDE.md, "Where each doc update goes".
const root = resolve(dirname(new URL(import.meta.url).pathname), '..');
const docs = join(root, 'docs');
const read = (...p) => readFileSync(join(docs, ...p), 'utf8');
const links = (text) => [...text.matchAll(/\]\(([^)#\s]+)(?:#[^)\s]*)?\)/g)].map((m) => m[1]);

describe('docs map', () => {
  it('names every top-level document and folder under docs/', () => {
    const linked = new Set(links(read('README.md')).map((l) => l.replace(/^\.\//, '')));
    const missing = [];
    for (const f of readdirSync(docs)) {
      if (f === 'README.md' || f.startsWith('.')) continue;
      const dir = statSync(join(docs, f)).isDirectory();
      if (!dir && !f.endsWith('.md')) continue;
      const found = dir ? [...linked].some((l) => l === `${f}/` || l.startsWith(`${f}/`)) : linked.has(f);
      if (!found) missing.push(dir ? `${f}/` : f);
    }
    expect(
      missing,
      'Add a line to docs/README.md saying what the document is for, or put it in the folder that owns its kind (docs/reviews/, docs/definitions/, docs/archive/)',
    ).toEqual([]);
  });

  it('lists every archived file in the archive index', () => {
    const linked = new Set(links(read('archive', 'README.md')));
    const missing = readdirSync(join(docs, 'archive')).filter(
      (f) => f.endsWith('.md') && f !== 'README.md' && !/^VERIFICATION-\d{4}-/.test(f) && !linked.has(f),
    );
    expect(
      missing,
      'Add a line to docs/archive/README.md. A landed slice gets no build note here: its verification entry and its game page record it',
    ).toEqual([]);
  });

  it('keeps every line of the session guide short enough for peek.mjs section to print whole', () => {
    const long = read('SESSION-GUIDE.md')
      .split('\n')
      .map((l, i) => [i + 1, l.length])
      .filter(([, n]) => n > 600)
      .map(([i, n]) => `line ${i}: ${n} characters`);
    expect(long, 'Split the paragraph or bullet: peek.mjs cuts a section line at 600 characters').toEqual([]);
  });
});
