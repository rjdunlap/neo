import type { Band } from '../progress/bands';
import type { View } from '../engine/view';

/**
 * Where the caption band sits and how much of the screen the game keeps (TotoLogic P3,
 * docs/definitions/question-on-screen.md). Pure, so the layout tests and the upright check share it with `GameScene`.
 */

/** Upright: a strip this tall across the bottom of the screen, below the guide. */
export const STRIP_H = 160;
/** Sideways: a rail this wide down the left edge; the board, Home, "?" and the guide move right by it. */
export const RAIL_W = 300;
/** The shortest game view the strip may leave: a 375 × 667 phone less the strip. */
export const STRIP_MIN_VIEW_H = 1206;
/** The narrowest screen the rail shows on: the 1024 design width plus the rail. */
export const RAIL_MIN_VIEW_W = 1024 + RAIL_W;
/** No instruction option may be longer than this once its slots are filled, so the band never clips or scrolls. */
export const CAPTION_BUDGET = 180;
/** No side to spare: the widest the bubble above the guide grows, and the tallest its words may run. */
export const BUBBLE_W = 640;
export const BUBBLE_TEXT_H = 200;
/** How far above the foot of the view the bubble's tail ends: clear of the guide. */
export const BUBBLE_FOOT = 185;
/** The stand-in a slot is filled with when a line is measured against the budget. */
export const SLOT_STAND_IN = 'Wwwwwwwwwwww';
/** Type sizes in units: the usual one, and the smaller one a long line is set at. */
export const CAPTION_SIZES = [34, 28] as const;

/**
 * Who sees the caption: a `grownup` round always; a `school` round when the spoken voice is off, the volume is at zero or
 * "Show the words" is on; a younger round never, so nothing a child must read appears.
 */
export function captionShows(
  band: Band,
  settings: { speech: boolean; volume: number; showWords: boolean },
): boolean {
  if (band === 'grownup') return true;
  if (band !== 'school') return false;
  return settings.showWords || !settings.speech || settings.volume <= 0;
}

export interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface CaptionPlace {
  /**
   * `none`: no caption. `bubble`: no side of the screen has room to spare, so the words come and go in a bubble above
   * the guide, over the game's view, and never take a touch.
   */
  mode: 'strip' | 'rail' | 'bubble' | 'none';
  /** The view the game lays out in: the screen less the band. */
  game: View;
  /** How far right the board and the round's chrome move (the rail's width, or 0). */
  dx: number;
  /** The space the band may draw in, in screen units (the bubble's is the most it may grow to); null when there is no band. */
  band: Box | null;
}

/** The band's place for a screen: never over the view the game lays out in. */
export function captionPlace(view: View, on: boolean): CaptionPlace {
  const none: CaptionPlace = { mode: 'none', game: view, dx: 0, band: null };
  if (!on) return none;
  const bubbleH = BUBBLE_TEXT_H + 2 * BUBBLE.railPadY + BUBBLE.tail;
  const bubble: CaptionPlace = {
    mode: 'bubble',
    game: view,
    dx: 0,
    band: { x: 0, y: view.h - BUBBLE_FOOT - bubbleH, w: Math.min(view.w, BUBBLE_W), h: bubbleH },
  };
  if (view.upright) {
    // Half a unit of slack: a 375 × 667 phone is 1,366.016 units tall.
    if (view.h - STRIP_H < STRIP_MIN_VIEW_H - 0.5) return bubble;
    return {
      mode: 'strip',
      game: { ...view, h: view.h - STRIP_H },
      dx: 0,
      band: { x: 0, y: view.h - STRIP_H, w: view.w, h: STRIP_H },
    };
  }
  if (view.w < RAIL_MIN_VIEW_W - 0.5) return bubble;
  return {
    mode: 'rail',
    game: { ...view, w: view.w - RAIL_W },
    dx: RAIL_W,
    band: { x: 0, y: 0, w: RAIL_W, h: view.h },
  };
}

/** The bubble's edges, in units: its gap from the band's edge, the words' inset, the speaker picture and the tail. */
export const BUBBLE = { margin: 10, padX: 14, stripPadY: 4, railPadY: 14, speaker: 44, tail: 12 } as const;

