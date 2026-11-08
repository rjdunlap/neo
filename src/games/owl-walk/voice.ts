// What this game says, keyed by line id; src/content/voice-script.ts gathers every game's lines into SCRIPT.
export const VOICE = {
  'game.owl-walk': ['Owl walk home!'],
  'owl.one': ['Help the little owl walk home to the nest! Tap the cards to turn one over.'],
  'owl.turns': [
    'The baby owls want to go home to their nest. You are the purple owl and I am the brown owl. Let us take turns! Your turn: tap the cards.',
  ],
  'owl.choose': [
    'Three owls want to go home! Turn over a card, tap the owl you want to hop, then tap its stone. We take turns.',
  ],
  'owl.farthest': [
    'Turn over a card. Then choose the owl that hops the farthest, and tap its stone, so everyone gets home sooner!',
  ],
  'owl.color': ['{color}!'],
  'owl.tap-stone': ['Now tap the next {color} stone ahead of the owl.'],
  'owl.pick-owl': ['Tap the owl you want to hop with the {color} card.'],
  'owl.no-match': ['No {color} stones are left ahead! The owl flies home. Tap the nest.'],
  'owl.flip-first': ['Tap the cards first!'],
  'owl.home': ['Home in the nest!'],
  'owl.my-turn': ['My turn!'],
  'owl.pet-look': ['{need}! The next one is right there.'],
  'owl.pet-nest': ['No {color} stones are left, so my owl flies home!'],
  'owl.pet-move': ['{color}! I will hop this owl. It goes {n}.'],
  'owl.your-turn': ['Your turn! Tap the cards.'],
  'owl.not-farthest': ['That owl would hop {a} stones. Another owl can hop {b}!'],
  'owl.wrong-color': ['That one is {have}. We need a {need}.'],
  'owl.far': ['A {need}! But is there one closer? Hop to the next one.'],
  'owl.behind': ['The owl only walks forward. Look ahead for the next {color} stone!'],
  'owl.occupied': ['A friend is sitting there! Find the next free {color} stone.'],
  'owl.early-nest': ['There is still a {color} stone ahead. Find it first!'],
  'owl.together': ['Let us hop together!'],
  'owl.all-home': ['Everyone is home! We did it together. Good morning, sun!'],
} satisfies Record<string, string[]>;
