import type { GameHowTo } from '../types';

/** The grown-ups' how-to card for this game; src/content/howto.ts gathers every card into HOW_TO. */
export const HOW_TO: GameHowTo = {
  goal: 'Launch the pet and see where it lands.',
  steps: [
    {
      from: 13,
      to: 13,
      text: 'Touch anywhere: the pet bounces up and lands on the grass, and a flower pops up where it landed. The flowers stay.',
    },
    {
      from: 12,
      to: 12,
      text: 'Watch the home flight leave a numbered flag. With the same shown pull on the planet, tap before or past the flag, then watch the result.',
    },
    { to: 1, text: 'Tap the pet and watch the pet bounce.' },
    { from: 2, to: 5, text: 'Pull the pet back and let go. A bigger pull goes farther.' },
    { from: 3, to: 3, text: 'Aim for the cloud with the star.' },
    { from: 4, to: 4, text: 'Aim for the numbered cloud that was asked for.' },
    {
      from: 5,
      to: 5,
      text: 'Pull more or less than the red flag, as asked. After a miss, the red ring marks the previous pull.',
    },
    {
      from: 6,
      to: 6,
      text: 'Look at the shown pull, tap a cloud, then watch. Numbered flags mark the flights you watched.',
    },
    {
      from: 9,
      to: 9,
      text: 'Watch a short shown pull and a long one each leave a numbered flag. Then a pull between them is shown: tap the cloud it will reach, then watch.',
    },
    {
      from: 7,
      to: 7,
      text: 'A friend waits on the grass. Pull the pet back and let go to land beside the friend. The dotted path and the puff show the last flight, so pull a little more or less.',
    },
    {
      from: 8,
      to: 8,
      text: 'Two big clouds, a near one and a far one. Pull the pet back a little for the near cloud or a lot for the far one, whichever has the star.',
    },
  ],
  finish: [
    { from: 13, to: 13, text: 'The round ends after five landings: five flowers in the meadow.' },
    { from: 12, to: 12, text: 'The round ends after three home-and-planet pairs.' },
    { to: 2, text: 'The round ends after its launches.' },
    { from: 3, to: 5, text: 'The round ends when the pet lands where it was asked to.' },
    { from: 6, to: 6, text: 'The round ends after each shown pull has flown.' },
    { from: 7, to: 7, text: 'The round ends when every friend has had a snack.' },
    { from: 9, to: 9, text: 'The round ends after three sets of short, long and between pulls.' },
    {
      from: 8,
      to: 8,
      text: 'The round ends after five landings on the star cloud; near and far take turns.',
    },
  ],
  note: [
    {
      from: 13,
      to: 13,
      text: 'Nothing here is ever wrong: a touch while the pet is in the air only rings and sparkles. There are no clouds and nothing is counted; this is for touching and watching, not a sign of what she knows.',
    },
    {
      from: 12,
      to: 12,
      text: 'Toy model: light planets pull half as much as the island, heavy ones twice as much. These are not real planet ratios. Predictions never count as misses; Show a hint rings the correct side and counts as requested help.',
    },
    {
      from: 2,
      to: 7,
      text: 'After two clearly different pulls, the bigger-pull observation is added to her discovery journal in the treehouse.',
    },
    {
      from: 2,
      to: 5,
      text: 'A short or wrong-way pull gets a spoken nudge; after two, an arrow shows back and down. Neither counts as a miss or hint.',
    },
    { from: 3, to: 5, text: 'Landing short or long is just a try again.' },
    { from: 6, to: 6, text: 'Predictions are for noticing what happens; a different guess is not a miss.' },
    {
      from: 9,
      to: 9,
      text: 'Predictions are not misses; a different guess hears why the pull between the two landed between the flags. Faint rings at the spring mark the two watched pulls.',
    },
    {
      from: 7,
      to: 7,
      text: 'Landing a little short or long is just a try again; after two tries a ring shows how far back to pull.',
    },
    {
      from: 8,
      to: 8,
      text: 'Any landing on the star cloud counts. A landing short or long is a spoken try again; after two, the flight path and a ring show how far back to pull. A short or wrong-way pull gets a nudge that is not a miss. After two clearly different pulls, the bigger-pull observation is added to her discovery journal.',
    },
  ],
};
