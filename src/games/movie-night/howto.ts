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
    {
      from: 4,
      to: 4,
      text: 'Pick three pictures: Bunny finds the hat, then smiles. Extra pictures like the cloud are welcome. Touch a picture to see it play. Watch is a free preview; Premiere shows your friends.',
    },
    {
      from: 5,
      text: 'Pick four pictures: show the box before it opens, and keep the kite a surprise until it does. The butterfly is always welcome.',
    },
    {
      from: 4,
      text: 'Drag a picture into a numbered slot, or tap a picture then a slot. Drag one to another slot to swap, or back to the tray. Undo restores the last edit.',
    },
    {
      to: 3,
      text: 'Drag a sound to a picture, or tap a sound then a picture. Tap an installed chip then Return, or drag it back to the tray, to remove it. Undo restores the last edit.',
    },
    {
      from: 2,
      to: 3,
      text: 'Show me places the first requested sound for one hint. You still choose Premiere, then Bow.',
    },
  ],
  finish: [
    { to: 1, text: 'After watching your show with at least one sound, tap Bow.' },
    {
      from: 2,
      to: 3,
      text: 'After a Premiere with the requested sounds, tap Bow. Other sound choices stay free.',
    },
    {
      from: 4,
      text: 'Premiere opens once every slot is full. After a Premiere that tells your friends what they asked, tap Bow.',
    },
  ],
  note: [
    {
      from: 4,
      text: 'Many shows are right: what matters is what friends would learn. Show me adds the next picture for one hint. The first unmet Premiere is free; the second counts one miss and one automatic hint. Swap choosing and watching with a friend.',
    },
    {
      to: 1,
      text: 'Any sound on any picture is welcome. Stop keeps your choices. Swap placing sounds and watching with a friend.',
    },
    {
      from: 2,
      to: 3,
      text: 'The first unmet Premiere is free; the second counts one miss and one automatic hint. Further unmet premieres count a miss. Stop cancels a showing. Swap placing sounds and watching with a friend.',
    },
  ],
};
