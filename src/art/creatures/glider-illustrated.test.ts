import { Texture } from 'pixi.js';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { ACCESSORIES, ACCESSORY_SLOT, dress, makeCreature } from '.';
import { GLIDER_ART, IllustratedGlider, weights } from './glider-illustrated';
import gliderPng from './illustrated/glider.png?inline';

/** The prepared sprite's alpha channel (8-bit RGBA PNG, as the preparation script writes it). */
async function alphaOf(dataUrl: string) {
  const png = Uint8Array.from(atob(dataUrl.split(',')[1]), (c) => c.charCodeAt(0));
  const view = new DataView(png.buffer);
  const w = view.getUint32(16);
  const h = view.getUint32(20);
  expect([png[24], png[25], png[28]]).toEqual([8, 6, 0]); // 8-bit, RGBA, not interlaced
  const chunks: Uint8Array<ArrayBuffer>[] = [];
  for (let o = 8; o < png.length; ) {
    const len = view.getUint32(o);
    if (String.fromCharCode(...png.subarray(o + 4, o + 8)) === 'IDAT') chunks.push(png.slice(o + 8, o + 8 + len));
    o += len + 12;
  }
  const raw = new Uint8Array(await new Response(new Blob(chunks).stream().pipeThrough(new DecompressionStream('deflate'))).arrayBuffer());
  const row = w * 4;
  const out = new Uint8Array(row * h);
  for (let y = 0; y < h; y++) {
    const f = raw[y * (row + 1)];
    for (let x = 0; x < row; x++) {
      const v = raw[y * (row + 1) + 1 + x];
      const a = x >= 4 ? out[y * row + x - 4] : 0;
      const b = y > 0 ? out[(y - 1) * row + x] : 0;
      const c = x >= 4 && y > 0 ? out[(y - 1) * row + x - 4] : 0;
      const p = a + b - c;
      const pred = f === 1 ? a : f === 2 ? b : f === 3 ? (a + b) >> 1 : f === 4 ? (Math.abs(p - a) <= Math.abs(p - b) && Math.abs(p - a) <= Math.abs(p - c) ? a : Math.abs(p - b) <= Math.abs(p - c) ? b : c) : 0;
      out[y * row + x] = (v + pred) & 255;
    }
  }
  return { w, h, at: (x: number, y: number) => out[(Math.min(h - 1, Math.max(0, Math.round(y))) * w + Math.min(w - 1, Math.max(0, Math.round(x)))) * 4 + 3] };
}
let art: Awaited<ReturnType<typeof alphaOf>>;
beforeAll(async () => {
  art = await alphaOf(gliderPng);
});
/** Whether any of the picture is painted between two rest points (sampled along the segment). */
const painted = (x0: number, y0: number, x1: number, y1: number) => [0, 0.25, 0.5, 0.75, 1].some((t) => art.at(x0 + (x1 - x0) * t, y0 + (y1 - y0) * t) > 20);

const make = () => new IllustratedGlider(Texture.WHITE);
const near = (c: IllustratedGlider, x: number, y: number) => {
  let best = 0;
  for (let i = 0; i < c.rest.length; i += 2) if (Math.hypot(c.rest[i] - x, c.rest[i + 1] - y) < Math.hypot(c.rest[best] - x, c.rest[best + 1] - y)) best = i;
  return best;
};
const offset = (c: IllustratedGlider, i: number) => {
  const p = c.mesh.geometry.positions;
  return { x: p[i] - c.rest[i], y: p[i + 1] - c.rest[i + 1] };
};

