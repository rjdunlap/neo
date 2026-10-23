import { Container, Graphics, Rectangle, Text } from 'pixi.js';
import { ink, swatch } from '../art/palette';
import { voice } from '../audio/voice';
import { onTap } from '../engine/input';
import type { View } from '../engine/view';
import type { Demo } from '../couch/demo';
import type { HowToCard } from '../content/howto';
import type { LevelCard } from '../games/types';
import { levelsInOrder, stepLevel } from '../progress/difficulty';
import type { LevelRange } from '../progress/difficulty';
import { HoldButton, RoundButton } from './buttons';
import { arrowIcon, checkIcon, houseIcon, playIcon } from './icons';
import { FONT } from './text';
import { hopIcon } from './mix';

const MUTED = 0x6b6b7b;
/** Body text steps down through these scales until the card fits the screen. */
const SCALES = [1, 0.9, 0.8, 0.7];
/** The longest side of the game's picture on the intro. */
const ICON_BOX = 100;
/** The demonstration's window, beside the text on a wide screen (a quarter-turn narrower at small text) or above it on a tall one. */
const DEMO_WIDE = 400;
const DEMO_TALL = 520;
/** Beside the text, the window shrinks with the text down to this share of its size, which widens the text column (still over 240 units across). */
const DEMO_MIN_SCALE = 0.7;
const NOTE_CONTROLLER = 'A demonstration: a controller moves the highlight. You tap or drag.';
const NOTE_FINGER = 'A demonstration of this level: a pretend finger taps and drags. You do the same.';
const NOTE_MOUSE = 'A demonstration of this level: a pointer clicks and drags. You do the same.';
/** The level arrows are held for a moment, like the home and "?" buttons, so a small hand's tap does not change the game. */
const STEP_RADIUS = 38;
const STEP_HOLD = 0.35;
const STEP_GAP = 10;
/** A level's picture (a game with `levelCard`): a tile she or a grown-up can tap to hear the level explained. */
const TILE = 112;
/** The intro's row of the band's levels, easiest first: tiles shrink to fit one row, and below the smallest the row is left off. */
const LADDER_MAX = 84;
const LADDER_MIN = 48;
const LADDER_GAP = 8;
const TILE_FILL = 0xe3f3ff;
/** A stop card's row: one to five 100-unit tiles 12 apart from the left margin, Skip (112) at its right end, 18 above it. */
const STOP = 100;
const STOP_GAP = 12;
/** Back's x when the stop row sits inline, left of Back and Play in the button row. */
const inlineBackX = (width: number, count: number) => Math.max(width / 2 - 94, 32 + count * STOP + (count - 1) * STOP_GAP + 24 + 52);
/** The inline row is taken only when Play still clears Skip by 24: at five stops it does not, so the stops keep their own row. */
export const inlineFits = (width: number, count: number, play: number) => inlineBackX(width, count) + 156 + play + 24 <= width - 32 - SKIP;
const SKIP = 112;
const STOP_ROW = 18 + SKIP;

/** What the card does as the intro before a game's first round: it starts the round, or goes back. */
export interface HowToIntro {
  /** Makes the game's picture, with its feet at (0, 0): a new one each time the card is laid out. */
  icon: () => Container;
  play: () => void;
  back: () => void;
  /** Back's picture, made each time the card is laid out: a house by default; at the root a back arrow (RW14 slice 3). */
  backIcon?: () => Container;
  /** A tap on the game's picture in the header: the spoken title again. It changes nothing else. */
  hear?: () => void;
  /**
   * Little surprises' stop card (Discovery D3): a row of the mix's stops above Play and Back, and Skip at its end. `tiles` makes a
   * new set of 100-unit tiles, centred on their middles, each time the card is laid out; `shown` leaves the row off for a key or
   * pad (the mix's controls are touch-only), and the scene lays the card out again when that changes.
   */
  stops?: { count: number; tiles: () => Array<Container & { update?(dt: number): void }>; skip: () => void; shown: () => boolean };
  /** A bot playing a real round in a window on the card, for a game that has one. The card runs, places and destroys it. */
  demo?: Demo;
  /**
   * Arrows to choose the level before the round is built: the levels she may play, and what a held arrow does. The scene
   * answers with `show`. Left off when the game has one level.
   */
  /** A game's named, pictured levels (`GameModule.levelCard`), for the ladder of the band's levels. */
  levelCard?: (level: number) => LevelCard;
  pick?: {
    range: LevelRange;
    step: (delta: 1 | -1) => void;
    /** The level her progress suggested when the card opened, and a grown-up's pin: marked on the ladder, they do not follow the arrows. */
    suggested?: number;
    pinned?: number | null;
  };
}

