// What this game says, keyed by line id; src/content/voice-script.ts gathers every game's lines into SCRIPT.
export const VOICE = {
  'game.trackway-tales': ['Trackway tales!'],
  'trackway-tales.intro': [
    'Something walked here before the mud dried. How did it move? Tap Play on a card to see.',
  ],
  'trackway-tales.instruct-replay': ['Tap Play on a card first, then drag the gray walker back and forth.'],
  'trackway-tales.instruct-choose': [
    'When a card leaves prints just like the mud, tap the card to put it on the board, then tap Check.',
  ],
  'trackway-tales.instruct-toes': [
    'Which way did it go? Look at the toes. Tap Play on each card, then pick the one that fits.',
  ],
  'trackway-tales.instruct-puddle': [
    'A puddle covers the middle. Can the marks still tell us how it moved? Tap Play on each card to see.',
  ],
  'trackway-tales.mud-dried': ['Soft mud kept the marks, then it dried hard.'],
  'trackway-tales.toe-right': ['The toes point this way. It was going right.'],
  'trackway-tales.toe-left': ['The toes point this way. It was going left.'],
  'trackway-tales.extra-mark': ['Look here. This way leaves a mark the mud does not have.'],
  'trackway-tales.missing-mark': ['Look here. The mud has a mark this way does not make.'],
  'trackway-tales.wrong-toe': ['Same place, but its toes point the other way. Look at the toes.'],
  'trackway-tales.both-fit': [
    'This one fits. But look, this one fits too. Standing still leaves no mark. Can we tell which?',
  ],
  'trackway-tales.cant-tell-wrong': [
    'Look after the puddle. Only one card leaves those marks, so the marks can tell.',
  ],
  'trackway-tales.empty-slot': ['Pick a card first. Tap it to put it on the board.'],
  'trackway-tales.fits-walk': ['One foot, then the other. It walked!'],
  'trackway-tales.fits-hop': ['Both feet together. It hopped!'],
  'trackway-tales.fits-back': ['It went that way, toes first!'],
  'trackway-tales.fits-switch': ['It walked, then it hopped. Every mark fits!'],
  'trackway-tales.fits-cant-tell': [
    "Two ways fit these marks. We can't tell which, and that's a real answer.",
  ],
  'trackway-tales.hint-look-here': ['Look at the glowing place on both strips. The glowing card fits there.'],
  'trackway-tales.done': ['We read the mud like detectives. Good looking, {pet}!'],
} satisfies Record<string, string[]>;
