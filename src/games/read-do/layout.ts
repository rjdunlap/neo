import type { View } from '../../engine/view';
import { STRIP_H, STRIP_MIN_VIEW_H } from '../../ui/caption-layout';

type GameView = Pick<View, 'w' | 'h' | 'upright'>;
export interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}
export interface SignLayout {
  /** `The`, the three slot places and the stop. */
  row: Box[];
  speaker: Box;
  wish: Box;
  show: Box;
  send: Box;
  tray: Box[];
  /** Where the stage's animals stand (not a target; kept clear of the controls). */
  stage: Box;
  actors: { x: number; y: number };
  /** A dragged tile's centre counts as over the sign inside this. */
  drop: Box;
}
const box = (cx: number, cy: number, w: number, h: number): Box => ({ x: cx - w / 2, y: cy - h / 2, w, h });
/**
 * Levels 7–9 share the same sign and tray. On short phones the word tiles sit above the caption
 * bubble and the two buttons sit below it, beside the guide.
 */
export function signLayout(v: GameView): SignLayout {
  const cx = v.w / 2,
    mid = v.h * 0.43;
  if (v.upright) {
    const compact = mayUseBubble(v);
    const y = v.h - (compact ? 874 : 725);
    const stageY = v.h - (compact ? 650 : 513);
    const row = tiles(5, cx + 20, y);
    return {
      row,
      speaker: box(cx + 310, stageY, 110, 100),
      wish: box(cx - 258, stageY, 200, 160),
      show: box(cx - 105, v.h - 90, 150, 100),
      send: box(cx + 105, v.h - 90, 150, 100),
      tray: tiles(6, cx, v.h - (compact ? 479 : 310)),
      stage: box(cx + 64, stageY - 35, 360, 240),
      actors: { x: cx + 64, y: stageY },
      drop: signDrop(row, y),
    };
  }
  const row = [0, 1, 2, 3, 4].map((i) => box(cx + (i - 2) * 116, 185, 108, 100));
  return {
    row,
    speaker: box(cx + 365, 185, 110, 100),
    wish: box(cx - 330, mid, 200, 160),
    show: box(cx + 330, mid - 40, 150, 100),
    send: box(cx + 330, mid + 80, 150, 100),
    tray: [0, 1, 2, 3, 4, 5].map((i) => box(cx + (i - 2.5) * 116, v.h - 120, 108, 100)),
    stage: { x: cx - 220, y: mid - 90, w: 440, h: 200 },
    actors: { x: cx, y: mid },
    drop: signDrop(row, 185),
  };
}

export const centre = (b: Box) => ({ x: b.x + b.w / 2, y: b.y + b.h / 2 });

function tiles(count: number, cx: number, y: number) {
  return Array.from({ length: count }, (_, i) => box(cx + (i - (count - 1) / 2) * 116, y, 108, 100));
}

function signDrop(row: Box[], y: number): Box {
  return { x: row[0].x, y: y - 90, w: row[4].x + row[4].w + 60 - row[0].x, h: 180 };
}

// A compact game view can also be the full screen with a spoken caption bubble over it.
const mayUseBubble = (v: GameView) => v.h < STRIP_MIN_VIEW_H + STRIP_H - 0.5;

export function readLayout(v: GameView, wordCount: number, choiceCount: number) {
  const cx = v.w / 2;
  const paired = choiceCount === 4;
  const compact = v.upright && mayUseBubble(v);
  const y = v.upright ? v.h - (compact ? 874 : 695) : 185;
  const wordsX = v.upright ? cx + 196 - wordCount * 58 : cx;
  const choices = Array.from({ length: choiceCount }, (_, i) => {
    const x = paired
      ? cx + (i % 2 ? 1 : -1) * (v.upright ? 184 : 170)
      : cx + (i - (choiceCount - 1) / 2) * 220;
    const y = v.upright
      ? v.h - (compact ? (paired && i < 2 ? 699 : 519) : paired && i < 2 ? 435 : 255)
      : v.h * (paired ? (i < 2 ? 0.62 : 0.85) : 0.7);
    return box(x, y, 170, 160);
  });
  return {
    words: tiles(wordCount, wordsX, y),
    speaker: box(v.upright ? cx + 254 : cx + 365, y, 110, 100),
    choices,
    actor: { x: cx, y: v.upright ? v.h - (compact ? (paired ? 619 : 702) : 480) : v.h * 0.43 },
  };
}

export function markLayout(v: GameView) {
  const cx = v.w / 2;
  const compact = v.upright && mayUseBubble(v);
  const y = v.upright ? v.h - (compact ? 757 : 645) : 185;
  const rowX = v.upright ? cx - 58 : cx;
  const actorY = v.upright ? v.h - (compact ? 593 : 455) : v.h * 0.43;
  const buttonsY = v.upright ? v.h - 90 : v.h * 0.88;
  const row = tiles(4, rowX, y);
  return {
    words: row.slice(0, 3),
    socket: box(centre(row[3]).x, y, 100, 100),
    speaker: box(v.upright ? cx + 232 : cx + 365, y, 110, 100),
    actor: { x: cx, y: actorY },
    show: box(cx - 120 - (v.upright ? 0 : 30), buttonsY, 200, 100),
    send: box(cx + 120 + (v.upright ? 0 : 30), buttonsY, 200, 100),
    stop: box(v.upright ? cx + 220 : cx - 270, v.upright ? actorY : 300, 100, 100),
  };
}
