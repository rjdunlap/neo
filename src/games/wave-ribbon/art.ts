/** Wave Ribbon's code-drawn pieces: pulse pictures, lane toggles, trace & hypothesis cards, sticker and hub icon. */
import { Container, Graphics } from 'pixi.js';
import { cream, ink, swatch } from '../../art/palette';
import { stickerize } from '../../art/sticker';
import { finish } from '../../ui/buttons';
import {
  AMPLITUDES,
  ARRIVAL_STEP,
  PEAK_STEP,
  STEP_COUNT,
  markerTrace,
  type CardId,
  type ClaimId,
  type Preset,
  type PulseSize,
  type RibbonColor,
} from './logic';

/** A little hump of the pulse, as tall as the preset's height, drawn white for a coloured button. Centred on (0, 0). */
export function pulseIcon(preset: Preset): Graphics {
  const g = new Graphics();
  const h = (AMPLITUDES[preset] / AMPLITUDES.tall) * 40;
  g.moveTo(-30, 18);
  for (let i = 0; i <= 12; i++) {
    const x = -30 + (60 * i) / 12;
    g.lineTo(x, 18 - h * 0.5 * (1 - Math.cos((2 * Math.PI * i) / 12)));
  }
  g.stroke({ width: 8, color: 0xffffff, cap: 'round', join: 'round' });
  return g;
}

/** A hand for Help, as the other games draw it. */
export function handIcon(): Graphics {
  const g = new Graphics();
  g.roundRect(-14, -26, 12, 34, 6).fill(0xffffff);
  g.roundRect(-18, -2, 36, 30, 10).fill(0xffffff);
  return g;
}

/** Draws a pennant on a post that stands at (x, y) and rises; it lifts its tip once the crest has arrived. */
export function pennant(g: Graphics, x: number, y: number, lifted: boolean, color: number) {
  g.moveTo(x, y)
    .lineTo(x, y - 90)
    .stroke({ width: 7, color: swatch.brown.line, cap: 'round' });
  const top = y - 90;
  const wave = lifted ? -12 : 0;
  g.poly([x, top, x + 54, top + 16 + wave, x, top + 34])
    .fill(color)
    .stroke({ width: 4, color: swatch.red.line, join: 'round' });
  g.circle(x, top, 8).fill(swatch.yellow.fill).stroke({ width: 3, color: swatch.yellow.line });
}

/**
 * A trace card: what the bead does over the run. A bead card plots its height at each frame on the post (small or tall,
 * with the flag's tick at the frame the crest arrives); the sideways card shows a bead sliding along toward the flag, the
 * mistaken picture. Centred on (0, 0), `w` by `h`.
 */
export function cardArt(id: CardId, w: number, h: number, selected: boolean): Container {
  const c = new Container();
  const g = new Graphics();
  g.roundRect(-w / 2, -h / 2, w, h, 22)
    .fill(cream)
    .stroke({ width: selected ? 8 : 4, color: selected ? swatch.blue.line : swatch.brown.light });
  const left = -w / 2 + 28,
    width = w - 56,
    base = h / 2 - 28;
  g.moveTo(left, base)
    .lineTo(left + width, base)
    .stroke({ width: 4, color: swatch.brown.light, cap: 'round' });
  if (id === 'sideways') {
    const y = base - 24;
    for (let i = 0; i < 4; i++)
      g.circle(left + 18 + i * 36, y, 7).fill({ color: swatch.blue.fill, alpha: 0.35 + i * 0.2 });
    g.moveTo(left + 18, y)
      .lineTo(left + width - 14, y)
      .stroke({ width: 5, color: swatch.red.line, cap: 'round' });
    g.poly([left + width, y, left + width - 20, y - 14, left + width - 20, y + 14]).fill(swatch.red.line);
  } else {
    const trace = markerTrace(AMPLITUDES[id]);
    const scale = (h - 70) / AMPLITUDES.tall;
    trace.forEach((dy, k) => {
      const x = left + (width * k) / STEP_COUNT;
      g.circle(x, base - 8 - dy * scale, k === 6 ? 9 : 6).fill(k === 6 ? swatch.blue.fill : swatch.blue.line);
    });
    // The crest reaches the flag at frame 10 whatever the height: the same tick on every bead card.
    const tick = left + (width * 10) / STEP_COUNT;
    g.moveTo(tick, base + 14)
      .lineTo(tick, base - 8)
      .stroke({ width: 5, color: swatch.red.line, cap: 'round' });
  }
  c.addChild(g);
  return c;
}

