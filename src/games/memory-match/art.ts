import { Container, Graphics } from 'pixi.js';
import { Critter, CRITTERS } from '../../art/critter';
import { prop } from '../../art/props';
import { swatch } from '../../art/palette';
import { shapePath } from '../../art/shapes';
import type { MemoryPicture } from './logic';

/** Static, centered thumbnails inside the existing 140-unit card. */
export function pictureFace(picture: MemoryPicture): Container {
  let drawing: Container;
  if (picture.kind === 'friend') {
    const friend = new Critter(CRITTERS[picture.animal]);
    friend.alive = false;
    drawing = friend;
  } else if (picture.kind === 'prop') {
    drawing = prop(picture.prop, picture.color);
  } else {
    return shapePath(new Graphics(), picture.shape, 43).fill(swatch[picture.color].fill)
      .stroke({ width: 4, color: swatch[picture.color].line });
  }
  const frame = new Container();
  const bounds = drawing.getLocalBounds();
  const scale = 106 / Math.max(bounds.width, bounds.height);
  drawing.scale.set(scale);
  drawing.position.set(-(bounds.x + bounds.width / 2) * scale, -(bounds.y + bounds.height / 2) * scale);
  drawing.eventMode = 'none';
  frame.addChild(drawing);
  return frame;
}
