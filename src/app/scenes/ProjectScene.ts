import { Container, Graphics, Rectangle } from 'pixi.js';
import { cream, swatch, wood } from '../../art/palette';
import { sfx } from '../../audio/sfx';
import { homeBackdrop } from '../../art/home/backdrop';
import { music, STYLES } from '../../audio/music';
import { voice } from '../../audio/voice';
import { builtSteps, newcomerFor, nextWelcomeStep, WELCOME_PLAN, welcomeBand, welcomeDoneLine, welcomeFriend, welcomeReady, type WelcomeBand, type WelcomeStep } from '../../content/welcome';
import { Companion, makeCompanion } from '../../creatures/companion';
import { SPECIES } from '../../creatures/species';
import { CORNER_RADIUS, ENDING_PICTURE, ENDING_PLATES, endingLayout, NAME_BUTTON, NEWCOMER_REACH, PROJECT_CARD, PROJECT_PLAY_RADIUS } from '../../creatures/home-layout';
import { onTap } from '../../engine/input';
import type { View } from '../../engine/view';
import { store } from '../../progress/store';
import { RoundButton } from '../../ui/buttons';
import { PLAQUE, pictureBoard, singTune, TunePlaque } from '../../ui/creation-art';
import { arrowIcon, checkIcon, frameIcon, houseIcon, playIcon } from '../../ui/icons';
import { label } from '../../ui/text';
import type { App } from '../App';
import { Scene } from '../Scene';

interface Card {
  step: WelcomeStep;
  node: Container;
  play: RoundButton;
}

/**
 * Welcome a New Friend's page (RW07 slices 1–3, docs/rework/WELCOME-BUILD.md#routes-and-scenes), reached from Home's
 * Continue. The newcomer peeks from its basket; each built step is a card. The first tap on a card speaks its ask and
 * raises its green Play arrow; Play opens the round at the project's level. A finished card is ticked and shows what
 * the round made: her picture, the plates the round guaranteed, or her tune. Coming back from a finished round speaks that step's
 * done line. With every step done the page plays the ending instead (slice 3): the companion leads the newcomer in under
 * her picture, her tune plays (or the two hum), and she taps one of three names, then the green arrow, which adopts the
 * newcomer and ends the project in one write. Leaving before the arrow keeps nothing. Nothing here is a round, and
 * nothing is stored until a round finishes or the arrow is pressed.
 */
export class ProjectScene extends Scene {
  private readonly backdrop = homeBackdrop();
  private readonly back = new RoundButton(arrowIcon(-1), swatch.white, CORNER_RADIUS, () => this.leave());
  private readonly home = new RoundButton(houseIcon(), swatch.white, CORNER_RADIUS, () => this.leave());
  private readonly basket = new Container();
  readonly newcomer: Companion;
  readonly cards: Card[] = [];
  /** The step whose Play arrow is up. */
  raised: WelcomeStep | null = null;
  private leaving = false;
  /** The ending's stage: off, the newcomer arriving, the names up, or adopted. */
  ending: 'off' | 'arriving' | 'naming' | 'joined' = 'off';
  /** The ending's name buttons, the name she last tapped and the green arrow (up once she has tapped one). */
  readonly names: { name: string; node: Container }[] = [];
  chosen: string | null = null;
  readonly arrow = new RoundButton(playIcon(), swatch.green, PROJECT_PLAY_RADIUS, () => void this.adopt());
  /** Who leads the newcomer in: her companion, walking from the right into `lead`'s spot. */
  private guide: Companion | null = null;
  private readonly lead = new Container();
  private readonly picture = new Container();
  private readonly plates = new Container();
  private readonly marks = new Graphics();
  private singing = false;

  constructor(
    app: App,
    /** The step whose round just finished, for its done line. */
    private readonly from?: WelcomeStep,
  ) {
    super(app);
    const p = store.welcome;
    const species = p.newcomer ?? newcomerFor(store.data.creatures.owned);
    this.newcomer = this.track(new Companion({ species, look: { color: SPECIES[species].color } }));
  }

  /** The project's band, or the one a first launch would fix. */
  private get band(): WelcomeBand {
    return welcomeBand(store.welcome, store.data.profile.band) ?? 'preschool';
  }

