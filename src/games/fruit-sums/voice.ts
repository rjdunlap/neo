// What this game says, keyed by line id; src/content/voice-script.ts gathers every game's lines into SCRIPT.
export const VOICE = {
  'game.fruit-sums': ['Fruit sums!'],
  'fsums.start': ['Make {n}! Tap two fruit, then tap the check to add them up.'],
  'fsums.start3': ['Make {n}! Tap two fruit and a sign, then tap the check.'],
  'fsums.num': ['{n}!'],
  'fsums.plus': ['Plus!'],
  'fsums.minus': ['Take away!'],
  'fsums.fill': ['Tap two fruit first, then the check.'],
  'fsums.fillsign': ['Tap two fruit and a sign first, then the check.'],
  'fsums.right': ['{a} {op} {b} makes {n}!', 'Yes! {a} {op} {b} is {n}!'],
  'fsums.again': ['Can you make {n} a different way?'],
  'fsums.same': ['That is the same way. Can you find a different one?'],
  'fsums.below': ['We cannot take {b} away from {a}. Try them the other way round!'],
  'fsums.wrong': ['{a} {op} {b} makes {m}. We need {n}.', '{a} {op} {b} is {m}. Let us make {n}.'],
  'fsums.hint': ['Follow the glow! It shows the next step.'],
  'fsums.done': ['Two ways to make {n}! Great thinking!'],
} satisfies Record<string, string[]>;
