import type { GameHowTo } from '../types';

/** The grown-ups' how-to card for this game; src/content/howto.ts gathers every card into HOW_TO. */
export const HOW_TO: GameHowTo = {
  goal: 'Put sounds with pictures and watch what your friends hear.',
  steps: [
    {
      to: 1,
      text: 'Choose any sound and put it on any picture. Watch your show; every sound choice is welcome.',
    },
    {
      from: 2,
      to: 2,
      text: 'Put Splash on the picture where Duck lands in the water. Watch is a free preview; Premiere shows your friends.',
    },
    {
      from: 3,
      to: 3,
      text: 'Put Knock on Bunny’s door tap and Hello on the waving friends. Watch is a free preview; Premiere shows your friends.',
    },
    'Drag a sound to a picture, or tap a sound then a picture. Tap an installed chip then Return, or drag it back to the tray, to remove it. Undo restores the last edit.',
    {
      from: 2,
      text: 'Show me places the first requested sound for one hint. You still choose Premiere, then Bow.',
    },
  ],
  finish: [
    { to: 1, text: 'After watching your show with at least one sound, tap Bow.' },
    { from: 2, text: 'After a Premiere with the requested sounds, tap Bow. Other sound choices stay free.' },
  ],
  note: [
    {
      to: 1,
      text: 'Any sound on any picture is welcome. Stop keeps your choices. Swap placing sounds and watching with a friend.',
    },
    {
      from: 2,
      text: 'The first unmet Premiere is free; the second counts one miss and one automatic hint. Further unmet premieres count a miss. Stop cancels a showing. Swap placing sounds and watching with a friend.',
    },
  ],
};
