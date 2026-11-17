import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import {
  canFinish,
  checkRows,
  checkRun,
  CUES,
  demoNext,
  finishRun,
  fire,
  help,
  isComplete,
  isProgram,
  LEVELS,
  mismatch,
  newStudio,
  planFor,
  PLANS,
  playRun,
  REPEAT,
  requestFor,
  restart,
  run,
  shapeOf,
  SIGNALS,
  step,
  stickerRecipe,
  tapAction,
  tapSlot,
  targetOf,
  toggleRepeat,
  trace,
  undo,
  wanted,
  type Cue,
  type Studio,
} from './logic';

const fill = (s: Studio, ...cues: Cue[]) => cues.forEach((c) => tapAction(s, c));
const watched = (slots: number, ...cues: Cue[]) => {
  const s = newStudio(slots);
  fill(s, ...cues);
  playRun(s);
  finishRun(s);
  return s;
};

describe('plans', () => {
  it('levels 1–5 have one slot, then two', () => {
    expect(PLANS.map((p) => p.slots)).toEqual([1, 2, 2, 2, 2]);
    expect(PLANS.map(shapeOf)).toEqual(['show', 'show', 'show', 'rows', 'repeat']);
    expect(planFor(2).slots).toBe(2);
    expect(planFor(3).request).toEqual(['W', 'T']);
    expect(planFor(99).level).toBe(1);
  });
});

describe('every finished show', () => {
  it('all 2 one-command and all 4 two-command programs are well formed, can be played and finished', () => {
    const shows: Cue[][] = [];
    for (const a of CUES) shows.push([a]);
    for (const a of CUES) for (const b of CUES) shows.push([a, b]);
    expect(shows).toHaveLength(6);
    for (const show of shows) {
      const s = newStudio(show.length);
      fill(s, ...show);
      expect(isProgram(s.program, show.length)).toBe(true);
      expect(isComplete(s.program)).toBe(true);
      expect(trace(s.program)).toEqual(show);
      expect(canFinish(s)).toBe(false);
      expect(playRun(s)).toEqual(show);
      finishRun(s);
      expect(canFinish(s)).toBe(true);
    }
  });

  it('isProgram rejects holes, wrong length and unknown commands', () => {
    expect(isProgram([null, 'W'], 2)).toBe(false);
    expect(isProgram(['W', null], 2)).toBe(true);
    expect(isProgram([null, null], 2)).toBe(true);
    expect(isProgram(['W'], 2)).toBe(false);
    expect(isProgram(['X'], 1)).toBe(false);
    expect(isProgram(['W', 'T', 'W'], 2)).toBe(false);
  });
});

describe('editing', () => {
  it('appends to the first empty slot and never leaves a hole', () => {
    const s = newStudio(2);
    expect(tapAction(s, 'T')).toBe('insert');
    expect(s.program).toEqual(['T', null]);
    expect(isProgram(s.program, 2)).toBe(true);
    expect(tapAction(s, 'W')).toBe('insert');
    expect(s.program).toEqual(['T', 'W']);
  });

  it('tapping an empty slot selects nothing', () => {
    const s = newStudio(2);
    fill(s, 'W');
    expect(tapSlot(s, 1)).toBe('released');
    expect(s.selected).toBeNull();
    tapAction(s, 'T');
    expect(s.program).toEqual(['W', 'T']);
  });

  it('select then replace changes that slot only; tapping the slot again lets go', () => {
    const s = newStudio(2);
    fill(s, 'W', 'W');
    expect(tapSlot(s, 1)).toBe('selected');
    expect(tapAction(s, 'T')).toBe('replace');
    expect(s.program).toEqual(['W', 'T']);
    expect(s.selected).toBeNull();
    expect(tapSlot(s, 0)).toBe('selected');
    expect(tapSlot(s, 0)).toBe('released');
    expect(s.selected).toBeNull();
  });

  it('replacing with the same command is not an edit', () => {
    const s = watched(2, 'W', 'T');
    const undoBefore = s.undo;
    tapSlot(s, 1);
    expect(tapAction(s, 'T')).toBe('same');
    expect(s.program).toEqual(['W', 'T']);
    expect(s.selected).toBeNull();
    expect(s.undo).toBe(undoBefore);
    expect(canFinish(s)).toBe(true);
  });

  it('a full shelf with nothing selected returns full and changes nothing', () => {
    const s = watched(2, 'W', 'T');
    const undoBefore = s.undo;
    expect(tapAction(s, 'W')).toBe('full');
    expect(s.program).toEqual(['W', 'T']);
    expect(s.undo).toBe(undoBefore);
    expect(s.played).toBe(true);
  });
});

