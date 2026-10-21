import { describe, expect, it } from 'vitest';
import { BANDS } from '../progress/bands';
import { libraryBooks } from './library';

describe('the library (RW08 slice 2)', () => {
  it('holds the journal and the Windy Picnic at every band, and the Woodland Picnic only at school', () => {
    for (const { id } of BANDS) {
      const books = libraryBooks(id);
      expect(books.slice(0, 2), id).toEqual(['journal', 'windy']);
      expect(books.includes('woodland'), id).toBe(id === 'school');
    }
  });
});
