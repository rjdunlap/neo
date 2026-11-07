import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import {
  ALL_DIRS, blankFor, cellOf, cellsOfWord, hasBlocked, HIDDEN_GRID, hiddenHint, hintFor, judgeLine, leftovers, lettersOf, lineBetween, makeGrid, makeGrids, MAX_STONES, MESSAGE_GRID, occurrences, ORDER, parseGrid, PICTURE_GRID, planFor, PLANS, rowsOf, SMALL_GRID, STONE,
  shortestUnfound, textOf, themesFor, wordAt,
} from './logic';
import { BLOCKED } from '../../learning/words/blocked';
import { PICTURE_THEMES, THEMES, themeById } from '../../learning/words/themes';
import { PICTURE_WORDS } from '../../learning/words/picture-words';
import { SCRIPT } from '../../content/voice-script';

describe('the word lists', () => {
  it('are plain capital words of three to eight letters, none repeated, with enough in each theme for every level', () => {
    const most = Math.max(...PLANS.filter((p) => !p.pictures).map((p) => p.words));
    expect(THEMES.filter((t) => !t.root).length).toBeGreaterThanOrEqual(15);
    for (const t of THEMES) {
      expect(new Set(t.words).size, t.id).toBe(t.words.length);
      // An everyday theme fills every level; a root family is shorter and fills only the small grids.
      expect(t.words.length, t.id).toBeGreaterThanOrEqual(t.root ? PLANS[1].words : most);
      for (const w of t.words) expect(w, `${t.id} ${w}`).toMatch(/^[A-Z]{3,8}$/);
      expect(t.name.length, t.id).toBeGreaterThan(5);
    }
    expect(new Set(THEMES.map((t) => t.id)).size).toBe(THEMES.length);
    expect(themeById('pond').id).toBe('pond');
    expect(themeById('nope').id).toBe(THEMES[0].id);
  });
});

describe('fresh themes and root families', () => {
  const back = (w: string) => [...w].reverse().join('');

  it('never hide one word of a theme inside another, either way, and hold no word that reads the same backwards', () => {
    // A word inside another (RAIN in RAINBOW) can never be in the grid exactly once, so the two could never share a grid.
    for (const t of THEMES) for (const w of t.words) {
      expect(back(w), `${t.id} ${w} is a palindrome`).not.toBe(w);
      for (const o of t.words) if (o !== w) expect(w.includes(o) || back(w).includes(o), `${t.id}: ${o} in ${w}`).toBe(false);
    }
    expect(themeById('weather').words).not.toContain('RAIN');
    expect(themeById('weather').words).toContain('RAINBOW');
  });

  it('draw only the themes a plan can fill: the root families at the small grids, every everyday theme everywhere', () => {
    const roots = THEMES.filter((t) => t.root);
    expect(roots.map((t) => t.id).sort()).toEqual(['port', 'spect']);
    expect(themesFor(PLANS[0])).toEqual(THEMES);
    expect(themesFor(PLANS[1])).toEqual(THEMES);
    for (const plan of PLANS.slice(2, 4)) expect(themesFor(plan)).toEqual(THEMES.filter((t) => !t.root));
    // The small grid takes only words of up to six letters: Words that carry has five, Words that look only one.
    expect(themesFor(planFor(SMALL_GRID)).map((t) => t.id)).toEqual(THEMES.filter((t) => t.id !== 'spect').map((t) => t.id));
    // Over many seeds a level-1 round sometimes draws a root family, and a level 3 or 4 round never does.
    const drawn = (plan: (typeof PLANS)[number]) => new Set(Array.from({ length: 80 }, (_, s) => makeGrids(plan, new Rng(s + 1))[0].theme));
    expect([...drawn(PLANS[0])].some((id) => themeById(id).root)).toBe(true);
    for (const plan of PLANS.slice(2, 4)) expect([...drawn(plan)].some((id) => themeById(id).root), plan.name).toBe(false);
  });

  it('every theme makes a grid for every plan it can fill, over a dozen seeds', () => {
    for (const plan of PLANS.filter((p) => !p.pictures)) for (const t of themesFor(plan)) for (let s = 1; s <= 12; s++) {
      const g = makeGrid(plan, t, new Rng(s * 131 + plan.size));
      expect(g.words, `${t.id} ${plan.name} ${s}`).toHaveLength(plan.words);
      for (const p of g.words) expect(occurrences(g.size, g.letters, p.word), `${t.id} ${p.word}`).toHaveLength(1);
    }
  });

  it('give each root family the pet\'s one line on what the root means, naming the root its words share', () => {
    for (const t of THEMES.filter((x) => x.root)) {
      const line = SCRIPT[`wordsearch.root-${t.root!}`];
      expect(line, t.id).toBeDefined();
      expect(line.join(' ').toLowerCase(), t.id).toContain(`${t.root} means`);
      for (const w of t.words) expect(w, t.id).toContain(t.root!.toUpperCase());
    }
  });
});

