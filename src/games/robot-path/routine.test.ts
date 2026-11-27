import { describe, expect, it } from 'vitest';
import { LEVELS } from './logic';
import {
  applyTile,
  copyEditor,
  endRoutineVisit,
  expandRoutine,
  nextRoutinePlan,
  routinePress,
  ROUTINE_PLANS,
  runRoutine,
  selectSlot,
  startEditor,
  winningPrograms,
  type Editor,
} from './routine';

describe.each(ROUTINE_PLANS)('Level 15 board $name', (plan) => {
  it('is a corridor from the start to the star, everything else blocked', () => {
    expect(plan.corridor[0]).toEqual([0, 0]);
    expect(plan.goal).toEqual(plan.corridor[plan.corridor.length - 1]);
    expect(plan.rocks.length).toBe(16 - plan.corridor.length);
    expect(plan.corridor.length - 1).toBeGreaterThanOrEqual(5);
  });

  it('has winning programs and every one calls the routine at least twice', () => {
    const wins = winningPrograms(plan);
    expect(wins.length).toBeGreaterThan(0);
    for (const w of wins) {
      const run = runRoutine(plan, w.main, w.routine);
      expect(run.kind === 'ran' && run.calls).toBeGreaterThanOrEqual(2);
    }
  });

  it('cannot be won with one call or none (reuse is necessary)', () => {
    for (const w of winningPrograms(plan))
      expect(w.main.filter((t) => t === 'call').length).toBeGreaterThanOrEqual(2);
  });

  it('lets the ghost finger win from the start and after a wrong edit in either row', () => {
    const play = (e: Editor) => {
      for (let n = 0; n < 40; n++) {
        const p = routinePress(plan, e);
        if ('play' in p) return true;
        if ('slot' in p) expect(selectSlot(e, p.slot.row, p.slot.i)).toBe(true);
        else expect(applyTile(e, p.tile)).toBe('ok');
      }
      return false;
    };
    expect(play(startEditor(plan))).toBe(true);
    const wrongRoutine = startEditor(plan);
    wrongRoutine.routine = ['left'];
    wrongRoutine.sel = { row: 'routine', i: 1 };
    expect(play(wrongRoutine)).toBe(true);
    const wrongMain = startEditor(plan);
    wrongMain.main = ['up', 'up', 'up'];
    wrongMain.sel = { row: 'main', i: 0 };
    expect(play(wrongMain)).toBe(true);
    const full = startEditor(plan);
    full.routine = ['up', 'left'];
    full.main = ['left', 'left', 'left'];
    expect(play(full)).toBe(true);
  });
});

describe('Level 15 rules', () => {
  it('runs the examples from the definition', () => {
    const [around, steps] = ROUTINE_PLANS;
    expect(runRoutine(around, ['call', 'right', 'call'], ['right', 'down'])).toMatchObject({
      success: true,
      calls: 2,
    });
    expect(runRoutine(steps, ['down', 'call', 'call'], ['right', 'down'])).toMatchObject({ success: true });
    expect(runRoutine(steps, ['call', 'call', 'down'], ['down', 'right'])).toMatchObject({ success: true });
  });

  it('never runs an empty or nested call, and the empty main row points at play', () => {
    const [plan] = ROUTINE_PLANS;
    expect(expandRoutine(['call'], [])).toBeNull();
    expect(runRoutine(plan, ['call'], [])).toEqual({ kind: 'incomplete', row: 'routine' });
    expect(runRoutine(plan, [], ['right'])).toEqual({ kind: 'incomplete', row: 'play' });
    const e = startEditor(plan);
    e.routine = [];
    e.sel = { row: 'main', i: 0 };
    expect(applyTile(e, 'call')).toBe('needs-routine');
    e.sel = { row: 'routine', i: 0 };
    expect(applyTile(e, 'call')).toBe('needs-main');
    expect(e.main).toEqual([]);
  });

  it('traces each step to its main slot, and the routine slot inside a call', () => {
    const run = expandRoutine(['call', 'right', 'call'], ['right', 'down'])!;
    expect(run.main).toEqual([0, 0, 1, 2, 2]);
    expect(run.sub).toEqual([0, 1, -1, 0, 1]);
  });

  it('a bump and a short walk are misses, with the stopping cell shown', () => {
    const [plan] = ROUTINE_PLANS;
    const bump = runRoutine(plan, ['down', 'call'], ['right', 'down']);
    expect(bump).toMatchObject({ kind: 'ran', success: false, stop: 'bump' });
    const short = runRoutine(plan, ['call'], ['right', 'down']);
    expect(short).toMatchObject({ kind: 'ran', success: false, stop: 'short' });
    expect(short.kind === 'ran' && short.path[short.path.length - 1]).toEqual([1, 1]);
  });

  it('edits advance selection within a row, replace filled slots and Undo copies restore both rows', () => {
    const e = startEditor(ROUTINE_PLANS[1]);
    expect(e.sel).toEqual({ row: 'routine', i: 0 });
    const before = copyEditor(e);
    applyTile(e, 'right');
    expect(e.sel).toEqual({ row: 'routine', i: 1 });
    applyTile(e, 'down');
    expect(e.routine).toEqual(['right', 'down']);
    expect(selectSlot(e, 'routine', 0)).toBe(true);
    applyTile(e, 'up');
    expect(e.routine).toEqual(['up', 'down']);
    expect(selectSlot(e, 'main', 2)).toBe(false);
    expect(before.routine).toEqual([]);
  });

  it('adds level 15 to school alone', () => {
    expect(LEVELS.school!.max).toBe(15);
    expect(LEVELS.prek!.max).toBe(6);
    expect(LEVELS.preschool!.max).toBe(2);
  });
});

describe('Level 15 entry', () => {
  it('opens on the first board whatever the seed says, then follows the seeded pick', () => {
    endRoutineVisit();
    expect(nextRoutinePlan(() => 1)).toBe(ROUTINE_PLANS[0]);
    expect(nextRoutinePlan(() => 1)).toBe(ROUTINE_PLANS[1]);
    expect(nextRoutinePlan(() => 0)).toBe(ROUTINE_PLANS[0]);
  });

  it('opens on the first board again after the visit ends', () => {
    endRoutineVisit();
    nextRoutinePlan(() => 1);
    endRoutineVisit();
    expect(nextRoutinePlan(() => 1)).toBe(ROUTINE_PLANS[0]);
  });
});
