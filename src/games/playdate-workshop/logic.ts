/**
 * Playdate Workshop's rules: two friends, their pages, a stamp pad and (levels 2–3) a two-handled roller. Every plan card
 * compiles to the finite set of traces that carry it out; an action is accepted only when the trace so far plus that action
 * is a prefix of one of them, and `whyNot` only explains a refusal. State is always replayed from the trace, so Undo is
 * dropping the last action. Definition: docs/definitions/playdate-workshop.md.
 */
import type { CritterName } from '../../art/critter';
import type { Rng } from '../../engine/random';
import type { View } from '../../engine/view';

export type Friend = 'A' | 'B';
export type Surface = 'pageA' | 'pageB' | 'banner';
export type Tool = 'pad' | 'roller';
export type Holder = Friend | 'both' | 'tray';
export type Action =
  | { k: 'give'; tool: Tool; to: Friend | 'both' }
  | { k: 'pass'; tool: Tool }
  | { k: 'stamp'; surface: Surface }
  | { k: 'roll'; surface: Surface };
export type Trace = readonly Action[];

export interface Mark { by: Friend | 'both'; tool: Tool }

export type PlanId = 'stampPass' | 'turns' | 'roll' | 'side' | 'bannerThenPage' | 'pageThenBanner' | 'justBanner';
export type RequestId = 'page' | 'banner' | 'bannerOr' | 'own';
export type Why = 'full' | 'notInPlan' | 'waiting' | 'turns' | 'myStep' | 'chooseFirst' | 'later';

export const FRIENDS: readonly Friend[] = ['A', 'B'];
export const other = (f: Friend): Friend => (f === 'A' ? 'B' : 'A');
export const pageOf = (f: Friend): Surface => (f === 'A' ? 'pageA' : 'pageB');
export const ownerOf = (s: Surface): Friend | null => (s === 'pageA' ? 'A' : s === 'pageB' ? 'B' : null);

export const give = (tool: Tool, to: Friend | 'both'): Action => ({ k: 'give', tool, to });
export const pass = (tool: Tool = 'pad'): Action => ({ k: 'pass', tool });
export const stamp = (surface: Surface): Action => ({ k: 'stamp', surface });
export const roll = (surface: Surface): Action => ({ k: 'roll', surface });

export function key(a: Action): string {
  return a.k === 'give' ? `give:${a.tool}:${a.to}` : a.k === 'pass' ? `pass:${a.tool}` : `${a.k}:${a.surface}`;
}
export const sameAction = (a: Action, b: Action) => key(a) === key(b);

// ——— Levels, plans and requests ———

export interface Plan {
  id: PlanId;
  surfaces: readonly Surface[];
  tools: readonly Tool[];
  /** The banner is made in turns with the pad (the `turns` refusal applies). */
  takesTurns: boolean;
  /** Every trace that carries the plan out, from a blank table. */
  traces: readonly Trace[];
}

export interface LevelSpec {
  level: number;
  name: string;
  describe: string;
  /** Banner cells (0 when the level has no banner). */
  cells: number;
  /** The cards in the Plan phase (level 1 has one plan and no Plan phase). */
  plans: readonly PlanId[];
  /** Which request each friend makes. */
  requests: Record<Friend, RequestId>;
}

export interface Variation {
  cast: [CritterName, CritterName];
  picture: StampPicture;
  theme: BannerTheme;
  /** Level 3: the friend who asks to keep their own page. */
  own: Friend;
}

export type StampPicture = 'star' | 'flower' | 'fish';
export type BannerTheme = 'sun' | 'sea' | 'leaf';

/**
 * Three authored variations per level (cast, stamp picture, banner theme and, at level 3, which friend asks for the page);
 * index 0 is the first round and the how-to demonstration's table.
 */
