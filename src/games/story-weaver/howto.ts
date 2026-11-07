import type { GameHowTo } from '../types';

/** The grown-ups' how-to card for this game; src/content/howto.ts gathers every card into HOW_TO. */
export const HOW_TO: GameHowTo = {
  goal: 'Build a little three-page story from picture tiles and hear the pet read it back.',
  steps: [
    'Touch a tile to hear its words; touch it again to put it on the page. Touch a tile on a page to take it back off.',
    { from: 1, to: 1, text: 'Pages open one at a time: who and where, then what went wrong (what they tried is optional; the arrow turns the page), then how it ended.' },
    { from: 2, text: 'Any page can be filled in any order; touch a page space to choose which tiles show.' },
    { from: 2, to: 2, text: 'The ear button reads the story to the owl, who cannot see the pictures. If a part is missing, the owl asks about it.' },
    { from: 3, to: 3, text: 'Once the story has who, where, what went wrong and an ending, pick how the friend felt, then the part of the story that made them feel that way.' },
  ],
  finish: [
    { from: 1, to: 1, text: 'Placing the ending reads the whole story and finishes the round.' },
    { from: 2, to: 2, text: 'A complete story read to the owl finishes the round, and so does the green "That\'s my story" button at any time.' },
    { from: 3, to: 3, text: 'A reason that fits the feeling reads the whole story with "because" and finishes the round.' },
  ],
  note: [
    { from: 1, to: 2, text: 'Nothing here can be wrong: the owl\'s question is a suggestion, never a mistake, and leaving a part out is fine.' },
    { from: 3, to: 3, text: 'The first reason that does not fit is free; the owl only asks. After that, each one that does not fit counts a miss, and after two misses the parts that fit glow, which counts as one hint (so does the star button).' },
  ],
};
