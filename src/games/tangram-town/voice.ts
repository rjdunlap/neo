// What this game says, keyed by line id; src/content/voice-script.ts gathers every game's lines into SCRIPT.
export const VOICE = {
  'game.tangram-town': ['Tangram town!'],
  'tangram.covers': [
    'Build a house! Its wall can be one square or two triangles. Either way works. Leave the spare shapes in the tray.',
  ],
  'tangram.covered': ['That wall already has its shapes. Leave this spare in the tray.'],
  'tangram.cover-done': [
    'Your house is ready! You used {count} shapes. A square and two triangles can cover the same wall.',
  ],
  'tangram.repair': [
    'One shape faces the wrong way! Tap a shape, turn it with the round arrow, then tap the green check. Look at its outline.',
  ],
  'tangram.repair-check': ['The shapes match their outlines. Tap the green check!'],
  'tangram.repair-hint': ['This glowing shape faces the wrong way. Turn it to match its outline.'],
  'tangram.repair-try': [
    'A shape still faces the wrong way. Look at the outlines, then turn and check again.',
  ],
  'tangram.repaired': ['You repaired the {picture}! Its shapes match their outlines now.'],
  'tangram.flip': [
    'One slanted shape is the wrong way round! Tap it. Turn it with the round arrow or flip it with the purple arrows, then tap the green check.',
  ],
  'tangram.flip-hint': [
    'This glowing shape is the wrong way. Try the flip, or a turn, to match its outline.',
  ],
  'tangram.flip-try': [
    'That slanted shape still leans the wrong way. A turn cannot make a mirror, but a flip can. Try again.',
  ],
  'tangram.flipped': ['You fixed the {picture}! Flipping made a mirror that turning never could.'],
  'tangram.fit': ['Build a {picture}! Drag each shape onto the shadow.'],
  'tangram.turn': [
    'Build a {picture}! Choose a shape, then tap the round arrow to turn it. The yellow button helps.',
  ],
  'tangram.try': ['Try another shape or turn. Look at the edges of the shadow.'],
  'tangram.help': ['I turned this shape for you. Move it onto the glowing place.'],
  'tangram.done': ['Your {picture} is ready!'],
  'tangram.square': ['A square.'],
  'tangram.triangle': ['A triangle.'],
  'tangram.rectangle': ['A rectangle.'],
  'tangram.trapezoid': ['A trapezoid.'],
  'tangram.parallelogram': ['A parallelogram.'],
} satisfies Record<string, string[]>;
