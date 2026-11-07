import type { GameHowTo } from '../types';

/** The grown-ups' how-to card for this game; src/content/howto.ts gathers every card into HOW_TO. */
export const HOW_TO: GameHowTo = {
  goal: 'Drop a pearl through the garden so flowers bloom.',
  steps: [
    { to: 3, text: 'Tap anywhere to drop a pearl from above that spot.' },
    { from: 8, to: 8, text: 'Tap anywhere to drop a pearl; there are only four flowers, and they are big.' },
    { from: 8, to: 8, text: 'Every flower a pearl touches blooms. There is nothing to get wrong.' },
    { to: 1, text: 'A tap while a pearl is falling drops the next one.' },
    { from: 2, to: 2, text: 'Keep dropping pearls until every flower has bloomed.' },
    { from: 3, to: 3, text: 'Bloom the orange flowers; they are counted aloud.' },
    { from: 3, to: 3, text: 'After two pearls that miss them, a ring on the top shows where to tap.' },
    { from: 4, to: 6, text: 'Drag to aim the launcher, then let go.' },
    { from: 4, to: 4, text: 'Hit the numbered flower that was asked for.' },
    { from: 5, to: 5, text: 'Hit the numbered flowers in order: 1, then 2, then 3.' },
    { from: 4, to: 5, text: 'Only the number asked for opens; another number the pearl touches just wiggles.' },
    { from: 6, to: 6, text: 'Four cups along the sand show one to four dots. Put the pearl in the cup with the count that was asked for.' },
    { from: 6, to: 6, text: 'A pearl in another cup is a miss, and its count is said. After two, the whole path shows while aiming and the asked cup glows.' },
    { from: 7, to: 7, text: 'The pearl drops from one spot and misses the cup with the fish. Drag a seed onto a white ring to plant a bud, then tap the pearl to let it go.' },
    { from: 7, to: 7, text: 'Letting it go with nothing planted is a free look. A run with buds planted that misses the cup is a miss; the buds stay put and can be moved again.' },
    { from: 7, to: 7, text: 'After two misses a glowing outline shows one ring that works on its own, and any other planted bud goes back to its dish.' },
    { from: 4, to: 7, text: 'The last run leaves faint dots showing which way it went, until the next one.' },
  ],
  finish: [
    { to: 1, text: 'The round ends after six pearls.' },
    { from: 8, to: 8, text: 'The round ends when all four flowers have bloomed.' },
    { from: 2, to: 2, text: 'The round ends when every flower has bloomed.' },
    { from: 3, to: 5, text: 'The round ends when the requested flowers have bloomed.' },
    { from: 6, to: 6, text: 'The round ends when three asked cups each have a pearl.' },
    { from: 7, to: 7, text: 'The round ends when the pearl rolls into the cup.' },
  ],
};
