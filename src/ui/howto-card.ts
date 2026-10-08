import { Container, Graphics, Text } from 'pixi.js';
import { ink, swatch } from '../art/palette';
import { onTap } from '../engine/input';
import type { View } from '../engine/view';
import type { Demo } from '../couch/demo';
import type { HowToCard } from '../content/howto';
import { RoundButton } from './buttons';
import { checkIcon, houseIcon, playIcon } from './icons';
import { FONT } from './text';

const MUTED = 0x6b6b7b;
/** Body text steps down through these scales until the card fits the screen. */
const SCALES = [1, 0.9, 0.8, 0.7];
/** The longest side of the game's picture on the intro. */
const ICON_BOX = 100;
/** The demonstration's window, beside the text on a wide screen (a quarter-turn narrower at small text) or above it on a tall one. */
const DEMO_WIDE = 400;
const DEMO_TALL = 520;
const NOTE_CONTROLLER = 'A demonstration: a controller moves the highlight. You tap or drag.';
const NOTE_FINGER = 'A demonstration of this level: a pretend finger taps and drags. You do the same.';
const NOTE_MOUSE = 'A demonstration of this level: a pointer clicks and drags. You do the same.';

/** What the card does as the intro before a game's first round: it starts the round, or goes back. */
export interface HowToIntro {
  /** Makes the game's picture, with its feet at (0, 0): a new one each time the card is laid out. */
  icon: () => Container;
  play: () => void;
  back: () => void;
  /** A bot playing a real round in a window on the card, for a game that has one. The card runs, places and destroys it. */
  demo?: Demo;
}

/**
 * A plain card for the grown-up: what the game is for, how to play this level, how the round ends.
 * Opened from the "?" it covers the screen so nothing underneath can be touched, and closes on the green
 * check or a tap on the veil. As the intro before a round it fills the screen, shows the game's picture,
 * and offers a big Play and a Back; a stray tap on the backdrop does nothing. For a game with a bot it also
 * shows a demonstration round in a window (beside the text on a wide screen, above it on a tall one).
 * Reading it changes nothing about the round.
 */
export class HowToPanel extends Container {
  private readonly body = new Container();
  private readonly veil = new Graphics();

  constructor(
    private readonly info: HowToCard,
    private readonly close: () => void,
    private readonly intro?: HowToIntro,
  ) {
    super();
    this.veil.eventMode = 'static';
    if (!intro) onTap(this.veil, close, { cooldown: 400 });
    this.addChild(this.veil, this.body);
    const demo = intro?.demo;
    if (demo) {
      // The game inside the window is a separate copy: nothing she touches may reach it.
      demo.root.eventMode = 'none';
      this.addChild(demo.root);
    }
  }

  /** Run the demonstration, if there is one. */
  update(dt: number) {
    this.intro?.demo?.update(dt);
  }

  destroy(options?: Parameters<Container['destroy']>[0]) {
    this.intro?.demo?.destroy();
    super.destroy(options);
  }

  layout(view: View) {
    this.veil.clear().rect(0, 0, view.w, view.h);
    if (this.intro) this.veil.fill(0xfff4e3);
    else this.veil.fill({ color: 0x2b2440, alpha: 0.5 });
    this.body.removeChildren().forEach((c) => c.destroy({ children: true }));
    // Long entries step their text down rather than run off a short screen; buttons keep their size.
    let built = this.build(view, SCALES[0]);
    for (const scale of SCALES.slice(1)) {
      if (built.card.height + 24 <= view.h) break;
      built.card.destroy({ children: true });
      built = this.build(view, scale);
    }
    this.body.addChild(built.card);
    if (built.window) this.intro!.demo!.layout(built.card.x + built.window.x, built.card.y + built.window.y, built.window.w);
  }

