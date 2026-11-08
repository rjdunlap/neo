import type { Rng } from '../../engine/random';
import type { View } from '../../engine/view';
import type { BandLevels } from '../../progress/difficulty';

/**
 * Seed Travelers' rules (docs/definitions/seed-travelers.md): a seed's structure fits the way it travels. In this game a fluffy
 * seed (`plume`) rides the breeze and a hooky seed (`burr`) rides in fur; the other two pairings leave the seed where it was.
 * A small authored table decides every trip; there is no wind strength, distance or chance, and nothing grows.
 */

export type Unit = 'plume' | 'burr';
export type Carrier = 'breeze' | 'fur';
export type Place = 'patch' | 'fur' | 'tray';
export const UNITS: readonly Unit[] = ['plume', 'burr'];
export const CARRIERS: readonly Carrier[] = ['breeze', 'fur'];

/** The whole model, in this game. */
export function travels(unit: Unit, carrier: Carrier): boolean {
  return (unit === 'plume' && carrier === 'breeze') || (unit === 'burr' && carrier === 'fur');
}

/** The carrier a unit travels with. */
export const carrierFor = (unit: Unit): Carrier => (unit === 'plume' ? 'breeze' : 'fur');
/** The unit a carrier takes across. */
export const unitFor = (carrier: Carrier): Unit => (carrier === 'breeze' ? 'plume' : 'burr');

export interface Plan {
  level: 1 | 2 | 3;
  name: string;
  units: readonly Unit[];
  carriers: readonly Carrier[];
  /** `button`: a Finish basket after the first arrival (level 1). `all`: the round ends when every unit is in the tray. */
  finish: 'button' | 'all';
}

export const PLANS: readonly Plan[] = [
  { level: 1, name: 'A seed rides the breeze', units: ['plume'], carriers: ['breeze'], finish: 'button' },
  { level: 2, name: 'A hitchhiker', units: ['burr'], carriers: ['fur'], finish: 'all' },
  { level: 3, name: 'Try both', units: ['plume', 'burr'], carriers: ['breeze', 'fur'], finish: 'all' },
];

export const LEVELS: BandLevels = {
  toddler: { min: 1, max: 2 },
  preschool: { min: 1, max: 3 },
  prek: { min: 2, max: 3 },
};

export function planFor(level: number): Plan {
  return PLANS[Math.max(1, Math.min(PLANS.length, Math.round(level))) - 1];
}

export const FURRY = ['bear', 'dog', 'bunny'] as const;
export type Furry = (typeof FURRY)[number];

export interface Round {
  /** The units on the patch, left to right (the seeded order at level 3). */
  order: Unit[];
  critter: Furry;
}

export function roundFor(rng: Rng, level: number): Round {
  const plan = planFor(level);
  const order = rng.shuffle([...plan.units]);
  return { order, critter: rng.pick(FURRY) };
}

export interface Trial {
  unit: Unit;
  carrier: Carrier;
  arrived: boolean;
}

/** One trip the scene animates: `replay` (level 1) first floats the plume back from the tray. */
export interface Trip extends Trial {
  replay: boolean;
}

/** What a tap did, for the scene to show and say. Nothing here is ever a miss. */
export type Outcome =
  | { kind: 'none' }
  | { kind: 'name'; unit: Unit }
  | { kind: 'chose' }
  | { kind: 'which'; ask: 'seed' | 'helper' }
  | { kind: 'load'; unit: Unit }
  | { kind: 'load-first' }
  | { kind: 'trip'; trip: Trip }
  | { kind: 'finish' };

/** The next useful control: a unit, a carrier or the Finish basket. */
export type Target = { unit: Unit } | { carrier: Carrier } | { finish: true };

export const sameTarget = (a: Target | null, b: Target | null) => JSON.stringify(a) === JSON.stringify(b);

export class SeedState {
  readonly plan: Plan;
  readonly order: Unit[];
  readonly place: Partial<Record<Unit, Place>> = {};
  /** Level 3: the chosen seed and carrier (either may be chosen first). */
  chosen: { unit: Unit | null; carrier: Carrier | null } = { unit: null, carrier: null };
  /** Every pairing tried, at most once each. */
  readonly trials: Trial[] = [];
  /** The trip being animated; every action waits for `land()`. */
  trip: Trip | null = null;
  /** Level 1: a trip has arrived, so the Finish basket is out. */
  arrivedOnce = false;
  finished = false;
  /** Help: hints counted, the support tasks already counted, stays in a row and whether a glow is up. */
  hints = 0;
  readonly hinted = new Set<string>();
  staysInRow = 0;
  glow = false;

