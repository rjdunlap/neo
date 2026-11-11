/**
 * Festival Signals (Sorting Machine levels 8–9): a flat machine of four slots between two badge sensors and a lantern.
 * A slot holds NOT, AND or OR and reads the sensors or an earlier slot, so a machine is always acyclic. The lantern
 * should light for a friend with just one of the two badges. Everything here is pure; ./festival.ts draws it.
 * Definition: docs/definitions/festival-signals.md.
 */
import type { CritterName } from '../../art/critter';
import type { ColorName } from '../../art/palette';
import type { Rng } from '../../engine/random';
import type { View } from '../../engine/view';
import { ACCEPTED } from './accepted';
import {
  BUTTON_R,
  CARD,
  COLORS,
  corners,
  overlaps,
  PAIRS,
  PICK,
  SEND,
  SLOT,
  SLOW,
  SPECIES,
  TUPLES,
  type Bit,
  type Fixture,
  type Prop,
  type Rect,
  type Value,
  type Verdict,
} from './logic';

// ——— The machine ———

export const SLOTS = 4;
export type PartOp = 'AND' | 'OR' | 'NOT';
/** What a part's picker offers, in order. */
export const PART_OPS: readonly PartOp[] = ['AND', 'OR', 'NOT'];
/** A signal's source: a badge sensor, or an earlier slot by index (0 is the first slot). */
export type Src = 'P' | 'Q' | number;
/** A part and where its signals come from; an unchosen input is null. NOT reads only `a`. */
export interface Part {
  op: PartOp;
  a: Src | null;
  b: Src | null;
}
export interface Flat {
  slots: readonly (Part | null)[];
  /** The slot the lantern reads. */
  out: number;
}

export const EMPTY: Flat = { slots: [null, null, null, null], out: SLOTS - 1 };

/** What slot `i` may read: the sensors and every earlier slot. */
export function sourcesFor(i: number): Src[] {
  const out: Src[] = ['P', 'Q'];
  for (let k = 0; k < i; k++) out.push(k);
  return out;
}

/** How many inputs a part reads. */
export const arity = (op: PartOp) => (op === 'NOT' ? 1 : 2);

/** A copy with slot `i` holding `op` (null clears it). A new part keeps the inputs it can still read. */
export function setPart(m: Flat, i: number, op: PartOp | null): Flat {
  const old = m.slots[i];
  const next: Part | null =
    op === null ? null : { op, a: old?.a ?? null, b: op === 'NOT' ? null : (old?.b ?? null) };
  return { ...m, slots: m.slots.map((s, k) => (k === i ? next : s)) };
}

/** A copy with one input of slot `i` chosen. Only the sensors and earlier slots can be chosen; anything else is ignored. */
export function setInput(m: Flat, i: number, which: 'a' | 'b', src: Src): Flat {
  const old = m.slots[i];
  if (!old || !sourcesFor(i).includes(src)) return m;
  if (which === 'b' && old.op === 'NOT') return m;
  return { ...m, slots: m.slots.map((s, k) => (k === i ? { ...old, [which]: src } : s)) };
}

/** A copy with the lantern's wire on slot `k`. */
export function setOut(m: Flat, k: number): Flat {
  return k >= 0 && k < SLOTS && Number.isInteger(k) ? { ...m, out: k } : m;
}

export interface Reading {
  /** Each slot's own value. */
  slots: Value[];
  /** Whether the lantern's wire reaches the slot. */
  onPath: boolean[];
  /** What the lantern reads. */
  out: Value;
}

/** Every slot's value for one friend, which slots the lantern's wire reaches, and the lantern. */
export function read(m: Flat, p: Bit, q: Bit): Reading {
  const values: Value[] = [];
  const of = (s: Src | null): Value =>
    s === null ? 'incomplete' : s === 'P' ? p === 1 : s === 'Q' ? q === 1 : values[s];
  m.slots.forEach((part) => {
    if (!part) return values.push('incomplete');
    const a = of(part.a);
    if (part.op === 'NOT') return values.push(a === 'incomplete' ? a : !a);
    const b = of(part.b);
    if (a === 'incomplete' || b === 'incomplete') return values.push('incomplete');
    return values.push(part.op === 'AND' ? a && b : a || b);
  });
  const onPath = m.slots.map(() => false);
  const reach = (k: number) => {
    if (onPath[k]) return;
    onPath[k] = true;
    const part = m.slots[k];
    for (const s of part ? [part.a, part.b] : []) if (typeof s === 'number') reach(s);
  };
  reach(m.out);
  return { slots: values, onPath, out: values[m.out] };
}

/** What the lantern does for a friend: an empty slot or input on the wire's path is `incomplete`, never false. */
export function evaluateFlat(m: Flat, f: Pick<Fixture, 'p' | 'q'>): Value {
  return read(m, f.p, f.q).out;
}

