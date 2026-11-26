import { Container, Graphics } from 'pixi.js';
import { drawKind } from '../../games/garden-grow/kinds';
import type { FlowerKind } from '../../games/garden-grow/logic';
import type { SpeciesId } from '../../creatures/species';
import { formSpecies, type FormId } from '../../creatures/forms';
import type { IllustratedCreature, Point } from './illustrated';

/**
 * RW11 (docs/rework/FORMS-AND-TALENTS.md#the-form): the sprout's two blossoms, drawn with Garden Grow's own flower
 * (`drawKind`), so the flower on the packet she plants and the blossom on her friend are the same picture. A blossom is a
 * pinned node like a wearable (`wearables.ts`): it rides the leaves, and its petals keep their own colour whatever colour
 * her friend is, because the body's hue turn never reaches a pinned node. Nothing here is drawn on the Graphics fallback rig.
 */
export interface FormLook {
  kind: FlowerKind;
  /** Petal fill and outline. */
  petal: number;
  line: number;
  /** Where it goes: a sprite point on the creature, the blossom's radius there in creature units. */
  at: Point;
  r: number;
}

export const FORM_LOOK: Record<FormId, FormLook> = {
  // A wide, open, golden flower with a round face.
  'sprout:sun': { kind: 'sunflower', petal: 0xffc93c, line: 0xb97d00, at: { x: 245, y: 100 }, r: 52 },
  // A closed-petal tulip bud in pale blue.
  'sprout:moon': { kind: 'tulip', petal: 0xbcdcf6, line: 0x4f82b0, at: { x: 245, y: 106 }, r: 50 },
};

/** The blossom's picture, centred on (0, 0). */
export function formNode(id: FormId): Container {
  const look = FORM_LOOK[id];
  const g = new Graphics();
  drawKind(g, look.kind, look.r, look.petal, look.line);
  g.eventMode = 'none';
  return g;
}

/** The blossom on each creature that shows one, so a scene can change it. */
const shown = new WeakMap<IllustratedCreature, Container>();

/** Whether a species can show a form: it is that species' form, and it has a place on its rig. */
export const formFits = (species: SpeciesId, id: FormId): boolean =>
  formSpecies(id) === species && id in FORM_LOOK;

/** Shows a blossom on the creature, or takes it off (null). False when this creature has no place for it. */
export function wearForm(c: IllustratedCreature, species: SpeciesId, id: FormId | null): boolean {
  const old = shown.get(c);
  if (old) {
    c.unpin(old);
    old.destroy({ children: true });
    shown.delete(c);
  }
  if (!id) return true;
  if (!formFits(species, id)) return false;
  const node = formNode(id);
  c.pin(node, FORM_LOOK[id].at);
  shown.set(c, node);
  return true;
}

export const wearingForm = (c: IllustratedCreature): boolean => shown.has(c);
