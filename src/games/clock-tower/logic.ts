import type { Rng } from '../../engine/random';

/**
 * Clock Tower: set the big clock by dragging its hands, which snap to the marks. First the hour
 * hand alone, then both hands for o'clock, half past, and quarter past and to. Then read the
 * clock and choose the picture for that time of day, and finally set the time an hour later.
 *
 * Times are in minutes after midnight on a 12-hour face; the hour hand moves with the minutes,
 * as on a real clock, so half past three has it halfway between 3 and 4.
 */
export type ClockMode = 'hour' | 'oclock' | 'half' | 'quarter' | 'read' | 'later';

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
  { mode: 'read', rounds: 4, name: 'Read the clock, then pick what happens at that time of day' },
  { mode: 'later', rounds: 4, name: "One hour later: set the clock an hour after the time shown (o'clock and half past)" },
];

export const planFor = (level: number) => PLANS[Math.min(PLANS.length, Math.max(1, level)) - 1];

/** Minutes the long hand can point to on each level. */
export function minuteChoices(mode: ClockMode): number[] {
  if (mode === 'hour' || mode === 'oclock') return [0];
  if (mode === 'half' || mode === 'read' || mode === 'later') return [0, 30];
  return [0, 15, 30, 45];
}

/** A time to set or read, in minutes (0–719 on the 12-hour face). */
export interface ClockTask {
  time: number;
  /** For 'later': where the clock starts. */
  from?: number;
  /** For 'read': the daily-life pictures offered, as event ids. */
  options?: string[];
}

export type ClockDemoAction =
  | { kind: 'pick'; id: string }
  | { kind: 'minute'; minute: number }
  | { kind: 'hour'; hour: number }
  | { kind: 'check' };

/** Daily-life pictures for reading the clock, each at a usual time (hours on the 12-hour face). */
export const EVENTS: { id: string; hour: number; minute: number }[] = [
  { id: 'breakfast', hour: 7, minute: 0 },
  { id: 'school', hour: 8, minute: 30 },
  { id: 'lunch', hour: 12, minute: 0 },
  { id: 'park', hour: 3, minute: 0 },
  { id: 'bath', hour: 6, minute: 30 },
  { id: 'bed', hour: 8, minute: 0 },
];

const toMinutes = (hour: number, minute: number) => ((hour % 12) * 60 + minute) % 720;

export function makeTasks(plan: ClockPlan, rng: Rng): ClockTask[] {
  const out: ClockTask[] = [];
  if (plan.mode === 'read') {
    // Each event once; three pictures to choose from, with distinct clock times.
    for (const e of rng.shuffle([...EVENTS]).slice(0, plan.rounds)) {
      const others = rng.shuffle(EVENTS.filter((x) => x.id !== e.id && toMinutes(x.hour, x.minute) !== toMinutes(e.hour, e.minute))).slice(0, 2);
      out.push({ time: toMinutes(e.hour, e.minute), options: rng.shuffle([e.id, ...others.map((x) => x.id)]) });
    }
    return out;
  }
  const minutes = minuteChoices(plan.mode);
  while (out.length < plan.rounds) {
    const hour = rng.int(1, 12);
    // Quarter levels show every quarter at least once, half levels mostly ask for half past.
    const minute = plan.mode === 'quarter' ? minutes[(out.length + 1) % 4] : plan.mode === 'half' ? (rng.chance(0.75) ? 30 : 0) : rng.pick(minutes);
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
  return `${h}:${String(m).padStart(2, '0')}`;
}

/** The hour shown on the face for a time (1–12). */
export const hourOf = (time: number) => Math.floor(time / 60) % 12 || 12;

/** The next real control a demonstration player should use to solve the current task. */
export function demoAction(mode: ClockMode, hour: number, minute: number, task: ClockTask): ClockDemoAction {
  if (mode === 'read') {
    const id = task.options!.find((candidate) => {
      const event = EVENTS.find((x) => x.id === candidate)!;
      return timeOf(event.hour, event.minute) === task.time;
    })!;
    return { kind: 'pick', id };
  }
  const targetMinute = task.time % 60;
  if (mode !== 'hour' && minute !== targetMinute) return { kind: 'minute', minute: targetMinute };
  const targetHour = hourOf(task.time);
  if (hour !== targetHour) return { kind: 'hour', hour: targetHour };
  return { kind: 'check' };
}