/** A Lane A / Lane B toggle button: paper pill in its lane's colour, top-or-bottom lane icon, and its pulse size. */
export function laneToggleArt(
  lane: 'A' | 'B',
  size: PulseSize,
  color: RibbonColor,
  w: number,
  h: number,
): Container {
  const c = new Container();
  c.addChild(finish({ w, h, corner: 28 }, swatch[color]));
  const g = new Graphics();
  const yTop = -12,
    yBot = 12;
  const topActive = lane === 'A';
  g.moveTo(-58, yTop)
    .lineTo(-22, yTop)
    .stroke({ width: topActive ? 8 : 4, color: 0xffffff, alpha: topActive ? 1 : 0.4, cap: 'round' });
  g.moveTo(-58, yBot)
    .lineTo(-22, yBot)
    .stroke({ width: topActive ? 4 : 8, color: 0xffffff, alpha: topActive ? 0.4 : 1, cap: 'round' });
  g.circle(-40, topActive ? yTop : yBot, 7).fill(0xffffff);
  c.addChild(g);
  const pulse = pulseIcon(size);
  pulse.x = 22;
  c.addChild(pulse);
  return c;
}

/** Draws a tiny red arrival flag stamped at `(x, y)` on a hypothesis card's mini-ruler. */
function miniFlag(g: Graphics, x: number, y: number) {
  g.moveTo(x, y + 6)
    .lineTo(x, y - 22)
    .stroke({ width: 4, color: swatch.red.line, cap: 'round' });
  g.poly([x, y - 22, x + 16, y - 16, x, y - 9]).fill(swatch.red.fill);
}

/**
 * A level-3 hypothesis card comparing Small (top track) vs Tall (bottom track) against the 0..12 time ruler:
 * `same-time` stamps both flags at step 10 (`ARRIVAL_STEP`); `tall-sooner` stamps Tall early at step 6 (`PEAK_STEP`).
 */
export function claimCardArt(id: ClaimId, w: number, h: number, selected: boolean): Container {
  const c = new Container();
  const g = new Graphics();
  g.roundRect(-w / 2, -h / 2, w, h, 22)
    .fill(cream)
    .stroke({ width: selected ? 8 : 4, color: selected ? swatch.blue.line : swatch.brown.light });
  const left = -w / 2 + 64,
    width = w - 88,
    yTop = -14,
    yBot = 30;
  const smallMark = left + (width * ARRIVAL_STEP) / STEP_COUNT;
  const tallMark = left + (width * (id === 'same-time' ? ARRIVAL_STEP : PEAK_STEP)) / STEP_COUNT;

  if (id === 'same-time') {
    for (let y = yTop - 20; y < yBot + 8; y += 10) g.moveTo(smallMark, y).lineTo(smallMark, y + 5);
    g.stroke({ width: 4, color: swatch.blue.light, cap: 'round' });
  }
  for (const y of [yTop, yBot]) {
    g.moveTo(left, y)
      .lineTo(left + width, y)
      .stroke({ width: 3, color: swatch.brown.light, cap: 'round' });
    for (let k = 0; k <= STEP_COUNT; k += 2) {
      const x = left + (width * k) / STEP_COUNT;
      g.moveTo(x, y - 5)
        .lineTo(x, y + 5)
        .stroke({ width: 2, color: swatch.brown.light, cap: 'round' });
    }
  }
  miniFlag(g, smallMark, yTop);
  miniFlag(g, tallMark, yBot);
  c.addChild(g);

  const smallPic = pulseIcon('small');
  smallPic.tint = swatch.teal.line;
  smallPic.scale.set(0.46);
  smallPic.position.set(-w / 2 + 34, yTop - 6);
  const tallPic = pulseIcon('tall');
  tallPic.tint = swatch.purple.line;
  tallPic.scale.set(0.46);
  tallPic.position.set(-w / 2 + 34, yBot - 6);
  c.addChild(smallPic, tallPic);
  return c;
}

/** The ribbon with a hump, for the sticker and the hub icon. */
export function ribbonPicture(): Container {
  const c = new Container();
  const g = new Graphics();
  g.moveTo(-70, 20);
  for (let i = 0; i <= 28; i++) {
    const x = -70 + (140 * i) / 28;
    const u = (i - 6) / 12;
    g.lineTo(x, 20 - (u >= 0 && u <= 1 ? 50 * 0.5 * (1 - Math.cos(2 * Math.PI * u)) : 0));
  }
  g.stroke({ width: 12, color: swatch.orange.fill, cap: 'round', join: 'round' });
  g.circle(0, 20, 12).fill(swatch.blue.fill).stroke({ width: 4, color: swatch.blue.line });
  g.moveTo(70, 20).lineTo(70, -30).stroke({ width: 6, color: ink, cap: 'round' });
  g.poly([70, -30, 100, -20, 70, -8]).fill(swatch.red.fill);
  c.addChild(g);
  return c;
}

export const stickerArt = (_seed: number) => stickerize(ribbonPicture(), 90);