export const VARIATIONS: Record<number, readonly Variation[]> = {
  1: [
    { cast: ['bunny', 'bear'], picture: 'star', theme: 'sun', own: 'B' },
    { cast: ['cat', 'duck'], picture: 'flower', theme: 'leaf', own: 'B' },
    { cast: ['pig', 'dog'], picture: 'fish', theme: 'sea', own: 'B' },
  ],
  2: [
    { cast: ['duck', 'bunny'], picture: 'star', theme: 'sun', own: 'B' },
    { cast: ['bear', 'cat'], picture: 'fish', theme: 'sea', own: 'B' },
    { cast: ['dog', 'cow'], picture: 'flower', theme: 'leaf', own: 'B' },
  ],
  3: [
    { cast: ['cat', 'bear'], picture: 'star', theme: 'sun', own: 'B' },
    { cast: ['bunny', 'pig'], picture: 'flower', theme: 'leaf', own: 'A' },
    { cast: ['duck', 'dog'], picture: 'fish', theme: 'sea', own: 'B' },
  ],
};

const LEVELS: readonly Omit<LevelSpec, 'requests'>[] = [
  { level: 1, name: 'Stamp and pass', describe: 'Stamp and pass: one stamp pad, a star on each friend\'s page', cells: 0, plans: ['stampPass'] },
  { level: 2, name: 'Two ways to make', describe: 'Two ways to make: take turns or roll together for one banner', cells: 4, plans: ['turns', 'roll'] },
  { level: 3, name: 'My page, our plan', describe: 'My page, our plan: a plan that works for both friends\' requests', cells: 2, plans: ['side', 'bannerThenPage', 'pageThenBanner', 'justBanner'] },
];

export const LEVEL_COUNT = LEVELS.length;

export function specFor(level: number, own: Friend = 'B'): LevelSpec {
  const s = LEVELS[Math.max(1, Math.min(LEVEL_COUNT, level)) - 1];
  const requests: Record<Friend, RequestId> =
    s.level === 1 ? { A: 'page', B: 'page' } : s.level === 2 ? { A: 'banner', B: 'banner' } : own === 'B' ? { A: 'bannerOr', B: 'own' } : { A: 'own', B: 'bannerOr' };
  return { ...s, requests };
}

/** Every interleaving of two ordered lists. */
function interleavings<T>(a: readonly T[], b: readonly T[]): T[][] {
  if (!a.length) return [[...b]];
  if (!b.length) return [[...a]];
  return [...interleavings(a.slice(1), b).map((r) => [a[0], ...r]), ...interleavings(a, b.slice(1)).map((r) => [b[0], ...r])];
}

/** The banner in turns with the pad, the pad starting with `starter` already holding it: stamp, pass, stamp… */
function bannerTurns(cells: number): Action[] {
  const out: Action[] = [];
  for (let i = 0; i < cells; i++) {
    if (i > 0) out.push(pass());
    out.push(stamp('banner'));
  }
  return out;
}

