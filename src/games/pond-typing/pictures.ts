import { Container, Graphics } from 'pixi.js';
import { Critter, CRITTERS } from '../../art/critter';
import { frogArt } from '../../art/animals';
import { ink, swatch, wood } from '../../art/palette';
import { letterPicture } from '../letter-trails/pictures';

/** Pictures name objects, never substitute a printed initial for a missing illustration. */
export function typingPicture(text: string): Container {
  const words = text.toLowerCase().replace(/\./g, '').split(' ');
  const noun = [...words].reverse().find(w => PICTURE_WORDS.includes(w)) ?? 'pip';
  const c = new Container(), g = new Graphics(); c.addChild(g);
  const animal = noun === 'hen' ? null : CRITTERS[noun as keyof typeof CRITTERS];
  if (animal) { const a = new Critter(animal); a.alive = false; a.scale.set(0.65); a.y = 80; c.addChild(a); }
  else if (noun === 'frog') { const a = frogArt(); a.scale.set(2); a.y = 55; c.addChild(a); }
  else if (['leaf', 'moon', 'nest', 'sun', 'tree'].includes(noun)) { const a = letterPicture(noun[0].toUpperCase()); a.scale.set(0.65); c.addChild(a); }
  else if (noun === 'hat') g.ellipse(0, 45, 90, 18).fill(words.includes('red') ? swatch.red.fill : swatch.purple.fill).roundRect(-52, -50, 104, 95, 15).fill(words.includes('red') ? swatch.red.fill : swatch.purple.fill).rect(-52, 12, 104, 14).fill(swatch.yellow.fill);
  else if (noun === 'bee' || noun === 'bug') {
    g.ellipse(-30, -45, 32, 40).ellipse(30, -45, 32, 40).fill(0xffffff).ellipse(0, 5, 65, 40).fill(swatch.yellow.fill);
    for (const x of [-25, 0, 25]) g.rect(x - 5, -28, 10, 65).fill(ink);
    g.circle(45, -8, 5).fill(ink);
  } else if (noun === 'mud' || noun === 'pond') g.ellipse(0, 25, 95, 40).fill(noun === 'mud' ? wood.fill : swatch.blue.fill).ellipse(-25, 15, 35, 10).fill(noun === 'mud' ? wood.light : swatch.blue.light);
  else if (noun === 'log') g.roundRect(-85, -30, 170, 75, 20).fill(wood.fill).ellipse(65, 8, 24, 37).fill(wood.light).ellipse(65, 8, 13, 24).stroke({ color: wood.line, width: 4 });
  else if (noun === 'net') {
    g.moveTo(-70, 80).lineTo(10, 0).stroke({ color: wood.line, width: 12 });
    g.ellipse(25, -25, 58, 48).stroke({ color: ink, width: 5 });
    for (const x of [-5, 15, 35, 55]) g.moveTo(x, -60).lineTo(x, 10).stroke({ color: swatch.blue.line, width: 2 });
  } else if (noun === 'rain') {
    g.circle(-35, -25, 35).circle(0, -45, 45).circle(40, -25, 35).fill(0xffffff);
    for (const x of [-45, -15, 15, 45]) g.moveTo(x, 25).lineTo(x-10, 55).stroke({ color: swatch.blue.line, width: 6 });
  } else if (noun === 'cake') g.roundRect(-75, -25, 150, 95, 12).fill(swatch.pink.fill).roundRect(-75, -35, 150, 30, 12).fill(0xffffff).rect(-5, -80, 10, 45).fill(swatch.blue.fill).ellipse(0, -90, 9, 14).fill(swatch.orange.fill);
  else if (noun === 'boat') g.poly([-95, 25, 95, 25, 55, 75, -55, 75]).fill(wood.fill).moveTo(0, 25).lineTo(0, -85).stroke({ color: wood.line, width: 7 }).poly([8, -80, 8, 15, 85, 15]).fill(swatch.red.fill);
  else if (noun === 'fox') g.poly([-75, -65, -45, 0, 45, 0, 75, -65, 65, 45, 0, 90, -65, 45]).fill(swatch.orange.fill).circle(-27, 15, 6).circle(27, 15, 6).circle(0, 65, 9).fill(ink);
  else if (noun === 'hen') g.ellipse(0, 20, 65, 55).circle(35, -35, 35).fill(0xffffff).circle(20, -70, 13).circle(40, -70, 13).fill(swatch.red.fill).poly([62, -40, 88, -25, 62, -15]).fill(swatch.orange.fill).circle(43, -38, 5).fill(ink);
  return c;
}
export const PICTURE_WORDS: readonly string[] = ['hat','cat','dog','pig','hen','cow','bee','net','sun','mud','log','fox','pip','bug','nest','frog','duck','pond','leaf','moon','rain','cake','boat','tree'];
