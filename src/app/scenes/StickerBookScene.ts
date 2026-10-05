import { Container, Graphics } from 'pixi.js';
import { stickerize } from '../../art/sticker';
import { music, STYLES } from '../../audio/music';
import { sfx } from '../../audio/sfx';
import { voice } from '../../audio/voice';
import { onTap } from '../../engine/input';
import { ease } from '../../engine/tween';
import type { View } from '../../engine/view';
import { gameById } from '../../games/registry';
import { store } from '../../progress/store';
import { RoundButton } from '../../ui/buttons';
import { arrowIcon, houseIcon } from '../../ui/icons';
import { Scene } from '../Scene';

const COLS = 4;
const ROWS = 3;
const PER_PAGE = COLS * ROWS;
const PER_SPREAD = PER_PAGE * 2;

/** Every sticker earned, laid out in an open book. Tap one and it wiggles. */
export class StickerBookScene extends Scene {
  private readonly book = new Graphics();
  private readonly spread = new Container();
  private readonly home = new RoundButton(houseIcon(), { fill: 0xffffff, line: 0x8c8c9c, light: 0xffffff }, 44, () => this.app.go.hub());
  private readonly prev = new RoundButton(arrowIcon(-1, 0xffffff), { fill: 0xb28dff, line: 0x7e5bd6, light: 0 }, 40, () => this.turn(-1));
  private readonly next = new RoundButton(arrowIcon(1, 0xffffff), { fill: 0xb28dff, line: 0x7e5bd6, light: 0 }, 40, () => this.turn(1));
  private page = 0;

  init() {
    const count = store.data.stickers.length;
    // Open to the newest stickers.
    this.page = Math.max(0, Math.ceil(count / PER_SPREAD) - 1);
    this.content.addChild(this.book, this.spread);
    this.ui.addChild(this.home, this.prev, this.next);
  }

  resize(v: View) {
    const w = Math.min(v.w - 120, 980);
    const h = Math.min(v.h - 150, 600);
    const x = (v.w - w) / 2;
    const y = (v.h - h) / 2 + 30;
    this.book
      .clear()
      .rect(0, 0, v.w, v.h)
      .fill(0xd9a066)
      .roundRect(x - 14, y - 10, w + 28, h + 28, 26)
      .fill(0x9c6b3c)
      .roundRect(x, y, w / 2 - 4, h, 18)
      .fill(0xfffaf0)
      .roundRect(x + w / 2 + 4, y, w / 2 - 4, h, 18)
      .fill(0xfffaf0)
      .rect(v.w / 2 - 4, y + 8, 8, h - 16)
      .fill(0xc8956a);
    this.home.position.set(62, 62);
    this.prev.position.set(x - 4, y + h / 2);
    this.next.position.set(x + w + 4, y + h / 2);
    this.fill({ x, y, w, h });
  }

  enter() {
    music.play(STYLES.stickers);
    void voice.say('game.stickers');
  }

  private turn(dir: number) {
    this.page += dir;
    sfx.whoosh();
    this.resize(this.view);
  }

  private fill(area: { x: number; y: number; w: number; h: number }) {
    this.spread.removeChildren().forEach((c) => c.destroy({ children: true }));
    const all = store.data.stickers;
    const pages = Math.max(1, Math.ceil(all.length / PER_SPREAD));
    this.page = Math.min(Math.max(0, this.page), pages - 1);
    this.prev.visible = this.page > 0;
    this.next.visible = this.page < pages - 1;

    const pageW = area.w / 2;
    const cellW = (pageW - 40) / COLS;
    const cellH = (area.h - 40) / ROWS;
    const radius = Math.min(cellW, cellH) * 0.43;
    for (let i = 0; i < PER_SPREAD; i++) {
      const side = Math.floor(i / PER_PAGE);
      const slot = i % PER_PAGE;
      const cx = area.x + side * (pageW + 4) + 20 + (slot % COLS) * cellW + cellW / 2;
      const cy = area.y + 20 + Math.floor(slot / COLS) * cellH + cellH / 2;
      const rec = all[this.page * PER_SPREAD + i];
      const mod = rec && gameById(rec.game);
      if (!rec || !mod) {
        const empty = new Graphics().circle(0, 0, radius).stroke({ width: 3, color: 0xeadfcd });
        empty.position.set(cx, cy);
        this.spread.addChild(empty);
        continue;
      }
      const s = stickerize(mod.sticker(rec.seed), radius);
      s.position.set(cx, cy);
      s.rotation = ((rec.seed % 7) - 3) * 0.03;
      onTap(
        s,
        () => {
          sfx.bell(5 + (rec.seed % 6), 0.25);
          this.particles.burst(cx, cy, { kind: 'star', colors: [0xffd54a, 0xffffff], count: 8, speed: [100, 220], gravity: 0, life: [0.4, 0.7] });
          void this.tw.to(s.scale, { x: 1.2, y: 1.2 }, { duration: 0.12 }).then(() => this.tw.to(s.scale, { x: 1, y: 1 }, { duration: 0.5, ease: ease.outElastic }));
        },
        { radius: radius + 6 },
      );
      this.spread.addChild(s);
    }
  }
}
