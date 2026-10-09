import { Container, Graphics } from 'pixi.js';
import { Critter } from '../../art/critter';
import { cream, swatch } from '../../art/palette';
import { drawEgg, petSpec } from '../../art/pet';
import { sfx } from '../../audio/sfx';
import { voice } from '../../audio/voice';
import { PET_COLORS, type PetColor } from '../../content/world';
import { onTap } from '../../engine/input';
import type { View } from '../../engine/view';
import { store } from '../../progress/store';
import { RoundButton } from '../../ui/buttons';
import { playIcon } from '../../ui/icons';
import { label } from '../../ui/text';
import { Scene } from '../Scene';
import { applySettings } from '../settings';

export class HatchScene extends Scene {
  private readonly background = new Graphics();
  private readonly egg = drawEgg(new Graphics());
  private readonly choices = new Container();
  private pip: Critter | null = null;
  private taps = 0;
  private step: 'egg' | 'color' | 'name' = 'egg';
  private readonly selected = new Graphics();
  private readonly nameLabel = label('', 42, swatch.teal.line);
  private color: PetColor = store.data.pet.color;
  private name = 'Pip';
  private readonly names = ['Pip', 'Mochi', 'Clover'];
  private form: HTMLFormElement | null = null;
  private leaving = false;
  private readonly next = new RoundButton(playIcon(), swatch.green, 58, () => this.advance());

  init() {
    this.content.addChild(this.background, this.egg, this.choices);
    this.ui.addChild(this.next, this.nameLabel);
    this.next.visible = false;
    onTap(this.egg, () => {
      if (this.step !== 'egg') return;
      this.taps++;
      sfx.pop();
      drawEgg(this.egg, this.taps);
      this.egg.rotation = (this.taps % 2 ? 1 : -1) * 0.1;
      if (this.taps === 4) {
        this.egg.visible = false;
        this.step = 'color';
        this.setPet();
        this.buildChoices();
        sfx.sparkle();
        void voice.say('hatch.color');
      }
    }, { radius: 145, cooldown: 280 });
  }

  private setPet() {
    if (this.pip) { this.untrack(this.pip); this.pip.destroy({ children: true }); }
    this.pip = this.track(new Critter({ ...petSpec(), color: this.color }));
    this.content.addChild(this.pip);
    this.resize(this.view);
    this.pip.cheer();
  }

  private buildChoices() {
    this.choices.removeChildren().forEach((c) => { if (c !== this.selected) c.destroy({ children: true }); });
    this.choices.addChild(this.selected);
    this.next.visible = true;
    if (this.step === 'color') {
      PET_COLORS.forEach((color) => {
        const g = new Graphics().circle(0, 0, 49).fill(swatch[color].fill).stroke({ width: 5, color: swatch[color].line }).circle(-15, -15, 10).fill(swatch[color].light);
        onTap(g, () => { this.color = color; this.setPet(); void voice.say(`color.${color}`); this.resize(this.view); }, { radius: 55 });
        this.choices.addChild(g);
      });
    } else {
      this.names.forEach((name) => {
        const b = new Container();
        b.addChild(new Graphics().roundRect(-110, -50, 220, 100, 45).fill(swatch.white.fill).stroke({ width: 5, color: swatch.teal.line }), label(name, 36));
        onTap(b, () => { this.name = name; void voice.say('hatch.try-name', { pet: name }); this.resize(this.view); });
        this.choices.addChild(b);
      });
      this.makeForm();
    }
    this.resize(this.view);
  }

  private makeForm() {
    this.form = document.createElement('form');
    this.form.className = 'pet-name-form';
    this.form.innerHTML = '<label for="pet-name">Grown-ups: choose another name</label><input id="pet-name" maxlength="40" autocomplete="off" placeholder="Pet name"><button type="submit">Use name</button>';
    this.form.addEventListener('submit', (e) => {
      e.preventDefault();
      const value = this.form!.querySelector('input')!.value.trim();
      if (!value) return;
      this.name = value.slice(0, 40);
      void voice.say('hatch.try-name', { pet: this.name });
      this.resize(this.view);
      this.form!.querySelector('input')!.blur();
    });
    document.body.appendChild(this.form);
  }

  private advance() {
    if (this.leaving) return;
    if (this.step === 'color') {
      this.step = 'name';
      this.buildChoices();
      void voice.say('hatch.name');
    } else if (this.step === 'name') {
      this.leaving = true;
      store.data.pet = { color: this.color, name: this.name, hatched: true };
      store.save();
      applySettings();
      void voice.say('hatch.hello');
      this.form?.remove();
      this.pip?.cheer();
      void this.tw.wait(1).then(() => this.app.go.hub());
    }
  }

  resize(v: View) {
    this.background.clear().rect(0, 0, v.w, v.h).fill(cream).ellipse(v.w / 2, v.h * 0.53, 160, 28).fill(swatch.green.light);
    this.egg.position.set(v.w / 2, v.h * 0.38);
    this.pip?.position.set(v.w / 2, v.h * 0.53);
    this.pip?.scale.set(0.8);
    this.next.position.set(v.w - 80, v.h * 0.39);
    this.nameLabel.text = this.step === 'name' ? this.name : '';
    this.nameLabel.scale.set(1);
    this.nameLabel.scale.set(Math.min(1, (v.w - 100) / Math.max(1, this.nameLabel.width)));
    this.nameLabel.position.set(v.w / 2, 70);
    this.selected.clear();
    this.choices.children.filter((c) => c !== this.selected).forEach((c, i) => {
      const x = this.step === 'color' ? v.w / 2 + ((i % 4) - 1.5) * 138 : v.w / 2 + (i - 1) * 260;
      const y = this.step === 'color' ? v.h * 0.65 + Math.floor(i / 4) * 125 : v.h * 0.68;
      c.position.set(x, y);
      if (this.step === 'color' ? PET_COLORS[i] === this.color : this.names[i] === this.name) {
        this.selected.roundRect(x - (this.step === 'color' ? 59 : 119), y - 59, this.step === 'color' ? 118 : 238, 118, 52).stroke({ width: 6, color: swatch.yellow.line });
      }
    });
  }

  enter() { void voice.say('hatch.tap'); }
  destroy() { this.form?.remove(); super.destroy(); }
}
