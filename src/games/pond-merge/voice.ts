// What this game says, keyed by line id; src/content/voice-script.ts gathers every game's lines into SCRIPT.
export const VOICE = {
  'game.pond-merge': ['Pond merge!'],
  'pond-merge.instruct-1': ['Slide a friend along the top and let go. Two the same make a duck!'],
  'pond-merge.instruct-2': ['Two the same pop into a bigger one. Can you make a goose?'],
  'pond-merge.instruct-3': ['Plan your pile. Can you make a swan?'],
  'pond-merge.pop': ['Pop! A bigger friend!', 'Two the same! Pop!'],
  'pond-merge.lift': ['The little ones float away to make room.'],
  'pond-merge.hint': ['See the ghost? Drop it right there.'],
  'pond-merge.take-back': ['Back it goes. Try somewhere else!'],
  'pond-merge.done': ['You made it!', 'Look who is here!'],
} satisfies Record<string, string[]>;