  init() {
    this.content.addChild(this.backdrop, this.basket);
    // The newcomer peeks over the basket's rim, shy: its body is behind the front weave.
    const back = new Graphics().ellipse(0, -10, 120, 46).fill(wood.line);
    const front = new Graphics()
      .poly([-130, -10, 130, -10, 105, 80, -105, 80]).fill(wood.fill).stroke({ width: 6, color: wood.line })
      .moveTo(-120, 25).lineTo(120, 25).moveTo(-112, 55).lineTo(112, 55).stroke({ width: 4, color: wood.line });
    this.newcomer.scale.set(0.8);
    this.newcomer.position.set(0, 30);
    this.newcomer.setMood('calm');
    this.basket.addChild(back, this.newcomer, front);
    this.basket.hitArea = new Rectangle(-NEWCOMER_REACH, -NEWCOMER_REACH - 40, 2 * NEWCOMER_REACH, 2 * NEWCOMER_REACH);
    onTap(this.basket, () => {
      this.newcomer.poke();
      if (this.ending === 'naming') void this.sing();
    }, { cooldown: 300 });
    for (const step of builtSteps()) {
      const node = new Container();
      const play = new RoundButton(playIcon(), swatch.green, PROJECT_PLAY_RADIUS, () => this.play(step));
      play.visible = false;
      onTap(node, () => this.raise(step, true), { cooldown: 300 });
      this.cards.push({ step, node, play });
      this.content.addChild(node);
      this.ui.addChild(play);
      this.drawCard(step);
    }
    this.arrow.visible = false;
    this.picture.eventMode = this.plates.eventMode = 'none';
    this.marks.eventMode = 'none';
    this.content.addChild(this.picture, this.plates, this.lead);
    this.ui.addChild(this.marks, this.arrow, this.back, this.home);
  }

  private card(step: WelcomeStep) {
    return this.cards.find((c) => c.step === step)!;
  }

  private drawCard(step: WelcomeStep) {
    const { node } = this.card(step);
    for (const c of node.removeChildren()) c.destroy({ children: true });
    const done = store.welcome.steps.includes(step);
    const s = PROJECT_CARD;
    node.addChild(new Graphics()
      .roundRect(-s / 2 + 4, -s / 2 + 8, s, s, 24).fill({ color: 0x000000, alpha: 0.12 })
      .roundRect(-s / 2, -s / 2, s, s, 24).fill(cream).stroke({ width: 6, color: done ? swatch.green.line : swatch.yellow.line }));
    node.hitArea = new Rectangle(-s / 2, -s / 2, s, s);
    const art = step === 'pretty' ? this.prettyArt() : step === 'yummy' ? this.yummyArt(done) : this.songArt();
    node.addChild(art);
    if (done) {
      const tick = new Container();
      tick.addChild(new Graphics().circle(0, 0, 26).fill(swatch.green.fill).stroke({ width: 4, color: swatch.green.line }));
      const mark = checkIcon();
      mark.scale.set(0.6);
      tick.addChild(mark);
      tick.position.set(s / 2 - 12, -s / 2 + 12);
      node.addChild(tick);
    }
  }

  /** Her picture when she has made it, else an empty frame inviting one. */
  private prettyArt(): Container {
    const picture = store.welcome.results.pretty;
    if (!picture) {
      const f = frameIcon();
      f.scale.set(1.6);
      return f;
    }
    const board = pictureBoard(picture);
    board.scale.set(0.5);
    return board;
  }

  /** Her tune's jellies when she has kept one, else the plaque's soft note inviting one. */
  private songArt(): Container {
    const plaque = new TunePlaque();
    plaque.set(store.welcome.results.song ?? null);
    plaque.scale.set((PROJECT_CARD - 24) / PLAQUE.w);
    plaque.eventMode = 'none';
    return plaque;
  }

  /** What the round guarantees: four plates with a quarter each (preschool), or one bowl of two berries and two apples (pre-K). */
  private yummyArt(done: boolean): Container {
    const g = new Graphics();
    const filling = done ? 1 : 0.35;
    if (this.band === 'prek') {
      g.ellipse(0, 18, 56, 30).fill(swatch.blue.fill).stroke({ width: 5, color: swatch.blue.line });
      const fruit = [[-24, swatch.purple], [-8, swatch.purple], [10, swatch.red], [28, swatch.red]] as const;
      for (const [x, sw] of fruit) g.circle(x, 4, 12).fill({ color: sw.fill, alpha: filling }).stroke({ width: 3, color: sw.line, alpha: filling });
      return g;
    }
    for (const [x, y] of [[-32, -30], [32, -30], [-32, 30], [32, 30]]) {
      g.circle(x, y, 26).fill(0xffffff).stroke({ width: 4, color: swatch.blue.line });
      // A quarter of a sandwich: a little square of bread.
      g.rect(x - 9, y - 9, 18, 18).fill({ color: wood.fill, alpha: filling }).stroke({ width: 3, color: wood.line, alpha: filling });
    }
    return g;
  }

