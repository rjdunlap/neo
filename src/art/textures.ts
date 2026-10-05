import { Graphics, Texture, type Renderer } from 'pixi.js';
import { musicNote, starPoints } from './shapes';

/** Small white shapes drawn once at boot and tinted at use. Sprites of these are much cheaper than live Graphics. */
export interface TextureKit {
  dot: Texture;
  star: Texture;
  confetti: Texture;
  ring: Texture;
  note: Texture;
  /** A round brush with a soft edge. */
  brush: Texture;
}

let kit: TextureKit | null = null;

export function initTextures(renderer: Renderer) {
  const make = (g: Graphics) => {
    const t = renderer.generateTexture({ target: g, resolution: 2, antialias: true });
    g.destroy();
    return t;
  };
  kit = {
    dot: make(new Graphics().circle(0, 0, 16).fill(0xffffff)),
    star: make(new Graphics().poly(starPoints(18, 8)).fill(0xffffff)),
    confetti: make(new Graphics().roundRect(-8, -4, 16, 8, 3).fill(0xffffff)),
    ring: make(new Graphics().circle(0, 0, 14).stroke({ width: 4, color: 0xffffff })),
    note: make(musicNote(new Graphics(), 40, 0xffffff)),
    brush: softCircle(64),
  };
}

export function textures(): TextureKit {
  if (!kit) throw new Error('initTextures() has not run yet');
  return kit;
}

function softCircle(r: number): Texture {
  const c = document.createElement('canvas');
  c.width = c.height = r * 2;
  const ctx = c.getContext('2d')!;
  const g = ctx.createRadialGradient(r, r, 0, r, r, r);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.72, 'rgba(255,255,255,1)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, r * 2, r * 2);
  return Texture.from(c);
}
