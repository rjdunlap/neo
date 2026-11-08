// What this game says, keyed by line id; src/content/voice-script.ts gathers every game's lines into SCRIPT.
export const VOICE = {
  'game.pond-conga': ['Pond conga!'],
  'conga.go': [
    'Steer the ducklings to their food. If they bump something, the whole line turns about, and a bump counts as a step.',
  ],
  'conga.go-touch': [
    'Steer the ducklings to their food. Touch the pond to set off, then swipe to turn. If they bump something, the whole line turns about.',
  ],
  'conga.order': [
    'Three bites at once! Eat them in any order you like. The best order takes the fewest steps.',
  ],
  'conga.order-touch': [
    'Three bites at once! Eat them in any order you like: touch the pond to set off, then swipe to turn. The best order takes the fewest steps.',
  ],
  'conga.steps': [
    'Step by step! The ducklings wait for you. Press a direction for each step to their food. If they bump something, the whole line turns about.',
  ],
  'conga.steps-touch': [
    'Step by step! The ducklings wait for you. Swipe for one step that way, or touch the pond for a step straight on. If they bump something, the whole line turns about.',
  ],
  'conga.go-school': [
    'Help the ducklings find their food! Swipe, or tap where they should go. They take one step each time.',
  ],
  'conga.bonk-school': ["Boing! Something's in the way. Try another way."],
  'conga.yum.peas': ['Yum, peas!', 'Peas, please!'],
  'conga.yum.sweetcorn': ['Yum, sweetcorn!', 'Crunchy corn!'],
  'conga.yum.oats': ['Yum, oats!', 'Oats for the ducklings!'],
  'conga.bonk': ['Bonk! The conga turns about.'],
  'conga.hint': ['Follow the yellow dots to the next bite.'],
  'conga.pond': ['Every bite is gone!', 'What a happy conga!'],
  'conga.done': ['A well-fed conga.'],
} satisfies Record<string, string[]>;
