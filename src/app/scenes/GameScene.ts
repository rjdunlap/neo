import { PT_PT, type WordKey } from '../../content/words/pt-PT';
import { Lifetime } from '../../engine/lifetime';
import { Container, Graphics, Point, Text } from 'pixi.js';
import { FORM_FLOWER, formForFlower, type FormId } from '../../creatures/forms';
import { GUIDE_SCALE, makeCompanion, makeGuide, makeStar } from '../../creatures/companion';
import { ink, RAINBOW, swatch } from '../../art/palette';
import { Particles } from '../../art/particles';
import { stickerize } from '../../art/sticker';
import { audio } from '../../audio/engine';
import { isSilent, music } from '../../audio/music';
import { onBoing, sfx } from '../../audio/sfx';
import { soundCount } from '../../audio/sound-count';
import { voice, type LineVars } from '../../audio/voice';
import { cleanCreation, type Creation } from '../../content/creations';
import { entryById, type JournalEntry } from '../../content/journal';
import { briefResult } from '../../content/brief-result';
import { briefIntro, howToFor, introKey, shouldExplain, type IntroInput } from '../../content/howto';
import { islandDemo } from '../../content/demos';
import { COUCH_INFO, type CouchInfo } from '../../couch/catalog';
import { Demo } from '../../couch/demo';
import { SCRIPT, type LineId } from '../../content/voice-script';
import { discoveryCandidates, suggestDiscovery } from '../../content/discovery';
import { GAMES } from '../../games/registry';
import {
  discoveryMemory,
  introMemory,
  launchDiscovery,
  launchStop,
  leaveMix,
  mixMemory,
  type MixRound,
} from '../discovery';
import { dailyStop, mixReturn, mixStop, nextUp } from '../../content/mix';
import { titleOf } from '../mix';
import { dayKey, nextOfSix, playedOn, type DailyPick } from '../../content/daily';
import { todaysSix } from '../daily-six';
import { openPlaytestSheet, type PlaytestSheet } from '../../ui/playtest-sheet';
import { allDoneArt, hopIcon, nextStopArt, StopTile } from '../../ui/mix';
import { DiscoveryTile, nextGameArt, anotherGameArt } from '../../ui/discovery';
import { CouchInput, type CouchControls } from '../../engine/controller';
import { nextSpot } from '../../couch/focus';
import { cancelHeld } from '../../engine/drag';
import { onTap, pointerKind } from '../../engine/input';
import { randomSeed, Rng } from '../../engine/random';
import { ease } from '../../engine/tween';
import { DAILY_NEXT, RESULT_NAME_W, dailySpots, resultSpots } from '../result-layout';
import { RESULT_NAMES } from '../../content/button-names';
import { textBoost, type View } from '../../engine/view';
import { pauseLabels, type PauseAction } from '../pause';
import { tipFor, type Game, type GameContext, type GameModule, type RoundResult } from '../../games/types';
import type { Band } from '../../progress/bands';
import { nextLevelOffer, stepLevel } from '../../progress/difficulty';
import { store } from '../../progress/store';
import { RoundButton } from '../../ui/buttons';
import { HowToPanel, questionIcon, type HowToIntro } from '../../ui/howto-card';
import { formPill } from '../../ui/form-art';
import { discoveryPill } from '../../ui/journal-art';
import {
  againIcon,
  arrowIcon,
  basketIcon,
  checkIcon,
  heartIcon,
  houseIcon,
  nextIcon,
  plusIcon,
  treehouseIcon,
} from '../../ui/icons';
import { FONT } from '../../ui/text';
import { shellTag, stampTag } from '../../ui/shells';
import { STAMP_SHORT, type StampKind } from '../../content/stamps';
import { SEASON_SHORT, type SeasonGoal } from '../../content/seasons';
import { backArt, backToArt, originArt } from '../../ui/origin-art';
import type { App, Origin, StoryRound } from '../App';
import { controllerPlays, InputInUse, pressed } from '../input-in-use';
import { PAD_POINTER, PadPointer } from '../pad-pointer';
import { goToOrigin } from '../origin';
import { ResultBackdrop, resultPlace } from './result-backdrop';
import { isParentPanelOpen } from '../../parent/panel';
import { Scene } from '../Scene';
import { HeldLines } from '../held-line';
import { LEAVE_BEAT } from '../leave';
import { CaptionBand, speakerIcon } from '../../ui/caption-band';
import { captionPlace, captionShows, type CaptionPlace } from '../../ui/caption-layout';
import { MovePointer } from '../../ui/move-pointer';
import { RoundGuide } from '../round-guide';

/**
 * Hosts one round of a minigame and owns everything around it:
 * the pet guide, the round's Back and help buttons, co-play tips, and the celebration at the end.
 */
export class GameScene extends Scene {
  /** Takes keys itself: `control()` where the game has controller play, its own pad pointer elsewhere. */
  override padPointer = false;
  /** Built when the round is about to start: after the intro, for a game that is opened for the first time. */
  private game: Game | null = null;
  private readonly lifetime = new Lifetime();
  private readonly stage = new Container();
  private readonly pet = makeGuide();
  /** The island house or the root's Back to the round's origin. */
  private readonly home: RoundButton;
  private readonly help = new RoundButton(questionIcon(), swatch.white, 38, () => this.openHelp());
  /**
   * The guide no longer stands in game scenes (Robert, 2026-11-27): a hear-again button in its corner does what tapping
   * it did, for a child who cannot read the caption (or has none). The guide object stays, off screen, for the games'
   * `ctx.pet` calls.
   */
  private readonly hearAgain = new RoundButton(speakerIcon(), swatch.white, 38, () => this.repeat());
  private helpCard: HowToPanel | null = null;
  /** Guided first play: when to show the round's next move, and the hand that shows it (null for a game with no `showMove`). */
  private guide: { when: RoundGuide; hand: MovePointer } | null = null;
  private tip: Container | null = null;
  private instruction: { id: LineId; vars?: LineVars } | null = null;
  /** The question written out for a reader (TotoLogic P3): `grownup` rounds, and `school` ones with the sound off. */
  private readonly caption = new CaptionBand(this.tw, () => this.repeat());
  /** Where the caption sits and the view it leaves the game; `none` when no caption shows. */
  private place: CaptionPlace = captionPlace(this.view, false);
  /** The "again", heart and "home" buttons, once the celebration offers them. */
  /** The result's buttons. At the root a game opened from a location or Explore page has `home` as Back to that place and `house` as Home. */
  after: {
    again: RoundButton;
    next: RoundButton | null;
    heart: RoundButton;
    home: RoundButton;
    house: RoundButton | null;
    keep: RoundButton | null;
  } | null = null;
  /** A daily round's result: the next-of-six tile, the grown-up's note pencil and its open sheet. */
  dailyNext: DiscoveryTile | null = null;
  dailyNote: RoundButton | null = null;
  private dailySheet: PlaytestSheet | null = null;
  /** What she made this round, offered for the treehouse (null when the game made nothing or it was empty). */
  private made: Creation | null = null;
  /** Journal entries this round showed her for the first time. */
  private discovered: JournalEntry[] = [];
  /** A blossom this round grew for the first time (RW11 slice 2): the result shows it opening. */
  private grewForm: FormId | null = null;
  /** Rounds of this game finished before the one now settled (the short result is never a first round's). */
  private earlierRounds = 0;
  private readonly discoveryToken = discoveryMemory.token(store.data);
  private readonly introToken = introMemory.token(store.data);
  /** The short reminder (D4b) is the card now open, and the input it opened for; Show me, or a different input, swaps in the full card. */
  private briefOpen: IntroInput | null = null;
  private showFullIntro: (() => void) | null = null;
  private discovery: {
    id: string;
    tile: DiscoveryTile;
    another: DiscoveryTile | null;
    anotherId?: string;
  } | null = null;
  /** The Little surprises round this scene plays, claimed as it is built; a game opened any other way is never in a mix. */
  readonly mixRound: MixRound | undefined = mixMemory.claim(store.data);
  /** Next stop (or All done) and Skip on a mix's result, in D1b's rectangles. */
  private mixControls: { tile: DiscoveryTile; skip: DiscoveryTile | null; next: number | null } | null = null;
  /** Whether a stop card's row was last laid out (null: this intro has no row). */
  private stopRow: boolean | null = null;
  private resultLayer: Container | null = null;
  private resultVeil: Graphics | null = null;
  /** At the root, the round's place behind the veil (RW14 slice 5); null keeps flat cream. */
  private resultPlace: ResultBackdrop | null = null;
  private readonly resultPetOffset = { y: 300 };
  private resultStar: ReturnType<typeof makeCompanion> | null = null;
  private resultSticker: Container | null = null;
  private resultPill: Container | null = null;
  /** Shells this round earned (the progression loop): 0 for a band that does not earn them, or at the day's cap. */
  private shellsEarned = 0;
  /** Season goals this round met (the progression loop); their bonus is already in `shellsEarned`. */
  private seasonGoals: SeasonGoal[] = [];
  /** Stamps this round earned (the progression loop), in goal order; their bonus is already in `shellsEarned`. */
  private stampsEarned: StampKind[] = [];
  private resultReady = false;
  private navigating = false;
  private returningTouch = false;
  private speechSerial = 0;
  private resultSpeech: Promise<void> = Promise.resolve();
  private readonly touchUp = () => {
    this.returningTouch = false;
    this.held.up();
  };
  /** The game's lines in flight, for the guide's talking look and the tick a held tap gets (U7 R5). */
  private readonly held = new HeldLines();
  private level = 1;
  private seconds = 0;
  private finished = false;
  private gone = false;
  /** Keys and pads: sampled from the start so a press that opened the round is not read again as the round's first move. */
  private keys!: CouchInput;
  /** Keys and a pad in a game with no controller play of its own at this level: a hand that taps and drags (`pad-pointer.ts`). */
  private pointer?: PadPointer;
  private readonly inputInUse = new InputInUse();
  /** A key or button has been pressed since the round began (or since the last touch): the Enter that pressed Play does not count. */
  private keyed = false;
  private readonly touchDown = (e: PointerEvent) => {
    // Any touch takes the shown move away; one on the board (a pad pointer's press included) starts the quiet over.
    if (this.guide) {
      this.guide.hand.stop();
      if (!this.onShellButton(e)) this.guide.when.touched();
    }
    const pad = e.pointerId === PAD_POINTER;
    if (this.game && !this.finished && !this.helpCard && !this.navigating && !this.onShellButton(e))
      this.held.down(soundCount.n);
    else this.held.cancel();
    // The pad pointer's own press is the keys at work, not a finger coming back.
    if (pad) return;
    this.pointer?.lift();
    if (this.inputInUse.kind === 'controller') this.returningTouch = true;
    this.inputInUse.touched();
    if (this.keyed && !this.finished) {
      // A piece held by a tap before the pad took over is put back, whatever the game.
      cancelHeld();
      this.game?.touchReturned?.();
    }
    this.keyed = false;
    this.ring.visible = false;
  };
  /** The ring round the celebration's focused button, shown once a key or pad has been used. */
  private readonly ring = new Graphics();
  private focus = 0;
  /** Seconds since the celebration offered its buttons: a key mashed during the confetti must not press one the moment it appears. */
  private offeredFor = 0;

