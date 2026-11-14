// What this game says, keyed by line id; src/content/voice-script.ts gathers every game's lines into SCRIPT.
export const VOICE = {
  'game.rainbow-fingers': ["Let's paint!"],

  'paint.start': ['Paint with your finger!', 'Swoosh your finger on the paper!', 'Your finger is the brush!'],
  'paint.done': ["I love it! Let's hang it up!", 'Beautiful painting!', 'Up on the wall it goes!'],

  'paint.pots': ['Pick a color and paint!'],
  'paint.fold': ['Paint one side. Then press fold!'],
  'paint.folded': ['Squish… open! It matches!', 'Look, two sides the same!', 'A butterfly print!'],
  'paint.rainbow': ['Rainbow!'],
  'paint.ask': ['Paint the {thing} {color}!'],
  'paint.what': ['Paint the {thing}! What color is it?'],
  'paint.mix': ['Paint the {thing} {color}! Mix {a} and {b}.'],
  'paint.remix': ['Now the {thing}! Think: what color is it? Then mix it!'],
  'paint.mixhow': ['Mix {a} and {b} to make {color}!'],
  'paint.pick': ['Find the {color} pot!'],
  'paint.wrong': ["That's {wrong}. The {thing} is {color}!"],
  'paint.finished': ['What a picture!', 'All colored in!', 'Every one painted!'],
  'paint.praise': ['Beautiful {color}!', 'You painted the {thing}!', 'Lovely {color}!'],
  'paint.also.apple.green': ['Green apples are real too!'],
  'paint.also.grapes.green': ['Green grapes are real too!'],
} satisfies Record<string, string[]>;
