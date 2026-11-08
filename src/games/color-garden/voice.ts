// What this game says, keyed by line id; src/content/voice-script.ts gathers every game's lines into SCRIPT.
export const VOICE = {
  'game.color-garden': ['The color garden!'],

  'garden.tap': ['Tap a fruit! It hops to its color basket!'],
  'garden.start': ['Put each one in the basket that matches!'],
  'garden.wrong': ['That one is {color}. Find the {color} basket!'],
  'garden.shades': ['Light blue or dark blue? Put each one in the basket that matches!'],
  'garden.shade.wrong': ['That one is {shade} blue. Find the {shade} blue basket!'],
  'garden.rule.color': [
    'Look at the sign! Today we sort by color. Put each one in the basket that is its color!',
  ],
  'garden.rule.kind': [
    'Look at the sign! Today we sort by what it is. Fruit goes in one basket and balloons in the other!',
  ],
  'garden.is.fruit': ['Fruit!'],
  'garden.is.balloon': ['A balloon!'],
  'garden.kind.wrong': ['That one is a {kind}. Look at the sign, and find the {kind} basket!'],
  'tone.light': ['Light blue!'],
  'tone.dark': ['Dark blue!'],
  'garden.done': ['All sorted! What a garden!'],
} satisfies Record<string, string[]>;
