import { describe, expect, it } from 'vitest';
import { DEMO_SPOTS, LIMIT, pixel, place, PLANS, STAMP_COLORS, stampDemo, type StampKind, type StampState } from './logic';
import type { ColorName } from '../../art/palette';
describe('Stamp Studio', () => {
  it('keeps stamps on paper through resize, including edge drops', () => {
    for (const [w,h] of [[674,478],[674,1075],[1200,478]]) for (const x of [-300,0,300,2000]) for(const y of [-500,0,250,2000]) {
      const s = place(x,y,w,h), p = pixel(s,w,h);
      expect(p.x).toBeGreaterThanOrEqual(70); expect(p.x).toBeLessThanOrEqual(w-70);
      expect(p.y).toBeGreaterThanOrEqual(70); expect(p.y).toBeLessThanOrEqual(h-70);
      const changed=pixel(s,w+200,h+300); expect(place(changed.x,changed.y,w+200,h+300)).toEqual(s);
    }
  });
  it('offers simple lap choices and adds manipulation before story invitations', () => {
    expect(PLANS[0].kinds).toHaveLength(1); expect(PLANS[1].kinds).toHaveLength(2);
    expect(PLANS.slice(0,2).every(p=>!p.move && !p.transform)).toBe(true);
    expect(PLANS.slice(3).every(p=>p.move && p.transform)).toBe(true);
  });
  it('makes a small picture on every level, using only the buttons that level has, and ends on the green arrow', () => {
    // The smallest sheet the game draws (the 1024 by 768 design: 674 by 478).
    const [w, h] = [674, 478];
    for (const plan of PLANS) {
      const st: StampState = { stamps: [], kind: plan.kinds[0], color: 'purple' };
      const kinds = new Set<StampKind>();
      let move = false;
      let finished = false;
      for (let step = 0; step < 40 && !finished; step++) {
        const m = stampDemo(plan, st);
        if (m.do === 'kind') { expect(plan.kinds).toContain(m.kind); st.kind = m.kind; }
        else if (m.do === 'color') { expect(plan.color).toBe(true); expect(STAMP_COLORS).toContain(m.color); st.color = m.color as ColorName; }
        else if (m.do === 'stamp') {
          // It lands on empty paper, clear of every stamp already there, and inside the sheet.
          const p = pixel(m, w, h);
          for (const o of st.stamps) expect(Math.hypot(p.x - pixel(o, w, h).x, p.y - pixel(o, w, h).y)).toBeGreaterThan(160);
          expect(m.x).toBeGreaterThanOrEqual(0); expect(m.x).toBeLessThanOrEqual(1);
          st.stamps.push({ x: m.x, y: m.y, size: 1, turns: 0 }); kinds.add(st.kind);
        } else if (m.do === 'turn') { expect(plan.transform).toBe(true); st.stamps.at(-1)!.turns = 1; }
        else if (m.do === 'grow') { expect(plan.transform).toBe(true); st.stamps.at(-1)!.size = 1.3; }
        else if (m.do === 'move') {
          expect(plan.move).toBe(true);
          const to = pixel(m, w, h);
          for (const o of st.stamps.filter((_, i) => i !== m.stamp)) expect(Math.hypot(to.x - pixel(o, w, h).x, to.y - pixel(o, w, h).y)).toBeGreaterThan(110);
          Object.assign(st.stamps[m.stamp], { x: m.x, y: m.y }); move = true;
        } else finished = true;
      }
      expect(finished, `level ${PLANS.indexOf(plan) + 1} reaches the green arrow`).toBe(true);
      expect(st.stamps).toHaveLength(DEMO_SPOTS.length);
      expect(st.stamps.length).toBeLessThanOrEqual(LIMIT);
      expect(move).toBe(plan.move);
      // Every stamp the level offers is used, up to the five presses.
      expect(kinds.size).toBe(Math.min(plan.kinds.length, DEMO_SPOTS.length));
      if (plan.transform) expect(st.stamps.some((s) => s.turns === 1) && st.stamps.some((s) => s.size === 1.3)).toBe(true);
    }
  });
});
