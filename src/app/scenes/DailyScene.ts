import { Circle, Container, Graphics, Rectangle, Text } from 'pixi.js';
import { cream, ink, swatch } from '../../art/palette';
import { homeBackdrop } from '../../art/home/backdrop';
import { music, STYLES } from '../../audio/music';
import { sfx } from '../../audio/sfx';
import { voice } from '../../audio/voice';
import { dayKey, levelDots, nextOfSix, playedOn, type DailyPick } from '../../content/daily';
import { todaysSix } from '../daily-six';
import { makeCompanion } from '../../creatures/companion';
import { BACK } from '../../creatures/friends-layout';
import { CORNER_RADIUS, GUIDE_CORNER, HOME_BUTTON } from '../../creatures/home-layout';
import { onTap } from '../../engine/input';
import type { View } from '../../engine/view';
import { store } from '../../progress/store';
import { RoundButton } from '../../ui/buttons';
import { arrowIcon, checkIcon, playIcon, tilesIcon } from '../../ui/icons';
import { openPlaytestSheet, type PlaytestSheet } from '../../ui/playtest-sheet';
import { fitArt } from '../../ui/origin-art';
import { FONT } from '../../ui/text';
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
 * tiles button opens All games, so nothing outside the six is out of reach. Nothing is owed: no streak, no count across days.
 */
export class DailyScene extends Scene {
  /** Laid out for a phone held upright as well (chunk 31). */
  upright = true;
  uprightArea = true;
  private readonly backdrop = homeBackdrop();
  /** Back goes Home; on a phone, where the six are the whole app (`App.phoneOnly`), to "Who's playing?". */
  readonly back = new RoundButton(arrowIcon(-1), swatch.white, CORNER_RADIUS, () =>
    this.leave(
      this.back,
      () => (this.app.phoneOnly ? this.app.go.start() : this.app.go.hub()),
      () => voice.say('nav.back'),
    ),
  ).means('back');
  /** Play all: opens the first of the six not yet played today; each round's result then offers the next one. */
  readonly playAll = new RoundButton(playIcon(), swatch.green, CORNER_RADIUS, () => {
    const next = nextOfSix(this.picks, null, (id) => this.played(id));
    if (next) this.open(next, this.playAll);
  });
  /** A grown-up's playtest notes on today's six (plain HTML, `src/ui/playtest-sheet.ts`); never drawn for a child. */
  readonly notes: RoundButton | null;
  private sheet: PlaytestSheet | null = null;
  readonly all = new RoundButton(fitArt(tilesIcon(), 56), swatch.white, CORNER_RADIUS, () =>
    this.leave(
      this.all,
      () => this.app.go.explore('all', 0, false),
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
  /** The pet in the bottom-left corner the cards keep clear of: a poke repeats the page's line, and it cheers when all six are done. */
  readonly pip = makeCompanion();
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
    this.date.text = new Date().toLocaleDateString(undefined, {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    });
  }

  private pickSix(): DailyPick[] {
    return todaysSix(this.day, this.uprightPhone);
  }

  private played(id: string): boolean {
    return playedOn(store.data.games[id]?.history, this.day);
  }

  /** Every card has a tick. */
  get allPlayed(): boolean {
    return this.picks.every((p) => this.played(p.mod.id));
  }

  private buildCards() {
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

  private openNotes() {
    if (this.sheet || this.leaving) return;
    voice.stop();
    this.sheet = openPlaytestSheet({
      day: this.day,
      picks: this.picks,
      played: (id) => this.played(id),
      onClose: () => (this.sheet = null),
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
      void voice.say(this.allPlayed ? 'daily.done' : 'daily.open');
    });
    this.ui.addChild(
      this.plate,
      this.title,
      this.date,
      this.back,
      this.all,
      this.playAll,
      this.track(this.pip),
    );
    if (this.notes) this.ui.addChild(this.notes);
    // On a phone the six are the whole app: there is no All games to open.
    this.all.visible = !this.app.phoneOnly;
    this.playAll.visible = !this.allPlayed;
    this.buildCards();
    this.place();
  }

  private card(pick: DailyPick): Container {
    const node = new Container();
    const icon = this.track(pick.mod.hubIcon());
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
    turn.visible = this.uprightPhone && !pick.mod.upright;
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
    const others = [this.back, this.all, this.playAll, this.notes, ...this.cards.map((c) => c.node)];
    return this.out.take(node, others, go, say);
  }

  resize(_v: View) {
    // A turn of the phone changes which games the six draw from first (upright-ready ones when upright), and the badges.
    const upright = this.app.uprightPhone();
    if (upright !== this.uprightPhone && !this.leaving) {
      this.uprightPhone = upright;
      this.picks = this.pickSix();
      this.buildCards();
      this.playAll.visible = !this.allPlayed;
    }
    this.place();
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
    const wide = v.w >= v.h;
    // The title sits in the top bar when there is room beside the corner buttons, else under them.
    const titleY = v.w >= 760 ? BACK.y - 8 : BACK.y + CORNER_RADIUS + 40;
    this.title.position.set(v.w / 2, titleY);
    this.date.position.set(v.w / 2, titleY + 36);
    const pw = Math.max(this.title.width, this.date.width) + 40;
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
    const textW = Math.max(size, pitchX - 20);
    this.playAll.position.set(v.w - BACK.x, BACK.y);
    this.notes?.position.set(v.w - BACK.x, v.h - BACK.y);
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
      // A long level line keeps to two lines: it shrinks rather than pushing into the next row.
      // A tall view draws it a third larger, in up to three lines.
      const big = wide ? 1 : 1.35;
      level.scale.set(1);
      level.style.wordWrapWidth = textW / big;
      level.scale.set(level.text ? Math.min(big, (wide ? 40 : 76) / Math.max(level.height, 1)) : 1);
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

  destroy() {
    this.sheet?.close();
    super.destroy();
  }

  enter() {
    const link = document.querySelector<HTMLElement>('.classic-link');
    if (link) link.hidden = true;
    music.play(STYLES.hub);
    voice.stop();
    if (this.allPlayed) void this.flourish();
    else void voice.say('daily.open');
  }

  /**
   * Every card has a tick: the pet cheers, a few stars, and the line. Nothing is recorded or awarded beyond the six ordinary
   * stickers, and every card stays playable.
   */
  private async flourish() {
    void voice.say('daily.done');
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
