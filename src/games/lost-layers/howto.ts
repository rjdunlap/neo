import type { GameHowTo } from '../types';

/** The grown-ups' how-to card for this game; src/content/howto.ts gathers every card into HOW_TO. */
export const HOW_TO: GameHowTo = {
  goal: "Slide the broken cliff's pieces beside the whole one until the fossils line up, then say what the rocks can tell.",
  steps: [
    'Drag a piece up or down: green ties mean each fossil sits by its twin.',
    "Leave a layer's room at each wavy line, where the sea took rock.",
    { from: 1, to: 1, text: 'When all is green, tap It fits to keep that story. Find every way it fits.' },
    { from: 1, to: 1, text: "Then tap the story the rocks show, or Can't tell if both fit." },
    { from: 2, to: 2, text: 'Drag the look that could tell the stories apart into the slot and tap Look.' },
    { from: 2, to: 2, text: 'Then tap the story card that still fits.' },
  ],
  finish: "The rocks' answer is given, even when it is Can't tell.",
  note: [
    {
      from: 1,
      to: 1,
      text: "Sliding is free. It fits with something red, or one story while two fit, is a miss; after two the answer glows (a hint). Two stories fit, so Can't tell is right. The cliffs and rules are made up; real rocks tilt and hide more.",
    },
    {
      from: 2,
      to: 2,
      text: 'Sliding and tapping a look are free. A look that cannot help, or a ruled-out story, is a miss; after two the answer glows (a hint). The dark stripe fell everywhere in one day. The cliffs and rules are made up; real rocks tilt and hide more.',
    },
  ],
};
