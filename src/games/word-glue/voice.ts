// What this game says, keyed by line id; src/content/voice-script.ts gathers every game's lines into SCRIPT.
export const VOICE = {
  'game.word-glue': ['Word Glue!'],
  'wordglue.instruct.stick': ['Stick them together!'],
  'wordglue.instruct.big': ['Touch anywhere to stick them together!'],
  'wordglue.instruct.make': ['Make a {word}!'],
  'wordglue.ask': ['I need a {head}!'],
  'wordglue.word': ['{word}!'],
  'wordglue.join': ['{first}… {second}… {word}!'],
  'wordglue.miss.make': ['{word}: {first}… and {second}.'],
  'wordglue.miss.for': ["That's a {made}, {meaning}. Who needs a {head} now?"],
  'wordglue.hint': ['These two go together.'],
  'wordglue.done': ['Look at everything we made!'],
} satisfies Record<string, string[]>;
