import { ROOM_ITEMS, type RoomItemId } from './world';
import type { RoomItem, RoomSave } from '../progress/save';

/**
 * The pet's treehouse room. Spots are fractions of the room (0 to 1 across, 0 to 1 down) where an item's feet
 * touch the floor, so a layout survives any screen shape. Everything here is free and permanent: the starter
 * room has every furnishing already, moving one is always allowed, and "tidy" puts them all back.
 */
export const FLOOR = { left: 0.1, right: 0.9, top: 0.66, bottom: 0.93 };

const STARTER: Record<RoomItemId, { x: number; y: number }> = {
  rug: { x: 0.5, y: 0.8 },
  bed: { x: 0.2, y: 0.78 },
  shelf: { x: 0.85, y: 0.76 },
  lamp: { x: 0.34, y: 0.72 },
  plant: { x: 0.68, y: 0.74 },
  musicbox: { x: 0.52, y: 0.9 },
};

export const starterItem = (id: RoomItemId): RoomItem => ({ id, ...STARTER[id], flip: false });

export const starterRoom = (): RoomSave => ({ items: ROOM_ITEMS.map(starterItem), frame: null });

/** The nearest spot on the floor. */
export function clampSpot(x: number, y: number): { x: number; y: number } {
  const c = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, Number.isFinite(v) ? v : lo));
  return { x: c(x, FLOOR.left, FLOOR.right), y: c(y, FLOOR.top, FLOOR.bottom) };
}

/** A copy of the room with one item moved (to the nearest spot on the floor). */
export function moveItem(room: RoomSave, id: RoomItemId, x: number, y: number): RoomSave {
  return { ...room, items: room.items.map((it) => (it.id === id ? { ...it, ...clampSpot(x, y) } : it)) };
}

/** A copy of the room with one item turned to face the other way. */
export function flipItem(room: RoomSave, id: RoomItemId): RoomSave {
  return { ...room, items: room.items.map((it) => (it.id === id ? { ...it, flip: !it.flip } : it)) };
}

/** Every furnishing back in its starting spot. The picture on the wall stays. */
export const tidy = (room: RoomSave): RoomSave => ({ ...room, items: ROOM_ITEMS.map(starterItem) });
