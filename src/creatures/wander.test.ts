import { Texture } from 'pixi.js';
import { describe, expect, it } from 'vitest';
import { sameArt } from '../art/creatures/illustrated';
import { overlaps, spotRect } from '../content/lands';
import { Rng } from '../engine/random';
import { landLayouts } from '../app/scenes/resident-check';
import { hostScale } from '../app/scenes/LandScene';
import { meadowKeepOut } from '../app/scenes/meadow';
import { Resident, TOUCH_BELOW, TOUCH_SIDE } from './resident';
import {
  footprintAt,
  MAX_RANGE,
  REST_RANGE,
  USE_TIME,
  Wanderer,
  wanderKeepOut,
  wanderRoute,
  type Stop,
} from './wander';

const fp = Resident.footprint('trill');

describe('Trill carries on (P5)', () => {
  it('has a footprint that holds its touch circle either way round, grown, and the whole picture', () => {
    const size = Resident.size('trill');
    expect(fp.side).toBeGreaterThanOrEqual(TOUCH_SIDE);
    expect(fp.side).toBeGreaterThanOrEqual(size.w / 2);
    expect(fp.up).toBeGreaterThanOrEqual(size.h);
    expect(fp.down).toBeGreaterThanOrEqual(TOUCH_BELOW);
  });

  it('keeps every stop and every step of every leg clear, on screen and near home, in every layout the land allows', () => {
    let withStops = 0;
    let layouts = 0;
    for (const { view, layout, where } of landLayouts('music-mountain')) {
      layouts++;
      const s = hostScale(layout.box);
      const others = wanderKeepOut(layout, meadowKeepOut(layout, view));
      // Its own spot is what the others exclude, not one of them.
      expect(others.length, where).toBe(meadowKeepOut(layout, view).length - 1);
      const route = wanderRoute(layout, view, others, fp, s);
      expect(route, where).toEqual(wanderRoute(layout, view, others, fp, s));
      expect(route[0], where).toEqual(layout.host);
      expect(route.length, where).toBeLessThanOrEqual(3);
      if (route.length > 1) withStops++;
      const clear = (p: Stop) => {
        const r = footprintAt(p, fp, s);
        expect(r.x >= 0 && r.y >= 0 && r.x + r.w <= view.w && r.y + r.h <= view.h, `${where} on screen`).toBe(
          true,
        );
        for (const k of others) expect(overlaps(r, k), `${where} covers ${JSON.stringify(k)}`).toBe(false);
      };
      const cycle = [...route, route[0]];
      for (let i = 1; i < cycle.length; i++) {
        const a = cycle[i - 1];
        const b = cycle[i];
        const n = Math.ceil(Math.hypot(b.x - a.x, b.y - a.y) / 6);
        // A step of 6 is finer than the 12 the route was planned at, and the straight line is what it walks.
        for (let k = 0; k <= n; k++)
          clear({ x: a.x + ((b.x - a.x) * k) / Math.max(1, n), y: a.y + ((b.y - a.y) * k) / Math.max(1, n) });
        if (i > 0 && i < cycle.length - 1)
          expect(Math.hypot(b.x - route[0].x, b.y - route[0].y), where).toBeLessThanOrEqual(MAX_RANGE);
      }
    }
    // The roomy layouts have somewhere to go; only a crowded land screen stands still.
    expect(withStops / layouts).toBeGreaterThan(0.4);
  });

  it('has a touch circle, either way round, that stays inside its footprint and a hundred across', () => {
    const r = new Resident('trill', sameArt(Texture.WHITE));
    const hit = r.touchArea(10);
    for (const dir of [-1, 1] as const) {
      r.face(dir, hit);
      expect(Math.abs(hit.x) + hit.radius).toBeLessThanOrEqual(fp.side);
      expect(hit.y + hit.radius).toBeLessThanOrEqual(fp.down);
      expect(hit.x).toBe(dir * Math.abs(hit.x));
      expect(hit.radius * 2 * hostScale({ h: 155 })).toBeGreaterThan(100);
    }
    r.destroy({ children: true });
  });
});

