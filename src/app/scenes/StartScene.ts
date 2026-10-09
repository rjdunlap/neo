import { Container, Graphics, Rectangle } from 'pixi.js';
import { drawEgg, makePet } from '../../art/pet';
import { swatch } from '../../art/palette';
import { Backdrop } from '../../art/scenery';
import { audio } from '../../audio/engine';
import { sfx } from '../../audio/sfx';
import { voice } from '../../audio/voice';
import { onTap } from '../../engine/input';
import { ControllerSampler } from '../../engine/controller';
import type { View } from '../../engine/view';
import { store } from '../../progress/store';
import { RoundButton } from '../../ui/buttons';
import { playIcon } from '../../ui/icons';
import { label } from '../../ui/text';
import { Scene } from '../Scene';

/** A sleeping Pip and a big play button. The first tap anywhere wakes the sound, the voice and Pip. */
export class StartScene extends Scene {
  private backdrop!: Backdrop;
  private readonly pip = makePet();
  private readonly egg = drawEgg(new Graphics());
  private readonly title = label('Puddle Island', 76, 0x2b2b3a);
  private readonly play = new RoundButton(playIcon(), swatch.green, 78, () => this.begin());
  private readonly everywhere = new Container();
  private started = false;
  private clock = 0;
  private couchButton: HTMLButtonElement | null = null;
  private readonly controllers = new ControllerSampler();
  private readonly couchKey = (e: KeyboardEvent) => {
    if (e.code === 'KeyC' && !e.metaKey && !e.ctrlKey && !this.started) this.openCouch();
  };

  private openCouch() {
    if (this.started) return;
    this.started = true; audio.unlock(); voice.unlock(); this.app.go.couch();
  }

  init() {
    this.couchButton = document.createElement('button');
    this.couchButton.className = 'couch-entry';
    this.couchButton.textContent = 'Couch play · C / controller';
    this.couchButton.onclick = () => this.openCouch();
    document.body.append(this.couchButton);
    window.addEventListener('keydown', this.couchKey);
    this.backdrop = this.track(
      new Backdrop({ sky: [0x8fd3f7, 0xe9f7ff], hills: [0xc8ecb0, 0xaee39a, 0x9edb86], horizon: 0.62, clouds: 3, sun: true, seed: 12 }, this.view),
    );
    this.title.style.stroke = { color: 0xffffff, width: 10, join: 'round' };
    this.pip.setMood('sleepy');
    onTap(this.everywhere, () => this.begin());
    this.pip.visible = store.data.pet.hatched;
    this.egg.visible = !store.data.pet.hatched;
    this.content.addChild(this.backdrop, this.everywhere, this.track(this.pip), this.egg);
    this.ui.addChild(this.title, this.play);
  }

  resize(v: View) {
    this.backdrop.resize(v);
    this.everywhere.hitArea = new Rectangle(0, 0, v.w, v.h);
    this.title.position.set(v.w / 2, v.h * 0.17);
    this.play.position.set(v.w / 2, v.h * 0.4);
    this.pip.position.set(v.w / 2, v.h - 40);
    this.pip.scale.set(0.95);
    this.egg.position.set(v.w / 2, v.h - 180);
  }

  update(dt: number) {
    super.update(dt);
    this.clock += dt;
    if (!this.started && this.clock > 0.35) {
      try {
        const input = this.controllers.sample([...(navigator.getGamepads?.() ?? [])], new Set());
        if (input.players.some(p => p.action)) this.openCouch();
      } catch { /* Bluetooth/gamepad access may be restricted; the button and C key still work. */ }
    }
    if (!this.started) this.play.scale.set(1 + 0.05 * Math.sin(this.clock * 4));
  }

  private begin() {
    if (this.started) return;
    this.started = true;
    this.couchButton?.remove();
    // Both must happen inside this tap, or iOS keeps the game silent.
    audio.unlock();
    voice.unlock();

    this.pip.setMood('happy');
    this.pip.cheer();
    sfx.giggle();
    void this.tw.to(this.play.scale, { x: 0, y: 0 }, { duration: 0.25 });
    void voice.say('start.hi');
    // Straight to her own place on the trail; the island button leads to the whole map.
    void this.tw.wait(1.6).then(() => (store.data.pet.hatched ? this.app.go.place(store.data.profile.band) : this.app.go.hatch()));
  }

  destroy() {
    this.couchButton?.remove(); window.removeEventListener('keydown', this.couchKey); super.destroy();
  }
}
