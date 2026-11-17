import type { GameHowTo } from '../types';

/** The grown-ups' how-to card for this game; src/content/howto.ts gathers every card into HOW_TO. */
export const HOW_TO: GameHowTo = {
  goal: 'Pair the turtles so the next hatchlings come from distant relatives, then settle them somewhere with everything they need.',
  steps: [
    {
      from: 1,
      to: 3,
      text: 'Tap two turtles to put them in a nest; tap a nest to undo it. Each nest needs one mother and one father.',
    },
    { from: 1, to: 1, text: 'Brothers and sisters never share a nest.' },
    {
      from: 2,
      to: 3,
      text: 'Nor cousins, nor an aunt or uncle with a niece or nephew: follow the lines up to the grandparents.',
    },
    {
      from: 4,
      to: 4,
      text: "Read the keeper's note, then tap the plan that fits this year and the card that says why. The plan's pairs go into the nests by themselves.",
    },
    'Press Spring when every nest is full.',
    { from: 3, to: 4, text: 'Then pick the place that has every need on the card.' },
  ],
  finish: [
    { from: 1, to: 2, text: 'Hatchlings appear under every nest.' },
    { from: 3, to: 4, text: 'The hatchlings walk to their new home.' },
  ],
  note: [
    { from: 1, to: 3, text: 'Several plans are right; any plan the rule allows is a good plan.' },
    {
      from: 1,
      to: 3,
      text: 'Undoing a nest, hearing a name and pressing Spring too early are never counted.',
    },
    {
      from: 1,
      to: 3,
      text: 'A pair the rule forbids counts as a miss, with the shared relative shown; after two, the next good pair glows, which counts as a hint.',
    },
    { from: 3, to: 4, text: 'A place missing a need counts as a miss, with the need named.' },
    {
      from: 4,
      to: 4,
      text: "Both of the keeper's plans follow the rule; the note says which fits this year. Picking the other, or a reason that does not match, counts as a miss with the trade explained; after two, the fitting card glows, which counts as a hint. Hearing the note or a name is never counted.",
    },
  ],
};
