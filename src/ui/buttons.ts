import { Circle, Container, Graphics } from 'pixi.js';
import { type Swatch } from '../art/palette';
import { crayon, paperCircle, paperRect } from '../art/paper';
import { sfx } from '../audio/sfx';
import { onTap, palmOnGlass } from '../engine/input';
import type { Meaning } from './origin-art';
import { namePill } from './text';
import { PILL } from '../content/button-names';

/** The outline a finish is drawn in: a circle about the origin, or a centred rounded rectangle. */
export type FinishShape = { radius: number } | { w: number; h: number; corner: number };

/**
 * The one finish every root button and card wears: a paper cut-out piece (docs/ART-STYLE.md) with its torn edge, warm
 * shadow, fibre and a crayon outline in a darker shade of the swatch. `face` replaces the swatch's fill for a card's
 * face (cream); the outline still follows the swatch, so a card keeps its colour. One Graphics, so a button's picture
 * stays its second child.
 */
export function finish(shape: FinishShape, sw: Swatch, face = sw.fill): Graphics {
  const g = new Graphics();
  const line = crayon(sw);
  if ('radius' in shape) paperCircle(g, 0, 0, shape.radius, face, { line, seed: shape.radius });
  else {
    const { w, h, corner } = shape;
    paperRect(g, -w / 2, -h / 2, w, h, corner, face, { line, seed: w * 7 + h });
  }
  return g;
}

/** The pressed pose: a squash, wider and lower, the moment a finger lands. */
export const SQUASH = { x: 1.07, y: 0.86 };
const springs = new WeakMap<Container, number>();
const frame = (fn: (now: number) => void) =>
  typeof requestAnimationFrame === 'function'
    ? requestAnimationFrame(fn)
    : setTimeout(() => fn(performance.now()), 16);

/** Squashes `node` at once; a new press cancels any spring still running on it. */
export function squash(node: Container) {
  springs.set(node, (springs.get(node) ?? 0) + 1);
  node.scale.set(SQUASH.x, SQUASH.y);
}

/**
 * Lets a squashed `node` spring back to its size over about a third of a second, overshooting once. It stops if the
 * node is destroyed or pressed again, so whatever closed with the press is never touched.
 */
export function spring(node: Container, delay = 0) {
  const id = (springs.get(node) ?? 0) + 1;
  springs.set(node, id);
  const from = { x: node.scale.x - 1, y: node.scale.y - 1 };
  let start = -1;
  const step = (now: number) => {
    if (node.destroyed || springs.get(node) !== id) return;
    if (start < 0) start = now + delay;
    const t = Math.max(0, now - start) / 1000;
    if (t >= 0.34) return node.scale.set(1);
    const k = Math.exp(-t / 0.08) * Math.cos(t * Math.PI * 2 * 4.2);
    node.scale.set(1 + from.x * k, 1 + from.y * k);
    frame(step);
  };
  frame(step);
}

/** How much the other choices fade while the chosen one leads the way out (U7 R2). */
export const UNCHOSEN_ALPHA = 0.6;

/**
 * Marks the picture a tap chose while the screen changes (U7 R2, docs/definitions/never-swallow-a-tap.md): it keeps its
 * pressed scale (any spring back stops), a thick white ring is drawn round its outline, and every other choice in `others`
 * dims, so it is plain which tap counted. Returns the undo (back to full size, the ring gone, the others as they were),
 * for a scene that stays after all.
 */
export function chosen(node: Container, others: readonly (Container | null | undefined)[]): () => void {
  springs.set(node, (springs.get(node) ?? 0) + 1);
  const ring = new Graphics();
  ring.label = 'chosen-ring';
  const radius = (node as { radius?: unknown }).radius;
  if (typeof radius === 'number') ring.circle(0, 0, radius + 7);
  else {
    const b = node.getLocalBounds();
    ring.roundRect(b.x - 7, b.y - 7, b.width + 14, b.height + 14, 30);
  }
  ring.stroke({ color: 0xffffff, width: 9 });
  node.addChild(ring);
  const dimmed = others.filter((o): o is Container => !!o && o !== node && !o.destroyed);
  const alphas = dimmed.map((o) => o.alpha);
  for (const o of dimmed) o.alpha = UNCHOSEN_ALPHA;
  return () => {
    if (!ring.destroyed) ring.destroy();
    if (!node.destroyed) node.scale.set(1);
    dimmed.forEach((o, i) => !o.destroyed && (o.alpha = alphas[i]));
  };
}

