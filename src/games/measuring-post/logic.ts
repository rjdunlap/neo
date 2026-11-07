/**
 * Measuring Post's rules: a friend asks a question about one attribute (how long, how heavy, how much it holds); the
 * right tool measures it in units of that attribute; a count is the authored quantity divided by the unit's size, exact
 * every time. Level 1 picks the tool; level 2 sees one object measured with big and little units of the same attribute
 * and names whose units were smaller (or, on the last task, bigger); level 3 sees two objects measured in different units,
 * remeasures both in one unit and only then compares them; level 4 watches one kilogram balance four 250-gram weights and
 * fills a kilograms-to-grams table from that observed equivalence. Pretend, authored measurements: nothing is read from
 * screen pixels. Definition: docs/definitions/measuring-post.md.
 */
import type { Rng } from '../../engine/random';
import type { BandLevels } from '../../progress/difficulty';

export type Attribute = 'length' | 'mass' | 'capacity';
export type Tool = 'rope' | 'balance' | 'cup';
export type UnitSize = 'big' | 'little';

export const ATTRIBUTES: readonly Attribute[] = ['length', 'mass', 'capacity'];
export const TOOLS: readonly Tool[] = ['rope', 'balance', 'cup'];

/** Each tool measures exactly one attribute, and each attribute has exactly one tool. */
export const TOOL_FOR: Record<Attribute, Tool> = { length: 'rope', mass: 'balance', capacity: 'cup' };
export const attributeOf = (tool: Tool): Attribute => ATTRIBUTES.find((a) => TOOL_FOR[a] === tool)!;

/** A unit belongs to one attribute; its size is in little units of that attribute (a big unit is two little ones). */
export interface Unit {
  attribute: Attribute;
  size: UnitSize;
}

export const UNIT_VALUE: Record<UnitSize, number> = { big: 2, little: 1 };

/** How many of `unit` measure `quantity` (in little units of `attribute`); null for another attribute or a remainder. */
export function count(attribute: Attribute, quantity: number, unit: Unit): number | null {
  if (unit.attribute !== attribute) return null;
  const v = UNIT_VALUE[unit.size];
  return quantity % v === 0 ? quantity / v : null;
}

/** The objects friends bring, one per attribute: a ribbon, a parcel, a jug. Quantities are in little units. */
export const OBJECT: Record<Attribute, 'ribbon' | 'parcel' | 'jug'> = { length: 'ribbon', mass: 'parcel', capacity: 'jug' };

/** Level 1 measures every object in little units: four of them each time. */
export const LEVEL1_QUANTITY: Record<Attribute, number> = { length: 4, mass: 4, capacity: 4 };
/** Level 2's fixed records: 3 big / 6 little worms, 2 big / 4 little blocks, 3 big / 6 little cups. */
export const LEVEL2_QUANTITY: Record<Attribute, number> = { length: 6, mass: 4, capacity: 6 };

/**
 * What a level asks: pick the tool (1); name whose units were smaller (2); remeasure two objects in one unit, then
 * compare (3); fill a kilograms-to-grams table from an observed balance (4).
 */
export type Mode = 'tool' | 'rows' | 'common' | 'table';

export interface LevelPlan {
  level: number;
  name: string;
  mode: Mode;
}

export const PLANS: readonly LevelPlan[] = [
  { level: 1, name: 'Which tool? Pick the tool for how long, how heavy or how much', mode: 'tool' },
  { level: 2, name: 'Whose unit was smaller? The same thing measured in big and little units', mode: 'rows' },
  { level: 3, name: 'Measure them the same way: remeasure two things in one unit, then compare', mode: 'common' },
  { level: 4, name: 'How many little ones? One kilogram balances 1000 grams; fill the table', mode: 'table' },
];

export const LEVELS: BandLevels = { school: { min: 1, max: 4 } };

export const planFor = (level: number) => PLANS[Math.max(0, Math.min(PLANS.length - 1, level - 1))];

