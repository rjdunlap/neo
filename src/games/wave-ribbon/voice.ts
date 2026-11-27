// What this game says, keyed by line id; src/content/voice-script.ts gathers every game's lines into SCRIPT.
export const VOICE = {
  // Wave Ribbon: a pulse runs along a ribbon; the bead rises and settles in place while the wave reaches the flag.
  'game.wave-ribbon': ['Wave Ribbon!'],
  'wave-ribbon.instruct.1': ['Tap Send. Watch the bead and the flag.'],
  'wave-ribbon.instruct.2': ['Send a small pulse and a tall pulse. Then pick the matching picture.'],
  'wave-ribbon.observe-first': ['Tap Send and watch the pulse reach the flag.'],
  'wave-ribbon.need-both': ['Send both small and tall first, so you can compare them.'],
  'wave-ribbon.pick-card': ['Tap a picture first, then press Check.'],
  'wave-ribbon.wrong-height': ['Watch how high the bead goes on this pulse.'],
  'wave-ribbon.wrong-sideways': ['The bead goes up and down in place. Only the wave travels.'],
  'wave-ribbon.ready-done': ['You got it! Tap the tick when you are done.'],
} satisfies Record<string, string[]>;
