import { Circle, Container, type FederatedPointerEvent, Graphics, Rectangle } from 'pixi.js';
import { cream, swatch, type ColorName } from '../../art/palette';
import { makePet } from '../../art/pet';
import { Backdrop } from '../../art/scenery';
import { flower } from '../../art/shapes';
import { music, STYLES } from '../../audio/music';
import { sfx } from '../../audio/sfx';
import { voice } from '../../audio/voice';
import { placeFor, type Place } from '../../content/places';
import { shelfFor } from '../../content/shelf';
import { REGION_IDS } from '../../content/world';
import { onTap, palmOnGlass } from '../../engine/input';
import { ease } from '../../engine/tween';
import type { View } from '../../engine/view';
import { GAMES } from '../../games/registry';
import type { GameModule, HubIcon } from '../../games/types';
import type { Band } from '../../progress/bands';
import { store } from '../../progress/store';
import { RoundButton } from '../../ui/buttons';
import { arrowIcon, bookIcon, islandIcon } from '../../ui/icons';
import { Shelf, type ShelfItem } from '../../ui/shelf';
import { Sparkle } from '../../ui/sparkle';
import { label } from '../../ui/text';
import type { App } from '../App';
import { Scene } from '../Scene';

/** Every game's landmark is scaled to fit this box, feet on the ground. */
const ICON_W = 190;
const ICON_H = 175;
/** Further than this and a touch is a swipe, not a tap. */
const SWIPE = 24;

/** Where each place was scrolled to, and whether "swipe for more" was said, for this session. */
const lastScroll = new Map<Band, number>();
const toldMore = new Set<Band>();

/** The games for a band, grouped by subject so music sits with music and numbers with numbers. */
export function gamesFor(band: Band): GameModule[] {
  return GAMES.filter((g) => g.bands.includes(band))
    .map((g, i) => ({ g, i }))
    .sort((a, b) => REGION_IDS.indexOf(a.g.region) - REGION_IDS.indexOf(b.g.region) || a.i - b.i)
    .map(({ g }) => g);
}

class Flower extends Container {
  private readonly head: Graphics;
  private wiggle = 0;
  private clock = Math.random() * 5;

  constructor(color: ColorName, size: number) {
    super();
    const sw = swatch[color];
    const leaf = swatch.green;
    const stem = new Graphics()
      .moveTo(0, 0)
      .quadraticCurveTo(-6, -size * 1.2, 0, -size * 2.2)
      .stroke({ width: 6, color: leaf.line, cap: 'round' })
      .ellipse(-11, -size * 0.9, 12, 6)
      .fill(leaf.fill)
      .stroke({ width: 3, color: leaf.line });
    this.head = flower(new Graphics(), size, sw.fill, sw.line);
    this.head.y = -size * 2.2;
    this.addChild(stem, this.head);
    this.eventMode = 'static';
    this.hitArea = new Circle(0, -size * 2, size * 1.5);
  }

  poke() {
    this.wiggle = 1;
  }

  update(dt: number) {
    this.clock += dt;
    this.wiggle = Math.max(0, this.wiggle - dt * 1.5);
    this.head.rotation = 0.06 * Math.sin(this.clock * 1.5) + 0.5 * this.wiggle * Math.sin(this.wiggle * 20);
    this.head.scale.set(1 + 0.25 * this.wiggle);
  }
}

interface Landmark {
  mod: GameModule;
  node: Container;
  icon: HubIcon;
}

/**
 * One place on the age trail. All of its games stand along a winding path; when there are
 * more than fit, the land swipes sideways (or the arrows move it a screen at a time).
 */
export class PlaceScene extends Scene {
  readonly place: Place;
  readonly landmarks: Landmark[] = [];
  /** The twinkles on games not yet played, by game ID. */
  readonly sparkles = new Map<string, Sparkle>();
  scroll = 0;
  maxScroll = 0;

