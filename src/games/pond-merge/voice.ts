// What this game says, keyed by line id; src/content/voice-script.ts gathers every game's lines into SCRIPT.
// Every line names the child with a slot, so device speech says it and no recorded clip has to be rendered for a new game.
export const VOICE = {
  'game.pond-merge': ['Pond merge, {name}!'],
  'pond-merge.instruct-1': ['{name}, slide a friend along the top and let go. Two the same make a duck!'],
  'pond-merge.instruct-2': ['Two the same pop into a bigger one, {name}. Can you make a goose?'],
  'pond-merge.instruct-3': ['Plan your pile, {name}. Can you make a swan?'],
  'pond-merge.pop': ['Pop! A bigger friend, {name}!', 'Two the same! Pop, {name}!'],
  'pond-merge.lift': ['The little ones float away to make room, {name}.'],
  'pond-merge.hint': ['See the ghost, {name}? Drop it right there.'],
  'pond-merge.take-back': ['Back it goes, {name}. Try somewhere else!'],
  'pond-merge.done': ['You made it, {name}!', 'Look who is here, {name}!'],
} satisfies Record<string, string[]>;
