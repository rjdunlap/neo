import { Circle, Container, Graphics, Rectangle } from 'pixi.js';
import { makeHost, PageArrow, Signpost } from '../../art/lands';
import { swatch } from '../../art/palette';
import { makeCompanion } from '../../creatures/companion';
import { Backdrop, type BackdropStyle } from '../../art/scenery';
import { music } from '../../audio/music';
import { sfx } from '../../audio/sfx';
import { voice } from '../../audio/voice';
import { clampLandPage, landFor, landLayout, landPages, olderIn, spotRect, suggest, visibleIn, type Land, type LandId, type LandLayout } from '../../content/lands';
import type { LineId } from '../../content/voice-script';
import { onTap } from '../../engine/input';
import { ease } from '../../engine/tween';
import type { View } from '../../engine/view';
import { GAMES } from '../../games/registry';
import { playBand, type Band } from '../../progress/bands';
import { store } from '../../progress/store';
import { RoundButton } from '../../ui/buttons';
import { bookIcon, houseIcon, islandIcon } from '../../ui/icons';
import { makeLandmark, type Landmark } from '../../ui/landmark';
import { label } from '../../ui/text';
import type { App } from '../App';
import type { Box } from '../transition';
import { ScreenKeys, type FocusSpot } from '../screen-keys';
import { Scene, type Updatable } from '../Scene';
import { drawBarnyard } from './barnyard';

/** Landmarks are drawn at the largest size a land uses and scaled down when a crowded land needs smaller ones. */
const BOX = { w: 170, h: 155 };
/** The host stands about as tall as a game's box. */
const HOST_HEIGHT = 0.95;
/** The host's scale for a layout's drawing size (a host is about 250 units tall at scale 1). */
export const hostScale = (box: { h: number }) => (box.h * HOST_HEIGHT) / 250;

/** What the lands remember for this session: lands already greeted, open signposts, each side's page, the last suggestion, the last land. */
const greeted = new Set<LandId>();
const olderOpen = new Set<LandId>();
const pageOf = new Map<LandId, { mine: number; older: number }>();
const lastTip = new Map<LandId, string>();
let lastLandId: LandId | null = null;
/** The land she was in last this session, where the map's pet waits. */
export const lastLand = () => lastLandId;
/** The page of a land's side (hers, or the bigger kids') she was on this session; 0 if none. */
export const rememberedPage = (id: LandId, older: boolean) => (older ? pageOf.get(id)?.older : pageOf.get(id)?.mine) ?? 0;
/** Remembers the page of a land's side for the session (never saved). */
export function rememberPage(id: LandId, older: boolean, page: number) {
  const p = pageOf.get(id) ?? { mine: 0, older: 0 };
  p[older ? 'older' : 'mine'] = page;
  pageOf.set(id, p);
}
/** Another player is at the screen: what the lands remembered is not theirs. */
export function forgetLands() {
  greeted.clear();
  olderOpen.clear();
  pageOf.clear();
  lastTip.clear();
  lastLandId = null;
}

/** Who stands where the host stands: feet on (0, 0), about 250 units tall at scale 1, with a body-centred hit area. */
export interface LandHost {
  node: Container;
  /** Its touch reaction; it is updated with the scene. */
  critter: Updatable & { poke(): void };
  hitArea: Circle;
}

/** Where the root's house stands, beside Back in the top-left corner and clear of the heading (`landButtons`). */
export const HOUSE_X = 190;

/** What a scene built on a land may change; without them it is the island's land (`classic/`). */
export interface LandOptions {
  /** Who greets her here: the land's code-drawn host by default. */
  host?: () => LandHost;
  /** Where Home (and Backspace or B) goes: the island map by default. */
  home?: () => void;
  /** The picture on that button: the island by default (a location at the root draws a Back arrow). */
  homeIcon?: () => Container;
  /**
   * At the root (RW14 slice 3): the corner button is Back and says `homeSays` on press, and a house beside it goes Home
   * (`go.hub()`) and says so. Each waits for its word, up to a moment, before leaving.
   */
  root?: { homeSays: () => Promise<void> };
  /** Scenery drawn over the backdrop and under the field on every resize, kept clear of the field's touch areas. */
  scenery?: (g: Graphics, layout: LandLayout, view: View, ground: number) => void;
  /** A backdrop in place of the land's own (a location's night sky), and the heading's colour over it. */
  backdrop?: BackdropStyle;
  headingColor?: number;
  /** Whether tapping the host says the land's line (or `hostLine`) before its suggestion. */
  hostSaysLine?: boolean;
  /** What the host says then, in place of the land's line: a resident's hello (RW14). */
  hostLine?: LineId;
  /** The page to open the side she sees on (a game's `{ land, page }` origin); the remembered page, or the first, without it. */
  page?: number;
}

