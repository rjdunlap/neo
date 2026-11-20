import { describe, expect, it } from 'vitest';
import { computeView, NO_INSETS } from '../../engine/view';
import { uprightProblems, UPRIGHT_VIEWS, type Target } from '../upright-check';
import { layout } from './logic';
import { PLANS } from './logic';

const views = { ...UPRIGHT_VIEWS, minimum: computeView(768, 1024, NO_INSETS, true) };
const sideways = computeView(1024, 768, NO_INSETS);

describe('Shape Buddies layout', () => {
  it('keeps the sideways plan', () => {
    const l = layout(sideways.w, sideways.h, 1);
    expect(l.dy).toBe(0);
    expect(l.bridge).toEqual({ x: 400, y: 300 });
    expect(l.parks[1]).toEqual({ x: 420, y: 485 });
    expect(l.buttons.map((b) => b.x)).toEqual([340, 520, 700]);
    expect(layout(1024, 768, 6).buttons.map((b) => b.x)).toEqual([340, 520, 700, 880]);
  });
});

describe.each(Object.entries(views))('Shape Buddies upright on %s', (_, v) => {
  it.each(Object.keys(PLANS).map(Number))('level %i: targets fit, stand apart and hang from the bottom', (level) => {
    const l = layout(v.w, v.h, level, true);
    const plan = PLANS[level];
    const t: Target[] = [];
    const box = (what: string, p: { x: number; y: number }, w: number, h: number) => t.push({ what, x: p.x, y: p.y, w, h });
    if (plan.shared) {
      // Level 8 first shows only the two seat buttons.
      const seats = l.seats.map((p, i): Target => ({ what: `seat ${i}`, x: p.x, y: p.y, w: 112, h: 112 }));
      expect(uprightProblems(v, seats, 100)).toEqual([]);
    }
    if (!plan.plank) box('bridge dock', l.bridge, 180, 110);
    box('receiver dock', l.receiver, l.receiverWidth, 110);
    box('pot', l.pot, 120, 120);
    l.parks.forEach((p, i) => box(`park ${i}`, p, 140, 110));
    l.tools.forEach((p, i) => box(`tool ${i}`, p, 130, 110));
    l.buttons.forEach((p, i) => box(`button ${i}`, p, 112, 112));
    expect(uprightProblems(v, t, 100)).toEqual([]);
    // Hung up from the bottom: the tools sit a fixed gap above the buttons whatever the height.
    expect(v.h - 118 - l.tools[0].y).toBe(1024 - 118 - 485 - Math.min(0, v.h - 1024));
  });
});
