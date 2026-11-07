import type { GameHowTo } from '../types';

/** The grown-ups' how-to card for this game; src/content/howto.ts gathers every card into HOW_TO. */
export const HOW_TO: GameHowTo = {
  goal: 'Slide the penguin to the fish, or push an ice block onto a star.',
  steps: [
    { to: 10, text: 'Tap the ice where the penguin should slide.' },
    { from: 11, to: 11, text: 'A yellow arrow shows which way the penguin will slide. Tap the ice where you think it will stop, then watch it go.' },
    { from: 11, to: 11, text: 'It keeps sliding until a rock or the edge stops it. The third slide reaches the fish.' },
    { to: 4, text: 'It only stops when it bumps into something.' },
    { from: 10, to: 10, text: 'It only stops when it bumps into something. Three fish: choose which to eat first.' },
    { from: 5, to: 5, text: 'It stops when it bumps into something, or in soft snow.' },
    { from: 6, to: 7, text: 'Slide into an ice block to push it; it skates until it bumps into something.' },
    { from: 9, to: 9, text: 'Push both blocks to make stopping places on the route to the fish.' },
    { from: 12, to: 12, text: 'Tap the ice where the penguin should slide; slide into the ice block to push it.' },
    { from: 12, to: 12, text: 'The block skates until it bumps into something, or sinks into soft snow. Stop it right on the star.' },
    { from: 12, to: 12, text: 'If the block gets stuck, tap the round arrow to go back.' },
    { from: 13, to: 13, text: 'Two penguins: tap a penguin to choose it, then tap the ice where it should slide.' },
    { from: 13, to: 13, text: 'A penguin stops when it bumps into the other one, so park one to make a stop. Either penguin can eat the fish.' },
    { from: 13, to: 13, text: 'If they get stuck, tap the round arrow to go back.' },
    { from: 8, to: 8, text: 'Push the block to make a stop. Soft snow stops both the penguin and the block.' },
    { from: 7, to: 8, text: 'Collect both fish; plan where to park the block so the penguin can reach them.' },
    { to: 10, text: 'If it gets stuck, tap the round arrow to go back.' },
  ],
  finish: [{ to: 10, text: 'The round ends when the penguin has eaten every fish.' }, { from: 11, to: 11, text: 'The round ends after two ponds of three predictions each.' }, { from: 12, to: 12, text: 'The round ends when the block has stopped on the star in two ponds.' }, { from: 13, to: 13, text: 'The round ends when a penguin has eaten the fish in two ponds.' }],
  note: [
    { to: 10, text: 'After a few extra slides, a yellow arrow shows a next slide; it counts as help.' },
    { from: 12, to: 12, text: 'After a few extra slides, a yellow arrow shows the next slide or push; it counts as help.' },
    { from: 13, to: 13, text: 'After a few extra slides, a yellow arrow stands by the penguin to slide next; it counts as help.' },
    { from: 11, to: 11, text: 'Predictions are experiments and never count as misses; a wrong one hears what stopped the penguin.' },
  ],
};
