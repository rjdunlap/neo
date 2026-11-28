import type { HubIcon } from '../../games/types';
import { Circle, Container, Graphics, Rectangle, Text } from 'pixi.js';
import { cream, ink, swatch } from '../../art/palette';
import { homeBackdrop } from '../../art/home/backdrop';
import { music, STYLES } from '../../audio/music';
import { sfx } from '../../audio/sfx';
import { voice } from '../../audio/voice';
import { dayKey, levelDots, levelLine, playedOn, type DailyPick } from '../../content/daily';
import { dailyEndingLine, dailyStop, dailyStops, nextUp, startDaily } from '../../content/mix';
import { SCRIPT } from '../../content/voice-script';
import { GAMES } from '../../games/registry';
import { MixSheet } from '../../ui/mix';
import { launchStop, mixMemory } from '../discovery';
import { todaysSix } from '../daily-six';
import { makeCompanion } from '../../creatures/companion';
import { BACK } from '../../creatures/friends-layout';
import { CORNER_RADIUS, GUIDE_CORNER, HOME_BUTTON } from '../../creatures/home-layout';
import { onTap } from '../../engine/input';
import type { View } from '../../engine/view';
import { store } from '../../progress/store';
import { RoundButton } from '../../ui/buttons';
import { arrowIcon, checkIcon, houseIcon, playIcon, tilesIcon } from '../../ui/icons';
import { openPlaytestSheet, type PlaytestSheet } from '../../ui/playtest-sheet';
import { fitArt } from '../../ui/origin-art';
import { FONT, namePill } from '../../ui/text';
import { lantern, shellTag } from '../../ui/shells';
import { openStampsSheet, type StampsSheet } from '../../ui/stamps-sheet';
import { resultOn } from '../../content/sixes';
import { earnsShells } from '../../content/shells';
import type { App } from '../App';
import { Scene } from '../Scene';
import { WayOut } from '../leave';

const MUTED = 0x6b6b7b;
/** The top of the card grid, under the corner buttons and the title. */
const TOP = 150;
const MAX_CARD = 230;
/** A tall view (a phone held upright) has the whole width for two columns, so its cards may be larger. */
const MAX_CARD_TALL = 300;
/** The strip a tall view keeps under the cards for the bottom-left friend and the notes button. */
const TALL_FOOT = 190;
const MIN_CARD = 120;
/** Room under a card for its name, level dots and (a grown-up's) level line. */
const UNDER = 116;
/** The level dots: one per level on the band's ladder, the day's level and those below it filled. */
const DOT_GAP = 16;

/** One of the day's six on the page, so a script can find and press it. */
export interface DailyCard {
  pick: DailyPick;
  node: Container;
}

/**
 * Today's six (D10, docs/definitions/todays-six.md): six picture cards chosen for the day from her band (`dailySix`), each
 * at a preset level from its ladder shown as a row of dots (a grown-up's card also names it), a tick on the ones she has
 * played today, and one tap to play. Reached from Home's button or `?daily`; Back goes to the hub (Home at the root); the
 * tiles button opens All games, so nothing outside the six is out of reach. Nothing is owed: no streak. A grown-up's shells
 * (the progression loop) show beside the date; they are earned by rounds, never by visits.
 */
