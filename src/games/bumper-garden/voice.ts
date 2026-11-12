// What this game says, keyed by line id; src/content/voice-script.ts gathers every game's lines into SCRIPT.
export const VOICE = {
  'game.bumper-garden': ['Bumper garden!'],
  'bumper.spring': ['Tap to send the ladybug up! Watch the flowers bloom.'],
  'bumper.grow': ['Touch anywhere! Send the ladybug up to the big flower.'],
  'bumper.bloom': ['Tap this side or that side to flip the ladybug back up. Make every flower bloom!'],
  'bumper.color': ['Bloom the {color} flowers!'],
  'bumper.not': ['Bloom every flower that is not {color}! Shh, the {color} ones are sleeping.'],
  'bumper.order': ['Bump the flowers in order. Find {n}!'],
  'bumper.start': ['Start at {n}! Bump the numbered flowers to count on, one more each time.'],
  'bumper.back': [
    'Start at {n}! Bump the numbered flowers to count back, one less each time, all the way to one.',
  ],
  'bumper.next': ['Now {n}!'],
  'bumper.again-color': ['Almost! Find the {color} flowers.'],
  'bumper.again-not': ['Almost! The {color} ones are asleep. Find a flower that is awake.'],
  'bumper.again-order': ['Where is {n}? Flip it up again!'],
  'bumper.hint': ['Watch! The ladybug will fly toward the glowing flower.'],
  'bumper.done': ['The whole garden is blooming!'],
} satisfies Record<string, string[]>;
