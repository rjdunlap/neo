// What this game says, keyed by line id; src/content/voice-script.ts gathers every game's lines into SCRIPT.
export const VOICE = {
  'game.word-code': ['Word code!'],
  'wc.school': [
    'Which picture word is hiding? Tap letters to try a word. A check means right place, a dot means another place, a cross means not in it.',
  ],
  'wc.grownup': [
    'Find the hidden five-letter word. Type a word and send it: a check means the right place, a dot means another place, a cross means not in the word.',
  ],
  'wc.word': ['{word}'],
  'wc.readout': ['{text}'],
  'wc.fill': ['Fill every box first, then tap the check.'],
  'wc.notword': ['That is not a word on my list. Try another one!'],
  'wc.ignoredAbsent': ['Look back at the marks: the {letter} is not in the word.'],
  'wc.ignoredSpot': ['Look back at the marks: the {letter} does not go in that spot.'],
  'wc.ignoredCheck': ['Look back at the marks: the {letter} was right in its spot.'],
  'wc.hint': ['Here is a clue. The {nth} letter is {letter}.'],
  'wc.found': ['You found it! The word is {word}.', 'That is the word: {word}!'],
};
