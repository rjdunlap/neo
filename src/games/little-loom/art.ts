import { Container, Graphics } from 'pixi.js';
import { ink, wood } from '../../art/palette';
import { CLOTH_COLORS, type ClothCreation } from '../../content/creations';
/** Marks have an ink outline and a white center, retaining a >=3:1 edge on every selected yarn. */
export function yarnMark(g: Graphics, id: number, x: number, y: number, size: number) {
  const edge = (color: number, width: number) => ({ color, width });
  if (id === 0)
    g.circle(x, y, size * 0.35)
      .fill(ink)
      .circle(x, y, size * 0.16)
      .fill(0xffffff);
  else if (id === 1)
    g.moveTo(x - size * 0.4, y)
      .lineTo(x + size * 0.4, y)
      .stroke(edge(ink, size * 0.42))
      .moveTo(x - size * 0.4, y)
      .lineTo(x + size * 0.4, y)
      .stroke(edge(0xffffff, size * 0.16));
  else if (id === 2)
    g.circle(x, y, size * 0.35)
      .stroke(edge(ink, size * 0.32))
      .circle(x, y, size * 0.35)
      .stroke(edge(0xffffff, size * 0.12));
  else
    g.moveTo(x - size * 0.3, y)
      .lineTo(x + size * 0.3, y)
      .moveTo(x, y - size * 0.3)
      .lineTo(x, y + size * 0.3)
      .stroke(edge(ink, size * 0.2));
}
export function clothArt(cells: readonly number[], cell: number, lifts?: readonly (readonly boolean[])[]) {
  const g = new Graphics();
  g.eventMode = 'none';
  cells.forEach((id, i) => {
    const x = (i % 6) * cell,
      y = Math.floor(i / 6) * cell,
      up = lifts?.[Math.floor(i / 6)]?.[i % 6];
    // Long visible strands show which direction sits on top. Saved visual cells retain yarn identity marks.
    g.roundRect(x + 1, y + 1, cell - 2, cell - 2, 3)
      .fill(CLOTH_COLORS[id])
      .stroke({ color: ink, width: 1 });
    if (lifts)
      g.moveTo(x + (up ? cell * 0.22 : 2), y + (up ? 2 : cell * 0.22))
        .lineTo(x + (up ? cell * 0.22 : cell - 2), y + (up ? cell - 2 : cell * 0.22))
        .stroke({ color: ink, width: 1.5, alpha: 0.6 });
    yarnMark(g, id, x + cell / 2, y + cell / 2, cell * 0.65);
  });
  return g;
}
export function emblem() {
  const c = new Container();
  const cells = Array.from({ length: 48 }, (_, i) => ((Math.floor(i / 6) + (i % 6)) % 2 ? 0 : 3));
  const g = clothArt(cells, 15);
  g.position.set(-45, -125);
  c.addChild(g, new Graphics().moveTo(-45, -2).lineTo(45, -2).stroke({ color: wood.line, width: 5 }));
  return c;
}
export const clothPreview = (p: ClothCreation, cell: number) => clothArt(p.cells, cell);
