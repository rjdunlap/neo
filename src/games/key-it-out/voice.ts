/**
 * Key It Out's spoken lines (docs/definitions/key-it-out.md). The parts, names and faults are closed, so every line is a
 * whole line with no slots and renders as a clip; the sketch numbers and names of a fault or hint are on the screen
 * note, which is fuller than the speech. `voice.test.ts` checks a line exists for everything a board can produce.
 */
import {
  HABITS,
  HABIT_VALUES,
  NAMES,
  PARTS,
  VALUES,
  barredWords,
  cellLine,
  cellWords,
  habitWords,
  noteLine,
  noteWords,
  questionWords,
  shownWords,
} from './logic.ts';

const fixed = {
  'game.key-it-out': ['Key It Out'],
  'key.start': ['Name every sketch from the guide.'],
  'key.stamped': ['Three right. The warden stamps them.'],
  'key.locked': ['That one is stamped already.'],
  'key.done': ['Every sketch has its name.'],
  'key.hint.one-name': ['Only one name still fits this sketch.'],
  'key.hint.one-sketch': ['Only this sketch can take this name.'],
  'key.hint.note': ['A note and the table settle this sketch.'],
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
HABITS.forEach((habit, h) =>
  HABIT_VALUES[habit].forEach((value, v) => {
    lines[cellLine(h, v)] = [`${cellWords(h, v)}.`];
    lines[noteLine(h, v)] = [noteWords(h, v)];
    HABIT_VALUES[habit].forEach((other, w) => {
      if (w !== v)
        lines[`key.fault.${habit}.${value}.${other}`] = [
          `The table says this one ${habitWords(h, v)}. The note says it ${habitWords(h, w)}.`,
        ];
    });
  }),
);
for (const name of NAMES) lines[`key.name.${name.toLowerCase()}`] = [`${name}.`];

export const VOICE = { ...fixed, ...lines };
