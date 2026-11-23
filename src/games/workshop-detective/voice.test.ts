import { expect, it } from 'vitest';
import { SCRIPT } from '../../content/voice-script';
import {
  LINE,
  LOOKS,
  NOTES,
  OPENING,
  SETUPS,
  check,
  hintFor,
  hintWords,
  recordLines,
  tryOn,
  verdictWords,
  type Mark,
  type Marks,
  type Setup,
} from './logic';
import { VOICE } from './voice';

/** Every line id the case can speak: each look, record set, mark set, verdict and hint. */
function produced() {
  const ids = new Set<string>();
  const marks: Marks[] = ([null, 'fits', 'out'] as Mark[]).flatMap((P) =>
    ([null, 'fits', 'out'] as Mark[]).map((Q) => ({ P, Q })),
  );
  for (const look of LOOKS) {
    let all: Setup[][] = [[...OPENING]];
    for (const s of SETUPS) all = [...all, ...all.map((r) => tryOn(r, s).records)];
    for (const records of all) {
      for (const s of SETUPS) recordLines(look, s).forEach((id) => ids.add(id));
      for (const n of NOTES) ids.add(LINE.note(look.pair, n));
      for (const m of marks) {
        verdictWords(look, records, check(look, records, m)).lines.forEach((id) => ids.add(id));
        for (const opened of [false, true]) {
          const h = hintFor(look, records, m, opened);
          if (h) hintWords(look, records, h).lines.forEach((id) => ids.add(id));
        }
      }
    }
  }
  return ids;
}

it('has a spoken line for every verdict, explanation, record and hint, for both pairs and both true notes, and no unused lines', () => {
  const fixed = [
    'game.workshop-detective',
    'workshop-detective.start',
    'lamp.new',
    'lamp.tag',
    'lamp.latched',
    'lamp.repeat',
    'lamp.marks-fit',
  ];
  const want = new Set([...produced(), ...fixed]);
  const have = Object.keys(VOICE);
  expect([...want].filter((id) => !have.includes(id))).toEqual([]);
  expect(have.filter((id) => !want.has(id))).toEqual([]);
  // 17 lines a pair and 11 shared, the title and the instruction.
  expect(have.filter((id) => id.startsWith('lamp.shell.'))).toHaveLength(17);
  expect(have.filter((id) => id.startsWith('lamp.star.'))).toHaveLength(17);
  expect(have).toHaveLength(34 + 11 + 2);
});

it('keeps every line whole, with no slot, so each one gets a rendered clip, and puts them in the script', () => {
  for (const [id, variants] of Object.entries(VOICE)) {
    expect(variants, id).toHaveLength(1);
    expect(variants[0], id).not.toMatch(/[{}]/);
    expect((SCRIPT as Record<string, string[]>)[id], id).toEqual(variants);
  }
});

it('says the setups and notes in plain words', () => {
  const v = VOICE as Record<string, string[]>;
  expect(v['lamp.shell.setup.10']).toEqual(['Shell up, feather down.']);
  expect(v['lamp.star.note.moon']).toEqual(['The moon note: when the moon lever is up, the lamp is bright.']);
  expect(v['lamp.star.hint2']).toEqual([
    'Star up, moon down: the star note says bright, the moon note says dim. Try it.',
  ]);
});
