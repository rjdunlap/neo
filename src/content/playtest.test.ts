import { describe, expect, it } from 'vitest';
import {
  cleanPlaytest,
  MAX_NOTE_LENGTH,
  MAX_NOTES,
  noteFor,
  notesText,
  setNote,
  type PlaytestNote,
} from './playtest';

const note = (over: Partial<PlaytestNote> = {}): PlaytestNote => ({
  day: '2026-11-09',
  game: 'word-search',
  level: 3,
  rating: 'good',
  note: '',
  at: 1,
  ...over,
});

describe('playtest notes', () => {
  it('keeps one note per game and day, the last one winning', () => {
    let list = setNote([], note());
    list = setNote(list, note({ rating: 'fix', note: 'letters too small' }));
    list = setNote(list, note({ day: '2026-11-10' }));
    expect(list).toHaveLength(2);
    expect(noteFor(list, '2026-11-09', 'word-search')).toMatchObject({
      rating: 'fix',
      note: 'letters too small',
    });
  });

  it('removes a note with no reaction and no text, and trims and bounds the text', () => {
    const list = setNote([], note({ note: `  ${'x'.repeat(MAX_NOTE_LENGTH + 50)}  ` }));
    expect(list[0].note).toHaveLength(MAX_NOTE_LENGTH);
    expect(setNote(list, note({ rating: null, note: '   ' }))).toEqual([]);
    expect(setNote([], note({ rating: null, note: 'text only' }))).toHaveLength(1);
  });

  it('is bounded, dropping the oldest', () => {
    let list: PlaytestNote[] = [];
    for (let i = 0; i < MAX_NOTES + 5; i++) list = setNote(list, note({ game: `g${i}` }));
    expect(list).toHaveLength(MAX_NOTES);
    expect(list[0].game).toBe('g5');
  });

  it('repairs a stored list', () => {
    expect(cleanPlaytest(undefined)).toEqual([]);
    expect(cleanPlaytest({})).toEqual([]);
    const cleaned = cleanPlaytest([
      null,
      { day: 'yesterday', game: 'a', rating: 'good' },
      { day: '2026-11-09', game: '', rating: 'good' },
      { day: '2026-11-09', game: 'a', rating: 'superb', note: 7, level: 'x', at: NaN },
      { day: '2026-11-09', game: 'b', rating: 'ok', note: 'fine', level: 4.7, at: 9 },
      { day: '2026-11-09', game: 'b', rating: 'fix', note: 'second', level: 4, at: 10 },
    ]);
    // `a` had no valid reaction and no text, so it is dropped; `b` keeps its last note.
    expect(cleaned).toEqual([
      { day: '2026-11-09', game: 'b', level: 4, rating: 'fix', note: 'second', at: 10 },
    ]);
    expect(cleanPlaytest(cleaned)).toEqual(cleaned);
  });

  it('writes the notes as text, newest day first', () => {
    const list = [
      note({ note: 'cramped' }),
      note({ day: '2026-11-10', game: 'pond-conga', rating: null, note: 'fun' }),
    ];
    const text = notesText(list, 'Sam', (id) => id.toUpperCase());
    expect(text.split('\n')).toEqual([
      'Playtest notes, Sam',
      '',
      '2026-11-10',
      '- POND-CONGA (pond-conga, level 3): No reaction. fun',
      '',
      '2026-11-09',
      '- WORD-SEARCH (word-search, level 3): Good. cramped',
    ]);
    expect(notesText([], 'Sam', (id) => id)).toBe('');
  });
});
