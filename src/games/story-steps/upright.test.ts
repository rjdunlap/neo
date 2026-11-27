import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { square, uprightProblems, UPRIGHT_VIEWS, type Target } from '../upright-check';
import {
  predictLayout,
  repairLayout,
  stripLayout,
  theaterLayout,
  untangleLayout,
  viewpointsLayout,
} from './layout';
import type { Point } from './layout';
import { LEVEL_PLANS, storyPuzzle } from './logic';

/**
 * Story Steps held upright (chunk 31, docs/definitions/phone-portrait.md): every mode on the upright phone views. The
 * targets are the slots (164 units, the drop and tap zones), the loose pictures, the buttons and the practice friends.
 */
const slotsOf = (what: string, ps: readonly Point[]): Target[] =>
  ps.map((p, i) => square(`${what} ${i}`, p, 164));
const trayOf = (ps: readonly Point[], size: number): Target[] =>
  ps.map((p, i) => square(`picture ${i}`, p, size));

describe.each(Object.entries(UPRIGHT_VIEWS))('Story Steps upright on %s', (_, v) => {
  it.each(LEVEL_PLANS.map((p, i) => [i + 1, p] as const))('level %s: strip', (_l, plan) => {
    for (let seed = 1; seed <= 6; seed++) {
      const puzzle = storyPuzzle(plan, new Rng(seed));
      const L = stripLayout(v, puzzle.sequence.length, puzzle.choices.length);
      const t = [...slotsOf('slot', L.slots), ...trayOf(L.tray, L.size), square('replay', L.replay, 100)];
      expect(uprightProblems(v, t), `level ${_l} seed ${seed}`).toEqual([]);
      expect(L.panel.y + L.panel.h).toBeLessThanOrEqual(v.h);
      expect(Math.max(...L.slots.map((s) => s.y)) + 82).toBeLessThan(L.panel.y);
    }
  });
  it('level 9: repair', () => {
    const L = repairLayout(v);
    const t = [...slotsOf('slot', L.slots), square('replay', L.replay, 100), square('undo', L.undo, 100)];
    expect(uprightProblems(v, t)).toEqual([]);
  });
  it('level 10: untangle', () => {
    const L = untangleLayout(v);
    const t = [
      ...slotsOf('slot', L.slots.flat()),
      ...L.anchors.map((p, i) => square(`row picture ${i}`, p, 110)),
      ...trayOf(L.tray, 110),
      square('replay', L.replay, 100),
    ];
    expect(uprightProblems(v, t)).toEqual([]);
    expect(Math.max(...L.slots.flat().map((s) => s.y)) + 82).toBeLessThan(L.panel.y);
  });
  it('level 11: predict', () => {
    const L = predictLayout(v);
    const t = [...slotsOf('slot', L.slots), ...trayOf(L.tray, 164), square('replay', L.replay, 100)];
    expect(uprightProblems(v, t)).toEqual([]);
    expect(Math.max(...L.slots.map((s) => s.y)) + 82).toBeLessThan(L.panel.y);
  });
  it('levels 12 and 13: theater', () => {
    const L = theaterLayout(v);
    const t: Target[] = [
      ...L.choices.map((p, i) => ({ what: `choice ${i}`, ...p, w: 148, h: 106 })),
      ...L.buttons.map((p, i) => ({ what: `button ${i}`, ...p, w: 148, h: 106 })),
    ];
    expect(uprightProblems(v, t)).toEqual([]);
    // The stage (620 × 240 at its scale), its caption and the group labels are whole and apart.
    const stageHalf = 310 * L.stageScale;
    expect(L.stage.x - stageHalf).toBeGreaterThanOrEqual(0);
    expect(L.stage.x + stageHalf).toBeLessThanOrEqual(v.w);
    expect(L.stage.y + 120 * L.stageScale).toBeLessThan(L.caption.y - 14);
    expect(L.caption.y + 16).toBeLessThan(Math.min(...L.labels.map((p) => p.y)) - 14);
    for (const x of L.compare) expect(Math.abs(x) + 75).toBeLessThan(v.w / 2);
    // Each label sits above its pair.
    L.labels.forEach((p, g) => expect(p.y + 14).toBeLessThan(L.choices[g * 2].y - 53));
    expect(L.title.y).toBeGreaterThan(60);
  });
});

describe.each(Object.entries(UPRIGHT_VIEWS))('Two Viewpoints upright on %s', (_, v) => {
  it('level 14: every card and button fits, with the stage and caption whole and apart', () => {
    const L = viewpointsLayout(v);
    const t: Target[] = [...L.friends, ...L.endings, ...L.buttons].map((p, i) => ({
      what: `target ${i}`,
      ...p,
    }));
    expect(uprightProblems(v, t)).toEqual([]);
    const stageHalf = 310 * L.stageScale;
    expect(L.stage.x - stageHalf).toBeGreaterThanOrEqual(0);
    expect(L.stage.x + stageHalf).toBeLessThanOrEqual(v.w);
    expect(L.stage.y + 120 * L.stageScale).toBeLessThan(L.caption.y - 14);
    expect(L.caption.y + 16).toBeLessThan(Math.min(...L.friends.map((p) => p.y - p.h / 2)) - 14);
    expect(L.title.y).toBeGreaterThan(60);
  });
});
