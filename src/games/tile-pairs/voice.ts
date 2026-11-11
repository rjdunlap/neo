// What this game says, keyed by line id; src/content/voice-script.ts gathers every game's lines into SCRIPT.
export const VOICE = {
  'game.tile-pairs': ['Tile Pairs!'],
  'tile-pairs.go': [
    'Tap two tiles with the same picture. Their tops must be clear, and a left or right side must be open. Clear the stack!',
  ],
  'tile-pairs.blocked': ['That tile needs a clear top and an open left or right side. Try a bright tile.'],
  'tile-pairs.mismatch': ['Those pictures are different. Look for two that are the same.'],
  'tile-pairs.stuck': [
    'That choice left no clearing route. Undo can bring it back, or Shuffle lays the remaining tiles in open rows.',
  ],
  'tile-pairs.peek': [
    'When tiles are stacked, their pictures run left to right, starting with the bottom tile. Choose a tile or press Peek again to close.',
  ],
  'tile-pairs.hint': ['The outlined pair can start a way to clear the rest.'],
  'tile-pairs.shuffle': ['The remaining pictures are now in open rows. They can all be paired.'],
  'tile-pairs.done': ['The stack is clear!'],
} satisfies Record<string, string[]>;
