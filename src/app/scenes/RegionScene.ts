import { Circle, Container, Graphics, Rectangle } from 'pixi.js';
import { swatch, wood, type ColorName } from '../../art/palette';
import { makePet } from '../../art/pet';
import { Backdrop } from '../../art/scenery';
import { flower } from '../../art/shapes';
import { music, STYLES } from '../../audio/music';
import { sfx } from '../../audio/sfx';
import { voice } from '../../audio/voice';
import { regionById } from '../../content/regions';
import type { RegionId } from '../../content/world';
import { onTap } from '../../engine/input';
import type { View } from '../../engine/view';
import { GAMES } from '../../games/registry';
import type { GameModule, HubIcon } from '../../games/types';
import { store } from '../../progress/store';
import { RoundButton } from '../../ui/buttons';
import { arrowIcon, islandIcon } from '../../ui/icons';
import { label } from '../../ui/text';
import type { App } from '../App';
import { Scene } from '../Scene';
import { session } from '../session';
import { regionPage } from '../region-pages';

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

/** The page each region was last left on, so coming home from a game lands where it started. */
const lastPage = new Map<RegionId, number>();

/** One island region, preserving the hub's large game spots and pokeable flowers. */
export class RegionScene extends Scene {
  private backdrop!: Backdrop;
  private readonly ground = new Container();
  private readonly decor = new Graphics();
  private readonly flowers: Flower[] = [];
  private readonly games: { mod: GameModule; icon: HubIcon }[] = [];
  private readonly pip = makePet();
  private readonly home = new RoundButton(islandIcon(), swatch.white, 50, () => this.app.go.hub());
  private readonly heading = label('', 36);
  private readonly previous = new RoundButton(arrowIcon(-1), swatch.white, 50, () => this.turnPage(-1));
  private readonly next = new RoundButton(arrowIcon(1), swatch.white, 50, () => this.turnPage(1));
  private readonly dots = new Graphics();
  private page: number;
  private leaving = false;

  constructor(app: App, readonly region: RegionId) {
    super(app);
    this.page = lastPage.get(region) ?? 0;
  }

  init() {
    const def = regionById(this.region);
    this.heading.text = def.name;
    this.backdrop = this.track(new Backdrop(def.backdrop, this.view));
    this.content.addChild(this.backdrop, this.decor, this.ground);
    onTap(this.ground, (e) => {
      const p = this.ground.toLocal(e.global);
      this.plant(p.x, p.y);
    });
    for (const mod of GAMES.filter((g) => g.region === this.region && g.bands.includes(store.data.profile.band))) {
      const icon = this.track(mod.hubIcon());
      const b = icon.getLocalBounds();
      icon.hitArea = new Rectangle(b.x - 24, b.y - 24, Math.max(100, b.width + 48), Math.max(100, b.height + 48));
      onTap(icon, () => {
        if (this.leaving) return;
        this.leaving = true;
        this.pip.cheer();
        void voice.say(mod.titleLine);
        sfx.whoosh();
        void this.tw.to(icon.scale, { x: 1.12, y: 1.12 }, { duration: 0.2 }).then(() => this.app.go.game(mod.id));
      });
      this.games.push({ mod, icon });
      this.content.addChild(icon);
    }
    this.pip.scale.set(0.55);
    this.pip.hitArea = new Circle(0, -120, 155);
    onTap(this.pip, () => { this.pip.poke(); void voice.say('hub.pick'); });
    this.content.addChild(this.track(this.pip));
    this.ui.addChild(this.home, this.heading, this.previous, this.next, this.dots);
    if (this.backdrop.sun) onTap(this.backdrop.sun, () => { this.backdrop.sun!.poke(); sfx.sparkle(); }, { radius: 100 });
    this.backdrop.clouds.forEach((c) => onTap(c, () => { c.poke(); sfx.whoosh(); }, { radius: 90 }));
  }

  resize(v: View) {
    this.backdrop.resize(v);
    const ground = this.backdrop.groundY;
    this.ground.hitArea = new Rectangle(0, ground, v.w, v.h - ground);
    this.home.position.set(65, 65);
    this.heading.position.set(v.w / 2, 65);
    const p = regionPage(this.games.length, this.page);
    this.page = p.page;
    const spots = p.end - p.start === 1 ? [[v.w / 2, v.h - 100]] : [[v.w * 0.28, v.h - 85], [v.w * 0.72, v.h - 85]];
    this.games.forEach(({ icon }, i) => {
      icon.visible = i >= p.start && i < p.end;
      if (icon.visible) icon.position.set(...spots[i - p.start] as [number, number]);
    });
    this.previous.position.set(v.w - 185, 65); this.next.position.set(v.w - 65, 65);
    this.previous.visible = p.page > 0; this.next.visible = p.page < p.pages - 1;
    this.dots.clear();
    if (p.pages > 1) for (let i = 0; i < p.pages; i++) this.dots.circle(v.w / 2 + (i - (p.pages - 1) / 2) * 30, 120, 8).fill(i === p.page ? swatch.teal.line : swatch.white.fill).stroke({ width: 3, color: swatch.teal.line });
    this.pip.position.set(92, v.h - 12);
    const d = this.decor.clear();
    const def = regionById(this.region);
    if (def.decor === 'farm') {
      for (let x = 20; x < v.w; x += 90) d.roundRect(x, ground - 55, 14, 80, 5).fill(wood.fill).stroke({ width: 3, color: wood.line });
      d.roundRect(0, ground - 38, v.w, 12, 5).roundRect(0, ground - 8, v.w, 12, 5).fill(wood.fill).stroke({ width: 3, color: wood.line });
    }
    if (def.decor === 'garden') for (let x = 25; x < v.w; x += 120) d.circle(x, ground - 8, 38).circle(x + 44, ground - 16, 32).fill(swatch.green.fill);
    if (!this.flowers.length) for (let i = 0; i < 8; i++) this.plant(180 + (i / 8) * (v.w - 220), ground + 70 + (i % 3) * 70, false);
    this.flowers.forEach((f) => { f.x = Math.min(v.w - 25, f.x); f.y = Math.min(v.h - 20, f.y); });
  }

  private turnPage(direction: number) {
    if (this.leaving) return;
    this.page = regionPage(this.games.length, this.page + direction).page;
    lastPage.set(this.region, this.page);
    this.resize(this.view);
    void voice.say('region.more');
  }

  private plant(x: number, y: number, sound = true) {
    const colors: ColorName[] = ['pink', 'purple', 'orange', 'red', 'blue'];
    const f = this.track(new Flower(colors[this.flowers.length % colors.length], 20));
    f.position.set(x, y);
    onTap(f, (e) => { e.stopPropagation(); f.poke(); sfx.bell(5 + this.flowers.indexOf(f) % 5, 0.2); });
    this.ground.addChild(f);
    this.flowers.push(f);
    if (sound) { f.poke(); sfx.bell(6, 0.2); }
    if (this.flowers.length > 18) { const old = this.flowers.shift()!; this.untrack(old); old.destroy({ children: true }); }
  }

  enter() { music.play(STYLES.hub); void voice.say('hub.pick'); }
  update(dt: number) {
    super.update(dt);
    if (session.over && !this.leaving) { this.leaving = true; this.app.go.goodnight(); }
  }
  sleepyWarning() { this.pip.setMood('sleepy', 3); void voice.say('sleepy.warn'); }
  exit() { voice.stop(); }
}
