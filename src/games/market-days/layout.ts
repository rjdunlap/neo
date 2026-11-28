import type { View } from '../../engine/view';
import { LATTICE } from './logic';

export interface Spot {
  x: number;
  y: number;
}

export interface MarketLayout {
  upright: boolean;
  /** A town's hit size and the lattice step between towns. */
  town: number;
  pitch: number;
  /** The lattice point (0, 0)'s center. */
  origin: Spot;
  /** Banner tray spots (up to four), and a banner's edge. */
  tray: Spot[];
  banner: number;
  /** Round buttons: hint, undo, restart, why. */
  buttons: Spot[];
  button: number;
}

/**
 * Where Market Days puts things, pure so a test reads it at every view. Sideways: the map in the middle, the banner tray along
 * the bottom clear of the guide, the round buttons in a column on the right. Upright: the map under Home and "?", the tray under it, the
 * buttons in a row at the foot clear of the guide.
 */
export function marketLayout(v: Pick<View, 'w' | 'h' | 'upright'>, banners: number): MarketLayout {
  const upright = !!v.upright;
  const banner = 100;
  const button = 100;
  const trayAt = (y: number, x0: number, step: number): Spot[] =>
    Array.from({ length: banners }, (_, i) => ({ x: x0 + i * step, y }));
  if (upright) {
    const pitch = 130;
    const town = 104;
    const extra = Math.max(0, v.h - 1024);
    const top = 268 + extra * 0.35;
    const cx = v.w / 2;
    const step = 140;
    const x0 = cx - ((banners - 1) * step) / 2;
    return {
      upright,
      town,
      pitch,
      origin: { x: cx - ((LATTICE.w - 1) * pitch) / 2, y: top },
      tray: trayAt(v.h - 230, x0, step),
      banner,
      buttons: [250, 400, 550, 700].map((x) => ({ x, y: v.h - 108 })),
      button,
    };
  }
  const pitch = 118;
  const town = 100;
  const cx = v.w / 2 - 70;
  return {
    upright,
    town,
    pitch,
    origin: { x: cx - ((LATTICE.w - 1) * pitch) / 2, y: 150 },
    tray: trayAt(v.h - 100, cx - (banners - 1) * 70, 140),
    banner,
    buttons: [150, 280, 410, 540].map((y) => ({ x: v.w - 110, y })),
    button,
  };
}

export const townSpot = (L: MarketLayout, t: { x: number; y: number }): Spot => ({
  x: L.origin.x + t.x * L.pitch,
  y: L.origin.y + t.y * L.pitch,
});
