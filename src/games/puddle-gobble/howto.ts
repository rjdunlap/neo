import type { GameHowTo } from '../types';

/** The grown-ups' how-to card for this game; src/content/howto.ts gathers every card into HOW_TO. */
export const HOW_TO: GameHowTo = {
  goal: 'Lead the puddle to soak up the beach.',
  steps: [
    'Drag or tap to lead the puddle.',
    { from: 1, to: 5, text: 'It soaks up anything smaller than itself.' },
    { from: 2, to: 3, text: 'After two, it grows bigger.' },
    { from: 4, to: 4, text: 'Fill the three drops to grow.' },
    { from: 5, to: 5, text: 'Soak the smallest first.' },
    { from: 6, to: 8, text: 'It soaks up any number up to its own.' },
    { from: 6, to: 6, text: 'Each one makes the puddle one bigger.' },
    { from: 7, to: 8, text: 'Each number adds to the puddle.' },
    { from: 8, to: 8, text: "Land exactly on the pail's number; tap one at the top to let it go." },
    { from: 9, to: 9, text: 'Every number fits the puddle; soak them smallest number first.' },
    { from: 10, to: 10, text: 'Count the dots or read the number: it soaks up any number up to its own, and each one makes it one bigger.' },
    { from: 11, to: 11, text: 'The puddle starts too full: tap numbers at the top to let them go until it matches the pail. One let go too many can be soaked back.' },
  ],
  finish: [
    { from: 1, to: 7, text: 'The beach is clean.' },
    { from: 8, to: 8, text: 'The puddle matches the pail.' },
    { from: 11, to: 11, text: 'The puddle matches the pail.' },
    { from: 9, to: 10, text: 'The beach is clean.' },
  ],
  note: [
    { from: 1, to: 8, text: 'Touching something too big is never counted: the puddle just flows past it.' },
    { from: 2, to: 3, text: 'After two tries that do not fit, the next one to soak glows, free.' },
    { from: 4, to: 4, text: 'After two tries that do not fit, the next one to soak glows; that counts as a hint.' },
    { from: 5, to: 5, text: 'Steering onto a bigger one first counts as a miss; after two misses the smallest glows, which counts as a hint.' },
    { from: 9, to: 9, text: 'Steering onto a bigger number while a smaller one is left counts as a miss; after two misses the smallest number left glows, which counts as a hint.' },
    { from: 10, to: 10, text: 'Touching a number too big is never counted. After two tries that do not fit, the next one to soak glows; that counts as a hint.' },
    { from: 6, to: 7, text: 'After two tries that do not fit, the next one to soak glows; that counts as a hint.' },
    { from: 8, to: 8, text: "Steering onto one that goes past the pail's number counts as a miss; letting one go never does. After two misses, or two tries that do not fit, the next good move glows, which counts as a hint." },
    { from: 11, to: 11, text: "Letting one go is never counted, and going under the pail's number is allowed. Steering onto one that would go past the pail counts as a miss; after two misses the next good move glows, which counts as a hint." },
  ],
};
