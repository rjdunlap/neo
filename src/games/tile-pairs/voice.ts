// What this game says, keyed by line id; src/content/voice-script.ts gathers every game's lines into SCRIPT.
export const VOICE = {
  'game.tile-pairs': ['Tile Pairs!'],
  'tile-pairs.go': [
    'Tap two tiles with the same picture. Their tops must be clear, and a left or right side must be open. Clear the stack!',
  ],
  'tile-pairs.go-flowers': [
    'Tap two tiles with the same picture, or any two flowers. Their tops must be clear, and a left or right side must be open. Clear the stack!',
  ],
  'tile-pairs.blocked': ['That tile needs a clear top and an open left or right side. Try a bright tile.'],
  'tile-pairs.mismatch': ['Those pictures are different. Look for two that are the same.'],
  'tile-pairs.flowers': ['Flowers go with flowers. Any two flowers make a pair, even different ones.'],
  'tile-pairs.stuck': [
    'That choice left no clearing route. Undo can bring it back, or Shuffle lays the remaining tiles in open rows.',
  ],
  'tile-pairs.lesson.twins': [
    'The lesson: when a tile sits on a copy of its own picture, pair the top one first, with a free copy. Pairing the other two copies leaves the top one stuck on its own partner.',
  ],
  'tile-pairs.lesson.three': [
    'The lesson: when three copies are free and the fourth is covered, one of the three will be its partner. Keep the copy that can still reach the covered one, and pair the other two.',
  ],
  'tile-pairs.lesson.crossed': [
    'The lesson: when one picture sits on a second and the second sits on the first, take those stacks apart in turn. Pairing away the free copies first leaves each last copy buried under the other.',
  ],
  'tile-pairs.peek': [
    'When tiles are stacked, their pictures run left to right, starting with the bottom tile. Choose a tile or press Peek again to close.',
  ],
  'tile-pairs.hint': ['The outlined pair can start a way to clear the rest.'],
  'tile-pairs.shuffle': ['The remaining pictures are now in open rows. They can all be paired.'],
  'tile-pairs.done': ['The stack is clear!'],
} satisfies Record<string, string[]>;
