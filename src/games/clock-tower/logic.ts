import type { Rng } from '../../engine/random';
import type { BandLevels } from '../../progress/difficulty';

/**
 * Clock Tower: set the big clock by dragging its hands, which snap to the marks. First the hour
 * hand alone, then both hands for o'clock, half past, and quarter past and to. Then read the
 * clock and choose a visible fictional appointment, set an hour later, an hour earlier, five-minute
 * times, and half an hour from now. Last, two fixed clocks show a start and an end, and she chooses how
 * long it was with an hours picker and a half-hour toggle.
 *
 * Times are in minutes after midnight on a 12-hour face; the hour hand moves with the minutes,
 * as on a real clock, so half past three has it halfway between 3 and 4.
 */
export type ClockMode =
  'hour' | 'oclock' | 'half' | 'quarter' | 'read' | 'later' | 'five' | 'earlier' | 'half-later' | 'how-long';

export interface ClockPlan {
  mode: ClockMode;
  rounds: number;
  name: string;
}

export const PLANS: ClockPlan[] = [
  {
    mode: 'hour',
    rounds: 4,
    name: 'Turn the short hand to the hour: "3 o\'clock" (the long hand stays at 12)',
  },
  { mode: 'oclock', rounds: 4, name: "Set both hands for o'clock times" },
  { mode: 'half', rounds: 4, name: 'Half past: the long hand at 6, the short hand between two numbers' },
  { mode: 'quarter', rounds: 4, name: 'Quarter past and quarter to' },
  {
    mode: 'read',
    rounds: 4,
    name: 'Match the clock to a pictured appointment with a visible, replayable time',
  },
  {
    mode: 'later',
    rounds: 4,
    name: "One hour later: set the clock an hour after the time shown (o'clock and half past)",
  },
  {
    mode: 'five',
    rounds: 4,
    name: 'Five-minute times: count by fives to set 3:25 (the long hand stops at any number)',
  },
  {
    mode: 'earlier',
    rounds: 4,
    name: "One hour earlier: set the clock an hour before the time shown (o'clock and half past)",
  },
  {
    mode: 'half-later',
    rounds: 4,
    name: 'Half an hour from now: set the clock 30 minutes after the time shown (crossing the hour when needed)',
  },
  {
    mode: 'how-long',
    rounds: 4,
    name: 'How long? Two clocks show a start and an end; choose the hours and half hour between them',
  },
];

/** Levels 6 and 8 both change the shown time by whole hours; these are the modes with a comparison panel. */
export const isShift = (mode: ClockMode): mode is 'later' | 'earlier' =>
  mode === 'later' || mode === 'earlier';

/** Modes that start from a given `task.from` time instead of a fixed default face. */
export const hasFrom = (mode: ClockMode): mode is 'later' | 'earlier' | 'half-later' =>
  isShift(mode) || mode === 'half-later';

/** Minutes added on the 12-hour face: an hour later, or an hour earlier (+11 hours). */
const SHIFT: Record<'later' | 'earlier', number> = { later: 60, earlier: 660 };
/** The starting hours that make the change cross the 12: 11→12 and 12→1, or 12→11 and 1→12. */
const WRAP_HOURS: Record<'later' | 'earlier', number[]> = { later: [11, 12], earlier: [12, 1] };

/** The interval level: fixed start and end clocks, no hands to turn, a picker for the length. */
export const isInterval = (mode: ClockMode): mode is 'how-long' => mode === 'how-long';

/** Longest picker value in whole hours; with the half hour the picker reaches 30–210 minutes. */
export const MAX_HOURS = 3;

export const LEVELS: BandLevels = {
  prek: { min: 1, max: 4 },
  // Level 8 (an hour earlier) is easier than 7's five-minute times, so it plays before it; level 9 follows 7.
  school: { min: 2, max: PLANS.length, order: [2, 3, 4, 5, 6, 8, 7, 9, 10] },
};

export const planFor = (level: number) => PLANS[Math.min(PLANS.length, Math.max(1, level)) - 1];

/** Minutes the long hand can point to on each level. */
export function minuteChoices(mode: ClockMode): number[] {
  if (mode === 'hour' || mode === 'oclock') return [0];
  if (mode === 'half' || mode === 'read' || isShift(mode)) return [0, 30];
  if (mode === 'five') return Array.from({ length: 12 }, (_, i) => i * 5);
  return [0, 15, 30, 45];
}

