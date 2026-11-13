import type { GameHowTo } from '../types';

/** The grown-ups' how-to card for this game; src/content/howto.ts gathers every card into HOW_TO. */
export const HOW_TO: GameHowTo = {
  goal: 'Share food fairly with friends and make recipes.',
  steps: [
    {
      from: 10,
      to: 10,
      text: 'Tap a piece and it hops to the friend who has less. Keep tapping until every piece is on a plate.',
    },
    {
      to: 4,
      text: 'Tap a cutting picture to cut the food into equal pieces. Touching the food says what to do again.',
    },
    { to: 4, text: 'Move pieces between plates until everyone has the same.' },
    {
      from: 5,
      to: 6,
      text: 'Look at the recipe card and double it: put in two fruits for each fruit on the card.',
    },
    {
      from: 7,
      to: 7,
      text: 'Listen to the amount your friend asks for (tap the picture bubble to hear it again), cut equal pieces, then put that fraction on their plate.',
    },
    {
      from: 8,
      to: 8,
      text: 'Look at the recipe card and halve it: put in one fruit for every two fruits on the card.',
    },
    { from: 9, to: 9, text: 'Cut the pizza into three equal slices, then give one slice to each friend.' },
    {
      from: 11,
      to: 11,
      text: 'Choose the cutting picture that makes two pieces the same size, then give one piece to each friend.',
    },
    {
      from: 12,
      to: 12,
      text: 'Cut the two pizzas so three friends can each have the same number of slices, then share them out.',
    },
    {
      from: 13,
      to: 13,
      text: "Each friend's bubble shows how much they want (tap it to hear). Cut the sandwich into equal pieces and give each friend that much, then tap the green arrow.",
    },
    { from: 13, to: 13, text: "Then the pet asks who has more: tap that friend's plate." },
    {
      from: 14,
      to: 14,
      text: 'Cut one sandwich down and the other across (the two cutting pictures are on the right), then give each friend a tall half and a wide half.',
    },
    { from: 11, to: 12, text: 'Tap the green arrow to serve. The friends eat what was shared fairly.' },
    { from: 14, to: 14, text: 'Tap the green arrow to serve. The friends eat what was shared fairly.' },
    {
      from: 15,
      to: 15,
      text: 'The recipe needs one cup. Tap the half-cup or quarter-cup scoop (each strip shows its share of a cup) to pour it into the jug; each scoop says its name.',
    },
    {
      from: 15,
      to: 15,
      text: 'Fill the jug exactly to the blue cup line: two halves, four quarters, or a half and two quarters all work. Too much? The back arrow takes the last scoop out. Then tap the green arrow.',
    },
    { to: 9, text: 'Tap the green arrow to serve. The friends eat what was shared fairly.' },
  ],
  finish: 'The round ends when the food is served fairly or the recipe is made.',
  note: [
    {
      from: 10,
      to: 10,
      text: 'No touch is wrong here, and the friends eat when the plates are equal. For a baby, a tap anywhere deals the piece and the pieces come one at a time; for a toddler, a tap away from a piece just wiggles one.',
    },
    {
      to: 4,
      text: 'If a friend has less, or there are too few pieces, the kitchen says so; the round arrow puts the food back to cut again, and nothing is lost.',
    },
    { from: 5, to: 6, text: 'The back arrow takes the last fruit out; nothing is lost.' },
    {
      from: 7,
      to: 7,
      text: 'Two quarters count as one half, and the round arrow lets you cut again; nothing is lost. A good serve is counted aloud.',
    },
    { from: 8, to: 8, text: 'The back arrow takes the last fruit out; nothing is lost.' },
    { from: 9, to: 9, text: 'The round arrow puts the pizza back together to cut again; nothing is lost.' },
    {
      from: 11,
      to: 11,
      text: 'Choosing the uneven cut is fine to explore. If you serve unequal pieces, they are laid one over the other to show which is bigger, then come back.',
    },
    {
      from: 12,
      to: 12,
      text: 'A cut that leaves a piece in the tray gets a hint; the round arrow puts the pizzas back together to cut again.',
    },
    {
      from: 13,
      to: 13,
      text: 'A piece may stay in the tray. A plate that is not what its friend asked for is named aloud; tapping the plate with less lays the two servings one over the other to show which is more.',
    },
    {
      from: 15,
      to: 15,
      text: 'Pouring and taking scoops out is free; only serving too little or too much counts as a miss. After two, the useful scoop or the back arrow glows.',
    },
  ],
};