  private backdrop!: Backdrop;
  /** Everything that pans: the path, the games and the flowers. */
  private readonly land = new Container();
  private readonly path = new Graphics();
  private readonly flowers: Flower[] = [];
  private readonly pip = makePet();
  private readonly home = new RoundButton(islandIcon(), swatch.white, 50, () => this.leave(() => this.app.go.hub()));
  private readonly book = new RoundButton(bookIcon(), swatch.white, 50, () => this.leave(() => this.app.go.stickers()));
  readonly previous = new RoundButton(arrowIcon(-1), swatch.white, 46, () => this.page(-1));
  readonly next = new RoundButton(arrowIcon(1), swatch.white, 46, () => this.page(1));
  private readonly heading = label('', 36);
  /** The hearted games for this place, standing in the sky; absent until something is hearted. */
  shelf: Shelf | null = null;
  private touch: { id: number; x0: number; scroll0: number; lastX: number; lastT: number; moved: boolean; target: Landmark | Flower | null } | null = null;
  private velocity = 0;
  private leaving = false;
  private landWidth = 0;

  constructor(
    app: App,
    readonly band: Band,
  ) {
    super(app);
    this.place = placeFor(band);
  }

  init() {
    this.heading.text = this.place.name;
    this.backdrop = this.track(new Backdrop(this.place.backdrop, this.view));
    this.land.eventMode = 'static';
    this.land.addChild(this.path);
    this.content.addChild(this.backdrop, this.land);
    for (const mod of gamesFor(this.band)) {
      const icon = this.track(mod.hubIcon());
      const b = icon.getLocalBounds();
      const s = Math.min(1, ICON_W / b.width, ICON_H / b.height);
      icon.scale.set(s);
      // Center the drawing over its spot, feet on the ground.
      icon.position.set(-(b.x + b.width / 2) * s, -(b.y + b.height) * s);
      const node = new Container();
      node.addChild(new Graphics().ellipse(0, 0, Math.min(110, (b.width * s) / 2 + 20), 18).fill({ color: swatch.green.line, alpha: 0.18 }), icon);
      // A twinkle on a game she has not finished a round of yet. It never blocks a touch.
      if (store.isNew(mod.id)) {
        const sparkle = this.track(new Sparkle());
        sparkle.position.set(Math.min(95, (b.width * s) / 2 - 4), -b.height * s + 6);
        node.addChild(sparkle);
        this.sparkles.set(mod.id, sparkle);
      }
      node.eventMode = 'static';
      node.cursor = 'pointer';
      node.hitArea = new Rectangle(-Math.max(55, (b.width * s) / 2 + 15), -Math.max(100, b.height * s + 20), Math.max(110, b.width * s + 30), Math.max(100, b.height * s + 20) + 25);
      this.landmarks.push({ mod, node, icon });
      this.land.addChild(node);
    }
    this.land.on('pointerdown', (e) => this.down(e));
    this.land.on('globalpointermove', (e) => this.move(e));
    this.land.on('pointerup', (e) => this.up(e));
    this.land.on('pointerupoutside', (e) => this.up(e));
    // A system gesture can take a finger away; forget it so the next touch works.
    this.land.on('pointercancel', (e) => {
      if (this.touch?.id !== e.pointerId) return;
      const target = this.touch.target;
      if (target && !(target instanceof Flower)) void this.tw.to(target.node.scale, { x: 1, y: 1 }, { duration: 0.15 });
      this.touch = null;
    });

    this.pip.scale.set(0.55);
    this.pip.hitArea = new Circle(0, -120, 155);
    onTap(this.pip, () => { this.pip.poke(); void voice.say('hub.pick'); });
    const here = gamesFor(this.band);
    const hearted = shelfFor(store.favorites, here.map((g) => g.id)).map((id) => here.find((g) => g.id === id)!);
    if (hearted.length) {
      this.shelf = this.track(new Shelf(hearted, (item) => this.launch(item)));
      this.ui.addChild(this.shelf);
    }
    this.ui.addChild(this.track(this.pip), this.home, this.book, this.heading, this.previous, this.next);
    if (this.backdrop.sun) onTap(this.backdrop.sun, () => { this.backdrop.sun!.poke(); sfx.sparkle(); }, { radius: 100 });
    this.backdrop.clouds.forEach((c) => onTap(c, () => { c.poke(); sfx.whoosh(); }, { radius: 90 }));
    this.scroll = lastScroll.get(this.band) ?? 0;
  }

