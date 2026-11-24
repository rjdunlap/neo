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
  'brain.count.start': ['Count by {s}. Start at {v}, then keep counting on. Take your time.'],
  'brain.count.startBack': ['Count back by {s}. Start at {v}, then keep counting back. Take your time.'],
  'brain.count.first': ['That one is {m}. Start at {v}.'],
  'brain.count.try': ['That one is {m}. Count on {s} from {p}.'],
  'brain.count.tryBack': ['That one is {m}. Count back {s} from {p}.'],
  'brain.count.next': ['After {p}, count on by {s}.'],
  'brain.count.nextBack': ['After {p}, count back by {s}.'],
  'brain.count.hint': ['The next number is {v}. Its stone has a golden outline.'],
  'brain.order.start': [
    'Find the numbers from the smallest to the biggest. Start with the smallest one. Take your time.',
  ],
  'brain.order.startBelow': [
    'Find the numbers from the smallest to the biggest. Some are below zero, and minus twelve comes before minus three. Take your time.',
  ],
  'brain.order.try': ['That one is {m}. A smaller one is still unlit.'],
  'brain.order.next': ['After {p}, find the next one up.'],
  'brain.order.hint': ['The smallest one left is {v}. Its stone has a golden outline.'],
  'brain.parts.start': [
    'Find the numbers from the smallest to the biggest. Some are fractions and some are decimals. Start with the smallest one. Take your time.',
  ],
  'brain.two.start': [
    'Follow two trails. Tap a number, then a letter. Start with one, then A. Count up and go forwards through the letters.',
  ],
  'brain.two.startBack': [
    'Follow two trails. Tap a number, then a letter. Start with one, then L. Count up and go backwards through the letters.',
  ],
  'brain.two.try': ['That one is {m}. It is the {trail} trail’s turn. {step}.'],
  'brain.two.next': ['It is the {trail} trail’s turn. {step}.'],
  'brain.two.hint': ['Find {v}. Its stone has a golden outline.'],
} satisfies Record<string, string[]>;
