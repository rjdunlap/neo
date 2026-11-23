import { Container, Graphics } from 'pixi.js';
import { swatch } from '../../art/palette';
import { homeBackdrop } from '../../art/home/backdrop';
import { homeLayout } from '../../creatures/home-layout';
import { Companion, makeEgg, type EggStage } from '../../creatures/companion';
import { SPECIES } from '../../creatures/species';
import { sfx } from '../../audio/sfx';
import { voice } from '../../audio/voice';
import { PET_COLORS, type PetColor } from '../../content/world';
import { onTap } from '../../engine/input';
import type { View } from '../../engine/view';
import type { App } from '../App';
import { store } from '../../progress/store';
import { RoundButton } from '../../ui/buttons';
import { IdleCue, wobble } from '../../ui/idle-cue';
import { arrowIcon, playIcon } from '../../ui/icons';
import { label } from '../../ui/text';
import { Scene } from '../Scene';
import { applySettings } from '../settings';

/**
 * Where the hatch puts its choices and its go button, from the view's width. A wide view keeps the button at the right of
 * the plate with the choices beside it; a narrow one (a phone held upright, 768 units) centers the choices across the plate
 * and puts the button under them, with the grown-up's name field below that.
 */
export function hatchLayout(w: number, naming: boolean) {
  if (w >= 900)
    return {
      cx: (w - 160) / 2,
      namePitch: 245,
      next: { x: w - 90, y: 220 },
      page: { x: w - 90, y: 95 },
      plateH: 340,
      formTop: 300,
    };
  const next = { x: w / 2, y: naming ? 370 : 440 };
  return {
    cx: w / 2,
    namePitch: 235,
    next,
    page: { x: next.x + 180, y: next.y },
    plateH: naming ? 600 : 500,
    formTop: 450,
  };
}

/** A page of colour balls: two rows of four. Her mixed colours (paint-mixer 4) make a second page, never smaller balls. */
export const COLORS_PER_PAGE = 8;
/** Where colour ball `i` of a page stands. */
export const colorSpot = (cx: number, i: number) => ({
  x: cx + ((i % 4) - 1.5) * 138,
  y: 155 + Math.floor(i / 4) * 125,
});
/** The radius of the turn-the-page button (a 100-unit target). */
export const PAGE_RADIUS = 50;

export class HatchScene extends Scene {
  /** It has a name field, and nothing here has started yet. */
  canPause = false;
  /** Laid out for a phone held upright as well (chunk 31): a new player on a phone never has to turn it to begin. */
  upright = true;
  uprightArea = true;
  private readonly background = homeBackdrop();
  private readonly plate = new Graphics();
  private eggHeight = 260;
  private friendHeight = 0;
  /** The sprout's egg: whole, cracked after the first taps, open on the last (R08 and R18). */
  private readonly egg = new Container();
  private eggStage: EggStage | null = null;
  private readonly choices = new Container();
  private pip: Companion | null = null;
  private taps = 0;
  /** The lean a tap leaves on the egg; the quiet cue rocks it about this. */
  private tilt = 0;
  /** With nothing touched for a few seconds the egg rocks, so a silent first screen still shows what to tap (U4). */
  private readonly quiet = new IdleCue();
  private step: 'egg' | 'color' | 'name' = 'egg';
  private readonly selected = new Graphics();
  private readonly nameLabel = label('', 42, swatch.teal.line);
  /** The egg hatches a sprout (RW05): the river and the glider are met later. */
  private color: PetColor = SPECIES.sprout.color;
  /** Her colours: the eight, then any she has mixed in Paint Mixer (read from her journal when the scene opens). */
  private colors: readonly PetColor[] = PET_COLORS;
  private page = 0;
  private name: string = SPECIES.sprout.names[0];
  private readonly names = SPECIES.sprout.names;
  private form: HTMLFormElement | null = null;
  private leaving = false;
  private readonly next = new RoundButton(playIcon(), swatch.green, 58, () => this.advance());
  /** Turns to her mixed colours and back; there only when she has mixed one. */
  private readonly more = new RoundButton(arrowIcon(1), swatch.yellow, PAGE_RADIUS, () => this.turnPage());
  private readonly back = new RoundButton(arrowIcon(-1), swatch.yellow, PAGE_RADIUS, () => this.turnPage());