/** Minutes on the five level that are not already a quarter or half: the new decision. */
export const FIVE_ASKED = [5, 10, 20, 25, 35, 40, 50, 55];

/** A time to set or read, in minutes (0–719 on the 12-hour face). */
export interface ClockTask {
  time: number;
  /** For 'later', 'earlier', and 'half-later': where the clock starts. */
  from?: number;
  /** For 'how-long': the stated same-day interval in absolute minutes after midnight (`from`/`time` are its faces). */
  start?: number;
  end?: number;
  /** For 'read': the visible evidence on this task's pretend appointment board. */
  options?: Appointment[];
}

export type ClockDemoAction =
  | { kind: 'pick'; id: string }
  | { kind: 'minute'; minute: number }
  | { kind: 'hours'; hours: number }
  | { kind: 'half'; on: boolean }
  | { kind: 'hour'; hour: number }
  | { kind: 'check' };

export interface Appointment {
  id: string;
  time: number;
}

/** Existing pictures; none implies a correct time in a player's real routine. */
export const EVENTS = ['breakfast', 'school', 'lunch', 'park', 'bath', 'bed'] as const;
export const EVENT_WORDS: Record<string, string> = {
  breakfast: 'breakfast',
  school: 'school',
  lunch: 'lunch',
  park: 'the park',
  bath: 'a bath',
  bed: 'bed',
};

/** Both labels and replay describe the same appointment data used to judge the answer. */
export function appointmentFor(appointment: Appointment) {
  return {
    event: EVENT_WORDS[appointment.id],
    time: digital(appointment.time),
    speech: spoken(appointment.time),
  };
}

const toMinutes = (hour: number, minute: number) => ((hour % 12) * 60 + minute) % 720;

export function makeTasks(plan: ClockPlan, rng: Rng): ClockTask[] {
  const out: ClockTask[] = [];
  if (plan.mode === 'read') {
    // Start with an authored, visible example; every task supplies its own pretend plan.
    const first: Appointment[] = [
      { id: 'lunch', time: 0 },
      { id: 'park', time: 180 },
      { id: 'bath', time: 390 },
    ];
    const times = Array.from({ length: 24 }, (_, i) => i * 30);
    for (let i = 0; i < plan.rounds; i++) {
      const target =
        i === 0 ? rng.pick(first).time : rng.pick(times.filter((time) => !out.some((t) => t.time === time)));
      const boardTimes = [target, ...rng.shuffle(times.filter((time) => time !== target)).slice(0, 2)];
      const options =
        i === 0
          ? first
          : rng
              .shuffle([...EVENTS])
              .slice(0, 3)
              .map((id, j) => ({ id, time: boardTimes[j] }));
      out.push({ time: target, options: rng.shuffle(options) });
    }
    return out;
  }
  if (plan.mode === 'how-long') {
    // The first interval is the authored example (3:00 to 5:30); the rest are distinct lengths mixing whole and half
    // hours. Starts are on the half hour between 7:00 and 15:30, so every end is the same day and before 20:00.
    const picked: number[] = [150];
    const rest = rng.shuffle(INTERVAL_LENGTHS.filter((d) => d !== 150));
    // Keep a whole-hour length and one long enough to cross the 12 in the round.
    const wholes = rest.filter((d) => d % 60 === 0);
    const longs = rest.filter((d) => d >= 90);
    const must = [wholes[0], longs.find((d) => d !== wholes[0]) ?? longs[0]];
    for (const d of [...new Set(must), ...rest]) {
      if (picked.length < plan.rounds && !picked.includes(d)) picked.push(d);
    }
    const crossAt = picked.findIndex((d, i) => i > 0 && d >= 90);
    const startSlots = Array.from({ length: 18 }, (_, i) => 420 + i * 30);
    picked.forEach((duration, i) => {
      // One task starts before noon and ends after it, so the face wraps past 12. Every end face is different.
      const pool =
        i === 0 ? [15 * 60] : i === crossAt ? [660, 690].filter((m) => m + duration > 720) : startSlots;
      const fresh = pool.filter((m) => !out.some((t) => t.time === (m + duration) % 720));
      const start = rng.pick(fresh.length ? fresh : pool);
      out.push({ time: (start + duration) % 720, from: start % 720, start, end: start + duration });
    });
    return out;
  }
  if (plan.mode === 'half-later') {
    // Cover all four quarter positions (crossing and noncrossing), including crossing 12.
    const quarterOrder = rng.shuffle([0, 15, 30, 45]);
    const crossFaceSlot = quarterOrder.findIndex((m) => m >= 30);
    for (let i = 0; i < plan.rounds; i++) {
      const minute = quarterOrder[i];
      const hour = i === crossFaceSlot ? rng.pick([11, 12]) : rng.int(1, 12);
      const shown = toMinutes(hour, minute);
      out.push({ time: (shown + 30) % 720, from: shown });
    }
    return out;
  }
  const minutes = minuteChoices(plan.mode);
  // Half past is always asked at least once, and "an hour later" or "earlier" always crosses the 12 both ways.
  const halfSlot = rng.int(0, plan.rounds - 1);
  const wrapSlots = rng.shuffle(Array.from({ length: plan.rounds }, (_, i) => i)).slice(0, 2);
  while (out.length < plan.rounds) {
    const wrapAt = wrapSlots.indexOf(out.length);
    const hour = isShift(plan.mode) && wrapAt >= 0 ? WRAP_HOURS[plan.mode][wrapAt] : rng.int(1, 12);
    // Quarter levels show every quarter at least once, half levels mostly ask for half past.
    const minute =
      plan.mode === 'five'
        ? FIVE_ASKED[(out.length * 2 + rng.int(0, 1)) % FIVE_ASKED.length]
        : plan.mode === 'quarter'
          ? minutes[(out.length + 1) % 4]
          : plan.mode === 'half'
            ? out.length === halfSlot || rng.chance(0.75)
              ? 30
              : 0
            : rng.pick(minutes);
    const shown = toMinutes(hour, minute);
    const task: ClockTask = isShift(plan.mode)
      ? { time: (shown + SHIFT[plan.mode]) % 720, from: shown }
      : { time: shown };
    if (out.some((t) => t.time === task.time)) continue;
    out.push(task);
  }
  return out;
}

