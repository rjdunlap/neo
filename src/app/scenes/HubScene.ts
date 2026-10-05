import { Circle, Container, Graphics, Rectangle, type FederatedPointerEvent } from 'pixi.js';
import { Critter, CRITTERS } from '../../art/critter';
import { swatch, wood, type ColorName } from '../../art/palette';
import { Backdrop } from '../../art/scenery';
import { flower } from '../../art/shapes';
import { music, STYLES } from '../../audio/music';
import { stepFromUnit } from '../../audio/notes';
import { sfx } from '../../audio/sfx';
import { voice } from '../../audio/voice';
import { onTap, palmOnGlass } from '../../engine/input';
import { Rng } from '../../engine/random';
import { ease } from '../../engine/tween';
import type { View } from '../../engine/view';
import { GAMES } from '../../games/registry';
import type { GameModule, HubIcon } from '../../games/types';
import { openParentPanel } from '../../parent/panel';
import { store } from '../../progress/store';
import { RoundButton } from '../../ui/buttons';
import { arrowIcon, bookIcon } from '../../ui/icons';
import { ParentGate } from '../../ui/ParentGate';
import { Scene } from '../Scene';
import { session } from '../session';

const FLOWER_COLORS: ColorName[] = ['pink', 'purple', 'red', 'blue', 'orange'];
const MOST_FLOWERS = 18;

/** Each page of the hub is a place, holding the games from a few regions of the island. */
interface PlaceDef {
  id: 'meadow' | 'farm' | 'garden';
  regions: string[];
}

const PLACES: PlaceDef[] = [
  { id: 'meadow', regions: ['bubble-beach', 'music-mountain', 'treehouse'] },
  { id: 'farm', regions: ['barnyard', 'counting-cove', 'cozy-village'] },
  { id: 'garden', regions: ['rainbow-meadow', 'puzzle-peaks'] },
];

/** The page she was last on, so coming back from a game lands in the same place. */
let lastPage = 0;
let visits = 0;

interface Place {
  def: PlaceDef;
  layer: Container;
  decor: Graphics;
  games: { mod: GameModule; icon: HubIcon }[];
  flowers: Flower[];
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

/**
 * The home world: a few side-by-side places (meadow, farm, garden) with one big object per game.
 * Big arrows or a swipe move between them; Pip stays in front. Only games for her age band appear.
 * Hold both top corners for the parent zone.
 */
export class HubScene extends Scene {
  private backdrop!: Backdrop;
  private readonly world = new Container();
  private readonly ground = new Container();
  private readonly pip = new Critter(CRITTERS.pip);
  private readonly places: Place[] = [];
  private readonly book = new RoundButton(bookIcon(), swatch.white, 50, () => this.app.go.stickers());
  private readonly prev = new RoundButton(arrowIcon(-1, 0xffffff), swatch.purple, 44, () => this.turn(-1));
  private readonly next = new RoundButton(arrowIcon(1, 0xffffff), swatch.purple, 44, () => this.turn(1));
  private readonly gate = new ParentGate(() => this.openParents());
  private page = 0;
  /** The finger currently down on the hub: a tap or a swipe, decided when it lifts. */
  private press: { id: number; x: number; y: number; at: number; game?: Place['games'][number]; ground?: { place: Place; x: number; y: number } } | null = null;
  private readonly lift = (e: PointerEvent) => this.released(e);
  private leaving = false;
  private lastPipLine = -10;
  private clock = 0;

  init() {
    this.backdrop = this.track(
      new Backdrop({ sky: [0x8fd3f7, 0xe9f7ff], hills: [0xc8ecb0, 0xaee39a, 0x9edb86], horizon: 0.6, clouds: 4, sun: true, seed: 12 }, this.view),
    );
    this.content.addChild(this.backdrop, this.ground, this.world);
    this.makeSkyPokeable();
    this.listenForSwipes();

    const band = store.data.profile.band;
    for (const def of PLACES) {
      const games = GAMES.filter((g) => def.regions.includes(g.region) && g.bands.includes(band));
      if (!games.length) continue;
      const place: Place = { def, layer: new Container(), decor: new Graphics(), games: [], flowers: [] };
      place.layer.addChild(place.decor);
      for (const mod of games) {
        const icon = this.track(mod.hubIcon());
        const b = icon.getLocalBounds();
        const entry = { mod, icon };
        // Games open when the finger lifts without travelling, so a swipe that starts on one still just swipes.
        icon.eventMode = 'static';
        icon.cursor = 'pointer';
        icon.hitArea = new Rectangle(b.x - 24, b.y - 24, b.width + 48, b.height + 48);
        icon.on('pointerdown', (e: FederatedPointerEvent) => {
          if (palmOnGlass()) return;
          this.pressStart(e).game = entry;
          icon.scale.set(0.95);
        });
        place.games.push(entry);
        place.layer.addChild(icon);
      }
      this.places.push(place);
      this.world.addChild(place.layer);
    }
    this.page = Math.min(lastPage, this.places.length - 1);

    this.pip.scale.set(0.72);
    onTap(this.pip, () => {
      this.pip.poke();
      sfx.giggle();
      if (this.clock - this.lastPipLine > 3) {
        this.lastPipLine = this.clock;
        void voice.say('poke.pip');
      }
    });
    this.pip.hitArea = new Circle(0, -125, 160);
    this.content.addChild(this.track(this.pip));
    this.ui.addChild(this.book, this.prev, this.next, this.track(this.gate));
  }

