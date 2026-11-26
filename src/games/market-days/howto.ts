import type { GameHowTo } from '../types';

export const HOW_TO: GameHowTo = {
  goal: 'Give every town a market day. Towns joined by a dotted path are a day apart, so they must hold their market on different days.',
  steps: [
    'Tap a banner at the bottom to pick a day, then tap a town to give it that day. Tap the town again to clear it.',
    { text: 'Three towns already have their days. Work out the rest from them.', to: 1 },
    { text: 'Start from nothing: any town can come first, and three days are enough.', from: 2, to: 2 },
    { text: 'Use as few days as you can. Why? shows three towns that all need different days.', from: 3 },
  ],
  finish: [
    { text: 'The round ends when every town has a day and no two joined towns match.', to: 2 },
    {
      text: 'The round ends when every town has a day, no two joined towns match, and only three days are used.',
      from: 3,
    },
  ],
  note: 'Two joined towns with the same day wobble and a hint appears after two tries. Hint and Undo are always there, and a clash is never lost: tap a town to clear it. With a keyboard, arrow keys move a ring over the towns, 1 to 4 pick a banner and Enter sets the day. Long ago, towns that held fairs and markets often fixed the days so that nearby towns did not clash.',
};
