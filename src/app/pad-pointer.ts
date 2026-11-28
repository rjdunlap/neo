import { Circle, Container, Rectangle, Text } from 'pixi.js';
import { ink } from '../art/palette';
import { FONT } from '../ui/text';
import { drawHand } from '../engine/ghost';
import type { CouchControls } from '../engine/controller';

/**
 * The pad pointer's pointer id. A real finger or mouse never has it, so the shell can tell its presses from a real touch
 * (a real touch hides the pointer and hands the round back to the finger; the pointer's own presses must not).
 */
export const PAD_POINTER = 71_000_002;

/** A place the pointer can jump to: the middle of something that answers a touch, in canvas CSS pixels. */
export interface PointerSpot {
  x: number;
  y: number;
  /** The thing itself, so the hand can stay on it while it moves (a rising bubble, a walking critter). */
  ref?: Container;
}

export type PointerAction = 'move' | 'down' | 'up';

/** Seconds an arrow or the stick is held before the hand stops jumping between things and glides instead. */
export const GLIDE_AFTER = 0.28;
/** Within this share of the window's short side an arrow tap may jump well off to the side (`jumpTarget`); further, only nearly straight ahead. */
export const REACH = 0.45;
/** One arrow-tap step over open ground, or while something is held: a share of the window's short side. */
export const STEP = 0.1;
/** Glide speed at a 768-pixel-high window, in pixels a second: slower while something is held, so a drop can be aimed. */
const GLIDE = { free: 520, carrying: 400, max: 2.4 };

/**
 * Where the pad pointer is and what one frame of keys or a pad does with it, kept apart from Pixi and the DOM so it is tested
 * without a browser. A tap of an arrow (or a flick of the stick) jumps to the nearest touchable thing that way, or steps a little where
 * there is none close (open board, or while something is held); holding it glides, faster the longer it is held. The bottom button (Enter or Space) is a finger: down when it goes down, up when it is
 * let go, so a hold-and-move is a drag. The first press only shows the hand: nothing is pressed that nobody has seen.
 */
export class PointerMotion {
  x = 0;
  y = 0;
  shown = false;
  down = false;
  /** The thing the hand jumped to, which it follows while it moves until the hand is moved off it or presses it. */
  follow: Container | null = null;
  /** The button has been let go since the hand appeared, so the next press is a real one. */
  private armed = false;
  private heldFor = 0;

  /** Shows the hand at `at` (the touchable thing nearest the middle) without pressing anything. */
  show(at: PointerSpot) {
    this.shown = true;
    this.follow = at.ref ?? null;
    this.armed = false;
    this.heldFor = 0;
    this.x = at.x;
    this.y = at.y;
  }

  /** A finger came back, or the round stopped taking the pointer: hide it. True if the button was down (the caller lifts it). */
  hide(): boolean {
    const was = this.down;
    this.shown = false;
    this.down = false;
    this.follow = null;
    return was;
  }

