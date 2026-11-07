import type { GameHowTo } from '../types';

/** The grown-ups' how-to card for this game; src/content/howto.ts gathers every card into HOW_TO. */
export const HOW_TO: GameHowTo = {
  goal: 'Help the makers change a bundle into something new, then find where finished things began.',
  steps: [
    { from: 1, to: 1, text: 'Tap the maker who is waving; the bundle changes at each stall.' },
    { from: 2, to: 2, text: "Tap a maker or drag the bundle to them; a maker who can't use it yet shows what they need." },
    { from: 3, to: 3, text: 'Look at the finished thing and tap where it began; a wrong start walks the lane and makes something else.' },
  ],
  finish: [
    { from: 1, to: 2, text: 'The round ends when both bundles are finished; one sticker.' },
    { from: 3, to: 3, text: 'The round ends after three finished things; one sticker.' },
  ],
  note: [
    { from: 2, to: 3, text: 'The makers are simplified: one maker may stand for several real jobs. A maker who cannot use it yet, or a wrong beginning, is a miss; after two on one bundle or thing the answer glows (one hint). Rounds without hints move her up, which means she matched makers and beginnings with the lines read aloud, not that she would trace a real sock or box on her own.' },
    { text: 'The makers are simplified: one maker may stand for several real jobs. There are no misses here: the next maker always waves.' },
  ],
};
