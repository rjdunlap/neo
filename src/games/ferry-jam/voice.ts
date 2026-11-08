// What this game says, keyed by line id; src/content/voice-script.ts gathers every game's lines into SCRIPT.
export const VOICE = {
  'game.ferry-jam': ['Ferry jam!'],
  'ferry.start.rocks': [
    'The harbor is jammed, and the grey rock never moves! Slide the boats around it so the red ferry can reach the dock.',
  ],
  'ferry.both': [
    'Two ferries! The red one goes to the dock on the right, the yellow one to the dock at the bottom. Which ferry has to go first?',
  ],
  'ferry.one': ['One ferry is out! Now help the other one.'],
  'ferry.start.one': [
    "One boat is in the red ferry's way. Slide it out of the way so the ferry can reach the dock!",
  ],
  'ferry.who': ["The red ferry wants to reach the dock. Which boat is in the ferry's way? Tap it!"],
  'ferry.notway': ['Look along the water in front of the ferry. Which boat is there?'],
  'ferry.yes': ["Yes, that boat is in the ferry's way!"],
  'ferry.rock': ['That rock never moves. Find another place for the boat to wait.'],
  'ferry.out': ['Off goes the ferry!', 'The ferry made it to the dock!'],
  'ferry.best': ['The fewest slides possible! What a captain!'],
  'ferry.hint': ['Try sliding the glowing boat. It goes where the thin outline is.'],
  'ferry.done': ['The harbor is clear. What a busy captain!'],
} satisfies Record<string, string[]>;