/** The first slot on the lantern's path that is empty or has an unchosen input, in source order. */
export function firstEmpty(m: Flat): number | null {
  const { onPath } = read(m, 0, 0);
  const i = m.slots.findIndex(
    (part, k) => onPath[k] && (!part || part.a === null || (part.op !== 'NOT' && part.b === null)),
  );
  return i < 0 ? null : i;
}

/** The sign: the lantern lights for just one badge. */
export const wantedFlat = (f: Pick<Fixture, 'p' | 'q'>) => f.p !== f.q;

/** Check every friend, sent or not. Incomplete comes before fail. */
export function checkFlat(m: Flat, fixtures: readonly Pick<Fixture, 'p' | 'q'>[]): Verdict {
  const empty = firstEmpty(m);
  if (empty !== null) return { status: 'incomplete', slot: empty };
  const rows: number[] = [];
  fixtures.forEach((f, i) => {
    if (evaluateFlat(m, f) !== wantedFlat(f)) rows.push(i);
  });
  return rows.length ? { status: 'fail', rows } : { status: 'pass' };
}

// ——— The accepted machines ———

const srcText = (s: Src | null) => (s === null ? '_' : typeof s === 'number' ? String(s + 1) : s);
const srcOf = (t: string): Src | null => (t === '_' ? null : t === 'P' || t === 'Q' ? t : Number(t) - 1);

/** A machine as text: "OR(P,Q) AND(P,Q) NOT(2) AND(1,3) >4" (slots are numbered from 1; "-" is an empty slot). */
export function encode(m: Flat): string {
  const part = (p: Part | null) =>
    !p ? '-' : p.op === 'NOT' ? `NOT(${srcText(p.a)})` : `${p.op}(${srcText(p.a)},${srcText(p.b)})`;
  return `${m.slots.map(part).join(' ')} >${m.out + 1}`;
}

export function decode(text: string): Flat {
  const words = text.split(' ');
  const out = Number(words.pop()!.slice(1)) - 1;
  const slots = words.map((w): Part | null => {
    if (w === '-') return null;
    const [, op, args] = /^(AND|OR|NOT)\((.*)\)$/.exec(w)!;
    const [a, b] = args.split(',');
    return { op: op as PartOp, a: srcOf(a), b: b === undefined ? null : srcOf(b) };
  });
  return { slots, out };
}

/** The 24 machines that match the sign on every row (./accepted.ts; the rule test re-derives the list). */
export const ACCEPTED_MACHINES: readonly Flat[] = ACCEPTED.map(decode);

/** Whether two slots hold the same part reading the same signals; AND and OR do not mind the order. */
export function agrees(x: Part | null, y: Part | null): boolean {
  if (!x || !y || x.op !== y.op) return false;
  if (x.a === y.a && x.b === y.b) return true;
  return x.op !== 'NOT' && x.a === y.b && x.b === y.a;
}

/** The accepted machine that keeps the most of her slots and her lantern's wire; ties go to the list's order. */
export function nearest(m: Flat): Flat {
  let best = ACCEPTED_MACHINES[0];
  let bestScore = -1;
  for (const acc of ACCEPTED_MACHINES) {
    let score = m.out === acc.out ? 1 : 0;
    for (let i = 0; i < SLOTS; i++) if (agrees(m.slots[i], acc.slots[i])) score++;
    if (score > bestScore) {
      best = acc;
      bestScore = score;
    }
  }
  return best;
}

/** One thing to change: a slot with its inputs, or the lantern's wire. */
export type Fix = { slot: number; part: Part } | { out: number };

/** The first place her machine differs from the nearest accepted one: slots in source order, then the wire. */
export function firstDifference(m: Flat): Fix | null {
  const n = nearest(m);
  for (let i = 0; i < SLOTS; i++) if (!agrees(m.slots[i], n.slots[i])) return { slot: i, part: n.slots[i]! };
  return m.out === n.out ? null : { out: n.out };
}

export function applyFix(m: Flat, fix: Fix): Flat {
  if ('out' in fix) return setOut(m, fix.out);
  return { ...m, slots: m.slots.map((s, k) => (k === fix.slot ? { ...fix.part } : s)) };
}

export type FlatHelp =
  | { kind: 'select'; slot: number }
  | { kind: 'run'; fixture: number }
  | { kind: 'fix'; fix: Fix }
  | { kind: 'check' };

/**
 * Requested help. The first press runs a friend her machine gets wrong, or, while the lantern's path has a gap, points
 * at the first one. Each later press fixes one thing toward the nearest accepted machine. A right machine is told to Check.
 */
