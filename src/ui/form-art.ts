import { Container, Graphics } from 'pixi.js';
import { cream, swatch, wood } from '../art/palette';
import { formNode } from '../art/creatures/forms';
import { makePortrait } from '../creatures/companion';
import type { FormId } from '../creatures/forms';
import { SPECIES } from '../creatures/species';

/**
 * RW11 slice 2: a seed packet with the blossom it grows pictured on it, centred on (0, 0), about 130 units across. The same
 * flower as the one she plants in Garden Grow and the one her friend then wears. Decoration only.
 */
export function formPacket(id: FormId): Container {
  const c = new Container();
  // Smaller and a little high: the book card's name pill sits over its bottom edge.
  const packet = new Container();
  packet.scale.set(0.8);
  packet.y = -14;
  const flower = formNode(id);
  flower.scale.set(0.62);
  flower.y = -10;
  packet.addChild(
    new Graphics().roundRect(-54, -62, 108, 124, 16).fill(0xfff8ec).stroke({ width: 5, color: wood.line }),
    flower,
    new Graphics().ellipse(0, 42, 32, 10).fill(0x8a5a36),
  );
  c.addChild(packet);
  c.eventMode = 'none';
  return c;
}

/** "A blossom for your friend": the sprout beside the flower it just grew, centred on (0, 0). Decoration only. */
export function formPill(id: FormId): Container {
  const c = new Container();
  c.addChild(
    new Graphics()
      .roundRect(-130, -58, 260, 116, 30)
      .fill({ color: cream, alpha: 0.95 })
      .stroke({ width: 5, color: swatch.yellow.line }),
  );
  const friend = makePortrait({ species: 'sprout', look: { color: SPECIES.sprout.color } }, 96);
  friend.x = -66;
  const flower = formNode(id);
  flower.scale.set(0.8);
  flower.position.set(60, 0);
  c.addChild(friend, flower);
  c.eventMode = 'none';
  return c;
}
