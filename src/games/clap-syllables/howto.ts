import type { GameHowTo } from '../types';

/** The grown-ups' how-to card for this game; src/content/howto.ts gathers every card into HOW_TO. */
export const HOW_TO: GameHowTo = {
  goal: 'Hear that words are made of beats.',
  steps: [
    {
      from: 9,
      to: 9,
      text: 'Tap the big hands once for each beat. The pet shows one word with one clap and one with two; each tap lights the next bead.',
    },
    { to: 2, text: 'Tap the big hands once for each beat in the word: "but-ter-fly" is three claps.' },
    {
      from: 2,
      to: 2,
      text: 'After your last clap, wait a moment while the ring fills round the hands and the word is counted.',
    },
    { from: 3, to: 3, text: 'Drag each picture to the number of beats in its name.' },
    { from: 4, to: 4, text: 'Listen to the claps, then tap the picture with that many beats.' },
    { from: 5, to: 5, text: 'Sort long words into the one-, two-, three- and four-clap bins.' },
    {
      from: 8,
      to: 8,
      text: 'Listen to both words and their claps. Tap the picture whose word has more claps, or fewer, as the pet asks. The hands button repeats both counts and the request.',
    },
    {
      from: 6,
      to: 6,
      text: 'Drag each picture into a train car: fewest claps at the back, most claps by the engine. Two with the same claps can go either way round.',
    },
  ],
  finish: [
    {
      from: 9,
      to: 9,
      text: 'The round ends after two words. Every clap moves a bead along, so you can always finish.',
    },
    { to: 5, text: 'The round ends after the last word, sort or question.' },
    { from: 6, to: 6, text: 'The round ends after three trains have left.' },
    {
      from: 8,
      to: 8,
      text: 'The round ends after four comparisons. A second wrong choice glows the answer; you can always finish with help.',
    },
  ],
  note: [
    {
      from: 9,
      to: 9,
      text: 'The pet says each word whole and shows its claps. There is no timing test or wrong clap. After a quiet moment the pet shows the word again for free; check that device speech says the words clearly.',
    },
    {
      to: 6,
      text: 'The pet says each word whole and claps its beats with beads lighting up; a wrong count just brings the demonstration and another try. Check on the device that the words are said clearly.',
    },
    {
      from: 8,
      to: 8,
      text: 'Compare the beats in the words, rather than picture size. Wrong choices repeat both counts; replay is free. Check on the device that the words and more/fewer prompts are clear.',
    },
  ],
};
