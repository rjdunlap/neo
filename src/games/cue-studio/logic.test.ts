import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import {
  canFinish, CUES, demoNext, finishRun, help, isComplete, isProgram, newStudio, planFor, PLANS, playRun, restart, step,
  stickerRecipe, tapAction, tapSlot, trace, undo, type Cue, type Studio,
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
  it('level 1 has one slot and level 2 has two', () => {
    expect(PLANS.map((p) => p.slots)).toEqual([1, 2]);
    expect(planFor(2).slots).toBe(2);
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
      ['replace', (s) => { tapSlot(s, 0); tapAction(s, 'T'); }],
      ['undo', (s) => { undo(s); }],
      ['help insert', (s) => { undo(s); finishRun(s); help(s); }],
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
    expect(step(s)).toEqual({ at: 0, cue: 'T' });
    expect(canFinish(s)).toBe(false);
    expect(step(newStudio(2))).toBeNull();
  });

  it('stepping a full trace to the end enables finish like Play', () => {
    const s = newStudio(2);
    fill(s, 'W', 'T');
    expect(step(s)).toEqual({ at: 0, cue: 'W' });
    expect(canFinish(s)).toBe(false);
    expect(step(s)).toEqual({ at: 1, cue: 'T' });
    expect(canFinish(s)).toBe(true);
    expect(step(s)).toEqual({ at: 0, cue: 'W' });
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

describe('the demonstration', () => {
  /** Applies the ghost finger's presses the way the game would. */
  function runDemo(slots: number) {
    const s = newStudio(slots);
    let changed = false;
    let replaced = false;
    for (let i = 0; i < 20; i++) {
      const p = demoNext(s, changed);
      if (p === 'finish') return { s, replaced, done: true };
      if (p === 'play') {
        playRun(s);
        finishRun(s);
        if (replaced) changed = true;
      } else if ('slot' in p) {
        tapSlot(s, p.slot);
      } else {
        const r = tapAction(s, p.action);
        if (r === 'replace') { replaced = true; changed = true; }
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

  it('level 2 reaches a finishable state with no hints and makes a replacement', () => {
    const { s, done, replaced } = runDemo(2);
    expect(done).toBe(true);
    expect(replaced).toBe(true);
    expect(canFinish(s)).toBe(true);
    expect(s.hints).toBe(0);
    expect(s.program).toEqual(['T', 'T']);
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
