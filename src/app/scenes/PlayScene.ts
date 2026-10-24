import { Container, Graphics, Rectangle } from 'pixi.js';
import { swatch, wood } from '../../art/palette';
import { homeBackdrop } from '../../art/home/backdrop';
import { music, STYLES } from '../../audio/music';
import { sfx } from '../../audio/sfx';
import { voice } from '../../audio/voice';
import { welcomeFriend } from '../../content/welcome';
import { Companion, makeCompanion } from '../../creatures/companion';
import { BASKET, BED, CORNER_RADIUS, playLayout } from '../../creatures/home-layout';
import { onTap } from '../../engine/input';
import { Rng } from '../../engine/random';
import { ease } from '../../engine/tween';
import type { View } from '../../engine/view';
import { store } from '../../progress/store';
import { RoundButton } from '../../ui/buttons';
import { BOARD, PLAQUE, pictureBoard, singTune, TunePlaque } from '../../ui/creation-art';
import { arrowIcon, basketIcon, houseIcon, libraryIcon } from '../../ui/icons';
import { Scene } from '../Scene';
import { BallPlay } from './ball-play';

/**
 * Creature play at the root (RW06 slice 2, docs/rework/HOME.md#creature-play-playscene), the root's `room`: the ball to
 * throw for her friend as often as she likes, her kept picture and tune drawn from the save as the treehouse draws them,
 * the basket to Friends and the books to the library (RW08 slice 2). Back and Home both return Home. Nothing is kept or counted here: keeping still happens only
 * at a round's end, and the ball has no score, sticker or end.
 */
export class PlayScene extends Scene {
  private readonly backdrop = homeBackdrop();
  readonly pet: Companion = this.track(makeCompanion());
  readonly toy = this.track(new BallPlay(this.pet, new Rng(), () => void voice.say('play.fetch')));
  readonly back = new RoundButton(arrowIcon(-1), swatch.white, CORNER_RADIUS, () => this.app.go.hub()).means('back');
  readonly home = new RoundButton(houseIcon(), swatch.white, CORNER_RADIUS, () => this.app.go.hub()).means('home');
  readonly board = new Container();
  readonly plaque = new TunePlaque();
  readonly basket = new Container();
  /** The books on their shelf: the library (RW08 slice 2), with the journal and the stories. */
  readonly books = new Container();
  /**
   * Welcome a New Friend's basket bed (RW07 slice 3), drawn once the project has adopted its newcomer: her project picture
   * over it and the newcomer curled inside, unless the newcomer is now her companion (then the bed waits, empty). Null
   * before the project ends. Nothing here asks, waits or wears out.
   */
  readonly bed: Container | null;
  /** The newcomer asleep in the bed, or null when the bed is empty. */
  readonly sleeper: Companion | null = null;
  private readonly bedName: string;
  /** The tune is playing (taps on the plaque wait until it ends). */
  singing = false;
  private leaving = false;

  constructor(...args: ConstructorParameters<typeof Scene>) {
    super(...args);
    const friend = welcomeFriend(store.data.creatures.owned);
    this.bedName = friend?.name ?? '';
    this.bed = friend ? new Container() : null;
    if (friend && store.data.creatures.companion !== friend.id) {
      this.sleeper = this.track(new Companion({ species: friend.species, look: friend.look, id: friend.id }));
    }
  }

  /** The bed: a basket on the lower part with the newcomer curled in it, her project picture propped on the upper part. */
  private buildBed(bed: Container) {
    const top = -BED.h / 2;
    const rim = top + BED.picture + 30;
    const board = pictureBoard(store.welcome.results.pretty ?? null);
    board.scale.set(Math.min((BED.w - 20) / 260, (BED.picture - 10) / 200));
    board.position.set(0, top + BED.picture / 2);
    board.eventMode = 'none';
    const back = new Graphics().ellipse(0, rim, 84, 26).fill(wood.line);
    const front = new Graphics()
      .poly([-88, rim, 88, rim, 70, BED.h / 2 - 6, -70, BED.h / 2 - 6]).fill(wood.fill).stroke({ width: 5, color: wood.line })
      .moveTo(-80, rim + 28).lineTo(80, rim + 28).moveTo(-75, rim + 52).lineTo(75, rim + 52).stroke({ width: 3, color: wood.line });
    bed.addChild(board, back);
    if (this.sleeper) {
      this.sleeper.scale.set(0.5);
      this.sleeper.position.set(0, rim + 6);
      this.sleeper.setMood('sleepy');
      bed.addChild(this.sleeper);
    }
    bed.addChild(front);
    for (const c of bed.children) c.eventMode = 'none';
    // Two taps: the picture (whose bed it is) and the basket (wake whoever sleeps there).
    const picture = new Container();
    picture.hitArea = new Rectangle(-BED.w / 2, top, BED.w, BED.picture);
    onTap(picture, () => void voice.say('welcome.bed', { new: this.bedName }), { cooldown: 400 });
    const basket = new Container();
    basket.hitArea = new Rectangle(-BED.w / 2, top + BED.picture, BED.w, BED.h - BED.picture);
    onTap(basket, () => void this.wake(), { cooldown: 400 });
    bed.addChild(picture, basket);
  }

  /** The newcomer wakes with a chirp and sings its project tune (or hums); an empty bed says it is ready for a nap. */
  async wake() {
    if (!this.sleeper) {
      void voice.say('welcome.bed-empty', { new: this.bedName });
      return;
    }
    if (this.singing) return;
    this.singing = true;
    const who = this.sleeper;
    who.poke();
    who.setMood('happy', 3);
    await this.tw.wait(0.5);
    const tune = store.welcome.results.song;
    if (tune) {
      await singTune(tune, (t) => this.tw.wait(t), (_col, steps) => {
        if (steps.length) who.hop(0.4);
      });
    } else {
      await Promise.race([voice.say('welcome.done.song-hum'), this.tw.wait(4)]);
    }
    who.setMood('sleepy');
    this.singing = false;
  }

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
    const shelf = libraryIcon();
    shelf.scale.set(1.9);
    shelf.eventMode = 'none';
    this.books.addChild(shelf);
    this.books.hitArea = new Rectangle(-BASKET.w / 2, -BASKET.h / 2, BASKET.w, BASKET.h);
    onTap(this.books, () => void this.openLibrary(), { cooldown: 500 });
    this.ui.addChild(this.board, this.plaque, this.basket, this.books, this.back, this.home);
    if (this.bed) {
      this.buildBed(this.bed);
      this.ui.addChild(this.bed);
    }
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
    await singTune(tune, (t) => this.tw.wait(t), (col, steps) => {
      this.plaque.lightColumn(col);
      if (!steps.length) return;
      this.pet.hop(0.6);
      this.particles.burst(this.plaque.x, this.plaque.y, { kind: 'note', colors: [swatch.yellow.fill, swatch.pink.fill, swatch.blue.fill], count: 2, speed: [40, 120], gravity: -60, life: [0.8, 1.2] });
    });
    this.plaque.lightColumn(-1);
    this.pet.cheer();
    this.singing = false;
  }

  /** The books squish and her friend cheers, then the library opens. */
  private async openLibrary() {
    if (this.leaving) return;
    this.leaving = true;
    this.toy.frozen = true;
    this.books.scale.set(0.9);
    sfx.pop();
    this.pet.cheer();
    await Promise.race([voice.say('play.library'), this.tw.wait(1)]);
    if (this.app.scene !== this) return;
    this.app.go.library();
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
    this.books.position.set(l.books.x, l.books.y);
    this.bed?.position.set(l.bed.x, l.bed.y);
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
