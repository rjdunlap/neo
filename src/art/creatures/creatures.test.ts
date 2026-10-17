import { describe, expect, it } from 'vitest';
import { ACCESSORIES, ACCESSORY_SLOT, dress, makeCreature, SPECIES } from '.';

const at = (c: ReturnType<typeof makeCreature>, slot: 'head' | 'neck') => {
  const p = c.slots[slot]!.node.getGlobalPosition();
  return { x: p.x, y: p.y };
};

describe('RW02 creatures', () => {
  it('give every accessory a slot or a recorded reason it does not fit', () => {
    for (const id of SPECIES) {
      const c = makeCreature(id);
      for (const kind of ACCESSORIES) {
        const fits = !!c.slots[ACCESSORY_SLOT[kind]];
        expect(fits !== !!c.misfit[kind], `${id} ${kind}`).toBe(true);
        expect(dress(c, kind, true)).toBe(fits);
        expect(c.wearing(kind)).toBe(fits);
      }
      // Taking things off leaves nothing behind.
      for (const kind of ACCESSORIES) dress(c, kind, false);
      for (const kind of ACCESSORIES) expect(c.wearing(kind)).toBe(false);
    }
  });

  it('carry worn accessories along with the body through a touch reaction', () => {
    for (const id of SPECIES) {
      const c = makeCreature(id);
      for (const kind of ACCESSORIES) dress(c, kind, true);
      c.update(1 / 60);
      const slot = c.slots.head ? 'head' : 'neck';
      const rest = at(c, slot);
      c.poke();
      let moved = 0;
      for (let i = 0; i < 30; i++) {
        c.update(1 / 60);
        const p = at(c, slot);
        expect(Number.isFinite(p.x) && Number.isFinite(p.y)).toBe(true);
        moved = Math.max(moved, Math.hypot(p.x - rest.x, p.y - rest.y));
      }
      expect(moved, id).toBeGreaterThan(15);
      // The accessory is a child of the slot, so it moved too.
      expect(c.slots[slot]!.node.children.length).toBeGreaterThan(0);
    }
  });

  it('settle back to rest after the reaction', () => {
    for (const id of SPECIES) {
      const c = makeCreature(id);
      c.update(1 / 60);
      const slot = c.slots.head ? 'head' : 'neck';
      const rest = at(c, slot);
      c.poke();
      for (let i = 0; i < 120; i++) c.update(1 / 60);
      const p = at(c, slot);
      expect(Math.hypot(p.x - rest.x, p.y - rest.y), id).toBeLessThan(30); // idle sway only
    }
  });
});
