import type { GameHowTo } from '../types';

/** The grown-ups' how-to card for this game; src/content/howto.ts gathers every card into HOW_TO. */
export const HOW_TO: GameHowTo = {
  goal: 'Tap the jelly drums to make music, then copy tunes.',
  steps: [
    {
      from: 17,
      to: 17,
      text: 'Touch a jelly and it sings. Just after the same jelly answers with the same note and a ripple, and the animals clap.',
    },
    {
      from: 10,
      to: 10,
      text: 'Touch anywhere on the stage and the big jelly sings. Every few touches another jelly wakes up and joins in.',
    },
    {
      from: 1,
      to: 3,
      text: 'Tap a jelly to hear its note. Now and then the voice names its color and size.',
    },
    { from: 2, to: 2, text: 'Every fourth note, one of the animals in the front row sings back.' },
    {
      from: 3,
      to: 3,
      text: 'Three jellies side by side in order, up or down, send a rainbow sparkle across the stage.',
    },
    { from: 4, to: 9, text: 'Listen to the tune, then tap the same jellies in the same order.' },
    {
      from: 11,
      to: 11,
      text: 'Listen to the tune, then tap the same jellies backwards: the last one first, the first one last.',
    },
    {
      from: 12,
      to: 12,
      text: 'Two short songs play, one after the other. Tap the two matching dots if they are the same song, or the two unlike dots if one jelly is different.',
    },
    {
      from: 13,
      to: 13,
      text: 'All four jellies are the same size, so listen first: tap any jelly to hear its voice. Then drag the lowest one to the lit spot, then the next lowest.',
    },
    {
      from: 14,
      to: 14,
      text: 'Listen to the hidden note, then tap the jelly that sang it. Two jellies start awake, then three, then all five.',
    },
    {
      from: 15,
      to: 15,
      text: 'One jelly glows at a time. Tap it and the next one glows, so the song plays as she taps, until the song is done.',
    },
    {
      from: 16,
      to: 16,
      text: 'A song she knows plays through, then plays again without its last note or two. Tap the jellies that finish it.',
    },
  ],
  finish: [
    { from: 1, to: 3, text: 'The round ends after a number of notes.' },
    { from: 4, to: 9, text: 'The round ends when every tune has been copied.' },
    { from: 11, to: 11, text: 'The round ends when every tune has been played backwards.' },
    { from: 12, to: 12, text: 'The round ends when every pair of songs has been judged.' },
    { from: 13, to: 13, text: 'The round ends after three line-ups from lowest to highest.' },
    { from: 14, to: 14, text: 'The round ends after six mystery notes.' },
    { from: 15, to: 15, text: 'The round ends after four short songs, the first one Hot Cross Buns.' },
    { from: 16, to: 16, text: 'The round ends after three songs: Hot Cross Buns, then two more.' },
    { from: 17, to: 17, text: 'The round ends after eight touches.' },
    { from: 10, to: 10, text: 'The round ends after a number of touches, once all five jellies are awake.' },
  ],
  note: [
    {
      from: 1,
      to: 3,
      text: 'If nobody touches for a while, a jelly wiggles to invite another tap. It counts nothing, and neither do the answers or the sparkle: no tap is wrong.',
    },
    {
      from: 4,
      to: 12,
      text: 'The yellow note button above the jellies plays the tune again whenever it is her turn. It counts no miss or hint. Some tunes are bits of real songs, named aloud.',
    },
    {
      from: 12,
      to: 12,
      text: 'About half the pairs are the same. A wrong answer replays both songs slowly with the changed jelly glowing, and after two wrong answers the right button glows too. It is a guess she can make by listening, so the hint comes after two misses.',
    },
    {
      from: 13,
      to: 13,
      text: 'Tapping a jelly to listen never counts a miss. Dropping a wrong jelly onto the lit spot slides it back and names the direction to listen; after two misses the right jelly glows.',
    },
    {
      from: 14,
      to: 14,
      text: 'The yellow note button above the jellies plays the sound again whenever it is her turn. A wrong jelly sings its own note and the right one wiggles; after two misses the right jelly glows.',
    },
    {
      from: 15,
      to: 15,
      text: 'Nothing here is a wrong answer: a different jelly just sings its own note. If she waits, the glowing jelly wiggles.',
    },
    {
      from: 16,
      to: 16,
      text: 'The yellow note button plays the song again. A wrong jelly replays the whole song with its ending glowing; after two misses the first jelly of the ending glows too.',
    },
    {
      from: 17,
      to: 17,
      text: 'Nothing is a wrong answer and no hint is needed. If nobody touches for six seconds, a jelly wiggles to invite another touch.',
    },
  ],
};