  constructor(level: number, order?: Unit[]) {
    this.plan = planFor(level);
    this.order = order ? [...order] : [...this.plan.units];
    for (const u of this.order) this.place[u] = 'patch';
  }

  get level() {
    return this.plan.level;
  }

  get done() {
    return this.plan.finish === 'button' ? this.finished : this.order.every((u) => this.place[u] === 'tray');
  }

  /** The units not yet in the tray, in patch order. */
  get waiting(): Unit[] {
    return this.order.filter((u) => this.place[u] !== 'tray');
  }

  /** The burr on the critter's fur at level 2 (the critter and the burr are then one target). */
  get loaded(): Unit | null {
    return this.order.find((u) => this.place[u] === 'fur') ?? null;
  }

  tried(unit: Unit, carrier: Carrier): Trial | undefined {
    return this.trials.find((t) => t.unit === unit && t.carrier === carrier);
  }

  tapUnit(unit: Unit): Outcome {
    if (this.trip || this.done || !this.place[unit]) return { kind: 'none' };
    if (this.level === 1) return { kind: 'name', unit };
    if (this.level === 2) {
      if (this.place[unit] === 'fur') return this.tapCarrier('fur');
      if (this.place[unit] !== 'patch') return { kind: 'none' };
      this.place[unit] = 'fur';
      return { kind: 'load', unit };
    }
    if (this.place[unit] !== 'patch') return { kind: 'name', unit };
    if (this.chosen.unit === unit) {
      this.chosen.unit = null;
      return { kind: 'chose' };
    }
    this.chosen.unit = unit;
    if (this.chosen.carrier) return this.go(unit, this.chosen.carrier, false);
    return { kind: 'which', ask: 'helper' };
  }

  tapCarrier(carrier: Carrier): Outcome {
    if (this.trip || this.done || !this.plan.carriers.includes(carrier)) return { kind: 'none' };
    if (this.level === 1) {
      const unit = this.order[0];
      return this.go(unit, carrier, this.place[unit] === 'tray');
    }
    if (this.level === 2) {
      const unit = this.loaded;
      return unit
        ? this.go(unit, carrier, false)
        : this.waiting.length
          ? { kind: 'load-first' }
          : { kind: 'none' };
    }
    if (this.chosen.carrier === carrier) {
      this.chosen.carrier = null;
      return { kind: 'chose' };
    }
    this.chosen.carrier = carrier;
    if (this.chosen.unit) return this.go(this.chosen.unit, carrier, false);
    return { kind: 'which', ask: 'seed' };
  }

  /** Level 1's basket, out after the first arrival. */
  tapFinish(): Outcome {
    if (this.plan.finish !== 'button' || !this.arrivedOnce || this.trip || this.finished)
      return { kind: 'none' };
    this.finished = true;
    this.glow = false;
    return { kind: 'finish' };
  }

  private go(unit: Unit, carrier: Carrier, replay: boolean): Outcome {
    this.chosen = { unit: null, carrier: null };
    if (replay) this.place[unit] = 'patch';
    this.trip = { unit, carrier, arrived: travels(unit, carrier), replay };
    return { kind: 'trip', trip: this.trip };
  }

  /** The trip's animation has ended: the unit is in the tray or back on the patch, and the pairing is on the record. */
  land(): Trial | null {
    const t = this.trip;
    if (!t) return null;
    this.trip = null;
    this.place[t.unit] = t.arrived ? 'tray' : 'patch';
    if (!this.tried(t.unit, t.carrier))
      this.trials.push({ unit: t.unit, carrier: t.carrier, arrived: t.arrived });
    if (t.arrived) {
      this.arrivedOnce = true;
      this.staysInRow = 0;
      this.glow = false;
    } else if (++this.staysInRow >= 2 && this.level === 3) this.glow = true;
    return { unit: t.unit, carrier: t.carrier, arrived: t.arrived };
  }

  /** The next useful control, or null once the round is done or a trip runs. */
  hintAction(): Target | null {
    if (this.done || this.trip) return null;
    if (this.level === 1) return this.arrivedOnce ? { finish: true } : { carrier: 'breeze' };
    if (this.level === 2) {
      const unit = this.loaded;
      if (unit) return { carrier: carrierFor(unit) };
      return this.waiting[0] ? { unit: this.waiting[0] } : null;
    }
    const { unit, carrier } = this.chosen;
    if (unit) return { carrier: carrierFor(unit) };
    if (carrier && this.place[unitFor(carrier)] === 'patch') return { unit: unitFor(carrier) };
    const next = this.waiting[0];
    if (!next) return null;
    return carrier ? { carrier: carrierFor(next) } : { unit: next };
  }

