import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { demoAction, EVENTS, handsFor, hourOf, makeTasks, minuteChoices, PLANS, spoken, timeOf } from './logic';

describe('Clock Tower', () => {
  it('says times the way people do, and places the hour hand between numbers after the hour', () => {
    expect(spoken(timeOf(3, 0))).toBe("3 o'clock");
    expect(spoken(timeOf(12, 0))).toBe("12 o'clock");
    expect(spoken(timeOf(3, 30))).toBe('half past 3');
    expect(spoken(timeOf(11, 15))).toBe('quarter past 11');
    expect(spoken(timeOf(12, 45))).toBe('quarter to 1');
    expect(handsFor(timeOf(3, 0))).toEqual({ hour: 15, minute: 0 });
    expect(handsFor(timeOf(3, 30))).toEqual({ hour: 17.5, minute: 30 });
    expect(handsFor(timeOf(12, 0)).hour).toBe(0);
  });

  it('asks for different times that the level\'s hands can show', () => {
    for (const plan of PLANS) {
      for (let seed = 1; seed <= 200; seed++) {
        const tasks = makeTasks(plan, new Rng(seed));
        expect(tasks).toHaveLength(plan.rounds);
        expect(new Set(tasks.map((t) => t.time)).size).toBe(tasks.length);
        for (const t of tasks) {
          expect(minuteChoices(plan.mode)).toContain(t.time % 60);
          expect(hourOf(t.time)).toBeGreaterThanOrEqual(1);
          if (plan.mode === 'later') expect(t.time).toBe((t.from! + 60) % 720);
        }
        if (plan.mode === 'quarter') expect(new Set(tasks.map((t) => t.time % 60)).size).toBe(4);
      }
    }
  });

  it('offers three pictures with only one matching the clock', () => {
    const plan = PLANS.find((p) => p.mode === 'read')!;
    for (let seed = 1; seed <= 200; seed++) {
      for (const t of makeTasks(plan, new Rng(seed))) {
        expect(t.options).toHaveLength(3);
        const matching = t.options!.filter((id) => { const e = EVENTS.find((x) => x.id === id)!; return timeOf(e.hour, e.minute) === t.time; });
        expect(matching).toHaveLength(1);
      }
    }
  });

  it('chooses hand turns, the matching picture, and then the bell for a clean demonstration', () => {
    for (const plan of PLANS) for (let seed = 1; seed <= 100; seed++) for (const task of makeTasks(plan, new Rng(seed))) {
      let hour = plan.mode === 'read' ? hourOf(task.time) : plan.mode === 'later' ? hourOf(task.from!) : ((hourOf(task.time) + 4) % 12 || 12);
      let minute = plan.mode === 'read' ? task.time % 60 : plan.mode === 'later' ? task.from! % 60 : 0;
      const first = demoAction(plan.mode, hour, minute, task);
      if (plan.mode === 'read') {
        expect(first.kind).toBe('pick');
        const id = (first as { kind: 'pick'; id: string }).id;
        const event = EVENTS.find((x) => x.id === id)!;
        expect(timeOf(event.hour, event.minute)).toBe(task.time);
        continue;
      }
      for (let moves = 0; moves < 3; moves++) {
        const action = demoAction(plan.mode, hour, minute, task);
        if (action.kind === 'minute') minute = action.minute;
        else if (action.kind === 'hour') hour = action.hour;
        else {
          expect(action.kind).toBe('check');
          expect(timeOf(hour, minute)).toBe(task.time);
          break;
        }
      }
      expect(demoAction(plan.mode, hour, minute, task).kind).toBe('check');
    }
  });
});
