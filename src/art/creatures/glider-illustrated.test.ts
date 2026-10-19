import { describe, expect, it } from 'vitest';
import { GLIDER_ART, IllustratedGlider, weights } from './glider-illustrated';
import { illustratedSuite } from './illustrated-suite';
import base from './illustrated/glider-base.png?inline';
import blink from './illustrated/glider-blink.png?inline';
import happy from './illustrated/glider-happy.png?inline';
import surprised from './illustrated/glider-surprised.png?inline';
import sleepy from './illustrated/glider-sleepy.png?inline';
import sad from './illustrated/glider-sad.png?inline';

illustratedSuite({
  species: 'glider',
  A: GLIDER_ART,
  pngs: { base, blink, happy, surprised, sleepy, sad },
  make: (t) => new IllustratedGlider(t),
  stageScale: 0.8,
  tip: { x: GLIDER_ART.wing.tip.x + 15, y: GLIDER_ART.wing.tip.y + 12 },
  minTravel: 12,
  pinned: [GLIDER_ART.slots.back, { x: 640, y: 250 }],
  maxStep: 14,
});

describe('glider weights', () => {
  it('pin the face and wing root and move the wing tip, fins and both ribbons', () => {
    const A = GLIDER_ART;
    for (const p of [...A.eyes, A.nose, A.slots.back]) expect(weights(p.x, p.y)).toMatchObject({ wing: 0, fin: [0, 0], ribbon: [0, 0] });
    expect(weights(A.wing.root.x, A.wing.root.y).wing).toBe(0);
    expect(weights(A.wing.tip.x + 15, A.wing.tip.y + 12).wing).toBeGreaterThan(0.7);
    expect(weights(A.fins[0].tip.x, A.fins[0].tip.y + 8).fin[0]).toBeGreaterThan(0.5);
    expect(weights(A.fins[1].tip.x, A.fins[1].tip.y - 8).fin[1]).toBeGreaterThan(0.5);
    expect(weights(A.ribbons[0].tip.x + 40, A.ribbons[0].tip.y).ribbon[0]).toBeGreaterThan(0.8);
    expect(weights(A.ribbons[1].tip.x + 40, A.ribbons[1].tip.y).ribbon[1]).toBeGreaterThan(0.8);
  });
});
