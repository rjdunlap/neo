// What this game says, keyed by line id; src/content/voice-script.ts gathers every game's lines into SCRIPT.
export const VOICE = {
  'game.little-conductor': ['Little conductor!'],
  'little-conductor.intro': ["Here's your little band, {name}!", 'Your band is ready, {name}!'],
  'little-conductor.instruct-tap': [
    "Tap the turtle or the rabbit, and they'll play. Turtle is slow, rabbit is fast. Then tap the green check.",
  ],
  'little-conductor.instruct-both': [
    'Hear it slow and hear it fast, then pick the one you like and tap the green check.',
  ],
  'little-conductor.hear-whole': [
    'Listen to the whole tune, then tap the check.',
    'Hear the whole tune first, then tap the check.',
  ],
  'little-conductor.hear-other': ['Now hear the other way too. Tap the other pad!'],
  'little-conductor.instruct-sign': [
    'The listener has a sign. Tap the pad the sign shows, then tap the green check.',
  ],
  'little-conductor.request-turtle': ['The sign shows the turtle: slow and steady.'],
  'little-conductor.request-rabbit': ['The sign shows the rabbit: quick and light.'],
  'little-conductor.wrong-turtle': [
    'The sign says turtle: slow and steady.',
    'Look, the sign shows the turtle. Slow!',
  ],
  'little-conductor.wrong-rabbit': [
    'The sign says rabbit: quick and light.',
    'Look, the sign shows the rabbit. Fast!',
  ],
  'little-conductor.pick-first': ['Pick a pad first.', 'Tap the turtle or the rabbit first.'],
  'little-conductor.match': ['Just like the sign!', 'That matches!'],
  'little-conductor.hint-turtle': ['Try the glowing turtle. Slow and steady.'],
  'little-conductor.hint-rabbit': ['Try the glowing rabbit. Quick and light.'],
  'little-conductor.bow': ['What a band! They take a bow for you.', 'Lovely music! The band takes a bow.'],
} satisfies Record<string, string[]>;
