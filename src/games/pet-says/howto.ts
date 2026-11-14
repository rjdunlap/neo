import type { GameHowTo } from '../types';

/** The grown-ups' how-to card for this game; src/content/howto.ts gathers every card into HOW_TO. */
export const HOW_TO: GameHowTo = {
  goal: 'Copy what the pet does.',
  steps: [
    { to: 1, text: 'Watch the pet, then do the move yourself away from the screen.' },
    {
      from: 2,
      to: 2,
      text: 'Listen to the body word, then find it on yourself away from the screen. Last comes the "head, shoulders, tummy, toes" song: one more word goes quiet each time, but keep touching.',
    },
    {
      from: 3,
      to: 3,
      text: 'Do the two moves in order, away from the screen: "stomp three times, then clap". The pet counts the beats.',
    },
    {
      from: 4,
      to: 4,
      text: 'Move only when you hear the pet\'s name first, away from the screen. Another name is a trick too. "Do this" means copy; "do that" means stay still.',
    },
    {
      from: 5,
      to: 5,
      text: 'Dance the way the pet dances while the music plays. When it stops, freeze like the statue the pet names: a tree, a star, a flamingo.',
    },
    {
      from: 6,
      to: 6,
      text: 'A sun means copy the pet. A moon means do the opposite: it reaches up high, so you crouch down low. After the arrow, the pet shows the opposite.',
    },
    {
      from: 4,
      to: 4,
      text: 'To see a turn again, a grown-up holds the orange button above the arrow (it counts as help). Tapping the pet shows the move again for free.',
    },
    {
      from: 6,
      to: 6,
      text: 'To see a turn again, a grown-up holds the orange button above the arrow (it counts as help). Tapping the pet shows the move again for free.',
    },
    {
      from: 13,
      to: 13,
      text: 'Tap anywhere to pat the pet. Each pat makes it do its next move: wave, clap, jump, peekaboo, pat-a-cake. Do the move together if you like.',
    },
    { to: 12, text: 'A grown-up taps the arrow to go on.' },
  ],
  finish: [
    { to: 12, text: 'The round ends after the last move.' },
    { from: 13, text: 'The round ends after the fifth move; the pet cheers by itself.' },
  ],
  note: 'This is a body game; the screen is the guide.',
};
