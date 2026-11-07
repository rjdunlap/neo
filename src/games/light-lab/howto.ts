import type { GameHowTo } from '../types';

/** The grown-ups' how-to card for this game; src/content/howto.ts gathers every card into HOW_TO. */
export const HOW_TO: GameHowTo = {
  goal: 'Send the sunbeam to the sleeping flowers.',
  steps: [
    { to: 6, text: 'Tap a mirror to turn it.' },
    { from: 3, to: 6, text: 'Turn the mirrors first, then tap the sun to shine.' },
    { from: 5, to: 5, text: 'Colored glass changes the beam: shine through the pink glass to wake the pink flower.' },
    { from: 7, to: 7, text: 'For three puzzles, tap the rock or edge where you think the locked beam will stop. Then turn the mirrors and shine the sun on one final puzzle.' },
    { from: 8, to: 8, text: 'Drag the mirror from the tray onto a square of the board. Tap a placed mirror to turn it, then tap the sun to shine.' },
    { from: 9, to: 9, text: 'Drag both tray mirrors onto the board so the beam goes around the rock. Tap a placed mirror to turn it, then tap the sun to shine.' },
    { from: 10, to: 10, text: 'A cloud hides the one mirror that turns the sunbeam to the flower. Tap the cloud square where it must be: in line with the sun, and in line with the flower.' },
    { from: 11, to: 11, text: 'Tap through, bounce or stop to guess what the light will do to the thing in the sunbeam, then watch the sun shine.' },
    { from: 11, to: 11, text: 'Then tap the thing that wakes the flower, shades the owl, or bounces the light.' },
    { from: 12, to: 12, text: 'The half-mirror splits the sunbeam: one beam goes straight, one bounces.' },
    { from: 12, to: 12, text: 'Turn the mirrors and the half-mirror so both beams wake a flower, then tap the sun.' },
  ],
  finish: [{ to: 6, text: 'The round ends when every flower has woken up.' }, { from: 7, to: 7, text: 'The round ends when the final planning puzzle wakes every flower.' }, { from: 8, to: 9, text: 'The round ends when every flower has woken up.' }, { from: 10, to: 10, text: 'The round ends when the hidden mirror has been found on three boards.' }, { from: 11, to: 11, text: 'The round ends after three guesses and two choices.' }, { from: 12, to: 12, text: "The round ends when both puzzles' flowers are awake." }],
  note: [
    { to: 6, text: 'A mirror turned the wrong way is just another try; the glowing mirror is a hint.' },
    { from: 7, to: 7, text: 'Predictions are experiments and never count as misses. On the final puzzle, the glowing mirror is a hint.' },
    { from: 8, to: 9, text: 'Putting a mirror down is never wrong; a drop off the board goes back to the tray. Only a shine that misses counts, and a glowing square or mirror is a hint.' },
    { from: 10, to: 10, text: 'A wrong square counts as a miss: its cloud puffs away and a pale beam shows where a mirror there would send the light. After two, the sun\'s row and the flower\'s column glow as a hint.' },
    { from: 11, to: 11, text: 'Guesses never count as misses; a wrong choice is just another try, and the glowing thing is a hint.' },
    { from: 12, to: 12, text: 'Turning is free; a shine that leaves a flower asleep is a miss, and the glowing mirror is a hint.' },
  ],
};
