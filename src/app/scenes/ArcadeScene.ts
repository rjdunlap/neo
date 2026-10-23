import { Container, Graphics, Rectangle, Text } from 'pixi.js';
import { landmarkFor } from '../../art/lands';
import { cream, ink, swatch } from '../../art/palette';
import { homeBackdrop } from '../../art/home/backdrop';
import { audio } from '../../audio/engine';
import { music, STYLES } from '../../audio/music';
import { sfx } from '../../audio/sfx';
import { voice } from '../../audio/voice';
import { arcadeFilters, arcadeList, arcadeMemory, arcadePage, arcadePages, clampArcadePage, filterLine, filterName, tagsFor, type ArcadeFilter } from '../../content/arcade';
import { islandDemo } from '../../content/demos';
import { ageOf, exploreMemory } from '../../content/explore';
import { LANDS } from '../../content/lands';
import type { LineId } from '../../content/voice-script';
import { Demo } from '../../couch/demo';
import { ARCADE_CARD, ARCADE_PLAY_RADIUS, arcadeLayout, TOPIC_TILE, TOPICS, topicsLayout, type ArcadeLayout } from '../../creatures/arcade-layout';
import { CORNER_RADIUS, PAGE_ARROW_RADIUS } from '../../creatures/home-layout';
import { onTap } from '../../engine/input';
import type { View } from '../../engine/view';
import { GAMES } from '../../games/registry';
import type { GameModule, HubIcon } from '../../games/types';
import { playBand } from '../../progress/bands';
import { store } from '../../progress/store';
import { RoundButton } from '../../ui/buttons';
import { againIcon, arcadeIcon, arrowIcon, houseIcon, playIcon, tilesIcon } from '../../ui/icons';
import { fitArt } from '../../ui/origin-art';
import { FONT, label } from '../../ui/text';
import type { App } from '../App';
import { Scene } from '../Scene';

const MUTED = 0x6b6b7b;
/** Until she taps, the spotlight moves on after the demonstration finishes a round, or after this long. */
const ATTRACT_SECONDS = 20;

/** One game card on the page, so a script can find and press it. */
export interface ArcadeCard {
  mod: GameModule;
  node: Container;
}

/**
 * The Arcade (docs/rework/ARCADE.md): every game in a paged grid of picture cards with their names and tags, and one large
 * spotlight window where the chosen game's own bot plays it (one at a time: the ghost fingers share a pointer and the drag
 * lock). Until she taps, the spotlight moves along the page like an arcade's attract mode. A first tap on a card spotlights
 * it and says its name; a second tap, or the green Play button, starts it. The Topics button opens picture tiles: All
 * games, Played before and each subject. A game keeps the origin `{ explore: 'arcade', page }`; the filter and the
 * spotlit game are remembered for the visit. Looking changes nothing; nothing here gates or is a round.
 */
export class ArcadeScene extends Scene {
  private readonly backdrop = homeBackdrop();
  readonly back = new RoundButton(arrowIcon(-1), swatch.white, CORNER_RADIUS, () => (this.sheet ? this.closeTopics() : this.leave(() => this.app.go.explore())));
  readonly home = new RoundButton(houseIcon(), swatch.white, CORNER_RADIUS, () => this.leave(() => this.app.go.hub()));
  readonly prev = new RoundButton(arrowIcon(-1), swatch.yellow, PAGE_ARROW_RADIUS, () => this.turn(-1));
  readonly next = new RoundButton(arrowIcon(1), swatch.yellow, PAGE_ARROW_RADIUS, () => this.turn(1));
  readonly play = new RoundButton(playIcon(), swatch.green, ARCADE_PLAY_RADIUS, () => !this.sheet && this.spotlit && this.launch(this.spotlit));
  readonly topics = new Container();
  /** The window's frame, the demonstration (or a still picture) and the caption under it. */
  private readonly frame = new Graphics();
  /** A cream panel under the name and details, so they read over the backdrop. */
  private readonly plate = new Graphics();
  private readonly still = new Container();
  private readonly title = new Text({ text: '', style: { fontFamily: FONT, fontSize: 26, fill: ink, fontWeight: '600', wordWrap: true, wordWrapWidth: 300, lineHeight: 30 } });
  private readonly detail = new Text({ text: '', style: { fontFamily: FONT, fontSize: 15, fill: MUTED, fontWeight: '500', wordWrap: true, wordWrapWidth: 300, lineHeight: 19 } });
  private readonly empty = label('', 22, MUTED, '500');
  /** The cards on this page, in reading order. */
  cards: ArcadeCard[] = [];
  /** The Topics sheet while it is open, with its tiles. */
  sheet: { node: Container; tiles: { filter: ArcadeFilter; node: Container }[] } | null = null;
  filter: ArcadeFilter;
  list: GameModule[] = [];
  page: number;
  spotlit: GameModule | null = null;
  demo: Demo | undefined;
  private layout: ArcadeLayout;
  private perPage: number;
  private icons: HubIcon[] = [];
  private stillIcon: HubIcon | null = null;
  /** She has tapped a card: the spotlight stays where she put it. */
  private chosen = false;
  private attract = 0;
  private seenRounds = 0;
  private leaving = false;