/**
 * A plain card for the grown-up: what the game is for, how to play this level, how the round ends.
 * Opened from the "?" it covers the screen so nothing underneath can be touched, and closes on the green
 * check or a tap on the veil. As the intro before a round it fills the screen, shows the game's picture,
 * and offers a big Play and a Back; a stray tap on the backdrop does nothing. For a game with a bot it also
 * shows a demonstration round in a window (beside the text on a wide screen, above it on a tall one).
 * The intro can also step the level (held arrows beside "this level"): the text, the steps and the demonstration follow it.
 * Reading it changes nothing about the round.
 */
export class HowToPanel extends Container {
  private readonly body = new Container();
  private readonly veil = new Graphics();
  private demo: Demo | undefined;
  private shown: View | null = null;
  /** The held arrows of the card as last laid out, run each frame; and a step waiting to be applied after them. */
  private holds: HoldButton[] = [];
  private pending: 1 | -1 | 0 = 0;
  /** The stop row's tiles and Skip as last laid out (a stop card only). */
  stopTiles: Array<Container & { update?(dt: number): void }> = [];
  skipButton: RoundButton | null = null;
  /** The intro's Back (or Home on the island), for keys and the route test. */
  backButton: RoundButton | null = null;
  /** The header picture's tap target, when the intro speaks its title again. */
  titleSpot: Container | null = null;

  constructor(
    private info: HowToCard,
    private readonly close: () => void,
    private readonly intro?: HowToIntro,
  ) {
    super();
    this.veil.eventMode = 'static';
    if (!intro) onTap(this.veil, close, { cooldown: 400 });
    this.addChild(this.veil, this.body);
    this.mount(intro?.demo);
  }

  /** The demonstration now on the card, if any. */
  get currentDemo(): Demo | undefined {
    return this.demo;
  }

  /** Put a demonstration's window on the card. */
  private mount(demo: Demo | undefined) {
    this.demo = demo;
    if (this.intro) this.intro.demo = demo;
    if (!demo) return;
    // The game inside the window is a separate copy: nothing she touches may reach it.
    demo.root.eventMode = 'none';
    this.addChild(demo.root);
  }

  /**
   * Show another level's card, and its demonstration: the old one is destroyed unless it is the one passed again
   * (a game whose demonstration does not follow the level).
   */
  show(info: HowToCard, demo: Demo | undefined) {
    this.info = info;
    if (demo !== this.demo) {
      this.demo?.destroy();
      this.mount(demo);
    }
    if (this.shown) this.layout(this.shown);
  }

  /** Run the demonstration, if there is one, and the held arrows. */
  update(dt: number) {
    this.demo?.update(dt);
    for (const h of this.holds) if (!h.destroyed) h.update(dt);
    for (const t of this.stopTiles) if (!t.destroyed) t.update?.(dt);
    // A finished hold changes the card, which replaces the arrows: do it once they have all run.
    if (this.pending) {
      const delta = this.pending;
      this.pending = 0;
      this.intro?.pick?.step(delta);
    }
  }

  destroy(options?: Parameters<Container['destroy']>[0]) {
    this.demo?.destroy();
    super.destroy(options);
  }

