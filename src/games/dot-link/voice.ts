// What this game says, keyed by line id; src/content/voice-script.ts gathers every game's lines into SCRIPT.
export const VOICE = {
  'game.dot-link': ['Dot link!'],
  'dots.tap': ['Tap the dots to pop them!'],
  'dots.pair': ['Draw a line between two dots of the same color!'],
  'dots.buddy': ['Find the two dots that wiggle. Draw a line from one buddy to the other!'],
  'dots.buddyhint': ['Look for the wiggly dots! Join those two buddies.'],
  'dots.color': ['Pop {n} {color} dots!'],
  'dots.chain': ['Make a chain of {n} dots!'],
  'dots.exact': ['Make a line of exactly {n} dots!'],
  'dots.square': ['Make a square! Go all the way around four dots of one color.'],
  'dots.notthat': ["That's {wrong}! Pop the {color} dots."],
  'dots.longer': ['Longer! Try {n} in a row.'],
  'dots.around': ['Go all the way around to make a square!'],
  'dots.done': ['Pop pop hooray!'],
} satisfies Record<string, string[]>;