describe('lines of letters', () => {
  it('finds the squares between two, across, down and on a slant, and nothing for a crooked pair', () => {
    expect(lineBetween(5, 0, 4)).toEqual([0, 1, 2, 3, 4]);
    expect(lineBetween(5, 20, 0)).toEqual([20, 15, 10, 5, 0]);
    expect(lineBetween(5, 0, 24)).toEqual([0, 6, 12, 18, 24]);
    expect(lineBetween(5, 4, 20)).toEqual([4, 8, 12, 16, 20]);
    expect(lineBetween(5, 7, 7)).toEqual([7]);
    expect(lineBetween(5, 0, 7)).toBeNull();
    expect(lineBetween(5, 0, 11)).toBeNull();
  });

  it('reads a word either way, but only one not found yet', () => {
    const grid = parseGrid(['FROGX', 'QQQQX', 'QQQQX', 'QQQQX', 'QQQQX'], 'pond', ['FROG']);
    expect(grid.words[0]).toMatchObject({ word: 'FROG', r: 0, c: 0, dr: 0, dc: 1 });
    const line = lineBetween(5, 0, 3)!, back = lineBetween(5, 3, 0)!;
    expect(textOf(grid, line)).toBe('FROG');
    expect(wordAt(grid, line, new Set())).toBe(0);
    expect(wordAt(grid, back, new Set())).toBe(0);
    expect(wordAt(grid, line, new Set([0]))).toBe(-1);
    expect(wordAt(grid, lineBetween(5, 0, 2)!, new Set())).toBe(-1);
  });
});

