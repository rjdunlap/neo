import { Container, Graphics } from 'pixi.js';

/** Puts any drawing on a round white sticker with a soft shadow, scaled to fit. */
export function stickerize(content: Container, radius = 90): Container {
  const sticker = new Container();
  sticker.addChild(
    new Graphics().circle(5, 9, radius).fill({ color: 0x000000, alpha: 0.12 }),
    new Graphics().circle(0, 0, radius).fill(0xffffff).stroke({ width: 4, color: 0xeadfcd }),
    content,
  );
  const b = content.getLocalBounds();
  const s = (radius * 1.45) / Math.max(b.width, b.height);
  content.scale.set(s);
  content.position.set(-(b.x + b.width / 2) * s, -(b.y + b.height / 2) * s);
  return sticker;
}
