import { makeAccessory } from './accessories';
import { ACCESSORY_SLOT, type AccessoryKind, type Creature, type SpeciesId } from './creature';
import { Glider } from './glider';
import { River } from './river';
import { Sprout } from './sprout';

export { ACCESSORY_SLOT, Creature, type AccessoryKind, type SpeciesId } from './creature';

export const SPECIES: SpeciesId[] = ['sprout', 'river', 'glider'];
export const ACCESSORIES: AccessoryKind[] = ['scarf', 'crown'];

export function makeCreature(id: SpeciesId): Creature {
  if (id === 'sprout') return new Sprout();
  if (id === 'river') return new River();
  return new Glider();
}

/** Puts on or takes off an accessory, drawn for this species' slot. False when the species has no slot for it. */
export function dress(c: Creature, kind: AccessoryKind, on: boolean): boolean {
  const spot = c.slots[ACCESSORY_SLOT[kind]];
  if (!on) return c.wear(null, kind);
  if (!spot) return false;
  return c.wear(makeAccessory(kind, spot.width), kind);
}
