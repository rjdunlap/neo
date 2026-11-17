import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import {
  acts,
  canFinish,
  checkRows,
  checkRun,
  CUES,
  delivers,
  demoNext,
  finishRun,
  fire,
  help,
  isComplete,
  isProgram,
  isShow,
  LEVELS,
  MOVES,
  mismatch,
  newStudio,
  planFor,
  PASS_ACTS,
  PLANS,
  playRun,
  RECEIVER,
  RECEIVERS,
  REPEAT,
  requestFor,
  restart,
  run,
  shapeOf,
  SIGNALS,
  step,
  startFor,
  stickerRecipe,
  tapAction,
  tapSlot,
  targetOf,
  toggleReceiver,
  toggleRepeat,
  trace,
  undo,
  wanted,
  type Act,
  type Cue,
  type Move,
  type PassStart,
  type Receiver,
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
  it('levels 1–6 have one slot, then two', () => {
    expect(PLANS.map((p) => p.slots)).toEqual([1, 2, 2, 2, 2, 2]);
    expect(PLANS.map(shapeOf)).toEqual(['show', 'show', 'show', 'rows', 'repeat', 'pass']);
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
      } else if (p === 'repeat' || p === 'receiver') {
        throw new Error('Repeat belongs to level 5 and the receiver to level 6');
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

  it('school plays 3–6 with entry 3, and the seed picks one of two opposite requests', () => {
    expect(LEVELS.school).toEqual({ min: 3, max: 6 });
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
        } else if (p === 'play' || p === 'repeat' || p === 'receiver')
          throw new Error('Play, Repeat and the receiver are not at level 4');
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
        if (p === 'receiver') throw new Error('the receiver belongs to level 6');
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

describe('level 6: pass the cue', () => {
  const plan = planFor(6);
  const starts = plan.starts!;
  const [startA, startB] = starts;
  const request = plan.request!;
  const slotsOf: Move[] = [...MOVES];
  /** A studio on a seeded start. */
  const from = (start: PassStart) => newStudio(2, request, 'pass', start);
  /** A studio holding exactly this show, built from a start with real edits (select a slot, tap a card, toggle the bird). */
  const made = (start: PassStart, a: Move, b: Move, receiver: Receiver) => {
    const s = from(start);
    [a, b].forEach((m, i) => {
      tapSlot(s, i);
      tapAction(s, m);
      s.selected = null;
    });
    if (s.receiver !== receiver) toggleReceiver(s);
    return s;
  };
  /** The targets still wrong: each pet slot against the request, and the receiver. */
  const wrong = (s: Studio) =>
    s.program.filter((c, i) => c !== request[i]).length + (s.receiver === 'leaf' ? 0 : 1);
  const everyShow = () =>
    slotsOf.flatMap((a) =>
      slotsOf.flatMap((b) => RECEIVERS.map((r) => ({ a, b, r, s: made(startA, a, b, r) }))),
    );

  it('the plan asks for wave then send, and the seed reaches both starts without touching other plans', () => {
    expect(shapeOf(plan)).toBe('pass');
    expect(request).toEqual(['W', 'S']);
    expect(starts).toEqual([
      { program: ['W', 'S'], receiver: 'shell' },
      { program: ['S', 'W'], receiver: 'leaf' },
    ]);
    expect(PASS_ACTS).toEqual(['P:W', 'P:S', 'B:F']);
    const seen = new Set<PassStart>();
    for (let seed = 1; seed <= 60; seed++) seen.add(startFor(plan, new Rng(seed))!);
    expect(seen).toEqual(new Set(starts));
    // Same seed, same start.
    for (let seed = 1; seed <= 20; seed++)
      expect(startFor(plan, new Rng(seed))).toBe(startFor(plan, new Rng(seed)));
    // Every other plan has no start and leaves the generator where it was.
    for (const other of PLANS.filter((p) => p.level !== 6)) {
      const rng = new Rng(7);
      expect(startFor(other, rng)).toBeUndefined();
      expect(rng.int(0, 1000)).toBe(new Rng(7).int(0, 1000));
    }
  });

  it('a new studio starts on the seeded program and receiver', () => {
    for (const start of starts) {
      const s = from(start);
      expect(s.program).toEqual(start.program);
      expect(s.receiver).toBe(start.receiver);
      expect([s.pass, s.rows, s.repeats, s.repeat]).toEqual([start, false, false, false]);
      expect([s.misses, s.hints, s.checked, s.played, s.undo]).toEqual([0, 0, false, false, null]);
      // The start is copied, so editing never changes the authored plan.
      tapSlot(s, 0);
      tapAction(s, 'T');
      expect(start.program).not.toContain('T');
    }
    // A pass studio needs both a request and a start; otherwise it is a plain creation or repair studio.
    expect(newStudio(2, request, 'pass').pass).toBeNull();
    expect(newStudio(2, undefined, 'pass', startA).pass).toBeNull();
    expect(newStudio(2, request, 'pass').program).toEqual(['S', 'W']);
    expect(newStudio(2, ['W', 'T']).receiver).toBe('leaf');
  });

  it('the tagged trace is accepted exactly for [wave, send] with the bird listening, across all 18 shows', () => {
    const all = everyShow();
    expect(all).toHaveLength(18);
    for (const { a, b, r, s } of all) {
      const ok = a === 'W' && b === 'S' && r === 'leaf';
      expect(acts(s)).toEqual(
        trace(s.program).flatMap((m): Act[] => [
          `P:${m}` as Act,
          ...(m === 'S' && r === 'leaf' ? (['B:F'] as Act[]) : []),
        ]),
      );
      expect(acts(s).join() === PASS_ACTS.join()).toBe(ok);
      expect(mismatch(s) < 0).toBe(ok);
      // The earliest tagged-trace difference decides the target.
      const got = acts(s);
      const first = PASS_ACTS.findIndex((x, i) => got[i] !== x);
      const want = first < 0 ? -1 : first >= 2 ? RECEIVER : first;
      expect(mismatch(s)).toBe(want);
      expect(targetOf(s, mismatch(s))).toBe(
        want < 0 ? 'slot:-1' : want === RECEIVER ? 'receiver' : `slot:${want}`,
      );
      expect(delivers(s)).toBe(r === 'leaf');
      expect(run(s)).toEqual([a, b]);
    }
    expect(RECEIVER).toBe(3);
    expect(targetOf(from(startA), 0)).toBe('slot:0');
    expect(targetOf(from(startA), 1)).toBe('slot:1');
    expect(targetOf(from(startA), RECEIVER)).toBe('receiver');
    // The receiver target exists only where there is a bird.
    expect(targetOf(newStudio(2, ['W', 'T']), RECEIVER)).toBe('slot:3');
  });

  it('delivery is synchronous, an unmatched Send never runs the bird, and two Sends stay within four actions', () => {
    expect(acts(made(startA, 'S', 'W', 'leaf'))).toEqual(['P:S', 'B:F', 'P:W']);
    expect(acts(made(startA, 'W', 'S', 'leaf'))).toEqual(['P:W', 'P:S', 'B:F']);
    expect(acts(made(startA, 'W', 'S', 'shell'))).toEqual(['P:W', 'P:S']);
    expect(acts(made(startA, 'S', 'S', 'leaf'))).toEqual(['P:S', 'B:F', 'P:S', 'B:F']);
    expect(acts(made(startA, 'S', 'S', 'shell'))).toEqual(['P:S', 'P:S']);
    for (const { s } of everyShow()) {
      expect(acts(s).length).toBeLessThanOrEqual(4);
      // The bird never acts without a Send before it, and every fan follows its Send at once.
      const got = acts(s);
      got.forEach((a, i) => a === 'B:F' && expect(got[i - 1]).toBe('P:S'));
      expect(got.filter((a) => a === 'B:F').length).toBe(
        delivers(s) ? s.program.filter((c) => c === 'S').length : 0,
      );
    }
    // No Send, no bird; and a non-pass studio never delivers.
    expect(acts(made(startA, 'W', 'T', 'leaf'))).toEqual(['P:W', 'P:T']);
    expect(delivers(newStudio(2, ['W', 'T']))).toBe(false);
    expect(acts(newStudio(2, ['W', 'T']))).toEqual(['P:T', 'P:W']);
  });

  it('Send exists only in a pass studio, and malformed programs or receivers are not shows', () => {
    expect(isProgram(['W', 'S'], 2)).toBe(false);
    expect(isProgram(['W', 'S'], 2, true)).toBe(true);
    expect(isProgram(['S', null], 2, true)).toBe(true);
    expect(isProgram([null, 'S'], 2, true)).toBe(false);
    expect(isProgram(['W', 'X'], 2, true)).toBe(false);
    expect(isProgram(['W'], 2, true)).toBe(false);
    // Send cannot be added outside level 6, and nothing changes.
    for (const s of [
      newStudio(2, ['W', 'T']),
      newStudio(2),
      newStudio(2, request, 'rows'),
      newStudio(2, ['W', 'T'], 'repeat'),
    ]) {
      const before = s.program.slice();
      expect(tapAction(s, 'S')).toBe('full');
      expect([s.program, s.undo, s.checked]).toEqual([before, null, false]);
      expect(toggleReceiver(s)).toBe('leaf');
      expect([s.undo, s.receiver]).toEqual([null, 'leaf']);
    }
    // Cards are accepted in pass studios.
    expect(tapAction(from(startA), 'S')).toBe('full');
    const s = from(startA);
    tapSlot(s, 0);
    expect(tapAction(s, 'S')).toBe('replace');
    expect(s.program).toEqual(['S', 'S']);
    // A malformed show is rejected without running and without a miss.
    const bad = from(startA);
    bad.program = ['W', 'X'] as never;
    expect(isShow(bad)).toBe(false);
    expect(checkRun(bad)).toBeNull();
    const odd = from(startA);
    odd.receiver = 'bell' as never;
    expect(isShow(odd)).toBe(false);
    expect(checkRun(odd)).toBeNull();
    for (const x of [bad, odd]) expect([x.misses, x.hints, x.checked]).toEqual([0, 0, false]);
    for (const start of starts) expect(isShow(from(start))).toBe(true);
    // A pass program in a studio that is not level 6 is not a show either.
    const plain = newStudio(2, ['W', 'T']);
    plain.program = ['W', 'S'];
    expect(isShow(plain)).toBe(false);
    expect(checkRun(plain)).toBeNull();
  });

  it('only a completed wrong Check misses, and two of them supply the clue as one hint', () => {
    const s = from(startA);
    expect(checkRun(s)).toBe(RECEIVER);
    expect([s.misses, s.hints]).toEqual([1, 0]);
    expect(checkRun(s)).toBe(RECEIVER);
    expect([s.misses, s.hints, [...s.helped]]).toEqual([2, 1, ['clue:receiver']]);
    expect(checkRun(s)).toBe(RECEIVER);
    expect([s.misses, s.hints]).toEqual([3, 1]);
    // Start B names the first wrong slot.
    const b = from(startB);
    checkRun(b);
    checkRun(b);
    expect([b.misses, b.hints, [...b.helped]]).toEqual([2, 1, ['clue:slot:0']]);
    // A correct Check is not a miss.
    const ok = made(startA, 'W', 'S', 'leaf');
    expect(checkRun(ok)).toBe(-1);
    expect([ok.misses, ok.checked, canFinish(ok)]).toEqual([0, true, true]);
  });

  it('free actions never add a miss or a hint', () => {
    for (const start of starts) {
      const s = from(start);
      toggleReceiver(s);
      tapSlot(s, 0);
      tapAction(s, 'T');
      tapSlot(s, 1);
      tapSlot(s, 1);
      tapAction(s, 'S');
      playRun(s);
      step(s);
      step(s);
      step(s);
      undo(s);
      undo(s);
      restart(s);
      expect([s.misses, s.hints, s.helped.size]).toEqual([0, 0, 0]);
    }
  });

  it('the receiver toggle is an edit: it clears Check and playback, and Undo restores it', () => {
    const s = made(startA, 'W', 'S', 'leaf');
    expect(checkRun(s)).toBe(-1);
    finishRun(s);
    expect([s.checked, s.played]).toEqual([true, true]);
    s.selected = 0;
    expect(toggleReceiver(s)).toBe('shell');
    expect([s.checked, s.played, s.selected, s.stepAt, s.receiver, s.undoReceiver]).toEqual([
      false,
      false,
      null,
      0,
      'shell',
      'leaf',
    ]);
    expect(s.program).toEqual(['W', 'S']);
    expect(undo(s)).toBe(true);
    expect([s.receiver, s.checked, s.played]).toEqual(['leaf', false, false]);
    expect(undo(s)).toBe(false);
    // Two toggles come back to where it started.
    const twice = from(startA);
    toggleReceiver(twice);
    expect(toggleReceiver(twice)).toBe('shell');
  });

  it('Help reaches a matching show from both starts: one repair for A, two for B, each reducing what is wrong', () => {
    for (const [start, repairs] of [
      [startA, ['repair:receiver']],
      [startB, ['repair:slot:0', 'repair:slot:1']],
    ] as const) {
      const s = from(start);
      expect(wrong(s)).toBe(repairs.length);
      const target = mismatch(s);
      const first = help(s);
      expect(first).toMatchObject({ kind: 'clue', at: target });
      expect(s.hints).toBe(1);
      // The clue changes nothing in the show.
      expect(s.program).toEqual(start.program);
      expect(s.receiver).toBe(start.receiver);
      const ids: string[] = [];
      while (mismatch(s) >= 0) {
        const before = wrong(s);
        const r = help(s);
        expect(r.kind).toBe('repair');
        expect(wrong(s)).toBeLessThan(before);
        ids.push([...s.helped].at(-1)!);
      }
      expect(ids).toEqual(repairs);
      expect(s.hints).toBe(1 + repairs.length);
      expect(s.program).toEqual(request);
      expect(s.receiver).toBe('leaf');
      expect(acts(s)).toEqual(PASS_ACTS);
      // Correct: Check is offered, it performs the show, then Finish.
      expect(help(s)).toEqual({ kind: 'check' });
      expect(canFinish(s)).toBe(false);
      expect(checkRun(s)).toBe(-1);
      expect(help(s)).toEqual({ kind: 'finish' });
      expect(canFinish(s)).toBe(true);
      expect([s.misses, s.hints]).toEqual([0, 1 + repairs.length]);
    }
  });

  it('repair describes its target: the receiver has no card, a slot has its requested one', () => {
    const a = from(startA);
    help(a);
    expect(help(a)).toEqual({ kind: 'repair', at: RECEIVER, cue: null });
    const b = from(startB);
    help(b);
    expect(help(b)).toEqual({ kind: 'repair', at: 0, cue: 'W' });
    expect(help(b)).toEqual({ kind: 'repair', at: 1, cue: 'S' });
  });

  it('help identities survive Undo and Start again, so the same help is never charged twice', () => {
    for (const start of starts) {
      const s = from(start);
      const ids: string[] = [];
      while (mismatch(s) >= 0) {
        help(s);
        ids.push(...s.helped);
      }
      const hints = s.hints;
      const set = new Set(s.helped);
      // Walk it again after Undo and after Start again: nothing new is charged.
      undo(s);
      while (mismatch(s) >= 0) help(s);
      expect([s.hints, new Set(s.helped)]).toEqual([hints, set]);
      restart(s);
      expect([s.program, s.receiver]).toEqual([start.program, start.receiver]);
      expect(s.hints).toBe(hints);
      while (mismatch(s) >= 0) help(s);
      expect([s.hints, new Set(s.helped)]).toEqual([hints, set]);
      // Asking for the clue again by a wrong Check after help is free too.
      restart(s);
      checkRun(s);
      checkRun(s);
      expect(s.hints).toBe(hints);
    }
  });

  it('Step advances one pet command, with the delivery belonging to the Send, and marks played at the end', () => {
    const s = made(startA, 'W', 'S', 'leaf');
    expect(step(s)).toEqual({ at: 0, cue: 'W', n: 0 });
    expect(s.played).toBe(false);
    expect(step(s)).toEqual({ at: 1, cue: 'S', n: 1 });
    expect(s.played).toBe(true);
    // Two presses for a full show, even with the bird listening; the run is the pet's two commands.
    expect(run(s)).toEqual(['W', 'S']);
    expect(playRun(s)).toEqual(['W', 'S']);
    // Another press starts again from the neutral pose.
    expect(step(s)).toEqual({ at: 0, cue: 'W', n: 0 });
    // An edit clears the finished run.
    tapSlot(s, 1);
    tapAction(s, 'W');
    expect([s.played, s.stepAt]).toEqual([false, 0]);
    // The same count with nobody listening.
    const quiet = made(startA, 'S', 'S', 'shell');
    expect([step(quiet)?.n, step(quiet)?.n, quiet.played]).toEqual([0, 1, true]);
  });

  it('Start again restores the seeded start and keeps misses and help', () => {
    for (const start of starts) {
      const s = from(start);
      checkRun(s);
      checkRun(s);
      help(s);
      toggleReceiver(s);
      tapSlot(s, 0);
      tapAction(s, 'T');
      const [misses, hints, helped] = [s.misses, s.hints, new Set(s.helped)];
      restart(s);
      expect([s.program, s.receiver, s.undo, s.checked, s.played, s.selected]).toEqual([
        start.program,
        start.receiver,
        null,
        false,
        false,
        null,
      ]);
      expect([s.misses, s.hints, s.helped]).toEqual([misses, hints, helped]);
      expect(s.program).not.toBe(start.program);
    }
  });

  it('the demonstration drives real edits to a finish from both starts', () => {
    const play = (start: PassStart) => {
      const s = from(start);
      const log: string[] = [];
      let watchedIt = false;
      for (let i = 0; i < 12; i++) {
        const press = demoNext(s, false, [], watchedIt);
        if (press === 'finish') {
          log.push('finish');
          expect(canFinish(s)).toBe(true);
          break;
        }
        if (press === 'play') {
          log.push('play');
          playRun(s);
          finishRun(s);
          watchedIt = true;
        } else if (press === 'receiver') {
          log.push('receiver');
          toggleReceiver(s);
        } else if (press === 'check') {
          log.push('check');
          expect(checkRun(s)).toBe(-1);
        } else if (typeof press === 'string') {
          throw new Error(`unexpected press ${press}`);
        } else if ('slot' in press) {
          log.push(`slot ${press.slot}`);
          tapSlot(s, press.slot);
        } else if ('action' in press) {
          log.push(`action ${press.action}`);
          tapAction(s, press.action);
        } else throw new Error('unexpected press');
      }
      expect(s.misses).toBe(0);
      expect(s.hints).toBe(0);
      return log;
    };
    expect(play(startA)).toEqual(['play', 'receiver', 'check', 'finish']);
    expect(play(startB)).toEqual(['play', 'slot 0', 'action W', 'slot 1', 'action S', 'check', 'finish']);
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
