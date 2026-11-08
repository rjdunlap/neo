// What this game says, keyed by line id; src/content/voice-script.ts gathers every game's lines into SCRIPT.
export const VOICE = {
  'game.lantern-lights': ['Lantern lights!'],
  'lantern.go': [
    'Pressing a lantern flips it and the four lanterns beside it. Light every lantern on the pond.',
  ],
  'lantern.go-touch': [
    'Tap a lantern to flip it and the four lanterns beside it. Light every lantern on the pond.',
  ],
  'lantern.go-school': [
    'Tap a lantern. It flips, and so do the lanterns right next to it. Make every lantern glow!',
  ],
  'lantern.stuck-school': [
    'Tricky one! Tap the button with the diamond, and a lantern will glow to show you where.',
  ],
  'lantern.hint-one': ['There is only one short way. Try the glowing lantern.'],
  'lantern.hint-many': ['There are a few short ways. The glowing lantern is in one of them.'],
  'lantern.pads': [
    'Lily pads float in this pond. They have no lantern, so a press flips only the lanterns beside it.',
  ],
  'lantern.after': ['Tap the green arrow to go on, or the purple button to watch a short way.'],
  'lantern.lit': ['Every lantern is glowing!', 'The whole pond is aglow!'],
  'lantern.done': ['A pond full of light.'],
} satisfies Record<string, string[]>;
