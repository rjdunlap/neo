import type { GameHowTo } from '../types';

/** The grown-ups' how-to card for this game; src/content/howto.ts gathers every card into HOW_TO. */
export const HOW_TO: GameHowTo = {
  goal: 'Change paper friends into useful shapes to bring a seed to a pot.',
  steps: [
    'Tap a friend to select it, then tap Flat, Cup or Slope to replace its shape.',
    { from: 1, to: 1, text: 'Drag one friend to the bridge dock and the other to the catching dock. A flat or sloped bridge works; a cup catches the seed.' },
    { from: 2, to: 2, text: 'Drag one friend to the bridge dock and one to the catching dock. The far bank is lower: only a slope reaches it.' },
    { from: 3, to: 3, text: 'Drag one friend to each half of the wide gap. A flat path and a cup at the end make a spoon.' },
    { from: 4, to: 4, text: 'Drag one friend to each half of the wide gap. The far half is lower: a slope and a cup make a spoon.' },
    { from: 5, to: 5, text: 'The gap is a rocky crack: a bridge and a cup at the catch work, or one cup on its ledge.' },
    { from: 6, to: 6, text: 'The stream runs the other way: make a slope, tap Turn so it runs down to the low bank, then add a cup.' },
    { from: 7, to: 7, text: 'A wooden plank already crosses the stream. Make the one friend a cup and drag it to the catching dock.' },
    { from: 8, to: 8, text: 'Two of us: one friend each; only the glowing friend moves, and a drop passes the turn. Just me: use both.' },
    'Tap Try to release the seed. After it is caught, tap the pot to carry and plant it.',
    'Use Replay to return a caught seed to the chute. Undo restores the last shape, placement or turn. Drag a friend to its own parking spot to free a dock.',
  ],
  finish: 'Plant the caught seed to grow a sprout and finish the round.',
  note: 'Experiments never count as mistakes. Help and two unsuccessful runs glow the useful friend, shape tool and dock. Each unresolved role counts at most one hint. Two friends can swap jobs.',
};
