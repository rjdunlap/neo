/**
 * Crossword levels 5–6: the grown-ups' words and written clues (docs/definitions/crossword.md). Plain, family-friendly clues,
 * read aloud only on request; a clue never contains its own answer.
 */

/** Level 5: three of Word Search's everyday themes, each word with one written clue. */
export const CLUES_5: Readonly<Record<string, Readonly<Record<string, string>>>> = {
  farm: {
    barn: 'Big red building where the animals sleep',
    cow: 'She gives us milk and says moo',
    pig: 'Pink animal that loves a muddy roll',
    hen: 'She lays eggs and clucks',
    sheep: 'Woolly animal in a flock',
    goat: 'Animal with a beard that will nibble anything',
    horse: 'Animal you might ride, with a mane and hooves',
    tractor: 'Big-wheeled machine that pulls the plough',
    field: 'Open stretch of land for crops or grazing',
    hay: 'Dried grass, stacked in bales',
    milk: 'White drink from a cow',
    egg: 'What a hen lays',
    fence: 'It keeps the animals in the field',
    gate: 'Swing it open to get into the field',
  },
  kitchen: {
    spoon: 'You eat soup with it',
    fork: 'Pronged tool for eating',
    knife: 'Sharp tool for cutting',
    plate: 'Flat dish for dinner',
    bowl: 'Deep dish for cereal',
    whisk: 'Wire tool for beating eggs',
    oven: 'Hot box for baking',
    stove: 'Where the pans sit to cook',
    ladle: 'Big deep spoon for serving soup',
    tray: 'Flat board for carrying cups',
    kettle: 'It whistles when the water boils',
    toast: 'Bread browned in the morning',
    soup: 'Warm meal in a bowl, often with bread',
    jam: 'Sweet fruit spread on toast',
  },
  garden: {
    rose: 'Flower with thorns, often red',
    tulip: 'Cup-shaped spring flower',
    daisy: 'White flower with a yellow middle',
    seed: 'Plant it and it grows',
    soil: 'Dirt that plants grow in',
    bloom: 'What a flower does when it opens',
    worm: 'Wriggly digger under the ground',
    leaf: 'Green part of a plant that falls in autumn',
    stem: 'A flower stands on it',
    petal: 'One coloured part of a flower',
    bee: 'Buzzing insect that makes honey',
    hose: 'Long tube for watering',
    spade: 'Tool for digging holes',
    weed: 'Plant growing where it is not wanted',
    mint: 'Fresh-smelling herb for tea',
    basil: 'Green herb for pasta sauce',
  },
};

export interface Mini {
  id: string;
  /** Five rows of five, `#` a block. */
  rows: readonly string[];
  /** A clue for every across and down word in the grid. */
  clues: Readonly<Record<string, string>>;
}

/** Level 6: six frozen, fully checked minis. Blocks are symmetric when the grid turns half round. */
export const MINIS: readonly Mini[] = [
  {
    id: 'koala',
    rows: ['##key', '#hole', 'boast', 'isle#', 'tea##'],
    clues: {
      key: 'It opens a lock', hole: 'A rabbit lives down one', boast: 'Brag', isle: 'Small island', tea: 'Hot drink in a cup',
      bit: 'A small piece', hose: 'Garden watering tube', koala: 'Gum-tree climber from Australia', else: 'Otherwise', yet: 'So far',
    },
  },
  {
    id: 'toast',
    rows: ['##toe', '#pony', 'place', 'ease#', 'ant##'],
    clues: {
      toe: 'One of five on a foot', pony: 'Small horse', place: 'Spot or location', ease: 'Comfort, or to make lighter', ant: 'Tiny picnic visitor',
      pea: 'Little green ball in a pod', plan: 'Map out ahead of time', toast: 'Raise a glass to someone', once: 'One time', eye: 'You see with it',
    },
  },
  {
    id: 'haven',
    rows: ['##hat', '#wage', 'given', 'used#', 'men##'],
    clues: {
      hat: 'It keeps the sun off your head', wage: 'Pay for work', given: 'Handed over as a present', used: 'Not new, second-hand', men: 'Grown-up boys',
      gum: 'Something to chew', wise: 'Full of good sense, like an owl', haven: 'A safe, sheltered place', aged: 'Grown old', ten: 'Fingers on two hands',
    },
  },
  {
    id: 'trend',
    rows: ['lot##', 'earn#', 'trees', '#snap', '##dry'],
    clues: {
      lot: 'A great deal', earn: 'Get paid for working', trees: 'A wood is full of them', snap: 'Break with a crack', dry: 'Not wet',
      let: 'Allow', oars: 'Paddles for a rowing boat', trend: 'A new style everyone is following', near: 'Close by', spy: 'Watch in secret',
    },
  },
  {
    id: 'limit',
    rows: ['all##', 'soil#', 'humid', '#dime', '##ten'],
    clues: {
      all: 'Every one', soil: 'Garden earth', humid: 'Hot and sticky, like the air before a storm', dime: 'Ten-cent coin', ten: 'One more than nine',
      ash: 'What is left after a fire', loud: 'Not quiet', limit: 'The most allowed', lime: 'Small green citrus fruit', den: 'A fox or bear lives in one',
    },
  },
  {
    id: 'opera',
    rows: ['#old#', 'speed', 'peace', 'arrow', '#any#'],
    clues: {
      old: 'Not new', speed: 'How fast something goes', peace: 'Calm and quiet', arrow: 'It flies from a bow', any: 'Whichever one',
      spa: 'Place to relax with warm pools', opera: 'A play where everyone sings', learn: 'Find out how', decoy: 'A wooden duck that fools the real ones', dew: 'Morning drops on the grass',
    },
  },
];
