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
  'game.peekaboo-barn': ['Peekaboo!'],
  'game.duck-pond': ['Duck pond!'],
  'game.shape-sorter': ['Shapes!'],
  'game.color-garden': ['The color garden!'],
  'game.splish-splash': ['Bath time!'],

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

  'peek.free': ['Who is hiding? Tap to find out!'],
  'peek.found': ['{word}! A {animal}!', "{word}! It's the {animal}!"],
  'peek.look': ['Look who is hiding!', 'Look!'],
  'peek.where': ['Where is the {animal}?', 'Can you find the {animal}?'],
  'peek.yes': ['You found the {animal}!', "There's the {animal}!"],
  'peek.notit': ["That's the {other}! Where is the {animal}?"],

  'duck.along': ['Tap a duck to help it swim!'],
  'duck.total': ['{n} ducks!', '{n} ducks swimming!'],
  'duck.make': ['Put {n} in the pond!'],
  'duck.made': ["That's {n}!", 'Yes, {n}!'],
  'duck.extra': ["Oops, that's {count}! We need {n}."],
  'duck.howmany': ['How many ducks?', 'How many ducks are swimming?'],
  'duck.countus': ["Let's count together!"],
  'duck.more': ['{a} ducks are swimming. {b} more come!'],
  'duck.away': ['{a} ducks are swimming. {b} swim away!'],
  'duck.now': ['How many now?'],

  'shape.start': ['Put the shapes in the box!'],
  'shape.wrong': ["That's the {hole} hole. Try another one!"],
  'shape.done': ['All in! Yay!'],
  'shape.circle': ['Circle!'],
  'shape.square': ['Square!'],
  'shape.triangle': ['Triangle!'],
  'shape.star': ['Star!'],
  'shape.heart': ['Heart!'],
  'shape.hexagon': ['Hexagon!'],

  'garden.start': ['Put each one in the basket that matches!'],
  'garden.wrong': ['That one is {color}. Find the {color} basket!'],
  'garden.done': ['All sorted! What a garden!'],

  'bath.free': ['Pip is muddy! Scrub scrub!'],
  'bath.part': ['Wash my {part}!', 'Now wash my {part}!'],
  'bath.notthat': ["Hee hee! That's my {touched}! Wash my {part}!"],
  'bath.clean': ['Squeaky clean!', 'All clean! Thank you!'],

  'paint.pots': ['Pick a color and paint!'],
  'paint.rainbow': ['Rainbow!'],

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
