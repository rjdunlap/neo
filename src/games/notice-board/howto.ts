import type { GameHowTo } from '../types';

/** The grown-ups' how-to card for this game; src/content/howto.ts gathers every card into HOW_TO. */
export const HOW_TO: GameHowTo = {
  goal: "Find out about each poster on the village board: who made it, who saw it, why it was made, and what it didn't say.",
  steps: [
    'The pet reads each poster; tap the poster to hear it again.',
    { from: 1, to: 1, text: 'Tap the friend whose badge matches the stamp.' },
    { from: 2, to: 2, text: 'Tap the friend whose picture shows they were there.' },
    { from: 3, to: 3, text: 'Tap the eye basket for news, the hand basket for something to buy.' },
    {
      from: 4,
      to: 4,
      text: "Tap the sign to go and see the real stall, then tap what the poster didn't show.",
    },
    {
      from: 5,
      to: 5,
      text: 'Open the club door to see who made the poster, then tap the friend who tried it.',
    },
  ],
  finish: "The round ends after the board's last poster; one sticker.",
  note: [
    {
      from: 4,
      to: 4,
      text: "The posters are true; they just leave something out. The tags wake once she has gone to see the stall. A tag the poster already shows, or one the stall doesn't have, is a miss; after two on a poster the answer glows (one hint).",
    },
    {
      from: 5,
      to: 5,
      text: 'A guess before the door is open is never counted; a smooth round may include a lucky guess. After the door is open, the seller or a friend who only heard about it is a miss. Selling is named, never judged.',
    },
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
