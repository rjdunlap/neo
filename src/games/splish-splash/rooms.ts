import type { Graphics } from 'pixi.js';
import { cheek, ink, swatch, wood } from '../../art/palette';
import type { Room } from './logic';

/** Each room's wall, top and bottom of its gradient (slice 4). The bathroom's is the bath before slice 4. */
export const WALLS: Record<Room, [number, number]> = {
  bathroom: [0xd6eefa, 0xbfe0f4],
  garden: [0xbfe6ff, 0xe8f7dc],
  beach: [0x9fdcff, 0xdff3ff],
  art: [0xfff4e3, 0xf5e3c8],
  kitchen: [0xfff6d0, 0xffe9a8],
};

/** The tub's body and outline in each room: a blue paddling pool in the garden, a white tub elsewhere. */
export const TUBS: Record<Room, { fill: number; line: number; feet: boolean }> = {
  bathroom: { fill: 0xffffff, line: 0xb9c6d1, feet: true },
  garden: { fill: swatch.blue.light, line: swatch.blue.line, feet: false },
  beach: { fill: 0xffffff, line: 0xb9c6d1, feet: true },
  art: { fill: 0xffffff, line: 0xb9c6d1, feet: true },
  kitchen: { fill: 0xffffff, line: 0xb9c6d1, feet: true },
};

/**
 * The room behind the tub, drawn into `r` (already cleared) for a `w` × `h` view whose tub's top edge is at `tubTop`.
 * Only looks: nothing here is touched. Every room keeps the shower head up on the right, where the rinse comes from.
 */
