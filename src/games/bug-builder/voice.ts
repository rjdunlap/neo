// What this game says, keyed by line id; src/content/voice-script.ts gathers every game's lines into SCRIPT.
export const VOICE = {
  'game.bug-builder': ['Bug Builder!'],
  'bug.guided': ['Decorate the bug! Drag each shape onto a matching spot.'],
  'bug.copy': ['Look at the little bug. Give the big bug the same shapes in the same places!'],
  'bug.mirror': ['Make matching wings! Put each shape across from its friend, like a mirror.'],
  'bug.wrong': ['Look closely at the shape, its color, and its place. Try another one!'],
  'bug.hint': ['Try the {color} {shape} in the glowing spot.'],
  'bug.hintMirror': ['Look across the line at its friend.'],
  'bug.done': ['Hello, beautiful bug!'],
} satisfies Record<string, string[]>;
