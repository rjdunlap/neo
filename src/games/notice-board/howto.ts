import type { GameHowTo } from '../types';

/** The grown-ups' how-to card for this game; src/content/howto.ts gathers every card into HOW_TO. */
export const HOW_TO: GameHowTo = {
  goal: 'Find out about each poster on the village board: who made it, who saw it, and why it was made.',
  steps: [
    'The pet reads each poster; tap the poster to hear it again.',
    { from: 1, to: 1, text: 'Tap the friend whose badge matches the stamp.' },
    { from: 2, to: 2, text: 'Tap the friend whose picture shows they were there.' },
    { from: 3, to: 3, text: 'Tap the eye basket for news, the hand basket for something to buy.' },
  ],
  finish: "The round ends after the board's last poster; one sticker.",
  note: [
    {
      from: 2,
      to: 2,
      text: "Some posters stretch the truth; the witness's photo shows what happened, and nobody is told off. A friend who was somewhere else or only heard about it is a miss; after two on a poster the answer glows (one hint). Rounds without hints move her up, which means she found makers, witnesses and purposes with the posters read aloud, not that she questions real adverts on her own.",
    },
    {
      from: 3,
      to: 3,
      text: 'Selling is ordinary here: the maker just says what they want. Tapping a friend is never counted. Rounds without hints move her up, which means she found makers, witnesses and purposes with the posters read aloud, not that she questions real adverts on her own.',
    },
    {
      from: 1,
      to: 1,
      text: 'A friend with a different badge is a miss; after two on a poster the answer glows (one hint). Rounds without hints move her up, which means she found makers, witnesses and purposes with the posters read aloud, not that she questions real adverts on her own.',
    },
  ],
};