/**
 * One themed land on the island: its backdrop, its host, and its games for her age and younger, a page at a time.
 * When the land has games for bigger kids, a signpost turns the land to show those (played at their easiest
 * band) and back. A side too full for one screen (`LAND_SPOTS`) splits into near-equal pages with a pictured arrow at
 * each end of the path. Tapping the host suggests a game (turning to its page); tapping a game plays it at the band
 * nearest hers it has.
 */
export class LandScene extends Scene {
  readonly land: Land;
  /** Her band, from her profile. */
  readonly band: Band;
  /** Her games here, and the bigger kids' games behind the signpost. */
  readonly mine: Landmark[] = [];
  readonly older: Landmark[] = [];
  showingOlder = false;
  /** The page of the side she sees, and the arrows that turn it (shown only on a paged side). */
  page = 0;
  readonly prevArrow = new PageArrow(-1);
  readonly nextArrow = new PageArrow(1);
  readonly host: Container;
  readonly hostCritter: LandHost['critter'];
  private readonly hostHit: Circle;
  readonly sign: Signpost | null;
  /** The game the host suggested last, if any. */
  suggested: string | null = null;
  layout: LandLayout | null = null;

  private backdrop!: Backdrop;
  private readonly scenery: Graphics | null;
  private readonly drawScenery: LandOptions['scenery'] | null;
  /** Greeting notes advance on scene time, so leaving or pausing cannot leave a timer behind. */
  private motifStep = -1;
  private motifTime = 0;
  private readonly field = new Container();
  private readonly glow = new Graphics();
  private glowLeft = 0;
  readonly pip = makeCompanion();
  readonly home = new RoundButton(islandIcon(), swatch.white, 50, () => this.leave(this.goHome, this.options.root?.homeSays));
  readonly book = new RoundButton(bookIcon(), swatch.white, 50, () => this.leave(() => this.app.go.stickers()));
  /** At the root, a house beside Back that always goes Home (RW14 slice 3); null on the island. */
  readonly house: RoundButton | null;
  private readonly heading = label('', 36);
  private leaving = false;
  private scale0 = 1;
  /** Keys and a pad: a ring over the games standing here, the host, the signpost and the two buttons. Backspace or B goes back to the map. */
  private readonly keys = new ScreenKeys(this.app, {
    spots: () => this.focusSpots(),
    back: () => this.leave(this.goHome),
    active: () => !this.leaving,
  });

  constructor(
    app: App,
    readonly id: LandId,
    private readonly options: LandOptions = {},
  ) {
    super(app);
    this.land = landFor(id);
    this.drawScenery = options.scenery ?? (id === 'barnyard' ? drawBarnyard : null);
    this.scenery = this.drawScenery ? new Graphics() : null;
    this.band = store.data.profile.band;
    const host = options.host ? options.host() : { ...makeHost(this.land), hitArea: new Circle(0, -125, 115) };
    this.host = host.node;
    this.hostCritter = host.critter;
    this.hostHit = host.hitArea;
    this.sign = olderIn(this.land, this.band, GAMES).length ? new Signpost() : null;
    if (options.homeIcon) {
      this.home.removeChildAt(1).destroy();
      this.home.addChild(options.homeIcon());
    }
    this.house = options.root ? new RoundButton(houseIcon(), swatch.white, 50, () => this.leave(() => this.app.go.hub(), () => voice.say('nav.home'))) : null;
    if (this.house) {
      this.home.meaning = 'back';
      this.house.meaning = 'home';
    }
  }

