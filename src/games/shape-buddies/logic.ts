import type { ColorName } from '../../art/palette';
import type { LineId } from '../../content/voice-script';
import type { Rng } from '../../engine/random';
import type { BandLevels } from '../../progress/difficulty';
export const SHAPES = ['plain', 'flatten', 'scoop', 'slope'] as const;
export type Shape = (typeof SHAPES)[number];
export type Dock = 'bridge' | 'receiver';
export type Place = Dock | 'park';
/** `facing` is which way a friend's paper points: 1 as drawn (a slope runs down to the right), -1 turned round. Only level 6 offers Turn. */
export interface Friend {
  shape: Shape;
  place: Place;
  facing?: 1 | -1;
}
export interface Construction {
  friends: [Friend, Friend];
  selected: number;
}
export type Failure = Dock;
export const initial = (): Construction => ({
  friends: [
    { shape: 'plain', place: 'park', facing: 1 },
    { shape: 'plain', place: 'park', facing: 1 },
  ],
  selected: 0,
});
export const copy = (s: Construction): Construction => ({
  friends: s.friends.map((f) => ({ ...f })) as [Friend, Friend],
  selected: s.selected,
});
/** Which bridge shapes reach the far bank, how far below the chute's bank it sits, whether the two docks join over a wide gap,
 * whether a rocky ledge inside the gap holds up a cup at the bridge dock, which way the stream runs (`flow` -1: chute on the right, pot on the left),
 * whether a fixed wooden plank already spans the gap (`plank`: level 7 has one friend, whose only job is the cup),
 * and whether the round first asks who is building (`shared`: level 8 is level 3's spoon, one friend each with turns, or one player). */
export const PLANS: Record<
  number,
  {
    bridges: readonly Shape[];
    drop: number;
    joined?: boolean;
    ledge?: boolean;
    flow?: 1 | -1;
    plank?: boolean;
    shared?: boolean;
  }
> = {
  1: { bridges: ['flatten', 'slope'], drop: 0 },
  2: { bridges: ['slope'], drop: 50 },
  3: { bridges: ['flatten'], drop: 0, joined: true },
  4: { bridges: ['slope'], drop: 50, joined: true },
  5: { bridges: ['flatten', 'slope'], drop: 0, ledge: true },
  6: { bridges: ['slope'], drop: 50, flow: -1 },
  7: { bridges: [], drop: 0, plank: true },
  8: { bridges: ['flatten'], drop: 0, joined: true, shared: true },
};
/** Level 8 plays level 3's spoon, so it sits right after 3; preschool keeps level 7 only, and 7 stays out of school. */
export const LEVELS: BandLevels = {
  preschool: { min: 7, max: 7 },
  prek: { min: 1, max: 8, order: [7, 1, 2, 3, 8, 4, 5] },
  school: { min: 1, max: 8, order: [1, 2, 3, 8, 4, 5, 6] },
};
export const planFor = (level: number) => PLANS[level] ?? PLANS[1];
const flowOf = (level: number) => planFor(level).flow ?? 1;
/** How many friends she can use: one over level 7's plank (the second stays parked and hidden), otherwise two. */
export const friendCount = (level: number) => (planFor(level).plank ? 1 : 2);
/** A friend at the bridge dock carries the seed when its shape suits the plan and, if it is a slope, it runs down the way the stream goes. */
const bridges = (f: Friend | undefined, level: number) =>
  !!planFor(level).plank ||
  (!!f &&
    planFor(level).bridges.includes(f.shape) &&
    (f.shape !== 'slope' || (f.facing ?? 1) === flowOf(level)));
/** What grows: a round's seed is a bean, a sunflower seed or an acorn. Only the art changes; the rules never read it. */
export const SEEDS = ['bean', 'sunflower', 'acorn'] as const;
export type SeedKind = (typeof SEEDS)[number];
/** The round's two friend colours, then its seed kind, drawn in that order so a seed's colours match the rounds before seeds varied. */
export function looks(rng: Rng): { colors: ColorName[]; seed: SeedKind } {
  const colors = rng.shuffle(['teal', 'purple', 'pink', 'blue'] as ColorName[]).slice(0, 2);
  return { colors, seed: rng.pick(SEEDS) };
}
/** Which dock holds the caught seed, or null if it is not caught. Level 5's ledge holds a cup in the gap, which the seed meets first. */
export function catcher(s: Construction, level = 1): Dock | null {
  const bridge = s.friends.find((f) => f.place === 'bridge');
  if (planFor(level).ledge && bridge?.shape === 'scoop') return 'bridge';
  if (!bridges(bridge, level)) return null;
  return s.friends.find((f) => f.place === 'receiver')?.shape === 'scoop' ? 'receiver' : null;
}
export function trace(s: Construction, level = 1): Failure | 'caught' {
  if (catcher(s, level)) return 'caught';
  const bridge = s.friends.find((f) => f.place === 'bridge');
  return bridges(bridge, level) ? 'receiver' : 'bridge';
}
/** The next useful friend, shape and dock; over a stream that runs the other way, a bridge also names the way it must face. */
export function guidance(
  s: Construction,
  level = 1,
): { friend: number; shape: Shape; dock: Dock; facing?: 1 | -1 } | null {
  const failure = trace(s, level);
  if (failure === 'caught') return null;
  const occupant = s.friends.findIndex((f) => f.place === failure);
  const friend = occupant >= 0 ? occupant : s.friends.findIndex((f) => f.place === 'park');
  // On the ledge an empty or plain gap is finished by a cup there; a bridge already at the gap leads to a cup at the catch instead.
  const shape = failure === 'receiver' || planFor(level).ledge ? 'scoop' : planFor(level).bridges[0];
  return planFor(level).flow && failure === 'bridge'
    ? { friend, shape, dock: failure, facing: flowOf(level) }
    : { friend, shape, dock: failure };
}
/** The spoken explanation of a failing construction, or null once the seed is caught. Levels 3 and 4 name how the joined spoon failed; over level 4's step the handle must slope down.
 * Over level 7's plank, a flat or slope friend at the catch lets the seed roll off its end. */
