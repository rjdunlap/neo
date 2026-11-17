/**
 * The wording rules the rule tests hold every off-screen sentence to: the per-band *Try* lines (`offscreen.test.ts`) and
 * the At-home card's *Notice*, *Say* and kit labels (`athome.test.ts`). Test-only; nothing at runtime reads these.
 */

/** Small loose objects (and a cord) that no line names at lap or toddler. */
export const UNDER_3 = [
  'marble',
  'coin',
  'button',
  'bean',
  'bead',
  'pebble',
  'rubber band',
  'battery',
  'balloon',
  'small ball',
  'dry bean',
  'pom-pom',
  'seed',
  'string',
];

/** A whole-word, plural-aware pattern for one word or phrase (a space or hyphen in it matches either). */
export const wordPattern = (word: string) =>
  new RegExp(`\\b${word.replace(/[-\s]/g, '[-\\s]')}(s|es|ies)?\\b`, 'i');

/** Obligation, scheduling and purchase wording, for every band. */
export const EVERY_BAND = [
  /[{}]/,
  /\b\d+\s*(minutes?|mins?)\b/i,
  /\bevery day\b/i,
  /\beach morning\b/i,
  /\bmust\b/i,
  /\bbuy\b/i,
];

/**
 * The practical-care classes a reviewer has not yet looked at (food and drink, bath and water, ice, sun, soap and
 * bubbles, scissors and knives, sand and other loose fill, mirrors and torches, cords). A game whose *Try* names one keeps
 * that line but gets no *Notice* or *Say*, and no kit label names one.
 */
export const DEFERRED_CLASSES = [
  'food',
  'snack',
  'fruit',
  'eat',
  'drink',
  'juice',
  'milk',
  'bath',
  'bathtub',
  'water',
  'ice',
  'sun',
  'sunny',
  'soap',
  'bubble',
  'scissors',
  'knife',
  'knives',
  'sand',
  'rice',
  'flour',
  'mirror',
  'torch',
  'flashlight',
  'cord',
  'rope',
];
