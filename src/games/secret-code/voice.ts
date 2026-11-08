// What this game says, keyed by line id; src/content/voice-script.ts gathers every game's lines into SCRIPT.
export const VOICE = {
  'game.secret-code': ['Secret code!'],
  'code.yesno': [
    'Tap stones to fill the slots, then turn the key. A green check means the right stone is in the right place. Gray means try another stone there.',
  ],
  'code.yellow': [
    'Green means right stone, right place. Yellow means that stone is in the code, but in another slot. Gray means no more of that stone.',
  ],
  'code.detective': [
    'Your friend tried these stones already. Look at all the marks to work out the one code that fits. Tap stones to fill the slots, then turn the key. Green means right place, yellow means another place, and gray means no more of that stone.',
  ],
  'code.contradiction': [
    'That try does not fit all the clues. Look at the stones and marks your friend left above the door.',
  ],
  'code.repeat': ['Careful, this door is tricky: a color can be used twice!'],
  'code.oneslot': [
    'One stone is hiding behind the door. Tap a stone, then turn the key. A green check opens the door. A gray cross means not that one.',
  ],
  'code.notthis': [
    'Not that one! See the gray cross? Try another stone.',
    'Gray cross: it is not that one. Pick another stone!',
  ],
  'code.crossed': ['That stone has a cross. We know it is not behind the door. Try another one!'],
  'code.onehint': ['Look! The glowing stone is behind the door.'],
  'code.fill': ['Fill every slot first, then turn the key.'],
  'code.green': ['{g} green!'],
  'code.marks': ['{g} green and {y} yellow.'],
  'code.ignored': ['Look back at the marks: they already showed us the {color} stone does not go there.'],
  'code.hint': ['Here is an idea that fits every clue so far.'],
  'code.open': ['Click! The door opened!', 'You cracked the code!'],
  'code.done': ['Every door is open! What a code cracker!'],
  'code.maker': [
    'This time you are the door! Make a secret code: tap three stones, then tap the check. I will try to crack it.',
  ],
  'code.another': ['Make me another secret code, then tap the check.'],
  'code.makefill': ['Fill every slot with a stone, then tap the check.'],
  'code.markit': [
    'Is it this? Tap the circle under each of my stones to give it a mark. Green: right stone, right place. Yellow: that stone is in your code, but in another place. Gray: no more of that stone. Then tap the arrow.',
  ],
  'code.pettry': ['Hmm, is it this?', 'Let me try this one.'],
  'code.markall': ['Give every stone a mark first.'],
  'code.sure': ['Are you sure about that {color} stone? Look at your code again.'],
  'code.cracked': [
    'I cracked your code! Thank you for the good marks.',
    'Click! Your marks helped me find it!',
  ],
  'code.seats': [
    'Who is playing with you? Tap the two friends to play with a grown-up, or tap my face to play with me.',
  ],
  'code.lookaway': [
    'Grown-up, shut your eyes! Now make a secret code: tap three stones, then tap the check.',
  ],
  'code.grownupbreak': ['Grown-up, open your eyes! Put stones in the door, then turn the key.'],
  'code.markgrownup': [
    'Give each of the grown-up’s stones its mark: green, yellow or gray. Then tap the arrow.',
  ],
  'code.nopeek': ['Grown-up, look away until the marks are done. No peeking!'],
  'code.swap': ['Swap seats! Now you shut your eyes while the grown-up makes a code.'],
  'code.crackit': ['Open your eyes! Can you crack the grown-up’s code? Fill the slots, then turn the key.'],
} satisfies Record<string, string[]>;
