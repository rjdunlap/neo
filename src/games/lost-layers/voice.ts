// What this game says, keyed by line id; src/content/voice-script.ts gathers every game's lines into SCRIPT.
export const VOICE = {
  'game.lost-layers': ['Lost layers!'],
  'lost-layers.intro': [
    'Two cliffs, same island. Lower is older. The {first} and the {top} already line up. Where does this mud go? The wavy lines are rock the sea took, so leave room.',
  ],
  'lost-layers.instruct-slide': [
    'Slide the mud piece up or down. Green means a fossil sits beside its twin.',
  ],
  'lost-layers.instruct-fits': ['When everything is green, tap It fits.'],
  'lost-layers.tie-green': ['They line up!'],
  'lost-layers.wavy-squeezed': ["The wavy line says rock is missing here. Leave at least one layer's room."],
  'lost-layers.picture-off-twin': [
    'That fossil is not beside its twin. The same picture means the same time.',
  ],
  'lost-layers.out-of-order': ['Layers stay in order. Lower is older, so this piece goes above that one.'],
  'lost-layers.fits-mud': ['This fits! Then this mud is {creature} time, and no {creature} was kept in it.'],
  'lost-layers.fits-gap': ['This fits! Then {creature} time is in the rock the sea took.'],
  'lost-layers.already-stamped': ['We already have that story. Is there another way it fits?'],
  'lost-layers.instruct-tell': [
    'Is there another way it fits? Then tell me: can the rocks say which story is true?',
  ],
  'lost-layers.maybe-another': ['Maybe. Is there another way it fits? Try sliding the mud.'],
  'lost-layers.other-fits-too': ['Look, this fits too. Two stories fit the rocks.'],
  'lost-layers.both-still-fit': ['Two stories fit. Can the rocks tell us which?'],
  'lost-layers.cant-tell-right': [
    "Right. Both fit, so these rocks can't say. Not finding a fossil doesn't mean nothing lived.",
  ],
  'lost-layers.look-intro': [
    'Two stories fit. Could one more look tell them apart? Tap a look to see what it looks at, then drag one into the slot and tap Look.',
  ],
  'lost-layers.preview-mud': ['This look peeks inside the plain mud piece.'],
  'lost-layers.preview-wavy': ["That's where the sea took the rock. Nothing is left to see there."],
  'lost-layers.preview-shell': ['This look peeks at the bottom piece, with the {creature}.'],
  'lost-layers.look-wavy-nothing': ["The rock is gone, so this look can't tell us."],
  'lost-layers.look-shell-known': [
    'More {creature}! We already matched that one, so it cannot tell the stories apart.',
  ],
  'lost-layers.stripe-found': [
    'A dark stripe! The same ash fell on the whole island in one day. So this mud is {creature} time.',
  ],
  'lost-layers.stripe-missing': [
    'No dark stripe in this mud. The ash fell everywhere on one day, so this mud is not {creature} time. That time is in the gap.',
  ],
  'lost-layers.not-yet-look': ['Not yet. Could a closer look tell us? Pick a look.'],
  'lost-layers.claim-right-mud': ['Yes. The stripe puts {creature} time in this mud, not in the gap.'],
  'lost-layers.claim-right-gap': [
    'Yes. No stripe in the mud, so {creature} time is in the rock the sea took.',
  ],
  'lost-layers.claim-wrong': ['Look at the stripe tie. It goes red there. That story does not fit any more.'],
  'lost-layers.hint-slide': ['Try the mud piece on the glowing row, then tap It fits.'],
  'lost-layers.hint-look': ['The glowing look peeks inside the mud. Drag it into the slot and tap Look.'],
  'lost-layers.hint-claim': ['Tap the glowing answer.'],
  'lost-layers.done': ['We read two cliffs together. Good thinking, {pet}!'],
} satisfies Record<string, string[]>;
