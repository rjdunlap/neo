// What this game says, keyed by line id; src/content/voice-script.ts gathers every game's lines into SCRIPT.
export const VOICE = {
  'game.chain-reaction': ['Chain reaction!'],
  'chain.start': [
    'Drag every loose ramp into a round spot. Then tap the green arrow and watch the {cargo}. Can you get the {cargo} to the {goal}?',
  ],
  'chain.chime-start': [
    'Build the machine so the marble touches the little chime, then rings the big bell. Drag the ramps, then tap the green arrow!',
  ],
  'chain.parts': ['Every loose ramp needs a round spot before the marble can go.'],
  'chain.hint': ['Try the glowing ramp in the glowing spot.'],
  'chain.run-now': ['That machine can work! Tap the green arrow to try it.'],
  'chain.left': ['The {cargo} finished left of the {goal}. Move one ramp and try again!'],
  'chain.right': ['The {cargo} finished right of the {goal}. Move one ramp and try again!'],
  'chain.missed-chime': [
    'The marble reached the bottom, but it missed the little chime. Move one ramp and try again!',
  ],
  'chain.rang': ['Hooray! The whole machine worked, and the {cargo} got there!'],
  'chain.done': ['What a marvelous machine!'],
  'chain.turn-start': [
    'Tap a coloured ramp to turn it. Then tap the green arrow and see if the {cargo} reaches the {goal}!',
  ],
  'chain.turn-hint': ['Turn this glowing ramp. Follow its groove to see where the {cargo} will go.'],
  'chain.predict-start': [
    'This machine is all built. Which bell will the marble ring? Tap that bell, then tap the green arrow and watch!',
  ],
  'chain.predict-first': ['First tap the bell you think the marble will ring.'],
  'chain.predict-hint': [
    'Put your finger on the marble and follow its way down. Each ramp sends it to the side its groove points.',
  ],
  'chain.predict-right': ['Ding! You knew which bell it would ring!'],
  'chain.predict-other': [
    'Ding! The marble rang this bell. Follow the red trail to see how the ramps sent it there.',
  ],
  'chain.two-start': [
    'Two marbles share this machine! Drag the ramps so the red marble rings the red bell and the blue marble rings the blue bell. Then tap the green arrow!',
  ],
  'chain.two-red': [
    'The blue marble rang its bell, but the red marble missed the red bell. Follow its trail, move a ramp and try again!',
  ],
  'chain.two-blue': [
    'The red marble rang its bell, but the blue marble missed the blue bell. Follow its trail, move a ramp and try again!',
  ],
  'chain.two-both': [
    'Both marbles missed their bells. Follow the red and blue trails, move a ramp and try again!',
  ],
  'chain.two-rang': ['Ding, ding! Each marble rang its own bell!'],
  'chain.spring-start': [
    'This machine has a green spring! When the {cargo} lands on it, it bounces over the next row. Drag the ramps so the {cargo} lands on the spring, then tap the green arrow!',
  ],
  'chain.spring-hint': [
    'Try the glowing ramp in the glowing spot. It sends the {cargo} onto the spring, and the spring bounces it over a row.',
  ],
  'chain.spring-hint-bell': [
    'Try the glowing ramp in the glowing spot. After the spring, it sends the {cargo} on to the {goal}.',
  ],
  'chain.gate-start': [
    'The little chime opens the yellow gate! Drag the ramps so the marble touches the chime first, then the gate ramp sends it on to the big bell. Tap the green arrow to try!',
  ],
  'chain.gate-shut': [
    'The marble reached the yellow gate before the chime, so the gate stayed shut and it fell straight through. Send it to the little chime first!',
  ],
  'chain.gate-hint': [
    'Try the glowing ramp in the glowing spot. It sends the marble to the little chime, and the chime opens the gate.',
  ],
  'chain.gate-hint-bell': [
    'Try the glowing ramp in the glowing spot. After the chime and the gate, it sends the marble on to the bell.',
  ],
} satisfies Record<string, string[]>;