  /** Back from a round shrinks it into the spot or card that launched it (RW14 slice 9). */
  override transitionKey(): string {
    return `game:${this.mod.id}`;
  }

  constructor(
    app: App,
    private readonly mod: GameModule,
    /** The band whose levels this round plays: one the game has, resolved by the route (`playBand`). */
    private readonly band: Band,
    /** Set when the round is a story request: it plays the story's level and goes home to the story. */
    readonly story?: StoryRound,
    /** She tapped "again" after a round: no card, she has just seen it. */
    private readonly again = false,
    /** Where the game was opened from: home goes back there. */
    readonly origin?: Origin,
    /** Play this level (inside her band's range) instead of her saved one: the celebration's "next level". */
    private readonly startLevel?: number,
  ) {
    super(app);
    const icon = this.app.creatureWorld
      ? this.story
        ? basketIcon()
        : backArt(this.origin, 44, ink)
      : houseIcon();
    this.home = new RoundButton(icon, swatch.white, 44, () => this.leave());
    if (this.app.creatureWorld) this.home.means('back');
  }

  /** A round opened from a blossom goal in the book: it plays that goal's level whatever her band's range is. */
  private bookForm() {
    return !!this.origin && 'book' in this.origin && !!this.origin.form && this.startLevel !== undefined;
  }

  init() {
    const band = this.band;
    const range = this.mod.levels(band);
    this.level =
      this.story?.level ??
      // A blossom goal's path is one built level (Garden Grow's rain-and-bloom level 2), below the preschool and pre-K ranges.
      (this.bookForm() ? this.startLevel : undefined) ??
      (this.startLevel === undefined
        ? store.levelFor(this.mod.id, range, this.mod.entryLevels)
        : stepLevel(this.startLevel, 0, range));
    this.setOrientation();
    this.content.addChild(this.stage);

    this.pet.scale.set(GUIDE_SCALE);
    this.pet.visible = false;
    this.track(this.pet);
    this.help.alpha = 0.6;
    this.ui.addChild(this.caption, this.hearAgain, this.home, this.help);
    this.place = captionPlace(this.view, this.captionOn());
    onBoing(this.sawBoing);
    this.ring.visible = false;
    window.addEventListener('pointerdown', this.touchDown, true);
    window.addEventListener('pointerup', this.touchUp);
    window.addEventListener('pointercancel', this.touchUp);
    window.addEventListener('blur', this.touchUp);
    this.keys = new CouchInput(
      () => {
        audio.unlock();
        voice.unlock();
        // A key arriving between frames cancels a held discovery choice before its pointer can release.
        this.discovery?.tile.cancel();
        this.discovery?.another?.cancel();
        this.mixControls?.tile.cancel();
        this.mixControls?.skip?.cancel();
      },
      () => undefined,
      { listening: () => !this.app.paused && !isParentPanelOpen() },
    );

    this.pointer = new PadPointer(this.app.renderer.canvas, this.root, () => this.app.renderer.screen);
    // A game's own places are in its stage's units; things are found where they are drawn.
    this.pointer.extra = () =>
      (this.game?.pointerSpots?.() ?? []).map((s) => (s instanceof Container ? s : this.stage.toGlobal(s)));
    this.root.addChild(this.pointer.layer);

    this.keys.peekEnabled = () => !!this.game?.togglePeek && !this.finished && !this.helpCard;

    // Every time a game is opened it explains itself on a card (with a demonstration where there is a bot), and the round waits for Play.
    const explained = shouldExplain({
      enabled: store.data.settings.howToCards,
      id: this.mod.id,
      story: !!this.story,
      again: this.again,
    });
    const card = explained ? howToFor(this.mod, this.level) : null;
    if (card) {
      // Only an exact game, band, level and input that she pressed Play on this visit gets the short reminder (D4b).
      const input = this.introInput();
      const introduced =
        input !== null && introMemory.has(this.introToken, store.data, this.introKeyFor(input));
      const brief = briefIntro({
        cards: store.data.settings.howToCards,
        brief: store.data.settings.briefIntros,
        explained,
        mix: !!this.mixRound,
        daily: !!this.origin && 'daily' in this.origin,
        input,
        introduced,
      });
      this.openIntro(card, brief ? input : null);
    } else this.build();
  }

  /** The game for this round, drawn onto the stage; nothing in it starts until `begin`. */
  private build(): Game {
    const band = this.band;
    const lifetime = this.lifetime;
    const scene = this;
    /** Second-language words already said (or skipped) this round; a new round starts empty (WL2). */
    const words = new Set<WordKey>();
    const ctx: GameContext = {
      get alive() {
        return lifetime.alive;
      },
      own: lifetime.own,
      listen: lifetime.listen.bind(lifetime),
      stage: this.stage,
      // Live: the shell can move the round onto the upright area after the game is built, and every resize replaces the place.
      get view() {
        return scene.place.game;
      },
      level: this.level,
      band,
      request:
        this.origin && 'book' in this.origin
          ? (this.origin.recipe ?? (this.origin.form && FORM_FLOWER[this.origin.form]))
          : undefined,
      rng: new Rng(),
      tw: this.tw,
      particles: this.particles,
      renderer: this.app.renderer,
      pet: this.pet,
      companion: makeStar,
      childName: store.data.profile.name,
      track: (o) => this.track(o),
      untrack: (o) => this.untrack(o),
      instruct: (id, vars) => {
        this.instruction = { id, vars };
        // One wording, shown and said: the eye and the ear get the same option, and the clip is still found by its text.
        const text = voice.line(id, vars);
        const spoken = voice.speak(text);
        this.caption.instruct(text, spoken);
        return this.whileHere(this.held.line(spoken));
      },
      // A hint, a reason, praise: shown in the band while it is said, so a reader with the sound off gets it too.
      say: (id, vars) => {
        const text = voice.line(id, vars);
        const spoken = voice.speak(text);
        this.caption.say(text, spoken);
        return this.whileHere(this.held.line(spoken));
      },
      sayIn: (id, preset, vars) => {
        const text = voice.line(id, vars);
        const spoken = voice.speakIn(text, preset);
        this.caption.say(text, spoken);
        return this.whileHere(this.held.line(spoken));
      },
      sayWord: (key) => {
        // Reserved now, before the English ends, so a quick second tap cannot queue the same word; used is used.
        if (!key || !lifetime.alive || words.has(key)) return;
        words.add(key);
        const lang = store.data.settings.language2;
        if (lang === 'none') return;
        const profile = store.activeId;
        voice.afterLine(() => {
          if (!lifetime.alive || scene.finished || store.activeId !== profile) return;
          if (store.data.settings.language2 !== lang) return;
          void voice.speakWord(PT_PT[key], lang);
        });
      },
      finish: (result) => {
        voice.dropTail();
        this.finish(result);
      },
    };
    return (this.game = this.mod.create(ctx));
  }

  /** Music, the first round, and the grown-up tip for the youngest bands. */
  private begin() {
    music.play(this.mod.music);
    this.game?.start();
    this.startGuide();
    const early = this.band === 'lap' || this.band === 'toddler';
    const tip = early ? tipFor(this.mod, this.band) : undefined;
    if (store.data.settings.coplayHints && tip) this.showTip(tip);
  }

