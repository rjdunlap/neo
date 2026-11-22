import { bandRank, type Band } from '../progress/bands';

/**
 * The puzzle page card in At home on the grown-ups' page (PP8, docs/definitions/at-home-card.md#the-puzzle-page-card-pp8-defined-2026-11-21):
 * puzzles for a table or a car that need a pencil, paper or a picture book and nothing else. Pure: the same band gives
 * the same card, and nothing is tracked.
 */

export interface PuzzleIdea {
  id: string;
  /** The youngest band the idea reaches. */
  from: Band;
  line: string;
  /** The built game it echoes, by ID, named after the line. */
  game?: string;
}

export const PUZZLE_IDEAS: readonly PuzzleIdea[] = [
  {
    id: 'i-spy',
    from: 'toddler',
    line: 'In a picture book, take turns: “I spy something red.” Point together when it is found.',
  },
  {
    id: 'domino-dots',
    from: 'preschool',
    line: 'Count the dots on a domino together, then find another with the same number and lay those ends touching.',
    game: 'domino-pond',
  },
  {
    id: 'maze',
    from: 'preschool',
    line: 'Draw a maze on paper with a start, a pond and one wrong turn, then swap and draw one for each other. Bumping a wall just means going back.',
    game: 'mossy-path',
  },
  {
    id: 'word-ladder',
    from: 'prek',
    line: 'Say a word ladder in the car: change one sound at a time, cat, hat, hot, pot. Take turns; a made-up word counts.',
  },
];

export interface PuzzlePageCard {
  title: string;
  intro: string;
  ideas: PuzzleIdea[];
}

/** The fewest ideas that make a card; below it the card is left out. */
export const PUZZLE_PAGE_MIN = 2;

/** The card at a profile's band: `null` for a grown-up (an adult playing alone) and wherever fewer than two ideas reach. */
export function puzzlePageCard(
  band: Band,
  ideas: readonly PuzzleIdea[] = PUZZLE_IDEAS,
): PuzzlePageCard | null {
  if (band === 'grownup') return null;
  const reached = ideas.filter((i) => bandRank(i.from) <= bandRank(band));
  if (reached.length < PUZZLE_PAGE_MIN) return null;
  return {
    title: 'A puzzle page at the table',
    intro: 'Paper and a pencil, a picture book or a few dominoes are all these need.',
    ideas: reached,
  };
}
