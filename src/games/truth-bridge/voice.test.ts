import { expect, it } from 'vitest';
import { SCRIPT } from '../../content/voice-script';
import {
  KINDS,
  NAMES,
  PLANKS,
  POOL_IDS,
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
  for (const id of POOL_IDS)
    for (const pattern of pool(id)) {
      const solution = solutions(pattern)[0];
      const states = pattern.reduce<Domain[][]>(
        (all) => all.flatMap((m) => [null, ...KINDS].map((d) => [...m, d])),
        [[]],
      );
      for (const seats of seatings(pattern.length)) {
        const board: Board = { seats, pattern, solution };
        pattern.forEach((_, seat) => ids.add(sentenceLine(board, seat)));
        for (const marks of states)
          for (const plank of solution.plank ? [null, ...PLANKS] : [null]) {
            const verdict = check(board, marks, plank);
            if (verdict.kind === 'blank') ids.add(`bridge.blank.${seats[verdict.seat]}`);
            if (verdict.kind === 'choose-plank') ids.add('bridge.blank.plank');
            if (verdict.kind === 'wrong')
              ids.add(missLine(board, verdict.speaker, marks[verdict.speaker] as Kind));
            const hint = hintFor(board, marks, plank);
            if (hint) ids.add(hintLine(board, hint));
          }
      }
    }
  return ids;
}

it('has a spoken line for every sentence, miss and hint the pools can produce, and no unused lines', () => {
  const fixed = [
    'game.truth-bridge',
    'bridge.start',
    'bridge.start.planks',
    'bridge.topsy',
    'bridge.next',
    'bridge.hint.done',
    'bridge.done',
  ];
  const want = new Set([...produced(), ...fixed]);
  const have = Object.keys(VOICE);
  expect([...want].filter((id) => !have.includes(id))).toEqual([]);
  expect(have.filter((id) => !want.has(id))).toEqual([]);
  expect([...want].filter((id) => id.startsWith('bridge.s.'))).toHaveLength(31);
  expect([...want].some((id) => id.startsWith('bridge.try.'))).toBe(true);
  expect([...want].some((id) => id.startsWith('bridge.hint.') && id.endsWith('.plank.left'))).toBe(true);
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