  private build(view: View, scale: number): { card: Container; window: { x: number; y: number; w: number } | null } {
    const demo = this.intro?.demo;
    // Beside the text when the screen is wider than tall; above it when it is tall. The window shrinks a little with the text.
    const wide = !!demo && view.w >= view.h * 1.1;
    const width = Math.min(view.w - 60, wide ? 1000 : 760);
    const dw = !demo ? 0 : wide ? Math.round(DEMO_WIDE * Math.max(scale, 0.8)) : Math.min(width - 64, DEMO_TALL);
    const dh = Math.round(dw * 0.75);
    const noteH = demo ? 40 : 0;
    const inner = wide ? width - 64 - dw - 28 : width - 64;
    const text = (value: string, size: number, fill: number, weight: '500' | '600' = '500', wrap = inner) =>
      new Text({ text: value, style: { fontFamily: FONT, fontSize: size, fill, fontWeight: weight, wordWrap: true, wordWrapWidth: wrap, lineHeight: size * 1.25 } });
    const BODY = Math.round(22 * scale);

    const rows: Text[] = [];
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
    add('THIS LEVEL', this.info.level);
    add('GOAL', this.info.goal);
    rows.push(text('WHAT TO DO', 13, MUTED, '600'));
    this.info.steps.forEach((s, i) => rows.push(text(`${i + 1}.  ${s}`, BODY, ink)));
    add('THE ROUND ENDS', this.info.finish);
    if (this.info.note) add('GOOD TO KNOW', this.info.note);

    // Labels hug the line below; groups get more air. A demo above the text pushes it down; beside it, it does not.
    let y = head ? head.bottom : 30;
    const slot = demo ? { x: wide ? width - 32 - dw : (width - dw) / 2, y: wide ? 22 : y + 2, w: dw } : null;
    if (demo && !wide) y += dh + noteH + 8;
    const placed: Array<[Text, number]> = [];
    for (const r of rows) {
      const small = r.style.fontSize === 13;
      if (small && placed.length) y += 14;
      placed.push([r, y]);
      y += r.height + (small ? 3 : 6);
    }
    if (demo && wide) y = Math.max(y, 22 + dh + noteH + 8);
    // The intro's Play is the biggest thing on the card; the "?" card has one small check.
    const play = this.intro ? 62 : 52;
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
    }
    for (const [r, ry] of placed) {
      r.position.set(32, ry);
      card.addChild(r);
    }
    if (this.intro) {
      const go = new RoundButton(playIcon(), swatch.green, play, this.intro.play);
      const back = new RoundButton(houseIcon(0xffffff), swatch.blue, 52, this.intro.back);
      go.position.set(width / 2 + 62, y + 24 + play);
      back.position.set(width / 2 - 94, y + 24 + play);
      card.addChild(back, go);
    } else {
      const ok = new RoundButton(checkIcon(), swatch.green, play, this.close);
      ok.position.set(width / 2, y + 24 + play);
      card.addChild(ok);
    }

    card.position.set((view.w - width) / 2, Math.max(12, (view.h - cardH) / 2));
    // A tap on the card itself must not fall through to the veil and close it.
    card.eventMode = 'static';
    return { card, window: slot };
  }

  /** The game's picture on the left, the label and title beside it. */
  private header(width: number, scale: number): { nodes: Container[]; bottom: number } {
    const icon = this.intro!.icon();
    const box = icon.getLocalBounds();
    const fit = ICON_BOX / Math.max(box.width, box.height, 1);
    icon.scale.set(fit);
    icon.position.set(32 + ICON_BOX / 2 - (box.x + box.width / 2) * fit, 20 + ICON_BOX / 2 - (box.y + box.height / 2) * fit);
    const label = new Text({ text: 'HOW TO PLAY', style: { fontFamily: FONT, fontSize: 13, fill: MUTED, fontWeight: '600' } });
    const title = new Text({ text: this.info.title, style: { fontFamily: FONT, fontSize: Math.round(34 * scale), fill: ink, fontWeight: '600', wordWrap: true, wordWrapWidth: width - 32 - ICON_BOX - 16 - 16 } });
    const x = 32 + ICON_BOX + 20;
    label.position.set(x, 20 + ICON_BOX / 2 - title.height / 2 - 20);
    title.position.set(x, 20 + ICON_BOX / 2 - title.height / 2);
    return { nodes: [icon, label, title], bottom: 20 + ICON_BOX + 10 };
  }
}

/** The "?" on the hold-to-open button. */
export function questionIcon(): Text {
  const t = new Text({ text: '?', style: { fontFamily: FONT, fontSize: 46, fill: ink, fontWeight: '600' } });
  t.anchor.set(0.5);
  return t;
}
