import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { clockTower } from './index';
import { howToFor } from '../../content/howto';
import { appointmentFor, demoAction, requestFor, EVENTS, FIVE_ASKED, handsFor, hourOf, makeTasks, minuteChoices, PLANS, spoken, timeOf } from './logic';

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

  it('keeps every request visible without giving away the later answer, with speech from the same time', () => {
    for (const plan of PLANS) for (let seed = 1; seed <= 100; seed++) for (const task of makeTasks(plan, new Rng(seed))) {
      const request = requestFor(plan.mode, task);
      const time = plan.mode === 'later' ? task.from! : task.time;
      expect(request.time).toBe(`${hourOf(time)}:${String(time % 60).padStart(2, '0')}`);
      expect(request.speech).toBe(spoken(time));
      if (plan.mode === 'later') expect(request.time).not.toBe(requestFor('oclock', task).time);
      if (plan.mode === 'five') expect(request.speech).not.toContain(':');
    }
    expect(spoken(timeOf(3, 5))).toBe('three oh five');
    expect(spoken(timeOf(12, 55))).toBe('twelve fifty five');
  });

  it('covers the current plans and truthfully explains the four answers and automatic support', () => {
    expect(clockTower.levels('prek')).toEqual({ min: 1, max: 4 });
    expect(clockTower.levels('school')).toEqual({ min: 2, max: PLANS.length });
    for (let level = 1; level <= PLANS.length; level++) {
      expect(PLANS[level - 1].rounds).toBe(4);
      const card = howToFor(clockTower, level)!;
      expect(card.finish).toBe('Four correct answers complete the round.');
      expect(card.note).toContain('After two misses');
      expect(card.note).toContain(level === 5 ? 'picture glows' : 'yellow hands');
      if (level === 5) {
        expect(card.steps.join(' ')).toContain('pretend plan');
        expect(card.steps.join(' ')).toContain('tap the time to hear it for free');
      }
    }
  });

  it('pins the original icon and seeded sticker drawings', () => {
    const fingerprint = (node: import('pixi.js').Container): number => {
      const paths: unknown[] = [];
      const visit = (n: import('pixi.js').Container) => {
        if ('context' in n) for (const i of (n as import('pixi.js').Graphics).context.instructions) {
          if (i.action === 'texture') throw new Error('Clock art stays code-drawn');
          const { texture: _texture, ...style } = i.data.style;
          paths.push({ action: i.action, path: i.data.path.instructions, style });
        }
        n.children.forEach(visit);
      };
      visit(node);
      const hash = [...JSON.stringify(paths)].reduce((h, ch) => Math.imul(h ^ ch.charCodeAt(0), 16777619) >>> 0, 2166136261);
      node.destroy({ children: true });
      return hash;
    };
    expect(Array.from({ length: 100 }, (_, seed) => fingerprint(clockTower.sticker(seed)))).toMatchSnapshot();
    expect(fingerprint(clockTower.hubIcon())).toMatchSnapshot();
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

  it('five-minute level asks only for new minutes, each on a mark the long hand snaps to', () => {
    const plan = PLANS.find((p) => p.mode === 'five')!;
    expect(minuteChoices('five')).toHaveLength(12);
    for (let seed = 1; seed <= 200; seed++) for (const t of makeTasks(plan, new Rng(seed))) {
      expect(FIVE_ASKED).toContain(t.time % 60);
      expect(minuteChoices('five')).toContain(t.time % 60);
    }
    expect(spoken(timeOf(3, 25))).toBe('three twenty five');
    expect(handsFor(timeOf(3, 25)).minute).toBe(25);
  });

  it('supplies three distinct visible appointment times, one match and four distinct seeded targets', () => {
    const plan = PLANS.find((p) => p.mode === 'read')!;
    const seen = new Map<string, Set<number>>();
    const targets = new Set<number>();
    for (let seed = 1; seed <= 200; seed++) {
      const tasks = makeTasks(plan, new Rng(seed));
      expect(tasks).toEqual(makeTasks(plan, new Rng(seed)));
      expect(new Set(tasks.map((task) => task.time)).size).toBe(4);
      expect(tasks[0].options).toEqual(expect.arrayContaining([
        { id: 'lunch', time: 0 }, { id: 'park', time: 180 }, { id: 'bath', time: 390 },
      ]));
      for (const t of tasks) {
        targets.add(t.time);
        expect(t.options).toHaveLength(3);
        expect(new Set(t.options!.map((a) => a.id)).size).toBe(3);
        expect(new Set(t.options!.map((a) => a.time)).size).toBe(3);
        expect(t.options!.filter((a) => a.time === t.time)).toHaveLength(1);
        for (const a of t.options!) {
          expect(EVENTS).toContain(a.id);
          expect(a.time).toBeGreaterThanOrEqual(0);
          expect(a.time).toBeLessThan(720);
          expect([0, 30]).toContain(a.time % 60);
          const evidence = appointmentFor(a);
          expect(evidence.event.length).toBeGreaterThan(0);
          expect(evidence.time).toBe(`${hourOf(a.time)}:${String(a.time % 60).padStart(2, '0')}`);
          expect(evidence.speech).toBe(spoken(a.time));
          const times = seen.get(a.id) ?? new Set<number>();
          times.add(a.time); seen.set(a.id, times);
        }
      }
    }
    expect(targets.size).toBe(24);
    expect([...seen.keys()].sort()).toEqual([...EVENTS].sort());
    for (const times of seen.values()) expect(times.size).toBe(24);
  });

  it('chooses hand turns, the matching picture, and then the bell for a clean demonstration', () => {
    for (const plan of PLANS) for (let seed = 1; seed <= 100; seed++) for (const task of makeTasks(plan, new Rng(seed))) {
      let hour = plan.mode === 'read' ? hourOf(task.time) : plan.mode === 'later' ? hourOf(task.from!) : ((hourOf(task.time) + 4) % 12 || 12);
      let minute = plan.mode === 'read' ? task.time % 60 : plan.mode === 'later' ? task.from! % 60 : 0;
      const first = demoAction(plan.mode, hour, minute, task);
      if (plan.mode === 'read') {
        expect(first.kind).toBe('pick');
        const id = (first as { kind: 'pick'; id: string }).id;
        expect(task.options!.find((a) => a.id === id)!.time).toBe(task.time);
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

  it('always asks half past at level 3, and always crosses the 12 at level 6', () => {
    for (let seed = 1; seed <= 200; seed++) {
      const half = makeTasks(PLANS[3 - 1], new Rng(seed));
      expect(half.some((task) => task.time % 60 === 30)).toBe(true);
      const later = makeTasks(PLANS[6 - 1], new Rng(seed));
      expect(later.map((task) => hourOf(task.from!))).toEqual(expect.arrayContaining([11, 12]));
      for (const task of later) expect(task.time).toBe((task.from! + 60) % 720);
      expect(new Set(later.map((task) => task.time)).size).toBe(later.length);
    }
  });
});
