// What this game says, keyed by line id; src/content/voice-script.ts gathers every game's lines into SCRIPT.
export const VOICE = {
  'relay-woods.title': ['Relay Woods!'],
  'relay-woods.one': ['Tap the next friend. Pass the picture to {friend}.'],
  'relay-woods.two': ['Follow the paths to {friend}. Either way works.'],
  'relay-woods.three': ['The log blocks a path. Find a clear way to {friend}.'],
  'relay-woods.four': ['Can you get to {friend} in fewer hops?'],
  'relay-woods.not-next': ['Not next yet. Follow a path to the next friend.'],
  'relay-woods.unjoined': ['Those friends have no path between them.'],
  'relay-woods.blocked': ['That path is blocked. Try a clear path.'],
  'relay-woods.arrived': ['The picture arrived!'],
  'relay-woods.long': ['That was {n} hops. There is a way with {few}. Try again.'],
  'relay-woods.hint': ['Follow this clear path.'],
  'relay-woods.reset-hint': ["Let's start again for fewer hops. Tap the blue arrow."],
} satisfies Record<string, string[]>;
