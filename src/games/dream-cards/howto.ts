import type { GameHowTo } from '../types';

export const HOW_TO: GameHowTo = {
  goal: 'One picture, one clue, two ways to see it. Share what a picture makes you think of.',
  steps: [
    'Choose to play with the pet or with a friend next to you.',
    {
      to: 2,
      text: 'When it is your turn to give: tap a dream picture, then tap a clue, then tap the same clue again to give it. The cloud hides your picture.',
    },
    {
      from: 3,
      text: 'Build your own dream: tap a place, a thing and a light, then press the tick. Tap a clue twice to give it. The cloud hides your dream.',
    },
    {
      to: 1,
      text: 'When it is your turn to point: tap the picture the clue makes you think of, then press the tick. Show me turns the picture over without pointing.',
    },
    {
      from: 2,
      to: 2,
      text: 'When it is your turn to point: tap a picture and press the tick. A second clue comes for the same picture. Press Keep it, or tap another picture and press This one.',
    },
    {
      from: 3,
      text: 'When the pet or a friend builds a dream, tap the picture the clue makes you think of and press the tick.',
    },
    'The picture turns over and you look at it together. Swap gives you the next turn.',
  ],
  finish: 'Press the tick to finish. A round gives one sticker.',
  note: 'No picture is wrong: a clue can fit more than one, and a different picture is just another way to see it. The Help hint glows a picture or a clue that fits, never the hidden one.',
};
