/** The movable wedges of a two-critter wheel (level 5's fair race, level 9's wheel made to order): one draggable piece per wedge. */
import { Polygon, type Container } from 'pixi.js';
import { draggable, type DragHandle } from '../../engine/drag';
import type { Tweener } from '../../engine/tween';
import { hubCap, wedgePiece, type SpinnerArt } from './art';
import type { Kind, Wheel } from './logic';

export interface Piece {
  index: number;
  kind: Kind;
  node: Container;
  drag: DragHandle;
}

export interface PieceHooks {
  /** A wedge was picked up. */
  onPick(): void;
  /** A wedge was let go at (x, y) in the wheel's frame; false sends it back. */
  onDrop(p: Piece, x: number, y: number): boolean;
}

/**
 * Rebuilds a bare spinner's wedges as movable pieces, in the wheel's frame with the hub capping them: `old` pieces are
 * released first. The caller enables the drags when wedges may move.
 */
export function wedgePieces(
  art: SpinnerArt,
  wheel: Wheel,
  r: number,
  tw: Tweener,
  old: readonly Piece[],
  hooks: PieceHooks,
): Piece[] {
  for (const p of old) {
    p.drag.destroy();
    if (p.node.destroyed) continue;
    tw.kill(p.node);
    p.node.destroy({ children: true });
  }
  // Keep the white disc (child 0); Pixi's removeChildren(1) throws when there is nothing after it.
  while (art.wheel.children.length > 1) art.wheel.removeChildAt(1).destroy({ children: true });
  const pieces = wheel.map((kind, index) => {
    const w = wedgePiece(kind, index, r, wheel.length);
    w.node.hitArea = new Polygon(w.points);
    art.wheel.addChild(w.node);
    const p: Piece = { index, kind, node: w.node, drag: null! };
    p.drag = draggable(w.node, tw, {
      lift: 0,
      keepGrab: true,
      onPick: hooks.onPick,
      onDrop: (x, y) => hooks.onDrop(p, x, y),
    });
    return p;
  });
  art.wheel.addChild(hubCap(r));
  return pieces;
}
