import type { Container, FederatedPointerEvent } from 'pixi.js';
import { palmOnGlass } from './input';
import { ease, type Tweener } from './tween';

/** Only one thing moves at a time: the first finger wins, and others are ignored until it lifts. */
let active: number | null = null;
if (typeof window !== 'undefined') {
  const lift = (e: PointerEvent) => e.pointerId === active && (active = null);
  window.addEventListener('pointerup', lift);
  window.addEventListener('pointercancel', lift);
}

export interface DragOptions {
  /** Tracing follows the fingertip; movable objects default to riding 40 units above it. */
  lift?: number;
  /** Keep the object where it was grabbed instead of centring it under the finger (a long boat held by its stern). */
  keepGrab?: boolean;
  onPick?(): void;
  /** Moved to (x, y) in the parent's coordinates. */
  onMove?(x: number, y: number): void;
  /** Let go at (x, y). Return true if the game took it; otherwise it floats home. */
  onDrop(x: number, y: number): boolean;
}

export interface DragHandle {
  /** Where it floats back to after a miss. */
  home: { x: number; y: number };
  enabled: boolean;
  readonly dragging: boolean;
  floatHome(): Promise<void>;
  destroy(): void;
}

/** How far above the finger a held thing rides, so a small hand doesn't hide it. */
const LIFT = 40;

/**
 * Makes `obj` draggable with toddler rules: it lifts and rides above the finger,
 * one drag at a time, and anything not accepted floats gently home instead of falling.
 */
export function draggable(obj: Container, tw: Tweener, opts: DragOptions): DragHandle {
  let pointer: number | null = null;
  let restScale = obj.scale.x;
  const grab = { x: 0, y: 0 };

  const handle: DragHandle = {
    home: { x: obj.x, y: obj.y },
    enabled: true,
    get dragging() {
      return pointer !== null;
    },
    floatHome: () => tw.to(obj, { x: handle.home.x, y: handle.home.y }, { duration: 0.45, ease: ease.outBack }),
    destroy() {
      if (pointer !== null && active === pointer) active = null;
      pointer = null;
      window.removeEventListener('pointerup', onWindowUp);
      window.removeEventListener('pointercancel', onWindowUp);
      obj.removeAllListeners();
    },
  };

  const drop = () => {
    pointer = null;
    tw.kill(grab);
    void tw.to(obj.scale, { x: restScale, y: restScale }, { duration: 0.15 });
    if (!opts.onDrop(obj.x, obj.y)) void handle.floatHome();
  };
  const onUp = (e: { pointerId: number }) => e.pointerId === pointer && drop();
  const onWindowUp = (e: PointerEvent) => onUp(e);

  obj.eventMode = 'static';
  obj.cursor = 'grab';
  obj.on('pointerdown', (e: FederatedPointerEvent) => {
    if (!handle.enabled || pointer !== null || active !== null || palmOnGlass() || !obj.parent) return;
    pointer = active = e.pointerId;
    tw.kill(obj);
    tw.kill(obj.scale);
    restScale = obj.scale.x;
    const p = obj.parent.toLocal(e.global);
    grab.x = obj.x - p.x;
    grab.y = obj.y - p.y;
    obj.parent.addChild(obj); // on top of everything else
    void tw.to(obj.scale, { x: restScale * 1.12, y: restScale * 1.12 }, { duration: 0.12 });
    if (!opts.keepGrab) void tw.to(grab, { x: 0, y: -(opts.lift ?? LIFT) }, { duration: 0.15 });
    opts.onPick?.();
  });
  obj.on('globalpointermove', (e: FederatedPointerEvent) => {
    if (e.pointerId !== pointer || !obj.parent) return;
    const p = obj.parent.toLocal(e.global);
    obj.position.set(p.x + grab.x, p.y + grab.y);
    opts.onMove?.(obj.x, obj.y);
  });
  obj.on('pointerup', onUp);
  obj.on('pointerupoutside', onUp);
  window.addEventListener('pointerup', onWindowUp);
  window.addEventListener('pointercancel', onWindowUp);
  return handle;
}
