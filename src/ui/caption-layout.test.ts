import { describe, expect, it } from 'vitest';
import { SCRIPT, type LineId } from '../content/voice-script';
import { computeView, NO_INSETS } from '../engine/view';
import { BANDS } from '../progress/bands';
import {
  ASIDE_MIN,
  BUBBLE_W,
  CAPTION_BUDGET,
  CAPTION_SIZES,
  RAIL_W,
  SLOT_STAND_IN,
  STRIP_H,
  CaptionLines,
  captionPlace,
  captionShows,
  captionSize,
  captionTextHeight,
  captionTextWidth,
  lineHeight,
  wrapCount,
} from './caption-layout';

const sound = { speech: true, volume: 1, showWords: false };

const sources = import.meta.glob<string>(['../games/*/*.ts', '!../games/*/*.test.ts'], {
  query: '?raw',
  import: 'default',
  eager: true,
});

/** Every line id written out in an `instruct(` call in a game's source; computed ids are not found this way. */
function instructionIds(): LineId[] {
  const ids = new Set<string>();
  for (const src of Object.values(sources))
    for (const m of src.matchAll(/\binstruct\(\s*['"`]([\w.-]+)['"`]/g)) ids.add(m[1]);
  return [...ids].filter((id): id is LineId => id in SCRIPT);
}

const filled = (text: string) => text.replace(/\{\w+\}/g, SLOT_STAND_IN);

describe('who sees the caption', () => {
  it('shows a grown-up round its words always, whatever the switches say', () => {
    expect(captionShows('grownup', sound)).toBe(true);
    expect(captionShows('grownup', { speech: false, volume: 0, showWords: false })).toBe(true);
  });

  it('shows a school round its words only with the voice off, the volume at zero or "Show the words" on', () => {
    expect(captionShows('school', sound)).toBe(false);
    expect(captionShows('school', { ...sound, speech: false })).toBe(true);
    expect(captionShows('school', { ...sound, volume: 0 })).toBe(true);
    expect(captionShows('school', { ...sound, showWords: true })).toBe(true);
  });

  it('never shows a younger round anything to read', () => {
    for (const band of BANDS.map((b) => b.id).filter((b) => b !== 'grownup' && b !== 'school'))
      expect(captionShows(band, { speech: false, volume: 0, showWords: true }), band).toBe(false);
  });
});

describe('where the caption sits', () => {
  const phone = computeView(390, 844, NO_INSETS, true);
  const small = computeView(375, 667, NO_INSETS, true);
  const sideways = computeView(844, 390);
  const smallSideways = computeView(568, 320);
  const ipad = computeView(1024, 768);

  it('leaves the screen alone when the caption is off', () => {
    for (const v of [phone, sideways, ipad]) {
      const p = captionPlace(v, false);
      expect(p).toMatchObject({ mode: 'none', dx: 0, band: null });
      expect(p.game).toBe(v);
    }
  });

  it('upright: a strip across the bottom, and the game keeps the rest', () => {
    for (const v of [phone, small]) {
      const p = captionPlace(v, true);
      expect(p.mode).toBe('strip');
      expect(p.dx).toBe(0);
      expect(p.game).toEqual({ ...v, h: v.h - STRIP_H });
      expect(p.game.upright).toBe(true);
      // The band starts where the game's view ends and reaches the foot of the screen: it never overlaps the board.
      expect(p.band).toEqual({ x: 0, y: p.game.h, w: v.w, h: STRIP_H });
    }
    expect(Math.round(captionPlace(small, true).game.h)).toBe(1206);
  });

  it('upright on a screen shorter than the small phone: no strip, the bubble instead', () => {
    expect(captionPlace(computeView(375, 640, NO_INSETS, true), true).mode).toBe('bubble');
  });

  it('sideways: a rail down the left, the board moved right by it and still at least the design width', () => {
    for (const v of [sideways, smallSideways]) {
      const p = captionPlace(v, true);
      expect(p.mode).toBe('rail');
      expect(p.dx).toBe(RAIL_W);
      expect(p.game).toEqual({ ...v, w: v.w - RAIL_W });
      expect(p.game.w).toBeGreaterThanOrEqual(1024);
      expect(p.band).toEqual({ x: 0, y: 0, w: RAIL_W, h: v.h });
    }
  });

  it('an iPad-shaped screen has no side to spare: the whole view for the game and a bubble above the guide', () => {
    for (const v of [ipad, computeView(1180, 820), computeView(768, 1024, NO_INSETS, true)]) {
      const p = captionPlace(v, true);
      expect(p.mode).toBe('bubble');
      expect(p.game).toBe(v);
      expect(p.dx).toBe(0);
      const b = p.band!;
      // On screen, no wider than the bubble's most, and its foot clear of the guide's corner (170 units tall).
      expect(b.x).toBe(0);
      expect(b.w).toBeLessThanOrEqual(Math.min(v.w, BUBBLE_W));
      expect(b.y).toBeGreaterThan(0);
      expect(b.y + b.h).toBeLessThanOrEqual(v.h - 170);
    }
  });
});

describe('the words fit', () => {
  const strip = captionPlace(computeView(375, 667, NO_INSETS, true), true);
  const rail = captionPlace(computeView(568, 320), true);
  const bubble = captionPlace(computeView(768, 1024, NO_INSETS, true), true);

  it('wraps by whole words', () => {
    expect(wrapCount('one two three', 13)).toBe(1);
    expect(wrapCount('one two three', 7)).toBe(2);
    expect(wrapCount('one two three', 3)).toBe(3);
    expect(wrapCount('', 10)).toBe(1);
  });

  it('the strip holds three lines of the usual size and four of the small one', () => {
    const h = captionTextHeight(strip);
    expect(Math.floor(h / lineHeight(CAPTION_SIZES[0]))).toBe(3);
    expect(Math.floor(h / lineHeight(CAPTION_SIZES[1]))).toBe(4);
    expect(captionTextWidth(strip)).toBeGreaterThan(600);
  });

  it('a short line is set at the usual size and a long one smaller', () => {
    expect(captionSize('Tap the biggest one.', strip)).toBe(34);
    expect(captionSize('word '.repeat(30).trim(), strip)).toBe(28);
    expect(captionSize('word '.repeat(200).trim(), strip)).toBeNull();
  });

  const ids = instructionIds();

  it('finds the instruction lines', () => {
    expect(ids.length).toBeGreaterThan(300);
  });

  it(`no instruction option is longer than ${CAPTION_BUDGET} characters with its slots filled`, () => {
    const over = ids.flatMap((id) =>
      (SCRIPT[id] as readonly string[])
        .map(filled)
        .filter((t) => t.length > CAPTION_BUDGET)
        .map((t) => `${id} (${t.length}): ${t}`),
    );
    expect(over).toEqual([]);
  });

  it('every instruction option fits the strip, the rail and the bubble without being cut', () => {
    const cut = ids.flatMap((id) =>
      (SCRIPT[id] as readonly string[])
        .map(filled)
        .filter((t) => [strip, rail, bubble].some((place) => captionSize(t, place) === null))
        .map((t) => `${id} (${t.length}): ${t}`),
    );
    expect(cut).toEqual([]);
  });
});

describe('what the band shows from moment to moment', () => {
  /** A line's speech, ended by hand. */
  function speech() {
    let end = () => {};
    const done = new Promise<void>((resolve) => (end = resolve));
    return { done, end };
  }
  const settle = () => new Promise<void>((resolve) => setTimeout(resolve, 0));

  it('shows the instruction, and says whether the words changed', () => {
    const lines = new CaptionLines();
    expect(lines.text).toBe('');
    expect(lines.instruct('Tap the biggest one.', speech().done)).toBe(true);
    expect(lines.instruct('Tap the biggest one.', speech().done)).toBe(false);
    expect(lines.text).toBe('Tap the biggest one.');
    expect(lines.isAside).toBe(false);
  });

  it('a line said in between takes the place until it is spoken, then gives the instruction back', async () => {
    const lines = new CaptionLines();
    lines.instruct('Which is next?', speech().done);
    const hint = speech();
    expect(lines.say('Look at the colours.', hint.done)).toBe(true);
    expect(lines.text).toBe('Look at the colours.');
    expect(lines.isAside).toBe(true);
    // Still being said after the least time: it stays.
    expect(lines.update(ASIDE_MIN + 1)).toBe(false);
    expect(lines.text).toBe('Look at the colours.');
    hint.end();
    await settle();
    expect(lines.update(0.016)).toBe(true);
    expect(lines.text).toBe('Which is next?');
    expect(lines.isAside).toBe(false);
  });

  it('a short line stays at least the least time', async () => {
    const lines = new CaptionLines();
    lines.instruct('Which is next?', speech().done);
    const praise = speech();
    lines.say('Yes!', praise.done);
    praise.end();
    await settle();
    expect(lines.update(ASIDE_MIN - 0.1)).toBe(false);
    expect(lines.text).toBe('Yes!');
    expect(lines.update(0.2)).toBe(true);
    expect(lines.text).toBe('Which is next?');
  });

  it('a new instruction wins at once, and the old line ending later changes nothing', async () => {
    const lines = new CaptionLines();
    lines.instruct('Which is next?', speech().done);
    const hint = speech();
    lines.say('Look at the colours.', hint.done);
    const next = speech();
    expect(lines.instruct('Now the last one.', next.done)).toBe(true);
    expect(lines.text).toBe('Now the last one.');
    hint.end();
    await settle();
    // The bubble still shows: the instruction itself is being said.
    lines.update(ASIDE_MIN + 1);
    expect(lines.live).toBe(true);
    next.end();
    await settle();
    expect(lines.live).toBe(false);
    expect(lines.text).toBe('Now the last one.');
  });

  it('a line whose speech fails still ends', async () => {
    const lines = new CaptionLines();
    lines.instruct('Which is next?', Promise.resolve());
    lines.say('Hm.', Promise.reject(new Error('no speech')));
    await settle();
    expect(lines.update(ASIDE_MIN + 0.1)).toBe(true);
    expect(lines.text).toBe('Which is next?');
  });
});
