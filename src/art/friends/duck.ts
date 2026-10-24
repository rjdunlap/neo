import { Assets, Container, Sprite, type Texture } from 'pixi.js';
import { Critter, CRITTERS } from '../critter';
import baseUrl from './duck-base.png?url';

let art: Promise<Texture> | undefined;
let loaded: Texture | undefined;
const loadDuck = () => art ??= Assets.load<Texture>(baseUrl).then((texture) => {
  texture.source.autoGenerateMipmaps = true;
  texture.source.updateMipmaps();
  loaded = texture;
  return texture;
});

/** R22 still, feet at (0, 0), 250 units tall like Critter. Animation never moves its parent's hit circle. */
export class IllustratedDuck extends Container {
  alive = true;
  private readonly craft = new Container();
  private readonly fallback = new Critter(CRITTERS.duck);
  private clock = Math.random() * Math.PI * 2;
  private bounce = 1;
  private power = 0;
  private resting = false;

  constructor() {
    super();
    // Keep a visible duck if decoding fails; loading may finish after a scene or sticker is destroyed.
    this.eventMode = 'none';
    this.craft.addChild(this.fallback);
    this.addChild(this.craft);
    const show = (texture: Texture) => {
      if (this.destroyed) return;
      const sprite = new Sprite(texture);
      sprite.anchor.set(0.5, 1);
      sprite.scale.set(250 / texture.height);
      this.craft.addChild(sprite);
      this.fallback.destroy({ children: true });
    };
    // A sticker may be rendered into a texture immediately, in this same call stack.
    if (loaded) show(loaded);
    else void loadDuck().then(show).catch((error) => console.warn('Could not load the Duck Pond duck', error));
  }

  hop(power = 1) {
    this.bounce = 0;
    this.power = power;
  }

  cheer() { this.hop(1.1); }

  setMood(mood: 'sleepy') { this.resting = mood === 'sleepy'; }

  update(dt: number) {
    if (!this.alive) return;
    this.clock += dt;
    this.bounce = Math.min(1, this.bounce + dt / 0.55);
    const wave = Math.sin(Math.PI * this.bounce);
    const squash = Math.sin(2 * Math.PI * this.bounce) * 0.12 * this.power;
    this.craft.y = -65 * this.power * wave + 2 * Math.sin(this.clock * 2.4);
    this.craft.scale.set(1 + squash, 1 - squash);
    this.craft.rotation = this.resting ? 0.06 : 0.015 * Math.sin(this.clock * 1.8);
  }
}