  init() {
    lastLandId = this.id;
    this.heading.text = this.land.name;
    if (this.options.headingColor !== undefined) this.heading.style.fill = this.options.headingColor;
    this.backdrop = this.track(new Backdrop(this.options.backdrop ?? this.land.backdrop, this.view));
    this.glow.eventMode = 'none';
    this.content.addChild(this.backdrop);
    if (this.scenery) {
      this.scenery.eventMode = 'none';
      this.content.addChild(this.scenery);
    }
    this.content.addChild(this.glow, this.field);
    const build = (mods: typeof GAMES, into: Landmark[]) => {
      for (const mod of mods) {
        const mark = makeLandmark(mod, BOX, store.isNew(mod.id), spotRect({ x: 0, y: 0 }, BOX));
        this.track(mark.icon);
        if (mark.sparkle) this.track(mark.sparkle);
        onTap(mark.node, () => this.launch(mark));
        into.push(mark);
        this.field.addChild(mark.node);
      }
    };
    build(visibleIn(this.land, this.band, GAMES), this.mine);
    build(olderIn(this.land, this.band, GAMES), this.older);
    // A land with nothing yet for her age (Lantern Lake, for a child) opens with its signpost turned, rather than an empty field.
    this.showingOlder = !!this.sign && (olderOpen.has(this.id) || this.mine.length === 0);
    // The page a game was opened from (its origin), else the one she was on, else the first.
    if (this.options.page !== undefined) this.remember(this.options.page);
    this.page = clampLandPage(this.remembered(), this.pages.length);

    for (const arrow of [this.prevArrow, this.nextArrow]) {
      arrow.hitArea = new Rectangle(-75, -150, 150, 160);
      arrow.visible = false;
      onTap(arrow, () => this.turnPage(arrow.dir));
      this.field.addChild(arrow);
    }

    // The host greets her and suggests a game; its touch area is round its body, not its feet.
    this.track(this.hostCritter);
    this.host.hitArea = this.hostHit;
    onTap(this.host, () => this.suggestGame());
    this.field.addChild(this.host);
    if (this.sign) {
      this.sign.hitArea = new Rectangle(-75, -150, 150, 160);
      onTap(this.sign, () => this.turnSign());
      this.sign.point(this.showingOlder);
      this.field.addChild(this.sign);
    }

    this.pip.scale.set(0.55);
    this.pip.hitArea = new Circle(0, -120, 155);
    onTap(this.pip, () => { this.pip.poke(); void voice.say('hub.pick'); });
    this.ui.addChild(this.track(this.pip), this.home, ...(this.house ? [this.house] : []), this.book, this.heading, this.keys.ring);
    if (this.backdrop.sun) onTap(this.backdrop.sun, () => { this.backdrop.sun!.poke(); sfx.sparkle(); }, { radius: 100 });
    this.backdrop.clouds.forEach((c) => onTap(c, () => { c.poke(); sfx.whoosh(); }, { radius: 90 }));
  }

  /** Every game on the side she sees (hers, or the bigger kids'), on every page. */
  get side(): Landmark[] {
    return this.showingOlder ? this.older : this.mine;
  }

  /** The side's pages, in land order. */
  get pages(): Landmark[][] {
    return landPages(this.side, !!this.sign);
  }

  /** The games standing in the land right now: the page she is on. */
  get showing(): Landmark[] {
    const pages = this.pages;
    return pages[clampLandPage(this.page, pages.length)];
  }

  private remembered(): number {
    return rememberedPage(this.id, this.showingOlder);
  }

  private remember(page: number) {
    rememberPage(this.id, this.showingOlder, page);
  }

  resize(v: View) {
    this.backdrop.resize(v);
    const arrows = { prev: this.page > 0, next: this.page < this.pages.length - 1 };
    const layout = landLayout(this.showing.length, !!this.sign, v, this.backdrop.groundY, arrows);
    this.layout = layout;
    this.home.position.set(65, 65);
    this.house?.position.set(HOUSE_X, 65);
    this.book.position.set(v.w - 65, 65);
    this.heading.position.set(v.w / 2, 65);
    this.pip.position.set(92, v.h - 12);
    if (!layout) return;
    if (this.scenery && this.drawScenery) this.drawScenery(this.scenery, layout, v, this.backdrop.groundY);
    this.scale0 = layout.box.w / BOX.w;
    for (const mark of [...this.mine, ...this.older]) mark.node.visible = false;
    this.showing.forEach((mark, i) => {
      mark.node.visible = true;
      mark.node.position.set(layout.games[i].x, layout.games[i].y);
      mark.node.scale.set(this.scale0);
    });
    this.host.position.set(layout.host.x, layout.host.y);
    this.host.scale.set(hostScale(layout.box));
    if (this.sign && layout.sign) {
      this.sign.position.set(layout.sign.x, layout.sign.y);
      this.sign.scale.set(layout.box.h / 155);
    }
    for (const [arrow, spot] of [[this.prevArrow, layout.prev], [this.nextArrow, layout.next]] as const) {
      arrow.visible = !!spot;
      if (spot) {
        arrow.position.set(spot.x, spot.y);
        arrow.scale.set(layout.box.h / 155);
      }
    }
  }

