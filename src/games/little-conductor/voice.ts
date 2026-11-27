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
  'little-conductor.instruct-strength': [
    'Hear the small drum and the big drum, {name}, then pick the one you like and tap the green check.',
  ],
  'little-conductor.instruct-dials': [
    'Pick slow or fast, and soft or loud, {name}. Hear the ways you like, then tap the green check.',
  ],
  'little-conductor.instruct-friends': [
    'Tap a friend to ask them to play, {name}. Tap again to ask them to stop. Try different friends, then tap the green check.',
  ],
  'little-conductor.hear-other-friends': [
    'Now try a different group of friends, {name}. Tap a friend to ask them in or out!',
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
  'little-conductor.instruct-change': [
    'The listener has a sign with two ways to play, {name}. Set slow or fast and soft or loud to match it, then tap the green check.',
  ],
  'little-conductor.ask-turtle-gentle': ['The sign says slow and soft, {name}.'],
  'little-conductor.ask-turtle-strong': ['The sign says slow and loud, {name}.'],
  'little-conductor.ask-rabbit-gentle': ['The sign says fast and soft, {name}.'],
  'little-conductor.ask-rabbit-strong': ['The sign says fast and loud, {name}.'],
  'little-conductor.pick-both': ['Pick slow or fast, and soft or loud, first, {name}.'],
  'little-conductor.wrong-gentle': ['Look at the drum on the sign, {name}. Small and soft!'],
  'little-conductor.wrong-strong': ['Look at the drum on the sign, {name}. Big and loud!'],
  'little-conductor.hint-gentle': ['Try the glowing small drum, {name}. Soft!'],
  'little-conductor.hint-strong': ['Try the glowing big drum, {name}. Loud!'],
  'little-conductor.bow': ['What a band! They take a bow for you.', 'Lovely music! The band takes a bow.'],
} satisfies Record<string, string[]>;
