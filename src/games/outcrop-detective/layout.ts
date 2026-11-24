import type { View } from '../../engine/view';
import type { Step } from './logic';

export type Box = { x: number; y: number; w: number; h: number };

const box = (x: number, y: number, w: number, h: number): Box => ({ x, y, w, h });

/**
 * Where everything sits, boxes by their centres. The definition's sizes are kept where they fit the check views; where
 * they do not, the sizes here win (docs/definitions/outcrop-detective.md, screen and controls):
 *
 * Upright, top to bottom: the cliff and the story frame side by side (clear of Home and "?" in the top-left column), the
 * sign under the cliff and Play under the story frame, the four-card ribbon, then one row for the current step: Check
 * (order steps), the two answers (for sure?) or the three look cards with Look (look). Only one step's row shows at a
 * time, so Check is not beside the answers or the looks. Everything sits above the caption bubble, which starts 781 units
 * down on the captioned small phone.
 *
 * Sideways the caption bubble covers the left 640 units below 343, so the two frames sit above it on the left and the
 * ribbon (two rows of two, numbered), Play, Check and the step's row go in a column on the right.
 */
export function outcropLayout({ w, h, upright }: Pick<View, 'w' | 'h' | 'upright'>) {
  if (upright) {
    // A taller screen spreads the board downwards.
    const d = Math.min(200, Math.max(0, (h - 1240) / 2));
    const cx = w / 2;
    const frameY = 190 + d * 0.3;
    const rowY = 707 + d * 0.8;
    return {
      cliff: box(cx - 119, frameY, 270, 300),
      story: box(cx + 171, frameY, 270, 300),
      sign: { x: cx - 119, y: 395 + d * 0.4, wrap: 270, size: 19 },
      play: box(cx + 171, 400 + d * 0.4, 200, 100),
      cards: [-276, -92, 92, 276].map((dx) => box(cx + dx, 552 + d * 0.6, 160, 144)),
      check: box(cx + 256, rowY, 200, 110),
      answers: [box(cx - 154, rowY, 300, 110), box(cx + 176, rowY, 300, 110)],
      looks: [-284, -118, 48].map((dx) => box(cx + dx, rowY, 150, 140)),
      look: box(cx + 256, rowY, 200, 110),
      text: 26,
      numbered: false,
    };
  }
  const left = Math.max(0, (w - 1024) / 2);
  const cx = left + 832;
  return {
    cliff: box(left + 250, 175, 240, 290),
    story: box(left + 500, 175, 240, 290),
    sign: { x: left + 375, y: 335, wrap: 480, size: 17 },
    play: box(cx - 92, 345, 170, 100),
    cards: [
      box(cx - 92, 80, 170, 120),
      box(cx + 92, 80, 170, 120),
      box(cx - 92, 215, 170, 120),
      box(cx + 92, 215, 170, 120),
    ],
    check: box(cx + 92, 345, 170, 100),
    answers: [box(cx, 460, 360, 100), box(cx, 570, 360, 100)],
    looks: [-124, 0, 124].map((dx) => box(cx + dx, 470, 112, 112)),
    look: box(cx, 585, 200, 100),
    text: 22,
    numbered: true,
  };
}

export type OutcropLayout = ReturnType<typeof outcropLayout>;

/** Every target the step shows, with a name, for the layout tests and the browser play. */
export function targets(l: OutcropLayout, step: Step) {
  const out = [...l.cards.map((b, i) => ({ ...b, what: `card ${i + 1}` })), { ...l.play, what: 'Play' }];
  if (step === 'order' || step === 'again') out.push({ ...l.check, what: 'Check' });
  if (step === 'sure')
    out.push(...l.answers.map((b, i) => ({ ...b, what: i ? 'Not enough to tell' : 'Yes' })));
  if (step === 'look')
    out.push(...l.looks.map((b, i) => ({ ...b, what: `look card ${i + 1}` })), { ...l.look, what: 'Look' });
  return out;
}

export const STEPS: readonly Step[] = ['order', 'sure', 'look', 'again'];
