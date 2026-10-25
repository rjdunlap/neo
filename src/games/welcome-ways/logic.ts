import type { Rng } from '../../engine/random';
export type Rise = 'gentle' | 'step';
export type Door = 'narrow' | 'wide';
export type Part = Rise | Door;
export type Visitor = 'roly' | 'bunny' | 'bear';
export interface Plan { level: number; rises: number; visitors: Visitor[]; choices: Part[]; doorEditable: boolean }
export interface Design { rises: (Rise | null)[]; door: Door | null }
export type Reason = 'gap' | 'needsRamp' | 'needsDoor' | 'needsWide';
export interface Stop { visitor: Visitor; socket: number; reason: Reason; arrived: Visitor[] }
export type Result = { arrived: Visitor[]; stop: Stop | null };
export interface Repair { socket: number; part: Part }
export const FOOTPRINT = { gentle: 2, step: 2, narrow: 1, wide: 1 } as const;
export function planFor(level: number): Plan {
  const n = Math.max(1, Math.min(4, Math.floor(level)));
  return { level: n, rises: n === 4 ? 2 : 1, visitors: n === 3 ? ['bunny', 'roly'] : n === 4 ? ['roly', 'bear'] : ['roly'], choices: n === 1 ? ['gentle'] : n === 4 ? ['gentle', 'step', 'narrow', 'wide'] : ['gentle', 'step'], doorEditable: n === 4 };
}
export function presentation(plan: Plan, rng: Rng): Part[] { return rng.shuffle([...plan.choices]); }
export const initial = (p: Plan): Design => ({ rises: Array(p.rises).fill(null), door: 'narrow' });
export const copy = (d: Design): Design => ({ rises: [...d.rises], door: d.door });
export function evaluate(p: Plan, d: Design): Result {
  const arrived: Visitor[] = [];
  for (const visitor of p.visitors) {
    for (let socket = 0; socket <= p.rises; socket++) {
      const part = socket === p.rises ? d.door : d.rises[socket];
      const reason: Reason | null = socket < p.rises
        ? !part ? 'gap' : visitor === 'roly' && part !== 'gentle' ? 'needsRamp' : null
        : !part ? 'needsDoor' : visitor === 'bear' && part !== 'wide' ? 'needsWide' : null;
      if (reason) return { arrived, stop: { visitor, socket, reason, arrived: [...arrived] } };
    }
    arrived.push(visitor);
  }
  return { arrived, stop: null };
}
export function designs(p: Plan): Design[] {
  let rows: (Rise | null)[][] = [[]];
  const choices: (Rise | null)[] = [null, ...p.choices.filter((x): x is Rise => x === 'gentle' || x === 'step')];
  for (let i = 0; i < p.rises; i++) rows = rows.flatMap(r => choices.map(x => [...r, x]));
  return rows.flatMap(rises => (p.doorEditable ? [null, 'narrow', 'wide'] as const : ['narrow'] as const).map(door => ({ rises, door })));
}
export const solutions = (p: Plan) => designs(p).filter(d => !evaluate(p, d).stop);
export const parts = (d: Design) => [...d.rises, d.door];
export const distance = (a: Design, b: Design) => parts(a).filter((v, i) => v !== parts(b)[i]).length;
export function repair(p: Plan, d: Design): Repair | null {
  const best = solutions(p).sort((a, b) => distance(a, d) - distance(b, d))[0];
  if (!best) return null;
  const socket = parts(d).findIndex((v, i) => v !== parts(best)[i]);
  return socket < 0 ? null : { socket, part: parts(best)[socket]! };
}
export function compatible(p: Plan, socket: number, part: Part) {
  return p.choices.includes(part) && (socket === p.rises ? p.doorEditable && (part === 'wide' || part === 'narrow') : socket >= 0 && socket < p.rises && (part === 'step' || part === 'gentle'));
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
  constructor(readonly plan: Plan) { this.design = initial(plan); }
  edit(socket: number, part: Part | null): boolean {
    if (this.finished || socket < 0 || socket > this.plan.rises || (socket === this.plan.rises && !this.plan.doorEditable) || (part && !compatible(this.plan, socket, part)) || parts(this.design)[socket] === part) return false;
    this.previous = copy(this.design);
    if (socket === this.plan.rises) this.design.door = part as Door | null;
    else this.design.rises[socket] = part as Rise | null;
    this.resetRepeat();
    return true;
  }
  undo() { if (!this.previous || this.finished) return; this.design = this.previous; this.previous = null; this.resetRepeat(); }
  private resetRepeat() { this.lastStop = ''; this.repeats = 0; }
  help(): Repair | null {
    const r = repair(this.plan, this.design);
    if (r) { const key = `${r.socket}:${r.part}`; if (!this.shown.has(key)) { this.shown.add(key); this.hints++; } }
    return r;
  }
  /** Called only after the snapshot's parade ends. A failed observation never finishes. */
  complete(result: Result): { finish: boolean; suggestion: Repair | null } {
    if (this.finished) return { finish: false, suggestion: null };
    if (!result.stop) { this.finished = true; return { finish: true, suggestion: null }; }
    const key = `${result.stop.visitor}:${result.stop.socket}:${result.stop.reason}`;
    this.repeats = key === this.lastStop ? this.repeats + 1 : 1; this.lastStop = key;
    return { finish: false, suggestion: this.repeats === 2 ? this.help() : null };
  }
}
