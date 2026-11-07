// What this game says, keyed by line id; src/content/voice-script.ts gathers every game's lines into SCRIPT.
export const VOICE = {
  'game.brain-break': ['Brain Break!'],
  'brain.start': ['Find the stones in number order, from one to {n}. Start with one. Take your time.'],
  'brain.try': ['Look for {n} next. The other stones can wait.'],
  'brain.next': ['Now find {n}.'],
  'brain.hint': ['Find {n}. Its stone has a golden outline.'],
  'brain.done': ['All {n} stones are lit! You found them in order.'],
  'brain.sums.start': ['Find the sums in order, from the one that makes one up to {n}. Take your time.'],
  'brain.sums.try': ['That one makes {m}. Look for the one that makes {n}.'],
  'brain.sums.hint': ['The one that makes {n} has a golden outline.'],
} satisfies Record<string, string[]>;
