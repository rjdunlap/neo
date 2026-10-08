import { Circle, type Container, type FederatedPointerEvent } from 'pixi.js';

/** Where the last finger (or mouse) was, in canvas CSS pixels. Critters' eyes follow it. */
export const gaze = { x: 0, y: 0, at: -Infinity };

const down = new Set<number>();

/** What the person plays with: a finger (or pen) on glass, or a mouse. */
export type PointerKind = 'touch' | 'mouse';
let kind: PointerKind = typeof matchMedia === 'function' && matchMedia('(pointer: coarse)').matches ? 'touch' : 'mouse';

/** The last real pointer decides (a touch laptop follows whichever she used last); before any, whether the screen is a touch one. */
export const pointerKind = (): PointerKind => kind;

/** Watches every pointer on the page. Capture phase, so it runs before Pixi dispatches. */
export function trackPointers() {
  const seen = (e: PointerEvent) => {
    kind = e.pointerType === 'mouse' ? 'mouse' : 'touch';
    gaze.x = e.clientX;
    gaze.y = e.clientY;
    gaze.at = performance.now();
  };
  window.addEventListener(
    'pointerdown',
    (e) => {
      down.add(e.pointerId);
      seen(e);
    },
    { capture: true },
  );
  window.addEventListener(
    'pointermove',
    (e) => {
      if (e.pointerType === 'mouse' || down.has(e.pointerId)) seen(e);
    },
    { capture: true },
  );
  const lift = (e: PointerEvent) => down.delete(e.pointerId);
  window.addEventListener('pointerup', lift, { capture: true });
  window.addEventListener('pointercancel', lift, { capture: true });
  // iOS can swallow pointerup when a system gesture takes over; start fresh when we come back.
  document.addEventListener('visibilitychange', () => down.clear());
}

/** A hand resting on the glass shows up as a pile of touches. Taps made during that are ignored. */
export function palmOnGlass(): boolean {
  return down.size > 3;
}

export interface TapOptions {
  /** Milliseconds before the same object answers again. */
  cooldown?: number;
  /** A circular hit area, usually bigger than the drawing. */
  radius?: number;
}

/** Fires on touch-down rather than release, so a poke answers instantly. */
export function onTap(obj: Container, fn: (e: FederatedPointerEvent) => void, opts: TapOptions = {}) {
  obj.eventMode = 'static';
  obj.cursor = 'pointer';
  if (opts.radius) obj.hitArea = new Circle(0, 0, opts.radius);
  const cooldown = opts.cooldown ?? 120;
  let last = -Infinity;
  obj.on('pointerdown', (e) => {
    const now = performance.now();
    if (now - last < cooldown || palmOnGlass()) return;
    last = now;
    fn(e);
  });
}
