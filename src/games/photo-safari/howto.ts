import type { GameHowTo } from '../types';

/** The grown-ups' how-to card for this game; src/content/howto.ts gathers every card into HOW_TO. */
export const HOW_TO: GameHowTo = {
  goal: 'Take the photos asked for: listen to a description, or tell the pet which animal to photograph.',
  steps: [
    { to: 1, text: 'Tap any animal to take its photo.' },
    { from: 2, to: 2, text: 'Listen for the animal named, then tap it to take its photo.' },
    { from: 3, to: 3, text: 'Listen for the animal and what it is doing, like "the bunny jumping", then tap it.' },
    { from: 4, to: 4, text: 'Listen for the animal and where it is, like "the duck under the tree", then tap it.' },
    { from: 5, to: 5, text: 'All three animals are the same kind. Listen for what it is doing and where it is, like "the cat sleeping behind the bush". Two fit each clue alone; tap the one that fits both.' },
    { from: 6, to: 6, text: 'Listen for what the animal is not doing, like "the animal that is not sleeping", then tap it.' },
    { from: 7, to: 7, text: 'Use both clues: what the animal is doing and where it is. Two animals fit each clue alone; tap the one that fits both.' },
    { from: 8, to: 8, text: 'Tap the camera to photograph the whole meadow; the photo stays pinned at the top. A puff hides everyone, and one friend changes one thing: what it is doing, or (in the third and fourth photos) where it is. Compare with the photo and tap that friend.' },
    { from: 9, to: 9, text: 'The pet says something about one animal, like "the duck is sleeping in the pond". Tap that animal to photograph it, then look at the photo: thumbs up if it is true, thumbs down if it is not. Two claims each round are true and two are not.' },
    { from: 10, to: 10, text: 'One animal sparkles: the friend wants its photo, but the pet cannot tell which. Tap a picture word only the sparkly animal has, then press Tell. If two animals fit, the pet asks "Which one?"' },
    { from: 11, to: 11, text: 'One animal sparkles. Every picture word fits two animals, so tap a doing word and a place word that together fit only the sparkly one, then press Tell.' },
    { from: 12, to: 12, text: 'Three friends are each doing something different. Listen for the doing word, like "Who is sleeping?", then tap that friend.' },
  ],
  finish: 'The round ends when the photos asked for are taken.',
  note: 'Each action she successfully photographs is added to her discovery journal in the treehouse.',
};
