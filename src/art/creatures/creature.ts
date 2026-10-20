import { Container, Graphics } from 'pixi.js';
import { cheek, ink } from '../palette';
import type { CastId } from './cast';

/**
 * RW02 prototype (docs/rework/CREATURE-ART.md): the shared shape of a creature-world species.
 * Every part is drawn once; idle and touch motion only move, turn and scale containers, so a
 * creature costs no per-frame redraws. RW05 absorbs or removes this with the dev preview.
 */
export type SpeciesId = 'sprout' | 'river' | 'glider';
export type SlotName = 'head' | 'neck';
export type AccessoryKind = 'scarf' | 'crown';

/** Which slot each accessory goes in. */
export const ACCESSORY_SLOT: Record<AccessoryKind, SlotName> = { scarf: 'neck', crown: 'head' };

/** Where an accessory sits: a container inside a moving body part, and how wide it should be drawn there. */
export interface SlotSpot {
  node: Container;
  width: number;
}

/** Something worn: drawn once, it may sway by itself; `excite` is 0 at rest and 1 at the peak of a touch reaction. */
export interface Accessory extends Container {
  readonly kind: AccessoryKind;
  sway(dt: number, excite: number): void;
}

export const stroke = (color: number, width = 6) => ({ width, color, join: 'round' as const, cap: 'round' as const });

/** A glossy dot eye that blinks by squashing; `r` is its half-height. */
export function eye(r: number, tall = 1.2): Container {
  const c = new Container();
  const g = new Graphics();
  g.ellipse(0, 0, r / tall, r).fill(ink);
  g.circle(-r * 0.28, -r * 0.38, r * 0.34).fill(0xffffff);
  c.addChild(g);
  return c;
}

export function blush(g: Graphics, x: number, y: number, r: number) {
  return g.ellipse(x, y, r, r * 0.6).fill({ color: cheek, alpha: 0.55 });
}

/** Springs, clocks, blinking and the wearing of accessories; each species draws and animates its own parts. */
export abstract class Creature extends Container {
  /** A pilot species, or one of the second wave (RW02b step 3), which only the dev preview shows. */
  abstract readonly species: SpeciesId | CastId;
  /** Body centre and radius in local units, for a body-centred hit area. */
  abstract readonly touch: { x: number; y: number; r: number };
  /** Slots this species has. A missing slot is a deliberate incompatibility (see `misfit`). */
  readonly slots: Partial<Record<SlotName, SlotSpot>> = {};
  /** Why an accessory does not go on this species, if it does not. */
  readonly misfit: Partial<Record<AccessoryKind, string>> = {};
  /** False freezes it (a still thumbnail). */
  alive = true;

  protected clock = Math.random() * 10;
  /** Seconds since the last touch; reactions read it. Large means idle. */
  protected sincePoke = 99;
  protected readonly eyes: Container[] = [];
  /** How open the eyes are this frame: 1 open, down to 0.1 mid-blink. An illustrated rig swaps its blink texture on it. */
  protected lid = 1;
  private blinkIn = 1 + Math.random() * 3;
  private blinkT = -1;
  private readonly worn = new Map<AccessoryKind, Accessory>();

  /** Puts an accessory on (or takes it off). Returns false when the species has no slot for it. */
  wear(acc: Accessory | null, kind: AccessoryKind): boolean {
    const old = this.worn.get(kind);
    if (old) {
      old.destroy({ children: true });
      this.worn.delete(kind);
    }
    if (!acc) return true;
    const spot = this.slots[ACCESSORY_SLOT[kind]];
    if (!spot) {
      acc.destroy({ children: true });
      return false;
    }
    spot.node.addChild(acc);
    this.worn.set(kind, acc);
    return true;
  }

  wearing(kind: AccessoryKind): boolean {
    return this.worn.has(kind);
  }

  /** The touch reaction. A touch during a reaction restarts it. */
  poke() {
    this.sincePoke = 0;
  }

  /** 0 at rest, rising to 1 during a touch reaction and back over `length` seconds. */
  protected excite(length: number): number {
    if (this.sincePoke >= length) return 0;
    return Math.sin((this.sincePoke / length) * Math.PI);
  }

  update(dt: number) {
    if (!this.alive) return;
    this.clock += dt;
    this.sincePoke += dt;
    this.blinkIn -= dt;
    if (this.blinkIn <= 0) {
      this.blinkT = 0;
      this.blinkIn = 2 + Math.random() * 3;
    }
    let lid = 1;
    if (this.blinkT >= 0) {
      this.blinkT += dt;
      lid = Math.max(0.1, Math.abs(1 - this.blinkT / 0.08));
      if (this.blinkT > 0.16) {
        this.blinkT = -1;
        lid = 1;
      }
    }
    this.lid = lid;
    for (const e of this.eyes) e.scale.y = lid;
    this.animate(dt);
    const ex = this.excite(this.reactionLength);
    for (const a of this.worn.values()) a.sway(dt, ex);
  }

  /** How long the touch reaction lasts, in seconds. */
  protected abstract readonly reactionLength: number;
  protected abstract animate(dt: number): void;
}
