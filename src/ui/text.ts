import { Text } from 'pixi.js';
import { ink } from '../art/palette';

export const FONT = 'Fredoka, ui-rounded, system-ui, sans-serif';

/** Centered text in the house font. */
export function label(text: string, size: number, color = ink, weight: '500' | '600' = '600'): Text {
  const t = new Text({ text, style: { fontFamily: FONT, fontSize: size, fill: color, fontWeight: weight, align: 'center' } });
  t.anchor.set(0.5);
  return t;
}
