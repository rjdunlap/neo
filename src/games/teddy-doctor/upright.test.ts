import { describe, expect, it } from 'vitest';
import { computeView, NO_INSETS } from '../../engine/view';
import { uprightProblems, UPRIGHT_VIEWS, type Target } from '../upright-check';
import { CARD, PAIR_HIT, PATIENT_HIT, TOOL_HIT, cardFor, pairFor, spotFor, toolHomesFor } from './layout';
import { LEVELS, PLANS, planFor } from './logic';

/**
 * Teddy Doctor held upright (chunk 31, docs/definitions/phone-portrait.md): every level on the upright phone views.
 * The targets are the ones a round asks for: the patient (a tap box in the modes that tap it, the whole of it in `choose`
 * mode with its friend), and each tool on the tray at its resting place. The card is no target but must stay clear of the
 * tools and the patient.
 */
const views = { ...UPRIGHT_VIEWS, short: computeView(375, 601, NO_INSETS, true) };
const levels = [...new Set(Object.values(LEVELS).flatMap((l) => (l.order ?? []).concat(l.min, l.max)))].sort(
  (a, b) => a - b,
);

const box = (what: string, c: { x: number; y: number }, w: number, top: number, bottom: number): Target => ({
  what,
  x: c.x,
  y: c.y + (bottom - top) / 2,
  w,
  h: top + bottom,
});

describe.each(Object.entries(views))('Teddy Doctor upright on %s', (_, v) => {
  it.each(levels)(
    'level %i: patients and tools are whole, apart, in view and clear of Home and the guide',
    (level) => {
      const plan = planFor(level);
      const t: Target[] = [];
      const spot = spotFor(v);
      if (plan.mode === 'choose') {
        for (const side of [0, 1]) {
          const [hurt, fine] = pairFor(v, side);
          t.length = 0;
          t.push(box('hurt patient', hurt, PAIR_HIT.w, PAIR_HIT.top, PAIR_HIT.bottom));
          t.push(box('friend', fine, PAIR_HIT.w, PAIR_HIT.top, PAIR_HIT.bottom));
          expect(uprightProblems(v, t), `side ${side}`).toEqual([]);
        }
        // Once chosen the patient stands where the play mode does, with the larger box.
        t.length = 0;
      }
      if (['play', 'part', 'choose'].includes(plan.mode))
        t.push(box('patient', spot, PATIENT_HIT.w, PATIENT_HIT.top, PATIENT_HIT.bottom));
      toolHomesFor(v, plan.choices).forEach((p, i) =>
        t.push({ what: `tool ${i + 1}`, ...p, w: TOOL_HIT, h: TOOL_HIT }),
      );
      expect(uprightProblems(v, t)).toEqual([]);
      // The patient is on the screen in every mode, even where it is no tap target.
      const body = box('body', spot, PATIENT_HIT.w, PATIENT_HIT.top, PATIENT_HIT.bottom);
      expect(uprightProblems(v, [body])).toEqual([]);
      if (plan.choices > 0) {
        // The card sits above the tools and below Home, and the patient's body stays clear of it.
        const c = cardFor(v);
        const tools = toolHomesFor(v, plan.choices);
        expect(c.y + CARD.h / 2).toBeLessThanOrEqual(tools[0].y - TOOL_HIT / 2);
        expect(c.y - CARD.h / 2).toBeGreaterThanOrEqual(210);
        expect(tools[0].y + TOOL_HIT / 2).toBeLessThanOrEqual(spot.y - PATIENT_HIT.top);
      }
    },
  );

  it('has a plan for every level checked', () => {
    expect(levels.every((l) => l >= 1 && l <= PLANS.length)).toBe(true);
  });
});
