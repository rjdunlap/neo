/**
 * The short names on the root's picture buttons (U1, docs/UX-REVIEW-2026-11-09.md#recommendations-in-priority-order):
 * one word or two on a cream pill across each button's lower rim, so a grown-up with the sound off can tell what each
 * picture does. They use the words the buttons already speak (`home.*`, `daily.go`, `nav.*`) and Explore's entry names.
 */

/** Home's buttons (`HomeScene`). Play with {pet} is `playName`. */
export const HOME_NAMES = {
  who: 'Players',
  continue: 'New friend',
  explore: 'Explore',
  daily: 'Today’s six',
} as const;

/** The result's buttons at the root (`GameScene.showResult`). The way out is Back at the root, the house Home. */
export const RESULT_NAMES = {
  again: 'Again',
  next: 'Next level',
  home: 'Back',
  house: 'Home',
  heart: 'Favorite',
  keep: 'Keep',
} as const;

/** A name longer than this falls back to a shorter word, so it fits beside its neighbours. */
export const NAME_MAX = 17;

/** Play with {pet}, or Play when her friend's name is long. */
export function playName(pet: string): string {
  const full = `Play with ${pet}`;
  return full.length <= NAME_MAX ? full : 'Play';
}

/**
 * The name pill's size: its height, and how far its centre sits below the button's centre past the rim (it straddles
 * the rim, so it adds only `PILL.h / 2 - PILL.lift` below the circle and the word stays inside the button's touch radius).
 */
export const PILL = { h: 34, pad: 12, size: 22, lift: 2 } as const;

/** How far a button's name reaches below its centre, for a `radius`-unit button. */
export function nameBelow(radius: number): number {
  return radius - PILL.lift + PILL.h / 2;
}

/** A generous width estimate for a name in the house font at `PILL.size` (layout tests cannot measure text; measured Fredoka runs about 10 units a letter). */
export function nameWidth(text: string): number {
  return text.length * 11 + 2 * PILL.pad;
}
