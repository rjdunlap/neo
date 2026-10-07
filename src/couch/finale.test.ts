import { describe, expect, it } from 'vitest';
import { finaleOf, namerOf, stopLabel, verdictOf } from './finale';
import { couchDefaults, newParty, STOPS, UNLOCK_TIERS, type CouchId, type CouchRound, type CouchSave, type StopWinner } from './party';

const round = (id: CouchId, winner?: StopWinner): CouchRound => ({ id, seed: 1, level: 3, misses: 0, hints: 0, ...(winner === undefined ? {} : { winner }) });
const trip = (mode: 'together' | 'faceoff', rounds: CouchRound[], trips = 1): CouchSave => {
  const save = couchDefaults();
  save.trips = trips;
  save.party = newParty(mode, 5);
  save.party.rounds = rounds;
  return save;
};
const SIX: CouchId[] = ['penguin-slide', 'bouncy-launch', 'bounce-back', 'penguin-slide', 'bouncy-launch', 'bounce-back'];

describe('the trip finale', () => {
  it('waits for the sixth stop', () => {
    expect(finaleOf(couchDefaults())).toBe(null);
    expect(finaleOf(trip('together', SIX.slice(0, STOPS - 1).map(id => round(id))))).toBe(null);
  });

  it('gives a Together trip no winner and every lantern to both', () => {
    const f = finaleOf(trip('together', SIX.map(id => round(id))))!;
    expect(f.faceoff).toBe(false);
    expect(f.lead).toBe(null);
    expect(f.stops.every(s => s.owner === 'both')).toBe(true);
    expect(f.verdict).toMatch(/whole trip together/);
    expect(f.stops.map(s => stopLabel(s, false))).toEqual(Array(STOPS).fill('lit together'));
  });

  it('names a face-off winner without ever naming a loser, and ties score for both', () => {
    const f = finaleOf(trip('faceoff',[round('penguin-slide', 0), round('bouncy-launch', 0), round('bounce-back', 'team'), round('penguin-slide', 1), round('bouncy-launch', 'tie'), round('bounce-back', 'team')]))!;
    expect(f.score).toEqual([5, 4]);
    expect(f.lead).toBe(0);
    expect(f.verdict).toBe('Player 1 wins 5 to 4, and you both lit all six lanterns!');
    expect(f.stops.map(s => s.owner)).toEqual([0, 0, 'both', 1, 'both', 'both']);
    expect(f.stops.map(s => stopLabel(s, true))).toEqual(['Player 1 won', 'Player 1 won', 'team stop', 'Player 2 won', 'a tie', 'team stop']);
    expect(f.verdict).not.toMatch(/los/i);
  });

  it('uses the players’ own names when they have them, and falls back to Player 1 and Player 2', () => {
    const rounds = [round('penguin-slide', 0), round('bouncy-launch', 0), round('bounce-back', 'team'), round('penguin-slide', 1), round('bouncy-launch', 0), round('bounce-back', 'team')];
    const save = trip('faceoff', rounds);
    save.names = ['Rob', ''];
    const f = finaleOf(save)!;
    expect(f.score).toEqual([5, 3]);
    expect(f.verdict).toBe('Rob wins 5 to 3, and you both lit all six lanterns!');
    expect(f.stops.map(s => stopLabel(s, true, namerOf(save.names)))).toEqual(['Rob won', 'Rob won', 'team stop', 'Player 2 won', 'Rob won', 'team stop']);
    expect(namerOf(['  ', 'Sam'])(0)).toBe('Player 1');
    expect(namerOf(undefined)(1)).toBe('Player 2');
    expect(verdictOf(save.party!, namerOf(['A', 'B']))).toMatch(/^A wins/);
  });

  it('calls a level face-off a win for both', () => {
    const f = finaleOf(trip('faceoff', [round('penguin-slide', 0), round('bouncy-launch', 1), ...SIX.slice(2).map(id => round(id, 'team'))]))!;
    expect(f.lead).toBe('tie');
    expect(f.verdict).toBe('It ended 5 to 5: you both win the evening!');
    expect(verdictOf(trip('faceoff', SIX.map(id => round(id, 'team')).slice(0, STOPS)).party!)).toBe('It ended 6 to 6: you both win the evening!');
  });

  it('announces the games the trip opened, and how many the next one will', () => {
    const rounds = SIX.map(id => round(id));
    const first = finaleOf(trip('together', rounds, 1))!;
    expect(first.opened).toEqual([...UNLOCK_TIERS[1]]);
    expect(first.next).toBe(UNLOCK_TIERS[2].length);
    const last = finaleOf(trip('together', rounds, UNLOCK_TIERS.length - 1))!;
    expect(last.opened).toEqual([...UNLOCK_TIERS[UNLOCK_TIERS.length - 1]]);
    expect(last.next).toBe(null);
    const beyond = finaleOf(trip('together', rounds, UNLOCK_TIERS.length + 4))!;
    expect(beyond.opened).toEqual([]);
    expect(beyond.next).toBe(null);
  });
});
