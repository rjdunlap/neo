// What this game says, keyed by line id; src/content/voice-script.ts gathers every game's lines into SCRIPT.
export const VOICE = {
  'game.puzzle-pals': ['Puzzle Pals!'],

  'puzzle.lap': ['Touch, and the piece hops into the picture!'],
  'puzzle.tap': ['Tap a piece, and it hops onto the picture where it matches!'],
  'puzzle.ghost': ['Drag each piece onto the picture where it matches!'],
  'puzzle.start': ['Drag the pieces into the frame to make a picture!'],
  'puzzle.turn': [
    'Some pieces are upside down! Tap a piece to turn it round, then drag each piece into the frame.',
  ],
  'puzzle.mend': ['Two pieces are mixed up! Tap one, then tap the other to swap them.'],
  'puzzle.mendWrong': ['That one fits right here. Look for the pieces that do not match!'],
  'puzzle.mendHint': ['Look at the glowing pieces. They are mixed up!'],
  'puzzle.turnItRound': ['Turn it round!'],
  'puzzle.wrong': ['Hmm, that piece goes somewhere else. Look at its picture!'],
  'puzzle.hint': ['Try the glowing spot!'],
  'puzzle.hint.top-left': ['Try the glowing piece in the top left corner!'],
  'puzzle.hint.top-right': ['Try the glowing piece in the top right corner!'],
  'puzzle.hint.bottom-left': ['Try the glowing piece in the bottom left corner!'],
  'puzzle.hint.bottom-right': ['Try the glowing piece in the bottom right corner!'],
  'puzzle.hint.top': ['Try the glowing piece along the top!'],
  'puzzle.hint.bottom': ['Try the glowing piece along the bottom!'],
  'puzzle.hint.left': ['Try the glowing piece on the left!'],
  'puzzle.hint.right': ['Try the glowing piece on the right!'],
  'puzzle.hint.middle': ['Try the glowing piece in the middle!'],
  'puzzle.done': ['You made {what}!'],
  'puzzle.doneTwin': ['You made {a} and {b}!'],
} satisfies Record<string, string[]>;
