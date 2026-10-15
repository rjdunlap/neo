import { Container, Graphics } from 'pixi.js';
import { Critter, CRITTERS } from '../../art/critter';
import { prop } from '../../art/props';
import { cream, ink, swatch, type ColorName } from '../../art/palette';
import { shapePath } from '../../art/shapes';
import { clockDrawing, digitalTime, type MemoryPicture, type VehicleKind } from './logic';
import { label } from '../../ui/text';

const WHEEL = 0x37474f;
const GLASS = 0xcfeaf5;

/** A vehicle in a 100-unit box centered on (0, 0): body in its color, dark wheels, pale windows. */
function vehicleArt(kind: VehicleKind, color: ColorName): Graphics {
  const { fill, line } = swatch[color];
  const g = new Graphics();
  const body = (x: number, y: number, w: number, h: number, r = 8) =>
    g.roundRect(x, y, w, h, r).fill(fill).stroke({ width: 3, color: line });
  const wheel = (x: number, y: number, r = 9) => g.circle(x, y, r).fill(WHEEL).stroke({ width: 2, color: 0x263238 });
  const win = (x: number, y: number, w: number, h: number) => g.roundRect(x, y, w, h, 3).fill(GLASS);
  switch (kind) {
    case 'car':
      body(-48, -4, 96, 26, 10); body(-26, -26, 52, 26, 12); win(-20, -21, 18, 15); win(2, -21, 18, 15);
      wheel(-28, 24); wheel(28, 24); break;
    case 'bus':
      body(-50, -28, 100, 52, 10); for (const x of [-42, -22, -2, 18]) win(x, -20, 16, 16);
      win(36, -20, 10, 30); wheel(-28, 26); wheel(28, 26); break;
    case 'truck':
      body(-50, -26, 60, 46, 4); body(14, -10, 36, 30, 6); win(20, -5, 22, 12); wheel(-30, 24); wheel(2, 24); wheel(34, 24); break;
    case 'train':
      body(-46, -22, 66, 44, 6); body(20, -34, 26, 56, 6); win(-38, -14, 18, 16); win(-14, -14, 18, 16);
      g.circle(33, -40, 9).fill(line); wheel(-30, 26); wheel(-6, 26); wheel(30, 26); break;
    case 'boat':
      g.poly([-50, 6, 50, 6, 34, 30, -34, 30]).fill(fill).stroke({ width: 3, color: line });
      g.rect(-2, -40, 4, 46).fill(WHEEL); g.poly([6, -38, 38, -6, 6, -6]).fill(0xffffff).stroke({ width: 2, color: line });
      g.poly([-6, -30, -34, -6, -6, -6]).fill(0xffffff).stroke({ width: 2, color: line }); break;
    case 'plane':
      g.ellipse(0, 0, 50, 13).fill(fill).stroke({ width: 3, color: line });
      g.poly([-8, 0, 12, 0, -14, 34, -26, 34]).fill(line); g.poly([-8, 0, 12, 0, -14, -34, -26, -34]).fill(line);
      g.poly([-50, -4, -38, -4, -42, -22, -50, -22]).fill(line); win(26, -7, 10, 8); break;
    case 'rocket':
      g.poly([0, -50, 16, -24, 16, 26, -16, 26, -16, -24]).fill(fill).stroke({ width: 3, color: line });
      g.circle(0, -8, 8).fill(GLASS).stroke({ width: 2, color: line });
      g.poly([-16, 8, -32, 34, -16, 26]).fill(line); g.poly([16, 8, 32, 34, 16, 26]).fill(line);
      g.poly([-8, 26, 8, 26, 0, 46]).fill(0xffb300); break;
    case 'tractor':
      body(-12, -30, 40, 36, 6); win(-6, -24, 26, 16); body(-44, -6, 80, 24, 6);
      g.circle(-24, 20, 24).fill(WHEEL); g.circle(-24, 20, 10).fill(line); wheel(32, 26, 14); break;
  }
  return g;
}

/** Static, centered thumbnails inside the existing 140-unit card. */
export function pictureFace(picture: MemoryPicture): Container {
  let drawing: Container;
  if (picture.kind === 'friend') {
    const friend = new Critter(CRITTERS[picture.animal]);
    friend.alive = false;
    drawing = friend;
  } else if (picture.kind === 'prop') {
    drawing = prop(picture.prop, picture.color);
  } else if (picture.kind === 'vehicle') {
    drawing = vehicleArt(picture.vehicle, picture.color);
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

/** Numbered, upright learning face; every time shares the same art and colors. */
export function clockFace(time: number, side: 0 | 1): Container {
  const data = clockDrawing(time);
  if (side) return label(digitalTime(time), data.digitalSize, ink);
  const face = new Container();
  face.addChild(new Graphics().circle(0, 0, data.radius).fill(cream).stroke({ width: 3, color: ink }));
  for (const n of data.numerals) {
    const text = label(n.text, data.numeralSize, ink);
    text.position.set(n.x, n.y); face.addChild(text);
  }
  const hands = new Graphics();
  for (const [hand, color] of [[data.hour, swatch.blue.line], [data.minute, swatch.red.line]] as const) {
    hands.moveTo(0, 0).lineTo(hand.x, hand.y).stroke({ width: hand.width, color, cap: 'round' });
  }
  hands.circle(0, 0, 3).fill(ink);
  face.addChild(hands);
  return face;
}