  /**
   * Guided first play (`src/app/round-guide.ts`): a game that can name its next move has it shown on the board on her first
   * round, and when the board has sat untouched. Off with the how-to cards, as both are a grown-up's choice about explaining.
   */
  private startGuide() {
    const game = this.game;
    if (!game?.showMove || !store.data.settings.howToCards || this.guide) return;
    const firstPlay = (store.data.games[this.mod.id]?.plays ?? 0) === 0;
    const hand = new MovePointer(pointerKind());
    this.ui.addChildAt(hand, 0);
    this.guide = { when: new RoundGuide(this.band, firstPlay), hand };
  }

  /** One frame of guided first play: the hand moves on, and a new showing starts when one is due and the game has a move. */
  private stepGuide(dt: number) {
    const guide = this.guide;
    const game = this.game;
    if (!guide || !game?.showMove) return;
    // A controller player is not shown a finger.
    if (this.inputInUse.kind === 'controller') {
      guide.hand.stop();
      return;
    }
    guide.hand.update(dt);
    if (!guide.when.due({ dt, talking: this.held.talking, showing: guide.hand.showing })) return;
    const move = game.showMove();
    if (move && guide.hand.show(move)) guide.when.showed();
  }

  /** The guide, or the caption, was tapped: the waiting ask if the game has one, otherwise the instruction again. */
  private repeat() {
    if (this.game?.sayWaitingAsk?.()) return;
    if (!this.instruction) return;
    const text = voice.line(this.instruction.id, this.instruction.vars);
    this.caption.instruct(text, voice.speak(text));
  }

  /** A wrong answer's boing, for a reader who cannot hear it: the guide tilts and the band wobbles. Nothing is counted. */
  private readonly sawBoing = () => {
    if (!this.caption.placed || !this.game || this.helpCard || this.finished) return;
    this.caption.wobble();
  };

  private captionOn(): boolean {
    return captionShows(this.band, store.data.settings);
  }

  resize(view: View) {
    // The caption sits outside the board: the game gets the screen less the band, and the round's chrome moves with it.
    const place = (this.place = captionPlace(view, this.captionOn()));
    this.caption.layout(place);
    this.stage.x = this.particles.x = place.dx;
    this.game?.resize(place.game);
    this.pet.position.set(place.dx + 74, place.game.h - 18);
    this.hearAgain.position.set(place.dx + 62, place.game.h - 62);
    this.home.position.set(place.dx + 62, 62);
    this.help.position.set(place.dx + 62, 172);
    if (this.tip) this.placeTip(this.tip);
    this.helpCard?.layout(view);
    this.layoutResult(view);
  }

  enter() {
    if (this.game) this.begin();
    else if (this.inMix()) void this.sayStop();
    else void voice.say(this.mod.titleLine);
  }

  /**
   * A stop card's opening: the first stop from the mix spot offers the mix, a later one says "Next" with its title, and a hop
   * from the card before it says so first. Nothing more is said once Play has built the round or she has gone.
   */
  private async sayStop() {
    const round = this.mixRound!;
    const still = () => !this.game && !this.gone && this.app.scene === this;
    if (round.lead) {
      await voice.say(round.lead);
      if (!still()) return;
    }
    // The session's first launch came from the mix spot (or Again mix); a Home back to the same card is not a new offer.
    if (round.round === 1) {
      await voice.say('mix.offer');
      if (still()) void voice.say(this.mod.titleLine);
    } else void voice.say('mix.next', { title: titleOf(this.mod) });
  }

  update(dt: number) {
    const keys = this.keys.poll();
    const wasController = this.inputInUse.kind === 'controller';
    this.inputInUse.sample(keys);
    this.drive(keys, dt, wasController);
    if (this.resultReady) {
      this.syncDiscovery();
      this.syncMix();
    }
    // A short reminder was made for one input: a different one gets the full card with its demonstration.
    if (this.briefOpen && this.introInput() !== this.briefOpen) this.showFullIntro?.();
    // A stop card's row is for touch: a key or pad takes it off, and a touch puts it back.
    if (
      this.helpCard &&
      !this.game &&
      this.stopRow !== null &&
      this.stopRow !== (this.inputInUse.kind === 'touch')
    ) {
      this.stopRow = !this.stopRow;
      this.helpCard.layout(this.view);
    }
    // While one of the game's lines plays the guide bobs, and a board tap that did nothing meanwhile gets a soft tick (U7 R5).
    this.pet.talking = this.held.talking && !this.finished;
    // The words go while the card or the result is up; `pauseActions` takes them off under the pause sheet.
    this.caption.update(dt);
    this.caption.visible =
      this.caption.placed &&
      this.caption.wanted &&
      !!this.game &&
      !this.helpCard &&
      !this.finished &&
      !this.app.paused;
    if (this.held.frame(soundCount.n) && !this.finished && !this.helpCard) sfx.tick();
    // The how-to card holds the round still: nothing moves or counts while a grown-up reads (its demonstration, if any, plays on).
    if (this.helpCard) {
      this.helpCard.update(dt);
      return;
    }
    super.update(dt);
    if (this.finished) return;
    this.seconds += dt;
    this.game?.update(dt);
    this.stepGuide(dt);
  }

  /**
   * Keys and a pad on the island. The intro: Enter plays, Backspace goes back, left and right step the level. A round: `control()`
   * for a game that takes a controller at this level, once someone has pressed a key or button. The celebration: a ring over its
   * buttons. Esc and Start belong to the app's pause sheet.
   */
  private drive(keys: CouchControls, dt: number, wasController: boolean) {
    const lead = keys.players[0];
    if (this.finished) {
      this.pointer?.lift();
      this.driveCelebration(keys, dt, wasController);
      return;
    }
    if (this.helpCard) {
      this.pointer?.lift();
      const intro = !this.game;
      if (!keys.players.some((p) => p.action || p.back || p.undo || p.direction >= 0)) return;
      if (intro && keys.players.some((p) => p.action)) this.playFromIntro();
      else if (intro && keys.players.some((p) => p.back || p.undo)) this.backFromIntro();
      else if (intro && (lead.direction === 0 || lead.direction === 2))
        this.stepIntroLevel(lead.direction === 0 ? 1 : -1);
      else if (!intro && keys.players.some((p) => p.action || p.back || p.undo)) this.closeHelp();
      return;
    }
    if (this.game?.togglePeek && keys.players.some((p) => p.top)) {
      this.game.togglePeek();
      return;
    }
    if (pressed(keys)) this.keyed = true;
    const controlled = !!this.game?.control && controllerPlays(this.mod, this.level);
    if (this.keyed && controlled) this.game!.control!(keys, dt);
    // Any other round takes keys and a pad through the hand, which presses the game's own touch handling.
    this.pointer?.update(
      this.mod.ownKeys ? this.keys.pads : keys,
      dt,
      !!this.game && !controlled && !this.navigating && !isParentPanelOpen(),
    );
  }

  /** The buttons after a round: arrows move the ring, the bottom button presses. The first press only shows where the ring is. */
  private driveCelebration(keys: CouchControls, dt: number, wasController: boolean) {
    const after = this.after;
    if (!after) return;
    this.offeredFor += dt;
    const buttons = [
      after.again,
      ...(after.next ? [after.next] : []),
      after.home,
      ...(after.house ? [after.house] : []),
      after.heart,
      ...(after.keep ? [after.keep] : []),
    ];
    const at = Math.min(this.focus, buttons.length - 1);
    const focused = buttons[at];
    this.ring.visible = this.inputInUse.kind === 'controller';
    this.ring
      .clear()
      .circle(0, 0, focused.radius + 12)
      .stroke({ width: 14, color: 0xffffff })
      .circle(0, 0, focused.radius + 12)
      .stroke({ width: 5, color: ink });
    this.ring.position.copyFrom(focused.position);
    if (this.offeredFor < 0.35 || !wasController) return;
    for (const p of keys.players) {
      if (p.direction >= 0) {
        this.focus = nextSpot(buttons, at, p.direction);
        sfx.tick();
      } else if (p.action) {
        focused.press();
      }
    }
  }

  destroy() {
    this.gone = true;
    voice.dropTail();
    // Only our own listener: a later round may already have set its own.
    const heard = onBoing(null);
    if (heard !== this.sawBoing) onBoing(heard);
    window.removeEventListener('pointerdown', this.touchDown, true);
    window.removeEventListener('pointerup', this.touchUp);
    window.removeEventListener('pointercancel', this.touchUp);
    window.removeEventListener('blur', this.touchUp);
    this.keys?.destroy();
    this.pointer?.destroy();
    this.dailySheet?.close();
    this.closeHelp();
    this.lifetime.destroy();
    this.game?.destroy();
    super.destroy();
  }

