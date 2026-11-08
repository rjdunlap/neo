import type { GameHowTo } from '../types';

/** The grown-ups' how-to card for this game; src/content/howto.ts gathers every card into HOW_TO. */
export const HOW_TO: GameHowTo = {
  goal: 'Set, read and change times on a clock.',
  steps: [
    { to: 1, text: 'Touch the middle to turn the short hour hand to the time asked, then ring the bell.' },
    {
      from: 2,
      to: 4,
      text: 'Touch the middle to turn the short hour hand and the edge to turn the long minute hand, then ring the bell.',
    },
    {
      from: 5,
      to: 5,
      text: 'Match the big clock to an appointment in a friend’s pretend plan, then tap its picture. Each picture has a little clock and a digital time; tap the time to hear it for free.',
    },
    {
      from: 6,
      to: 6,
      text: 'Turn the hands to one hour after the time on the sign, then ring the bell. After a check, compare the faint old clock with the moving hour hand beside it: the minutes stay the same.',
    },
    {
      from: 7,
      to: 7,
      text: 'Turn the hands to the time on the sign, like 3:25. The small numbers around the edge count by fives for the long hand; zero is at 12. A whole turn is 60 minutes and starts the next hour at zero. Then ring the bell.',
    },
    { to: 4, text: 'Tap the time sign to hear the request again for free.' },
    { from: 6, to: 7, text: 'Tap the time sign to hear the request again for free.' },
  ],
  finish: [{ to: 7, text: 'Four correct answers complete the round.' }],
  note: [
    {
      to: 4,
      text: 'After two misses on a time, yellow hands show the answer to copy. Turning or replaying is free.',
    },
    {
      from: 5,
      to: 5,
      text: 'After two misses on a time, the matching picture glows. Replaying appointment times is free; this is a pretend plan, never a required home routine.',
    },
    {
      from: 6,
      to: 6,
      text: 'After two misses on a time, yellow hands show the answer to copy. Turning or replaying is free.',
    },
    {
      from: 7,
      to: 7,
      text: 'After two misses on a time, yellow hands show the answer to copy, with spoken counting by fives and an arc from zero to the target minute. Turning or replaying is free.',
    },
  ],
};