/** A big round button in the shared finish that squashes when pressed and springs back. */
export class RoundButton extends Container {
  constructor(
    icon: Container,
    sw: Swatch,
    radius: number,
    private readonly onPress: () => void,
  ) {
    super();
    this.radius = radius;
    this.addChild(finish({ radius }, sw), icon);
    onTap(this, () => this.press(), { radius: radius + 14, cooldown: 400 });
  }

  /** The button's size, for a focus ring around it. */
  readonly radius: number;
  /** At the root, whether this is a Home house or a Back arrow (RW14 slice 3). */
  meaning: Meaning | null = null;

  /** Marks the button as Home or Back (RW14 slice 3), for chaining onto its construction. */
  means(meaning: Meaning): this {
    this.meaning = meaning;
    return this;
  }

  /** Puts a short name on a pill across the button's lower rim (U1), at most `maxW` wide; for chaining onto its construction. */
  named(name: string, maxW?: number): this {
    const pill = namePill(name, maxW);
    pill.y = this.radius - PILL.lift;
    this.addChild(pill);
    return this;
  }

  /** What a tap does: the squish, the tick and the action. A key or button on a controller presses it the same way. */
  press() {
    sfx.tick();
    squash(this);
    // A press can close whatever holds the button (a journal, a scene); the spring stops once it's gone.
    spring(this, 90);
    this.onPress();
  }
}

/**
 * A button that must be held for a moment, with a ring that fills while held.
 * Used for "go home" so a stray tap doesn't end a game.
 */
export class HoldButton extends Container {
  private readonly ring = new Graphics();
  private progress = 0;
  private holding = -1;
  /** At the root, whether this is a Home house or a Back arrow (RW14 slice 3). */
  meaning: Meaning | null = null;
  /** Any lift of the holding finger, anywhere, lets go; a stuck press must never fire. */
  private readonly lift = (e: PointerEvent) => {
    if (e.pointerId === this.holding) this.letGo();
  };

  /** The finger is off (or the hold finished): the button springs back from its squash. */
  private letGo() {
    if (this.holding < 0) return;
    this.holding = -1;
    if (!this.destroyed) spring(this);
  }

  constructor(
    icon: Container,
    sw: Swatch,
    private readonly radius: number,
    private readonly seconds: number,
    private readonly onDone: () => void,
    /** The ring that fills while held: white for a button over a scene, a color where the button sits on a pale card. */
    private readonly ringColor = 0xffffff,
    /** Touch-down, before the hold completes: where a button speaks its label. */
    private readonly onDown?: () => void,
  ) {
    super();
    this.addChild(finish({ radius }, sw), icon, this.ring);
    this.eventMode = 'static';
    this.cursor = 'pointer';
    this.hitArea = new Circle(0, 0, radius + 14);
    this.on('pointerdown', (e) => {
      if (this.holding < 0 && !palmOnGlass()) {
        this.holding = e.pointerId;
        squash(this);
        sfx.tick();
        this.onDown?.();
      }
    });
    const release = () => this.letGo();
    this.on('pointerup', release);
    this.on('pointerupoutside', release);
    this.on('pointercancel', release);
    window.addEventListener('pointerup', this.lift);
    window.addEventListener('pointercancel', this.lift);
  }

  destroy(options?: Parameters<Container['destroy']>[0]) {
    window.removeEventListener('pointerup', this.lift);
    window.removeEventListener('pointercancel', this.lift);
    super.destroy(options);
  }

  /** What a completed hold does, for a key, a pad or a test. */
  press() {
    this.onDone();
  }

  /** Swaps the picture on the button, under the ring. */
  setIcon(icon: Container) {
    this.removeChildAt(1).destroy({ children: true });
    this.addChildAt(icon, 1);
  }

  update(dt: number) {
    const was = this.progress;
    this.progress =
      this.holding >= 0 ? this.progress + dt / this.seconds : Math.max(0, this.progress - dt * 3);
    if (this.progress >= 1) {
      this.progress = 0;
      this.letGo();
      this.onDone();
    }
    if (this.progress !== was) {
      this.ring.clear();
      if (this.progress > 0) {
        const start = -Math.PI / 2;
        this.ring
          .arc(0, 0, this.radius + 10, start, start + this.progress * Math.PI * 2)
          .stroke({ width: 8, color: this.ringColor, cap: 'round' });
      }
    }
  }
}
