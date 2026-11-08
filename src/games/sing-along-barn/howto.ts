import type { GameHowTo } from '../types';

/** The grown-ups' how-to card for this game; src/content/howto.ts gathers every card into HOW_TO. */
export const HOW_TO: GameHowTo = {
  goal: 'Sing a short song by tapping, Old MacDonald or one of nine nursery songs: every tap is the next note, and a friend joins each verse.',
  steps: [
    {
      to: 2,
      text: 'Tap anywhere to play the next note. Sing along, one syllable for each note. Old MacDonald: "Old MacDonald had a farm", then "And on that farm he had a cow" for each friend. Each nursery song opens with its first lines, then each friend sings the next verse.',
    },
    {
      from: 3,
      to: 3,
      text: 'Tap the friends you want on the farm. When the barn is full, tap anywhere to play each note of the song.',
    },
    {
      from: 4,
      to: 4,
      text: "Tap anywhere to sing the opening. Then, at the end of each verse, tap the friend you want to sing next; the friends who have sung wait in the row and only say hello. Tap anywhere to sing that friend's verse.",
    },
    {
      from: 5,
      to: 5,
      text: 'Tap the song you want, from ten cards in two rows. Then tap anywhere to sing the opening; at the end of each verse, tap the friend you want to sing next. The friends who have sung wait in the row and only say hello.',
    },
    {
      from: 6,
      to: 6,
      text: 'Tap a song from ten cards (Old MacDonald sings its whole verse). Tap anywhere to sing; after each verse, tap who sings next. Old MacDonald adds "With a moo-moo here and a moo-moo there" and the first line again.',
    },
    {
      from: 7,
      to: 7,
      text: "Tap anywhere to sing. Before the last word of each friend's verse the song stops and the word's picture (a bun, a ball, a spout, a night sky) waits by the barn door; then any tap sings the word. With a grown-up, let her say it first.",
    },
    {
      from: 8,
      to: 8,
      text: 'Tap anywhere to sing. Before the rhyming word the song stops, two pictures wait by the barn and the pet says the line. Tap the one that rhymes ("away … play": the ball) to sing it; a tap elsewhere repeats the line.',
    },
  ],
  finish: 'The round ends after the last verse of the last friend. Each round sings one song.',
  note: [
    {
      from: 1,
      to: 7,
      text: 'There is no wrong tap. Tapping fast or slowly only changes how the song is sung, and the animals answer on their own.',
    },
    {
      from: 8,
      to: 8,
      text: 'The other picture bounces back with a boing and the pet says the rhyme; it counts a miss. A second at one stop glows the rhyming picture (a hint).',
    },
  ],
};
