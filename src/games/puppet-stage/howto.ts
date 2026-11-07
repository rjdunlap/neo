import type { GameHowTo } from '../types';

/** The grown-ups' how-to card for this game; src/content/howto.ts gathers every card into HOW_TO. */
export const HOW_TO: GameHowTo = {
  goal: 'Make a puppet pop up and talk in its own voice.',
  steps: [
    { from: 1, to: 1, text: 'Touch the stage floor: a puppet pops up there and says hello. Drag it along, tap it to make it talk again.' },
    { from: 2, to: 2, text: "Listen for the puppet's name, then tap that puppet to make it talk." },
    { from: 3, to: 3, text: 'Tap the sleepy, tiny or big bubble to make the puppet say its line that way; the first tap is a free try.' },
    { from: 4, to: 4, text: 'Look at the story card. Bring that puppet up from under the stage, walk it to the place on the card and tap it to act the scene. Tap a card to hear it.' },
    { from: 5, to: 5, text: 'Act the two cards in order; acting the second card first is one try.' },
    { from: 6, to: 6, text: 'Act all three cards for the friends in the front row. Each friend claps for its scene; tap The end early and the friend who missed a scene says what it waited for.' },
  ],
  finish: [
    { from: 1, to: 1, text: 'After a few pops, tap Bow; the puppets bow and the round ends.' },
    { from: 2, to: 3, text: 'After four right answers the puppets bow and the round ends.' },
    { from: 4, to: 5, text: 'When every card is acted, the puppets bow and the round ends.' },
    { from: 6, text: 'After the third scene, or after The end, tap Bow.' },
  ],
  note: [
    { from: 1, to: 1, text: 'Nothing is counted here; the curtains and the tassel are just for fun.' },
    { from: 2, to: 3, text: "Tapping the other puppet or bubble is one try; after two, the right one glows. Puppet voices are the device's own voice at a different pitch and speed." },
    { from: 4, text: 'Acting somewhere else is never wrong; after three tries the puppet and its place glow. Play together: read each card aloud like a narrator while she moves the puppets, then swap.' },
  ],
};
