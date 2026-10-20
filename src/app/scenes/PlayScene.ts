import { Container, Graphics, Rectangle } from 'pixi.js';
import { swatch } from '../../art/palette';
import { homeBackdrop } from '../../art/home/backdrop';
import { music, STYLES } from '../../audio/music';
import { sfx } from '../../audio/sfx';
import { voice } from '../../audio/voice';
import { tuneBeats } from '../../content/creations';
import { makeCompanion, type Companion } from '../../creatures/companion';
import { BASKET, CORNER_RADIUS, playLayout } from '../../creatures/home-layout';
import { onTap } from '../../engine/input';
import { Rng } from '../../engine/random';
import { ease } from '../../engine/tween';
import type { View } from '../../engine/view';
import { store } from '../../progress/store';
import { RoundButton } from '../../ui/buttons';
import { BOARD, PLAQUE, pictureBoard, TunePlaque } from '../../ui/creation-art';
import { arrowIcon, basketIcon, houseIcon } from '../../ui/icons';
import { Scene } from '../Scene';
import { BallPlay } from './ball-play';

/**
 * Creature play at the root (RW06 slice 2, docs/rework/HOME.md#creature-play-playscene), the root's `room`: the ball to
 * throw for her friend as often as she likes, her kept picture and tune drawn from the save as the treehouse draws them,
 * and the basket to Friends. Back and Home both return Home. Nothing is kept or counted here: keeping still happens only
 * at a round's end, and the ball has no score, sticker or end.
 */
export class PlayScene extends Scene {
  private readonly backdrop = homeBackdrop();
  readonly pet: Companion = this.track(makeCompanion());
  readonly toy = this.track(new BallPlay(this.pet, new Rng(), () => void voice.say('play.fetch')));
  readonly back = new RoundButton(arrowIcon(-1), swatch.white, CORNER_RADIUS, () => this.app.go.hub());
  readonly home = new RoundButton(houseIcon(), swatch.white, CORNER_RADIUS, () => this.app.go.hub());
  readonly board = new Container();
  readonly plaque = new TunePlaque();
  readonly basket = new Container();
  /** The tune is playing (taps on the plaque wait until it ends). */
  singing = false;
  private leaving = false;

  init() {
    this.content.sortableChildren = true;
    this.backdrop.zIndex = -1e6;
    this.toy.shadow.zIndex = -1e5;
    this.content.addChild(this.backdrop, this.toy.shadow, this.pet, this.toy.ball);
    this.pet.hitArea = this.pet.touchArea(20);
    // A large friend instead of the corner guide, so a poke repeats the instruction.
    onTap(this.pet, () => {
      this.pet.poke();
      void voice.say('play.ball');
    }, { cooldown: 300 });
    const { picture, tune } = store.creations;
    this.board.addChild(pictureBoard(picture.current));
    this.plaque.set(tune.current);
    this.board.hitArea = new Rectangle(-BOARD.w / 2 - 10, -BOARD.h / 2 - 10, BOARD.w + 20, BOARD.h + 20);
    this.plaque.hitArea = new Rectangle(-PLAQUE.w / 2 - 10, -PLAQUE.h / 2 - 10, PLAQUE.w + 20, PLAQUE.h + 20);
    onTap(this.board, () => void this.viewPicture(), { cooldown: 400 });
    onTap(this.plaque, () => void this.playTune(), { cooldown: 400 });
    const art = basketIcon();
    art.scale.set(2.2);
    art.eventMode = 'none';
    this.basket.addChild(new Graphics().ellipse(0, 34, 62, 14).fill({ color: 0x000000, alpha: 0.12 }), art);
    this.basket.hitArea = new Rectangle(-BASKET.w / 2, -BASKET.h / 2, BASKET.w, BASKET.h);
    onTap(this.basket, () => void this.openFriends(), { cooldown: 500 });
    this.ui.addChild(this.board, this.plaque, this.basket, this.back, this.home);
  }

