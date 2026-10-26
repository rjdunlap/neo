import { Container, Graphics } from 'pixi.js';
import { cream, ink, swatch, wood } from '../../art/palette';
import type { Option } from './logic';
/** Three different silhouettes; voting never depends on a color name. */
export function toy(option:Option):Container {
 const c=new Container(),g=new Graphics(),line={width:5,color:ink,cap:'round' as const,join:'round' as const};c.addChild(g);c.eventMode='none';
 if(option==='slide')g.moveTo(-50,38).lineTo(-50,-38).lineTo(-15,-38).lineTo(45,35).lineTo(62,35).stroke({width:12,color:swatch.blue.fill,join:'round'}).moveTo(-50,-36).lineTo(-50,40).moveTo(-50,-8).lineTo(-20,-8).moveTo(-50,15).lineTo(-2,15).stroke({width:6,color:wood.line});
 if(option==='swing')g.moveTo(-60,42).lineTo(-32,-42).lineTo(34,-42).lineTo(60,42).stroke({width:8,color:wood.line}).moveTo(-18,-38).lineTo(-18,17).moveTo(18,-38).lineTo(18,17).stroke(line).roundRect(-28,17,56,15,6).fill(swatch.red.fill).stroke(line);
 if(option==='sandpit')g.poly([-61,10,-30,-28,48,-28,65,25,30,42,-60,32]).fill(swatch.yellow.light).stroke({width:7,color:wood.line}).moveTo(-10,-15).lineTo(-10,19).lineTo(20,19).lineTo(20,0).lineTo(4,0).lineTo(4,-15).closePath().fill(swatch.orange.fill).stroke({width:3,color:swatch.orange.line});
 return c;
}
export function paw():Graphics {const g=new Graphics().ellipse(0,10,14,12).circle(-16,-8,7).circle(0,-15,7).circle(16,-8,7).fill(cream).stroke({width:3,color:ink});g.eventMode='none';return g;}
