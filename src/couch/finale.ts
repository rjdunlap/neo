import { COUCH_INFO } from './catalog';
import { nextTier, STOPS, tally, UNLOCK_TIERS, type CouchId, type CouchSave, type Party } from './party';

/** Whose lantern a stop lit: a player, both of them (a tie, a team game, or any stop of a Together trip). */
export type LanternOwner = 0 | 1 | 'both';

export interface FinaleStop {
  id: CouchId;
  owner: LanternOwner;
  /** The stop was finished with help (no judgement, just the same note the chooser makes). */
  helped: boolean;
}

export interface Finale {
  faceoff: boolean;
  /** Stops each player won. A tie or team stop counts for both. */
  score: [number, number];
  /** Who finished ahead; `tie` when level. Null on a Together trip, which has no winner. */
  lead: 0 | 1 | 'tie' | null;
  verdict: string;
  stops: FinaleStop[];
  /** Games this trip opened, whether or not anyone has seen them explained, and how many the next trip opens. */
  opened: CouchId[];
  next: number | null;
}

/** What a player is called: their own name, or "Player 1" and "Player 2". */
export type Namer = (player: number) => string;
const plain: Namer = (player) => `Player ${player + 1}`;
export const namerOf = (names: readonly string[] | undefined): Namer => (player) => names?.[player]?.trim() || plain(player);

/** The sentence that closes a trip. Nobody loses: both players always light every lantern. */
export function verdictOf(p: Party, who: Namer = plain): string {
  if (p.mode !== 'faceoff') return 'You made a whole trip together. Stay here, stop for the evening, or set out again.';
  const [a, b] = tally(p);
  if (a === b) return `It ended ${a} to ${b}: you both win the evening!`;
  return `${who(a > b ? 0 : 1)} wins ${Math.max(a, b)} to ${Math.min(a, b)}, and you both lit all six lanterns!`;
}

/** Everything the finale screen shows, from the save alone. Null until all six stops are done. */
export function finaleOf(save: CouchSave): Finale | null {
  const p = save.party;
  if (!p || p.rounds.length < STOPS) return null;
  const faceoff = p.mode === 'faceoff';
  const score = tally(p);
  const stops = p.rounds.map<FinaleStop>(r => ({
    id: r.id,
    owner: faceoff && (r.winner === 0 || r.winner === 1) ? r.winner : 'both',
    helped: r.hints > 0,
  }));
  return {
    faceoff,
    score,
    lead: faceoff ? (score[0] === score[1] ? 'tie' : score[0] > score[1] ? 0 : 1) : null,
    verdict: verdictOf(p, namerOf(save.names)),
    stops,
    // Finishing trip N opens tier N (tier 0 is there from the start).
    opened: [...(UNLOCK_TIERS[save.trips] ?? [])],
    next: nextTier(save.trips)?.length ?? null,
  };
}

/** What a stop is called on the finale's recap: the game, and who took it. */
export function stopLabel(stop: FinaleStop, faceoff: boolean, who: Namer = plain): string {
  if (!faceoff) return 'lit together';
  if (stop.owner === 'both') return COUCH_INFO[stop.id].faceoff === 'team' ? 'team stop' : 'a tie';
  return `${who(stop.owner)} won`;
}
