import type { Rng } from '../../engine/random';

/**
 * Rhyme Time: pictures that say their names. Find the one that rhymes with a word, then the two
 * that rhyme with each other, then the odd one out of a rhyming group. Rhymes are grouped by
 * sound family, so a distractor is never accidentally a rhyme.
 */
export type RhymeMode = 'match' | 'pair' | 'odd';

export interface RhymePlan {
  mode: RhymeMode;
  /** Pictures to choose from. */
  choices: number;
  questions: number;
  name: string;
}

export const PLANS: RhymePlan[] = [
  { mode: 'match', choices: 3, questions: 4, name: 'Which one rhymes with "cat"? Three pictures to choose from' },
  { mode: 'match', choices: 4, questions: 4, name: 'Which one rhymes? Four pictures to choose from' },
  { mode: 'pair', choices: 4, questions: 4, name: 'Find the two pictures that rhyme with each other' },
  { mode: 'odd', choices: 4, questions: 4, name: 'Odd one out: three rhyme, one does not' },
];

export const planFor = (level: number) => PLANS[Math.min(PLANS.length, Math.max(1, level)) - 1];

/** Rhyme families of words we can draw. */
export const FAMILIES: Record<string, string[]> = {
  at: ['cat', 'hat', 'bat'],
  og: ['dog', 'log', 'frog'],
  ee: ['bee', 'tree', 'key'],
  ar: ['star', 'car', 'jar'],
  oon: ['moon', 'spoon'],
  ish: ['fish', 'dish'],
  ake: ['cake', 'snake'],
  ear: ['bear', 'pear', 'chair'],
  uck: ['duck', 'truck'],
  oat: ['boat', 'coat'],
  ell: ['bell', 'shell'],
  ing: ['ring', 'king'],
};

export const familyOf = (word: string) => Object.keys(FAMILIES).find((f) => FAMILIES[f].includes(word))!;
export const rhymes = (a: string, b: string) => a !== b && familyOf(a) === familyOf(b);

export interface RhymeQuestion {
  /** 'match': the word to rhyme with. */
  prompt?: string;
  /** The pictures shown, in order. */
  words: string[];
  /** The right picture(s): one for match and odd, two for pair. */
  answer: string[];
}

export function makeQuestions(plan: RhymePlan, rng: Rng): RhymeQuestion[] {
  const out: RhymeQuestion[] = [];
  const families = rng.shuffle(Object.keys(FAMILIES));
  const big = families.filter((f) => FAMILIES[f].length >= 3);
  for (let i = 0; i < plan.questions; i++) {
    // Distractors come from other families, one word each, so none rhyme with anything else shown.
    const pick = (exclude: string[], n: number) => rng.shuffle(families.filter((f) => !exclude.includes(f))).slice(0, n).map((f) => rng.pick(FAMILIES[f]));
    if (plan.mode === 'match') {
      const fam = families[i % families.length];
      const [prompt, answer] = rng.shuffle([...FAMILIES[fam]]);
      out.push({ prompt, words: rng.shuffle([answer, ...pick([fam], plan.choices - 1)]), answer: [answer] });
    } else if (plan.mode === 'pair') {
      const fam = families[i % families.length];
      const pair = rng.shuffle([...FAMILIES[fam]]).slice(0, 2);
      out.push({ words: rng.shuffle([...pair, ...pick([fam], plan.choices - 2)]), answer: pair });
    } else {
      const fam = big[i % big.length];
      const odd = pick([fam], 1)[0];
      out.push({ words: rng.shuffle([...FAMILIES[fam], odd]), answer: [odd] });
    }
  }
  return out;
}

/**
 * The picture a capable child taps next: the one that rhymes (match), the odd one out (odd), or, to find a rhyming pair, the
 * first of the pair and then the other one. `picked` is the first card of a pair already chosen. Always a right one.
 */
export function wordToTap(plan: RhymePlan, q: RhymeQuestion, picked: string | null): string {
  if (plan.mode === 'pair' && picked) return q.answer.find((w) => w !== picked)!;
  return q.answer[0];
}
