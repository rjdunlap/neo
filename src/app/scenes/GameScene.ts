import { Circle, Container, Graphics, Text } from 'pixi.js';
import { makePet, petSpec } from '../../art/pet';
import { ink, RAINBOW, swatch } from '../../art/palette';
import { Particles } from '../../art/particles';
import { stickerize } from '../../art/sticker';
import { music } from '../../audio/music';
import { sfx } from '../../audio/sfx';
import { voice, type LineVars } from '../../audio/voice';
import type { LineId } from '../../content/voice-script';
import { onTap } from '../../engine/input';
import { randomSeed, Rng } from '../../engine/random';
import { ease } from '../../engine/tween';
import type { View } from '../../engine/view';
import type { Game, GameContext, GameModule, RoundResult } from '../../games/types';
import type { Band } from '../../progress/bands';
import { store } from '../../progress/store';
import { HoldButton, RoundButton } from '../../ui/buttons';
import { againIcon, basketIcon, houseIcon } from '../../ui/icons';
import { FONT } from '../../ui/text';
import type { App, StoryRound } from '../App';
import { Scene } from '../Scene';
import { session } from '../session';

/**
 * Hosts one round of a minigame and owns everything around it:
 * the pet guide, the hold-to-leave home button, co-play tips, and the celebration at the end.
 */
export class GameScene extends Scene {
  private game!: Game;
  private readonly stage = new Container();
  private readonly pet = makePet();
  private readonly home = new HoldButton(houseIcon(), swatch.white, 44, 0.5, () => this.leave());
  private tip: Container | null = null;
  private instruction: { id: LineId; vars?: LineVars } | null = null;
  /** The "again" and "home" buttons, once the celebration offers them. */
  after: { again: RoundButton; home: RoundButton } | null = null;
  private level = 1;
  private seconds = 0;
  private finished = false;
  private gone = false;

  constructor(
    app: App,
    private readonly mod: GameModule,
    /** The place she came from: its age band sets the levels. */
    private readonly band: Band,
    /** Set when the round is a picnic request: it plays the story's level and goes home to the picnic. */
    readonly story?: StoryRound,
  ) {
    super(app);
  }

  init() {
    const band = this.band;
    this.level = this.story?.level ?? store.levelFor(this.mod.id, this.mod.levels(band));
    this.content.addChild(this.stage);

    this.pet.scale.set(0.42);
    onTap(this.pet, () => {
      this.pet.poke();
      sfx.giggle();
      if (this.instruction) void voice.say(this.instruction.id, this.instruction.vars);
    });
    this.pet.hitArea = new Circle(0, -125, 170);
    this.track(this.pet);
    this.track(this.home);
    this.ui.addChild(this.pet, this.home);

    const ctx: GameContext = {
      stage: this.stage,
      view: this.view,
      level: this.level,
      band,
      rng: new Rng(),
      tw: this.tw,
      particles: this.particles,
      renderer: this.app.renderer,
      pet: this.pet,
      petSpec: petSpec(),
      childName: store.data.profile.name,
      track: (o) => this.track(o),
      untrack: (o) => this.untrack(o),
      instruct: (id, vars) => {
        this.instruction = { id, vars };
        return this.whileHere(voice.say(id, vars));
      },
      say: (id, vars) => this.whileHere(voice.say(id, vars)),
      finish: (result) => this.finish(result),
    };
    this.game = this.mod.create(ctx);

    const early = band === 'lap' || band === 'toddler';
    if (early && store.data.settings.coplayHints && this.mod.coplayHint) this.showTip(this.mod.coplayHint);
  }

  resize(view: View) {
    this.game.resize(view);
    this.pet.position.set(74, view.h - 18);
    this.home.position.set(62, 62);
    this.tip?.position.set(view.w / 2, 16);
  }

  enter() {
    music.play(this.mod.music);
    this.game.start();
  }

  update(dt: number) {
    super.update(dt);
    if (this.finished) return;
    this.seconds += dt;
    this.game.update(dt);
  }

  sleepyWarning() {
    this.pet.setMood('sleepy', 2.5);
    sfx.yawn();
    void voice.say('sleepy.warn');
  }

  destroy() {
    this.gone = true;
    this.game.destroy();
    super.destroy();
  }

  /**
   * Speech finishes on its own timer, so a game waiting for a line could carry on after she has left and
   * touch destroyed objects. Once the scene is gone the wait never ends, just like its tweens.
   */
  private whileHere(spoken: Promise<void>): Promise<void> {
    return new Promise((resolve) => void spoken.then(() => !this.gone && resolve()));
  }

  private leave() {
    voice.stop();
    this.goHome();
  }

  /** Back to the place she came from, or to the picnic for a story round. */
  private goHome() {
    if (this.story) this.app.go.picnic(this.story.step);
    else this.app.go.place(this.band);
  }

