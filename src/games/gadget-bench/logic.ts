/**
 * Gadget Bench rules: invented parts with one right socket each, a path of pictured conditions, and the authored
 * check `runPath` that stops a cart at the first condition its gadget cannot handle. Levels 1–4 from
 * docs/definitions/gadget-bench.md: compare two finished gadgets, change one part of a shown cart, build one from parts,
 * fix yesterday's cart for a longer path where two needs pull on one socket (the paddle wheels do both jobs), build a cart
 * that fits under the little garden gate (level 5), and do the same jobs with a box of new parts (level 6).
 * Nothing here is a real device, and the run is a rule, never a simulation.
 */
import type { CritterName } from '../../art/critter';
import type { Rng } from '../../engine/random';
import type { View } from '../../engine/view';

export type Socket = 'under' | 'top' | 'front';
export type PartId = 'wheels' | 'float' | 'umbrella' | 'lantern' | 'flag' | 'paddles' | 'rollers' | 'lid' | 'raft' | 'glowstones';
/** `gate` is level 5's limit, always the last tile: no part fixes it, and it stops any cart holding a tall part. */
export type Condition = 'smooth' | 'bump' | 'puddle' | 'rain' | 'dark' | 'gate';
/** A gadget: each socket empty or holding one part. */
export type Gadget = Partial<Record<Socket, PartId>>;

export const SOCKETS: readonly Socket[] = ['under', 'top', 'front'];
/** The five parts of levels 1–3. The paddle wheels appear only on level 4's reuse shelf, the four new parts only at levels 5–6. */
export const PART_IDS: readonly PartId[] = ['wheels', 'float', 'umbrella', 'lantern', 'flag'];

export interface PartSpec {
  /** The one socket it works in; the flag is a decoy that works nowhere. */
  socket: Socket | null;
  /** The conditions it handles in that socket: one for most parts, two for the paddle wheels, none for the flag. */
  fixes: readonly Condition[];
  /** Spoken, with its article. */
  name: string;
  /** Too tall for level 5's little gate. */
  tall: boolean;
}

export const PARTS: Record<PartId, PartSpec> = {
  wheels: { socket: 'under', fixes: ['bump'], name: 'the big wheels', tall: true },
  float: { socket: 'under', fixes: ['puddle'], name: 'the float', tall: false },
  umbrella: { socket: 'top', fixes: ['rain'], name: 'the umbrella', tall: true },
  lantern: { socket: 'front', fixes: ['dark'], name: 'the lantern', tall: false },
  flag: { socket: null, fixes: [], name: 'the flag', tall: true },
  paddles: { socket: 'under', fixes: ['bump', 'puddle'], name: 'the paddle wheels', tall: true },
  rollers: { socket: 'under', fixes: ['bump'], name: 'the roller belt', tall: false },
  lid: { socket: 'top', fixes: ['rain'], name: 'the lid', tall: false },
  raft: { socket: 'under', fixes: ['puddle'], name: 'the raft', tall: false },
  glowstones: { socket: 'top', fixes: ['dark'], name: 'the glow stones', tall: false },
};

/** Level 5's low twins of the tall single-job parts. */
export const LOW_TWIN: Partial<Record<PartId, PartId>> = { wheels: 'rollers', umbrella: 'lid' };
/** Level 6's box of new parts. */
export const NEW_KIT: readonly PartId[] = ['rollers', 'glowstones', 'raft', 'lid'];

/** Where a socket is, in words. */
export const SOCKET_WORDS: Record<Socket, string> = { under: 'underneath', top: 'on top', front: 'at the front' };

/** What a condition needs: the single-job part in its one socket (never the paddle wheels); `smooth` needs nothing. */
export function need(c: Condition): { part: PartId; socket: Socket } | null {
  for (const id of PART_IDS) {
    const p = PARTS[id];
    if (p.fixes.length === 1 && p.fixes[0] === c && p.socket) return { part: id, socket: p.socket };
  }
  return null;
}

