import { Container, Graphics, Rectangle, type FederatedPointerEvent } from 'pixi.js';
import { landmarkFor, Signpost } from '../../art/lands';
import { cream, ink, swatch } from '../../art/palette';
import { homeBackdrop } from '../../art/home/backdrop';
import { music, STYLES } from '../../audio/music';
import { sfx } from '../../audio/sfx';
import { voice } from '../../audio/voice';
import { ageOf, allGames, clampPage, EXPLORE_ENTRIES, exploreMemory, favoriteGames, hasOthers, pageCount, pageOf, type ExploreEntry } from '../../content/explore';
import { landFor, LANDS, type LandId } from '../../content/lands';
import type { LineId } from '../../content/voice-script';
import { CORNER_RADIUS, EXPLORE_CARD, EXPLORE_MAX, exploreGridLayout, exploreLayout, PAGE_ARROW_RADIUS } from '../../creatures/home-layout';
import { onTap } from '../../engine/input';
import type { View } from '../../engine/view';
import { GAMES } from '../../games/registry';
import type { GameModule, HubIcon } from '../../games/types';
import { store } from '../../progress/store';
import { RoundButton } from '../../ui/buttons';
import { arrowIcon, houseIcon } from '../../ui/icons';
import { ENTRY_NAMES, entryArt, fitArt } from '../../ui/origin-art';
import { label } from '../../ui/text';
import type { App } from '../App';
import { Scene } from '../Scene';
import { MixHost } from '../mix';
import { mixSpotArt } from '../../ui/mix';
import { LOCATIONS } from './LocationScene';

/** The built locations, in the order RW13 built them (the page holds every one there will be). */
export const exploreIds = (): LandId[] => (Object.keys(LOCATIONS) as LandId[]).slice(0, EXPLORE_MAX);

/** What one card on the screen stands for, so a script can find and press it. */
export type ExploreCard =
  | { kind: 'entry'; entry: ExploreEntry; node: Container }
  | { kind: 'place'; id: LandId; node: Container }
  | { kind: 'game'; mod: GameModule; node: Container }
  | { kind: 'signpost'; node: Container }
  | { kind: 'family'; node: Container }
  | { kind: 'mix'; node: Container };

/**
 * Explore at the root (RW08 slice 1, docs/rework/RW08-CUTOVER.md#slice-1-explores-four-entries). With no entry it shows
 * four pictures: Places, Favorites, All games and Family play. Places is RW13's picker of the eleven locations;
 * Favorites her hearted games, newest first; All games every game for her age and younger, land by land, with an Other
 * ages signpost as the last card; Family play one card to couch play (a controller or keyboard). Games come four to a
 * page with arrows that move only when pressed. A game keeps an `{ explore }` origin, so the result's Back returns to the
 * same page. Back goes up one level, Home goes Home. Looking changes nothing; nothing here gates or is a round.
 * At lap and toddler, Little surprises' picnic blanket leads All games' first page (RW08 slice 2): a tap starts the mix,
 * a grown-up's hold opens Make my mix, and the mix's stops and its Explore come back to that page.
 */
export class ExploreScene extends Scene {
  private readonly backdrop = homeBackdrop();
  readonly ids = exploreIds();
  readonly back = new RoundButton(arrowIcon(-1), swatch.white, CORNER_RADIUS, () => this.leave(() => (this.entry ? this.app.go.explore() : this.app.go.hub())));
  readonly home = new RoundButton(houseIcon(), swatch.white, CORNER_RADIUS, () => this.leave(() => this.app.go.hub()));
  readonly prev = new RoundButton(arrowIcon(-1), swatch.yellow, PAGE_ARROW_RADIUS, () => this.turn(-1));
  readonly next = new RoundButton(arrowIcon(1), swatch.yellow, PAGE_ARROW_RADIUS, () => this.turn(1));
  /** The cards on screen, in reading order. */
  cards: ExploreCard[] = [];
  /** The list a browse entry pages through (Favorites, All games), and whether it ends with the signpost. */
  readonly list: GameModule[];
  private readonly signpost: boolean;
  /** Little surprises on All games' first page (her own games, lap and toddler), or null. */
  readonly mix: MixHost | null;
  private readonly lead: boolean;
  /** The finger on the mix card, until it lifts. */
  private mixTouch: number | null = null;
  private readonly mixLost = () => this.cancelMix();
  page: number;
  private icons: HubIcon[] = [];
  private leaving = false;

