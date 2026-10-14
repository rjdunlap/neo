import { Container, Graphics } from 'pixi.js';
import { Critter, CRITTERS } from '../../art/critter';
import { cream, swatch, wood } from '../../art/palette';
import type { Cast, Prop, TheaterStory, Weather } from './theater-logic';

/** All pictures fit an 88-unit square about the origin. */
export function theaterSymbol(value: Cast | Weather | Prop | 'show' | 'finish' | 'help' | 'undo'): Container {
  const c = new Container(), g = new Graphics();
  c.eventMode = 'none'; c.addChild(g);
  if (value === 'bunny' || value === 'bear') {
    const actor = new Critter(CRITTERS[value]); actor.alive = false; actor.scale.set(0.26); actor.y = 35; c.addChild(actor);
  } else if (value === 'sun') {
    for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; g.moveTo(Math.cos(a) * 28, Math.sin(a) * 28).lineTo(Math.cos(a) * 39, Math.sin(a) * 39); }
    g.stroke({ width: 5, color: swatch.yellow.line, cap: 'round' }).circle(0, 0, 21).fill(swatch.yellow.fill).stroke({ width: 3, color: swatch.yellow.line });
  } else if (value === 'rain') {
    g.roundRect(-38, -24, 76, 31, 15).fill(swatch.blue.light).circle(-18, -21, 16).circle(8, -25, 21).fill(swatch.blue.light);
    for (let i = -1; i <= 1; i++) g.moveTo(i * 24 + 4, 17).lineTo(i * 24 - 4, 33);
    g.stroke({ width: 5, color: swatch.blue.line, cap: 'round' });
  } else if (value === 'blanket') {
    g.roundRect(-39, -28, 78, 56, 6).fill(swatch.pink.light).stroke({ width: 4, color: swatch.pink.line });
    for (let i = -1; i <= 1; i++) g.moveTo(i * 20, -26).lineTo(i * 20, 26);
    g.moveTo(-37, 0).lineTo(37, 0).stroke({ width: 3, color: swatch.pink.line });
  } else if (value === 'umbrella') {
    g.moveTo(-40, 0).quadraticCurveTo(0, -65, 40, 0).closePath().fill(swatch.teal.fill).stroke({ width: 3, color: swatch.teal.line });
    g.moveTo(0, 0).lineTo(0, 28).quadraticCurveTo(0, 43, 17, 32).stroke({ width: 5, color: wood.line, cap: 'round' });
  } else if (value === 'show') {
    g.roundRect(-40, -33, 80, 66, 8).fill(swatch.pink.fill).stroke({ width: 4, color: swatch.pink.line });
    g.moveTo(-12, -22).lineTo(22, 0).lineTo(-12, 22).closePath().fill(cream);
  } else if (value === 'finish') {
    g.moveTo(-32, 8).lineTo(-7, 30).lineTo(35, -25).stroke({ width: 10, color: swatch.teal.line, cap: 'round', join: 'round' });
  } else if (value === 'undo') {
    g.moveTo(25, 23).bezierCurveTo(45, -31, -29, -40, -30, 0).moveTo(-43, -17).lineTo(-30, 0).lineTo(-12, -11).stroke({ width: 6, color: swatch.teal.line, cap: 'round', join: 'round' });
  } else {
    g.circle(0, -7, 25).fill(swatch.yellow.fill).stroke({ width: 4, color: swatch.yellow.line });
    g.roundRect(-12, 18, 24, 15, 4).fill(wood.fill).stroke({ width: 3, color: wood.line });
  }
  return c;
}

/** A 620 × 240 miniature stage. Cue 0: cast, 1: weather, 2: prop, 3: consequence. */
export function theaterScene(story: TheaterStory, cue: number): Container {
  const c = new Container(), g = new Graphics(); c.eventMode = 'none'; c.addChild(g);
  const indoors = cue === 3 && story.weather === 'rain' && story.prop === 'blanket';
  g.roundRect(-310, -120, 620, 240, 18).fill(indoors ? wood.light : swatch.blue.light);
  g.rect(-305, 50, 610, 65).fill(indoors ? wood.fill : swatch.green.light);
  if (indoors) {
    g.roundRect(105, -86, 130, 108, 8).fill(swatch.blue.light).stroke({ width: 6, color: wood.line });
    const rain = theaterSymbol('rain'); rain.position.set(170, -30); c.addChild(rain);
  } else if (cue >= 1) {
    const weather = theaterSymbol(story.weather); weather.position.set(165, -65); c.addChild(weather);
    if (story.weather === 'rain') {
      for (let i = -4; i < 5; i++) g.moveTo(i * 56 + 15, -60).lineTo(i * 56, -32);
      g.stroke({ width: 3, color: swatch.blue.fill });
    }
  }
  const actor = new Critter(CRITTERS[story.cast]); actor.alive = false; actor.scale.set(0.53); actor.position.set(-60, 78); c.addChild(actor);
  if (cue >= 2) {
    const prop = theaterSymbol(story.prop); prop.scale.set(story.prop === 'umbrella' ? 1.6 : 1.8, story.prop === 'umbrella' ? 1.6 : 0.8);
    prop.position.set(story.prop === 'umbrella' ? -52 : -45, story.prop === 'umbrella' ? -68 : 88);
    // Blanket goes under the actor, umbrella above it.
    if (story.prop === 'blanket') c.addChildAt(prop, 1); else c.addChild(prop);
  }
  if (cue === 3) {
    const snack = new Graphics().roundRect(65, 66, 75, 33, 8).fill(cream).stroke({ width: 3, color: wood.line })
      .circle(88, 68, 10).circle(116, 68, 10).fill(swatch.red.fill);
    snack.eventMode = 'none'; c.addChild(snack);
  }
  g.roundRect(-310, -120, 30, 240, 8).roundRect(280, -120, 30, 240, 8).fill(swatch.pink.fill)
    .roundRect(-310, -120, 620, 20, 6).fill(swatch.pink.line);
  // Pixi children added above the graphics keep the stage decoration touch-proof.
  return c;
}
