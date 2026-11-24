import type { GameHowTo } from '../types';

/** The grown-ups' how-to card for this game; src/content/howto.ts gathers every card into HOW_TO. */
export const HOW_TO: GameHowTo = {
  goal: 'Pay for things with shell coins.',
  steps: [
    { to: 3, text: 'Tap coins onto the counter to add up the price, then ring the bell.' },
    {
      from: 4,
      to: 4,
      text: 'Add the two prices, tap coins onto the counter to pay for both, then ring the bell.',
    },
    {
      from: 5,
      to: 5,
      text: 'Pay the price and ring the bell, then buy another one at the same price and pay a different way with other coins, ringing the bell again.',
    },
    {
      from: 6,
      to: 6,
      text: 'The customer pays 10: tap coins onto the counter to give the change, then ring the bell. Each coin says its value, then the shopkeeper counts up from the price, and the strip under the tag fills to 10.',
    },
    {
      from: 7,
      to: 7,
      text: 'Tap coins onto the counter to pay the price with as few shells as you can, then ring the bell; tap a coin on the mat to put it back and swap it.',
    },
    {
      from: 8,
      to: 8,
      text: 'A purse of coins lies on the counter: count what the shells are worth and tap the number card that says how much is in the purse. Tap a coin to hear its worth.',
    },
    {
      from: 9,
      to: 9,
      text: 'Prices go from 11 to 20 and a ten-shell coin joins the purse: tap coins onto the counter to pay the price, then ring the bell. The tag shows the first ten as one bar and the rest as dots, like a ten-shell coin and some ones.',
    },
    {
      from: 10,
      to: 10,
      text: 'Add the two prices, tap coins onto the counter to pay for both, then ring the bell. A ten-shell coin and smaller shells can make the total.',
    },
    {
      from: 11,
      to: 11,
      text: 'The customer pays 20 for a price from 11 to 19: tap coins onto the counter to give the change, then ring the bell. Each coin says its value, then the shopkeeper counts up from the price, and the two strips under the tag fill to 20.',
    },
    {
      from: 12,
      to: 12,
      text: 'Tap what your purse can buy. Then pick two things that use the whole purse and ring the bell.',
    },
  ],
  note: [
    { text: 'The stall sells fruit, flowers or balloons; the shell coins work the same at each stall.' },
    {
      to: 2,
      text: 'Each coin shows its worth as dots, like the dots on the price tag. Tap a coin on the mat to put it back. Two misses show a payment; help counts once per order.',
    },
    {
      from: 3,
      to: 3,
      text: 'Each coin shows its worth as dots, like the dots on the price tag. Tap a coin on the mat to put it back. Two misses bring a tip (biggest coin first) and show a payment; help counts once per order.',
    },
    {
      from: 4,
      to: 4,
      text: 'Tap a coin on the mat to put it back. Two misses show a payment; help counts once per order.',
    },
    {
      from: 5,
      to: 5,
      text: 'Tap a coin on the mat to put it back. Two misses bring a tip (biggest coin first, or swap coins for the second way) and show a payment; help counts once per order, including when you pay two different ways.',
    },
    {
      from: 6,
      to: 6,
      text: 'Tap a coin on the mat to put it back. Two misses show a payment; help counts once per order.',
    },
    {
      from: 7,
      to: 7,
      text: 'Tap a coin on the mat to put it back. Two misses bring a tip (biggest coin first) and show a payment; help counts once per order.',
    },
    {
      from: 8,
      to: 8,
      text: 'The total is not said: adding it up is the puzzle. A wrong card says whether it is the number of coins or one off; two misses count the coins aloud, biggest first, and light the right card; help counts once per purse.',
    },
    {
      from: 9,
      to: 9,
      text: 'Any coins that make the price will buy it. The first tap of the ten-shell coin names it. Tap a coin on the mat to put it back. Two misses bring a tip (biggest coin first) and show a payment that starts with the ten; help counts once per order.',
    },
    {
      from: 10,
      to: 10,
      text: 'Tap a coin on the mat to put it back. Paying one price gets a reminder to add both. Two misses show a payment, with one hint counted per order.',
    },
    {
      from: 11,
      to: 11,
      text: 'Tap a coin on the mat to put it back. Giving back the price itself gets a reminder that they paid 20. Two misses show the change smallest coin first and count up from the price (from 13: 15, 20); any coins that make the change are right, not only the fewest. Help counts once per order.',
    },
    {
      from: 12,
      to: 12,
      text: 'Nothing is spent when she chooses: the question is only whether the purse covers the price. The first too-dear tap is a miss; a second lights something she can buy. Tap a picked thing to put it back. A wrong pair at the bell is a miss and stays picked to swap; two misses light the pair. Help counts once per order.',
    },
  ],
  finish: [
    { to: 5, text: 'The round ends when the right amount has been paid.' },
    { from: 6, to: 6, text: 'The round ends when the right change has been given.' },
    { from: 7, to: 7, text: 'The round ends when the price has been paid with the fewest shells.' },
    { from: 8, to: 8, text: 'The round ends when three purses have been counted.' },
    { from: 9, to: 9, text: 'The round ends when four prices have been paid.' },
    { from: 10, to: 10, text: 'The round ends when three pairs of goods have been paid for.' },
    { from: 11, to: 11, text: 'The round ends when the right change has been given three times.' },
    { from: 12, to: 12, text: 'The round ends after two choices and two purses spent on two things.' },
  ],
};