  /** Her picture, admired: it pulses and sparkles. An empty frame says what could hang there. */
  private async viewPicture() {
    if (!store.creations.picture.current) {
      void voice.say('room.picture-empty');
      this.pet.hop();
      return;
    }
    this.pet.cheer();
    sfx.sparkle();
    void voice.say('room.picture');
    this.particles.burst(this.board.x, this.board.y, { kind: 'star', colors: [swatch.yellow.fill, swatch.pink.fill, 0xffffff], count: 12, speed: [90, 210], gravity: 0, life: [0.5, 0.9] });
    await this.tw.to(this.board.scale, { x: 1.12, y: 1.12 }, { duration: 0.25 });
    await this.tw.to(this.board.scale, { x: 1, y: 1 }, { duration: 0.25 });
  }

  /** Her song plays: each beat lights its column, and her friend hops on every note. */
  async playTune() {
    if (this.singing) return;
    const tune = store.creations.tune.current;
    if (!tune) {
      void voice.say('room.tune-empty');
      this.pet.hop();
      return;
    }
    this.singing = true;
    void voice.say('room.tune');
    await this.tw.wait(0.7);
    const beats = tuneBeats(tune);
    music.duck(beats.length * 0.42 + 0.6);
    for (let col = 0; col < beats.length; col++) {
      this.plaque.lightColumn(col);
      for (const step of beats[col]) sfx.marimba(step, 0.45);
      if (beats[col].length) {
        this.pet.hop(0.6);
        this.particles.burst(this.plaque.x, this.plaque.y, { kind: 'note', colors: [swatch.yellow.fill, swatch.pink.fill, swatch.blue.fill], count: 2, speed: [40, 120], gravity: -60, life: [0.8, 1.2] });
      }
      await this.tw.wait(0.42);
    }
    this.plaque.lightColumn(-1);
    this.pet.cheer();
    this.singing = false;
  }

  /** Her friend goes to see who is in the basket, then Friends opens. */
  private async openFriends() {
    if (this.leaving) return;
    this.leaving = true;
    this.toy.frozen = true;
    this.basket.scale.set(0.9);
    sfx.pop();
    void voice.say('room.friends');
    const to = { x: this.basket.x - 120, y: this.basket.y + 40 };
    this.pet.scale.x = Math.abs(this.pet.scale.x) * (to.x >= this.pet.x ? 1 : -1);
    this.pet.hop(0.8);
    await this.tw.to(this.pet, to, { duration: Math.min(0.9, 0.25 + Math.hypot(this.pet.x - to.x, this.pet.y - to.y) / 900), ease: ease.inOutSine });
    this.pet.cheer();
    await this.tw.wait(0.5);
    this.app.go.friends();
  }

  resize(v: View) {
    const l = playLayout(v);
    this.backdrop.position.set(l.backdrop.x, l.backdrop.y);
    this.backdrop.scale.set(l.backdrop.scale);
    this.back.position.set(l.back.x, l.back.y);
    this.home.position.set(l.home.x, l.home.y);
    this.board.position.set(l.board.x, l.board.y);
    this.plaque.position.set(l.plaque.x, l.plaque.y);
    this.basket.position.set(l.basket.x, l.basket.y);
    if (this.toy.throws === 0 && !this.leaving) this.pet.position.set(l.stage.x, l.stage.y);
    this.pet.scale.set(l.stage.scale * Math.sign(this.pet.scale.x || 1), l.stage.scale);
    this.toy.place(l.floor, l.ball);
  }

  update(dt: number) {
    super.update(dt);
    this.pet.zIndex = this.pet.y;
    // The ball always draws (and takes touches) over her friend, who stops beside it.
    this.toy.ball.zIndex = 1e6;
  }

  enter() {
    music.play(STYLES.paint);
    void voice.say('play.ball');
  }
}
