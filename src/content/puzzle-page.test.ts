import { describe, expect, it } from 'vitest';
import { GAMES } from '../games/registry';
import { BANDS, bandRank, type Band } from '../progress/bands';
import { DEFERRED_CLASSES, EVERY_BAND, UNDER_3, wordPattern } from './offscreen-rules';
import { PUZZLE_IDEAS, puzzlePageCard } from './puzzle-page';

const ids = (band: Band) => puzzlePageCard(band)?.ideas.map((i) => i.id) ?? null;

describe('the puzzle page card (PP8)', () => {
  it('shows from toddler to school, with each idea from its own band, and never at lap or for a grown-up', () => {
    expect(ids('lap')).toBeNull();
    expect(ids('grownup')).toBeNull();
    expect(ids('toddler')).toBeNull(); // one idea alone is not a card
    expect(ids('preschool')).toEqual(['i-spy', 'domino-dots', 'maze']);
    expect(ids('prek')).toEqual(['i-spy', 'domino-dots', 'maze', 'word-ladder']);
    expect(ids('school')).toEqual(ids('prek'));
    expect(puzzlePageCard('school')?.title).toBe('A puzzle page at the table');
  });

  it('keeps every line to the off-screen wording rules, with no small loose object under three', () => {
    const bad: string[] = [];
    for (const idea of PUZZLE_IDEAS) {
      for (const rule of EVERY_BAND) if (rule.test(idea.line)) bad.push(`${idea.id}: ${rule}`);
      for (const word of DEFERRED_CLASSES)
        if (wordPattern(word).test(idea.line)) bad.push(`${idea.id}: ${word}`);
      if (bandRank(idea.from) <= bandRank('toddler'))
        for (const word of UNDER_3) if (wordPattern(word).test(idea.line)) bad.push(`${idea.id}: ${word}`);
    }
    expect(bad).toEqual([]);
  });

  it('claims nothing and names no map, since the page serves both apps', () => {
    const card = puzzlePageCard('school')!;
    const words = [card.title, card.intro, ...card.ideas.map((i) => i.line)].join('\n');
    for (const claim of [
      /brain/i,
      /attention/i,
      /behaviou?r/i,
      /ADHD/,
      /school[- ]ready|readiness/i,
      /smart/i,
      /focus/i,
    ])
      expect(words, String(claim)).not.toMatch(claim);
    for (const word of ['island', 'map', 'home spot', 'picnic'])
      expect(words.toLowerCase(), word).not.toContain(word);
  });

  it('echoes only registered games that a band the idea reaches can play', () => {
    for (const idea of PUZZLE_IDEAS.filter((i) => i.game)) {
      const game = GAMES.find((g) => g.id === idea.game);
      expect(game, idea.id).toBeDefined();
      const reached = BANDS.filter((b) => b.id !== 'grownup' && bandRank(b.id) >= bandRank(idea.from));
      expect(
        game!.bands.some((b) => reached.some((r) => r.id === b)),
        idea.id,
      ).toBe(true);
    }
  });

  it('is the same card for the same band', () => {
    expect(puzzlePageCard('prek')).toEqual(puzzlePageCard('prek'));
  });
});
