// What this game says, keyed by line id; src/content/voice-script.ts gathers every game's lines into SCRIPT.
export const VOICE = {
  'game.stamp-studio': ['Stamp studio!'],
  'stamp.pats': ['Pat the paper! Pat, pat, pat!'],
  'stamp.stars': ['Tap the paper to press your stamp! The green arrow finishes your picture.'],
  'stamp.friends': ['Choose a stamp, then tap the paper! The green arrow finishes your picture.'],
  'stamp.picture': [
    'Choose a stamp and a color, then tap the paper. Drag your stamps to arrange them. Finish with the green arrow.',
  ],
  'stamp.sizes': ['Make a picture! Touch a stamp to choose it, then turn it or make it big or small.'],
  'stamp.garden': [
    'What grows in your imaginary garden? Make any picture you like! Tell me about it, then tap the green arrow.',
  ],
  'stamp.story': [
    'Make a picture of two friends on an adventure. Your story can be anything! Finish with the green arrow.',
  ],
  'stamp.kind': ['{kind}! Tap the paper to stamp it.'],
  'stamp.full': [
    'Your paper has lots of stamps! Undo a stamp with the back arrow, or finish with the green arrow.',
  ],
  'stamp.done': ['You made your own picture!'],
  'stamp.leaf': ['Pat the mud! The leaf leaves its shape.'],
  'stamp.leafmark': ['Look! The leaf left its shape in the mud.'],
  'stamp.feet': ['Tap a foot, then tap the mud to make a footprint!'],
  'stamp.foot': ['{kind}! Tap the mud.'],
  'stamp.pair': ['Duck prints and paw prints! Each foot leaves its own shape.'],
  'stamp.printsdone': ['Look at all your prints in the mud!'],
} satisfies Record<string, string[]>;
