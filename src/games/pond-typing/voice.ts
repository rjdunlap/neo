// What this game says, keyed by line id; src/content/voice-script.ts gathers every game's lines into SCRIPT.
export const VOICE = {
  'game.pond-typing': ['Pond Typing!'],
  'pt.one': ['Press the key on the bubble.'],
  'pt.name': ['Type your name, one letter at a time.'],
  'pt.word': ['Type the word. Use the space bar between words.'],
  'pt.capital': ['Start with a big letter. Tap Shift, then the letter.'],
  'pt.line': ['Copy the whole line. Finish with a full stop. Backspace takes a letter out.'],
  'pt.mend': [
    'One letter is wrong. Use the arrows to find it. Backspace takes out the letter before the caret. Copy the right letter.',
  ],
  'pt.big': ['It starts with a big letter. Tap Shift, then the letter.'],
  'pt.stop': ['Press the full stop key.'],
  'pt.repair': ['Look at the model line. Use the arrows and Backspace to mend your line.'],
  'pt.that': ['That was {pressed}. Find {wanted}.'],
  'pt.space': ['That was space. The next letter is {wanted}.'],
  'pt.spacewant': ['Press the space bar.'],
  'pt.said': ['{word}!'],
  'pt.done': ['Every bubble popped!', 'The pond is all popped!'],
} satisfies Record<string, string[]>;
