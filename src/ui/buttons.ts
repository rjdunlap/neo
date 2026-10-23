import { Circle, Container, Graphics } from 'pixi.js';
import type { Swatch } from '../art/palette';
import { sfx } from '../audio/sfx';
import { onTap, palmOnGlass } from '../engine/input';
import type { Meaning } from './origin-art';

function disc(radius: number, sw: Swatch): Graphics {
  return new Graphics()
    .circle(0, 6, radius)
    .fill({ color: 0x000000, alpha: 0.12 })
    .circle(0, 0, radius)
    .fill(sw.fill)
    .stroke({ width: 6, color: sw.line })
    .circle(-radius * 0.3, -radius * 0.35, radius * 0.22)
    .fill({ color: 0xffffff, alpha: 0.35 });
}

/** A big round button that squishes when pressed. */
export class RoundButton extends Container {
  constructor(icon: Container, sw: Swatch, radius: number, private readonly onPress: () => void) {
    super();
    this.radius = radius;
    this.addChild(disc(radius, sw), icon);
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

  /** What a tap does: the squish, the tick and the action. A key or button on a controller presses it the same way. */
  press() {
    sfx.tick();
    this.scale.set(0.88);
    // A press can close whatever holds the button (a journal, a scene); don't touch it once it's gone.
    window.setTimeout(() => !this.destroyed && this.scale.set(1), 110);
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
    if (e.pointerId === this.holding) this.holding = -1;
  };

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
    this.addChild(disc(radius, sw), icon, this.ring);
    this.eventMode = 'static';
    this.cursor = 'pointer';
    this.hitArea = new Circle(0, 0, radius + 14);
    this.on('pointerdown', (e) => {
      if (this.holding < 0 && !palmOnGlass()) {
        this.holding = e.pointerId;
        sfx.tick();
        this.onDown?.();
      }
    });
    const release = () => (this.holding = -1);
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
    this.progress = this.holding >= 0 ? this.progress + dt / this.seconds : Math.max(0, this.progress - dt * 3);
    this.scale.set(this.holding >= 0 ? 0.92 : 1);
    if (this.progress >= 1) {
      this.progress = 0;
      this.holding = -1;
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
