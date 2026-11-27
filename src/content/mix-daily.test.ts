import { describe, expect, it } from 'vitest';
import { MixMemory, launchStop } from '../app/discovery';
import { GAMES } from '../games/registry';
import { BANDS } from '../progress/bands';
import { levelsInOrder } from '../progress/difficulty';
import { dailySix, DAILY_COUNT } from './daily';
import {
  dailyEndingLine,
  dailyStop,
  dailyStops,
  mixGames,
  nextUp,
  startDaily,
  step,
  type DailyStop,
} from './mix';

const DAY = '2026-11-25';
const bands = BANDS.map((b) => b.id);

describe("Today's six through the mix planner", () => {
  it('freezes the six in card order with a band and an on-ladder level, at every band', () => {
    for (const band of bands) {
      const picks = dailySix(DAY, band, GAMES);
      const stops = dailyStops(picks);
      expect(stops).toHaveLength(DAILY_COUNT);
      expect(stops.map((s) => s.id)).toEqual(picks.map((p) => p.mod.id));
      for (const stop of stops) {
        const mod = GAMES.find((m) => m.id === stop.id)!;
        expect(levelsInOrder(mod.levels(stop.band))).toContain(stop.level);
        // a daily stop is never refused for its band, and is the page's own game
        expect(dailyStop(band, GAMES, stop)?.id).toBe(stop.id);
      }
    }
  });

  it('starts ticked games played, and starts all upcoming again when all six are ticked', () => {
    const stops = dailyStops(dailySix(DAY, 'preschool', GAMES));
    const some = startDaily(stops, (id) => id === stops[1].id || id === stops[4].id);
    expect(some.items.map((i) => i.state)).toEqual([
      'upcoming',
      'played',
      'upcoming',
      'upcoming',
      'played',
      'upcoming',
    ]);
    expect(nextUp(some)).toBe(0);
    expect(startDaily(stops, () => true).items.every((i) => i.state === 'upcoming')).toBe(true);
    expect(nextUp(startDaily(stops, () => false))).toBe(0);
  });

  it('keeps the planner rules: an item leaves upcoming once, a played one is never skipped, a stale round is ignored', () => {
    const stops = dailyStops(dailySix(DAY, 'prek', GAMES));
    let s = startDaily(stops, (id) => id === stops[0].id);
    s = step(s, { type: 'skip', p: 0 });
    expect(s.items[0].state).toBe('played');
    s = step(s, { type: 'launch', p: 1 });
    const stale = s.round;
    s = step(s, { type: 'launch', p: 1 });
    expect(step(s, { type: 'finish', round: stale, seed: 3 })).toBe(s);
    s = step(s, { type: 'finish', round: s.round, seed: 3 });
    expect(step(s, { type: 'skip', p: 1 }).items[1].state).toBe('played');
  });

  it('says the quiet ending only when every stop was hopped over', () => {
    const stops = dailyStops(dailySix(DAY, 'toddler', GAMES));
    let s = startDaily(stops, () => false);
    for (let p = 0; p < 6; p++) s = step(s, { type: 'skip', p });
    expect(dailyEndingLine(s)).toBe('daily.end.quiet');
    expect(dailyEndingLine(startDaily(stops, (id) => id === stops[0].id))).toBe('daily.end');
  });

  it('refuses a stop whose game, band or level has changed, never another game', () => {
    const [stop] = dailyStops(dailySix(DAY, 'preschool', GAMES));
    expect(dailyStop('preschool', GAMES, undefined)).toBeNull();
    expect(dailyStop('preschool', GAMES, { ...stop, id: 'no-such-game' })).toBeNull();
    expect(dailyStop('preschool', GAMES, { ...stop, level: 999999 })).toBeNull();
    expect(dailyStop('preschool', GAMES, { ...stop, band: 'grownup' })).toBeNull();
    expect(
      dailyStop(
        'preschool',
        GAMES.filter((m) => m.id !== stop.id),
        stop,
      ),
    ).toBeNull();
  });

  it('leaves the place mix to lap and toddler on their own home spot', () => {
    for (const band of bands.filter((b) => b !== 'lap' && b !== 'toddler'))
      expect(mixGames(band, band, GAMES)).toBeNull();
    expect(mixGames('lap', 'toddler', GAMES)).toBeNull();
  });

  it('launches a daily stop as its card does and a place stop as D2b does', () => {
    const owner = {};
    const mix = new MixMemory();
    const stops: DailyStop[] = dailyStops(dailySix(DAY, 'preschool', GAMES));
    mix.startDaily(
      owner,
      stops,
      startDaily(stops, () => false),
      'preschool',
      DAY,
    );
    const calls: unknown[][] = [];
    const go = { game: (...a: unknown[]) => void calls.push(a) } as never;
    launchStop(go, mix.live(owner)!, 2, 'preschool');
    expect(calls[0]).toEqual([stops[2].id, stops[2].band, undefined, false, { daily: true }, stops[2].level]);
    // a daily session is never a home spot's mix
    expect(mix.at(owner, 'preschool')).toBeUndefined();
    mix.start(owner, 'lap');
    launchStop(go, mix.live(owner)!, 0, 'lap');
    expect(calls[1].slice(2)).toEqual([undefined, false, { place: 'lap' }]);
    expect(mix.at(owner, 'lap')).toBeDefined();
  });

  it('forgets a late finish after the session ended, and freezes its stops', () => {
    const owner = {};
    const mix = new MixMemory();
    const stops = dailyStops(dailySix(DAY, 'school', GAMES));
    mix.startDaily(
      owner,
      stops,
      startDaily(stops, () => false),
      'school',
      DAY,
    );
    const round = mix.launch(owner, 0)!;
    expect(Object.isFrozen(mix.live(owner)!.stops)).toBe(true);
    mix.end();
    mix.finish(round, owner, 5);
    expect(mix.live(owner)).toBeUndefined();
  });
});

describe("Today's six preview layout", () => {
  const views = [
    { w: 1536, h: 1024 },
    { w: 1024, h: 1365 },
    { w: 1024, h: 2214 },
    { w: 768, h: 1024 },
  ];
  it('keeps six tiles at least 100 across, inside the view, apart, and Skip and Play clear of them', async () => {
    const { sheetPlaces } = await import('../ui/mix');
    for (const view of views) {
      const p = sheetPlaces(6, view);
      expect(p.size).toBeGreaterThanOrEqual(100);
      p.tiles.forEach((t, i) => {
        expect(t.x - p.size / 2).toBeGreaterThanOrEqual(0);
        expect(t.x + p.size / 2).toBeLessThanOrEqual(view.w);
        expect(t.y + p.size / 2).toBeLessThanOrEqual(view.h);
        p.tiles.slice(i + 1).forEach((u) => {
          expect(Math.abs(t.x - u.x) >= p.size || Math.abs(t.y - u.y) >= p.size).toBe(true);
        });
        for (const b of [p.skips[i], p.play])
          expect(Math.abs(t.x - b.x) >= p.size / 2 + 56 || Math.abs(t.y - b.y) >= p.size / 2 + 56).toBe(true);
      });
      expect(p.play.y + 70).toBeLessThanOrEqual(view.h);
    }
  });
});