describe('making grids', () => {
  it('hides every level\'s words exactly once, in the directions the level allows, in a grid of capital letters', () => {
    PLANS.forEach((plan, i) => {
      expect(planFor(i + 1)).toBe(plan);
      for (let s = 1; s <= 12; s++) {
        const pool = themesFor(plan), theme = pool[s % pool.length];
        const grid = makeGrid(plan, theme, new Rng(s * 977 + i));
        const label = `${plan.name} seed ${s}`;
        expect(grid.size, label).toBe(plan.size);
        expect(grid.letters, label).toHaveLength(plan.size * plan.size);
        expect(grid.letters.every((l) => /^[A-Z]$/.test(l) || (!!plan.message && l === STONE)), label).toBe(true);
        expect(grid.words, label).toHaveLength(plan.words);
        expect(new Set(grid.words.map((w) => w.word)).size, label).toBe(plan.words);
        for (const p of grid.words) {
          expect(theme.words, label).toContain(p.word);
          expect(plan.dirs.some(([dr, dc]) => dr === p.dr && dc === p.dc), `${label} ${p.word} direction`).toBe(true);
          expect(textOf(grid, cellsOfWord(grid.size, p)), `${label} ${p.word}`).toBe(p.word);
          expect(occurrences(grid.size, grid.letters, p.word), `${label} ${p.word} once`).toHaveLength(1);
        }
      }
    });
  });

  it('only reads backwards where the level allows it, and the easy levels read forwards', () => {
    for (let s = 1; s <= 8; s++) {
      for (const level of [1, 2]) for (const p of makeGrid(planFor(level), THEMES[s % THEMES.length], new Rng(s)).words) expect(p.dr >= 0 && p.dc >= 0, `level ${level} ${p.word} reads forwards`).toBe(true);
      const hard = makeGrid(planFor(3), THEMES[0], new Rng(s + 100));
      expect(hard.words.every((p) => ALL_DIRS.some(([dr, dc]) => dr === p.dr && dc === p.dc))).toBe(true);
    }
    const backwards = Array.from({ length: 12 }, (_, s) => makeGrid(planFor(3), themesFor(planFor(3))[s % themesFor(planFor(3)).length], new Rng(s * 31))).flatMap((g) => g.words).filter((p) => p.dr < 0 || p.dc < 0 || (p.dr === 1 && p.dc === -1));
    expect(backwards.length).toBeGreaterThan(0);
  });

  it('is fair: the same seed gives the same grid, different seeds other ones', () => {
    const a = makeGrids(PLANS[1], new Rng(5)), b = makeGrids(PLANS[1], new Rng(5)), c = makeGrids(PLANS[1], new Rng(6));
    expect(a).toEqual(b);
    expect(a[0].letters).not.toEqual(c[0].letters);
    expect(a).toHaveLength(PLANS[1].grids);
  });

  it('climbs in play order: the small grid first, then bigger grids with more words', () => {
    expect(ORDER).toEqual([5, 1, 2, 3, 4, 6, 7]);
    expect([...ORDER].sort()).toEqual(PLANS.map((_, i) => i + 1).filter((l) => l !== PICTURE_GRID));
    expect(ORDER.map((l) => planFor(l).size)).toEqual([6, 8, 10, 12, 14, 8, 10]);
    expect(ORDER.map((l) => planFor(l).words)).toEqual([4, 5, 7, 9, 12, 9, 6]);
    expect(planFor(0)).toBe(PLANS[0]);
    // A level past the top plays the hardest grid, never the small entry.
    expect(planFor(99)).toBe(planFor(ORDER[ORDER.length - 1]));
  });

  it('starts with a small grid: four words of three to six letters, across or down only, each in it exactly once', () => {
    const plan = planFor(SMALL_GRID);
    expect(plan).toMatchObject({ size: 6, words: 4, grids: 1 });
    expect(plan.dirs).toEqual([[0, 1], [1, 0]]);
    for (const t of themesFor(plan)) for (let s = 1; s <= 20; s++) {
      const g = makeGrid(plan, t, new Rng(s * 53 + 7));
      const label = `${t.id} seed ${s}`;
      expect(g.words, label).toHaveLength(4);
      for (const p of g.words) {
        expect(p.word.length, label).toBeGreaterThanOrEqual(3);
        expect(p.word.length, label).toBeLessThanOrEqual(6);
        expect((p.dr === 0 && p.dc === 1) || (p.dr === 1 && p.dc === 0), `${label} ${p.word} across or down`).toBe(true);
        expect(occurrences(6, g.letters, p.word), `${label} ${p.word}`).toHaveLength(1);
      }
      expect(hasBlocked(6, g.letters, g.words.map((p) => p.word)), label).toBe(false);
    }
  });

  it('reads a grid from its picture and finds each word where it is, complaining about one that is missing or repeated', () => {
    const rows = ['FROGQ', 'XXXXQ', 'DUCKQ', 'XXXXQ', 'XXXXQ'].map((r) => r.replace(/X/g, 'Z'));
    const g = parseGrid(rows, 'pond', ['FROG', 'DUCK']);
    expect(g.words.map((w) => [w.r, w.c])).toEqual([[0, 0], [2, 0]]);
    expect(rowsOf(g)).toEqual(rows);
    expect(() => parseGrid(rows, 'pond', ['SWAN'])).toThrow('exactly once');
    expect(() => parseGrid(['FROGF', 'ZZZZR', 'ZZZZO', 'ZZZZG', 'ZZZZZ'], 'pond', ['FROG'])).toThrow('exactly once');
    expect(() => parseGrid(['AB', 'ABC'], 'pond', ['AB'])).toThrow();
    expect(cellOf(5, 2, 3)).toBe(13);
  });
});

