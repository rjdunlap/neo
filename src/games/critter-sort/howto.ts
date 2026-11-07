import type { GameHowTo } from '../types';

/** The grown-ups' how-to card for this game; src/content/howto.ts gathers every card into HOW_TO. */
export const HOW_TO: GameHowTo = {
  goal: 'Sort critters, and little plants, by pictured rules and explore the groups you made.',
  steps: [
    { from: 13, to: 13, text: 'Drag each little plant into the hoop for what it shares with the big plant, the middle for both, or the leaf mat for neither.' },
    { from: 12, to: 12, text: 'Drag each little plant that matches the sign into the hoop. The others can stay on the grass.' },
    { from: 11, to: 11, text: 'Sort all six critters into the two separate hoops or onto the leaf mat. Then tap critters to count each part aloud; a ring marks each counted critter. Tap a part’s picture below to choose which has more.' },
    { from: 9, to: 9, text: 'The hoop has two pictures: fit the first, but not the crossed-out second picture. Drag matching critters into the one hoop; put every other critter on the leaf mat.' },
    { from: 8, to: 8, text: 'Sort all six critters by the pictured sign: into the hoop if they fit, onto the leaf mat if they do not. The sign turns over and the same six hop out; sort them again by the new rule.' },
    { from: 7, to: 7, text: 'The critters are already sorted by the two signs. Drag the one newcomer to the left, right, middle for both rules, or leaf mat for neither.' },
    { from: 6, to: 6, text: 'One critter is already in the hoop. Drag the other critter that fits the sign into it.' },
    { to: 1, text: 'One critter is already in the hoop. Drag every other critter that fits the sign into it.' },
    { from: 2, to: 2, text: 'One critter is already in each hoop. Drag each other critter into the hoop where it fits; critters that fit neither go on the leaf mat.' },
    { from: 3, to: 3, text: 'One critter is already in the middle, where the hoops overlap: it fits both rules. Drag the others to where they fit; critters that fit neither rule go on the leaf mat.' },
    { from: 4, to: 4, text: 'Look at the sorted pictures, work out the rule, then tap the picture that shows it.' },
    { from: 5, to: 5, text: 'The red line means not. One critter is already in the hoop. Drag every other critter that is not like the picture into it. Critters that fit the picture go on the leaf mat.' },
  ],
  finish: [
    { from: 11, to: 11, text: 'Choose the part with more critters in each of two diagrams for one sticker. You may count as often as you like, or choose when ready.' },
    { from: 12, to: 12, text: 'The round ends when every little plant that matches the sign is in the hoop; the others can stay on the grass.' },
    { from: 13, to: 13, text: 'The round ends when every little plant is in a hoop, the middle or on the leaf mat.' },
    { from: 9, to: 9, text: 'Sort every critter into the hoop or onto the leaf mat in both diagrams for one sticker.' },
    { from: 8, to: 8, text: 'Finish both sorts of the same six critters for one sticker.' },
    { from: 7, to: 7, text: 'Place the newcomer correctly in each of three diagrams to finish.' },
    { to: 1, text: 'The round ends when every critter that fits is in the hoop; the others can stay on the grass.' },
    { from: 2, to: 3, text: 'The round ends when every critter is in a hoop or on the leaf mat.' },
    { from: 4, to: 4, text: 'The round ends when you pick the rule that matches the sorted critters.' },
    { from: 5, to: 5, text: 'The round ends when every critter is in the not hoop or on the leaf mat.' },
    { from: 6, to: 6, text: 'The round ends when the other critter that fits is in the hoop; the last one can stay on the grass.' },
  ],
  note: [
    { from: 11, to: 11, text: 'Counting taps are free. Tapping a marked critter replays its number without adding it again. Wrong drops or comparison choices get a spoken explanation; two wrong comparisons show totals and glow the answer.' },
    { to: 3, text: 'Putting a critter back on bare grass is a free try. Two wrong drops glow a useful place and critter.' },
    { from: 4, to: 4, text: 'Two wrong guesses make the correct rule picture larger.' },
    { from: 5, to: 9, text: 'Putting a critter back on bare grass is a free try. Two wrong drops glow a useful place and critter.' },
    { from: 12, to: 13, text: 'All the little plants grew from the big plant\u2019s seeds. Young plants look like their parent plant in some ways and not others. No answer here says why. Putting a plant back on bare grass is a free try; two wrong drops glow a useful place and plant.' },
  ],
};