  /** Speaks the step's ask and puts up its Play arrow (and takes down any other). */
  raise(step: WelcomeStep, spoken: boolean) {
    if (this.leaving) return;
    this.raised = step;
    for (const c of this.cards) c.play.visible = c.step === step;
    this.card(step).node.scale.set(1.06);
    for (const c of this.cards) if (c.step !== step) c.node.scale.set(1);
    if (spoken) void voice.say(WELCOME_PLAN[step]!.ask[this.band]);
  }

  private play(step: WelcomeStep) {
    if (this.leaving || this.raised !== step) return;
    this.leaving = true;
    const band = this.band;
    store.beginWelcome(band);
    const plan = WELCOME_PLAN[step]!;
    this.app.go.game(plan.game, band, { project: 'welcome', step, level: plan.level[band] });
  }

  private async leave() {
    if (this.leaving) return;
    this.leaving = true;
    await Promise.race([voice.say('welcome.back'), this.tw.wait(0.6)]);
    if (this.app.scene !== this) return;
    this.app.go.hub();
  }

  resize(v: View) {
    const l = endingLayout(v);
    this.backdrop.position.set(l.backdrop.x, l.backdrop.y);
    this.backdrop.scale.set(l.backdrop.scale);
    this.back.position.set(l.back.x, l.back.y);
    this.home.position.set(l.home.x, l.home.y);
    this.basket.position.set(l.basket.x, l.basket.y);
    this.cards.forEach((c, i) => {
      c.node.position.set(l.cards[i].x, l.cards[i].y);
      c.play.position.set(l.plays[i].x, l.plays[i].y);
    });
    this.names.forEach((n, i) => n.node.position.set(l.names[i].x, l.names[i].y));
    this.arrow.position.set(l.arrow.x, l.arrow.y);
    this.picture.position.set(l.picture.x, l.picture.y);
    this.plates.position.set(l.plates.x, l.plates.y);
    this.lead.position.set(l.companion.x, l.companion.y);
    this.lead.scale.set(l.companion.scale);
    this.drawMarks();
  }

  /** The yellow ring round the name she tapped. */
  private drawMarks() {
    const g = this.marks.clear();
    const picked = this.names.find((n) => n.name === this.chosen);
    if (!picked) return;
    const { w, h } = NAME_BUTTON;
    g.roundRect(picked.node.x - w / 2 - 8, picked.node.y - h / 2 - 8, w + 16, h + 16, 52).stroke({ width: 6, color: swatch.yellow.line });
  }

  /**
   * The ending (docs/rework/WELCOME-BUILD.md#the-ending-slice-3). The cards step aside; her picture hangs over the
   * basket and the plates sit beside it; her companion walks in and the newcomer climbs up; her tune plays, or the two
   * hum; then the names.
   */
  private async playEnding() {
    this.ending = 'arriving';
    this.raised = null;
    for (const c of this.cards) c.node.visible = c.play.visible = false;
    const p = store.welcome;
    const board = pictureBoard(p.results.pretty ?? null);
    board.scale.set(ENDING_PICTURE);
    this.picture.addChild(board);
    const plates = this.yummyArt(true);
    plates.scale.set(Math.min(ENDING_PLATES.w / Math.max(1, plates.width), ENDING_PLATES.h / Math.max(1, plates.height)));
    this.plates.addChild(plates);
    this.guide = this.track(makeCompanion());
    this.guide.x = (this.view.w - this.lead.x) / this.lead.scale.x + 200;
    this.lead.addChild(this.guide);
    const say = (line: Parameters<typeof voice.say>[0], vars?: Parameters<typeof voice.say>[1]) => Promise.race([voice.say(line, vars), this.tw.wait(6)]);
    const gone = () => this.app.scene !== this || this.leaving;
    void say('welcome.here');
    this.guide.hop(0.8);
    await this.tw.to(this.guide, { x: 0 }, { duration: 1.4 });
    if (gone()) return;
    this.guide.cheer();
    this.newcomer.setMood('happy');
    await this.tw.to(this.newcomer, { y: -10 }, { duration: 0.4 });
    this.newcomer.cheer();
    if (gone()) return;
    await this.sing();
    if (gone()) return;
    this.ending = 'naming';
    const species = this.newcomer.species;
    for (const name of SPECIES[species].names) {
      const node = new Container();
      const { w, h } = NAME_BUTTON;
      node.addChild(new Graphics().roundRect(-w / 2, -h / 2, w, h, 45).fill(swatch.white.fill).stroke({ width: 5, color: swatch.teal.line }), label(name, 36));
      node.hitArea = new Rectangle(-w / 2, -h / 2, w, h);
      onTap(node, () => this.pick(name), { cooldown: 250 });
      this.names.push({ name, node });
      this.ui.addChild(node);
    }
    this.resize(this.view);
    await say('welcome.name');
  }

