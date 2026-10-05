/**
 * Every line the game speaks, keyed by id. Arrays are variations picked at random.
 * `{name}` is the child's name; other `{words}` are filled in by the caller.
 * This is also the script for recording parents' voices later.
 */
export const SCRIPT = {
  'start.hi': ['Hi, {name}!', 'Hello, {name}!', 'Yay, {name} is here!'],
  'hub.pick': ['What should we play?', 'Pick a game!', "Let's play!"],
  'hub.again': ['What next?', 'Ooh, what now?'],
  'poke.pip': ['Hee hee!', 'That tickles!', 'Boop!', 'Hi!'],

  'game.bubble-pop': ['Bubbles!'],
  'game.jelly-drums': ['Jelly drums!'],
  'game.rainbow-fingers': ["Let's paint!"],
  'game.stickers': ['Your stickers!'],

  praise: ['Yay!', 'You did it!', 'Wow!', 'Great job, {name}!', 'Hooray!'],
  sticker: ['A sticker for you!', 'You got a sticker!'],
  again: ['Again?', 'Play again?'],

  'sleepy.warn': ["I'm getting sleepy. One more game!"],
  'sleepy.night': ['Goodnight, {name}. Sweet dreams!'],

  'bubble.free': ['Pop the bubbles!', 'Bubbles! Pop pop pop!'],
  'bubble.color': ['Pop the {color} bubbles!'],
  'bubble.wrong': ["That one's {wrong}. Find {color}!"],
  'bubble.count': ['Pop the numbers in order. Find one!'],
  'bubble.find': ['Find {n}!'],
  'bubble.rainbow': ['A rainbow bubble! Pop it!'],

  'jelly.free': ['Tap the jellies to make music!'],
  'jelly.listen': ['Listen!', 'Listen to the jellies!'],
  'jelly.turn': ['Your turn!'],
  'jelly.oops': ['Hmm, listen again!'],
  'jelly.nice': ['Beautiful!', 'You got it!', 'Lovely music!'],

  'paint.start': ['Paint with your finger!'],
  'paint.done': ["I love it! Let's hang it up!", 'Beautiful painting!'],

  'color.red': ['Red!'],
  'color.orange': ['Orange!'],
  'color.yellow': ['Yellow!'],
  'color.green': ['Green!'],
  'color.blue': ['Blue!'],
  'color.purple': ['Purple!'],
  'color.teal': ['Teal!'],
  'color.pink': ['Pink!'],
  'color.white': ['White!'],
  'color.brown': ['Brown!'],
  count: ['{n}!'],
} satisfies Record<string, string[]>;

export type LineId = keyof typeof SCRIPT;
