// What this game says, keyed by line id; src/content/voice-script.ts gathers every game's lines into SCRIPT.
// Every dish is pretend: no line calls a menu better, a food good or bad, or a leftover waste.
export const VOICE = {
  'game.picnic-pantry': ['Picnic pantry'],
  'pantry.instruct': ['Four friends are coming. Pick two dishes the pantry can make.'],
  'pantry.dish': ['{dish}. It takes {cost}.'],
  'pantry.jar': ['{ingredient}. {n} left.'],
  'pantry.jar-none': ['{ingredient}. None left.'],
  'pantry.full': ['The blanket holds two dishes. Tap one to put it back.'],
  'pantry.need-two': ['Four friends need two dishes.'],
  'pantry.short': ['{first} and {second} need {sum} {ingredient} together. The pantry has {n}.'],
  'pantry.hint-back': ['Try putting {dish} back.'],
  'pantry.hint-add': ['{dish} would fit.'],
  'pantry.hint-lay': ['That fits. Ring the bell.'],
  'pantry.left': ['Picnic time! {leftovers} left in the pantry.'],
  'pantry.left-none': ['Picnic time! The pantry is empty.'],
  'pantry.another': ['The dishes are back. Is there another menu that works?'],
  'pantry.compare': ['Another menu that works. This time {now} left; last time, {before}.'],
  'pantry.same': ['That is the menu you laid before. It still works.'],
} satisfies Record<string, string[]>;
