import { describe, expect, it } from 'vitest';
import { SPROUT_ART, IllustratedSprout, weights } from './sprout-illustrated';
import { illustratedSuite } from './illustrated-suite';
import base from './illustrated/sprout-base.png?inline';
import blink from './illustrated/sprout-blink.png?inline';
import happy from './illustrated/sprout-happy.png?inline';
import surprised from './illustrated/sprout-surprised.png?inline';
import sleepy from './illustrated/sprout-sleepy.png?inline';
import sad from './illustrated/sprout-sad.png?inline';

illustratedSuite({
  species: 'sprout',
  A: SPROUT_ART,
  pngs: { base, blink, happy, surprised, sleepy, sad },
  make: (t) => new IllustratedSprout(t),
  stageScale: 0.95,
  tip: { x: SPROUT_ART.leaves.tips[0].x + 12, y: SPROUT_ART.leaves.tips[0].y + 8 },
  minTravel: 12,
  pinned: [SPROUT_ART.slots.tummy, ...SPROUT_ART.slots.feet],
  maxStep: 14,
});

describe('sprout weights', () => {
  it('pin the face, feet and belly and move the leaves and arms', () => {
    const A = SPROUT_ART;
    for (const p of [...A.eyes, A.nose, A.slots.tummy, ...A.slots.feet]) expect(weights(p.x, p.y)).toEqual({ leaf: 0, arm: [0, 0] });
    expect(weights(A.leaves.root.x, A.leaves.root.y).leaf).toBe(0);
    expect(weights(A.leaves.tips[0].x + 12, A.leaves.tips[0].y + 8).leaf).toBeGreaterThan(0.9);
    expect(weights(A.leaves.tips[1].x - 12, A.leaves.tips[1].y + 4).leaf).toBeGreaterThan(0.9);
    expect(weights(A.arms[0].centre.x, A.arms[0].centre.y).arm[0]).toBeGreaterThan(0.9);
    expect(weights(A.arms[1].centre.x, A.arms[1].centre.y).arm[1]).toBeGreaterThan(0.9);
  });
});