  private finish(result: RoundResult) {
    if (this.finished) return;
    this.finished = true;
    const band = this.band;
    store.recordRound(
      this.mod.id,
      { level: this.level, misses: result.misses, hints: result.hints, seconds: Math.round(this.seconds), at: Date.now() },
      this.mod.levels(band),
      // A story round plays the story's level; it shouldn't move the game's own level.
      !this.story,
    );
    // Finishing completes the request, however much help it took.
    if (this.story) store.completeStep(this.story.step);
    const seed = randomSeed();
    store.addSticker(this.mod.id, seed);
    // Save the round and its sticker now: a write that only starts as the page closes can be lost.
    store.flush();
    void this.celebrate(seed);
  }

  /** Happy pet, confetti, a sticker, then "again?" — or goodnight if time is up. */
  private async celebrate(seed: number) {
    const v = this.view;
    const layer = new Container();
    const veil = new Graphics().rect(0, 0, v.w, v.h).fill({ color: 0xfff4e3, alpha: 0.8 });
    veil.eventMode = 'static'; // nothing underneath can be tapped now
    veil.alpha = 0;
    const confetti = this.track(new Particles());
    const star = this.track(makePet());
    star.scale.set(0.8);
    star.position.set(v.w / 2, v.h + 280);
    layer.addChild(veil, star, confetti);
    this.ui.addChild(layer);
    this.home.visible = false;
    this.pet.visible = false;
    this.tip?.destroy({ children: true });
    this.tip = null;

    await this.tw.to(veil, { alpha: 1 }, { duration: 0.3 });
    void this.tw.to(star, { y: v.h - 20 }, { duration: 0.6, ease: ease.outBack });
    const colors = RAINBOW.map((c) => swatch[c].fill);
    const cannon = { kind: 'confetti' as const, colors, count: 40, speed: [550, 950] as [number, number], spread: 0.5, gravity: 700, life: [1.6, 2.4] as [number, number] };
    confetti.burst(0, v.h, { ...cannon, angle: -Math.PI / 3 });
    confetti.burst(v.w, v.h, { ...cannon, angle: (-Math.PI * 2) / 3 });
    sfx.tada();
    void voice.say('praise');
    await this.tw.wait(0.5);
    star.cheer();
    const hopLoop = async () => {
      for (;;) {
        await this.tw.wait(1.3);
        star.hop(0.7);
      }
    };
    void hopLoop();

    await this.tw.wait(0.6);
    const sticker = stickerize(this.mod.sticker(seed), 110);
    sticker.position.set(v.w / 2, v.h * 0.33);
    sticker.scale.set(0);
    sticker.rotation = -0.08;
    layer.addChild(sticker);
    void this.tw.to(sticker.scale, { x: 1, y: 1 }, { duration: 0.55, ease: ease.outBack });
    sfx.sparkle();
    confetti.burst(sticker.x, sticker.y, { kind: 'star', colors: [0xffd54a, 0xffffff], count: 18, speed: [200, 380], gravity: 0, life: [0.6, 1] });
    await this.tw.wait(0.5);
    void voice.say('sticker');
    await this.tw.wait(1.8);

    if (session.over) {
      await this.tw.wait(0.8);
      this.app.go.goodnight();
      return;
    }

    const again = new RoundButton(againIcon(0xffffff), swatch.green, 66, () => this.app.go.game(this.mod.id, this.band, this.story));
    const home = new RoundButton(this.story ? basketIcon() : houseIcon(0xffffff), swatch.blue, 66, () => this.goHome());
    this.after = { again, home };
    again.position.set(v.w / 2 - 230, v.h * 0.72);
    home.position.set(v.w / 2 + 230, v.h * 0.72);
    for (const b of [again, home]) {
      b.scale.set(0);
      layer.addChild(b);
      void this.tw.to(b.scale, { x: 1, y: 1 }, { duration: 0.45, ease: ease.outBack });
    }
    void voice.say('again');
  }

  /** A small card for the grown-up, which fades after a few seconds or when tapped. */
  private showTip(template: string) {
    const name = store.data.profile.name.trim() || 'your little one';
    const body = new Text({
      text: template.replaceAll('{name}', name),
      style: { fontFamily: FONT, fontSize: 19, fill: ink, fontWeight: '500', align: 'center', wordWrap: true, wordWrapWidth: 520 },
    });
    const head = new Text({ text: 'GROWN-UP TIP', style: { fontFamily: FONT, fontSize: 12, fill: 0x6b6b7b, fontWeight: '600', letterSpacing: 1.5 } });
    head.anchor.set(0.5, 0);
    body.anchor.set(0.5, 0);
    head.y = 12;
    body.y = 32;
    const w = Math.max(body.width, head.width) + 40;
    const card = new Container();
    card.addChild(
      new Graphics().roundRect(-w / 2, 0, w, body.height + 46, 18).fill({ color: 0xffffff, alpha: 0.94 }).stroke({ width: 2, color: 0xeadfcd }),
      head,
      body,
    );
    card.alpha = 0;
    const dismiss = () => {
      if (this.tip !== card) return;
      this.tip = null;
      void this.tw.to(card, { alpha: 0 }, { duration: 0.4 }).then(() => card.destroy({ children: true }));
    };
    onTap(card, dismiss);
    this.tip = card;
    this.ui.addChild(card);
    void this.tw.to(card, { alpha: 1 }, { duration: 0.4, delay: 0.6 });
    void this.tw.wait(9).then(dismiss);
  }
}