  /**
   * One frame. `spots` is asked for only when an arrow is tapped. `size` is the window in CSS pixels. Returns what to send, in
   * order: a move first, so a press lands where the hand now is.
   */
  step(
    c: CouchControls,
    dt: number,
    spots: () => readonly PointerSpot[],
    size: { w: number; h: number },
  ): PointerAction[] {
    const ps = c.players.filter((p) => p.active);
    const dir = ps.find((p) => p.direction >= 0)?.direction ?? -1;
    const hold = ps.some((p) => p.hold);
    const pressed = dir >= 0 || ps.some((p) => p.action || p.undo || p.back);
    if (!this.shown) {
      if (!pressed) return [];
      const all = spots();
      const mid = { x: size.w / 2, y: size.h / 2 };
      const near = all.reduce<PointerSpot | null>(
        (best, s) =>
          !best || Math.hypot(s.x - mid.x, s.y - mid.y) < Math.hypot(best.x - mid.x, best.y - mid.y)
            ? s
            : best,
        null,
      );
      this.show(near ?? mid);
      return ['move'];
    }
    const out: PointerAction[] = [];
    const sx = clamp(
      ps.reduce((a, p) => a + p.x, 0),
      -1,
      1,
    );
    const sy = clamp(
      ps.reduce((a, p) => a + p.y, 0),
      -1,
      1,
    );
    const moving = Math.hypot(sx, sy) > 0;
    const x0 = this.x;
    const y0 = this.y;
    if (dir >= 0) {
      this.heldFor = 0;
      const short = Math.min(size.w, size.h);
      const all = this.down ? [] : spots();
      const to = jumpTarget(all, this, dir, short);
      if (to) {
        this.x = to.x;
        this.y = to.y;
        this.follow = to.ref ?? null;
      } else {
        this.follow = null;
        // Nothing to jump to close by that way (an open board, a row of places to put something), or a piece is held: a step.
        this.x += [1, 0, -1, 0][dir] * STEP * short;
        this.y += [0, 1, 0, -1][dir] * STEP * short;
      }
    } else if (moving) this.heldFor += dt;
    else this.heldFor = 0;
    if (dir < 0 && moving && (this.down || this.heldFor >= GLIDE_AFTER)) {
      const unit = Math.min(size.w, size.h) / 768;
      const ramp = Math.min(GLIDE.max, 1 + Math.max(0, this.heldFor - GLIDE_AFTER) * 1.2);
      const speed = (this.down ? GLIDE.carrying : GLIDE.free) * unit * ramp;
      this.follow = null;
      this.x += sx * speed * dt;
      this.y += sy * speed * dt;
    }
    this.x = clamp(this.x, 0, size.w);
    this.y = clamp(this.y, 0, size.h);
    if (this.x !== x0 || this.y !== y0) out.push('move');
    if (!hold) {
      this.armed = true;
      if (this.down) {
        this.down = false;
        out.push('up');
      }
    } else if (this.armed && !this.down) {
      this.down = true;
      // A held thing follows the hand now, not the other way round.
      this.follow = null;
      out.push('down');
    }
    return out;
  }
}

/** Drawn: it and every container above it are visible, up to the stage. */
const seen = (c: Container): boolean => {
  for (let at: Container | null = c; at; at = at.parent) if (!at.visible || at.destroyed) return false;
  return true;
};

/**
 * Where an arrow tap jumps from `from` toward `dir`: among the things that way, the one nearest counting sideways distance
 * twice. A near one may lie well off to the side (up to 2.5 times as far across as ahead); a far one must be within about
 * 40 degrees of straight ahead, so a far corner button never steals a tap meant to step across an open board. Every thing
 * stays reachable from every other this way, where the couch's ring rule (`nextSpot`) left some corners out.
 */
