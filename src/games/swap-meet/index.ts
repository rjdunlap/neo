import { Container, EventBoundary, Graphics, Rectangle } from 'pixi.js';
import { cream, ink, swatch, wood } from '../../art/palette';
import { Backdrop } from '../../art/scenery';
import { STYLES } from '../../audio/music';
import { sfx } from '../../audio/sfx';
import { draggable, type DragHandle } from '../../engine/drag';
import { GhostFinger } from '../../engine/ghost';
import { onTap } from '../../engine/input';
import { Rng } from '../../engine/random';
import type { View } from '../../engine/view';
import { rangeFor, type BandLevels } from '../../progress/difficulty';
import { RoundButton } from '../../ui/buttons';
import { arrowIcon, checkIcon } from '../../ui/icons';
import { WigglyIcon } from '../shared';
import type { Game, GameContext, GameModule, TouchIntent } from '../types';
import { friendArt, itemArt } from './art';
import { accepted, goal, hint, layout, NAMES, roundFor, start, step, Tally, type Action, type Friend, type Item, type Point } from './logic';
const LEVELS:BandLevels={toddler:{min:1,max:2},preschool:{min:2,max:3},prek:{min:3,max:4},school:{min:4,max:4}};
interface ObjectNode { source:Friend|number|null;item:Item;node:Container;drag?:DragHandle }
/** Round-local objects only. Transactions settle after both objects have visibly crossed. */
class SwapMeet implements Game {
 readonly round;state;readonly tally=new Tally();readonly root=new Container();readonly board=new Container();readonly toys=new Container();readonly glow=new Graphics();
 readonly undo:RoundButton;readonly help:RoundButton;readonly companion;readonly ghost;readonly backdrop;
 boxes;objects:ObjectNode[]=[];panels:Container[]=[];busy=false;finished=false;alive=true;
 private view:View;private clock=0;private cancelled=false;private owner:number|null=null;private hintTask='';private asked=false;private generation=0;
 get misses(){return this.tally.misses;}get hints(){return this.tally.hints;}
 private cancel=(e:Event)=>{if(e instanceof PointerEvent&&this.owner!==null&&e.pointerId!==this.owner)return;this.cancelled=true;};
 private outside=(e:PointerEvent)=>{if(this.owner!==null&&e.pointerId!==this.owner)return;const canvas=this.ctx.renderer.canvas,b=canvas.getBoundingClientRect();if(e.clientX<b.left||e.clientX>b.right||e.clientY<b.top||e.clientY>b.bottom)this.cancel(e);};
 constructor(private ctx:GameContext){
  this.round=roundFor(ctx.level,ctx.rng);this.state=start(this.round);this.view=ctx.view;this.boxes=layout(this.view,this.state.frame.friends.length,this.state.frame.basket.length);
  this.backdrop=new Backdrop({sky:[0xffe2c4,cream],hills:[swatch.green.light,0xbfe39a],horizon:.45,clouds:2,sun:true,seed:127},this.view);
  this.undo=new RoundButton(arrowIcon(-1),swatch.blue,50,()=>{void this.perform({undo:true});});
  const bulb=new Graphics().circle(0,-8,20).fill(swatch.yellow.fill).stroke({width:4,color:ink}).moveTo(-13,17).lineTo(13,17).moveTo(-10,28).lineTo(10,28).stroke({width:6,color:ink});
  this.help=new RoundButton(bulb,swatch.yellow,50,()=>this.askForHint());
  this.companion=ctx.companion();this.companion.scale.set(.36);this.companion.eventMode='none';ctx.track(this.companion);
  this.ghost=new GhostFinger(this.root,new EventBoundary(this.root));
  ctx.stage.addChild(this.backdrop,this.root);this.root.addChild(this.board,this.toys,this.glow,this.companion,this.undo,this.help,this.ghost.hand);this.glow.eventMode='none';
  // Capture precedes drag.ts's window fallback, which otherwise treats native cancel as a drop.
  window.addEventListener('pointercancel',this.cancel,true);window.addEventListener('pointerup',this.outside,true);window.addEventListener('blur',this.cancel);
 }
 start(){this.draw();this.instruct();}
 private instruct(){const f=this.state.frame.friends[0];if(this.round.level===1)void this.ctx.instruct('swap-meet.one',{friend:f.id,thing:f.want,returned:f.hold});else if(this.round.level===4)void this.ctx.instruct('swap-meet.four',{goal:this.round.goal!});else void this.ctx.instruct(this.round.level===2?'swap-meet.two':'swap-meet.three');}
 private at(source:Friend|number):Point{return typeof source==='number'?this.boxes.basket[source]:this.boxes.friends[this.state.frame.friends.findIndex(f=>f.id===source)];}
 private inspect(id:Friend){const f=this.state.frame.friends.find(f=>f.id===id)!;void this.ctx.say('swap-meet.inspect',{friend:id,thing:f.hold,want:f.want});}
 private clear(){this.owner=null;const kill=(n:Container)=>{this.ctx.tw.kill(n);this.ctx.tw.kill(n.scale);for(const child of n.children)kill(child);};for(const layer of [this.board,this.toys])kill(layer);for(const o of this.objects){o.drag?.destroy();this.ctx.tw.kill(o.node);this.ctx.tw.kill(o.node.scale);}this.objects=[];for(const layer of [this.board,this.toys])for(const n of layer.removeChildren())n.destroy({children:true});this.panels=[];}
 private object(item:Item,at:Point,source:Friend|number|null){
  const n=new Container();n.addChild(itemArt(item));n.hitArea=new Rectangle(-60,-60,120,120);n.position.set(at.x,at.y);this.toys.addChild(n);
  const o:ObjectNode={item,node:n,source};this.objects.push(o);
  if(source!==null){o.drag=draggable(n,this.ctx.tw,{onPick:()=>{this.cancelled=false;sfx.tick();if(typeof source==='string')this.inspect(source);else void this.ctx.say('swap-meet.object',{thing:item});},onDrop:(x,y)=>this.drop(o,x,y)});n.on('pointerdown',e=>{if(o.drag?.dragging&&this.owner===null)this.owner=e.pointerId;});}
  else n.eventMode='none';
 }
 private draw(){
  this.clear();this.board.visible=true;const f=this.state.frame;this.boxes=layout(this.view,f.friends.length,f.basket.length);
  f.friends.forEach((trader,i)=>{
   const at=this.boxes.friends[i],panel=new Container();panel.position.set(at.x,at.y);panel.addChild(new Graphics().roundRect(-75,-72,150,145,25).fill(trader.done?swatch.green.light:cream).stroke({width:5,color:trader.done?swatch.green.line:wood.line}));
   const face=friendArt(trader.id);face.position.set(-72,-45);if(trader.id==='frog')face.scale.set(.8);panel.addChild(face);
   const bubble=new Container();bubble.position.set(83,-79);bubble.addChild(new Graphics().roundRect(-51,-51,102,102,25).fill(0xffffff).stroke({width:4,color:swatch.blue.line}));const want=itemArt(trader.want);want.scale.set(.75);bubble.addChild(want);bubble.eventMode='none';panel.addChild(bubble);
   if(trader.done){const check=checkIcon(swatch.green.line);check.position.set(75,48);panel.addChild(check);}
   panel.hitArea=new Rectangle(-75,-72,150,145);onTap(panel,()=>this.inspect(trader.id),{cooldown:300});this.board.addChild(panel);this.panels.push(panel);
   this.object(trader.hold,at,this.round.level===3&&!trader.done?trader.id:null);
  });
  f.basket.forEach((slot,i)=>{const p=this.boxes.basket[i];const tray=new Graphics().roundRect(p.x-75,p.y-70,150,140,22).fill(wood.light).stroke({width:5,color:wood.line});tray.eventMode='none';this.board.addChild(tray);this.object(slot.hold,p,slot.active?i:null);});
  f.rewards.forEach((item,i)=>{const n=itemArt(item);n.scale.set(.42);n.position.set(this.boxes.rewards.x+i*75,this.boxes.rewards.y);this.board.addChild(n);});
  this.companion.visible=this.round.level===4;
  if(this.companion.visible){this.companion.position.set(this.boxes.goal.x-90,this.boxes.goal.y+45);const goalNode=itemArt(this.round.goal!);goalNode.position.set(this.boxes.goal.x,this.boxes.goal.y-35);this.board.addChild(new Graphics().roundRect(this.boxes.goal.x-62,this.boxes.goal.y-100,124,130,20).fill(cream).stroke({width:4,color:swatch.teal.line}),goalNode);}
  this.undo.position.set(this.boxes.undo.x,this.boxes.undo.y);this.undo.alpha=this.state.history.length?.95:.4;this.help.position.set(this.boxes.help.x,this.boxes.help.y);
 }
 private dragging(){return this.objects.some(o=>o.drag?.dragging);}
 private drop(o:ObjectNode,x:number,y:number):boolean {
  this.owner=null;
  if(!this.alive||this.busy||this.finished||this.cancelled||o.source===null)return false;
  const candidates=this.state.frame.friends.map((f,i)=>({f,at:this.boxes.friends[i]})).filter(({f,at})=>!f.done&&f.id!==o.source&&Math.abs(x-at.x)<=75&&Math.abs(y-at.y)<=72).sort((a,b)=>Math.hypot(x-a.at.x,y-a.at.y)-Math.hypot(x-b.at.x,y-b.at.y));
  const target=candidates[0]?.f;if(!target)return false;
  const a:Action={from:o.source,to:target.id};
  if(!accepted(this.round,this.state,a)){this.tally.reject(this.round,this.state);sfx.boing();const other=typeof o.source==='string'?this.state.frame.friends.find(f=>f.id===o.source):null;void this.ctx.say(other?'swap-meet.reciprocal':'swap-meet.reject',{friend:target.id,want:target.want,other:other?.id??'',otherWant:other?.want??''});return false;}
  void this.perform(a);return true;
 }
 private async perform(a:Action){
  if(!this.alive||this.busy||this.finished||this.dragging()||!accepted(this.round,this.state,a))return;
  this.busy=true;const gen=this.generation,next=step(this.round,this.state,a),before=this.state.frame;
  for(const o of this.objects)if(o.drag)o.drag.enabled=false;
  let motions:Promise<void>[]=[];
  if('undo'in a){
   // Exact predecessor locations, including an earlier level1 stage. Unused stage toys fade;
   // the two exchanging objects cross back before that stage is restored.
   const previous=next.frame;
   const priorStage=previous.stage!==before.stage;
   if(priorStage){
    this.board.visible=false;for(const n of this.toys.children)n.visible=false;
    const oldFriend=friendArt(previous.friends[0].id);oldFriend.position.set(this.boxes.friends[0].x-72,this.boxes.friends[0].y-45);this.toys.addChild(oldFriend);
    const original=previous.friends[0],slot=previous.basket.findIndex(b=>b.hold===original.want),home=this.boxes.basket[slot];
    const received=new Container();received.addChild(itemArt(original.hold));received.position.set(this.boxes.rewards.x+(before.rewards.length-1)*75,this.boxes.rewards.y);this.toys.addChild(received);
    const offered=new Container();offered.addChild(itemArt(original.want));offered.position.set(this.boxes.friends[0].x,this.boxes.friends[0].y);this.toys.addChild(offered);
    motions=[this.ctx.tw.to(received,{x:this.boxes.friends[0].x,y:this.boxes.friends[0].y},{duration:.6}),this.ctx.tw.to(offered,{x:home.x,y:home.y},{duration:.6})];
   }else motions=this.objects.map(o=>{let p:Point|undefined;const fi=previous.friends.findIndex(f=>f.hold===o.item);const bi=previous.basket.findIndex(b=>b.hold===o.item);if(fi>=0)p=this.boxes.friends[fi];if(bi>=0)p=this.boxes.basket[bi];return p?this.ctx.tw.to(o.node,p,{duration:.6}):Promise.resolve();});
   void this.ctx.say('swap-meet.undo');
  }else{
   const source=this.objects.find(o=>o.source===a.from)!,target=this.objects.find(o=>o.source===null&&o.item===before.friends.find(f=>f.id===a.to)!.hold)??this.objects.find(o=>o.source===a.to)!;
   const to=this.at(a.to),from=this.at(a.from);motions=[this.ctx.tw.to(source.node,to,{duration:.65}),this.ctx.tw.to(target.node,from,{duration:.65})];
   void this.ctx.say('swap-meet.accept',{thing:source.item,returned:target.item});sfx.bell(5);
  }
  await Promise.all(motions);if(!this.alive||gen!==this.generation)return;
  await this.ctx.tw.wait(.22);if(!this.alive||gen!==this.generation)return;
  this.state=next;this.tally.changed();this.asked=false;this.hintTask='';this.draw();this.busy=false;
  if(goal(this.round,this.state))void this.finish();else if(this.state.frame.stage!==before.stage)this.instruct();
 }
 private async finish(){
  if(this.finished||!this.alive)return;this.finished=true;this.busy=true;for(const o of this.objects)if(o.drag)o.drag.enabled=false;this.ctx.pet.cheer();
  if(this.round.level===4&&this.round.goal==='kite'){
   const kite=this.board.addChild(itemArt('kite'));kite.position.set(this.boxes.goal.x,this.boxes.goal.y-35);void this.ctx.tw.to(kite,{x:this.boxes.goal.x+70,y:this.boxes.goal.y-190},{duration:.8});await this.ctx.tw.wait(.8);
  }
  if(!this.alive)return;sfx.tada();await this.ctx.say(this.round.level===4?'swap-meet.goal':'swap-meet.done',{goal:this.round.goal??''});if(this.alive)this.ctx.finish({misses:this.misses,hints:this.hints});
 }
 askForHint(){
  if(!this.alive||this.busy||this.finished||this.dragging()||!this.ghost.idle)return;
  const key=JSON.stringify(hint(this.round,this.state));this.tally.help(this.round,this.state);
  const a=hint(this.round,this.state);if(!a)return;
  if(this.asked&&this.hintTask===key){const intent=this.autotouch();if(intent)this.ghost.start(intent);return;}
  this.asked=true;this.hintTask=key;
  if('undo'in a)void this.ctx.say('swap-meet.hint-undo');
  else if(typeof a.from==='string')void this.ctx.say('swap-meet.hint-pair',{friend:a.from,other:a.to});
  else void this.ctx.say('swap-meet.hint',{thing:this.state.frame.basket[a.from].hold,friend:a.to});
 }
 autotouch():TouchIntent|null {
  if(!this.alive||this.busy||this.finished||this.dragging())return null;
  const a=hint(this.round,this.state);if(!a)return null;
  if('undo'in a)return {tap:{on:this.undo}};
  const o=this.objects.find(o=>o.source===a.from),p=this.at(a.to);return o?{drag:{on:o.node},to:{on:this.toys,x:p.x,y:p.y}}:null;
 }
 update(dt:number){this.clock+=dt;this.ghost.update(dt);this.glow.clear();if(!this.tally.glowing||this.busy||this.finished)return;const a=hint(this.round,this.state);if(!a)return;const points='undo'in a?[this.boxes.undo]:[this.at(a.from),this.at(a.to)];for(const p of points)this.glow.roundRect(p.x-78,p.y-77,156,154,25).stroke({width:6+Math.sin(this.clock*5)*2,color:swatch.yellow.fill});}
 resize(v:View){
  this.view=v;this.backdrop.resize(v);if(!this.alive)return;
  // A resize cancels a pending gesture/animation without committing it or creating help/misses.
  this.generation++;this.ghost.stop();this.busy=false;this.draw();if(this.finished)this.busy=true;
 }
 destroy(){this.alive=false;this.generation++;this.ghost.stop();this.clear();this.ctx.untrack(this.companion);window.removeEventListener('pointercancel',this.cancel,true);window.removeEventListener('pointerup',this.outside,true);window.removeEventListener('blur',this.cancel);}
}
class SwapIcon extends WigglyIcon {constructor(){const c=new Container(),a=itemArt('leaf'),b=itemArt('shell');a.position.set(-48,-24);b.position.set(48,24);c.addChild(a,b,new Graphics().moveTo(-35,55).lineTo(38,55).lineTo(22,43).moveTo(38,-60).lineTo(-35,-60).lineTo(-19,-48).stroke({width:8,color:swatch.blue.line,cap:'round',join:'round'}));super(c);}}
export const swapMeet:GameModule={id:'swap-meet',name:'Swap Meet',titleLine:'swap-meet.title',region:'cozy-village',skills:['matching','reciprocal-exchange','sequencing'],bands:['toddler','preschool','prek','school'],levels:b=>rangeFor(LEVELS,b),describeLevel:l=>NAMES[Math.max(0,Math.min(3,l-1))],music:STYLES.paint,touchDemo:true,coplayHint:'Voice one friend’s pictured request while she chooses an offer, then exchange roles.',offScreen:'With a grown-up, each hold a toy and say which toy you would like to swap.',hubIcon:()=>new SwapIcon(),sticker:seed=>itemArt(new Rng(seed).pick(['leaf','shell','kite','flower'] as const)),create:ctx=>new SwapMeet(ctx)};
