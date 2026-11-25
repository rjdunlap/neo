import type { Band } from '../progress/bands';
import { MELODY_BAND } from './melody';
import { WOODLAND_BAND } from './woodland';

/**
 * The library at the root (RW08 slice 2, docs/rework/RW08-CUTOVER.md#slice-2-the-library-the-stories-and-the-rest-of-home):
 * her discovery journal and the three stories. The Woodland Picnic shows only where Wonder Woods' path shows it, at school
 * band, and the Missing Melody only where Bumpy Hills' path shows it, at preschool; the Windy Picnic is open to every age, as on the map. Looking changes no progress.
 */
export const LIBRARY_BOOKS = ['journal', 'windy', 'woodland', 'melody', 'collection'] as const;
export type LibraryBook = (typeof LIBRARY_BOOKS)[number];

export const libraryBooks = (band: Band): LibraryBook[] =>
  LIBRARY_BOOKS.filter(
    (b) => (b !== 'woodland' || band === WOODLAND_BAND) && (b !== 'melody' || band === MELODY_BAND),
  );

export const BOOK_NAMES: Record<LibraryBook, string> = {
  journal: 'Journal',
  windy: 'Windy Picnic',
  woodland: 'Woodland Picnic',
  melody: 'Missing Melody',
  collection: 'Collection book',
};