describe('Wanderer', () => {
  const route: Stop[] = [
    { x: 100, y: 300 },
    { x: 400, y: 320 },
    { x: 400, y: 150 },
  ];
  const run = (w: Wanderer, seconds: number, each?: () => void) => {
    for (let i = 0; i < seconds * 60; i++) {
      w.update(1 / 60);
      each?.();
    }
  };

  it('rests at home first, then visits each stop, uses the first, and comes home to rest', () => {
    const arrivals: number[] = [];
    const w = new Wanderer(new Rng(7), (i) => arrivals.push(i));
    w.setRoute(route);
    expect([w.x, w.y, w.mode]).toEqual([100, 300, 'rest']);
    run(w, REST_RANGE[0] - 0.2);
    expect(w.mode).toBe('rest');
    const seen = new Set<string>();
    let using = 0;
    run(w, 60, () => {
      seen.add(w.mode);
      if (w.mode === 'use') using++;
    });
    expect(seen).toEqual(new Set(['rest', 'walk', 'use']));
    expect(arrivals.length).toBeGreaterThanOrEqual(1);
    expect(new Set(arrivals)).toEqual(new Set([1]));
    expect(using / 60).toBeGreaterThanOrEqual(USE_TIME - 0.1);
  });

  it('only ever stands on its route: every position lies on a leg of home, first, second, home', () => {
    const w = new Wanderer(new Rng(3));
    w.setRoute(route);
    const cycle = [...route, route[0]];
    const onLeg = () =>
      cycle.slice(1).some((b, i) => {
        const a = cycle[i];
        const cross = (b.x - a.x) * (w.y - a.y) - (b.y - a.y) * (w.x - a.x);
        const inX = w.x >= Math.min(a.x, b.x) - 1e-6 && w.x <= Math.max(a.x, b.x) + 1e-6;
        const inY = w.y >= Math.min(a.y, b.y) - 1e-6 && w.y <= Math.max(a.y, b.y) + 1e-6;
        return Math.abs(cross) < 0.5 * Math.hypot(b.x - a.x, b.y - a.y) && inX && inY;
      });
    run(w, 120, () => expect(onLeg()).toBe(true));
  });

  it('faces its way while walking, and toward her last touch whenever it stands still', () => {
    const w = new Wanderer(new Rng(1));
    w.setRoute(route);
    w.look(20);
    expect(w.facing).toBe(-1);
    w.look(900);
    expect(w.facing).toBe(1);
    const walking: number[] = [];
    run(w, 80, () => {
      if (w.mode === 'walk') walking.push(w.facing);
    });
    expect(walking).toContain(1);
    expect(walking).toContain(-1);
    // Standing still, it faces the touch.
    w.setRoute([{ x: 300, y: 300 }]);
    w.look(10);
    expect(w.facing).toBe(-1);
    w.look(700);
    expect(w.facing).toBe(1);
  });

  it('stands still with a route of one, owes nothing and does not depend on being watched', () => {
    const w = new Wanderer(new Rng(2));
    w.setRoute([{ x: 5, y: 6 }]);
    run(w, 200);
    expect([w.x, w.y, w.mode]).toEqual([5, 6, 'rest']);
    // Its state is a function of the seconds it was updated: nothing accrues, and a fresh walker restarts at home.
    const a = new Wanderer(new Rng(9));
    a.setRoute(route);
    expect([a.x, a.y]).toEqual([100, 300]);
  });
});

describe('spot helper', () => {
  it('reads the own spot the same way the resident check does', () => {
    const { layout } = [...landLayouts('music-mountain')][0];
    const own = spotRect(layout.host, layout.box);
    expect(own.w).toBe(layout.box.w + 30);
  });
});
