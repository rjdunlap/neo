import { describe, expect, it } from 'vitest';
import { Container } from 'pixi.js';
import { idle, type CouchControls, type PlayerControls } from '../engine/controller';
import { GLIDE_AFTER, PointerMotion, STEP } from './pad-pointer';

const size = { w: 1000, h: 800 };
const frame = (p: Partial<PlayerControls> = {}): CouchControls => {
  const c = idle();
  c.players[0] = { ...c.players[0], active: true, ...p };
  return c;
};
/** A tap of an arrow: the press frame, with the stick at full. */
const arrow = (direction: number) =>
  frame({ direction, x: [1, 0, -1, 0][direction], y: [0, 1, 0, -1][direction] });
const spots = [
  { x: 500, y: 400 },
  { x: 700, y: 400 },
  { x: 500, y: 650 },
];

describe('the pad pointer', () => {
  it('only shows the hand on the first press, at the touchable thing nearest the middle', () => {
    const m = new PointerMotion();
    expect(m.step(frame(), 0.016, () => spots, size)).toEqual([]);
    expect(m.shown).toBe(false);
    expect(m.step(frame({ action: true, hold: true }), 0.016, () => spots, size)).toEqual(['move']);
    expect(m).toMatchObject({ shown: true, down: false, x: 500, y: 400 });
    // The button that showed it is still held: nothing is pressed until it has been let go.
    expect(m.step(frame({ hold: true }), 0.016, () => spots, size)).toEqual([]);
    expect(m.step(frame(), 0.016, () => spots, size)).toEqual([]);
    expect(m.step(frame({ action: true, hold: true }), 0.016, () => spots, size)).toEqual(['down']);
    expect(m.step(frame(), 0.016, () => spots, size)).toEqual(['up']);
  });

  it('jumps to the nearest touchable thing an arrow points at, and steps where none is close', () => {
    const m = new PointerMotion();
    m.show(spots[0]);
    m.step(arrow(0), 0.016, () => spots, size);
    expect(m).toMatchObject({ x: 700, y: 400 });
    m.step(frame(), 0.016, () => spots, size);
    // Nothing lies to the right of the last spot: a short step instead.
    m.step(arrow(0), 0.016, () => spots, size);
    expect(m.x).toBeCloseTo(700 + STEP * 800);
    m.show(spots[0]);
    m.step(arrow(1), 0.016, () => spots, size);
    expect(m).toMatchObject({ x: 500, y: 650 });
  });

  it('glides while an arrow is held, and stays on the window', () => {
    const m = new PointerMotion();
    m.show({ x: 100, y: 100 });
    m.step(arrow(2), 0.016, () => [], size);
    const after = m.x;
    const held = frame({ x: -1 });
    for (let t = 0; t < GLIDE_AFTER; t += 0.05) m.step(held, 0.05, () => [], size);
    for (let i = 0; i < 60; i++) m.step(held, 0.05, () => [], size);
    expect(m.x).toBeLessThan(after);
    expect(m.x).toBe(0);
  });

  it('holds the button down while moving, so a hold and a push is a drag', () => {
    const m = new PointerMotion();
    m.show(spots[0]);
    m.step(frame(), 0.016, () => spots, size);
    expect(m.step(frame({ action: true, hold: true }), 0.016, () => spots, size)).toEqual(['down']);
    // While something is held, an arrow steps rather than jumping onto another touchable thing.
    expect(
      m.step(
        { ...arrow(0), players: [{ ...arrow(0).players[0], hold: true }, idle().players[1]] },
        0.016,
        () => spots,
        size,
      ),
    ).toEqual(['move']);
    expect(m.x).toBeCloseTo(500 + STEP * 800);
    expect(m.step(frame({ hold: true, x: 1 }), 0.1, () => spots, size)).toEqual(['move']);
    expect(m.down).toBe(true);
    expect(m.step(frame(), 0.016, () => spots, size)).toEqual(['up']);
  });

  it('lets go of a held button when it hides', () => {
    const m = new PointerMotion();
    m.show(spots[0]);
    m.step(frame(), 0.016, () => spots, size);
    m.step(frame({ action: true, hold: true }), 0.016, () => spots, size);
    expect(m.hide()).toBe(true);
    expect(m.shown).toBe(false);
    expect(m.hide()).toBe(false);
  });

  it('jumps to a thing straight ahead however far, and keeps hold of what it jumped to until moved off it', () => {
    const m = new PointerMotion();
    const ref = new Container();
    const far = [{ x: 520, y: 790, ref }];
    m.show({ x: 500, y: 10 });
    m.step(arrow(1), 0.016, () => far, size);
    expect(m).toMatchObject({ x: 520, y: 790 });
    expect(m.follow).toBe(ref);
    m.step(frame(), 0.016, () => far, size);
    // A step off it, or pressing it, lets it go.
    m.step(arrow(2), 0.016, () => [], size);
    expect(m.follow).toBe(null);
  });
});
