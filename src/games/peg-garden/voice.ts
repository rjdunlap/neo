// What this game says, keyed by line id; src/content/voice-script.ts gathers every game's lines into SCRIPT.
export const VOICE = {
  'game.peg-garden': ['Peg garden!'],
  'peg.drop': ['Tap the top to drop a pearl!'],
  'peg.bloom': ['Drop pearls and make all the flowers bloom!'],
  'peg.big': ['Drop a pearl on the big flowers and watch them bloom!'],
  'peg.color': ['Find the orange flowers! Make them bloom.'],
  'peg.next': ['Now hit {n}!'],
  'peg.missed': ['So close! Try for {n} again.'],
  'peg.miss': ['Try a different spot!'],
  'peg.cup': ['Drag to aim, then let go. Put the pearl in the cup with {n}!'],
  'peg.cupNext': ['Now the cup with {n}!'],
  'peg.cupMissed': ['That cup has {got}. Try for {n}!'],
  'peg.plant': ['Plant a bud so the pearl rolls into the cup! Drag a seed onto a ring, then tap the pearl.'],
  'peg.plantLook': ['See where it rolls? Plant a bud to push it to the cup!'],
  'peg.plantMissed': ['Not in the cup yet. Move a bud and try again!'],
  'peg.done': ['What a beautiful garden!'],
} satisfies Record<string, string[]>;