  layout(view: View) {
    this.shown = view;
    this.veil.clear().rect(0, 0, view.w, view.h);
    if (this.intro) this.veil.fill(0xfff4e3);
    else this.veil.fill({ color: 0x2b2440, alpha: 0.5 });
    this.body.removeChildren().forEach((c) => c.destroy({ children: true }));
    // Long entries step their text down rather than run off a short screen; buttons keep their size. A ladder of levels
    // that still does not fit at the smallest text is left off before anything else gives.
    // A wide stop card that still does not fit takes its stop row into the Play and Back row, and tries again from full text.
    let built = this.build(view, SCALES[0], true, false);
    const ladders = built.ladder ? [true, false] : [false];
    fit: for (const inline of built.canInline ? [false, true] : [false]) {
      for (const ladder of ladders) {
        for (const scale of SCALES) {
          if (built.card.height + 24 <= view.h) break fit;
          built.card.destroy({ children: true });
          built = this.build(view, scale, ladder, inline);
        }
      }
    }
    this.body.addChild(built.card);
    if (built.window) this.demo!.layout(built.card.x + built.window.x, built.card.y + built.window.y, built.window.w);
  }

  private build(view: View, scale: number, withLadder: boolean, inline: boolean): { card: Container; window: { x: number; y: number; w: number } | null; ladder: boolean; canInline: boolean } {
    const demo = this.demo;
    this.holds = [];
    this.stopTiles = [];
    this.skipButton = null;
    const stops = this.intro?.stops?.shown() ? this.intro.stops : null;
    const range = this.intro?.pick && this.intro.pick.range.max > this.intro.pick.range.min ? this.intro.pick.range : null;
    // Beside the text when the screen is wider than tall; above it when it is tall. The window shrinks a little with the text.
    const wide = !!demo && view.w >= view.h * 1.1;
    const width = Math.min(view.w - 60, wide ? 1000 : 760);
    const dw = !demo ? 0 : wide ? Math.round(DEMO_WIDE * Math.max(scale, DEMO_MIN_SCALE)) : Math.min(width - 64, DEMO_TALL);
    const dh = Math.round(dw * 0.75);
    const noteH = demo ? 40 : 0;
    const inner = wide ? width - 64 - dw - 28 : width - 64;
    const text = (value: string, size: number, fill: number, weight: '500' | '600' = '500', wrap = inner) =>
      new Text({ text: value, style: { fontFamily: FONT, fontSize: size, fill, fontWeight: weight, wordWrap: true, wordWrapWidth: wrap, lineHeight: size * 1.25 } });
    const BODY = Math.round(22 * scale);

    const rows: Container[] = [];
    /** Rows that are not text (the level's picture, the ladder), with the height they take. */
    const fixed = new Map<Container, number>();
    const add = (label: string, value: string) => {
      rows.push(text(label, 13, MUTED, '600'));
      rows.push(text(value, BODY, ink));
    };
    // The intro puts the picture beside the title; the "?" card leads with the title alone.
    const head = this.intro ? this.header(wide ? width - dw - 28 : width, scale) : null;
    if (!head) {
      rows.push(text('HOW TO PLAY', 13, MUTED, '600'));
      rows.push(text(this.info.title, Math.round(34 * scale), ink, '600'));
    }
    const mode = this.info.mode;
    // A named level keeps its number small after the name: the grown-ups' page and pins still speak in numbers.
    rows.push(text(mode ? `THIS LEVEL  ·  ${mode.name.toUpperCase()}  ·  level ${this.info.levelNumber}` : `THIS LEVEL  ·  ${this.info.levelNumber}`, 13, MUTED, '600'));
    // With arrows the pair sits to the left of the description (or of the level's picture), and is the tallest part of the row.
    const side = range ? STEP_RADIUS * 4 + STEP_GAP + 22 : 0;
    // With a picture, the arrows and the picture make a row of their own, and the description runs the full width under it.
    const pictureRow = mode ? new Container() : null;
    if (pictureRow) {
      pictureRow.addChild(this.tile(mode!, side));
      fixed.set(pictureRow, TILE);
      rows.push(pictureRow);
    }
    const levelText = text(this.info.level, BODY, ink, '500', inner - (pictureRow ? 0 : side));
    rows.push(levelText);
    // Beside a demonstration the ladder goes under its window, where the narrow text column leaves room, packed closer since the
    // window narrows with the text; otherwise it follows the description.
    const underWindow = wide && !!demo;
    const ladder = withLadder && mode ? this.ladder(underWindow ? dw : inner, underWindow ? 4 : LADDER_GAP) : null;
    const ladderLabel = ladder ? text('LEVELS, EASIEST FIRST', 13, MUTED, '600') : null;
    if (ladder && !underWindow) {
      rows.push(ladderLabel!);
      fixed.set(ladder.row, ladder.size);
      rows.push(ladder.row);
    }
    add('GOAL', this.info.goal);
    rows.push(text('WHAT TO DO', 13, MUTED, '600'));
    this.info.steps.forEach((s, i) => rows.push(text(`${i + 1}.  ${s}`, BODY, ink)));
    add('THE ROUND ENDS', this.info.finish);
    if (this.info.note) add('GOOD TO KNOW', this.info.note);

    // Labels hug the line below; groups get more air. A demo above the text pushes it down; beside it, it does not.
    let y = head ? head.bottom : 30;
    const slot = demo ? { x: wide ? width - 32 - dw : (width - dw) / 2, y: wide ? 22 : y + 2, w: dw } : null;
    if (demo && !wide) y += dh + noteH + 8;
    const placed: Array<[Container, number]> = [];
    let stepY = 0;
    // Beside the window the text column is narrow; below it, where the column is empty, the text runs the full width.
    const ladderTop = 22 + dh + noteH + 18;
    const below = !underWindow ? Infinity : ladder ? ladderTop + 24 + ladder.size + 14 : 22 + dh + noteH + 8;
    const arrowsBeside = pictureRow ?? levelText;
    for (const r of rows) {
      const small = r instanceof Text && r.style.fontSize === 13;
      if (small && placed.length) y += 14;
      if (r instanceof Text && !small && r !== levelText && y >= below) r.style.wordWrapWidth = width - 64;
      const own = fixed.get(r) ?? r.height;
      const h = range && r === arrowsBeside ? Math.max(own, STEP_RADIUS * 2) : own;
      placed.push([r, y + (h - own) / 2]);
      if (range && r === arrowsBeside) stepY = y + h / 2;
      y += h + (small ? 3 : 6);
    }
    if (demo && wide) y = Math.max(y, below);
    // The intro's Play is the biggest thing on the card; the "?" card has one small check.
    const play = this.intro ? 62 : 52;
    // A stop card's row sits between the text and the buttons; it is never dropped or scaled.
    // Inline (a wide card only): the tiles sit left in the button row, Back and Play move right clear of them, Skip right of Play.
    const inRow = !!stops && inline && wide;
    const rowY = inRow ? y + 24 + play - SKIP / 2 : y + 18;
    if (stops && !inRow) y += STOP_ROW;
    const cardH = y + 24 + play * 2 + 18;
    const card = new Container();
    card.addChild(
      new Graphics().roundRect(0, 6, width, cardH, 28).fill({ color: 0x000000, alpha: 0.14 }),
      new Graphics().roundRect(0, 0, width, cardH, 28).fill(0xfffaf0).stroke({ width: 4, color: 0xeadfcd }),
    );
    if (head) card.addChild(...head.nodes);
    if (slot) {
      // A frame for the window, and a line saying what it shows; the demo itself is drawn over it.
      const frame = new Graphics().roundRect(slot.x - 5, slot.y - 5, dw + 10, dh + 10, 22).fill(0xeadfcd);
      const note = new Text({ text: { finger: NOTE_FINGER, mouse: NOTE_MOUSE, none: NOTE_CONTROLLER }[demo!.pointer ?? 'none'], style: { fontFamily: FONT, fontSize: 13, fill: MUTED, fontWeight: '500', wordWrap: true, wordWrapWidth: dw, lineHeight: 16 } });
      note.position.set(slot.x, slot.y + dh + 12);
      card.addChild(frame, note);
      if (ladder && underWindow) {
        ladderLabel!.position.set(slot.x, ladderTop);
        ladder.row.position.set(slot.x, ladderTop + 24);
        card.addChild(ladderLabel!, ladder.row);
      }
    }
    for (const [r, ry] of placed) {
      r.position.set(r === pictureRow ? 0 : 32 + (range && r === levelText && !pictureRow ? side : 0), ry);
      card.addChild(r);
    }
    if (range) card.addChild(...this.arrows(range, 32 + STEP_RADIUS, stepY));
    if (this.intro) {
      const go = new RoundButton(playIcon(), swatch.green, play, this.intro.play);
      const back = new RoundButton(this.intro.backIcon?.() ?? houseIcon(0xffffff), swatch.blue, 52, this.intro.back);
      back.meaning = this.intro.backIcon ? 'back' : null;
      this.backButton = back;
      const backX = inRow ? inlineBackX(width, stops!.count) : width / 2 - 94;
      go.position.set(backX + 156, y + 24 + play);
      back.position.set(backX, y + 24 + play);
      card.addChild(back, go);
      if (stops) {
        this.stopTiles = stops.tiles();
        this.stopTiles.forEach((t, i) => {
          t.position.set(32 + STOP / 2 + i * (STOP + STOP_GAP), rowY + SKIP / 2);
          card.addChild(t);
        });
        const hop = hopIcon(ink);
        this.skipButton = new RoundButton(hop, swatch.yellow, SKIP / 2, stops.skip);
        this.skipButton.position.set(width - 32 - SKIP / 2, rowY + SKIP / 2);
        card.addChild(this.skipButton);
      }
    } else {
      const ok = new RoundButton(checkIcon(), swatch.green, play, this.close);
      ok.position.set(width / 2, y + 24 + play);
      card.addChild(ok);
    }

    card.position.set((view.w - width) / 2, Math.max(12, (view.h - cardH) / 2));
    // A tap on the card itself must not fall through to the veil and close it.
    card.eventMode = 'static';
    return { card, window: slot, ladder: !!ladder, canInline: !!stops && wide && inlineFits(width, stops.count, play) };
  }

