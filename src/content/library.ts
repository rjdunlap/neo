import type { Band } from '../progress/bands';
import { WOODLAND_BAND } from './woodland';

/**
 * The library at the root (RW08 slice 2, docs/rework/RW08-CUTOVER.md#slice-2-the-library-the-stories-and-the-rest-of-home):
 * her discovery journal and the two stories. The Woodland Picnic shows only where Wonder Woods' path shows it, at school
 * band; the Windy Picnic is open to every age, as on the map. Looking changes no progress.
 */
export const LIBRARY_BOOKS = ['journal', 'windy', 'woodland'] as const;
export type LibraryBook = (typeof LIBRARY_BOOKS)[number];

export const libraryBooks = (band: Band): LibraryBook[] => LIBRARY_BOOKS.filter((b) => b !== 'woodland' || band === WOODLAND_BAND);

export const BOOK_NAMES: Record<LibraryBook, string> = { journal: 'Journal', windy: 'Windy Picnic', woodland: 'Woodland Picnic' };
