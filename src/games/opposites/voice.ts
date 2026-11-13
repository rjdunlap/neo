// What this game says, keyed by line id; src/content/voice-script.ts gathers every game's lines into SCRIPT.
export const VOICE = {
  'game.opposites': ['Opposites!'],
  'opp.switch': ['Tap the picture and it turns into its opposite!'],
  'opp.big': ['Touch anywhere, and the picture turns into its opposite!'],
  'opp.word': ['{word}!'],
  'opp.find': ['Which one is {word}? Tap it!'],
  'opp.opposite': ['This one is {word}. Find the opposite!'],
  'opp.spot': ['Which two are opposites? Tap one, then its opposite.'],
  'opp.pairs': ['Find the opposites! Tap one, then its opposite.'],
  'opp.notfind': ['That one is {what}. Which one is {word}?'],
  'opp.notopp': ['{what} is not the opposite of {word}.'],
  'opp.notpair': ['{a} and {b} are not opposites.'],
  'opp.pair': ['{a} and {b}!'],
  'opp.yay': ['Yes!', 'You got it!', 'That is right!'],
  'opp.done': ['Big hooray, not a small one!'],
} satisfies Record<string, string[]>;