  /** The level's picture on a pale tile, beside the arrows: a tap says what the level asks, and does nothing else. */
  private tile(mode: NonNullable<HowToCard['mode']>, side: number): Container {
    const tile = new Container();
    tile.addChild(new Graphics().roundRect(0, 0, TILE, TILE, 22).fill(TILE_FILL).stroke({ width: 3, color: swatch.blue.line, alpha: 0.35 }));
    const picture = mode.picture();
    picture.eventMode = 'none';
    picture.position.set(TILE / 2, TILE / 2);
    tile.addChild(picture);
    tile.position.set(32 + side, 0);
    onTap(tile, () => void voice.say(mode.line), { cooldown: 400 });
    return tile;
  }

  /**
   * The band's levels in play order, one small picture each: the level on the card is outlined, the one her progress suggested
   * has a green dot, a pinned one a pin. It only shows; the arrows are the one way to choose. Null when the levels would be too small.
   */
  private ladder(inner: number, gap: number): { row: Container; size: number } | null {
    const pick = this.intro?.pick;
    const levelCard = this.intro?.levelCard;
    if (!pick || !levelCard) return null;
    const levels = levelsInOrder(pick.range);
    if (levels.length < 2) return null;
    const size = Math.min(LADDER_MAX, Math.floor((inner - gap * (levels.length - 1)) / levels.length));
    if (size < LADDER_MIN) return null;
    const row = new Container();
    row.eventMode = 'none';
    levels.forEach((level, i) => {
      const cell = new Container();
      cell.position.set(i * (size + gap), 0);
      const here = level === this.info.levelNumber;
      cell.addChild(new Graphics().roundRect(0, 0, size, size, 14).fill(TILE_FILL));
      const picture = levelCard(level).picture();
      picture.scale.set((size / TILE) * 0.92);
      picture.position.set(size / 2, size / 2);
      cell.addChild(picture);
      // The level on the card: a heavy outline, told apart from the dot and the pin by its shape.
      if (here) cell.addChild(new Graphics().roundRect(-3, -3, size + 6, size + 6, 16).stroke({ width: 5, color: ink }));
      if (level === pick.suggested) cell.addChild(new Graphics().circle(size - 4, 4, 8).fill(swatch.green.fill).stroke({ width: 3, color: 0xffffff }));
      if (level === pick.pinned) {
        const pin = new Graphics().moveTo(6, 6).lineTo(12, 18).stroke({ width: 3, color: ink, cap: 'round' }).circle(5, 4, 7).fill(swatch.red.fill).stroke({ width: 2, color: 0xffffff });
        cell.addChild(pin);
      }
      row.addChild(cell);
    });
    return { row, size };
  }

