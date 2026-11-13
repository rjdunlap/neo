import type { GameHowTo } from '../types';

/** The grown-ups' how-to card for this game; src/content/howto.ts gathers every card into HOW_TO. */
export const HOW_TO: GameHowTo = {
  goal: 'Listen, choose friends and say goodnight.',
  steps: [
    { to: 2, text: 'Tap each thing to say goodnight.' },
    {
      from: 11,
      to: 11,
      text: 'One big sleepy friend stands in the room. Touch anywhere: it is tucked in with a goodnight, and the next friend tiptoes in.',
    },
    { from: 3, to: 3, text: 'Tap the thing that is named to say goodnight.' },
    { from: 4, to: 4, text: 'Tap the two things in the order they are named.' },
    { from: 5, to: 5, text: 'Tap the animals in any order. The lamp and clock settle together afterwards.' },
    {
      from: 6,
      to: 6,
      text: 'Tap everyone else in any order, then the lamp or lantern last so its light helps you see.',
    },
    {
      from: 9,
      to: 9,
      text: 'Leave the lamp or lantern awake as the night-light. Tap every other friend in any order.',
    },
    {
      from: 8,
      to: 8,
      text: 'Listen for orange or brown, then tap every friend of that color in any order. The fish means the orange fish inside its blue bowl.',
    },
    {
      from: 7,
      to: 7,
      text: 'Listen for how many friends to say goodnight to, then tap that many awake friends. Any friends count; each goodnight is counted aloud.',
    },
    {
      from: 10,
      to: 10,
      text: 'Tap everyone in the room to say goodnight, then tap the big arrow to walk to the next room. Three rooms in all.',
    },
  ],
  finish: [
    { to: 6, text: 'The round ends when the room is asleep.' },
    {
      from: 9,
      to: 9,
      text: 'The round ends when every other friend is asleep. The night-light keeps its warm glow.',
    },
    {
      from: 8,
      to: 8,
      text: 'After all the matching friends sleep, the others settle together and the round ends.',
    },
    {
      from: 7,
      to: 7,
      text: 'Reaching the requested count finishes your goodnights. The other friends stay awake briefly, then settle together for the finale.',
    },
    { from: 10, to: 10, text: 'The round ends when all three rooms are asleep and the stars fill the sky.' },
    { from: 11, to: 11, text: 'The round ends when all four friends are tucked in.' },
  ],
};