describe('undo', () => {
  it('goes back one step only, then is inert', () => {
    const s = newStudio(2);
    fill(s, 'W', 'T');
    expect(undo(s)).toBe(true);
    expect(s.program).toEqual(['W', null]);
    expect(undo(s)).toBe(false);
    expect(s.program).toEqual(['W', null]);
  });

  it('with nothing to undo does nothing', () => {
    const s = newStudio(1);
    expect(undo(s)).toBe(false);
    expect(s.program).toEqual([null]);
  });

  it('undoes a replacement', () => {
    const s = newStudio(2);
    fill(s, 'W', 'W');
    tapSlot(s, 0);
    tapAction(s, 'T');
    undo(s);
    expect(s.program).toEqual(['W', 'W']);
  });

  it('every edit and Undo clears played and finish', () => {
    const edits: [string, (s: Studio) => void][] = [
      [
        'replace',
        (s) => {
          tapSlot(s, 0);
          tapAction(s, 'T');
        },
      ],
      [
        'undo',
        (s) => {
          undo(s);
        },
      ],
      [
        'help insert',
        (s) => {
          undo(s);
          finishRun(s);
          help(s);
        },
      ],
    ];
    for (const [name, doEdit] of edits) {
      const s = newStudio(2);
      fill(s, 'W', 'W');
      playRun(s);
      finishRun(s);
      expect(canFinish(s), name).toBe(true);
      doEdit(s);
      expect(s.played, name).toBe(false);
      expect(canFinish(s), name).toBe(false);
    }
    const s = watched(1, 'W');
    undo(s);
    expect(s.played).toBe(false);
    tapAction(s, 'T');
    expect(canFinish(s)).toBe(false);
  });
});

describe('play and step', () => {
  it('Play of a partial program never enables finish', () => {
    const s = newStudio(2);
    fill(s, 'W');
    expect(playRun(s)).toEqual(['W']);
    finishRun(s);
    expect(s.played).toBe(false);
    expect(canFinish(s)).toBe(false);
    expect(playRun(newStudio(2))).toEqual([]);
  });

  it('stepping a partial program to its end does not enable finish', () => {
    const s = newStudio(2);
    fill(s, 'T');
    expect(step(s)).toEqual({ at: 0, cue: 'T', n: 0 });
    expect(canFinish(s)).toBe(false);
    expect(step(newStudio(2))).toBeNull();
  });

  it('stepping a full trace to the end enables finish like Play', () => {
    const s = newStudio(2);
    fill(s, 'W', 'T');
    expect(step(s)).toEqual({ at: 0, cue: 'W', n: 0 });
    expect(canFinish(s)).toBe(false);
    expect(step(s)).toEqual({ at: 1, cue: 'T', n: 1 });
    expect(canFinish(s)).toBe(true);
    expect(step(s)).toEqual({ at: 0, cue: 'W', n: 0 });
  });

  it('one-slot step finishes at once', () => {
    const s = newStudio(1);
    fill(s, 'T');
    step(s);
    expect(canFinish(s)).toBe(true);
  });
});

describe('help', () => {
  it('inserts Wave in the first empty slot, one hint per slot', () => {
    const s = newStudio(2);
    expect(help(s)).toEqual({ kind: 'insert', at: 0 });
    expect(s.program).toEqual(['W', null]);
    expect(s.hints).toBe(1);
    expect(help(s)).toEqual({ kind: 'insert', at: 1 });
    expect(s.program).toEqual(['W', 'W']);
    expect(s.hints).toBe(2);
  });

  it('never double-charges after Undo and Help again', () => {
    const s = newStudio(2);
    help(s);
    undo(s);
    expect(s.program).toEqual([null, null]);
    help(s);
    expect(s.program).toEqual(['W', null]);
    expect(s.hints).toBe(1);
  });

  it('never double-charges after restart', () => {
    const s = newStudio(2);
    help(s);
    help(s);
    restart(s);
    expect(s.program).toEqual([null, null]);
    expect(s.hints).toBe(2);
    help(s);
    help(s);
    expect(s.hints).toBe(2);
    expect(s.helped.size).toBe(2);
  });

  it('on a full unwatched show plays it for her, charging once', () => {
    const s = newStudio(2);
    fill(s, 'T', 'T');
    expect(help(s)).toEqual({ kind: 'play' });
    expect(s.hints).toBe(1);
    expect(help(s)).toEqual({ kind: 'play' });
    expect(s.hints).toBe(1);
  });

  it('on a watched show points at Finish for free', () => {
    const s = watched(2, 'W', 'T');
    expect(help(s)).toEqual({ kind: 'finish' });
    expect(s.hints).toBe(0);
    expect(canFinish(s)).toBe(true);
  });

  it('restart keeps hints and helped but clears the shelf', () => {
    const s = newStudio(1);
    help(s);
    playRun(s);
    finishRun(s);
    restart(s);
    expect(s.hints).toBe(1);
    expect(s.helped.has('insert:0')).toBe(true);
    expect(s.played).toBe(false);
    expect(s.undo).toBeNull();
    expect(s.selected).toBeNull();
  });
});