describe('hints', () => {
  it('point at the first letter of a word not found yet, the nearest to the cursor, and at nothing when all are found', () => {
    const grid = makeGrid(PLANS[1], THEMES[0], new Rng(3));
    const first = hintFor(grid, new Set(), 0)!;
    expect(first.word).toBeGreaterThanOrEqual(0);
    const p = grid.words[first.word];
    expect(first.cell).toBe(cellOf(grid.size, p.r, p.c));
    const some = new Set([first.word]);
    expect(hintFor(grid, some, 0)!.word).not.toBe(first.word);
    expect(hintFor(grid, new Set(grid.words.map((_, i) => i)), 0)).toBeNull();
    // Nearest wins: from each word's own first letter the hint is that word.
    for (let i = 0; i < grid.words.length; i++) expect(hintFor(grid, new Set(), cellOf(grid.size, grid.words[i].r, grid.words[i].c))!.word).toBe(i);
  });
});

describe('words that must not appear', () => {
  it('are never in a generated grid, and the check really reads every direction', () => {
    for (const plan of PLANS) for (let s = 1; s <= 10; s++) {
      const pool = themesFor(plan), g = makeGrid(plan, pool[s % pool.length], new Rng(s * 53));
      expect(hasBlocked(g.size, g.letters, g.words.map((w) => w.word)), `${plan.name} seed ${s}`).toBe(false);
    }
    // The check itself: a blocked word hidden in any of the eight directions is seen.
    const quiet = Array<string>(25).fill('Q');
    for (const [dr, dc] of ALL_DIRS) {
      const letters = quiet.slice(), r0 = dr < 0 ? 4 : 0, c0 = dc < 0 ? 4 : 0;
      [...'CRAP'].forEach((ch, k) => { letters[cellOf(5, r0 + dr * k, c0 + dc * k)] = ch; });
      expect(hasBlocked(5, letters), `direction ${dr},${dc}`).toBe(true);
    }
    expect(hasBlocked(5, quiet)).toBe(false);
    for (const t of THEMES) for (const w of t.words) {
      expect(BLOCKED, `${t.id} ${w}`).not.toContain(w);
      // No listed word may hide a blocked one inside it, forwards or backwards.
      for (const b of BLOCKED) expect(w.includes(b) || [...w].reverse().join('').includes(b), `${t.id} ${w} contains ${b}`).toBe(false);
    }
  });
});

