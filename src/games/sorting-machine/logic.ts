/**
 * Sorting Machine's rules: a brief (two toy properties, four fixture critters, a sign), the machine as a small
 * acyclic graph of sensors and gates, an exhaustive Check over every fixture, help that runs a telling friend and
 * then installs a right answer, the ghost finger's plan and the layout. Everything here is pure; the scene draws it.
 * Definition: docs/definitions/sorting-machine.md.
 */
import type { CritterName } from '../../art/critter';
import type { ColorName } from '../../art/palette';
import type { Rng } from '../../engine/random';
import type { View } from '../../engine/view';

// ——— Properties, fixtures and briefs ———

/** Toy accessories a critter wears or not. Species never changes a value. */
export type Prop = 'hat' | 'whiskers' | 'boots';
export const PROPS: readonly Prop[] = ['hat', 'whiskers', 'boots'];
/** The three pairs a brief can use, as (P, Q). */
export const PAIRS: readonly [Prop, Prop][] = [['hat', 'whiskers'], ['hat', 'boots'], ['whiskers', 'boots']];

export type Bit = 0 | 1;
/** The four tuples (P, Q) in a fixed order: 00, 01, 10, 11. */
export const TUPLES: readonly [Bit, Bit][] = [[0, 0], [0, 1], [1, 0], [1, 1]];

/** Species without natural whiskers, so a toy whisker set reads as a toy. */
export const SPECIES: readonly CritterName[] = ['pip', 'bear', 'dog', 'pig', 'duck', 'cow'];
export const COLORS: readonly ColorName[] = ['teal', 'brown', 'orange', 'pink', 'yellow', 'green', 'blue', 'purple'];

export interface Fixture {
  p: Bit;
  q: Bit;
  species: CritterName;
  color: ColorName;
}

export type Op = 'AND' | 'OR';
/**
 * A machine: a sensor reads one property (an empty slot reads nothing yet; a `fixed` sensor is part of the machine,
 * not a slot), a gate combines two readings. A slot is a sensor without `fixed`, or a gate.
 */
export type Node =
  | { kind: 'sensor'; prop: Prop | null; fixed?: true }
  | { kind: 'gate'; op: Op | null; a: Node; b: Node };

export type Value = true | false | 'incomplete';

export interface Brief {
  level: number;
  /** P and Q. */
  props: [Prop, Prop];
  /** In screen order. */
  fixtures: Fixture[];
  /** The sign: the machine the doors should agree with (level 1: the fixed sensor itself, so the door answers it). */
  target: Node;
  /** The machine as the round opens. */
  graph: Node;
  /** What a sensor slot may hold. */
  candidates: Prop[];
}

/** Whether a fixture has a property. A property outside the brief is never worn. */
export function has(f: Fixture, brief: Brief, prop: Prop): boolean {
  if (prop === brief.props[0]) return f.p === 1;
  if (prop === brief.props[1]) return f.q === 1;
  return false;
}

// ——— Evaluation ———

/** The machine's answer for one fixture. An empty slot anywhere on the way is `incomplete`, never false. */
export function evaluate(node: Node, f: Fixture, brief: Brief): Value {
  if (node.kind === 'sensor') return node.prop === null ? 'incomplete' : has(f, brief, node.prop);
  if (node.op === null) return 'incomplete';
  const a = evaluate(node.a, f, brief);
  const b = evaluate(node.b, f, brief);
  if (a === 'incomplete' || b === 'incomplete') return 'incomplete';
  return node.op === 'AND' ? a && b : a || b;
}

/** What the sign wants for a fixture. */
export function wanted(f: Fixture, brief: Brief): boolean {
  return evaluate(brief.target, f, brief) === true;
}

export interface Slot {
  index: number;
  kind: 'sensor' | 'gate';
  value: Prop | Op | null;
}

/** The editable slots, in reading order. */
export function slots(node: Node): Slot[] {
  const out: Slot[] = [];
  const walk = (n: Node) => {
    if (n.kind === 'sensor') {
      if (!n.fixed) out.push({ index: out.length, kind: 'sensor', value: n.prop });
      return;
    }
    out.push({ index: out.length, kind: 'gate', value: n.op });
    walk(n.a);
    walk(n.b);
  };
  walk(node);
  return out;
}

