import {
  CUTOUTS,
  MARKS,
  RAILS,
  SHAPES,
  hintWords,
  missWords,
  scaleAt,
  sizeLine,
  sizeWords,
} from './logic.ts';

/** The rule helpers and this finite line list use the same rail, fault and hint keys. */
type Lines = Record<string, string[]>;

const sizes: Lines = Object.fromEntries(CUTOUTS.map((c) => [sizeLine(c), [sizeWords(c)]]));
const misses: Lines = {};
const hints: Lines = {};

for (const rail of RAILS)
  for (const shape of SHAPES)
    for (const h of [1, 2])
      for (const want of MARKS) {
        hints[`shadow.hint.${rail}.mark.${shape}${h}.${want}`] = [hintWords(rail, shape, h, want)];
        for (const mark of MARKS) {
          if (mark === want) continue;
          const fault = mark < want ? 'tall' : 'short';
          misses[`shadow.miss.${rail}.${fault}.${shape}${h}.${mark}.${h * scaleAt(want)}`] = [
            missWords(rail, fault, shape, h, mark, h * scaleAt(want)),
          ];
        }
      }

const checks: Lines = {};
const faults = {
  shape: 'is the wrong shape',
  tall: 'is too tall',
  short: 'is too short',
  wide: 'is too wide',
  narrow: 'is too narrow',
};
for (const rail of RAILS) {
  for (const [fault, words] of Object.entries(faults))
    checks[`shadow.check.${rail}.${fault}`] = [
      `The ${rail} shadow ${words}. Compare the shadow and the outline on the grid.`,
    ];
  for (const { shape, w, h } of CUTOUTS)
    hints[`shadow.hint.swap.${rail}.${shape}${w}${h}`] = [
      `Find the ${shape} that is ${w} wide and ${h} tall. Swap it onto the ${rail} rail.`,
    ];
  for (const width of [2, 3, 4, 6, 8, 12]) {
    hints[`shadow.hint.turn.${rail}.${width}.out`] = [
      `The ${rail} outline is ${width} wide. Tap that cut-out to face the screen at its full width.`,
    ];
    if (width % 2 === 0)
      hints[`shadow.hint.turn.${rail}.${width}.in`] = [
        `Face-on, the ${rail} shadow would be ${width} wide. It needs to be ${width / 2}. Tap the cut-out to turn it.`,
      ];
  }
}

export const VOICE = {
  'game.shadow-play': ['Shadow Play!'],
  'shadow.start.lit': ['Slide the cut-outs until the shadow fills the outline.'],
  'shadow.start.dark': ['Set the cut-outs, then light the lamp.'],
  'shadow.start.turn': [
    'Set the marks, then tap a cut-out to turn it and halve its shadow’s width. Tap Light to check.',
  ],
  'shadow.start.swap': [
    'Tap two chips to swap their cut-outs. Set the marks and turns, then tap Light to check.',
  ],
  'shadow.next': ['One more skyline. Nearer the lamp is bigger.'],
  'shadow.hint.done': ['Every cut-out is in place. Tap Light.'],
  'shadow.done': ['The shadow fills the outline. The show begins!'],
  ...sizes,
  ...misses,
  ...checks,
  ...hints,
};