  /**
   * Speech finishes on its own timer, so a game waiting for a line could carry on after she has left and
   * touch destroyed objects. Once the scene is gone the wait never ends, just like its tweens.
   */
  /** Whether a touch-down lands on the round's own buttons or the guide, which are not the board. */
  private onShellButton(e: PointerEvent): boolean {
    const at = new Point();
    this.app.renderer.events.mapPositionToPoint(at, e.clientX, e.clientY);
    // The bubble lies over the board and takes no touch, so a touch on it is a touch on the board.
    const buttons = [this.hearAgain, this.home, this.help, ...(this.caption.overBoard ? [] : [this.caption])];
    return buttons.some((b) => b.visible && b.getBounds().containsPoint(at.x, at.y));
  }

  private whileHere(spoken: Promise<void>): Promise<void> {
    return new Promise((resolve) => void spoken.then(() => !this.gone && resolve()));
  }

  /**
   * Leave follows the round's Back route. The other actions are available only while the round is playable.
   * Each resumes first, so a hint can speak and a restart can finish what it is doing.
   */
  override pauseActions(): PauseAction[] {
    // Read as the pause sheet opens, and the scene is not updated behind it: the caption goes until play resumes.
    this.caption.visible = false;
    const game = this.game;
    if (!game || this.finished || this.gone) return [];
    const leave = { label: 'Leave', run: () => this.leave() };
    if (this.helpCard) return [leave];
    const couch = (COUCH_INFO as Record<string, CouchInfo | undefined>)[this.mod.id];
    const labels = pauseLabels(
      this.mod.bands,
      { restart: !!game.restart, hint: !!game.askForHint },
      game.hintLabel ? { ...couch, hint: game.hintLabel } : couch,
    );
    const actions: PauseAction[] = [];
    if (labels.restart) actions.push({ label: labels.restart, run: () => game.restart?.() });
    if (labels.hint) actions.push({ label: labels.hint, run: () => game.askForHint?.() });
    if (this.inMix()) actions.push({ label: 'Skip this game', run: () => this.skipFromPause() });
    actions.push(leave);
    return actions;
  }

  /** The grown-up how-to card for this game at this level. Reading it is not a hint and changes no progress. */
  private openHelp() {
    if (this.helpCard || this.finished) return;
    const info = howToFor(this.mod, this.level);
    if (!info) return;
    // The card covers the round: a piece held by a tap goes back first, and a move being shown goes.
    cancelHeld();
    this.guide?.hand.stop();
    const card = new HowToPanel(info, () => this.closeHelp());
    card.layout(this.view);
    this.helpCard = card;
    this.ui.addChild(card);
  }

  /** The how-to card fills the screen with Play and Back, and no round has been built or started. */
  private openIntro(info: NonNullable<ReturnType<typeof howToFor>>, briefFor: IntroInput | null = null) {
    const mod = this.mod;
    const demo = briefFor ? undefined : this.demoAt(this.level);
    // Held arrows choose the level the round is built at. They stay within her band's levels, like the grown-up zone's picker.
    const range = mod.levels(this.band);
    // The ladder marks what her progress suggests and a grown-up's pin; neither follows the arrows. A celebration's next level is not a suggestion.
    const suggested = store.levelFor(mod.id, range, mod.entryLevels);
    const pinned = store.data.games[mod.id]?.pinned ?? null;
    const pick =
      range.max > range.min
        ? { range, step: (delta: 1 | -1) => this.stepIntroLevel(delta), suggested, pinned }
        : undefined;
    const hear = () => {
      voice.stop();
      void voice.say(mod.titleLine);
    };
    const intro: HowToIntro = {
      icon: () => mod.hubIcon(),
      play: () => this.playFromIntro(),
      back: () => this.backFromIntro(),
      backIcon: this.app.creatureWorld
        ? () => (this.story ? basketIcon() : backArt(this.origin, 52))
        : undefined,
      hear,
      demo,
      pick,
      levelCard: mod.levelCard,
      stops: briefFor ? undefined : this.stopRowFor(),
      brief: !!briefFor,
      showMe: () => this.showFullIntro?.(),
    };
    const card = new HowToPanel(info, () => undefined, intro);
    if (briefFor) {
      this.briefOpen = briefFor;
      this.showFullIntro = () => {
        if (!this.briefOpen || this.game || this.gone || this.helpCard !== card) return;
        this.briefOpen = null;
        this.showFullIntro = null;
        intro.brief = false;
        const shown = this.demoAt(this.level);
        if (shown) audio.hush(true);
        card.show(info, shown);
      };
    }
    // The bot's sounds sit lower behind the spoken title; the card gives them back when it closes.
    if (demo) audio.hush(true);
    // The loop that follows her in from the place would sit under a demonstration of making music; `begin` plays the same style later.
    if (isSilent(mod.music)) music.play(mod.music);
    card.layout(this.view);
    this.helpCard = card;
    this.ui.addChild(card);
  }

  /**
   * A game with a bot plays a real round in a window on the card: a ghost finger at the level on the card, or (a game with no
   * touch bot yet) the couch's controller demo, which plays its own level and so is kept as it is when the level changes.
   */
  private demoAt(level: number, current?: Demo): Demo | undefined {
    const spec = islandDemo(this.mod, level, this.band);
    if (!spec) return undefined;
    if (spec.input === 'controller' && current) return current;
    return new Demo(this.mod, { ...spec, renderer: this.app.renderer });
  }

  /** An arrow on the intro: the round will be built at the next level, and the card shows what that level asks and does. */
  private stepIntroLevel(delta: 1 | -1) {
    const card = this.helpCard;
    if (!card || this.game || this.gone) return;
    const level = stepLevel(this.level, delta, this.mod.levels(this.band));
    if (level === this.level) return;
    const info = howToFor(this.mod, level);
    if (!info) return;
    this.level = level;
    card.show(info, this.demoAt(level, card.currentDemo));
    this.setOrientation();
    this.app.applyView();
  }

  /** `touch` or `mouse` for the short reminder's key; the controller route has none (D4b). */
  private introInput(): IntroInput | null {
    return this.inputInUse.kind === 'controller' ? null : pointerKind();
  }

  private introKeyFor(input: IntroInput): string {
    return introKey({ id: this.mod.id, band: this.band, level: this.level, input });
  }

  private setOrientation() {
    // The dev-only sweep can inspect layouts before an upright rollout.
    this.upright = this.uprightArea =
      this.mod.upright === true ||
      this.mod.uprightLevels?.includes(this.level) === true ||
      (import.meta.env.DEV && new URLSearchParams(globalThis.location?.search).has('uprightall'));
  }

  /** Play: the card goes, and the round begins. */
  private playFromIntro() {
    if (this.game || !this.liveResult() || this.navigating) return;
    voice.stop();
    // Play on a full card is what introduces the mode; Play on the short reminder, a finished round and Again are not new.
    const input = this.introInput();
    if (this.helpCard && !this.briefOpen && input)
      introMemory.introduced(this.introToken, store.data, this.introKeyFor(input));
    this.briefOpen = null;
    this.showFullIntro = null;
    this.closeHelp();
    this.build().resize(this.place.game);
    this.begin();
  }

  private closeHelp() {
    if (this.helpCard) audio.hush(false);
    this.helpCard?.destroy({ children: true });
    this.helpCard = null;
  }

  private leave() {
    this.navigateResult(() => {
      void this.backLine()?.();
      this.goHome();
    });
  }

  /** The root's Back label (RW14 slice 3): "Back to Rainbow Meadow" where the origin has a name, else "Back!". Nothing on the island. */
  private backLine(): (() => Promise<void>) | null {
    if (!this.app.creatureWorld) return null;
    const from = this.story ? null : originArt(this.origin);
    return from ? () => voice.say('result.back', { place: from.place }) : () => voice.say('nav.back');
  }

  /**
   * The result's way out. At the root (RW08) a game from a location or an Explore page goes Back to it by a return arrow
   * beside its picture, and a house goes Home; there a house always goes Home (RW14 slice 3), so a result with no named
   * origin goes back by a plain arrow. A story's basket goes back to its page. On the island it is a house to the origin.
   */
  resultWayOut(): { home: RoundButton; house: RoundButton | null } {
    const root = this.app.creatureWorld;
    const from = root && !this.story ? originArt(this.origin) : null;
    const icon = from
      ? backToArt(from.picture)
      : this.story
        ? basketIcon()
        : root
          ? arrowIcon(-1, 0xffffff)
          : houseIcon(0xffffff);
    const home = new RoundButton(icon, swatch.blue, 66, () =>
      this.leaveSaying(this.backLine(), () => this.goHome()),
    );
    // On a phone Home is Today's six, where Back from a daily round already goes: one way out, no house.
    const house =
      from && !(this.app.phoneOnly && this.origin && 'daily' in this.origin)
        ? new RoundButton(houseIcon(), swatch.white, 50, () =>
            this.leaveSaying(
              () => voice.say('nav.home'),
              () => this.app.go.hub(),
            ),
          ).means('home')
        : null;
    if (root) home.means('back');
    return { home, house };
  }

