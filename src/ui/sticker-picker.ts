import { Circle, Container, Graphics } from 'pixi.js';
import { swatch } from '../art/palette';
import { stickerize } from '../art/sticker';
import { sfx } from '../audio/sfx';
import { onTap } from '../engine/input';
import type { View } from '../engine/view';
import { gameById } from '../games/registry';
import type { StickerRecord } from '../progress/save';
import { RoundButton } from './buttons';
import { arrowIcon, checkIcon, crossIcon } from './icons';

const RADIUS = 56;
const COLS = 4;
const PER_PAGE = COLS * 2;

/**
 * A page of the child's stickers to choose from, newest first: touch one to hang it, the cross to empty the frame,
 * the check to close. Choosing never uses a sticker up. Arrows page through when there are more than eight.
 */
export class StickerPicker extends Container {
  private readonly veil = new Graphics();
  private readonly body = new Container();
  private page = 0;
  private view: View | null = null;

  constructor(
    private readonly records: StickerRecord[],
    private readonly current: { game: string; seed: number } | null,
    private readonly onPick: (record: StickerRecord | null) => void,
    private readonly onClose: () => void,
  ) {
    super();
    this.veil.eventMode = 'static';
    onTap(this.veil, onClose, { cooldown: 400 });
    this.addChild(this.veil, this.body);
  }

  layout(view: View) {
    this.view = view;
    this.veil.clear().rect(0, 0, view.w, view.h).fill({ color: 0x2b2440, alpha: 0.5 });
    this.body.removeChildren().forEach((c) => c.destroy({ children: true }));

    const width = Math.min(view.w - 60, 780);
    const pages = Math.max(1, Math.ceil(this.records.length / PER_PAGE));
    this.page = Math.min(this.page, pages - 1);
    const shown = this.records.slice(this.page * PER_PAGE, (this.page + 1) * PER_PAGE);
    // The panel is as tall as the stickers on this page need.
    const rows = Math.max(1, Math.ceil(shown.length / COLS));
    const bottom = 100 + (rows - 1) * 150 + 135;
    const height = bottom + 62;
    const panel = new Container();
    panel.eventMode = 'static'; // a touch on the panel is not a touch on the veil
    panel.addChild(
      new Graphics().roundRect(0, 6, width, height, 28).fill({ color: 0x000000, alpha: 0.14 }),
      new Graphics().roundRect(0, 0, width, height, 28).fill(0xfffaf0).stroke({ width: 4, color: 0xeadfcd }),
    );
    shown.forEach((record, i) => {
      const mod = gameById(record.game);
      if (!mod) return;
      const node = stickerize(mod.sticker(record.seed), RADIUS);
      node.hitArea = new Circle(0, 0, RADIUS + 6);
      const row = Math.floor(i / COLS);
      const inRow = Math.min(COLS, shown.length - row * COLS);
      node.position.set(width / 2 + ((i % COLS) - (inRow - 1) / 2) * 160, 100 + row * 150);
      const here = this.current?.game === record.game && this.current.seed === record.seed;
      if (here) node.addChild(new Graphics().circle(0, 0, RADIUS + 10).stroke({ width: 7, color: swatch.green.fill }));
      onTap(node, () => this.onPick(record), { radius: RADIUS + 6, cooldown: 400 });
      panel.addChild(node);
    });
    const close = new RoundButton(checkIcon(), swatch.green, 46, this.onClose);
    close.position.set(width / 2, bottom);
    const empty = new RoundButton(crossIcon(), swatch.white, 40, () => { if (this.current) this.onPick(null); });
    empty.position.set(width / 2 - 130, bottom);
    empty.alpha = this.current ? 1 : 0.35;
    panel.addChild(close, empty);
    if (pages > 1) {
      const turn = (dir: number) => { this.page = (this.page + dir + pages) % pages; sfx.whoosh(); this.layout(view); };
      const prev = new RoundButton(arrowIcon(-1), swatch.purple, 40, () => turn(-1));
      const next = new RoundButton(arrowIcon(1), swatch.purple, 40, () => turn(1));
      prev.position.set(40, height / 2 - 20);
      next.position.set(width - 40, height / 2 - 20);
      panel.addChild(prev, next);
    }
    panel.position.set((view.w - width) / 2, Math.max(12, (view.h - height) / 2));
    this.body.addChild(panel);
  }

  relayout() {
    if (this.view) this.layout(this.view);
  }
}
