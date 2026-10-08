/**
 * What a grown-up chooses on the couch Settings page: where she is playing (which decides the button
 * prompts), how loud, whether the music plays, and how big the text is. Kept in the couch save, never the
 * child's; pure so the rules are tested without a browser.
 */

/** "Choose for me" follows what is connected; the other two are a firm choice. */
export const PLACE_CHOICES = ['auto', 'tv', 'laptop'] as const;
export type PlaceChoice = typeof PLACE_CHOICES[number];
/** Where she is playing: a TV with a controller, or a laptop with its keyboard. */
export type Place = 'tv' | 'laptop';
export const TEXT_SIZES = ['normal', 'large', 'xlarge'] as const;
export type TextSize = typeof TEXT_SIZES[number];

/** Volume is a whole step from 0 (off) to `VOLUME_MAX`, so a controller can nudge it and a reload restores it exactly. */
export const VOLUME_MAX = 5;
export interface CouchSettings {
  place: PlaceChoice;
  volume: number;
  music: boolean;
  text: TextSize;
}
export const settingsDefaults = (): CouchSettings => ({ place: 'auto', volume: 4, music: true, text: 'normal' });

const object = (v: unknown): Record<string, unknown> => v && typeof v === 'object' ? v as Record<string, unknown> : {};
/** Anything the save holds is repaired to a value the page can show; a missing or odd field takes its default. */
export function repairSettings(raw: unknown): CouchSettings {
  const v = object(raw), out = settingsDefaults();
  if (PLACE_CHOICES.includes(v.place as PlaceChoice)) out.place = v.place as PlaceChoice;
  if (typeof v.volume === 'number' && Number.isFinite(v.volume)) out.volume = Math.max(0, Math.min(VOLUME_MAX, Math.round(v.volume)));
  if (typeof v.music === 'boolean') out.music = v.music;
  if (TEXT_SIZES.includes(v.text as TextSize)) out.text = v.text as TextSize;
  return out;
}

/** The window scale (see `computeView`) at which a screen is TV-sized: a 1080p display in full screen is about 1.4. */
export const TV_SCALE = 1.35;
/** What "choose for me" sees: a connected controller, or a window the size of a TV, means TV. */
export interface Surroundings { controllers: number; scale: number }
export const resolvePlace = (choice: PlaceChoice, now: Surroundings): Place =>
  choice !== 'auto' ? choice : now.controllers > 0 || now.scale >= TV_SCALE ? 'tv' : 'laptop';
/** Why "choose for me" picked what it did, in a few words for the Settings page. */
export const placeReason = (now: Surroundings): string =>
  now.controllers > 0 ? 'a controller is connected' : now.scale >= TV_SCALE ? 'the window is the size of a TV' : 'no controller is connected and the window is laptop-sized';

export const PLACE_NAMES: Record<Place, string> = { tv: 'TV with a controller', laptop: 'Laptop with keyboard' };
export const TEXT_NAMES: Record<TextSize, string> = { normal: 'Normal', large: 'Large', xlarge: 'Extra large' };
/** Text size multiplies the window scale that every couch length is already built on. */
export const TEXT_FACTOR: Record<TextSize, number> = { normal: 1, large: 1.2, xlarge: 1.4 };
/** The couch length unit (`--u`): the window scale kept between 1 and 2.2, times the text size. */
export const unitFor = (windowScale: number, text: TextSize): number =>
  Math.min(2.2, Math.max(1, Number.isFinite(windowScale) ? windowScale : 1)) * TEXT_FACTOR[text];

/** The master gain a step plays at: step 4 is 0.8, the level the child's island starts at. */
export const gainFor = (volume: number): number => Math.max(0, Math.min(VOLUME_MAX, volume)) / VOLUME_MAX;
/** One step louder or quieter, stopping at either end. */
export const nudgeVolume = (volume: number, by: 1 | -1): number => Math.max(0, Math.min(VOLUME_MAX, volume + by));
/** The next text size in the list, wrapping round: one button on the pause menu cycles through them. */
export const nextText = (text: TextSize): TextSize => TEXT_SIZES[(TEXT_SIZES.indexOf(text) + 1) % TEXT_SIZES.length];

/** The one line under a menu that says how to move and choose, for what she is holding. */
export const menuHint = (place: Place): string => place === 'tv'
  ? 'Menus: D-pad or stick to choose · bottom button to select · + to pause (arrow keys, Enter and Esc work too)'
  : 'Menus: arrow keys to choose · Enter to select · Esc to pause (a connected controller works too)';
/** The line under the name card of a game already explained. */
export const cardHint = (place: Place): string => place === 'tv'
  ? 'Press the bottom button to start now · Right or down for How to play · + for the menu'
  : 'Press Enter to start now · Right or down arrow for How to play · Esc for the menu';
