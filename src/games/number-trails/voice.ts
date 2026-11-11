// What this game says, keyed by line id; src/content/voice-script.ts gathers every game's lines into SCRIPT.
export const VOICE = {
  'game.number-trails': ['Number trails!'],
  'nt.start': ['Follow the firefly to draw {n}! Start at the glowing dot.'],
  'nt.stroke': ['Now follow this trail!'],
  'nt.dots': ['Now draw {n} again. Follow the dots!'],
  'nt.alone': ['One more {n}, all by yourself! Start at the glowing dot and go the way the arrow points.'],
  'nt.wrong': ['Come back to the firefly. We can take our time.'],
  'nt.count': ['{n}!'],
  'nt.made': ['{n} {things}!', 'That is {n} {things}!'],
  'nt.zero': ['Zero! There are no {things}.'],
  'nt.how-many': ['How many {things}? Tap each one to count them.'],
  'nt.basket': ['How many {things} are in the basket?'],
  'nt.which': ['Which number tells how many {things}? Tap it!'],
  'nt.recount': ['Let us count them again together.'],
  'nt.wake': ['Wake up {n} {things}! Count as you tap.'],
} satisfies Record<string, string[]>;
