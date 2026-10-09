import { Container, Graphics, Rectangle } from 'pixi.js';
import { cream, swatch } from '../art/palette';
import { label } from './text';

const SECONDS = 3.2;

/** 0 → 1 → 0 over one turn: still upright, a turn to sideways, a pause, then back. */
export function phoneTurn(t: number): number {
  const ease = (x: number) => { const c = Math.min(1, Math.max(0, x)); return c * c * (3 - 2 * c); };
  const s = t % SECONDS;
  return ease((s - 0.5) / 0.8) - ease((s - 2.3) / 0.7);
}

/**
 * Shown over everything when a phone is held upright: a picture of a phone turning sideways.
 * It is drawn in CSS pixels (not logical units), covers the window and swallows touches; the app
 * pauses the scene underneath while it is up.
 */
export class TurnPrompt extends Container {
  private readonly backdrop = new Graphics();
  private readonly phone = new Container();
  private readonly arrow = new Graphics();
  private readonly title = label('Turn your phone sideways', 30, 0x2b2b3a);
  private readonly note = label('Puddle Island is drawn wide.', 20, 0x6b6b7b, '500');
  private clock = 0;

  constructor() {
    super();
    this.visible = false;
    this.eventMode = 'static';
    // The picture on the screen is a wide one: lying on its side while the phone is upright, standing up once it has turned.
    const body = new Graphics().roundRect(-48, -88, 96, 176, 18).fill(0xffffff).stroke({ width: 6, color: swatch.teal.line });
    const picture = new Container();
    picture.addChild(
      new Graphics()
        .rect(-80, -44, 160, 88).fill(swatch.blue.light)
        .ellipse(0, 40, 90, 34).fill(swatch.green.fill)
        .circle(38, -14, 13).fill(swatch.yellow.fill),
    );
    picture.rotation = -Math.PI / 2;
    const clip = new Graphics().roundRect(-38, -74, 76, 148, 8).fill(0xffffff);
    picture.mask = clip;
    this.phone.addChild(body, picture, clip);
    this.addChild(this.backdrop, this.arrow, this.phone, this.title, this.note);
  }

  layout(w: number, h: number) {
    this.hitArea = new Rectangle(0, 0, w, h);
    this.backdrop.clear().rect(0, 0, w, h).fill(cream);
    const u = Math.min(1.6, Math.max(0.6, Math.min(w, h) / 390));
    const cx = w / 2, cy = h * 0.42;
    this.phone.position.set(cx, cy);
    this.phone.scale.set(u);
    // A quarter-turn arrow around the phone, clockwise, the way it turns.
    const r = 128 * u;
    const from = -Math.PI * 0.62, to = -Math.PI * 0.08;
    this.arrow.clear();
    this.arrow.moveTo(cx + Math.cos(from) * r, cy + Math.sin(from) * r);
    this.arrow.arc(cx, cy, r, from, to).stroke({ width: 8 * u, color: swatch.orange.fill, cap: 'round' });
    const tip = { x: cx + Math.cos(to) * r, y: cy + Math.sin(to) * r };
    const dir = to + Math.PI / 2;
    const head = 20 * u;
    this.arrow.poly([
      tip.x + Math.cos(dir) * head, tip.y + Math.sin(dir) * head,
      tip.x + Math.cos(dir + 2.5) * head, tip.y + Math.sin(dir + 2.5) * head,
      tip.x + Math.cos(dir - 2.5) * head, tip.y + Math.sin(dir - 2.5) * head,
    ]).fill(swatch.orange.fill);
    this.title.scale.set(1);
    this.title.scale.set(Math.min(u, (w - 40) / Math.max(1, this.title.width)));
    this.title.position.set(cx, h * 0.42 + 160 * u);
    this.note.scale.set(u);
    this.note.position.set(cx, this.title.y + 40 * u);
    this.apply();
  }

  update(dt: number) {
    this.clock += dt;
    this.apply();
  }

  private apply() {
    this.phone.rotation = phoneTurn(this.clock) * (Math.PI / 2);
  }
}
