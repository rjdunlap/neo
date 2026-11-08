// What this game says, keyed by line id; src/content/voice-script.ts gathers every game's lines into SCRIPT.
export const VOICE = {
  'game.number-nook': ['Number Nook!'],
  'nook.go': [
    'Put the numbers in order, across each row. Tap a tile beside the empty space to slide it. Leave the empty space at the bottom right.',
  ],
  'nook.miss': ['That tile cannot reach the gap. Tap a tile in the same row or column as the empty space.'],
  'nook.hint': ['Slide the glowing tile. It starts a shortest way to put the numbers in order.'],
  'nook.restart': ['The starting tiles are back. Try another route.'],
  'nook.done': ['All the numbers are in order! You planned a path through the empty space.'],
} satisfies Record<string, string[]>;