  enter() {
    music.play(this.land.music);
    const first = !greeted.has(this.id);
    greeted.add(this.id);
    if (first && this.id === 'barnyard') {
      sfx.marimba(this.land.music.range[0], 0.24);
      this.motifStep = 1;
      this.motifTime = 0;
    }
    // Each line waits for the one before; a tap that leaves cancels speech, so check before speaking on.
    void voice.say(first ? this.land.line : 'hub.pick').then(() => {
      if (first && !this.leaving) return voice.say('hub.pick');
    });
  }

  /** What a key can press. Games and the host stand with their feet at their position, so each ring sits on the body above them. */
  private focusSpots(): FocusSpot[] {
    const layout = this.layout;
    if (!layout) return [];
    const s = this.scale0;
    const arrow = (a: PageArrow): FocusSpot[] => (a.visible ? [{ id: a.dir < 0 ? 'prev' : 'next', x: a.x, y: a.y - 100 * a.scale.x, r: 85 * a.scale.x, press: () => this.turnPage(a.dir) }] : []);
    // Along the path: the back arrow, the page's games, the on arrow.
    const spots: FocusSpot[] = [
      ...arrow(this.prevArrow),
      ...this.showing.map((m) => ({ id: m.mod.id, x: m.node.x, y: m.node.y - 55 * s, r: 85 * s, press: () => this.launch(m) })),
      ...arrow(this.nextArrow),
    ];
    const hs = this.host.scale.x;
    spots.push({ id: 'host', x: this.host.x + this.hostHit.x * hs, y: this.host.y + this.hostHit.y * hs, r: this.hostHit.radius * hs, press: () => this.suggestGame() });
    if (this.sign && layout.sign) {
      const ss = this.sign.scale.x;
      spots.push({ id: 'sign', x: this.sign.x, y: this.sign.y - 70 * ss, r: 85 * ss, press: () => this.turnSign() });
    }
    spots.push(
      { id: 'home', x: this.home.x, y: this.home.y, r: this.home.radius, press: () => this.home.press() },
      ...(this.house ? [{ id: 'house', x: this.house.x, y: this.house.y, r: this.house.radius, press: () => this.house!.press() }] : []),
      { id: 'book', x: this.book.x, y: this.book.y, r: this.book.radius, press: () => this.book.press() },
    );
    return spots;
  }

  /** Turns the signpost: the bigger kids' games, or back to hers. */
  private turnSign() {
    if (this.leaving || !this.sign) return;
    this.showingOlder = !this.showingOlder;
    if (this.showingOlder) olderOpen.add(this.id);
    else olderOpen.delete(this.id);
    this.sign.point(this.showingOlder);
    // The other side opens at the page she left it on, or its first.
    this.page = clampLandPage(this.remembered(), this.pages.length);
    this.glowLeft = 0;
    this.suggested = null;
    sfx.whoosh();
    void voice.say(this.showingOlder ? 'land.bigger' : 'land.yours');
    this.showPage();
  }

  /** Lays out the page she is on, its games growing in. */
  private showPage() {
    this.resize(this.view);
    for (const mark of this.showing) {
      this.tw.kill(mark.node.scale);
      mark.node.scale.set(this.scale0 * 0.6);
      void this.tw.to(mark.node.scale, { x: this.scale0, y: this.scale0 }, { duration: 0.3, ease: ease.outBack });
    }
  }

  /** Sets the page of the side she sees and remembers it for the session. */
  private goToPage(page: number) {
    this.page = clampLandPage(page, this.pages.length);
    this.remember(this.page);
    this.glowLeft = 0;
    this.suggested = null;
    sfx.whoosh();
    this.showPage();
    // The ring moves on to the new page's first game.
    const first = this.showing[0];
    if (first) this.keys.focus.focusOn(first.mod.id);
  }

  /** An arrow turns a full land a page back or on, saying how many games the new page has (as Explore's arrows do). */
  turnPage(d: -1 | 1) {
    if (this.leaving) return;
    const page = this.page + d;
    if (page < 0 || page >= this.pages.length) return;
    const arrow = d < 0 ? this.prevArrow : this.nextArrow;
    const s = arrow.scale.x;
    this.tw.kill(arrow.scale);
    void this.tw.to(arrow.scale, { x: s * 0.88, y: s * 0.88 }, { duration: 0.08 }).then(() => this.tw.to(arrow.scale, { x: s, y: s }, { duration: 0.25, ease: ease.outBack }));
    this.goToPage(page);
    void voice.say('explore.page', { n: this.showing.length });
  }

