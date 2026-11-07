import type { GameHowTo } from '../types';

/** The grown-ups' how-to card for this game; src/content/howto.ts gathers every card into HOW_TO. */
export const HOW_TO: GameHowTo = {
  goal: 'Answer the woodpecker with frog sounds.',
  steps: [
    { to: 2, text: 'Tap the woodpecker to hear its call, then tap frogs to answer.' },
    { from: 7, to: 7, text: 'Knock on the big tree. A frog answers every knock.' },
    { from: 8, to: 8, text: 'The woodpecker knocks. When the frog glows, tap it once to answer.' },
    { from: 9, to: 9, text: 'Knock on the big tree, then stop. The frog answers your knocks with the gaps turned around.' },
    { from: 3, to: 3, text: 'Tap the woodpecker to hear its call, then answer with two or three frog notes.' },
    { from: 4, to: 4, text: 'Tap the woodpecker to hear its call, then play the pictured reply with the two frog voices.' },
    { from: 5, to: 5, text: 'Tap the woodpecker to hear its short call, then answer with a different long-and-short rhythm on the frogs.' },
    { from: 6, to: 6, text: 'Take turns with the woodpecker, playing your frog part each time, then join the final duet.' },
    { to: 6, text: 'Tap the green arrow when the song is ready.' },
  ],
  finish: [
    { to: 2, text: 'After eight frog taps, or sooner with the green arrow, the bird and the frogs sing a short song together and the round ends.' },
    { from: 7, to: 7, text: 'After eight knocks the bird and the frog sing a short song together and the round ends.' },
    { from: 8, to: 8, text: 'After three answers, the bird and the frog sing a short song together and the round ends.' },
    { from: 9, to: 9, text: 'After three calls, the tree knocks the last call again, the frog answers once more and the round ends.' },
    { from: 3, to: 6, text: 'After three replies, the bird and the frogs sing a short song together; tap a frog to join in, then the round ends.' },
  ],
  note: [
    { to: 2, text: 'Any frog tap is welcome. After six quiet seconds a frog wiggles and croaks, an invitation only, never counted as a hint.' },
    { from: 3, to: 4, text: 'Taking turns is the point; a reply need not be perfect. An extra frog tap after the reply sounds but is not counted.' },
    { from: 7, to: 7, text: 'Knock as fast or as slowly as you like, and tap the frog too. Nothing is wrong. After six quiet seconds the frog wiggles and croaks, an invitation only.' },
    { from: 8, to: 8, text: 'A tap during the call just croaks. After three answers the song plays; there are no mistakes. A grown-up can tap the frog for a little one.' },
    { from: 5, to: 6, text: 'Taking turns is the point; a reply need not be perfect. A long pause in the middle of a reply starts it again and is never counted as a miss; an extra tap after the reply sounds but is not counted.' },
  ],
};
