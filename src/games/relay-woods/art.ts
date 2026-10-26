import { Container, Graphics } from 'pixi.js';
import { cream, ink, swatch, wood } from '../../art/palette';
import type { PixelPictureCreation } from '../../content/creations';
export function mosaic(p:PixelPictureCreation,size=64):Container {
 const n=new Container(),g=new Graphics();g.roundRect(-size/2-6,-size/2-6,size+12,size+12,8).fill(0xffffff).stroke({width:3,color:wood.line});
 const cell=size/6;for(const c of p.pixels){g.rect(-size/2+c.x*cell,-size/2+c.y*cell,cell,cell).fill(swatch[c.color].fill);if(c.color==='white')g.stroke({width:Math.max(1,cell*.05),color:0xd8d8e2});}n.addChild(g);n.eventMode='none';return n;
}
export function resetArt(){const n=new Container(),g=new Graphics();g.arc(0,-6,22,.3,5.7).stroke({width:6,color:swatch.blue.line}).moveTo(23,-20).lineTo(23,0).lineTo(6,-6).stroke({width:6,color:swatch.blue.line});n.addChild(g);return n;}
export function helpArt(){const n=new Container();n.addChild(new Graphics().circle(0,-9,19).fill(swatch.yellow.fill).stroke({width:3,color:ink}).moveTo(-11,17).lineTo(11,17).stroke({width:6,color:ink}));return n;}
export function stump(){return new Graphics().roundRect(-54,17,108,42,17).fill(wood.fill).stroke({width:4,color:wood.line}).ellipse(0,18,54,18).fill(cream).stroke({width:4,color:wood.line});}
