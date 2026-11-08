// What this game says, keyed by line id; src/content/voice-script.ts gathers every game's lines into SCRIPT.
export const VOICE = {
  'game.rain-garden': ['Rain garden!'],
  'rain.instruct.1': ['Tap the cloud to make it rain on the garden.'],
  'rain.instruct.2': ['Pick the ground for each garden, then tap the cloud. Both get the same rain.'],
  'rain.instruct.3': ['Tap the cloud. Then change the ground and rain again.'],
  'rain.soil': ['The garden soil held two drops. The other two ran down to the pond.'],
  'rain.stone': ["Stone can't hold any rain. All four drops ran down to the pond."],
  'rain.pair': ['Same rain on both. The soil kept some; the stone kept none.'],
  'rain.pair.same': ['Same ground, same rain, same result.'],
  'rain.compare': [
    'Before, with stone, the pond got four. Now, with soil, it got two. The ground made the difference.',
  ],
  'rain.compare.back': [
    'Before, with soil, the pond got two. Now, with stone, it got four. The ground made the difference.',
  ],
  'rain.compare.same': ['The same ground, the same rain. It came out the same.'],
  'rain.again': ['Fresh, dry garden. Ready for more rain.'],
  'rain.done': ["Tap the leaf when you're all done."],
  'rain.hint.cloud': ['Tap the cloud to make it rain.'],
  'rain.hint.tile': ['Tap this ground to change it. Then rain again.'],
  'rain.instruct.4': [
    'The leaf bed needs two drops, and the pond needs some too. Tap a bed to change its ground. Tap the cloud to try it, then tap the check.',
  ],
  'rain.route.stone-soil': [
    'The stone kept none, so all four ran down. The low soil kept two, and two reached the pond.',
  ],
  'rain.route.soil-stone': ['The top soil kept two. The other two ran past the stone to the pond.'],
  'rain.route.soil-soil': ['The top soil kept two and the low soil kept two. None reached the pond.'],
  'rain.route.stone-stone': ["Stone can't hold any. All four ran past both beds to the pond."],
  'rain.miss.dry': ['Boing. The leaf bed stayed dry. Look where the water stayed.'],
  'rain.miss.pond': ['Boing. The pond got none. The beds kept every drop.'],
  'rain.glow': ['Look at the glowing bed. Try the other ground there.'],
  'rain.check.yes': ['The leaf bed kept two, and the pond got some. Both needs met!'],
  'rain.hint.flip': ['I changed this bed. Tap the cloud to try it.'],
  'rain.hint.check': ['That works! Tap the check.'],
} satisfies Record<string, string[]>;
