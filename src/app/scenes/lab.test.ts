import { describe, expect, it } from 'vitest';
import { landButtons, landFor, landLayout, olderIn, overlaps, visibleIn } from '../../content/lands';
import { computeView } from '../../engine/view';
import { GAMES } from '../../games/registry';
import { BANDS, type Band } from '../../progress/bands';
import { exploreIds } from './ExploreScene';
import { LOCATIONS } from './LocationScene';
import { meadowKeepOut } from './meadow';
import { LAB_BACKDROP, labCeiling, labMouth, labPlan } from './lab';

const VIEWS = {
  landscape: computeView(1024, 768),
  portrait: computeView(768, 1024),
  phone: computeView(844, 390),
  notch: computeView(844, 390, { top: 0, right: 47, bottom: 21, left: 47 }),
};
const lab = landFor('tinker-lab');

/** Every layout Tinker Lab uses: each band, both sides of the signpost, every view. */
function* layouts() {
  for (const [name, view] of Object.entries(VIEWS)) {
    const ground = view.h * LAB_BACKDROP.horizon;
    for (const band of BANDS.map((b) => b.id) as Band[]) {
      const mine = visibleIn(lab, band, GAMES).length;
      const older = olderIn(lab, band, GAMES).length;
      for (const n of older ? [mine, older] : [mine]) {
        const layout = landLayout(n, older > 0, view, ground)!;
        yield { view, ground, layout, where: `${band} ${name} n=${n}` };
      }
    }
  }
}

describe('Tinker Lab as a location', () => {
  it('keeps every lab drawing on screen and off every touch area, at every band, both sides of the signpost, in every view', () => {
    for (const { view, ground, layout, where: where0 } of layouts()) {
      const keepOut = meadowKeepOut(layout, view);
      const plan = labPlan(layout, view, ground);
      // A workshop in a cave: a bench, and the cave's pool.
      expect(plan.filter((p) => p.kind === 'bench').length, where0).toBeGreaterThanOrEqual(1);
      expect(plan.filter((p) => p.kind === 'pool').length, where0).toBe(1);
      for (const { kind, rect: r } of plan) {
        const where = `${kind} ${where0}`;
        expect(r.x >= 0 && r.y >= 0 && r.x + r.w <= view.w && r.y + r.h <= view.h, where).toBe(true);
        for (const k of keepOut) expect(overlaps(r, k), where).toBe(false);
        expect(r.y, where).toBeGreaterThan(ground);
      }
      for (const p of plan) for (const b of plan) if (p !== b) expect(overlaps(p.rect, b.rect), `${p.kind} on ${b.kind} ${where0}`).toBe(false);
      expect(labPlan(layout, view, ground)).toEqual(plan);
    }
  });

  it('hangs stalactites, bats and glow-worms from the ceiling above the back wall, off the corner buttons and the heading', () => {
    for (const [name, view] of Object.entries(VIEWS)) {
      const ground = view.h * LAB_BACKDROP.horizon;
      const { stalactites, bats, glowworms } = labCeiling(view, ground);
      const heading = { x: view.w / 2 - 190, y: 20, w: 380, h: 90 };
      const off = [...landButtons(view.w), heading];
      expect(stalactites.length, name).toBeGreaterThanOrEqual(3);
      expect(bats.length, name).toBeGreaterThanOrEqual(1);
      expect(glowworms.length, name).toBeGreaterThanOrEqual(8);
      const boxes = [...stalactites.map((s) => s.rect), ...bats.map((b) => b.rect), ...glowworms.map((w) => ({ x: w.x - 5, y: w.y - w.thread, w: 10, h: w.thread + 5 }))];
      for (const b of boxes) {
        expect(b.x >= 0 && b.y >= 0 && b.x + b.w <= view.w && b.y + b.h <= ground - 168, name).toBe(true);
        for (const k of off) expect(overlaps(b, k), name).toBe(false);
      }
      // Stalactites and bats hang from the ceiling itself.
      for (const s of [...stalactites, ...bats]) expect(s.rect.y, name).toBe(0);
    }
  });

  it('opens the cave mouth in the back wall, under the corner buttons and the heading, standing on the floor', () => {
    for (const [name, view] of Object.entries(VIEWS)) {
      const ground = view.h * LAB_BACKDROP.horizon;
      const m = labMouth(view, ground);
      // Its rock arch reaches 14 beyond the opening.
      const arch = { x: m.x - 14, y: m.y - 14, w: m.w + 28, h: m.h + 14 };
      expect(m.h, name).toBeGreaterThanOrEqual(80);
      expect(arch.x >= 0 && arch.x + arch.w <= view.w, name).toBe(true);
      expect(arch.y, name).toBeGreaterThanOrEqual(130);
      for (const k of [...landButtons(view.w), { x: view.w / 2 - 190, y: 20, w: 380, h: 90 }]) expect(overlaps(arch, k), name).toBe(false);
      expect(m.y + m.h, name).toBeGreaterThan(ground);
    }
  });

  it('is a cave location whose land host greets her until Mossback, its resident, is prepared, and Explore lists it', () => {
    const place = LOCATIONS['tinker-lab'];
    expect(place).toBeDefined();
    expect(place?.resident).toBeUndefined();
    expect(place?.backdrop).toBe(LAB_BACKDROP);
    expect(LAB_BACKDROP.sun).toBeFalsy();
    expect(LAB_BACKDROP.clouds ?? 0).toBe(0);
    // Its horizon is the land's, so the layout is the land's; and the classic island keeps its day.
    expect(LAB_BACKDROP.horizon).toBe(lab.backdrop.horizon);
    expect(lab.backdrop.sun).toBe(true);
    expect(exploreIds()).toContain('tinker-lab');
  });
});
