import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { BrowserEventTarget } from '../test-support/events';
import { GAMES } from '../games/registry';
import { defaults } from '../progress/save';
import { store } from '../progress/store';
import { MixMemory } from '../app/discovery';
import { gamesFor } from '../app/scenes/PlaceScene';
import { Tweener } from '../engine/tween';
import { inlineFits } from '../ui/howto-card';
import { sheetPlaces, sheetTiles } from '../ui/mix';
import { UPRIGHT_VIEWS } from '../games/upright-check';
import { MixTable } from '../ui/mix-table';
import {
  lineup,
  MIX_IDS,
  MIX_MAX,
  mixPlayable,
  mixPool,
  mixStop,
  nextUp,
  repairLineup,
  startMix,
  step,
} from './mix';

const finishAt = (s: ReturnType<typeof startMix>, p: number, seed: number) => {
  const launched = step(s, { type: 'launch', p });
  return step(launched, { type: 'finish', round: launched.round, seed });
};

describe('Make my mix: lineup edits', () => {
  it('adds at the end up to five, a repeat being its own entry, and refuses a sixth', () => {
    let ids = lineup.reset();
    expect(ids).toEqual([...MIX_IDS]);
    ids = lineup.add(ids, 'bubble-pop');
    ids = lineup.add(ids, 'fill-dump');
    expect(ids).toEqual([...MIX_IDS, 'bubble-pop', 'fill-dump']);
    expect(ids.length).toBe(MIX_MAX);
    expect(lineup.add(ids, 'peekaboo-barn')).toBe(ids);
  });
  it('moves keep the length and the multiset; out-of-range moves change nothing', () => {
    const ids = ['a', 'b', 'a', 'c'];
    const moved = lineup.move(ids, 3, 0);
    expect(moved).toEqual(['c', 'a', 'b', 'a']);
    expect([...moved].sort()).toEqual([...ids].sort());
    expect(lineup.move(ids, 0, 9)).toEqual(['b', 'a', 'c', 'a']);
    expect(lineup.move(ids, 7, 0)).toBe(ids);
  });
  it('removes one entry by position, never the last', () => {
    expect(lineup.remove(['a', 'b', 'a'], 2)).toEqual(['a', 'b']);
    const one = ['a'];
    expect(lineup.remove(one, 0)).toBe(one);
  });
});

describe('Make my mix: the pool', () => {
  it("is her home spot's touch games at her band, in the place's order, at lap and toddler only", () => {
    for (const band of ['lap', 'toddler'] as const) {
      const place = gamesFor(band).map((g) => g.id);
      const pool = mixPool(band, place, GAMES);
      expect(pool.length).toBeGreaterThan(MIX_MAX);
      expect(pool).toEqual(place.filter((id) => pool.includes(id)));
      for (const id of pool)
        expect(
          mixPlayable(
            GAMES.find((m) => m.id === id),
            band,
          ),
        ).toBe(true);
      for (const id of MIX_IDS) expect(pool).toContain(id);
    }
    expect(
      mixPool(
        'preschool',
        gamesFor('preschool').map((g) => g.id),
        GAMES,
      ),
    ).toEqual([]);
  });
  it('never holds a grown-up game, a controller-only game or one she would play at another band', () => {
    const grownup = GAMES.filter((g) => g.bands.every((b) => b === 'grownup'));
    expect(grownup.length).toBeGreaterThan(0);
    const place = [...grownup.map((g) => g.id), 'bubble-pop'];
    expect(mixPool('lap', place, GAMES)).toEqual(['bubble-pop']);
    const controller = GAMES.map((m) =>
      m.id === 'fill-dump' ? { ...m, inputs: ['controller' as const] } : m,
    );
    expect(mixPool('lap', ['fill-dump', 'bubble-pop'], controller)).toEqual(['bubble-pop']);
    const older = GAMES.map((m) =>
      m.id === 'bubble-pop' ? { ...m, bands: m.bands.filter((b) => b !== 'toddler') } : m,
    );
    expect(mixPool('toddler', ['bubble-pop', 'fill-dump'], older)).toEqual(['fill-dump']);
  });
  it('repair drops what left the pool, keeping order and repeats, and falls back to the default', () => {
    expect(repairLineup(['x', 'bubble-pop', 'y', 'bubble-pop'], ['bubble-pop', 'fill-dump'])).toEqual([
      'bubble-pop',
      'bubble-pop',
    ]);
    expect(repairLineup(['x', 'y'], ['bubble-pop'])).toEqual([...MIX_IDS]);
  });
});

