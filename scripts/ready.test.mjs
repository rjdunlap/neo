import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { NAME, lines, nextDir, numberFor, root, slug } from './ready.mjs';

describe("READY's Next ten", () => {
  it('holds no list lines in docs/READY.md, where neighbouring lines would conflict', () => {
    const ready = readFileSync(join(root, 'docs', 'READY.md'), 'utf8');
    const start = ready.indexOf('\n## Next ten\n');
    const end = ready.indexOf('\n## ', start + 1);
    expect(start, 'READY.md keeps its "## Next ten" heading').toBeGreaterThan(0);
    const listed = ready
      .slice(start, end)
      .split('\n')
      .filter((l) => /^\s*([-*+]|\d+\.)\s/.test(l));
    expect(
      listed,
      'Put each Next ten line in its own file: node scripts/ready.mjs add "…" (it writes docs/ready/next/NNN-<slug>.md)',
    ).toEqual([]);
  });

  it('names every line file NNN-<slug>.md and gives it one bold-titled line', () => {
    const bad = [];
    for (const f of readdirSync(nextDir)) {
      const text = NAME.test(f) ? readFileSync(join(nextDir, f), 'utf8').trim() : '';
      if (!text.startsWith('**') || text.includes('\n\n')) bad.push(f);
    }
    expect(bad, 'Each file is NNN-<slug>.md holding one line that starts with its **bold title**').toEqual(
      [],
    );
  });

  it('numbers new lines after the last, or between two, and slugs the bold title', () => {
    expect(numberFor([])).toBe(10);
    expect(numberFor(['010-a.md', '030-b.md'])).toBe(40);
    expect(numberFor(['010-a.md', '030-b.md'], 30)).toBe(20);
    expect(numberFor(['030-b.md'], 30)).toBe(15);
    expect(() => numberFor(['010-a.md', '011-b.md'], 11)).toThrow(/renumber/);
    expect(slug('**`tile-pairs`, level 8 *Flower friends*** (after the tower): …')).toBe(
      'tile-pairs-level-8-flower-friends',
    );
    expect(lines()).toEqual([...lines()].sort());
  });
});