export function drawRoom(r: Graphics, room: Room, w: number, h: number, tubTop: number) {
  const cx = w / 2;
  // High on a tall portrait wall, where the pet's head does not reach; under the top bar on a short one.
  const sunY = Math.max(110, tubTop - 520);
  // The props on the wall stand clear of the rim toy (about 100 units tall over the rim's left end).
  const shelf = tubTop - 120;
  if (room === 'bathroom') {
    for (let x = 0; x < w; x += 64) r.moveTo(x, 0).lineTo(x, tubTop).stroke({ width: 2, color: 0xeaf6fd });
    for (let y = 0; y < tubTop; y += 64) r.moveTo(0, y).lineTo(w, y).stroke({ width: 2, color: 0xeaf6fd });
    r.rect(0, tubTop + 40, w, h).fill(0xf3e3c8);
  } else if (room === 'garden') {
    // A sun, a picket fence and the lawn; the hose runs in from the right to the shower head.
    r.circle(cx - 230, sunY, 44).fill(swatch.yellow.fill);
    for (let x = 12; x < w; x += 46)
      r.poly([x, tubTop + 10, x, tubTop - 70, x + 15, tubTop - 88, x + 30, tubTop - 70, x + 30, tubTop + 10]);
    r.fill(0xffffff).stroke({ width: 3, color: 0xc9d6c0 });
    r.rect(0, tubTop - 40, w, 12)
      .fill(0xffffff)
      .stroke({ width: 3, color: 0xc9d6c0 });
    r.rect(0, tubTop - 10, w, h).fill(swatch.green.fill);
    for (let x = 18; x < w; x += 38)
      r.moveTo(x, tubTop + 30)
        .lineTo(x + 6, tubTop + 14)
        .moveTo(x + 10, tubTop + 30)
        .lineTo(x + 14, tubTop + 18);
    r.stroke({ width: 3, color: swatch.green.line });
    r.moveTo(w, tubTop - 20)
      .bezierCurveTo(cx + 260, tubTop - 40, cx + 280, 60, cx + 157, 40)
      .stroke({ width: 10, color: swatch.green.line });
  } else if (room === 'beach') {
    // Sky, the sea's edge and the sand, with a bucket and a shell on it.
    r.circle(cx - 230, sunY, 42).fill(swatch.yellow.fill);
    r.rect(0, tubTop - 90, w, 60).fill(swatch.blue.fill);
    r.moveTo(0, tubTop - 90);
    for (let x = 0; x <= w; x += 40) r.quadraticCurveTo(x + 20, tubTop - 100, x + 40, tubTop - 90);
    r.stroke({ width: 5, color: 0xffffff });
    r.rect(0, tubTop - 30, w, h).fill(0xf3dca2);
    // Beside the tub, not under it.
    const by = tubTop + 110;
    r.poly([cx - 400, by - 60, cx - 320, by - 60, cx - 332, by, cx - 388, by])
      .fill(swatch.red.fill)
      .stroke({ width: 4, color: swatch.red.line });
    r.moveTo(cx - 396, by - 60)
      .quadraticCurveTo(cx - 360, by - 110, cx - 324, by - 60)
      .stroke({ width: 4, color: ink });
    r.moveTo(cx + 320, by)
      .lineTo(cx + 360, by - 50)
      .lineTo(cx + 400, by)
      .closePath()
      .fill(swatch.pink.light)
      .stroke({ width: 4, color: swatch.pink.line });
    for (const dx of [-20, 0, 20]) r.moveTo(cx + 360, by - 46).lineTo(cx + 360 + dx, by - 2);
    r.stroke({ width: 3, color: swatch.pink.line });
  } else if (room === 'art') {
    // A wooden floor and an easel with a splashy painting.
    r.rect(0, tubTop + 40, w, h).fill(wood.light);
    for (let y = tubTop + 70; y < h; y += 36) r.moveTo(0, y).lineTo(w, y);
    r.stroke({ width: 2, color: wood.fill });
    const ex = cx - 220;
    const ey = shelf - 220;
    r.moveTo(ex - 50, ey + 220)
      .lineTo(ex, ey - 20)
      .lineTo(ex + 50, ey + 220)
      .stroke({ width: 8, color: wood.line });
    r.roundRect(ex - 70, ey, 140, 110, 8)
      .fill(0xffffff)
      .stroke({ width: 5, color: wood.line });
    r.circle(ex - 30, ey + 40, 20).fill(swatch.red.fill);
    r.circle(ex + 22, ey + 60, 24).fill(swatch.blue.fill);
    r.circle(ex + 10, ey + 28, 14).fill(swatch.yellow.fill);
    r.circle(ex - 20, ey + 80, 12).fill(swatch.green.fill);
  } else {
    // Checked tiles behind the counter, and a cake on a stand.
    for (let x = 0, i = 0; x < w; x += 48, i++)
      for (let y = tubTop - 160, j = 0; y < tubTop + 40; y += 48, j++)
        if ((i + j) % 2 === 0) r.rect(x, y, 48, 48);
    r.fill({ color: 0xffffff, alpha: 0.7 });
    r.rect(0, tubTop + 40, w, h).fill(0xe8d6c0);
    const kx = cx - 220;
    const ky = shelf - 114;
    r.roundRect(kx - 90, shelf, 180, 14, 6)
      .fill(wood.fill)
      .stroke({ width: 3, color: wood.line });
    r.roundRect(kx - 70, ky + 72, 140, 12, 6)
      .fill(0xffffff)
      .stroke({ width: 4, color: 0xb9c6d1 });
    r.rect(kx - 8, ky + 84, 16, 30)
      .fill(0xffffff)
      .stroke({ width: 4, color: 0xb9c6d1 });
    r.roundRect(kx - 56, ky + 10, 112, 62, 10)
      .fill(0x7a4a2a)
      .stroke({ width: 4, color: 0x5a3a22 });
    r.roundRect(kx - 56, ky + 4, 112, 22, 10).fill(swatch.pink.light);
    for (let i = 0; i < 4; i++) r.circle(kx - 40 + i * 27, ky + 26, 7);
    r.fill(swatch.pink.light);
    r.circle(kx, ky - 6, 10).fill(cheek);
  }
  // Shower head, up top.
  r.roundRect(cx + 150, 40, 14, 120, 6)
    .fill(0xb9c6d1)
    .roundRect(cx + 110, 150, 90, 26, 12)
    .fill(0xb9c6d1);
}
