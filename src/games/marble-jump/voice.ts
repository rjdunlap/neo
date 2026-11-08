// What this game says, keyed by line id; src/content/voice-script.ts gathers every game's lines into SCRIPT.
export const VOICE = {
  'game.marble-jump': ['Marble Jump!'],
  'marble.go': [
    'Tap a marble, then an empty hole two spaces away. Jump straight over one marble to take it off. Leave just one marble. Undo lets you try another plan.',
  ],
  'marble.go7': [
    'Tap a marble, then an empty hole two spaces away. Jump straight over one marble to take it off. Leave just one marble, in the star hole. Undo lets you try another plan.',
  ],
  'marble.miss': ['Jump straight over one marble into an empty hole, two spaces away.'],
  'marble.hint': ['Jump from one outlined hole to the other, over the marble between them.'],
  'marble.revise': [
    'This route cannot leave one marble. Undo a jump to try another plan, or ask for a hint.',
  ],
  'marble.star': ['One marble is left, but not on the star. Undo to try another route, or ask for a hint.'],
  'marble.recover': ['I took back the jumps to the nearest clearing route. Try the outlined jump.'],
  'marble.restart': ['The starting marbles are back. Try another plan.'],
  'marble.done': ['One marble left! You planned a clearing route.'],
} satisfies Record<string, string[]>;
