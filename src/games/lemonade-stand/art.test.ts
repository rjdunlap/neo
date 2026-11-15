import type { Container, Graphics } from 'pixi.js';
import { describe, expect, it } from 'vitest';
import { swatch } from '../../art/palette';
import { Rng } from '../../engine/random';
import { AWNINGS, CUP_TRIMS, standLook } from './art';
import { lemonadeStand } from './index';

/** A fingerprint of a drawing: every node's place, scale and drawing instructions. */
function fingerprint(art: Container): number {
  const serialize = (node: Container): unknown => {
    const g = node as Graphics;
    return {
      x: node.x,
      y: node.y,
      r: node.rotation,
      scale: [node.scale.x, node.scale.y],
      drawing: g.context?.instructions.map((i) => {
        if (i.action === 'texture') throw new Error('Sticker art must remain code-drawn');
        const { texture: _texture, ...style } = i.data.style;
        return { action: i.action, path: i.data.path.instructions, style };
      }),
      children: node.children.map((c) => serialize(c as Container)),
    };
  };
  return [...JSON.stringify(serialize(art))].reduce(
    (h, ch) => Math.imul(h ^ ch.charCodeAt(0), 16777619) >>> 0,
    2166136261,
  );
}

describe('lemonade-stand art', () => {
  it('pins the sticker art, so a seed redraws the sticker it was awarded with', () => {
    expect(
      Array.from({ length: 40 }, (_, seed) => {
        const art = lemonadeStand.sticker(seed);
        const f = fingerprint(art);
        art.destroy({ children: true });
        return f;
      }),
    ).toMatchSnapshot('sticker art');
  });

  it('gives rounds fresh stand colours: the cups never yellow, never the awning colour', () => {
    const looks = Array.from({ length: 200 }, (_, seed) => standLook(new Rng(seed)));
    for (const { awning, cup } of looks) {
      expect(AWNINGS).toContain(awning);
      expect(CUP_TRIMS).toContain(cup);
      expect(cup).not.toBe(swatch.yellow);
      expect(cup).not.toBe(awning);
    }
    expect(new Set(looks.map((l) => l.awning)).size).toBe(AWNINGS.length);
    expect(new Set(looks.map((l) => l.cup)).size).toBe(CUP_TRIMS.length);
    // The same seed gives the same stand.
    expect(standLook(new Rng(7))).toEqual(standLook(new Rng(7)));
  });
});
