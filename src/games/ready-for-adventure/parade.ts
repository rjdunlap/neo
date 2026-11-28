import { Container, Graphics, Rectangle } from 'pixi.js';
import { swatch } from '../../art/palette';
import { sfx } from '../../audio/sfx';
import { ease } from '../../engine/tween';
import type { View } from '../../engine/view';
import type { CompanionRig } from '../../creatures/companion';
import type { GameContext } from '../types';
import { propPic, wagonPic, type Look } from './art';
import type { PropId } from './logic';

export interface ParadeOptions {
  ctx: GameContext;
  /** The current view (it changes on resize). */
  view: () => View;
  rig: CompanionRig;
  /** What rides in the wagon: exactly the props the final card showed. */
  packed: readonly PropId[];
  look: Look;
  /** The play field that slides away, and the other things hidden once it has. */
  world: Container;
  hide: Container[];
  /** The scene has been destroyed: stop at once. */
  isGone: () => boolean;
  /** Called once when the parade ends or is skipped, before `ctx.finish`; returns false if it already ran. */
  markFinished: () => boolean;
  /** Called as the parade begins, so the scene can clear its glow and lock input. */
  onStart: () => void;
  result: () => { misses: number; hints: number };
  /** The bag zips shut. */
  zip: () => void;
}

/** The parade of the packed set (about six seconds, a tap skips to the end pose), then `ctx.finish` exactly once. */
export async function playParade(o: ParadeOptions): Promise<void> {
  const { ctx, rig, packed, look, world } = o;
  const { tw } = ctx;
  const view = o.view();
  let skip = false;
  o.onStart();
  o.zip();
  sfx.tada();
  void ctx.say('ready.allpacked');
  await tw.wait(0.9);
  if (o.isGone()) return;
  const lane = new Graphics();
  lane.rect(0, view.h * 0.7, view.w, view.h * 0.3).fill(0xe8d9b0);
  lane
    .moveTo(0, view.h * 0.7)
    .lineTo(view.w, view.h * 0.7)
    .stroke({ width: 6, color: 0xc9b57f });
  const bunting = new Graphics();
  for (let i = 0; i < 8; i++) {
    const x = (view.w / 7) * i;
    bunting
      .poly([x - 30, 20, x + 30, 20, x, 80])
      .fill([swatch.red, swatch.yellow, swatch.blue, swatch.green][i % 4].fill);
  }
  ctx.stage.addChildAt(lane, 1);
  ctx.stage.addChildAt(bunting, 2);
  await tw.to(world, { y: view.h }, { duration: 0.5, ease: ease.inQuad });
  if (o.isGone()) return;
  world.visible = false;
  for (const h of o.hide) h.visible = false;
  const wagon = new Container();
  wagon.addChild(wagonPic());
  const riders: Container[] = [];
  packed.forEach((id, i) => {
    const p = propPic(id, true, look);
    p.scale.set(0.7);
    p.position.set((i - (packed.length - 1) / 2) * 100, -60);
    wagon.addChild(p);
    riders.push(p);
  });
  const y = view.h * 0.7 + 70;
  wagon.position.set(-300, y);
  wagon.eventMode = 'none';
  ctx.stage.addChild(wagon);
  rig.position.set(-100, y);
  const tapCatcher = new Container();
  tapCatcher.eventMode = 'static';
  tapCatcher.hitArea = new Rectangle(0, 0, view.w, view.h);
  tapCatcher.on('pointerdown', () => {
    skip = true;
  });
  ctx.stage.addChild(tapCatcher);
  void ctx.say('ready.parade');
  const beat = () => {
    packed.forEach((id, i) => {
      if (id === 'drum') sfx.knock();
      else if (id === 'bell') sfx.bell(4 + i);
      else if (id === 'flag') sfx.pluck(6, 0.15);
    });
  };
  const stops = 6;
  for (let i = 0; i < stops && !skip; i++) {
    const frac = (i + 1) / stops;
    beat();
    riders.forEach((r, k) => {
      r.rotation = (i % 2 ? 1 : -1) * 0.12 * (k % 2 ? -1 : 1);
    });
    const wx = -100 + frac * (view.w * 0.85);
    void tw.to(wagon, { x: wx - 200 }, { duration: 0.9, ease: ease.inOutSine });
    await tw.to(rig, { x: wx }, { duration: 0.9, ease: ease.inOutSine });
    if (o.isGone()) return;
  }
  if (o.isGone() || !o.markFinished()) return;
  rig.cheer();
  sfx.tada();
  ctx.particles.burst(view.w / 2, view.h * 0.45, {
    kind: 'dot',
    colors: [0xfff3a0, 0xffffff, 0xff9ac1],
    count: 26,
    speed: [120, 300],
    gravity: 200,
    life: [0.6, 1],
  });
  await tw.wait(0.8);
  if (o.isGone()) return;
  ctx.finish(o.result());
}
