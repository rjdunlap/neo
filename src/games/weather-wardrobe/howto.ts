import type { GameHowTo } from '../types';

/** The grown-ups' how-to card for this game; src/content/howto.ts gathers every card into HOW_TO. */
export const HOW_TO: GameHowTo = {
  goal: 'Choose clothes to suit the weather.',
  steps: [
    { to: 1, text: 'Tap the sky to change the weather (sun, rain, snow, then wind); the pet dresses itself.' },
    { to: 1, text: 'Tap the grass to splash, crunch, scatter leaves or pop up a flower, and tap the clothes on the pet to hear their names.' },
    { from: 8, to: 8, text: 'Tap either thing to try it on the pet. The one that fits stops the weather; the other shows what the weather does and hops back.' },
    { from: 2, to: 3, text: 'Tap the one thing that suits the weather.' },
    { from: 4, to: 5, text: 'Tap every thing that suits the weather.' },
    { from: 6, to: 6, text: 'Tap the clothes that suit each kind of weather, to pack for the trip.' },
    { from: 7, to: 7, text: 'Tap each worn item that does not suit the new weather to take it off, then tap clothes for the new weather.' },
    { from: 10, to: 10, text: 'Look at each friend’s weather sign. Drag each of the four things to the friend whose weather it suits.' },
    { from: 9, to: 9, text: 'Look at what the pet is wearing, then tap the sky it is dressed for.' },
  ],
  finish: [
    { to: 6, text: 'The round ends when the pet is dressed for the weather (or the trip, which then plays out weather by weather).' },
    { from: 8, to: 8, text: 'Each of three weathers ends when the fitting thing is on the pet.' },
    { from: 7, to: 7, text: 'The round ends when the pet has changed clothes for each new weather.' },
    { from: 10, to: 10, text: 'Dress both friends in each of three rounds. Each friend receives two things.' },
    { from: 9, to: 9, text: 'Each of three rounds ends when the right sky is picked.' },
  ],
  note: [
    { from: 2, to: 7, text: 'A wrong choice goes on the pet for a moment to show what the weather does (in wind it blows away), is told which weather it is for, and the glowing one helps.' },
    { from: 8, to: 8, text: 'There are no wrong answers here: everything can be tried on.' },
    { from: 10, to: 10, text: 'A wrong friend hands the item back and names why. Two misses glow one item and its friend, counting one hint per round. Dropping elsewhere is free; tapping a friend repeats the instruction.' },
    { from: 9, to: 9, text: 'A wrong sky plays over the pet for a moment to show what that weather does, then clears; after two wrong skies the right card glows.' },
  ],
};