  constructor(app: App, page = 0) {
    super(app);
    this.filter = arcadeFilters(GAMES).includes(arcadeMemory.filter) ? arcadeMemory.filter : 'all';
    this.layout = arcadeLayout(this.view);
    this.perPage = this.layout.cards.length;
    this.list = this.listFor(this.filter);
    this.page = clampArcadePage(page, this.list.length, this.perPage);
    exploreMemory.pages.arcade = this.page;
    // Back from a game: the spotlight comes back on the game she chose, and stays there.
    const remembered = this.list.find((g) => g.id === arcadeMemory.spotlight) ?? null;
    if (remembered) {
      this.chosen = true;
      this.spotlit = remembered;
    }
  }

  private listFor(filter: ArcadeFilter) {
    return arcadeList(filter, store.data.profile.band, GAMES, LANDS, store.data.games);
  }

  init() {
    this.content.addChild(this.backdrop);
    this.ui.addChild(this.frame, this.still, this.plate, this.title, this.detail, this.empty, this.topics, this.back, this.home, this.prev, this.next, this.play);
    for (const b of [this.prev, this.next]) b.children[1]?.scale.set(1.4);
    this.play.children[1]?.scale.set(1.5);
    onTap(this.topics, () => {
      if (this.leaving) return;
      sfx.tick();
      this.topics.scale.set(0.94);
      window.setTimeout(() => !this.topics.destroyed && this.topics.scale.set(1), 110);
      if (this.sheet) this.closeTopics();
      else this.openTopics();
    }, { cooldown: 400 });
    this.drawTopics();
    this.build();
    if (!this.spotlit) this.spotlight(this.cards[0]?.mod ?? null);
    else this.spotlight(this.spotlit);
  }

  /** The Topics button: a cream pill with the chosen filter's picture and name. */
  private drawTopics() {
    for (const c of this.topics.removeChildren()) c.destroy({ children: true });
    const art = fitArt(this.filterArt(this.filter), 62);
    art.x -= TOPICS.w / 2 - 50;
    const name = label(filterName(this.filter), 22, ink);
    name.x = 30;
    this.topics.addChild(new Graphics().roundRect(-TOPICS.w / 2, -TOPICS.h / 2, TOPICS.w, TOPICS.h, TOPICS.h / 2).fill(cream).stroke({ color: swatch.purple.line, width: 5 }), art, name);
    if (name.width > TOPICS.w - 110) name.scale.set((TOPICS.w - 110) / name.width);
    this.topics.hitArea = new Rectangle(-TOPICS.w / 2, -TOPICS.h / 2, TOPICS.w, TOPICS.h);
  }

  private filterArt(f: ArcadeFilter): Container {
    return f === 'all' ? tilesIcon() : f === 'played' ? againIcon(swatch.blue.line) : landmarkFor(f);
  }

  /** The cards for this page. */
  private build() {
    for (const c of this.cards) c.node.destroy({ children: true });
    for (const i of this.icons) this.untrack(i);
    this.icons = [];
    const band = store.data.profile.band;
    this.cards = arcadePage(this.list, this.page, this.perPage).map((mod) => ({ mod, node: this.card(mod, band) }));
    const pages = arcadePages(this.list.length, this.perPage);
    this.prev.visible = this.page > 0;
    this.next.visible = this.page < pages - 1;
    this.empty.visible = this.list.length === 0;
    this.empty.text = this.list.length ? '' : 'Nothing here yet';
    for (const c of this.cards) this.ui.addChildAt(c.node, this.ui.getChildIndex(this.topics));
    this.ring();
    this.place();
  }

