// What this game says, keyed by line id; src/content/voice-script.ts gathers every game's lines into SCRIPT.
export const VOICE = {
  'game.gear-garden': ['Gear garden!'],
  'gears.instruct.turn': ['Tap the machine to turn the flower!'],
  'gears.instruct.gap': ['A gear is missing. Put it in the gap, then turn!'],
  'gears.instruct.choose': ['Pick a machine to fix!'],
  'gears.still': ["The flower can't turn yet. Something isn't touching."],
  'gears.snap': ['Clunk! Now they touch.'],
  'gears.same': ['Your flower turns the same way as the handle!'],
  'gears.other': ['Your flower turns the other way!'],
  'gears.bloom': ['It bloomed!', 'Look, a flower!', 'Spin, spin, bloom!'],
  'gears.hint': ['Look at the gap. The gear goes there.'],
  'gears.done': ['Every flower bloomed. What a garden!'],
} satisfies Record<string, string[]>;
