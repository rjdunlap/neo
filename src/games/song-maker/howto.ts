import type { GameHowTo } from '../types';

/** The grown-ups' how-to card for this game; src/content/howto.ts gathers every card into HOW_TO. */
export const HOW_TO: GameHowTo = {
  goal: 'Make a song with jellies, or copy one.',
  steps: [
    { to: 7, text: 'Tap jellies on the loop to place notes; the loop plays round and round.' },
    {
      from: 8,
      to: 8,
      text: 'Touch anywhere: the nearest sleeping jelly lights and sings on the loop. One big jelly starts it, and more wake as she lights them, the low row first and the top row last. A touch on a lit jelly puts it out.',
    },
    {
      from: 9,
      to: 9,
      text: 'Tap jellies on any beats to make her own song; the loop plays round and round and she can change it any time. Once three or more are lit and the loop has played a full round since her last change, the check button wakes.',
    },
    {
      from: 10,
      to: 10,
      text: 'The pet sings a four-note question on the first four beats, then she answers with one jelly on each of the last four beats. A tap in a beat moves its jelly, and a tap on the lit one puts it out; any answer is welcome, an echo included. Once all four are filled and the loop has played all eight beats since her last change, the check button wakes.',
    },
    {
      from: 11,
      to: 11,
      text: 'The pet sings two notes from a tune on the first two beats, then she finishes the song with one jelly on each of the last two beats. A tap in a beat moves its jelly, and a tap on the lit one puts it out; any ending is welcome. Once both are filled and the loop has played all four beats since her last change, the check button wakes.',
    },
    {
      from: 13,
      to: 13,
      text: 'The pet sings a four-note question that starts on the bottom (home) jelly, and she answers on the last four beats, ending on the home jelly. A tap in a beat moves its jelly. When all four are filled and the loop has played all eight beats, the check wakes.',
    },
    {
      from: 14,
      to: 14,
      text: "The pet's six-beat song plays, lit, with a picture of one change: raise the end, make beat 4 match beat 1, go down at the end, or add a quiet beat. A tap in a beat moves its jelly; a tap on a lit one puts it out. The yellow button plays the song as it was. After a change and a full loop, the check wakes.",
    },
    { from: 3, to: 4, text: 'Copy the song by tapping jellies on its shadow notes.' },
    { from: 5, to: 5, text: 'Copy the song on the little card.' },
    {
      from: 6,
      to: 6,
      text: 'Continue the song pattern (the pet names its shape first: stairs, hops, zigzags, arches, valleys, leaps and more).',
    },
    { from: 7, to: 7, text: 'Listen, then find each note of the tune by ear.' },
    {
      from: 12,
      to: 12,
      text: 'Listen, then pick each note of the tune from the two shadow jellies on each beat.',
    },
  ],
  finish: [
    { from: 9, to: 11, text: 'The round ends after she presses the check and hears her song once more.' },
    {
      from: 13,
      to: 13,
      text: 'The round ends when she presses the check with her last jelly on the home jelly, then hears her song once more.',
    },
    {
      from: 14,
      to: 14,
      text: 'The round ends when she presses the check with the change made, then hears the song once more.',
    },
    { to: 2, text: 'The round ends after the song has played a few rounds.' },
    { from: 3, to: 7, text: 'The round ends when the song matches.' },
    { from: 12, to: 12, text: 'The round ends when all four notes of the song match.' },
    {
      from: 8,
      to: 8,
      text: 'The round ends a loop after her twelfth light (with at least two jellies lit); putting a jelly out does not count.',
    },
  ],
  note: [
    {
      from: 10,
      to: 10,
      text: "Every complete answer is welcome and nothing is counted. The whole eight-beat song, the pet's question and her answer, can hang in the pet's room from the little tree house button as one song.",
    },
    {
      from: 13,
      to: 13,
      text: "A check with her last jelly elsewhere is a miss: the pet plays her answer, then the same answer ending home. The check wakes again after a change, and after two misses the home jelly glows. This is the game's rule, not a law of music.",
    },
    {
      from: 14,
      to: 14,
      text: "Other changes are welcome; only the picture's change is checked. A check without it is a miss: the pet plays its song, then hers, and says what is left. After two misses a jelly glows whose tap brings the song closer. The new song can hang in the pet's room.",
    },
    {
      from: 11,
      to: 11,
      text: "Every ending is welcome and nothing is counted. The whole four-beat song, the pet's start and her ending, can hang in the pet's room from the little tree house button as one song.",
    },
    {
      from: 9,
      to: 9,
      text: "Any song is welcome and nothing is counted or wrong. The check button plays her song once more, then it hangs in the pet's room from the little tree house button.",
    },
    {
      to: 2,
      text: "Any song is welcome. If at least two jellies are lit at the end, a little tree house button hangs the song in the pet's room, where the pet sings it.",
    },
    { from: 3, to: 5, text: 'The short tune includes a quiet beat: leave that beat empty.' },
    { from: 3, to: 7, text: "A copied song is not hers, so it is not offered for the pet's room." },
    { from: 12, to: 12, text: "A copied song is not hers, so it is not offered for the pet's room." },
    {
      from: 8,
      to: 8,
      text: "Any song is welcome and nothing is counted. Her lit jellies can hang in the pet's room from the little tree house button.",
    },
  ],
};