export class DailyScene extends Scene {
  /** Laid out for a phone held upright as well (chunk 31). */
  upright = true;
  uprightArea = true;
  private readonly backdrop = homeBackdrop();
  /** Back goes Home; on a phone, where the six are the whole app (`App.phoneOnly`), and for a guest, to "Who's playing?". */
  readonly back = new RoundButton(arrowIcon(-1), swatch.white, CORNER_RADIUS, () =>
    this.leave(
      this.back,
      () => (this.app.phoneOnly || store.entry.guest ? this.app.go.start() : this.app.go.hub()),
      () => voice.say('nav.back'),
    ),
  ).means('back');
  /** Play all: the preview of the six through the mix planner (slice 3); ticked games start played. */
  readonly playAll = new RoundButton(playIcon(), swatch.green, CORNER_RADIUS, () => this.startPlayAll());
  /** The preview and the ending of a live Play all, over the page. */
  sheet: MixSheet | null = null;
  /** A grown-up's playtest notes on today's six (plain HTML, `src/ui/playtest-sheet.ts`); never drawn for a child. */
  readonly notes: RoundButton | null;
  private notesSheet: PlaytestSheet | null = null;
  /** A grown-up's stamps (the progression loop): a lantern button beside the notes; null for a band that does not earn. */
  readonly stamps: RoundButton | null;
  /** Lantern Lodge, for a band that earns shells (the progression loop, slice 7). */
  readonly lodge: RoundButton | null;
  private stampsSheet: StampsSheet | null = null;
  readonly all = new RoundButton(fitArt(tilesIcon(), 56), swatch.white, CORNER_RADIUS, () =>
    this.leave(
      this.all,
      () => this.app.go.explore('arcade', 0, 'all'),
      () => voice.say('explore.all'),
    ),
  );
  private readonly title = new Text({
    text: "Today's six",
    style: { fontFamily: FONT, fontSize: 40, fill: ink, fontWeight: '600' },
  });
  private readonly date = new Text({
    text: '',
    style: { fontFamily: FONT, fontSize: 20, fill: MUTED, fontWeight: '500' },
  });
  private readonly plate = new Graphics();
  /** A grown-up's shells (the progression loop), beside the date; null for a band that does not earn them. */
  purse = earnsShells(store.data.profile.band) ? shellTag(String(store.data.shells.balance), 20) : null;
  /** The pet in the bottom-left corner the cards keep clear of: a poke repeats the page's line, and it cheers when all six are done. */
  readonly pip = makeCompanion();
  /** Over the friend for a band that earns shells: a tap on either opens the friend's own page and shop. */
  readonly shopTag = earnsShells(store.data.profile.band)
    ? namePill(store.companion ? `${store.companion.name}'s shop` : 'Choose a friend')
    : null;
  readonly day = dayKey(new Date());
  picks: DailyPick[];
  cards: DailyCard[] = [];
  /** The first tap's way out; a second tap while leaving does nothing (U7 R2). */
  private readonly out = new WayOut(
    (s) => this.tw.wait(s),
    () => this.app.scene === this,
  );
  private readonly grownUp = store.data.profile.band === 'grownup';
  private uprightPhone: boolean;

  constructor(app: App) {
    super(app);
    // A phone held upright draws its six from the upright-ready games first (chunk 31); the rest wear a turn badge.
    this.uprightPhone = app.uprightPhone();
    this.picks = this.pickSix();
    this.notes = this.grownUp
      ? new RoundButton(pencilIcon(), swatch.white, CORNER_RADIUS, () => this.openNotes())
      : null;
    this.stamps = earnsShells(store.data.profile.band)
      ? new RoundButton(lanternIcon(), swatch.white, CORNER_RADIUS, () => this.openStamps())
      : null;
    this.lodge = earnsShells(store.data.profile.band)
      ? new RoundButton(houseIcon(), swatch.white, CORNER_RADIUS, () => this.openLodge())
      : null;
    this.date.text = new Date().toLocaleDateString(undefined, {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    });
  }

  private pickSix(): DailyPick[] {
    return todaysSix(this.day, this.uprightPhone, this.app.phoneOnly);
  }

  private played(id: string): boolean {
    return playedOn(store.data.games[id]?.history, this.day);
  }

  /** Every card has a tick. */
  get allPlayed(): boolean {
    return this.picks.every((p) => this.played(p.mod.id));
  }

  /** The cards' animated icons, untracked when a turn redraws the cards: a destroyed icon updated every frame throws. */
  private icons: HubIcon[] = [];

  private buildCards() {
    for (const icon of this.icons) this.untrack(icon);
    this.icons = [];
    for (const c of this.cards) c.node.destroy({ children: true });
    this.cards = this.picks.map((pick) => ({ pick, node: this.card(pick) }));
    for (const c of this.cards) this.ui.addChild(c.node);
  }