  resize(v: View) {
    this.backdrop.resize(v);
    const cx = v.w / 2;
    const g = this.backdrop.groundY;
    this.ground.hitArea = new Rectangle(0, g - 20, v.w, v.h - g + 20);
    this.content.hitArea = new Rectangle(0, 0, v.w, v.h);
    const spots = [
      [cx - 320, v.h - 64],
      [cx + 320, v.h - 64],
      [cx, g + 26],
    ];
    this.places.forEach((place, i) => {
      place.layer.x = i * v.w;
      place.games.forEach(({ icon }, k) => icon.position.set(spots[k % 3][0], spots[k % 3][1]));
      this.drawDecor(place, v, g);
      if (!place.flowers.length) this.seedFlowers(place, v, g, i);
    });
    this.world.x = -this.page * v.w;
    this.pip.position.set(cx, v.h - 22);
    this.book.position.set(v.w - 74, v.h - 70);
    this.prev.position.set(56, v.h * 0.42);
    this.next.position.set(v.w - 56, v.h * 0.42);
    this.updateArrows();
    this.gate.layout(v);
  }

  enter() {
    music.play(STYLES.hub);
    visits++;
    void this.tw.wait(0.5).then(() => voice.say(visits === 1 ? 'hub.pick' : 'hub.again'));
  }

  update(dt: number) {
    super.update(dt);
    this.clock += dt;
    // The arrows breathe a little so they read as "you can go this way".
    const pulse = 1 + 0.06 * Math.sin(this.clock * 3);
    this.prev.scale.set(pulse);
    this.next.scale.set(pulse);
    if (session.over && !this.leaving) {
      this.leaving = true;
      this.pip.setMood('sleepy');
      sfx.yawn();
      void this.tw.wait(1.5).then(() => this.app.go.goodnight());
    }
  }

  sleepyWarning() {
    this.pip.setMood('sleepy', 3);
    sfx.yawn();
    void voice.say('sleepy.warn');
  }

  private turn(dir: number) {
    const to = Math.max(0, Math.min(this.places.length - 1, this.page + dir));
    if (to === this.page || this.leaving) return;
    this.page = lastPage = to;
    sfx.whoosh();
    this.pip.hop(0.7);
    this.tw.kill(this.world);
    void this.tw.to(this.world, { x: -to * this.view.w }, { duration: 0.6, ease: ease.inOutSine });
    this.updateArrows();
  }

  private updateArrows() {
    this.prev.visible = this.page > 0;
    this.next.visible = this.page < this.places.length - 1;
  }

  private async launch(mod: GameModule, icon: HubIcon) {
    if (this.leaving) return;
    this.leaving = true;
    sfx.whoosh();
    this.pip.cheer();
    void voice.say(mod.titleLine);
    await this.tw.to(icon.scale, { x: 1.18, y: 1.18 }, { duration: 0.15 });
    await this.tw.to(icon.scale, { x: 1, y: 1 }, { duration: 0.45, ease: ease.outElastic });
    this.app.go.game(mod.id);
  }

  /** A swipe anywhere changes place; a tap on the grass plants a flower; a tap on a game opens it. */
  private listenForSwipes() {
    this.content.eventMode = 'static';
    this.content.on('pointerdown', (e: FederatedPointerEvent) => this.pressStart(e));
    this.ground.eventMode = 'static';
    this.ground.on('pointerdown', (e: FederatedPointerEvent) => {
      const place = this.places[this.page];
      if (!place) return;
      const p = place.layer.toLocal(e.global);
      this.pressStart(e).ground = { place, x: p.x, y: p.y };
    });
    window.addEventListener('pointerup', this.lift);
    window.addEventListener('pointercancel', this.lift);
  }

  private pressStart(e: FederatedPointerEvent) {
    this.press ??= { id: e.pointerId, x: e.global.x, y: e.global.y, at: this.clock };
    return this.press;
  }

  private released(e: PointerEvent) {
    const p = this.press;
    if (!p || p.id !== e.pointerId) return;
    this.press = null;
    p.game?.icon.scale.set(1);
    if (e.type === 'pointercancel') return;
    const dx = (e.clientX - p.x) / this.view.scale;
    const dy = (e.clientY - p.y) / this.view.scale;
    if (Math.abs(dx) > 90 && Math.abs(dx) > Math.abs(dy) && this.clock - p.at < 0.9) {
      this.turn(dx < 0 ? 1 : -1);
    } else if (Math.hypot(dx, dy) < 30) {
      if (p.game) void this.launch(p.game.mod, p.game.icon);
      else if (p.ground) this.plant(p.ground.place, p.ground.x, p.ground.y, true);
    }
  }