describe('Make my mix: sessions', () => {
  let mix: MixMemory;
  beforeEach(() => {
    mix = new MixMemory();
    store.data = defaults();
  });

  it('one upcoming item per entry; a five-stop run with a repeat settles each position once, each with its own sticker', () => {
    const ids = ['bubble-pop', 'fill-dump', 'bubble-pop', 'sing-along-barn', 'fill-dump'];
    let s = startMix(ids);
    expect(s.items.length).toBe(5);
    for (let p = 0; p < 5; p++) s = finishAt(s, p, 10 + p);
    s = finishAt(s, 2, 99); // Again on the repeat: the position stays as first played
    expect(s.items.map((i) => i.seed)).toEqual([10, 11, 12, 13, 14]);
    expect(nextUp(s)).toBeNull();
  });
  it("freezes the session's lineup: editing the held one later never changes it", () => {
    const owner = store.data;
    mix.hold(owner, 'lap', ['fill-dump', 'bubble-pop']);
    mix.start(owner, 'lap', mix.lineup(owner, 'lap'));
    mix.hold(owner, 'lap', ['peekaboo-barn']);
    expect(mix.live(owner)!.ids).toEqual(['fill-dump', 'bubble-pop']);
    expect(mix.live(owner)!.state.items.length).toBe(2);
    expect(Object.isFrozen(mix.live(owner)!.ids)).toBe(true);
  });
  it('keeps the held lineup when a session ends; a new save or a forgotten player starts from the default', () => {
    const owner = store.data;
    mix.hold(owner, 'toddler', ['fill-dump']);
    mix.start(owner, 'toddler', ['fill-dump']);
    mix.end();
    expect(mix.lineup(owner, 'toddler')).toEqual(['fill-dump']);
    expect(mix.lineup(owner, 'lap')).toBeUndefined();
    expect(mix.lineup(defaults(), 'toddler')).toBeUndefined();
    mix.forget();
    expect(mix.lineup(owner, 'toddler')).toBeUndefined();
  });
  it('checks each stop on its own: one unplayable entry leaves the others playable', () => {
    const older = GAMES.map((m) =>
      m.id === 'fill-dump' ? { ...m, bands: m.bands.filter((b) => b !== 'lap') } : m,
    );
    expect(mixStop('lap', 'lap', older, 'fill-dump')).toBeNull();
    expect(mixStop('lap', 'lap', older, 'bubble-pop')?.id).toBe('bubble-pop');
    expect(mixStop('lap', 'toddler', GAMES, 'bubble-pop')).toBeNull();
    expect(mixStop('preschool', 'preschool', GAMES, 'bubble-pop')).toBeNull();
    let s = startMix(['fill-dump', 'bubble-pop']);
    s = step(s, { type: 'unavailable', p: 0 });
    expect([s.items[0].state, nextUp(s)]).toEqual(['unavailable', 1]);
  });
});

