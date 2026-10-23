import { describe, expect, it } from 'vitest';
import { chosenFor, insertRows, manifestRow, nextCandidate, parseName, plan, setChosen, sizeProblem } from './inbox-core.mjs';

const MANIFEST = [
  '# Generated creature art',
  '',
  '| File | Request | Date | Tool and model | Prompt | Chosen |',
  '| --- | --- | --- | --- | --- | --- |',
  '| sprout-base-2.png | R02 | 2026-10-17 | x | p | yes |',
  '| home-day-3.png | R06 | 2026-10-17 | x | p | yes |',
  '',
  '## Notes',
].join('\n');

const opts = { existing: ['sprout-base-1.png', 'sprout-base-2.png', 'land-meadow-1.png'], manifest: MANIFEST, date: '2026-10-23', tool: 'ChatGPT' };

describe('parseName', () => {
  it('routes a backdrop to its land and request', () => {
    expect(parseName('land-meadow.png')).toMatchObject({ stem: 'land-meadow', kind: 'backdrop', landId: 'rainbow-meadow', request: 'R23' });
    expect(parseName('land-canyon-2.png')).toMatchObject({ landId: 'treehouse', request: 'R26' });
    expect(parseName('land-grove-b.png')).toMatchObject({ stem: 'land-grove' });
    expect(parseName('land-cove (1).png')).toMatchObject({ stem: 'land-cove' });
  });
  it('routes species and friends to their prepared folders', () => {
    expect(parseName('tote-happy-1.png')).toMatchObject({ kind: 'creature', group: 'tote', outDir: 'src/art/creatures/cast' });
    expect(parseName('river-nohead.png')).toMatchObject({ kind: 'creature', outDir: 'src/art/creatures/illustrated' });
    expect(parseName('duck-base.png')).toMatchObject({ kind: 'friend', group: 'duck', request: 'R22' });
    expect(parseName('Duck-Portrait-a.png')).toMatchObject({ stem: 'duck-portrait' });
  });
  it('refuses names the queue does not list', () => {
    for (const f of ['ChatGPT Image Oct 23, 2026.png', 'land-moon.png', 'duck-happy.png', 'sprout-base.jpg', 'button-play.png']) expect(parseName(f), f).toBeNull();
  });
});

describe('sizeProblem', () => {
  const bg = parseName('land-meadow.png'), base = parseName('duck-base.png'), portrait = parseName('duck-portrait.png');
  it('keeps the art bible minimums', () => {
    expect(sizeProblem(bg, { w: 1536, h: 1024 })).toBeNull();
    expect(sizeProblem(bg, { w: 1024, h: 1024 })).toMatch(/1536/);
    expect(sizeProblem(bg, { w: 1536, h: 1536 })).toMatch(/landscape/);
    expect(sizeProblem(base, { w: 1024, h: 1536 })).toBeNull();
    expect(sizeProblem(base, { w: 1200, h: 800 })).toMatch(/1536/);
    expect(sizeProblem(portrait, { w: 1024, h: 1024 })).toBeNull();
    expect(sizeProblem(portrait, { w: 512, h: 512 })).toMatch(/1024/);
  });
});

describe('candidates and the manifest', () => {
  it('numbers past the highest existing candidate', () => {
    expect(nextCandidate(opts.existing, 'sprout-base')).toBe(3);
    expect(nextCandidate(opts.existing, 'duck-base')).toBe(1);
    expect(nextCandidate(['land-meadow-9.png', 'land-meadow-10.png'], 'land-meadow')).toBe(11);
  });
  it('inserts rows at the end of the first table only', () => {
    const out = insertRows(MANIFEST, [manifestRow({ file: 'duck-base-1.png', request: 'R22', date: 'd', tool: 't', prompt: 'p', chosen: true })]);
    const lines = out.split('\n');
    expect(lines[6]).toBe('| duck-base-1.png | R22 | d | t | p | yes |');
    expect(lines[7]).toBe('');
    expect(chosenFor(out, 'duck-base')).toEqual(['duck-base-1.png']);
  });
  it('choosing one candidate clears the others of the same stem', () => {
    let m = insertRows(MANIFEST, ['| sprout-base-3.png | R02 | d | t | p | no |']);
    m = setChosen(m, 'sprout-base-3.png');
    expect(chosenFor(m, 'sprout-base')).toEqual(['sprout-base-3.png']);
    expect(chosenFor(m, 'home-day')).toEqual(['home-day-3.png']);
    expect(() => setChosen(m, 'duck-base-1.png')).toThrow(/no row/);
  });
});

describe('plan', () => {
  it('chooses a lone first candidate and leaves several waiting', () => {
    const drops = [
      { file: 'duck-base.png', size: { w: 1536, h: 1024 } },
      { file: 'land-meadow-a.png', size: { w: 1536, h: 1024 } },
      { file: 'land-meadow-b.png', size: { w: 1536, h: 1024 } },
      { file: 'sprout-base.png', size: { w: 1536, h: 1024 } },
      { file: 'land-cove.png', size: { w: 800, h: 600 } },
      { file: 'notes.txt', size: null },
      { file: 'land-beach.webp', size: null },
    ];
    const p = plan(drops, opts);
    expect(p.moves.map((m) => [m.from, m.to, m.chosen])).toEqual([
      ['duck-base.png', 'duck-base-1.png', true],
      ['land-meadow-a.png', 'land-meadow-2.png', false],
      ['land-meadow-b.png', 'land-meadow-3.png', false],
      // sprout-base already has a chosen candidate, so a re-roll waits for --choose.
      ['sprout-base.png', 'sprout-base-3.png', false],
    ]);
    expect(p.refused.map((r) => r.file)).toEqual(['land-cove.png', 'notes.txt', 'land-beach.webp']);
    expect(p.refused[2].reason).toMatch(/only PNG/);
    expect(p.waiting.map((w) => w.stem)).toEqual(['land-meadow', 'sprout-base']);
    expect(p.rows).toHaveLength(4);
  });
});
