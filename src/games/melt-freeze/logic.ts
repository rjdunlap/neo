import type { LineId } from '../../content/voice-script';
import type { Rng } from '../../engine/random';
import type { View } from '../../engine/view';

/**
 * Melt and Freeze, levels 1–4: a thing on a little table, a big sun that warms it and a snowflake that cools it. The state
 * table is authored, not simulated, so every change can be tested: `sun` takes a solid to its melted form if the thing melts,
 * `snow` takes a melted thing back to its solid if the change can be undone, and everything else is no change.
 */

export type Tool = 'sun' | 'snow';
export type State = 'solid' | 'melted';

export const SUBSTANCES = {
  ice: { solid: 'an ice cube', melted: 'a clear puddle', reversible: true, word: 'ice' },
  butter: { solid: 'a butter block', melted: 'a yellow puddle', reversible: true, word: 'butter' },
  chocolate: { solid: 'a chocolate square', melted: 'a brown pool', reversible: true, word: 'chocolate' },
  stone: { solid: 'a grey stone', melted: null, reversible: false, word: 'stone' },
  spoon: { solid: 'a wooden spoon', melted: null, reversible: false, word: 'spoon' },
} as const satisfies Record<string, { solid: string; melted: string | null; reversible: boolean; word: string }>;
export type Substance = keyof typeof SUBSTANCES;
export const ALL_SUBSTANCES = Object.keys(SUBSTANCES) as Substance[];

/** Whether warming changes the thing at all. A thing that melts here can always be made hard again (levels 1–4). */
export const melts = (s: Substance) => SUBSTANCES[s].melted !== null;
export const CHANGERS = ALL_SUBSTANCES.filter(melts);
export const STAYERS = ALL_SUBSTANCES.filter((s) => !melts(s));

/** One warm or cool step. The same state back means nothing happened. */
export function step(s: Substance, state: State, tool: Tool): State {
  if (tool === 'sun') return state === 'solid' && melts(s) ? 'melted' : state;
  return state === 'melted' && SUBSTANCES[s].reversible ? 'solid' : state;
}

/** What the voice says after a tool on a thing: the change, the named thing that stays, or "already" when the tool cannot change it. */
export function sayAfter(s: Substance, before: State, tool: Tool): LineId {
  const after = step(s, before, tool);
  if (after !== before) return after === 'melted' ? 'meltfreeze.melt' : s === 'ice' ? 'meltfreeze.freeze.ice' : 'meltfreeze.freeze';
  if (!melts(s)) return s === 'stone' ? 'meltfreeze.stays.stone' : 'meltfreeze.stays.spoon';
  return tool === 'sun' ? 'meltfreeze.already.melted' : 'meltfreeze.already.hard';
}

export type Mode = 'watch' | 'turn' | 'make' | 'tray';

export interface Plan {
  mode: Mode;
  name: string;
}

export const PLANS: Plan[] = [
  { mode: 'watch', name: 'Sun and snow: tap the sun to melt an ice cube and the snowflake to freeze it again' },
  { mode: 'turn', name: 'Three things in turn: warm each one and see which melt, then cool the ones that did' },
  { mode: 'make', name: 'Make it…: three request cards, each asking for the sun or the snowflake' },
  { mode: 'tray', name: 'Some do, some don’t: warm and cool a tray of four things together' },
];

export const meltPlan = (level: number) => PLANS[Math.max(0, Math.min(PLANS.length - 1, level - 1))];

/** Level 2: three distinct things, at least one that melts and one that stays. */
export function thingsFor(rng: Rng, authored: boolean): Substance[] {
  if (authored) return ['ice', 'butter', 'stone'];
  for (;;) {
    const pick = rng.shuffle([...ALL_SUBSTANCES]).slice(0, 3);
    if (pick.some(melts) && pick.some((s) => !melts(s))) return pick;
  }
}

export interface Request {
  thing: Substance;
  from: State;
  to: State;
}

/** The one tool that makes a request's change; the other tool is a no-change on that state. */
export const toolFor = (r: Request): Tool => (r.to === 'melted' ? 'sun' : 'snow');

/** Level 3: three requests on things that can change, alternating direction (a melt, then a freeze, then either). */
export function requestsFor(rng: Rng, authored: boolean): Request[] {
  if (authored) {
    return [
      { thing: 'ice', from: 'solid', to: 'melted' },
      { thing: 'butter', from: 'melted', to: 'solid' },
      { thing: 'chocolate', from: 'solid', to: 'melted' },
    ];
  }
  const things = rng.shuffle([...CHANGERS]);
  const firstMelts = rng.chance(0.5);
  return things.map((thing, i): Request => {
    const melt = i === 2 ? rng.chance(0.5) : i === 0 ? firstMelts : !firstMelts;
    return melt ? { thing, from: 'solid', to: 'melted' } : { thing, from: 'melted', to: 'solid' };
  });
}

/** Level 4: a round is two trays of four distinct things, each with two that change and two that stay. */
export function traysFor(rng: Rng, authored: boolean): Substance[][] {
  if (authored) return [['ice', 'butter', 'stone', 'spoon'], ['chocolate', 'ice', 'stone', 'spoon']];
  return [0, 1].map(() => rng.shuffle([...rng.shuffle([...CHANGERS]).slice(0, 2), ...STAYERS]));
}

