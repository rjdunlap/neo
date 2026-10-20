import type { LineId } from '../../content/voice-script';
export const SHAPES = ['plain', 'flatten', 'scoop', 'slope'] as const;
export type Shape = typeof SHAPES[number];
export type Dock = 'bridge' | 'receiver';
export type Place = Dock | 'park';
export interface Friend { shape: Shape; place: Place }
export interface Construction { friends: [Friend, Friend]; selected: number }
export type Failure = Dock;
export const initial = (): Construction => ({ friends: [{ shape: 'plain', place: 'park' }, { shape: 'plain', place: 'park' }], selected: 0 });
export const copy = (s: Construction): Construction => ({ friends: s.friends.map(f => ({ ...f })) as [Friend, Friend], selected: s.selected });
/** Which bridge shapes reach the far bank, how far below the chute's bank it sits, and whether the two docks join over a wide gap. */
export const PLANS: Record<number, { bridges: readonly Shape[]; drop: number; joined?: boolean }> = {
  1: { bridges: ['flatten', 'slope'], drop: 0 },
  2: { bridges: ['slope'], drop: 50 },
  3: { bridges: ['flatten'], drop: 0, joined: true },
};
export const planFor = (level: number) => PLANS[level] ?? PLANS[1];
export function trace(s: Construction, level = 1): Failure | 'caught' {
  const bridge = s.friends.find(f => f.place === 'bridge');
  if (!bridge || !planFor(level).bridges.includes(bridge.shape)) return 'bridge';
  return s.friends.find(f => f.place === 'receiver')?.shape === 'scoop' ? 'caught' : 'receiver';
}
export function guidance(s: Construction, level = 1): { friend: number; shape: Shape; dock: Dock } | null {
  const failure = trace(s, level);
  if (failure === 'caught') return null;
  const occupant = s.friends.findIndex(f => f.place === failure);
  const friend = occupant >= 0 ? occupant : s.friends.findIndex(f => f.place === 'park');
  return { friend, shape: failure === 'bridge' ? planFor(level).bridges[0] : 'scoop', dock: failure };
}
/** The spoken explanation of a failing construction, or null once the seed is caught. Level 3 names how the joined spoon failed. */
export function failureLine(s: Construction, level = 1): LineId | null {
  const failure = trace(s, level);
  if (failure === 'caught') return null;
  const bridge = s.friends.find(f => f.place === 'bridge'), plan = planFor(level);
  if (plan.joined) {
    if (failure === 'bridge') return bridge?.shape === 'slope' ? 'buddies.joinSlope' : 'buddies.joinPath';
    return s.friends.some(f => f.place === 'receiver') ? 'buddies.joinCup' : 'buddies.joinShort';
  }
  if (failure === 'receiver') return 'buddies.cup';
  if (!plan.drop) return 'buddies.bridge';
  return bridge?.shape === 'flatten' ? 'buddies.stepFlat' : 'buddies.stepBridge';
}
/** Exploration never counts as a miss. Hint support belongs to the unresolved role, not the number of taps. */
export class SeedRound {
  state = initial();
  previous: Construction | null = null;
  phase: 'edit' | 'running' | 'caught' | 'carrying' | 'done' = 'edit';
  readonly shown = new Set<Failure>();
  readonly failures: Record<Failure, number> = { bridge: 0, receiver: 0 };
  hints = 0;
  misses = 0;
  constructor(readonly level = 1) {}
  get editable() { return this.phase === 'edit' || this.phase === 'caught'; }
  select(i: number) { if (this.editable && (i === 0 || i === 1)) this.state.selected = i; }
  edit(shape?: Shape, place?: Place): boolean {
    if (!this.editable) return false;
    const i = this.state.selected;
    if (place && place !== 'park' && this.state.friends.some((f, j) => j !== i && f.place === place)) return false;
    if ((!shape || shape === this.state.friends[i].shape) && (!place || place === this.state.friends[i].place)) return false;
    this.previous = copy(this.state);
    this.phase = 'edit';
    if (shape) this.state.friends[i].shape = shape;
    if (place) this.state.friends[i].place = place;
    return true;
  }
  undo(): boolean {
    if (!this.editable || !this.previous) return false;
    this.state = copy(this.previous); this.previous = null; this.phase = 'edit'; return true;
  }
  replay() { if (this.phase === 'caught') this.phase = 'edit'; }
  help(): Failure | null {
    const role = trace(this.state, this.level);
    if (role === 'caught') return null;
    if (!this.shown.has(role)) { this.shown.add(role); this.hints++; }
    return role;
  }
  trySeed(): Failure | 'caught' | null {
    if (this.phase !== 'edit') return null;
    this.phase = 'running'; return trace(this.state, this.level);
  }
  settle(result: Failure | 'caught') {
    if (this.phase !== 'running') return;
    this.phase = result === 'caught' ? 'caught' : 'edit';
    if (result !== 'caught' && ++this.failures[result] >= 2) this.help();
  }
  carry(): boolean { if (this.phase !== 'caught') return false; this.phase = 'carrying'; return true; }
  finish(): boolean { if (this.phase !== 'carrying') return false; this.phase = 'done'; return true; }
}
/** Level 2 raises only the chute's bank, so the bridge dock moves up with it. Level 3 widens the stream: the docks become a near and a far half, side by side. */
export function layout(w: number, h: number, level = 1) {
  const left = (w - 1024) / 2, plan = planFor(level);
  return {
    bridge: { x: left + (plan.joined ? 380 : 400), y: 300 - plan.drop }, receiver: { x: left + (plan.joined ? 580 : 630), y: 300 }, pot: { x: left + 870, y: 300 },
    receiverWidth: plan.joined ? 180 : 110,
    parks: [{ x: left + 250, y: 485 }, { x: left + 420, y: 485 }],
    tools: [{ x: left + 590, y: 485 }, { x: left + 740, y: 485 }, { x: left + 890, y: 485 }],
    buttons: [{ x: left + 340, y: h - 118 }, { x: left + 520, y: h - 118 }, { x: left + 700, y: h - 118 }],
  };
}
