import { describe, expect, it } from 'vitest';
import { computeView, NO_INSETS } from '../../engine/view';
import { square, uprightProblems, UPRIGHT_VIEWS, type Target } from '../upright-check';
import { CASES, layout, STALL } from './logic';

/**
 * Swap Meet held upright (chunk 31, docs/definitions/phone-portrait.md): every stage of every case on the upright phone
 * views. Targets are each friend's panel (with its request bubble), the trays and held objects, the goal card and the undo and help buttons; the
 * request bubbles and the reward row take no touch but must stay on screen and clear.
 */
const views = {
  ...UPRIGHT_VIEWS,
  tallest: computeView(360, 800, NO_INSETS, true),
  ipadShape: computeView(768, 1024, NO_INSETS, true),
  shortPhone: computeView(375, 600, NO_INSETS, true),
};
const shapes = new Set<string>();
for (const c of CASES)
  for (const s of c.stages)
    shapes.add(`${c.level}:${s.friends.length}:${s.basket.length}:${s.stall ? 1 : 0}:${c.goal ? 1 : 0}`);

describe.each(Object.entries(views))('Swap Meet upright on %s', (_, v) => {
  it.each([...shapes])('level:friends:slots:stall:goal %s: targets are whole, apart and clear', (key) => {
    const [, f, b, stall, hasGoal] = key.split(':').map(Number);
    const l = layout(v, f, b, !!stall);
    const t: Target[] = [];
    // A friend's panel and the request bubble at its corner stand as one box (-75..134 across, -130..73 down).
    l.friends.forEach((p, i) => {
      t.push({ what: `friend ${i + 1}`, x: p.x + 29.5, y: p.y - 28.5, w: 209, h: 203 });
    });
    l.basket.forEach((p, i) => t.push({ what: `tray ${i + 1}`, x: p.x, y: p.y, w: 150, h: 140 }));
    t.push(square('undo', l.undo, 100), square('help', l.help, 100));
    // Level 6's three shelf goods are full targets; the stall panel around them is checked as a body below.
    l.shelf.forEach((p, i) => t.push(square(`shelf good ${i + 1}`, p, 104)));
    const loose: Target[] = [];
    if (hasGoal) loose.push({ what: 'goal card', x: l.goal.x, y: l.goal.y - 35, w: 124, h: 130 });
    expect(uprightProblems(v, [...t, ...loose], 0)).toEqual([]);
    expect(uprightProblems(v, t)).toEqual([]);
    if (l.stall) {
      const body = { what: 'stall', x: l.stall.x, y: l.stall.y, w: STALL.w * 2, h: STALL.h * 2 };
      const others = t.filter((x) => !x.what.startsWith('shelf'));
      expect(uprightProblems(v, [...others, ...loose, body], 0)).toEqual([]);
    }
  });
  it('keeps the trays well above the bottom edge and the friends below Home', () => {
    const l = layout(v, 3, 3);
    for (const p of l.basket) expect(v.h - p.y).toBeGreaterThanOrEqual(190);
    for (const p of l.friends) expect(p.y).toBeGreaterThanOrEqual(420);
    // Level 3's four friends have no trays, but their second row still ends above the rewards row at the foot.
    expect(l.friends[2].y + 73).toBeLessThan(v.h - 90);
  });
});