  /** Opens a game; the tapped card (or Play all) shows it was chosen. The game says its own name as it opens. */
  private open(pick: DailyPick, from: Container) {
    void this.leave(from, () =>
      this.app.go.game(pick.mod.id, pick.band, undefined, false, { daily: true }, pick.level),
    );
  }

  private get leaving(): boolean {
    return this.out.leaving;
  }

  private openLodge() {
    if (this.stampsSheet || this.notesSheet || this.sheet || this.leaving) return;
    this.app.go.lodge();
  }

  private openFriendPage() {
    if (this.stampsSheet || this.notesSheet || this.sheet || this.leaving) return;
    this.app.go.friendPage();
  }

  private openStamps() {
    if (this.stampsSheet || this.notesSheet || this.sheet || this.leaving) return;
    voice.stop();
    this.stampsSheet = openStampsSheet(() => (this.stampsSheet = null), {
      day: this.day,
      dateWords: new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      results: this.picks.map((p) => resultOn(store.data.games[p.mod.id]?.history, this.day)),
    });
  }

  private openNotes() {
    if (this.notesSheet || this.stampsSheet || this.sheet || this.leaving) return;
    voice.stop();
    this.notesSheet = openPlaytestSheet({
      day: this.day,
      picks: this.picks,
      played: (id) => this.played(id),
      onClose: () => (this.notesSheet = null),
    });
  }

  init() {
    this.content.addChild(this.backdrop);
    this.title.anchor.set(0.5, 0.5);
    this.date.anchor.set(0.5, 0.5);
    this.pip.scale.set(0.55);
    this.pip.hitArea = new Circle(0, -120, 155);
    onTap(this.pip, () => {
      this.pip.poke();
      // A grown-up's friend opens its own page and shop (the progression loop, slice 4).
      if (this.shopTag) this.openFriendPage();
      else void voice.say(this.allPlayed ? 'daily.done' : 'daily.open');
    });
    if (this.shopTag) onTap(this.shopTag, () => this.openFriendPage(), { cooldown: 400 });
    this.ui.addChild(
      this.plate,
      this.title,
      this.date,
      ...(this.purse ? [this.purse] : []),
      this.back,
      this.all,
      this.playAll,
      this.track(this.pip),
      ...(this.shopTag ? [this.shopTag] : []),
    );
    if (this.notes) this.ui.addChild(this.notes);
    if (this.stamps) this.ui.addChild(this.stamps);
    if (this.lodge) this.ui.addChild(this.lodge);
    // On a phone the six are the whole app: there is no All games to open.
    // A guest (play-first slice 2) has the six and their rounds only: no Arcade until Add me.
    this.all.visible = !this.app.phoneOnly && !store.entry.guest;
    this.buildCards();
    this.place();
  }

  private card(pick: DailyPick): Container {
    const node = new Container();
    const icon = this.track(pick.mod.hubIcon());
    this.icons.push(icon);
    const art = new Container();
    art.addChild(icon);
    const played = playedOn(store.data.games[pick.mod.id]?.history, this.day);
    const frame = new Graphics();
    frame.label = 'frame';
    const name = new Text({
      text: pick.mod.name,
      style: {
        fontFamily: FONT,
        fontSize: 22,
        fill: ink,
        fontWeight: '600',
        align: 'center',
        wordWrap: true,
        wordWrapWidth: 200,
        lineHeight: 24,
      },
    });
    name.anchor.set(0.5, 0);
    name.label = 'name';
    const pill = new Graphics();
    pill.label = 'pill';
    const level = new Text({
      text: this.grownUp ? pick.mod.describeLevel(pick.level) : '',
      style: {
        fontFamily: FONT,
        fontSize: 15,
        fill: MUTED,
        fontWeight: '500',
        align: 'center',
        wordWrap: true,
        wordWrapWidth: 200,
        lineHeight: 18,
      },
    });
    level.anchor.set(0.5, 0);
    level.label = 'level';
    const dots = new Graphics();
    dots.label = 'dots';
    const tick = new Container();
    tick.addChild(
      new Graphics().circle(0, 0, 26).fill(swatch.green.fill).stroke({ color: 0xffffff, width: 5 }),
      checkIcon(),
    );
    tick.children[1].scale.set(0.8);
    tick.label = 'tick';
    tick.visible = played;
    art.label = 'art';
    // Not upright-ready yet, on a phone held upright: a small phone turned on its side; opening it shows the turn prompt.
    const turn = turnBadge();
    turn.label = 'turn';
    turn.visible = this.uprightPhone && !pick.mod.upright && !pick.mod.uprightLevels?.includes(pick.level);
    node.addChild(frame, art, pill, name, dots, level, tick, turn);
    onTap(
      node,
      () => {
        if (this.leaving) return;
        sfx.tick();
        node.scale.set(0.92); // pressed, and held so while the screen changes
        voice.stop();
        this.open(pick, node);
      },
      { cooldown: 400 },
    );
    return node;
  }