export function jumpTarget(
  spots: readonly PointerSpot[],
  from: { x: number; y: number },
  dir: number,
  short: number,
): PointerSpot | null {
  let best: PointerSpot | null = null;
  let bestCost = Infinity;
  for (const s of spots) {
    const dx = s.x - from.x;
    const dy = s.y - from.y;
    const along = dx * [1, 0, -1, 0][dir] + dy * [0, 1, 0, -1][dir];
    if (along <= 1) continue;
    const across = Math.abs(dx * [0, 1, 0, -1][dir] - dy * [1, 0, -1, 0][dir]);
    const dist = Math.hypot(dx, dy);
    if (across > along * (dist <= REACH * short ? 2.5 : 0.8)) continue;
    const cost = dist + across;
    if (cost < bestCost) {
      best = s;
      bestCost = cost;
    }
  }
  return best;
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/** Things that answer a touch: Pixi listeners a tap or a drag starts on. */
const TOUCH_EVENTS = ['pointerdown', 'pointertap', 'pointerup', 'tap', 'click', 'mousedown'] as const;

/**
 * The middles of everything under `root` that answers a touch and can be seen, in global (canvas CSS) pixels. Big catchers
 * (a whole-board backdrop, a tap-anywhere layer) are left out: the hand glides over those instead of jumping to their middle.
 */
export function touchSpots(
  root: Container,
  screen: { w: number; h: number },
  skip?: Container,
  extra: readonly (Container | PointerSpot)[] = [],
): PointerSpot[] {
  const out: PointerSpot[] = [];
  const big = screen.w * screen.h * 0.3;
  const given = new Set(extra.filter((c): c is Container => c instanceof Container));
  for (const c of extra) {
    if (!(c instanceof Container)) {
      if (c.x >= 0 && c.y >= 0 && c.x <= screen.w && c.y <= screen.h) out.push(c);
      continue;
    }
    const at = c.destroyed || !c.parent || !seen(c) ? null : middle(c);
    if (at && at.x >= 0 && at.y >= 0 && at.x <= screen.w && at.y <= screen.h)
      out.push({ x: at.x, y: at.y, ref: c });
  }
  const visit = (c: Container) => {
    if (c === skip || !c.visible || c.alpha <= 0.02 || c.eventMode === 'none' || c.destroyed) return;
    const live = c.eventMode === 'static' || c.eventMode === 'dynamic';
    if (live && !given.has(c) && TOUCH_EVENTS.some((t) => c.listenerCount(t) > 0)) {
      const at = middle(c);
      if (at && at.area <= big && at.x >= 0 && at.y >= 0 && at.x <= screen.w && at.y <= screen.h)
        out.push({ x: at.x, y: at.y, ref: c });
    }
    if (c.interactiveChildren === false) return;
    for (const child of c.children) visit(child);
  };
  visit(root);
  return out;
}

function middle(c: Container): { x: number; y: number; area: number } | null {
  const scale = Math.hypot(c.worldTransform.a, c.worldTransform.b) || 1;
  const hit = c.hitArea;
  if (hit instanceof Circle) {
    const p = c.toGlobal({ x: hit.x, y: hit.y });
    const r = hit.radius * scale;
    return { x: p.x, y: p.y, area: 4 * r * r };
  }
  if (hit instanceof Rectangle) {
    const p = c.toGlobal({ x: hit.x + hit.width / 2, y: hit.y + hit.height / 2 });
    return { x: p.x, y: p.y, area: hit.width * hit.height * scale * scale };
  }
  const b = c.getBounds();
  if (!(b.width > 0 && b.height > 0) || !Number.isFinite(b.x)) return null;
  return { x: b.x + b.width / 2, y: b.y + b.height / 2, area: b.width * b.height };
}

/** Seconds the "how the hand works" line stays up the first time the hand appears in a round. */
const TIP_FOR = 7;

/**
 * Keys and a pad in a round of a game that has no controller play of its own: a drawn hand that the arrows or the stick move,
 * and the bottom button (Enter, Space, or A) presses, sending the same pointer events a mouse would to the canvas so the
 * game's own touch handling does the rest. The scene adds `layer` above everything, calls `update` every frame with the
 * frame's keys and whether the round can take it, `lift` when a real finger comes back, and `destroy` when it goes.
 */
export class PadPointer {
  readonly layer = new Container();
  private readonly hand = drawHand();
  private readonly tip: Text;
  private readonly motion = new PointerMotion();
  private tipLeft = TIP_FOR;
  private tipShown = false;

  /** What the hand can jump between: the scene's whole tree (the app's pointer follows the scene in play). */
  root: () => Container;
  /** Things the game says a finger would touch that have no listener of their own (`Game.pointerSpots`). */
  extra: () => readonly (Container | PointerSpot)[] = () => [];

  constructor(
    private readonly canvas: HTMLCanvasElement,
    root: Container,
    /** The canvas size in CSS pixels, as Pixi's global coordinates count them. */
    private readonly screen: () => { width: number; height: number },
  ) {
    this.root = () => root;
    this.layer.eventMode = 'none';
    this.layer.visible = false;
    this.tip = new Text({
      text: 'Arrows or stick move the hand · Enter or A taps · hold it to drag',
      style: { fontFamily: FONT, fontSize: 20, fill: ink, fontWeight: '600', align: 'center' },
    });
    this.tip.anchor.set(0.5, 1);
    this.tip.visible = false;
    this.layer.addChild(this.tip, this.hand);
  }

  get shown(): boolean {
    return this.motion.shown;
  }

  /** One frame. `live`: a round is in play and nothing covers it (no card, no result, no pause). */
  update(keys: CouchControls, dt: number, live: boolean) {
    if (!live) {
      this.lift();
      return;
    }
    const s = this.screen();
    const size = { w: s.width, h: s.height };
    const actions = this.motion.step(
      keys,
      dt,
      () => touchSpots(this.root(), size, this.layer, this.extra()),
      size,
    );
    if (this.motion.shown && !actions.length) this.keepOn(size);
    for (const a of actions)
      this.send(a === 'move' ? 'pointermove' : a === 'down' ? 'pointerdown' : 'pointerup');
    this.draw(dt);
  }

  /** The thing the hand jumped to has moved: the hand moves with it, or lets it go once it is gone or off the window. */
  private keepOn(size: { w: number; h: number }) {
    const it = this.motion.follow;
    if (!it) return;
    const at = it.destroyed || !it.parent || !seen(it) ? null : middle(it);
    if (!at || at.x < 0 || at.y < 0 || at.x > size.w || at.y > size.h) {
      this.motion.follow = null;
      return;
    }
    if (Math.abs(at.x - this.motion.x) < 0.5 && Math.abs(at.y - this.motion.y) < 0.5) return;
    this.motion.x = at.x;
    this.motion.y = at.y;
    this.send('pointermove');
  }

  /** A real finger or mouse came back, or the round stopped taking the hand: lift anything held and hide. */
  lift() {
    if (this.motion.hide()) this.send('pointerup');
    this.layer.visible = false;
  }

  private draw(dt: number) {
    this.layer.visible = this.motion.shown;
    if (!this.motion.shown) return;
    const parent = this.layer.parent;
    if (!parent) return;
    const unit = Math.hypot(parent.worldTransform.a, parent.worldTransform.b) || 1;
    const at = parent.toLocal({ x: this.motion.x, y: this.motion.y });
    this.hand.position.copyFrom(at);
    const size = 0.62 / unit;
    this.hand.scale.set(this.motion.down ? size * 0.88 : size);
    if (!this.tipShown) {
      this.tipShown = true;
      this.tip.visible = true;
    }
    if (this.tip.visible) {
      this.tipLeft -= dt;
      const s = this.screen();
      const foot = parent.toLocal({ x: s.width / 2, y: s.height - 10 });
      this.tip.position.copyFrom(foot);
      this.tip.scale.set(1 / unit);
      this.tip.alpha = Math.min(1, this.tipLeft);
      if (this.tipLeft <= 0) this.tip.visible = false;
    }
  }

  /** One pointer event, as a mouse's would arrive: on the canvas (Pixi listens there and on the window it bubbles to). */
  private send(type: 'pointermove' | 'pointerdown' | 'pointerup') {
    const rect = this.canvas.getBoundingClientRect();
    const s = this.screen();
    const kx = s.width ? rect.width / s.width : 1;
    const ky = s.height ? rect.height / s.height : 1;
    const init: PointerEventInit = {
      bubbles: true,
      cancelable: true,
      composed: true,
      clientX: rect.left + this.motion.x * kx,
      clientY: rect.top + this.motion.y * ky,
      pointerId: PAD_POINTER,
      pointerType: 'mouse',
      isPrimary: true,
      button: type === 'pointermove' ? -1 : 0,
      buttons: type === 'pointerup' ? 0 : this.motion.down ? 1 : 0,
      pressure: this.motion.down ? 0.5 : 0,
    };
    this.canvas.dispatchEvent(new PointerEvent(type, init));
  }

  destroy() {
    this.lift();
    this.layer.destroy({ children: true });
  }
}