export function helpFlat(m: Flat, fixtures: readonly Pick<Fixture, 'p' | 'q'>[], presses: number): FlatHelp {
  const v = checkFlat(m, fixtures);
  if (v.status === 'pass') return { kind: 'check' };
  if (presses <= 1)
    return v.status === 'incomplete' ? { kind: 'select', slot: v.slot } : { kind: 'run', fixture: v.rows[0] };
  const fix = firstDifference(m);
  return fix ? { kind: 'fix', fix } : { kind: 'check' };
}

// ——— Briefs ———

export interface FlatBrief {
  level: 8 | 9;
  /** P and Q, in `PAIRS` order. */
  props: [Prop, Prop];
  /** In screen order. */
  fixtures: Fixture[];
  /** The machine as the round opens. */
  machine: Flat;
}

/** Level 9's opening machine: lights for either badge, so it is wrong only for the friend with both. */
export const NEARLY: Flat = { slots: [{ op: 'OR', a: 'P', b: 'Q' }, null, null, null], out: 0 };

/** The round's brief: a seeded pair, fixture order and cast. */
export function flatBrief(level: number, rng: Rng): FlatBrief {
  const pair = rng.pick(PAIRS);
  const tuples = rng.shuffle([...TUPLES]);
  const species: CritterName[] = rng.shuffle([...SPECIES]).slice(0, 4);
  const colors: ColorName[] = rng.shuffle([...COLORS]).slice(0, 4);
  return {
    level: level === 9 ? 9 : 8,
    props: [pair[0], pair[1]],
    fixtures: tuples.map(([p, q], i) => ({ p, q, species: species[i], color: colors[i] })),
    machine: level === 9 ? NEARLY : EMPTY,
  };
}

/** The row a friend stands for: "00", "01", "10" or "11". */
export const rowKey = (f: Pick<Fixture, 'p' | 'q'>) => `${f.p}${f.q}`;

// ——— The ghost finger ———

/** What the inspector is open on. */
export type Selection = number | 'lantern' | null;

export type FlatMove =
  | { card: number }
  | { send: true }
  | { slot: number }
  | { lantern: true }
  | { part: PartOp }
  | { input: 'a' | 'b'; src: Src }
  | { wire: number }
  | { check: true };

export interface FlatUi {
  /** The friend on stage, or null. */
  friend: number | null;
  selection: Selection;
  /** Per fixture: sent at least once this round. */
  sent: readonly boolean[];
  /** Whether a friend has been sent since the machine last changed. */
  tested: boolean;
}

/**
 * What a capable player does next, one tap at a time: send the friend with both badges, build toward the nearest accepted
 * machine slot by slot (part, then each input), move the lantern's wire, send again, Check.
 */
export function nextFlatMove(brief: FlatBrief, m: Flat, ui: FlatUi): FlatMove {
  const both = Math.max(
    0,
    brief.fixtures.findIndex((f) => f.p === 1 && f.q === 1),
  );
  const sendBoth = (): FlatMove => (ui.friend === both ? { send: true } : { card: both });
  if (!ui.sent.some((s) => s)) return sendBoth();
  const fix = firstDifference(m);
  if (fix && 'slot' in fix) {
    if (ui.selection !== fix.slot) return { slot: fix.slot };
    const have = m.slots[fix.slot];
    if (!have || have.op !== fix.part.op) return { part: fix.part.op };
    if (have.a !== fix.part.a) return { input: 'a', src: fix.part.a! };
    return { input: 'b', src: fix.part.b! };
  }
  if (fix) return ui.selection === 'lantern' ? { wire: fix.out } : { lantern: true };
  return ui.tested ? { check: true } : sendBoth();
}

// ——— Layout ———

const M = 20;
const GAP = 10;
/** A badge sensor's picture in the overview; not a target. */
export const SOURCE = 54;
/** Room above and below the slot tiles for the drawn wires. */
export const LANES = { above: 44, below: 18 };

export interface FlatLayout {
  wide: boolean;
  fixtures: Rect[];
  /** P above Q, at the left of the overview. */
  sources: Rect[];
  slots: Rect[];
  /** A target only at level 9. */
  lantern: Rect;
  /** The inspector's first row: AND, OR, NOT, Clear; or, for the lantern, the four slots. */
  parts: Rect[];
  /** The inspector's input rows: five places each (a slot shows as many as it can read). */
  inputs: [Rect[], Rect[]];
  send: Rect;
  slow: Rect;
  check: Rect;
  undo: Rect;
}

const row = (n: number, x: number, y: number, size: number, gap: number): Rect[] =>
  Array.from({ length: n }, (_, i) => ({ x: x + i * (size + gap), y, w: size, h: size }));

