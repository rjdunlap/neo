// What this game says, keyed by line id; src/content/voice-script.ts gathers every game's lines into SCRIPT.
export const VOICE = {
  'game.color-garden': ['The color garden!'],

  'garden.big': ['Touch the garden! The fruit hops to its color basket!'],
  'garden.tap': ['Tap a fruit! It hops to its color basket!'],
  'garden.start': ['Put each one in the basket that matches!'],
  'garden.wrong': ['That one is {color}. Find the {color} basket!'],
  'garden.shades': ['Light blue or dark blue? Put each one in the basket that matches!'],
  'garden.shade.wrong': ['That one is {shade} blue. Find the {shade} blue basket!'],
  'garden.tones': ['Light, middle or dark? Put each one in the basket that matches!'],
  'garden.tone.wrong': ['That one is {shade} {hue}. Find the {shade} basket!'],
  'garden.rule.color': [
    'Look at the sign! Today we sort by color. Put each one in the basket that is its color!',
  ],
  'garden.rule.kind': [
    'Look at the sign! Today we sort by what it is. Fruit goes in one basket and balloons in the other!',
  ],
  'garden.both': [
    'Look two ways: what color is it, and is it a fruit or a balloon? Put each one in the basket that matches both!',
  ],
  'garden.both.pick': ['{color} {kind}!'],
  'garden.both.kind': ['Right color! But that one is a {kind}. Find the {color} {kind} basket!'],
  'garden.both.color': ['Right kind! But that one is {color}. Find the {color} {kind} basket!'],
  'garden.both.both': ['That one is a {color} {kind}. Find the {color} {kind} basket!'],
  'garden.is.fruit': ['Fruit!'],
  'garden.is.balloon': ['A balloon!'],
  'garden.kind.wrong': ['That one is a {kind}. Look at the sign, and find the {kind} basket!'],
  'tone.light': ['Light blue!'],
  'tone.dark': ['Dark blue!'],
  'tone.any': ['{shade} {hue}!'],
  'garden.done': ['All sorted! What a garden!'],
} satisfies Record<string, string[]>;
