// What this game says, keyed by line id; src/content/voice-script.ts gathers every game's lines into SCRIPT.
export const VOICE = {
  'game.jelly-drums': ['Jelly drums!'],
  'jelly.free': ['Tap the jellies to make music!'],
  'jelly.echo': ['Listen to the jellies, then play the same tune!'],
  'jelly.echo.back': ['Listen to the jellies, then play the tune backwards!'],
  'jelly.back': ['Now play it backwards: the last jelly first!'],
  // Level 12 pairs: the slotted lines stay on device speech until a clip pass renders fixed wording.
  'jelly.compare': ['Listen to song {a} and song {b}!'],
  'jelly.song.n': ['Song {n}!'],
  'jelly.compare.ask': ['Is song {b} the same as song {a}?'],
  // Level 13: slotted lines stay on device speech until a clip pass renders fixed wording.
  'jelly.order': [
    'Who has the lowest voice, {name}? Tap to listen, then drag the lowest jelly to the lit spot!',
  ],
  'jelly.order.next': ['Who is next for spot {spot}?'],
  'jelly.order.dir': ['Try a {dir} one!'],
  'jelly.song.hot-cross-buns': ['This one is Hot Cross Buns!'],
  'jelly.song.mary': ['This one is Mary Had a Little Lamb!'],
  'jelly.song.jingle-bells': ['This one is from Jingle Bells!'],
  'jelly.listen': ['Listen!', 'Listen to the jellies!'],
  'jelly.name.red': ['Red! The biggest jelly sings the lowest.'],
  'jelly.name.orange': ['Orange! Big and low.'],
  'jelly.name.yellow': ['Yellow! Right in the middle.'],
  'jelly.name.green': ['Green! Little and high.'],
  'jelly.name.blue': ['Blue! The littlest jelly sings the highest.'],
  'jelly.lowhigh': ['Big jellies sing low. Little jellies sing high.'],
  'jelly.turn': ['Your turn!'],
  'jelly.which': ['Listen to the sound, then tap which jelly sang!'],
  'jelly.which.ask': ['Which one was that?'],
  'jelly.oops': ['Hmm, listen again!'],
  'jelly.nice': ['Beautiful!', 'You got it!', 'Lovely music!'],
} satisfies Record<string, string[]>;
