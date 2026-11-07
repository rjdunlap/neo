// What this game says, keyed by line id; src/content/voice-script.ts gathers every game's lines into SCRIPT.
export const VOICE = {
  'game.adventure-walk': ['Adventure walk!'],
  'walk.instruct-pick': ["Let's walk to {friend}'s picnic! Which way shall we go?"],
  'walk.instruct-follow': ["Let's walk to {friend}'s picnic! Listen for the way to go."],
  'walk.call.one': ['Come {way}!'],
  'walk.call.two': ['Come {first}, then {second}!'],
  'walk.went': ['{text}!'],
  'walk.other': ["That's {took}. Come {asked}!"],
  'walk.hint-glow': ['Look, this way!'],
  'walk.arrive': ['You made it! {friend} saved you a sandwich.'],
} satisfies Record<string, string[]>;
