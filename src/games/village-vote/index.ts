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
import { paw, toy } from './art';
import { Election, fixture, layout, NAMES, roundFor, type Option, type Point } from './logic';
const LEVELS:BandLevels={preschool:{min:1,max:2},prek:{min:1,max:3},school:{min:3,max:3}};
interface Control {node:Container;w:number;h:number;act:()=>void}
export class VillageVote implements Game {
 readonly election;readonly root=new Container();readonly board=new Container();readonly glow=new Graphics();readonly ghost;readonly companion;readonly backdrop;
 options:Container[]=[];boards:Container[]=[];friends=new Map<string,Container>();controls:Control[]=[];help!:Container;boxes;view:View;
 alive=true;busy=false;finished=false;private generation=0;private pending:{control:Control;pointer:number}|null=null;private asked=false;private replayed=false;private clock=0;
 get misses(){return this.election.misses;}get hints(){return this.election.hints;}
 private cancel=(e:Event)=>{if(e instanceof PointerEvent&&this.pending&&e.pointerId!==this.pending.pointer)return;this.release();};
 constructor(private ctx:GameContext){
  this.election=new Election(ctx.demo?fixture(ctx.level):roundFor(ctx.level,ctx.rng));this.view=ctx.view;this.boxes=layout(this.view,this.election);
  this.companion=ctx.companion();this.companion.eventMode='none';ctx.track(this.companion);
  this.backdrop=new Backdrop({sky:[0xffe2c4,cream],hills:[0xd8ecb0,0xbfe39a],horizon:.42,seed:127,clouds:2,sun:true},this.view);
  this.ghost=new GhostFinger(this.root,new EventBoundary(this.root));ctx.stage.addChild(this.backdrop,this.root);this.root.addChild(this.board,this.glow,this.companion,this.ghost.hand);this.glow.eventMode='none';
  window.addEventListener('pointercancel',this.cancel,true);window.addEventListener('blur',this.cancel);
 }
 start(){this.draw();this.instruct();}
 private instruct(){void this.ctx.instruct(this.election.phase==='preference'?'village-vote.preference':this.election.plan.level===3?'village-vote.three':this.election.plan.level===2?'village-vote.pet-count':'village-vote.two');}
 private release(){if(this.pending&&!this.pending.control.node.destroyed)this.pending.control.node.alpha=1;this.pending=null;}
 private button(p:Point,w:number,h:number,art:Container,act:()=>void){
  const n=new Container();n.position.set(p.x,p.y);n.addChild(new Graphics().roundRect(-w/2,-h/2,w,h,20).fill(cream).stroke({width:4,color:wood.line}),art);n.hitArea=new Rectangle(-w/2,-h/2,w,h);art.eventMode='none';
  const control={node:n,w,h,act};this.controls.push(control);this.board.addChild(n);
  onTap(n,e=>{if(!this.alive||this.busy||this.finished||this.pending)return;n.alpha=.68;this.pending={control,pointer:e.pointerId};});
  // onTap gives immediate down feedback; only a matching inside release commits the choice.
  n.on('pointerup',(e:FederatedPointerEvent)=>{if(this.pending?.control!==control||this.pending.pointer!==e.pointerId)return;const local=n.toLocal(e.global),inside=Math.abs(local.x)<=w/2&&Math.abs(local.y)<=h/2;this.release();if(inside&&this.alive&&!this.busy&&!this.finished)act();});
  n.on('pointerupoutside',(e:FederatedPointerEvent)=>{if(this.pending?.pointer===e.pointerId)this.release();});return n;
 }
 private clear(){this.release();this.companion.removeFromParent();for(const c of this.board.removeChildren())c.destroy({children:true});this.controls=[];this.friends.clear();this.options=[];this.boards=[];}
 private fitPet(p:Point){const b=this.companion.bodyBounds(),s=Math.min(74/b.width,80/b.height);this.companion.scale.set(s);this.companion.position.set(p.x-(b.x+b.width/2)*s,p.y-(b.y+b.height/2)*s);this.root.addChild(this.companion);}
 private draw(){
  this.clear();this.boxes=layout(this.view,this.election);const e=this.election;this.companion.visible=e.plan.level===2;
  if(e.phase==='playing'||e.phase==='done'){this.drawPlay();return;}
  e.plan.options.forEach((o,i)=>{
   const art=toy(o);art.y=-10;const name=label(o,21);name.y=44;art.addChild(name);this.options.push(this.button(this.boxes.options[i],180,120,art,()=>{void this.choose(o);}));
   const marks=new Container();const count=e.marks(o),actual=e.total(o);const numeral=label(String(count),32);numeral.position.set(-60,0);marks.addChild(numeral);
   const g=new Graphics();for(let j=0;j<count;j++)g.moveTo(-20+j*18,-16).lineTo(-20+j*18,16).stroke({width:5,color:ink});marks.addChild(g);
   const caption=label(count===actual?'all counted':'counted so far',17);caption.y=32;marks.addChild(caption);this.boards.push(this.button(this.boxes.boards[i],190,105,marks,()=>{void this.replay(o);}));
  });
  for(const v of e.voters){
   const art=new Container(),isPet=v.id==='pet';
   if(!isPet){const c=new Critter(CRITTERS[Number(v.id.split('-')[1])%2?'duck':'bunny']);c.alive=false;c.scale.set(.23);c.position.set(-12,35);c.eventMode='none';art.addChild(c);}
   const raised=paw();raised.position.set(30,-23);art.addChild(raised);
   if(e.counted.has(v.id))art.addChild(new Graphics().moveTo(-42,-35).lineTo(-33,-24).lineTo(-16,-44).stroke({width:6,color:swatch.green.line}));
   const n=this.button(this.boxes.voters[v.id],110,110,art,()=>{void this.count(v.id);});this.friends.set(v.id,n);if(isPet)this.fitPet(this.boxes.voters[v.id]);
  }
  if(e.phase==='preference')this.fitPet({x:90,y:420});
  const bulb=new Container();bulb.addChild(new Graphics().circle(0,-9,20).fill(swatch.yellow.fill).stroke({width:4,color:ink}).moveTo(-13,19).lineTo(13,19).stroke({width:6,color:ink}));
  this.help=this.button(this.boxes.help,110,110,bulb,()=>this.askForHint());
  this.root.addChild(this.glow,this.ghost.hand);
 }
 private async choose(o:Option){
  const e=this.election;
  if(e.phase==='preference'){
   const from={x:this.companion.x,y:this.companion.y};if(!e.choose(o))return;this.busy=true;const gen=this.generation;this.draw();const target={x:this.companion.x,y:this.companion.y};this.companion.position.set(from.x,from.y);await this.ctx.tw.to(this.companion,target,{duration:.5});
   if(!this.alive||gen!==this.generation)return;e.arrived();this.asked=false;this.busy=false;this.draw();this.instruct();return;
  }
  const result=e.declare(o);if(result==='ignored')return;this.busy=true;const gen=this.generation;
  if(result==='accepted'){
   this.draw();sfx.bell(5);void this.ctx.say('village-vote.result',{thing:e.winner});await this.sharedPlay(gen);return;
  }
  sfx.boing();this.draw();await this.ctx.say('village-vote.again');if(!this.alive||gen!==this.generation)return;
  await this.speakCounts(gen);if(!this.alive||gen!==this.generation)return;e.feedbackDone();this.busy=false;this.draw();
 }
 private async speakCounts(gen:number){for(const {option,total} of this.election.comparison()){if(!this.alive||gen!==this.generation)return;await this.ctx.say(total===0?'village-vote.empty':total===1?'village-vote.one':'village-vote.count',{n:total,thing:option});}}
 private async count(id:string){const r=this.election.count(id);if(!r)return;this.draw();await this.ctx.say(r.total===1?'village-vote.one':'village-vote.count',{n:r.total,thing:r.option});}
 private async replay(o:Option){if(this.election.phase!=='counting')return;this.replayed=true;const n=this.election.marks(o);await this.ctx.say(n===0?(this.election.total(o)===0?'village-vote.empty':'village-vote.zero'):n===1?'village-vote.one':'village-vote.count',{n,thing:o});}
 askForHint(){
  if(!this.alive||this.busy||this.finished||!this.ghost.idle)return;const e=this.election;e.help();
  if(this.asked){const target=e.phase==='preference'?this.options[0]:this.options[e.plan.options.indexOf(e.winner)];this.ghost.start({tap:{on:target}});return;}
  this.asked=true;if(e.phase==='preference'){void this.ctx.say('village-vote.free');return;}
  e.recount();this.draw();void this.showHint(this.generation);
 }
 private async showHint(gen:number){this.busy=true;await this.speakCounts(gen);if(!this.alive||gen!==this.generation)return;const e=this.election,other=e.plan.options.filter(o=>o!==e.winner).map(o=>e.total(o));await this.ctx.say(other.length===2?'village-vote.compare-three':'village-vote.compare-two',{n:e.total(e.winner),a:other[0],b:other[1]??0,thing:e.winner});if(this.alive&&gen===this.generation)this.busy=false;}
 private drawPlay(){
  const e=this.election,big=toy(e.winner);big.scale.set(2.3);big.position.set(this.view.w/2+50,300);this.board.addChild(big);
  const voters=[...e.voters].sort((a,b)=>Number(b.id==='pet')-Number(a.id==='pet'));
  voters.forEach((v,i)=>{const n=new Container(),p={x:300+(i%4)*180+(this.view.w-1024)/2,y:500+Math.floor(i/4)*150};n.position.set(p.x,p.y);n.eventMode='none';
   if(v.id==='pet')this.fitPet(p);else {const c=new Critter(CRITTERS[i%2?'duck':'bunny']);c.alive=false;c.scale.set(.3);c.y=45;n.addChild(c);}this.board.addChild(n);this.friends.set(v.id,n);
  });
 }
 private async sharedPlay(gen:number){
  const voters=[...this.election.voters].sort((a,b)=>Number(b.id==='pet')-Number(a.id==='pet'));
  for(const v of voters){if(!this.alive||gen!==this.generation)return;const n=v.id==='pet'?this.companion:this.friends.get(v.id)!;const x=n.x,y=n.y;await this.ctx.tw.to(n,{x:this.view.w/2+50,y:315},{duration:.22});if(!this.alive||gen!==this.generation)return;await this.ctx.tw.to(n,{x,y},{duration:.22});}
  if(!this.alive||gen!==this.generation||!this.election.complete())return;this.finished=true;this.ctx.finish({misses:this.misses,hints:this.hints});
 }
 autotouch():TouchIntent|null {
  if(!this.alive||this.busy||this.finished)return null;const e=this.election;if(e.phase==='preference')return {tap:{on:this.options[e.plan.options.findIndex(o=>o!==e.winner)]}};
  if(e.phase!=='counting')return null;
  const next=e.voters.find(v=>!e.counted.has(v.id));if(next)return {tap:{on:this.friends.get(next.id)!}};
  if(!this.replayed)return {tap:{on:this.boards[0]}};return {tap:{on:this.options[e.plan.options.indexOf(e.winner)]}};
 }
 update(dt:number){this.clock+=dt;this.ghost.update(dt);this.glow.clear();const e=this.election;if(e.glowing&&e.phase==='counting'){const p=this.boxes.options[e.plan.options.indexOf(e.winner)];this.glow.roundRect(p.x-96,p.y-66,192,132,22).stroke({width:6+Math.sin(this.clock*5),color:swatch.yellow.fill});}}
 resize(v:View){this.generation++;this.release();this.ghost.stop();this.ctx.tw.kill(this.companion);for(const n of this.friends.values())this.ctx.tw.kill(n);this.view=v;this.backdrop.resize(v);this.election.arrived();this.election.feedbackDone();this.busy=false;this.draw();if(this.election.phase==='playing'){this.busy=true;void this.sharedPlay(this.generation);}}
 destroy(){this.alive=false;this.generation++;this.release();this.ghost.stop();this.ctx.tw.kill(this.companion);for(const n of this.friends.values())this.ctx.tw.kill(n);this.ctx.untrack(this.companion);window.removeEventListener('pointercancel',this.cancel,true);window.removeEventListener('blur',this.cancel);}
}
class VoteIcon extends WigglyIcon{constructor(){const c=toy('slide'),p=paw();p.position.set(45,-65);c.addChild(p);super(c);}}
export const villageVote:GameModule={id:'village-vote',name:'Village Vote',titleLine:'village-vote.title',region:'cozy-village',skills:['counting','comparing','group-decisions'],bands:['preschool','prek','school'],levels:b=>rangeFor(LEVELS,b),describeLevel:l=>NAMES[Math.max(0,Math.min(2,l-1))],music:STYLES.paint,touchDemo:true,coplayHint:'Count aloud while she taps the paws, then swap roles. Choose freely for the pet.',offScreen:'With a grown-up, let toy friends choose between two toys and count their preferences.',hubIcon:()=>new VoteIcon(),sticker:seed=>toy(new Rng(seed).pick(['slide','swing','sandpit'] as const)),create:ctx=>new VillageVote(ctx)};
