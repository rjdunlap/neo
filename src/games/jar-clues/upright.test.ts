import { describe, expect, it } from 'vitest';
import { computeView, NO_INSETS } from '../../engine/view';
import { captionPlace } from '../../ui/caption-layout';
import { thumbPx, uprightProblems, UPRIGHT_VIEWS, type Target } from '../upright-check';
import { JAR_OUTER } from './art';
import { MIN_CELL, boardBox, cardBoxes, cellBox, layout, numberAt, type Box } from './layout';
import { NUMBERS } from './logic';

/**
 * Jar Clues held upright, on the upright screens and the short captioned phone the browser play uses (390 × 625), and
 * sideways on a phone and a tablet. Every cell, Help, the next button and the clue card are targets; the jar and
 * the note are pictures.
 */
const shortPhone = captionPlace(computeView(390, 625, NO_INSETS, true), true).game;
const sideways = captionPlace(computeView(625, 390, NO_INSETS), true).game;
const tablet = captionPlace(computeView(1024, 768, NO_INSETS), true).game;
const views = { ...UPRIGHT_VIEWS, shortPhone, sideways, tablet };
type V = (typeof views)[keyof typeof views];

const target = (what: string, b: Box): Target => ({ what, ...b });
const targets = (v: V) => {
  const l = layout(v);
  return [
    target('clue card', l.clue),
    target('Help', l.help),
    target('next', l.next),
    ...NUMBERS.map((n) => target(`cell ${n}`, cellBox(l, n))),
  ];
};

describe.each(Object.entries(views))('Jar Clues on %s', (name, v) => {
  it('lays out the cells, the clue card and the buttons: at least 64 units, apart, in view, clear of Home and the guide', () => {
    expect(uprightProblems(v, targets(v), MIN_CELL), name).toEqual([]);
    const l = layout(v);
    expect(
      uprightProblems(
        v,
        [l.jar, l.note].map((b, i) => target(`picture ${i}`, b)),
        0,
      ),
    ).toEqual([]);
  });

  it.each([2, 3])('lays out %i last-look cards in view, apart and at least 64 units', (n) => {
    const l = layout(v);
    const cards = cardBoxes(l, n).map((b, i) => target(`card ${i}`, b));
    expect(uprightProblems(v, [...cards, target('Help', l.help), target('next', l.next)], MIN_CELL)).toEqual(
      [],
    );
  });

  it('finds the number under each cell', () => {
    const l = layout(v);
    for (const n of NUMBERS) expect(numberAt(l, cellBox(l, n).x, cellBox(l, n).y)).toBe(n);
    const b = boardBox(l);
    expect(numberAt(l, b.x - b.w / 2 - 2, b.y)).toBeNull();
  });

  it('keeps everything above a caption bubble when upright', () => {
    const l = layout(v);
    const caption = captionPlace(v, true);
    if (l.upright && caption.mode === 'bubble' && caption.band) {
      expect(l.next.y + l.next.h / 2).toBeLessThanOrEqual(caption.band.y);
      expect(l.help.y + l.help.h / 2).toBeLessThanOrEqual(caption.band.y);
    }
  });
});

describe('Jar Clues on the short captioned phone', () => {
  it('fits the strip, the board and the button row above the caption, with a jar at least 200 units tall', () => {
    const l = layout(shortPhone);
    expect(l.upright).toBe(true);
    expect(l.board.cell).toBeGreaterThanOrEqual(MIN_CELL);
    expect(l.jar.h).toBeGreaterThanOrEqual(200);
    const k = Math.min((l.jar.w - 16) / JAR_OUTER.w, (l.jar.h - 16) / JAR_OUTER.h);
    expect(JAR_OUTER.h * k).toBeGreaterThanOrEqual(200);
  });
});

describe('Jar Clues target sizes', () => {
  it('records the smallest target in CSS pixels at 390 x 844: a cell, 37.6', () => {
    const v = UPRIGHT_VIEWS.phone;
    expect(thumbPx(Math.min(...targets(v).map((t) => Math.min(t.w, t.h))))).toBe(37.6);
  });
});
