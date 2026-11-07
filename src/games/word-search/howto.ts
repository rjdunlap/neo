import type { GameHowTo } from '../types';

/** The grown-ups' how-to card for this game; src/content/howto.ts gathers every card into HOW_TO. */
export const HOW_TO: GameHowTo = {
  goal: 'Find the hidden words in a grid of letters.',
  steps: [
    'Tap a word\'s first letter, then tap its last letter to check the line. Tapping the same letter again lets go.',
    { from: 1, to: 1, text: 'You can also drag a finger along the word, from its first letter to its last.' },
    { from: 5, to: 5, text: 'The words run across or down. You can also drag a finger along the word, from its first letter to its last.' },
    { from: 2, to: 7, text: 'If part of the grid is out of sight, drag it to slide it. A quick tap marks a letter; a drag only slides.' },
    { from: 6, to: 6, text: 'Words run across, down or on a slant; you can drag along one. Once all are found, the letters no word uses spell a message in the blanks below.' },
    { from: 7, to: 7, text: 'The list shows only the theme and each word\'s length: think of words the theme could hold, then look, in any direction.' },
    { from: 1, to: 6, text: 'Tap Hint to see where a word starts and hear which word it is; Start over clears the words found.' },
    { from: 7, to: 7, text: 'Hint fills in the shortest word\'s first letter, then rings its start; Start over clears the words found.' },
    { from: 8, to: 8, text: 'The words are pictures beside the grid: tap a picture to hear its word. Every word reads across, from left to right. You can also drag a finger along a word.' },
    { from: 8, to: 8, text: 'Tap Hint to see where a word starts and hear which word it is; Start over clears the words found.' },
  ],
  finish: 'The search is done when every word in the list is found.',
  note: [
    { to: 7, text: 'A line that is not one of the words counts as a miss (free when the words are hidden), and each hint counts as help. A mark that is not straight costs nothing.' },
    { from: 8, to: 8, text: 'At school (about 6 and up) she plays one small grid of four picture words, each spoken on a tap. It practises reading short words and matching their letters. A line that is not one of the words counts as a miss; after two, the start of a word is ringed for her without counting as help.' },
  ],
};
