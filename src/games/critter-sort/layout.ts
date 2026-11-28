import { spread, type View } from '../../engine/view';
import { BUBBLE, BUBBLE_FOOT, BUBBLE_TEXT_H, STRIP_H, STRIP_MIN_VIEW_H } from '../../ui/caption-layout';
import { HOOP_R, MAT_RX, hoopCenters, neitherMat, overlaps, type Point, type SortMode } from './logic';

/** Hit areas in board units, measured from each piece's feet. */
export const CRITTER_SCALE = 0.32;
export const CRITTER_HIT = { y: -120 * CRITTER_SCALE, radius: 170 * CRITTER_SCALE };
export const PLANT_HIT = { y: -70, radius: 75 };

export function sortLayout(view: View, mode: SortMode, hoops: number, loose: number, outside: number) {
  const { w, h, upright } = view;
  const middle = w / 2;
  // The game can also receive a view shortened by a caption strip. Leave the same space
  // on short views so every tray stays clear if a caption appears above the guide instead.
  const short = upright && h >= STRIP_MIN_VIEW_H - 0.5 && h < STRIP_MIN_VIEW_H + STRIP_H;
  const bubbleTop = h - BUBBLE_FOOT - BUBBLE_TEXT_H - 2 * BUBBLE.railPadY - BUBBLE.tail;
  const highRow = short ? bubbleTop - 24 : h - 190;
  const centers = hoopCenters(mode, hoops, view);
  if (upright) {
    for (const c of centers) c.y = highRow - 460;
  }
  const first = centers[0];
  const mat = neitherMat(centers);
  const looseRow = (n: number, y: number): Point[] =>
    spread(n, upright ? 170 : 190, w - 50, upright ? 156 : 150).map((x) => ({ x, y }));

  const choices = [-1, 0, 1].map((i) => middle + (upright ? 46 : 0) + i * 190);
  const lowerCount = upright ? Math.min(loose, 3) : loose;
  return {
    centers,
    mat,
    signs: centers.map((c, i) => ({
      x: c.x + (hoops === 2 && (!upright || overlaps(mode)) ? (i ? 80 : -80) : 0),
      y: c.y - HOOP_R - 50,
    })),
    parent: mode === 'venn' ? { x: middle, y: first.y - 150 } : { x: first.x - 215, y: first.y - 70 },
    loose: [...looseRow(lowerCount, h - (upright ? 25 : 40)), ...looseRow(loose - lowerCount, highRow)],
    outside: spread(outside, 190, w - 50, 150).map((x) => ({
      x,
      y: upright ? mat.y : Math.min(h * 0.42 + HOOP_R + 120, h - 150),
    })),
    // Pick the signs: the offered signs wait across the empty hoops, clear of the loose critters' bottom row.
    picks: [-1, 0, 1].map((i) => ({ x: middle + i * 190, y: first.y })),
    guesses: (upright ? choices : spread(3, 220, w - 120, 190)).map((x) => ({ x, y: h - 90 })),
    compares: choices.map((x) => ({ x, y: h - 65 })),
    badges: [
      { x: first.x + (upright ? -159 : HOOP_R + 30), y: first.y },
      { x: (centers[1]?.x ?? first.x) + (upright ? 159 : HOOP_R + 30), y: first.y },
      { x: mat.x + MAT_RX + 40, y: mat.y },
    ],
  };
}
