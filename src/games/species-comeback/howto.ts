import type { GameHowTo } from '../types';

/** The grown-ups' how-to card for this game; src/content/howto.ts gathers every card into HOW_TO. */
export const HOW_TO: GameHowTo = {
  goal: 'Pair the turtles so the next hatchlings come from distant relatives, then settle them somewhere with everything they need.',
  steps: [
    'Tap two turtles to put them in a nest; tap a nest to undo it. Each nest needs one mother and one father.',
    { from: 1, to: 1, text: 'Brothers and sisters never share a nest.' },
    { from: 2, to: 3, text: 'Nor cousins, nor an aunt or uncle with a niece or nephew: follow the lines up to the grandparents.' },
    'Press Spring when every nest is full.',
    { from: 3, to: 3, text: 'Then pick the place that has every need on the card.' },
  ],
  finish: [
    { from: 1, to: 2, text: 'Hatchlings appear under every nest.' },
    { from: 3, to: 3, text: 'The hatchlings walk to their new home.' },
  ],
  note: [
    { text: 'Several plans are right; any plan the rule allows is a good plan.' },
    { text: 'Undoing a nest, hearing a name and pressing Spring too early are never counted.' },
    { text: 'A pair the rule forbids counts as a miss, with the shared relative shown; after two, the next good pair glows, which counts as a hint.' },
    { from: 3, to: 3, text: 'A place missing a need counts as a miss, with the need named.' },
  ],
};