  /** A 150-unit card: the game's picture, its name on a pill and its tags under it; the spotlit card has a yellow ring. */
  private card(mod: GameModule, band: typeof store.data.profile.band): Container {
    const node = new Container();
    const half = ARCADE_CARD / 2;
    const icon = this.track(mod.hubIcon());
    this.icons.push(icon);
    const art = new Container();
    art.addChild(icon);
    fitArt(art, ARCADE_CARD - 34);
    const ring = new Graphics().roundRect(-half - 7, -half - 7, ARCADE_CARD + 14, ARCADE_CARD + 14, 32).stroke({ color: swatch.yellow.fill, width: 9 });
    ring.label = 'ring';
    const name = new Text({ text: mod.name, style: { fontFamily: FONT, fontSize: 18, fill: ink, fontWeight: '600', align: 'center', wordWrap: true, wordWrapWidth: ARCADE_CARD, lineHeight: 20 } });
    name.anchor.set(0.5, 0);
    name.y = half + 10;
    const pill = new Graphics().roundRect(-Math.max(name.width, 60) / 2 - 10, name.y - 4, Math.max(name.width, 60) + 20, name.height + 8, 14).fill(cream);
    const tags = new Text({ text: tagsFor(mod, band).join(' · '), style: { fontFamily: FONT, fontSize: 14, fill: 0xffffff, fontWeight: '600', align: 'center' } });
    tags.anchor.set(0.5, 0);
    tags.y = name.y + name.height + 8;
    const tagPill = new Graphics().roundRect(-tags.width / 2 - 8, tags.y - 2, tags.width + 16, tags.height + 4, 10).fill(swatch.purple.line);
    if (tags.width > ARCADE_CARD + 4) {
      const s = (ARCADE_CARD + 4) / tags.width;
      tags.scale.set(s);
      tagPill.clear().roundRect(-(tags.width) / 2 - 8, tags.y - 2, tags.width + 16, tags.height + 4, 10).fill(swatch.purple.line);
    }
    node.addChild(ring, new Graphics().roundRect(-half, -half, ARCADE_CARD, ARCADE_CARD, 26).fill(cream).stroke({ color: swatch.green.line, width: 5 }), art, pill, name, tagPill, tags);
    node.hitArea = new Rectangle(-half, -half, ARCADE_CARD, ARCADE_CARD);
    onTap(node, () => {
      if (this.leaving || this.sheet) return;
      sfx.tick();
      node.scale.set(0.92);
      window.setTimeout(() => !node.destroyed && node.scale.set(1), 110);
      this.pick(mod);
    }, { cooldown: 300 });
    return node;
  }

  /** The yellow ring shows on the spotlit card only. */
  private ring() {
    for (const c of this.cards) {
      const ring = c.node.getChildByLabel('ring');
      if (ring) ring.visible = c.mod === this.spotlit;
    }
  }

  /** A tap on a card: the spotlit one starts; another is spotlit, and says its name (or who it is for). */
  pick(mod: GameModule) {
    if (this.spotlit === mod) {
      this.launch(mod);
      return;
    }
    this.chosen = true;
    this.spotlight(mod);
    voice.stop();
    void voice.say(...this.nameLine(mod));
  }

  private nameLine(mod: GameModule): [LineId, { who: string }?] {
    const age = ageOf(mod, store.data.profile.band);
    return age === 'hers' ? [mod.titleLine] : ['explore.other-age', { who: age === 'bigger' ? 'bigger kids' : 'little ones' }];
  }