  /** The host points out a game: one she has not played yet, else the one she played longest ago. */
  private suggestGame() {
    if (this.leaving) return;
    this.hostCritter.poke();
    // From every game on this side: one on another page turns the land to it first, saying so, then glows.
    const mod = suggest(this.side.map((m) => m.mod), store.data.games, lastTip.get(this.id));
    if (!mod) return;
    lastTip.set(this.id, mod.id);
    const onPage = this.pages.findIndex((p) => p.some((m) => m.mod.id === mod.id));
    const turned = onPage !== this.page;
    if (turned) this.goToPage(onPage);
    this.suggested = mod.id;
    const mark = this.showing.find((m) => m.mod.id === mod.id)!;
    this.glowLeft = 2.6;
    this.tw.kill(mark.node.scale);
    const s = this.scale0;
    void this.tw.to(mark.node.scale, { x: s * 1.14, y: s * 1.14 }, { duration: 0.18 }).then(() => this.tw.to(mark.node.scale, { x: s, y: s }, { duration: 0.3, ease: ease.outBack }));
    const tip = () => voice.say('land.try').then(() => {
      if (!this.leaving && this.suggested === mod.id) return voice.say(mod.titleLine);
    });
    const page = () => (turned ? voice.say('explore.page', { n: this.showing.length }) : Promise.resolve());
    if (this.options.hostSaysLine) void voice.say(this.options.hostLine ?? this.land.line).then(() => {
      if (!this.leaving && this.suggested === mod.id) return page().then(() => {
        if (!this.leaving && this.suggested === mod.id) return tip();
      });
    });
    else void page().then(() => {
      if (!this.leaving && this.suggested === mod.id) return tip();
    });
  }

  /** A round opened from here grows out of its spot, and shrinks back into it (RW14 slice 9). */
  override transitionKey(): string {
    return `land:${this.id}`;
  }

  override returnBox(key: string): Box | null {
    const mark = this.showing.find((m) => `game:${m.mod.id}` === key && m.node.visible);
    return mark ? this.app.boxOf(mark.node) : null;
  }

  private launch(mark: Landmark) {
    if (this.leaving || !mark.node.visible) return;
    this.leaving = true;
    this.pip.cheer();
    const mod = mark.mod;
    void voice.say(mod.titleLine);
    sfx.whoosh();
    this.tw.kill(mark.node.scale);
    void this.tw
      .to(mark.node.scale, { x: this.scale0 * 1.15, y: this.scale0 * 1.15 }, { duration: 0.2 })
      .then(() => this.app.growFrom(mark.node, () => this.app.go.game(mod.id, playBand(mod.bands, this.band), undefined, false, { land: this.id, page: this.page })));
  }

  private readonly goHome = () => (this.options.home ?? this.app.go.hub)();

  /** The way out; with a spoken label (the root's Back and Home) it waits for the word, up to a moment. A second tap while leaving does nothing. */
  private async leave(go: () => void, say?: () => Promise<void>) {
    if (this.leaving) return;
    this.leaving = true;
    if (!say) return go();
    voice.stop();
    await Promise.race([say(), this.tw.wait(1.1)]);
    if (this.app.scene !== this) return;
    go();
  }

  update(dt: number) {
    super.update(dt);
    this.keys.update(dt);
    if (this.motifStep >= 0 && !this.leaving) {
      this.motifTime += dt;
      if (this.motifTime >= 0.16) {
        this.motifTime -= 0.16;
        sfx.marimba(this.land.music.range[0] + this.motifStep * 2, 0.24);
        if (++this.motifStep === 3) this.motifStep = -1;
      }
    }
    // A soft glow under the suggested game for a moment.
    this.glowLeft = Math.max(0, this.glowLeft - dt);
    const mark = this.suggested ? this.showing.find((m) => m.mod.id === this.suggested) : undefined;
    this.glow.clear();
    if (mark && this.glowLeft > 0) {
      const a = Math.min(1, this.glowLeft) * 0.75;
      this.glow.ellipse(mark.node.x, mark.node.y - 4, 105 * this.scale0, 30 * this.scale0).fill({ color: swatch.yellow.light, alpha: a });
    }
  }

  exit() {
    this.motifStep = -1;
    voice.stop();
  }

  destroy() {
    this.keys.destroy();
    super.destroy();
  }
}
