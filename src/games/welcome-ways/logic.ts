import type { Rng } from '../../engine/random';
import type { BandLevels } from '../../progress/difficulty';
export type Rise = 'gentle' | 'step';
export type Door = 'narrow' | 'wide';
export type Turn = 'small' | 'big';
export type Side = 'rail' | 'perch';
export type Part = Rise | Door | Turn | Side;
export type Visitor = 'roly' | 'bunny' | 'bear' | 'teeter' | 'duck';
/** Socket kinds in walking order, then the door, then the near and far sides. */
export type Kind = 'rise' | 'turn' | 'door' | 'near' | 'far';
export interface Plan {
  level: number;
  rises: number;
  visitors: Visitor[];
  choices: Part[];
  doorEditable: boolean;
  sockets: Kind[];
  start: Design;
}
/** Levels 1–4 carry only rises and a door. A turn always sits after the first rise (level 5); sides are [near, far] (levels 6–7). */
export interface Design {
  rises: (Rise | null)[];
  door: Door | null;
  turn?: Turn | null;
  sides?: (Side | null)[];
}
export type Reason =
  'gap' | 'needsRamp' | 'needsDoor' | 'needsWide' | 'needsBig' | 'needsRail' | 'needsPerch';
export interface Stop {
  visitor: Visitor;
  socket: number;
  reason: Reason;
  arrived: Visitor[];
}
export type Result = { arrived: Visitor[]; stop: Stop | null };
export interface Repair {
  socket: number;
  part: Part;
}
export const FOOTPRINT = { gentle: 2, step: 2, narrow: 1, wide: 1 } as const;
/** Value order for enumeration and hint ties. */
const ORDER: Part[] = ['gentle', 'step', 'small', 'big', 'narrow', 'wide', 'rail', 'perch'];
export const kindOf = (part: Part): 'rise' | 'turn' | 'door' | 'side' =>
  part === 'gentle' || part === 'step'
    ? 'rise'
    : part === 'small' || part === 'big'
      ? 'turn'
      : part === 'narrow' || part === 'wide'
        ? 'door'
        : 'side';
const fits = (kind: Kind, part: Part) => kindOf(part) === (kind === 'near' || kind === 'far' ? 'side' : kind);
export function planFor(level: number): Plan {
  const n = Math.max(1, Math.min(7, Math.floor(level)));
  if (n === 5)
    return {
      level: 5,
      rises: 2,
      visitors: ['roly', 'bear'],
      choices: ['gentle', 'step', 'small', 'big'],
      doorEditable: false,
      sockets: ['rise', 'turn', 'rise', 'door'],
      start: { rises: [null, null], door: 'wide', turn: 'small' },
    };
  if (n >= 6)
    return {
      level: n,
      rises: 2,
      visitors: n === 6 ? ['roly', 'teeter', 'duck'] : ['teeter', 'duck', 'roly'],
      choices: ['gentle', 'step', 'rail', 'perch'],
      doorEditable: false,
      sockets: ['rise', 'rise', 'door', 'near', 'far'],
      start:
        n === 6
          ? { rises: [null, null], door: 'narrow', sides: [null, null] }
          : { rises: ['step', 'step'], door: 'narrow', sides: ['perch', null] },
    };
  const rises = n === 4 ? 2 : 1;
  return {
    level: n,
    rises,
    visitors: n === 3 ? ['bunny', 'roly'] : n === 4 ? ['roly', 'bear'] : ['roly'],
    choices: n === 1 ? ['gentle'] : n === 4 ? ['gentle', 'step', 'narrow', 'wide'] : ['gentle', 'step'],
    doorEditable: n === 4,
    sockets: [...Array<Kind>(rises).fill('rise'), 'door'],
    start: { rises: Array(rises).fill(null), door: 'narrow' },
  };
}