describe('requested repair', () => {
  const request: Cue[] = ['W', 'T'];
  const programs: Cue[][] = [
    ['W', 'W'],
    ['W', 'T'],
    ['T', 'W'],
    ['T', 'T'],
  ];
  const replace = (s: Studio, at: number, cue: Cue) => {
    tapSlot(s, at);
    tapAction(s, cue);
  };
  const check = (s: Studio) => {
    playRun(s);
    finishRun(s);
    return checkRun(s);
  };

  it('starts with the reversed request without changing the pictured request', () => {
    const s = newStudio(2, request);
    expect(s.program).toEqual(['T', 'W']);
    expect(s.request).toEqual(['W', 'T']);
    replace(s, 0, 'W');
    expect(request).toEqual(['W', 'T']);
    expect(s.checked).toBe(false);
    expect(s.misses).toBe(0);
  });

  it('accepts exactly the requested trace and points at the earliest mismatch for all four programs', () => {
    for (const program of programs) {
      const s = newStudio(2, request);
      program.forEach((cue, at) => replace(s, at, cue));
      const earliest = program.findIndex((cue, at) => cue !== request[at]);
      expect(check(s), program.join('')).toBe(earliest);
      expect(canFinish(s)).toBe(earliest === -1);
      expect(s.misses).toBe(earliest === -1 ? 0 : 1);
      expect(s.program).toEqual(program);
    }
  });

  it('each correct local replacement reduces mismatches and either repair order reaches success', () => {
    for (const order of [
      [0, 1],
      [1, 0],
    ]) {
      const s = newStudio(2, request);
      let remaining = 2;
      for (const at of order) {
        replace(s, at, request[at]);
        expect(s.program.filter((cue, i) => cue !== request[i])).toHaveLength(--remaining);
        expect(canFinish(s)).toBe(false);
      }
      expect(check(s)).toBe(-1);
      expect(canFinish(s)).toBe(true);
      expect(s.misses).toBe(0);
    }
  });

  it('every legal replacement changes only its chosen slot and Help solves every alternative', () => {
    for (const program of programs) {
      for (let at = 0; at < 2; at++)
        for (const cue of CUES) {
          const s = newStudio(2, request);
          program.forEach((value, slot) => replace(s, slot, value));
          replace(s, at, cue);
          expect(s.program[at]).toBe(cue);
          expect(s.program[1 - at]).toBe(program[1 - at]);
          expect(isProgram(s.program, 2)).toBe(true);
          expect(s.misses).toBe(0);
        }
      const s = newStudio(2, request);
      program.forEach((cue, at) => replace(s, at, cue));
      for (let press = 0; press < 4; press++) {
        const before = s.program.filter((cue, at) => cue !== request[at]).length;
        const result = help(s);
        const after = s.program.filter((cue, at) => cue !== request[at]).length;
        if (result.kind === 'repair') expect(after).toBe(before - 1);
        else expect(after).toBe(before);
        if (result.kind === 'check') break;
      }
      expect(s.program).toEqual(request);
      expect(check(s)).toBe(-1);
      expect(canFinish(s)).toBe(true);
      expect(s.misses).toBe(0);
    }
  });

  it('automatic redisplay of an already supplied clue never charges a second hint', () => {
    const s = newStudio(2, request);
    help(s);
    check(s);
    check(s);
    expect(s.hints).toBe(1);
    expect(s.helped).toEqual(new Set(['clue:slot:0']));
    restart(s);
    check(s);
    expect(s.misses).toBe(3);
    expect(s.hints).toBe(1);
  });

  it('moving an existing clue to the next mismatch stays free, including a subsequent Check', () => {
    const s = newStudio(2, request);
    check(s);
    check(s);
    replace(s, 0, 'W');
    expect(check(s)).toBe(1);
    expect(s.hints).toBe(1);
    expect(help(s)).toEqual({ kind: 'repair', at: 1, cue: 'T' });
    expect(s.hints).toBe(2);
  });

  it('ordinary Play and Step never enable requested Finish or charge misses, even when correct', () => {
    for (const program of programs) {
      const s = newStudio(2, request);
      program.forEach((cue, at) => replace(s, at, cue));
      playRun(s);
      finishRun(s);
      step(s);
      step(s);
      expect(s.played).toBe(true);
      expect(s.checked).toBe(false);
      expect(canFinish(s)).toBe(false);
      expect(s.misses).toBe(0);
      expect(s.hints).toBe(0);
    }
  });

  it('rejects incomplete or malformed Checks and ignores Check in creation mode', () => {
    for (const program of [[null, null], ['W', null], [null, 'T'], ['W'], ['X', 'T']]) {
      const s = newStudio(2, request);
      s.program = program as Studio['program'];
      expect(checkRun(s)).toBeNull();
      expect(s.misses).toBe(0);
      expect(s.checked).toBe(false);
    }
    expect(checkRun(watched(2, 'W', 'T'))).toBeNull();
  });

  it('only failed Checks count misses, with an automatic clue after two and no repeated clue charge', () => {
    const s = newStudio(2, request);
    expect(check(s)).toBe(0);
    expect(s.misses).toBe(1);
    expect(s.hints).toBe(0);
    expect(check(s)).toBe(0);
    expect(s.misses).toBe(2);
    expect(s.hints).toBe(1);
    expect(s.helped.has('clue:slot:0')).toBe(true);
    expect(check(s)).toBe(0);
    expect(s.misses).toBe(3);
    expect(s.hints).toBe(1);
    expect(help(s)).toEqual({ kind: 'repair', at: 0, cue: 'W' });
    expect(s.misses).toBe(3);
  });

  it('Help gives a clue, repairs each earliest mismatch, then points to Check and Finish', () => {
    const s = newStudio(2, request);
    expect(help(s)).toEqual({ kind: 'clue', at: 0, cue: 'W' });
    expect(s.program).toEqual(['T', 'W']);
    expect(s.hints).toBe(1);
    expect(help(s)).toEqual({ kind: 'repair', at: 0, cue: 'W' });
    expect(s.program).toEqual(['W', 'W']);
    expect(s.hints).toBe(2);
    expect(help(s)).toEqual({ kind: 'repair', at: 1, cue: 'T' });
    expect(s.program).toEqual(request);
    expect(s.hints).toBe(3);
    expect(help(s)).toEqual({ kind: 'check' });
    expect(help(s)).toEqual({ kind: 'check' });
    expect(canFinish(s)).toBe(false);
    expect(check(s)).toBe(-1);
    expect(help(s)).toEqual({ kind: 'finish' });
    expect(canFinish(s)).toBe(true);
    expect(s.hints).toBe(3);
    expect(s.misses).toBe(0);
  });

  it('preserves assistance identities and accounting across Undo and restart', () => {
    const s = newStudio(2, request);
    check(s);
    help(s);
    help(s);
    expect(undo(s)).toBe(true);
    expect(help(s)).toEqual({ kind: 'repair', at: 0, cue: 'W' });
    expect(s.hints).toBe(2);
    help(s);
    expect(s.hints).toBe(3);
    check(s);
    restart(s);
    expect(s.program).toEqual(['T', 'W']);
    expect(s.misses).toBe(1);
    expect(s.hints).toBe(3);
    expect(s.helped).toEqual(new Set(['clue:slot:0', 'repair:slot:0', 'repair:slot:1']));
    expect(s.selected).toBeNull();
    expect(s.undo).toBeNull();
    expect(s.played).toBe(false);
    expect(s.checked).toBe(false);
    expect(help(s)).toEqual({ kind: 'repair', at: 0, cue: 'W' });
    expect(help(s)).toEqual({ kind: 'repair', at: 1, cue: 'T' });
    expect(s.hints).toBe(3);
    expect(check(s)).toBe(-1);
    expect(canFinish(s)).toBe(true);
  });

  it('edits and Undo invalidate a successful Check, including Undo back to the requested program', () => {
    const s = newStudio(2, request);
    replace(s, 0, 'W');
    replace(s, 1, 'T');
    check(s);
    replace(s, 0, 'T');
    expect(s.checked).toBe(false);
    expect(canFinish(s)).toBe(false);
    undo(s);
    expect(s.program).toEqual(request);
    expect(s.checked).toBe(false);
    expect(canFinish(s)).toBe(false);
    expect(check(s)).toBe(-1);
    tapSlot(s, 0);
    expect(tapAction(s, 'W')).toBe('same');
    expect(canFinish(s)).toBe(true);
  });
});

