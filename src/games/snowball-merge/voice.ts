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
  'snowball.go.snowman': [
    'Build a snowman! Slide and join the snowballs until just three are left, each one a 16. Two 16s join if they meet, so keep them apart.',
  ],
  'snowball.over': ['Two 16s joined. That is one join too many for this snowman. Undo takes the slide back.'],
  'snowball.done.snowman': [
    'A snowman! Three 16s, one on top of the other. You kept them apart until the end.',
  ],
  'snowball.rock': ['The ice rock never moves. Snowballs stop beside it.'],
  'snowball.restart': ['The starting snowballs are back. Try a new slide order.'],
  'snowball.done': ['One snowball with {target}! You brought them all together.'],
} satisfies Record<string, string[]>;