/** A copy of the machine with slot `index` holding `value` (null empties it). */
export function setSlot(node: Node, index: number, value: Prop | Op | null): Node {
  let at = 0;
  const walk = (n: Node): Node => {
    if (n.kind === 'sensor') {
      if (n.fixed) return n;
      const mine = at++ === index;
      return mine ? { kind: 'sensor', prop: value as Prop | null } : n;
    }
    const mine = at++ === index;
    const a = walk(n.a);
    const b = walk(n.b);
    return { kind: 'gate', op: mine ? (value as Op | null) : n.op, a, b };
  };
  return walk(node);
}

export function complete(node: Node): boolean {
  return slots(node).every((s) => s.value !== null);
}

export type Verdict =
  | { status: 'incomplete'; slot: number }
  | { status: 'pass' }
  | { status: 'fail'; rows: number[] };

/** Check the whole domain: every fixture, whether or not it was sent. Incomplete comes before fail. */
export function check(graph: Node, brief: Brief): Verdict {
  const empty = slots(graph).find((s) => s.value === null);
  if (empty) return { status: 'incomplete', slot: empty.index };
  const rows: number[] = [];
  brief.fixtures.forEach((f, i) => {
    if (evaluate(graph, f, brief) !== wanted(f, brief)) rows.push(i);
  });
  return rows.length ? { status: 'fail', rows } : { status: 'pass' };
}

/** Every filling of the machine's slots from its candidates. */
export function candidateGraphs(brief: Brief): Node[] {
  const list = slots(brief.graph);
  let graphs: Node[] = [brief.graph];
  for (const s of list) {
    const choices: (Prop | Op)[] = s.kind === 'sensor' ? brief.candidates : ['AND', 'OR'];
    graphs = graphs.flatMap((g) => choices.map((c) => setSlot(g, s.index, c)));
  }
  return graphs;
}

/** The accepted machines: every candidate filling whose doors all agree with the sign. */
export function solutions(brief: Brief): Node[] {
  return candidateGraphs(brief).filter((g) => check(g, brief).status === 'pass');
}

export type Help = { kind: 'run'; fixture: number } | { kind: 'install'; graph: Node };

/**
 * Requested help. The first press picks a friend worth sending: one the machine (or, while a slot is empty, a wrong
 * candidate) gets wrong, so the run shows something. The second installs an accepted machine; a Check still ends the round.
 */
export function helpFor(graph: Node, brief: Brief, presses: number): Help {
  if (presses >= 2) return { kind: 'install', graph: solutions(brief)[0] ?? graph };
  const wrongs = complete(graph) ? [graph] : candidateGraphs(brief).filter((g) => check(g, brief).status !== 'pass');
  const i = brief.fixtures.findIndex((f) => wrongs.some((g) => evaluate(g, f, brief) !== wanted(f, brief)));
  return { kind: 'run', fixture: Math.max(0, i) };
}

// ——— Plans and seeded briefs ———

export interface Plan {
  level: number;
  name: string;
}

const PLANS: readonly Plan[] = [
  { level: 1, name: 'See the signal' },
  { level: 2, name: 'Choose the sensor' },
];

export const MAX_LEVEL = PLANS.length;

export function planFor(level: number): Plan {
  return PLANS[Math.min(PLANS.length, Math.max(1, Math.floor(level))) - 1];
}

/** A cast of distinct species and colors. */
function cast(rng: Rng, n: number): { species: CritterName; color: ColorName }[] {
  const species = rng.shuffle([...SPECIES]).slice(0, n);
  const colors = rng.shuffle([...COLORS]).slice(0, n);
  return species.map((s, i) => ({ species: s, color: colors[i] }));
}

/** The round's brief from the level and the seeded RNG: the same seed gives the same brief, order and cast. */
export function briefFor(level: number, rng: Rng): Brief {
  const plan = planFor(level);
  if (plan.level === 1) {
    const p = rng.pick(PROPS);
    const q = rng.pick(PROPS.filter((x) => x !== p));
    const tuples = rng.shuffle<[Bit, Bit]>([[1, 0], [0, 0]]);
    const who = cast(rng, 2);
    const sensor: Node = { kind: 'sensor', prop: p, fixed: true };
    return {
      level: 1,
      props: [p, q],
      fixtures: tuples.map(([a, b], i) => ({ p: a, q: b, ...who[i] })),
      target: sensor,
      graph: sensor,
      candidates: [],
    };
  }
  const pair = rng.pick(PAIRS);
  const target = rng.pick(pair);
  const tuples = rng.shuffle([...TUPLES]);
  const who = cast(rng, 4);
  return {
    level: 2,
    props: [pair[0], pair[1]],
    fixtures: tuples.map(([a, b], i) => ({ p: a, q: b, ...who[i] })),
    target: { kind: 'sensor', prop: target, fixed: true },
    graph: { kind: 'sensor', prop: null },
    candidates: [pair[0], pair[1]],
  };
}

