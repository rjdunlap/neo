/**
 * Measuring Post's rules: a friend asks a question about one attribute (how long, how heavy, how much it holds); the
 * right tool measures it in units of that attribute; a count is the authored quantity divided by the unit's size, exact
 * every time. Level 1 picks the tool; level 2 sees one object measured with big and little units of the same attribute
 * and names whose units were smaller (or, on the last task, bigger). Pretend, authored measurements: nothing is read from
 * screen pixels. Definition: docs/definitions/measuring-post.md.
 */
import type { Rng } from '../../engine/random';

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

export interface LevelPlan {
  level: number;
  name: string;
  /** Two friends measure with big and little units, and she names whose were smaller. */
  compare: boolean;
}

export const PLANS: readonly LevelPlan[] = [
  { level: 1, name: 'Which tool? Pick the tool for how long, how heavy or how much', compare: false },
  { level: 2, name: 'Whose unit was smaller? The same thing measured in big and little units', compare: true },
];

export const planFor = (level: number) => PLANS[Math.max(0, Math.min(PLANS.length - 1, level - 1))];

/** One measurement record: the units a friend used and the count they got. */
export interface MeasureRecord {
  unit: Unit;
  count: number;
}

export interface Task {
  attribute: Attribute;
  quantity: number;
  /** Level 2: the two records, top (or left) first; seeded order. Level 1: one little-unit record. */
  records: MeasureRecord[];
  /** Level 2: which size the question asks for. */
  ask: UnitSize | null;
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
  if (!plan.compare) {
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

/** The steps of a task in order: the tool, then (level 2) the row, (level 1) Send once measured. */
export type Step = 'tool' | 'answer' | 'send';
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
