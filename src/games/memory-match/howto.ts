import type { GameHowTo } from '../types';

/** The grown-ups' how-to card for this game; src/content/howto.ts gathers every card into HOW_TO. */
export const HOW_TO: GameHowTo = {
  goal: 'Turn over cards to find matching pairs.',
  steps: [
    'Tap a card to flip it and hear its name, then tap a second card.',
    'Tap your first open card again to hear its name without choosing another card.',
    'Matching cards stay up; others flip back so you can remember them.',
    {
      from: 1,
      to: 5,
      text: 'Find identical pictures: shapes, island friends, fruit and other familiar things, or vehicles.',
    },
    { from: 6, to: 7, text: 'A number matches the card with that many dots.' },
    { from: 8, to: 8, text: 'A match needs the same shape and the same color.' },
    { from: 9, to: 9, text: 'A capital letter matches its small letter.' },
    { from: 10, to: 10, text: 'A number word matches the numeral that names it.' },
    { from: 11, to: 11, text: 'A picture of equal parts matches the fraction that names the shaded parts.' },
    {
      from: 12,
      to: 12,
      text: 'Turn a card and listen to its time. Find the numbered clock face and digital time that show the same hour or half hour.',
    },
  ],
  finish: [
    { from: 1, to: 11, text: 'The round ends when every pair is found.' },
    { from: 12, to: 12, text: 'Find all three analog and digital clock pairs to finish.' },
  ],
  note: 'A nonmatching pair counts as a miss only when the first card’s partner was already seen. After two misses, one known partner glows until a match clears it.',
};
