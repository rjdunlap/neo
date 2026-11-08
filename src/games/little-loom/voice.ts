// What this game says, keyed by line id; src/content/voice-script.ts gathers every game's lines into SCRIPT.
export const VOICE = {
  'loom.title': ['Little Loom!'],
  'loom.zoom': ['Tap to send the shuttle across!'],
  'loom.yarn': ['Pick a yarn. Tap the shuttle to make a scarf!'],
  'loom.pedals': ['Press a pedal, then tap the shuttle. Next row, use the other pedal!'],
  'loom.choose-pedal': ['Press a pedal to lift some threads.'],
  'loom.send': ['Now tap the shuttle.'],
  'loom.slip-repeat': ['That row slipped. On our island loom, use the other pedal for the next row.'],
  'loom.help': ['This pedal lifts the other threads. Try it, then tap the shuttle.'],
  'loom.color': ['{color} yarn.'],
  'loom.done': ['A scarf you made!'],
} satisfies Record<string, string[]>;
