// What this game says, keyed by line id; src/content/voice-script.ts gathers every game's lines into SCRIPT.
export const VOICE = {
  'swap-meet.title': ['Swap Meet!'],
  'swap-meet.one': ['{friend} wants the {thing}. Give {friend} the {thing}. {friend} gives you a {returned}.'],
  'swap-meet.two': ['Give each friend the thing in their picture. See what comes back.'],
  'swap-meet.three': ["Find two friends who want each other's things. Swap them."],
  'swap-meet.four': ['Our friend wants a {goal}. Trade what you carry to get it.'],
  'swap-meet.inspect': ['{friend} has the {thing}. {friend} wants the {want}.'],
  'swap-meet.object': ['The {thing}.'],
  'swap-meet.reject': ['{friend} wants the {want}.'],
  'swap-meet.reciprocal': ['{friend} wants the {want}. {other} wants the {otherWant}.'],
  'swap-meet.accept': ['The {thing} for the {returned}. Both things trade places.'],
  'swap-meet.undo': ["Let's trade back."],
  'swap-meet.hint': ['Give the {thing} to {friend}.'],
  'swap-meet.hint-pair': ['Swap {friend} and {other}.'],
  'swap-meet.hint-undo': ['Use the back arrow to trade back.'],
  'swap-meet.done': ['Everyone made a swap!'],
  'swap-meet.goal': ['You traded for the {goal}!'],
} satisfies Record<string, string[]>;
