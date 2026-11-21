// What this game says, keyed by line id; src/content/voice-script.ts gathers every game's lines into SCRIPT.
export const VOICE = {
  'game.sum-crates': ['Sum Crates!'],
  'sum-crates.start': [
    'Fill the crates so every row and every column adds up to its number. Never use the same fruit twice in one line.',
  ],
  'sum-crates.makes': ['This makes {m}. We need {n}.'],
  'sum-crates.repeat': ['The same fruit is in one line twice. Change one of them.'],
  'sum-crates.miss': ['The {n} {dir} needs different fruit.'],
  'sum-crates.miss-repeat': ['A line has the same fruit twice. Change one of them.'],
  'sum-crates.hint': ['The glowing crate has only one fruit that fits. Look at the {n} {dir}.'],
  'sum-crates.hint-remove': ['This fruit cannot be part of the answer. Tap it to take it back.'],
  'sum-crates.done': ['Every line adds up! The crates are loaded.'],
} satisfies Record<string, string[]>;