  /**
   * The way out (U7 R2, R3): the pressed picture stays chosen and the rest dim, its line starts, and the screen changes
   * after the squash's beat rather than after the line; a second tap while leaving does nothing.
   */
  private leave(node: Container, go: () => void, say?: () => Promise<void>) {
    const others = [
      this.back,
      this.all,
      this.playAll,
      this.notes,
      this.stamps,
      ...this.cards.map((c) => c.node),
    ];
    return this.out.take(node, others, go, say);
  }

  resize(v: View) {
    // A turn redraws the badges. The island trial also changes which games it draws from first.
    const upright = this.app.uprightPhone();
    if (upright !== this.uprightPhone && !this.leaving) {
      this.uprightPhone = upright;
      if (!this.app.phoneOnly) this.picks = this.pickSix();
      this.buildCards();
    }
    this.place();
    this.sheet?.layout(v);
  }

  /**
   * Three across and two down when wide, inside the band between the guide corners so the bottom row stays clear of the
   * bottom-left friend, a card as large as its cell allows up to 230 units. Two across and three down when tall, across the
   * whole width with a strip kept under them for the friend, a card up to 300 units and its level line larger.
   */
  private place() {
    const v = this.view;
    const scale = Math.max(v.w / 1536, v.h / 1024);
    this.backdrop.position.set(v.w / 2, v.h);
    this.backdrop.scale.set(scale);
    this.back.position.set(BACK.x, BACK.y);
    this.all.position.set(HOME_BUTTON.x, HOME_BUTTON.y);
    this.pip.position.set(92, v.h - 12);
    // Beside the friend, not over it: a long friend (River) would hide behind the pill.
    // A wide view keeps cards out of the left corner, so the pill goes above the friend there.
    if (v.w >= v.h) this.shopTag?.position.set(12 + this.shopTag.width / 2, v.h - 170);
    else this.shopTag?.position.set(170 + this.shopTag.width / 2, v.h - 40);
    const wide = v.w >= v.h;
    // The title sits in the top bar when there is room beside the corner buttons, else under them.
    const titleY = v.w >= 760 ? BACK.y - 8 : BACK.y + CORNER_RADIUS + 40;
    this.title.position.set(v.w / 2, titleY);
    // The shells sit after the date on the same line, the pair centred together.
    const purseW = this.purse ? this.purse.width + 18 : 0;
    this.date.position.set(v.w / 2 - purseW / 2, titleY + 36);
    this.purse?.position.set(this.date.x + this.date.width / 2 + purseW - this.purse.width / 2, titleY + 36);
    const pw = Math.max(this.title.width, this.date.width + purseW) + 40;
    this.plate
      .clear()
      .roundRect(v.w / 2 - pw / 2, titleY - 30, pw, 92, 22)
      .fill({ color: cream, alpha: 0.92 });
    const top = v.w >= 760 ? TOP : titleY + 80;
    const cols = wide ? 3 : 2;
    const rows = Math.ceil(this.cards.length / cols);
    const x0 = wide ? GUIDE_CORNER.w + 8 : 24;
    const x1 = v.w - x0;
    const pitchX = (x1 - x0) / cols;
    const pitchY = (v.h - 16 - top - (wide ? 0 : TALL_FOOT)) / rows;
    const under = wide ? UNDER : UNDER + 50;
    const size = Math.round(
      Math.max(MIN_CARD, Math.min(wide ? MAX_CARD : MAX_CARD_TALL, pitchX - 28, pitchY - under - 12)),
    );
    // Names and level lines keep inside the cell, so two neighbours' plates stay 20 units apart.
    const textW = Math.max(size, pitchX - 44);
    this.playAll.position.set(v.w - BACK.x, BACK.y);
    this.notes?.position.set(v.w - BACK.x, v.h - BACK.y);
    // Stamps sit above the notes in a wide view (the right margin is clear of cards), beside them in a tall one (the strip
    // under the cards is clear).
    const step = CORNER_RADIUS * 2 + 20;
    // The lodge goes one further along: above the stamps when wide, left of them when tall.
    if (wide) {
      this.stamps?.position.set(v.w - BACK.x, v.h - BACK.y - step);
      this.lodge?.position.set(v.w - BACK.x, v.h - BACK.y - 2 * step);
    } else {
      this.stamps?.position.set(v.w - BACK.x - step, v.h - BACK.y);
      this.lodge?.position.set(v.w - BACK.x - 2 * step, v.h - BACK.y);
    }
    this.cards.forEach((c, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const node = c.node;
      node.position.set(x0 + pitchX * (col + 0.5), top + pitchY * row + 12 + size / 2);
      const half = size / 2;
      (node.getChildByLabel('frame') as Graphics)
        .clear()
        .roundRect(-half, -half, size, size, 28)
        .fill(cream)
        .stroke({ color: swatch.green.line, width: 6 });
      fitArt(node.getChildByLabel('art') as Container, size - 40);
      const name = node.getChildByLabel('name') as Text;
      // A tall view's larger cards carry a larger name.
      const nameScale = wide ? 1 : 1.25;
      name.scale.set(nameScale);
      name.style.wordWrapWidth = textW / nameScale;
      name.y = half + 12;
      // The level as dots, no reading: a long ladder's dots draw closer together inside the card's width.
      const { at, of } = levelDots(c.pick);
      const gap = Math.min(DOT_GAP, (size - 20) / Math.max(1, of - 1));
      const r = Math.min(6, gap * 0.38);
      const dotsY = name.y + name.height + 4 + r;
      const dots = (node.getChildByLabel('dots') as Graphics).clear();
      for (let d = 0; d < of; d++) {
        const x = (d - (of - 1) / 2) * gap;
        if (d < at) dots.circle(x, dotsY, r).fill(swatch.orange.fill);
        else dots.circle(x, dotsY, r).stroke({ color: MUTED, width: 2 });
      }
      const dotsW = of > 1 ? (of - 1) * gap + 2 * r : 2 * r;
      const level = node.getChildByLabel('level') as Text;
      level.y = dotsY + r + 6;
      // A long level line keeps to two lines at its full size (three on a tall view, drawn a third larger; one fewer under
      // a name that wraps): it is cut at a clause or a word (`levelLine`) rather than shrunk until it cannot be read.
      const big = wide ? 1 : 1.35;
      const lines = (wide ? 2 : 3) - (name.height / nameScale > 36 ? 1 : 0);
      level.scale.set(big);
      level.style.wordWrapWidth = textW / big;
      level.text = levelLine(this.grownUp ? c.pick.mod.describeLevel(c.pick.level) : '', (line) => {
        level.text = line;
        return level.height / big <= lines * 18 + 6;
      });
      // One cream pill under the name and the level line, so both read over the backdrop.
      const pillW = Math.max(name.width, level.width, dotsW, 60) + 24;
      const pillH = level.y - name.y + (level.text ? level.height : -6) + 10;
      (node.getChildByLabel('pill') as Graphics)
        .clear()
        .roundRect(-pillW / 2, name.y - 5, pillW, pillH, 16)
        .fill({ color: cream, alpha: 0.95 });
      (node.getChildByLabel('tick') as Container).position.set(half - 8, -half + 8);
      (node.getChildByLabel('turn') as Container).position.set(-half + 8, -half + 8);
      node.hitArea = new Rectangle(-half, -half, size, size + (name.y + name.height - half));
    });
  }

