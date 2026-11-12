import { Container, Point } from 'pixi.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Tweener } from './tween';

let draggable: typeof import('./drag').draggable;
let win: EventTarget;
let root: Container;
let tw: Tweener;
const handles: import('./drag').DragHandle[] = [];
const event = (pointerId: number, x = 200, y = 300) => ({ pointerId, global: new Point(x, y) });
const nativeUp = (type: string, pointerId: number) =>
  win.dispatchEvent(Object.assign(new Event(type), { pointerId }));
function object(drop = vi.fn(() => true)) {
  const node = new Container();
  node.position.set(200, 300);
  root.addChild(node);
  const handle = draggable(node, tw, { onDrop: drop });
  handles.push(handle);
  return { node, handle, drop };
}
beforeEach(async () => {
  vi.resetModules();
  win = new EventTarget();
  vi.stubGlobal('window', win);
  vi.stubGlobal('document', new EventTarget());
  ({ draggable } = await import('./drag'));
  root = new Container();
  tw = new Tweener();
});
afterEach(() => {
  handles.splice(0).forEach((h) => h.destroy());
  tw.clear();
  root.destroy({ children: true });
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('shared object drags', () => {
  it('lets the first pointer own movement and release, then frees the lock for another object', () => {
    const a = object(),
      b = object();
    a.node.emit('pointerdown', event(1) as never);
    b.node.emit('pointerdown', event(2) as never);
    expect(a.handle.dragging).toBe(true);
    expect(b.handle.dragging).toBe(false);
    a.node.emit('globalpointermove', event(2, 900, 900) as never);
    expect(a.node.x).toBe(200);
    nativeUp('pointerup', 2);
    expect(a.handle.dragging).toBe(true);
    tw.update(0.2);
    a.node.emit('globalpointermove', event(1, 400, 500) as never);
    expect(a.node.x).toBe(400);
    expect(a.node.y).toBeCloseTo(460);
    nativeUp('pointerup', 1);
    a.node.emit('pointerup', event(1) as never);
    expect(a.drop).toHaveBeenCalledExactlyOnceWith(400, 460);
    b.node.emit('pointerdown', event(2) as never);
    expect(b.handle.dragging).toBe(true);
  });

  it.each(['pointerup', 'pointercancel'])('handles native %s once even when Pixi misses it', (type) => {
    const a = object(),
      b = object();
    a.node.emit('pointerdown', event(1) as never);
    nativeUp(type, 1);
    nativeUp(type, 1);
    expect(a.drop).toHaveBeenCalledOnce();
    expect(a.handle.dragging).toBe(false);
    b.node.emit('pointerdown', event(2) as never);
    expect(b.handle.dragging).toBe(true);
  });

  it('returns a refused drop home after release outside the object', () => {
    const a = object(vi.fn(() => false));
    a.node.emit('pointerdown', event(1) as never);
    tw.update(0.2);
    a.node.emit('globalpointermove', event(1, 600, 500) as never);
    a.node.emit('pointerupoutside', event(1) as never);
    tw.update(1);
    expect(a.node.x).toBe(200);
    expect(a.node.y).toBe(300);
    expect(a.drop).toHaveBeenCalledOnce();
    expect(a.handle.dragging).toBe(false);
  });

  it('releases listeners and the drag lock when destroyed mid-drag, without dropping', () => {
    const remove = vi.spyOn(win, 'removeEventListener');
    const a = object(),
      b = object();
    a.node.emit('pointerdown', event(1) as never);
    a.handle.destroy();
    expect(remove).toHaveBeenCalledWith('pointerup', expect.any(Function));
    expect(remove).toHaveBeenCalledWith('pointercancel', expect.any(Function));
    nativeUp('pointerup', 1);
    expect(a.drop).not.toHaveBeenCalled();
    expect(a.handle.dragging).toBe(false);
    b.node.emit('pointerdown', event(2) as never);
    expect(b.handle.dragging).toBe(true);
  });

  it('rejects palm input and allows the next drag after the extra finger lifts', async () => {
    const { trackPointers } = await import('./input');
    trackPointers();
    const a = object();
    for (let id = 1; id <= 4; id++)
      win.dispatchEvent(Object.assign(new Event('pointerdown'), { pointerId: id }));
    a.node.emit('pointerdown', event(1) as never);
    expect(a.handle.dragging).toBe(false);
    nativeUp('pointercancel', 4);
    a.node.emit('pointerdown', event(1) as never);
    expect(a.handle.dragging).toBe(true);
  });
});

describe('tap the piece, then the place', () => {
  let drag: typeof import('./drag');
  let input: typeof import('./input');
  beforeEach(async () => {
    drag = await import('./drag');
    input = await import('./input');
  });
  /** Scene time passes, then the promises it resolved run (a glide's landing, the next breath). */
  const step = async (dt: number) => {
    tw.update(dt);
    for (let i = 0; i < 6; i++) await Promise.resolve();
  };
  function piece(opts: Partial<import('./drag').DragOptions> = {}, at = { x: 200, y: 300 }) {
    const node = new Container();
    node.position.set(at.x, at.y);
    root.addChild(node);
    const drop = vi.fn((_x: number, _y: number) => true);
    const move = vi.fn();
    const handle = drag.draggable(node, tw, { tapToPlace: true, onDrop: drop, onMove: move, ...opts });
    handles.push(handle);
    return { node, handle, drop, move };
  }
  /** A finger down at (x, y), moved `travel` units, and lifted. */
  const press = (node: Container, id = 1, travel = 0, x = 200, y = 300) => {
    node.emit('pointerdown', event(id, x, y) as never);
    if (travel) node.emit('globalpointermove', event(id, x + travel, y) as never);
    node.emit('pointerup', event(id, x + travel, y) as never);
  };
  const button = (place: boolean) => {
    const node = new Container();
    root.addChild(node);
    const seen: boolean[] = [];
    const hit = vi.fn(() => seen.push(drag.heldPlace() !== null));
    input.onTap(node, hit, { place });
    return { node, hit, seen };
  };

  it('leaves a still tap as a drop at home when the piece has not asked for it', () => {
    const a = object();
    a.node.emit('pointerdown', event(1) as never);
    a.node.emit('pointerup', event(1) as never);
    expect(a.drop).toHaveBeenCalledExactlyOnceWith(200, 300);
    expect(a.handle.held).toBe(false);
    expect(a.handle.tapped).toBe(true);
    expect(drag.heldPlace()).toBeNull();
  });

  it('holds on a release under TAP_TRAVEL of finger travel and drags at it or beyond', async () => {
    const a = piece();
    press(a.node, 1, drag.TAP_TRAVEL - 1);
    expect(a.handle.held).toBe(true);
    expect(a.drop).not.toHaveBeenCalled();
    await step(0.5);
    expect([a.node.x, a.node.y]).toEqual([200, 300]);
    // The held look: never smaller than the pick-up size, never past 1.2, and still moving seconds later.
    const sizes: number[] = [];
    for (let i = 0; i < 30; i++) {
      await step(0.1);
      sizes.push(a.node.scale.x);
    }
    expect(sizes.slice(20).some((v) => v < 1.14)).toBe(true);
    expect(sizes.slice(20).some((v) => v > 1.18)).toBe(true);
    expect(Math.min(...sizes)).toBeGreaterThanOrEqual(1.119);
    expect(Math.max(...sizes)).toBeLessThanOrEqual(1.201);
    expect(Math.max(...sizes) - Math.min(...sizes)).toBeGreaterThan(0.05);

    const b = piece({}, { x: 500, y: 300 });
    press(b.node, 2, drag.TAP_TRAVEL, 500, 300);
    expect(b.handle.held).toBe(false);
    expect(b.drop).toHaveBeenCalledOnce();
    expect(b.handle.tapped).toBe(false);
  });

  it('asks a function-valued tapToPlace at each release', () => {
    let on = false;
    const a = piece({ tapToPlace: () => on });
    press(a.node);
    expect(a.handle.held).toBe(false);
    expect(a.drop).toHaveBeenCalledOnce();
    on = true;
    press(a.node);
    expect(a.handle.held).toBe(true);
  });

  it('glides to a touch on the catcher, then moves and drops there; a refusal floats home', async () => {
    const a = piece({ onDrop: vi.fn(() => false) });
    const drop = vi.fn((_x: number, _y: number) => false);
    const b = piece({ onDrop: drop });
    press(b.node);
    const place = drag.heldPlace()!;
    expect(place.parent).toBe(root);
    expect(root.getChildIndex(place)).toBe(0);
    place.emit('pointerdown', event(3, 640, 480) as never);
    expect(b.handle.held).toBe(false);
    expect(b.handle.placing).toBe(true);
    expect(drag.heldPlace()).toBeNull();
    expect(drop).not.toHaveBeenCalled();
    await step(0.25);
    expect(b.move).toHaveBeenCalledExactlyOnceWith(640, 480);
    expect(drop).toHaveBeenCalledExactlyOnceWith(640, 480);
    expect(b.move.mock.invocationCallOrder[0]).toBeLessThan(drop.mock.invocationCallOrder[0]);
    expect(b.handle.placing).toBe(false);
    expect(b.handle.tapped).toBe(false);
    await step(1);
    expect([b.node.x, b.node.y]).toEqual([200, 300]);
    expect(b.node.scale.x).toBeCloseTo(1);
    expect(a.handle.held).toBe(false);
  });

  it('takes a touch-down that reaches the root as a tap on the ground, unless it landed on something interactive', async () => {
    const a = piece();
    press(a.node);
    // A custom control that is not an onTap button keeps its touch, and the piece stays held.
    const knob = new Container();
    knob.eventMode = 'static';
    root.addChild(knob);
    root.emit('pointerdown', { ...event(3, 640, 480), target: knob } as never);
    expect(a.handle.held).toBe(true);
    // A drawing that is not interactive (the backdrop) is ground.
    const hill = new Container();
    root.addChild(hill);
    root.emit('pointerdown', { ...event(3, 640, 480), target: hill } as never);
    expect(a.handle.placing).toBe(true);
    await step(0.25);
    expect(a.drop).toHaveBeenCalledExactlyOnceWith(640, 480);
    // Nothing is left listening once the hold is over.
    root.emit('pointerdown', { ...event(3, 100, 100), target: root } as never);
    await step(0.25);
    expect(a.drop).toHaveBeenCalledOnce();
    expect(root.listenerCount('pointerdown')).toBe(0);
  });

  it('cancels with one drop at home on a tap on the held piece, on another piece, or on a button that still acts', () => {
    const a = piece();
    press(a.node);
    press(a.node);
    expect(a.handle.held).toBe(false);
    expect(a.drop).toHaveBeenCalledExactlyOnceWith(200, 300);
    expect(a.handle.tapped).toBe(false);

    // A drag that starts on the held piece is an ordinary drag.
    press(a.node);
    a.drop.mockClear();
    a.node.emit('pointerdown', event(1) as never);
    tw.update(0.2);
    a.node.emit('globalpointermove', event(1, 400, 500) as never);
    a.node.emit('pointerup', event(1) as never);
    expect(a.drop).toHaveBeenCalledExactlyOnceWith(400, 460);
    expect(a.handle.held).toBe(false);

    const b = piece({}, { x: 500, y: 300 });
    const c = piece({}, { x: 800, y: 300 });
    press(b.node, 1, 0, 500, 300);
    c.node.emit('pointerdown', event(2, 800, 300) as never);
    expect(b.drop).toHaveBeenCalledExactlyOnceWith(500, 300);
    expect(b.handle.held).toBe(false);
    expect(c.handle.dragging).toBe(true);
    c.node.emit('pointerup', event(2, 800, 300) as never);
    expect(c.handle.held).toBe(true);

    const done = button(false);
    done.node.emit('pointerdown', event(4) as never);
    expect(c.drop).toHaveBeenCalledExactlyOnceWith(800, 300);
    expect(c.handle.held).toBe(false);
    expect(done.hit).toHaveBeenCalledOnce();
    expect(done.seen).toEqual([false]);
  });

  it('calls onCancel instead of a drop at home when the game gives one', () => {
    const onCancel = vi.fn();
    const a = piece({ onCancel });
    press(a.node);
    drag.cancelHeld();
    expect(onCancel).toHaveBeenCalledOnce();
    expect(a.drop).not.toHaveBeenCalled();
    expect(a.handle.held).toBe(false);
  });

  it('puts the piece down at a place button before that button acts', async () => {
    const a = piece();
    const friend = button(true);
    press(a.node);
    friend.node.emit('pointerdown', event(5, 700, 200) as never);
    // The hold is over and the piece is on its way when the button's own handler runs.
    expect(friend.seen).toEqual([false]);
    expect(a.handle.placing).toBe(true);
    await step(0.25);
    expect(a.drop).toHaveBeenCalledExactlyOnceWith(700, 200);
    // With nothing held, a place is an ordinary button.
    await step(1);
    friend.node.emit('pointerdown', event(5, 700, 200) as never);
    expect(a.drop).toHaveBeenCalledOnce();
  });

  it('stays held under a palm and while another finger drags', async () => {
    input.trackPointers();
    const a = piece();
    const other = object();
    press(a.node);
    const place = drag.heldPlace()!;
    for (let id = 11; id <= 14; id++)
      win.dispatchEvent(Object.assign(new Event('pointerdown'), { pointerId: id }));
    place.emit('pointerdown', event(11, 640, 480) as never);
    expect(a.handle.held).toBe(true);
    for (let id = 11; id <= 14; id++) nativeUp('pointerup', id);

    // Another finger already carries a piece that never asked for the path: its lock keeps the put-down out.
    press(a.node); // put back
    other.node.emit('pointerdown', event(7) as never);
    nativeUp('pointerup', 7);
    press(a.node);
    expect(a.handle.held).toBe(true);
    a.drop.mockClear();
    const b = piece({ tapToPlace: false }, { x: 500, y: 300 });
    drag.heldPlace()!.emit('pointerdown', event(9, 640, 480) as never);
    expect(a.handle.placing).toBe(true);
    await step(0.25);
    expect(a.drop).toHaveBeenCalledExactlyOnceWith(640, 480);
    expect(b.handle.held).toBe(false);
  });

  it('ends a hold on cancelHeld, on the page hiding and on destroy, the last without a game call', () => {
    const a = piece();
    press(a.node);
    drag.cancelHeld();
    expect(a.handle.held).toBe(false);
    expect(a.drop).toHaveBeenCalledExactlyOnceWith(200, 300);

    press(a.node);
    document.dispatchEvent(new Event('visibilitychange'));
    expect(a.handle.held).toBe(false);
    expect(a.drop).toHaveBeenCalledTimes(2);

    press(a.node);
    a.handle.cancel();
    expect(a.drop).toHaveBeenCalledTimes(3);

    press(a.node);
    const place = drag.heldPlace()!;
    a.handle.destroy();
    expect(a.handle.held).toBe(false);
    expect(drag.heldPlace()).toBeNull();
    expect(place.destroyed).toBe(true);
    expect(a.drop).toHaveBeenCalledTimes(3);
  });

  it('holds one piece across handles', () => {
    const a = piece();
    const b = piece({}, { x: 500, y: 300 });
    expect(drag.heldPlace()).toBeNull();
    press(a.node);
    press(b.node, 2, 0, 500, 300);
    expect([a.handle.held, b.handle.held]).toEqual([false, true]);
    expect(a.drop).toHaveBeenCalledOnce();
    expect(root.children.filter((c) => c === drag.heldPlace())).toHaveLength(1);
    expect(root.children).toHaveLength(3);
  });
});
