import { Container, Graphics, Rectangle, Text } from 'pixi.js';
import { cream, ink } from '../art/palette';
import { onTap } from '../engine/input';
import type { Tweener } from '../engine/tween';
import {
  BUBBLE,
  CAPTION_SIZES,
  captionTextHeight,
  captionTextWidth,
  lineHeight,
  type CaptionPlace,
} from './caption-layout';
import { FONT } from './text';

/** A small speaker: the band repeats the line, as the guide does. */
function speakerIcon(): Graphics {
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
 */
export class CaptionBand extends Container {
  private readonly bubble = new Graphics();
  private readonly words: Text;
  private readonly speaker = speakerIcon();
  /** The bubble and its words, scaled about the bubble's middle for the squash and the pulse. */
  private readonly body = new Container();
  private place: CaptionPlace | null = null;
  private shown = '';

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
    return this.shown;
  }

  /** Whether the band has a place on this screen. */
  get placed(): boolean {
    return !!this.place?.band;
  }

  /** Shows a line; a changed one pulses once so it is noticed without sound. */
  show(text: string) {
    if (text === this.shown) return;
    const first = !this.shown;
    this.shown = text;
    this.draw();
    if (first) return;
    this.tw.kill(this.body.scale);
    this.body.scale.set(1.04);
    void this.tw.to(this.body.scale, { x: 1, y: 1 }, { duration: 0.25 });
  }

  layout(place: CaptionPlace) {
    this.place = place;
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
    t.text = this.shown;
    for (const size of CAPTION_SIZES) {
      t.style.fontSize = size;
      t.style.lineHeight = lineHeight(size);
      t.style.wordWrapWidth = maxW;
      if (t.height <= maxH) break;
    }
    // Past the budget (a long name in a slot): the whole line, smaller, never a clipped one.
    if (t.height > maxH || t.width > maxW) t.scale.set(Math.min(maxH / t.height, maxW / t.width));

    const strip = place.mode === 'strip';
    const x0 = band.x + BUBBLE.margin;
    const w = band.w - 2 * BUBBLE.margin;
    let y0: number;
    let h: number;
    if (strip) {
      y0 = band.y + BUBBLE.tail;
      h = band.h - BUBBLE.tail - BUBBLE.margin + 2;
    } else {
      // The rail's bubble sits at the bottom and grows upward with the words.
      h = Math.max(120, t.height + 2 * BUBBLE.railPadY + BUBBLE.speaker);
      y0 = band.y + band.h - BUBBLE.margin - h;
    }
    // Drawn about the bubble's middle so the squash and pulse stay in place.
    const cx = x0 + w / 2;
    const cy = y0 + h / 2;
    this.body.position.set(cx, cy);
    const g = this.bubble.clear();
    g.roundRect(-w / 2, -h / 2, w, h, 26);
    g.fill(cream).stroke({ color: ink, width: 3, alpha: 0.22 });
    if (strip) {
      // The tail points up at the guide, which stands just above the strip's left end.
      const tx = 74 - cx;
      g.poly([tx - 16, -h / 2 + 1, tx, -h / 2 - BUBBLE.tail, tx + 16, -h / 2 + 1]);
    } else {
      // The tail points right at the guide, which stands beside the rail's foot.
      const ty = h / 2 - 60;
      g.poly([w / 2 - 1, ty - 14, w / 2 + BUBBLE.margin + 2, ty, w / 2 - 1, ty + 14]);
    }
    g.fill(cream);
    if (strip) {
      t.position.set(-w / 2 + BUBBLE.padX, -t.height / 2);
      this.speaker.position.set(w / 2 - BUBBLE.padX - BUBBLE.speaker / 2, 0);
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
