import { Texture } from 'pixi.js';
import { describe, expect, it, vi } from 'vitest';
import { sameArt } from '../../art/creatures/illustrated';
import { landFor, overlaps, spotRect, type Rect } from '../../content/lands';
import { Companion } from '../../creatures/companion';
import { SPECIES } from '../../creatures/species';
import { computeView } from '../../engine/view';
import { hostScale } from './LandScene';
import { LOCATIONS } from './LocationScene';
import { landLayouts } from './resident-check';
import { meadowKeepOut } from './meadow';
import { bambooLine, foothills, peaksPlan, ridge, ridgeHeight } from './peaks';

const VIEWS = {
  landscape: computeView(1024, 768),
  portrait: computeView(768, 1024),
  phone: computeView(844, 390),
  notch: computeView(844, 390, { top: 0, right: 47, bottom: 21, left: 47 }),
};
const peaks = landFor('puzzle-peaks');

describe('Puzzle Peaks as a location', () => {
  it('keeps every mountain drawing on screen and off every touch area, in every layout up to the land budget, in every view', () => {
    for (const { view, ground, layout, where: where0 } of landLayouts('puzzle-peaks')) {
      const keepOut = meadowKeepOut(layout, view);
      const plan = peaksPlan(layout, view, ground);
      // A forest on the slopes, not a bare field, wherever the games leave the field room (three full rows leave none,
      // and then the far forest at the mountain's foot carries it).
      if (new Set(layout.games.map((s) => s.y)).size < 3 || view.h > view.w) {
        expect(plan.filter((p) => p.kind === 'bamboo').length, where0).toBeGreaterThanOrEqual(2);
        expect(plan.filter((p) => p.kind === 'conifer').length, where0).toBeGreaterThanOrEqual(2);
      }
      for (const { kind, y, rect: r } of plan) {
        const where = `${kind} ${where0}`;
        expect(r.x >= 0 && r.y >= 0 && r.x + r.w <= view.w && r.y + r.h <= view.h, where).toBe(true);
        for (const k of keepOut) expect(overlaps(r, k), where).toBe(false);
        // Bamboo grows on the lower slope, conifers higher up toward the snow.
        if (kind === 'bamboo') expect(y, where).toBeGreaterThanOrEqual(bambooLine(view, ground));
        if (kind === 'conifer') expect(y, where).toBeLessThanOrEqual(bambooLine(view, ground));
      }
      for (const p of plan) for (const b of plan) if (p !== b) expect(overlaps(p.rect, b.rect), `${p.kind} on ${b.kind} ${where0}`).toBe(false);
      expect(peaksPlan(layout, view, ground)).toEqual(plan);
    }
  });

  it('keeps the far peaks under the corner buttons and the heading, with snow only on the tall ones', () => {
    for (const view of Object.values(VIEWS)) {
      const ground = view.h * peaks.backdrop.horizon;
      const tops = ridge(view, ground);
      expect(tops[0].x - tops[0].half).toBeLessThanOrEqual(0);
      expect(tops[tops.length - 1].x + tops[tops.length - 1].half).toBeGreaterThanOrEqual(view.w);
      for (const p of tops) {
        expect(p.top).toBeGreaterThanOrEqual(130);
        expect(p.top).toBeLessThan(ground);
      }
      expect(tops.some((p) => p.snow)).toBe(true);
      // The far forest: bamboo along the mountain's foot, conifers above it on the flanks, across the whole width.
      const far = foothills(view, ground);
      const bamboo = far.filter((t) => t.kind === 'bamboo');
      const conifers = far.filter((t) => t.kind === 'conifer');
      expect(bamboo.length).toBeGreaterThanOrEqual(6);
      expect(conifers.length).toBeGreaterThanOrEqual(6);
      for (const c of conifers) for (const b of bamboo) expect(c.y).toBeLessThan(b.y);
      for (const c of conifers) expect(c.y).toBeGreaterThan(ground - ridgeHeight(tops, ground, c.x));
    }
  });

  it('is a location with the cloud glider as its resident, whose span and touch circle clear every other spot', () => {
    expect(LOCATIONS['puzzle-peaks']?.resident).toBe('glider');
    /** Everything the glider covers, in its own units, over `frames` sixtieths of a second (poked first if asked). */
    const span = (poked: boolean, frames: number, phase: number) => {
      const random = vi.spyOn(Math, 'random').mockReturnValue(phase);
      let glider: Companion;
      try {
        glider = new Companion({ species: 'glider', look: { color: SPECIES.glider.color }, id: null }, sameArt(Texture.WHITE));
      } finally {
        random.mockRestore();
      }
      if (poked) glider.poke();
      const b0 = glider.getLocalBounds();
      const box = { minX: b0.minX, maxX: b0.maxX, minY: b0.minY, maxY: b0.maxY };
      for (let i = 0; i < frames; i++) {
        glider.update(1 / 60);
        const b = glider.getLocalBounds();
        box.minX = Math.min(box.minX, b.minX);
        box.maxX = Math.max(box.maxX, b.maxX);
        box.minY = Math.min(box.minY, b.minY);
        box.maxY = Math.max(box.maxY, b.maxY);
      }
      return { glider, box };
    };
    // Sweep the randomized clock: sparse layouts must fit the loop at its widest phases too.
    for (const phase of Array.from({ length: 101 }, (_, i) => i / 101)) {
      // At rest the wing bends and the ribbons ripple: everything it covers over five seconds.
      const { glider, box } = span(false, 300, phase);
      // Poked, it loops up and over for 1.2 seconds, drawn behind the buttons and taking no touches.
      const reaction = span(true, 90, phase);
      const loop = reaction.box;
      // The illustration spans about 380 units before its fit.
      expect(box.maxX - box.minX).toBeGreaterThan(220);
      const hit = glider.touchArea(10);
      const smallest = Math.min(...[...landLayouts('puzzle-peaks')].map(({ layout }) => layout.box.w));
      expect(smallest, 'the crowded land reaches a smaller drawing size').toBeLessThan(170);
      const at = (b: typeof box, x: number, y: number, s: number): Rect => ({ x: x + b.minX * s, y: y + b.minY * s, w: (b.maxX - b.minX) * s, h: (b.maxY - b.minY) * s });
      for (const { view, layout, where } of landLayouts('puzzle-peaks')) {
        const s = hostScale(layout.box);
        const { x, y } = layout.host;
        const body = at(box, x, y, s);
        const touch: Rect = { x: x + (hit.x - hit.radius) * s, y: y + (hit.y - hit.radius) * s, w: hit.radius * 2 * s, h: hit.radius * 2 * s };
        expect(hit.radius * 2 * s, `touch circle ${where}`).toBeGreaterThanOrEqual(100);
        const own = spotRect(layout.host, layout.box);
        const others = meadowKeepOut(layout, view).filter((r) => r.x !== own.x || r.y !== own.y);
        for (const r of [body, touch]) {
          expect(r.x >= own.x && r.y >= own.y && r.x + r.w <= own.x + own.w && r.y + r.h <= own.y + own.h, `inside its spot ${where}`).toBe(true);
          for (const k of others) expect(overlaps(r, k), where).toBe(false);
        }
        const swoop = at(loop, x, y, s);
        expect(swoop.x >= 0 && swoop.y >= 0 && swoop.x + swoop.w <= view.w, `the loop stays on screen ${where}, phase=${phase}: ${JSON.stringify(swoop)}`).toBe(true);
      }
      glider.destroy({ children: true });
      reaction.glider.destroy({ children: true });
    }
  });
});