describe('RW02b illustrated glider', () => {
  it('matches the prepared sprite’s recorded size and has a transparent border', () => {
    expect([art.w, art.h]).toEqual([GLIDER_ART.width, GLIDER_ART.height]);
    for (let x = 0; x < art.w; x++) expect(art.at(x, 0) + art.at(x, art.h - 1)).toBe(0);
    for (let y = 0; y < art.h; y++) expect(art.at(0, y) + art.at(art.w - 1, y)).toBe(0);
    for (const e of GLIDER_ART.eyes) expect(art.at(e.x, e.y)).toBe(255);
  });

  it('keeps the Graphics glider’s species, slots and deliberate scarf misfit', () => {
    const old = makeCreature('glider');
    const c = make();
    expect(c.species).toBe('glider');
    for (const kind of ACCESSORIES) {
      expect(!!c.slots[ACCESSORY_SLOT[kind]], kind).toBe(!!old.slots[ACCESSORY_SLOT[kind]]);
      expect(!!c.misfit[kind], kind).toBe(!!old.misfit[kind]);
      expect(dress(c, kind, true)).toBe(!old.misfit[kind]);
    }
    // Scaled as on the preview stage (0.8), the touch circle stays at least 100 logical units.
    expect(c.touch.r * 0.8).toBeGreaterThanOrEqual(100);
  });

  it('pins the face and wing root and moves the wing tip, fin and ribbons', () => {
    for (const e of GLIDER_ART.eyes) expect(weights(e.x, e.y)).toMatchObject({ wing: 0, fin: 0, ribbon: 0 });
    expect(weights(GLIDER_ART.wingRoot.x, GLIDER_ART.wingRoot.y).wing).toBe(0);
    expect(weights(GLIDER_ART.wingTip.x + 10, GLIDER_ART.wingTip.y + 10).wing).toBeGreaterThan(0.7);
    expect(weights(275, 20).fin).toBeGreaterThan(0.5);
    expect(weights(40, 140).ribbon).toBeGreaterThan(0.9);
  });

  it('bends the wing as a wave and never tears the mesh, through idle and repeated taps', () => {
    const c = make();
    const root = near(c, GLIDER_ART.wingRoot.x, GLIDER_ART.wingRoot.y);
    const eye = near(c, GLIDER_ART.eyes[0].x, GLIDER_ART.eyes[0].y);
    const tip = near(c, GLIDER_ART.wingTip.x + 15, GLIDER_ART.wingTip.y + 12);
    const mid = near(c, (GLIDER_ART.wingTip.x + GLIDER_ART.wingRoot.x) / 2, (GLIDER_ART.wingTip.y + GLIDER_ART.wingRoot.y) / 2);
    const cols = 30;
    let tipTravel = 0;
    let worstStretch = 0;
    const ratios: number[] = [];
    for (let f = 0; f < 600; f++) {
      if (f === 120 || f === 140 || f === 300) c.poke(); // a tap, a second tap mid-loop, and a later one
      c.update(1 / 60);
      expect(Math.hypot(offset(c, root).x, offset(c, root).y)).toBeLessThan(0.5);
      expect(Math.hypot(offset(c, eye).x, offset(c, eye).y)).toBeLessThan(0.5);
      tipTravel = Math.max(tipTravel, Math.abs(offset(c, tip).y));
      const m = offset(c, mid).y;
      if (Math.abs(m) > 2) ratios.push(offset(c, tip).y / m);
      // Where the picture is painted, neighbouring vertices stay close: no pixel stretches past double.
      const p = c.mesh.geometry.positions;
      for (let i = 0; i + 2 < p.length; i += 2) {
        if ((i / 2) % cols === cols - 1) continue;
        if (!painted(c.rest[i], c.rest[i + 1], c.rest[i + 2], c.rest[i + 3])) continue;
        const restGap = c.rest[i + 2] - c.rest[i];
        worstStretch = Math.max(worstStretch, Math.hypot(p[i + 2] - p[i], p[i + 3] - p[i + 1]) / restGap);
      }
    }
    expect(tipTravel).toBeGreaterThan(12);
    expect(worstStretch).toBeLessThan(2);
    // A hinge would keep tip/mid constant; a bending wave does not.
    expect(Math.max(...ratios) - Math.min(...ratios)).toBeGreaterThan(0.5);
  });

  it('never jumps between frames, at the start or end of a reaction or on a re-tap', () => {
    const c = make();
    for (let i = 0; i < 30; i++) c.update(1 / 60);
    let prev = c.mesh.geometry.positions.slice();
    let worst = 0;
    for (let f = 0; f < 400; f++) {
      if (f === 20 || f === 120 || f === 130) c.poke(); // into a reaction, past its end, then two quick taps
      c.update(1 / 60);
      const p = c.mesh.geometry.positions;
      for (let i = 0; i < p.length; i += 2) worst = Math.max(worst, Math.hypot(p[i] - prev[i], p[i + 1] - prev[i + 1]));
      prev = p.slice();
    }
    // The fastest honest motion (tip at full lift and the fast beat) is under 6 px a frame.
    expect(worst).toBeLessThan(8);
  });

  it('carries the crown through the loop and settles it back', () => {
    const c = make();
    dress(c, 'crown', true);
    c.update(1 / 60);
    const at = () => c.slots.head!.node.getGlobalPosition().clone();
    const rest = at();
    c.poke();
    let moved = 0;
    for (let i = 0; i < 30; i++) {
      c.update(1 / 60);
      moved = Math.max(moved, Math.hypot(at().x - rest.x, at().y - rest.y));
    }
    expect(moved).toBeGreaterThan(15);
    for (let i = 0; i < 120; i++) c.update(1 / 60);
    expect(Math.hypot(at().x - rest.x, at().y - rest.y)).toBeLessThan(30);
  });

  it('releases its own geometry and leaves the shared texture alone', () => {
    const texture = new Texture();
    const c = new IllustratedGlider(texture);
    const freed = vi.spyOn(c.mesh.geometry, 'destroy');
    c.destroy({ children: true });
    expect(freed).toHaveBeenCalled();
    expect(texture.destroyed).toBe(false);
  });
});
