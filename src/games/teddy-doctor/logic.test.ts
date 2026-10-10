import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { AILMENTS, AIM_PARTS, CHECKS, CURE, doctorTouch, makeRounds, nearestPart, partSpot, PATIENTS, PLANS, SCRAPE_PARTS, wantedTool } from './logic';

describe('Teddy Doctor', () => {
  it('demonstrates every patient with the right tool, place, and check-up order', () => {
    for (const plan of PLANS) for (let seed = 1; seed <= 50; seed++) {
      for (const round of makeRounds(plan, new Rng(seed))) {
        const scrapes = [...round.scrapes];
        let step = 0;
        for (let moves = 0; moves < 5; moves++) {
          const touch = doctorTouch(plan.mode, round, step, scrapes);
          if (!touch) break;
          if (plan.mode === 'play') {
            expect(touch).toEqual({ kind: 'tap', part: scrapes[0] });
            scrapes.shift();
          } else if (plan.mode === 'part') {
            expect(touch).toEqual({ kind: 'tool', tool: 'bandage', part: scrapes[0] });
            scrapes.shift();
          } else if (plan.mode === 'tool' || plan.mode === 'clue') {
            expect(touch).toEqual({ kind: 'tool', tool: CURE[round.ailment!].tool, part: round.part });
            step++;
            break;
          } else {
            const tool = round.steps[step];
            expect(touch).toEqual({ kind: 'tool', tool, part: ({ stethoscope: 'tummy', thermometer: 'mouth', flashlight: 'ear' } as const)[tool] });
            step++;
          }
        }
        expect(scrapes).toHaveLength(0);
        if (plan.mode === 'card' || plan.mode === 'told') expect(step).toBe(round.steps.length);
      }
    }
  });

  it('gives every ailment its own cure', () => {
    const tools = AILMENTS.map((a) => CURE[a].tool);
    expect(new Set(tools).size).toBe(AILMENTS.length);
  });

  it('always offers what helps, never two of the same, and never the same patient or problem twice in a row', () => {
    for (const plan of PLANS) {
      for (let seed = 1; seed <= 300; seed++) {
        const rounds = makeRounds(plan, new Rng(seed));
        expect(rounds).toHaveLength(plan.patients);
        rounds.forEach((r, i) => {
          if (i > 0) expect(r.patient).not.toBe(rounds[i - 1].patient);
          if (plan.mode === 'play' || plan.mode === 'part') {
            expect(new Set(r.scrapes).size).toBe(r.scrapes.length);
            expect(r.scrapes.length).toBeGreaterThanOrEqual(2);
            for (const p of r.scrapes) expect(SCRAPE_PARTS).toContain(p);
          }
          if (plan.mode === 'tool' || plan.mode === 'clue') {
            expect(r.tools).toHaveLength(plan.choices);
            expect(new Set(r.tools).size).toBe(plan.choices);
            expect(r.tools).toContain(wantedTool(r));
            expect(r.part).not.toBeNull();
            if (i > 0) expect(r.ailment).not.toBe(rounds[i - 1].ailment);
          }
          if (plan.mode === 'card' || plan.mode === 'told') {
            expect([...r.steps].sort()).toEqual([...CHECKS].sort());
            r.steps.forEach((step, k) => expect(wantedTool(r, k)).toBe(step));
            if (i > 0) expect(r.steps.join()).not.toBe(rounds[i - 1].steps.join());
          }
        });
      }
    }
  });

  it('keeps every boo-boo on the upper body or on a foot, never low in the gap between the feet', () => {
    // The feet are ovals at x = ±40, 30 wide and 14 tall around the floor line (y = 0).
    for (const patient of PATIENTS) {
      for (const part of AIM_PARTS) {
        const s = partSpot(patient, part);
        const inGap = Math.abs(s.x) < 30 && s.y > -40;
        expect(inGap, `${patient} ${part} at ${s.x},${s.y}`).toBe(false);
      }
      const foot = partSpot(patient, 'feet');
      expect(Math.abs(foot.x), `${patient} feet`).toBe(40);
      expect(Math.abs(foot.y), `${patient} feet`).toBeLessThan(14);
      // The tummy is in the middle of the belly (the belly oval runs from -119 to -11), clear of the mouth.
      const tummy = partSpot(patient, 'tummy');
      const mouth = partSpot(patient, 'mouth');
      expect(tummy.y, `${patient} tummy`).toBeLessThanOrEqual(-50);
      expect(tummy.y - mouth.y, `${patient} tummy below the mouth`).toBeGreaterThanOrEqual(16);
    }
  });

  it('counts either foot and either ear: the body is mirrored', () => {
    for (const patient of PATIENTS) {
      for (const part of ['feet', 'ear'] as const) {
        const s = partSpot(patient, part);
        expect(nearestPart(patient, -s.x, s.y), `${patient} left ${part}`).toBe(part);
        expect(nearestPart(patient, -s.x, s.y, SCRAPE_PARTS), `${patient} left ${part} among the boo-boo places`).toBe(part);
      }
    }
  });

  it('tells body parts apart: each part is found at its own spot on every patient', () => {
    for (const patient of PATIENTS) {
      for (const part of AIM_PARTS) {
        const s = partSpot(patient, part);
        expect(nearestPart(patient, s.x, s.y), `${patient} ${part}`).toBe(part);
      }
      for (const part of SCRAPE_PARTS) {
        const s = partSpot(patient, part);
        // A drop a little off the spot, toward the middle of the body, still finds it among the boo-boo places.
        expect(nearestPart(patient, s.x * 0.85, s.y * 0.95, SCRAPE_PARTS), `${patient} ${part}`).toBe(part);
      }
    }
  });
});
