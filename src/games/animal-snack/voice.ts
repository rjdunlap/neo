// What this game says, keyed by line id; src/content/voice-script.ts gathers every game's lines into SCRIPT.
export const VOICE = {
  'game.animal-snack': ['Animal snack!'],
  'snack.munch': ['Who is hungry? Tap an animal to give it a snack!'],
  'snack.float': ['Tap a snack, and it goes to the animal who loves it!'],
  'snack.match': ['Give each animal its favorite snack. Drag it to the one who eats it!'],
  'snack.who': ['Who eats {food}? Tap the animal!'],
  'snack.whosound': ['Who says {sound}? Tap the animal!'],
  'snack.notme': ['That is the {animal}. Who says {sound}?'],
  'snack.count': ['Give the {animal} {n} {food}! Then ring the bell.'],
  'snack.yum': ['Yum! The {animal} loves {food}!', 'Munch munch! {food} for the {animal}!'],
  'snack.nothanks': ['No thank you! The {animal} eats {mine}. Who eats {food}?'],
  'snack.full': ['{n}! Thank you, says the {animal}!'],
  'snack.more': ['That is {have}. The {animal} wants {n}!'],
  'snack.toomany': ['That is too many! Only {n}, please. Here are the extras back.'],
  'snack.done': ['Everyone had a snack. Thank you!'],
} satisfies Record<string, string[]>;