/** One measurement record: the units a friend used and the count they got. */
export interface MeasureRecord {
  unit: Unit;
  count: number;
}

/** Level 3's two objects: A is measured in big units, B in little ones. */
export type ObjectId = 'A' | 'B';

export interface Task {
  attribute: Attribute;
  /** Levels 1–2: the one object's quantity, in little units. Level 3: object A's. */
  quantity: number;
  /**
   * Level 2: the two records, top (or left) first; seeded order. Level 1: one little-unit record. Level 3: each
   * object's first record (A in big units, B in little ones), in display order. Level 4: none.
   */
  records: MeasureRecord[];
  /** Level 2: which size the question asks for. */
  ask: UnitSize | null;
  /** Level 3: the object each record measures and its quantity, in display order. */
  objects?: { id: ObjectId; quantity: number }[];
  /** Level 4: the row to fill and its choices. */
  table?: TableTask;
}

function recordFor(attribute: Attribute, quantity: number, size: UnitSize): MeasureRecord {
  const unit: Unit = { attribute, size };
  const n = count(attribute, quantity, unit);
  if (n === null) throw new Error(`inexact record: ${attribute} ${quantity} in ${size}`);
  return { unit, count: n };
}

/**
 * The round's three tasks, one per attribute. Level 1 starts with the ribbon; level 2 shuffles the attributes and the
 * row order, and its last task asks for the bigger units.
 */
export function tasksFor(plan: LevelPlan, rng: Rng): Task[] {
  if (plan.mode === 'common') return commonTasks(rng);
  if (plan.mode === 'table') return tableTasks(rng);
  if (plan.mode === 'tool') {
    const rest = rng.shuffle(['mass', 'capacity'] as Attribute[]);
    return (['length', ...rest] as Attribute[]).map((a) => ({
      attribute: a, quantity: LEVEL1_QUANTITY[a], records: [recordFor(a, LEVEL1_QUANTITY[a], 'little')], ask: null,
    }));
  }
  return rng.shuffle([...ATTRIBUTES]).map((a, i) => {
    const q = LEVEL2_QUANTITY[a];
    const sizes: UnitSize[] = rng.chance(0.5) ? ['big', 'little'] : ['little', 'big'];
    return { attribute: a, quantity: q, records: sizes.map((s) => recordFor(a, q, s)), ask: i === 2 ? 'big' : 'little' };
  });
}

/** The row that answers a level-2 task. */
export const answerRow = (task: Task): number => task.records.findIndex((r) => r.unit.size === task.ask);

/** A tool choice: the right one measures; any other measures its own attribute, which does not answer the question. */
export const toolAnswers = (task: Task, tool: Tool) => attributeOf(tool) === task.attribute;

// ---- Level 3: measure them the same way ----

/**
 * Level 3's fixed records, in little units: ribbons A = 6 (three big worms) and B = 5 (five little), so A is longer
 * though its count is smaller; parcels A = 4 (two big blocks) and B = 5 (five little), B heavier; jugs A = 6 (three big
 * cups) and B = 6 (six little), the same.
 */
export const LEVEL3_QUANTITY: Record<Attribute, Record<ObjectId, number>> = {
  length: { A: 6, B: 5 }, mass: { A: 4, B: 5 }, capacity: { A: 6, B: 6 },
};
const FIRST_SIZE: Record<ObjectId, UnitSize> = { A: 'big', B: 'little' };

function commonTasks(rng: Rng): Task[] {
  return rng.shuffle([...ATTRIBUTES]).map((a) => {
    const ids: ObjectId[] = rng.chance(0.5) ? ['A', 'B'] : ['B', 'A'];
    const objects = ids.map((id) => ({ id, quantity: LEVEL3_QUANTITY[a][id] }));
    return {
      attribute: a, quantity: LEVEL3_QUANTITY[a].A, ask: null, objects,
      records: objects.map((o) => recordFor(a, o.quantity, FIRST_SIZE[o.id])),
    };
  });
}

