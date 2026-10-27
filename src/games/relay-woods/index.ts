import { Container, EventBoundary, Graphics, Rectangle, type FederatedPointerEvent } from 'pixi.js';
import { Critter, CRITTERS } from '../../art/critter';
import { cream, ink, swatch, wood } from '../../art/palette';
import { Backdrop } from '../../art/scenery';
import { STYLES } from '../../audio/music';
import { sfx } from '../../audio/sfx';
import { GhostFinger } from '../../engine/ghost';
import { onTap } from '../../engine/input';
import { Rng } from '../../engine/random';
import type { View } from '../../engine/view';
import { rangeFor, type BandLevels } from '../../progress/difficulty';
import { label } from '../../ui/text';
import { WigglyIcon } from '../shared';
import type { Game, GameContext, GameModule, TouchIntent } from '../types';
import { helpArt, mosaic, resetArt, stump } from './art';
import { fixture, layout, NAMES, picture, Relay, roundFor, type Point } from './logic';
const LEVELS:BandLevels={toddler:{min:1,max:2},preschool:{min:1,max:4},prek:{min:2,max:4},school:{min:4,max:4}};
interface Control{node:Container;w:number;h:number}
export class RelayWoods implements Game {
 readonly relay;readonly root=new Container();readonly board=new Container();readonly glow=new Graphics();readonly ghost;readonly companion;readonly backdrop;
 readonly friends=new Map<string,Container>();controls:Control[]=[];reset!:Container;help!:Container;message=new Container();view:View;boxes;
 alive=true;busy=false;finished=false;private generation=0;private pending:{node:Container;pointer:number}|null=null;private clock=0;private asked=false;private autoHelp=false;
 private demoStep=0;private wave:Graphics|null=null;
 get misses(){return this.relay.misses;}get hints(){return this.relay.hints;}
 private cancel=(e:Event)=>{if(e instanceof PointerEvent&&this.pending&&e.pointerId!==this.pending.pointer)return;this.release();};
 constructor(private ctx:GameContext){
  this.companion=ctx.companion();ctx.track(this.companion);this.companion.eventMode='none';
  this.relay=new Relay(ctx.demo?fixture(ctx.level,0,this.companion.color):roundFor(ctx.level,ctx.rng,this.companion.color));this.view=ctx.view;this.boxes=layout(this.view,this.relay.plan);
  this.backdrop=new Backdrop({sky:[0xffe2c4,cream],hills:[0xd8ecb0,0xbfe39a],horizon:.4,seed:127,clouds:2,sun:true},this.view);
  this.ghost=new GhostFinger(this.root,new EventBoundary(this.root));ctx.stage.addChild(this.backdrop,this.root);this.root.addChild(this.board,this.glow,this.companion,this.ghost.hand);this.glow.eventMode='none';
  window.addEventListener('pointercancel',this.cancel,true);window.addEventListener('blur',this.cancel);
 }
 start(){this.draw();this.instruct();}
 private instruct(){const line=this.relay.plan.level===1?'relay-woods.one':this.relay.plan.level===2?'relay-woods.two':this.relay.plan.level===3?'relay-woods.three':'relay-woods.four';void this.ctx.instruct(line,{friend:this.relay.plan.names.R});}
 private release(){if(this.pending&&!this.pending.node.destroyed)this.pending.node.alpha=1;this.pending=null;}
 private button(p:Point,w:number,h:number,art:Container,act:()=>void){
  const n=new Container();n.position.set(p.x,p.y);n.hitArea=new Rectangle(-w/2,-h/2,w,h);art.eventMode='none';n.addChild(art);this.board.addChild(n);this.controls.push({node:n,w,h});
  onTap(n,e=>{if(!this.alive||this.busy||this.finished||this.pending)return;n.alpha=.65;this.pending={node:n,pointer:e.pointerId};});
  n.on('pointerup',(e:FederatedPointerEvent)=>{if(this.pending?.node!==n||this.pending.pointer!==e.pointerId)return;const p=n.toLocal(e.global);const inside=Math.abs(p.x)<=w/2&&Math.abs(p.y)<=h/2;this.release();if(inside&&this.alive&&!this.busy&&!this.finished)act();});
  n.on('pointerupoutside',(e:FederatedPointerEvent)=>{if(this.pending?.pointer===e.pointerId)this.release();});return n;
 }
 private clear(){this.release();this.companion.removeFromParent();for(const c of this.board.removeChildren())c.destroy({children:true});this.friends.clear();this.controls=[];this.wave=null;}
 private fitPet(p:Point){const b=this.companion.bodyBounds(),s=Math.min(72/b.width,76/b.height);this.companion.scale.set(s);this.companion.position.set(p.x-(b.x+b.width/2)*s,p.y-7-(b.y+b.height/2)*s);this.root.addChild(this.companion);}
 private draw(){
  this.clear();const r=this.relay,p=r.plan;this.boxes=layout(this.view,p);const box=this.boxes,edges=new Graphics();edges.eventMode='none';this.board.addChild(edges);
  for(const e of p.edges){const a=box.nodes[e.a],b=box.nodes[e.b];edges.moveTo(a.x,a.y).lineTo(b.x,b.y).stroke({width:14,color:wood.fill});edges.moveTo(a.x,a.y).lineTo(b.x,b.y).stroke({width:3,color:wood.line});
   if(e.blocked){const mx=(a.x+b.x)/2,my=(a.y+b.y)/2,log=new Container();log.position.set(mx,my);log.rotation=Math.atan2(b.y-a.y,b.x-a.x)+Math.PI/2;log.addChild(new Graphics().roundRect(-39,-14,78,28,12).fill(wood.line).stroke({width:3,color:ink}).ellipse(-27,0,9,12).fill(wood.light).stroke({width:2,color:ink}).moveTo(2,-10).lineTo(20,10).stroke({width:3,color:wood.fill}));log.eventMode='none';this.board.addChild(log);}
  }
  p.nodes.forEach((id,i)=>{const art=new Container();art.addChild(stump());if(id!=='S'){const c=new Critter(CRITTERS[id==='R'?'bunny':i%2?'bunny':'duck']);c.alive=false;c.scale.set(.24);c.position.set(0,25);art.addChild(c);}
   const name=label(p.names[id],18);name.position.set(0,49);art.addChild(name);
   if(id==='R'){this.wave=new Graphics().moveTo(0,13).lineTo(0,0).stroke({width:6,color:swatch.green.line}).circle(0,-5,9).fill(cream).stroke({width:3,color:wood.line}).moveTo(-6,-10).lineTo(-7,-17).moveTo(0,-13).lineTo(0,-20).moveTo(6,-10).lineTo(8,-16).stroke({width:3,color:wood.line});this.wave.position.set(43,-28);art.addChild(this.wave);const m=mosaic(p.creation,22);m.position.set(-36,-37);art.addChild(m);}
   this.friends.set(id,this.button(box.nodes[id],120,120,art,()=>{void this.hop(id);}));
  });
  this.fitPet(box.nodes.S);
  const request=new Container(),paper=mosaic(p.creation,66);paper.position.set(-125,0);request.position.set(box.request.x,box.request.y);request.addChild(paper);
  const arrow=new Graphics().moveTo(-68,0).lineTo(25,0).lineTo(10,-13).moveTo(25,0).lineTo(10,13).stroke({width:6,color:wood.line});request.addChild(arrow);
  const receiver=new Critter(CRITTERS.bunny);receiver.alive=false;receiver.scale.set(.21);receiver.position.set(100,33);request.addChild(receiver);const name=label(p.names.R,21);name.position.set(165,0);request.addChild(name);request.eventMode='none';this.board.addChild(request);
  this.ribbon();
  const control=(name:string,icon:Container)=>{const a=new Container();a.addChild(new Graphics().roundRect(-65,-50,130,100,18).fill(cream).stroke({width:4,color:wood.line}),icon);icon.y=-9;const t=label(name,17);t.y=29;a.addChild(t);return a;};
  this.reset=this.button(box.reset,130,100,control('Start over',resetArt()),()=>{if(r.reset()){this.draw();this.instruct();}});
  this.help=this.button(box.help,130,100,control('Help',helpArt()),()=>this.askForHint());
  this.message=mosaic(p.creation,48);const holder=box.nodes[r.holder];this.message.position.set(holder.x+36,holder.y-23);this.board.addChild(this.message);
  this.root.addChild(this.glow,this.companion,this.ghost.hand);
 }
 private ribbon(){
  const r=this.relay,p=this.boxes.ribbon,n=new Container();n.position.set(p.x,p.y);n.eventMode='none';const g=new Graphics();n.addChild(g);
  const dots=(count:number,y:number,color:number)=>{const shown=Math.min(12,count),start=-shown*9;for(let i=0;i<shown;i++)g.circle(start+i*18,y,6).fill(color);};
  dots(r.hops,0,swatch.blue.line);if(r.plan.level===4)dots(r.optimum,28,swatch.green.line);
  const t=label(r.plan.level===4?`${r.hops} ${r.hops===1?'hop':'hops'} • fewest ${r.optimum}`:`${r.hops} ${r.hops===1?'hop':'hops'}`,19);t.position.set(0,r.plan.level===4?50:22);n.addChild(t);this.board.addChild(n);
 }
 private async hop(id:string){
  const r=this.relay,result=r.tap(id);if(result==='ignored')return;this.busy=true;const gen=this.generation;
  if(result!=='hop'){sfx.boing();await this.ctx.say(result==='blocked'?'relay-woods.blocked':result==='not-next'?'relay-woods.not-next':'relay-woods.unjoined');if(!this.alive||gen!==this.generation)return;r.feedbackDone();this.busy=false;return;}
  if(matchMedia('(prefers-reduced-motion: reduce)').matches){this.arrival(r.settle(),gen);return;}
  const to=this.boxes.nodes[id];await this.ctx.tw.to(this.message,{x:to.x+36,y:to.y-23},{duration:.4});if(!this.alive||gen!==this.generation)return;
  this.arrival(r.settle(),gen);
 }
 private arrival(result:ReturnType<Relay['settle']>,gen:number){
  this.draw();if(result==='arrived'){this.busy=true;sfx.bell(5);void this.finish(gen);return;}
  if(result==='long'){this.busy=true;sfx.bell(3);void this.retry(gen);return;}this.busy=false;
 }
 private async finish(gen:number){await this.ctx.say('relay-woods.arrived');if(!this.alive||gen!==this.generation)return;const result=this.relay.complete();if(result){this.finished=true;this.ctx.finish(result);}}
 private async retry(gen:number){await this.ctx.say('relay-woods.arrived');if(!this.alive||gen!==this.generation)return;await this.ctx.say('relay-woods.long',{n:this.relay.lastArrival,few:this.relay.optimum});if(!this.alive||gen!==this.generation)return;this.relay.feedbackDone();this.busy=false;this.draw();this.instruct();}
 askForHint(){if(!this.alive||this.busy||this.finished||!this.ghost.idle)return;this.relay.help();if(this.asked){this.autoHelp=true;return;}this.asked=true;void this.ctx.say(this.relay.next==='reset'?'relay-woods.reset-hint':'relay-woods.hint');}
 autotouch():TouchIntent|null {
  if(!this.alive||this.busy||this.finished)return null;
  // Demo previews the level's distinctive choice using the same input handlers.
  if(this.ctx.demo){const l=this.relay.plan.level;
   const script=l===2?['A','S','B','R']:l===3?['A','S','B','R']:l===4?['B','C','R','A','R']:['A','R'];
   const id=script[this.demoStep];if(id){this.demoStep++;return {tap:{on:this.friends.get(id)!}};}
  }
  const n=this.relay.next;return {tap:{on:n==='reset'?this.reset:this.friends.get(n)!}};
 }
 update(dt:number){
  this.clock+=dt;if(this.wave)this.wave.rotation=matchMedia('(prefers-reduced-motion: reduce)').matches?0:Math.sin(this.clock*4)*.18;this.ghost.update(dt);if(this.autoHelp&&this.ghost.idle){const a=this.autotouch();if(a)this.ghost.start(a);}
  this.glow.clear();const r=this.relay;
  if(r.phase==='ready'&&(r.hints||r.plan.level===1)){const id=r.next,n=id==='reset'?this.boxes.reset:this.boxes.nodes[id];if(n)this.glow.roundRect(n.x-66,n.y-66,132,132,24).stroke({width:r.hints?5+Math.sin(this.clock*5):2,color:r.hints?swatch.yellow.fill:swatch.green.line});}
 }
 resize(v:View){
  this.generation++;this.release();this.ghost.stop();this.ctx.tw.kill(this.message);this.view=v;this.backdrop.resize(v);const r=this.relay;
  if(r.phase==='flying'){const result=r.settle();this.draw();this.arrival(result,this.generation);return;}
  this.draw();if(r.phase==='done'){this.busy=true;void this.finish(this.generation);}else if(r.phase==='retry'){this.busy=true;void this.retry(this.generation);}else{r.feedbackDone();this.busy=false;}
 }
 destroy(){this.alive=false;this.generation++;this.release();this.ghost.stop();this.ctx.tw.kill(this.message);this.relay.destroy();this.ctx.untrack(this.companion);window.removeEventListener('pointercancel',this.cancel,true);window.removeEventListener('blur',this.cancel);}
}
class RelayIcon extends WigglyIcon {constructor(){const c=mosaic(picture('flower'),76);c.addChild(new Graphics().moveTo(-60,55).lineTo(55,55).lineTo(40,40).stroke({width:7,color:wood.line}));super(c);}}
export const relayWoods:GameModule={id:'relay-woods',name:'Relay Woods',titleLine:'relay-woods.title',region:'tinker-lab',skills:['connections','route-planning','comparing-hops'],bands:['toddler','preschool','prek','school'],levels:b=>rangeFor(LEVELS,b),describeLevel:l=>NAMES[Math.max(0,Math.min(3,l-1))],music:STYLES.paint,touchDemo:true,coplayHint:'One person points out a path, the other taps. Swap roles.',offScreen:'With a grown-up, pass a drawn picture along a row of toy friends.',hubIcon:()=>new RelayIcon(),sticker:seed=>mosaic(picture(new Rng(seed).pick(['flower','cake','kite','portrait','tune'] as const)),80),create:ctx=>new RelayWoods(ctx)};