describe('Make my mix: layouts never shrink a target', () => {
  let win: BrowserEventTarget;
  beforeEach(() => {
    win = new BrowserEventTarget();
    vi.stubGlobal('window', win);
  });
  afterEach(() => {
    try {
      expect(win.listenerCount('pointerup')).toBe(0);
      expect(win.listenerCount('pointercancel')).toBe(0);
    } finally {
      vi.unstubAllGlobals();
    }
  });
  const VIEWS = [
    { w: 1024, h: 768 },
    { w: 1024, h: 1365 },
    { w: 1662, h: 768 },
    { w: 1024, h: 2100 },
  ].map((v) => ({ ...v, scale: 1 }));
  /** Those, and a phone held upright on the 768 × 1024 area (chunk 31, shell slice 3). */
  const WITH_UPRIGHT = [...VIEWS, ...Object.values(UPRIGHT_VIEWS)];
  it('the sheet puts every tile, Skip under each, Back and the buttons inside the view, apart, in every view', () => {
    type B = { what: string; x0: number; y0: number; x1: number; y1: number };
    const box = (what: string, c: { x: number; y: number }, w: number): B => ({
      what,
      x0: c.x - w / 2,
      y0: c.y - w / 2,
      x1: c.x + w / 2,
      y1: c.y + w / 2,
    });
    const apart = (a: B, b: B) => a.x1 <= b.x0 || b.x1 <= a.x0 || a.y1 <= b.y0 || b.y1 <= a.y0;
    for (const view of WITH_UPRIGHT)
      for (let n = 1; n <= MIX_MAX; n++) {
        const p = sheetPlaces(n, view);
        const where = `${n} at ${Math.round(view.w)}×${Math.round(view.h)}`;
        expect(p.size, where).toBe(sheetTiles(n).size);
        const tiles = p.tiles.map((t, i) => box(`tile ${i}`, t, p.size));
        const back = box('back', { x: 65, y: 65 }, 100);
        // Before the end: the tiles, Back, Play and Skip under whichever tile is next.
        for (const [k, skip] of p.skips.entries()) {
          const all = [...tiles, back, box('play', p.play, 140), box(`skip under ${k}`, skip, 112)];
          for (const [i, b] of all.entries()) {
            expect(
              b.x0 >= 0 && b.y0 >= 0 && b.x1 <= view.w && b.y1 <= view.h,
              `${b.what} inside, ${where}`,
            ).toBe(true);
            for (const c of all.slice(i + 1))
              expect(apart(b, c), `${b.what} and ${c.what}, ${where}`).toBe(true);
          }
        }
        // At the end: Again mix and Home instead.
        const end = [...tiles, back, box('again', p.again, 140), box('home', p.home, 140)];
        for (const [i, b] of end.entries()) {
          expect(b.x1 <= view.w && b.y1 <= view.h, `${b.what} inside, ${where}`).toBe(true);
          for (const c of end.slice(i + 1))
            expect(apart(b, c), `${b.what} and ${c.what}, ${where}`).toBe(true);
        }
        // The panel holds the tiles and the buttons.
        expect(p.panel.x >= 0 && p.panel.x + p.panel.w <= view.w, where).toBe(true);
        expect(p.panel.y + p.panel.h, where).toBeGreaterThan(p.play.y + 70);
      }
    // The wide area keeps its one row; the upright area wraps five into three over two.
    expect(new Set(sheetPlaces(5, VIEWS[0]).tiles.map((t) => t.y)).size).toBe(1);
    expect(new Set(sheetPlaces(5, UPRIGHT_VIEWS.phone).tiles.map((t) => t.y)).size).toBe(2);
  });
  it('the sheet holds one to five tiles at 150 or more, inside the design area, apart', () => {
    for (let n = 1; n <= MIX_MAX; n++) {
      const { size, xs } = sheetTiles(n);
      expect(size).toBeGreaterThanOrEqual(150);
      expect(xs[0] - size / 2).toBeGreaterThanOrEqual(82);
      expect(xs[n - 1] + size / 2).toBeLessThanOrEqual(942);
      for (let i = 1; i < n; i++) expect(xs[i] - xs[i - 1]).toBeGreaterThan(size);
    }
    expect(sheetTiles(3).xs).toEqual([232, 512, 792]);
  });
  it('the stop card takes the inline row only while Play clears Skip: never at five', () => {
    expect([1, 2, 3, 4].every((n) => inlineFits(1000, n, 62))).toBe(true);
    expect(inlineFits(1000, 5, 62)).toBe(false);
    // Its own row fits five on the portrait card beside Skip.
    expect(32 + 5 * 100 + 4 * 12).toBeLessThanOrEqual(760 - 32 - 112 - 24);
  });
  it('the table puts every target inside the view, at least 100 across, none overlapping, at every count and in every view, upright included', () => {
    const mods = (ids: readonly string[]) => ids.map((id) => GAMES.find((m) => m.id === id)!);
    const pool = mods(
      mixPool(
        'toddler',
        gamesFor('toddler').map((g) => g.id),
        GAMES,
      ),
    );
    for (const view of WITH_UPRIGHT)
      for (let n = 1; n <= MIX_MAX; n++) {
        const table = new MixTable(new Tweener(), {
          hear() {},
          add() {},
          move() {},
          remove: () => true,
          reset() {},
          play() {},
          back() {},
        });
        table.show(pool.slice(0, n), pool, view);
        const boxes = table.targets();
        expect(boxes.filter((b) => b.name.startsWith('slot')).length).toBe(n);
        for (const b of boxes) {
          expect(Math.min(b.w, b.h), `${b.name} ${view.w}×${view.h}`).toBeGreaterThanOrEqual(100);
          expect(
            b.x >= 0 && b.y >= 0 && b.x + b.w <= view.w && b.y + b.h <= view.h,
            `${b.name} inside ${view.w}×${view.h}`,
          ).toBe(true);
        }
        for (let i = 0; i < boxes.length; i++)
          for (let j = i + 1; j < boxes.length; j++) {
            const a = boxes[i],
              b = boxes[j];
            const apart = a.x + a.w <= b.x || b.x + b.w <= a.x || a.y + a.h <= b.y || b.y + b.h <= a.y;
            expect(apart, `${a.name} and ${b.name} at ${view.w}×${view.h}`).toBe(true);
          }
        table.destroy({ children: true });
      }
  });
  it('a turn of the screen re-pages the pool: ten a page in landscape, fifteen in the tall layout', () => {
    const pool = mixPool(
      'toddler',
      gamesFor('toddler').map((g) => g.id),
      GAMES,
    ).map((id) => GAMES.find((m) => m.id === id)!);
    expect(pool.length).toBeGreaterThanOrEqual(15);
    const table = new MixTable(new Tweener(), {
      hear() {},
      add() {},
      move() {},
      remove: () => true,
      reset() {},
      play() {},
      back() {},
    });
    const count = () => table.targets().filter((b) => b.name.startsWith('pool')).length;
    table.show(pool.slice(0, 3), pool, VIEWS[0]);
    expect(count()).toBe(10);
    table.layout(VIEWS[1]);
    expect(count()).toBe(15);
    table.destroy({ children: true });
  });
});
