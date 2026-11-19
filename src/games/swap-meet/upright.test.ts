import { describe, expect, it } from 'vitest';
import { computeView, NO_INSETS } from '../../engine/view';
import { square, uprightProblems, UPRIGHT_VIEWS, type Target } from '../upright-check';
import { CASES, layout } from './logic';

/**
 * Swap Meet held upright (chunk 31, docs/definitions/phone-portrait.md): every stage of every case on the upright phone
 * views. Targets are each friend's panel (with its request bubble), the trays and held objects, the goal card and the undo and help buttons; the
 * request bubbles and the reward row take no touch but must stay on screen and clear.
 */
const views = {
  ...UPRIGHT_VIEWS,
  tallest: computeView(360, 800, NO_INSETS, true),
  ipadShape: computeView(768, 1024, NO_INSETS, true),
};
const shapes = new Set<string>();
for (const c of CASES)
  for (const s of c.stages) shapes.add(`${c.level}:${s.friends.length}:${s.basket.length}`);

describe.each(Object.entries(views))('Swap Meet upright on %s', (_, v) => {
  it.each([...shapes])('level:friends:slots %s: targets are whole, apart and clear', (key) => {
    const [level, f, b] = key.split(':').map(Number);
    const l = layout(v, f, b);
    const t: Target[] = [];
    // A friend's panel and the request bubble at its corner stand as one box (-75..134 across, -130..73 down).
    l.friends.forEach((p, i) => {
      t.push({ what: `friend ${i + 1}`, x: p.x + 29.5, y: p.y - 28.5, w: 209, h: 203 });
    });
    l.basket.forEach((p, i) => t.push({ what: `tray ${i + 1}`, x: p.x, y: p.y, w: 150, h: 140 }));
    t.push(square('undo', l.undo, 100), square('help', l.help, 100));
    const loose: Target[] = [];
    if (level === 4) loose.push({ what: 'goal card', x: l.goal.x, y: l.goal.y - 35, w: 124, h: 130 });
    expect(uprightProblems(v, [...t, ...loose], 0)).toEqual([]);
    expect(uprightProblems(v, t)).toEqual([]);
  });
  it('keeps the trays well above the bottom edge and the friends below Home', () => {
    const l = layout(v, 3, 3);
    for (const p of l.basket) expect(v.h - p.y).toBeGreaterThanOrEqual(190);
    for (const p of l.friends) expect(p.y).toBeGreaterThanOrEqual(420);
    // Level 3's four friends have no trays, but their second row still ends above the rewards row at the foot.
    expect(l.friends[2].y + 73).toBeLessThan(v.h - 90);
  });
});
