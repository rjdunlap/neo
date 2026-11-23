import type { GameHowTo } from '../types';

/** The grown-ups' how-to card for this game; src/content/howto.ts gathers every card into HOW_TO. */
export const HOW_TO: GameHowTo = {
  goal: "Watch a little story, then put a picture in a friend's thought bubble: what the friend wants, thinks or why they did something.",
  steps: [
    'Watch the story; the replay button plays it again.',
    { from: 1, to: 1, text: 'Drag what the friend is reaching for into the bubble.' },
    { from: 2, to: 2, text: 'Drag the place where the friend thinks the thing is; did he see it move?' },
    {
      from: 3,
      to: 3,
      text: 'Drag the reason into the bubble, then tap the part of the picture that shows it.',
    },
    {
      from: 4,
      to: 4,
      text: 'Two friends each get a bubble: drag the place each one thinks the thing is. Who was in the room when it moved?',
    },
    {
      from: 5,
      to: 5,
      text: 'Two speech bubbles each hold a telling of the story. Drag in the friend who could have told it: who was there for every part?',
    },
  ],
  finish: 'The round ends after three little stories; one sticker.',
  note: [
    {
      from: 5,
      to: 5,
      text: "About 9 and up. A friend who was out of the door cannot tell that part, and the helper came in after the thing was put away. One friend can fit both bubbles. On the grown-up side, this is a narrator's point of view; it shows how she answers with the pet's spoken story, not that she reads stories this way on her own.",
    },
    {
      from: 4,
      to: 4,
      text: "About 9 and up. Two friends can think different things, or the same thing; neither has to be right about where it really is. Fill the bubbles in either order; a friend who went out of the door did not see what moved. On the grown-up side, this is two characters' points of view; it shows how she answers with the pet's spoken story, not that she reads stories this way on her own.",
    },
    {
      from: 2,
      to: 2,
      text: "A friend who went out of the door did not see what moved; a friend at the window did. The friend acts on what is in the bubble, so the story shows whether it made sense. On the grown-up side, this is a character's point of view; it shows how she answers with the pet's spoken story, not that she reads stories this way on her own.",
    },
    {
      from: 3,
      to: 3,
      text: "Tapping around the picture is free; only the bubble counts. On the grown-up side, this is an inference from the picture; it shows how she answers with the pet's spoken story, not that she reads stories this way on her own.",
    },
    {
      from: 1,
      to: 1,
      text: "The friend acts on what is in the bubble, so the story shows whether it made sense. On the grown-up side, this is reading a character's wants; it shows how she answers with the pet's spoken story, not that she reads stories this way on her own.",
    },
  ],
};