describe('a message in the leftovers (level 6)', () => {
  const plan = planFor(MESSAGE_GRID);
  const back = (w: string) => [...w].reverse().join('');

  it('is an 8 by 8 grid of nine words, across, down and slanting, forwards only, drawn from the everyday themes', () => {
    expect(plan).toMatchObject({ size: 8, words: 9, grids: 1, message: true });
    expect(plan.dirs).toEqual([[0, 1], [1, 0], [1, 1]]);
    expect(themesFor(plan)).toEqual(THEMES.filter((t) => !t.root));
    // Only level 6 has a message.
    expect(PLANS.filter((p) => p.message)).toEqual([plan]);
  });

  it('has plain messages of different lengths for every theme it draws, none holding a word of its theme or a blocked one', () => {
    for (const t of themesFor(plan)) {
      const ms = t.messages!;
      expect(ms.length, t.id).toBeGreaterThanOrEqual(3);
      expect(new Set(ms.map((m) => lettersOf(m).length)).size, `${t.id} lengths`).toBeGreaterThanOrEqual(3);
      for (const m of ms) {
        expect(m, t.id).toMatch(/^[A-Z]+( [A-Z]+)+$/);
        const text = lettersOf(m);
        // A theme word inside its message could be read twice; a blocked one could be read at all.
        for (const w of t.words) expect(text.includes(w) || back(text).includes(w), `${t.id}: ${w} in "${m}"`).toBe(false);
        for (const b of BLOCKED) expect(text.includes(b) || back(text).includes(b), `"${m}" holds ${b}`).toBe(false);
      }
    }
  });

  it('every theme makes a message grid over two dozen seeds: the leftovers in reading order are the message, stones few and never in a word', () => {
    for (const t of themesFor(plan)) for (let s = 1; s <= 24; s++) {
      const g = makeGrid(plan, t, new Rng(s * 7919 + t.id.length));
      const label = `${t.id} seed ${s}`;
      expect(t.messages, label).toContain(g.message);
      expect(leftovers(g), label).toBe(lettersOf(g.message!));
      const stones = g.letters.flatMap((l, i) => (l === STONE ? [i] : []));
      expect(stones.length, label).toBeLessThanOrEqual(MAX_STONES);
      const inWords = new Set(g.words.flatMap((p) => cellsOfWord(g.size, p)));
      for (const i of stones) expect(inWords.has(i), `${label} stone ${i}`).toBe(false);
      expect(g.words, label).toHaveLength(9);
      for (const p of g.words) expect(occurrences(g.size, g.letters, p.word), `${label} ${p.word}`).toHaveLength(1);
      expect(hasBlocked(g.size, g.letters, g.words.map((p) => p.word)), label).toBe(false);
      // Every square is a word's letter, the message's, or a stone.
      expect(inWords.size + lettersOf(g.message!).length + stones.length, label).toBe(64);
    }
  });

  it('draws many messages over the seeds, and a line through a stone is never a word', () => {
    const grids = Array.from({ length: 40 }, (_, s) => makeGrids(plan, new Rng(s + 1))[0]);
    expect(new Set(grids.map((g) => g.message)).size).toBeGreaterThan(10);
    const g = grids.find((x) => x.letters.includes(STONE))!, stone = g.letters.indexOf(STONE);
    for (let to = 0; to < 64; to++) {
      const line = lineBetween(8, stone, to);
      if (line && to !== stone) expect(wordAt(g, line, new Set()), `stone to ${to}`).toBe(-1);
    }
  });
});

