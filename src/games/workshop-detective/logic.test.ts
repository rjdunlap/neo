import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import {
  LEVELS,
  LOOKS,
  NOTES,
  NO_MARKS,
  OPENING,
  SETUPS,
  check,
  describeLevel,
  drawLook,
  firstSeparating,
  fitsAll,
  hintFor,
  hintWords,
  isMiss,
  lampFor,
  missKey,
  other,
  predicts,
  recordState,
  rightMarks,
  separates,
  toggle,
  trueNote,
  tryOn,
  verdictWords,
  type Look,
  type Mark,
  type Marks,
  type Setup,
} from './logic';

const MARKS: Mark[] = ['fits', 'out'];
const COMPLETE: Marks[] = MARKS.flatMap((P) => MARKS.map((Q) => ({ P, Q })));
const ALL_MARKS: Marks[] = [null, ...MARKS].flatMap((P) => [null, ...MARKS].map((Q) => ({ P, Q }) as Marks));
const decided = (s: Setup) => [...OPENING, s];

describe('Workshop Detective rules', () => {
  it('is level 1 for the grown-up band only', () => {
    expect(LEVELS).toEqual({ grownup: { min: 1, max: 1 } });
    expect(describeLevel(1)).toBe('Two notes, one bench lamp: find the test that tells them apart');
  });

  it('lights the lamp as the true note predicts; the opening fits both notes; exactly the mixed setups separate', () => {
    for (const look of LOOKS) {
      const truth = trueNote(look);
      for (const s of SETUPS) expect(lampFor(look, s)).toBe(predicts(truth, s));
      expect(NOTES.every((n) => fitsAll(look, OPENING, n))).toBe(true);
      const separating = SETUPS.filter((s) => predicts('P', s) !== predicts('Q', s));
      expect(separating.map((s) => s.join(''))).toEqual(['10', '01']);
      expect(SETUPS.filter(separates)).toEqual(separating);
      for (const s of separating) {
        expect(fitsAll(look, decided(s), truth)).toBe(true);
        expect(fitsAll(look, decided(s), other(truth))).toBe(false);
      }
    }
  });

  it('adds a card only for a new setup, at most four', () => {
    let records: Setup[] = [...OPENING];
    for (const s of [...SETUPS, ...SETUPS]) {
      const before = records.length;
      const r = tryOn(records, s);
      expect(r.added).toBe(r.repeat === null);
      expect(r.records.length).toBe(before + (r.added ? 1 : 0));
      records = r.records;
    }
    expect(records).toHaveLength(4);
    expect(tryOn(records, [0, 0])).toMatchObject({ repeat: 0, added: false });
  });

  it('toggles a mark: setting clears the other, tapping the set one clears it', () => {
    expect(toggle(NO_MARKS, 'P', 'fits')).toEqual({ P: 'fits', Q: null });
    expect(toggle({ P: 'fits', Q: null }, 'P', 'out')).toEqual({ P: 'out', Q: null });
    expect(toggle({ P: 'out', Q: null }, 'P', 'out')).toEqual({ P: null, Q: null });
  });

  it('gives every mark set its verdict in both record states', () => {
    for (const look of LOOKS) {
      const truth = trueNote(look);
      const wrong = other(truth);
      // Undecided.
      expect(check(look, OPENING, { P: 'fits', Q: 'fits' })).toEqual({ kind: 'open' });
      expect(check(look, OPENING, { P: 'out', Q: 'out' })).toEqual({ kind: 'miss-both-sofar' });
      expect(check(look, OPENING, { P: 'fits', Q: 'out' })).toEqual({ kind: 'miss-sofar', note: 'Q' });
      expect(check(look, OPENING, { P: 'out', Q: 'fits' })).toEqual({ kind: 'miss-sofar', note: 'P' });
      expect(check(look, OPENING, { P: null, Q: 'fits' })).toEqual({ kind: 'incomplete', unmarked: ['P'] });
      // Decided, by either separating test, with the other added after or not.
      for (const records of [decided([1, 0]), decided([0, 1]), [...decided([0, 1]), [1, 0] as Setup]]) {
        const record = firstSeparating(records);
        expect(record).toBe(2);
        const verdicts = COMPLETE.map((m) => check(look, records, m));
        expect(verdicts.filter((v) => v.kind === 'close')).toHaveLength(1);
        expect(check(look, records, { [truth]: 'fits', [wrong]: 'out' } as Marks)).toEqual({
          kind: 'close',
          truth,
          record,
        });
        expect(check(look, records, { P: 'fits', Q: 'fits' })).toEqual({
          kind: 'miss-ruled',
          truth,
          record,
          alsoTrue: false,
        });
        expect(check(look, records, { [truth]: 'out', [wrong]: 'fits' } as Marks)).toEqual({
          kind: 'miss-ruled',
          truth,
          record,
          alsoTrue: true,
        });
        expect(check(look, records, { P: 'out', Q: 'out' })).toEqual({ kind: 'miss-true', truth });
        expect(check(look, records, { P: 'fits', Q: null })).toEqual({ kind: 'incomplete', unmarked: ['Q'] });
      }
    }
  });

  it('explains a ruled-out note with the record on screen', () => {
    const look: Look = { pair: 'shell', pLeft: true, shade: 'blue' }; // shell (left) is true
    expect(trueNote(look)).toBe('P');
    const records = decided([1, 0]);
    const words = verdictWords(look, records, check(look, records, { P: 'fits', Q: 'fits' }));
    expect(words.caption).toBe(
      'Record 3 rules out the feather note: shell up, feather down, bright. The feather note says dim.',
    );
    expect(words.lines).toEqual([
      'lamp.shell.out.feather',
      'lamp.shell.setup.10',
      'lamp.bright',
      'lamp.shell.says.feather.dim',
    ]);
    expect(verdictWords(look, records, check(look, records, { P: 'fits', Q: 'out' })).caption).toBe(
      'The shell note fits every record. Record 3 rules out the feather note.',
    );
  });

  it('counts one miss per distinct wrong mark set within a record state, and a later try never re-counts', () => {
    for (const look of LOOKS) {
      const seen = new Set<string>();
      let misses = 0;
      const press = (records: readonly Setup[], marks: Marks) => {
        const v = check(look, records, marks);
        if (!isMiss(v)) return;
        const key = missKey(records, marks);
        if (!seen.has(key)) misses++;
        seen.add(key);
      };
      press(OPENING, { P: 'fits', Q: 'out' });
      press(OPENING, { P: 'fits', Q: 'out' }); // the same marks again: free
      press(OPENING, { P: 'fits', Q: null }); // incomplete: free
      expect(misses).toBe(1);
      press(decided([0, 1]), { P: 'fits', Q: 'out' }); // now decided: may count once more if wrong
      const afterFirst = misses;
      press([...decided([0, 1]), [1, 0]], { P: 'fits', Q: 'out' }); // a second separating try changes nothing
      expect(misses).toBe(afterFirst);
      for (const m of COMPLETE) {
        press(OPENING, m);
        press(decided([1, 0]), m);
      }
      expect(misses).toBeLessThanOrEqual(6);
      expect(misses).toBe(6); // three wrong mark sets in each state
    }
  });

  it('leads from every reachable state to the close in at most three hints, never naming the truth before a separating record', () => {
    for (const look of LOOKS)
      for (const opened of [false, true])
        for (const start of [OPENING, decided([1, 0]), decided([0, 1])])
          for (const marks0 of ALL_MARKS) {
            if (!opened && recordState(start) === 'decided') continue; // the latch: no try before the opening Check
            let records: Setup[] = [...start];
            let marks = marks0;
            let open = opened;
            let hints = 0;
            let closed = false;
            for (let step = 0; step < 6 && !closed; step++) {
              const hint = hintFor(look, records, marks, open);
              if (hint) {
                hints++;
                const words = hintWords(look, records, hint);
                if (recordState(records) === 'undecided') {
                  expect(words.caption).not.toMatch(/fits every record\.|rules out/);
                }
                if (hint.step === 2) records = tryOn(records, hint.setup).records;
                else marks = rightMarks(look, records);
              }
              const v = check(look, records, marks);
              if (v.kind === 'open') open = true;
              if (v.kind === 'close') closed = true;
            }
            expect(closed).toBe(true);
            expect(hints).toBeLessThanOrEqual(3);
          }
  });

  it('says the right decided marks need only a Check', () => {
    const look = LOOKS[3];
    const records = decided([0, 1]);
    expect(hintFor(look, records, rightMarks(look, records), true)).toBeNull();
  });

  it('draws looks by seed: pair, side and shade vary, and a look fixes its true note, each note true in eight', () => {
    const drawn = [...Array(200).keys()].map((seed) => drawLook(new Rng(seed + 1)));
    expect(new Set(drawn.map((l) => l.pair)).size).toBe(2);
    expect(new Set(drawn.map((l) => l.pLeft)).size).toBe(2);
    expect(new Set(drawn.map((l) => l.shade)).size).toBe(4);
    expect(LOOKS).toHaveLength(16);
    for (const l of drawn) expect(trueNote(l)).toBe(trueNote({ ...l }));
    expect(LOOKS.filter((l) => trueNote(l) === 'P')).toHaveLength(8);
    expect(LOOKS.filter((l) => trueNote(l) === 'Q')).toHaveLength(8);
    // The left lever's note wins in eight looks too, so neither side nor pair gives the answer away.
    expect(LOOKS.filter((l) => (trueNote(l) === 'P') === l.pLeft)).toHaveLength(8);
    for (const pair of ['shell', 'star'] as const)
      expect(LOOKS.filter((l) => l.pair === pair && trueNote(l) === 'P')).toHaveLength(4);
  });
});
