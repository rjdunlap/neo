import type { GameHowTo } from '../types';

/** The grown-ups' how-to card for this game; src/content/howto.ts gathers every card into HOW_TO. */
export const HOW_TO: GameHowTo = {
  goal: 'Make a gadget that works for the neighbor.',
  steps: [
    { from: 1, to: 1, text: 'Tap each gadget to try it, then tap the hand under the one that works.' },
    { from: 2, to: 2, text: 'Change one part so the cart works for the new friend, then tap Try.' },
    { from: 3, to: 3, text: 'Drag each part to the socket where it works, then tap Try.' },
    { from: 4, to: 4, text: 'Try the cart, see where it stops, then swap in a part from the shelf and Try again.' },
    { from: 5, to: 5, text: 'Build the cart, Try it, and if it bumps the little gate, swap in a lower part that does the same job.' },
    { from: 6, to: 6, text: "Watch the pet's cart work, then build one from the new box of parts that does the same jobs." },
    { from: 2, to: 6, text: 'Tap the hand to give it when it gets all the way along.' },
  ],
  finish: 'The neighbor loves the gadget, and two more friends make one too.',
  note: [
    { from: 1, to: 2, text: 'Trying is never wrong: it shows where the cart stops. A Give that does not work counts as a miss; the glow and Show a hint each count as a hint.' },
    { from: 3, to: 3, text: 'A part works in only one place: the umbrella has to go on top. Trying is never wrong; a Give that does not work counts as a miss, and the glow and Show a hint each count as a hint.' },
    { from: 4, to: 4, text: 'When two needs want the same socket, one part has to do both jobs. Trying is never wrong; a Give that does not work counts as a miss, and the glow and Show a hint each count as a hint.' },
    { from: 5, to: 6, text: 'The gate is a limit on the whole cart: every part must fit under it, even one doing nothing. In the new box, a part that does the same job may sit somewhere new. Trying is never wrong; a Give that does not work counts as a miss, and the glow and Show a hint each count as a hint.' },
  ],
};
