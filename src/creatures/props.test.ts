import { describe, expect, it } from 'vitest';
import type { CastId } from '../art/creatures/cast';
import { makeProp, PROP_TIME, PROPS, type PropId } from './props';
import { Resident, RESIDENTS } from './resident';

const SPECIES = Object.keys(RESIDENTS) as CastId[];

describe('the things the residents use (P5)', () => {
  it('gives every resident a thing of its own', () => {
    const ids = SPECIES.map((s) => RESIDENTS[s].carriesOn);
    expect(new Set(ids).size).toBe(SPECIES.length);
    expect(new Set(ids)).toEqual(new Set(Object.keys(PROPS)));
  });

  // A prop sits at a stop whose footprint is clear of every game, the signpost and the buttons, so inside the footprint
  // through its whole use it can never cover one of them.
  it.each(SPECIES)("keeps %s's thing inside its footprint through the whole use", (species) => {
    const fp = Resident.footprint(species);
    const id: PropId = RESIDENTS[species].carriesOn;
    const { node, moving } = makeProp(id);
    for (let i = 0; i <= 64; i++) {
      PROPS[id].animate(moving, 1 - i / 64);
      moving.visible = true;
      const b = node.getLocalBounds();
      expect(b.minX, `${id} left at ${i}`).toBeGreaterThanOrEqual(-fp.side);
      expect(b.maxX, `${id} right at ${i}`).toBeLessThanOrEqual(fp.side);
      expect(b.minY, `${id} top at ${i}`).toBeGreaterThanOrEqual(-fp.up);
      expect(b.maxY, `${id} bottom at ${i}`).toBeLessThanOrEqual(fp.down);
    }
    node.destroy({ children: true });
  });

  it.each(Object.keys(PROPS) as PropId[])('rests %s where it began once a use is over', (id) => {
    const { node, moving } = makeProp(id);
    const rest = { r: moving.rotation, s: moving.scale.x, a: moving.alpha };
    PROPS[id].animate(moving, 0.5);
    PROPS[id].animate(moving, 0);
    expect(moving.rotation).toBeCloseTo(rest.r);
    expect(moving.scale.x).toBeCloseTo(rest.s);
    expect(moving.alpha).toBeCloseTo(rest.a);
    node.destroy({ children: true });
  });

  it('makes a few sounds, all within the use', () => {
    for (const spec of Object.values(PROPS)) {
      expect(spec.notes).toBeGreaterThanOrEqual(1);
      expect(spec.notes).toBeLessThanOrEqual(3);
      expect(spec.notes * 0.2).toBeLessThan(PROP_TIME + 0.5);
    }
  });
});