export function failureLine(s: Construction, level = 1): LineId | null {
  const failure = trace(s, level);
  if (failure === 'caught') return null;
  const bridge = s.friends.find((f) => f.place === 'bridge'),
    plan = planFor(level);
  if (plan.joined) {
    if (failure === 'bridge' && plan.drop)
      return bridge?.shape === 'flatten' ? 'buddies.downFlat' : 'buddies.downPath';
    if (failure === 'bridge') return bridge?.shape === 'slope' ? 'buddies.joinSlope' : 'buddies.joinPath';
    return s.friends.some((f) => f.place === 'receiver') ? 'buddies.joinCup' : 'buddies.joinShort';
  }
  if (plan.plank)
    return ['flatten', 'slope'].includes(s.friends.find((f) => f.place === 'receiver')?.shape ?? '')
      ? 'buddies.oneRoll'
      : 'buddies.cup';
  if (failure === 'receiver') return 'buddies.cup';
  if (plan.ledge) return 'buddies.ledgeNeed';
  if (!plan.drop) return 'buddies.bridge';
  if (plan.flow && bridge?.shape === 'slope') return 'buddies.turnSlope';
  return bridge?.shape === 'flatten' ? 'buddies.stepFlat' : 'buddies.stepBridge';
}
/**
 * Level 8's finish with two seats: the second seat is uncredited, so a hint on the partner's friend never counts against her,
 * and the round is never smooth, so a grown-up's play cannot step her up. Playing alone passes the round's hints unchanged.
 * The same rule as Secret Code's `swapResult`.
 */
export function sharedResult(twoSeats: boolean, hintsOnHers: number): { misses: number; hints: number } {
  return { misses: 0, hints: twoSeats ? Math.max(hintsOnHers, 1) : hintsOnHers };
}
/** Exploration never counts as a miss. Hint support belongs to the unresolved role, not the number of taps.
 * Level 8 with two seats (`twoSeats`): friend 0 is hers and friend 1 the partner's; only the turn holder (`holder`) can be chosen or changed. */
