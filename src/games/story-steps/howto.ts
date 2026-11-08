import type { GameHowTo } from '../types';

/** The grown-ups' how-to card for this game; src/content/howto.ts gathers every card into HOW_TO. */
export const HOW_TO: GameHowTo = {
  goal: 'Tell stories in pictures, explore what makes things happen, and predict or create an ending.',
  steps: [
    {
      from: 12,
      to: 13,
      text: 'Tap one picture in each pair: a character, weather, and a picnic prop. Tap the stage with the triangle to watch your narrated show.',
    },
    {
      from: 13,
      to: 13,
      text: 'After watching, change the weather or prop and watch again. The first show stays beside the stage so you can compare the endings; the cast stays the same.',
    },
    {
      from: 12,
      to: 13,
      text: 'The curved arrow undoes one edit. Watch replays your current story; the lightbulb speaks help and glows a useful control.',
    },
    { to: 2, text: 'Drag the picture that comes next into the glowing space.' },
    { from: 3, to: 5, text: 'Drag the pictures into the spaces in the order the story happens.' },
    {
      from: 6,
      to: 6,
      text: 'Drag the picture that belongs in the missing middle into the glowing space; some pictures are from another story.',
    },
    {
      from: 7,
      to: 7,
      text: 'Choose the four pictures that make one story, and drag them into place in order.',
    },
    {
      from: 8,
      to: 8,
      text: 'Look at the picture already shown. Drag the picture that made it happen into the glowing space before it.',
    },
    { to: 8, text: 'Tap the music button to hear the pictures placed so far.' },
    {
      from: 10,
      to: 10,
      text: 'Drag each picture into the first glowing space of its own story row, in order. Tap a picture beside a row to hear that story’s name.',
    },
    {
      from: 11,
      to: 11,
      text: 'Look at the three shown pictures and drag one of the two endings into the glowing space. Tap a shown picture to hear it, or the music button to replay the three clues.',
    },
    { from: 10, to: 10, text: 'The music button tells the pictures placed so far in both rows.' },
    {
      from: 9,
      to: 9,
      text: 'Tap one picture, then another, to swap them; tap the selected picture again to leave it where it is.',
    },
    {
      from: 9,
      to: 9,
      text: 'Tap the music button to hear the current order. The curved arrow puts the last swapped pair back.',
    },
  ],
  finish: [
    {
      from: 12,
      to: 12,
      text: 'After watching your show, tap the green check to take a bow and finish. Every story is accepted; you can edit and watch again first.',
    },
    {
      from: 13,
      to: 13,
      text: 'After watching the first show and a version with one changed event, tap the green check to take a bow. Creative choices cost no misses; each lightbulb request counts one hint.',
    },
    { to: 7, text: 'The round ends when the story pictures are in a sensible order.' },
    {
      from: 8,
      to: 8,
      text: 'The round ends when the cause is before its effect, and the pet explains what happened.',
    },
    {
      from: 11,
      to: 11,
      text: 'The round ends with the ending supported by the clue and a spoken explanation. The first other prediction plays without a miss; repeating it counts a miss and glows the clue, with one hint per round.',
    },
    {
      from: 10,
      to: 10,
      text: 'The round ends when both three-picture stories are in order. Two misses glow a useful next picture.',
    },
    {
      from: 9,
      to: 9,
      text: 'The round ends when all four pictures tell the story in order. Swaps are experiments; after eight swaps, a glow helps with an out-of-place picture.',
    },
  ],
};