/** Every tap target of a layout at `level`, named. */
export function flatTargets(l: FlatLayout, level: number): { what: string; rect: Rect }[] {
  return [
    ...l.fixtures.map((rect, i) => ({ what: `friend ${i + 1}`, rect })),
    ...l.slots.map((rect, i) => ({ what: `slot ${i + 1}`, rect })),
    ...(level === 9 ? [{ what: 'lantern', rect: l.lantern }] : []),
    ...l.parts.map((rect, i) => ({ what: `part ${i + 1}`, rect })),
    ...l.inputs.flatMap((r, k) => r.map((rect, i) => ({ what: `input ${k ? 'b' : 'a'} ${i + 1}`, rect }))),
    { what: 'Send', rect: l.send },
    { what: 'Slow', rect: l.slow },
    { what: 'Check', rect: l.check },
    { what: 'Undo', rect: l.undo },
  ];
}

/**
 * Upright (taller than wide): friends in a row, the overview under them, the inspector under that and the buttons along
 * the bottom right of the pet, all anchored to the bottom where a thumb is. Wide: the overview along the top, friends two
 * by two at the left, the inspector at the right, the buttons along the bottom. Null rather than shrink a target.
 */
export function flatLayout(v: View): FlatLayout | null {
  const wide = v.w >= v.h;
  const overviewW = SOURCE + 12 + SLOTS * SLOT + (SLOTS - 1) * 12 + 12 + SLOT;
  const inspectorW = 5 * PICK + 4 * GAP;
  const inspectorH = 3 * PICK + 2 * GAP;
  const buttonsW = SEND.w + SLOW + 4 * BUTTON_R + 3 * 16;
  const by = v.h - M - BUTTON_R;
  const bx = 180 + (v.w - M - 180 - buttonsW) / 2;
  const send: Rect = { x: bx, y: by - SEND.h / 2, ...SEND };
  const slow: Rect = { x: send.x + SEND.w + 16, y: by - SLOW / 2, w: SLOW, h: SLOW };
  const check: Rect = { x: slow.x + SLOW + 16, y: by - BUTTON_R, w: 2 * BUTTON_R, h: 2 * BUTTON_R };
  const undo: Rect = { x: check.x + check.w + 16, y: by - BUTTON_R, w: 2 * BUTTON_R, h: 2 * BUTTON_R };
  let ox: number;
  let oy: number;
  let ix: number;
  let iy: number;
  let fixtures: Rect[];
  if (wide) {
    ox = 150 + (v.w - M - 150 - overviewW) / 2;
    oy = M + LANES.above;
    fixtures = Array.from({ length: 4 }, (_, i) => ({
      x: M + (i % 2) * (CARD.w + 16),
      y: 225 + Math.floor(i / 2) * (CARD.h + 16),
      ...CARD,
    }));
    const left = M + 2 * CARD.w + 16 + M;
    ix = left + (v.w - M - left - inspectorW) / 2;
    iy = oy + SLOT + LANES.below + 12;
  } else {
    ix = (v.w - inspectorW) / 2;
    iy = v.h - 180 - inspectorH;
    ox = (v.w - overviewW) / 2;
    oy = iy - 12 - LANES.below - SLOT;
    const cardsW = 4 * CARD.w + 3 * 16;
    const fy = Math.max(M, oy - LANES.above - 12 - CARD.h);
    fixtures = row(4, 0, fy, CARD.w, 16).map((r) => ({
      ...r,
      x: r.x + 150 + (v.w - M - 150 - cardsW) / 2,
      h: CARD.h,
    }));
  }
  const sx = ox + SOURCE + 12;
  const slots = row(SLOTS, sx, oy, SLOT, 12);
  const sources: Rect[] = [0, 1].map((k) => ({ x: ox, y: oy + k * (SLOT - SOURCE), w: SOURCE, h: SOURCE }));
  const lantern: Rect = { x: sx + SLOTS * (SLOT + 12), y: oy, w: SLOT, h: SLOT };
  const parts = row(4, ix + (inspectorW - (4 * PICK + 3 * GAP)) / 2, iy, PICK, GAP);
  const inputs: [Rect[], Rect[]] = [
    row(5, ix, iy + PICK + GAP, PICK, GAP),
    row(5, ix, iy + 2 * (PICK + GAP), PICK, GAP),
  ];
  const l: FlatLayout = { wide, fixtures, sources, slots, lantern, parts, inputs, send, slow, check, undo };
  const targets = flatTargets(l, 9).map((t) => t.rect);
  const boxes = [...targets, ...sources];
  if (!boxes.every((r) => r.x >= 0 && r.y >= 0 && r.x + r.w <= v.w && r.y + r.h <= v.h)) return null;
  if (boxes.some((r) => corners(v).some((c) => overlaps(r, c)))) return null;
  if (boxes.some((r, i) => boxes.some((s, j) => i < j && overlaps(r, s)))) return null;
  return l;
}
