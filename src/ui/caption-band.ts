import { Container, Graphics, Rectangle, Text } from 'pixi.js';
import { cream, ink } from '../art/palette';
import { onTap } from '../engine/input';
import type { Tweener } from '../engine/tween';
import {
  BUBBLE,
  CAPTION_SIZES,
  CaptionLines,
  captionTextHeight,
  captionTextWidth,
  lineHeight,
  type CaptionPlace,
} from './caption-layout';
import { FONT } from './text';

/** A wrong answer's wobble: this far to each side, twice, in this long. */
const WOBBLE = 6;
const WOBBLE_S = 0.36;
/** A line said in between is set in a lighter ink than the instruction. */
const ASIDE_INK = 0.66;

/** A small speaker: the band repeats the line, as the hear-again button does. */
export function speakerIcon(): Graphics {
  const g = new Graphics();
  g.poly([-14, -6, -6, -6, 4, -15, 4, 15, -6, 6, -14, 6]).fill(ink);
  g.arc(4, 0, 9, -0.9, 0.9).stroke({ color: ink, width: 3, cap: 'round' });
  g.arc(4, 0, 16, -0.9, 0.9).stroke({ color: ink, width: 3, cap: 'round' });
  g.alpha = 0.7;
  return g;
}

/**
 * The guide's current question, written out for a reader (TotoLogic P3, docs/definitions/question-on-screen.md): a strip
 * below the guide on an upright phone, a rail on the left on a sideways one, always outside the view the game lays out
 * in. Tapping it does what tapping the guide does. It never clips a line: a long one is set smaller, then scaled to fit.
 * A line the guide says in between (a hint, a reason, praise) takes the instruction's place while it is spoken, in a
 * lighter ink. On a screen with no side to spare it is a bubble above the guide that shows only while a line is said
 * and lets every touch through to the board.
 */
export class CaptionBand extends Container {
  private readonly bubble = new Graphics();
  private readonly words: Text;
  private readonly speaker = speakerIcon();
  /** The bubble and its words, scaled about the bubble's middle for the squash and the pulse. */
  private readonly body = new Container();
  private place: CaptionPlace | null = null;
  private readonly lines = new CaptionLines();
  /** Where the body rests, and how far into a wrong answer's wobble it is (negative: still). */
  private restX = 0;
  private wobbleT = -1;

  constructor(
    private readonly tw: Tweener,
    onRepeat: () => void,
  ) {
    super();
    this.words = new Text({
      text: '',
      style: { fontFamily: FONT, fontSize: CAPTION_SIZES[0], fill: ink, fontWeight: '500', wordWrap: true },
    });
    this.body.addChild(this.bubble, this.words, this.speaker);
    this.addChild(this.body);
    this.visible = false;
    onTap(
      this.body,
      () => {
        // Answers on touch-down with a short squash.
        this.tw.kill(this.body.scale);
        this.body.scale.set(0.96);
        void this.tw.to(this.body.scale, { x: 1, y: 1 }, { duration: 0.18 });
        onRepeat();
      },
      { cooldown: 300 },
    );
  }

  /** The words on show (empty before the first instruction). */
  get text(): string {
    return this.lines.text;
  }

  /** Whether the band is a bubble over the board, which never takes a touch. */
  get overBoard(): boolean {
    return this.place?.mode === 'bubble';
  }

  /** Whether there is something to show now: the strip and rail keep their words, the bubble only while a line is said. */
  get wanted(): boolean {
    return !!this.lines.text && (!this.overBoard || this.lines.live);
  }

  /** Whether the band has a place on this screen. */
  get placed(): boolean {
    return !!this.place?.band;
  }

  /** Shows the instruction until `done` (its speech) ends and after; a changed one pulses once so it is noticed without sound. */
  instruct(text: string, done: Promise<unknown>) {
    const first = !this.lines.hasInstruction;
    if (!this.lines.instruct(text, done)) return;
    this.draw();
    if (first) return;
    this.tw.kill(this.body.scale);
    this.body.scale.set(1.04);
    void this.tw.to(this.body.scale, { x: 1, y: 1 }, { duration: 0.25 });
  }

  /** Shows a line said in between for as long as it is spoken, then the instruction returns. */
  say(text: string, done: Promise<unknown>) {
    if (this.lines.say(text, done)) this.draw();
  }

  /** Beside the boing of a wrong answer: two small sideways wobbles. Never a cross, a red mark or a count. */
  wobble() {
    this.wobbleT = 0;
  }