/**
 * Both objects remeasured in `size` units of the task's attribute: each count, or null where that object ends between
 * marks. Big units leave the five-little ribbon and parcel between marks; little units are exact for all of them.
 */
export function remeasure(task: Task, size: UnitSize): (number | null)[] {
  return task.objects!.map((o) => count(task.attribute, o.quantity, { attribute: task.attribute, size }));
}

/** A common unit measures both objects exactly: only then may she compare. */
export const commonExact = (task: Task, size: UnitSize) => remeasure(task, size).every((n) => n !== null);

/** The answer pads, left to right: the left object, "the same", the right object. */
export type Pick = 0 | 1 | 2;
export const SAME: Pick = 1;

/**
 * The pad that answers a level-3 task, read from counts in the common `size` (which must be exact): the side with the
 * larger count, or "the same". The question names the attribute: longer, heavier, holds more.
 */
export function compareAnswer(task: Task, size: UnitSize = 'little'): Pick {
  const [l, r] = remeasure(task, size);
  if (l === null || r === null) throw new Error('compare needs a common unit that measures both exactly');
  return l === r ? SAME : l > r ? 0 : 2;
}

/** The object a level-3 answer names, or 'same': sides swap, the answer stays with the object. */
export const answerObject = (task: Task): ObjectId | 'same' => {
  const p = compareAnswer(task);
  return p === SAME ? 'same' : task.objects![p === 0 ? 0 : 1].id;
};

// ---- Level 4: how many little ones? ----

export const KILOGRAM = 1000;
/** The little weight that balances a quarter of one kilogram: four of them make one group of 1000 grams. */
export const SMALL_WEIGHT = 250;
export const PER_GROUP = KILOGRAM / SMALL_WEIGHT;

/** A level-4 row to fill: `kg` kilograms is how many grams, with the rows above it already filled. */
export interface TableTask {
  kg: number;
  /** The kilogram rows already measured and filled above, shown with their grams. */
  known: number[];
  /** The three choices in grams, in seeded pad order. */
  options: number[];
}

/** Grams that balance `kg` kilograms: one group of four 250-gram weights for each kilogram. */
export const gramsFor = (kg: number) => kg * PER_GROUP * SMALL_WEIGHT;

/** Level 4's two rows: 3 kg from 1000, 3000, 4000; then 4 kg from 2000, 4000, 5000 (pad order seeded). */
export const LEVEL4_ROWS: readonly { kg: number; known: number[]; options: number[] }[] = [
  { kg: 3, known: [1, 2], options: [1000, 3000, 4000] },
  { kg: 4, known: [1, 2, 3], options: [2000, 4000, 5000] },
];

function tableTasks(rng: Rng): Task[] {
  return LEVEL4_ROWS.map((row) => ({
    attribute: 'mass' as Attribute, quantity: row.kg, records: [], ask: null,
    table: { kg: row.kg, known: [...row.known], options: rng.shuffle([...row.options]) },
  }));
}

/** The pad holding the right number of grams. */
export const tableAnswer = (task: Task): number => task.table!.options.indexOf(gramsFor(task.table!.kg));

/**
 * The steps of a task in order: the tool, then (level 3) the common unit, then (levels 2–4) the answer, (levels 1 and
 * 4) Send once done.
 */
export type Step = 'tool' | 'unit' | 'answer' | 'send';
export type HelpId = `${number}:${Step}`;
export const helpId = (task: number, step: Step): HelpId => `${task}:${step}`;

/**
 * Counts each help once per task step, whether she asked for it or it glowed after two misses: repeating it, replaying
 * or a later miss on the same step adds nothing.
 */
export class HelpTally {
  private readonly given = new Set<HelpId>();
  get count() { return this.given.size; }
  give(id: HelpId) { this.given.add(id); }
  has(id: HelpId) { return this.given.has(id); }
}

/** After this many misses on one task, the useful next control glows (and that counts as the step's hint). */
export const GLOW_AFTER = 2;
