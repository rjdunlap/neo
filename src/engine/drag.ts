import { Container, Rectangle, type FederatedPointerEvent } from 'pixi.js';
import { palmOnGlass, watchTaps } from './input';
import { ease, type Tweener } from './tween';

/** Only one thing moves at a time: the first finger wins, and others are ignored until it lifts. */
let active: number | null = null;
if (typeof window !== 'undefined') {
  const lift = (e: PointerEvent) => e.pointerId === active && (active = null);
  window.addEventListener('pointerup', lift);
  window.addEventListener('pointercancel', lift);
}

/** A release whose finger travelled less than this (in the parent's units, from touch-down) is a tap, not a drag. */
export const TAP_TRAVEL = 24;

/** The one piece lifted by a tap and waiting for a place, across every game's handles. */
interface Hold {
  handle: DragHandle;
  catcher: Container;
  putDown(e: { global: { x: number; y: number } }): void;
  cancel(): void;
  /** Stops listening on the root for taps on the ground. */
  off(): void;
}
let held: Hold | null = null;

/**
 * While a piece is held by a tap, the transparent catcher under its siblings: a touch there, or anywhere that is not
 * an interactive object, puts the piece down at that point. A game's ghost finger aims a put-down with
 * `{ tap: spot, receiver: heldPlace() }`. Null when nothing is held.
 */
export function heldPlace(): Container | null {
  return held?.catcher ?? null;
}

/** Ends a hold without a put-down (a card or sheet covers the round, the page hides, a pad takes over). */
export function cancelHeld(): void {
  held?.cancel();
}

// A tap on a button never waits behind a held piece: a place takes the piece, anything else cancels the hold and acts.
watchTaps((e, place) => {
  if (!held) return;
  if (place) held.putDown(e);
  else held.cancel();
});
if (typeof document !== 'undefined') document.addEventListener('visibilitychange', cancelHeld);

export interface DragOptions {
  /** Tracing follows the fingertip; movable objects default to riding 40 units above it. */
  lift?: number;
  /** Keep the object where it was grabbed instead of centring it under the finger (a long boat held by its stern). */
  keepGrab?: boolean;
  /**
   * Tap the piece, then tap the place: a still tap holds the piece (it breathes at its home) and the next touch on the
   * play area or on an `onTap` place glides it there and calls `onDrop`, as the end of a drag does. Off by default, since
   * a still tap already means something in some games; a function is asked at each release.
   */
  tapToPlace?: boolean | (() => boolean);
  /** A hold ended without a put-down. Without this, a cancel is `onDrop` at the piece's home, as a still tap is. */
  onCancel?(): void;
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
  /** A finger is carrying it, or it is gliding to a tapped place. */
  readonly dragging: boolean;
  /** Gliding to a tapped place; `onDrop` follows when it lands. */
  readonly placing: boolean;
  /** Lifted by a tap and waiting for a place. */
  readonly held: boolean;
  /** The release now reaching `onDrop` was a still tap (under `TAP_TRAVEL` of finger travel); false for a put-down or a cancel. */
  readonly tapped: boolean;
  /** Ends this piece's hold, if it is held, as a cancel. */
  cancel(): void;
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
  /** Where the finger went down and how far it has been since: the piece itself lifts, so its own travel says nothing. */
  const downAt = { x: 0, y: 0 };
  let travel = 0;
  let tapped = false;
  /** This touch began on the piece while it was held: a still release puts it back down instead of holding it again. */
  let again = false;
  let hold: Hold | null = null;
  let placing = false;
  let gone = false;

  const handle: DragHandle = {
    home: { x: obj.x, y: obj.y },
    enabled: true,
    get dragging() {
      return pointer !== null || placing;
    },
    get placing() {
      return placing;
    },
    get held() {
      return hold !== null;
    },
    get tapped() {
      return tapped;
    },
    cancel: () => hold?.cancel(),
    floatHome: () =>
      tw.to(obj, { x: handle.home.x, y: handle.home.y }, { duration: 0.45, ease: ease.outBack }),
    destroy() {
      gone = true;
      if (pointer !== null && active === pointer) active = null;
      pointer = null;
      release();
      window.removeEventListener('pointerup', onWindowUp);
      window.removeEventListener('pointercancel', onWindowUp);
      obj.removeAllListeners();
    },
  };

  const settle = () => void tw.to(obj.scale, { x: restScale, y: restScale }, { duration: 0.15 });
  const wantsHold = () => (typeof opts.tapToPlace === 'function' ? opts.tapToPlace() : !!opts.tapToPlace);

