import { Container, Texture } from 'pixi.js';
import { describe, expect, it } from 'vitest';
import { IllustratedCreature, inside, sameArt } from '../art/creatures/illustrated';
import { Companion, restPoints } from './companion';
import { ART_OF, PART_NAMES, PARTS, type PartName } from './parts';
import { SPECIES, SPECIES_IDS } from './species';

const art = sameArt(Texture.WHITE);

/**
 * The parts each large-pet game names (docs/rework/art-requests/GAME-FIT.md). `strict` games have no way to skip a part,
 * so every species must have each one; the others skip a misfit (Weather Wardrobe sets the item down beside the friend).
 */
const GAME_PARTS: Record<string, { parts: readonly PartName[]; strict: boolean }> = {
  // Still on the stand-in pip: the side-on faces cannot keep five splotches apart (docs/WAITING-ON-DEVELOPER.md).
  'splish-splash': { parts: ['tummy', 'head', 'cheeks', 'ears', 'nose'], strict: true },
  'weather-wardrobe': { parts: ['head', 'eyes', 'neck', 'tummy', 'hands', 'feet'], strict: false },
  'pet-says': { parts: ['nose', 'tummy', 'ears', 'head', 'feet', 'hands'], strict: false },
  // The fur rides the head; the cape hangs from the neck, and a friend with no neck goes without.
  'fluffy-salon': { parts: ['head'], strict: true },
};

describe('the companion’s parts (RW05 slice 2)', () => {
  it('records every part on every species once: points, or a misfit with its reason', () => {
    for (const s of SPECIES_IDS) {
      for (const name of PART_NAMES) {
        const has = (PARTS[s].points[name]?.length ?? 0) > 0;
        const misfit = PARTS[s].misfits[name];
        expect(has !== Boolean(misfit), `${s} ${name}`).toBe(true);
        if (misfit) expect(misfit.length, `${s} ${name}`).toBeGreaterThan(10);
      }
    }
  });

  it('has every part a game names, or a recorded misfit where the game can skip it', () => {
    for (const [game, { parts, strict }] of Object.entries(GAME_PARTS)) {
      for (const s of SPECIES_IDS) {
        for (const name of parts) {
          const has = (PARTS[s].points[name]?.length ?? 0) > 0;
          if (strict) expect(has, `${game} needs ${s}'s ${name}`).toBe(true);
          else expect(has || Boolean(PARTS[s].misfits[name]), `${game}: ${s} ${name}`).toBe(true);
        }
      }
    }
  });

  it('puts each point on the picture, and the face on the body', () => {
    for (const s of SPECIES_IDS) {
      const A = ART_OF[s] as (typeof ART_OF)[typeof s] & { width: number; height: number };
      for (const name of PART_NAMES) {
        for (const p of PARTS[s].points[name] ?? []) {
          expect(p.x >= 0 && p.x <= A.width && p.y >= 0 && p.y <= A.height, `${s} ${name}`).toBe(true);
        }
      }
      for (const name of ['nose', 'eyes', 'cheeks'] as const) for (const p of PARTS[s].points[name] ?? []) expect(inside(A.body, p.x, p.y), `${s} ${name}`).toBe(true);
    }
  });

  it('builds one riding container per point, none for a misfit, in the companion’s units', () => {
    for (const s of SPECIES_IDS) {
      const c = new Companion({ species: s, look: { color: SPECIES[s].color } }, art);
      expect(c.rig).toBeInstanceOf(IllustratedCreature);
      for (const name of PART_NAMES) {
        const nodes = c.part(name);
        expect(nodes.length, `${s} ${name}`).toBe(restPoints(s, name).length);
        // Asked twice, the same containers.
        expect(c.part(name)).toBe(nodes);
        // At rest (the rig breathes a little), each sits where its point says, measured in the companion's own units.
        nodes.forEach((n, i) => {
          const at = c.toLocal(n.getGlobalPosition());
          const want = restPoints(s, name)[i];
          expect(Math.hypot(at.x - want.x, at.y - want.y), `${s} ${name}`).toBeLessThan(8);
        });
      }
      // And a thing hung there keeps its pip-sized units: a 100-unit child measures 100 companion units.
      const box = new Container();
      c.part('head')[0].addChild(box);
      const a = c.toLocal(box.toGlobal({ x: 0, y: 0 }));
      const b = c.toLocal(box.toGlobal({ x: 100, y: 0 }));
      expect(Math.abs(Math.hypot(b.x - a.x, b.y - a.y) - 100)).toBeLessThan(4);
    }
  });

  it('gives a body bounds above the feet that holds the face, and every head above every tummy', () => {
    for (const s of SPECIES_IDS) {
      const c = new Companion({ species: s, look: { color: SPECIES[s].color } }, art);
      const b = c.bodyBounds();
      expect(b.width, s).toBeGreaterThan(60);
      expect(b.height, s).toBeGreaterThan(60);
      expect(b.bottom, s).toBeLessThanOrEqual(2);
      for (const p of [...restPoints(s, 'nose'), ...restPoints(s, 'eyes')]) expect(b.contains(p.x, p.y), s).toBe(true);
      expect(restPoints(s, 'head')[0].y, s).toBeLessThan(restPoints(s, 'tummy')[0].y);
      // Pixi reads a container's `bounds` while measuring its parent, so the body box must not take that name.
      const holder = new Container();
      holder.addChild(c);
      expect(() => holder.getBounds(), s).not.toThrow();
    }
  });

  it('spins and wiggles, then stands as it was', () => {
    const c = new Companion({ species: 'river', look: { color: 'orange' } }, art);
    const body = c.children[0] as Container;
    c.spin();
    c.update(0.45);
    expect(body.scale.x).toBeLessThan(0);
    c.wiggle();
    c.update(0.06);
    expect(body.rotation).not.toBe(0);
    for (let i = 0; i < 40; i++) c.update(0.05);
    expect(body.scale.x).toBeCloseTo(1, 2);
    expect(body.rotation).toBe(0);
  });
});
