import { Container, Graphics, Sprite } from 'pixi.js';
import { makePet } from '../../art/pet';
import { cheek, ink } from '../../art/palette';
import { gradientTexture } from '../../art/scenery';
import { starPoints } from '../../art/shapes';
import { music, STYLES } from '../../audio/music';
import { sfx } from '../../audio/sfx';
import { voice } from '../../audio/voice';
import { Rng } from '../../engine/random';
import type { View } from '../../engine/view';
import { store } from '../../progress/store';
import { ParentGate } from '../../ui/ParentGate';
import { label } from '../../ui/text';
import { Scene } from '../Scene';
import { session } from '../session';

/** Screen time is up: sunset, a lullaby, and a sleeping Pip. Only a grown-up can wake things up. */
export class GoodnightScene extends Scene {
  countsTime = false;
  private readonly sky = new Sprite(gradientTexture(0x2b2e5a, 0xf7a27b));
  private readonly stars = new Container();
  private readonly moon = new Graphics();
  private readonly hills = new Graphics();
  private readonly pip = makePet();
  private readonly zzz: { t: Container; age: number }[] = [];
  private readonly gate = new ParentGate(() => this.wake());
  private clock = 0;
  private nextZ = 1.5;

  init() {
    const line = { width: 5, color: ink, cap: 'round' as const };
    this.moon
      .circle(0, 0, 56)
      .fill(0xfff1c1)
      .stroke({ width: 6, color: 0xe8d18c })
      .moveTo(-26, -2)
      .quadraticCurveTo(-18, 6, -10, -2)
      .stroke(line)
      .moveTo(10, -2)
      .quadraticCurveTo(18, 6, 26, -2)
      .stroke(line)
      .ellipse(-32, 16, 9, 5)
      .ellipse(32, 16, 9, 5)
      .fill({ color: cheek, alpha: 0.5 })
      .ellipse(0, 22, 5, 6)
      .fill(0x7a2e3e);
    this.pip.setMood('sleepy');
    this.content.addChild(this.sky, this.stars, this.moon, this.hills, this.track(this.pip));
    this.ui.addChild(this.track(this.gate));
  }

  resize(v: View) {
    this.sky.width = v.w;
    this.sky.height = v.h;
    this.moon.position.set(v.w - 240, 170);
    const ground = v.h * 0.72;
    this.hills
      .clear()
      .moveTo(0, v.h)
      .lineTo(0, ground)
      .quadraticCurveTo(v.w * 0.3, ground - 70, v.w * 0.55, ground - 10)
      .quadraticCurveTo(v.w * 0.8, ground + 40, v.w, ground - 30)
      .lineTo(v.w, v.h)
      .closePath()
      .fill(0x3d4a7a);
    this.pip.position.set(v.w / 2, v.h - 40);
    this.pip.scale.set(0.8);
    this.stars.removeChildren().forEach((c) => c.destroy());
    const rng = new Rng(9);
    for (let i = 0; i < 40; i++) {
      const s = new Graphics().poly(starPoints(rng.range(4, 9), rng.range(2, 3.5))).fill(0xfff6d0);
      s.position.set(rng.range(0, v.w), rng.range(0, ground - 80));
      this.stars.addChild(s);
    }
    this.gate.layout(v);
  }

  enter() {
    music.play(STYLES.lullaby);
    sfx.yawn();
    void this.tw.wait(1.2).then(() => voice.say('sleepy.night'));
  }

  update(dt: number) {
    super.update(dt);
    this.clock += dt;
    this.stars.children.forEach((s, i) => (s.alpha = 0.55 + 0.45 * Math.sin(this.clock * (0.8 + (i % 5) * 0.3) + i)));
    this.moon.rotation = 0.05 * Math.sin(this.clock * 0.6);

    // Little z's drift up from the sleeping pet.
    this.nextZ -= dt;
    if (this.nextZ <= 0) {
      this.nextZ = 1.6;
      const z = label('z', 30 + Math.random() * 16, 0xffffff);
      z.position.set(this.pip.x + 60, this.pip.y - 220);
      this.ui.addChild(z);
      this.zzz.push({ t: z, age: 0 });
    }
    for (const z of [...this.zzz]) {
      z.age += dt;
      z.t.x += Math.sin(z.age * 2) * 0.6;
      z.t.y -= 30 * dt;
      z.t.alpha = Math.max(0, 1 - z.age / 3);
      if (z.age > 3) {
        this.zzz.splice(this.zzz.indexOf(z), 1);
        z.t.destroy();
      }
    }
  }

  /** A grown-up woke things up: start a fresh session. */
  private wake() {
    session.start(store.data.settings.sessionMinutes);
    this.app.go.hub();
  }
}
