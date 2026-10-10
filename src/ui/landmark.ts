import { Container, Graphics, Rectangle } from 'pixi.js';
import { swatch } from '../art/palette';
import type { Box, Rect } from '../content/lands';
import type { GameModule, HubIcon } from '../games/types';
import { Sparkle } from './sparkle';

/** One game standing in a place or a land: its own drawing on a soft shadow, and a twinkle if she has not played it yet. */
export interface Landmark {
  mod: GameModule;
  node: Container;
  icon: HubIcon;
  sparkle: Sparkle | null;
}

/**
 * Builds a game's landmark, its drawing scaled to fit `box` with its feet on (0, 0). The touch area is `hit`
 * (in the node's units) when given, otherwise one that covers the drawing and is never under 100 across. The
 * caller tracks `icon` and `sparkle` so they animate, and wires the touch.
 */
export function makeLandmark(mod: GameModule, box: Box, fresh: boolean, hit?: Rect): Landmark {
  const icon = mod.hubIcon();
  const b = icon.getLocalBounds();
  const s = Math.min(1, box.w / b.width, box.h / b.height);
  icon.scale.set(s);
  // Center the drawing over its spot, feet on the ground.
  icon.position.set(-(b.x + b.width / 2) * s, -(b.y + b.height) * s);
  const node = new Container();
  node.addChild(new Graphics().ellipse(0, 0, Math.min(box.w / 2 + 15, (b.width * s) / 2 + 20), 18).fill({ color: swatch.green.line, alpha: 0.18 }), icon);
  // A twinkle on a game she has not finished a round of yet. It never blocks a touch.
  let sparkle: Sparkle | null = null;
  if (fresh) {
    sparkle = new Sparkle();
    sparkle.position.set(Math.min(box.w / 2, (b.width * s) / 2 - 4), -b.height * s + 6);
    node.addChild(sparkle);
  }
  node.eventMode = 'static';
  node.cursor = 'pointer';
  node.hitArea = hit
    ? new Rectangle(hit.x, hit.y, hit.w, hit.h)
    : new Rectangle(-Math.max(55, (b.width * s) / 2 + 15), -Math.max(100, b.height * s + 20), Math.max(110, b.width * s + 30), Math.max(100, b.height * s + 20) + 25);
  return { mod, node, icon, sparkle };
}
