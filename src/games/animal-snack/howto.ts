import type { GameHowTo } from '../types';

/** The grown-ups' how-to card for this game; src/content/howto.ts gathers every card into HOW_TO. */
export const HOW_TO: GameHowTo = {
  goal: 'Feed the animals their favorite snacks.',
  steps: [
    {
      to: 1,
      text: 'Touch anywhere and the big animal munches its snack. A friend walks in after the second snack and another after the fourth; then a touch feeds the animal nearest it.',
    },
    { from: 2, to: 2, text: 'Tap a snack and it floats to the animal who loves it.' },
    {
      from: 3,
      to: 3,
      text: 'Tap the animal that eats the food asked for. Every second question plays an animal sound instead: tap the animal that makes it, or tap the speaker to hear it again.',
    },
    { from: 4, to: 4, text: 'Drag each snack to the animal who eats it.' },
    {
      from: 5,
      to: 5,
      text: 'Give the animal the number of snacks shown by the dots and numeral, then ring the bell.',
    },
    {
      from: 6,
      to: 6,
      text: 'An animal sound plays: drag that animal its own snack. A wrong animal answers in its own voice, and the right animal turns down another food. Tap the speaker to hear the sound again.',
    },
    {
      from: 7,
      to: 7,
      text: 'A food is shown and two of the three animals eat it: tap both. Each one found eats a piece and keeps a green tick; the animal that never eats it says what it eats instead.',
    },
    {
      from: 8,
      to: 8,
      text: 'Two animals and two piles of food: give each animal the number of its own food shown by its dots on the sign, then ring the bell. A food that is not its own slides home; too many come back at the bell.',
    },
    {
      from: 9,
      to: 9,
      text: 'A menu board shows an animal, a numeral from 4 to 9 and a printed food word with its picture: tap that many snacks, then ring the bell. Tap the board to hear it read; that is free.',
    },
    {
      from: 10,
      to: 10,
      text: 'The menu board has two lines, each an animal, a numeral and a food word with no picture: drag each animal that many of its own food, then ring the bell. Tap a line to hear it read; that is free.',
    },
    { from: 11, to: 11, text: 'One animal at a time asks what it eats.' },
    {
      from: 11,
      to: 11,
      text: 'Tap the mat it belongs on: plants, both, or meat. The middle mat is for animals that eat plants and meat.',
    },
    { from: 11, to: 11, text: 'Tap the animal to hear its question again.' },
  ],
  finish: [
    { to: 2, text: 'The round ends after six snacks are eaten.' },
    { from: 3, to: 3, text: 'The round ends after four food questions are answered.' },
    { from: 4, to: 4, text: 'The round ends when all three animals have their snack.' },
    {
      from: 5,
      to: 5,
      text: 'The round ends after three animals receive the requested count, confirmed with the bell.',
    },
    { from: 6, to: 6, text: 'The round ends after four animals are fed from their sounds.' },
    { from: 7, to: 7, text: 'The round ends after four foods, each with both of its eaters found.' },
    {
      from: 8,
      to: 8,
      text: 'The round ends after three pairs of animals each get exactly their counts, confirmed with the bell.',
    },
    {
      from: 9,
      to: 9,
      text: 'The round ends after three menu lines are counted out, confirmed with the bell.',
    },
    {
      from: 10,
      to: 10,
      text: 'The round ends after three two-line menus are given out exactly, confirmed with the bell.',
    },
    { from: 11, to: 11, text: 'The round ends when every animal stands on a mat.' },
  ],
  note: [
    {
      from: 11,
      to: 11,
      text: "A wrong mat only shakes the animal's head, and it says one food it really eats. After two misses on one animal, its mat glows. Only the cat eats meat alone, so some rounds leave the meat mat empty.",
    },
    {
      text: 'Each animal she sees eating its favorite food is added to her discovery journal in the treehouse.',
    },
  ],
};
