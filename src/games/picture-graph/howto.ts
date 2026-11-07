import type { GameHowTo } from '../types';

/** The grown-ups' how-to card for this game; src/content/howto.ts gathers every card into HOW_TO. */
export const HOW_TO: GameHowTo = {
  goal: 'Count each kind, show the counts in a graph, and read it.',
  steps: [
    { to: 3, text: 'Count each kind of critter, and tap above its bar to add a block for each one.' },
    { to: 3, text: 'Tap the green check when the bars are built.' },
    { from: 2, to: 2, text: 'Then tap the bar with the most (or the fewest).' },
    { from: 3, to: 3, text: 'Then answer how many more of one kind there are than another.' },
    { from: 4, to: 4, text: 'Read the graph, then answer: how many in all, or which two bars are the same (tap one bar and it lifts; tap it again to put it back, then tap its match).' },
    { from: 5, to: 5, text: 'The key says each block is two critters. Count the pairs in the meadow, and tap above a bar to add a block for each pair.' },
    { from: 5, to: 5, text: 'Tap the green check when the bars are built.' },
    { from: 5, to: 5, text: 'Then answer how many more critters of one kind there are than another: each block counts for two.' },
    { from: 6, to: 6, text: 'Read the graph, remembering that each block is two critters, then answer: how many critters in all, and how many more of one kind than another.' },
    { from: 7, to: 7, text: 'Count each kind in the meadow and add tally marks above its face. Four lines and one across make five. Tap the green check, then build the bar graph from the critters and answer how many more.' },
    { from: 8, to: 8, text: 'Tap each shell, stone, stick or feather on the sand; it hops into its own row of the tray.' },
    { from: 8, to: 8, text: 'Then tap the row with the most. With three rows, then answer how many more of one kind there are than another.' },
    { from: 9, to: 9, text: 'The key says each block is five. Each card shows a kind\'s tally marks in groups of five: tap above its bar to add one block for each group, then tap the green check.' },
    { from: 9, to: 9, text: 'Then answer how many more critters of one kind there are than another: each block counts for five.' },
    { from: 10, to: 10, text: 'A tally card shows one meadow\'s critters. Of the three graphs below it, two show those counts: one plain, one whose key says each block is two. The third is as tall as the keyed one but has no key of two.' },
    { from: 10, to: 10, text: 'Tap a graph and it lifts (tap it again to put it back), then tap its match.' },
    { from: 11, text: 'A finished graph, and a friend says something about the critters: "there are more cats than dogs", or "the cats came first". The card above the graph shows who the claim is about.' },
    { from: 11, text: 'Stamp it: the green check if the graph says yes, the red cross if it says no, the purple graph if the graph can\'t say (it shows how many, not who came first, is hungriest or sleepiest).' },
  ],
  finish: 'The round ends when the graph questions are answered, the matching graphs are found, or every claim is stamped.',
};
