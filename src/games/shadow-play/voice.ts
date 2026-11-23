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

/**
 * Shadow Play's spoken lines. The cut-outs, marks and grid sizes are closed, so every size, miss explanation and hint
 * is a whole line with no slot and gets a rendered clip. A miss line exists for each rail, cut-out shape and height,
 * the mark it stands at and the mark the outline asks for; a hint line for each rail, shape, height and mark to slide
 * to. `voice.test.ts` checks that the level pools can produce every one of them and nothing else. Their ids are
 * computed, so they are not in the `LineId` union: the game casts the ids `logic.ts` builds.
 */
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

export const VOICE = {
  'game.shadow-play': ['Shadow Play!'],
  'shadow.start.lit': ['Slide the cut-outs until the shadow fills the outline.'],
  'shadow.start.dark': ['Set the cut-outs, then light the lamp.'],
  'shadow.next': ['One more skyline. Nearer the lamp is bigger.'],
  'shadow.hint.done': ['Every cut-out is in place. Tap Light.'],
  'shadow.done': ['The shadow fills the outline. The show begins!'],
  ...sizes,
  ...misses,
  ...hints,
};
