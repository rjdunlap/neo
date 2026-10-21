import { Container, Graphics, Rectangle } from 'pixi.js';
import { cream, swatch, wood } from '../../art/palette';
import { homeBackdrop } from '../../art/home/backdrop';
import { music, STYLES } from '../../audio/music';
import { voice } from '../../audio/voice';
import { builtSteps, newcomerFor, nextWelcomeStep, WELCOME_PLAN, welcomeBand, type WelcomeBand, type WelcomeStep } from '../../content/welcome';
import { Companion } from '../../creatures/companion';
import { SPECIES } from '../../creatures/species';
import { CORNER_RADIUS, NEWCOMER_REACH, PROJECT_CARD, PROJECT_PLAY_RADIUS, projectLayout } from '../../creatures/home-layout';
import { onTap } from '../../engine/input';
import type { View } from '../../engine/view';
import { store } from '../../progress/store';
import { RoundButton } from '../../ui/buttons';
import { pictureBoard } from '../../ui/creation-art';
import { arrowIcon, checkIcon, frameIcon, houseIcon, playIcon } from '../../ui/icons';
import type { App } from '../App';
import { Scene } from '../Scene';

interface Card {
  step: WelcomeStep;
  node: Container;
  play: RoundButton;
}

/**
 * Welcome a New Friend's page (RW07 slice 1, docs/rework/WELCOME-BUILD.md#routes-and-scenes), reached from Home's
 * Continue. The newcomer peeks from its basket; each built step is a card. The first tap on a card speaks its ask and
 * raises its green Play arrow; Play opens the round at the project's level. A finished card is ticked and shows what
 * the round made: her picture, or the plates the round guaranteed. Coming back from a finished round speaks that step's
 * done line. With every built step done it says the friend is almost here (the ending is slice 3). Nothing here is a
 * round, and nothing is stored until a round finishes.
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
    onTap(this.basket, () => this.newcomer.poke(), { cooldown: 300 });
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
    this.ui.addChild(this.back, this.home);
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
    const art = step === 'pretty' ? this.prettyArt() : this.yummyArt(done);
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
    const l = projectLayout(v, this.cards.length);
    this.backdrop.position.set(l.backdrop.x, l.backdrop.y);
    this.backdrop.scale.set(l.backdrop.scale);
    this.back.position.set(l.back.x, l.back.y);
    this.home.position.set(l.home.x, l.home.y);
    this.basket.position.set(l.basket.x, l.basket.y);
    this.cards.forEach((c, i) => {
      c.node.position.set(l.cards[i].x, l.cards[i].y);
      c.play.position.set(l.plays[i].x, l.plays[i].y);
    });
  }

  async enter() {
    music.play(STYLES.hub);
    const p = store.welcome;
    const next = nextWelcomeStep(p);
    const say = (line: Parameters<typeof voice.say>[0]) => Promise.race([voice.say(line), this.tw.wait(6)]);
    if (this.from && p.steps.includes(this.from)) {
      this.newcomer.cheer();
      await say(WELCOME_PLAN[this.from]!.done[this.band]);
    } else if (p.steps.length === 0) {
      await say('welcome.invite');
    }
    if (this.app.scene !== this || this.leaving) return;
    // A card she tapped meanwhile keeps its arrow.
    if (next && !this.raised) this.raise(next, true);
    else if (this.raised) return;
    else void voice.say('welcome.soon');
  }
}
