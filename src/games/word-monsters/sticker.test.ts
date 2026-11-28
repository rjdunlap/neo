import { Graphics, Text, type Container } from 'pixi.js';
import { expect, it } from 'vitest';
import { wordMonsters } from './index';

function stickerDrawing(node: Container): unknown {
  return {
    at: [node.x, node.y],
    visible: node.visible,
    text: node instanceof Text ? [node.text, node.style.fontSize, node.style.fill] : undefined,
    paths:
      node instanceof Graphics
        ? node.context.instructions.map(({ action, data }) => {
            if (action === 'texture') throw new Error('Word Monsters stickers use drawn art');
            const { texture: _texture, ...style } = data.style;
            return { action, path: data.path.instructions, style };
          })
        : undefined,
    children: node.children.map(stickerDrawing),
  };
}

it('recreates the original letter and fur artwork for saved sticker seeds 0–99', () => {
  let hash = 2166136261;
  for (let seed = 0; seed < 100; seed++) {
    const sticker = wordMonsters.sticker(seed);
    const drawing = JSON.stringify(stickerDrawing(sticker), (_key, value) =>
      typeof value === 'number' ? Math.round(value * 1e6) / 1e6 : value,
    );
    for (const char of drawing) hash = Math.imul(hash ^ char.charCodeAt(0), 16777619) >>> 0;
    sticker.destroy({ children: true });
  }
  expect(hash).toMatchInlineSnapshot(`2794619996`);
});
