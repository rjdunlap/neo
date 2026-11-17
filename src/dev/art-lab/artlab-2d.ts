/**
 * Art lab, pre-rendered view: the same porch as Blender stills (scripts/art/sprout-porch-sprites.py) with Sprout as a
 * cut-out puppet in Pixi. No App, profile, saves, speech or production route.
 */
import {
  Application,
  Assets,
  Container,
  Graphics,
  Sprite,
  type FederatedPointerEvent,
  type Texture,
} from 'pixi.js';
import manifest from '../sprout/sprites/manifest.json';
import { pose, ROLL_SECONDS, type LabView, type Mount } from './motion';

const urls = import.meta.glob<string>('../sprout/sprites/*.webp', {
  eager: true,
  query: '?url',
  import: 'default',
});
type PartName = keyof typeof manifest.parts;
const PX_PER_UNIT = manifest.size / manifest.units;

export const mount: Mount = async (host, say, pixelRatio) => {
  const app = new Application();
  await app.init({
    resizeTo: host,
    background: '#e8e8d6',
    antialias: true,
    resolution: pixelRatio,
    autoDensity: true,
  });
  host.prepend(app.canvas);
  app.canvas.setAttribute(
    'aria-label',
    'Sprout on a sunny porch. Use the buttons to say hello or roll a ball.',
  );

  // Load on the main thread so the readout's resource timing sees the stills (a worker's fetches are invisible to it).
  Assets.setPreferences({ preferWorkers: false });
  const names = Object.keys(manifest.parts) as PartName[];
  const textures = await Promise.all(
    names.map((n) => Assets.load<Texture>(urls[`../sprout/sprites/${manifest.parts[n].file}`])),
  );
  const part = (name: PartName): Sprite => {
    const s = new Sprite(textures[names.indexOf(name)]);
    s.position.set(manifest.parts[name].x, manifest.parts[name].y);
    return s;
  };
  /** A container that turns or scales about a point given in frame pixels, its children still placed in frame pixels. */
  const about = ([x, y]: number[], ...children: Container[]): Container => {
    const c = new Container();
    c.pivot.set(x, y);
    c.position.set(x, y);
    c.addChild(...children);
    return c;
  };

  const frame = new Container();
  const blink = part('blink');
  const head = about(manifest.pivots.head, part('head'), blink);
  const arm = about(manifest.pivots.arm, part('arm'));
  const sprout = about(manifest.pivots.feet, part('body'), head, arm);
  const ball = part('ball');
  ball.anchor.set(0.5);
  const shadow = new Graphics().ellipse(0, 0, 56, 18).fill({ color: 0x3a2a1a, alpha: 0.2 });
  frame.addChild(part('backdrop'), sprout, shadow, ball);
  app.stage.addChild(frame);

  let time = 0,
    wave = -10,
    roll = -10,
    alive = true;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const view: LabView = {
    hello() {
      wave = time;
      say('Hello, Sprout!');
    },
    roll() {
      if (time - roll < ROLL_SECONDS) return;
      roll = time;
      say('A little nudge, right back to you.');
    },
    detail: () => `PixiJS · ${names.length} sprites and a drawn shadow`,
    dispose() {
      if (!alive) return;
      alive = false;
      app.destroy({ removeView: true }, { children: true, texture: true });
    },
  };
  // One immediate action on touch-down, primary pointer only; no held state to strand.
  const tap = (target: Container, act: () => void) => {
    target.eventMode = 'static';
    target.on('pointerdown', (e: FederatedPointerEvent) => {
      if (e.isPrimary && e.button === 0) act();
    });
  };
  tap(sprout, view.hello);
  tap(ball, view.roll);

  function layout() {
    const w = app.screen.width,
      h = app.screen.height;
    // The 3D view's rule: at least 7.5 world units across, at least 5.8 tall.
    const scale = w / Math.max(7.5, (5.8 * w) / h) / PX_PER_UNIT;
    frame.scale.set(scale);
    frame.position.set(w / 2 - (manifest.size / 2) * scale, h / 2 - (manifest.size / 2) * scale);
  }
  app.renderer.on('resize', layout);
  layout();

  const [restX, restY] = manifest.pivots.ball;
  app.ticker.add((ticker) => {
    if (document.hidden) return;
    time += Math.min(ticker.deltaMS / 1000, 0.05);
    const p = pose(time, wave, roll, reduced.matches);
    // Pixi turns clockwise for positive angles; the shared pose is counter-clockwise.
    head.rotation = -p.head;
    arm.rotation = -p.arm;
    sprout.scale.y = p.breath;
    blink.visible = p.blink;
    const dx = p.roll * manifest.ballTravel[0],
      dy = p.roll * manifest.ballTravel[1];
    ball.position.set(restX + dx, restY + dy);
    ball.rotation = -p.roll * 3;
    shadow.position.set(manifest.ballShadow[0] + dx, manifest.ballShadow[1] + dy);
  });
  return view;
};