  /** Put a game in the window: its bot's demonstration at her level, or its picture when it has no bot. */
  private spotlight(mod: GameModule | null) {
    this.spotlit = mod;
    arcadeMemory.spotlight = this.chosen && mod ? mod.id : arcadeMemory.spotlight;
    this.demo?.destroy();
    this.demo = undefined;
    if (this.stillIcon) this.untrack(this.stillIcon);
    for (const c of this.still.removeChildren()) c.destroy({ children: true });
    this.stillIcon = null;
    this.attract = 0;
    this.seenRounds = 0;
    this.play.visible = !!mod;
    if (!mod) {
      this.still.addChild(fitArt(arcadeIcon(), 160));
      this.title.text = '';
      this.detail.text = '';
      this.ring();
      this.place();
      return;
    }
    const band = playBand(mod.bands, store.data.profile.band);
    const level = store.levelFor(mod.id, mod.levels(band), mod.entryLevels);
    const spec = islandDemo(mod, level, band);
    if (spec) {
      this.demo = new Demo(mod, { ...spec, renderer: this.app.renderer });
      this.demo.root.eventMode = 'none';
      this.ui.addChildAt(this.demo.root, this.ui.getChildIndex(this.still) + 1);
      if (!this.demo.hasBot) {
        // A game whose bot is not in this build: the round stands still, so show the picture instead.
        this.demo.destroy();
        this.demo = undefined;
      }
    }
    if (!this.demo) {
      const icon = this.track(mod.hubIcon());
      this.stillIcon = icon;
      const art = new Container();
      art.addChild(icon);
      this.still.addChild(fitArt(art, 200));
    }
    this.title.text = mod.name;
    const describe = mod.describeLevel(spec?.level ?? level);
    this.detail.text = [tagsFor(mod, store.data.profile.band).join(' · '), describe, mod.skills.slice(0, 3).join(', ')].filter(Boolean).join('\n');
    this.ring();
    this.place();
  }

  /** Start a game, saying its name first; Back from it comes to this page. */
  private launch(mod: GameModule) {
    arcadeMemory.spotlight = mod.id;
    const origin = { explore: 'arcade' as const, page: this.page };
    this.leave(() => this.app.go.game(mod.id, undefined, undefined, false, origin), voice.say(...this.nameLine(mod)));
  }

  /** The arrows: a page back or on. Before she has chosen, the spotlight follows to the new page's first card. */
  private turn(d: -1 | 1) {
    if (this.leaving || this.sheet) return;
    const page = this.page + d;
    if (page < 0 || page >= arcadePages(this.list.length, this.perPage)) return;
    this.page = page;
    exploreMemory.pages.arcade = page;
    sfx.whoosh();
    this.build();
    if (!this.chosen) this.spotlight(this.cards[0]?.mod ?? null);
    void voice.say('explore.page', { n: this.cards.length });
  }

  /** The Topics sheet: a cream cover with a picture tile for each filter; a tap outside the tiles closes it. */
  private openTopics() {
    const node = new Container();
    const cover = new Graphics().rect(0, 0, this.view.w, this.view.h).fill({ color: cream, alpha: 0.94 });
    onTap(cover, () => this.closeTopics(), { cooldown: 300 });
    node.addChild(cover);
    const filters = arcadeFilters(GAMES);
    const spots = topicsLayout(this.view, filters.length);
    const tiles = filters.map((filter, i) => {
      const tile = new Container();
      const half = TOPIC_TILE / 2;
      const name = label(filterName(filter), 20, ink);
      name.y = half + 22;
      tile.addChild(
        new Graphics().roundRect(-half, -half, TOPIC_TILE, TOPIC_TILE, 26).fill(0xffffff).stroke({ color: filter === this.filter ? swatch.yellow.fill : swatch.purple.line, width: filter === this.filter ? 9 : 5 }),
        fitArt(this.filterArt(filter), TOPIC_TILE - 40),
        name,
      );
      tile.position.set(spots[i].x, spots[i].y);
      tile.hitArea = new Rectangle(-half, -half, TOPIC_TILE, TOPIC_TILE);
      onTap(tile, () => {
        sfx.tick();
        tile.scale.set(0.92);
        this.choose(filter);
      }, { cooldown: 400 });
      node.addChild(tile);
      return { filter, node: tile };
    });
    // Over everything but the top bar: Back closes the sheet, and the Topics button shows what is chosen.
    this.ui.addChild(node, this.topics, this.back, this.home);
    this.sheet = { node, tiles };
    if (this.demo) this.demo.root.visible = false;
    voice.stop();
    void voice.say('arcade.topics');
  }

  private closeTopics() {
    if (!this.sheet) return;
    this.sheet.node.destroy({ children: true });
    this.sheet = null;
    if (this.demo) this.demo.root.visible = true;
  }

  /** A filter from the sheet: its list from the first page, the spotlight on its first game. */
  choose(filter: ArcadeFilter) {
    this.filter = filter;
    arcadeMemory.filter = filter;
    arcadeMemory.spotlight = null;
    this.chosen = false;
    this.closeTopics();
    this.drawTopics();
    this.list = this.listFor(filter);
    this.page = 0;
    exploreMemory.pages.arcade = 0;
    this.build();
    this.spotlight(this.cards[0]?.mod ?? null);
    voice.stop();
    void voice.say(this.list.length ? filterLine(filter) : 'arcade.empty');
  }