  constructor(
    app: App,
    private readonly quick = false,
  ) {
    super(app);
  }

  /** Four taps: whole, cracked at the first and second, open at the third, hatched at the fourth. */
  private showEgg(taps: number) {
    const stage: EggStage = taps === 0 ? 'whole' : taps < 3 ? 'crack' : 'open';
    if (stage === this.eggStage) return;
    this.eggStage = stage;
    this.egg.removeChildren().forEach((c) => c.destroy({ children: true }));
    const art = makeEgg(stage);
    const bounds = art.getLocalBounds();
    if (stage === 'whole') this.eggHeight = bounds.height;
    // All three illustrated stages share a bottom edge; keep the lifted cap's extra height.
    art.y = this.eggHeight / 2 - (bounds.y + bounds.height);
    this.egg.addChild(art);
    this.resize(this.view);
  }

  init() {
    this.colors = store.petColors;
    // Include the illustrated sprout's leaves and feet, not only its body polygon.
    const preview = new Companion({ species: 'sprout', look: { color: this.color } });
    this.friendHeight = preview.getLocalBounds().height;
    preview.destroy({ children: true });
    this.showEgg(0);
    this.content.addChild(this.background, this.egg, this.plate, this.choices);
    this.ui.addChild(this.next, this.more, this.back, this.nameLabel);
    this.next.visible = this.more.visible = this.back.visible = false;
    this.track({
      update: (dt: number) => {
        if (this.step !== 'egg' || !this.egg.visible) return;
        this.quiet.update(dt);
        this.egg.rotation = this.tilt + wobble(this.quiet.progress);
      },
    });
    if (this.quick) {
      // Old enough to choose a friend without an egg: straight to the colors.
      this.egg.visible = false;
      this.step = 'color';
      this.setPet();
      this.buildChoices();
    }
    onTap(
      this.egg,
      () => {
        if (this.step !== 'egg') return;
        this.taps++;
        sfx.pop();
        this.showEgg(this.taps);
        this.quiet.reset();
        this.tilt = (this.taps % 2 ? 1 : -1) * 0.1;
        this.egg.rotation = this.tilt;
        if (this.taps === 4) {
          this.egg.visible = false;
          this.step = 'color';
          this.setPet();
          this.buildChoices();
          sfx.sparkle();
          void voice.say('hatch.color');
        }
      },
      { radius: 145, cooldown: 280 },
    );
  }

  private setPet() {
    if (this.pip) {
      this.untrack(this.pip);
      this.pip.destroy({ children: true });
    }
    this.pip = this.track(new Companion({ species: 'sprout', look: { color: this.color } }));
    this.content.addChild(this.pip);
    this.resize(this.view);
    this.pip.cheer();
  }

  private buildChoices() {
    this.choices.removeChildren().forEach((c) => {
      if (c !== this.selected) c.destroy({ children: true });
    });
    this.choices.addChild(this.selected);
    this.next.visible = true;
    if (this.step === 'color') {
      this.pageColors.forEach((color) => {
        const g = new Graphics()
          .circle(0, 0, 49)
          .fill(swatch[color].fill)
          .stroke({ width: 5, color: swatch[color].line })
          .circle(-15, -15, 10)
          .fill(swatch[color].light);
        onTap(
          g,
          () => {
            this.color = color;
            this.setPet();
            void voice.say(`color.${color}`);
            this.resize(this.view);
          },
          { radius: 55 },
        );
        this.choices.addChild(g);
      });
    } else {
      this.names.forEach((name) => {
        const b = new Container();
        b.addChild(
          new Graphics()
            .roundRect(-110, -50, 220, 100, 45)
            .fill(swatch.white.fill)
            .stroke({ width: 5, color: swatch.teal.line }),
          label(name, 36),
        );
        onTap(b, () => {
          this.name = name;
          void voice.say('hatch.try-name', { pet: name });
          this.resize(this.view);
        });
        this.choices.addChild(b);
      });
      this.makeForm();
    }
    this.resize(this.view);
  }