// ——— Accounting ———

/**
 * Misses and hints for one round. A complete machine whose Check fails is one miss; the second miss (and every
 * second after) lights the glow and counts one hint, once. Requested help counts one hint per press.
 */
export class Tally {
  misses = 0;
  hints = 0;
  glowing = false;
  presses = 0;
  private lit = false;

  /** A failed Check of a complete machine. Returns whether the glow comes on now. */
  miss(): boolean {
    this.misses++;
    if (this.misses % 2 !== 0) return false;
    this.glowing = true;
    if (!this.lit) { this.lit = true; this.hints++; }
    return true;
  }

  /** A press of the pet's Help: one hint each. */
  help(): number {
    this.presses++;
    this.hints++;
    return this.presses;
  }
}

// ——— The ghost finger ———

export type Move = { send: number } | { pick: Prop } | { check: true } | { done: true };

/**
 * What a capable child does next: send a telling friend (the one help would pick), fill the slot, Check; at level 1
 * send both friends then tap Done.
 */
export function nextMove(brief: Brief, graph: Node, sent: readonly boolean[]): Move {
  if (brief.level === 1) {
    const i = sent.findIndex((s) => !s);
    return i < 0 ? { done: true } : { send: i };
  }
  if (!sent.some((s) => s)) {
    const h = helpFor(graph, brief, 1);
    if (h.kind === 'run') return { send: h.fixture };
  }
  const empty = slots(graph).find((s) => s.value === null);
  if (empty) {
    const right = solutions(brief)[0];
    const v = right ? slots(right)[empty.index].value : null;
    return { pick: (v ?? brief.candidates[0]) as Prop };
  }
  return { check: true };
}

// ——— Layout ———

export interface Rect { x: number; y: number; w: number; h: number }
export interface Pt { x: number; y: number }
export const centre = (r: Rect): Pt => ({ x: r.x + r.w / 2, y: r.y + r.h / 2 });
export const overlaps = (a: Rect, b: Rect) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
const inside = (a: Rect, v: View) => a.x >= 0 && a.y >= 0 && a.x + a.w <= v.w && a.y + a.h <= v.h;

/** The home and ? buttons (top left) and the guide (bottom left). */
export const HOME_CORNER = { w: 130, h: 215 };
export const PET_CORNER = { w: 160, h: 170 };
export function corners(v: View): Rect[] {
  return [{ x: 0, y: 0, ...HOME_CORNER }, { x: 0, y: v.h - PET_CORNER.h, ...PET_CORNER }];
}

export const CARD = { w: 130, h: 150 };
export const SLOT = 116;
export const PICK = 116;
export const SEND = { w: 160, h: 104 };
export const BUTTON_R = 56;
export const SLOW = 104;
const M = 20;

export interface MachineLayout {
  fixtures: Rect[];
  /** The machine's box; the slot (level 2) sits in its top half and the door in its bottom half. */
  machine: Rect;
  slot: Rect | null;
  door: Rect;
  sign: Rect | null;
  send: Rect;
  check: Rect | null;
  done: Rect | null;
  slow: Rect;
  undo: Rect | null;
  /** Where the picker's candidates go when the slot is open, centred on the slot. */
  picks: Rect[];
}

const button = (cx: number, cy: number, r = BUTTON_R): Rect => ({ x: cx - r, y: cy - r, w: 2 * r, h: 2 * r });

/**
 * The stage, machine and sign left to right in landscape, stacked in portrait; controls along the bottom, clear of the
 * guide and the corner buttons. Null when the view cannot hold full-size targets (nothing shrinks).
 */
