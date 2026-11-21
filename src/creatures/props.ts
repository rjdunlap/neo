import { Container, Graphics } from 'pixi.js';
import { sfx } from '../audio/sfx';
import { swatch, wood } from '../art/palette';

/**
 * P5 (docs/reviews/POK-POK.md#p5-residents-that-carry-on-a-note-for-rw13-and-rw14-m): the one thing each resident
 * uses when its walk reaches the first stop. Drawn in host units with the resident's feet at (0, 0), behind it; a
 * `still` part that never moves and a `moving` part that the use animates. Every prop stays inside its species'
 * footprint (`Resident.footprint`) through its whole motion, so a prop on clear ground never covers a game, the
 * signpost or a button (`props.test.ts`). Nothing here is saved, owed or used up: it plays the same every visit.
 */

export type PropId = 'chime' | 'pool' | 'stones' | 'bush' | 'gear' | 'flower';

export interface PropSpec {
  /** Draws the parts once; `moving` turns, grows or sways about its own `position`, which `draw` sets. */
  draw(still: Graphics, moving: Graphics): void;
  /** Moves `moving` for a use: `k` falls from 1 at arrival to 0 when the use is over; at 0 it is at rest. */
  animate(moving: Graphics, k: number): void;
  /** How many soft sounds a use makes, a fifth of a second apart. */
  notes: number;
  /** The `i`th sound, on the land's pentatonic range from `low`; each softer than a game's own. */
  play(i: number, low: number): void;
}

/** How long a use moves, in seconds (inside the walker's `USE_TIME`). */
export const PROP_TIME = 1.6;

/** Rock grey from the palette, for the pool's rim and the stones' shadows. */
const rock = { fill: swatch.white.light, line: swatch.white.line };

/** A gentle back-and-forth that dies away: the chime's sway, a stone stack's wobble, a bush's rustle. */
const sway = (amp: number, freq: number) => (m: Graphics, k: number) => {
  m.rotation = Math.sin((1 - k) * PROP_TIME * freq) * amp * Math.min(1, k * 1.6);
};

