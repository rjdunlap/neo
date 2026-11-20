import { describe, expect, it } from 'vitest';
import { computeView, NO_INSETS } from '../../engine/view';
import { uprightProblems, UPRIGHT_VIEWS, type Target } from '../upright-check';
import { tabletLayout, UPRIGHT_FLOOR, type Rect } from './logic';

const views = { ...UPRIGHT_VIEWS, minimum: computeView(768, 1024, NO_INSETS, true) };
const LEVELS = [1, 2, 3, 4, 5, 6];

const box = (what: string, r: Rect): Target => ({ what, x: r.x + r.w / 2, y: r.y + r.h / 2, w: r.w, h: r.h });

describe.each(Object.entries(views))('River Tablets upright on %s', (_, v) => {
  it.each(LEVELS)('level %i: lays out, targets fit, apart, clear of Home and the guide', (level) => {
    const l = tabletLayout(level, v);
    expect(l).not.toBeNull();
    if (!l) return;
    const t: Target[] = [
      ...l.inputs.filter((p) => p !== l.ball && p !== l.tablet).map((p, i) => box(`input ${i}`, p)),
      ...(l.cells ?? []).map((p, i) => box(`cell ${i}`, p)),
      ...(l.crates ?? []).map((p, i) => box(`crate ${i}`, p)),
    ];
    expect(uprightProblems(v, t)).toEqual([]);
    // Hung up from the bottom edge: the lowest thing sits near it, not mid-screen.
    const lowest = Math.max(...[...t, box('lineup', l.lineup)].map((b) => b.y + b.h / 2));
    expect(v.h - lowest).toBeLessThanOrEqual(UPRIGHT_FLOOR + 1);
  });
});
