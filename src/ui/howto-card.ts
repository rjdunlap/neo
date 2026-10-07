import { Container, Graphics, Text } from 'pixi.js';
import { ink, swatch } from '../art/palette';
import { onTap } from '../engine/input';
import type { View } from '../engine/view';
import type { HowToCard } from '../content/howto';
import { RoundButton } from './buttons';
import { checkIcon } from './icons';
import { FONT } from './text';

const MUTED = 0x6b6b7b;

/**
 * A plain card for the grown-up: what the game is for, how to play this level, how the round ends.
 * It covers the screen so nothing underneath can be touched, and closes on the green check or a tap
 * on the veil. Reading it changes nothing about the round.
 */
export class HowToPanel extends Container {
  private readonly body = new Container();
  private readonly veil = new Graphics();

  constructor(
    private readonly info: HowToCard,
    private readonly close: () => void,
  ) {
    super();
    this.veil.eventMode = 'static';
    onTap(this.veil, close, { cooldown: 400 });
    this.addChild(this.veil, this.body);
  }

  layout(view: View) {
    this.veil.clear().rect(0, 0, view.w, view.h).fill({ color: 0x2b2440, alpha: 0.5 });
    this.body.removeChildren().forEach((c) => c.destroy({ children: true }));

    const width = Math.min(view.w - 60, 760);
    const inner = width - 64;
    const text = (value: string, size: number, fill: number, weight: '500' | '600' = '500') =>
      new Text({ text: value, style: { fontFamily: FONT, fontSize: size, fill, fontWeight: weight, wordWrap: true, wordWrapWidth: inner, lineHeight: size * 1.25 } });

    const rows: Text[] = [];
    const add = (label: string, value: string) => {
      rows.push(text(label, 13, MUTED, '600'));
      rows.push(text(value, 22, ink));
    };
    rows.push(text('HOW TO PLAY', 13, MUTED, '600'));
    rows.push(text(this.info.title, 34, ink, '600'));
    add('THIS LEVEL', this.info.level);
    add('GOAL', this.info.goal);
    rows.push(text('WHAT TO DO', 13, MUTED, '600'));
    this.info.steps.forEach((s, i) => rows.push(text(`${i + 1}.  ${s}`, 22, ink)));
    add('THE ROUND ENDS', this.info.finish);
    if (this.info.note) add('GOOD TO KNOW', this.info.note);

    // Labels hug the line below; groups get more air.
    let y = 30;
    const placed: Array<[Text, number]> = [];
    for (const r of rows) {
      const small = r.style.fontSize === 13;
      if (small && placed.length) y += 14;
      placed.push([r, y]);
      y += r.height + (small ? 3 : 6);
    }
    const cardH = y + 24 + 112 + 18;
    const card = new Container();
    card.addChild(
      new Graphics().roundRect(0, 6, width, cardH, 28).fill({ color: 0x000000, alpha: 0.14 }),
      new Graphics().roundRect(0, 0, width, cardH, 28).fill(0xfffaf0).stroke({ width: 4, color: 0xeadfcd }),
    );
    for (const [r, ry] of placed) {
      r.position.set(32, ry);
      card.addChild(r);
    }
    const ok = new RoundButton(checkIcon(), swatch.green, 52, this.close);
    ok.position.set(width / 2, y + 24 + 52);
    card.addChild(ok);

    card.position.set((view.w - width) / 2, Math.max(16, (view.h - cardH) / 2));
    // A tap on the card itself must not fall through to the veil and close it.
    card.eventMode = 'static';
    this.body.addChild(card);
  }
}

/** The "?" on the hold-to-open button. */
export function questionIcon(): Text {
  const t = new Text({ text: '?', style: { fontFamily: FONT, fontSize: 46, fill: ink, fontWeight: '600' } });
  t.anchor.set(0.5);
  return t;
}