  constructor(app: App, readonly entry: ExploreEntry | null = null, page = 0, readonly others = false) {
    super(app);
    const band = store.data.profile.band;
    this.list = entry === 'favorites' ? favoriteGames(store.favorites, GAMES) : entry === 'all' ? allGames(band, GAMES, LANDS, others) : [];
    this.signpost = entry === 'all' && hasOthers(band, GAMES, LANDS);
    this.mix = entry === 'all' && !others ? new MixHost(app, band, this.ui, () => this.view, this.tw, this.list.map((g) => g.id)) : null;
    this.lead = !!this.mix?.mods;
    this.page = clampPage(page, this.list.length, this.signpost, this.lead);
    if (entry) exploreMemory.pages[entry] = this.page;
    if (entry === 'all') exploreMemory.others = others;
  }

  init() {
    this.content.addChild(this.backdrop);
    this.ui.addChild(this.back, this.home, this.prev, this.next);
    for (const b of [this.prev, this.next]) b.children[1]?.scale.set(1.4);
    this.build();
    window.addEventListener('pointercancel', this.mixLost, true);
    window.addEventListener('blur', this.mixLost);
    // Back from a stop of a live mix: its sheet is up again before the first frame.
    if (this.mix?.live) this.mix.resume();
  }

  override holdsMix(): boolean {
    return !!this.mix?.live;
  }

  /** The mix's sheet or table is up: nothing under it acts. */
  private get covered() {
    return !!this.mix?.covering;
  }

  /** The cards for this entry and page. */
  private build() {
    for (const c of this.cards) c.node.destroy({ children: true });
    for (const i of this.icons) this.untrack(i);
    this.icons = [];
    const e = this.entry;
    if (!e) this.cards = EXPLORE_ENTRIES.map((entry) => ({ kind: 'entry', entry, node: this.card(entryArt(entry), ENTRY_NAMES[entry], () => this.open(entry)) }));
    else if (e === 'places') this.cards = this.ids.map((id) => ({ kind: 'place', id, node: this.card(landmarkFor(id), landFor(id).name, () => this.leave(() => this.app.go.land(id))) }));
    else if (e === 'family') this.cards = [{ kind: 'family', node: this.card(entryArt('family'), ENTRY_NAMES.family, () => this.leave(() => this.app.go.couch(false, { explore: 'family', page: 0 }))) }];
    else if (e === 'favorites' && !this.list.length) this.cards = [{ kind: 'entry', entry: 'all', node: this.card(entryArt('all'), ENTRY_NAMES.all, () => this.open('all')) }];
    else {
      this.cards = pageOf(this.list, this.page, this.signpost, this.lead).map((c) => {
        if ('mix' in c) return { kind: 'mix', node: this.mixCard() };
        if ('signpost' in c) {
          const sign = new Signpost();
          sign.point(this.others);
          return { kind: 'signpost', node: this.card(sign, this.others ? 'Your games' : 'Other ages', () => this.turnSign()) };
        }
        const icon = this.track(c.game.hubIcon());
        this.icons.push(icon);
        return { kind: 'game', mod: c.game, node: this.card(icon, c.game.name, () => this.launch(c.game)) };
      });
    }
    const pages = e === 'favorites' || e === 'all' ? pageCount(this.list.length, this.signpost, this.lead) : 1;
    this.prev.visible = this.page > 0;
    this.next.visible = this.page < pages - 1;
    this.ui.addChild(...this.cards.map((c) => c.node));
  }

  /**
   * Little surprises' card: its own pointer handling, since a tap starts the mix on the lift and a grown-up's hold (a ring
   * fills) opens Make my mix instead (D5a), as on the age places.
   */
  private mixCard(): Container {
    const node = this.card(mixSpotArt(this.mix!.mods!), 'Little surprises', null);
    node.eventMode = 'static';
    node.cursor = 'pointer';
    node.on('pointerdown', (e: FederatedPointerEvent) => {
      if (this.leaving || this.covered || this.mixTouch !== null) return;
      this.mixTouch = e.pointerId;
      sfx.tick();
      node.scale.set(0.94);
      this.mix!.holdStart(node, 0, 0, 70);
    });
    node.on('pointerup', (e: FederatedPointerEvent) => {
      if (this.mixTouch !== e.pointerId) return;
      this.mixTouch = null;
      node.scale.set(1);
      if (this.mix!.consumeHold()) return; // the hold opened the table: this lift does not also start the mix
      voice.stop();
      this.mix!.start();
    });
    node.on('pointerupoutside', () => this.cancelMix());
    return node;
  }

  private cancelMix() {
    this.mixTouch = null;
    for (const c of this.cards) if (c.kind === 'mix') c.node.scale.set(1);
    this.mix?.holdCancel();
  }

