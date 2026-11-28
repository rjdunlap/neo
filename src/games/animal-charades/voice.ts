// What Animal Charades says, keyed by line id; src/content/voice-script.ts gathers every game's lines into SCRIPT.
// `{name}` is her name, `{a}` an animal and `{does}` its motion word ("hops"), so every line carries a slot and stays on
// device speech. The Peek card has no line at all: nothing is spoken or played while it is open. No line says right,
// wrong, correct or mistake; "Watch again!" is the only correction.
export const VOICE = {
  'game.animal-charades': ['Who is moving, {name}?'],
  'animal-charades.start': ['{name}, do you want to play with the pet, or with a friend next to you?'],
  'animal-charades.ask-guess': ['Watch how it moves, {name}. Who is it?'],
  'animal-charades.ask-friend': ['Your friend acts it out, {name}. Then pick who it is.'],
  'animal-charades.wrong': ['A {a} {does}. Watch again, {name}!'],
  'animal-charades.hint': ['Look at this one, {name}.'],
  'animal-charades.reveal': ['It was the {a}, {name}! The {a} {does}.'],
  'animal-charades.show-me': ['Here it is, {name}. A {a}.'],
  'animal-charades.swap': ['Your turn, {name}. Show me an animal any way you like.'],
  'animal-charades.pet-guess': ['Is it a {a}, {name}?'],
  'animal-charades.pet-found': ['I got it, {name}!'],
  'animal-charades.pet-reveal': ['It was the {a}, {name}!'],
  'animal-charades.finish': ['What a lot of ways to move, {name}!'],
};
