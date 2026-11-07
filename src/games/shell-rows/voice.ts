// What this game says, keyed by line id; src/content/voice-script.ts gathers every game's lines into SCRIPT.
export const VOICE = {
  'game.shell-rows': ['Shell Rows!'],
  'sr.intro': ['Shells and pebbles in the sand. It is your turn!'],
  'sr.instruct.1': ['Two shells in a row! Where does the third one go?'],
  'sr.instruct.2': ['The pet has two pebbles in a row. Can you stop it?'],
  'sr.instruct.3': ["You have two in a row, and so does the pet. What's the best move?"],
  'sr.took-spot': ['I took your spot! Your two shells needed it.'],
  'sr.got-three': ['I got three! Can you stop me?'],
  'sr.could-have': ['You could have had three!'],
  'sr.saw-it': ['Oh! You saw it!'],
  'sr.three-in-a-row': ['Three in a row!'],
  'sr.full': ['That square is taken. Try an empty one.'],
  'sr.look-again': ['Look at the glowing square.'],
  'sr.done': ['Three puzzles, all solved!'],
} satisfies Record<string, string[]>;