  override update(dt: number) {
    super.update(dt);
    this.sheet?.update(dt);
  }

  destroy() {
    this.notesSheet?.close();
    this.stampsSheet?.close();
    super.destroy();
  }

  // Play all through the mix planner (D10 slice 3) -------------------------------------------

  /** A live Play all belongs to this page and this day; a later day's page forgets it. */
  private live() {
    const s = mixMemory.live(store.data);
    return s?.stops && s.day === this.day ? s : undefined;
  }

  override holdsMix(): boolean {
    return !!this.live();
  }

  private sessionMods() {
    const s = this.live();
    return s ? s.ids.map((id) => GAMES.find((m) => m.id === id)).filter((m) => !!m) : [];
  }

  /** The six as the page dealt them, frozen with their bands and levels; ticked ones start played. */
  private startPlayAll() {
    if (this.leaving || this.sheet || this.notesSheet || this.stampsSheet || this.picks.length === 0) return;
    const stops = dailyStops(this.picks);
    mixMemory.startDaily(
      store.data,
      stops,
      startDaily(stops, (id) => this.played(id)),
      store.data.profile.band,
      this.day,
    );
    voice.stop();
    sfx.tick();
    this.openSheet();
    this.sayNext();
  }

  private openSheet() {
    const s = this.live();
    if (!s) return;
    if (!this.sheet) {
      this.sheet = new MixSheet(
        {
          tile: (p) => this.hear(p),
          play: () => this.playNext(),
          skip: () => this.skipNext(),
          back: () => this.endMix(),
          againMix: () => undefined,
          home: () => this.endMix(),
        },
        true,
      );
      this.ui.addChild(this.sheet);
    }
    this.sheet.show(s.state, this.sessionMods(), this.view);
  }

