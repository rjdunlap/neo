import { Container, Point } from 'pixi.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Tweener } from './tween';

let draggable: typeof import('./drag').draggable;
let win: EventTarget;
let root: Container;
let tw: Tweener;
const handles: import('./drag').DragHandle[] = [];
const event = (pointerId: number, x = 200, y = 300) => ({ pointerId, global: new Point(x, y) });
const nativeUp = (type: string, pointerId: number) => win.dispatchEvent(Object.assign(new Event(type), { pointerId }));
function object(drop = vi.fn(() => true)) {
  const node = new Container();
  node.position.set(200, 300); root.addChild(node);
  const handle = draggable(node, tw, { onDrop: drop }); handles.push(handle);
  return { node, handle, drop };
}
beforeEach(async () => {
  vi.resetModules();
  win = new EventTarget(); vi.stubGlobal('window', win);
  vi.stubGlobal('document', new EventTarget());
  ({ draggable } = await import('./drag'));
  root = new Container(); tw = new Tweener();
});
afterEach(() => {
  handles.splice(0).forEach(h => h.destroy());
  tw.clear(); root.destroy({ children: true });
  vi.restoreAllMocks(); vi.unstubAllGlobals();
});

describe('shared object drags', () => {
  it('lets the first pointer own movement and release, then frees the lock for another object', () => {
    const a = object(), b = object();
    a.node.emit('pointerdown', event(1) as never);
    b.node.emit('pointerdown', event(2) as never);
    expect(a.handle.dragging).toBe(true); expect(b.handle.dragging).toBe(false);
    a.node.emit('globalpointermove', event(2, 900, 900) as never);
    expect(a.node.x).toBe(200);
    nativeUp('pointerup', 2);
    expect(a.handle.dragging).toBe(true);
    tw.update(.2);
    a.node.emit('globalpointermove', event(1, 400, 500) as never);
    expect(a.node.x).toBe(400); expect(a.node.y).toBeCloseTo(460);
    nativeUp('pointerup', 1);
    a.node.emit('pointerup', event(1) as never);
    expect(a.drop).toHaveBeenCalledExactlyOnceWith(400, 460);
    b.node.emit('pointerdown', event(2) as never);
    expect(b.handle.dragging).toBe(true);
  });

  it.each(['pointerup', 'pointercancel'])('handles native %s once even when Pixi misses it', type => {
    const a = object(), b = object();
    a.node.emit('pointerdown', event(1) as never);
    nativeUp(type, 1); nativeUp(type, 1);
    expect(a.drop).toHaveBeenCalledOnce(); expect(a.handle.dragging).toBe(false);
    b.node.emit('pointerdown', event(2) as never);
    expect(b.handle.dragging).toBe(true);
  });

  it('returns a refused drop home after release outside the object', () => {
    const a = object(vi.fn(() => false));
    a.node.emit('pointerdown', event(1) as never); tw.update(.2);
    a.node.emit('globalpointermove', event(1, 600, 500) as never);
    a.node.emit('pointerupoutside', event(1) as never);
    tw.update(1);
    expect(a.node.x).toBe(200); expect(a.node.y).toBe(300);
    expect(a.drop).toHaveBeenCalledOnce(); expect(a.handle.dragging).toBe(false);
  });

  it('releases listeners and the drag lock when destroyed mid-drag, without dropping', () => {
    const remove = vi.spyOn(win, 'removeEventListener');
    const a = object(), b = object();
    a.node.emit('pointerdown', event(1) as never);
    a.handle.destroy();
    expect(remove).toHaveBeenCalledWith('pointerup', expect.any(Function));
    expect(remove).toHaveBeenCalledWith('pointercancel', expect.any(Function));
    nativeUp('pointerup', 1);
    expect(a.drop).not.toHaveBeenCalled(); expect(a.handle.dragging).toBe(false);
    b.node.emit('pointerdown', event(2) as never);
    expect(b.handle.dragging).toBe(true);
  });

  it('rejects palm input and allows the next drag after the extra finger lifts', async () => {
    const { trackPointers } = await import('./input'); trackPointers();
    const a = object();
    for (let id = 1; id <= 4; id++) win.dispatchEvent(Object.assign(new Event('pointerdown'), { pointerId: id }));
    a.node.emit('pointerdown', event(1) as never);
    expect(a.handle.dragging).toBe(false);
    nativeUp('pointercancel', 4);
    a.node.emit('pointerdown', event(1) as never);
    expect(a.handle.dragging).toBe(true);
  });
});
