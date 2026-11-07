import type { GameHowTo } from '../types';

/** The grown-ups' how-to card for this game; src/content/howto.ts gathers every card into HOW_TO. */
export const HOW_TO: GameHowTo = {
  goal: "Snip the vines so the fruit drops or swings into a hungry friend's mouth.",
  steps: [
    { from: 1, to: 1, text: 'Tap anywhere to snip the vine.' },
    { from: 2, to: 5, text: 'Tap or swipe across a vine to snip it. One vine left makes the fruit swing.' },
    { from: 3, to: 5, text: 'Snip as the fruit swings toward the friend. It keeps going as it falls.' },
    { from: 4, to: 5, text: "The vine you keep is where it swings from. Keep the vine on the friend's side; one straight above keeps it still." },
    { from: 5, to: 5, text: 'Feed each friend one fruit.' },
  ],
  finish: 'Every friend has eaten.',
  note: [
    { from: 1, to: 2, text: 'The friend scoots to catch every fruit, so nothing counts against her. The swing and the fall follow simple toy rules (slow gravity, no air), close to real motion but not exact.' },
    { from: 3, to: 3, text: 'A fruit that misses floats back up and counts as a miss. After two, a glowing path shows where to snip, which counts as a hint. Grow back is always free. The swing and the fall follow simple toy rules (slow gravity, no air), close to real motion but not exact.' },
    { from: 4, to: 5, text: 'A fruit that misses floats back up and counts as a miss. After two, the vine to keep glows yellow and the ones to snip orange, then a golden path shows where to snip, which counts as a hint. Grow back is always free. The swing and the fall follow simple toy rules (slow gravity, no air), close to real motion but not exact.' },
  ],
};
