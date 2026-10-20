import { Container, Texture } from 'pixi.js';
import { describe, expect, it, vi } from 'vitest';
import { headTurn, headWeight, RIVER_ART, IllustratedRiver, weights } from './river-illustrated';
import { sameArt } from './illustrated';
import { alphaOf, illustratedSuite } from './illustrated-suite';
import base from './illustrated/river-base.png?inline';
import blink from './illustrated/river-blink.png?inline';
import happy from './illustrated/river-happy.png?inline';
import surprised from './illustrated/river-surprised.png?inline';
import sleepy from './illustrated/river-sleepy.png?inline';
import sad from './illustrated/river-sad.png?inline';
import nohead from './illustrated/river-nohead.png?inline';

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

describe('the river’s head turns over the no-head plate (RW02b step 2 follow-up)', () => {
  const H = RIVER_ART.head;
  const build = () => new IllustratedRiver({ ...sameArt(Texture.WHITE), nohead: Texture.EMPTY });

  it('has a plate the size of the set, its head painted out and its body kept', async () => {
    const plate = await alphaOf(nohead);
    const art = await alphaOf(base);
    expect([plate.w, plate.h]).toEqual([RIVER_ART.width, RIVER_ART.height]);
    for (const p of [...RIVER_ART.eyes, RIVER_ART.nose, ...RIVER_ART.ears]) expect(plate.at(p.x, p.y), `${p.x},${p.y}`).toBe(0);
    for (const p of [RIVER_ART.slots.back, RIVER_ART.slots.tummy, RIVER_ART.slots.neck, RIVER_ART.hips, RIVER_ART.tail.root]) expect(plate.at(p.x, p.y), `${p.x},${p.y}`).toBe(255);
    // Nothing of the plate lies outside the base's outline, beyond the preparation's 4 px tolerance.
    for (let y = 0; y < plate.h; y += 2) for (let x = 0; x < plate.w; x += 2) {
      if (plate.at(x, y) < 128) continue;
      let near = false;
      for (let dy = -4; dy <= 4 && !near; dy += 2) for (let dx = -4; dx <= 4 && !near; dx += 2) near = art.at(x + dx, y + dy) > 20;
      expect(near, `${x},${y}`).toBe(true);
    }
  });

  it('turns the head and its face while the cut and the paws stay put, with no jump or tear', () => {
    const c = build();
    const near = (p: { x: number; y: number }) => {
      let best = 0;
      for (let i = 0; i < c.headRest.length; i += 2) if (Math.hypot(c.headRest[i] - p.x, c.headRest[i + 1] - p.y) < Math.hypot(c.headRest[best] - p.x, c.headRest[best + 1] - p.y)) best = i;
      return best;
    };
    const cols = c.head.geometry.verticesX;
    const rows = c.head.geometry.verticesY;
    // The cut: the box's left column and bottom row take none of the turn.
    const cut: number[] = [];
    for (let r = 0; r < rows; r++) cut.push(r * cols * 2);
    for (let q = 0; q < cols; q++) cut.push(((rows - 1) * cols + q) * 2);
    for (const i of cut) expect(headWeight(c.headRest[i], c.headRest[i + 1])).toBe(0);
    const face = [...RIVER_ART.eyes, RIVER_ART.nose, RIVER_ART.mouth].map(near);
    const moved = (i: number) => {
      const p = c.head.geometry.positions;
      return Math.hypot(p[i] - c.headRest[i], p[i + 1] - c.headRest[i + 1]);
    };
    let travel = 0;
    let worstStep = 0;
    let worstStretch = 0;
    let prev = c.head.geometry.positions.slice();
    for (let f = 0; f < 900; f++) {
      if (f === 120 || f === 140 || f === 500) c.poke();
      c.update(1 / 60);
      const p = c.head.geometry.positions;
      for (const i of face) travel = Math.max(travel, moved(i));
      // The cut moves only as the back under it does (the wave reaches a little way up behind the ear).
      for (const i of cut) expect(moved(i)).toBeLessThanOrEqual(16 * weights(c.headRest[i], c.headRest[i + 1]).wave + 1e-3);
      for (let i = 0; i < p.length; i += 2) {
        worstStep = Math.max(worstStep, Math.hypot(p[i] - prev[i], p[i + 1] - prev[i + 1]));
        if ((i / 2) % cols !== cols - 1) worstStretch = Math.max(worstStretch, Math.hypot(p[i + 2] - p[i], p[i + 3] - p[i + 1]) / (c.headRest[i + 2] - c.headRest[i]));
      }
      prev = p.slice();
    }
    expect(travel).toBeGreaterThan(12);
    expect(worstStep).toBeLessThan(4);
    expect(worstStretch).toBeLessThan(1.5);
  });

  it('keeps the plate’s neck under the head at the furthest look either way', async () => {
    const plate = await alphaOf(nohead);
    const art = await alphaOf(base);
    let lo = 0;
    let hi = 0;
    for (let t = 0; t < 20; t += 0.01) for (const ex of [0, 1]) {
      lo = Math.min(lo, headTurn(t, ex));
      hi = Math.max(hi, headTurn(t, ex));
    }
    expect(lo).toBeLessThan(-0.19);
    for (const turn of [lo, hi]) {
      for (let y = H.y; y < H.y + H.h; y += 2) for (let x = H.x; x < H.x + H.w; x += 2) {
        // A plate pixel the head covers at rest (the neck's cap, the throat) must stay covered.
        if (plate.at(x, y) < 20 || art.at(x, y) < 250 || headWeight(x, y) === 0) continue;
        // Where the head layer's picture lands on this plate pixel: turn back about the throat (twice, as the weight varies).
        let p: { x: number; y: number } = { x, y };
        for (let n = 0; n < 3; n++) {
          const a = -turn * headWeight(p.x, p.y);
          const ox = x - RIVER_ART.nape.x;
          const oy = y - RIVER_ART.nape.y;
          p = { x: RIVER_ART.nape.x + ox * Math.cos(a) - oy * Math.sin(a), y: RIVER_ART.nape.y + ox * Math.sin(a) + oy * Math.cos(a) };
        }
        // Within a pixel, for rounding.
        const under = Math.max(art.at(p.x, p.y), art.at(p.x + 1, p.y), art.at(p.x - 1, p.y), art.at(p.x, p.y + 1), art.at(p.x, p.y - 1));
        expect(under, `${x},${y} at ${turn.toFixed(2)}`).toBeGreaterThan(20);
      }
    }
  });

  it('shows the expression on the head and the plate on the body, and carries what the head wears', () => {
    const textures = { ...sameArt(new Texture()), nohead: new Texture() };
    const c = new IllustratedRiver(textures);
    expect(c.mesh.texture).toBe(textures.nohead);
    expect(c.faceMesh).toBe(c.head);
    const crown = new Container();
    const boot = new Container();
    c.pin(crown, RIVER_ART.slots.head);
    c.pin(boot, RIVER_ART.slots.feet[0]);
    const gap = () => Math.hypot(crown.x - boot.x, crown.y - boot.y);
    const rest = gap();
    let swing = 0;
    for (let f = 0; f < 600; f++) {
      c.update(1 / 60);
      swing = Math.max(swing, Math.abs(gap() - rest));
    }
    // The paws are pinned, so the crown moving against a boot is the head turning.
    expect(swing).toBeGreaterThan(3);
    const freed = vi.spyOn(c.head.geometry, 'destroy');
    c.destroy({ children: true });
    expect(freed).toHaveBeenCalled();
    expect(textures.nohead.destroyed).toBe(false);
  });
});
