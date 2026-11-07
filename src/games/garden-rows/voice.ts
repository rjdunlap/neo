// What this game says, keyed by line id; src/content/voice-script.ts gathers every game's lines into SCRIPT.
export const VOICE = {
  'game.garden-rows': ['Garden rows!'],
  'rows.one': ['One flower is missing from this row. Tap the flower packet that is missing, then tap the empty spot!'],
  'rows.clash-row': ['There is already a {flower} in this row. Try another flower!'],
  'rows.clash-col': ['There is already a {flower} in this column. Try another flower!'],
  'rows.boxes': ['One of each flower in every row, every column and every hedge box! Pick a flower packet, then tap an empty spot.'],
  'rows.clash-box': ['There is already a {flower} in this hedge box. Try another flower!'],
  'rows.hint-plant': ['Look at the glowing spot and the glowing packet. Plant that flower there!'],
  'rows.bloom': ['The flower bed is full! Beautiful!', 'Every flower is in the right place!'],
  'rows.done': ['What a lovely garden!'],
  'rows.mend': ['Two flowers got mixed up! Find them and swap them back. Tap a flower to lift it out, then plant it where it belongs.'],
  'rows.mend-hint': ['This glowing flower got mixed up. Tap it to lift it out, then find where it belongs.'],
} satisfies Record<string, string[]>;
