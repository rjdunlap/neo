/**
 * Key It Out's spoken lines (docs/definitions/key-it-out.md). The parts, names and faults are closed, so every line is a
 * whole line with no slots and renders as a clip; the sketch numbers and names of a fault or hint are on the screen
 * note, which is fuller than the speech. `voice.test.ts` checks a line exists for everything a board can produce.
 */
import { NAMES, PARTS, VALUES, barredWords, questionWords, shownWords } from './logic.ts';

const fixed = {
  'game.key-it-out': ['Key It Out'],
  'key.start': ['Name every sketch from the guide.'],
  'key.stamped': ['Three right. The warden stamps them.'],
  'key.locked': ['That one is stamped already.'],
  'key.done': ['Every sketch has its name.'],
  'key.hint.one-name': ['Only one name still fits this sketch.'],
  'key.hint.one-sketch': ['Only this sketch can take this name.'],
};

const lines: Record<string, string[]> = {};
PARTS.forEach((part, p) =>
  VALUES[part].forEach((value, v) => {
    lines[`key.q.${part}.${value}`] = [questionWords(p, v)];
    lines[`key.fault.${part}.no.${value}`] = [
      `The key reaches this name through ${barredWords(p, v)}. This one has ${shownWords(p, v)}.`,
    ];
    VALUES[part].forEach((shown, w) => {
      if (w !== v)
        lines[`key.fault.${part}.yes.${value}.${shown}`] = [
          `The key reaches this name through ${shownWords(p, v)}. This one has ${shownWords(p, w)}.`,
        ];
    });
  }),
);
for (const name of NAMES) lines[`key.name.${name.toLowerCase()}`] = [`${name}.`];

export const VOICE = { ...fixed, ...lines };
