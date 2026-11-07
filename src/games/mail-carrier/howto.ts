import type { GameHowTo } from '../types';

/** The grown-ups' how-to card for this game; src/content/howto.ts gathers every card into HOW_TO. */
export const HOW_TO: GameHowTo = {
  goal: 'Deliver letters to the right houses.',
  steps: [
    { to: 1, text: 'Tap any mailbox to post the letter.' },
    { from: 2, to: 2, text: 'Tap the mailbox whose door is the color of the letter.' },
    { from: 3, to: 3, text: 'Match the dots on the letter to the dots and number on a mailbox.' },
    { from: 4, to: 4, text: 'Tap the house with the number on the letter.' },
    { from: 5, to: 5, text: 'Count the dots on the letter, then tap the house with that number.' },
    { from: 6, to: 6, text: 'Find who the letter is for in the picture key, then tap the house with their sign.' },
    { from: 7, to: 7, text: 'Tap the house for letter one, then the house for letter two, then tap the green arrow to walk the route.' },
    { from: 8, to: 8, text: 'Find who the letter is for in the picture key and tap their house. Then compare the two paths and tap the one with fewer stepping stones.' },
    { from: 9, to: 9, text: 'Look at the problem on the letter, like a dripping tap, then tap the helper whose tool fixes it.' },
    { from: 10, to: 10, text: 'Look at the tool picture on the letter, then tap the house whose sign shows the same tool.' },
    { from: 11, to: 11, text: 'Read the numeral on the letter. Odd numbers are above the road, even below; each side rises from left to right. Tap that house.' },
    { from: 15, to: 15, text: 'Hazel’s key got wet. Tap a blank sign row, then the house with the same sign. Its neighbour fills the row. Fill all five rows, then use your key to deliver two picture letters, one at a time.' },
    { from: 14, to: 14, text: 'Find the three neighbours in the key. Tap their houses in any order, then the green arrow. Tap a planned stop to remove it and the stops after it. The walk counts one stone per path segment, including the return to the post office.' },
    { from: 14, to: 14, text: 'After each bag, choose the blue circle arrow to plan one free second walk with the same stops, or the green arrow to continue. The second walk compares its count with the first; every order is welcome.' },
    { from: 13, to: 13, text: 'Listen to Hazel’s clue and tap the one house it describes. Between and next on the left refer to the top row; nearest and farthest compare straight-line distances. Tap Hazel at the post office to replay for free.' },
    { from: 12, to: 12, text: 'Read the two-digit number on the letter and tap the house with that number. The pet says it as ten and some ones.' },
  ],
  finish: [
    { to: 7, text: 'The round ends when the letters are delivered.' },
    { from: 8, to: 8, text: 'The round ends when the shorter path is walked and the letter is delivered.' },
    { from: 9, to: 13, text: 'The round ends when the letters are delivered.' },
    { from: 15, to: 15, text: 'Making the key and delivering both letters finishes one round.' },
    { from: 14, to: 14, text: 'Two bags finish the round. Each optional second walk is free and awards no extra sticker.' },
  ],
  note: [{ from: 8, to: 8, text: 'The stones mark the path length. Count them together; every destination has one path with fewer stones.' }],
};