describe('the demonstration', () => {
  /** Applies the ghost finger's presses the way the game would. */
  function runDemo(slots: number, request?: readonly Cue[]) {
    const s = newStudio(slots, request);
    let changed = false;
    let replaced = false;
    for (let i = 0; i < 20; i++) {
      const p = demoNext(s, changed);
      if (p === 'finish') return { s, replaced, done: true };
      if (p === 'play') {
        playRun(s);
        finishRun(s);
        if (replaced) changed = true;
      } else if (p === 'check') {
        playRun(s);
        finishRun(s);
        checkRun(s);
      } else if (p === 'repeat') {
        throw new Error('Repeat belongs to level 5');
      } else if ('slot' in p) {
        tapSlot(s, p.slot);
      } else if ('action' in p) {
        const r = tapAction(s, p.action);
        if (r === 'replace') {
          replaced = true;
          changed = true;
        }
      }
    }
    return { s, replaced, done: false };
  }

  it('level 1 reaches a finishable state with no hints', () => {
    const { s, done, replaced } = runDemo(1);
    expect(done).toBe(true);
    expect(canFinish(s)).toBe(true);
    expect(s.hints).toBe(0);
    expect(replaced).toBe(false);
    expect(s.program).toEqual(['W']);
  });

  it('level 3 watches, repairs both slots and checks before finishing without assistance', () => {
    const { s, done, replaced } = runDemo(2, ['W', 'T']);
    expect(done).toBe(true);
    expect(replaced).toBe(true);
    expect(s.program).toEqual(['W', 'T']);
    expect(s.checked).toBe(true);
    expect(canFinish(s)).toBe(true);
    expect(s.misses).toBe(0);
    expect(s.hints).toBe(0);
  });

  it('level 2 reaches a finishable state with no hints and makes a replacement', () => {
    const { s, done, replaced } = runDemo(2);
    expect(done).toBe(true);
    expect(replaced).toBe(true);
    expect(canFinish(s)).toBe(true);
    expect(s.hints).toBe(0);
    expect(s.program).toEqual(['T', 'T']);
  });
});

