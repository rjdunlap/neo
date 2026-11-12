import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { NAME, entries, entriesDir, entryText, fileName, root, slug } from './verification.mjs';

describe('verification entries', () => {
  it('keeps dated entries out of docs/VERIFICATION.md, where parallel sessions would conflict', () => {
    const live = readFileSync(join(root, 'docs', 'VERIFICATION.md'), 'utf8');
    const dated = live.split('\n').filter((l) => /^#{1,6}\s+\d{4}-\d{2}-\d{2}\b/.test(l));
    expect(
      dated,
      'Write a dated entry as its own file instead: node scripts/verification.mjs new "Title (PR #n)", then move the text there',
    ).toEqual([]);
  });

  it('names every entry file by its date and gives it that date in its heading', () => {
    const bad = [];
    for (const f of readdirSync(entriesDir)) {
      const m = NAME.exec(f);
      const head = m ? readFileSync(join(entriesDir, f), 'utf8').split('\n', 1)[0] : '';
      if (!m || !head.startsWith(`# ${m[1]} — `)) bad.push(f);
    }
    expect(bad, 'Each file is <YYYY-MM-DD>-<slug>.md and starts "# <same date> — <title>"').toEqual([]);
  });

  it('makes short, stable file names and a three-line template', () => {
    expect(slug('U7d fix batch 24: inchworm, measuring-post and seesaw-balance (PR #1565)')).toBe(
      'u7d-fix-batch-24-inchworm-measuring-post-and-seesaw-balance',
    );
    expect(slug('Tile Pairs slices 3–4: two more looks')).toBe('tile-pairs-slices-3-4-two-more-looks');
    expect(slug('!!!')).toBe('entry');
    for (const w of [slug('a '.repeat(80)), slug('word '.repeat(40))])
      expect(w.length).toBeLessThanOrEqual(60);
    const name = fileName('2026-11-12', 'Puddle Lens: lap (PR #1575)');
    expect(name).toBe('2026-11-12-puddle-lens-lap.md');
    expect(NAME.test(name)).toBe(true);
    expect(entryText('2026-11-12', 'Puddle Lens: lap')).toMatch(
      /^# 2026-11-12 — Puddle Lens: lap\n\n\*\*Changed:\*\*/,
    );
  });

  it('lists entries newest first', () => {
    const list = entries();
    expect(list.length).toBeGreaterThan(0);
    expect([...list].sort().reverse()).toEqual(list);
  });
});
