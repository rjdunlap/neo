import type { Origin, Routes } from './App';
import type { Band } from '../progress/bands';
import type { PickScope } from '../content/pick';
import {
  hydrateSession,
  MIX_IDS,
  savedSession,
  startMix,
  step,
  type DailyStop,
  type MixEvent,
  type MixState,
} from '../content/mix';
import { isMixPlace, type SavedMix } from '../content/saved-mix';
import type { GameModule } from '../games/types';
import { store } from '../progress/store';

export type DiscoveryToken = { owner: object; epoch: number };

/** Per-profile visit memory. Replacing a save (switch/reset/restore/undo) invalidates its callbacks too. */
export class DiscoveryMemory {
  private owner?: object;
  private epoch = 0;
  last?: string;

  clear() {
    this.owner = undefined;
    this.last = undefined;
    this.epoch++;
  }
  token(owner: object): DiscoveryToken {
    if (owner !== this.owner) {
      this.clear();
      this.owner = owner;
    }
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

/** The most introductions remembered; the oldest go first. */
export const INTRO_LIMIT = 64;

/**
 * Which full how-to cards she has pressed Play on this visit (D4b): in memory only, per save object, never saved or shown.
 * It is UI support state, not mastery. A profile switch or a replaced save forgets it; a stale scene cannot read or write it.
 */
export class IntroMemory {
  private keys: string[] = [];
  private readonly owner = new DiscoveryMemory();

  clear() {
    this.keys = [];
    this.owner.clear();
  }
  token(owner: object): DiscoveryToken {
    const before = this.owner.token(owner);
    return before;
  }
  has(token: DiscoveryToken, owner: object, key: string): boolean {
    return this.owner.current(token, owner) && this.keys.includes(key);
  }
  /** Play was pressed on a full card. */
  introduced(token: DiscoveryToken, owner: object, key: string): void {
    if (!this.owner.current(token, owner)) return;
    this.keys = this.keys.filter((k) => k !== key);
    this.keys.push(key);
    if (this.keys.length > INTRO_LIMIT) this.keys.splice(0, this.keys.length - INTRO_LIMIT);
  }
}
export const introMemory = new IntroMemory();

/** The ordinary route resolves the current band, ordered range and pin; no cached level or Again shortcut. */
export function launchDiscovery(go: Pick<Routes, 'game'>, id: string, band: Band, origin?: Origin) {
  go.game(id, band, undefined, false, origin);
}

/** A round launched by the mix: which session, which stop, which round. Only the scene that claimed it is in the mix. */
export interface MixRound {
  session: number;
  p: number;
  round: number;
  /** What the stop card says before the stop's title: a hop over the stop before it (D3). */
  lead?: 'mix.skip';
}
export interface MixSession {
  owner: object;
  id: number;
  place: Band;
  state: MixState;
  /** The stops, frozen when it started. */ readonly ids: readonly string[];
  /** Today's six (D10 slice 3): each stop's band and preset level. A place session has none. */
  readonly stops?: readonly DailyStop[];
  /** The day those stops were dealt for: a later day ends the session. */
  readonly day?: string;
}
/** Opens stop `p` exactly as its own entry would: a daily stop as its card does, a place stop on its home spot (D2b). */
export function launchStop(go: Pick<Routes, 'game'>, s: Readonly<MixSession>, p: number, profileBand: Band) {
  const stop = s.stops?.[p];
  if (stop) go.game(stop.id, stop.band, undefined, false, { daily: true }, stop.level);
  else go.game(s.ids[p], profileBand, undefined, false, { place: s.place });
}

/** Where a mix's Home, Back and ending go: Today's six for a daily session, else its home spot. */
export function leaveMix(go: Pick<Routes, 'daily' | 'place'>, s: Readonly<MixSession>) {
  if (s.stops) go.daily();
  else go.place(s.place);
}

interface HeldLineup {
  owner: object;
  place: Band;
  ids: readonly string[];
}

/** The save a mix belongs to, when the owner is a save (tests may use a bare object, which saves nothing). */
const savedOf = (owner: object): SavedMix | undefined => {
  const mix = (owner as { mix?: SavedMix }).mix;
  return mix && typeof mix === 'object' && mix.lineups ? mix : undefined;
};
const sameIds = (a: readonly string[], b: readonly string[]) =>
  a.length === b.length && a.every((id, i) => id === b[i]);

/**
 * The live Little surprises session (D2b), in memory. It belongs to one save object: a profile switch, reset, restore or
 * undo replaces `store.data`, so late finishes and taps from the old session do nothing.
 *
 * The saved mix (D5b): each start, settle and end of a place session, and each lineup edit, is mirrored into that save's
 * `mix` field at once and `persist` asks for the debounced write, as any setting does. A round's settle is mirrored in the
 * same synchronous block as its sticker, before `GameScene` flushes, so one write holds both. A reload forgets the live
 * session but keeps the saved one, which the next tap on the mix spot hydrates (`hydrate`).
 */
export class MixMemory {
  private session?: MixSession;
  private pending?: MixRound;
  private serial = 0;
  /** The grown-up's chosen lineup (D5a): kept across sessions until the save object changes or the page reloads. */
  private held?: HeldLineup;

  constructor(private readonly persist: (owner: object) => void = (o) => o === store.data && store.save()) {}

  start(owner: object, place: Band, ids: readonly string[] = MIX_IDS): number {
    this.pending = undefined;
    const frozen = Object.freeze([...ids]);
    this.session = { owner, id: ++this.serial, place, state: startMix(frozen), ids: frozen };
    this.mirror(this.session);
    return this.session.id;
  }
  /** Play all on Today's six: the page's six frozen with their bands and levels; played ones start played. Never saved. */
  startDaily(owner: object, stops: readonly DailyStop[], state: MixState, place: Band, day: string): number {
    this.pending = undefined;
    const frozen = Object.freeze(stops.map((s) => Object.freeze({ ...s })));
    const ids = Object.freeze(frozen.map((s) => s.id));
    this.session = { owner, id: ++this.serial, place, state, ids, stops: frozen, day };
    return this.session.id;
  }
  /** She left the mix (Explore, Home on the ending, any other screen): the live session ends and its saved copy with it. */
  end() {
    const s = this.session;
    this.drop();
    if (s && !s.stops) this.clearSaved(s.owner);
  }
  private drop() {
    this.session = undefined;
    this.pending = undefined;
    this.serial++;
  }
  /** A different player, or a replaced save: the session and the held lineup both go; each save keeps its own saved mix. */
  forget() {
    this.drop();
    this.held = undefined;
  }
  /** The held lineup for this save at this home spot, if a grown-up has edited one (this visit, or saved before). */
  lineup(owner: object, place: Band): readonly string[] | undefined {
    if (this.held?.owner === owner && this.held.place === place) return this.held.ids;
    return isMixPlace(place) ? savedOf(owner)?.lineups[place] : undefined;
  }
  /** The lineup, saved as it is made. The default lineup is saved as no lineup, so Reset brings Little surprises back. */
  hold(owner: object, place: Band, ids: readonly string[]) {
    this.held = { owner, place, ids: [...ids] };
    const mix = savedOf(owner);
    if (!mix || !isMixPlace(place)) return;
    const was = mix.lineups[place];
    const next = sameIds(ids, MIX_IDS) ? undefined : [...ids];
    if (was === next || (was && next && sameIds(was, next))) return;
    if (next) mix.lineups[place] = next;
    else delete mix.lineups[place];
    this.persist(owner);
  }
  /**
   * With no live session, makes this save's unfinished mix at this home spot live again, checked now (`hydrateSession`).
   * True when it did. A saved session that cannot be offered here is cleared, so the tap starts an ordinary new mix.
   */
  hydrate(
    owner: object,
    place: Band,
    catalog: readonly Pick<GameModule, 'id' | 'bands' | 'inputs'>[],
    profileBand: Band,
  ): boolean {
    if (this.live(owner)) return false;
    const mix = savedOf(owner);
    if (!mix?.session) return false;
    const stickers = (owner as { stickers?: { game: string; seed: number }[] }).stickers ?? [];
    const h = hydrateSession(mix.session, catalog, stickers, profileBand, place);
    if (!h) {
      this.clearSaved(owner);
      return false;
    }
    this.pending = undefined;
    this.session = { owner, id: ++this.serial, place, state: h.state, ids: Object.freeze([...h.ids]) };
    this.mirror(this.session);
    return true;
  }
  /** A saved session that her band or home spot no longer offers (a birthday): cleared when the spot is shown. */
  discardStale(owner: object, profileBand: Band) {
    const s = savedOf(owner)?.session;
    if (s && s.place !== profileBand) this.clearSaved(owner);
  }
  private mirror(s: MixSession) {
    const mix = savedOf(s.owner);
    if (!mix || s.stops || !isMixPlace(s.place)) return;
    mix.session = savedSession(s.place, s.ids, s.state);
    this.persist(s.owner);
  }
  private clearSaved(owner: object) {
    const mix = savedOf(owner);
    if (!mix?.session) return;
    mix.session = null;
    this.persist(owner);
  }
  live(owner: object): Readonly<MixSession> | undefined {
    return this.own(owner);
  }
  private own(owner: object): MixSession | undefined {
    return this.session?.owner === owner ? this.session : undefined;
  }
  /** The state of a live session for this save, at the place it started from. */
  at(owner: object, place: Band): MixState | undefined {
    const s = this.live(owner);
    return s?.place === place && !s.stops ? s.state : undefined;
  }
  apply(owner: object, event: MixEvent): MixState | undefined {
    const s = this.own(owner);
    if (!s) return undefined;
    s.state = step(s.state, event);
    if (event.type !== 'launch') this.mirror(s);
    return s.state;
  }
  /** A new round at stop `p`: the next GameScene built claims it. */
  launch(owner: object, p: number, lead?: MixRound['lead']): MixRound | undefined {
    const s = this.own(owner);
    if (!s) return undefined;
    s.state = step(s.state, { type: 'launch', p });
    return (this.pending = { session: s.id, p, round: s.state.round, ...(lead ? { lead } : {}) });
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

/**
 * Pick for me (D7a), in memory only: the scope she last chose and the game she last opened from a pick, for one save object.
 * A profile switch, reset, restore or undo replaces `store.data` (and `forget` runs), a reload loses it. Nothing is saved.
 */
export class PickMemory {
  private owner?: object;
  private chosen?: PickScope;
  private lastPlayed?: string;

  forget() {
    this.owner = undefined;
    this.chosen = undefined;
    this.lastPlayed = undefined;
  }
  private mine(owner: object): boolean {
    if (this.owner !== owner) {
      this.forget();
      this.owner = owner;
    }
    return true;
  }
  scope(owner: object): PickScope | undefined {
    return this.owner === owner ? this.chosen : undefined;
  }
  last(owner: object): string | undefined {
    return this.owner === owner ? this.lastPlayed : undefined;
  }
  choose(owner: object, scope: PickScope) {
    if (this.mine(owner)) this.chosen = scope;
  }
  played(owner: object, id: string) {
    if (this.mine(owner)) this.lastPlayed = id;
  }
}
export const pickMemory = new PickMemory();