/** Does part `id` handle condition `c` when it sits in socket `s`? */
export function handles(id: PartId | undefined, s: Socket, c: Condition): boolean {
  if (!id) return false;
  const p = PARTS[id];
  return p.socket === s && p.fixes.includes(c);
}

export type RunResult = { ok: true } | { ok: false; at: Condition; socket: Socket; part: PartId };

/**
 * The socket responsible for `c` and the part that fixes it there. With a `kit` (level 6's box of new parts) that holds a
 * part fixing `c`, that part's socket (the glow stones light the dark from on top); otherwise `need(c)`, as at levels 1–5.
 */
export function responsible(c: Condition, kit?: readonly PartId[]): { part: PartId; socket: Socket } | null {
  const fixer = kit?.find((id) => PARTS[id].fixes.length === 1 && PARTS[id].fixes[0] === c && PARTS[id].socket);
  if (fixer) return { part: fixer, socket: PARTS[fixer].socket! };
  return need(c);
}

/**
 * The first condition the part in its responsible socket does not handle, and that socket; `part` names the single-job
 * part (the kit's own, with a kit). Parts elsewhere never help or hurt, except at the `gate`, which stops the cart when any
 * socket holds a tall part (`socket` the first such, `part` that tall part).
 */
export function runPath(g: Gadget, path: readonly Condition[], kit?: readonly PartId[]): RunResult {
  for (const c of path) {
    if (c === 'gate') {
      const s = SOCKETS.find((x) => g[x] && PARTS[g[x]!].tall);
      if (s) return { ok: false, at: c, socket: s, part: g[s]! };
      continue;
    }
    const n = responsible(c, kit);
    if (!n) continue;
    if (!handles(g[n.socket], n.socket, c)) return { ok: false, at: c, socket: n.socket, part: n.part };
  }
  return { ok: true };
}

/** True when two conditions of the path would need the same socket (never at levels 1–3, always at level 4). */
export function socketConflict(path: readonly Condition[]): boolean {
  const seen = new Set<Socket>();
  for (const c of path) {
    const n = need(c);
    if (!n) continue;
    if (seen.has(n.socket)) return true;
    seen.add(n.socket);
  }
  return false;
}

/** Every assembly of the tray's parts over the open sockets (each empty or one part, no part twice) that passes the path. */
export function passingDesigns(path: readonly Condition[], tray: readonly PartId[], open: readonly Socket[], kit?: readonly PartId[]): Gadget[] {
  const out: Gadget[] = [];
  const walk = (i: number, g: Gadget, used: Set<PartId>) => {
    if (i === open.length) {
      if (runPath(g, path, kit).ok) out.push({ ...g });
      return;
    }
    walk(i + 1, g, used);
    for (const p of tray) {
      if (used.has(p)) continue;
      used.add(p);
      g[open[i]] = p;
      walk(i + 1, g, used);
      delete g[open[i]];
      used.delete(p);
    }
  };
  walk(0, {}, new Set());
  return out;
}

export const sameGadget = (a: Gadget, b: Gadget) => SOCKETS.every((s) => a[s] === b[s]);

// ——— Neighbors and rounds ———

export type Cargo = 'apples' | 'bag' | 'fish' | 'honey';
export interface Neighbor {
  critter: CritterName;
  /** Spoken name. */
  name: string;
  cargo: Cargo;
}

/** The definition's hedgehog and mouse stand in as the island's bunny and cat until those critters exist. */
export const NEIGHBORS: readonly Neighbor[] = [
  { critter: 'bunny', name: 'Bunny', cargo: 'apples' },
  { critter: 'duck', name: 'Duck', cargo: 'bag' },
  { critter: 'cat', name: 'Cat', cargo: 'fish' },
  { critter: 'bear', name: 'Bear', cargo: 'honey' },
];