/** Supported finish on the third miss of a request: the pet taps the right tool. */
export const SUPPORTED_AT = 3;

export interface Outcome {
  /** The thing changed state. */
  changed: boolean;
  /** The request is now met. */
  done: boolean;
  /** Counted as a miss. */
  miss: boolean;
  /** A spoken hint follows (after the first miss) and the right tool glows (from the second). */
  hint: LineId | null;
  glow: boolean;
  /** The pet taps the right tool for her: the request finishes with help. */
  supported: boolean;
}

/**
 * Level 3's accounting, kept apart from the drawing so it can be tested: a tool that does not make the requested change is
 * one miss each time, a hint line after the first, a glow (one counted hint per request) from the second, and the pet's own
 * tap on the third. Picking the right tool is never scolded, whatever came before.
 */
export class MakeRound {
  index = 0;
  state: State;
  misses = 0;
  hints = 0;
  /** Misses on the request in play. */
  wrong = 0;
  hinted = false;

  constructor(readonly requests: Request[]) {
    this.state = requests[0].from;
  }

  get request(): Request {
    return this.requests[Math.min(this.index, this.requests.length - 1)];
  }

  get finished() {
    return this.index >= this.requests.length;
  }

  hintLine(): LineId {
    return toolFor(this.request) === 'sun' ? 'meltfreeze.hint.melt' : 'meltfreeze.hint.freeze';
  }

  /** She taps a tool. */
  tap(tool: Tool): Outcome {
    if (this.finished) return { changed: false, done: false, miss: false, hint: null, glow: false, supported: false };
    const r = this.request;
    const after = step(r.thing, this.state, tool);
    const changed = after !== this.state;
    this.state = after;
    if (this.state === r.to) {
      this.next();
      return { changed, done: true, miss: false, hint: null, glow: false, supported: false };
    }
    this.misses++;
    this.wrong++;
    const glow = this.wrong >= 2;
    if (glow && !this.hinted) {
      this.hinted = true;
      this.hints++;
    }
    if (this.wrong >= SUPPORTED_AT) {
      this.state = r.to;
      this.next();
      return { changed, done: true, miss: true, hint: null, glow: false, supported: true };
    }
    return { changed, done: false, miss: true, hint: this.hintLine(), glow, supported: false };
  }

  /** Show a hint: the right tool glows; one counted hint per request however often she asks. */
  ask(): { glow: boolean; hint: LineId } {
    if (!this.hinted && !this.finished) {
      this.hinted = true;
      this.hints++;
    }
    return { glow: true, hint: this.hintLine() };
  }

  private next() {
    this.index++;
    this.wrong = 0;
    this.hinted = false;
    if (!this.finished) this.state = this.request.from;
  }
}

export interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface TableLayout {
  /** The tabletop. */
  table: Box;
  /** Centres of the things, left to right, each at least `thing` wide. */
  spots: { x: number; y: number }[];
  thing: number;
  sun: Box;
  snow: Box;
  /** Level 3's request card, beside the thing and never over it. */
  card: Box;
}

const TOOL = 150;
const PET = { w: 230, h: 230 };

/** Things left to right on the table; the two tools together at the right edge (landscape) or along the bottom (portrait). */
export function tableLayout(view: View, n: number): TableLayout {
  const portrait = view.h > view.w;
  const top = 120;
  if (portrait) {
    const toolY = view.h - 100 - TOOL / 2;
    const sun = { x: view.w / 2 - TOOL - 20, y: toolY - TOOL / 2, w: TOOL, h: TOOL };
    const snow = { x: view.w / 2 + 20, y: toolY - TOOL / 2, w: TOOL, h: TOOL };
    const table = { x: 40, y: Math.round(view.h * 0.36), w: view.w - 80, h: 240 };
    const thing = Math.min(150, Math.floor((table.w - 40) / Math.max(n, 1)) - 16);
    return { table, spots: spots(n, table, thing), thing, sun, snow, card: { x: view.w / 2 - 80, y: top, w: 160, h: 160 } };
  }
  const right = view.w - 40 - TOOL;
  const sun = { x: right, y: view.h / 2 - TOOL - 24, w: TOOL, h: TOOL };
  const snow = { x: right, y: view.h / 2 + 24, w: TOOL, h: TOOL };
  const table = { x: PET.w + 10, y: view.h / 2 - 40, w: right - 60 - PET.w, h: 220 };
  const thing = Math.min(150, Math.floor((table.w - 40) / Math.max(n, 1)) - 16);
  return { table, spots: spots(n, table, thing), thing, sun, snow, card: { x: table.x + table.w / 2 - 80, y: top - 30, w: 160, h: 160 } };
}

function spots(n: number, table: Box, size: number) {
  const gap = (table.w - n * size) / (n + 1);
  return Array.from({ length: n }, (_, i) => ({ x: table.x + gap + size / 2 + i * (size + gap), y: table.y + table.h / 2 - 20 }));
}

export const overlaps = (a: Box, b: Box) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
export const petCorner = (view: View): Box => ({ x: 0, y: view.h - PET.h, w: PET.w, h: PET.h });
