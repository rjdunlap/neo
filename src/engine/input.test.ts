import { Container } from 'pixi.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

let input: typeof import('./input');
let win: EventTarget;
let doc: EventTarget;
const pointer = (type: string, pointerId: number, pointerType = 'touch', x = 20, y = 30) =>
  Object.assign(new Event(type), { pointerId, pointerType, clientX: x, clientY: y });

beforeEach(async () => {
  vi.resetModules();
  win = new EventTarget(); doc = new EventTarget();
  vi.stubGlobal('window', win); vi.stubGlobal('document', doc);
  input = await import('./input');
  input.trackPointers();
});
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); });

describe('shared pointer input', () => {
  it('rejects four resting fingers and recovers after native cancellation or visibility change', () => {
    for (let id = 1; id <= 3; id++) win.dispatchEvent(pointer('pointerdown', id));
    expect(input.palmOnGlass()).toBe(false);
    win.dispatchEvent(pointer('pointerdown', 4));
    expect(input.palmOnGlass()).toBe(true);
    win.dispatchEvent(pointer('pointercancel', 4));
    expect(input.palmOnGlass()).toBe(false);
    win.dispatchEvent(pointer('pointerdown', 4));
    doc.dispatchEvent(new Event('visibilitychange'));
    expect(input.palmOnGlass()).toBe(false);
  });

  it('tracks mouse hover, ignores unpressed touch movement, and treats a pen as touch', () => {
    win.dispatchEvent(pointer('pointermove', 1, 'mouse', 40, 50));
    expect(input.pointerKind()).toBe('mouse');
    expect(input.gaze).toMatchObject({ x: 40, y: 50 });
    win.dispatchEvent(pointer('pointermove', 2, 'touch', 90, 100));
    expect(input.gaze).toMatchObject({ x: 40, y: 50 });
    win.dispatchEvent(pointer('pointerdown', 2, 'pen', 60, 70));
    expect(input.pointerKind()).toBe('touch');
    win.dispatchEvent(pointer('pointermove', 2, 'pen', 80, 90));
    expect(input.gaze).toMatchObject({ x: 80, y: 90 });
    win.dispatchEvent(pointer('pointerup', 2));
    win.dispatchEvent(pointer('pointermove', 2, 'touch', 200, 200));
    expect(input.gaze).toMatchObject({ x: 80, y: 90 });
  });

  it('answers on down, blocks just below the cooldown, and accepts exactly at its boundary', () => {
    let now = 1000;
    vi.spyOn(performance, 'now').mockImplementation(() => now);
    const node = new Container();
    const tapped = vi.fn();
    input.onTap(node, tapped);
    node.emit('pointerdown', {} as never);
    expect(tapped).toHaveBeenCalledTimes(1);
    now += 119; node.emit('pointerdown', {} as never);
    expect(tapped).toHaveBeenCalledTimes(1);
    now++; node.emit('pointerdown', {} as never);
    expect(tapped).toHaveBeenCalledTimes(2);
    node.destroy();
  });

  it('does not charge a cooldown for a palm-rejected tap', () => {
    vi.spyOn(performance, 'now').mockReturnValue(1000);
    const node = new Container();
    const tapped = vi.fn();
    input.onTap(node, tapped, { cooldown: 500 });
    for (let id = 1; id <= 4; id++) win.dispatchEvent(pointer('pointerdown', id));
    node.emit('pointerdown', {} as never);
    expect(tapped).not.toHaveBeenCalled();
    win.dispatchEvent(pointer('pointerup', 4));
    node.emit('pointerdown', {} as never);
    expect(tapped).toHaveBeenCalledOnce();
    node.destroy();
  });
});