/** Where each hand points, in "minute marks" 0–59 (the hour hand moves along with the minutes). */
export function handsFor(time: number): { hour: number; minute: number } {
  const minute = time % 60;
  return { minute, hour: ((Math.floor(time / 60) % 12) * 5 + minute / 12) % 60 };
}

/**
 * The time the hands show, from a chosen hour (1–12) and minute. The hour hand only needs to be
 * nearest the right hour; at half past and later it may point at either neighbouring number.
 */
export const timeOf = (hour: number, minute: number) => toMinutes(hour, minute);

/** How a time is said aloud: "3 o'clock", "half past 3", "quarter past 3", "quarter to 4". */
export function spoken(time: number): string {
  const h = Math.floor(time / 60) % 12 || 12;
  const m = time % 60;
  const next = (h % 12) + 1;
  if (m === 0) return `${h} o'clock`;
  if (m === 30) return `half past ${h}`;
  if (m === 15) return `quarter past ${h}`;
  if (m === 45) return `quarter to ${next}`;
  const words = [
    'zero',
    'one',
    'two',
    'three',
    'four',
    'five',
    'six',
    'seven',
    'eight',
    'nine',
    'ten',
    'eleven',
    'twelve',
  ];
  const tens = ['', '', 'twenty', 'thirty', 'forty', 'fifty'];
  const minutes =
    m < 10
      ? `oh ${words[m]}`
      : m === 10
        ? 'ten'
        : `${tens[Math.floor(m / 10)]}${m % 10 ? ` ${words[m % 10]}` : ''}`;
  return `${words[h]} ${minutes}`;
}

/** The hour shown on the face for a time (1–12). */
export const hourOf = (time: number) => Math.floor(time / 60) % 12 || 12;

/** The next real control a demonstration player should use to solve the current task. */
export function demoAction(mode: ClockMode, hour: number, minute: number, task: ClockTask): ClockDemoAction {
  if (mode === 'read') {
    const id = task.options!.find((candidate) => candidate.time === task.time)!.id;
    return { kind: 'pick', id };
  }
  if (isInterval(mode)) {
    // For this level `hour` is the hours chosen and `minute` is 30 when the half hour is on, else 0.
    const length = durationOf(task);
    const hours = Math.floor(length / 60);
    if (hour !== hours) return { kind: 'hours', hours };
    if (minute !== length % 60) return { kind: 'half', on: length % 60 === 30 };
    return { kind: 'check' };
  }
  const targetMinute = task.time % 60;
  if (mode !== 'hour' && minute !== targetMinute) return { kind: 'minute', minute: targetMinute };
  const targetHour = hourOf(task.time);
  if (hour !== targetHour) return { kind: 'hour', hour: targetHour };
  return { kind: 'check' };
}

