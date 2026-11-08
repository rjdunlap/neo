import { Circle, Container, Graphics, Rectangle, Text } from 'pixi.js';
import { cream, ink, swatch } from '../../art/palette';
import { homeBackdrop } from '../../art/home/backdrop';
import { music, STYLES } from '../../audio/music';
import { sfx } from '../../audio/sfx';
import { voice } from '../../audio/voice';
import { dailySix, dayKey, levelDots, playedOn, type DailyPick } from '../../content/daily';
import { makeCompanion } from '../../creatures/companion';
import { BACK } from '../../creatures/friends-layout';
import { CORNER_RADIUS, GUIDE_CORNER, HOME_BUTTON } from '../../creatures/home-layout';
import { onTap } from '../../engine/input';
import type { View } from '../../engine/view';
import { GAMES } from '../../games/registry';
import { store } from '../../progress/store';
import { RoundButton } from '../../ui/buttons';
import { arrowIcon, checkIcon, tilesIcon } from '../../ui/icons';
import { fitArt } from '../../ui/origin-art';
import { FONT } from '../../ui/text';
import type { App } from '../App';
import { Scene } from '../Scene';

const MUTED = 0x6b6b7b;
/** The top of the card grid, under the corner buttons and the title. */
const TOP = 150;
const MAX_CARD = 230;
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
  readonly back = new RoundButton(arrowIcon(-1), swatch.white, CORNER_RADIUS, () =>
    this.leave(() => this.app.go.hub(), voice.say('nav.back')),
  ).means('back');
  readonly all = new RoundButton(fitArt(tilesIcon(), 56), swatch.white, CORNER_RADIUS, () =>
    this.leave(() => this.app.go.explore('all', 0, false), voice.say('explore.all')),
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
  readonly picks: DailyPick[];
  cards: DailyCard[] = [];
  private leaving = false;
  private readonly grownUp = store.data.profile.band === 'grownup';
  private readonly uprightPhone: boolean;

  constructor(app: App) {
    super(app);
    // A phone held upright draws its six from the upright-ready games first (chunk 31); the rest wear a turn badge.
    this.uprightPhone = app.uprightPhone();
    this.picks = dailySix(
      this.day,
      store.data.profile.band,
      GAMES,
      (id) => store.data.games[id]?.pinned ?? null,
      this.uprightPhone,
    );
    this.date.text = new Date().toLocaleDateString(undefined, {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    });
  }

  /** Every card has a tick. */
  get allPlayed(): boolean {
    return this.picks.every((p) => playedOn(store.data.games[p.mod.id]?.history, this.day));
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
    this.ui.addChild(this.plate, this.title, this.date, this.back, this.all, this.track(this.pip));
    this.cards = this.picks.map((pick) => ({ pick, node: this.card(pick) }));
    for (const c of this.cards) this.ui.addChild(c.node);
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
        node.scale.set(0.92);
        window.setTimeout(() => !node.destroyed && node.scale.set(1), 110);
        voice.stop();
        void this.leave(
          () => this.app.go.game(pick.mod.id, pick.band, undefined, false, { daily: true }, pick.level),
          voice.say(pick.mod.titleLine),
        );
      },
      { cooldown: 400 },
    );
    return node;
  }

  /** A short beat for the squish and the game's name, then the way out; a second tap while leaving does nothing. */
  private async leave(go: () => void, speech?: Promise<void>) {
    if (this.leaving) return;
    this.leaving = true;
    await (speech ? Promise.race([speech, this.tw.wait(1.1)]) : this.tw.wait(0.2));
    if (this.app.scene !== this) return;
    go();
  }

  resize(_v: View) {
    this.place();
  }

  /**
   * Three across and two down when wide, two across and three down when tall, inside the band between the guide corners so
   * the bottom row stays clear of the bottom-left friend. A card is as large as its cell allows, up to 230 units.
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
    const x0 = GUIDE_CORNER.w + 8;
    const x1 = v.w - GUIDE_CORNER.w - 8;
    const pitchX = (x1 - x0) / cols;
    const pitchY = (v.h - 16 - top) / rows;
    const size = Math.round(Math.max(MIN_CARD, Math.min(MAX_CARD, pitchX - 28, pitchY - UNDER - 12)));
    const textW = Math.max(size, pitchX - 20);
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
      name.style.wordWrapWidth = textW;
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
      level.style.wordWrapWidth = textW;
      level.y = dotsY + r + 6;
      // A long level line keeps to two lines: it shrinks rather than pushing into the next row.
      level.scale.set(level.text ? Math.min(1, 40 / Math.max(level.height / level.scale.y, 1)) : 1);
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
