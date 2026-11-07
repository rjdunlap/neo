import type { GameHowTo } from '../types';

/** The grown-ups' how-to card for this game; src/content/howto.ts gathers every card into HOW_TO. */
export const HOW_TO: GameHowTo = {
  goal: 'Link beads together hand to hand, and see that the same beads can make different shapes.',
  steps: [
    'Drag from one bead to another to link them (or tap one bead, then the other), and tap a link to break it.',
    { from: 1, to: 1, text: 'Link until every hand is held and all the beads are one piece.' },
    { from: 2, to: 2, text: 'Build the shape on the card, then tap Check.' },
    { from: 3, to: 3, text: 'Take the built shapes apart and make the two on the card with every bead, then tap Check.' },
    { from: 4, to: 4, text: 'Build either shape on the card and tap Check, then rearrange the same beads into the other and Check again.' },
    { from: 5, to: 6, text: 'Build the shape the pet names, then tap Check.' },
    { from: 6, to: 6, text: 'Some pairs hold two hands: link the same two beads twice. A tap breaks one of the two.' },
    { from: 7, to: 7, text: 'Break the built shapes and rearrange the same beads into the ones on the card, then tap Check. A pair can hold two links.' },
    { from: 1, to: 2, text: 'The yellow arrow undoes one step; the round arrow takes every link apart.' },
    { from: 5, to: 6, text: 'The yellow arrow undoes one step; the round arrow takes every link apart.' },
    { from: 3, to: 4, text: 'The yellow arrow undoes one step; the round arrow puts the beads back to where this shape started.' },
    { from: 7, to: 7, text: 'The yellow arrow undoes one step; the round arrow puts the beads back to where this card started.' },
  ],
  finish: [
    { from: 1, to: 1, text: 'Every hand is held and all the beads are one piece, three times.' },
    { from: 2, to: 2, text: 'Two shapes match their cards.' },
    { from: 3, to: 3, text: 'Two cards: the built shapes become the two on the card, with no bead left over.' },
    { from: 4, to: 4, text: 'Two sets: both shapes made from the same beads, one after the other.' },
    { from: 5, to: 5, text: 'Three named shapes match their cards: water, then ammonia and methane.' },
    { from: 6, to: 6, text: 'Three cards: oxygen, carbon dioxide, then hydrogen and oxygen.' },
    { from: 7, to: 7, text: 'Two cards: hydrogen and oxygen become two waters, then back again.' },
  ],
  note: [
    { from: 1, to: 1, text: 'Linking, breaking and undo never count as mistakes, and nothing here is ever wrong. If no free hands can reach each other, a link to break pulses, with no count. This is a puzzle about beads and hands, not a model of real substances.' },
    { from: 2, to: 2, text: 'Linking, breaking and undo never count. A Check that is not the card is one miss (checking the same build again is not) and the pet names a bead or link to look at; after two misses the one to change glows, which counts as a hint, and a third wrong Check finishes the shape by itself. This is a puzzle about beads and hands, not a model of real substances.' },
    { from: 3, to: 4, text: 'Linking, breaking and undo never count. A wrong Check is one miss (the same build again is not) and the pet names a bead or link; after two the one to change glows (one hint), and a third wrong Check finishes it by itself. A puzzle about beads and hands, not real substances.' },
    { from: 5, to: 7, text: "A wrong Check is one miss; two light the glow (one hint). Beads are a flat toy model: real atoms aren't coloured balls, hands aren't electrons, and the game leaves out 3D shape, charges, energy and what makes a change happen." },
  ],
};
