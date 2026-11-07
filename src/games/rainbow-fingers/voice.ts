// What this game says, keyed by line id; src/content/voice-script.ts gathers every game's lines into SCRIPT.
export const VOICE = {
  'game.rainbow-fingers': ["Let's paint!"],

  'paint.start': ['Paint with your finger!'],
  'paint.done': ["I love it! Let's hang it up!", 'Beautiful painting!'],

  'paint.pots': ['Pick a color and paint!'],
  'paint.fold': ['Paint one side. Then press fold!'],
  'paint.folded': ['Squish… open! It matches!', 'Look, two sides the same!', 'A butterfly print!'],
  'paint.rainbow': ['Rainbow!'],
  'paint.ask': ['Paint the {thing} {color}!'],
  'paint.what': ['Paint the {thing}! What color is it?'],
  'paint.mix': ['Paint the {thing} {color}! Mix {a} and {b}.'],
  'paint.remix': ['Paint the {thing}! What color is it?'],
  'paint.mixhow': ['Mix {a} and {b} to make {color}!'],
  'paint.pick': ['Find the {color} pot!'],
  'paint.wrong': ["That's {wrong}. The {thing} is {color}!"],
  'paint.finished': ['What a picture!', 'All colored in!'],
} satisfies Record<string, string[]>;
