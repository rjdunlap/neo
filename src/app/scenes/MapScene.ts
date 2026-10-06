import { Circle, Container, Graphics } from 'pixi.js';
import { cream, grass, ink, RAINBOW, swatch } from '../../art/palette';
import { makePet } from '../../art/pet';
import { puffs } from '../../art/shapes';
import { music, STYLES } from '../../audio/music';
import { sfx } from '../../audio/sfx';
import { voice } from '../../audio/voice';
import { REGIONS, type Region } from '../../content/regions';
import { onTap } from '../../engine/input';
import { ease } from '../../engine/tween';
import type { View } from '../../engine/view';
import { GAMES } from '../../games/registry';
import { openParentPanel } from '../../parent/panel';
import { BANDS } from '../../progress/bands';
import { store } from '../../progress/store';
import { RoundButton } from '../../ui/buttons';
import { bookIcon } from '../../ui/icons';
import { ParentGate } from '../../ui/ParentGate';
import { label } from '../../ui/text';
import { Scene } from '../Scene';
import { session } from '../session';

export class MapScene extends Scene {
  private readonly sea = new Graphics();
  private readonly island = new Graphics();
  private readonly map = new Container();
  private readonly pip = makePet();
  private readonly title = label('Puddle Island', 42, ink);
  private readonly book = new RoundButton(bookIcon(), swatch.white, 52, () => this.app.go.stickers());
  private readonly gate = new ParentGate(() => {
    voice.stop();
    this.countsTime = false;
    openParentPanel(() => store.data.pet.hatched ? this.app.go.hub() : this.app.go.hatch());
  });
  private readonly places: { def: Region; node: Container; cloud: Graphics; available: boolean; reveal: boolean }[] = [];
  private leaving = false;
  private birthday = false;

  init() {
    const { world, profile } = store.data;
    const rank = (band: typeof profile.band | null) => BANDS.findIndex((b) => b.id === band);
    this.birthday = world.band !== null && rank(profile.band) > rank(world.band);
    this.map.addChild(this.island);
    this.content.addChild(this.sea, this.map);
    for (const def of REGIONS) {
      const available = GAMES.some((g) => g.region === def.id && g.bands.includes(profile.band));
      const reveal = this.birthday && available && !world.opened.includes(def.id);
      const node = new Container();
      node.addChild(new Graphics().ellipse(0, 36, 83, 33).fill(cream), def.landmark());
      const name = label(def.name, 19, ink);
      name.y = 80;
      node.addChild(name);
      const cloud = puffs(new Graphics(), [[-44, 5, 40], [0, -18, 55], [43, 9, 43]], swatch.white.fill, swatch.blue.light, 7);
      cloud.visible = !available || reveal;
      name.visible = available;
      node.addChild(cloud);
      onTap(node, () => {
        if (this.leaving) return;
        if (available && !cloud.visible) void this.visit(def, node);
        else {
          sfx.whoosh();
          void voice.say('map.cloud');
          this.tw.kill(cloud.scale);
          void this.tw.to(cloud.scale, { x: 1.15, y: 1.15 }, { duration: 0.12 }).then(() => this.tw.to(cloud.scale, { x: 1, y: 1 }, { duration: 0.4 }));
          this.particles.burst(node.x, node.y, { colors: [swatch.blue.light], count: 10, gravity: 100 });
        }
      }, { radius: 85 });
      this.places.push({ def, node, cloud, available, reveal });
      this.map.addChild(node);
      if (available && !world.opened.includes(def.id)) world.opened.push(def.id);
    }
    if (rank(profile.band) > rank(world.band)) world.band = profile.band;
    store.save();
    this.pip.scale.set(0.43);
    onTap(this.pip, () => { this.pip.hop(); void voice.say('map.pick'); });
    this.pip.hitArea = new Circle(0, -100, 155);
    this.map.addChild(this.track(this.pip));
    this.ui.addChild(this.title, this.book, this.track(this.gate));
  }

  resize(v: View) {
    this.sea.clear().rect(0, 0, v.w, v.h).fill(swatch.blue.light);
    for (let i = 0; i < 12; i++) this.sea.ellipse((i * 193) % v.w, 140 + (i * 127) % (v.h - 180), 40, 6).fill({ color: swatch.white.fill, alpha: 0.5 });
    this.island.clear().ellipse(v.w / 2, v.h / 2 + 22, v.w * 0.48, v.h * 0.40).fill(cream).ellipse(v.w / 2, v.h / 2 + 10, v.w * 0.455, v.h * 0.375).fill(grass);
    this.places.forEach(({ def, node }) => node.position.set(115 + def.x * (v.w - 230), 165 + def.y * (v.h - 360)));
    this.pip.position.set(100, v.h - 8);
    this.title.position.set(v.w / 2, 58);
    this.book.position.set(v.w - 75, v.h - 70);
    this.gate.layout(v);
  }

  enter() {
    music.play(STYLES.hub);
    if (this.birthday) void this.party();
    else void voice.say('map.pick');
  }

  private async party() {
    await this.tw.wait(0.7);
    void voice.say('map.birthday');
    sfx.tada();
    this.pip.cheer();
    this.particles.burst(this.view.w / 2, this.view.h * 0.55, { kind: 'confetti', colors: RAINBOW.map((c) => swatch[c].fill), count: 70, speed: [200, 500], gravity: 160 });
    for (const place of this.places.filter((p) => p.reveal)) {
      void this.tw.to(place.cloud, { alpha: 0, x: 80 }, { duration: 1.4 }).then(() => { place.cloud.visible = false; });
    }
  }

  private async visit(def: Region, node: Container) {
    this.leaving = true;
    this.ui.eventMode = 'none';
    void voice.say(def.line);
    this.pip.hop(1.5);
    await this.tw.to(this.pip, { x: node.x, y: node.y + 68 }, { duration: 0.65, ease: ease.inOutSine });
    sfx.whoosh();
    this.map.pivot.set(node.x, node.y);
    this.map.position.set(node.x, node.y);
    await this.tw.to(this.map.scale, { x: 1.5, y: 1.5 }, { duration: 0.4 });
    this.app.go.region(def.id);
  }

  update(dt: number) {
    super.update(dt);
    if (session.over && this.countsTime && !this.leaving) {
      this.leaving = true;
      this.app.go.goodnight();
    }
  }

  sleepyWarning() { this.pip.setMood('sleepy', 3); void voice.say('sleepy.warn'); }
  exit() { voice.stop(); }
}
