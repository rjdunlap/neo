// What this game says, keyed by line id; src/content/voice-script.ts gathers every game's lines into SCRIPT.
export const VOICE = {
  'game.snowball-merge': ['Snowball Merge!'],
  'snowball.go': [
    'Tap an arrow to slide the snowballs. Matching numbers join and double. Make one snowball with {target}!',
  ],
  'snowball.still': ['Nothing moves that way. Try another arrow.'],
  'snowball.left': ['Try the glowing left arrow. It starts a way to finish.'],
  'snowball.up': ['Try the glowing up arrow. It starts a way to finish.'],
  'snowball.right': ['Try the glowing right arrow. It starts a way to finish.'],
  'snowball.down': ['Try the glowing down arrow. It starts a way to finish.'],
  'snowball.stuck': [
    'These snowballs need a different plan. Try Undo, or Start over to bring the starting snowballs back.',
  ],
  'snowball.restart': ['The starting snowballs are back. Try a new slide order.'],
  'snowball.done': ['One snowball with {target}! You brought them all together.'],
} satisfies Record<string, string[]>;