  private get pages() {
    return Math.ceil(this.colors.length / COLORS_PER_PAGE);
  }

  private get pageColors() {
    return this.colors.slice(this.page * COLORS_PER_PAGE, (this.page + 1) * COLORS_PER_PAGE);
  }

  private turnPage() {
    if (this.step !== 'color' || this.pages < 2) return;
    this.page = (this.page + 1) % this.pages;
    sfx.pop();
    this.buildChoices();
  }

  private makeForm() {
    this.form = document.createElement('form');
    this.form.className = 'pet-name-form';
    this.form.innerHTML =
      '<label for="pet-name">Grown-ups: choose another name</label><input id="pet-name" maxlength="40" autocomplete="off" placeholder="Pet name"><button type="submit">Use name</button>';
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
      // The first friend; meeting it again (a second tap, a replay) changes nothing.
      store.meet('sprout', this.name, this.color, 'start');
      applySettings();
      void voice.say('hatch.hello');
      this.form?.remove();
      this.pip?.cheer();
      void this.tw.wait(1).then(() => this.app.go.hub());
    }
  }

  resize(v: View) {
    const l = homeLayout(v, false);
    this.background.position.set(l.backdrop.x, l.backdrop.y);
    this.background.scale.set(l.backdrop.scale);
    const height = this.friendHeight * l.stage.scale;
    this.egg.scale.set(height / this.eggHeight);
    this.egg.position.set(l.stage.x, l.stage.y - height / 2);
    this.pip?.position.set(l.stage.x, l.stage.y);
    this.pip?.scale.set(l.stage.scale);
    const l2 = hatchLayout(v.w, this.step === 'name');
    this.next.position.set(l2.next.x, l2.next.y);
    const paging = this.step === 'color' && this.pages > 1;
    this.more.visible = paging && this.page < this.pages - 1;
    this.back.visible = paging && this.page > 0;
    this.more.position.set(l2.page.x, l2.page.y);
    this.back.position.set(l2.page.x, l2.page.y);
    this.plate.visible = this.step !== 'egg';
    this.plate
      .clear()
      .roundRect(30, 24, v.w - 60, l2.plateH, 42)
      .fill({ color: swatch.white.fill, alpha: 0.92 })
      .stroke({ width: 3, color: swatch.teal.light });
    this.plate.eventMode = 'none';
    if (this.form) {
      this.form.style.bottom = 'auto';
      this.form.style.top = `calc(var(--safe-top) + ${l2.formTop * v.scale}px)`;
    }
    this.nameLabel.text = this.step === 'name' ? this.name : '';
    this.nameLabel.scale.set(1);
    this.nameLabel.scale.set(Math.min(1, (v.w - 100) / Math.max(1, this.nameLabel.width)));
    this.nameLabel.position.set(v.w / 2, 70);
    this.selected.clear();
    this.choices.children
      .filter((c) => c !== this.selected)
      .forEach((c, i) => {
        const spot = colorSpot(l2.cx, i);
        const x = this.step === 'color' ? spot.x : l2.cx + (i - 1) * l2.namePitch;
        const y = this.step === 'color' ? spot.y : 220;
        c.position.set(x, y);
        if (this.step === 'color' ? this.pageColors[i] === this.color : this.names[i] === this.name) {
          this.selected
            .roundRect(
              x - (this.step === 'color' ? 59 : 119),
              y - 59,
              this.step === 'color' ? 118 : 238,
              118,
              52,
            )
            .stroke({ width: 6, color: swatch.yellow.line });
        }
      });
  }

  enter() {
    void voice.say(this.quick ? 'hatch.color' : 'hatch.tap');
  }
  destroy() {
    this.form?.remove();
    super.destroy();
  }
}
