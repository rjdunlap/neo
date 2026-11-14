// What this game says, keyed by line id; src/content/voice-script.ts gathers every game's lines into SCRIPT.
export const VOICE = {
  'game.splish-splash': ['Bath time!'],

  'bath.free': ['{pet} is {messy}! Scrub scrub!'],
  'bath.pat': ['{pet} is {messy}! Pat pat pat!'],
  'bath.part': ['Wash {part}!', 'Now wash {part}!'],
  'bath.notthat': ["Hee hee! That's my {touched}! Wash {part}!"],
  'bath.notthose': ['Hee hee! Those are my {touched}! Wash {part}!'],
  'bath.two': ['Wash {a} and {b}!'],
  'bath.order': ['First wash {a}, then {b}!'],
  'bath.first': ['First {a}! Then {b}.'],
  'bath.named': ['My {part}!'],
  'bath.cleanpart': ['Clean {part}!', 'Shiny clean {part}!'],
  'bath.toy': ['A {toy}!', 'My {toy}! Squeak!'],
  'bath.clean': ['Squeaky clean!', 'All clean! Thank you!'],
} satisfies Record<string, string[]>;
