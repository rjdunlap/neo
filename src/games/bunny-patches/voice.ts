// What this game says, keyed by line id; src/content/voice-script.ts gathers every game's lines into SCRIPT.
export const VOICE = {
  'game.bunny-patches': ['Bunny Patches!'],
  'bunny.start': ['One bunny in every row, every column and every patch, and no bunnies touching.'],
  'bunny.start-given': [
    'One bunny in every row, every column and every patch, and no bunnies touching. This bunny is already here. Where does the next one go?',
  ],
  'bunny.clash-row': ['Two bunnies are in the same row. Take one back and try another square.'],
  'bunny.clash-column': ['Two bunnies are in the same column. Take one back and try another square.'],
  'bunny.clash-patch': ['Two bunnies are in the same patch. Each patch only needs one.'],
  'bunny.clash-touch': ['Two bunnies are touching. Give them some room.'],
  'bunny.hint-patch': ['The glowing square is the only one left in its patch.'],
  'bunny.hint-row': ['The glowing square is the only one left in its row.'],
  'bunny.hint-column': ['The glowing square is the only one left in its column.'],
  'bunny.hint-remove': ['This bunny cannot be part of the answer. Tap it to take it back.'],
  'bunny.done': ['Every row, column and patch has its bunny!'],
} satisfies Record<string, string[]>;