/** Digital labels share the face's normalized time. */
export const digital = (time: number) => `${hourOf(time)}:${String(time % 60).padStart(2, '0')}`;

/** Worked hour change: unwrap the hand's destination so 12→1 animates forwards (and 1→12 backwards). */
export function laterExample(task: ClockTask, direction: 'later' | 'earlier' = 'later') {
  const from = task.from!;
  const hourStart = handsFor(from).hour;
  return {
    from: digital(from),
    to: digital(task.time),
    fromSpeech: spoken(from),
    toSpeech: spoken(task.time),
    minute: from % 60,
    hourStart,
    hourEnd: hourStart + (direction === 'later' ? 5 : -5),
  };
}

/** Worked half-hour advance: a +30-minute clockwise arc from the starting minute, crossing the hour when >= 30. */
export function halfLaterExample(task: ClockTask) {
  const from = task.from!;
  const fromMinute = from % 60;
  return {
    from: digital(from),
    to: digital(task.time),
    fromSpeech: spoken(from),
    toSpeech: spoken(task.time),
    fromMinute,
    toMinute: task.time % 60,
    arcMinutes: 30,
    crossesHour: fromMinute >= 30,
    fromHour: hourOf(from),
    toHour: hourOf(task.time),
  };
}

/** The help arc, counted words and requested time all come from the same target. */
export function fiveExample(task: ClockTask) {
  const minute = task.time % 60;
  const marks = Array.from({ length: minute / 5 }, (_, i) => (i + 1) * 5);
  return { marks, counts: marks.join(', '), time: spoken(task.time) };
}

/** The lengths the picker can reach: 30 to 210 minutes in steps of 30. */
export const INTERVAL_LENGTHS = Array.from({ length: MAX_HOURS * 2 + 1 }, (_, i) => (i + 1) * 30);

/** A chosen length in minutes, from the hours stepper and the half-hour toggle. */
export const lengthOf = (hours: number, half: boolean) => hours * 60 + (half ? 30 : 0);

/** The length of a task's interval. */
export const durationOf = (task: ClockTask) => task.end! - task.start!;

/** A length said aloud: "no time", "half an hour", "2 hours", "2 and a half hours". */
export function lengthWords(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const half = minutes % 60 === 30;
  if (minutes === 0) return 'no time';
  if (h === 0) return 'half an hour';
  if (!half) return h === 1 ? '1 hour' : `${h} hours`;
  return `${h} and a half hours`;
}

/** The worked count: each whole hour from the start, then the half hour, as faces and as spoken words. */
export function hopsFor(task: ClockTask) {
  const start = task.start!;
  const length = durationOf(task);
  const stops = [start];
  for (let m = 60; m <= length; m += 60) stops.push(start + m);
  if (length % 60 === 30) stops.push(task.end!);
  const faces = stops.map((t) => digital(t % 720));
  const hours = Math.floor(length / 60);
  const spokenStops = stops.map((t) => spoken(t % 720));
  const count =
    hours === 0
      ? `Half an hour after ${spokenStops[0]} is ${spokenStops[1]}.`
      : `From ${spokenStops[0]}, count the hours: ${spokenStops
          .slice(1, hours + 1)
          .join(', ')}${length % 60 === 30 ? `, then half an hour more: ${spokenStops[hours + 1]}` : ''}.`;
  return { faces, strip: faces.join(' → '), count };
}

/** The request stays visible; later tasks show the starting time, never the answer. */
export function requestFor(
  mode: ClockMode,
  task: ClockTask,
): { heading: string; time: string; speech: string } {
  if (isInterval(mode)) return { heading: 'How long was it?', time: '', speech: '' };
  const time = hasFrom(mode) ? task.from! : task.time;
  return {
    heading:
      mode === 'later'
        ? 'One hour after'
        : mode === 'earlier'
          ? 'One hour before'
          : mode === 'half-later'
            ? 'Half an hour after'
            : 'Set the clock to',
    time: digital(time),
    speech: spoken(time),
  };
}