describe('level 4: which signal', () => {
  const plan = planFor(4);
  const requests = plan.signals!;
  const slotsOf: (Cue | null)[] = [null, 'W', 'T'];
  /** A studio holding exactly this binding, built with real edits (bell's row first; an empty bell row keeps the flower's empty). */
  const bound = (request: readonly Cue[], bell: Cue | null, flower: Cue | null) => {
    const s = newStudio(2, request, 'rows');
    if (bell) tapAction(s, bell);
    if (bell && flower) tapAction(s, flower);
    return s;
  };

  it('school plays 3–5 with entry 3, and the seed picks one of two opposite requests', () => {
    expect(LEVELS.school).toEqual({ min: 3, max: 5 });
    expect(LEVELS.prek).toEqual({ min: 1, max: 2 });
    expect(requests).toEqual([
      ['W', 'T'],
      ['T', 'W'],
    ]);
    const seen = new Set<string>();
    for (let seed = 1; seed <= 40; seed++) seen.add(requestFor(plan, new Rng(seed))!.join(''));
    expect(seen).toEqual(new Set(['WT', 'TW']));
    expect(requestFor(planFor(3), new Rng(1))).toEqual(['W', 'T']);
    expect(requestFor(planFor(1), new Rng(1))).toBeUndefined();
  });

  it('both rows start empty, and Start again empties them keeping misses and help', () => {
    for (const request of requests) {
      const s = newStudio(2, request, 'rows');
      expect(s.program).toEqual([null, null]);
      expect(s.rows).toBe(true);
      fill(s, request[1], request[0]);
      checkRun(s);
      help(s);
      restart(s);
      expect(s.program).toEqual([null, null]);
      expect([s.misses, s.hints, s.checked]).toEqual([1, 1, false]);
    }
    // Rows need a request; a creation studio never becomes one.
    expect(newStudio(2, undefined, 'rows').rows).toBe(false);
  });

  it('of all nine bindings exactly the requested one is accepted, row by row', () => {
    for (const request of requests)
      for (const bell of slotsOf)
        for (const flower of slotsOf) {
          const s = newStudio(2, request, 'rows');
          s.program = [bell, flower];
          const rows = checkRows(s);
          expect(rows).toEqual([bell === request[0], flower === request[1]]);
          const right = bell === request[0] && flower === request[1];
          expect(mismatch(s) < 0).toBe(right);
          // The first mismatching row is the one named: the bell's whenever it is wrong.
          if (!right) expect(mismatch(s)).toBe(rows[0] ? 1 : 0);
          const before = s.misses;
          const at = checkRun(s);
          if (bell === null || flower === null) {
            // An unset row is incomplete: Check points at it, never a miss. (A hole is not even a program.)
            expect(at).toBeNull();
            expect(s.misses).toBe(before);
          } else {
            expect(at).toBe(right ? -1 : rows[0] ? 1 : 0);
            expect(s.checked).toBe(right);
            expect(s.misses).toBe(before + (right ? 0 : 1));
          }
        }
  });

  it('firing reads a row and never edits, counts or checks, in any order', () => {
    for (const request of requests)
      for (const bell of slotsOf)
        for (const flower of slotsOf) {
          const s = bound(request, bell, flower);
          const snapshot = JSON.stringify({ ...s, helped: [...s.helped] });
          const expected = [s.program[0], s.program[1]];
          for (const row of [1, 0, 0, 1, 1]) expect(fire(s, row)).toBe(expected[row]);
          expect(JSON.stringify({ ...s, helped: [...s.helped] })).toBe(snapshot);
          // Acceptance is a property of the binding, not of what was fired or in which order.
          expect(checkRows(s)).toEqual([s.program[0] === request[0], s.program[1] === request[1]]);
        }
    // Outside level 4 there are no signals to fire.
    expect(fire(newStudio(2, ['W', 'T']), 0)).toBeNull();
  });

  it('names targets by signal, and level 3 by slot', () => {
    const s = newStudio(2, requests[0], 'rows');
    expect([0, 1].map((i) => targetOf(s, i))).toEqual(SIGNALS.map((n) => `row:${n}`));
    expect(targetOf(newStudio(2, ['W', 'T']), 1)).toBe('slot:1');
  });

  it('Help gives a clue, then fills or repairs each wrong row, then points to Check and Finish, from every binding', () => {
    for (const request of requests)
      for (const bell of slotsOf)
        for (const flower of slotsOf) {
          const s = bound(request, bell, flower);
          const wrongRows = checkRows(s).filter((ok) => !ok).length;
          if (!wrongRows) {
            expect(help(s)).toEqual({ kind: 'check' });
            continue;
          }
          const first = mismatch(s);
          expect(help(s)).toEqual({ kind: 'clue', at: first, cue: request[first] });
          for (let left = wrongRows; left > 0; left--) {
            const at = mismatch(s);
            expect(help(s)).toEqual({ kind: 'repair', at, cue: request[at] });
            expect(checkRows(s).filter((ok) => !ok).length).toBe(left - 1);
          }
          expect(s.hints).toBe(1 + wrongRows);
          expect(help(s)).toEqual({ kind: 'check' });
          expect(s.checked).toBe(false);
          expect(checkRun(s)).toBe(-1);
          expect(help(s)).toEqual({ kind: 'finish' });
          expect(canFinish(s)).toBe(true);
          expect(s.misses).toBe(0);
        }
  });

  it('only wrong Checks miss; two bring the clue once; help identities survive Undo and Start again', () => {
    const request = requests[0];
    const s = bound(request, request[1], request[0]); // swapped: both rows wrong, the bell's named first
    expect(checkRun(s)).toBe(0);
    expect(s.hints).toBe(0);
    expect(checkRun(s)).toBe(0);
    expect([s.misses, s.hints]).toEqual([2, 1]);
    expect(s.helped).toEqual(new Set(['clue:row:bell']));
    expect(help(s).kind).toBe('repair');
    expect(s.hints).toBe(2);
    undo(s);
    expect(help(s).kind).toBe('repair');
    expect(s.hints).toBe(2);
    restart(s);
    // The bell's row is empty again; supplying it again is free, and the flower's is a new repair.
    expect(help(s)).toEqual({ kind: 'repair', at: 0, cue: request[0] });
    expect(s.hints).toBe(2);
    expect(help(s)).toEqual({ kind: 'repair', at: 1, cue: request[1] });
    expect(s.helped).toEqual(new Set(['clue:row:bell', 'repair:row:bell', 'repair:row:flower']));
    expect([s.misses, s.hints]).toEqual([2, 3]);
  });

  it('every edit and Undo clears a successful Check', () => {
    const request = requests[1];
    const s = bound(request, request[0], request[1]);
    expect(checkRun(s)).toBe(-1);
    tapSlot(s, 1);
    tapAction(s, request[0]);
    expect(s.checked).toBe(false);
    undo(s);
    expect(s.checked).toBe(false);
    expect(canFinish(s)).toBe(false);
    expect(checkRun(s)).toBe(-1);
    expect(canFinish(s)).toBe(true);
  });

  it('the demonstration fills each row as asked, fires the flower then the bell, checks and finishes unaided', () => {
    for (const request of requests) {
      const s = newStudio(2, request, 'rows');
      const fired = [false, false];
      const presses: string[] = [];
      for (let i = 0; i < 12; i++) {
        const p = demoNext(s, false, fired);
        if (p === 'finish') break;
        if (p === 'check') {
          checkRun(s);
          presses.push('check');
        } else if (p === 'play' || p === 'repeat') throw new Error('Play and Repeat are not at level 4');
        else if ('fire' in p) {
          expect(fire(s, p.fire)).toBe(request[p.fire]);
          fired[p.fire] = true;
          presses.push(`fire:${SIGNALS[p.fire]}`);
        } else if ('action' in p) {
          tapAction(s, p.action);
          presses.push(p.action);
        } else tapSlot(s, p.slot);
      }
      expect(presses).toEqual([request[0], request[1], 'fire:flower', 'fire:bell', 'check']);
      expect(canFinish(s)).toBe(true);
      expect([s.misses, s.hints]).toEqual([0, 0]);
    }
  });
});

