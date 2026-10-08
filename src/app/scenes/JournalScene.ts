import { Container, Graphics, Rectangle, Text } from 'pixi.js';
import { ink, swatch } from '../../art/palette';
import { sfx } from '../../audio/sfx';
import { voice } from '../../audio/voice';
import { JOURNAL, type JournalEntry } from '../../content/journal';
import { SCRIPT } from '../../content/voice-script';
import { onTap } from '../../engine/input';
import { ease } from '../../engine/tween';
import type { View } from '../../engine/view';
import { gameById } from '../../games/registry';
import { store } from '../../progress/store';
import { RoundButton } from '../../ui/buttons';
import { arrowIcon, treehouseIcon } from '../../ui/icons';
import { entryPicture, fit } from '../../ui/journal-art';
import { Sparkle } from '../../ui/sparkle';
import { FONT, label } from '../../ui/text';
import { Scene } from '../Scene';

const PER_PAGE = 8;
const CARD = { w: 190, h: 170, gap: 24 };
/** Which page was open last, for this session. */
let lastPage = 0;

interface Card {
  entry: JournalEntry;
  node: Container;
  found: boolean;
  sparkle?: Sparkle;
}

/**
 * The discovery journal: every known discovery as a card, a picture where she has seen it and a dim shape where she has
 * not. Touching a card speaks what it is about; the green arrow takes her to the game that shows it, so every
 * entry, found or not, has a visible way to find it. Nothing here is random, timed or lost.
 */
export class JournalScene extends Scene {
  readonly cards: Card[] = [];
  page = lastPage;
  selected: JournalEntry = JOURNAL[0];
  private readonly back = new RoundButton(treehouseIcon(), swatch.white, 50, () => this.leave());
  private readonly previous = new RoundButton(arrowIcon(-1), swatch.white, 50, () => this.turn(-1));
  private readonly next = new RoundButton(arrowIcon(1), swatch.white, 50, () => this.turn(1));
  private readonly play = new RoundButton(arrowIcon(1, 0xffffff), swatch.green, 56, () => this.openGame());
  private readonly heading = label('My discoveries', 36);
  private readonly count = label('', 24, 0x6b6b7b, '500');
  private readonly paper = new Graphics();
  private readonly cardLayer = new Container();
  private readonly detail = new Container();
  private readonly dots = new Graphics();
  private left = false;

  init() {
    // Entries found since she last looked get a twinkle; opening the journal then counts them as looked at.
    const fresh = new Set(store.journal.found.slice(store.journal.seen));
    store.openJournal();
    // Open where the new things are, so the twinkle is in view.
    const firstNew = JOURNAL.findIndex((e) => fresh.has(e.id));
    if (firstNew >= 0) this.page = lastPage = Math.floor(firstNew / PER_PAGE);
    const found = new Set(store.journal.found);
    for (const entry of JOURNAL) {
      const node = new Container();
      const isFound = found.has(entry.id);
      const bg = new Graphics()
        .roundRect(-CARD.w / 2, -CARD.h / 2, CARD.w, CARD.h, 26)
        .fill({ color: 0xffffff, alpha: isFound ? 0.97 : 0.5 })
        .stroke({ width: 5, color: isFound ? swatch.teal.line : 0xcdbfa8 });
      bg.eventMode = 'none';
      const picture = fit(entryPicture(entry), 104);
      picture.position.set(0, -14);
      picture.eventMode = 'none';
      if (!isFound) {
        // A shape to find: the picture dimmed to a silhouette.
        picture.children[0].tint = 0x6b6b7b;
        picture.alpha = 0.22;
      }
      const name = label(isFound ? entry.name : '?', isFound ? 21 : 34, isFound ? ink : 0xb3a58e);
      name.position.set(0, 62);
      name.eventMode = 'none';
      node.addChild(bg, picture, name);
      let sparkle: Sparkle | undefined;
      if (fresh.has(entry.id)) {
        sparkle = this.track(new Sparkle(24));
        sparkle.position.set(CARD.w / 2 - 22, -CARD.h / 2 + 22);
        node.addChild(sparkle);
      }
      node.hitArea = new Rectangle(-CARD.w / 2, -CARD.h / 2, CARD.w, CARD.h);
      onTap(node, () => this.choose(entry), { cooldown: 200 });
      this.cardLayer.addChild(node);
      this.cards.push({ entry, node, found: isFound, sparkle });
    }
    this.dots.eventMode = 'none';
    this.detail.eventMode = 'passive';
    this.content.addChild(this.paper);
    this.ui.addChild(this.cardLayer, this.detail, this.dots, this.heading, this.count, this.back, this.previous, this.next, this.play);
    // Start on the first new thing if there is one, so the strip tells about what she just found.
    this.selected = (firstNew >= 0 ? JOURNAL[firstNew] : JOURNAL[this.page * PER_PAGE]) ?? JOURNAL[0];
  }

