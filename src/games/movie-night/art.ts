import { Container, Graphics } from 'pixi.js';
import { Critter, CRITTERS } from '../../art/critter';
import { cream, ink, swatch, wood } from '../../art/palette';
import type { Pad, Shot } from './logic';
/** The same shape appears on pads, installed chips and pictured requests. */
export function glyph(pad:Pad,size=28):Graphics {
  const g=new Graphics();g.eventMode='none';
  const c=swatch.blue.fill;
  if(pad==='splash')g.poly([-size,0,-size*.5,-size*.7,0,size*.25,size*.25,-size,size*.6,-size*.2,size,0,0,size*.65]).fill(c).stroke({color:ink,width:3,join:'round'});
  if(pad==='boing')g.poly([-size,-size*.8,size*.7,-size*.4,-size*.7,0,size*.7,size*.4,-size,size*.8]).stroke({color:swatch.pink.line,width:6,join:'round'});
  if(pad==='whoosh'){g.moveTo(-size,-size*.5).quadraticCurveTo(size,-size,size,0).quadraticCurveTo(size,size,-size,size*.5).stroke({color:swatch.teal.line,width:5});g.poly([-size*.6,size*.1,-size,size*.5,-size*.4,size*.8]).stroke({color:ink,width:4});}
  if(pad==='bell'){g.poly([-size,size*.6,-size*.7,-size*.4,0,-size,size*.7,-size*.4,size,size*.6]).fill(swatch.yellow.fill).stroke({color:ink,width:3});g.circle(0,size*.8,size*.16).fill(ink);}
  if(pad==='knock'){g.roundRect(-size*.6,-size,size*1.2,size*2,5).fill(wood.fill).stroke({color:ink,width:3});g.circle(size*.65,0,size*.36).fill(cream).stroke({color:ink,width:3});g.moveTo(size*.6,-size*.55).lineTo(size,-size*.85).stroke({color:ink,width:3});}
  if(pad==='hello'){g.ellipse(0,size*.3,size*.5,size*.6).fill(swatch.pink.fill).stroke({color:ink,width:3});for(let i=0;i<3;i++)g.roundRect(-size*.6+i*size*.4,-size,size*.3,size*1.5,size*.15).fill(swatch.pink.fill).stroke({color:ink,width:2});g.moveTo(size*.8,-size*.9).quadraticCurveTo(size*1.3,0,size*.9,size*.6).stroke({color:ink,width:3});}
  return g;
}
function actor(kind:'duck'|'bunny'|'bear',x:number,y:number,scale=.6){const c=new Critter(CRITTERS[kind]);c.alive=false;const bounds=c.getLocalBounds();c.scale.set(Math.min(scale,(kind==='duck'?90:138)/bounds.height));const left=bounds.x*c.scale.x,right=(bounds.x+bounds.width)*c.scale.x;c.position.set(Math.max(-150-left,Math.min(150-right,x)),y);c.eventMode='none';return c;}
/** Visible action is authored alongside the finite facts, with contact at t=.8 seconds. */
export function footage(shot:Shot,t=1):Container {
  const c=new Container();c.eventMode='none';
  const bg=new Graphics().roundRect(-160,-90,320,180,16).fill(swatch.blue.light).rect(-160,35,320,55).fill(swatch.green.light);c.addChild(bg);
  const f=Math.max(0,Math.min(1,t/.8));
  if(shot.id[0]==='P'){
    bg.ellipse(65,58,85,26).fill(swatch.blue.fill);
    let x=-65,y=65;
    if(shot.id==='P0'){const walk=Math.max(0,t-.8);x=-100+60*Math.min(1,walk/1.2);y=65-Math.abs(Math.sin(walk*10))*5;}
    if(shot.id==='P1'){x=-50+65*f;y=65-55*Math.sin(Math.max(0,Math.min(1,(t-.8)/1.2))*Math.PI);}
    if(shot.id==='P2'){x=65;y=65*f;}
    c.addChild(actor('duck',x,y,.58));
    if(shot.id==='P2'&&t>=.8){const splash=glyph('splash',27);splash.position.set(65,53);c.addChild(splash,new Graphics().moveTo(15,43).lineTo(2,25).moveTo(110,43).lineTo(127,24).moveTo(9,56).lineTo(-2,53).moveTo(120,57).lineTo(139,53).stroke({color:swatch.blue.line,width:6,cap:'round'}));}
  }else{
    bg.roundRect(15,-78,120,140,8).fill(wood.fill).stroke({color:wood.line,width:4});
    const open=shot.id==='D3'||shot.id==='D2'&&t>=.8;
    bg.rect(34,-62,open?80:65,122).fill(open?ink:wood.line);
    const bunny=actor('bunny',shot.id==='D0'?-115+50*f:-55,62,.51);c.addChild(bunny);
    if(shot.id==='D1'){
      const paw=new Graphics().circle(-5+22*f,-10,10).fill(cream).stroke({color:ink,width:3});c.addChild(paw);
      if(t>=.8)c.addChild(new Graphics().poly([28,-20,14,-30,28,-40]).stroke({color:ink,width:4}));
    }
    if(open)c.addChild(actor('bear',77,62,.57));
    if(shot.id==='D3'){
      for(const x of [-53,78]){const wave=glyph('hello',16);wave.position.set(x+35,-22+Math.sin(Math.max(0,t-.8)*8)*7);c.addChild(wave);}
    }
  }
  return c;
}
export function emblem(){const c=new Container();c.addChild(new Graphics().roundRect(-74,-92,148,92,12).fill(ink).stroke({color:wood.fill,width:7}).poly([-20,-74,35,-48,-20,-20]).fill(cream));return c;}