/** The plan card's every allowed trace at this level (`own` is level 3's page-asking friend). */
export function planFor(id: PlanId, cells: number, own: Friend = 'B'): Plan {
  const mate = other(own);
  switch (id) {
    case 'stampPass':
      return {
        id, surfaces: ['pageA', 'pageB'], tools: ['pad'], takesTurns: true,
        traces: FRIENDS.map((x) => [give('pad', x), stamp(pageOf(x)), pass(), stamp(pageOf(other(x)))]),
      };
    case 'turns':
      return { id, surfaces: ['banner'], tools: ['pad'], takesTurns: true, traces: FRIENDS.map((x) => [give('pad', x), ...bannerTurns(cells)]) };
    case 'roll':
      return { id, surfaces: ['banner'], tools: ['roller'], takesTurns: false, traces: [[give('roller', 'both'), ...Array.from({ length: cells }, () => roll('banner'))]] };
    case 'side': {
      const traces: Action[][] = [];
      for (const [tA, tB] of [['pad', 'roller'], ['roller', 'pad']] as [Tool, Tool][]) {
        const mark = (f: Friend, t: Tool) => (t === 'pad' ? stamp(pageOf(f)) : roll(pageOf(f)));
        traces.push(...interleavings([give(tA, 'A'), mark('A', tA)], [give(tB, 'B'), mark('B', tB)]));
      }
      return { id, surfaces: ['pageA', 'pageB'], tools: ['pad', 'roller'], takesTurns: false, traces };
    }
    case 'bannerThenPage':
      return {
        id, surfaces: ['banner', pageOf(own)], tools: ['pad'], takesTurns: true,
        traces: FRIENDS.map((x) => {
          const t: Action[] = [give('pad', x), ...bannerTurns(cells)];
          // After the banner the pad is with whoever stamped last.
          const last = cells % 2 === 1 ? x : other(x);
          if (last !== own) t.push(pass());
          t.push(stamp(pageOf(own)));
          return t;
        }),
      };
    case 'pageThenBanner':
      return {
        id, surfaces: [pageOf(own), 'banner'], tools: ['pad'], takesTurns: true,
        traces: [
          [give('pad', own), stamp(pageOf(own)), ...bannerTurns(cells)],
          [give('pad', own), stamp(pageOf(own)), pass(), ...bannerTurns(cells)],
        ],
      };
    case 'justBanner':
      return { id, surfaces: ['banner'], tools: ['pad'], takesTurns: true, traces: [mate, own].map((x) => [give('pad', x), ...bannerTurns(cells)]) };
  }
}

// ——— The table ———

export interface Table {
  holder: Record<Tool, Holder>;
  marks: Record<Surface, Mark[]>;
  /** The pad's holder has stamped since it last came to them. */
  padUsed: boolean;
}

export function blankTable(): Table {
  return { holder: { pad: 'tray', roller: 'tray' }, marks: { pageA: [], pageB: [], banner: [] }, padUsed: false };
}

export const capacity = (s: Surface, cells: number) => (s === 'banner' ? cells : 1);

/** Who would make the mark (null when nobody holds the tool). */
export function marker(t: Table, a: Action): Friend | 'both' | null {
  if (a.k === 'stamp') { const h = t.holder.pad; return h === 'tray' ? null : h; }
  if (a.k === 'roll') { const h = t.holder.roller; return h === 'tray' ? null : h; }
  return null;
}

/** The table after an action, applied without asking whether the plan allows it (the trace rule does that). */
export function apply(t: Table, a: Action): Table {
  const n: Table = { holder: { ...t.holder }, marks: { pageA: [...t.marks.pageA], pageB: [...t.marks.pageB], banner: [...t.marks.banner] }, padUsed: t.padUsed };
  if (a.k === 'give') { n.holder[a.tool] = a.to; if (a.tool === 'pad') n.padUsed = false; }
  else if (a.k === 'pass') {
    const h = n.holder[a.tool];
    if (h === 'A' || h === 'B') n.holder[a.tool] = other(h);
    if (a.tool === 'pad') n.padUsed = false;
  } else {
    const by = marker(t, a);
    if (by) n.marks[a.surface].push({ by, tool: a.k === 'stamp' ? 'pad' : 'roller' });
    if (a.k === 'stamp') n.padUsed = true;
  }
  return n;
}

export const replay = (trace: Trace): Table => trace.reduce(apply, blankTable());

const isPrefix = (p: Trace, full: Trace) => p.length <= full.length && p.every((a, i) => sameAction(a, full[i]));

/** The allowed traces that extend this one. */
export const extensions = (plan: Plan, trace: Trace) => plan.traces.filter((t) => isPrefix(trace, t));

export const accepts = (plan: Plan, trace: Trace, a: Action) => extensions(plan, [...trace, a]).length > 0;

/** The chosen plan has been carried out. */
export const complete = (plan: Plan, trace: Trace) => plan.traces.some((t) => t.length === trace.length && isPrefix(trace, t));

/**
 * Why an action is refused, the first that applies. Only explains: whether an action is accepted is `accepts`.
 */