  destroy() {
    window.removeEventListener('pointerup', this.lift);
    window.removeEventListener('pointercancel', this.lift);
    super.destroy();
  }

  private seedFlowers(place: Place, v: View, g: number, index: number) {
    const rng = new Rng(4 + index);
    const cx = v.w / 2;
    const spots = [
      [-470, v.h - 34],
      [-180, v.h - 120],
      [175, v.h - 116],
      [460, v.h - 160],
      [-150, g + 86],
      [160, g + 100],
      [-560, v.h - 110],
      [560, v.h - 50],
    ];
    for (const [dx, y] of spots) this.plant(place, cx + dx + rng.range(-20, 20), y, false);
  }

  /** Burst particles at a point inside a place, in scene coordinates. */
  private burstAt(f: Container, dy: number, colors: number[], count: number) {
    const p = this.content.toLocal(f.getGlobalPosition());
    this.particles.burst(p.x, p.y + dy, { colors, count, speed: [70, 190], gravity: 320, size: [0.2, 0.4] });
  }

  /** A flower springs up wherever the ground is tapped. */
  private plant(place: Place, x: number, y: number, byTap: boolean) {
    const f = new Flower(FLOWER_COLORS[place.flowers.length % FLOWER_COLORS.length], 15 + Math.random() * 8);
    f.position.set(x, y);
    const pitch = () => stepFromUnit(x / this.view.w, 5, 8);
    onTap(f, () => {
      f.poke();
      sfx.bell(pitch(), 0.25);
      this.burstAt(f, -40, [swatch.pink.fill, swatch.yellow.fill], 8);
    });
    place.flowers.push(this.track(f));
    // Flowers nearer the bottom stand in front; all of them stay behind the game objects.
    const flowers = place.layer.children.filter((c) => c instanceof Flower);
    const before = flowers.find((c) => c.y > y);
    place.layer.addChildAt(f, before ? place.layer.getChildIndex(before) : 1 + flowers.length);
    if (byTap) {
      f.scale.set(0);
      void this.tw.to(f.scale, { x: 1, y: 1 }, { duration: 0.5, ease: ease.outBack });
      sfx.bell(pitch(), 0.22);
      this.burstAt(f, 0, [swatch.green.fill, swatch.green.light], 8);
    }
    if (place.flowers.length > MOST_FLOWERS) {
      const old = place.flowers.shift()!;
      this.untrack(old);
      void this.tw.to(old.scale, { x: 0, y: 0 }, { duration: 0.3 }).then(() => old.destroy({ children: true }));
    }
  }

  /** A little scenery so each place feels different: a fence on the farm, hedges in the garden. */
  private drawDecor(place: Place, v: View, g: number) {
    const d = place.decor.clear();
    if (place.def.id === 'farm') {
      const y = g + 8;
      for (let x = 20; x < v.w; x += 90) d.roundRect(x - 7, y - 70, 14, 78, 5).fill(wood.fill).stroke({ width: 4, color: wood.line });
      d.roundRect(0, y - 58, v.w, 12, 5).fill(wood.fill).stroke({ width: 4, color: wood.line });
      d.roundRect(0, y - 30, v.w, 12, 5).fill(wood.fill).stroke({ width: 4, color: wood.line });
    }
    if (place.def.id === 'garden') {
      const y = g + 10;
      for (let x = 30; x < v.w; x += 120) {
        d.circle(x, y - 26, 38).circle(x + 40, y - 34, 34).circle(x + 74, y - 22, 30).fill(0x7cc463);
        d.circle(x + 24, y - 44, 6).circle(x + 60, y - 30, 6).fill(swatch.red.fill);
      }
    }
  }

  private makeSkyPokeable() {
    const sun = this.backdrop.sun;
    if (sun) {
      onTap(
        sun,
        () => {
          sun.poke();
          sfx.sparkle();
          this.particles.burst(sun.x, sun.y, { kind: 'star', colors: [swatch.yellow.fill, 0xffffff], count: 14, speed: [160, 320], gravity: 0 });
        },
        { radius: 100 },
      );
    }
    for (const cloud of this.backdrop.clouds) {
      onTap(
        cloud,
        () => {
          cloud.poke();
          sfx.whoosh();
          this.particles.burst(cloud.x, cloud.y + 30 * cloud.baseScale, {
            colors: [swatch.blue.fill, swatch.blue.light],
            count: 12,
            angle: Math.PI / 2,
            spread: 0.7,
            speed: [40, 120],
            gravity: 900,
            size: [0.2, 0.35],
            life: [0.7, 1.1],
          });
        },
        { radius: 90 },
      );
    }
  }

  private openParents() {
    voice.stop();
    openParentPanel(() => this.app.go.hub());
  }
}
