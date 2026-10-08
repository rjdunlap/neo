import { Container, Graphics, Rectangle } from 'pixi.js';
import { swatch, wood } from '../art/palette';
import { shapePath } from '../art/shapes';
import { onTap } from '../engine/input';
import type { Updatable } from '../app/Scene';
import type { GameModule, HubIcon } from '../games/types';

/** Distance between neighbors. A hit area is 116 wide and 128 tall: comfortably over 100 units. */
export const SHELF_PITCH = 124;
const BOX_W = 104;
const BOX_H = 98;
const PANEL_H = BOX_H + 30;

export interface ShelfItem {
  mod: GameModule;
  node: Container;
  icon: HubIcon;
}

export const shelfWidth = (n: number) => n * SHELF_PITCH + 36;

/**
 * The favorites shelf: the games she has hearted, standing on a plank in the sky. Its origin is the
 * middle of the plank's top edge, so a scene places it with one `position.set`. Track it to animate
 * the little drawings.
 */
export class Shelf extends Container implements Updatable {
  readonly items: ShelfItem[] = [];

  constructor(mods: GameModule[], pick: (item: ShelfItem) => void) {
    super();
    const w = shelfWidth(mods.length);
    const panel = new Graphics()
      .roundRect(-w / 2, -PANEL_H, w, PANEL_H + 26, 26)
      .fill({ color: 0xffffff, alpha: 0.62 })
      .stroke({ width: 4, color: swatch.pink.line, alpha: 0.9 })
      .roundRect(-w / 2 + 8, 0, w - 16, 20, 8)
      .fill(wood.fill)
      .stroke({ width: 3, color: wood.line });
    panel.eventMode = 'none';
    // A heart set into the plank says what the shelf is without a word.
    const heart = shapePath(new Graphics(), 'heart', 8).fill(swatch.pink.fill).stroke({ width: 2, color: swatch.pink.line });
    heart.position.set(0, 10);
    heart.eventMode = 'none';
    this.addChild(panel, heart);

    mods.forEach((mod, i) => {
      const icon = mod.hubIcon();
      const b = icon.getLocalBounds();
      const s = Math.min(1, BOX_W / b.width, BOX_H / b.height);
      icon.scale.set(s);
      icon.position.set(-(b.x + b.width / 2) * s, -(b.y + b.height) * s);
      icon.eventMode = 'none';
      const node = new Container();
      node.addChild(new Graphics().ellipse(0, 0, Math.min(52, (b.width * s) / 2 + 12), 9).fill({ color: swatch.green.line, alpha: 0.18 }), icon);
      node.position.set((i - (mods.length - 1) / 2) * SHELF_PITCH, 0);
      onTap(node, () => pick(item));
      node.hitArea = new Rectangle(-SHELF_PITCH / 2 + 4, -PANEL_H + 4, SHELF_PITCH - 8, PANEL_H + 12);
      const item: ShelfItem = { mod, node, icon };
      this.items.push(item);
      this.addChild(node);
    });
  }

  update(dt: number) {
    for (const { icon } of this.items) icon.update(dt);
  }
}