  resize(v: View) {
    this.backdrop.resize(v);
    const ground = this.backdrop.groundY;
    const backY = Math.max(ground + 95, v.h * 0.62);
    const frontY = v.h - 55;
    const n = this.landmarks.length;
    // Games zigzag between a back and a front row, each a step further along. Neighbors in a row are
    // two steps apart. Spread out to fill the screen when everything fits; otherwise swipe.
    const first = 205;
    const last = v.w - ICON_W / 2 - 10;
    const fit = n > 1 ? (last - first) / (n - 1) : 0;
    const step = fit >= ICON_W / 2 + 5 ? fit : 122;
    this.landmarks.forEach(({ node }, i) => node.position.set(first + step * i, i % 2 ? frontY : backY));
    this.landWidth = first + step * (n - 1) + ICON_W / 2 + 10;
    const cols = Math.ceil(n / 2);
    this.maxScroll = Math.max(0, this.landWidth - v.w);
    this.land.hitArea = new Rectangle(0, ground - 140, Math.max(v.w, this.landWidth), v.h - ground + 140);

    // A sandy path winding between the two rows.
    const mid = (backY + frontY) / 2 - 10;
    const p = this.path.clear().moveTo(-20, mid);
    for (let x = 0; x <= this.landWidth + 40; x += 30) p.lineTo(x, mid + Math.sin(x / 140) * 26);
    p.stroke({ width: 54, color: cream, cap: 'round', join: 'round' });
    for (let x = 30; x < this.landWidth; x += 90) this.path.ellipse(x, mid + Math.sin(x / 140) * 26, 9, 5).fill({ color: swatch.yellow.light });

    if (!this.flowers.length) {
      const colors: ColorName[] = ['pink', 'purple', 'orange', 'red', 'blue'];
      for (let i = 0; i < Math.max(6, cols * 2); i++) this.plant((i + 0.5) * (this.landWidth / Math.max(6, cols * 2)), i % 2 ? mid + 55 : backY - 105 + (i % 3) * 12, colors[i % colors.length], false);
    }
    // The shelf stands in the sky above the back row of games, clear of the home and book buttons.
    this.shelf?.position.set(v.w / 2, Math.max(240, backY - ICON_H - 60));
    this.pip.position.set(92, v.h - 12);
    this.home.position.set(65, 65);
    this.book.position.set(v.w - 65, 65);
    this.heading.position.set(v.w / 2, 65);
    // Up in the sky, clear of the games.
    this.previous.position.set(60, ground - 145);
    this.next.position.set(v.w - 60, ground - 145);
    this.applyScroll();
  }

  enter() {
    music.play(STYLES.hub);
    void voice.say('hub.pick').then(() => {
      if (this.maxScroll > 0 && !toldMore.has(this.band) && !this.leaving) {
        toldMore.add(this.band);
        return voice.say('place.more');
      }
    });
  }

  // Touch: tap a game, poke a flower, plant a flower, or swipe the land ------------------------

  private find(target: unknown): Landmark | Flower | null {
    for (let t = target as Container | null; t && t !== this.land; t = t.parent) {
      const mark = this.landmarks.find((l) => l.node === t);
      if (mark) return mark;
      if (t instanceof Flower) return t;
    }
    return null;
  }

