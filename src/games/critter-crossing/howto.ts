import type { GameHowTo } from '../types';

/** The grown-ups' how-to card for this game; src/content/howto.ts gathers every card into HOW_TO. */
export const HOW_TO: GameHowTo = {
  goal: 'Work out which critters the bridge gate lets across.',
  steps: [
    { from: 8, to: 8, text: 'The sign shows a picture with a red slash: tap the critters that do not fit that picture. They cross the bridge.' },
    { to: 1, text: 'The gate shows its rule: tap only the critters that fit it to send them across.' },
    { from: 2, to: 7, text: 'Tap a critter to send it to the gate: it crosses, or waits with a red mark.' },
    { from: 2, to: 7, text: 'After a few tries, tap the light bulb and pick the picture that matches who crossed.' },
    { from: 4, to: 4, text: 'The rule has two parts: a critter must fit both to cross.' },
    { from: 5, to: 5, text: 'The rule may be "not" something, or have two parts: use everything you have seen.' },
    { from: 6, to: 6, text: 'The rule has two parts joined by "or": a critter that fits either one crosses, so most critters cross. Look for who waits.' },
    { from: 7, to: 7, text: 'Two pictures are still in the running after two tries. Choose the critter that the two pictures would answer differently, then tap the light bulb for the one that is left. A critter they would answer the same way is a free try, never a mistake.' },
  ],
  finish: [
    { from: 8, to: 8, text: 'The round ends when every critter that does not fit the slashed picture has crossed.' },
    { to: 1, text: 'The round ends when the critters that fit have crossed.' },
    { from: 2, to: 7, text: 'The round ends when the secret rule is guessed; the critters not yet tried then cross or wait by the rule.' },
  ],
  note: [
    { from: 8, to: 8, text: 'Sending a critter that fits the slashed picture is a gentle mistake; it returns to try again. After two misses a critter that can cross glows.' },
    {
      from: 2, to: 7,
      text: 'Trying a critter is never a mistake. A guess only counts as one if it disagrees with something you saw; a fair guess that is not yet proven just says to try another critter.',
    },
  ],
};
