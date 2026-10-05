import { Container, Graphics, Rectangle } from 'pixi.js';
import type { View } from '../engine/view';
import { lockIcon } from './icons';
import { label } from './text';

const SIZE = 130;
const HOLD_SECONDS = 3;

/**
 * Grown-ups only: press and hold both top corners for three seconds.
 * It takes two hands and patience, which a toddler won't combine.
 */
export class ParentGate extends Container {
  private readonly zones = [new Container(), new Container()];
  private readonly held = [-1, -1];
  private readonly rings = new Graphics();
  private readonly lock = lockIcon(0x2b2b3a);
  private readonly hint = label('Grown-ups: hold both top corners', 22, 0x2b2b3a, '500');
  private progress = 0;
  private lonely = 0;
  private hintLeft = 0;
  private view: View | null = null;
  private readonly lift = (e: PointerEvent) => {
    this.held.forEach((id, i) => id === e.pointerId && (this.held[i] = -1));
  };

  constructor(private readonly onOpen: () => void) {
    super();
    this.lock.alpha = 0.18;
    this.lock.scale.set(0.8);
    this.hint.alpha = 0;
    this.addChild(this.lock, this.rings, this.hint);
    this.zones.forEach((zone, i) => {
      zone.eventMode = 'static';
      zone.hitArea = new Rectangle(0, 0, SIZE, SIZE);
      zone.on('pointerdown', (e) => {
        if (this.held[i] < 0) this.held[i] = e.pointerId;
      });
      const release = () => (this.held[i] = -1);
      zone.on('pointerup', release);
      zone.on('pointerupoutside', release);
      zone.on('pointercancel', release);
      this.addChild(zone);
    });
    window.addEventListener('pointerup', this.lift);
    window.addEventListener('pointercancel', this.lift);
  }

  destroy(options?: Parameters<Container['destroy']>[0]) {
    window.removeEventListener('pointerup', this.lift);
    window.removeEventListener('pointercancel', this.lift);
    super.destroy(options);
  }

  layout(view: View) {
    this.view = view;
    this.zones[1].x = view.w - SIZE;
    this.lock.position.set(view.w - 44, 44);
    this.hint.position.set(view.w / 2, 40);
  }

  update(dt: number) {
    const a = this.held[0] >= 0;
    const b = this.held[1] >= 0;
    this.progress = a && b ? this.progress + dt / HOLD_SECONDS : Math.max(0, this.progress - dt * 2);

    // One corner held alone for a moment: show grown-ups how it works.
    this.lonely = a !== b ? this.lonely + dt : 0;
    if (this.lonely > 0.6) this.hintLeft = 2.5;
    this.hintLeft = Math.max(0, this.hintLeft - dt);
    this.hint.alpha += ((this.hintLeft > 0 ? 1 : 0) - this.hint.alpha) * Math.min(1, dt * 8);

    this.rings.clear();
    if (this.progress > 0 && this.view) {
      const end = -Math.PI / 2 + this.progress * Math.PI * 2;
      for (const x of [SIZE / 2, this.view.w - SIZE / 2]) {
        this.rings.circle(x, SIZE / 2, 40).fill({ color: 0xffffff, alpha: 0.5 });
        this.rings
          .moveTo(x, SIZE / 2 - 40)
          .arc(x, SIZE / 2, 40, -Math.PI / 2, end).stroke({ width: 10, color: 0x3a9a9b, cap: 'round' });
      }
    }
    if (this.progress >= 1) {
      this.progress = 0;
      this.held[0] = this.held[1] = -1;
      this.onOpen();
    }
  }
}
