import { describe, expect, it } from 'vitest';
import { ROW_STEPS } from '../games/song-maker/logic';
import {
  canUndo, cleanCreation, cleanCreations, cleanPicture, cleanTune, emptyCreations, keepCreation, PAINTING_MAX_MARKS, PICTURE_MAX, tuneBeats, undoCreation,
  type PaintingCreation, type StampPictureCreation, type TuneCreation,
} from './creations';

const stamp = (x: number, kind: 'star' | 'cat' = 'star') => ({ kind, color: 'purple' as const, x, y: 0.5, size: 1, turns: 0 });
const picture = (...xs: number[]): StampPictureCreation => ({ kind: 'picture', stamps: xs.map((x) => stamp(x)) });
const painting = (...xs: number[]): PaintingCreation => ({
  kind: 'picture', aspect: 4 / 3, marks: xs.map((x, i) => ({ shape: 'dab', color: 0xff00aa + i, x, y: 0.5, r: 0.04 })),
});
const tune = (rows = 3, ...notes: [number, number][]): TuneCreation => ({ kind: 'tune', cols: 4, rows, notes: notes.map(([col, row]) => ({ col, row })) });

describe('what can be kept', () => {
  it('keeps a picture with at least one good stamp and drops the damaged ones', () => {
    expect(cleanPicture({ kind: 'picture', stamps: [] })).toBeNull();
    expect(cleanPicture({ kind: 'picture' })).toBeNull();
    const odd = cleanPicture({ kind: 'picture', stamps: [{ kind: 'dragon', color: 'purple', x: 0.2, y: 0.2 }, { kind: 'cat', color: 'nope', x: 0.2, y: 0.2 }, { kind: 'cat', color: 'pink', x: 4, y: -2, size: 9, turns: 7 }, 'x', null] });
    expect(odd && 'stamps' in odd ? odd.stamps : []).toEqual([{ kind: 'cat', color: 'pink', x: 1, y: 0, size: 2, turns: 3 }]);
  });

  it('bounds a picture to the studio limit', () => {
    const many = { kind: 'picture', stamps: Array.from({ length: 80 }, (_, i) => stamp(i / 80)) };
    const cleaned = cleanPicture(many);
    expect(cleaned && 'stamps' in cleaned ? cleaned.stamps : []).toHaveLength(PICTURE_MAX);
  });

  it('keeps a code-drawn painting, repairs its marks, and bounds its size', () => {
    expect(cleanPicture({ kind: 'picture', marks: [], aspect: 1 })).toBeNull();
    expect(cleanPicture(painting(0.1, 0.2))).toBeNull();
    const marks = Array.from({ length: PAINTING_MAX_MARKS + 40 }, (_, i) => (
      i === 1
        ? { shape: 'flower', color: 'pink', x: -2, y: 4, r: 2 }
        : i === 2
          ? { shape: 'dab', color: -20, x: 0.5, y: 0.5, r: 0 }
          : { shape: 'dab', color: i, x: i / PAINTING_MAX_MARKS, y: 0.4, r: 0.03 }
    ));
    const fixed = cleanPicture({ kind: 'picture', aspect: 8, marks: [...marks, { shape: 'smudge', x: 0.5, y: 0.5 }] });
    expect(fixed && 'marks' in fixed ? fixed.marks : []).toHaveLength(PAINTING_MAX_MARKS);
    expect(fixed && 'marks' in fixed ? fixed.aspect : 0).toBe(2);
    expect(fixed && 'marks' in fixed ? fixed.marks[1] : null).toEqual({ shape: 'flower', color: 'pink', x: 0, y: 1, r: 0.12 });
    expect(fixed && 'marks' in fixed ? fixed.marks[2] : null).toEqual({ shape: 'dab', color: 0, x: 0.5, y: 0.5, r: 0.006 });
  });

  it('keeps a tune only if it is a grid Song Maker can draw with at least two different jellies', () => {
    expect(cleanTune(tune(3, [0, 0]))).toBeNull();
    expect(cleanTune(tune(3, [0, 0], [0, 0]))).toBeNull();
    expect(cleanTune({ kind: 'tune', cols: 4, rows: 7, notes: [{ col: 0, row: 0 }, { col: 1, row: 1 }] })).toBeNull();
    expect(cleanTune({ kind: 'tune', cols: 40, rows: 3, notes: [{ col: 0, row: 0 }, { col: 1, row: 1 }] })).toBeNull();
    expect(cleanTune({ kind: 'tune', cols: 4.5, rows: 3, notes: [{ col: 0, row: 0 }, { col: 1, row: 1 }] })).toBeNull();
    expect(cleanTune('la la')).toBeNull();
  });

  it('drops notes off the grid or repeated, and puts the rest in order', () => {
    const t = cleanTune({ kind: 'tune', cols: 4, rows: 3, notes: [{ col: 2, row: 1 }, { col: 9, row: 0 }, { col: 0, row: 2 }, { col: 2, row: 1 }, { col: 1, row: -1 }, { col: 0, row: 0 }] });
    expect(t?.notes).toEqual([{ col: 0, row: 0 }, { col: 0, row: 2 }, { col: 2, row: 1 }]);
  });

  it('turns anything else away', () => {
    expect(cleanCreation(null)).toBeNull();
    expect(cleanCreation({ kind: 'poem' })).toBeNull();
    expect(cleanCreation(picture(0.2))).toEqual(picture(0.2));
  });
});

