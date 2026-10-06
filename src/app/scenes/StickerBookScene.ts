import { Circle, Container, Graphics } from 'pixi.js';
import { cream, swatch } from '../../art/palette';
import { drawStickerScene, type PageArea } from '../../art/sticker-scenes';
import { stickerize } from '../../art/sticker';
import { music, STYLES } from '../../audio/music';
import { sfx } from '../../audio/sfx';
import { voice } from '../../audio/voice';
import { STICKER_PAGES } from '../../content/world';
import { draggable, type DragHandle } from '../../engine/drag';
import { onTap } from '../../engine/input';
import type { View } from '../../engine/view';
import { gameById } from '../../games/registry';
import type { StickerRecord } from '../../progress/save';
import { store } from '../../progress/store';
import { RoundButton } from '../../ui/buttons';
import { arrowIcon, islandIcon } from '../../ui/icons';
import { label } from '../../ui/text';
import { Scene } from '../Scene';

const TRAY_COUNT = 5;
const RADIUS = 48;
const PAGE_NAMES = ['Meadow', 'Beach', 'Farm', 'Under the sea', 'Space'];

export class StickerBookScene extends Scene {
  private readonly background = new Graphics();
  private readonly pageArt = new Graphics();
  private readonly tray = new Graphics();
  private readonly stickers = new Container();
  private readonly heading = label('Meadow', 32);
  private readonly home = new RoundButton(islandIcon(), swatch.white, 50, () => this.app.go.hub());
  private readonly prev = new RoundButton(arrowIcon(-1), swatch.purple, 45, () => this.turn(-1));
  private readonly next = new RoundButton(arrowIcon(1), swatch.purple, 45, () => this.turn(1));
  private readonly trayPrev = new RoundButton(arrowIcon(-1), swatch.teal, 42, () => this.turnTray(-1));
  private readonly trayNext = new RoundButton(arrowIcon(1), swatch.teal, 42, () => this.turnTray(1));
  private page = 0;
  private trayPage = 0;
  private area: PageArea = { x: 40, y: 135, w: 944, h: 430 };
  private handles: DragHandle[] = [];
  private entries: { record: StickerRecord; node: Container; handle: DragHandle }[] = [];

  init() {
    this.content.addChild(this.background, this.pageArt, this.tray, this.stickers);
    this.ui.addChild(this.home, this.prev, this.next, this.trayPrev, this.trayNext, this.heading);
    onTap(this.heading, () => void voice.say('stickers.place'));
  }

  resize(v: View) {
    this.area = { x: 35, y: 135, w: v.w - 70, h: v.h - 305 };
    this.background.clear().rect(0, 0, v.w, v.h).fill(cream);
    this.home.position.set(64,  64);
    this.heading.position.set(v.w / 2,  64);
    this.prev.position.set(v.w / 2 - 220,  64);
    this.next.position.set(v.w / 2 + 220,  64);
    this.trayPrev.position.set(70, v.h - 72);
    this.trayNext.position.set(v.w - 70, v.h - 72);
    this.tray.clear().roundRect(25, v.h - 135, v.w - 50, 120, 30).fill(swatch.brown.light).stroke({ width: 4, color: swatch.brown.line });
    this.renderPage();
  }

  private renderPage() {
    drawStickerScene(this.pageArt, STICKER_PAGES[this.page], this.area);
    this.heading.text = PAGE_NAMES[this.page];
    this.prev.visible = this.page > 0;
    this.next.visible = this.page < STICKER_PAGES.length - 1;
    this.renderStickers();
  }

  private renderStickers() {
    this.handles.forEach((h) => h.destroy());
    this.handles = [];
    this.entries.forEach(({ node }) => { this.tw.kill(node); this.tw.kill(node.scale); });
    this.entries = [];
    this.stickers.removeChildren().forEach((c) => c.destroy({ children: true }));
    const all = store.data.stickers.filter((s) => gameById(s.game));
    const loose = all.filter((s) => !s.placement);
    const max = Math.max(0, Math.ceil(loose.length / TRAY_COUNT) - 1);
    this.trayPage = Math.max(0, Math.min(max, this.trayPage));
    this.trayPrev.visible = this.trayPage > 0;
    this.trayNext.visible = this.trayPage < max;
    const placed = all.filter((s) => s.placement?.page === STICKER_PAGES[this.page]);
    const visibleLoose = loose.slice(this.trayPage * TRAY_COUNT, (this.trayPage + 1) * TRAY_COUNT);
    for (const record of [...placed, ...visibleLoose]) {
      const node = stickerize(gameById(record.game)!.sticker(record.seed), RADIUS);
      node.hitArea = new Circle(0, 0, 55);
      if (record.placement) {
        const { x, y, w, h } = this.area;
        node.position.set(x + Math.max(RADIUS, Math.min(w - RADIUS, record.placement.x * w)), y + Math.max(RADIUS, Math.min(h - RADIUS, record.placement.y * h)));
      } else {
        const i = visibleLoose.indexOf(record);
        node.position.set(this.view.w / 2 + (i - (visibleLoose.length - 1) / 2) * 136, this.view.h - 75);
      }
      this.stickers.addChild(node);
      const handle = draggable(node, this.tw, {
        onPick: () => sfx.pop(),
        onDrop: (px, py) => {
          const a = this.area;
          if (py >= this.view.h - 145 && px >= 25 && px <= this.view.w - 25) {
            delete record.placement;
          } else if (px >= a.x && px <= a.x + a.w && py >= a.y && py <= a.y + a.h) {
            record.placement = { page: STICKER_PAGES[this.page], x: Math.max(RADIUS, Math.min(a.w - RADIUS, px - a.x)) / a.w, y: Math.max(RADIUS, Math.min(a.h - RADIUS, py - a.y)) / a.h };
          } else return false;
          store.save();
          sfx.sparkle();
          void this.tw.wait(0.2).then(() => this.renderStickers());
          return true;
        },
      });
      this.handles.push(handle);
      this.entries.push({ record, node, handle });
    }
  }

  private turn(dir: number) {
    if (this.handles.some((h) => h.dragging)) return;
    this.page = Math.max(0, Math.min(STICKER_PAGES.length - 1, this.page + dir));
    this.renderPage();
    sfx.whoosh();
    void voice.say(`stickers.${STICKER_PAGES[this.page]}`);
  }
  private turnTray(dir: number) { if (!this.handles.some((h) => h.dragging)) { this.trayPage += dir; this.renderStickers(); } }
  enter() { music.play(STYLES.stickers); void voice.say('stickers.place'); }
  destroy() { this.handles.forEach((h) => h.destroy()); super.destroy(); }
}