export interface Round {
  neighbor: Neighbor;
  /** The pictured path, starting with `smooth`. */
  path: Condition[];
  /** Sockets she can use. Level 1 shows all three on both gadgets; level 3 opens the two the path needs. */
  open: Socket[];
  /** Parts in the tray, in tray order (levels 2–3). */
  tray: PartId[];
  /** Level 1: the two finished gadgets and which one passes. */
  pair?: { gadgets: [Gadget, Gadget]; passing: 0 | 1 };
  /** Level 2: the first neighbor, its one-condition path and the cart the pet builds for it. */
  shown?: { neighbor: Neighbor; path: Condition[]; gadget: Gadget };
  /**
   * Level 4: yesterday's shorter path and the cart that passed it, which starts on the bench. The tray then holds the
   * reuse shelf's two parts first, then a home slot for each part on the cart.
   */
  yesterday?: { path: Condition[]; gadget: Gadget };
  /** Level 6: the shown cart's parts went home, and the tray is a box of new parts whose own sockets decide the run. */
  kit?: true;
}

/** The kit the round's run reads (level 6's tray), or none: the old one-socket rule. */
export const kitOf = (round: Round): readonly PartId[] | undefined => (round.kit ? round.tray : undefined);
/** Levels 4–6: help follows a target passing design rather than the first unmet condition's single-job part. */
export const followsTarget = (round: Round): boolean => !!round.yesterday || !!round.kit || round.path.includes('gate');

export interface Brief {
  level: number;
  rounds: Round[];
}

export interface Plan {
  name: string;
  describe: string;
}

export const PLANS: Record<number, Plan> = {
  1: { name: 'Which one works?', describe: 'Which one works? Try two finished gadgets, give the one that works' },
  2: { name: 'Change one part', describe: 'Change one part: the shown cart works for one friend; change it for the next' },
  3: { name: 'Build it', describe: 'Build it: two open sockets, four parts, a path of two' },
  4: { name: 'Fix-It Day', describe: "Fix-It Day: yesterday's cart meets a longer path, and one part has to do two jobs" },
  5: { name: 'Little Gate', describe: 'Little Gate: build for the path, and the whole cart must fit under the low garden gate' },
  6: { name: 'New Box', describe: "New Box: the same job as the pet's cart, from a box of parts it never used" },
};

export const TOP_LEVEL = 6;
export const planFor = (level: number): Plan => PLANS[Math.max(1, Math.min(TOP_LEVEL, level))];

const LEVEL1_CONDITIONS: readonly Condition[] = ['rain', 'dark', 'bump', 'puddle'];
/** Level 3's pairs, the first authored. */
export const LEVEL3_PAIRS: readonly [Condition, Condition][] = [['rain', 'dark'], ['bump', 'dark'], ['rain', 'bump'], ['puddle', 'rain'], ['puddle', 'dark']];
/** Level 2's rounds in authored order: the first neighbor's condition, then the second's new one. */
export const LEVEL2_STEPS: readonly { first: Condition; then: Condition }[] = [
  { first: 'bump', then: 'puddle' },
  { first: 'rain', then: 'dark' },
  { first: 'dark', then: 'bump' },
];

/** Level 4's carts in round order: the condition `under` met yesterday, the new one today, and the third part's condition (null: seeded rain or dark). */
export const LEVEL4_CARTS: readonly { old: 'bump' | 'puddle'; third: 'rain' | 'dark' | null }[] = [
  { old: 'bump', third: 'dark' },
  { old: 'puddle', third: null },
  { old: 'bump', third: 'rain' },
];

/** Level 5's rounds: the two conditions (round 2 seeded from the two pairs, round 3 always bump and rain). */
export const LEVEL5_PAIRS: readonly (readonly [Condition, Condition][])[] = [
  [['bump', 'dark']],
  [['rain', 'dark'], ['rain', 'puddle']],
  [['bump', 'rain']],
];
/** Level 6's rounds, likewise; `bump` + `puddle` would put two jobs underneath and `rain` + `dark` two on top. */
export const LEVEL6_PAIRS: readonly (readonly [Condition, Condition][])[] = [
  [['bump', 'dark']],
  [['puddle', 'dark'], ['puddle', 'rain']],
  [['bump', 'rain']],
];

/** Level 4: the condition on today's path that yesterday's did not have (the sparkled tile). */
export function newCondition(round: Round): Condition | null {
  if (!round.yesterday) return null;
  return round.path.find((c) => !round.yesterday!.path.includes(c)) ?? null;
}

