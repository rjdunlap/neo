import { Texture } from 'pixi.js';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { ACCESSORIES, ACCESSORY_SLOT, dress, makeCreature } from '.';
import type { CastId } from './cast';
import type { SpeciesId } from './creature';
import { type ArtBase, EXPRESSIONS, type Expression, type IllustratedCreature, type Point, sameArt, SURPRISE } from './illustrated';

/**
 * The checks every illustrated rig passes (RW02b step 2), run by each species' test file with its
 * own sprites, table, constructor and moving tip. Test-only: nothing in the app imports this.
 */

/** A prepared sprite's alpha channel (8-bit RGBA PNG, as the preparation script writes it). */
export async function alphaOf(dataUrl: string) {
  const png = Uint8Array.from(atob(dataUrl.split(',')[1]), (c) => c.charCodeAt(0));
  const view = new DataView(png.buffer);
  const w = view.getUint32(16);
  const h = view.getUint32(20);
  if (png[24] !== 8 || png[25] !== 6 || png[28] !== 0) throw new Error('not an 8-bit, RGBA, non-interlaced PNG');
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
type Alpha = Awaited<ReturnType<typeof alphaOf>>;

export interface SuiteSpec<C extends IllustratedCreature> {
  species: SpeciesId | CastId;
  /** Whether a Graphics rig of the species exists to match slots and misfits against (the pilot three); the second wave checks its own table. */
  twin?: boolean;
  A: ArtBase & { nose: Point; mouth: Point };
  /** The six prepared sprites as data URLs (`?inline` imports). */
  pngs: Record<Expression, string>;
  make: (textures: Parameters<typeof sameArt>[0] extends Texture ? ReturnType<typeof sameArt> : never) => C;
  /** The scale the preview shows it at on the stage; the touch circle must still reach 100 units. */
  stageScale: number;
  /** A point on the moving part's tip, in sprite pixels, and how far it must travel. */
  tip: Point;
  minTravel: number;
  /** Points that must not move, beyond the eyes, nose and mouth. */
  pinned: Point[];
  /** The most any vertex may move between frames, in sprite pixels. */
  maxStep: number;
}

export function illustratedSuite<C extends IllustratedCreature>({ species, twin = true, A, pngs, make, stageScale, tip, minTravel, pinned, maxStep }: SuiteSpec<C>) {
  let art: Record<Expression, Alpha>;
  beforeAll(async () => {
    const entries = await Promise.all(EXPRESSIONS.map(async (e) => [e, await alphaOf(pngs[e])] as const));
    art = Object.fromEntries(entries) as Record<Expression, Alpha>;
  });
  /** Whether any of the base picture is painted between two rest points (sampled along the segment). */
  const painted = (x0: number, y0: number, x1: number, y1: number) => [0, 0.25, 0.5, 0.75, 1].some((t) => art.base.at(x0 + (x1 - x0) * t, y0 + (y1 - y0) * t) > 20);
  const build = () => make(sameArt(Texture.WHITE));
  const near = (c: C, p: Point) => {
    let best = 0;
    for (let i = 0; i < c.rest.length; i += 2) if (Math.hypot(c.rest[i] - p.x, c.rest[i + 1] - p.y) < Math.hypot(c.rest[best] - p.x, c.rest[best + 1] - p.y)) best = i;
    return best;
  };
  const offset = (c: C, i: number) => {
    const p = c.mesh.geometry.positions;
    return Math.hypot(p[i] - c.rest[i], p[i + 1] - c.rest[i + 1]);
  };
  const still = [...A.eyes, A.nose, A.mouth, ...pinned];

  describe(`RW02b illustrated ${species}`, () => {
    it('matches the recorded size, has a transparent border, opaque eyes, and every expression the same size', () => {
      expect([art.base.w, art.base.h]).toEqual([A.width, A.height]);
      for (const e of EXPRESSIONS) {
        const a = art[e];
        expect([a.w, a.h], e).toEqual([A.width, A.height]);
        for (let x = 0; x < a.w; x++) expect(a.at(x, 0) + a.at(x, a.h - 1), `${e} column ${x}`).toBe(0);
        for (let y = 0; y < a.h; y++) expect(a.at(0, y) + a.at(a.w - 1, y), `${e} row ${y}`).toBe(0);
      }
      for (const e of A.eyes) expect(art.base.at(e.x, e.y)).toBe(255);
    });

    it(twin ? 'keeps the Graphics species’ slots and misfits, and a touch circle of at least 100 units on the stage' : 'has a slot for every accessory it does not decline, and a touch circle of at least 100 units on the stage', () => {
      const c = build();
      // The second wave has no Graphics twin: its own misfits are the reference, and each must have a reason.
      const old = twin ? makeCreature(species as SpeciesId) : { slots: Object.fromEntries(ACCESSORIES.filter((k) => !c.misfit[k]).map((k) => [ACCESSORY_SLOT[k], true])), misfit: c.misfit };
      for (const reason of Object.values(c.misfit)) expect(reason.length).toBeGreaterThan(10);
      expect(c.species).toBe(species);
      for (const kind of ACCESSORIES) {
        expect(!!c.slots[ACCESSORY_SLOT[kind]], kind).toBe(!!old.slots[ACCESSORY_SLOT[kind]]);
        expect(!!c.misfit[kind], kind).toBe(!!old.misfit[kind]);
        expect(dress(c, kind, true)).toBe(!old.misfit[kind]);
        expect(c.wearing(kind)).toBe(!old.misfit[kind]);
      }
      for (const kind of ACCESSORIES) dress(c, kind, false);
      for (const kind of ACCESSORIES) expect(c.wearing(kind)).toBe(false);
      expect(c.touch.r * stageScale).toBeGreaterThanOrEqual(100);
    });

    it.each(Array.from({ length: 21 }, (_, i) => i / 21))('pins the face and body, moves the part’s tip, and never tears the picture through idle and repeated taps (phase %s)', (phase) => {
      // Cover the randomized initial clock deliberately, including both ends of its range.
      const random = vi.spyOn(Math, 'random').mockReturnValue(phase);
      let c: C;
      try {
        c = build();
      } finally {
        random.mockRestore();
      }
      const fixed = still.map((p) => near(c, p));
      const moving = near(c, tip);
      const cols = c.mesh.geometry.verticesX;
      let travel = 0;
      let worstStretch = 0;
      for (let f = 0; f < 600; f++) {
        if (f === 120 || f === 140 || f === 300) c.poke(); // a tap, a second tap mid-reaction, and a later one
        c.update(1 / 60);
        for (const i of fixed) expect(offset(c, i)).toBeLessThan(0.5);
        travel = Math.max(travel, offset(c, moving));
        // Where the picture is painted, neighbouring vertices stay close: no pixel stretches past double.
        const p = c.mesh.geometry.positions;
        for (let i = 0; i + 2 < p.length; i += 2) {
          if ((i / 2) % cols === cols - 1) continue;
          if (!painted(c.rest[i], c.rest[i + 1], c.rest[i + 2], c.rest[i + 3])) continue;
          worstStretch = Math.max(worstStretch, Math.hypot(p[i + 2] - p[i], p[i + 3] - p[i + 1]) / (c.rest[i + 2] - c.rest[i]));
        }
      }
      expect(travel).toBeGreaterThan(minTravel);
      expect(worstStretch).toBeLessThan(2);
      c.destroy({ children: true });
    });

    it('never jumps between frames, at the start or end of a reaction or on a re-tap', () => {
      const c = build();
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
      expect(worst).toBeLessThan(maxStep);
    });

    it('swaps whole textures: surprised then happy on a touch, a blink while calm, and the set mood', () => {
      const textures = Object.fromEntries(EXPRESSIONS.map((e) => [e, new Texture()])) as Record<Expression, Texture>;
      const c = make(textures);
      c.update(1 / 60);
      expect(c.faceMesh.texture).toBe(textures.base);
      c.poke();
      c.update(1 / 60);
      expect(c.expression()).toBe('surprised');
      expect(c.faceMesh.texture).toBe(textures.surprised);
      for (let i = 0; i < Math.ceil(SURPRISE * 60) + 1; i++) c.update(1 / 60);
      expect(c.faceMesh.texture).toBe(textures.happy);
      for (let i = 0; i < 120; i++) c.update(1 / 60);
      // Back to the calm face (a blink may be passing).
      expect([textures.base, textures.blink]).toContain(c.faceMesh.texture);
      // Blinks come by themselves within a few seconds while calm, and show the blink texture.
      let blinked = false;
      for (let i = 0; i < 600 && !blinked; i++) {
        c.update(1 / 60);
        blinked = c.faceMesh.texture === textures.blink;
      }
      expect(blinked).toBe(true);
      for (const mood of ['sleepy', 'sad'] as const) {
        c.mood = mood;
        const seen = new Set<Texture>();
        for (let i = 0; i < 600; i++) {
          c.update(1 / 60);
          seen.add(c.faceMesh.texture);
        }
        // A sleepy or sad face never blinks: the blink sprite has the calm mouth.
        expect([...seen]).toEqual([textures[mood]]);
      }
      c.mood = 'calm';
      c.update(1 / 60);
      expect([textures.base, textures.blink]).toContain(c.faceMesh.texture);
    });

    it('carries the crown with the body through the reaction and settles it back', () => {
      const c = build();
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
      expect(c.slots.head!.node.children.length).toBe(1);
    });

    it('releases its own geometry and leaves the shared textures alone', () => {
      const textures = Object.fromEntries(EXPRESSIONS.map((e) => [e, new Texture()])) as Record<Expression, Texture>;
      const c = make(textures);
      const freed = vi.spyOn(c.mesh.geometry, 'destroy');
      c.destroy({ children: true });
      expect(freed).toHaveBeenCalled();
      for (const e of EXPRESSIONS) expect(textures[e].destroyed, e).toBe(false);
    });
  });
}