  update(dt: number) {
    if (this.lines.update(dt)) this.draw();
    if (this.wobbleT < 0) return;
    this.wobbleT += dt;
    const done = this.wobbleT >= WOBBLE_S;
    this.body.x = this.restX + (done ? 0 : WOBBLE * Math.sin((this.wobbleT / WOBBLE_S) * Math.PI * 4));
    if (done) this.wobbleT = -1;
  }

  layout(place: CaptionPlace) {
    this.place = place;
    // The bubble lies over the board, so it lets every touch through; the strip and rail are a second guide to tap.
    const over = place.mode === 'bubble';
    this.eventMode = over ? 'none' : 'passive';
    this.interactiveChildren = !over;
    this.speaker.visible = !over;
    this.draw();
  }

  private draw() {
    const place = this.place;
    const band = place?.band;
    if (!place || !band) return;
    const maxW = captionTextWidth(place);
    const maxH = captionTextHeight(place);
    const t = this.words;
    t.scale.set(1);
    t.text = this.lines.text;
    t.alpha = this.lines.isAside ? ASIDE_INK : 1;
    for (const size of CAPTION_SIZES) {
      t.style.fontSize = size;
      t.style.lineHeight = lineHeight(size);
      t.style.wordWrapWidth = maxW;
      if (t.height <= maxH) break;
    }
    // Past the budget (a long name in a slot): the whole line, smaller, never a clipped one.
    if (t.height > maxH || t.width > maxW) t.scale.set(Math.min(maxH / t.height, maxW / t.width));

    const strip = place.mode === 'strip';
    const over = place.mode === 'bubble';
    const x0 = band.x + BUBBLE.margin;
    // The bubble is only as wide as its words; the strip and rail fill their band.
    const w = over ? Math.max(160, t.width + 2 * BUBBLE.padX) : band.w - 2 * BUBBLE.margin;
    let y0: number;
    let h: number;
    if (strip) {
      y0 = band.y + BUBBLE.tail;
      h = band.h - BUBBLE.tail - BUBBLE.margin + 2;
    } else if (over) {
      // Above the guide, growing upward with the words.
      h = t.height + 2 * BUBBLE.railPadY;
      y0 = band.y + band.h - BUBBLE.tail - h;
    } else {
      // The rail's bubble sits at the bottom and grows upward with the words.
      h = Math.max(120, t.height + 2 * BUBBLE.railPadY + BUBBLE.speaker);
      y0 = band.y + band.h - BUBBLE.margin - h;
    }
    // Drawn about the bubble's middle so the squash and pulse stay in place.
    const cx = x0 + w / 2;
    const cy = y0 + h / 2;
    this.restX = cx;
    this.body.position.set(cx, cy);
    const g = this.bubble.clear();
    g.roundRect(-w / 2, -h / 2, w, h, 26);
    g.fill(cream).stroke({ color: ink, width: 3, alpha: 0.22 });
    if (strip) {
      // The tail points up at the guide, which stands just above the strip's left end.
      const tx = 74 - cx;
      g.poly([tx - 16, -h / 2 + 1, tx, -h / 2 - BUBBLE.tail, tx + 16, -h / 2 + 1]);
    } else if (over) {
      // The tail points down at the guide, which stands under the bubble's left end.
      const tx = 74 - cx;
      g.poly([tx - 16, h / 2 - 1, tx, h / 2 + BUBBLE.tail, tx + 16, h / 2 - 1]);
    } else {
      // The tail points right at the guide, which stands beside the rail's foot.
      const ty = h / 2 - 60;
      g.poly([w / 2 - 1, ty - 14, w / 2 + BUBBLE.margin + 2, ty, w / 2 - 1, ty + 14]);
    }
    g.fill(cream);
    if (strip) {
      t.position.set(-w / 2 + BUBBLE.padX, -t.height / 2);
      this.speaker.position.set(w / 2 - BUBBLE.padX - BUBBLE.speaker / 2, 0);
    } else if (over) {
      t.position.set(-w / 2 + BUBBLE.padX, -h / 2 + BUBBLE.railPadY);
    } else {
      t.position.set(-w / 2 + BUBBLE.padX, -h / 2 + BUBBLE.railPadY);
      this.speaker.position.set(
        w / 2 - BUBBLE.padX - BUBBLE.speaker / 2,
        h / 2 - BUBBLE.railPadY - BUBBLE.speaker / 2,
      );
    }
    this.body.hitArea = new Rectangle(-w / 2, -h / 2, w, h);
  }
}
