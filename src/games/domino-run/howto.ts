import type { GameHowTo } from '../types';

/** The grown-ups' how-to card for this game; src/content/howto.ts gathers every card into HOW_TO. */
export const HOW_TO: GameHowTo = {
  goal: 'Stand the dominoes so the chain rings the bell.',
  steps: [
    { from: 9, to: 9, text: 'First tap the domino you think falls last; the line runs as it stands and the real last one gets a ring. Then fix it.' },
    { from: 1, to: 1, text: 'Tap a domino and the line falls.' },
    { from: 2, to: 2, text: 'Drag the domino from the side into the glowing gap, or just tap it.' },
    { from: 3, to: 9, text: 'Drag a domino from the side into a gap. Tap one in a gap to send it back.' },
    { from: 2, to: 9, text: 'Tap the green domino to start the chain.' },
    { from: 4, to: 5, text: 'A tall domino reaches over one empty space.' },
    { from: 6, to: 9, text: 'A tall domino reaches over one empty space. A domino can push one size bigger, not two, and only a giant rings the gong.' },
    { from: 5, to: 5, text: 'The split block starts two lines.' },
    { from: 8, to: 8, text: 'The split block starts two lines.' },
  ],
  finish: 'Every bell rings.',
  note: [
    { from: 9, to: 9, text: 'Her guess is never right or wrong for the record: it only asks her to read reach and size before the run.' },
    { from: 1, to: 2, text: 'A chain that stops is never counted against her: the dominoes stand back up so she can fix the gap. Reach and size are a game rule, not exact physics.' },
    { from: 3, to: 9, text: 'A chain that stops is never counted against her: the dominoes stand back up so she can fix the gap. After two stopped chains, the next domino to place glows; that counts as a hint. Reach and size are a game rule, not exact physics.' },
  ],
};
