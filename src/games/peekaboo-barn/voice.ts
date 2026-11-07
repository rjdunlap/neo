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
} satisfies Record<string, string[]>;