/** The three rounds of a level, seeded. The first round of each level is authored so the how-to demonstration matches. */
export function briefFor(level: number, rng: Rng): Brief {
  const l = Math.max(1, Math.min(TOP_LEVEL, level));
  const rounds: Round[] = [];
  const pool = rng.shuffle([...NEIGHBORS]);
  const neighborAt = (i: number) => pool[i % pool.length];
  if (l === 1) {
    const later = rng.shuffle(LEVEL1_CONDITIONS.filter((c) => c !== 'rain'));
    const conditions: Condition[] = ['rain', later[0], later[1]];
    conditions.forEach((c, i) => {
      const n = need(c)!;
      const passing: 0 | 1 = i === 0 ? 0 : rng.chance(0.5) ? 0 : 1;
      const good: Gadget = { [n.socket]: n.part };
      const bad: Gadget = { [n.socket]: 'flag' };
      const neighbor = i === 0 ? NEIGHBORS[0] : neighborAt(i);
      rounds.push({ neighbor, path: ['smooth', c], open: [...SOCKETS], tray: [], pair: { gadgets: passing === 0 ? [good, bad] : [bad, good], passing } });
    });
  } else if (l === 2) {
    LEVEL2_STEPS.forEach((step, i) => {
      const first = need(step.first)!;
      const next = need(step.then)!;
      const shownGadget: Gadget = { [first.socket]: first.part };
      // The second path keeps the first condition unless it would need the same socket (round 1's bump and puddle).
      const path: Condition[] = first.socket === next.socket ? ['smooth', step.then] : ['smooth', step.first, step.then];
      // The tray: the needed part, the flag, and one part that does not help.
      const others = PART_IDS.filter((p) => p !== next.part && p !== 'flag' && p !== first.part && PARTS[p].socket !== next.socket);
      const tray = rng.shuffle([next.part, 'flag', rng.pick(others)] as PartId[]);
      const firstNeighbor = i === 0 ? NEIGHBORS[0] : neighborAt(i * 2);
      let neighbor = neighborAt(i * 2 + 1);
      if (neighbor === firstNeighbor) neighbor = neighborAt(i * 2 + 2);
      rounds.push({ neighbor, path, open: [...SOCKETS], tray, shown: { neighbor: firstNeighbor, path: ['smooth', step.first], gadget: shownGadget } });
    });
  } else if (l === 4) {
    const later = rng.shuffle(NEIGHBORS.slice(1));
    LEVEL4_CARTS.forEach((cart, i) => {
      const first = i === 0;
      const fresh: Condition = cart.old === 'bump' ? 'puddle' : 'bump';
      const third: Condition = cart.third ?? (rng.chance(0.5) ? 'rain' : 'dark');
      const oldPart = need(cart.old)!.part;
      const thirdNeed = need(third)!;
      const gadget: Gadget = { under: oldPart, [thirdNeed.socket]: thirdNeed.part };
      const yesterdayPath: Condition[] = ['smooth', ...(first ? [cart.old, third] : rng.shuffle([cart.old, third]))];
      const path: Condition[] = ['smooth', ...(first ? [cart.old, fresh, third] : rng.shuffle([cart.old, fresh, third]))];
      const freshPart = need(fresh)!.part;
      const shelf: PartId[] = first ? [freshPart, 'paddles'] : rng.shuffle([freshPart, 'paddles'] as PartId[]);
      rounds.push({
        neighbor: first ? NEIGHBORS[0] : later[i - 1],
        path, open: [...SOCKETS], tray: [...shelf, oldPart, thirdNeed.part],
        yesterday: { path: yesterdayPath, gadget },
      });
    });
  } else if (l === 5) {
    const later = rng.shuffle(NEIGHBORS.slice(1));
    LEVEL5_PAIRS.forEach((pairs, i) => {
      const first = i === 0;
      const pair = first ? pairs[0] : rng.pick(pairs);
      const conds = first ? [...pair] : rng.shuffle([...pair]);
      const tray: PartId[] = [];
      for (const c of conds) {
        const part = need(c)!.part;
        tray.push(part);
        const twin = LOW_TWIN[part];
        if (twin) tray.push(twin);
      }
      // Four parts: the flag fills the slot when only one condition has a tall usual part.
      if (tray.length < 4) tray.push('flag');
      rounds.push({
        neighbor: first ? NEIGHBORS[0] : later[i - 1],
        path: ['smooth', ...conds, 'gate'], open: [...SOCKETS], tray: first ? tray : rng.shuffle(tray),
      });
    });
  } else if (l === 6) {
    LEVEL6_PAIRS.forEach((pairs, i) => {
      const first = i === 0;
      const pair = first ? pairs[0] : rng.pick(pairs);
      const conds = first ? [...pair] : rng.shuffle([...pair]);
      const path: Condition[] = ['smooth', ...conds];
      const gadget: Gadget = {};
      for (const c of conds) { const n = need(c)!; gadget[n.socket] = n.part; }
      const two = first ? [NEIGHBORS[1], NEIGHBORS[3]] : rng.shuffle([...NEIGHBORS]).slice(0, 2);
      rounds.push({
        neighbor: two[1], path, open: [...SOCKETS], tray: first ? [...NEW_KIT] : rng.shuffle([...NEW_KIT]),
        shown: { neighbor: two[0], path: [...path], gadget }, kit: true,
      });
    });
  } else {
    const order = [LEVEL3_PAIRS[0], ...rng.shuffle(LEVEL3_PAIRS.slice(1))].slice(0, 3);
    order.forEach((pair, i) => {
      const conds = i === 0 ? [...pair] : rng.shuffle([...pair]);
      const needs = conds.map((c) => need(c)!);
      const open = needs.map((n) => n.socket);
      const closed = SOCKETS.find((s) => !open.includes(s))!;
      const decoys = PART_IDS.filter((p) => PARTS[p].socket === closed);
      const tray = rng.shuffle([needs[0].part, needs[1].part, rng.pick(decoys), 'flag'] as PartId[]);
      rounds.push({ neighbor: i === 0 ? NEIGHBORS[0] : neighborAt(i), path: ['smooth', ...conds], open, tray });
    });
  }
  return { level: l, rounds };
}

