// What this game says, keyed by line id; src/content/voice-script.ts gathers every game's lines into SCRIPT.
export const VOICE = {
  'game.rhythm-neighbors': ['Rhythm neighbors!'],
  'neighbors.free': [
    'Tap the woodpecker to hear a call and an answer. Tap a frog to join in! The green arrow finishes our song.',
  ],
  'neighbors.knock': ['Knock, knock! Tap the big tree and a frog answers.'],
  'neighbors.take': ['The woodpecker knocks, then it is your turn! Tap the glowing frog to answer.'],
  'neighbors.call': ['You be the woodpecker! Knock on the tree, then stop and listen. The frog answers you.'],
  'neighbors.call-again': ['Knock another call!'],
  'neighbors.my-turn': ['Your turn! Tap the glowing frog.'],
  'neighbors.turns': [
    'The bird calls, then the frogs answer. Listen, then play the frog pictures from left to right. Tap the green arrow when ready.',
  ],
  'neighbors.your-turn': ['Your turn! Play the frog reply.'],
  'neighbors.again': ['Let us listen to that reply again. Follow the frog pictures.'],
  'neighbors.help': ['Follow the glowing frog, at your own pace. Then tap the green arrow.'],
  'neighbors.duet': ['We made a song together! Tap the frogs to sing along.'],
  'neighbors.pause': ['Take your time. Start the reply again from the first frog.'],
} satisfies Record<string, string[]>;
