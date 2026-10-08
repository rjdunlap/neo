import { Circle, Container, Graphics, Text } from 'pixi.js';
import { makePet, petSpec } from '../../art/pet';
import { ink, RAINBOW, swatch } from '../../art/palette';
import { Particles } from '../../art/particles';
import { stickerize } from '../../art/sticker';
import { music } from '../../audio/music';
import { sfx } from '../../audio/sfx';
import { voice, type LineVars } from '../../audio/voice';
import { cleanCreation, type Creation } from '../../content/creations';
import { entryById, type JournalEntry } from '../../content/journal';
import { howToFor, shouldExplain } from '../../content/howto';
import { demoFor } from '../../couch/catalog';
import { Demo } from '../../couch/demo';
import type { LineId } from '../../content/voice-script';
import { onTap } from '../../engine/input';
import { randomSeed, Rng } from '../../engine/random';
import { ease } from '../../engine/tween';
import type { View } from '../../engine/view';
import type { Game, GameContext, GameModule, RoundResult } from '../../games/types';
import type { Band } from '../../progress/bands';
import { store } from '../../progress/store';
import { HoldButton, RoundButton } from '../../ui/buttons';
import { HowToPanel, questionIcon } from '../../ui/howto-card';
import { discoveryPill } from '../../ui/journal-art';
import { againIcon, basketIcon, checkIcon, heartIcon, houseIcon, treehouseIcon } from '../../ui/icons';
import { FONT } from '../../ui/text';
import type { App, StoryRound } from '../App';
import { Scene } from '../Scene';
import { session } from '../session';

/**
 * Hosts one round of a minigame and owns everything around it:
 * the pet guide, the hold-to-leave home button, co-play tips, and the celebration at the end.
 */
export class GameScene extends Scene {
  /** Built when the round is about to start: after the intro, for a game that is opened for the first time. */
  private game: Game | null = null;
  private readonly stage = new Container();
  private readonly pet = makePet();
  private readonly home = new HoldButton(houseIcon(), swatch.white, 44, 0.5, () => this.leave());
  /** For the grown-up: hold to open the how-to card. Quiet on purpose, and a long hold so a small hand does not open it. */
  private readonly help = new HoldButton(questionIcon(), swatch.white, 38, 0.9, () => this.openHelp());
  private helpCard: HowToPanel | null = null;
  private tip: Container | null = null;
  private instruction: { id: LineId; vars?: LineVars } | null = null;
  /** The "again", heart and "home" buttons, once the celebration offers them. */
  after: { again: RoundButton; heart: RoundButton; home: RoundButton; keep: RoundButton | null } | null = null;
  /** What she made this round, offered for the treehouse (null when the game made nothing or it was empty). */
  private made: Creation | null = null;
  /** Journal entries this round showed her for the first time. */
  private discovered: JournalEntry[] = [];
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
    /** She tapped "again" after a round: no card, she has just seen it. */
    private readonly again = false,
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
    this.help.alpha = 0.6;
    this.track(this.help);
    this.ui.addChild(this.pet, this.home, this.help);

