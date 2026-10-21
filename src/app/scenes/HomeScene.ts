import { RAINBOW, swatch } from '../../art/palette';
import { homeBackdrop } from '../../art/home/backdrop';
import { music, STYLES } from '../../audio/music';
import { sfx } from '../../audio/sfx';
import { voice } from '../../audio/voice';
import type { LineId } from '../../content/voice-script';
import { makeCompanion, type Companion } from '../../creatures/companion';
import { ACTION_RADIUS, CORNER_RADIUS, homeLayout } from '../../creatures/home-layout';
import { onTap } from '../../engine/input';
import { Rng } from '../../engine/random';
import type { View } from '../../engine/view';
import { openParentPanel } from '../../parent/panel';
import { birthdayDue, settleWorldBand } from '../../progress/bands';
import { store } from '../../progress/store';
import { showsContinue } from '../../content/welcome';
import { RoundButton } from '../../ui/buttons';
import { gearButton } from '../../ui/grownups';
import { basketIcon, meadowIcon, peopleIcon, playWithIcon } from '../../ui/icons';
import type { App } from '../App';
import { Scene } from '../Scene';
import { BallPlay } from './ball-play';

/** Lap and toddler get the ball right here; preschool and older get Play with {pet}, which opens creature play. */
export const youngHome = () => store.data.profile.band === 'lap' || store.data.profile.band === 'toddler';

/**
 * The root's Home (RW06 slice 2, docs/rework/HOME.md#home-homescene-the-roots-hub): her companion on the R06 day
 * backdrop and RW03's per-band exits. Lap and toddler: the companion, the ball and Explore. Preschool and older: Play
 * with {pet} and Explore, and Continue above them while Welcome a New Friend is open (RW07; never drawn empty). Who's playing sits top left; Home has no Back. The
 * companion only idles and never asks for anything. Explore opens RW08's four entries (`ExploreScene`). Nothing here is a round: no sticker, no stats.
 * The grown-ups' gear is top right, held two seconds, and her birthday (her band went up) is thrown here once, as the
 * island's map throws it (RW08 slice 2).
 */
export class HomeScene extends Scene {
  private readonly backdrop = homeBackdrop();
  readonly young = youngHome();
  readonly pet: Companion = this.track(makeCompanion());
  readonly who = new RoundButton(peopleIcon(), swatch.white, CORNER_RADIUS, () => this.leave('home.who', () => this.app.go.start()));
  /** Welcome a New Friend (RW07): drawn while the project is open and hers, never empty. */
  readonly cont: RoundButton | null = !this.young && showsContinue(store.welcome, store.data.profile.band) ? new RoundButton(basketIcon(), swatch.orange, ACTION_RADIUS, () => this.leave('home.continue', () => this.app.go.project())) : null;
  readonly play: RoundButton | null = this.young ? null : new RoundButton(playWithIcon(), swatch.yellow, ACTION_RADIUS, () => this.leave('home.play', () => this.app.go.room()));
  readonly explore = new RoundButton(meadowIcon(), swatch.green, ACTION_RADIUS, () => this.leave('home.explore', () => this.app.go.explore()));
  readonly toy: BallPlay | null = this.young ? this.track(new BallPlay(this.pet, new Rng(), () => void voice.say('play.fetch'))) : null;
  /** Grown-ups' way in: hold the gear (the iPad has no Esc key, so this is the way in once a child is playing). */
  private readonly gear = gearButton({
    onOpen: () => {
      if (this.leaving) return;
      voice.stop();
      openParentPanel(() => (store.data.creatures.owned.length > 0 ? this.app.go.hub() : this.app.go.hatch()), () => this.app.go.start());
    },
    onShort: () => void voice.say('parent.ask'),
  });
  /** Her band went up since the world last saw her: a party, once. */
  readonly birthday = birthdayDue(store.data.world, store.data.profile.band);
  private leaving = false;

  constructor(app: App) {
    super(app);
  }

  init() {
    this.content.sortableChildren = true;
    this.backdrop.zIndex = -1e6;
    this.content.addChild(this.backdrop, this.pet);
    if (this.toy) this.content.addChild(this.toy.shadow, this.toy.ball);
    this.pet.hitArea = this.pet.touchArea(20);
    onTap(this.pet, () => this.pet.poke(), { cooldown: 300 });
    for (const b of [this.who, this.cont, this.play, this.explore]) if (b) this.ui.addChild(b);
    // The icon art is drawn about 60 units across; the 120-unit pictures carry it larger.
    for (const b of [this.cont, this.play, this.explore]) b?.children[1]?.scale.set(1.35);
    settleWorldBand(store.data.world, store.data.profile.band);
    store.save();
    document.body.appendChild(this.gear.el);
  }

  /** A picture's line, a hop, then the way out; a second tap while leaving does nothing. */
  private async leave(line: LineId, go: () => void) {
    if (this.leaving) return;
    this.leaving = true;
    this.gear.hide(true);
    this.pet.cheer();
    await Promise.race([voice.say(line), this.tw.wait(0.9)]);
    if (this.app.scene !== this) return;
    go();
  }

  resize(v: View) {
    const l = homeLayout(v, this.young, !!this.cont);
    this.backdrop.position.set(l.backdrop.x, l.backdrop.y);
    this.backdrop.scale.set(l.backdrop.scale);
    this.who.position.set(l.who.x, l.who.y);
    if (this.cont && l.continue) this.cont.position.set(l.continue.x, l.continue.y);
    if (this.play && l.play) this.play.position.set(l.play.x, l.play.y);
    this.explore.position.set(l.explore.x, l.explore.y);
    if (!this.toy?.chasing) this.pet.position.set(l.stage.x, l.stage.y);
    this.pet.scale.set(l.stage.scale * Math.sign(this.pet.scale.x || 1), l.stage.scale);
    if (this.toy && l.ball) this.toy.place(l.floor, l.ball);
  }

  update(dt: number) {
    super.update(dt);
    this.pet.zIndex = this.pet.y;
    if (this.toy) {
      // The ball always draws (and takes touches) over her friend, who stops beside it.
      this.toy.ball.zIndex = 1e6;
      this.toy.shadow.zIndex = -1e5;
    }
  }

  enter() {
    music.play(STYLES.hub);
    if (this.birthday) void this.party();
    else void voice.say('home.hello');
  }

  /** Her birthday, with the island's line: confetti and a cheer. */
  private async party() {
    await this.tw.wait(0.7);
    void voice.say('map.birthday');
    sfx.tada();
    this.pet.cheer();
    this.particles.burst(this.view.w / 2, this.view.h * 0.5, { kind: 'confetti', colors: RAINBOW.map((c) => swatch[c].fill), count: 70, speed: [200, 500], gravity: 160 });
  }

  destroy() {
    this.gear.destroy();
    super.destroy();
  }
}
