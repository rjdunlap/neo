/**
 * The pet's European Portuguese words (WL2, `docs/definitions/additional-languages.md`): one entry per pictured thing,
 * said after the English line that names it. Every entry was written by one session and checked by a separate pass
 * against European Portuguese dictionaries; the evidence rows are in that definition. A changed entry needs a new row.
 */

/** The 20 pilot keys: the seven first animals, their snacks, and Bubble Pop's six colours. */
export const WORD_KEYS = [
  'animal.cow',
  'animal.duck',
  'animal.pig',
  'animal.cat',
  'animal.dog',
  'animal.bunny',
  'animal.bear',
  'food.hay',
  'food.grass',
  'food.bone',
  'food.fish',
  'food.seeds',
  'food.apple',
  'food.honey',
  'color.red',
  'color.orange',
  'color.yellow',
  'color.green',
  'color.blue',
  'color.purple',
] as const;

export type WordKey = (typeof WORD_KEYS)[number];

export const PT_PT: Record<WordKey, string> = {
  'animal.cow': 'a vaca',
  'animal.duck': 'o pato',
  'animal.pig': 'o porco',
  'animal.cat': 'o gato',
  'animal.dog': 'o cão',
  'animal.bunny': 'o coelho',
  'animal.bear': 'o urso',
  'food.hay': 'o feno',
  'food.grass': 'a erva',
  'food.bone': 'o osso',
  'food.fish': 'o peixe',
  'food.seeds': 'as sementes',
  'food.apple': 'a maçã',
  'food.honey': 'o mel',
  'color.red': 'vermelho',
  'color.orange': 'cor de laranja',
  'color.yellow': 'amarelo',
  'color.green': 'verde',
  'color.blue': 'azul',
  'color.purple': 'roxo',
};

const KEYS = new Set<string>(WORD_KEYS);

/** The key for a host's own name (`animal` + `cow`), or null when the pilot has no word for it (a horse, say). */
export function wordKey(kind: 'animal' | 'food' | 'color', name: string): WordKey | null {
  const key = `${kind}.${name}`;
  return KEYS.has(key) ? (key as WordKey) : null;
}
