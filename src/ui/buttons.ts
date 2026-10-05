import { Circle, Container, Graphics } from 'pixi.js';
import type { Swatch } from '../art/palette';
import { sfx } from '../audio/sfx';
import { onTap, palmOnGlass } from '../engine/input';

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
  constructor(icon: Container, sw: Swatch, radius: number, onPress: () => void) {
    super();
    this.addChild(disc(radius, sw), icon);
    onTap(
      this,
      () => {
        sfx.tick();
        this.scale.set(0.88);
        window.setTimeout(() => this.scale.set(1), 110);
        onPress();
      },
      { radius: radius + 14, cooldown: 400 },
    );
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
          .stroke({ width: 8, color: 0xffffff, cap: 'round' });
      }
    }
  }
}
