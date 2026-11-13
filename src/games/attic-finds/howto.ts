import type { GameHowTo } from '../types';

/** The grown-ups' how-to card for this game; src/content/howto.ts gathers every card into HOW_TO. */
export const HOW_TO: GameHowTo = {
  goal: 'Turn, crank and try attic things: watch what they do, and find what makes them work.',
  steps: [
    { from: 1, to: 2, text: 'Tap the parts to see them up close. Tap Turn to see the back.' },
    { from: 1, to: 1, text: 'Tap a picture to try it, or tap the crank. Watch what really happens.' },
    { from: 1, to: 1, text: 'Then tap the picture of what it did.' },
    {
      from: 2,
      to: 2,
      text: "Tap each round chip to look at its part, then drag the part that proves the crank moves it into the card's slot and tap Check.",
    },
    {
      from: 3,
      to: 3,
      text: 'Tap anywhere, or the big handle. The bird or fish goes up; tap again and it comes down.',
    },
    {
      from: 4,
      to: 4,
      text: 'Tap the big handle: the bird goes up, then down. Tap the little door to open it and see the rod inside.',
    },
    { from: 1, to: 4, text: 'Crank it again any time to watch.' },
    { from: 5, to: 6, text: 'Tap a thing on the rug to try it on the job and watch what happens.' },
    { from: 5, to: 6, text: 'Drag every thing that can do the job into the cart, then tap Check.' },
    { from: 7, to: 9, text: 'Tap a paper to hear what it shows.' },
    { from: 7, to: 7, text: 'Drag the paper that shows each card into its slot, then tap Check.' },
    { from: 8, to: 8, text: "Stamp each card: the papers show it, or can't tell. Then tap Check." },
    {
      from: 9,
      to: 9,
      text: 'Tap each line of the museum card and choose one the papers really show; then choose a paper that could answer the question, and tap Check.',
    },
  ],
  finish: [
    { from: 1, to: 2, text: 'Both things sit on the shelf.' },
    { from: 3, to: 3, text: 'After three turns of the handle the toy goes onto the shelf by itself.' },
    {
      from: 4,
      to: 4,
      text: 'After three turns of the handle a shelf picture appears; she taps it when she is ready, and the toy goes onto the shelf.',
    },
    { from: 5, to: 5, text: 'Both jobs are done; their loads sit on the shelf.' },
    { from: 6, to: 6, text: 'Leaves, acorns and water are carried; all three sit on the shelf.' },
    { from: 7, to: 8, text: 'Both boards are done; they sit on the shelf.' },
    { from: 9, to: 9, text: 'The museum card is true, and the bird box lights up in its case.' },
  ],
  note: [
    {
      from: 1,
      to: 1,
      text: 'Looking, turning and trying are never counted against her, and a guess before the crank turns is never a miss. After two wrong picks the right picture glows, which counts as a hint. Everything in the attic is made up for the island; nothing here is a real old thing.',
    },
    {
      from: 2,
      to: 2,
      text: 'Looking, turning and swapping parts are never counted against her. A Check with a part that does not move the bird or fish counts as a miss; after two the right part glows, which counts as a hint. Everything in the attic is made up for the island; nothing here is a real old thing.',
    },
    {
      from: 3,
      to: 3,
      text: 'Every touch is play: nothing is ever counted as a miss or a hint, and the third turn ends the round, so patting anywhere is enough. Everything in the attic is made up for the island; nothing here is a real old thing.',
    },
    {
      from: 4,
      to: 4,
      text: 'Every touch is play: nothing is ever counted as a miss or a hint, and the round ends only when she taps the shelf. Everything in the attic is made up for the island; nothing here is a real old thing.',
    },
    {
      from: 5,
      to: 6,
      text: 'Trying things is never counted against her. A Check with a thing that cannot do the job counts as a miss; a Check that leaves out a thing that could is not, and the pet asks for one more. After two misses on a job the right things glow, which counts as a hint. Everything in the attic is made up for the island; nothing here is a real old thing.',
    },
    {
      from: 7,
      to: 8,
      text: "Reading the papers, moving them and changing stamps are never counted against her. A Check with a paper that does not show the card, or a wrong stamp, counts as one miss; after two on a board the answer glows, which counts as a hint. Can't tell is the right answer when no paper shows it, including 'Seaside House had no bird box': no record is not proof. The shop's poster is advertising, so it shows what the shop said, not what children felt. The houses, papers and bird box are made up for the island.",
    },
    {
      from: 9,
      to: 9,
      text: "Reading the papers and changing captions or the new paper are never counted against her. A Check with a caption the papers do not show, or a paper that could not answer, counts as one miss; after two the answer glows, which counts as a hint. The shop's poster shows what the shop said, not what children felt. The houses and papers are made up for the island.",
    },
  ],
};
