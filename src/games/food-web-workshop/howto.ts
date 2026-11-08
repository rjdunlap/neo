import type { GameHowTo } from '../types';

/** The grown-ups' how-to card for this game; src/content/howto.ts gathers every card into HOW_TO. */
export const HOW_TO: GameHowTo = {
  goal: 'Make a picture of who ate what, from the cards.',
  steps: [
    'Tap a card to watch what we saw.',
    "Drag the food's badge onto the one who ate it. The arrow points to the eater.",
    {
      from: 2,
      to: 2,
      text: "One arrow points the wrong way: drag the food's badge onto the eater to turn it.",
    },
    { from: 3, to: 3, text: 'One food can have two arrows.' },
  ],
  finish:
    'Tap the web button when it matches the cards; a matching web earns a sticker. The round arrow takes back the last change.',
  note: "This is a small model of what the cards show. A pair with no card isn't wrong in nature, it just isn't on our cards. Only the web button can count a miss; after two, the cards and creatures to fix glow. Show a hint mends one arrow and counts as help.",
};
