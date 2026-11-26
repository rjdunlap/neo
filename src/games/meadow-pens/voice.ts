import { LOFT, MISSING, baleCount, lengthOf } from './factor-logic';

const WORDS = [
  'zero',
  'one',
  'two',
  'three',
  'four',
  'five',
  'six',
  'seven',
  'eight',
  'nine',
  'ten',
  'eleven',
  'twelve',
  'thirteen',
  'fourteen',
  'fifteen',
  'sixteen',
  'seventeen',
  'eighteen',
  'nineteen',
  'twenty',
  'twenty-one',
  'twenty-two',
  'twenty-three',
  'twenty-four',
];
const word = (n: number) => WORDS[n];
const cap = (s: string) => s[0].toUpperCase() + s.slice(1);
/** "Three, six, nine, twelve" for the running counts of a strip `step` rows tall up to `to`. */
const running = (step: number, to: number) =>
  Array.from({ length: to / step }, (_, i) => (i === 0 ? cap(word(step)) : word(step * (i + 1)))).join(', ');
const rowsWord = (n: number) => `${cap(word(n))} rows`;

/** Levels 6 and 7: one exact line per authored case, quantities as words (the speech clips are built from these). */
const FACTOR_LINES = Object.fromEntries([
  ...MISSING.flatMap((c) => {
    const len = lengthOf(c);
    return [
      [
        `meadow.ask6.${c.id}`,
        [
          `There are ${word(c.total)} squares of grass in ${word(c.rows)} rows. How many squares long is the strip?`,
        ],
      ],
      [
        `meadow.try6.${c.id}.short`,
        [
          `${rowsWord(c.rows)}, ${word(len - 1)} columns: ${word(c.rows * (len - 1))} squares. We need ${word(c.total)}.`,
        ],
      ],
      [
        `meadow.try6.${c.id}.many`,
        [`${cap(word(len))} columns make ${word(c.total)}. That card is too many.`],
      ],
      [`meadow.lift6.${c.id}`, [`${running(c.rows, c.total)}. ${cap(word(len))} columns.`]],
    ];
  }),
  ...LOFT.flatMap((c) => [
    [
      `meadow.ask7.${c.id}`,
      [
        `Each tray holds ${word(baleCount(c))} bales. The loft is ${word(c.layers)} trays tall. How many bales fill it?`,
      ],
    ],
    [
      `meadow.stack7.${c.id}`,
      [
        `${Array.from({ length: c.layers }, (_, i) => cap(word(baleCount(c) * (i + 1)))).join('. ')} bales altogether.`,
      ],
    ],
  ]),
]) as Record<string, string[]>;

// What this game says, keyed by line id; src/content/voice-script.ts gathers every game's lines into SCRIPT.
export const VOICE = {
  'game.meadow-pens': ['Meadow pens!'],
  'meadow.instruct.1': [
    'Paint squares of grass for a pen. Make it as big as your friend asks, then ring the bell.',
  ],
  'meadow.instruct.2': [
    'How many squares of grass will cover the whole field? Count the rows, then tap a card.',
  ],
  'meadow.instruct.3': [
    'Paint the squares of grass, and use every fence piece on the stack. Then ring the bell.',
  ],
  'meadow.instruct.4': [
    'Look at both pens. Listen for grass or fence, then choose a pen, or choose the same.',
  ],
  'meadow.instruct.5': [
    'The bent field has two parts. Count the squares in both parts, then choose a card for all the grass.',
  ],
  'meadow.instruct.6': [
    'The grass is under the blanket. Count the rows, then choose how many squares long it is.',
  ],
  'meadow.instruct.7': [
    'Fill the loft. One tray holds the bales on the floor. Count the trays, then choose how many bales fill it.',
  ],
  'meadow.blanket6': ['The rest of the grass is under here.'],
  'meadow.bales7': ['{n} bales on one tray.'],
  ...FACTOR_LINES,
  'meadow.ask4.grass': ['Which pen has more squares of grass?'],
  'meadow.ask4.fence': ['Which pen needs more fence pieces?'],
  'meadow.ask5': ['How many squares of grass cover the whole field?'],
  'meadow.choice4.daisy': ['The pen with the daisy.'],
  'meadow.choice4.tulip': ['The pen with the tulip.'],
  'meadow.choice4.same': ['Both have the same.'],
  'meadow.grass-one': ['One square of grass here.'],
  'meadow.grass-total': ['{n} squares of grass here.'],
  'meadow.fence-total': ['{n} fence pieces here.'],
  'meadow.same-grass': ['Both pens have the same number of squares of grass.'],
  'meadow.same-fence': ['Both pens need the same number of fence pieces.'],
  'meadow.more.daisy.grass': ['The daisy pen has more squares of grass.'],
  'meadow.more.tulip.grass': ['The tulip pen has more squares of grass.'],
  'meadow.more.daisy.fence': ['The daisy pen needs more fence pieces.'],
  'meadow.more.tulip.fence': ['The tulip pen needs more fence pieces.'],
  'meadow.parts5.L1': ['Six squares here. Two more here. Eight squares altogether.'],
  'meadow.parts5.L2': ['Eight squares here. Two more here. Ten squares altogether.'],
  'meadow.parts5.L3': ['Nine squares here. One more here. Ten squares altogether.'],
  'meadow.parts5.L4': ['Eight squares here. Four more here. Twelve squares altogether.'],
  'meadow.parts5.L5': ['Ten squares here. Three more here. Thirteen squares altogether.'],
  'meadow.parts5.L6': ['Twelve squares here. Six more here. Eighteen squares altogether.'],
  'meadow.fence5': ['Those are fence pieces. We are counting squares of grass.'],
  'meadow.hint-fixed': ['Watch the count. The glowing card works. Touch a card and I will help.'],
  'meadow.fixed-all': ['Five questions, and everyone is ready. Thank you!'],
  'meadow.ask': ['I need {n} squares of grass!', 'Please, {n} squares of grass!'],
  'meadow.ask3': ['Six squares of grass, and use all {n} fence pieces!'],
  'meadow.flower': ['Join me to the grass!'],
  'meadow.empty': ['Paint some grass, then ring the bell.'],
  'meadow.count': ['{have}. I need {want}.'],
  'meadow.fence-left': ['{have} pieces. {k} are left on the stack.'],
  'meadow.fence-more': ['{have} pieces. The fence needs {k} more pieces.'],
  'meadow.field-ask': ['How many squares of grass will cover the whole field?'],
  'meadow.hint': ['Try the glowing pen.'],
  'meadow.hint-card': ['Count the rows: try the glowing card.'],
  'meadow.in': ['Thank you! What a lovely pen!', 'A lovely pen! Thank you!'],
  'meadow.field-in': ['The whole field is grass! Thank you!'],
  'meadow.all': ['Everyone has a pen!'],
} satisfies Record<string, string[]>;
