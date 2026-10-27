import { Container, Graphics } from 'pixi.js';
import { CRITTERS, Critter } from '../../art/critter';
import { frogArt } from '../../art/animals';
import { cream, ink, swatch } from '../../art/palette';
import { prop } from '../../art/props';
import type { Friend, Item } from './logic';
/** Each toy differs in silhouette as well as color. All drawings use the shared palette. */
export function itemArt(id:Item):Container {
 const c=new Container(),g=new Graphics();c.addChild(g);const line={width:4,color:ink,join:'round' as const,cap:'round' as const};
 switch(id){
 case 'ball':g.circle(0,0,39).fill(swatch.blue.fill).stroke(line).moveTo(-37,-10).quadraticCurveTo(0,15,37,-10).stroke({width:5,color:cream}).moveTo(-10,-37).quadraticCurveTo(15,0,-10,37).stroke({width:5,color:cream});break;
 case 'leaf':g.moveTo(-40,28).quadraticCurveTo(-42,-40,39,-35).quadraticCurveTo(45,35,-40,28).fill(swatch.green.fill).stroke(line).moveTo(-35,24).lineTo(28,-25).stroke(line);break;
 case 'carrot':g.poly([-24,-27,25,-27,-11,42]).fill(swatch.orange.fill).stroke(line).moveTo(-5,-28).lineTo(-15,-50).moveTo(0,-28).lineTo(15,-48).stroke({width:8,color:swatch.green.line});break;
 case 'berry':g.circle(-17,10,25).circle(17,10,25).circle(0,-18,25).fill(swatch.red.fill).stroke(line).poly([-13,-38,2,-55,17,-37]).fill(swatch.green.fill);break;
 case 'shell':g.moveTo(0,35).lineTo(-42,-5).bezierCurveTo(-48,-59,48,-59,42,-5).closePath().fill(swatch.pink.fill).stroke(line);for(const x of [-26,0,26])g.moveTo(0,28).lineTo(x,-28).stroke({width:3,color:swatch.pink.line});break;
 case 'ribbon':g.poly([-4,0,-40,-27,-40,27,-4,0,40,-27,40,27]).fill(swatch.purple.fill).stroke(line).poly([-8,0,-22,49,0,39,17,49,8,0]).fill(swatch.purple.fill).stroke(line).circle(0,0,12).fill(swatch.yellow.fill).stroke(line);break;
 case 'flower':c.addChild(prop('flower','yellow'));break;
 case 'acorn':g.ellipse(0,8,27,34).fill(swatch.brown.fill).stroke(line).roundRect(-35,-24,70,24,10).fill(swatch.brown.line).moveTo(0,-23).lineTo(7,-43).stroke(line);break;
 case 'star':g.star(0,0,5,43,21).fill(swatch.yellow.fill).stroke(line);break;
 case 'kite':g.poly([0,-47,35,-5,0,32,-35,-5]).fill(swatch.teal.fill).stroke(line).moveTo(-35,-5).lineTo(35,-5).moveTo(0,-47).lineTo(0,32).bezierCurveTo(30,45,-30,42,0,62).stroke(line);break;
 }
 c.eventMode='none';return c;
}
export function friendArt(id:Friend):Container {
 if(id==='frog')return frogArt();
 const c=new Critter(id==='otter'?{color:'brown',ears:'round',snout:'nose',whiskers:true,belly:true}:CRITTERS[id]);c.alive=false;c.scale.set(.32);c.eventMode='none';return c;
}