// ——— Help ———

export type Help =
  /** Put `part` in `socket`; `replaces` is the part there now, if any. */
  | { kind: 'install'; part: PartId; socket: Socket; replaces: PartId | null; at: Condition }
  /** Take `part` out of `socket` and back to the tray (level 5: a tall part the target design leaves out). */
  | { kind: 'out'; part: PartId; socket: Socket; at: Condition }
  /** Nothing is unmet: the gadget passes. */
  | { kind: 'done' };

/**
 * The help target from level 4: the passing design (over the open sockets and the round's parts) that keeps the most of
 * her placed parts, ties going to the one that differs from her gadget in the fewest sockets.
 */
export function targetDesign(gadget: Gadget, round: Round): Gadget | null {
  let best: { g: Gadget; kept: number; diff: number } | null = null;
  for (const d of passingDesigns(round.path, round.tray, round.open, kitOf(round))) {
    const kept = SOCKETS.filter((s) => gadget[s] && d[s] === gadget[s]).length;
    const diff = SOCKETS.filter((s) => d[s] !== gadget[s]).length;
    if (!best || kept > best.kept || (kept === best.kept && diff < best.diff)) best = { g: d, kept, diff };
  }
  return best?.g ?? null;
}

/** How many sockets help has to change: levels 4–6 count against the target design, other levels the unmet conditions. */
export function helpSteps(gadget: Gadget, round: Round): number {
  if (followsTarget(round)) {
    const d = targetDesign(gadget, round);
    return d ? SOCKETS.filter((s) => d[s] !== gadget[s]).length : 0;
  }
  return round.path.filter((c) => { const n = need(c); return n && !handles(gadget[n.socket], n.socket, c); }).length;
}

