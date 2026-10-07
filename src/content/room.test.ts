import { describe, expect, it } from 'vitest';
import { clampSpot, FLOOR, flipItem, moveItem, starterItem, starterRoom, tidy } from './room';
import { ROOM_ITEMS } from './world';

describe('treehouse room rules', () => {
  it('starts with every furnishing, each on the floor and none on top of another', () => {
    const room = starterRoom();
    expect(room.items.map((i) => i.id)).toEqual([...ROOM_ITEMS]);
    for (const it of room.items) {
      expect(it.x).toBeGreaterThanOrEqual(FLOOR.left);
      expect(it.x).toBeLessThanOrEqual(FLOOR.right);
      expect(it.y).toBeGreaterThanOrEqual(FLOOR.top);
      expect(it.y).toBeLessThanOrEqual(FLOOR.bottom);
      expect(it.flip).toBe(false);
    }
    // Starting spots at least a tenth of the room apart, so every item can be picked up by itself.
    room.items.forEach((a, i) => room.items.slice(i + 1).forEach((b) => expect(Math.hypot(a.x - b.x, (a.y - b.y) * 1.5), `${a.id} ${b.id}`).toBeGreaterThan(0.1)));
    expect(room.frame).toBeNull();
  });

  it('moves an item to the nearest spot on the floor and leaves the rest alone', () => {
    const room = starterRoom();
    const moved = moveItem(room, 'bed', 2, -1);
    expect(moved.items.find((i) => i.id === 'bed')).toMatchObject({ x: FLOOR.right, y: FLOOR.top });
    expect(moved.items.filter((i) => i.id !== 'bed')).toEqual(room.items.filter((i) => i.id !== 'bed'));
    expect(room.items.find((i) => i.id === 'bed')).toEqual(starterItem('bed'));
    expect(clampSpot(NaN, NaN)).toEqual({ x: FLOOR.left, y: FLOOR.top });
    expect(clampSpot(0.4, 0.8)).toEqual({ x: 0.4, y: 0.8 });
  });

  it('turns an item round and back again', () => {
    const once = flipItem(starterRoom(), 'shelf');
    expect(once.items.find((i) => i.id === 'shelf')?.flip).toBe(true);
    expect(flipItem(once, 'shelf')).toEqual(starterRoom());
  });

  it('tidying puts everything back, flips included, and keeps the picture on the wall', () => {
    let room = moveItem(flipItem(starterRoom(), 'lamp'), 'plant', 0.2, 0.7);
    room = { ...room, frame: { game: 'pet-kitchen', seed: 3 } };
    const tidied = tidy(room);
    expect(tidied.items).toEqual(starterRoom().items);
    expect(tidied.frame).toEqual({ game: 'pet-kitchen', seed: 3 });
  });
});
