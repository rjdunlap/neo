// What this game says, keyed by line id; src/content/voice-script.ts gathers every game's lines into SCRIPT.
export const VOICE = {
  'game.peekaboo-barn': ['Peekaboo!'],

  'peek.free': ['Who is hiding? Tap to find out!'],
  'peek.found': ['{word}! Behind the {cover}, a {animal}!', "{word}! It's the {animal} behind the {cover}!"],
  'peek.feel': ['{word}! A {feeling} {animal}, behind the {cover}!', '{word}! The {animal} is {feeling}!'],
  'peek.look': ['Look who is hiding!', 'Look!'],
  'peek.where': ['Where is the {animal}?', 'Can you find the {animal}?'],
  'peek.yes': ['You found the {animal} behind the {cover}!', "There's the {animal}, behind the {cover}!"],
  'peek.notit': ["That's the {other}! Where is the {animal}?"],
  'peek.whofeels': ['Who is {feeling}?', 'Can you find the {feeling} one?'],
  'peek.whohas': ['Find the one with {part}!', 'Who has {part}?'],
  'peek.hasit': ['Yes! The {animal} has {part}!', 'The {animal} has {part}. You found it!'],
  'peek.feelsit': ['Yes! The {animal} is {feeling}!', 'You found the {feeling} {animal}!'],
  'peek.nothas': [
    "That's the {other}. The {other} has {fact}. Look for {part}!",
    'The {other} has {fact}! Who has {part}?',
  ],
  'peek.pair.ask': ['I have {first} and {second}. Who am I?'],
  'peek.pair.yes': ['Yes! The {animal} has {first} and {second}!'],
  'peek.pair.one': ['The {animal} has {fact}. It doesn’t have {missing}. Look for both together!'],
  'peek.pair.neither': ["That's the {animal}! Look for one with {first} and {second} together."],
  'peek.switch': ['Switch!', 'Switcheroo!'],
  'peek.watch': ['Watch the {animal} again!', 'Keep your eyes on the {animal}!'],
  'peek.notfeel': ["That's the {other}. Who is {feeling}?", 'Not the {other}. Look for the {feeling} one!'],
} satisfies Record<string, string[]>;