  private refresh() {
    const s = this.live();
    if (s && this.sheet) this.sheet.show(s.state, this.sessionMods(), this.view);
    return s?.state;
  }

  private sayNext() {
    const s = this.live();
    if (!s || !this.sheet) return;
    const p = nextUp(s.state);
    if (p === null) return void voice.say(dailyEndingLine(s.state));
    const mod = this.sessionMods()[p];
    if (mod) void voice.say('mix.stop', { title: SCRIPT[mod.titleLine][0].replace(/!$/, '') });
  }

  private hear(p: number) {
    const mod = this.sessionMods()[p];
    if (!mod || !this.live()) return;
    voice.stop();
    void voice.say('mix.stop', { title: SCRIPT[mod.titleLine][0].replace(/!$/, '') });
  }

  /** The next stop, checked again now: never a different game behind its picture. */
  private playNext() {
    const s = this.live();
    const p = s ? nextUp(s.state) : null;
    if (!s || p === null || this.leaving) return;
    if (!dailyStop(store.data.profile.band, GAMES, s.stops![p])) {
      mixMemory.apply(store.data, { type: 'unavailable', p });
      const state = this.refresh();
      voice.stop();
      void voice.say('mix.changed').then(() => {
        if (state && nextUp(state) === null) void voice.say(dailyEndingLine(state));
      });
      return;
    }
    if (!mixMemory.launch(store.data, p)) return;
    voice.stop();
    const pressed = this.sheet!.playButton;
    void this.leave(pressed, () => launchStop(this.app.go, s, p, store.data.profile.band));
  }

  private skipNext() {
    const s = this.live();
    const p = s ? nextUp(s.state) : null;
    if (!s || p === null || this.leaving) return;
    const after = mixMemory.apply(store.data, { type: 'skip', p })!;
    this.refresh();
    voice.stop();
    void voice.say('mix.skip').then(() => {
      if (!this.sheet || !this.live()) return;
      if (nextUp(after) === null) void voice.say(dailyEndingLine(after));
      else this.sayNext();
    });
  }

  /** Back on the preview or Done on the ending: the session ends and the six page shows its ticks; the flourish only for six ticks. */
  private endMix() {
    if (this.leaving) return;
    const ending = this.sheet?.ending;
    mixMemory.end();
    voice.stop();
    this.sheet?.destroy({ children: true });
    this.sheet = null;
    if (ending && this.allPlayed) void this.flourish();
  }