describe('level 7, just the theme', () => {
  const plan = planFor(HIDDEN_GRID);

  it('is a 10 by 10 grid of six words in every direction, drawn only from everyday themes', () => {
    expect(plan).toMatchObject({ size: 10, words: 6, grids: 1, hidden: true });
    expect(plan.dirs).toEqual(ALL_DIRS);
    const themes = themesFor(plan);
    expect(themes.length).toBeGreaterThanOrEqual(15);
    for (const t of themes) expect(t.root, t.id).toBeUndefined();
  });

  it('every theme makes a grid over a dozen seeds where each hidden word is there once and no other word of the theme can be read', () => {
    for (const t of themesFor(plan)) for (let s = 1; s <= 12; s++) {
      const g = makeGrid(plan, t, new Rng(s * 104729 + t.id.length)), label = `${t.id} seed ${s}`;
      expect(g.words, label).toHaveLength(6);
      const hidden = g.words.map((p) => p.word);
      for (const p of g.words) expect(occurrences(g.size, g.letters, p.word), `${label} ${p.word}`).toHaveLength(1);
      for (const w of t.words) if (!hidden.includes(w)) expect(occurrences(g.size, g.letters, w), `${label} stray ${w}`).toHaveLength(0);
      expect(hasBlocked(g.size, g.letters, hidden), label).toBe(false);
    }
  });

  it('shows a blank for each letter and the length, the first letter once hinted, and the word once found', () => {
    expect(blankFor('FROG', false)).toBe('____ (4)');
    expect(blankFor('FROG', false, 1)).toBe('F___ (4)');
    expect(blankFor('FROG', false, 2)).toBe('F___ (4)');
    expect(blankFor('FROG', true)).toBe('FROG');
    const g = makeGrid(plan, themeById('pond'), new Rng(3));
    for (const p of g.words) expect(blankFor(p.word, false).replace(/ \(\d+\)$/, '')).toHaveLength(p.word.length);
  });

  it('a line that spells no hidden word is free, never a miss; a found word marked again is neither', () => {
    for (let s = 1; s <= 12; s++) {
      const g = makeGrids(plan, new Rng(s))[0], found = new Set<number>();
      let free = 0, misses = 0;
      // Every straight line from the top-left corner and the centre: each is a find, a repeat, or free.
      for (const from of [0, 55]) for (let to = 0; to < 100; to++) {
        const line = to !== from ? lineBetween(10, from, to) : null;
        if (!line) continue;
        const r = judgeLine(g, line, found, true);
        if (r.kind === 'miss') misses++;
        if (r.kind === 'free') free++;
      }
      expect(misses, `seed ${s}`).toBe(0);
      expect(free, `seed ${s}`).toBeGreaterThan(0);
      const first = cellsOfWord(10, g.words[0]);
      expect(judgeLine(g, first, found, true)).toEqual({ kind: 'found', word: 0 });
      found.add(0);
      expect(judgeLine(g, first, found, true)).toEqual({ kind: 'again', word: 0 });
      expect(judgeLine(g, [...first].reverse(), found, true)).toEqual({ kind: 'again', word: 0 });
    }
    // On a listed grid the same stray line is still a miss.
    const listed = makeGrids(planFor(2), new Rng(1))[0];
    const stray = Array.from({ length: 100 }, (_, to) => lineBetween(10, 0, to)).find((l) => l && l.length > 1 && wordAt(listed, l, new Set()) < 0)!;
    expect(judgeLine(listed, stray, new Set())).toEqual({ kind: 'miss' });
    // And on a listed grid a found word marked again is a miss, as it always was.
    const w0 = cellsOfWord(10, listed.words[0]);
    expect(judgeLine(listed, w0, new Set([0]))).toEqual({ kind: 'miss' });
  });

  it('hints the shortest unfound word: its first letter first, then its start, and again its start if still unfound', () => {
    for (let s = 1; s <= 12; s++) {
      const g = makeGrids(plan, new Rng(s))[0], found = new Set<number>(), stages = new Map<number, 1 | 2>();
      const shortest = Math.min(...g.words.map((p) => p.word.length));
      const one = hiddenHint(g, found, stages)!;
      expect(g.words[one.word].word.length, `seed ${s}`).toBe(shortest);
      expect(one.stage).toBe(1);
      expect(one.letter).toBe(g.words[one.word].word[0]);
      expect(g.letters[one.cell]).toBe(one.letter);
      expect(one.cell).toBe(cellsOfWord(10, g.words[one.word])[0]);
      stages.set(one.word, 1);
      const two = hiddenHint(g, found, stages)!;
      expect(two).toMatchObject({ word: one.word, stage: 2, cell: one.cell });
      stages.set(one.word, 2);
      expect(hiddenHint(g, found, stages)).toMatchObject({ word: one.word, stage: 2 });
      // Once found, the hint moves to the next shortest.
      found.add(one.word);
      const next = hiddenHint(g, found, stages)!;
      expect(next.word).toBe(shortestUnfound(g, found));
      expect(next.word).not.toBe(one.word);
      expect(next.stage).toBe(1);
      for (let i = 0; i < 6; i++) found.add(i);
      expect(hiddenHint(g, found, stages)).toBeNull();
    }
  });

  it('has its spoken lines, none naming the word it hints', () => {
    for (const id of ['wordsearch.go-hidden', 'wordsearch.go-hidden-keys', 'wordsearch.free', 'wordsearch.hidden-letter', 'wordsearch.hidden-ring'] as const) {
      expect(SCRIPT[id], id).toBeDefined();
      for (const line of SCRIPT[id]) expect(line, id).not.toMatch(/\{word\}/);
    }
  });
});