    // Every time a game is opened it explains itself on a card (with a demonstration where there is a bot), and the round waits for Play.
    const card = shouldExplain({ enabled: store.data.settings.howToCards, id: this.mod.id, story: !!this.story, again: this.again }) ? howToFor(this.mod, this.level) : null;
    if (card) this.openIntro(card);
    else this.build();
  }

  /** The game for this round, drawn onto the stage; nothing in it starts until `begin`. */
  private build(): Game {
    const band = this.band;
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
    return (this.game = this.mod.create(ctx));
  }

  /** Music, the first round, and the grown-up tip for the youngest bands. */
  private begin() {
    music.play(this.mod.music);
    this.game?.start();
    const early = this.band === 'lap' || this.band === 'toddler';
    if (early && store.data.settings.coplayHints && this.mod.coplayHint) this.showTip(this.mod.coplayHint);
  }

  resize(view: View) {
    this.game?.resize(view);
    this.pet.position.set(74, view.h - 18);
    this.home.position.set(62, 62);
    this.help.position.set(62, 160);
    this.tip?.position.set(view.w / 2, 16);
    this.helpCard?.layout(view);
  }

  enter() {
    if (this.game) this.begin();
    else void voice.say(this.mod.titleLine);
  }

  update(dt: number) {
    // The how-to card holds the round still: nothing moves or counts while a grown-up reads (its demonstration, if any, plays on).
    if (this.helpCard) {
      this.helpCard.update(dt);
      return;
    }
    super.update(dt);
    if (this.finished) return;
    this.seconds += dt;
    this.game?.update(dt);
  }

  sleepyWarning() {
    this.pet.setMood('sleepy', 2.5);
    sfx.yawn();
    void voice.say('sleepy.warn');
  }

  destroy() {
    this.gone = true;
    this.closeHelp();
    this.game?.destroy();
    super.destroy();
  }

  /**
   * Speech finishes on its own timer, so a game waiting for a line could carry on after she has left and
   * touch destroyed objects. Once the scene is gone the wait never ends, just like its tweens.
   */
  private whileHere(spoken: Promise<void>): Promise<void> {
    return new Promise((resolve) => void spoken.then(() => !this.gone && resolve()));
  }

  /** The grown-up how-to card for this game at this level. Reading it is not a hint and changes no progress. */
  private openHelp() {
    if (this.helpCard || this.finished) return;
    const info = howToFor(this.mod, this.level);
    if (!info) return;
    sfx.tick();
    const card = new HowToPanel(info, () => this.closeHelp());
    card.layout(this.view);
    this.helpCard = card;
    this.ui.addChild(card);
  }

  /** The how-to card fills the screen with Play and Back, and no round has been built or started. */
  private openIntro(info: NonNullable<ReturnType<typeof howToFor>>) {
    const mod = this.mod;
    // A game the couch can play has a bot, which plays a real round in a window on the card.
    const spec = demoFor(mod.id);
    const demo = spec ? new Demo(mod, { ...spec, renderer: this.app.renderer }) : undefined;
    const card = new HowToPanel(info, () => undefined, { icon: () => mod.hubIcon(), play: () => this.playFromIntro(), back: () => this.leave(), demo });
    card.layout(this.view);
    this.helpCard = card;
    this.ui.addChild(card);
  }

  /** Play: the card goes, and the round begins. */
  private playFromIntro() {
    if (this.game || this.gone) return;
    voice.stop();
    this.closeHelp();
    this.build().resize(this.view);
    this.begin();
  }

  private closeHelp() {
    this.helpCard?.destroy({ children: true });
    this.helpCard = null;
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
    this.made = cleanCreation(result.creation);
    this.discovered = store.discover(result.discoveries).map((id) => entryById(id)).filter((e): e is JournalEntry => !!e);
    this.closeHelp();
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
    this.help.visible = false;
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

    // A first look at something for her journal: a little card with what she found, then on to the buttons.
    if (this.discovered.length) {
      const pill = discoveryPill(this.discovered);
      pill.position.set(v.w / 2, v.h * 0.555);
      pill.scale.set(0);
      layer.addChild(pill);
      void this.tw.to(pill.scale, { x: 1, y: 1 }, { duration: 0.45, ease: ease.outBack });
      sfx.sparkle();
      confetti.burst(pill.x, pill.y, { kind: 'star', colors: [swatch.yellow.fill, 0xffffff], count: 12, speed: [160, 320], gravity: 0, life: [0.5, 0.9] });
      void voice.say('journal.new');
      await this.tw.wait(1.8);
    }

    if (session.over) {
      await this.tw.wait(0.8);
      this.app.go.goodnight();
      return;
    }

    const again = new RoundButton(againIcon(0xffffff), swatch.green, 66, () => this.app.go.game(this.mod.id, this.band, this.story, true));
    const home = new RoundButton(this.story ? basketIcon() : houseIcon(0xffffff), swatch.blue, 66, () => this.goHome());
    // A heart beside the new sticker, for a game she loves: it joins the shelf on the island, and a second tap takes it back.
    const outline = heartIcon(0xffffff, false);
    const solid = heartIcon(0xffffff, true);
    const show = (on: boolean) => {
      outline.visible = !on;
      solid.visible = on;
    };
    show(store.isFavorite(this.mod.id));
    const heartIcons = new Container();
    heartIcons.addChild(outline, solid);
    const heart = new RoundButton(heartIcons, swatch.pink, 56, () => {
      const on = store.toggleFavorite(this.mod.id);
      show(on);
      if (on) {
        sfx.sparkle();
        confetti.burst(heart.x, heart.y, { kind: 'star', colors: [swatch.pink.fill, 0xffffff], count: 14, speed: [180, 340], gravity: 0, life: [0.5, 0.9] });
        void voice.say('heart.on');
      } else void voice.say('heart.off');
    });
    // Something she made: a button to hang it in her treehouse room. Explicit, and it replaces (never deletes) the earlier one.
    let keep: RoundButton | null = null;
    const made = this.made;
    if (made) {
      const house = treehouseIcon();
      const check = checkIcon(swatch.green.line);
      check.visible = false;
      const icons = new Container();
      icons.addChild(house, check);
      let kept = false;
      keep = new RoundButton(icons, swatch.white, 56, () => {
        if (kept) return;
        kept = true;
        store.keepCreation(made);
        house.visible = false;
        check.visible = true;
        sfx.sparkle();
        confetti.burst(keep!.x, keep!.y, { kind: 'star', colors: [swatch.green.fill, 0xffffff], count: 14, speed: [180, 340], gravity: 0, life: [0.5, 0.9] });
        void voice.say('keep.done');
      });
      keep.position.set(v.w / 2 - 195, v.h * 0.33);
    }
    this.after = { again, heart, home, keep };
    again.position.set(v.w / 2 - 230, v.h * 0.72);
    heart.position.set(v.w / 2 + 195, v.h * 0.33);
    home.position.set(v.w / 2 + 230, v.h * 0.72);
    for (const b of [again, heart, home, ...(keep ? [keep] : [])]) {
      b.scale.set(0);
      layer.addChild(b);
      void this.tw.to(b.scale, { x: 1, y: 1 }, { duration: 0.45, ease: ease.outBack });
    }
    void voice.say(keep ? 'keep.offer' : 'again');
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
    // `resize` only moves a tip that already exists, and a tip made after the first resize (once Play is pressed) would sit at the origin, over the home button.
    card.position.set(this.view.w / 2, 16);
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