describe('the two places', () => {
  it('starts empty and repairs a damaged save to something it can hold', () => {
    expect(cleanCreations(undefined)).toEqual(emptyCreations());
    expect(cleanCreations('x')).toEqual(emptyCreations());
    const fixed = cleanCreations({ picture: { current: picture(0.1), previous: { kind: 'picture', stamps: [] } }, tune: { current: { kind: 'picture', stamps: [stamp(0.1)] }, previous: 4 } });
    expect(fixed.picture).toEqual({ current: picture(0.1), previous: null });
    // A picture is not a tune, so the tune place stays empty.
    expect(fixed.tune).toEqual({ current: null, previous: null });
  });

  it('hangs a picture, then a second one in its place, keeping the first to bring back', () => {
    let save = emptyCreations();
    expect(canUndo(save, 'picture')).toBe(false);
    save = keepCreation(save, picture(0.1));
    expect(save.picture).toEqual({ current: picture(0.1), previous: null });
    expect(canUndo(save, 'picture')).toBe(false);
    save = keepCreation(save, picture(0.2, 0.3));
    expect(save.picture).toEqual({ current: picture(0.2, 0.3), previous: picture(0.1) });
    expect(canUndo(save, 'picture')).toBe(true);
  });

  it('keeps no more than two of a kind: a third replaces the one before', () => {
    let save = emptyCreations();
    for (const x of [0.1, 0.2, 0.3]) save = keepCreation(save, picture(x));
    expect(save.picture).toEqual({ current: picture(0.3), previous: picture(0.2) });
  });

  it('does nothing when she keeps what is already on show', () => {
    let save = keepCreation(emptyCreations(), picture(0.1));
    save = keepCreation(save, picture(0.2));
    const again = keepCreation(save, picture(0.2));
    expect(again).toEqual(save);
    // The earlier picture was not pushed out by the repeat.
    expect(again.picture.previous).toEqual(picture(0.1));
  });

  it('brings the earlier one back, and asking again puts things as they were', () => {
    let save = keepCreation(keepCreation(emptyCreations(), picture(0.1)), picture(0.2));
    const back = undoCreation(save, 'picture');
    expect(back.picture).toEqual({ current: picture(0.1), previous: picture(0.2) });
    expect(undoCreation(back, 'picture')).toEqual(save);
    // With nothing earlier, there is nothing to undo.
    save = keepCreation(emptyCreations(), picture(0.1));
    expect(undoCreation(save, 'picture')).toBe(save);
  });

  it('treats the picture and the tune separately', () => {
    let save = keepCreation(emptyCreations(), picture(0.1));
    save = keepCreation(save, tune(3, [0, 0], [1, 2]));
    expect(save.picture.current).toEqual(picture(0.1));
    expect(save.tune.current?.notes).toHaveLength(2);
    save = keepCreation(save, tune(3, [0, 1], [2, 0], [3, 2]));
    expect(canUndo(save, 'tune')).toBe(true);
    expect(canUndo(save, 'picture')).toBe(false);
    expect(undoCreation(save, 'tune').picture).toEqual(save.picture);
  });

  it('shares the picture board between stamped pictures and paintings', () => {
    let save = keepCreation(emptyCreations(), picture(0.1));
    const painted = painting(0.2, 0.4, 0.6);
    save = keepCreation(save, painted);
    expect(save.picture).toEqual({ current: painted, previous: picture(0.1) });
    expect(undoCreation(save, 'picture').picture).toEqual({ current: picture(0.1), previous: painted });
  });

  it('ignores something that cannot be hung', () => {
    const save = emptyCreations();
    expect(keepCreation(save, { kind: 'picture', stamps: [] })).toBe(save);
    expect(keepCreation(save, tune(3, [0, 0]))).toBe(save);
  });

  it('never changes the save it was given', () => {
    const save = keepCreation(emptyCreations(), picture(0.1));
    const copy = JSON.parse(JSON.stringify(save));
    keepCreation(save, picture(0.5));
    undoCreation(keepCreation(save, picture(0.5)), 'picture');
    expect(save).toEqual(copy);
  });
});

describe('what a tune sounds like', () => {
  it('plays each column in turn with the scale steps of its jellies, quiet where there is none', () => {
    const t = tune(3, [0, 0], [0, 2], [2, 1]);
    expect(tuneBeats(t)).toEqual([[ROW_STEPS[3][0], ROW_STEPS[3][2]], [], [ROW_STEPS[3][1]], []]);
  });

  it('is higher for a higher jelly, as it is in the game', () => {
    const t = tune(4, [0, 0], [1, 3]);
    const [high, low] = tuneBeats(t);
    expect(high[0]).toBeGreaterThan(low[0]);
  });
});
