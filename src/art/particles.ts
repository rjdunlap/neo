import { Container, Sprite } from 'pixi.js';
import { textures, type TextureKit } from './textures';

export type ParticleKind = Exclude<keyof TextureKit, 'brush'>;

export interface BurstOptions {
  colors: number[];
  count?: number;
  kind?: ParticleKind;
  /** Pixels per second. */
  speed?: [number, number];
  /** Sprite scale. */
  size?: [number, number];
  /** Seconds. */
  life?: [number, number];
  gravity?: number;
  /** Direction of travel in radians (default: up), and how widely to fan out around it (default: all around). */
  angle?: number;
  spread?: number;
  /** Spin in radians per second. */
  spin?: number;
}

interface Particle {
  s: Sprite;
  vx: number;
  vy: number;
  gravity: number;
  life: number;
  max: number;
  spin: number;
  size: number;
}

const MAX_LIVE = 450;
const rand = (r: [number, number]) => r[0] + Math.random() * (r[1] - r[0]);

/** Confetti, sparkles, droplets and notes. One per scene, on top of everything else. */
export class Particles extends Container {
  private live: Particle[] = [];
  private pool: Sprite[] = [];

  constructor() {
    super();
    this.eventMode = 'none';
  }

  burst(x: number, y: number, o: BurstOptions) {
    const kit = textures();
    const count = Math.min(o.count ?? 16, MAX_LIVE - this.live.length);
    const angle = o.angle ?? -Math.PI / 2;
    const spread = o.spread ?? Math.PI * 2;
    for (let i = 0; i < count; i++) {
      const s = this.pool.pop() ?? new Sprite();
      s.texture = kit[o.kind ?? 'dot'];
      s.anchor.set(0.5);
      s.tint = o.colors[i % o.colors.length];
      s.position.set(x, y);
      s.alpha = 1;
      s.rotation = Math.random() * Math.PI * 2;
      const size = rand(o.size ?? [0.4, 0.9]);
      s.scale.set(size);
      this.addChild(s);
      const a = angle + (Math.random() - 0.5) * spread;
      const v = rand(o.speed ?? [150, 420]);
      const life = rand(o.life ?? [0.6, 1.1]);
      this.live.push({
        s,
        vx: Math.cos(a) * v,
        vy: Math.sin(a) * v,
        gravity: o.gravity ?? 600,
        life,
        max: life,
        spin: (Math.random() - 0.5) * (o.spin ?? 8),
        size,
      });
    }
  }

  update(dt: number) {
    let n = 0;
    for (const p of this.live) {
      p.life -= dt;
      if (p.life <= 0) {
        this.removeChild(p.s);
        this.pool.push(p.s);
        continue;
      }
      p.vy += p.gravity * dt;
      p.vx *= 1 - 1.2 * dt;
      p.s.x += p.vx * dt;
      p.s.y += p.vy * dt;
      p.s.rotation += p.spin * dt;
      const t = p.life / p.max;
      p.s.alpha = Math.min(1, t * 3);
      p.s.scale.set(p.size * (0.5 + 0.5 * Math.min(1, t * 2)));
      this.live[n++] = p;
    }
    this.live.length = n;
  }
}
