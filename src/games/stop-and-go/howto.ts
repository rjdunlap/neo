import type { GameHowTo } from '../types';

/** The grown-ups' how-to card for this game; src/content/howto.ts gathers every card into HOW_TO. */
export const HOW_TO: GameHowTo = {
  goal: 'Go on green, stop on red.',
  steps: [
    { from: 9, to: 9, text: 'Tap the big green lamp to make the car go round, and the big red lamp to make it stop. Tapping the car makes it toot.' },
    { from: 1, to: 1, text: 'Tap the traffic light to change it: red stops the car, green makes it go. Tapping the car counts too: it toots, and on green it drives round.' },
    { from: 2, to: 2, text: 'The light changes by itself: tap a car only when the light is green.' },
    { from: 3, to: 3, text: 'Tap the feet to step toward the flag on green, and freeze on red.' },
    { from: 4, to: 4, text: 'At the crossing, tap a light to let one road go at a time.' },
    { from: 5, to: 5, text: 'The car lane and the bike lane each have their own light: tap the front car or bike only when its own light is green.' },
    { from: 6, to: 6, text: 'Cars keep arriving on both roads, each with a cloud showing its way: tap a light to let one road go at a time.' },
  ],
  finish: [
    { from: 9, to: 9, text: 'The round ends after eight touches.' },
    { to: 8, text: 'The round ends when the cars or the pet have reached the end.' },
  ],
  note: [
    { from: 1, to: 1, text: 'Every touch counts toward the round; there is nothing to get wrong.' },
    { from: 9, to: 9, text: 'Every touch of a lamp or the car counts toward the round, so nothing can go wrong; the round ends after eight touches.' },
    { from: 2, to: 2, text: 'Tapping the front car on red is a miss; yellow gets a reminder, and a car further back just toots. After two misses the front car glows when the light is green.' },
    { from: 3, to: 3, text: 'Tapping the feet on red is a miss; yellow gets a reminder. After two misses the feet glow when the light is green, until the next good step.' },
    { from: 4, to: 4, text: 'Turning both roads green is the one miss: everyone waits. After two, the green light to turn red glows. If both roads stay red for a while, the busier road\'s light glows (not a miss).' },
    { from: 5, to: 5, text: 'Tapping the front vehicle when its own light is red is a miss, and yellow gets a reminder; the other lane\'s light does not matter. After two misses the front vehicle of a green lane glows.' },
    { from: 6, to: 6, text: 'Turning both roads green is the one miss: everyone waits. After two, the green light to turn red glows. If both roads stay red for a while, the busier road\'s light glows (not a miss).' },
  ],
};