  /** The two level arrows, side by side. An arrow at the end of the levels is dimmed and does nothing. */
  private arrows(range: LevelRange, x: number, y: number): HoldButton[] {
    const make = (dir: 1 | -1, at: number) => {
      const atEnd = stepLevel(this.info.levelNumber, dir, range) === this.info.levelNumber;
      const button = new HoldButton(arrowIcon(dir), swatch.white, STEP_RADIUS, STEP_HOLD, () => (this.pending = dir), swatch.blue.fill);
      button.position.set(at, y);
      if (atEnd) {
        button.alpha = 0.3;
        button.eventMode = 'none';
      } else this.holds.push(button);
      return button;
    };
    return [make(-1, x), make(1, x + STEP_RADIUS * 2 + STEP_GAP)];
  }

  /** The game's picture on the left, the label and title beside it. */
  private header(width: number, scale: number): { nodes: Container[]; bottom: number } {
    const icon = this.intro!.icon();
    const box = icon.getLocalBounds();
    const fit = ICON_BOX / Math.max(box.width, box.height, 1);
    icon.scale.set(fit);
    icon.position.set(32 + ICON_BOX / 2 - (box.x + box.width / 2) * fit, 20 + ICON_BOX / 2 - (box.y + box.height / 2) * fit);
    const hear = this.intro!.hear;
    const nodes: Container[] = [icon];
    if (hear) {
      // The picture's box takes the tap, so a small or oddly shaped icon is still a 100-unit target.
      const spot = new Container();
      spot.hitArea = new Rectangle(32, 20, ICON_BOX, ICON_BOX);
      onTap(spot, () => { icon.scale.set(fit * 1.06); window.setTimeout(() => { if (!icon.destroyed) icon.scale.set(fit); }, 160); hear(); }, { cooldown: 400 });
      nodes.push(spot);
      this.titleSpot = spot;
    }
    const label = new Text({ text: 'HOW TO PLAY', style: { fontFamily: FONT, fontSize: 13, fill: MUTED, fontWeight: '600' } });
    const title = new Text({ text: this.info.title, style: { fontFamily: FONT, fontSize: Math.round(34 * scale), fill: ink, fontWeight: '600', wordWrap: true, wordWrapWidth: width - 32 - ICON_BOX - 16 - 16 } });
    const x = 32 + ICON_BOX + 20;
    label.position.set(x, 20 + ICON_BOX / 2 - title.height / 2 - 20);
    title.position.set(x, 20 + ICON_BOX / 2 - title.height / 2);
    return { nodes: [...nodes, label, title], bottom: 20 + ICON_BOX + 10 };
  }
}

/** The "?" on the hold-to-open button. */
export function questionIcon(): Text {
  const t = new Text({ text: '?', style: { fontFamily: FONT, fontSize: 46, fill: ink, fontWeight: '600' } });
  t.anchor.set(0.5);
  return t;
}
