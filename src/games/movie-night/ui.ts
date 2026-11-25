import { Container, Graphics, Rectangle, Text } from 'pixi.js';
import { cream, ink, swatch, wood } from '../../art/palette';
import { onTap } from '../../engine/input';

export function label(text: string, y: number, size = 21) {
  const t = new Text({
    text,
    style: {
      fontFamily: 'Nunito, sans-serif',
      fontSize: size,
      fontWeight: '800',
      fill: ink,
      align: 'center',
    },
  });
  t.anchor.set(0.5);
  t.y = y;
  t.eventMode = 'none';
  return t;
}
export class Button extends Container {
  readonly face = new Container();
  readonly rim = new Graphics();
  readonly caption: Text;
  readonly bg = new Graphics();
  constructor(
    public w: number,
    public h: number,
    text: string,
    fn: () => void,
  ) {
    super();
    this.caption = label(text, 27);
    this.addChild(this.bg, this.face, this.caption, this.rim);
    this.size(w, h);
    this.rim.eventMode = 'none';
    this.face.eventMode = 'none';
    this.hitArea = new Rectangle(-w / 2, -h / 2, w, h);
    onTap(this, () => {
      this.alpha = 0.72;
      fn();
    });
  }
  size(w: number, h: number) {
    this.w = w;
    this.h = h;
    this.bg
      .clear()
      .roundRect(-w / 2, -h / 2, w, h, 18)
      .fill(cream)
      .stroke({ color: wood.line, width: 4 });
    this.hitArea = new Rectangle(-w / 2, -h / 2, w, h);
  }
  outline(on: boolean) {
    this.rim.clear();
    if (on)
      this.rim
        .roundRect(-this.w / 2 + 3, -this.h / 2 + 3, this.w - 6, this.h - 6, 16)
        .stroke({ color: swatch.yellow.line, width: 7 });
  }
}
