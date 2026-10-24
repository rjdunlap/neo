import { describe, expect, it } from 'vitest';
import { CRITTERS } from '../art/critter';
import { computeView } from '../engine/view';
import { GAMES } from '../games/registry';
import { BANDS, bandRank, lowestBand, playBand, type Band } from '../progress/bands';
import {
  clampLandPage,
  forAgeOrYounger,
  LAND_SPOTS,
  landPages,
  layoutSpots,
  LAND_IDS,
  landButtons,
  landLayout,
  landOf,
  LANDS,
  MAP_RADIUS,
  mapButtons,
  mapLayout,
  olderIn,
  overlaps,
  petCorner,
  spotRect,
  suggest,
  visibleGames,
  visibleIn,
} from './lands';
import { SCRIPT } from './voice-script';

const bands = BANDS.map((b) => b.id);
/** An iPad sideways and upright, a phone sideways, and a phone with a notch and home indicator. */
const VIEWS = {
  landscape: computeView(1024, 768),
  portrait: computeView(768, 1024),
  phone: computeView(844, 390),
  notch: computeView(844, 390, { top: 0, right: 47, bottom: 21, left: 47 }),
};
/** The backdrops' ground line, as a land scene computes it. */
const groundOf = (h: number) => h * 0.4;

describe('lands', () => {
  it('shows Robot Path among preschool’s Tinker Lab games and keeps it on younger signposts', () => {
    const land = landOf('robot-path')!;
    expect(land.id).toBe('tinker-lab');
    expect(visibleIn(land, 'preschool', GAMES).map(g => g.id)).toContain('robot-path');
    expect(olderIn(land, 'preschool', GAMES).map(g => g.id)).not.toContain('robot-path');
    for (const band of ['lap', 'toddler'] as const) {
      expect(olderIn(land, band, GAMES).map(g => g.id)).toContain('robot-path');
    }
  });

  it('give every island game exactly one land, and only island games', () => {
    const listed = LANDS.flatMap((l) => l.games);
    expect(new Set(listed).size).toBe(listed.length);
    expect([...listed].sort()).toEqual(GAMES.map((g) => g.id).sort());
    for (const g of GAMES) expect(landOf(g.id), g.id).toBeDefined();
  });

  it('each have an id, a spoken line, a host and a game for the youngest (Lantern Lake: for the grown-up)', () => {
    expect(LANDS.map((l) => l.id)).toEqual([...LAND_IDS]);
    for (const land of LANDS) {
      expect(SCRIPT[land.line], land.id).toBeDefined();
      expect(['juniper', 'hazel', ...Object.keys(CRITTERS)], land.id).toContain(land.host.kind);
      // Lantern Lake holds only grown-up games: for a child its signpost is the way in.
      if (land.id === 'lantern-lake') expect(olderIn(land, 'lap', GAMES).length, land.id).toBeGreaterThan(0);
      else expect(visibleIn(land, 'lap', GAMES).length, land.id).toBeGreaterThan(0);
    }
  });

  it('show a grown-up (the top band) every game, with nothing behind a signpost', () => {
    const top = bands.at(-1)!;
    for (const land of LANDS) {
      expect(olderIn(land, top, GAMES), land.id).toEqual([]);
      expect(visibleIn(land, top, GAMES).length).toBe(land.games.length);
    }
    expect(visibleGames(top, GAMES).length).toBe(GAMES.length);
  });

  it('split each land into her games and the bigger kids\' games, keeping younger favorites as she grows', () => {
    for (const land of LANDS) {
      let before: string[] = [];
      for (const band of bands) {
        const mine = visibleIn(land, band, GAMES).map((g) => g.id);
        const older = olderIn(land, band, GAMES).map((g) => g.id);
        expect([...mine, ...older].sort()).toEqual([...land.games].sort());
        expect(mine.filter((id) => older.includes(id))).toEqual([]);
        // Nothing she had disappears on a birthday.
        for (const id of before) expect(mine, `${land.id} ${band}`).toContain(id);
        before = mine;
      }
    }
  });

  it('list on the home spot exactly the games the lands show her', () => {
    for (const band of bands) {
      const fromLands = LANDS.flatMap((l) => visibleIn(l, band, GAMES).map((g) => g.id)).sort();
      expect(visibleGames(band, GAMES).map((g) => g.id).sort()).toEqual(fromLands);
    }
  });
});

