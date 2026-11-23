import { expect, it } from 'vitest';
import { SCRIPT } from '../../content/voice-script';
import {
  KINDS,
  NAMES,
  check,
  hintFor,
  hintLine,
  missLine,
  pool,
  sentenceLine,
  solutions,
  type Board,
  type Domain,
  type Kind,
  type Name,
  type PoolId,
} from './logic';
import { VOICE } from './voice';

const seatings = (seats: number): Name[][] => {
  const out: Name[][] = [];
  const go = (sofar: Name[]) => {
    if (sofar.length === seats) out.push(sofar);
    else for (const name of NAMES) if (!sofar.includes(name)) go([...sofar, name]);
  };
  go([]);
  return out;
};

/** Every line id the level pools can ask for: each board, seating and mark state. */
function produced() {
  const ids = new Set<string>();
  for (const id of ['gate-flat', 'gate-chained', 'bridge'] as PoolId[])
    for (const pattern of pool(id)) {
      const solution = solutions(pattern)[0];
      const states = pattern.reduce<Domain[][]>(
        (all) => all.flatMap((m) => [null, ...KINDS].map((d) => [...m, d])),
        [[]],
      );
      for (const seats of seatings(pattern.length)) {
        const board: Board = { seats, pattern, solution };
        pattern.forEach((_, seat) => ids.add(sentenceLine(board, seat)));
        for (const marks of states) {
          const verdict = check(board, marks);
          if (verdict.kind === 'blank') ids.add(`bridge.blank.${seats[verdict.seat]}`);
          if (verdict.kind === 'wrong')
            ids.add(missLine(board, verdict.speaker, marks[verdict.speaker] as Kind));
          const hint = hintFor(board, marks);
          if (hint) ids.add(hintLine(board, hint));
        }
      }
    }
  return ids;
}

it('has a spoken line for every sentence, miss and hint the pools can produce, and only three lines they cannot', () => {
  const fixed = [
    'game.truth-bridge',
    'bridge.start',
    'bridge.topsy',
    'bridge.next',
    'bridge.hint.done',
    'bridge.done',
  ];
  const want = new Set([...produced(), ...fixed]);
  const have = Object.keys(VOICE);
  expect([...want].filter((id) => !have.includes(id))).toEqual([]);
  // The rule-built list holds three lines no level 1–2 board asks for: no valid two-islander board has a Topsy
  // islander saying "Both of us speak straight" beside another Topsy islander.
  expect(have.filter((id) => !want.has(id))).toEqual(
    NAMES.map((name) => `bridge.hint.${name}.all2.straight.${name}.topsy`),
  );
  const count = (prefix: string) => [...want].filter((id) => id.startsWith(prefix)).length;
  expect([count('bridge.s.'), count('bridge.miss.'), count('bridge.hint.') - 1]).toEqual([25, 96, 168]);
});

it('keeps every line whole, with no slot, so each one gets a rendered clip, and puts them in the script', () => {
  for (const [id, variants] of Object.entries(VOICE)) {
    expect(variants, id).toHaveLength(1);
    expect(variants[0], id).not.toMatch(/[{}]/);
    expect((SCRIPT as Record<string, string[]>)[id], id).toEqual(variants);
  }
});

it('explains a miss with what is on screen', () => {
  expect((VOICE as Record<string, string[]>)['bridge.miss.duck.straight.mine.bear.same']).toEqual([
    'Duck is marked Straight. With these marks, Duck’s words, “Bear is my kind”, are not so.',
  ]);
  expect((VOICE as Record<string, string[]>)['bridge.hint.bear.some.duck.topsy']).toEqual([
    'Bear’s words, “At least one of us is Topsy”, settle Duck: Duck is Topsy.',
  ]);
});
