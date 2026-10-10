import { Circle, Container, Graphics, Rectangle } from 'pixi.js';
import type { Critter } from '../../art/critter';
import { makeHost, Signpost } from '../../art/lands';
import { swatch } from '../../art/palette';
import { makePet } from '../../art/pet';
import { Backdrop } from '../../art/scenery';
import { music } from '../../audio/music';
import { sfx } from '../../audio/sfx';
import { voice } from '../../audio/voice';
import { landFor, landLayout, olderIn, spotRect, suggest, visibleIn, type Land, type LandId, type LandLayout } from '../../content/lands';
import { onTap } from '../../engine/input';
import { ease } from '../../engine/tween';
import type { View } from '../../engine/view';
import { GAMES } from '../../games/registry';
import { playBand, type Band } from '../../progress/bands';
import { store } from '../../progress/store';
import { RoundButton } from '../../ui/buttons';
import { bookIcon, islandIcon } from '../../ui/icons';
import { makeLandmark, type Landmark } from '../../ui/landmark';
import { label } from '../../ui/text';
import type { App } from '../App';
import { Scene } from '../Scene';

/** Landmarks are drawn at the largest size a land uses and scaled down when a crowded land needs smaller ones. */
const BOX = { w: 170, h: 155 };
/** The host stands about as tall as a game's box. */
const HOST_HEIGHT = 0.95;

/** What the lands remember for this session: lands already greeted, open signposts, the last suggestion, the last land. */
const greeted = new Set<LandId>();
const olderOpen = new Set<LandId>();
const lastTip = new Map<LandId, string>();
let lastLandId: LandId | null = null;
/** The land she was in last this session, where the map's pet waits. */
export const lastLand = () => lastLandId;
/** Another player is at the screen: what the lands remembered is not theirs. */
export function forgetLands() {
  greeted.clear();
  olderOpen.clear();
  lastTip.clear();
  lastLandId = null;
}

/**
 * One themed land on the island: its backdrop, its host, and its games for her age and younger on one screen.
 * When the land has games for bigger kids, a signpost turns the land to show those (played at their easiest
 * band) and back. Tapping the host suggests a game; tapping a game plays it at the band nearest hers it has.
 */
export class LandScene extends Scene {
  readonly land: Land;
  /** Her band, from her profile. */
  readonly band: Band;
  /** Her games here, and the bigger kids' games behind the signpost. */
  readonly mine: Landmark[] = [];
  readonly older: Landmark[] = [];
  showingOlder = false;
  readonly host: Container;
  readonly hostCritter: Critter;
  readonly sign: Signpost | null;
  /** The game the host suggested last, if any. */
  suggested: string | null = null;
  layout: LandLayout | null = null;

  private backdrop!: Backdrop;
  private readonly field = new Container();
  private readonly glow = new Graphics();
  private glowLeft = 0;
  readonly pip = makePet();
  readonly home = new RoundButton(islandIcon(), swatch.white, 50, () => this.leave(() => this.app.go.hub()));
  readonly book = new RoundButton(bookIcon(), swatch.white, 50, () => this.leave(() => this.app.go.stickers()));
  private readonly heading = label('', 36);
  private leaving = false;
  private scale0 = 1;

  constructor(
    app: App,
    readonly id: LandId,
  ) {
    super(app);
    this.land = landFor(id);
    this.band = store.data.profile.band;
    const host = makeHost(this.land);
    this.host = host.node;
    this.hostCritter = host.critter;
    this.sign = olderIn(this.land, this.band, GAMES).length ? new Signpost() : null;
  }

  init() {
    lastLandId = this.id;
    this.heading.text = this.land.name;
    this.backdrop = this.track(new Backdrop(this.land.backdrop, this.view));
    this.glow.eventMode = 'none';
    this.content.addChild(this.backdrop, this.glow, this.field);
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
    this.showingOlder = !!this.sign && olderOpen.has(this.id);

    // The host greets her and suggests a game; its touch area is round its body, not its feet.
    this.track(this.hostCritter);
    this.host.hitArea = new Circle(0, -125, 115);
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
    this.ui.addChild(this.track(this.pip), this.home, this.book, this.heading);
    if (this.backdrop.sun) onTap(this.backdrop.sun, () => { this.backdrop.sun!.poke(); sfx.sparkle(); }, { radius: 100 });
    this.backdrop.clouds.forEach((c) => onTap(c, () => { c.poke(); sfx.whoosh(); }, { radius: 90 }));
  }

