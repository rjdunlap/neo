import { cleanName } from '../couch/party';
import type { Band } from '../progress/bands';
import type { StartView } from '../progress/save';
import { checkBirthInput, completedYears, type Birth } from '../progress/profiles';

/**
 * The rules of the "Who's playing?" chooser, kept apart from the scene so they are tested without a browser.
 *
 * Couch play is a way of playing, open to any age, not a kind of person. The input that picks a card picks the mode: a tap
 * or a click opens the island, and a controller button or Enter opens the couch shell, because until the island takes a
 * controller (Profiles stage 2) a controller or a keyboard can only drive the couch.
 */
export type Source = 'pointer' | 'key' | 'pad';
export type Mode = 'island' | 'couch';

export const modeFor = (source: Source): Mode => (source === 'pointer' ? 'island' : 'couch');

/**
 * Where a tapped card opens (D8, docs/definitions/starting-view.md): the hatch for someone with no friend yet, otherwise the
 * player's own starting view. `six` is read here only, at the chooser's exit, never by the `hub` route: `hub` is also Home
 * and every Back, so honouring it there would make Explore unreachable. A phone's root is the six either way.
 */
export const exitFor = (ownsFriend: boolean, startView: StartView): 'hatch' | 'hub' | 'six' =>
  !ownsFriend ? 'hatch' : startView === 'six' ? 'six' : 'hub';

/** How recently a pointer must have gone down for the click that follows to be its tap. */
export const POINTER_WINDOW_MS = 1500;

/**
 * What a click on a card was. A pointer that went down just before it (`pointerSeen`, which the scene reads from a real
 * `pointerdown`) is a tap or a click and opens the island. With none, a click with a `detail` of 1 or more is still read as
 * a pointer, but `detail` is only the fallback: nothing shows that every touch browser sets it, and a wrong guess would put
 * a tap on couch play. A click with neither (Enter, or an assistive technology's "activate") takes the couch, the way Enter
 * does, rather than an island it cannot drive.
 */
export const sourceOfClick = (detail: number, pointerSeen = false): Source =>
  pointerSeen || detail > 0 ? 'pointer' : 'key';

/** A person's name as the island keeps it (`migrate` allows 40 characters). */
export const NAME_LIMIT = 40;

export const cleanPlayerName = (v: unknown): string =>
  typeof v === 'string'
    ? [
        ...v
          .replace(/[\u0000-\u001f\u007f]/g, '')
          .replace(/\s+/g, ' ')
          .trim(),
      ]
        .slice(0, NAME_LIMIT)
        .join('')
        .trim()
    : '';

/**
 * The name that fills couch Player 1 when someone enters couch play: theirs, as the couch shows names (at most 14 letters), or
 * null when they have no name, which leaves whatever the couch already has. Their course records are Player 1's records
 * (the slot, not the person); linking records to people is stage 5.
 */
export const couchNameFor = (profileName: string): string | null => cleanName(profileName) || null;

/** From this age a person is offered their friend to choose, with no egg to hatch. A UI choice made from the age typed, never stored. */
export const ADULT_YEARS = 13;
export const skipsEgg = (birth: Birth | null, now: Date): boolean =>
  birth !== null && completedYears(birth, now) >= ADULT_YEARS;

/**
 * The age chips on the add-a-player form: one tap fills the birth year, so a phone needs no keyboard. Under one, each year to
 * twelve (the ages that change where the island starts), and a grown-up. `years` is the age the chip stands for.
 */
export interface AgeChip {
  years: number;
  label: string;
  /** For a screen reader, where the label alone ("3") says too little. */
  spoken: string;
}

/** The birth a grown-up's chip fills: any age from 13 plays the same, so it is a round number, shown in the year box to correct. */
export const GROWNUP_CHIP_YEARS = 30;

export const AGE_CHIPS: readonly AgeChip[] = [
  { years: 0, label: 'Baby', spoken: 'Under one year old' },
  ...Array.from({ length: ADULT_YEARS - 1 }, (_, i) => ({
    years: i + 1,
    label: String(i + 1),
    spoken: i === 0 ? '1 year old' : `${i + 1} years old`,
  })),
  { years: ADULT_YEARS, label: 'Grown-up', spoken: 'A grown-up' },
];

/** The birth a chip fills in: this month, the chip's years ago, so they are exactly that age today. */
export const birthForChip = (chip: AgeChip, now: Date): Birth => ({
  month: now.getMonth() + 1,
  year: now.getFullYear() - (chip.years >= ADULT_YEARS ? GROWNUP_CHIP_YEARS : chip.years),
});

/** The chip that matches what the month and year fields hold (typed or tapped), or null while they hold no birth. */
export function chipForBirth(month: unknown, year: unknown, now: Date): AgeChip | null {
  const birth = checkBirthInput(asNumber(month), asNumber(year), now);
  if (!birth) return null;
  const years = Math.min(ADULT_YEARS, completedYears(birth, now));
  return AGE_CHIPS.find((c) => c.years === years) ?? null;
}

const asNumber = (v: unknown): unknown => (typeof v === 'string' ? Number(v.trim() || NaN) : v);

export type NewPlayer = { ok: true; name: string; birth: Birth } | { ok: false; problem: 'birth' };

/**
 * What the add-a-player form holds, checked: a birth month and year that the clock allows, and a name if one was typed.
 * The name may be empty: the card then carries the friend's name (`cardName`) until a grown-up types one on their page.
 */
export function readNewPlayer(name: unknown, month: unknown, year: unknown, now: Date): NewPlayer {
  const birth = checkBirthInput(asNumber(month), asNumber(year), now);
  return birth ? { ok: true, name: cleanPlayerName(name), birth } : { ok: false, problem: 'birth' };
}

/**
 * The first-visit screen's age places (play-first slice 2): shown at the root while every profile is hidden (`everyoneHidden`).
 * A tap makes the hidden profile a guest at the place's band and plays one round. `size` is the stand-in friend's picture,
 * small to large. `preschool` and `prek` have no place: four would not fit an upright phone beside Add a player, and the
 * age typed at adoption sets the real band.
 */
export interface FirstVisitPlace {
  band: Band;
  label: string;
  spoken: string;
  size: 'small' | 'medium' | 'large';
}

export const FIRST_VISIT_PLACES: readonly FirstVisitPlace[] = [
  { band: 'toddler', label: 'Little one', spoken: 'A little one', size: 'small' },
  { band: 'school', label: 'Bigger kid', spoken: 'A bigger kid', size: 'medium' },
  { band: 'grownup', label: 'Grown-up', spoken: 'A grown-up', size: 'large' },
];
