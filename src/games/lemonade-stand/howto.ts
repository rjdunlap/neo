import type { GameHowTo } from '../types';

/** The grown-ups' how-to card for this game; src/content/howto.ts gathers every card into HOW_TO. */
export const HOW_TO: GameHowTo = {
  goal: 'Run a lemonade stand for a few days and learn from who comes.',
  steps: [
    { to: 1, text: 'Look at the weather sign, then tap how many cups to make.' },
    {
      from: 2,
      to: 2,
      text: 'Look at the weather sign (a ferry or a quiet day can join it), then tap how many cups to make.',
    },
    {
      from: 3,
      to: 4,
      text: 'Look at the weather sign (a ferry or a quiet day can join it), then tap how many cups and a price in shells.',
    },
    {
      from: 5,
      to: 5,
      text: 'Each morning two boats sell lemons: count the lemons and shells on their signs and tap the cheaper boat. Then tap how many cups and a price in shells.',
    },
    {
      from: 6,
      to: 6,
      text: 'Each morning two boats sell different numbers of lemons for different shells: work out the shells for every 2 lemons on each sign and tap the cheaper boat. Then tap how many cups and a price in shells.',
    },
    {
      from: 7,
      text: "Look at the weather sign and tap how many cups. Before the last day, the three sunny days' friends stand as towers: drag friends from tall to short towers until they are even, then make cups for that typical day.",
    },
    'Tap OPEN and watch the friends buy, then look at the new row of the table. Tap a row to hear it.',
    'The lightbulb asks the pet for help, based on the table so far.',
  ],
  finish: 'The round ends after the last day, when the pet points out one comparison.',
  note: [
    {
      from: 7,
      text: "Running out or having cups left is never a mistake: spare cups go to a picnic. Making a tower taller is not a miss; a second time, the tallest tower glows and counts the day's one hint.",
    },
    {
      from: 5,
      to: 6,
      text: 'Running out or having cups left is never a mistake: spare cups go to a picnic. A dearer boat is a miss; two misses in a morning make the cheaper boat glow, and the glow or the lightbulb counts at most one hint a day.',
    },
    {
      from: 4,
      to: 4,
      text: 'Running out or having cups left is never a mistake: spare cups go to a picnic. Asking for help counts once a day. A lemon costs a shell and makes two cups.',
    },
    {
      text: 'Running out or having cups left is never a mistake: spare cups go to a picnic. Asking for help counts once a day.',
    },
  ],
};
