import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { clockTower } from './index';
import { levelsInOrder, rangeFor } from '../../progress/difficulty';
import { howToFor } from '../../content/howto';
import { SCRIPT } from '../../content/voice-script';
import {
  appointmentFor,
  demoAction,
  fiveExample,
  halfLaterExample,
  durationOf,
  hopsFor,
  INTERVAL_LENGTHS,
  lengthOf,
  lengthWords,
  hasFrom,
  laterExample,
  requestFor,
  EVENTS,
  FIVE_ASKED,
  handsFor,
  hourOf,
  LEVELS,
  makeTasks,
  minuteChoices,
  PLANS,
  spoken,
  timeOf,
  fittingStart,
  visitFit,
  visitWords,
} from './logic';

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
    for (const plan of PLANS)
      for (let seed = 1; seed <= 100; seed++)
        for (const task of makeTasks(plan, new Rng(seed))) {
          if (plan.mode === 'how-long') continue; // its request is a question; the clocks show both times
          const request = requestFor(plan.mode, task);
          const time = hasFrom(plan.mode) ? task.from! : task.time;
          expect(request.time).toBe(`${hourOf(time)}:${String(time % 60).padStart(2, '0')}`);
          expect(request.speech).toBe(spoken(time));
          if (hasFrom(plan.mode)) expect(request.time).not.toBe(requestFor('oclock', task).time);
          if (plan.mode === 'five') expect(request.speech).not.toContain(':');
        }
    expect(spoken(timeOf(3, 5))).toBe('three oh five');
    expect(spoken(timeOf(12, 55))).toBe('twelve fifty five');
  });

  it('covers the current plans and truthfully explains the four answers and automatic support', () => {
    expect(clockTower.levels('prek')).toEqual({ min: 1, max: 4 });
    expect(clockTower.levels('school')).toEqual(LEVELS.school);
    for (let level = 1; level <= PLANS.length; level++) {
      expect(PLANS[level - 1].rounds).toBe(4);
      const card = howToFor(clockTower, level)!;
      expect(card.finish).toBe('Four correct answers complete the round.');
      expect(card.note).toContain('After two misses');
      expect(card.note).toContain(
        level === 5 ? 'picture glows' : level === 10 ? 'controls still to set glow' : 'yellow hands',
      );
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
        if ('context' in n)
          for (const i of (n as import('pixi.js').Graphics).context.instructions) {
            if (i.action === 'texture') throw new Error('Clock art stays code-drawn');
            const { texture: _texture, ...style } = i.data.style;
            paths.push({ action: i.action, path: i.data.path.instructions, style });
          }
        n.children.forEach(visit);
      };
      visit(node);
      const hash = [...JSON.stringify(paths)].reduce(
        (h, ch) => Math.imul(h ^ ch.charCodeAt(0), 16777619) >>> 0,
        2166136261,
      );
      node.destroy({ children: true });
      return hash;
    };
    expect(Array.from({ length: 100 }, (_, seed) => fingerprint(clockTower.sticker(seed)))).toMatchSnapshot();
    expect(fingerprint(clockTower.hubIcon())).toMatchSnapshot();
  });

  it("asks for different times that the level's hands can show", () => {
    for (const plan of PLANS) {
      for (let seed = 1; seed <= 200; seed++) {
        const tasks = makeTasks(plan, new Rng(seed));
        expect(tasks).toHaveLength(plan.rounds);
        expect(new Set(tasks.map((t) => t.time)).size).toBe(tasks.length);
        for (const t of tasks) {
          expect(minuteChoices(plan.mode)).toContain(t.time % 60);
          expect(hourOf(t.time)).toBeGreaterThanOrEqual(1);
          if (plan.mode === 'later') expect(t.time).toBe((t.from! + 60) % 720);
          if (plan.mode === 'earlier') expect(t.time).toBe((t.from! + 660) % 720);
          if (plan.mode === 'half-later') expect(t.time).toBe((t.from! + 30) % 720);
        }
        if (plan.mode === 'quarter') expect(new Set(tasks.map((t) => t.time % 60)).size).toBe(4);
      }
    }
  });

  it('five-minute level asks only for new minutes, each on a mark the long hand snaps to', () => {
    const plan = PLANS.find((p) => p.mode === 'five')!;
    expect(minuteChoices('five')).toHaveLength(12);
    for (let seed = 1; seed <= 200; seed++)
      for (const t of makeTasks(plan, new Rng(seed))) {
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
      expect(tasks[0].options).toEqual(
        expect.arrayContaining([
          { id: 'lunch', time: 0 },
          { id: 'park', time: 180 },
          { id: 'bath', time: 390 },
        ]),
      );
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
          times.add(a.time);
          seen.set(a.id, times);
        }
      }
    }
    expect(targets.size).toBe(24);
    expect([...seen.keys()].sort()).toEqual([...EVENTS].sort());
    for (const times of seen.values()) expect(times.size).toBe(24);
  });

  it('chooses hand turns, the matching picture, and then the bell for a clean demonstration', () => {
    for (const plan of PLANS.filter((p) => p.mode !== 'how-long'))
      for (let seed = 1; seed <= 100; seed++)
        for (const task of makeTasks(plan, new Rng(seed))) {
          let hour =
            plan.mode === 'read'
              ? hourOf(task.time)
              : hasFrom(plan.mode)
                ? hourOf(task.from!)
                : (hourOf(task.time) + 4) % 12 || 12;
          let minute = plan.mode === 'read' ? task.time % 60 : hasFrom(plan.mode) ? task.from! % 60 : 0;
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

  it('level 8 reverses level 6: an hour earlier, crossing the 12 both ways, minutes unchanged', () => {
    expect(PLANS[8 - 1].mode).toBe('earlier');
    for (let seed = 1; seed <= 200; seed++) {
      const tasks = makeTasks(PLANS[8 - 1], new Rng(seed));
      expect(tasks).toHaveLength(4);
      expect(tasks.map((task) => hourOf(task.from!))).toEqual(expect.arrayContaining([12, 1]));
      for (const task of tasks) {
        expect(task.time).toBe((task.from! + 660) % 720);
        expect(task.time % 60).toBe(task.from! % 60);
        expect([0, 30]).toContain(task.from! % 60);
        expect(hourOf(task.time)).toBe(hourOf(task.from!) === 1 ? 12 : hourOf(task.from!) - 1);
      }
      expect(new Set(tasks.map((task) => task.time)).size).toBe(tasks.length);
    }
  });

  it('plays level 8 before level 7 for school, and keeps every level reachable', () => {
    const school = rangeFor(LEVELS, 'school');
    expect(levelsInOrder(school)).toEqual([2, 3, 4, 5, 6, 8, 7, 9, 10, 11]);
    expect(rangeFor(LEVELS, 'prek').max).toBe(4);
  });

  it('level 9 asks half an hour later from all quarter starts, crossing and noncrossing', () => {
    expect(PLANS[9 - 1].mode).toBe('half-later');
    expect(minuteChoices('half-later')).toEqual([0, 15, 30, 45]);
    let sawTwelveWrap = false;
    for (let seed = 1; seed <= 200; seed++) {
      const tasks = makeTasks(PLANS[9 - 1], new Rng(seed));
      expect(tasks).toHaveLength(4);
      expect(new Set(tasks.map((task) => task.from! % 60)).size).toBe(4);
      expect(new Set(tasks.map((task) => task.time)).size).toBe(4);
      for (const task of tasks) {
        const from = task.from!;
        expect(task.time).toBe((from + 30) % 720);
        expect(minuteChoices('half-later')).toContain(from % 60);
        expect(minuteChoices('half-later')).toContain(task.time % 60);
        const crosses = from % 60 >= 30;
        expect(hourOf(task.time)).toBe(crosses ? (hourOf(from) % 12) + 1 : hourOf(from));
        if (hourOf(from) === 12 && crosses) sawTwelveWrap = true;
      }
    }
    expect(sawTwelveWrap).toBe(true);
  });

  it('explains level 9 with a +30-minute arc and crossing-hour wording when minutes wrap', () => {
    for (let hour = 1; hour <= 12; hour++)
      for (const minute of [0, 15, 30, 45]) {
        const from = timeOf(hour, minute);
        const time = (from + 30) % 720;
        const e = halfLaterExample({ from, time });
        expect(e.from).toBe(requestFor('half-later', { from, time }).time);
        expect(e.to).toBe(requestFor('oclock', { time }).time);
        expect(e.arcMinutes).toBe(30);
        expect(e.fromMinute).toBe(minute);
        expect(e.toMinute).toBe((minute + 30) % 60);
        expect(e.crossesHour).toBe(minute >= 30);
        expect(e.toHour).toBe(minute >= 30 ? (hour % 12) + 1 : hour);
        const wrong = (
          e.crossesHour ? SCRIPT['clock.half-later.wrong.cross'][0] : SCRIPT['clock.half-later.wrong'][0]
        )
          .replace('{now}', spoken(from))
          .replace('{from}', e.fromSpeech)
          .replace('{time}', e.toSpeech);
        expect(wrong).toContain(spoken(from));
        expect(wrong).toContain(spoken(time));
        if (e.crossesHour) expect(wrong).toContain('next hour');
        const right = SCRIPT['clock.half-later.example'][0]
          .replace('{from}', e.fromSpeech)
          .replace('{time}', e.toSpeech);
        expect(right).toContain(spoken(from));
        expect(right).toContain(spoken(time));
        expect(requestFor('half-later', { from, time }).heading).toBe('Half an hour after');
      }
    expect(howToFor(clockTower, 9)!.steps.join(' ')).toContain('30 minutes');
    expect(howToFor(clockTower, 9)!.note).toContain('30-minute arc');
  });

  it('explains an hour earlier with the same times as the request, moving backwards through 12', () => {
    for (let hour = 1; hour <= 12; hour++)
      for (const minute of [0, 30]) {
        const from = timeOf(hour, minute),
          time = (from + 660) % 720;
        const e = laterExample({ from, time }, 'earlier');
        expect(e.from).toBe(requestFor('earlier', { from, time }).time);
        expect(e.to).toBe(requestFor('oclock', { time }).time);
        expect(e.hourEnd - e.hourStart).toBe(-5);
        expect(((e.hourEnd % 60) + 60) % 60).toBe(handsFor(time).hour);
        const speech = SCRIPT['clock.earlier.example'][0]
          .replace('{from}', e.fromSpeech)
          .replace('{time}', e.toSpeech);
        expect(speech).toContain(spoken(from));
        expect(speech).toContain(spoken(time));
        expect(speech).toContain('minutes stay the same');
        expect(requestFor('earlier', { from, time }).heading).toBe('One hour before');
      }
    expect(howToFor(clockTower, 8)!.steps.join(' ')).toContain('one hour before');
  });

  it('explains every hour change using the old/new task times, moving forwards through 12', () => {
    for (let hour = 1; hour <= 12; hour++)
      for (const minute of [0, 30]) {
        const from = timeOf(hour, minute),
          time = (from + 60) % 720;
        const e = laterExample({ from, time });
        expect(e.from).toBe(requestFor('later', { from, time }).time);
        expect(e.to).toBe(requestFor('oclock', { time }).time);
        expect(e.fromSpeech).toBe(spoken(from));
        expect(e.toSpeech).toBe(spoken(time));
        expect(e.minute).toBe(time % 60);
        expect(e.hourStart).toBe(handsFor(from).hour);
        expect(e.hourEnd - e.hourStart).toBe(5);
        expect(e.hourEnd % 60).toBe(handsFor(time).hour);
        const speech = SCRIPT['clock.later.example'][0]
          .replace('{from}', e.fromSpeech)
          .replace('{time}', e.toSpeech);
        expect(speech).toContain(spoken(from));
        expect(speech).toContain(spoken(time));
        expect(speech).toContain('minutes stay the same');
      }
  });

  it('counts fives from zero to the requested minute, without confusing :00 with a full turn', () => {
    for (let hour = 1; hour <= 12; hour++)
      for (const minute of minuteChoices('five')) {
        const time = timeOf(hour, minute),
          e = fiveExample({ time });
        expect(e.marks).toEqual(Array.from({ length: minute / 5 }, (_, i) => (i + 1) * 5));
        expect(e.marks.at(-1) ?? 0).toBe(handsFor(time).minute);
        expect(e.counts).toBe(e.marks.join(', '));
        expect(e.time).toBe(requestFor('five', { time }).speech);
        expect(e.marks).not.toContain(60);
        const speech = SCRIPT['clock.five.help'][0].replace('{counts}', e.counts).replace('{time}', e.time);
        expect(speech).toContain(`${e.counts} minutes`);
        expect(speech).toContain(spoken(time));
      }
    expect(howToFor(clockTower, 6)!.steps.join(' ')).toContain('minutes stay the same');
    expect(howToFor(clockTower, 7)!.steps.join(' ')).toContain('zero is at 12');
    expect(howToFor(clockTower, 7)!.note).toContain('spoken counting by fives');
    expect(howToFor(clockTower, 3)!.steps.join(' ')).not.toContain('arc');
    expect(SCRIPT['clock.five.zero'][0]).toContain('zero minutes');
    expect(SCRIPT['clock.five.zero'][0]).toContain('sixty minutes');
  });

  it('level 10 asks four distinct same-day intervals the picker can reach, with one answer each', () => {
    expect(PLANS[10 - 1].mode).toBe('how-long');
    expect(LEVELS.school?.order).toEqual([2, 3, 4, 5, 6, 8, 7, 9, 10, 11]);
    const plan = PLANS[10 - 1];
    const reachable = new Set(
      [0, 1, 2, 3].flatMap((h) => [false, true].map((half) => lengthOf(h, half))).filter((d) => d > 0),
    );
    expect([...reachable].sort((a, b) => a - b)).toEqual(INTERVAL_LENGTHS);
    for (let seed = 1; seed <= 300; seed++) {
      const tasks = makeTasks(plan, new Rng(seed));
      expect(tasks).toHaveLength(4);
      expect(tasks[0]).toMatchObject({ from: 180, time: 330, start: 900, end: 1050 });
      const lengths = tasks.map(durationOf);
      expect(new Set(lengths).size).toBe(4);
      expect(lengths.some((d) => d % 60 === 0)).toBe(true);
      expect(lengths.some((d) => d % 60 === 30)).toBe(true);
      let crossing = 0;
      for (const t of tasks) {
        expect(reachable.has(durationOf(t))).toBe(true);
        expect(t.end!).toBeLessThan(1440);
        expect(t.from).toBe(t.start! % 720);
        expect(t.time).toBe(t.end! % 720);
        // The full-turn trap: no other picker value gives the same end on the face.
        expect([...reachable].filter((d) => (t.start! + d) % 720 === t.time)).toEqual([durationOf(t)]);
        if (Math.floor(t.start! / 720) !== Math.floor(t.end! / 720)) crossing++;
      }
      expect(crossing).toBeGreaterThanOrEqual(1);
    }
  });

  it('level 10 bot, words and worked count come from the same interval', () => {
    const task = { from: 180, time: 330, start: 900, end: 1050 };
    expect(demoAction('how-long', 0, 0, task)).toEqual({ kind: 'hours', hours: 2 });
    expect(demoAction('how-long', 2, 0, task)).toEqual({ kind: 'half', on: true });
    expect(demoAction('how-long', 2, 30, task)).toEqual({ kind: 'check' });
    expect(demoAction('how-long', 3, 30, task)).toEqual({ kind: 'hours', hours: 2 });
    expect(lengthWords(30)).toBe('half an hour');
    expect(lengthWords(60)).toBe('1 hour');
    expect(lengthWords(150)).toBe('2 and a half hours');
    const worked = hopsFor(task);
    expect(worked.strip).toBe('3:00 → 4:00 → 5:00 → 5:30');
    expect(worked.count).toContain('half an hour more');
    expect(worked.count).toContain('half past 5');
    expect(requestFor('how-long', task).heading).toBe('How long was it?');
    expect(howToFor(clockTower, 10)!.steps.join(' ')).toContain('half-hour button');
    expect(SCRIPT['clock.how-long'][0]).toContain('{from}');
  });

  it('level 11 asks four same-day visits, each with exactly one quarter-hour start that fits', () => {
    const plan = PLANS[11 - 1];
    expect(plan.mode).toBe('visit');
    expect(rangeFor(LEVELS, 'school').max).toBe(11);
    for (let seed = 1; seed <= 400; seed++) {
      const tasks = makeTasks(plan, new Rng(seed));
      expect(tasks).toHaveLength(4);
      expect(tasks[0].visit).toEqual({ open: 840, close: 930, length: 30, starts: [825, 870, 915] });
      const positions = new Set<number>();
      let edge = 0;
      for (const t of tasks) {
        const v = t.visit!;
        expect(v.open).toBeGreaterThanOrEqual(8 * 60);
        expect(v.close).toBeLessThanOrEqual(19 * 60);
        expect(v.close - v.open).toBeGreaterThanOrEqual(v.length);
        expect(v.starts).toHaveLength(3);
        expect(new Set(v.starts).size).toBe(3);
        expect([...v.starts].sort((a, b) => a - b)).toEqual(v.starts);
        expect(new Set(v.starts.map((x) => x % 720)).size).toBe(3);
        for (const x of v.starts) expect(x % 15).toBe(0);
        const fits = v.starts.filter((x) => visitFit(v, x) === 'fits');
        expect(fits).toHaveLength(1);
        expect(t.time).toBe(fits[0] % 720);
        expect(fittingStart(v)).toBe(fits[0]);
        // A late start begins inside the free time, so the reason is the finish, not the start.
        for (const x of v.starts) if (visitFit(v, x) === 'late') expect(x).toBeGreaterThanOrEqual(v.open);
        positions.add(v.starts.indexOf(fits[0]));
        if (fits[0] === v.open || fits[0] + v.length === v.close) edge++;
      }
      expect(edge).toBeGreaterThanOrEqual(1);
      expect(positions.size).toBe(3);
      expect(new Set(tasks.slice(1).map((t) => t.visit!.length))).toEqual(new Set([30, 60, 90]));
      expect(new Set(tasks.map((t) => t.visit!.open)).size).toBe(4);
    }
  });

  it('level 11 accepts visits that fit exactly at either edge, and explains both wrong reasons', () => {
    const v = { open: 840, close: 930, length: 30, starts: [825, 870, 915] };
    expect(visitFit(v, 840)).toBe('fits');
    expect(visitFit(v, 900)).toBe('fits');
    expect(visitFit(v, 825)).toBe('early');
    expect(visitFit(v, 915)).toBe('late');
    const words = visitWords(v, 915);
    expect(words).toMatchObject({
      openFace: '2:00',
      closeFace: '3:30',
      start: 'quarter past 3',
      finish: 'quarter to 4',
    });
    expect(visitWords({ ...v, length: 90 }).lengthFace).toBe('1 and a half hours');
    expect(visitWords(v).lengthFace).toBe('30 minutes');
    const late = SCRIPT['clock.visit.late'][0];
    expect(late).toContain('{finish}');
    expect(late).toContain('{close}');
    expect(SCRIPT['clock.visit.early'][0]).toContain('{open}');
    expect(howToFor(clockTower, 11)!.steps.join(' ')).toContain('both fit');
    expect(howToFor(clockTower, 10)!.steps.join(' ')).not.toContain('free time');
  });

  it('level 11 bot chooses the fitting start, then sets the hands to it', () => {
    const v = { open: 840, close: 930, length: 30, starts: [825, 870, 915] };
    const task = { time: 870 % 720, visit: v };
    expect(demoAction('visit', 8, 0, task, false)).toEqual({ kind: 'pick', id: '870' });
    expect(demoAction('visit', 8, 0, task, true)).toEqual({ kind: 'minute', minute: 30 });
    expect(demoAction('visit', 8, 30, task, true)).toEqual({ kind: 'hour', hour: 2 });
    expect(demoAction('visit', 2, 30, task, true)).toEqual({ kind: 'check' });
    expect(minuteChoices('visit')).toEqual([0, 15, 30, 45]);
  });
});