export const LEVELS: BandLevels = {
  toddler: { min: 1, max: 2 },
  preschool: { min: 1, max: 3 },
  prek: { min: 2, max: 4 },
  school: { min: 3, max: 7 },
};
export function presentation(plan: Plan, rng: Rng): Part[] {
  return rng.shuffle([...plan.choices]);
}
export const copy = (d: Design): Design => ({
  rises: [...d.rises],
  door: d.door,
  ...(d.turn !== undefined ? { turn: d.turn } : {}),
  ...(d.sides ? { sides: [...d.sides] } : {}),
});
export const initial = (p: Plan): Design => copy(p.start);
/** Every socket's value, in socket order. */
export const parts = (d: Design): (Part | null)[] => [
  ...(d.turn === undefined ? d.rises : [d.rises[0], d.turn, ...d.rises.slice(1)]),
  d.door,
  ...(d.sides ?? []),
];
export const doorAt = (p: Plan) => p.sockets.indexOf('door');
/** A copy of `d` with socket `i` set to `v`. */
export function withPart(p: Plan, d: Design, i: number, v: Part | null): Design {
  const next = copy(d),
    kind = p.sockets[i];
  if (kind === 'door') next.door = v as Door | null;
  else if (kind === 'turn') next.turn = v as Turn | null;
  else if (kind === 'near' || kind === 'far') next.sides![kind === 'near' ? 0 : 1] = v as Side | null;
  else next.rises[p.sockets.slice(0, i).filter((k) => k === 'rise').length] = v as Rise | null;
  return next;
}
export function evaluate(p: Plan, d: Design): Result {
  const arrived: Visitor[] = [];
  const values = parts(d),
    door = doorAt(p);
  const sides = p.sockets.map((k, i) => (k === 'near' || k === 'far' ? i : -1)).filter((i) => i >= 0);
  const emptySide = sides.find((i) => !values[i]);
  for (const visitor of p.visitors) {
    let stop: { socket: number; reason: Reason } | null = null;
    if (visitor === 'duck') {
      if (!sides.some((i) => values[i] === 'perch'))
        stop = { socket: emptySide ?? sides[sides.length - 1], reason: 'needsPerch' };
    } else {
      let run = 0;
      for (let socket = 0; socket < door && !stop; socket++) {
        const part = values[socket],
          kind = p.sockets[socket];
        if (kind === 'rise') {
          run = part === 'gentle' ? run + 1 : 0;
          if (!part) stop = { socket, reason: 'gap' };
          else if (visitor === 'roly' && part !== 'gentle') stop = { socket, reason: 'needsRamp' };
          else if (visitor === 'teeter' && run >= 2 && !sides.some((i) => values[i] === 'rail'))
            stop = { socket: emptySide ?? sides[0], reason: 'needsRail' };
        } else {
          run = 0;
          if (!part) stop = { socket, reason: 'gap' };
          else if (visitor === 'bear' && part !== 'big') stop = { socket, reason: 'needsBig' };
        }
      }
      if (!stop)
        stop = !values[door]
          ? { socket: door, reason: 'needsDoor' }
          : visitor === 'bear' && values[door] !== 'wide'
            ? { socket: door, reason: 'needsWide' }
            : null;
    }
    if (stop) return { arrived, stop: { visitor, ...stop, arrived: [...arrived] } };
    arrived.push(visitor);
  }
  return { arrived, stop: null };
}
/** The values a socket can hold, in enumeration order; a fixed door holds only its start value. */
export function options(p: Plan, i: number): (Part | null)[] {
  const kind = p.sockets[i];
  if (kind === 'door' && !p.doorEditable) return [p.start.door];
  return [null, ...ORDER.filter((x) => fits(kind, x) && p.choices.includes(x))];
}
export function designs(p: Plan): Design[] {
  let rows: Design[] = [copy(p.start)];
  p.sockets.forEach((_, i) => {
    rows = rows.flatMap((d) => options(p, i).map((v) => withPart(p, d, i, v)));
  });
  return rows;
}
export const solutions = (p: Plan) => designs(p).filter((d) => !evaluate(p, d).stop);
export const distance = (a: Design, b: Design) => {
  const pb = parts(b);
  return parts(a).filter((v, i) => v !== pb[i]).length;
};
const NEED: Partial<Record<Reason, Part>> = {
  needsRamp: 'gentle',
  needsWide: 'wide',
  needsBig: 'big',
  needsRail: 'rail',
  needsPerch: 'perch',
};
/**
 * The nearest accepted design (ties: one that meets the stop's need at the stop socket, then enumeration
 * order). Suggest the stop socket when it differs from that design, else the first differing socket.
 */
export function repair(p: Plan, d: Design): Repair | null {
  const stop = evaluate(p, d).stop;
  const meets = (s: Design) =>
    stop && NEED[stop.reason] && parts(s)[stop.socket] === NEED[stop.reason] ? 0 : 1;
  const best = solutions(p).sort((a, b) => distance(a, d) - distance(b, d) || meets(a) - meets(b))[0];
  if (!best) return null;
  const want = parts(best),
    have = parts(d);
  const socket =
    stop && have[stop.socket] !== want[stop.socket] ? stop.socket : have.findIndex((v, i) => v !== want[i]);
  return socket < 0 ? null : { socket, part: want[socket]! };
}
export function compatible(p: Plan, socket: number, part: Part) {
  const kind = p.sockets[socket];
  return !!kind && p.choices.includes(part) && fits(kind, part) && (kind !== 'door' || p.doorEditable);
}
export class Round {
  design: Design;
  previous: Design | null = null;
  hints = 0;
  readonly misses = 0;
  finished = false;
  private shown = new Set<string>();
  private lastStop = '';
  private repeats = 0;
  constructor(readonly plan: Plan) {
    this.design = initial(plan);
  }
  edit(socket: number, part: Part | null): boolean {
    const kind = this.plan.sockets[socket];
    if (
      this.finished ||
      !kind ||
      (kind === 'door' && !this.plan.doorEditable) ||
      (part && !compatible(this.plan, socket, part)) ||
      parts(this.design)[socket] === part
    )
      return false;
    this.previous = copy(this.design);
    this.design = withPart(this.plan, this.design, socket, part);
    this.resetRepeat();
    return true;
  }
  undo() {
    if (!this.previous || this.finished) return;
    this.design = this.previous;
    this.previous = null;
    this.resetRepeat();
  }
  private resetRepeat() {
    this.lastStop = '';
    this.repeats = 0;
  }
  help(): Repair | null {
    const r = repair(this.plan, this.design);
    if (r) {
      const key = `${r.socket}:${r.part}`;
      if (!this.shown.has(key)) {
        this.shown.add(key);
        this.hints++;
      }
    }
    return r;
  }
  /** Called only after the snapshot's parade ends. A failed observation never finishes. */
  complete(result: Result): { finish: boolean; suggestion: Repair | null } {
    if (this.finished) return { finish: false, suggestion: null };
    if (!result.stop) {
      this.finished = true;
      return { finish: true, suggestion: null };
    }
    const key = `${result.stop.visitor}:${result.stop.socket}:${result.stop.reason}`;
    this.repeats = key === this.lastStop ? this.repeats + 1 : 1;
    this.lastStop = key;
    return { finish: false, suggestion: this.repeats === 2 ? this.help() : null };
  }
}