  /**
   * Leaves by `run` with a spoken label (the root's Back and Home, RW14 slice 3): the word starts and the screen changes
   * after the squash's beat (`LEAVE_BEAT`), as the root's own screens do; a second press meanwhile does nothing. Without a
   * label it leaves at once.
   */
  private leaveSaying(say: (() => Promise<void>) | null, run: () => void) {
    if (!say) return this.navigateResult(run);
    this.navigateResult(() => {
      // The word plays on over the change (U7b, R3): the screen leaves after the squash's beat, not after the word.
      // A timer, not the scene's tweens: those stand still while the how-to card is open, and the card's Back leaves this way.
      void say();
      window.setTimeout(() => {
        if (!this.gone && this.app.scene === this) run();
      }, LEAVE_BEAT * 1000);
    });
  }

  /** The intro's Back. On a stop card it is the mix's Explore: the mix ends and she stays on the home spot with no sheet. */
  private backFromIntro() {
    const session = this.mixSession();
    if (!session) return this.leaveSaying(this.backLine(), () => this.goHome());
    this.leaveSaying(this.backLine(), () => {
      mixMemory.end(); // before the route: the home spot would otherwise hold the live mix
      leaveMix(this.app.go, session.live);
    });
  }

  /**
   * Back to where she came from (a land, a place, the journal), to its story's scene for a story round, or else to her home spot.
   * Inside a mix with cards on, the round's Home and the result's Home go on to the next-up stop's card instead, or to the ending.
   */
  private goHome() {
    const session = this.mixSession();
    if (session) {
      const r = mixReturn(session.state, store.data.settings.howToCards);
      if (r.kind === 'stop' && session.mods) this.openStop(r.p);
      else leaveMix(this.app.go, session.live);
      return;
    }
    // A project round names its step only once finished, so the page speaks a done line only for a finished round.
    if (this.story && 'project' in this.story)
      this.app.go.project(
        this.finished ? this.story.step : undefined,
        this.origin && 'book' in this.origin ? this.origin : undefined,
      );
    else if (this.story?.story === 'woodland') this.app.go.woodland(this.story.step);
    else if (this.story?.story === 'melody') this.app.go.melody(this.story.step);
    else if (this.story) this.app.go.picnic(this.story.step);
    else goToOrigin(this.app.go, this.origin, () => this.app.go.place(store.data.profile.band));
  }

  private finish(result: RoundResult) {
    if (this.finished || !this.liveResult() || this.navigating) return;
    this.finished = true;
    this.guide?.hand.stop();
    // A move shown on a quiet board is a hint (at most one a round); the shown first play is not (`round-guide.ts`).
    const hints = result.hints + (this.guide?.when.hints ?? 0);
    this.made = cleanCreation(result.creation);
    this.discovered = store
      .discover(result.discoveries)
      .map((id) => entryById(id))
      .filter((e): e is JournalEntry => !!e);
    this.closeHelp();
    // A form goal's round grows the blossom from what bloomed, help included; a replay of a grown one grows nothing twice.
    const asked = this.origin && 'book' in this.origin ? this.origin.form : undefined;
    if (asked && formForFlower(result.grew) === asked && store.growForm(asked, `garden:${result.grew}`))
      this.grewForm = asked;
    const band = this.band;
    this.earlierRounds = store.data.games[this.mod.id]?.plays ?? 0;
    store.recordRound(
      this.mod.id,
      {
        level: this.level,
        misses: result.misses,
        hints,
        seconds: Math.round(this.seconds),
        at: Date.now(),
      },
      this.mod.levels(band),
      // A story round plays the story's level, and a Today's six card (or its Again / Next level) the day's preset level: neither
      // moves the game's own level. A discovery opened from the six carries its origin but plays her saved level, so it adapts.
      // A level launched from the collection book's path (RW10 slice 2) leaves her saved level alone the same way.
      !this.story &&
        !(this.origin && ('daily' in this.origin || 'book' in this.origin) && this.startLevel !== undefined),
    );
    // Finishing completes the request, however much help it took.
    if (this.story && 'project' in this.story)
      store.completeWelcomeStep(this.story.step, this.made, {
        misses: result.misses,
        hints,
        level: this.level,
      });
    else if (this.story) store.completeStep(this.story.step, this.story.story ?? 'picnic');
    const seed = randomSeed();
    store.addSticker(this.mod.id, seed);
    this.shellsEarned = store.earnShells(this.mod.id, dayKey(new Date()));
    // Stamps belong to the grown-up games, read from their grown-up ladder whatever level this round played.
    if (this.mod.bands.includes('grownup')) {
      const won = store.earnStamps(this.mod.id, this.mod.levels('grownup'), {
        level: this.level,
        misses: result.misses,
        hints,
      });
      this.stampsEarned = won.kinds;
      this.shellsEarned += won.bonus;
    }
    // The round counts toward the season (the progression loop, slice 6); a goal met pays here too.
    const season = store.countSeasonRound(this.mod.id, dayKey(new Date()));
    this.shellsEarned += season.bonus;
    this.seasonGoals = season.goals;
    // A mix stop is settled once, by its first completed round; the round itself is settled above, as always.
    if (this.mixRound) mixMemory.finish(this.mixRound, store.data, seed);
    // Save the round and its sticker now: a write that only starts as the page closes can be lost.
    store.flush();
    void this.celebrate(seed);
  }

  /**
   * A grown-up's shells ride under the result's sticker (the progression loop), so they move with it; nothing is drawn at
   * the day's cap or for a band that does not earn. Under it, unless a journal card will need that room (a short, wide
   * view): then beside it.
   */
  private addShellTag(sticker: Container) {
    if (this.shellsEarned <= 0) return;
    const tag = shellTag(`+${this.shellsEarned} shells`, 26, true);
    const lines = (this.stampsEarned.length ? 1 : 0) + (this.seasonGoals.length ? 1 : 0);
    const short = this.view.h * (0.555 - 0.33) < 220 + lines * 46;
    if (this.discovered.length && short) tag.x = 110 + 24 + tag.width / 2;
    else tag.y = 142;
    tag.rotation = 0.08; // level, against the sticker's tilt
    sticker.addChild(tag);
    if (this.stampsEarned.length) {
      // One or two are named; more (a first round straight at a clean top level) are counted, to fit an upright phone.
      const n = this.stampsEarned.length;
      const words =
        n > 2
          ? `${n} new stamps`
          : `New stamp${n > 1 ? 's' : ''}: ${this.stampsEarned.map((k) => STAMP_SHORT[k]).join(', ')}`;
      const stamp = stampTag(words, 22);
      stamp.rotation = 0.08;
      // Under the shells, or (beside the sticker) under them there.
      stamp.position.set(tag.x + (tag.x ? (stamp.width - tag.width) / 2 : 0), tag.y + 46);
      sticker.addChild(stamp);
    }
    if (this.seasonGoals.length) {
      const n = this.seasonGoals.length;
      const words = n > 1 ? `${n} season goals met` : `Season goal: ${SEASON_SHORT[this.seasonGoals[0]]}`;
      const goal = stampTag(words, 22);
      goal.rotation = 0.08;
      goal.position.set(tag.x + (tag.x ? (goal.width - tag.width) / 2 : 0), tag.y + 46 * lines);
      sticker.addChild(goal);
    }
  }

