import { Container, Graphics, Rectangle, Text } from 'pixi.js';
import { ink, swatch } from '../art/palette';
import { sfx } from '../audio/sfx';
import { onTap, palmOnGlass } from '../engine/input';
import type { GameModule } from '../games/types';
import { FONT } from './text';

/** A pictured tile: touch-down feedback, but only a matching release inside chooses it. */
export class DiscoveryTile extends Container {
  private held = -1;
  private readonly face = new Container();
  private readonly blur = () => this.cancel();
  // Pixi's pointer-event backend does not forward native pointercancel. Native release also clears a lost hit.
  private readonly lift = (e: PointerEvent) => { if (this.held === e.pointerId) this.cancel(); };
  constructor(width: number, height: number, art: Container, action: () => void, private readonly allowed: () => boolean) {
    super();
    this.hitArea = new Rectangle(0, 0, width, height);
    this.face.addChild(new Graphics().roundRect(0, 0, width, height, 22).fill(swatch.blue.light).stroke({ width: 4, color: swatch.blue.line }), art);
    this.face.eventMode = 'none';
    this.addChild(this.face);
    onTap(this, e => {
      if (this.held >= 0 || !this.allowed()) return;
      this.held = e.pointerId;
      this.face.alpha = 0.7;
      sfx.tick();
    });
    this.on('pointerup', e => {
      if (this.held !== e.pointerId) return;
      this.cancel();
      if (!this.allowed() || palmOnGlass()) return;
      const p = this.toLocal(e.global);
      if (this.hitArea!.contains(p.x, p.y)) action();
    });
    for (const event of ['pointerupoutside', 'pointercancel', 'pointerout']) this.on(event, () => this.cancel());
    window.addEventListener('blur', this.blur);
    window.addEventListener('pointercancel', this.lift, true);
    window.addEventListener('lostpointercapture', this.lift, true);
    window.addEventListener('pointerup', this.lift);
  }
  cancel() { this.held = -1; this.face.alpha = 1; }
  override destroy(options?: Parameters<Container['destroy']>[0]) {
    window.removeEventListener('blur', this.blur);
    window.removeEventListener('pointercancel', this.lift, true);
    window.removeEventListener('lostpointercapture', this.lift, true);
    window.removeEventListener('pointerup', this.lift);
    super.destroy(options);
  }
}

const label = (text: string, x: number, y: number, size: number, width: number) => {
  const t = new Text({ text, style: { fontFamily: FONT, fontSize: size, fontWeight: '600', fill: ink, wordWrap: true, wordWrapWidth: width } });
  t.position.set(x, y);
  return t;
};
function picture(mod: GameModule, x: number, y: number, size: number) {
  const icon = mod.hubIcon();
  const b = icon.getLocalBounds();
  const scale = size / Math.max(b.width, b.height, 1);
  const box = new Container();
  icon.scale.set(scale);
  icon.position.set(-(b.x + b.width / 2) * scale, -(b.y + b.height / 2) * scale);
  box.addChild(icon);
  box.position.set(x, y);
  return box;
}
function arrow(x: number, y: number, direction = 1) {
  const g = new Graphics().moveTo(-12, 0).lineTo(12, 0).moveTo(4, -7).lineTo(12, 0).lineTo(4, 7).stroke({ width: 4, color: swatch.blue.line, cap: 'round', join: 'round' });
  g.position.set(x, y); g.scale.x = direction; return g;
}
export function nextGameArt(mod: GameModule, title: string): Container {
  const art = new Container();
  art.addChild(picture(mod, 55, 56, 78), label('Next game', 105, 13, 21, 169), label(title, 105, 42, 23, 169), arrow(260, 95));
  return art;
}
export function anotherGameArt(mod: GameModule, other: GameModule): Container {
  const art = new Container();
  art.addChild(picture(mod, 29, 35, 34), picture(other, 82, 57, 34), arrow(78, 22), arrow(31, 64, -1), label('Another', 10, 83, 21, 96));
  return art;
}
