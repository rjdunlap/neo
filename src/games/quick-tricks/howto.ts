import type { GameHowTo } from '../types';

/** The grown-ups' how-to card for this game; src/content/howto.ts gathers every card into HOW_TO. */
export const HOW_TO: GameHowTo = {
  goal: 'Do a short show of tiny tricks.',
  steps: [
    'Do each trick as it appears: drag, tap or turn what is shown.',
    'Tap the green arrow to move on to the next trick.',
    {
      from: 8,
      to: 8,
      text: 'A tiny show of two tricks: a leaf dropped anywhere over the friend, even in front, floats up and keeps them dry, and the bridge snaps across once it is stretched past halfway. Nothing counts as a miss; the pet says the trick again after a quiet moment.',
    },
    { from: 1, to: 1, text: 'A leaf dropped below the friend is a free try: the rain shows it is too low.' },
    {
      from: 4,
      to: 6,
      text: 'At the picnic the last bowl finishes that trick by itself; only the berries are checked with the yellow arrow.',
    },
    {
      from: 7,
      to: 7,
      text: 'Two of each: two leaves for three friends, two lost socks, two gaps to bridge. A leaf over only some friends stays up, and a leaf or plank already placed can be dragged off again for free.',
    },
    {
      from: 7,
      to: 7,
      text: 'If both leaves are up and someone is still wet, the pet says a leaf can move and the glow shows which; that counts as the hint.',
    },
    {
      from: 9,
      to: 9,
      text: 'The third show: turn the handle round and round, pour from the jug and let go at the line (too much is tipped out, never a mistake), then draw a loop around the fireflies asked for.',
    },
  ],
  finish: 'The round ends after the last trick, when everyone in the show takes a bow.',
  note: 'There is at most one hint per trick.',
};
