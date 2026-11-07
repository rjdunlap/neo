import type { GameHowTo } from '../types';

/** The grown-ups' how-to card for this game; src/content/howto.ts gathers every card into HOW_TO. */
export const HOW_TO: GameHowTo = {
  goal: 'Fill the crossword: spell each word from its picture, riddle or written clue, using the letters the words share.',
  steps: [
    { to: 1, text: 'Drag the letter that fits both words into the empty square where they cross.' },
    { from: 2, to: 2, text: 'Fill the crossing squares and each word\'s first letter; the letters a word needs wait at the side.' },
    { from: 3, to: 3, text: 'Every square starts empty: tap a picture, then drag its word\'s letters in; two extra letters wait with them.' },
    { from: 4, to: 4, text: 'Every square starts empty and each word has a speaker instead of a picture: tap it to hear a riddle, then drag the answer\'s letters in. Show me (the eye) turns the speaker into the picture.' },
    { to: 4, text: 'Tap a word\'s clue square or one of its squares to choose its word and hear it. Tap a crossing square again for the other word.' },
    { to: 4, text: 'A tile in a square can be dragged back out. Help (?) puts one right letter in.' },
    { from: 5, to: 5, text: 'Tap a square to choose it and its across word, and tap it again for its down word. The clue shows above the grid; the speaker reads it aloud.' },
    { from: 6, to: 6, text: 'A five by five mini where every letter is in an across and a down word. Tap a square, tap it again to turn to its other word; the speaker reads the clue.' },
    { from: 5, to: 6, text: 'Type on the letter keys or a keyboard; the cursor moves along the word, and ⌫ clears. Help (?) reveals one letter of the chosen word.' },
  ],
  finish: [
    { to: 1, text: 'The round ends after three little crosswords.' },
    { from: 2, to: 2, text: 'The round ends after two crosswords.' },
    { from: 3, to: 3, text: 'One criss-cross of four words from one theme (animals, the pond or outside), named at the start; the round ends when it is full.' },
    { from: 4, to: 4, text: 'One criss-cross of four riddle words (farm animals, other animals and things outside); the round ends when it is full.' },
    { from: 5, to: 5, text: 'One criss-cross of seven or eight words from one theme (the farm, the kitchen or the garden), named at the start; the round ends when every word is right.' },
    { from: 6, to: 6, text: 'One of six fixed minis; the round ends when every word is right.' },
  ],
  note: [
    { to: 4, text: 'Moving tiles is never judged. A full word that is wrong is one miss and its wrong tiles hop back; after two on a word, the next letter glows. Help counts as a hint, and so does Show me.' },
    { from: 5, to: 6, text: 'Typing is never judged until every square is full. A check with any wrong word is one miss and circles the wrong squares, which stay editable; the grid is checked again once every circled square has changed. Help counts as a hint.' },
  ],
};
