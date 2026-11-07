import type { GameHowTo } from '../types';

/** The grown-ups' how-to card for this game; src/content/howto.ts gathers every card into HOW_TO. */
export const HOW_TO: GameHowTo = {
  goal: 'Tap the jelly drums to make music, then copy tunes.',
  steps: [
    { from: 10, to: 10, text: 'Touch anywhere on the stage and the big jelly sings. Every few touches another jelly wakes up and joins in.' },
    { from: 1, to: 3, text: 'Tap a jelly to hear its note. Now and then the voice names its color and size.' },
    { from: 2, to: 2, text: 'Every fourth note, one of the animals in the front row sings back.' },
    { from: 3, to: 3, text: 'Three jellies side by side in order, up or down, send a rainbow sparkle across the stage.' },
    { from: 4, to: 9, text: 'Listen to the tune, then tap the same jellies in the same order.' },
  ],
  finish: [
    { from: 1, to: 3, text: 'The round ends after a number of notes.' },
    { from: 4, to: 9, text: 'The round ends when every tune has been copied.' },
    { from: 10, to: 10, text: 'The round ends after a number of touches, once all five jellies are awake.' },
  ],
  note: [
    { from: 1, to: 3, text: 'If nobody touches for a while, a jelly wiggles to invite another tap. It counts nothing, and neither do the answers or the sparkle: no tap is wrong.' },
    { from: 4, to: 9, text: 'The yellow note button above the jellies plays the tune again whenever it is her turn. It counts no miss or hint. Some tunes are bits of real songs, named aloud.' },
  ],
};
