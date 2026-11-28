import type { View } from '../../engine/view';
import type { PixelPlan } from './logic';

export const CELL = 100;
export const BOARD_RIM = 13;
export const MODEL_MARGIN = 12;
export const PAINT_RADIUS = 56;
export const DONE_RADIUS = 60;

export function modelSize(plan: PixelPlan) {
  return plan.mode === 'big' ? 40 : 30;
}

export function pictureLayout(v: View, plan: PixelPlan) {
  const width = plan.size * CELL;
  const hasClues = plan.mode === 'clues' || plan.mode === 'colorClues';
  const hasModel = plan.mode === 'copy' || plan.mode === 'big';
  const free = plan.mode === 'free';
  const narrow = v.w < 920;
  const clueSpace = hasClues ? 90 : 0;
  const modelSpace = hasModel ? 230 : 0;
  const paletteSpace = plan.mode === 'colorClues' ? 130 : free ? 280 : 0;
  // Stack the reference above the board upright. Leave room to its left for the clue numbers.
  const stack = v.upright && !free;
  const x = stack
    ? (v.w - width + (hasClues ? 120 : 0)) / 2
    : Math.max(160, (v.w - width - clueSpace - modelSpace - paletteSpace) / 2 + clueSpace);
  // The board clears Home and Help even on the shortest upright view.
  const y = stack
    ? Math.max(240, (v.h - width) / 2)
    : Math.max(hasClues ? 150 : 110, (v.h - width) / 2 + (hasClues ? 30 : 0));
  const modelWidth = (plan.mode === 'big' ? plan.size / 2 : plan.size) * modelSize(plan);
  const model = stack ? { x: (v.w - modelWidth) / 2, y: y - modelWidth - 34 } : { x: x + width + 60, y };

  // The free-paint row starts to the right of the guide and ends with Done.
  const rowX = Math.max(206, v.w / 2 - 232);
  const rowY = Math.min(v.h - 70, y + width + (v.upright ? 78 : 70));
  const paint = (i: number) => {
    if (free && narrow) return { x: rowX + i * 116, y: rowY };
    if (free) return { x: x + width + 100, y: y + 60 + i * 126 };
    if (narrow) {
      return {
        x: v.w / 2 + (i ? 72 : -72),
        y: Math.min(v.h - 60, y + width + (stack ? 78 : 64)),
      };
    }
    return { x: x + width + 150, y: y + width - 60 - i * 120 };
  };
  const done = narrow ? { x: rowX + 4 * 116 + 10, y: rowY } : { x: x + width + 240, y: y + width - 60 };
  return { board: { x, y, width }, model, modelWidth, paint, done };
}

/** Window Mosaic: the model window's pane size, her window's (the same as `CELL`) and the choice windows' largest. */
export const MOSAIC_MODEL_PANE = 40;
export const MOSAIC_CHOICE_PANE = 50;
/** A choice window is never narrower than this many units on its shortest side. */
export const MOSAIC_MIN_CHOICE = 100;

export interface MosaicBox {
  x: number;
  y: number;
  /** Units to a pane; a window is four panes wide. */
  pane: number;
}

export interface MosaicLayout {
  /** Tag 1's model. */
  model: MosaicBox;
  /** Tag 2's model, on top of the three choices. */
  pickModel: MosaicBox;
  own: MosaicBox;
  check: { x: number; y: number };
  choices: MosaicBox[];
}

/**
 * Where the windows sit. Tag 1: the model above (upright) or beside her window, with the green check clear of Home and
 * Help. Tag 2: the model on top and the three choices in a row under it; a view too narrow for a row stacks them in a
 * column before any window shrinks below `MOSAIC_MIN_CHOICE` units.
 */
export function mosaicLayout(v: View): MosaicLayout {
  const own = 4 * CELL;
  const modelW = 4 * MOSAIC_MODEL_PANE;
  const gap = 40;
  const fit = Math.floor((v.w - 2 * 60 - 2 * gap) / 12);
  const row = fit >= MOSAIC_MIN_CHOICE / 4;
  const pane = row ? Math.min(MOSAIC_CHOICE_PANE, fit) : MOSAIC_CHOICE_PANE;
  const w = 4 * pane;
  const choices: MosaicBox[] = [0, 1, 2].map((i) =>
    row
      ? { x: v.w / 2 - (3 * w + 2 * gap) / 2 + i * (w + gap), y: v.upright ? 440 : 360, pane }
      : { x: (v.w - w) / 2, y: 330 + i * (w + 24), pane },
  );
  if (v.upright) {
    const y = Math.max(300, (v.h - own) / 2);
    return {
      model: { x: (v.w - modelW) / 2, y: 130, pane: MOSAIC_MODEL_PANE },
      pickModel: { x: (v.w - modelW) / 2, y: 130, pane: MOSAIC_MODEL_PANE },
      own: { x: (v.w - own) / 2, y, pane: CELL },
      check: { x: v.w / 2, y: Math.min(v.h - 60, y + own + 86) },
      choices,
    };
  }
  const x = Math.max(160, (v.w - own - 230) / 2);
  const y = Math.max(110, (v.h - own) / 2);
  return {
    model: { x: x + own + 70, y, pane: MOSAIC_MODEL_PANE },
    pickModel: { x: (v.w - modelW) / 2, y: 110, pane: MOSAIC_MODEL_PANE },
    own: { x, y, pane: CELL },
    check: { x: x + own + 70 + modelW / 2, y: y + own - 60 },
    choices: choices.map((c) => ({ ...c, y: 330 })),
  };
}
