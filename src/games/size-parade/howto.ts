import type { GameHowTo } from '../types';

/** The grown-ups' how-to card for this game; src/content/howto.ts gathers every card into HOW_TO. */
export const HOW_TO: GameHowTo = {
  goal: 'Compare sizes of friends.',
  steps: [
    {
      from: 16,
      to: 16,
      text: 'Tap the one friend: each tap makes it a size bigger, then smaller again, and the pet says the size word.',
    },
    { from: 9, to: 9, text: 'Tap the big one, then the little one, then the big one again, as asked.' },
    { to: 2, text: 'Tap the friend who is bigger or smaller, as asked.' },
    { from: 3, to: 4, text: 'Tap the friend who is biggest or smallest, as asked.' },
    {
      from: 5,
      to: 8,
      text: 'Drag the friend asked for to the glowing spot, then the next one in size, until the line is full.',
    },
    {
      from: 10,
      to: 10,
      text: 'Tap the friend who is middle-sized, bigger than one and smaller than the other; the picture shows which circle is asked for. Some rows ask for the biggest or the smallest.',
    },
    { from: 17, to: 17, text: 'Drag the smaller friend to the glowing spot, then the bigger one.' },
    {
      from: 11,
      to: 11,
      text: 'A bed, then a chair, a bowl and a door stands above three friends, sized for just one of them: tap the friend who fits it. The tapped friend tries it: too big hangs over the end, too little disappears into it.',
    },
    {
      from: 12,
      to: 12,
      text: 'Four friends stand in a line in size order, smallest or biggest first; drag the fifth friend into its place. The line opens a gap where the friend is carried, and the drop goes to the nearest gap.',
    },
    {
      from: 13,
      to: 13,
      text: 'Four friends stand behind a fence with only their boots showing. Tap one friend, then another: if the left one is the bigger they swap places, otherwise they stay. When the line is littlest first, tap the gate. Then the same with five.',
    },
    {
      from: 14,
      to: 14,
      text: 'One friend stands on a bank, one on a stump across a stream. Pull the ribbon up beside the bank friend until it snaps to its head and a red mark appears, carry it to the stump friend, then tap the taller friend.',
    },
    {
      from: 15,
      to: 15,
      text: 'Five friends of one size in five shades of one colour: drag them to the glowing spots darkest first, then the same five lightest first. The strip of colour at the top shows which way.',
    },
    'A tap on the sky or the ground makes the friends hop and repeats the question; it never counts as a miss.',
  ],
  finish: [
    { from: 16, to: 16, text: 'The round ends after three rounds of growing and shrinking.' },
    { from: 9, to: 9, text: 'The round ends after three rows, one right friend chosen from each.' },
    { to: 4, text: 'The round ends after four rows, one right friend chosen from each.' },
    { from: 5, to: 8, text: 'The round ends when the friends are lined up correctly.' },
    { from: 10, to: 10, text: 'The round ends after four rows, one right friend chosen from each.' },
    { from: 17, to: 17, text: 'The round ends when the two friends are lined up correctly.' },
    { from: 11, to: 11, text: 'The round ends after four props, one fitting friend found for each.' },
    { from: 12, to: 12, text: 'The round ends after four lines, the fifth friend put in its place in each.' },
    { from: 13, to: 13, text: 'The round ends when the gate opens on both lines, four friends then five.' },
    { from: 14, to: 14, text: 'The round ends after four pairs, the taller friend found in each.' },
    { from: 15, to: 15, text: 'The round ends when both lines are done, darkest first and lightest first.' },
  ],
  note: [
    {
      from: 16,
      to: 16,
      text: 'Nothing is wrong here: every tap answers, and a tap beside the friend makes it hop.',
    },
    {
      from: 9,
      to: 9,
      text: 'The other friend wiggles and says its own size word. On the lap the first such touch in a row is free, and the second makes the right friend glow (a hint); from toddler on, each counts as a miss and the second glows.',
    },
    { to: 4, text: 'A wrong friend counts as a miss; after two in one row the right friend glows.' },
    {
      from: 5,
      to: 8,
      text: 'A wrong friend on the glowing spot counts as a miss, and after two the right friend glows. A friend put on another spot is not a miss: the line fills from the glowing spot.',
    },
    {
      from: 10,
      to: 10,
      text: 'A wrong friend counts as a miss and the pet says why the middle one is the middle; after two in one row the right friend glows.',
    },
    {
      from: 17,
      to: 17,
      text: 'A wrong friend on the glowing spot counts as a miss, and after two the right friend glows. A friend put on the other spot is not a miss: the line fills from the glowing spot.',
    },
    {
      from: 11,
      to: 11,
      text: 'A friend who does not fit counts as a miss and the pet says too big or too little; after two in one row the fitting friend glows. The fitting friend is never the same size twice running.',
    },
    {
      from: 12,
      to: 12,
      text: 'A wrong gap counts as a miss: the friend goes back and the pet says why, of the friend beside the gap; after two in one line the right gap glows. A drop away from the line just goes back, and touching a friend in the line makes it hop; neither is a miss.',
    },
    {
      from: 13,
      to: 13,
      text: 'Testing a pair is never a miss, and nothing is shown but whether the two swap. Tapping the gate while the line is mixed up counts as a miss; after two shut gates in one line two mixed-up neighbours glow.',
    },
    {
      from: 14,
      to: 14,
      text: 'A tap before the ribbon reaches the stump is a guess, never a miss. After measuring, tapping the shorter friend is a miss; after two in one pair the taller friend glows. The ribbon snaps to a head when close. In two of the four pairs the shorter friend stands up on more ground, so its head looks taller.',
    },
    {
      from: 15,
      to: 15,
      text: 'A wrong friend on the glowing spot counts as a miss and the pet says it is lighter (or darker) than one still waiting; after two the right friend glows. A friend put on another spot is not a miss.',
    },
  ],
};