describe('the band a game plays in', () => {
  it('is always one the game has: her own, else the highest below hers, else the lowest above', () => {
    for (const g of GAMES) {
      for (const band of bands) {
        const play = playBand(g.bands, band);
        expect(g.bands, `${g.id} ${band}`).toContain(play);
        if (g.bands.includes(band)) expect(play).toBe(band);
        else if (g.bands.some((b) => bandRank(b) < bandRank(band))) {
          expect(bandRank(play)).toBeLessThan(bandRank(band));
          for (const b of g.bands) if (bandRank(b) < bandRank(band)) expect(bandRank(b)).toBeLessThanOrEqual(bandRank(play));
        } else expect(play).toBe(lowestBand(g.bands));
      }
    }
  });

  it('plays a game for younger children at its top band, and one behind a signpost at its easiest', () => {
    expect(playBand(['lap', 'toddler', 'preschool'], 'school')).toBe('preschool');
    expect(playBand(['prek', 'school'], 'lap')).toBe('prek');
    expect(playBand(['lap', 'school'], 'preschool')).toBe('lap');
    for (const g of GAMES) for (const band of bands) if (!forAgeOrYounger(g, band)) expect(playBand(g.bands, band)).toBe(lowestBand(g.bands));
  });
});

describe('a host\'s suggestion', () => {
  const mods = GAMES.slice(0, 4);
  const stats = (rows: Record<string, number | null>) =>
    Object.fromEntries(Object.entries(rows).map(([id, at]) => [id, { plays: at === null ? 0 : 1, history: at === null ? [] : [{ at }] }]));

  it('is a game she has not played yet, first', () => {
    expect(suggest(mods, stats({ [mods[0].id]: 5, [mods[1].id]: null }))?.id).toBe(mods[1].id);
    expect(suggest(mods, {})?.id).toBe(mods[0].id);
  });

  it('is otherwise the one played longest ago, and not the last suggestion', () => {
    const all = stats({ [mods[0].id]: 50, [mods[1].id]: 10, [mods[2].id]: 30, [mods[3].id]: 40 });
    expect(suggest(mods, all)?.id).toBe(mods[1].id);
    expect(suggest(mods, all, mods[1].id)?.id).toBe(mods[2].id);
    // A restored save can count plays with no history: that counts as long ago, not a crash.
    expect(suggest(mods, { ...all, [mods[3].id]: { plays: 2, history: [] } })?.id).toBe(mods[3].id);
  });

  it('repeats the only game a land has, and has nothing to say in an empty one', () => {
    expect(suggest([mods[0]], {}, mods[0].id)?.id).toBe(mods[0].id);
    expect(suggest([], {})).toBeNull();
  });
});


  it('fits every page of every land, at every band, both ways of looking, on one screen with large separate targets', () => {
    for (const [name, view] of Object.entries(VIEWS)) {
      for (const land of LANDS) {
        for (const band of bands as Band[]) {
          const mine = visibleIn(land, band, GAMES);
          const older = olderIn(land, band, GAMES);
          // Her games with the signpost if there is one, and the signpost's own view, each a page at a time.
          for (const side of older.length ? [mine, older] : [mine]) {
            const pages = landPages(side, older.length > 0);
            for (const [p, page] of pages.entries()) {
              const arrows = { prev: p > 0, next: p < pages.length - 1 };
              const layout = landLayout(page.length, older.length > 0, view, groundOf(view.h), arrows);
              expect(layout, `${land.id} ${band} ${name} page ${p}`).not.toBeNull();
              const all = layoutSpots(layout!).map((s) => spotRect(s, layout!.box));
              expect(all.length).toBe(page.length + 1 + (older.length ? 1 : 0) + (arrows.prev ? 1 : 0) + (arrows.next ? 1 : 0));
              expect(all.length, `${land.id} ${band} page ${p}`).toBeLessThanOrEqual(LAND_SPOTS);
              expect(!!layout!.prev).toBe(arrows.prev);
              expect(!!layout!.next).toBe(arrows.next);
              for (const [i, r] of all.entries()) {
                const where = `${land.id} ${band} ${name} page ${p} #${i}`;
                expect(r.w, where).toBeGreaterThanOrEqual(100);
                expect(r.h, where).toBeGreaterThanOrEqual(100);
                expect(r.x >= 0 && r.y >= 0 && r.x + r.w <= view.w && r.y + r.h <= view.h, where).toBe(true);
                expect(overlaps(r, petCorner(view.h)), where).toBe(false);
                for (const b of landButtons(view.w)) expect(overlaps(r, b), where).toBe(false);
                for (const other of all.slice(i + 1)) expect(overlaps(r, other), where).toBe(false);
              }
            }
          }
        }
      }
    }
  });

  it('pages a full side in land order, near-equal pages within the budget, and leaves a side that fits on one page', () => {
    for (const land of LANDS) {
      for (const band of bands as Band[]) {
        const mine = visibleIn(land, band, GAMES);
        const older = olderIn(land, band, GAMES);
        for (const side of [mine, older]) {
          const sign = older.length > 0;
          const pages = landPages(side, sign);
          const where = `${land.id} ${band}`;
          expect(pages.flat(), where).toEqual(side);
          const sizes = pages.map((p) => p.length);
          expect(Math.max(...sizes) - Math.min(...sizes), where).toBeLessThanOrEqual(1);
          // Earlier pages take the extra game.
          expect([...sizes].sort((a, b) => b - a), where).toEqual(sizes);
          if (1 + side.length + (sign ? 1 : 0) <= LAND_SPOTS) expect(pages.length, where).toBe(1);
          else for (const s of sizes) expect(1 + s + 2 + (sign ? 1 : 0), where).toBeLessThanOrEqual(LAND_SPOTS);
        }
      }
    }
    // The definition's own examples: 13 with a signpost becomes 7 + 6, 22 becomes 8 + 7 + 7; 12 with no signpost fits.
    const ids = (n: number) => Array.from({ length: n }, (_, i) => i);
    expect(landPages(ids(13), true).map((p) => p.length)).toEqual([7, 6]);
    expect(landPages(ids(22), true).map((p) => p.length)).toEqual([8, 7, 7]);
    expect(landPages(ids(12), false).map((p) => p.length)).toEqual([12]);
    expect(landPages(ids(12), true).map((p) => p.length)).toEqual([6, 6]);
    expect(landPages([], true)).toEqual([[]]);
  });

  it('holds a carried page inside the side\'s pages', () => {
    expect(clampLandPage(undefined, 2)).toBe(0);
    expect(clampLandPage(1, 2)).toBe(1);
    expect(clampLandPage(5, 2)).toBe(1);
    expect(clampLandPage(-3, 2)).toBe(0);
    expect(clampLandPage(Number.NaN, 3)).toBe(0);
    expect(clampLandPage(1.7, 3)).toBe(1);
    expect(clampLandPage(2, 0)).toBe(0);
  });

  it('uses the largest drawings that fit, and never needs smaller than the last size', () => {
    const roomy = landLayout(4, false, VIEWS.landscape, groundOf(768))!;
    expect(roomy.box.w).toBe(170);
    expect(landLayout(40, true, VIEWS.landscape, groundOf(768))).toBeNull();
  });
});

describe('the map', () => {
  it('fits every land, the home spot and the picnic, apart from each other and the buttons, every way of looking', () => {
    for (const [name, view] of Object.entries(VIEWS)) {
      const spots = Object.entries(mapLayout(view));
      expect(spots.map(([id]) => id).sort()).toEqual([...LAND_IDS, 'home', 'picnic'].sort());
      for (const [i, [id, s]] of spots.entries()) {
        const where = `${id} ${name}`;
        // The drawing (about 184 wide, from 100 above to its name 90 below) stays on screen and under the title.
        expect(s.x - 92 >= 0 && s.x + 92 <= view.w && s.y - 100 >= 80 && s.y + 92 <= view.h, where).toBe(true);
        for (const b of mapButtons(view)) expect(Math.hypot(s.x - b.x, s.y - b.y), `${where} button`).toBeGreaterThanOrEqual(MAP_RADIUS + b.r);
        for (const [other, t] of spots.slice(i + 1)) expect(Math.hypot(s.x - t.x, s.y - t.y), `${where} ${other}`).toBeGreaterThanOrEqual(2 * MAP_RADIUS);
      }
    }
  });
});
