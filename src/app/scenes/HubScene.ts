import { Circle, Container, Graphics, Rectangle } from 'pixi.js';
import { Critter, CRITTERS } from '../../art/critter';
import { swatch, type ColorName } from '../../art/palette';
import { Backdrop } from '../../art/scenery';
import { flower } from '../../art/shapes';
import { music, STYLES } from '../../audio/music';
import { stepFromUnit } from '../../audio/notes';
import { sfx } from '../../audio/sfx';
import { voice } from '../../audio/voice';
import { onTap } from '../../engine/input';
import { Rng } from '../../engine/random';
import { ease } from '../../engine/tween';
import type { View } from '../../engine/view';
import { GAMES } from '../../games/registry';
import type { GameModule, HubIcon } from '../../games/types';
import { openParentPanel } from '../../parent/panel';
import { RoundButton } from '../../ui/buttons';
import { bookIcon } from '../../ui/icons';
import { ParentGate } from '../../ui/ParentGate';
import { Scene } from '../Scene';
import { session } from '../session';

const FLOWER_COLORS: ColorName[] = ['pink', 'purple', 'red', 'blue', 'orange'];
const MOST_FLOWERS = 24;
let visits = 0;

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
 * The home meadow: Pip in the middle, one big object per game, and lots of things to poke.
 * Hold both top corners for the parent zone.
 */
export class HubScene extends Scene {
  private backdrop!: Backdrop;
  private readonly pip = new Critter(CRITTERS.pip);
  private readonly icons: { mod: GameModule; icon: HubIcon }[] = [];
  private readonly flowers: Flower[] = [];
  private readonly ground = new Container();
  private readonly flowerLayer = new Container();
  private readonly book = new RoundButton(bookIcon(), swatch.white, 50, () => this.app.go.stickers());
  private readonly gate = new ParentGate(() => this.openParents());
  private leaving = false;
  private lastPipLine = -10;
  private clock = 0;

  init() {
    this.backdrop = this.track(
      new Backdrop({ sky: [0x8fd3f7, 0xe9f7ff], hills: [0xc8ecb0, 0xaee39a, 0x9edb86], horizon: 0.6, clouds: 4, sun: true, seed: 12 }, this.view),
    );
    this.ground.eventMode = 'static';
    this.ground.on('pointerdown', (e) => {
      const p = this.ground.toLocal(e.global);
      this.plant(p.x, p.y, true);
    });
    this.content.addChild(this.backdrop, this.ground, this.flowerLayer);
    this.makeSkyPokeable();

    for (const mod of GAMES) {
      const icon = this.track(mod.hubIcon());
      const b = icon.getLocalBounds();
      onTap(icon, () => void this.launch(mod, icon), { cooldown: 800 });
      icon.hitArea = new Rectangle(b.x - 24, b.y - 24, b.width + 48, b.height + 48);
      this.icons.push({ mod, icon });
      this.content.addChild(icon);
    }

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
    this.ui.addChild(this.book, this.track(this.gate));
  }

  resize(v: View) {
    this.backdrop.resize(v);
    const cx = v.w / 2;
    const g = this.backdrop.groundY;
    this.ground.hitArea = new Rectangle(0, g - 20, v.w, v.h - g + 20);
    const spots = [
      [cx - 320, v.h - 64],
      [cx + 320, v.h - 64],
      [cx, g + 26],
    ];
    this.icons.forEach(({ icon }, i) => icon.position.set(spots[i % spots.length][0], spots[i % spots.length][1]));
    this.pip.position.set(cx, v.h - 22);
    this.book.position.set(v.w - 74, v.h - 70);
    this.gate.layout(v);
    if (this.flowers.length === 0) {
      const rng = new Rng(4);
      const places = [
        [-470, v.h - 34],
        [-180, v.h - 120],
        [175, v.h - 116],
        [460, v.h - 160],
        [-150, g + 86],
        [160, g + 100],
        [-560, v.h - 110],
        [560, v.h - 50],
      ];
      for (const [dx, y] of places) this.plant(cx + dx + rng.range(-20, 20), y, false);
    }
  }

  enter() {
    music.play(STYLES.hub);
    visits++;
    void this.tw.wait(0.5).then(() => voice.say(visits === 1 ? 'hub.pick' : 'hub.again'));
  }

  update(dt: number) {
    super.update(dt);
    this.clock += dt;
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

  /** A flower springs up wherever the ground is tapped. */
  private plant(x: number, y: number, byTap: boolean) {
    const f = new Flower(FLOWER_COLORS[this.flowers.length % FLOWER_COLORS.length], 15 + Math.random() * 8);
    f.position.set(x, y);
    onTap(f, () => {
      f.poke();
      sfx.bell(stepFromUnit(f.x / this.view.w, 5, 8), 0.25);
      this.particles.burst(f.x, f.y - 40, { colors: [swatch.pink.fill, swatch.yellow.fill], count: 8, speed: [80, 200], gravity: 300, size: [0.25, 0.4] });
    });
    this.flowers.push(this.track(f));
    // Keep the ones nearer the bottom in front.
    const at = this.flowerLayer.children.findIndex((c) => c.y > y);
    if (at < 0) this.flowerLayer.addChild(f);
    else this.flowerLayer.addChildAt(f, at);
    if (byTap) {
      f.scale.set(0);
      void this.tw.to(f.scale, { x: 1, y: 1 }, { duration: 0.5, ease: ease.outBack });
      sfx.bell(stepFromUnit(x / this.view.w, 5, 8), 0.22);
      this.particles.burst(x, y, { colors: [swatch.green.fill, swatch.green.light], count: 8, speed: [60, 160], gravity: 400, size: [0.2, 0.35] });
    }
    if (this.flowers.length > MOST_FLOWERS) {
      const old = this.flowers.shift()!;
      this.untrack(old);
      void this.tw.to(old.scale, { x: 0, y: 0 }, { duration: 0.3 }).then(() => old.destroy({ children: true }));
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
