import type { GameHowTo } from '../types';

/** The grown-ups' how-to card for this game; src/content/howto.ts gathers every card into HOW_TO. */
export const HOW_TO: GameHowTo = {
  goal: "Read the sea's current arrows to say where a floating card will wash up, and work back from where cards were found.",
  steps: [
    { text: 'The arrows show which way the water moves; a card follows them until it reaches a beach.' },
    { from: 1, to: 1, text: 'Tap the beach where the card will wash up.' },
    { from: 2, to: 2, text: 'Tap the boat that should drop the card so it reaches the friend.' },
    { from: 3, to: 3, text: 'Lay a patch of arrows into the fog and press Check: it fits if every returned card would land where it was found.' },
  ],
  finish: 'The round ends when every card has been found.',
  note: [
    { text: 'Tracing the arrows with a finger is always free: a dotted line shows the next two squares.' },
    { from: 1, to: 1, text: 'The first card of each round is a free guess; after that a wrong beach is a miss, and after two the right beach glows (one hint). Show me traces the whole drift (one hint).' },
    { from: 2, to: 2, text: 'Any boat that reaches the friend is right. A wrong boat is a miss: its card drifts to whoever finds it and comes back; after two, a right boat glows (one hint), as Show me does.' },
    { from: 3, to: 3, text: 'Trying patches in the fog is free. A Check that a card rules out is a miss (that card rides her arrows to the wrong beach), once per patch; after two, the right patch glows (one hint). Show me names the card that rules out her patch (one hint). The fog never shows its arrows until she lays a patch in. About 9 and up.' },
    { text: 'A pretend sea whose currents stay still. Real currents are driven by wind, tides and differences in the water, so they shift; scientists really do learn about them from drift cards that finders report.' },
    { text: 'Rounds without hints move her up, which means she read the pretend sea, not that she knows real ocean currents.' },
  ],
};