describe('level 8, picture words (school opening)', () => {
  const plan = planFor(PICTURE_GRID);
  const back = (w: string) => [...w].reverse().join('');
  const allPicture = PICTURE_THEMES.flatMap((t) => t.words);

  it('is the picture plan: a 6 by 6 grid of four words, across only, one to a row', () => {
    expect(plan).toBe(PLANS[PICTURE_GRID - 1]);
    expect(plan).toMatchObject({ size: 6, words: 4, grids: 1, pictures: true, oneARow: true });
    expect(plan.dirs).toEqual([[0, 1]]);
    expect(ORDER).not.toContain(PICTURE_GRID);
  });

  it('makes a playable grid over 300 seeds: four words of one picture theme, left to right, a row each, each once, no stray picture word', () => {
    for (let s = 1; s <= 300; s++) {
      const g = makeGrids(plan, new Rng(s * 2654435 + 11))[0], label = `seed ${s}`;
      const theme = PICTURE_THEMES.find((t) => t.id === g.theme)!;
      expect(theme, label).toBeDefined();
      expect(g.size, label).toBe(6);
      expect(g.letters, label).toHaveLength(36);
      expect(g.letters.every((l) => /^[A-Z]$/.test(l)), label).toBe(true);
      expect(g.words, label).toHaveLength(4);
      expect(new Set(g.words.map((p) => p.word)).size, label).toBe(4);
      expect(new Set(g.words.map((p) => p.r)).size, `${label} one a row`).toBe(4);
      const listed = g.words.map((p) => p.word);
      for (const p of g.words) {
        expect(theme.words, label).toContain(p.word);
        expect([p.dr, p.dc], `${label} ${p.word}`).toEqual([0, 1]);
        expect(textOf(g, cellsOfWord(6, p)), label).toBe(p.word);
        expect(occurrences(6, g.letters, p.word), `${label} ${p.word} once`).toHaveLength(1);
      }
      expect(hasBlocked(6, g.letters, listed), label).toBe(false);
      for (const w of allPicture) if (!listed.includes(w)) expect(occurrences(6, g.letters, w), `${label} stray ${w}`).toHaveLength(0);
    }
  });

  it('every picture theme makes grids, and the same seed gives the same one', () => {
    for (const t of PICTURE_THEMES) for (let s = 1; s <= 40; s++) {
      const g = makeGrid(plan, t, new Rng(s * 97));
      expect(g.theme).toBe(t.id);
      expect(g.words).toHaveLength(4);
    }
    expect(makeGrids(plan, new Rng(9))).toEqual(makeGrids(plan, new Rng(9)));
  });

  it('draws only picture themes for the picture plan, and no other plan ever draws one', () => {
    expect(themesFor(plan)).toEqual(PICTURE_THEMES);
    const ids = new Set(PICTURE_THEMES.map((t) => t.id));
    for (const other of PLANS.filter((p) => p !== plan)) for (const t of themesFor(other)) expect(ids.has(t.id), `${other.name} ${t.id}`).toBe(false);
    for (let s = 1; s <= 40; s++) for (const other of PLANS.filter((p) => p !== plan)) expect(ids.has(makeGrids(other, new Rng(s))[0].theme), other.name).toBe(false);
    const all = [...THEMES, ...PICTURE_THEMES].map((t) => t.id);
    expect(new Set(all).size).toBe(all.length);
    expect(themeById('animals').name).toBe('Animal friends');
    expect(themeById('outside').id).toBe('outside');
  });

  it('has picture words that are short, are Pond Typing pictures, avoid the other game\'s pet words, and never hide one another', () => {
    const skip = ['PIP', 'BUG', 'MUD', 'POND', 'HAT', 'CAKE'];
    for (const t of PICTURE_THEMES) {
      expect(t.words.length, t.id).toBeGreaterThanOrEqual(4);
      for (const w of t.words) {
        expect(w, `${t.id} ${w}`).toMatch(/^[A-Z]{3,4}$/);
        expect(PICTURE_WORDS, `${t.id} ${w}`).toContain(w.toLowerCase());
        expect(skip, w).not.toContain(w);
      }
    }
    expect(new Set(allPicture).size, 'no word in two themes').toBe(allPicture.length);
    for (const w of allPicture) for (const o of allPicture) if (o !== w) expect(w.includes(o) || back(w).includes(o), `${o} in ${w}`).toBe(false);
  });
});