  /** A short beat for the squish (or the line, up to a moment), then the way out; a second tap while leaving does nothing. */
  private async leave(go: () => void, speech?: Promise<void>) {
    if (this.leaving) return;
    this.leaving = true;
    await (speech ? Promise.race([speech, this.tw.wait(1.1)]) : this.tw.wait(0.2));
    if (this.app.scene !== this) return;
    go();
  }

  resize(v: View) {
    this.layout = arcadeLayout(v);
    const perPage = this.layout.cards.length;
    if (perPage !== this.perPage) {
      // A turn of the iPad changes how many fit: keep the spotlit game (or the page's first) in view.
      const first = this.spotlit ?? this.cards[0]?.mod;
      const at = first ? this.list.indexOf(first) : -1;
      this.perPage = perPage;
      this.page = clampArcadePage(at >= 0 ? Math.floor(at / perPage) : this.page, this.list.length, perPage);
      this.build();
    }
    if (this.sheet) {
      const filter = this.filter;
      this.closeTopics();
      this.filter = filter;
      this.openTopics();
    }
    this.place();
  }

  private place() {
    const l = this.layout;
    const v = this.view;
    const scale = Math.max(v.w / 1536, v.h / 1024);
    this.backdrop.position.set(v.w / 2, v.h);
    this.backdrop.scale.set(scale);
    this.back.position.set(l.back.x, l.back.y);
    this.home.position.set(l.home.x, l.home.y);
    this.topics.position.set(l.topics.x, l.topics.y);
    this.prev.position.set(l.prev.x, l.prev.y);
    this.next.position.set(l.next.x, l.next.y);
    this.play.position.set(l.play.x, l.play.y);
    const w = l.window.w;
    const h = (w * 3) / 4;
    this.frame.clear().roundRect(l.window.x - 8, l.window.y - 8, w + 16, h + 16, 26).fill(0xffffff).stroke({ color: swatch.purple.line, width: 6 });
    this.demo?.layout(l.window.x, l.window.y, w);
    this.still.position.set(l.window.x + w / 2, l.window.y + h / 2);
    this.title.position.set(l.caption.x, l.caption.y);
    this.title.style.wordWrapWidth = l.caption.w;
    this.detail.position.set(l.caption.x, l.caption.y + this.title.height + 4);
    this.detail.style.wordWrapWidth = l.caption.w;
    this.plate.clear();
    if (this.title.text) this.plate.roundRect(l.caption.x - 12, l.caption.y - 6, l.caption.w + 24, this.title.height + this.detail.height + 20, 18).fill({ color: cream, alpha: 0.92 });
    const g = this.layout.cards;
    this.cards.forEach((c, i) => c.node.position.set(g[i].x, g[i].y));
    const mid = g.length ? { x: (g[0].x + g[g.length - 1].x) / 2, y: (g[0].y + g[g.length - 1].y) / 2 } : { x: v.w / 2, y: v.h / 2 };
    this.empty.position.set(mid.x, mid.y);
  }

  update(dt: number) {
    super.update(dt);
    if (this.sheet) return;
    this.demo?.update(dt);
    if (this.chosen || this.leaving || !this.spotlit || this.cards.length < 2) return;
    // Attract mode: after a finished round, or a while, the spotlight moves to the next card on the page.
    this.attract += dt;
    const finished = (this.demo?.finishedRounds ?? 0) > this.seenRounds;
    if (finished || this.attract > ATTRACT_SECONDS) {
      const i = this.cards.findIndex((c) => c.mod === this.spotlit);
      this.spotlight(this.cards[(i + 1) % this.cards.length].mod);
    }
  }

  enter() {
    const link = document.querySelector<HTMLElement>('.classic-link');
    if (link) link.hidden = true;
    music.play(STYLES.hub);
    // The demonstrations' effects stay low, as on the how-to card.
    audio.hush(true);
    if (!this.chosen) void voice.say('explore.arcade');
  }

  exit() {
    audio.hush(false);
  }

  destroy() {
    audio.hush(false);
    this.demo?.destroy();
    this.demo = undefined;
    super.destroy();
  }
}