/**
 * What help does next for a built gadget: the part the first unmet condition needs, in its socket. Correct work stays.
 * Levels 4–6 follow the target design instead, so at the conflict it installs the paddle wheels rather than swapping the
 * big wheels and the float back and forth, at the gate it swaps in the low twin or takes a tall part out, and with a new
 * kit it names a part from the box.
 */
export function helpFor(gadget: Gadget, path: readonly Condition[], round?: Round): Help {
  const r = runPath(gadget, path, round && kitOf(round));
  if (r.ok) return { kind: 'done' };
  const d = round && followsTarget(round) ? targetDesign(gadget, round) : null;
  if (d && !d[r.socket] && gadget[r.socket]) return { kind: 'out', part: gadget[r.socket]!, socket: r.socket, at: r.at };
  const part = d?.[r.socket] ?? r.part;
  return { kind: 'install', part, socket: r.socket, replaces: gadget[r.socket] ?? null, at: r.at };
}

/** The gadget after help: the part moves in (from the tray or another socket) and whatever was there goes back to the tray. */
export function applyHelp(gadget: Gadget, h: Help): Gadget {
  if (h.kind === 'out') { const g: Gadget = { ...gadget }; delete g[h.socket]; return g; }
  if (h.kind !== 'install') return { ...gadget };
  const g: Gadget = { ...gadget };
  for (const s of SOCKETS) if (g[s] === h.part) delete g[s];
  g[h.socket] = h.part;
  return g;
}

/** Misses, hints and the round's glow, by the definition's accounting. */
export class Tally {
  misses = 0;
  hints = 0;
  /** The responsible socket glows (level 1: the passing gadget). */
  glowing = false;
  /** Show a hint presses that counted this round. */
  counted = 0;
  private roundMisses = 0;
  private lastFail: { at: Condition; part: PartId | undefined } | null = null;
  /** Level 4: the assemblies of this round's failing Trys, and where its failing Trys and Gives stopped. */
  private failedTries: Gadget[] = [];
  private stops = new Set<Condition>();
  private conflictSaid = false;

  /** A new round: the glow and the same-condition memory reset; misses and hints carry on. */
  nextRound() {
    this.glowing = false;
    this.counted = 0;
    this.roundMisses = 0;
    this.lastFail = null;
    this.failedTries = [];
    this.stops.clear();
    this.conflictSaid = false;
  }

  /** A failing Give. Returns what the shell does now: light the glow, install the part (a supported finish), or nothing more. */
  miss(): 'glow' | 'install' | 'none' {
    this.misses++;
    this.roundMisses++;
    if (this.glowing) { this.hints++; return 'install'; }
    if (this.roundMisses >= 2) { this.light(); return 'glow'; }
    return 'none';
  }

  /**
   * A failing Try at `at` with `part` in the responsible socket. Two in a row at the same condition with that socket
   * unchanged light the glow; with `gadget` (level 4), so does repeating any earlier failing assembly of the round.
   */
  tryFail(at: Condition, part: PartId | undefined, gadget?: Gadget): boolean {
    let same = !!this.lastFail && this.lastFail.at === at && this.lastFail.part === part;
    if (gadget) {
      if (this.failedTries.some((g) => sameGadget(g, gadget))) same = true;
      this.failedTries.push({ ...gadget });
    }
    this.lastFail = { at, part };
    if (same && !this.glowing) { this.light(); return true; }
    return false;
  }

  /** Level 4: a failing Try or Give stopped at `at`. True once a round, when the stops have now been at both the bump and the puddle (the conflict line, uncounted). */
  stopped(at: Condition): boolean {
    this.stops.add(at);
    if (this.conflictSaid || !this.stops.has('bump') || !this.stops.has('puddle')) return false;
    this.conflictSaid = true;
    return true;
  }

  /** A Try that passes clears the same-condition memory. */
  tryOk() {
    this.lastFail = null;
  }

  private light() {
    this.glowing = true;
    this.hints++;
  }