  private get pages() {
    return Math.ceil(JOURNAL.length / PER_PAGE);
  }

  resize(v: View) {
    this.paper.clear().rect(0, 0, v.w, v.h).fill(0xfff4e3).roundRect(50, 120, v.w - 100, v.h - 150, 36).fill({ color: swatch.yellow.light, alpha: 0.5 }).stroke({ width: 5, color: swatch.yellow.line, alpha: 0.6 });
    this.back.position.set(65, 65);
    this.heading.position.set(v.w / 2, 58);
    this.count.position.set(v.w / 2, 98);
    this.previous.position.set(48, v.h / 2 - 40);
    this.next.position.set(v.w - 48, v.h / 2 - 40);
    // Two rows of four, centered in the space above the strip that tells about the chosen card.
    const top = 140;
    const bottom = v.h - 235;
    const cy = (top + bottom) / 2;
    const dy = (CARD.h + CARD.gap) / 2;
    this.cards.forEach((c, i) => {
      const slot = i % PER_PAGE;
      c.node.visible = Math.floor(i / PER_PAGE) === this.page;
      c.node.position.set(v.w / 2 + ((slot % 4) - 1.5) * (CARD.w + CARD.gap), cy + (slot < 4 ? -dy : dy));
    });
    this.dots.clear();
    for (let i = 0; i < this.pages; i++) this.dots.circle(v.w / 2 + (i - (this.pages - 1) / 2) * 28, v.h - 215, i === this.page ? 8 : 5).fill(swatch.teal.line);
    this.previous.visible = this.page > 0;
    this.next.visible = this.page < this.pages - 1;
    this.drawDetail(v);
  }

  /** The strip under the cards: what the chosen card is about, where it is found, and the green arrow to go there. */
  private drawDetail(v: View) {
    this.detail.removeChildren().forEach((c) => c.destroy({ children: true }));
    const entry = this.selected;
    const mod = gameById(entry.game);
    const found = store.journal.found.includes(entry.id);
    const w = Math.min(v.w - 220, 760);
    const x = v.w / 2;
    const y = v.h - 105;
    const strip = new Graphics().roundRect(x - w / 2, y - 62, w, 124, 30).fill({ color: 0xffffff, alpha: 0.96 }).stroke({ width: 5, color: swatch.teal.line });
    strip.eventMode = 'none';
    const said = found ? SCRIPT[entry.line][0] : `Not found yet. Find it in ${mod?.name ?? 'its game'}.`;
    const text = new Text({ text: said, style: { fontFamily: FONT, fontSize: 24, fill: ink, fontWeight: '500', wordWrap: true, wordWrapWidth: w - 220, lineHeight: 30 } });
    text.anchor.set(0, 0.5);
    text.position.set(x - w / 2 + 28, y - 8);
    const where = new Text({ text: found ? `Found in ${mod?.name ?? ''}` : '', style: { fontFamily: FONT, fontSize: 17, fill: 0x6b6b7b, fontWeight: '600' } });
    where.anchor.set(0, 0.5);
    where.position.set(x - w / 2 + 28, y + 40);
    text.eventMode = where.eventMode = 'none';
    this.detail.addChild(strip, text, where);
    this.play.position.set(x + w / 2 - 80, y);
  }

  private choose(entry: JournalEntry) {
    if (this.left) return;
    this.selected = entry;
    const card = this.cards.find((c) => c.entry === entry)!;
    sfx.tick();
    card.node.scale.set(1.08);
    void this.tw.to(card.node.scale, { x: 1, y: 1 }, { duration: 0.3, ease: ease.outBack });
    void voice.say(card.found ? entry.line : 'journal.hint');
    this.drawDetail(this.view);
  }

  private turn(direction: number) {
    const page = Math.max(0, Math.min(this.pages - 1, this.page + direction));
    if (page === this.page) return;
    this.page = lastPage = page;
    this.selected = JOURNAL[page * PER_PAGE];
    this.resize(this.view);
  }

  /** The green arrow: straight to the game that shows the chosen entry, at a band it supports. */
  private openGame() {
    if (this.left) return;
    const mod = gameById(this.selected.game);
    if (!mod) return;
    const profile = store.data.profile.band;
    const band = mod.bands.includes(profile) ? profile : mod.bands[mod.bands.length - 1];
    this.left = true;
    lastPage = this.page;
    voice.stop();
    void voice.say(mod.titleLine);
    this.app.go.game(mod.id, band);
  }

  private leave() {
    if (this.left) return;
    this.left = true;
    lastPage = this.page;
    this.app.go.room();
  }

  enter() {
    void voice.say('journal.hello');
  }

  exit() {
    voice.stop();
  }
}