  /** Happy pet, confetti, a sticker, then "again?". */
  private async celebrate(seed: number) {
    const v = this.view;
    const layer = (this.resultLayer = new Container());
    // D4a: an option a grown-up turns on. The round, sticker and settlement above are identical; only the presentation is short.
    const brief = briefResult({
      on: store.data.settings.briefResults,
      guest: !!store.entry.guest,
      id: this.mod.id,
      earlierRounds: this.earlierRounds,
      made: !!this.made,
      discovered: this.discovered.length > 0,
      grewForm: !!this.grewForm,
      story: !!this.story,
      mix: !!this.mixRound,
      daily: this.dailyRound,
      book: !!this.origin && 'book' in this.origin,
    });
    const place = resultPlace(this.origin, { story: !!this.story, root: this.app.creatureWorld });
    const backdrop = (this.resultPlace = place ? this.track(new ResultBackdrop(place, v)) : null);
    const veil = new Graphics().rect(0, 0, v.w, v.h).fill({ color: 0xfff4e3, alpha: this.veilAlpha() });
    this.resultVeil = veil;
    veil.eventMode = 'static'; // nothing underneath can be tapped now
    veil.alpha = 0;
    if (backdrop) backdrop.alpha = 0;
    const confetti = this.track(new Particles());
    const star = (this.resultStar = this.track(makeCompanion()));
    star.scale.set(0.8);
    const placeStar = () => star.position.set(this.view.w / 2, this.view.h - 20 + this.resultPetOffset.y);
    placeStar();
    this.track({ update: placeStar });
    layer.addChild(...(backdrop ? [backdrop] : []), veil, star, confetti);
    this.ui.addChild(layer);
    this.home.visible = false;
    this.help.visible = false;
    this.hearAgain.visible = false;
    this.tip?.destroy({ children: true });
    this.tip = null;

    const fade = brief ? 0.2 : 0.3;
    if (backdrop) void this.tw.to(backdrop, { alpha: 1 }, { duration: fade });
    await this.tw.to(veil, { alpha: 1 }, { duration: fade });
    void this.tw.to(this.resultPetOffset, { y: 0 }, { duration: 0.6, ease: ease.outBack });
    const colors = RAINBOW.map((c) => swatch[c].fill);
    const cannon = {
      kind: 'confetti' as const,
      colors,
      count: 40,
      speed: [550, 950] as [number, number],
      spread: 0.5,
      gravity: 700,
      life: [1.6, 2.4] as [number, number],
    };
    let stickerLine: Promise<void> | null = null;
    if (brief) {
      // The short result: the sticker at once, one cannon of confetti and one spoken line. The buttons follow below; none of
      // this waits for them, and none of it takes a press (the decoration ignores the pointer).
      confetti.burst(0, v.h, { ...cannon, count: 14, angle: -Math.PI / 3 });
      sfx.tada();
      star.poke();
      star.cheer();
      void this.tw.wait(1.3).then(() => star.hop(0.7));
      const sticker = (this.resultSticker = stickerize(this.mod.sticker(seed), 110));
      sticker.position.set(this.view.w / 2, this.view.h * 0.33);
      sticker.scale.set(0);
      sticker.rotation = -0.08;
      this.addShellTag(sticker);
      layer.addChild(sticker);
      void this.tw.to(sticker.scale, { x: 1, y: 1 }, { duration: 0.35, ease: ease.outBack });
      sfx.sparkle();
      confetti.burst(sticker.x, sticker.y, {
        kind: 'star',
        colors: [0xffd54a, 0xffffff],
        count: 18,
        speed: [200, 380],
        gravity: 0,
        life: [0.6, 1],
      });
      for (const o of [sticker, confetti, star]) o.eventMode = 'none';
      stickerLine = this.whileHere(voice.say('sticker'));
      await this.tw.wait(0.2);
    } else {
      confetti.burst(0, v.h, { ...cannon, angle: -Math.PI / 3 });
      confetti.burst(v.w, v.h, { ...cannon, angle: (-Math.PI * 2) / 3 });
      sfx.tada();
      void voice.say('praise');
      await this.tw.wait(0.5);
      // The species' own move and chirp (the sprout's hop, the river's rear, the glider's loop), then a cheer.
      star.poke();
      star.cheer();
      const hopLoop = async () => {
        for (;;) {
          await this.tw.wait(1.3);
          star.hop(0.7);
        }
      };
      void hopLoop();

      await this.tw.wait(0.6);
      const sticker = (this.resultSticker = stickerize(this.mod.sticker(seed), 110));
      sticker.position.set(this.view.w / 2, this.view.h * 0.33);
      sticker.scale.set(0);
      sticker.rotation = -0.08;
      this.addShellTag(sticker);
      layer.addChild(sticker);
      void this.tw.to(sticker.scale, { x: 1, y: 1 }, { duration: 0.55, ease: ease.outBack });
      sfx.sparkle();
      confetti.burst(sticker.x, sticker.y, {
        kind: 'star',
        colors: [0xffd54a, 0xffffff],
        count: 18,
        speed: [200, 380],
        gravity: 0,
        life: [0.6, 1],
      });
      await this.tw.wait(0.5);
      void voice.say('sticker');
      await this.tw.wait(1.8);
    }

    // A first look at something for her journal: a little card with what she found, then on to the buttons.
    if (this.discovered.length) {
      const pill = (this.resultPill = discoveryPill(this.discovered));
      pill.position.set(this.view.w / 2, this.view.h * 0.555);
      pill.scale.set(0);
      layer.addChild(pill);
      void this.tw.to(pill.scale, { x: 1, y: 1 }, { duration: 0.45, ease: ease.outBack });
      sfx.sparkle();
      confetti.burst(pill.x, pill.y, {
        kind: 'star',
        colors: [swatch.yellow.fill, 0xffffff],
        count: 12,
        speed: [160, 320],
        gravity: 0,
        life: [0.5, 0.9],
      });
      void voice.say('journal.new');
      await this.tw.wait(1.8);
    }

    // A blossom opening on her friend: the flower she grew, with her sprout's name and a sparkle.
    if (this.grewForm) {
      const pill = (this.resultPill = formPill(this.grewForm));
      pill.position.set(this.view.w / 2, this.view.h * 0.555);
      pill.scale.set(0);
      layer.addChild(pill);
      void this.tw.to(pill.scale, { x: 1, y: 1 }, { duration: 0.45, ease: ease.outBack });
      sfx.sparkle();
      confetti.burst(pill.x, pill.y, {
        kind: 'star',
        colors: [swatch.yellow.fill, 0xffffff],
        count: 14,
        speed: [160, 320],
        gravity: 0,
        life: [0.5, 0.9],
      });
      void voice.say('form.grown', {
        pet: store.data.creatures.owned.find((w) => w.species === 'sprout')?.name ?? '',
      });
      await this.tw.wait(1.8);
    }

    // "Again" plays the level she just finished (a story round plays its own), so it means what it looks like; the map applies the step up or down.
    const again = new RoundButton(againIcon(0xffffff), swatch.green, 66, () =>
      this.navigateResult(() => {
        this.relaunchMix();
        this.app.go.game(
          this.mod.id,
          this.band,
          this.story,
          true,
          this.origin,
          this.story ? undefined : this.level,
        );
      }),
    );
    // "Next level" plays the level above the one she just finished (not in a story round, which has its own level).
    const upTo =
      this.story || this.bookForm() ? null : nextLevelOffer(this.level, this.mod.levels(this.band));
    const next =
      upTo === null
        ? null
        : new RoundButton(nextIcon(0xffffff), swatch.orange, 66, () =>
            this.navigateResult(() => {
              this.relaunchMix();
              this.app.go.game(this.mod.id, this.band, undefined, true, this.origin, upTo);
            }),
          );
    const { home, house } = this.resultWayOut();
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
    // A guest (play-first slice 2) has no favorites to keep: the heart's place holds Add me, which opens the add form. It
    // is never spoken and never pressed on anyone; Keep playing is the next-of-six tile as for anyone.
    const guest = store.entry.guest;
    const heart = guest
      ? new RoundButton(plusIcon(0xffffff), swatch.purple, 56, () =>
          this.navigateResult(() => this.app.go.start(true)),
        )
      : new RoundButton(heartIcons, swatch.pink, 56, () => {
          if (!this.liveResult() || this.navigating) return;
          this.speechSerial++;
          const on = store.toggleFavorite(this.mod.id);
          show(on);
          if (on) {
            sfx.sparkle();
            confetti.burst(heart.x, heart.y, {
              kind: 'star',
              colors: [swatch.pink.fill, 0xffffff],
              count: 14,
              speed: [180, 340],
              gravity: 0,
              life: [0.5, 0.9],
            });
            void this.resultVoice('heart.on');
          } else void this.resultVoice('heart.off');
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
        if (kept || !this.liveResult() || this.navigating) return;
        this.speechSerial++;
        kept = true;
        store.keepCreation(made);
        house.visible = false;
        check.visible = true;
        sfx.sparkle();
        confetti.burst(keep!.x, keep!.y, {
          kind: 'star',
          colors: [swatch.green.fill, 0xffffff],
          count: 14,
          speed: [180, 340],
          gravity: 0,
          life: [0.5, 0.9],
        });
        void this.resultVoice('keep.done');
      });
    }
    this.after = { again, next, heart, home, house, keep };
    // At the root each picture carries its name (U1), so the way on reads with the sound off.
    if (this.app.creatureWorld)
      for (const k of ['again', 'next', 'heart', 'home', 'house', 'keep'] as const)
        this.after[k]?.named(k === 'heart' && guest ? RESULT_NAMES.addMe : RESULT_NAMES[k], RESULT_NAME_W[k]);
    if (guest) heart.label = 'add-me';
    for (const b of [
      again,
      ...(next ? [next] : []),
      heart,
      home,
      ...(house ? [house] : []),
      ...(keep ? [keep] : []),
    ]) {
      b.scale.set(0);
      layer.addChild(b);
      void this.tw.to(b.scale, { x: 1, y: 1 }, { duration: 0.45, ease: ease.outBack });
    }
    layer.addChild(this.ring);
    this.layoutResult(this.view);
    // The full result asks "again?" at once. The short one lets its single sticker line finish first.
    let speech = brief ? Promise.resolve() : this.resultVoice(keep ? 'keep.offer' : 'again');
    let serial = this.speechSerial;
    // Wait out the buttons' arrival. A finger already held over the new tile has never armed it.
    await this.tw.wait(0.45);
    if (!this.liveResult() || this.navigating) return;
    this.resultReady = true;
    this.syncDiscovery(false);
    this.syncMix();
    const nextDaily = this.showDailyNext();
    if (brief) {
      await stickerLine;
      // A button pressed meanwhile (the heart's own line) has already spoken: ask nothing over it.
      if (this.speechSerial !== serial || !this.liveResult() || this.navigating) return;
      speech = this.resultVoice('again');
      serial = this.speechSerial;
    }
    await speech;
    if (this.speechSerial === serial && nextDaily && this.liveResult() && !this.navigating)
      void voice.say('mix.next', { title: titleOf(nextDaily.mod) });
    if (this.speechSerial === serial && this.discovery?.tile.visible) this.sayDiscovery('discovery.offer');
    if (this.speechSerial === serial && this.mixControls?.tile.visible) this.sayMix();
  }

  /** Save identity plus epoch rejects reset/restore and switching away then back, even to the same profile ID. */
  private liveResult(): boolean {
    return !this.gone && this.app.scene === this && discoveryMemory.current(this.discoveryToken, store.data);
  }

  private navigateResult(run: () => void) {
    if (!this.liveResult() || this.navigating) return;
    this.navigating = true;
    this.speechSerial++;
    voice.stop();
    run();
  }

  /** A Today's six card's round (or its Again / Next level): its result offers the next of the six, not a discovery. */
  private get dailyRound(): boolean {
    return !!this.origin && 'daily' in this.origin && this.startLevel !== undefined && !this.story;
  }

  /**
   * On a daily round's result: the next of today's six not yet played, in D1b's rectangle (so "Play all" is one tap per
   * game), and for a grown-up a pencil that opens the playtest note for this game. Nothing when the six are done: the way
   * out goes back to the page and its flourish.
   */
  private showDailyNext(): DailyPick | null {
    if (!this.dailyRound || this.mixRound || !this.resultLayer) return null;
    const day = dayKey(new Date());
    const played = (id: string) => playedOn(store.data.games[id]?.history, day);
    const picks = todaysSix(day, this.app.uprightPhone(), this.app.phoneOnly);
    const live = () => this.liveResult() && !this.navigating && this.resultReady && !this.dailySheet;
    const next = nextOfSix(picks, this.mod.id, played);
    if (next) {
      const tile = new DiscoveryTile(
        DAILY_NEXT.w,
        DAILY_NEXT.h,
        nextGameArt(next.mod, titleOf(next.mod)),
        () =>
          this.navigateResult(() =>
            this.app.go.game(next.mod.id, next.band, undefined, false, { daily: true }, next.level),
          ),
        live,
      );
      this.resultLayer.addChild(tile);
      this.dailyNext = tile;
    }
    if (store.data.profile.band === 'grownup' && picks.some((p) => p.mod.id === this.mod.id)) {
      const pencil = new RoundButton(noteIcon(), swatch.white, 50, () => {
        if (!live()) return;
        this.speechSerial++;
        voice.stop();
        this.dailySheet = openPlaytestSheet({
          day,
          picks,
          played,
          only: this.mod.id,
          onClose: () => (this.dailySheet = null),
        });
      });
      this.resultLayer.addChild(pencil);
      this.dailyNote = pencil;
    }
    this.layoutDaily(this.view);
    return next;
  }

  private candidates() {
    // Inside a mix the mix's own controls take D1b's rectangles, so two "next" pictures never compete; so does a daily round's next of six.
    if (this.mixRound || this.dailyRound) return [];
    return discoveryCandidates(
      { current: this.mod.id, band: store.data.profile.band, playedBand: this.band, story: !!this.story },
      GAMES,
    );
  }

  private canDiscover(): boolean {
    return (
      this.liveResult() &&
      !this.navigating &&
      this.resultReady &&
      this.inputInUse.kind === 'touch' &&
      !this.returningTouch &&
      !this.app.paused &&
      !isParentPanelOpen()
    );
  }

  /** Only eligibility changes can replace a displayed offer. Frames/resize/Heart/Keep retain it. */
  private syncDiscovery(speak = true) {
    if (!this.resultReady) return;
    const candidates = this.liveResult() ? this.candidates() : [];
    if (this.discovery && !candidates.some((m) => m.id === this.discovery!.id))
      this.replaceDiscovery(candidates, speak);
    else if (!this.discovery && candidates.length && this.canDiscover())
      this.replaceDiscovery(candidates, speak);
    const offer = this.discovery;
    if (!offer) return;
    const visible = this.canDiscover();
    const other = candidates.find((m) => m.id !== offer.id);
    const mod = candidates.find((m) => m.id === offer.id);
    if (visible && mod && other?.id !== offer.anotherId) {
      offer.another?.destroy({ children: true });
      offer.another = other ? this.makeAnother(mod, other) : null;
      offer.anotherId = other?.id;
    }
    offer.tile.visible = visible;
    if (!visible) offer.tile.cancel();
    if (offer.another) {
      offer.another.visible = visible && candidates.length > 1;
      if (!offer.another.visible) offer.another.cancel();
    }
  }

  private replaceDiscovery(candidates = this.candidates(), speak = true, another = false) {
    this.discovery?.tile.destroy({ children: true });
    this.discovery?.another?.destroy({ children: true });
    this.discovery = null;
    const mod = suggestDiscovery(candidates, store.data.games, discoveryMemory.last);
    if (!mod || !this.canDiscover()) {
      if (!mod && speak && this.canDiscover()) void this.queueDiscovery('discovery.empty');
      return;
    }
    const tile = new DiscoveryTile(
      288,
      112,
      nextGameArt(mod, SCRIPT[mod.titleLine][0].replace(/!$/, '')),
      () => this.chooseDiscovery(mod.id),
      () => this.canDiscover(),
    );
    tile.position.set(32, 24);
    const other = candidates.find((m) => m.id !== mod.id);
    this.resultLayer!.addChild(tile);
    const cycle = other ? this.makeAnother(mod, other) : null;
    this.discovery = { id: mod.id, tile, another: cycle, anotherId: other?.id };
    discoveryMemory.displayed(this.discoveryToken, store.data, mod.id);
    if (speak) this.sayDiscovery(another ? 'discovery.another' : 'discovery.offer');
  }

  private makeAnother(mod: GameModule, other: GameModule): DiscoveryTile {
    const tile = new DiscoveryTile(
      112,
      112,
      anotherGameArt(mod, other),
      () => {
        if (this.canDiscover()) this.replaceDiscovery(this.candidates(), true, true);
      },
      () => this.canDiscover(),
    );
    tile.position.set(32, 160);
    this.resultLayer!.addChild(tile);
    return tile;
  }

  private sayDiscovery(line: 'discovery.offer' | 'discovery.another') {
    const mod = this.candidates().find((m) => m.id === this.discovery?.id);
    if (!mod || !this.canDiscover()) return;
    void this.queueDiscovery(line, SCRIPT[mod.titleLine][0].replace(/!$/, ''), mod.id);
  }

  private resultVoice(line: LineId): Promise<void> {
    this.speechSerial++;
    return (this.resultSpeech = this.whileHere(voice.say(line)));
  }

  /** An offer restored or deliberately changed mid-speech waits for the ordinary result/Keep line. */
  private async queueDiscovery(line: LineId, title?: string, id = this.discovery?.id) {
    const serial = ++this.speechSerial;
    await this.resultSpeech;
    if (serial !== this.speechSerial || this.discovery?.id !== id || !this.canDiscover()) return;
    await voice.say(line, title ? { title } : undefined);
  }

  private chooseDiscovery(id: string) {
    if (!this.canDiscover() || id !== this.discovery?.id) return;
    if (!this.candidates().some((m) => m.id === id)) {
      this.replaceDiscovery(); // Never launch a replacement behind the old picture.
      return;
    }
    this.navigateResult(() => launchDiscovery(this.app.go, id, store.data.profile.band, this.origin));
  }

  // Little surprises (D2b) ------------------------------------------------------------------

  override holdsMix(): boolean {
    return this.inMix();
  }

  private inMix(): boolean {
    return !!this.mixRound && mixMemory.current(this.mixRound, store.data);
  }

  /** The live mix's home spot, stops (its own lineup's pictures) and state, or nothing once it has ended or the save changed. */
  private mixSession() {
    if (!this.mixRound || !this.inMix()) return undefined;
    const session = mixMemory.live(store.data)!;
    const mods = session.ids.map((id) => GAMES.find((m) => m.id === id)).filter((m): m is GameModule => !!m);
    return { place: session.place, state: session.state, mods, ids: session.ids, live: session };
  }

  /** Stop `p`, checked on its own at the press: playable at her band on her home spot, or null. */
  private mixStopAt(p: number): GameModule | null {
    const session = this.mixSession();
    if (!session) return null;
    const band = store.data.profile.band;
    return session.live.stops
      ? dailyStop(band, GAMES, session.live.stops[p])
      : mixStop(band, session.place, GAMES, session.ids[p]);
  }

  /** Again and Next level replay the same stop: a new round there, and the stops to come stay as they were. */
  private relaunchMix() {
    if (this.mixRound && this.inMix()) mixMemory.launch(store.data, this.mixRound.p);
  }

  /** Shown with the result's buttons, only to touch, like D1b's offer; rebuilt only when the next stop changes. */
  private syncMix() {
    if (!this.resultReady || !this.resultLayer) return;
    const session = this.mixSession();
    const visible = !!session && this.canDiscover();
    const next = session ? nextUp(session.state) : null;
    if (session && session.mods && (!this.mixControls || this.mixControls.next !== next))
      this.buildMix(session.mods, next);
    const c = this.mixControls;
    if (!c) return;
    c.tile.visible = visible;
    if (!visible) c.tile.cancel();
    if (c.skip) {
      c.skip.visible = visible;
      if (!visible) c.skip.cancel();
    }
  }

  private buildMix(mods: GameModule[], next: number | null) {
    this.mixControls?.tile.destroy({ children: true });
    this.mixControls?.skip?.destroy({ children: true });
    const state = this.mixSession()!.state;
    const art = next === null ? allDoneArt(mods) : nextStopArt(mods[next], titleOf(mods[next]), state);
    const tile = new DiscoveryTile(
      288,
      112,
      art,
      () => this.chooseMixNext(),
      () => this.canDiscover(),
      swatch.yellow,
    );
    tile.position.set(32, 24);
    const hop = new Container();
    const icon = hopIcon(swatch.yellow.line);
    icon.position.set(56, 60);
    hop.addChild(icon);
    const skip =
      next === null
        ? null
        : new DiscoveryTile(
            112,
            112,
            hop,
            () => this.skipMixNext(),
            () => this.canDiscover(),
            swatch.yellow,
          );
    skip?.position.set(32, 160);
    this.resultLayer!.addChild(tile, ...(skip ? [skip] : []));
    this.mixControls = { tile, skip, next };
  }

  private sayMix() {
    const session = this.mixSession();
    if (!session?.mods || !this.canDiscover()) return;
    const next = nextUp(session.state);
    void this.queueMix(
      next === null ? 'mix.last' : 'mix.next',
      next === null ? undefined : titleOf(session.mods[next]),
    );
  }

  private async queueMix(line: LineId, title?: string) {
    const serial = ++this.speechSerial;
    await this.resultSpeech;
    if (serial !== this.speechSerial || !this.canDiscover()) return;
    await voice.say(line, title ? { title } : undefined);
  }

  /** Next stop: a new round at the next stop, latched once; All done goes to the ending on her home spot. */
  private chooseMixNext() {
    const session = this.mixSession();
    if (!session || !this.canDiscover()) return;
    const next = nextUp(session.state);
    if (next === null) {
      this.navigateResult(() => leaveMix(this.app.go, session.live));
      return;
    }
    this.launchMixStop(next);
  }

  /** Checked again at the press: never a different game behind its picture. */
  private launchMixStop(p: number) {
    const session = this.mixSession();
    const mod = this.mixStopAt(p);
    if (!session || !mod) {
      mixMemory.apply(store.data, { type: 'unavailable', p });
      this.syncMix();
      void this.queueMix('mix.changed');
      return;
    }
    this.navigateResult(() => this.openStop(p));
  }

  /** A new round at stop `p`, opened on its card (with cards on): already checked, and inside a latched navigation. */
  private openStop(p: number, lead?: MixRound['lead']) {
    const session = this.mixSession();
    const mod = this.mixStopAt(p);
    if (!session) return this.app.go.place(store.data.profile.band);
    if (!mod) return leaveMix(this.app.go, session.live);
    mixMemory.launch(store.data, p, lead);
    launchStop(this.app.go, session.live, p, store.data.profile.band);
  }

  /** The stop row for this card: only on the intro of a live mix stop, and only while the input in use is touch. */
  private stopRowFor(): HowToIntro['stops'] {
    const session = this.mixSession();
    const mods = session?.mods;
    if (!session || !mods) return undefined;
    this.stopRow = this.inputInUse.kind === 'touch';
    return {
      count: mods.length,
      shown: () => this.inputInUse.kind === 'touch' && this.inMix(),
      tiles: () => {
        const state = this.mixSession()?.state ?? session.state;
        const next = this.mixRound!.p;
        return mods.map(
          (mod, p) => new StopTile(mod, state.items[p], p === next, () => this.hearStop(p), 100),
        );
      },
      skip: () => this.skipFromCard(),
    };
  }

  /** A stop tile on the card says its title and never launches. */
  private hearStop(p: number) {
    const mods = this.mixSession()?.mods;
    if (!mods || this.game) return;
    voice.stop();
    void voice.say('mix.stop', { title: titleOf(mods[p]) });
  }

  /** Skip on a stop card: the shown stop is hopped over once, then the next stop's card, or the ending on the home spot. */
  private skipFromCard() {
    const session = this.mixSession();
    const p = this.mixRound?.p;
    if (
      !session ||
      p === undefined ||
      this.game ||
      this.navigating ||
      !this.liveResult() ||
      session.state.items[p]?.state !== 'upcoming'
    )
      return;
    const after = mixMemory.apply(store.data, { type: 'skip', p })!;
    const r = mixReturn(after, true);
    this.navigateResult(() => {
      if (r.kind === 'stop' && session.mods) this.openStop(r.p, 'mix.skip');
      else leaveMix(this.app.go, session.live); // the home spot or the six page opens the ending and says it
    });
  }

  private skipMixNext() {
    const session = this.mixSession();
    const next = session ? nextUp(session.state) : null;
    if (!session || next === null || !this.canDiscover()) return;
    mixMemory.apply(store.data, { type: 'skip', p: next });
    this.syncMix();
    void this.queueMix('mix.skip').then(() => this.sayMix());
  }

  /** The pause sheet's Skip this game: an unfinished stop is hopped over (a played one stays played), then the next stop or the ending. */
  private skipFromPause() {
    const session = this.mixSession();
    if (!session || this.finished) return;
    mixMemory.apply(store.data, { type: 'skip', p: this.mixRound!.p });
    const next = nextUp(mixMemory.live(store.data)!.state);
    if (next === null || !session.mods) this.navigateResult(() => leaveMix(this.app.go, session.live));
    else this.launchMixStop(next);
  }

  /** Flat cream where the result has no place behind it; softer over a place, so the place shows through. */
  private veilAlpha() {
    return this.resultPlace ? 0.45 : 0.8;
  }

  /** Every existing result element keeps its original center formula when the usable view changes. */
  private layoutResult(view: View) {
    this.resultPlace?.resize(view);
    this.resultVeil?.clear().rect(0, 0, view.w, view.h).fill({ color: 0xfff4e3, alpha: this.veilAlpha() });
    this.resultStar?.position.set(view.w / 2, view.h - 20 + this.resultPetOffset.y);
    const at = resultSpots(view, !!this.after?.house);
    this.resultSticker?.position.set(at.sticker.x, at.sticker.y);
    this.resultPill?.position.set(at.pill.x, at.pill.y);
    const a = this.after;
    if (!a) return;
    a.again.position.set(at.again.x, at.again.y);
    a.next?.position.set(at.next.x, at.next.y);
    a.home.position.set(at.home.x, at.home.y);
    a.house?.position.set(at.house.x, at.house.y);
    a.heart.position.set(at.heart.x, at.heart.y);
    a.keep?.position.set(at.keep.x, at.keep.y);
    this.layoutDaily(view);
  }

  private layoutDaily(view: View) {
    const at = dailySpots(view);
    this.dailyNext?.position.set(at.next.x, at.next.y);
    this.dailyNote?.position.set(at.note.x, at.note.y);
  }

  /** A small card for the grown-up, which fades after a few seconds or when tapped. */
  /**
   * The tip at the top centre, its small text boosted on a phone; on the narrow upright area (chunk 31) a tip that would
   * cover Home and "?" moves down below them instead.
   */
  private placeTip(card: Container) {
    const v = this.view;
    // Small text stays readable on a phone, and the card never runs off the sides of an upright one.
    card.scale.set(1);
    card.scale.set(Math.min(textBoost(v.scale), (v.w - 24) / card.width));
    card.position.set(v.w / 2, v.w / 2 - card.width / 2 < 124 ? 220 : 16);
  }

  private showTip(template: string) {
    const name = store.data.profile.name.trim() || 'your little one';
    const body = new Text({
      text: template.replaceAll('{name}', name),
      style: {
        fontFamily: FONT,
        fontSize: 19,
        fill: ink,
        fontWeight: '500',
        align: 'center',
        wordWrap: true,
        // Narrower on an upright phone, so the boosted card still fits across it.
        wordWrapWidth: Math.max(260, Math.min(520, (this.view.w - 24) / textBoost(this.view.scale) - 40)),
      },
    });
    const head = new Text({
      text: 'GROWN-UP TIP',
      // 16 so the label still reads at about 11 px once a phone scales the card down.
      style: { fontFamily: FONT, fontSize: 16, fill: 0x6b6b7b, fontWeight: '600', letterSpacing: 1.5 },
    });
    head.anchor.set(0.5, 0);
    body.anchor.set(0.5, 0);
    head.y = 12;
    body.y = 35;
    const w = Math.max(body.width, head.width) + 40;
    const card = new Container();
    card.addChild(
      new Graphics()
        .roundRect(-w / 2, 0, w, body.height + 49, 18)
        .fill({ color: 0xffffff, alpha: 0.94 })
        .stroke({ width: 2, color: 0xeadfcd }),
      head,
      body,
    );
    card.alpha = 0;
    // `resize` only moves a tip that already exists, and a tip made after the first resize (once Play is pressed) would sit at the origin, over the home button.
    this.placeTip(card);
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

/** A pencil, for a grown-up's playtest note on a daily round's result. */
function noteIcon(): Graphics {
  return new Graphics()
    .poly([-18, 18, -13, 2, 9, -20, 20, -9, -2, 13])
    .fill(swatch.yellow.fill)
    .stroke({ color: ink, width: 4, join: 'round' })
    .poly([-18, 18, -13, 2, -2, 13])
    .fill(0xfff4e3)
    .stroke({ color: ink, width: 4, join: 'round' });
}
