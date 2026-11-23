import type { GameHowTo } from '../types';

export const HOW_TO: GameHowTo = {
  goal: 'Work out who speaks straight and who is playing Topsy. A Topsy islander says the opposite of what is so.',
  steps: [
    'Read each speech bubble. Tap a bubble to hear it again.',
    'Tap an islander to mark them Straight, tap again for Topsy, and once more to clear the mark.',
    {
      from: 1,
      to: 1,
      text: 'Start with a sentence only one kind could say. “Both of us are Topsy” cannot be so, so its speaker is Topsy and the other speaks straight.',
    },
    {
      from: 2,
      to: 2,
      text: 'With three islanders, settle one, then use that to read what the others say.',
    },
    {
      from: 3,
      to: 3,
      text: 'Try a mark and see what would have to follow. If a sentence can no longer fit, change the mark.',
    },
    {
      from: 4,
      text: 'Tap Left, Middle or Right to choose the sound plank. A plank sentence still has to fit the kind of islander who said it.',
    },
  ],
  finish:
    'Mark every islander and choose a plank when the board shows planks. Then tap Cross. If every sentence fits its speaker, they all walk over the bridge.',
  note: 'Marks are free to change. A wrong crossing shows the first sentence that does not fit; Help shows what the sentences let you settle.',
};
