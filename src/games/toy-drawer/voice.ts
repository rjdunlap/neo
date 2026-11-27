// What this game says, keyed by line id; src/content/voice-script.ts gathers every game's lines into SCRIPT.
export const VOICE = {
  'game.toy-drawer': ['Toy drawer, {name}!'],
  'toy-drawer.fit': [
    'Put every toy in the drawer! Drag a toy in. There is more than one right way. You can move them around.',
  ],
  'toy-drawer.turn': [
    'Put every toy in the drawer! Some will not fit until you turn them. Tap a toy, then tap the round arrow.',
  ],
  'toy-drawer.make-room': [
    'Some toys are in the drawer and one is waiting. Take one out and move it to make room!',
  ],
  'toy-drawer.ready': ['Every toy fits! Tap the green check to close the drawer.'],
  'toy-drawer.not-yet': ['Not quite yet. Some toys are still waiting outside.'],
  'toy-drawer.full': ['That place is full. Try another spot, or move a toy to make room.'],
  'toy-drawer.hint-place': ['This spot fits. Try it!'],
  'toy-drawer.move-one': ['Try moving this one to make room.'],
  'toy-drawer.no-room': ['That toy needs more room to turn. Try moving something first.'],
  'toy-drawer.closed': ['All the toys are tucked in!'],
} satisfies Record<string, string[]>;