  /** A Show a hint press that did something: counts up to `unmet` times a round, then the words only. */
  help(unmet: number): boolean {
    if (this.counted >= unmet) return false;
    this.counted++;
    this.hints++;
    return true;
  }
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

export const SOCKET = 110;
export const PART = 110;
export const TILE = 96;
export const BUTTON_R = 55;
export const HAND = 110;
export const STRIP = 44;
const M = 20;

export interface BenchLayout {
  /** The neighbor's request card. */
  request: Rect;
  /** The path's tiles in order. */
  tiles: Rect[];
  /** Level 1: two gadget boards; levels 2–3: one cart board. */
  boards: Rect[];
  /** Level 1: a Give hand under each board. */
  hands: Rect[];
  /** Tray slots, each a part's home. */
  tray: Rect[];
  /** The version strip's row (no touches). */
  strip: Rect;
  /** Levels 2–3. */
  tryButton: Rect | null;
  giveButton: Rect | null;
}

/** Socket centres on a board of (w, h), relative to its centre. */
export function socketAt(s: Socket, w: number, h: number): Pt {
  if (s === 'top') return { x: -w * 0.08, y: -h / 2 + SOCKET / 2 + 4 };
  if (s === 'under') return { x: -w * 0.08, y: h / 2 - SOCKET / 2 - 4 };
  return { x: w / 2 - SOCKET / 2 - 4, y: 0 };
}

const button = (cx: number, cy: number): Rect => ({ x: cx - BUTTON_R, y: cy - BUTTON_R, w: 2 * BUTTON_R, h: 2 * BUTTON_R });

/** The bench's boards, centred in the room between `top` and `bottom`: two gadgets with a hand under each, or one cart. */
function placeBoards(pair: boolean, left: number, room: number, top: number, bottom: number, boards: Rect[], hands: Rect[]) {
  const gap = 16;
  if (pair) {
    const bw = Math.min(320, (room - 30) / 2);
    const bh = Math.min(260, bottom - top - HAND - gap);
    const y = top + Math.max(0, (bottom - top - bh - HAND - gap) / 2);
    const x0 = left + (room - (2 * bw + 30)) / 2;
    for (let i = 0; i < 2; i++) {
      boards.push({ x: x0 + i * (bw + 30), y, w: bw, h: bh });
      hands.push({ x: x0 + i * (bw + 30) + bw / 2 - HAND / 2, y: y + bh + gap, w: HAND, h: HAND });
    }
  } else {
    const bw = Math.min(460, room);
    const bh = Math.min(360, bottom - top);
    boards.push({ x: left + (room - bw) / 2, y: top + Math.max(0, (bottom - top - bh) / 2), w: bw, h: bh });
  }
}

/**
 * Where everything goes, from the room left in the view: the request card at the left (above the bench in portrait), the
 * path at the right (a row below the bench in portrait), the tray along the bottom clear of the guide, Try and Give at the
 * bottom right. Null rather than a part, socket or hand under 100 units.
 */
export function benchLayout(level: number, tiles: number, trayCount: number, v: View): BenchLayout | null {
  const wide = v.w >= v.h;
  const pair = level === 1;
  const gap = 16;
  let request: Rect;
  const tileRects: Rect[] = [];
  const boards: Rect[] = [];
  const hands: Rect[] = [];
  const tray: Rect[] = [];
  let tryButton: Rect | null = null;
  let giveButton: Rect | null = null;
  // The bottom row: the tray (and the buttons at levels 2–3) sit above the view's bottom edge, clear of the guide.
  const bottomY = v.h - M - PART;
  if (!pair) {
    const cy = v.h - M - BUTTON_R;
    giveButton = button(v.w - M - BUTTON_R, cy);
    tryButton = button(giveButton.x - 24 - BUTTON_R, cy);
  }
  const trayW = trayCount * PART + Math.max(0, trayCount - 1) * gap;
  let trayY = bottomY;
  let trayLeft = PET_CORNER.w + M;
  let trayRight = tryButton ? tryButton.x - M : v.w - M;
  if (!wide && trayCount > 0 && trayRight - trayLeft < trayW) {
    // Portrait: the tray takes its own row above the buttons, clear of the guide.
    trayY = v.h - PET_CORNER.h - M - PART;
    trayLeft = M;
    trayRight = v.w - M;
    if (tryButton && trayY + PART + M > tryButton.y) trayY = tryButton.y - M - PART;
  }
  const trayX = trayLeft + (trayRight - trayLeft - trayW) / 2;
  for (let i = 0; i < trayCount; i++) tray.push({ x: trayX + i * (PART + gap), y: trayY, w: PART, h: PART });
  const stripY = trayCount > 0 ? trayY - 12 - STRIP : bottomY - 12 - STRIP;
  const strip: Rect = { x: Math.max(PET_CORNER.w + M, v.w / 2 - 3 * (STRIP + 8)), y: stripY, w: 6 * (STRIP + 8), h: STRIP };
  if (wide) {
    const top = M + 24;
    request = { x: M, y: HOME_CORNER.h + M, w: 200, h: 190 };
    const tileX = v.w - M - TILE;
    for (let i = 0; i < tiles; i++) tileRects.push({ x: tileX, y: top + i * (TILE + 12), w: TILE, h: TILE });
    const left = request.x + request.w + M;
    const right = tileX - M;
    const room = right - left;
    const bottom = strip.y - M;
    placeBoards(pair, left, room, top, bottom, boards, hands);
  } else {
    request = { x: HOME_CORNER.w + M, y: M, w: v.w - HOME_CORNER.w - 2 * M, h: 150 };
    const top = request.y + request.h + M;
    const tilesW = tiles * TILE + (tiles - 1) * 12;
    const tilesY = strip.y - M - TILE;
    const tilesX = (v.w - tilesW) / 2;
    for (let i = 0; i < tiles; i++) tileRects.push({ x: tilesX + i * (TILE + 12), y: tilesY, w: TILE, h: TILE });
    const bottom = tilesY - M;
    const left = M;
    const room = v.w - 2 * M;
    placeBoards(pair, left, room, top, bottom, boards, hands);
  }
  for (const b of boards) if (b.w < 220 || b.h < 180) return null;
  const parts = [request, ...tileRects, ...boards, ...hands, ...tray, strip, ...(tryButton ? [tryButton] : []), ...(giveButton ? [giveButton] : [])];
  if (!parts.every((p) => inside(p, v))) return null;
  if (parts.some((p) => corners(v).some((q) => overlaps(p, q)))) return null;
  if (parts.some((p, i) => parts.some((q, j) => i < j && overlaps(p, q)))) return null;
  return { request, tiles: tileRects, boards, hands, tray, strip, tryButton, giveButton };
}

// ——— The ghost finger ———

export type Move =
  | { tryGadget: 0 | 1 }
  | { give: 0 | 1 }
  | { drag: PartId; to: Socket }
  /** Drag a part from its socket back to its tray slot. */
  | { takeOut: PartId }
  | { tryCart: true }
  | { giveCart: true };

/**
 * What a capable child does next. Level 1: Try the failing gadget, Try the passing one, Give it. Levels 2–4: Try the shown
 * cart once (levels 2 and 4, a free look at where it stops), put in what help names, Try, Give. Level 5 first builds the
 * familiar cart (each condition's usual part) and Trys it to the gate stop, then follows help.
 */
export function nextMove(round: Round, gadget: Gadget, tried: readonly boolean[], triedOk: boolean, level: number): Move {
  if (round.pair) {
    const fail = (1 - round.pair.passing) as 0 | 1;
    if (!tried[fail]) return { tryGadget: fail };
    if (!tried[round.pair.passing]) return { tryGadget: round.pair.passing };
    return { give: round.pair.passing };
  }
  if ((level === 2 || level === 4) && !tried[0] && !triedOk) return { tryCart: true };
  if (level === 5 && !tried[0]) {
    for (const c of round.path) {
      const n = need(c);
      if (n && gadget[n.socket] !== n.part) return { drag: n.part, to: n.socket };
    }
    return { tryCart: true };
  }
  const h = helpFor(gadget, round.path, round);
  if (h.kind === 'install') return { drag: h.part, to: h.socket };
  if (h.kind === 'out') return { takeOut: h.part };
  if (!triedOk) return { tryCart: true };
  return { giveCart: true };
}
