import type { GameHowTo } from '../types';

/** The grown-ups' how-to card for this game; src/content/howto.ts gathers every card into HOW_TO. */
export const HOW_TO: GameHowTo = {
  goal: 'Read a sign and make its meaning happen in the scene.',
  steps: [
    'Tap any printed word to hear it, or the speaker to hear the whole sign. This support is free.',
    { from: 1, to: 1, text: 'Choose the hat whose color matches the printed word.' },
    {
      from: 2,
      to: 2,
      text: 'Both pictures show the same animal; choose the big or small one the two-word sign names.',
    },
    {
      from: 3,
      to: 3,
      text: 'Choose both the animal and its action: the arrow means jump, and Z means sleep.',
    },
    {
      from: 4,
      to: 4,
      text: 'The full stop is already on the sign. Tap the first word to give it a big letter, then press Send.',
    },
    {
      from: 5,
      to: 5,
      text: 'The big letter is already there. Drag the full stop onto the dotted square at the end, or tap the stop then the square, then press Send.',
    },
    {
      from: 6,
      to: 6,
      text: 'Both are missing: tap the first word for a big letter and put the full stop on the dotted square, in either order, then press Send.',
    },
    { from: 4, to: 6, text: 'Show it lets the animal act the sign as it stands, with no verdict.' },
    {
      from: 7,
      to: 7,
      text: "The card shows the pet's wish. Drag words into the sign, along it or off it; Show it acts the sign, then Send when it matches.",
    },
    {
      from: 8,
      to: 8,
      text: 'Watch the animals act the sign as printed, then fix it by dragging one word in from the tray or one word out of the sign, and press Send.',
    },
    {
      from: 9,
      to: 9,
      text: 'Watch the animals act the sign as printed, then drop a tray word right on top of the wrong word to swap them, and press Send.',
    },
  ],
  finish: [
    { from: 1, to: 1, text: 'Choose all three color words to finish.' },
    { from: 2, to: 2, text: 'Choose all three signs, each with a different animal, to finish.' },
    { from: 3, to: 3, text: 'Act out all four sentences to finish.' },
    { from: 4, to: 6, text: 'Send all three signs to finish.' },
    { from: 7, to: 7, text: 'Send all three signs: one animal, then two pairs needing a size word.' },
    {
      from: 8,
      to: 8,
      text: 'Mend and send all three signs: the first needs a size word, and at least one has a word too many.',
    },
    {
      from: 9,
      to: 9,
      text: 'Mend and send all three signs: a wrong action, a wrong animal and a wrong size, one swap each.',
    },
  ],
  note: [
    {
      from: 1,
      to: 3,
      text: 'A wrong picture plays out its meaning, then the sign is read word by word. After two misses on a sign, its answer glows. Listening support does not establish independent reading.',
    },
    {
      from: 4,
      to: 6,
      text: 'Only a Send without the big letter or full stop this sign asks for counts as a miss, and the pet names where a sentence starts or stops. After two on a sign, the control she needs glows (one hint); Show a hint in the pause sheet does the same. Toggling, moving the stop, listening and Show it are never counted.',
    },
    {
      from: 7,
      to: 7,
      text: 'A Send the animals do not act as the wish is a miss (wrong act, two that fit, nobody, or a jumble); the pet says why. After two, the word to add or take out glows (one hint). Edits, listening, Show it and an empty Send are free. The wish is never spoken.',
    },
    {
      from: 8,
      to: 9,
      text: 'Each sign acts itself out first, free. A Send the animals do not act as the wish is a miss, including sending the printed sign unchanged; after two, the glow shows the next edit (for a swap, the tray word and the word it replaces). Taking a word out, then putting another in, also mends a swap sign.',
    },
  ],
};