export class SeedRound {
  state = initial();
  previous: Construction | null = null;
  /** Level 8: null until she answers who is building, then whether two people take one friend each. */
  seats: 'two' | 'solo' | null = null;
  holder = 0;
  private previousHolder = 0;
  /** Hints charged to her friend (friend 0): the friend `guidance` named when the hint was given. */
  hintsOnHers = 0;
  phase: 'edit' | 'running' | 'caught' | 'carrying' | 'done' = 'edit';
  readonly shown = new Set<Failure>();
  readonly failures: Record<Failure, number> = { bridge: 0, receiver: 0 };
  hints = 0;
  misses = 0;
  constructor(readonly level = 1) {}
  get editable() {
    return (
      (this.phase === 'edit' || this.phase === 'caught') &&
      (!planFor(this.level).shared || this.seats !== null)
    );
  }
  /** Whether turns are enforced: level 8 with two seats. */
  get locked() {
    return this.seats === 'two';
  }
  /** Level 8's seat question; the answer lasts for the round. */
  choose(seats: 'two' | 'solo') {
    if (planFor(this.level).shared && this.seats === null) this.seats = seats;
  }
  select(i: number) {
    if (
      this.editable &&
      Number.isInteger(i) &&
      i >= 0 &&
      i < friendCount(this.level) &&
      (!this.locked || i === this.holder)
    )
      this.state.selected = i;
  }
  private handTo(i: number) {
    if (this.locked) {
      this.holder = i;
      this.state.selected = i;
    }
  }
  private remember() {
    this.previous = copy(this.state);
    this.previousHolder = this.holder;
  }
  edit(shape?: Shape, place?: Place): boolean {
    if (!this.editable) return false;
    const i = this.state.selected;
    if (this.locked && i !== this.holder) return false;
    if (place === 'bridge' && planFor(this.level).plank) return false;
    if (place && place !== 'park' && this.state.friends.some((f, j) => j !== i && f.place === place))
      return false;
    if (
      (!shape || shape === this.state.friends[i].shape) &&
      (!place || place === this.state.friends[i].place)
    )
      return false;
    this.remember();
    this.phase = 'edit';
    if (shape) this.state.friends[i].shape = shape;
    if (place) this.state.friends[i].place = place;
    return true;
  }
  /** Turns the selected friend round (level 6 only). Free, and undoable like any edit. */
  turn(): boolean {
    if (!this.editable || !planFor(this.level).flow) return false;
    this.remember();
    this.phase = 'edit';
    const f = this.state.friends[this.state.selected];
    f.facing = (f.facing ?? 1) === 1 ? -1 : 1;
    return true;
  }
  /**
   * Level 8 with two seats: the turn holder dropped its friend on a dock or back in its park, changed or not, so the turn passes.
   * A drop back where it was is how a player says "mine is fine", so it is remembered for Undo like any edit. False if not her turn's friend.
   */
  drop(place: Place): boolean {
    if (!this.editable || !this.locked) return this.edit(undefined, place);
    const i = this.holder;
    if (place !== 'park' && this.state.friends.some((f, j) => j !== i && f.place === place)) return false;
    if (place === 'bridge' && planFor(this.level).plank) return false;
    this.remember();
    this.phase = 'edit';
    this.state.friends[i].place = place;
    this.handTo(1 - i);
    return true;
  }
  undo(): boolean {
    if (!this.editable || !this.previous) return false;
    this.state = copy(this.previous);
    this.previous = null;
    this.phase = 'edit';
    if (this.locked) this.holder = this.previousHolder;
    return true;
  }
  /** Replay returns the turn to her friend. */
  replay() {
    if (this.phase === 'caught') {
      this.phase = 'edit';
      this.handTo(0);
    }
  }
  help(): Failure | null {
    const role = trace(this.state, this.level);
    if (role === 'caught') return null;
    const friend = guidance(this.state, this.level)?.friend ?? 0;
    if (!this.shown.has(role)) {
      this.shown.add(role);
      this.hints++;
      if (friend === 0) this.hintsOnHers++;
    }
    this.handTo(friend);
    return role;
  }
  /** What the round reports: level 8's seat rule, otherwise its own misses and hints. */
  result(): { misses: number; hints: number } {
    return planFor(this.level).shared && this.locked
      ? sharedResult(true, this.hintsOnHers)
      : { misses: this.misses, hints: this.hints };
  }
  trySeed(): Failure | 'caught' | null {
    if (this.phase !== 'edit') return null;
    this.phase = 'running';
    return trace(this.state, this.level);
  }
  settle(result: Failure | 'caught') {
    if (this.phase !== 'running') return;
    this.phase = result === 'caught' ? 'caught' : 'edit';
    if (result !== 'caught' && ++this.failures[result] >= 2) this.help();
    // After a failed Try the turn goes to the friend whose role the line just named, or the parked friend.
    if (result !== 'caught') this.handTo(guidance(this.state, this.level)?.friend ?? this.holder);
  }
  carry(): boolean {
    if (this.phase !== 'caught') return false;
    this.phase = 'carrying';
    return true;
  }
  finish(): boolean {
    if (this.phase !== 'carrying') return false;
    this.phase = 'done';
    return true;
  }
}
/** Level 2 raises only the chute's bank, so the bridge dock moves up with it. Level 3 widens the stream: the docks become a near and a far half, side by side. Level 4 does both: the near half sits up on the raised bank.
 * Level 6 is level 2 mirrored about left + 545, so the pot clears the pet's corner, and gains a fourth button, Turn. */
export function layout(w: number, h: number, level = 1) {
  const left = (w - 1024) / 2,
    plan = planFor(level),
    flow = plan.flow ?? 1;
  const at = (x: number) => left + (flow === 1 ? x : 1090 - x);
  return {
    bridge: { x: at(plan.joined ? 380 : 400), y: 300 - plan.drop },
    receiver: { x: at(plan.joined ? 580 : 630), y: 300 },
    pot: { x: at(870), y: 300 },
    receiverWidth: plan.joined ? 180 : 110,
    parks: [
      { x: left + 250, y: 485 },
      { x: left + 420, y: 485 },
    ],
    tools: [
      { x: left + 590, y: 485 },
      { x: left + 740, y: 485 },
      { x: left + 890, y: 485 },
    ],
    // Level 8's seat question: two round buttons (112 across) over the stream, shown alone while the friends, tools and docks are hidden.
    seats: [
      { x: left + 420, y: 330 },
      { x: left + 620, y: 330 },
    ],
    buttons: [
      { x: left + 340, y: h - 118 },
      { x: left + 520, y: h - 118 },
      { x: left + 700, y: h - 118 },
      ...(plan.flow ? [{ x: left + 880, y: h - 118 }] : []),
    ],
  };
}