describe('level 5: a repeated phrase', () => {
  const plan = planFor(5);
  const phrases = plan.phrases!;
  const slotsOf: (Cue | null)[] = [null, 'W', 'T'];
  /** A studio holding exactly this body and cap, built with real edits (an empty first slot keeps the second empty). */
  const made = (request: readonly Cue[], a: Cue | null, b: Cue | null, repeat: boolean) => {
    const s = newStudio(2, request, 'repeat');
    if (a) tapAction(s, a);
    if (a && b) tapAction(s, b);
    if (repeat) toggleRepeat(s);
    return s;
  };
  /** Every reachable program: nine bodies, minus the hole, with the cap off and on. */
  const all = (request: readonly Cue[]) =>
    slotsOf.flatMap((a) =>
      slotsOf
        .filter((b) => a || !b)
        .flatMap((b) => [false, true].map((repeat) => ({ a, b, repeat, s: made(request, a, b, repeat) }))),
    );

  it('the seed picks one of two opposite phrases, and the shelf starts empty with Repeat off', () => {
    expect(phrases).toEqual([
      ['W', 'T'],
      ['T', 'W'],
    ]);
    const seen = new Set<string>();
    for (let seed = 1; seed <= 40; seed++) seen.add(requestFor(plan, new Rng(seed))!.join(''));
    expect(seen).toEqual(new Set(['WT', 'TW']));
    for (const request of phrases) {
      const s = newStudio(2, request, 'repeat');
      expect([s.program, s.repeat, s.repeats, s.rows]).toEqual([[null, null], false, true, false]);
      expect(wanted(s)).toEqual([...request, ...request]);
    }
    // Repeat needs a request, and the cap does nothing on any other level's studio.
    const free = newStudio(2, undefined, 'repeat');
    expect(free.repeats).toBe(false);
    expect(toggleRepeat(free)).toBe(false);
    const repair = newStudio(2, ['W', 'T']);
    expect(toggleRepeat(repair)).toBe(false);
    expect([repair.repeat, repair.undo]).toEqual([false, null]);
  });

  it('expansion is exactly two passes of a complete body, and one pass of anything else', () => {
    for (const request of phrases)
      for (const { a, b, repeat, s } of all(request)) {
        const body = [a, b].filter((c): c is Cue => c !== null);
        const complete = body.length === 2;
        expect(run(s)).toEqual(repeat && complete ? [...body, ...body] : body);
        expect(run(s).length).toBeLessThanOrEqual(4);
        expect(playRun(s)).toEqual(run(s));
      }
  });

  it('Check accepts exactly the phrase with Repeat on, and names the earliest mismatch otherwise', () => {
    for (const request of phrases)
      for (const { a, b, repeat, s } of all(request)) {
        const at = checkRun(s);
        if (!a || !b) {
          // An incomplete body, with or without Repeat, is never checked: no miss.
          expect(at).toBeNull();
          expect([s.misses, s.checked]).toEqual([0, false]);
          continue;
        }
        const right = a === request[0] && b === request[1];
        const expected = a !== request[0] ? 0 : b !== request[1] ? 1 : repeat ? -1 : REPEAT;
        expect(at).toBe(expected);
        expect(s.checked).toBe(right && repeat);
        expect(s.misses).toBe(right && repeat ? 0 : 1);
        // The verdict is the played trace against the pictured one.
        expect(run(s).join('') === wanted(s).join('')).toBe(at === -1);
        expect(canFinish(s)).toBe(at === -1);
      }
  });

  it('names its targets: a slot for a wrong move, the cap when the right phrase plays once', () => {
    const s = newStudio(2, phrases[0], 'repeat');
    expect([targetOf(s, 0), targetOf(s, 1), targetOf(s, REPEAT)]).toEqual(['slot:0', 'slot:1', 'repeat']);
    fill(s, 'W', 'T');
    expect(mismatch(s)).toBe(REPEAT);
    // Outside level 5 the same number is only a slot.
    expect(targetOf(newStudio(2, ['W', 'T']), REPEAT)).toBe('slot:2');
  });

  it('the cap is an edit: it clears a run and a Check, and Undo puts it back with the program', () => {
    const s = made(phrases[0], 'W', 'T', true);
    playRun(s);
    finishRun(s);
    expect(checkRun(s)).toBe(-1);
    expect([s.played, s.checked]).toEqual([true, true]);
    expect(toggleRepeat(s)).toBe(false);
    expect([s.played, s.checked, s.stepAt, canFinish(s)]).toEqual([false, false, 0, false]);
    expect(undo(s)).toBe(true);
    expect([s.repeat, s.program, s.checked]).toEqual([true, ['W', 'T'], false]);
    expect(undo(s)).toBe(false);
    // A slot edit made while Repeat is on undoes to the old move and leaves the cap on.
    tapSlot(s, 0);
    tapAction(s, 'T');
    expect([s.program, s.repeat]).toEqual([['T', 'T'], true]);
    undo(s);
    expect([s.program, s.repeat]).toEqual([['W', 'T'], true]);
    // The cap lets go of a selection.
    tapSlot(s, 1);
    toggleRepeat(s);
    expect(s.selected).toBeNull();
  });

  it('Step takes four presses over the two slots, then starts again; ordinary runs never check or miss', () => {
    const s = made(phrases[0], 'W', 'T', true);
    expect([step(s), step(s), step(s)]).toEqual([
      { at: 0, cue: 'W', n: 0 },
      { at: 1, cue: 'T', n: 1 },
      { at: 0, cue: 'W', n: 2 },
    ]);
    expect(s.played).toBe(false);
    expect(step(s)).toEqual({ at: 1, cue: 'T', n: 3 });
    expect([s.played, s.checked, s.misses, canFinish(s)]).toEqual([true, false, 0, false]);
    expect(step(s)).toEqual({ at: 0, cue: 'W', n: 0 });
    // Repeat on a part-filled body steps its one move and is never watched.
    const part = made(phrases[0], 'W', null, true);
    expect(step(part)).toEqual({ at: 0, cue: 'W', n: 0 });
    expect(part.played).toBe(false);
  });

  it('Help gives a clue, then fills or repairs each target, the cap last and once, from every program', () => {
    for (const request of phrases)
      for (const { a, b, repeat, s } of all(request)) {
        const label = `${request.join('')} from ${a}${b}${repeat ? '+repeat' : ''}`;
        let before = mismatch(s);
        if (before < 0) {
          expect(help(s), label).toEqual({ kind: 'check' });
          expect(s.hints).toBe(0);
          continue;
        }
        expect(help(s), label).toEqual({ kind: 'clue', at: before, cue: request[before] ?? null });
        expect(mismatch(s)).toBe(before);
        let repairs = 0;
        let capRepairs = 0;
        while (mismatch(s) >= 0) {
          before = mismatch(s);
          const r = help(s);
          expect(r, label).toEqual({ kind: 'repair', at: before, cue: request[before] ?? null });
          if (before === REPEAT) capRepairs++;
          // Each repair fixes its own target and the next mismatch is later or gone.
          const after = mismatch(s);
          expect(after < 0 || after > before, label).toBe(true);
          expect(++repairs).toBeLessThanOrEqual(3);
        }
        expect(capRepairs).toBe(repeat ? 0 : 1);
        expect([s.program, s.repeat], label).toEqual([[...request], true]);
        expect(s.hints, label).toBe(1 + repairs);
        // Help never checks: the show still has to be checked deliberately, and nothing was a miss.
        expect(help(s)).toEqual({ kind: 'check' });
        expect([s.checked, s.misses, canFinish(s)]).toEqual([false, 0, false]);
        expect(checkRun(s)).toBe(-1);
        expect(help(s)).toEqual({ kind: 'finish' });
        expect(canFinish(s)).toBe(true);
      }
  });

  it('only wrong Checks miss; two bring the clue once; help identities survive Undo and Start again', () => {
    const s = made(phrases[0], 'W', 'T', false);
    playRun(s);
    finishRun(s);
    step(s);
    toggleRepeat(s);
    toggleRepeat(s);
    expect([s.misses, s.hints]).toEqual([0, 0]);
    expect(checkRun(s)).toBe(REPEAT);
    expect([s.misses, s.hints]).toEqual([1, 0]);
    expect(checkRun(s)).toBe(REPEAT);
    expect([s.misses, s.hints, [...s.helped]]).toEqual([2, 1, ['clue:repeat']]);
    // The clue was already supplied, so Help turns Repeat on: one more hint.
    expect(help(s)).toEqual({ kind: 'repair', at: REPEAT, cue: null });
    expect([s.repeat, s.hints]).toEqual([true, 2]);
    // Undo and supply it again, then Start again and supply everything again: the cap's repair is charged once.
    undo(s);
    expect(s.repeat).toBe(false);
    help(s);
    expect([s.repeat, s.hints]).toEqual([true, 2]);
    restart(s);
    expect([s.program, s.repeat, s.misses, s.hints, s.undo]).toEqual([[null, null], false, 2, 2, null]);
    help(s);
    help(s);
    help(s);
    expect([s.program, s.repeat]).toEqual([['W', 'T'], true]);
    expect([...s.helped].sort()).toEqual(['clue:repeat', 'repair:repeat', 'repair:slot:0', 'repair:slot:1']);
    expect(s.hints).toBe(4);
  });

  it('the demonstration places the phrase, turns Repeat on, plays, checks and finishes unaided', () => {
    for (const request of phrases) {
      const s = newStudio(2, request, 'repeat');
      const presses: string[] = [];
      for (let i = 0; i < 12; i++) {
        const p = demoNext(s, false);
        if (p === 'finish') break;
        if (p === 'repeat') toggleRepeat(s);
        else if (p === 'play') {
          expect(playRun(s)).toEqual([...request, ...request]);
          finishRun(s);
        } else if (p === 'check') checkRun(s);
        else if ('action' in p) tapAction(s, p.action);
        else throw new Error('the demonstration never selects or fires at level 5');
        presses.push(typeof p === 'string' ? p : (p as { action: Cue }).action);
      }
      expect(presses).toEqual([request[0], request[1], 'repeat', 'play', 'check']);
      expect(canFinish(s)).toBe(true);
      expect([s.misses, s.hints]).toEqual([0, 0]);
    }
  });
});

describe('sticker recipe', () => {
  it('is deterministic per seed and always valid', () => {
    for (let seed = 1; seed <= 100; seed++) {
      const a = stickerRecipe(new Rng(seed));
      const b = stickerRecipe(new Rng(seed));
      expect(a).toEqual(b);
      expect(CUES).toContain(a.cue);
      expect(a.color).toBeGreaterThanOrEqual(0);
      expect(a.color).toBeLessThanOrEqual(5);
    }
  });

  it('varies across seeds', () => {
    const seen = new Set<string>();
    for (let seed = 1; seed <= 100; seed++) seen.add(JSON.stringify(stickerRecipe(new Rng(seed))));
    expect(seen.size).toBeGreaterThan(3);
  });
});
