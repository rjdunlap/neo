import type { GameHowTo } from '../types';

/** The grown-ups' how-to card for this game; src/content/howto.ts gathers every card into HOW_TO. */
export const HOW_TO: GameHowTo = {
  goal: 'Guide each egg to its destination.',
  steps: [
    {
      from: 10,
      to: 10,
      text: 'Watch the pet’s failed run. Follow its dotted trace, change the gate that led into the hay, then tap the green arrow. Brown belongs in the basket; white belongs in the nest.',
    },
    {
      from: 11,
      to: 11,
      text: 'Both eggs start at the top. Set all three gates, then tap the green arrow: brown rolls first to the basket, white rolls next to the nest.',
    },
    {
      from: 9,
      to: 9,
      text: 'Tap the single gate to point toward the basket, then tap the green arrow. There are two exits.',
    },
    {
      from: 8,
      to: 8,
      text: 'Watch for the hen who fluffs up and clucks. Tap anywhere in her lane; the basket hops under her and she lays an egg.',
    },
    { to: 1, text: 'Tap a hen; her egg rolls into the basket.' },
    { from: 2, to: 2, text: 'Slide the basket under every falling egg: brown, speckled or blue-green.' },
    { from: 3, to: 3, text: 'Slide the basket under the brown eggs only; white eggs hatch in the hay.' },
    { from: 4, to: 4, text: 'Tap the gates so the egg will roll into the basket, then tap the green arrow.' },
    {
      from: 5,
      to: 5,
      text: 'Tap the gates to send brown eggs to the basket and white eggs to the nest, then tap the green arrow.',
    },
    {
      from: 6,
      to: 6,
      text: 'The gates are already set: tap the hay where the egg will land, then watch it roll.',
    },
    {
      from: 7,
      to: 7,
      text: 'Set the gates for both waiting eggs, then tap the green arrow. Brown enters the top fork; white enters the other branch from its own hen.',
    },
  ],
  finish: [
    { from: 10, to: 10, text: 'Repair four boards, then watch the four eggs hatch.' },
    { from: 11, to: 11, text: 'Route three pairs correctly, then watch all six eggs hatch.' },
    { from: 9, to: 9, text: 'Route four eggs into the basket, then watch them hatch into chicks.' },
    { from: 8, to: 8, text: 'Catch five eggs, then watch the basket hatch into chicks.' },
    { to: 6, text: 'Gather or sort the eggs, then watch the basket hatch into a line of chicks.' },
    { from: 7, to: 7, text: 'Route three pairs correctly, then watch all six eggs hatch.' },
  ],
  note: [
    {
      from: 10,
      to: 10,
      text: 'The pet’s demonstration is free. A failed rerun keeps the board and its new trace. Two misses light the first gate that needs revision. Gates wait while an egg rolls.',
    },
    {
      from: 11,
      to: 11,
      text: 'The spring on the top gate flips it after each egg passes. Lower gates stay put. A failed pair counts once and stays for revision; two misses light the starting directions and show the spring’s change. Touches wait until both eggs finish.',
    },
    {
      from: 9,
      to: 9,
      text: 'The egg waits for the arrow. A wrong-way egg hatches safely in the hay; after two misses the needed direction glows. Gates can still be flipped while the egg rolls.',
    },
    {
      from: 8,
      to: 8,
      text: 'A wrong lane moves the basket but the hen waits and calls again. Two wrong taps light her lane. There is no need to hurry or drag.',
    },
    {
      from: 7,
      to: 7,
      text: 'The gates lock while both eggs roll, one at a time. A missed pair stays for revision; two misses light the needed gate directions.',
    },
    { from: 2, to: 5, text: 'A missed egg only hatches in the hay.' },
    {
      from: 2,
      to: 3,
      text: 'After two missed eggs, the hay under the next catchable egg glows and the eggs fall slower. The hens rest when nobody is playing and lay again at the next touch.',
    },
    {
      from: 4,
      to: 5,
      text: 'Each egg waits at the top until the green arrow, so there is time to look. Gates can still be flipped while it rolls.',
    },
    { from: 6, to: 6, text: 'A wrong guess shows how the gates send the egg; follow them and try again.' },
  ],
};
