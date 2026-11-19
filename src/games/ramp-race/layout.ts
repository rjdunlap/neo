import type { View } from '../../engine/view';
import { MAX_DISTANCE } from './logic';

/**
 * Where Ramp Race puts things, as pure functions of the view, so the sideways layout and the upright phone's (chunk 31,
 * docs/definitions/phone-portrait.md) are both testable (`upright.test.ts`). Sideways, a ramp starts 150 units in and its
 * floor stops 150 short of the right edge, beside the go button; the record cards sit top right. On the upright 768-wide
 * area a ramp starts 40 in and its floor runs to 30 short of the edge (go sits below every floor there), so a floor mark
 * is about as long as it is sideways; the cards, the fair-test sign and the claim tiles hang just above the top lane
 * instead of at the top of a tall screen.
 */

type V = Pick<View, 'w' | 'h'>;

export interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** A ramp's width and how tall one height step stands. */
export const RAMP_W = 170;
export const HEIGHT_PX = 46;
/** A record card. */
export const CARD_W = 460;
export const CARD_H = 104;
/** A claim tile, and the gap between two. */
export const TILE_W = 200;
export const TILE_H = 150;
const TILE_GAP = 30;
/** The go button's radius. */
export const GO_R = 60;

/** The upright phone's 768-wide area (a sideways view is never under 1024 wide). */
export const narrow = (v: V) => v.w < 1020;

/** One lane: the ramp's left edge and foot, how many units a floor mark is, and the floor's height on screen. */
export interface LaneSpot {
  x0: number;
  rampEnd: number;
  unit: number;
  floorY: number;
}

/** The lanes, top first: one at two thirds of the height, or two. */
export function lanesOf(v: V, count = 1): LaneSpot[] {
  const x0 = narrow(v) ? 40 : 150;
  const rampEnd = x0 + RAMP_W;
  const unit = (v.w - (narrow(v) ? 30 : 150) - rampEnd) / (MAX_DISTANCE + 0.6);
  return (count === 2 ? [0.42, 0.78] : [0.66]).map((f) => ({ x0, rampEnd, unit, floorY: v.h * f }));
}

/** The single-lane levels' lane. */
export const laneOf = (v: V): LaneSpot => lanesOf(v, 1)[0];

/** A floor's drawn length. */
export const floorLength = (l: LaneSpot) => (MAX_DISTANCE + 0.6) * l.unit;

/** The ramp's touch pad: the whole tallest ramp and a little around it. */
export const rampPad = (l: LaneSpot): Box => ({
  x: l.x0 - 20,
  y: l.floorY - 4 * HEIGHT_PX - 30,
  w: RAMP_W + 30,
  h: 4 * HEIGHT_PX + 40,
});

/** The floor's touch pad: from just past the ramp's pad to the floor's end, 100 units tall over the strip and its marks. */
export const floorPad = (l: LaneSpot): Box => ({
  x: l.rampEnd + 10,
  y: l.floorY - 28,
  w: floorLength(l) - 10,
  h: 100,
});

/** The go button's middle, bottom right. */
export const goSpot = (v: V) => ({ x: v.w - 80, y: v.h - 80 });

/** The fair-test sign's middle (340 by 100): top middle sideways, just above the top lane's tallest ramp upright. */
export const signSpot = (v: V) => ({
  x: v.w / 2 + 60,
  y: narrow(v) ? Math.max(80, lanesOf(v, 2)[0].floorY - 280) : 80,
});

/** The top of the two stacked cards: the top of the screen sideways, just above the top lane's ramp upright. */
function cardsTop(v: V, lanes: number): number {
  return narrow(v) ? Math.max(36, lanesOf(v, lanes)[0].floorY - 474) : 36;
}

/**
 * The Trial Shelf's pieces: two stacked record cards right-aligned, the decorative ask badge left of them, and the guess
 * zone on the floor split at the first card's flag (`flag` in marks). `lanes` is how many lanes the level shows (the
 * cards hang above the top one upright).
 */
export function shelfLayout(
  v: V,
  flag: number,
  lanes = 1,
): { cards: [Box, Box]; badge: Box; guess: { before: Box; past: Box } } {
  const x = v.w - 40 - CARD_W;
  const y = cardsTop(v, lanes);
  const cards: [Box, Box] = [
    { x, y, w: CARD_W, h: CARD_H },
    { x, y: y + CARD_H + 12, w: CARD_W, h: CARD_H },
  ];
  const lane = laneOf(v);
  const split = lane.rampEnd + flag * lane.unit;
  const top = lane.floorY - 110;
  const h = 170;
  // Start just past the ramp's touch pad (it reaches 10 units beyond the ramp's foot), so a guess never cycles the ramp.
  const left = lane.rampEnd + 12;
  const right = lane.rampEnd + floorLength(lane);
  return {
    cards,
    badge: { x: v.w - 630, y: y + 60, w: 100, h: 100 },
    guess: {
      before: { x: left, y: top, w: split - left, h },
      past: { x: split, y: top, w: right - split, h },
    },
  };
}

/**
 * What can we tell?'s pieces: the shelf's two cards above two lanes, and three claim tiles in a centered row 44 units
 * under them (tops at 300 sideways).
 */
export function tellLayout(v: V): { cards: [Box, Box]; tiles: [Box, Box, Box] } {
  const cards = shelfLayout(v, 0, 2).cards;
  const left = v.w / 2 - (3 * TILE_W + 2 * TILE_GAP) / 2;
  const y = cards[1].y + CARD_H + 44;
  const tile = (k: number): Box => ({ x: left + k * (TILE_W + TILE_GAP), y, w: TILE_W, h: TILE_H });
  return { cards, tiles: [tile(0), tile(1), tile(2)] };
}