export function whyNot(plan: Plan, trace: Trace, a: Action, cells: number): Why {
  const t = replay(trace);
  if ((a.k === 'stamp' || a.k === 'roll') && t.marks[a.surface].length >= capacity(a.surface, cells)) return 'full';
  if ((a.k === 'stamp' || a.k === 'roll') && !plan.surfaces.includes(a.surface)) return 'notInPlan';
  const tool: Tool = a.k === 'stamp' ? 'pad' : a.k === 'roll' ? 'roller' : a.tool;
  if (!plan.tools.includes(tool)) return 'notInPlan';
  if (a.k === 'stamp' || a.k === 'roll') {
    const owner = ownerOf(a.surface);
    if (owner && t.holder.pad !== owner && t.holder.roller !== owner) return 'waiting';
    if (!owner && marker(t, a) === null) return 'waiting';
    if (a.k === 'stamp' && a.surface === 'banner' && plan.takesTurns && t.padUsed) return 'turns';
  }
  if (a.k === 'pass' && t.holder[a.tool] !== 'tray' && a.tool === 'pad' && !t.padUsed) return 'myStep';
  if (a.k === 'pass' && t.holder[a.tool] === 'tray') return 'chooseFirst';
  return 'later';
}

// ——— Requests ———

const madeBy = (marks: readonly Mark[], f: Friend) => marks.some((m) => m.by === f || m.by === 'both');
const ownPage = (t: Table, f: Friend) => t.marks[pageOf(f)].length > 0 && t.marks[pageOf(f)].every((m) => m.by === f);
const bannerTogether = (t: Table, cells: number) => cells > 0 && t.marks.banner.length >= cells && FRIENDS.every((f) => madeBy(t.marks.banner, f));

/** Is the friend's request met by these surfaces? */
export function check(t: Table, request: RequestId, f: Friend, cells: number): boolean {
  switch (request) {
    case 'page': case 'own': return ownPage(t, f);
    case 'banner': return bannerTogether(t, cells);
    case 'bannerOr': return bannerTogether(t, cells) || (ownPage(t, 'A') && ownPage(t, 'B'));
  }
}

export interface Preview {
  table: Table;
  met: Record<Friend, boolean>;
  ok: boolean;
}

/** The plan's first allowed trace run on a blank table, and each request's result. */
export function previewOf(plan: Plan, spec: LevelSpec): Preview {
  const table = replay(plan.traces[0]);
  const met = { A: check(table, spec.requests.A, 'A', spec.cells), B: check(table, spec.requests.B, 'B', spec.cells) };
  return { table, met, ok: met.A && met.B };
}

/** The cards whose preview meets both requests. */
export const acceptedPlans = (spec: LevelSpec, own: Friend) => spec.plans.filter((p) => previewOf(planFor(p, spec.cells, own), spec).ok);

/** The next action of the shortest allowed completion (null when finished). */
export function nextStep(plan: Plan, trace: Trace): Action | null {
  const ext = extensions(plan, trace).filter((t) => t.length > trace.length);
  if (!ext.length) return null;
  const best = ext.reduce((a, b) => (b.length < a.length ? b : a));
  return best[trace.length];
}

export type Hint = { card: PlanId } | { action: Action } | null;

/** One next useful thing: in the Plan phase an accepted card (the selected one if it is accepted), in the Make phase the next step. */
export function hintFor(spec: LevelSpec, own: Friend, phase: 'plan' | 'make', selected: PlanId | null, plan: Plan | null, trace: Trace): Hint {
  if (phase === 'plan') {
    const ok = acceptedPlans(spec, own);
    return { card: selected && ok.includes(selected) ? selected : ok[0] };
  }
  const a = plan ? nextStep(plan, trace) : null;
  return a ? { action: a } : null;
}

// ——— Help accounting ———

export type Decision = 'plan' | 'make';

/**
 * Misses are always 0: trying plans, refused taps, Undo and Watch again are free. Each decision counts at most one hint;
 * at level 1 the *plan* decision is who gets the pad first, so the pet doing both roles costs two hints at every level.
 */
export class Tally {
  readonly misses = 0;
  hints = 0;
  private counted = new Set<Decision>();
  /** Previews of plans that leave a request out, this round. */
  unmetPreviews = 0;

