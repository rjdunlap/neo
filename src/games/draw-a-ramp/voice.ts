// What this game says, keyed by line id; src/content/voice-script.ts gathers every game's lines into SCRIPT.
export const VOICE = {
  'game.draw-a-ramp': ['Draw a ramp, {name}!'],
  'draw-a-ramp.intro': ['Draw a ramp for the marble!'],
  'draw-a-ramp.instruct-1': ['Draw a ramp to roll the marble to the star!'],
  'draw-a-ramp.instruct-2': ['Draw a path over the block!'],
  'draw-a-ramp.instruct-3': ['Send it past the shelf, then turn it back!'],
  'draw-a-ramp.draw-first': ['Draw a ramp first. Drag your finger on the board!'],
  'draw-a-ramp.drag-line': ['Drag a little longer to draw a ramp.'],
  'draw-a-ramp.full': ['That is all the ramps. Undo one to change it.'],
  'draw-a-ramp.short': ['It rolled past! Try a ramp that tips more.'],
  'draw-a-ramp.stalled': ['It got stuck in a dip. Try a straighter ramp.'],
  'draw-a-ramp.blocked': ['It bumped something. Try a ramp that goes around.'],
  'draw-a-ramp.hint': ['See the dashed ramp? Draw one like it!'],
  'draw-a-ramp.ready-go': ['That looks good. Press Go!'],
  'draw-a-ramp.pop': ['Pop! The star balloon!', 'Pop! You did it!'],
  'draw-a-ramp.done': ['Both balloons popped!'],
} satisfies Record<string, string[]>;