export function machineLayout(level: number, v: View): MachineLayout | null {
  const n = level === 1 ? 2 : 4;
  const withSign = level >= 2;
  const wide = v.w >= v.h;
  const fixtures: Rect[] = [];
  let machine: Rect;
  let sign: Rect | null = null;
  let send: Rect;
  let check: Rect | null = null;
  let done: Rect | null = null;
  let slow: Rect;
  let undo: Rect | null = null;
  const gap = 16;
  if (wide) {
    const top = M + 60;
    const left = PET_CORNER.w + M;
    const cols = 2;
    for (let i = 0; i < n; i++) {
      fixtures.push({ x: left + (i % cols) * (CARD.w + gap), y: top + Math.floor(i / cols) * (CARD.h + gap), w: CARD.w, h: CARD.h });
    }
    const stageRight = left + cols * CARD.w + (cols - 1) * gap;
    const signW = withSign ? 220 : 0;
    const mx = stageRight + M + 10;
    const mw = v.w - M - signW - (withSign ? M : 0) - mx;
    machine = { x: mx, y: top, w: Math.max(240, mw), h: 380 };
    if (withSign) sign = { x: v.w - M - signW, y: top, w: signW, h: 240 };
    const by = v.h - M - SEND.h / 2;
    send = { x: machine.x + machine.w / 2 - SEND.w / 2, y: by - SEND.h / 2, w: SEND.w, h: SEND.h };
    const rightX = v.w - M - BUTTON_R;
    if (withSign) {
      undo = button(rightX, by);
      check = button(rightX - 2 * BUTTON_R - 24, by);
      slow = { x: check.x - 24 - SLOW, y: by - SLOW / 2, w: SLOW, h: SLOW };
    } else {
      done = button(rightX, by);
      slow = { x: done.x - 24 - SLOW, y: by - SLOW / 2, w: SLOW, h: SLOW };
    }
    if (send.x + send.w + 16 > slow.x) send.x = slow.x - 16 - SEND.w;
  } else {
    const top = M;
    if (withSign) sign = { x: HOME_CORNER.w + M, y: top, w: v.w - HOME_CORNER.w - 2 * M, h: 180 };
    const rowY = withSign ? sign!.y + sign!.h + M : Math.max(top, HOME_CORNER.h + M);
    const rowW = n * CARD.w + (n - 1) * gap;
    const rowX = Math.max(withSign ? M : HOME_CORNER.w + M, (v.w - rowW) / 2);
    for (let i = 0; i < n; i++) fixtures.push({ x: rowX + i * (CARD.w + gap), y: rowY, w: CARD.w, h: CARD.h });
    const by = v.h - PET_CORNER.h - M - SEND.h / 2;
    const mTop = rowY + CARD.h + M;
    const mBottom = by - SEND.h / 2 - M;
    machine = { x: v.w / 2 - 150, y: mTop, w: 300, h: mBottom - mTop };
    const rightX = v.w - M - BUTTON_R;
    if (withSign) {
      undo = button(rightX, by);
      check = button(rightX - 2 * BUTTON_R - 24, by);
      slow = { x: check.x - 24 - SLOW, y: by - SLOW / 2, w: SLOW, h: SLOW };
    } else {
      done = button(rightX, by);
      slow = { x: done.x - 24 - SLOW, y: by - SLOW / 2, w: SLOW, h: SLOW };
    }
    send = { x: slow.x - 24 - SEND.w, y: by - SEND.h / 2, w: SEND.w, h: SEND.h };
  }
  const slot: Rect | null = withSign ? { x: machine.x + machine.w / 2 - SLOT / 2, y: machine.y + 24, w: SLOT, h: SLOT } : null;
  const doorTop = slot ? slot.y + slot.h + 36 : machine.y + 70;
  const door: Rect = { x: machine.x + machine.w / 2 - 80, y: doorTop, w: 160, h: Math.max(150, machine.y + machine.h - 16 - doorTop) };
  const picks: Rect[] = [];
  if (slot) {
    const c = centre(slot);
    const pw = 2 * PICK + 20;
    const py = slot.y + slot.h + 12;
    for (let i = 0; i < 2; i++) picks.push({ x: c.x - pw / 2 + i * (PICK + 20), y: py, w: PICK, h: PICK });
  }
  const parts = [...fixtures, machine, send, slow, ...(sign ? [sign] : []), ...(check ? [check] : []), ...(done ? [done] : []), ...(undo ? [undo] : [])];
  if (machine.h < 300) return null;
  if (!parts.every((p) => inside(p, v))) return null;
  if (parts.some((p) => corners(v).some((q) => overlaps(p, q)))) return null;
  if (parts.some((p, i) => parts.some((q, j) => i < j && overlaps(p, q)))) return null;
  return { fixtures, machine, slot, door, sign, send, check, done, slow, undo, picks };
}
