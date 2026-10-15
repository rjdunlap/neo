import type { Rng } from '../../engine/random';

/**
 * Clock Tower: set the big clock by dragging its hands, which snap to the marks. First the hour
 * hand alone, then both hands for o'clock, half past, and quarter past and to. Then read the
 * clock and choose a visible fictional appointment, and finally set the time an hour later.
 *
 * Times are in minutes after midnight on a 12-hour face; the hour hand moves with the minutes,
 * as on a real clock, so half past three has it halfway between 3 and 4.
 */
export type ClockMode = 'hour' | 'oclock' | 'half' | 'quarter' | 'read' | 'later' | 'five';

export interface ClockPlan {
  mode: ClockMode;
  rounds: number;
  name: string;
}

export const PLANS: ClockPlan[] = [
  { mode: 'hour', rounds: 4, name: "Turn the short hand to the hour: \"3 o'clock\" (the long hand stays at 12)" },
  { mode: 'oclock', rounds: 4, name: "Set both hands for o'clock times" },
  { mode: 'half', rounds: 4, name: 'Half past: the long hand at 6, the short hand between two numbers' },
  { mode: 'quarter', rounds: 4, name: 'Quarter past and quarter to' },
  { mode: 'read', rounds: 4, name: 'Match the clock to a pictured appointment with a visible, replayable time' },
  { mode: 'later', rounds: 4, name: "One hour later: set the clock an hour after the time shown (o'clock and half past)" },
  { mode: 'five', rounds: 4, name: 'Five-minute times: count by fives to set 3:25 (the long hand stops at any number)' },
];

export const planFor = (level: number) => PLANS[Math.min(PLANS.length, Math.max(1, level)) - 1];

/** Minutes the long hand can point to on each level. */
export function minuteChoices(mode: ClockMode): number[] {
  if (mode === 'hour' || mode === 'oclock') return [0];
  if (mode === 'half' || mode === 'read' || mode === 'later') return [0, 30];
  if (mode === 'five') return Array.from({ length: 12 }, (_, i) => i * 5);
  return [0, 15, 30, 45];
}

/** Minutes on the five level that are not already a quarter or half: the new decision. */
export const FIVE_ASKED = [5, 10, 20, 25, 35, 40, 50, 55];

/** A time to set or read, in minutes (0–719 on the 12-hour face). */
export interface ClockTask {
  time: number;
  /** For 'later': where the clock starts. */
  from?: number;
  /** For 'read': the visible evidence on this task's pretend appointment board. */
  options?: Appointment[];
}

export type ClockDemoAction =
  | { kind: 'pick'; id: string }
  | { kind: 'minute'; minute: number }
  | { kind: 'hour'; hour: number }
  | { kind: 'check' };

export interface Appointment {
  id: string;
  time: number;
}

/** Existing pictures; none implies a correct time in a player's real routine. */
export const EVENTS = ['breakfast', 'school', 'lunch', 'park', 'bath', 'bed'] as const;
export const EVENT_WORDS: Record<string, string> = { breakfast: 'breakfast', school: 'school', lunch: 'lunch', park: 'the park', bath: 'a bath', bed: 'bed' };

/** Both labels and replay describe the same appointment data used to judge the answer. */
export function appointmentFor(appointment: Appointment) {
  return { event: EVENT_WORDS[appointment.id], time: digital(appointment.time), speech: spoken(appointment.time) };
}

const toMinutes = (hour: number, minute: number) => ((hour % 12) * 60 + minute) % 720;

export function makeTasks(plan: ClockPlan, rng: Rng): ClockTask[] {
  const out: ClockTask[] = [];
  if (plan.mode === 'read') {
    // Start with an authored, visible example; every task supplies its own pretend plan.
    const first: Appointment[] = [{ id: 'lunch', time: 0 }, { id: 'park', time: 180 }, { id: 'bath', time: 390 }];
    const times = Array.from({ length: 24 }, (_, i) => i * 30);
    for (let i = 0; i < plan.rounds; i++) {
      const target = i === 0 ? rng.pick(first).time : rng.pick(times.filter((time) => !out.some((t) => t.time === time)));
      const boardTimes = [target, ...rng.shuffle(times.filter((time) => time !== target)).slice(0, 2)];
      const options = i === 0 ? first : rng.shuffle([...EVENTS]).slice(0, 3).map((id, j) => ({ id, time: boardTimes[j] }));
      out.push({ time: target, options: rng.shuffle(options) });
    }
    return out;
  }
  const minutes = minuteChoices(plan.mode);
  // Half past is always asked at least once, and "one hour later" always crosses the 12 (11→12 and 12→1).
  const halfSlot = rng.int(0, plan.rounds - 1);
  const wrapSlots = rng.shuffle(Array.from({ length: plan.rounds }, (_, i) => i)).slice(0, 2);
  while (out.length < plan.rounds) {
    const wrapAt = wrapSlots.indexOf(out.length);
    const hour = plan.mode === 'later' && wrapAt >= 0 ? 11 + wrapAt : rng.int(1, 12);
    // Quarter levels show every quarter at least once, half levels mostly ask for half past.
    const minute = plan.mode === 'five' ? FIVE_ASKED[(out.length * 2 + rng.int(0, 1)) % FIVE_ASKED.length] : plan.mode === 'quarter' ? minutes[(out.length + 1) % 4] : plan.mode === 'half' ? (out.length === halfSlot || rng.chance(0.75) ? 30 : 0) : rng.pick(minutes);
    const shown = toMinutes(hour, minute);
    const task: ClockTask = plan.mode === 'later' ? { time: (shown + 60) % 720, from: shown } : { time: shown };
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
  const words = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve'];
  const tens = ['', '', 'twenty', 'thirty', 'forty', 'fifty'];
  const minutes = m < 10 ? `oh ${words[m]}` : m === 10 ? 'ten' : `${tens[Math.floor(m / 10)]}${m % 10 ? ` ${words[m % 10]}` : ''}`;
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
  const targetMinute = task.time % 60;
  if (mode !== 'hour' && minute !== targetMinute) return { kind: 'minute', minute: targetMinute };
  const targetHour = hourOf(task.time);
  if (hour !== targetHour) return { kind: 'hour', hour: targetHour };
  return { kind: 'check' };
}

/** Digital labels share the face's normalized time. */
export const digital = (time: number) => `${hourOf(time)}:${String(time % 60).padStart(2, '0')}`;

/** Worked hour change: unwrap the hand's destination so 12→1 animates forwards. */
export function laterExample(task: ClockTask) {
  const from = task.from!;
  const hourStart = handsFor(from).hour;
  return {
    from: digital(from), to: digital(task.time),
    fromSpeech: spoken(from), toSpeech: spoken(task.time),
    minute: from % 60, hourStart, hourEnd: hourStart + 5,
  };
}

/** The help arc, counted words and requested time all come from the same target. */
export function fiveExample(task: ClockTask) {
  const minute = task.time % 60;
  const marks = Array.from({ length: minute / 5 }, (_, i) => (i + 1) * 5);
  return { marks, counts: marks.join(', '), time: spoken(task.time) };
}

/** The request stays visible; later tasks show the starting time, never the answer. */
export function requestFor(mode: ClockMode, task: ClockTask): { heading: string; time: string; speech: string } {
  const time = mode === 'later' ? task.from! : task.time;
  return {
    heading: mode === 'later' ? 'One hour after' : 'Set the clock to',
    time: digital(time),
    speech: spoken(time),
  };
}