  /** The support task a requested hint belongs to: the trip at levels 1–2, each seed's delivery at level 3. */
  private task(): string | null {
    if (this.level < 3) return 'trip';
    const t = this.hintAction();
    if (!t) return null;
    if ('unit' in t) return t.unit;
    if ('carrier' in t) return this.chosen.unit ?? unitFor(t.carrier);
    return null;
  }

  /**
   * Show a hint: glow `hintAction`'s target. Counts one hint the first time per support task; a request while a glow is up,
   * or for a task already counted, counts nothing. Returns the target, or null when there is nothing to show.
   */
  askHint(): Target | null {
    const target = this.hintAction();
    if (!target) return null;
    const task = this.task();
    if (!this.glow && task && !this.hinted.has(task)) {
      this.hinted.add(task);
      this.hints++;
    }
    this.glow = true;
    return target;
  }

  /** Start again: every unit back on the patch, the board cleared; hints already counted stay. */
  restart() {
    for (const u of this.order) this.place[u] = 'patch';
    this.chosen = { unit: null, carrier: null };
    this.trials.length = 0;
    this.trip = null;
    this.arrivedOnce = false;
    this.staysInRow = 0;
    this.glow = false;
  }
}

// ----- layout -----

export interface Pt {
  x: number;
  y: number;
}

export interface SeedLayout {
  ground: number;
  /** Each unit's resting spot on the patch (the hillock's top). */
  patch: Record<string, Pt>;
  hill: Pt;
  bellows: Pt;
  /** Where the critter waits (feet), and where it drops a seed at the tray. */
  critter: Pt;
  dropX: number;
  tray: Pt;
  /** Where a delivered unit rests in the tray. */
  inTray: Record<string, Pt>;
  basket: Pt;
  /** Level 3's trial board: its top-left corner and cell size. */
  board: Pt;
  cell: number;
}

/** Hit squares and circles, in screen units (the definition's sizes). */
export const SEED_HIT = 140;
export const BELLOWS = 150;
export const CRITTER_R = 110;
export const BASKET = 140;
export const CRITTER_SCALE = 0.62;

export function seedLayout(v: View, order: readonly Unit[]): SeedLayout {
  const portrait = v.h > v.w;
  const ground = Math.round(v.h * (portrait ? 0.62 : 0.68));
  const hill = { x: 260, y: ground };
  const patch: Record<string, Pt> = {};
  const gap = 150;
  order.forEach((u, i) => (patch[u] = { x: 260 + (i - (order.length - 1) / 2) * gap, y: ground - 70 }));
  const tray = { x: v.w - 220, y: ground };
  const inTray: Record<string, Pt> = {};
  order.forEach((u, i) => (inTray[u] = { x: tray.x + (i - (order.length - 1) / 2) * 80, y: ground - 30 }));
  const cell = 96;
  return {
    ground,
    patch,
    hill,
    bellows: { x: 120, y: ground - 230 },
    critter: { x: 600, y: ground + 20 },
    dropX: tray.x - 40,
    tray,
    inTray,
    basket: { x: tray.x, y: ground - 190 },
    board: { x: v.w / 2 - cell - 30, y: Math.max(110, ground - 500) },
    cell,
  };
}

/**
 * Where a trip has carried its unit at `t` (0 to 1), on the current layout so a resize mid-trip keeps the path. A breeze trip
 * arcs high to the tray (or, for the burr, rocks in place); a fur trip rides on the critter's back, sliding off at the start
 * for a plume.
 */
export function tripPoint(l: SeedLayout, trip: Trip, t: number): Pt {
  const from = l.patch[trip.unit];
  const to = l.inTray[trip.unit];
  if (trip.carrier === 'breeze') {
    if (!trip.arrived)
      return { x: from.x + Math.sin(t * Math.PI * 4) * 14 * (1 - t), y: from.y - Math.sin(t * Math.PI) * 18 };
    const lift = Math.min(260, from.y - 120);
    return {
      x: from.x + (to.x - from.x) * t,
      y: from.y + (to.y - from.y) * t - Math.sin(t * Math.PI) * lift,
    };
  }
  return { x: from.x, y: from.y };
}