  /** Coming back from a stop's Home: the ending (or the preview, when a stop is still to come) opens over the page. */
  private resumeMix() {
    if (!this.live()) {
      if (mixMemory.live(store.data)?.stops) mixMemory.end(); // another day's session
      return;
    }
    this.openSheet();
    this.sayNext();
  }

  enter() {
    const link = document.querySelector<HTMLElement>('.classic-link');
    if (link) link.hidden = true;
    music.play(STYLES.hub);
    voice.stop();
    if (this.live()) return this.resumeMix();
    mixMemory.live(store.data)?.stops && mixMemory.end();
    if (this.allPlayed) void this.flourish();
    else void voice.say('daily.open');
  }

  /**
   * Every card has a tick: the pet cheers, a few stars, and the line. Nothing is recorded or awarded beyond the six ordinary
   * stickers, and every card stays playable.
   */
  private async flourish() {
    void voice.say('daily.done');
    // A grown-up's day gets its lantern, and the first time today a small bonus (the progression loop, slice 5).
    const bonus = this.purse ? store.recordAllSix(this.day) : 0;
    if (bonus > 0 && this.purse) this.showSixBonus(bonus);
    await this.tw.wait(0.4);
    sfx.sparkle();
    this.pip.cheer();
    for (const c of this.cards) {
      const tick = c.node.getChildByLabel('tick') as Container;
      this.particles.burst(c.node.x + tick.x, c.node.y + tick.y, {
        kind: 'star',
        colors: [swatch.yellow.fill, 0xffffff],
        count: 6,
        speed: [90, 200],
        gravity: 0,
        life: [0.4, 0.7],
      });
    }
  }

  /** The new balance beside the date, and "+25 shells · all six" on a pill under the title for a moment. */
  private showSixBonus(bonus: number) {
    const old = this.purse!;
    this.purse = shellTag(String(store.data.shells.balance), 20);
    this.ui.addChildAt(this.purse, this.ui.getChildIndex(old));
    old.destroy({ children: true });
    this.place();
    const pill = shellTag(`+${bonus} shells · all six`, 24, true);
    pill.position.set(this.view.w / 2, this.date.y + 72);
    pill.alpha = 0;
    this.ui.addChild(pill);
    void (async () => {
      await this.tw.to(pill, { alpha: 1 }, { duration: 0.3 });
      await this.tw.wait(2.6);
      if (pill.destroyed) return;
      await this.tw.to(pill, { alpha: 0 }, { duration: 0.5 });
      pill.destroy({ children: true });
    })();
  }
}

/** The stamps button: a lit paper lantern. */
function lanternIcon(): Graphics {
  const g = new Graphics();
  lantern(g, 0, 0, 1.4);
  return g;
}

/** A pencil, for the grown-up's notes button. */
function pencilIcon(): Graphics {
  const g = new Graphics()
    .poly([-20, 20, -14, 2, 10, -22, 22, -10, -2, 14])
    .fill(swatch.yellow.fill)
    .stroke({ color: ink, width: 4, join: 'round' })
    .poly([-20, 20, -14, 2, -2, 14])
    .fill(cream)
    .stroke({ color: ink, width: 4, join: 'round' });
  return g;
}

/** A card's turn-the-phone badge: a small phone lying on its side in a white disc, with a curved arrow over it. */
function turnBadge(): Container {
  const c = new Container();
  c.addChild(
    new Graphics().circle(0, 0, 26).fill(0xffffff).stroke({ color: swatch.orange.line, width: 4 }),
    new Graphics()
      .roundRect(-15, -8, 30, 18, 4)
      .fill(ink)
      .roundRect(-12, -5, 24, 12, 2)
      .fill(swatch.blue.fill),
    new Graphics()
      .arc(0, 2, 19, -Math.PI * 0.85, -Math.PI * 0.2)
      .stroke({ color: swatch.orange.fill, width: 3.5 })
      .poly([16, -14, 22, -6, 13, -5])
      .fill(swatch.orange.fill),
  );
  c.eventMode = 'none';
  return c;
}
