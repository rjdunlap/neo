import type { GameHowTo } from '../types';

/** The grown-ups' how-to card for this game; src/content/howto.ts gathers every card into HOW_TO. */
export const HOW_TO: GameHowTo = {
  goal: 'Send the right number of helpers to carry things home.',
  steps: [
    { to: 1, text: 'Tap anywhere and a helper runs to carry it home.' },
    { from: 2, to: 2, text: 'Tap the thing to send a helper; tap again for more. Each helper fills a ring, and it lifts when every ring is full.' },
    { from: 9, to: 9, text: 'Tap the thing to send helpers. Each helper fills a ring; when every ring is full the whistle wiggles. Blow it.' },
    { from: 3, to: 4, text: 'Tap the thing to send helpers until you have sent the number asked for, then blow the whistle. Each helper fills a ring on the badge.' },
    { from: 5, to: 5, text: 'Some helpers are already there and their rings are full: send one helper for each empty ring, then blow the whistle.' },
    { from: 6, to: 6, text: 'Every one in the bunch needs the same team: tap a fruit to send it a helper (a full one says so), then blow the whistle when every team is the asked size.' },
    { from: 7, to: 7, text: 'Two things need different teams and the whole crowd is exactly enough: tap a fruit to send it a helper, split everyone between the two, then blow the whistle.' },
    { from: 8, to: 8, text: 'Big helpers count for two. Tap the helpers you want, or the fruit for the nearest one, until they add up to the number asked for, then blow the whistle. Any mix that adds up is right.' },
  ],
  finish: 'The round ends when everything has been carried home.',
  note: [
    { text: 'Every touch gets an answer: a helper hops, waves or shrugs when everyone is busy. None of these is counted.' },
    { text: 'The round happens in an orchard, at the beach or in the woods, with different things to carry; bigger things need more helpers.' },
    { from: 3, to: 8, text: 'Only a whistle with too few or too many helpers is counted; a whistle before any are sent is just a reminder. Extra helpers show as orange rings outside the badge.' },
    { from: 9, to: 9, text: 'Nothing is counted: an early whistle makes the empty rings blink, and a helper sent past full bounces off and walks back.' },
  ],
};