  help(d: Decision) {
    if (this.counted.has(d)) return false;
    this.counted.add(d);
    this.hints++;
    return true;
  }

  has(d: Decision) {
    return this.counted.has(d);
  }

  /** A preview that leaves a request out: free; the second lights the request's glow. */
  unmetPreview(): boolean {
    this.unmetPreviews++;
    return this.unmetPreviews >= 2;
  }
}

/** The decision a hint would count for now. */
export function decisionNow(level: number, phase: 'plan' | 'make', trace: Trace): Decision {
  if (phase === 'plan') return 'plan';
  return level === 1 && trace.length === 0 ? 'plan' : 'make';
}

/** A seeded variation index (0 is the authored first round). */
export function variationFor(level: number, rng: Rng, first: boolean): Variation {
  const list = VARIATIONS[Math.max(1, Math.min(LEVEL_COUNT, level))];
  return first ? list[0] : list[rng.int(0, list.length - 1)];
}

/** The four cards' order is seeded at level 3; level 2 keeps its order. */
export function cardOrder(spec: LevelSpec, rng: Rng, first: boolean): PlanId[] {
  const cards = [...spec.plans];
  if (spec.level < 3 || first) return cards;
  for (let i = cards.length - 1; i > 0; i--) { const j = rng.int(0, i); [cards[i], cards[j]] = [cards[j], cards[i]]; }
  return cards;
}

// ——— Layout ———

export interface Rect { x: number; y: number; w: number; h: number }
export interface Pt { x: number; y: number }
export const centre = (r: Rect): Pt => ({ x: r.x + r.w / 2, y: r.y + r.h / 2 });
export const overlaps = (a: Rect, b: Rect) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
export const gapBetween = (a: Rect, b: Rect) => Math.max(b.x - (a.x + a.w), a.x - (b.x + b.w), b.y - (a.y + a.h), a.y - (b.y + b.h));
export const insideView = (a: Rect, v: View) => a.x >= 0 && a.y >= 0 && a.x + a.w <= v.w && a.y + a.h <= v.h;

/** The home and ? buttons (top left) and the guide (bottom left). */
export const HOME_CORNER = { w: 130, h: 215 };
export const PET_CORNER = { w: 160, h: 170 };
export function corners(v: View): Rect[] {
  return [{ x: 0, y: 0, ...HOME_CORNER }, { x: 0, y: v.h - PET_CORNER.h, ...PET_CORNER }];
}

export const BOX = { w: 1024, h: 768 };
export const BUBBLE = { w: 260, h: 150 };
export const CARD = { w: 280, h: 180 };
export const SMALL_CARD = { w: 160, h: 100 };
export const BUTTON = { w: 120, h: 110 };
export const FRIEND = { w: 150, h: 190 };
export const HAND = 120;
export const PAGE = 200;
export const CELL = 120;
export const TOOL = 120;
export const CHIP = 56;
export const GAP = 30;

export interface WorkshopLayout {
  bubbles: Record<Friend, Rect>;
  friends: Record<Friend, Rect>;
  /** Plan phase: the cards; Make phase: empty. */
  cards: Rect[];
  /** Make phase: where a held tool sits under each friend; the roller held together sits above the banner. */
  hands: Record<Friend, Rect>;
  chosen: Rect | null;
  strip: Rect | null;
  banner: Rect[];
  pages: Record<Friend, Rect> | null;
  tray: Rect[];
  /** Plan phase: Try it, Make it, the lightbulb, the pet; Make phase: Undo, the lightbulb, the pet. */
  buttons: Rect[];
  /** Make phase, once done: Finish and Watch again, over the cleared middle. */
  finish: Rect | null;
  again: Rect | null;
}

export interface LayoutAsk {
  level: number;
  phase: 'plan' | 'make';
  /** Plan phase: how many cards. */
  cards?: number;
  /** Make phase: the plan's surfaces and tools. */
  surfaces?: readonly Surface[];
  tools?: number;
}

