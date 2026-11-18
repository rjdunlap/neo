// What this game says, keyed by line id; src/content/voice-script.ts gathers every game's lines into SCRIPT.
export const VOICE = {
  'game.gem-swap': ['Gem Swap!'],
  'gem-swap.go': [
    'Tap a gem, then its neighbour. Make a line of three matching shapes. The gems above fall into the gaps. Clear the tray!',
  ],
  'gem-swap.long': [
    'Tap a gem, then its neighbour. Every shortest way to clear this tray needs one swap that makes four or five in a line, or two lines crossing. Find it!',
  ],
  'gem-swap.stones': [
    'Tap a gem, then its neighbour. Make a line of three matching shapes. The grey stones never move, so the gems above a stone fall onto it. Clear the gems!',
  ],
  'gem-swap.ice': [
    'Tap a gem, then its neighbour. Make a line of three matching shapes. A frosty gem cannot be swapped until a line clears right beside it. Clear the tray!',
  ],
  'gem-swap.iced': ['That gem is frozen. Clear a line beside it first.'],
  'gem-swap.stone': ['That grey stone stays put. Swap the gems around it.'],
  'gem-swap.miss': ['That swap makes no line. Look for three matching shapes in a row or column.'],
  'gem-swap.hint': ['Swap the two outlined gems. This starts a way to clear the tray.'],
  'gem-swap.stuck': [
    'These gems have no clearing route. Undo a swap, or restart this tray to try another plan.',
  ],
  // School (levels 1 and 2): the same four moments in a child's words.
  'gem-swap.go-school': [
    'Tap a gem, then the gem next to it, and they swap places. Line up three of the same shape and they pop! The gems above fall down. Can you clear the whole tray?',
  ],
  'gem-swap.miss-school': [
    'That swap did not line up three. Look for two of the same shape with a third one close by.',
  ],
  'gem-swap.hint-school': ['Try swapping the two gems with the orange rings.'],
  'gem-swap.stuck-school': [
    'These gems cannot all pop from here. Tap the Undo arrow to take a swap back, or the round arrow to start the tray again.',
  ],
  'gem-swap.restart': ['The starting gems are back. Try a different plan.'],
  'gem-swap.done': ['The tray is clear!'],
} satisfies Record<string, string[]>;