  /** A 150-unit cream card with its picture and its name on a pill under it; it squishes and acts on touch-down (`act` null: the caller handles touches). */
  private card(art: Container, name: string, act: (() => void) | null): Container {
    const node = new Container();
    const half = EXPLORE_CARD / 2;
    fitArt(art, EXPLORE_CARD - 30);
    const text = label(name, 22, ink);
    text.y = half + 26;
    // The name sits on its own cream pill so it reads over the busy backdrop.
    const pill = new Graphics().roundRect(-text.width / 2 - 12, text.y - 17, text.width + 24, 34, 17).fill(cream);
    node.addChild(new Graphics().roundRect(-half, -half, EXPLORE_CARD, EXPLORE_CARD, 28).fill(cream).stroke({ color: swatch.green.line, width: 5 }), art, pill, text);
    node.hitArea = new Rectangle(-half, -half, EXPLORE_CARD, EXPLORE_CARD);
    if (act) onTap(node, () => {
      if (this.leaving || this.covered) return;
      sfx.tick();
      node.scale.set(0.9);
      act();
    }, { cooldown: 400 });
    return node;
  }

  /** An entry says its name, then opens where she last was in it this visit. */
  private open(entry: ExploreEntry) {
    const page = exploreMemory.pages[entry] ?? 0;
    this.leave(() => this.app.go.explore(entry, page, entry === 'all' ? exploreMemory.others : undefined), `explore.${entry}`);
  }

  /** A game says its title (or, outside her band, who it is for), then plays at the band nearest hers it has. */
  private launch(mod: GameModule) {
    const age = ageOf(mod, store.data.profile.band);
    const say = age === 'hers' ? voice.say(mod.titleLine) : voice.say('explore.other-age', { who: age === 'bigger' ? 'bigger kids' : 'little ones' });
    const entry = this.entry as 'favorites' | 'all';
    const origin = { explore: entry, page: this.page, ...(entry === 'all' && this.others ? { others: true } : {}) };
    this.leave(() => this.app.go.game(mod.id, undefined, undefined, false, origin), say);
  }

  /** The signpost turns All games between hers and the other ages, from the first page. */
  private turnSign() {
    sfx.whoosh();
    this.leave(() => this.app.go.explore('all', 0, !this.others), this.others ? 'explore.mine' : 'explore.others');
  }

  /** The arrows: a page back or on, here, saying how many pictures the new page has. */
  private turn(d: -1 | 1) {
    if (this.leaving || this.covered) return;
    const pages = pageCount(this.list.length, this.signpost, this.lead);
    const page = this.page + d;
    if (page < 0 || page >= pages) return;
    this.page = page;
    if (this.entry) exploreMemory.pages[this.entry] = page;
    sfx.whoosh();
    this.build();
    this.resize(this.view);
    void voice.say('explore.page', { n: this.cards.length });
  }

  /** A short beat for the squish (or the line, up to a moment), then the way out; a second tap while leaving does nothing. */
  private async leave(go: () => void, line?: LineId | Promise<void>) {
    if (this.leaving || this.covered) return;
    this.leaving = true;
    const speech = typeof line === 'string' ? voice.say(line) : line;
    await (speech ? Promise.race([speech, this.tw.wait(1.1)]) : this.tw.wait(0.2));
    if (this.app.scene !== this) return;
    go();
  }

  resize(v: View) {
    this.mix?.resize(v);
    if (this.entry === 'places') {
      const l = exploreLayout(v, this.cards.length);
      this.place(l.backdrop);
      this.back.position.set(l.back.x, l.back.y);
      this.home.position.set(l.back.x + 130, l.back.y);
      this.cards.forEach((c, i) => c.node.position.set(l.cards[i].x, l.cards[i].y));
      return;
    }
    const l = exploreGridLayout(v, this.cards.length);
    this.place(l.backdrop);
    this.back.position.set(l.back.x, l.back.y);
    this.home.position.set(l.home.x, l.home.y);
    this.prev.position.set(l.prev.x, l.prev.y);
    this.next.position.set(l.next.x, l.next.y);
    this.cards.forEach((c, i) => c.node.position.set(l.cards[i].x, l.cards[i].y));
  }

  private place(b: { x: number; y: number; scale: number }) {
    this.backdrop.position.set(b.x, b.y);
    this.backdrop.scale.set(b.scale);
  }

  update(dt: number) {
    super.update(dt);
    this.mix?.update(dt);
  }

  destroy() {
    window.removeEventListener('pointercancel', this.mixLost, true);
    window.removeEventListener('blur', this.mixLost);
    super.destroy();
  }

  enter() {
    // The page's island-games link belongs to Home; Back (`go.hub()`) shows it again.
    const link = document.querySelector<HTMLElement>('.classic-link');
    if (link) link.hidden = true;
    music.play(STYLES.hub);
    const e = this.entry;
    const line: LineId | null = !e ? 'explore.pick' : e === 'places' ? 'explore.where' : e === 'family' ? 'explore.family-pads' : e === 'favorites' && !this.list.length ? 'explore.no-favorites' : null;
    if (line && !this.covered) void voice.say(line);
  }
}