  /** The games standing in the land right now. */
  get showing(): Landmark[] {
    return this.showingOlder ? this.older : this.mine;
  }

  resize(v: View) {
    this.backdrop.resize(v);
    const layout = landLayout(this.showing.length, !!this.sign, v, this.backdrop.groundY);
    this.layout = layout;
    this.home.position.set(65, 65);
    this.book.position.set(v.w - 65, 65);
    this.heading.position.set(v.w / 2, 65);
    this.pip.position.set(92, v.h - 12);
    if (!layout) return;
    this.scale0 = layout.box.w / BOX.w;
    for (const mark of [...this.mine, ...this.older]) mark.node.visible = false;
    this.showing.forEach((mark, i) => {
      mark.node.visible = true;
      mark.node.position.set(layout.games[i].x, layout.games[i].y);
      mark.node.scale.set(this.scale0);
    });
    this.host.position.set(layout.host.x, layout.host.y);
    this.host.scale.set((layout.box.h * HOST_HEIGHT) / 250);
    if (this.sign && layout.sign) {
      this.sign.position.set(layout.sign.x, layout.sign.y);
      this.sign.scale.set(layout.box.h / 155);
    }
  }

  enter() {
    music.play(this.land.music);
    const first = !greeted.has(this.id);
    greeted.add(this.id);
    // Each line waits for the one before; a tap that leaves cancels speech, so check before speaking on.
    void voice.say(first ? this.land.line : 'hub.pick').then(() => {
      if (first && !this.leaving) return voice.say('hub.pick');
    });
  }

  /** Turns the signpost: the bigger kids' games, or back to hers. */
  private turnSign() {
    if (this.leaving || !this.sign) return;
    this.showingOlder = !this.showingOlder;
    if (this.showingOlder) olderOpen.add(this.id);
    else olderOpen.delete(this.id);
    this.sign.point(this.showingOlder);
    this.glowLeft = 0;
    this.suggested = null;
    sfx.whoosh();
    void voice.say(this.showingOlder ? 'land.bigger' : 'land.yours');
    this.resize(this.view);
    for (const mark of this.showing) {
      mark.node.scale.set(this.scale0 * 0.6);
      void this.tw.to(mark.node.scale, { x: this.scale0, y: this.scale0 }, { duration: 0.3, ease: ease.outBack });
    }
  }

  /** The host points out a game: one she has not played yet, else the one she played longest ago. */
  private suggestGame() {
    if (this.leaving) return;
    this.hostCritter.poke();
    const mod = suggest(this.showing.map((m) => m.mod), store.data.games, lastTip.get(this.id));
    if (!mod) return;
    lastTip.set(this.id, mod.id);
    this.suggested = mod.id;
    const mark = this.showing.find((m) => m.mod.id === mod.id)!;
    this.glowLeft = 2.6;
    this.tw.kill(mark.node.scale);
    const s = this.scale0;
    void this.tw.to(mark.node.scale, { x: s * 1.14, y: s * 1.14 }, { duration: 0.18 }).then(() => this.tw.to(mark.node.scale, { x: s, y: s }, { duration: 0.3, ease: ease.outBack }));
    void voice.say('land.try').then(() => {
      if (!this.leaving && this.suggested === mod.id) return voice.say(mod.titleLine);
    });
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
      .then(() => this.app.go.game(mod.id, playBand(mod.bands, this.band), undefined, false, { land: this.id }));
  }

  private leave(go: () => void) {
    if (this.leaving) return;
    this.leaving = true;
    go();
  }

  update(dt: number) {
    super.update(dt);
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
    voice.stop();
  }
}
