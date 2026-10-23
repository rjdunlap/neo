import type { Graphics } from 'pixi.js';
import type { FlowerKind } from './logic';

/**
 * A flower head of the given kind, centered on (0, 0) and about `r` across a petal radius. The petals carry the color that
 * was asked for (a sunflower's brown middle is not its color); the kind is only how it looks.
 */
export function drawKind(g: Graphics, kind: FlowerKind, r: number, petal: number, line: number): Graphics {
  const lw = Math.max(1.5, r * 0.1);
  if (kind === 'daisy') {
    for (let i = 0; i < 10; i++) {
      const a = (i * 2 * Math.PI) / 10;
      g.circle(Math.cos(a) * r * 0.7, Math.sin(a) * r * 0.7, r * 0.25);
    }
    g.fill(petal).stroke({ width: lw, color: line, join: 'round' });
    return g.circle(0, 0, r * 0.4).fill(0xffd54a).stroke({ width: lw, color: 0xd9a520 });
  }
  if (kind === 'sunflower') {
    for (let i = 0; i < 12; i++) {
      const a = (i * 2 * Math.PI) / 12;
      g.circle(Math.cos(a) * r * 0.74, Math.sin(a) * r * 0.74, r * 0.26);
    }
    g.fill(petal).stroke({ width: lw, color: line, join: 'round' });
    return g.circle(0, 0, r * 0.52).fill(0x7a4a21).stroke({ width: lw, color: 0x4d2e14 });
  }
  if (kind === 'tulip') {
    const p = (x: number, y: number): [number, number] => [x * r, y * r];
    g.moveTo(...p(-0.62, -0.7)).lineTo(...p(-0.3, -0.3)).lineTo(...p(0, -0.9)).lineTo(...p(0.3, -0.3)).lineTo(...p(0.62, -0.7));
    g.quadraticCurveTo(...p(0.95, 0.35), ...p(0, 0.8)).quadraticCurveTo(...p(-0.95, 0.35), ...p(-0.62, -0.7));
    return g.fill(petal).stroke({ width: lw, color: line, join: 'round' });
  }
  if (kind === 'bell') {
    const p = (x: number, y: number): [number, number] => [x * r, y * r];
    g.moveTo(...p(-0.8, 0.6)).quadraticCurveTo(...p(-0.9, -0.9), ...p(0, -0.9)).quadraticCurveTo(...p(0.9, -0.9), ...p(0.8, 0.6));
    g.quadraticCurveTo(...p(0.55, 0.9), ...p(0.4, 0.6)).quadraticCurveTo(...p(0.2, 0.9), ...p(0, 0.6));
    g.quadraticCurveTo(...p(-0.2, 0.9), ...p(-0.4, 0.6)).quadraticCurveTo(...p(-0.55, 0.9), ...p(-0.8, 0.6));
    return g.fill(petal).stroke({ width: lw, color: line, join: 'round' });
  }
  // The classic five-petal blossom.
  for (let i = 0; i < 5; i++) {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / 5;
    g.circle(Math.cos(a) * r * 0.62, Math.sin(a) * r * 0.62, r * 0.48);
  }
  g.fill(petal).stroke({ width: r * 0.12, color: line, join: 'round' });
  return g.circle(0, 0, r * 0.36).fill(0xffd54a).stroke({ width: r * 0.1, color: 0xd9a520 });
}
