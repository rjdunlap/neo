import { describe, expect, it } from 'vitest';
import { computeView, NO_INSETS, type View } from '../../engine/view';
import type { Band } from '../../progress/bands';
import { levelsInOrder, rangeFor } from '../../progress/difficulty';
import { square, uprightProblems, UPRIGHT_VIEWS, type Target } from '../upright-check';
import {
  BIG_FROG,
  BIRD_LIFT,
  BIRD_RADIUS,
  BUTTON_RADIUS,
  FROG_RADIUS,
  TREE_BOX,
  neighborsLayout,
} from './layout';
import { LEVELS, planFor } from './logic';

/**
 * Rhythm Neighbors held upright (chunk 31, docs/definitions/phone-portrait.md): every level, on the three upright phone
 * views, the captioned one and a short one. What a level shows to touch follows its plan: the bird, the frogs and the
 * round buttons; the tree levels, one tree and one big frog.
 */
const views = { ...UPRIGHT_VIEWS, short: computeView(375, 601, NO_INSETS, true) };
const levels = [
  ...new Set((Object.keys(LEVELS) as Band[]).flatMap((band) => levelsInOrder(rangeFor(LEVELS, band)))),
].sort((a, b) => a - b);
const treeLevel = (level: number) => !!(planFor(level).knock || planFor(level).call);

/** The tap areas a level shows, as boxes in view units. */
function targets(v: View, level: number): Target[] {
  const plan = planFor(level);
  const tree = treeLevel(level);
  const l = neighborsLayout(v, { voices: plan.voices, tree });
  const out: Target[] = [];
  if (tree) {
    const s = l.treeScale;
    out.push({
      what: 'tree',
      x: l.bird.x + (TREE_BOX.x + TREE_BOX.w / 2) * s,
      y: l.bird.y + (TREE_BOX.y + TREE_BOX.h / 2) * s,
      w: TREE_BOX.w * s,
      h: TREE_BOX.h * s,
    });
    out.push(square('big frog', l.frogs[0], FROG_RADIUS * 2 * BIG_FROG));
    return out;
  }
  out.push(square('bird', { x: l.bird.x, y: l.bird.y - BIRD_LIFT }, BIRD_RADIUS * 2));
  l.frogs.forEach((f, i) => out.push(square(`frog ${i + 1}`, f, FROG_RADIUS * 2)));
  out.push(square('listen again', l.replay, BUTTON_RADIUS * 2));
  if (!plan.free && !plan.turn) out.push(square('help', l.help, BUTTON_RADIUS * 2));
  if (!plan.turn) out.push(square('send', l.submit, BUTTON_RADIUS * 2));
  return out;
}

it('covers levels 1 to 9: free play, replies, turns, the tree and the call', () => {
  expect(levels).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
  expect(levels.filter(treeLevel)).toEqual([7, 9]);
});

describe.each(Object.entries(views))('Rhythm Neighbors upright on %s', (_, v) => {
  it.each(levels)(
    'level %i: every touch target is whole, apart, in view and clear of Home and the guide',
    (level) => {
      expect(uprightProblems(v, targets(v, level)), `level ${level}`).toEqual([]);
    },
  );

  it.each(levels)('level %i: the buttons and frogs are in the lower part of the screen', (level) => {
    const plan = planFor(level);
    const l = neighborsLayout(v, { voices: plan.voices, tree: treeLevel(level) });
    for (const f of l.frogs) expect(f.y).toBeGreaterThan(v.h * 0.55);
    if (!treeLevel(level)) {
      expect(v.h - l.submit.y).toBeLessThanOrEqual(120);
      expect(l.replay.y).toBeGreaterThan(l.frogs[0].y + FROG_RADIUS);
    }
  });

  it('the pictured notes sit between the bird and the frogs, and span the screen', () => {
    const l = neighborsLayout(v, { voices: 2, tree: false });
    expect(l.bird.y - BIRD_LIFT + BIRD_RADIUS).toBeLessThan(l.score.y - 43);
    expect(l.score.y + 43).toBeLessThan(l.frogs[0].y - FROG_RADIUS);
    expect(l.score.x0 - 43).toBeGreaterThanOrEqual(0);
    expect(l.score.x1 + 43).toBeLessThanOrEqual(v.w);
    expect(l.bird.y - BIRD_LIFT - BIRD_RADIUS).toBeGreaterThanOrEqual(0);
  });

  it('the pond lies under the frogs and inside the view', () => {
    for (const tree of [false, true]) {
      const l = neighborsLayout(v, { voices: tree ? 1 : 2, tree });
      expect(l.pond.x - l.pond.rx).toBeGreaterThanOrEqual(0);
      expect(l.pond.x + l.pond.rx).toBeLessThanOrEqual(v.w);
      for (const f of l.frogs) expect(Math.abs(f.y - l.pond.y)).toBeLessThan(l.pond.ry);
    }
  });
});

describe('Rhythm Neighbors on other views', () => {
  it('sideways keeps its pond: the bird on the left, the buttons along the top', () => {
    const v = computeView(1024, 768, NO_INSETS);
    const l = neighborsLayout(v, { voices: 2, tree: false });
    expect(l.upright).toBe(false);
    expect(l.bird).toEqual({ x: 155, y: 300 });
    expect(l.frogs).toEqual([
      { x: 352, y: 588 },
      { x: 672, y: 588 },
    ]);
    expect([l.replay, l.help, l.submit]).toEqual([
      { x: 220, y: 65 },
      { x: 360, y: 65 },
      { x: 944, y: 65 },
    ]);
    expect(l.score).toEqual({ y: 290, x0: 250, x1: 904 });
    expect(l.pond).toEqual({ x: 512, y: 608, rx: 400, ry: 130 });
    const t = neighborsLayout(v, { voices: 1, tree: true });
    expect(t.bird.x).toBeCloseTo(1024 * 0.27);
    expect(t.frogs[0]).toEqual({ x: 1024 * 0.7, y: 578 });
    expect(t.treeScale).toBeCloseTo(Math.min(1, 508 / 640));
  });

  it('an upright tablet, which is not an upright phone, keeps the sideways pond', () => {
    const v = computeView(768, 1024, NO_INSETS);
    expect(v.upright).toBeUndefined();
    expect(neighborsLayout(v, { voices: 2, tree: false }).upright).toBe(false);
  });
});