/**
 * Every rectangle, laid out in a 1024 × 768 box centred in the view (portrait and wide views get room around it): bubbles
 * along the top, the friends at the sides between the corners, the cards (Plan) or the banner, pages and tray (Make) in
 * the middle, the buttons along the bottom right of the guide. Null rather than a smaller target.
 */
export function workshopLayout(v: View, ask: LayoutAsk): WorkshopLayout | null {
  if (v.w < BOX.w || v.h < BOX.h) return null;
  const ox = (v.w - BOX.w) / 2;
  const oy = (v.h - BOX.h) / 2;
  const r = (x: number, y: number, w: number, h: number): Rect => ({ x: ox + x, y: oy + y, w, h });
  const bubbles = { A: r(140, 20, BUBBLE.w, BUBBLE.h), B: r(BOX.w - 140 - BUBBLE.w, 20, BUBBLE.w, BUBBLE.h) };
  const friends = { A: r(20, 235, FRIEND.w, FRIEND.h), B: r(BOX.w - 20 - FRIEND.w, 235, FRIEND.w, FRIEND.h) };
  const hands = { A: r(35, 455, HAND, HAND), B: r(BOX.w - 35 - HAND, 455, HAND, HAND) };
  const row = (n: number, w: number, h: number, y: number, x0 = 0, x1 = BOX.w): Rect[] => {
    const total = n * w + (n - 1) * GAP;
    const left = x0 + (x1 - x0 - total) / 2;
    return Array.from({ length: n }, (_, i) => r(left + i * (w + GAP), y, w, h));
  };
  if (ask.phase === 'plan') {
    const n = ask.cards ?? 2;
    const cards = n <= 2 ? row(n, CARD.w, CARD.h, 305) : [...row(2, CARD.w, CARD.h, 200), ...row(n - 2, CARD.w, CARD.h, 200 + CARD.h + GAP)];
    const buttons = row(4, BUTTON.w, BUTTON.h, 625, 180, BOX.w);
    return { bubbles, friends, cards, hands, chosen: null, strip: null, banner: [], pages: null, tray: [], buttons, finish: null, again: null };
  }
  const surfaces = ask.surfaces ?? [];
  const cells = ask.level === 2 ? 4 : ask.level === 3 ? 2 : 0;
  const banner = surfaces.includes('banner') ? row(cells, CELL, CELL, 270) : [];
  const pages = { A: r(200, 420, PAGE, PAGE), B: r(BOX.w - 200 - PAGE, 420, PAGE, PAGE) };
  const tools = ask.tools ?? 1;
  const tray = tools === 1 ? row(1, TOOL, TOOL, 460) : banner.length ? [] : row(tools, TOOL, TOOL, 270);
  if (tools > 1 && banner.length) return null;
  const chosen = ask.level === 1 ? null : r((BOX.w - SMALL_CARD.w) / 2, 20, SMALL_CARD.w, SMALL_CARD.h);
  const strip = r(190, 190, BOX.w - 380, CHIP);
  const buttons = row(3, BUTTON.w, BUTTON.h, 650, 180, BOX.w);
  return {
    bubbles, friends, cards: [], hands, chosen, strip, banner, pages, tray, buttons,
    finish: r(BOX.w / 2 - 200 / 2 - 75, 262, 200, 150),
    again: r(BOX.w / 2 + 100 - 75 + GAP, 282, BUTTON.w, BUTTON.h),
  };
}

/** The tap targets that are live together (Finish and Watch again replace the middle once done). */
export function targets(l: WorkshopLayout, done = false): Rect[] {
  const base = [l.bubbles.A, l.bubbles.B, ...l.buttons, ...(l.chosen ? [l.chosen] : [])];
  if (!l.pages) return [...base, ...l.cards];
  if (done) return [...base, l.finish!, l.again!];
  return [...base, l.pages.A, l.pages.B, ...l.banner, ...l.tray, l.friends.A, l.friends.B, l.hands.A, l.hands.B];
}
