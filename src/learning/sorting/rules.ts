import type { CritterName } from '../../art/critter';

export const KIND_WORDS: Record<string, string> = {
  cow: 'cow',
  duck: 'duck',
  pig: 'pig',
  cat: 'cat',
  bear: 'bear',
  dog: 'dog',
  bunny: 'bunny',
};

export type Rule = 'hat' | 'brown' | 'white' | 'floppy' | 'pointy' | 'whiskers' | PlantRule;
export type PlantRule = 'round' | 'pointyleaf' | 'spotted' | 'plain';
export type Leaves = 'round' | 'pointy';
export type Petals = 'spotted' | 'plain';

export const RULE_WORDS: Record<Rule, string> = {
  hat: 'wearing a hat',
  brown: 'brown',
  white: 'white',
  floppy: 'with floppy ears',
  pointy: 'with pointy ears',
  whiskers: 'with whiskers',
  round: 'with round leaves',
  pointyleaf: 'with pointy leaves',
  spotted: 'with spotted petals',
  plain: 'with plain petals',
};

/** What a plant has, said after "has": the miss and middle lines name the feature itself. */
export const HAVE_WORDS: Record<PlantRule, string> = {
  round: 'round leaves',
  pointyleaf: 'pointy leaves',
  spotted: 'spotted petals',
  plain: 'plain petals',
};
const PLANT_RULES: Rule[] = ['round', 'pointyleaf', 'spotted', 'plain'];
export const isPlantRule = (r: Rule): r is PlantRule => PLANT_RULES.includes(r);

/** A little plant's two sortable features; the pot (0-5) is decoration that tells two alike plants apart. */
export interface SortSprout {
  leaves: Leaves;
  petals: Petals;
  pot: number;
}

export interface SortCritter {
  kind: CritterName;
  hat: boolean;
  /** Set on the little plants of levels 12-13 (`kind` is then unused). */
  plant?: SortSprout;
}

export function fits(c: SortCritter, rule: Rule): boolean {
  if (isPlantRule(rule)) {
    const p = c.plant;
    return (
      !!p &&
      (rule === 'round'
        ? p.leaves === 'round'
        : rule === 'pointyleaf'
          ? p.leaves === 'pointy'
          : p.petals === rule)
    );
  }
  switch (rule) {
    case 'hat':
      return c.hat;
    case 'brown':
      return c.kind === 'bear' || c.kind === 'dog';
    case 'white':
      return c.kind === 'cow' || c.kind === 'bunny';
    case 'floppy':
      return c.kind === 'cow' || c.kind === 'dog';
    case 'pointy':
      return c.kind === 'pig' || c.kind === 'cat';
    case 'whiskers':
      return c.kind === 'cat' || c.kind === 'bunny';
    default:
      return false;
  }
}
