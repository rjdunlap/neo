import { describe, expect, it } from 'vitest';
import {
  awardStamps,
  cleanStamps,
  goalsFor,
  MAX_STAMPS,
  newStamps,
  STAMP_BONUS,
  stampId,
  stampLabel,
  type Stamp,
} from './stamps';
import { emptyShells, MAX_BALANCE } from './shells';
import { defaults, migrate } from '../progress/save';
import { GAMES } from '../games/registry';

const LADDER = { min: 1, max: 9 };
const round = (level: number, misses = 0, hints = 0) => ({ level, misses, hints });

describe('stamps', () => {
  it('reads four goals from a ladder, fewer from a short one', () => {
    expect(goalsFor(LADDER)).toEqual([
      { kind: 'first', level: null },
      { kind: 'middle', level: 5 },
      { kind: 'top', level: 9 },
      { kind: 'clean', level: 9 },
    ]);
    expect(goalsFor({ min: 3, max: 4 }).map((g) => g.kind)).toEqual(['first', 'top', 'clean']);
    expect(goalsFor({ min: 2, max: 2 }).map((g) => g.kind)).toEqual(['first', 'clean']);
    // A band's own order: the middle and top come from it, not from the IDs.
    expect(goalsFor({ min: 1, max: 12, order: [12, 1, 2, 3, 4] })).toEqual([
      { kind: 'first', level: null },
      { kind: 'middle', level: 2 },
      { kind: 'top', level: 4 },
      { kind: 'clean', level: 4 },
    ]);
  });

  it('a round earns what it meets, once; help counts except for the clean stamp', () => {
    expect(newStamps([], 'tile-pairs', 'grownup', LADDER, round(2, 3, 1))).toEqual(['first']);
    expect(newStamps([], 'tile-pairs', 'grownup', LADDER, round(6))).toEqual(['first', 'middle']);
    expect(newStamps([], 'tile-pairs', 'grownup', LADDER, round(9, 2, 1))).toEqual([
      'first',
      'middle',
      'top',
    ]);
    expect(newStamps([], 'tile-pairs', 'grownup', LADDER, round(9))).toEqual([
      'first',
      'middle',
      'top',
      'clean',
    ]);
    const held: Stamp[] = [{ id: stampId('tile-pairs', 'first'), at: 1 }];
    expect(newStamps(held, 'tile-pairs', 'grownup', LADDER, round(5))).toEqual(['middle']);
    // A level off the ladder (another band's) earns only the first round.
    expect(newStamps([], 'tile-pairs', 'grownup', { min: 3, max: 9 }, round(1))).toEqual(['first']);
  });

  it('only grown-ups earn them for now', () => {
    for (const band of ['lap', 'toddler', 'preschool', 'prek', 'school'] as const)
      expect(newStamps([], 'tile-pairs', band, LADDER, round(9))).toEqual([]);
  });

  it('pays each stamp its bonus once, within the largest balance', () => {
    const r = awardStamps([], emptyShells(), 'tile-pairs', ['first', 'top'], 5);
    expect(r.bonus).toBe(STAMP_BONUS.first + STAMP_BONUS.top);
    expect(r.shells.balance).toBe(40);
    expect(r.stamps.map((s) => s.id)).toEqual(['tile-pairs:first', 'tile-pairs:top']);
    const again = awardStamps(r.stamps, r.shells, 'tile-pairs', ['first'], 6);
    expect(again.bonus).toBe(0);
    expect(again.stamps).toHaveLength(2);
    const full = awardStamps([], { ...emptyShells(), balance: MAX_BALANCE - 3 }, 'x', ['clean'], 1);
    expect(full.shells.balance).toBe(MAX_BALANCE);
    expect(full.bonus).toBe(3);
  });

  it('repairs a damaged list', () => {
    expect(cleanStamps('no')).toEqual([]);
    expect(
      cleanStamps([
        { id: 'tile-pairs:top', at: 3 },
        { id: 'tile-pairs:top', at: 4 },
        { id: 'tile-pairs:gold', at: 1 },
        { id: 'Bad:first', at: 1 },
        { id: ':first' },
        { id: 'word-code:clean', at: 'x' },
        7,
      ]),
    ).toEqual([
      { id: 'tile-pairs:top', at: 3 },
      { id: 'word-code:clean', at: 0 },
    ]);
    const many = Array.from({ length: MAX_STAMPS + 5 }, (_, i) => ({ id: `g${i}:first`, at: i }));
    expect(cleanStamps(many)).toHaveLength(MAX_STAMPS);
  });

  it('an older save holds none, and a save keeps them', () => {
    const old = defaults() as unknown as Record<string, unknown>;
    delete old.stamps;
    expect(migrate(old).stamps).toEqual([]);
    const d = defaults();
    d.stamps = [{ id: 'tile-pairs:first', at: 9 }];
    expect(migrate(JSON.parse(JSON.stringify(d))).stamps).toEqual(d.stamps);
  });

  it('every grown-up game has goals whose words name real levels', () => {
    const grown = GAMES.filter((g) => g.bands.includes('grownup'));
    expect(grown.length).toBeGreaterThan(20);
    for (const g of grown) {
      const goals = goalsFor(g.levels('grownup'));
      expect(goals[0].kind).toBe('first');
      expect(goals.at(-1)!.kind).toBe('clean');
      for (const goal of goals) expect(stampLabel(goal, (l) => g.describeLevel(l)).length).toBeGreaterThan(5);
    }
  });
});
