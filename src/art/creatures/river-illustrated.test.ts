import { describe, expect, it } from 'vitest';
import { RIVER_ART, IllustratedRiver, weights } from './river-illustrated';
import { illustratedSuite } from './illustrated-suite';
import base from './illustrated/river-base.png?inline';
import blink from './illustrated/river-blink.png?inline';
import happy from './illustrated/river-happy.png?inline';
import surprised from './illustrated/river-surprised.png?inline';
import sleepy from './illustrated/river-sleepy.png?inline';
import sad from './illustrated/river-sad.png?inline';

illustratedSuite({
  species: 'river',
  A: RIVER_ART,
  pngs: { base, blink, happy, surprised, sleepy, sad },
  make: (t) => new IllustratedRiver(t),
  stageScale: 0.8,
  tip: { x: RIVER_ART.tail.tip.x + 10, y: RIVER_ART.tail.tip.y },
  minTravel: 12,
  pinned: [...RIVER_ART.slots.hands, ...RIVER_ART.slots.feet],
  maxStep: 12,
});

describe('river weights', () => {
  it('pin the head and paws, run the wave from the neck to the hips and move the tail', () => {
    const A = RIVER_ART;
    for (const p of [...A.eyes, A.nose, ...A.slots.hands, ...A.slots.feet]) expect(weights(p.x, p.y)).toEqual({ wave: 0, tail: 0 });
    expect(weights(A.wave.root.x, A.wave.root.y).wave).toBe(0);
    expect(weights(A.slots.back.x, A.slots.back.y).wave).toBeGreaterThan(0.3);
    expect(weights(A.wave.tip.x, A.wave.tip.y).wave).toBeGreaterThan(0.9);
    expect(weights(A.tail.root.x, A.tail.root.y).tail).toBe(0);
    expect(weights(A.tail.tip.x + 10, A.tail.tip.y).tail).toBeGreaterThan(0.9);
  });
});
