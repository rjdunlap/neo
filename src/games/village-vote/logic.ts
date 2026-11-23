import type { Rng } from '../../engine/random';
import type { BandLevels } from '../../progress/difficulty';
export const OPTIONS = ['slide', 'swing', 'sandpit'] as const;
export type Option = (typeof OPTIONS)[number];
export interface Vote {
  id: string;
  option: Option;
  /** Level 4 only: the second choice of a friend in the fewest group, used after a tie. */
  next?: Option;
}
export interface Plan {
  level: number;
  options: Option[];
  voters: Vote[];
}
export const FAMILIES: Readonly<Record<number, readonly (readonly number[])[]>> = {
  1: [
    [3, 1],
    [4, 2],
  ],
  2: [
    [3, 1],
    [4, 0],
  ],
  3: [
    [4, 2, 1],
    [3, 2, 2],
  ],
  // A tie between the top two; the fewest group's friends all move to one tied picture, so the run-off never ties again.
  4: [
    [3, 3, 2],
    [3, 3, 1],
    [2, 2, 1],
  ],
};
export const NAMES = [
  'Two choices — count two groups and choose more',
  'Your pet votes too — choose freely, then count',
  'Three choices — compare tallies and choose most',
  "A tie — move the fewest group's votes to their next choice, then choose most",
];
export function validate(p: Plan) {
  const family = FAMILIES[p.level];
  if (
    !family ||
    p.options.length !== (p.level >= 3 ? 3 : 2) ||
    new Set(p.options).size !== p.options.length ||
    p.options.some((o) => !OPTIONS.includes(o))
  )
    throw Error('Invalid options');
  if (
    new Set(p.voters.map((v) => v.id)).size !== p.voters.length ||
    p.voters.some((v) => !v.id || v.id === 'pet' || !p.options.includes(v.option))
  )
    throw Error('Invalid roster');
  const counts = p.options.map((o) => p.voters.filter((v) => v.option === o).length).sort((a, b) => b - a);
  if (!family.some((f) => f.join() === counts.join())) throw Error('Invalid vote family');
  if (p.level !== 4) {
    if (p.voters.some((v) => v.next !== undefined)) throw Error('Second choices are level 4 only');
    return;
  }
  const by = (o: Option) => p.voters.filter((v) => v.option === o).length;
  const closed = p.options.reduce((a, b) => (by(b) < by(a) ? b : a));
  const tied = p.options.filter((o) => o !== closed);
  if (by(tied[0]) !== by(tied[1]) || by(closed) >= by(tied[0]))
    throw Error('Level 4 needs a tie between the top two');
  const nexts = new Set(p.voters.filter((v) => v.option === closed).map((v) => v.next));
  if (
    nexts.size !== 1 ||
    !tied.includes([...nexts][0] as Option) ||
    p.voters.some((v) => v.option !== closed && v.next !== undefined)
  )
    throw Error('The fewest group needs one shared second choice on a tied picture');
}
/** The level-4 second choices: every friend of the fewest group moves to one seeded tied picture. */
function withNext(p: Plan, pick: (tied: Option[]) => Option): Plan {
  const by = (o: Option) => p.voters.filter((v) => v.option === o).length;
  const closed = p.options.reduce((a, b) => (by(b) < by(a) ? b : a));
  const next = pick(p.options.filter((o) => o !== closed));
  return { ...p, voters: p.voters.map((v) => (v.option === closed ? { ...v, next } : v)) };
}
export function roundFor(level: number, rng: Rng): Plan {
  const counts = rng.shuffle([...rng.pick(FAMILIES[level])]);
  const options = rng.shuffle([...OPTIONS]).slice(0, counts.length);
  const assignments = counts.flatMap((n, i) => Array<Option>(n).fill(options[i]));
  rng.shuffle(assignments);
  let p: Plan = { level, options, voters: assignments.map((option, i) => ({ id: `friend-${i}`, option })) };
  if (level === 4) p = withNext(p, (tied) => rng.pick(tied));
  validate(p);
  return p;
}
export function fixture(level: number, family = 0): Plan {
  const counts = FAMILIES[level][family],
    options = OPTIONS.slice(0, counts.length);
  const p: Plan = {
    level,
    options,
    voters: counts
      .flatMap((n, i) => Array.from({ length: n }, () => options[i]))
      .map((option, i) => ({ id: `friend-${i}`, option })),
  };
  // The opening tie: slide 3, swing 3, sandpit 2, and both sandpit friends would go to the swing next (5–3).
  return level === 4 ? withNext(p, (tied) => tied[1]) : p;
}
export type Phase = 'preference' | 'walking' | 'counting' | 'runoff' | 'feedback' | 'playing' | 'done';
/** Level 4 has two decisions (the run-off moves, then the final choice); each earns at most one hint. */
export type Stage = 'runoff' | 'declare';
export type Send = 'ignored' | 'nudge' | 'closed' | 'wrong' | 'moved' | 'recount';
/** One election. Marks are support; acceptance always uses the immutable actual roster. */
export class Election {
  readonly plan: Plan;
  readonly counted = new Set<string>();
  readonly npc: readonly Vote[];
  /** Friends of the closed group that have walked to their second choice. */
  readonly moved = new Set<string>();
  readonly helped = new Set<Stage>();
  phase: Phase;
  /** The fewest group's picture once the tie is found (level 4); it takes no votes this time. */
  closed: Option | null = null;
  selected: string | null = null;
  pet: Option | null = null;
  misses = 0;
  completions = 0;
  private stageMisses = 0;
  /** The glow shows only for help given in the current decision, so help before the tie does not light the final choice. */
  private lit = false;
  private resume: Phase = 'counting';
  constructor(plan: Plan) {
    validate(plan);
    this.plan = structuredClone(plan);
    this.npc = this.plan.voters;
    this.phase = plan.level === 2 ? 'preference' : 'counting';
  }
  /** Every vote as it stands now: a moved friend counts for its second choice. */
  get voters(): readonly Vote[] {
    const now = this.npc.map((v) => (this.moved.has(v.id) && v.next ? { ...v, option: v.next } : v));
    return this.pet ? [...now, { id: 'pet', option: this.pet }] : now;
  }
  get hints() {
    return this.helped.size;
  }
  get stage(): Stage {
    return this.phase === 'runoff' ? 'runoff' : 'declare';
  }
  get glowing() {
    return this.lit;
  }
  total(o: Option) {
    return this.voters.filter((v) => v.option === o).length;
  }
  marks(o: Option) {
    return this.voters.filter((v) => v.option === o && this.counted.has(v.id)).length;
  }
  /** The fewest group at level 4 (the picture that closes after the tie). */
  get fewest(): Option {
    const first = (o: Option) => this.npc.filter((v) => v.option === o).length;
    return this.plan.options.reduce((a, b) => (first(b) < first(a) ? b : a));
  }
  /** The tie is unresolved while the fewest group's friends have not all moved. */
  get tied() {
    return this.plan.level === 4 && this.waiting.length > 0;
  }
  /** Closed-group friends still at the closed picture. */
  get waiting(): readonly Vote[] {
    return this.plan.level === 4 ? this.npc.filter((v) => v.next && !this.moved.has(v.id)) : [];
  }
  /** The picture that wins: at level 4 the run-off result, so a hint before the tie points at a tied picture. */
  get winner(): Option {
    const final = (o: Option) =>
      this.npc.filter((v) => (this.plan.level === 4 && v.next ? v.next : v.option) === o).length +
      Number(this.pet === o);
    return this.plan.options.reduce((a, b) => (final(b) > final(a) ? b : a));
  }
  choose(o: Option) {
    if (this.phase !== 'preference' || !this.plan.options.includes(o)) return false;
    this.pet = o;
    this.phase = 'walking';
    return true;
  }
  arrived() {
    if (this.phase === 'walking') this.phase = 'counting';
  }
  count(id: string) {
    if (this.phase !== 'counting' && this.phase !== 'runoff') return null;
    const v = this.voters.find((v) => v.id === id);
    if (!v) return null;
    this.counted.add(id);
    return { option: v.option, total: this.marks(v.option) };
  }
  recount() {
    for (const v of this.voters) this.counted.add(v.id);
  }
  /** Tapping a picture while counting. At level 4 a tied picture before the run-off finds the tie (never a miss). */
  declare(o: Option): 'ignored' | 'wrong' | 'accepted' | 'tie' | 'closed' {
    if (this.phase !== 'counting' || !this.plan.options.includes(o)) return 'ignored';
    if (o === this.closed) return 'closed';
    if (this.tied && o !== this.fewest) {
      this.closed = this.fewest;
      this.recount();
      this.enter('runoff');
      return 'tie';
    }
    if (o === this.winner && !this.tied) {
      this.phase = 'playing';
      return 'accepted';
    }
    this.miss();
    this.resume = 'counting';
    this.phase = 'feedback';
    this.recount();
    return 'wrong';
  }
  /** Run-off: tap a closed-group friend to pick it up (again to put it down). */
  select(id: string) {
    if (this.phase !== 'runoff' || !this.waiting.some((v) => v.id === id)) return false;
    this.selected = this.selected === id ? null : id;
    return true;
  }
  /** The next choice of the selected friend (what its badge shows). */
  get selectedNext(): Option | null {
    return this.npc.find((v) => v.id === this.selected)?.next ?? null;
  }
  /** Run-off: tap a picture to walk the selected friend there. */
  send(o: Option): Send {
    if (this.phase !== 'runoff' || !this.plan.options.includes(o)) return 'ignored';
    if (o === this.closed) return 'closed';
    const next = this.selectedNext;
    if (!next) return 'nudge';
    if (o !== next) {
      this.miss();
      this.resume = 'runoff';
      this.phase = 'feedback';
      return 'wrong';
    }
    this.moved.add(this.selected!);
    this.counted.add(this.selected!);
    this.selected = null;
    if (this.waiting.length) return 'moved';
    this.enter('counting');
    return 'recount';
  }
  feedbackDone() {
    if (this.phase === 'feedback') this.phase = this.resume;
  }
  help() {
    this.helped.add(this.stage);
    this.lit = true;
  }
  complete() {
    if (this.phase !== 'playing') return false;
    this.phase = 'done';
    this.completions++;
    return true;
  }
  comparison() {
    return this.plan.options
      .filter((o) => o !== this.closed)
      .map((option) => ({ option, total: this.total(option) }));
  }
  private enter(phase: Phase) {
    this.phase = phase;
    this.stageMisses = 0;
    this.lit = false;
  }
  /** Two misses in one decision bring the glow (at levels 1–3 there is only one decision). */
  private miss() {
    this.misses++;
    if (++this.stageMisses >= 2) this.help();
  }
}
export interface Point {
  x: number;
  y: number;
}
export interface Layout {
  options: Point[];
  boards: Point[];
  voters: Record<string, Point>;
  help: Point;
}
/** Fixed 110-square voters; the five-vote group occupies three rows, never behind the guide. */
export function layout(view: { w: number; h: number; upright?: true }, e: Election): Layout {
  const n = e.plan.options.length,
    tall = view.h > view.w;
  // Upright phone (768 wide): three toys at a 240 pitch about the middle; the whole scene hangs up from the bottom edge.
  const up = view.upright === true,
    dy = up ? uprightDrop(view) : 0;
  const xs = up ? (n === 3 ? [144, 384, 624] : [290, 558]) : n === 3 ? [325, 575, 825] : [410, 750];
  const xoff = up ? 0 : (view.w - 1024) / 2,
    oy = (up ? 320 : tall ? 240 : 220) + dy,
    by = (up ? 470 : tall ? 390 : 350) + dy,
    first = (up ? 600 : tall ? 570 : 480) + dy,
    gap = up ? 125 : tall ? 160 : 115;
  const voters: Record<string, Point> = {};
  e.plan.options.forEach((o, i) =>
    e.voters
      .filter((v) => v.option === o)
      .sort((a, b) => Number(e.moved.has(a.id)) - Number(e.moved.has(b.id)))
      .forEach((v, j) => {
        // Level 4 upright, pairs sit at ±62 and the left column fills from its right, so a lone third-row friend (a five-vote column
        // on the left after a run-off) stays clear of the guide's corner; the right column's stays clear of the Hint.
        const side = (j % 2 === 0 ? -1 : 1) * (up && e.plan.level === 4 ? (i === 0 ? -62 : 62) : 58);
        voters[v.id] = { x: xs[i] + xoff + side, y: first + Math.floor(j / 2) * gap };
      }),
  );
  return {
    options: xs.map((x) => ({ x: x + xoff, y: oy })),
    boards: xs.map((x) => ({ x: x + xoff, y: by })),
    voters,
    help: up ? { x: view.w - 90, y: view.h - 100 } : { x: 90, y: 280 },
  };
}

/** How far an upright scene drops so it hangs up from the bottom edge, not mid-screen on a tall phone (768 × 1024 is the design). */
export const uprightDrop = (view: { h: number }) => Math.max(0, view.h - 1024);

/** The sharing scene: the winning toy and the friends (the pet first) in rows of four. */
export function playLayout(view: { w: number; h: number; upright?: true }, count: number) {
  const up = view.upright === true,
    dy = up ? uprightDrop(view) : 0,
    xoff = up ? -186 : (view.w - 1024) / 2;
  return {
    toy: { x: up ? view.w / 2 : view.w / 2 + 50, y: (up ? 340 : 300) + dy },
    voters: Array.from({ length: count }, (_, i): Point => ({
      x: 300 + (i % 4) * 180 + xoff,
      y: (up ? 560 : 500) + dy + Math.floor(i / 4) * 150,
    })),
  };
}

export const LEVELS: BandLevels = {
  preschool: { min: 1, max: 2 },
  prek: { min: 1, max: 3 },
  school: { min: 3, max: 4 },
};