export const PROPS: Record<PropId, PropSpec> = {
  // Trill, Music Mountain: a wind chime it flutters up to; three bells climb the land's range.
  chime: {
    draw(_still, g) {
      const top = -232;
      g.position.set(0, top);
      g.roundRect(-70, -8, 140, 16, 8).fill(wood.fill).stroke({ width: 3, color: wood.line });
      const tubes = [
        [-50, 70, swatch.teal],
        [-17, 100, swatch.blue],
        [17, 82, swatch.purple],
        [50, 62, swatch.pink],
      ] as const;
      for (const [x, len, c] of tubes) {
        g.moveTo(x, 8).lineTo(x, 34).stroke({ width: 3, color: wood.line });
        g.roundRect(x - 9, 34, 18, len, 6)
          .fill(c.fill)
          .stroke({ width: 3, color: c.line });
      }
    },
    animate: sway(0.07, 14),
    notes: 3,
    play: (i, low) => sfx.bell(low + i * 2, 0.16),
  },
  // Tote, Bubble Beach: the rock pool it lives by; it steps in, rings spread, three drops fall down the range.
  pool: {
    draw(still, g) {
      still.ellipse(0, 6, 140, 26).fill(swatch.teal.light).stroke({ width: 3, color: swatch.teal.line });
      for (const [x, y, w] of [
        [-128, 4, 22],
        [-96, 20, 18],
        [104, 18, 20],
        [130, 2, 16],
      ] as const)
        still
          .ellipse(x, y, w, w * 0.6)
          .fill(rock.fill)
          .stroke({ width: 3, color: rock.line });
      g.position.set(0, 6);
      g.ellipse(0, 0, 54, 11).stroke({ width: 3, color: swatch.teal.line });
      g.ellipse(0, 0, 30, 6).stroke({ width: 3, color: swatch.teal.line });
      g.alpha = 0;
    },
    animate(g, k) {
      g.scale.set(1 + (1 - k) * 0.9);
      g.alpha = Math.min(1, k * 1.5);
    },
    notes: 3,
    play: (i, low) => sfx.pluck(low + 6 - i * 2, 0.14),
  },
  // Dapple, Painted Canyon: the painted rocks it climbs; it steps up onto a flat painted stone, which rocks under it,
  // and three hollow knocks climb. Under its feet, where its body never hides it.
  stones: {
    draw(still, g) {
      still.ellipse(-96, 14, 34, 14).fill(swatch.blue.light).stroke({ width: 3, color: swatch.blue.line });
      still.circle(-96, 12, 6).fill(swatch.blue.fill);
      g.position.set(0, 0);
      g.ellipse(0, 0, 108, 24).fill(swatch.orange.light).stroke({ width: 3, color: swatch.orange.line });
      for (const [x, c] of [
        [-60, swatch.red],
        [-20, swatch.yellow],
        [20, swatch.purple],
        [60, swatch.teal],
      ] as const)
        g.circle(x, 2, 8).fill(c.fill);
    },
    animate: sway(0.05, 11),
    notes: 3,
    play: (i, low) => sfx.marimba(low + i * 3, 0.2),
  },
  // Bramble, Cozy Village: a berry branch from the hedge arching over the lane; it reaches up, the branch shakes, a
  // brush of leaves and two soft plucks. Overhead, where its body never hides it.
  bush: {
    draw(_still, g) {
      const top = -206;
      g.position.set(0, top);
      g.moveTo(-120, -6).quadraticCurveTo(0, -24, 120, -6).stroke({ width: 7, color: wood.line });
      for (const [x, y] of [
        [-96, -10],
        [-48, -18],
        [0, -20],
        [48, -18],
        [96, -10],
      ] as const)
        g.ellipse(x, y, 18, 9).fill(swatch.green.fill).stroke({ width: 3, color: swatch.green.line });
      for (const [x, len] of [
        [-72, 26],
        [-24, 40],
        [24, 34],
        [72, 22],
      ] as const) {
        g.moveTo(x, -14)
          .lineTo(x, -14 + len)
          .stroke({ width: 2, color: swatch.green.line });
        g.circle(x, -8 + len, 8)
          .fill(swatch.purple.fill)
          .stroke({ width: 2, color: swatch.purple.line });
      }
    },
    animate: sway(0.06, 22),
    notes: 3,
    play: (i, low) => (i === 0 ? sfx.brush() : sfx.pluck(low + 2 + i * 2, 0.12)),
  },
  // Mossback, Tinker Lab: a big gear on a post that it turns two teeth round, with a ratchet's climb. High enough to
  // show over its shell.
  gear: {
    draw(still, g) {
      still.roundRect(-85, -176, 14, 176, 6).fill(wood.fill).stroke({ width: 3, color: wood.line });
      g.position.set(-78, -176);
      const teeth = 8;
      for (let i = 0; i < teeth; i++) {
        const a = (i / teeth) * Math.PI * 2;
        g.circle(Math.cos(a) * 40, Math.sin(a) * 40, 9)
          .fill(swatch.orange.fill)
          .stroke({ width: 3, color: swatch.orange.line });
      }
      g.circle(0, 0, 38).fill(swatch.orange.fill).stroke({ width: 3, color: swatch.orange.line });
      g.circle(0, 0, 12).fill(wood.fill).stroke({ width: 3, color: wood.line });
    },
    // Two teeth of eight is a quarter turn, which looks the same as where it began, so it ends back at rest without a jump.
    animate(g, k) {
      g.rotation = ((1 - k) * (Math.PI / 2)) % (Math.PI / 2);
    },
    notes: 1,
    play: (_i, low) => sfx.ratchet(low, 1),
  },
  // Lumen, Story Grove: a low moonflower it hovers over, which opens wider while it is there; three high, quiet bells.
  // Under its floating body, where its body never hides it.
  flower: {
    draw(still, g) {
      still.moveTo(0, 0).lineTo(0, -22).stroke({ width: 5, color: swatch.green.line });
      still.ellipse(-26, -6, 22, 8).fill(swatch.green.fill).stroke({ width: 3, color: swatch.green.line });
      still.ellipse(26, -6, 22, 8).fill(swatch.green.fill).stroke({ width: 3, color: swatch.green.line });
      g.position.set(0, -30);
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2;
        g.ellipse(Math.cos(a) * 24, Math.sin(a) * 10, 18, 9)
          .fill(swatch.yellow.light)
          .stroke({ width: 3, color: swatch.yellow.line });
      }
      g.circle(0, 0, 10).fill(swatch.yellow.fill);
    },
    animate(g, k) {
      g.scale.set(1 + Math.sin((1 - k) * Math.PI) * 0.3);
    },
    notes: 3,
    play: (i, low) => sfx.bell(low + 7 + i * 2, 0.1),
  },
};

/** A prop's two parts in one container, drawn and at rest. */
export function makeProp(id: PropId): { node: Container; moving: Graphics } {
  const node = new Container();
  const still = new Graphics();
  const moving = new Graphics();
  node.addChild(still, moving);
  PROPS[id].draw(still, moving);
  PROPS[id].animate(moving, 0);
  return { node, moving };
}