/** How wide the words may run in each mode: beside the speaker in the strip, above it in the rail, edge to edge in the bubble. */
export function captionTextWidth(place: CaptionPlace): number {
  if (!place.band) return 0;
  const inner = place.band.w - 2 * BUBBLE.margin - 2 * BUBBLE.padX;
  return place.mode === 'strip' ? inner - BUBBLE.speaker - BUBBLE.padX : inner;
}

/** How tall the words may run: the strip's bubble under its tail, the rail's height less the speaker's row, or the bubble's most. */
export function captionTextHeight(place: CaptionPlace): number {
  if (!place.band) return 0;
  if (place.mode === 'bubble') return BUBBLE_TEXT_H;
  if (place.mode === 'strip') return place.band.h - BUBBLE.tail - BUBBLE.margin + 2 - 2 * BUBBLE.stripPadY;
  return place.band.h - 2 * BUBBLE.margin - 2 * BUBBLE.railPadY - BUBBLE.speaker;
}

/** A rounded hand's average letter is about half its size wide; the band itself measures the real text. */
const LETTER = 0.5;

/** Greedy word wrap by character count: the estimate the budget test uses. */
export function wrapCount(text: string, perLine: number): number {
  let lines = 1;
  let used = 0;
  for (const word of text.split(/\s+/).filter(Boolean)) {
    const need = used ? used + 1 + word.length : word.length;
    if (need > perLine && used) {
      lines++;
      used = word.length;
    } else used = need;
  }
  return lines;
}

/**
 * The type size a line of `text` is set at in `place`, by estimate: the first size whose wrapped lines fit the band's
 * height; null if not even the small size holds it (the budget keeps that from happening).
 */
export function captionSize(text: string, place: CaptionPlace): number | null {
  const w = captionTextWidth(place);
  const h = captionTextHeight(place);
  for (const size of CAPTION_SIZES) {
    const perLine = Math.floor(w / (size * LETTER));
    if (wrapCount(text, perLine) * lineHeight(size) <= h + 1e-6) return size;
  }
  return null;
}

export const lineHeight = (size: number) => Math.round(size * 1.18);

/** The shortest time a line said in between (a hint, a reason, praise) stays in the band, in seconds. */
export const ASIDE_MIN = 1.5;

/**
 * What the band shows from moment to moment, apart from how it is drawn: the instruction, and a line said in between
 * that takes its place for as long as it is spoken (at least `ASIDE_MIN`) and then gives it back. In the bubble the
 * instruction too shows only while it is spoken. Pure, so the rules are tested without Pixi.
 */
export class CaptionLines {
  private instruction = '';
  private aside = '';
  /** Seconds the line on show must still stay, and whether its speech has ended. */
  private left = 0;
  private spoken = true;
  private turn = 0;

  /** The words to draw now, and whether they are a line said in between (drawn in a lighter ink). */
  get text(): string {
    return this.aside || this.instruction;
  }
  get isAside(): boolean {
    return !!this.aside;
  }
  /** Whether a line is being said (or held its minimum time): the bubble shows only then. */
  get live(): boolean {
    return !this.spoken || this.left > 0;
  }
  get hasInstruction(): boolean {
    return !!this.instruction;
  }

  /** A new instruction wins at once. Returns whether the words on show changed. */
  instruct(text: string, done: Promise<unknown>): boolean {
    const before = this.text;
    this.instruction = text;
    this.aside = '';
    this.hold(done);
    return this.text !== before;
  }

  /** A line said in between. Returns whether the words on show changed. */
  say(text: string, done: Promise<unknown>): boolean {
    const before = this.text;
    this.aside = text;
    this.hold(done);
    return this.text !== before;
  }

  private hold(done: Promise<unknown>) {
    const turn = ++this.turn;
    this.left = ASIDE_MIN;
    this.spoken = false;
    const end = () => {
      if (turn === this.turn) this.spoken = true;
    };
    done.then(end, end);
  }

  /** Steps the clock. Returns true when a line said in between has just given the instruction back. */
  update(dt: number): boolean {
    if (this.left > 0) this.left -= dt;
    if (this.aside && !this.live) {
      this.aside = '';
      return true;
    }
    return false;
  }
}
