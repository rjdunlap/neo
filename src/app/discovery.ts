import type { Origin, Routes } from './App';
import type { Band } from '../progress/bands';
import { startMix, step, type MixEvent, type MixState } from '../content/mix';

export type DiscoveryToken = { owner: object; epoch: number };

/** Per-profile visit memory. Replacing a save (switch/reset/restore/undo) invalidates its callbacks too. */
export class DiscoveryMemory {
  private owner?: object;
  private epoch = 0;
  last?: string;

  clear() { this.owner = undefined; this.last = undefined; this.epoch++; }
  token(owner: object): DiscoveryToken {
    if (owner !== this.owner) { this.clear(); this.owner = owner; }
    return { owner, epoch: this.epoch };
  }
  current(token: DiscoveryToken, owner: object): boolean {
    return token.owner === owner && token.owner === this.owner && token.epoch === this.epoch;
  }
  displayed(token: DiscoveryToken, owner: object, id: string): void {
    if (this.current(token, owner)) this.last = id;
  }
}
export const discoveryMemory = new DiscoveryMemory();

/** The ordinary route resolves the current band, ordered range and pin; no cached level or Again shortcut. */
export function launchDiscovery(go: Pick<Routes, 'game'>, id: string, band: Band, origin?: Origin) {
  go.game(id, band, undefined, false, origin);
}

/** A round launched by the mix: which session, which stop, which round. Only the scene that claimed it is in the mix. */
export interface MixRound { session: number; p: number; round: number }
interface MixSession { owner: object; id: number; place: Band; state: MixState }

/**
 * The live Little surprises session (D2b), in memory only. It belongs to one save object: a profile switch, reset,
 * restore or undo replaces `store.data`, so late finishes and taps from the old session do nothing; a reload forgets it.
 */
export class MixMemory {
  private session?: MixSession;
  private pending?: MixRound;
  private serial = 0;

  start(owner: object, place: Band): number {
    this.pending = undefined;
    this.session = { owner, id: ++this.serial, place, state: startMix() };
    return this.session.id;
  }
  end() { this.session = undefined; this.pending = undefined; this.serial++; }
  live(owner: object): Readonly<MixSession> | undefined {
    return this.own(owner);
  }
  private own(owner: object): MixSession | undefined {
    return this.session?.owner === owner ? this.session : undefined;
  }
  /** The state of a live session for this save, at the place it started from. */
  at(owner: object, place: Band): MixState | undefined {
    const s = this.live(owner);
    return s?.place === place ? s.state : undefined;
  }
  apply(owner: object, event: MixEvent): MixState | undefined {
    const s = this.own(owner);
    if (s) s.state = step(s.state, event);
    return s?.state;
  }
  /** A new round at stop `p`: the next GameScene built claims it. */
  launch(owner: object, p: number): MixRound | undefined {
    const s = this.own(owner);
    if (!s) return undefined;
    s.state = step(s.state, { type: 'launch', p });
    return this.pending = { session: s.id, p, round: s.state.round };
  }
  claim(owner: object): MixRound | undefined {
    const r = this.pending;
    this.pending = undefined;
    return r && this.current(r, owner) ? r : undefined;
  }
  /** This round is the mix's current one: a replaced, abandoned or relaunched round is not. */
  current(r: MixRound, owner: object): boolean {
    const s = this.live(owner);
    return !!s && s.id === r.session && s.state.round === r.round;
  }
  /** Settles the round's stop once, on its first completed round. */
  finish(r: MixRound, owner: object, seed: number): void {
    if (this.current(r, owner)) this.apply(owner, { type: 'finish', round: r.round, seed });
  }
}
export const mixMemory = new MixMemory();
