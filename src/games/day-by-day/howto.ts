import type { GameHowTo } from '../types';

/** The grown-ups' how-to card for this game; src/content/howto.ts gathers every card into HOW_TO. */
export const HOW_TO: GameHowTo = {
  goal: 'Match sky pictures, then make and read pretend weather records.',
  steps: [
    {
      to: 5,
      text: 'Tap day cards to hear their names, then tap the arrow to place the selected day in the next slot.',
    },
    { to: 5, text: 'Look at the sky picture, then tap the matching weather button to record that day.' },
    {
      from: 9,
      to: 9,
      text: 'Look at each of three sky pictures, then tap the matching sunny, cloudy or rainy button to record it.',
    },
    {
      from: 2,
      to: 3,
      text: 'After Sunday, choose tomorrow and yesterday for the days spoken. Tap the arrow to confirm. The week repeats from Sunday to Monday.',
    },
    {
      from: 4,
      to: 5,
      text: 'After the week, a day is named. Choose the day just after it for tomorrow and the day just before it for yesterday. Tap the arrow to confirm.',
    },
    {
      from: 6,
      to: 6,
      text: 'Two pretend weeks are already recorded. Tap the large Week A and Week B tabs to inspect all seven days on either page.',
    },
    {
      from: 6,
      to: 6,
      text: 'Tap any record to hear it and mark or unmark it. Tap the weather picture to replay the question.',
    },
    {
      from: 6,
      to: 6,
      text: 'Compare rainy totals, then whether sunny totals are equal. Tap a summary to hear and select it, then tap the arrow to check.',
    },
    {
      from: 10,
      to: 10,
      text: 'The pretend week is already recorded. Count the outlined suns. Tap any record to hear it and mark or unmark it, then choose the total.',
    },
    {
      from: 3,
      to: 3,
      text: 'Count the sunny records and choose the total. Tap records to mark or unmark them as you count.',
    },
    {
      from: 7,
      to: 7,
      text: 'Twelve months sit in a ring. A month is named; tap the month just after or just before it to hear it, then tap the arrow.',
    },
    {
      from: 5,
      to: 5,
      text: 'Count the named, pictured weather. Tap records to mark or unmark them. Choose zero when none match.',
    },
  ],
  finish: [
    {
      from: 9,
      to: 9,
      text: 'The round ends after the three sky pictures are matched. Two wrong taps glow the matching button. There are no days or weeks to name.',
    },
    { to: 1, text: 'The round ends after all seven days and their weather are recorded.' },
    { from: 2, to: 2, text: 'Record the week and answer two yesterday/tomorrow questions to finish.' },
    {
      from: 3,
      to: 3,
      text: 'Record the week, answer two day questions, and count the sunny days to finish.',
    },
    {
      from: 6,
      to: 6,
      text: 'Confirm the true summary for each of two questions to finish. Browsing, listening and optional marks are free. Two wrong confirmations highlight the matching records on both pages and the true summary.',
    },
    {
      from: 10,
      to: 10,
      text: 'Choose the correct sunny-day total once to finish. The outlines are free starting support; marks need not match the suns.',
    },
    {
      from: 7,
      to: 7,
      text: 'Answer three month questions to finish: one across the turn of the year, then one before and one after. Two wrong answers glow the named month and the right one.',
    },
    {
      from: 4,
      to: 4,
      text: 'Record the week and answer two questions, one tomorrow and one yesterday, from different days to finish.',
    },
    {
      from: 5,
      to: 5,
      text: 'Record the week, answer two day questions, then count the requested weather. Marks are optional; two wrong totals highlight records and the answer.',
    },
  ],
  note: 'Card naming, replaying records, and counting marks are free support. Two wrong answers glow the right choice. These pretend records are independent of the real date.',
};
