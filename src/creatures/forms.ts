import type { SpeciesId } from './species';

/**
 * RW11 (docs/rework/FORMS-AND-TALENTS.md): a form is an optional look an individual can show, grown through play and kept by
 * the profile like a furnishing. Pixi-free, so the save can repair against it. Only the sprout has forms so far; the id
 * carries its species (`sprout:sun`), so the river's and the glider's later forms need only a new id here.
 */
export const FORMS = ['sprout:sun', 'sprout:moon'] as const;
export type FormId = (typeof FORMS)[number];
/** At most eight forms are kept on a profile. */
export const MAX_FORMS = 8;

export const isForm = (v: unknown): v is FormId =>
  typeof v === 'string' && (FORMS as readonly string[]).includes(v);

/**
 * The Garden Grow flower kind each blossom is drawn from (a plain string, so this file stays Pixi-free; a test holds it equal
 * to the blossom's picture in `src/art/creatures/forms.ts`). A round reports the kind that bloomed, and the shell grows the form.
 */
export const FORM_FLOWER: Record<FormId, string> = { 'sprout:sun': 'sunflower', 'sprout:moon': 'tulip' };

/** The form a bloomed flower kind grows, or null for a kind that is no blossom. */
export const formForFlower = (kind: unknown): FormId | null =>
  FORMS.find((f) => FORM_FLOWER[f] === kind) ?? null;

/** The species a form belongs to. */
export const formSpecies = (id: FormId): SpeciesId => id.split(':')[0] as SpeciesId;

/** The forms of `grown` that this species can show, in the wardrobe's order (a hand-built test save may have no list). */
export const formsFor = (species: SpeciesId, grown: readonly FormId[] = []): FormId[] =>
  FORMS.filter((f) => formSpecies(f) === species && grown.includes(f));

/** Repairs a saved list of grown forms: unknown ids dropped, a repeat keeps its first place, cut at eight. */
export function cleanForms(raw: unknown): FormId[] {
  const out: FormId[] = [];
  for (const v of Array.isArray(raw) ? raw : []) if (isForm(v) && !out.includes(v)) out.push(v);
  return out.slice(0, MAX_FORMS);
}

/** The form an individual shows after repair: only one the profile has grown and its species can show, else none. */
export const cleanLookForm = (raw: unknown, species: SpeciesId, grown: readonly FormId[]): FormId | null =>
  isForm(raw) && formSpecies(raw) === species && grown.includes(raw) ? raw : null;
