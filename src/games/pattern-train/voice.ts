// What this game says, keyed by line id; src/content/voice-script.ts gathers every game's lines into SCRIPT.
export const VOICE = {
  'game.pattern-train': ['Pattern Train!'],
  'pattern.start': ['Look at the train. What comes in the glowing space?'],
  'pattern.tunnel': [
    'The train goes into the tunnel. {n} cars are hiding inside! Keep the pattern going. Which car comes out?',
  ],
  'pattern.pair': [
    'Watch the colors and the shapes. Each one has its own pattern. What belongs in the glowing car?',
  ],
  'pattern.colorRight': ['The color is right! Now look at the shape.'],
  'pattern.shapeRight': ['The shape is right! Now look at the color.'],
  'pattern.number': ['Count the numbered cars. What number belongs in the glowing car?'],
  'pattern.stairs': ['Each car has one more counter, {name}. How many counters go in the glowing car?'],
  'pattern.steps': ['Look at the stacks, {name}. How many counters go in the glowing car?'],
  'pattern.sound': [
    'Listen to the bells on the train. Which bell comes next? Tap a bell to listen, then tap the arrow.',
  ],
  'pattern.wrong': ['Try another one. Look and listen to the pattern!'],
  'pattern.hint': ['This one! Can you find one just like it?'],
  'pattern.odd': ['One car does not belong in this pattern. Can you find it? Tap it!'],
  'pattern.swap': ['One car is wrong. Can you find it? Tap it, then pick the piece that belongs.'],
  'pattern.fits': ['That one fits the pattern. Look for the one that does not.'],
  'pattern.oddHint': ['Listen to the train. Which car sounds different? It is glowing!'],
  'pattern.swapChoose': ['Yes, that car is wrong! What belongs there?'],
  'pattern.match': [
    'Look at the train on top. Which row makes the same pattern with different pieces? Tap it!',
  ],
  'pattern.build': ['Make the same pattern with the animals! Fill each glowing car.'],
  'pattern.rowWrong': ['Not that row. Does it repeat the same way as the train on top?'],
  'pattern.buildWrong': [
    'Look at the train on top. Is this car the same as the one before it, or different?',
  ],
  'pattern.buildHint': ['These cars on top play the same part. Try a green one!'],
  // Level 17: slotted lines stay on device speech until a clip pass renders fixed wording.
  'pattern.make': ['Make your own pattern, {name}! Tap up to three pieces, then press the green arrow.'],
  'pattern.made': ['{list}, again!'],
  'pattern.next': ['Yes! Now fill the next car!'],
  'pattern.why': ['Yes! The pattern goes {list}, over and over!'],
  'pattern.whyBells': ['Yes! The bells go {list}, over and over!'],
  // Slotted lines stay on device speech until a clip pass renders fixed wording.
  'pattern.count': ['{n}'],
  'pattern.whyStack': ['Yes! One more each time: {list}!'],
  'pattern.whyStep': ['Yes! {how} each time: {list}!'],
  'pattern.whyNumber': ['Yes! They count by {step}: {list}!'],
  // Level 21: find the rule, then the next number (slotted, so device speech).
  'pattern.rule': ['Each car adds the same amount, {name}. How much more is each car? Tap it.'],
  'pattern.ruleWrong': ['Count on from one car to the next, {name}. How many more?'],
  'pattern.ruleHint': ['From {from}: {list}. That is {step} more!'],
  'pattern.ruleRight': ['Yes! Add {step} each time. What number goes in the glowing car?'],
  'pattern.addWrong': ['Add {step} to {last}. Count on {step}!'],
  'pattern.whyAdd': ['Yes! Add {step} each time: {list}!'],
  'pattern.whyPair': ['Yes! The colors go {colors}, and the shapes go {shapes}!'],
  'pattern.oddWhy': ['The {piece} did not belong! Now it goes {list}, over and over.'],
} satisfies Record<string, string[]>;
