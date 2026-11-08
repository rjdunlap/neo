import type { GameHowTo } from '../types';

/** The grown-ups' how-to card for this game; src/content/howto.ts gathers every card into HOW_TO. */
export const HOW_TO: GameHowTo = {
  goal: 'Close the ring of stones and pull the frame away: does the arch stand?',
  steps: [
    {
      from: 1,
      to: 1,
      text: 'Tap, and a stone flies onto the frame; the last one is the keystone. Then tap the frame to pull it away.',
    },
    {
      from: 2,
      to: 2,
      text: 'Pull the frames and see which ring stands; on the last pair, tap the one you think will stand first.',
    },
    { from: 3, to: 3, text: 'Drag the block to the side with no wall, then pull the frame.' },
    {
      from: 4,
      to: 4,
      text: 'Pick the channel that goes down all the way (pre-K) or set the piers with the arrows, then open the spring.',
    },
    {
      from: 5,
      to: 5,
      text: 'Drag the arches across the valley and a block to each end with nothing to push on, then open the spring.',
    },
  ],
  finish: [
    { from: 1, to: 3, text: 'The arch stands on its own and the pet walks through.' },
    { from: 4, to: 5, text: 'The water reaches the town and the fountain splashes, twice.' },
  ],
  note: [
    {
      from: 1,
      to: 1,
      text: 'Nothing is counted. Every tap places a stone, a pull before the ring is closed only wobbles the frame, and the handle glows after a quiet moment.',
    },
    {
      from: 2,
      to: 2,
      text: 'Pulling a frame to see what happens is never counted; only the last asked guess is. A wrong guess is one miss, and after two the ring that stands glows, which counts as one hint. A ring that is closed and pushed back at both ends stands. Long ago, by the middle sea, people built rings of stone like this one; some of them are still standing.',
    },
    {
      from: 3,
      to: 3,
      text: 'Dragging the block anywhere before the pull is never counted; only a pull with the block in the wrong place is, one miss, and after two the side that needs it glows, which counts as one hint. A ring that is closed and pushed back at both ends stands. Long ago, by the middle sea, people built rings of stone like this one; some of them are still standing.',
    },
    {
      from: 4,
      to: 5,
      text: 'Moving piers and arches is never counted; only opening the spring when the water stops or an arch slides is, one miss; two on one road or valley light a glow (one hint). Water runs only where every stretch goes down. Each arch is pushed back on both sides, by its neighbour or by the end. Long ago, by the middle sea, people carried water to their towns in channels that went down a little all the way, and across valleys on rows of arches (Roman aqueducts).',
    },
  ],
};
