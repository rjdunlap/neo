// What this game says, keyed by line id; src/content/voice-script.ts gathers every game's lines into SCRIPT.
export const VOICE = {
  'game.look-it-up': ['Look it up!'],
  'lookitup.say': ['{text}'],
  'lookitup.ask': ["{text} Let's look it up!"],
  'lookitup.instruct.labels': ['Touch a word to hear it.'],
  'lookitup.miss': ["{what} {fact} Let's look in the guide for the {kind}."],
  'lookitup.done': ['Every visitor has been helped. Thank you!'],
} satisfies Record<string, string[]>;
