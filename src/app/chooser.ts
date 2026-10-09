import { cleanName } from '../couch/party';
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
 * What a click on a card was: a finger or a mouse has a `detail` of 1 or more, and a keyboard (or an assistive technology's
 * "activate") sends a click with 0. Those take the couch, the way Enter does, rather than an island they cannot drive.
 */
export const sourceOfClick = (detail: number): Source => (detail > 0 ? 'pointer' : 'key');

/** A person's name as the island keeps it (`migrate` allows 40 characters). */
export const NAME_LIMIT = 40;

export const cleanPlayerName = (v: unknown): string =>
  typeof v === 'string' ? [...v.replace(/[\u0000-\u001f\u007f]/g, '').replace(/\s+/g, ' ').trim()].slice(0, NAME_LIMIT).join('').trim() : '';

/**
 * The name that fills couch Player 1 when someone enters couch play: theirs, as the couch shows names (at most 14 letters), or
 * null when they have no name, which leaves whatever the couch already has. Their course records are Player 1's records
 * (the slot, not the person); linking records to people is stage 5.
 */
export const couchNameFor = (profileName: string): string | null => cleanName(profileName) || null;

/** From this age a person is offered their friend to choose, with no egg to hatch. A UI choice made from the age typed, never stored. */
export const ADULT_YEARS = 13;
export const skipsEgg = (birth: Birth | null, now: Date): boolean => birth !== null && completedYears(birth, now) >= ADULT_YEARS;

export type NewPlayer = { ok: true; name: string; birth: Birth } | { ok: false; problem: 'name' | 'birth' };

/** What the add-a-player form holds, checked: a name, and a birth month and year that the clock allows. */
export function readNewPlayer(name: unknown, month: unknown, year: unknown, now: Date): NewPlayer {
  const clean = cleanPlayerName(name);
  if (!clean) return { ok: false, problem: 'name' };
  const birth = checkBirthInput(typeof month === 'string' ? Number(month.trim() || NaN) : month, typeof year === 'string' ? Number(year.trim() || NaN) : year, now);
  return birth ? { ok: true, name: clean, birth } : { ok: false, problem: 'birth' };
}