  /** Her tune on the marimba with both friends hopping to it, or, with none kept, the two hum. */
  private async sing() {
    if (this.singing) return;
    this.singing = true;
    const tune = store.welcome.results.song;
    const friends = [this.newcomer, this.guide].filter((f): f is Companion => !!f);
    if (tune) {
      await singTune(tune, (t) => this.tw.wait(t), (_col, steps) => {
        if (!steps.length) return;
        friends.forEach((f) => f.hop(0.5));
        this.particles.burst(this.basket.x, this.basket.y - 120, { kind: 'note', colors: [swatch.yellow.fill, swatch.pink.fill, swatch.blue.fill], count: 2, speed: [40, 120], gravity: -60, life: [0.8, 1.2] });
      }, () => this.app.scene === this && !this.leaving);
    } else {
      friends.forEach((f) => f.setMood('sing', 2.4));
      const hum = Promise.race([voice.say('welcome.done.song-hum'), this.tw.wait(6)]);
      for (let i = 0; i < 3; i++) {
        friends.forEach((f) => f.hop(0.4));
        await this.tw.wait(0.6);
      }
      await hum;
    }
    this.singing = false;
  }

  /** A name, tried aloud; the green arrow comes up. */
  pick(name: string) {
    if (this.ending !== 'naming') return;
    this.chosen = name;
    this.newcomer.poke();
    void voice.say('hatch.try-name', { pet: name });
    this.arrow.visible = true;
    this.drawMarks();
  }

  /** The green arrow: the newcomer joins her friends (one write), then Home. A full collection says so and adopts no one. */
  private async adopt() {
    if (this.ending !== 'naming' || !this.chosen || this.leaving) return;
    this.ending = 'joined';
    this.leaving = true;
    this.arrow.visible = false;
    const met = store.adoptWelcome(this.chosen);
    if (met) {
      this.newcomer.cheer();
      this.guide?.cheer();
      sfx.sparkle();
      this.particles.burst(this.basket.x, this.basket.y - 60, { kind: 'star', colors: [swatch.yellow.fill, swatch.pink.fill, 0xffffff], count: 16, speed: [90, 230], gravity: 0, life: [0.6, 1] });
      await Promise.race([voice.say('welcome.joined', { new: met.name }), this.tw.wait(6)]);
    } else {
      await Promise.race([voice.say('welcome.full'), this.tw.wait(6)]);
    }
    if (this.app.scene !== this) return;
    this.app.go.hub();
  }

  async enter() {
    music.play(STYLES.hub);
    const p = store.welcome;
    const say = (line: Parameters<typeof voice.say>[0], vars?: Parameters<typeof voice.say>[1]) => Promise.race([voice.say(line, vars), this.tw.wait(6)]);
    // Over already (a reload after the arrow): who joined, then Home.
    if (p.ended) {
      this.leaving = true;
      const friend = welcomeFriend(store.data.creatures.owned);
      await (friend ? say('welcome.joined', { new: friend.name }) : say('welcome.full'));
      if (this.app.scene === this) this.app.go.hub();
      return;
    }
    const next = nextWelcomeStep(p);
    if (this.from && p.steps.includes(this.from)) {
      this.newcomer.cheer();
      await say(welcomeDoneLine(p, this.from, this.band));
    } else if (p.steps.length === 0) {
      await say('welcome.invite');
    }
    if (this.app.scene !== this || this.leaving) return;
    if (welcomeReady(p)) {
      await this.playEnding();
      return;
    }
    // A card she tapped meanwhile keeps its arrow.
    if (next && !this.raised) this.raise(next, true);
  }
}
