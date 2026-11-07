import type { GameHowTo } from '../types';

/** The grown-ups' how-to card for this game; src/content/howto.ts gathers every card into HOW_TO. */
export const HOW_TO: GameHowTo = {
  goal: 'Roll a toy car down a ramp and see how far it goes across the floor.',
  steps: [
    { to: 1, text: 'Tap the ramp to make it taller or shorter, then press go and watch how far the car rolls. The floor stays wood.' },
    { from: 2, to: 2, text: 'Tap the ramp to make it taller or shorter, then press go. Stop the car on the star; the floor stays wood.' },
    { from: 3, to: 3, text: 'Tap the ramp to change its height and the floor for carpet, wood or ice, then press go. Stop the car on the star.' },
    { from: 4, to: 4, text: 'The sign shows what to test: floors or ramps. Change only that on one lane, keep everything else the same, then press go to race both cars.' },
    { from: 5, to: 5, text: 'Press go, and where the car stops goes on a card. Tap the ramp to change it, tap the floor to guess where the car will stop if you like, then press go again. Tap the card whose car went farther.' },
    { from: 6, to: 6, text: 'The sign shows what to test: floors or ramps. The blue lane stays put; change the orange lane until only that thing is different, press go, then tap the card whose car went farther.' },
    { from: 7, to: 7, text: 'Two cards show cars that already rolled. Tap the picture that says what was different: only the floors, only the ramps, or both. Press go to check. When both were different, change the orange lane so only one thing is different, press go, and say again what the cards show.' },
  ],
  finish: [
    { to: 1, text: 'The round ends after four rolls.' },
    { from: 2, to: 3, text: 'The round ends after the car stops on three stars.' },
    { from: 4, to: 4, text: 'The round ends after three fair tests.' },
    { from: 5, to: 5, text: 'The round ends after two pairs of cards.' },
    { from: 6, to: 6, text: 'The round ends after two fair tests, one of floors and one of ramps.' },
    { from: 7, to: 7, text: 'The round ends after two puzzles: one where only one thing changed, and one where both did.' },
  ],
  note: [
    { to: 1, text: 'Every roll is free: there is no star and nothing to get wrong.' },
    { from: 2, to: 3, text: 'A roll that stops short of the star or past it is a miss, and the pet says which way to change. After two on one star, the setup to try glows.' },
    { from: 4, to: 4, text: 'Two lanes that are just the same get a reminder, not a miss. Pressing go when anything besides the thing on the sign differs is a miss; after two on one test, the part of the orange lane to change glows.' },
    { from: 5, to: 5, text: 'Guesses are free, and rolling the same ramp twice only gets a reminder. Tapping the card that went less far is a miss; after two on one pair, the farther card glows.' },
    { from: 6, to: 6, text: 'Two lanes that are just the same get a reminder, not a miss. Pressing go when anything besides the thing on the sign is different is a miss, and so is tapping the card that went less far; after two of either on one test, what to change or tap glows.' },
    { from: 7, to: 7, text: 'Choosing a picture, replaying a card and changing the orange lane are free. Pressing go on the wrong picture, or on lanes that still differ in both, is a miss; after two of either, what to tap or change glows.' },
  ],
};