  /** The held look: it stays at its pick-up size and breathes, about once a second, until it is put down. */
  const breathe = () => {
    void tw
      .to(obj.scale, { x: restScale * 1.2, y: restScale * 1.2 }, { duration: 0.5, ease: ease.inOutSine })
      .then(() =>
        tw.to(
          obj.scale,
          { x: restScale * 1.12, y: restScale * 1.12 },
          { duration: 0.5, ease: ease.inOutSine },
        ),
      )
      .then(() => hold && breathe());
  };

  /** Ends the hold without telling the game. */
  const release = () => {
    if (!hold) return;
    if (held === hold) held = null;
    hold.off();
    hold.catcher.destroy();
    hold = null;
    tw.kill(obj.scale);
  };

  const cancel = () => {
    release();
    tapped = false;
    settle();
    if (opts.onCancel) opts.onCancel();
    else if (opts.onDrop(handle.home.x, handle.home.y)) return;
    void handle.floatHome();
  };

  const putDown = (e: { global: { x: number; y: number } }) => {
    // A palm, or another finger mid-drag, leaves it held.
    if (palmOnGlass() || active !== null || !obj.parent) return;
    const p = obj.parent.toLocal(e.global);
    release();
    placing = true;
    tw.kill(obj);
    settle();
    obj.parent.addChild(obj);
    void tw.to(obj, { x: p.x, y: p.y }, { duration: 0.22 });
    // The scene's clock ends the glide, so a game that retargets the piece mid-flight cannot leave it placing for ever.
    void tw.wait(0.22).then(() => {
      placing = false;
      if (gone || obj.destroyed) return;
      tw.kill(obj);
      obj.position.set(p.x, p.y);
      tapped = false;
      opts.onMove?.(p.x, p.y);
      if (!opts.onDrop(p.x, p.y)) void handle.floatHome();
    });
  };

  const holdIt = () => {
    if (!obj.parent) return;
    held?.cancel();
    const catcher = new Container();
    catcher.eventMode = 'static';
    catcher.hitArea = new Rectangle(-1e5, -1e5, 2e5, 2e5);
    catcher.on('pointerdown', putDown);
    obj.parent.addChildAt(catcher, 0);
    // Pixi lets a drawing that is not interactive still cover what is under it, so a tap on the backdrop reaches the
    // root, not the catcher. The root hears every touch-down after its target has: by then a button or another piece has
    // already ended the hold, and whatever is left that did not land on something interactive is a tap on the ground.
    let top: Container = obj.parent;
    while (top.parent) top = top.parent;
    const onGround = (e: FederatedPointerEvent) => {
      const t = e.target as Container | null;
      if (t && t !== top && t !== catcher && (t.eventMode === 'static' || t.eventMode === 'dynamic')) return;
      putDown(e);
    };
    top.on('pointerdown', onGround);
    held = hold = { handle, catcher, putDown, cancel, off: () => top.off('pointerdown', onGround) };
    void tw.to(obj, { x: handle.home.x, y: handle.home.y }, { duration: 0.15 });
    tw.kill(obj.scale);
    breathe();
  };

  const drop = () => {
    // Let the next finger drag. A real finger also frees this on its window `pointerup`, but a touch that never
    // reaches the window (the how-to card's ghost finger) would otherwise leave every later drag ignored.
    if (active === pointer) active = null;
    pointer = null;
    tw.kill(grab);
    tapped = travel < TAP_TRAVEL;
    if (tapped && again) return cancel();
    if (tapped && wantsHold()) return holdIt();
    settle();
    if (!opts.onDrop(obj.x, obj.y)) void handle.floatHome();
  };
  const onUp = (e: { pointerId: number }) => e.pointerId === pointer && drop();
  const onWindowUp = (e: PointerEvent) => onUp(e);

  obj.eventMode = 'static';
  obj.cursor = 'grab';
  obj.on('pointerdown', (e: FederatedPointerEvent) => {
    if (!handle.enabled || pointer !== null || placing || active !== null || palmOnGlass() || !obj.parent)
      return;
    // Touching the held piece picks it up again (a drag from here is a drag); touching another piece switches to it.
    again = hold !== null;
    if (again) release();
    else held?.cancel();
    pointer = active = e.pointerId;
    tw.kill(obj);
    tw.kill(obj.scale);
    if (!again) restScale = obj.scale.x;
    const p = obj.parent.toLocal(e.global);
    downAt.x = p.x;
    downAt.y = p.y;
    travel = 0;
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
    travel = Math.max(travel, Math.hypot(p.x - downAt.x, p.y - downAt.y));
    obj.position.set(p.x + grab.x, p.y + grab.y);
    opts.onMove?.(obj.x, obj.y);
  });
  obj.on('pointerup', onUp);
  obj.on('pointerupoutside', onUp);
  window.addEventListener('pointerup', onWindowUp);
  window.addEventListener('pointercancel', onWindowUp);
  return handle;
}
