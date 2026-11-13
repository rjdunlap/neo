// What this game says, keyed by line id; src/content/voice-script.ts gathers every game's lines into SCRIPT.
export const VOICE = {
  'game.egg-catch': ['Egg catch!'],
  'egg.lane': ['Tap under the clucking hen! The basket hops there to catch her egg.'],
  'egg.under': ['Here, under me! Tap under the clucking hen.'],
  'egg.tap': ['Tap a hen! Her egg rolls into the basket.'],
  'egg.onehen': ['Touch anywhere, and the hen lays an egg!'],
  'egg.brown': ['Catch the brown eggs! Let the white eggs fall in the hay.'],
  'egg.onegate': ['Tap the gate to point toward the basket. Then tap the green arrow!'],
  'egg.route': ['Tap the gates so the egg rolls into the basket. Then tap the green arrow!'],
  'egg.repair': [
    'I sent an egg into the hay. Follow the dotted path, fix one gate, then tap the green arrow to try again. Brown goes to the basket; white goes to the nest.',
  ],
  'egg.flipflop': [
    'The spring gate flips itself after each egg. Set the gates for brown to the basket, then white to the nest. Both start at the top. Tap the green arrow when you are ready.',
  ],
  'egg.flipped': ['The spring flipped! The white egg takes the other branch.'],
  'egg.pair': [
    'Set the gates for both eggs. Brown goes to the basket, white goes to the nest. Tap the green arrow when you are ready. The gates stay still while both roll.',
  ],
  'egg.pairretry': ['Let us try that pair again. Follow both paths: brown to the basket, white to the nest.'],
  'egg.sort': [
    'Brown eggs go in the basket. White eggs go to the nest. Tap the gates, then tap the green arrow!',
  ],
  'egg.white': ['Oops, that one is white! White eggs hatch in the hay.'],
  'egg.peep': ['Peep! Slide under the next one.'],
  'egg.wrongway': ['Oops! It rolled the other way. Peep!'],
  'egg.predict': ['The gates are already set. Where will the egg land? Tap the hay, then watch it roll!'],
  'egg.predictwrong': ['It went another way! Follow the gates: each one sends the egg the way it points.'],
  'egg.done': ['Peep! All the chicks are here!', 'Look at our little chicks!'],
} satisfies Record<string, string[]>;
