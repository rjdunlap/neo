// What this game says, keyed by line id; src/content/voice-script.ts gathers every game's lines into SCRIPT.
export const VOICE = {
  'game.letter-trails': ['Letter Trails!'],
  'trails.start': ['Follow the firefly to draw {letter}! Start at the glowing dot.'],
  'trails.stroke': ['Now follow this trail!'],
  'trails.wrong': ['Come back to the firefly. We can take our time.'],
  'trails.picture': ['{letter} is for {word}!'],
  'trails.word': ['Let us draw {word}!'],
  'trails.made': ['{word}! You drew {word}!'],
  'trails.name': ['You wrote your name, {name}!'],
  'trails.dots': ['Now draw {letter} again. Follow the dots!'],
  'trails.alone': [
    'One more {letter}, all by yourself! Start at the firefly and go the way the arrow points.',
  ],
} satisfies Record<string, string[]>;