  private down(e: FederatedPointerEvent) {
    if (this.leaving || this.touch || palmOnGlass()) return;
    const x = this.content.toLocal(e.global).x;
    const target = this.find(e.target);
    this.touch = { id: e.pointerId, x0: x, scroll0: this.scroll, lastX: x, lastT: performance.now(), moved: false, target };
    this.velocity = 0;
    // Answer the touch right away; a game only opens if the finger lifts without swiping.
    if (target instanceof Flower) {
      target.poke();
      sfx.bell(5 + (this.flowers.indexOf(target) % 5), 0.2);
    } else if (target) {
      this.tw.kill(target.node.scale);
      void this.tw.to(target.node.scale, { x: 1.08, y: 1.08 }, { duration: 0.1 });
      sfx.tick();
    }
  }

  private move(e: FederatedPointerEvent) {
    const t = this.touch;
    if (!t || e.pointerId !== t.id) return;
    const x = this.content.toLocal(e.global).x;
    if (!t.moved && Math.abs(x - t.x0) > SWIPE) {
      t.moved = true;
      if (t.target && !(t.target instanceof Flower)) void this.tw.to(t.target.node.scale, { x: 1, y: 1 }, { duration: 0.15 });
    }
    if (t.moved && this.maxScroll > 0) {
      const now = performance.now();
      const dt = Math.max(1, now - t.lastT) / 1000;
      this.velocity = 0.7 * this.velocity + 0.3 * (-(x - t.lastX) / dt);
      t.lastX = x;
      t.lastT = now;
      this.scroll = Math.max(0, Math.min(this.maxScroll, t.scroll0 - (x - t.x0)));
      this.applyScroll();
    }
  }

  private up(e: FederatedPointerEvent) {
    const t = this.touch;
    if (!t || e.pointerId !== t.id) return;
    this.touch = null;
    if (t.moved) return;
    if (t.target instanceof Flower) return;
    if (t.target) {
      this.launch(t.target);
      return;
    }
    const p = this.land.toLocal(e.global);
    if (p.y > this.backdrop.groundY) this.plant(p.x, p.y, (['pink', 'purple', 'orange', 'red', 'blue'] as ColorName[])[this.flowers.length % 5]);
  }

  private launch(mark: Pick<Landmark | ShelfItem, 'mod' | 'node'>) {
    if (this.leaving) return;
    this.leaving = true;
    lastScroll.set(this.band, this.scroll);
    this.pip.cheer();
    void voice.say(mark.mod.titleLine);
    sfx.whoosh();
    void this.tw.to(mark.node.scale, { x: 1.15, y: 1.15 }, { duration: 0.2 }).then(() => this.app.go.game(mark.mod.id, this.band));
  }

  private leave(go: () => void) {
    if (this.leaving) return;
    this.leaving = true;
    lastScroll.set(this.band, this.scroll);
    go();
  }

  /** The arrows move about one screen at a time. */
  private page(direction: number) {
    if (this.leaving) return;
    this.velocity = 0;
    const target = Math.max(0, Math.min(this.maxScroll, this.scroll + direction * (this.view.w - 260)));
    void this.tw.to(this as { scroll: number }, { scroll: target }, { duration: 0.45, ease: ease.inOutSine });
  }

  private applyScroll() {
    this.land.x = -this.scroll;
    this.previous.visible = this.scroll > 4;
    this.next.visible = this.scroll < this.maxScroll - 4;
  }

  private plant(x: number, y: number, color: ColorName, sound = true) {
    const f = this.track(new Flower(color, 20));
    f.position.set(x, y);
    this.land.addChildAt(f, 1);
    this.flowers.push(f);
    if (sound) {
      f.poke();
      sfx.bell(6, 0.2);
    }
    if (this.flowers.length > 30) {
      const old = this.flowers.shift()!;
      this.untrack(old);
      old.destroy({ children: true });
    }
  }

  update(dt: number) {
    super.update(dt);
    if (!this.touch && Math.abs(this.velocity) > 5) {
      this.scroll = Math.max(0, Math.min(this.maxScroll, this.scroll + this.velocity * dt));
      this.velocity *= Math.exp(-4 * dt);
      if (this.scroll === 0 || this.scroll === this.maxScroll) this.velocity = 0;
    }
    this.applyScroll();
  }

  exit() {
    voice.stop();
  }
}
