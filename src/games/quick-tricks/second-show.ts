import {Circle,Container,Graphics} from 'pixi.js';
import {cream,swatch} from '../../art/palette';
import {sfx} from '../../audio/sfx';
import {draggable,type DragHandle} from '../../engine/drag';
import {spread,type View} from '../../engine/view';
import {RoundButton} from '../../ui/buttons';
import {againIcon,arrowIcon} from '../../ui/icons';
import {label} from '../../ui/text';
import type {Game,GameContext,TouchIntent} from '../types';
import {encoreFor,encoreMove,encoreRound,fitsParcel,type ParcelShape} from './second-logic';
function parcel(shape:ParcelShape){const g=new Graphics();
 const points=shape==='rectangle'?[-85,-45,85,-45,85,45,-85,45]:shape==='triangle'?[-75,60,0,-70,75,60]:[-70,-70,0,-70,0,0,70,0,70,70,-70,70];
 return g.poly(points).fill(swatch.orange.fill).stroke({width:6,color:swatch.brown.line,join:'round'});
}
function bowl(){return new Graphics().ellipse(0,5,55,28).fill(swatch.blue.fill).stroke({width:5,color:swatch.blue.line}).ellipse(0,-7,55,22).fill(cream).stroke({width:5,color:swatch.blue.line});}
export class SecondShow implements Game{
 private view: View;
 readonly plan;readonly round;step=0;waiting=false;finished=false;misses=0;hints=0;wrong=0;
 readonly layer=new Container();private readonly bg=new Graphics();private readonly glow=new Graphics();
 readonly next:RoundButton;readonly turn:RoundButton;readonly undo:RoundButton;readonly submit:RoundButton;
 parcel:Container|null=null;parcelArt:Graphics|null=null;turns=0;target={x:0,y:0};bowl:Container|null=null;readonly seats:{node:Container;filled:boolean}[]=[];
 readonly berry:RoundButton;berries=0;private readonly berryPicture=new Container();private drags:DragHandle[]=[];private clock=0;
 constructor(private readonly ctx:GameContext){
  this.view = ctx.view;
  this.plan=encoreFor(ctx.level);this.round=encoreRound(ctx.level,ctx.rng);
  ctx.stage.addChild(this.bg,this.layer,this.berryPicture,this.glow);this.glow.eventMode='none';
  this.next=new RoundButton(arrowIcon(1),swatch.green,50,()=>{if(!this.waiting)return;if(this.step===2){this.finished=true;ctx.finish({misses:this.misses,hints:this.hints});}else{this.step++;this.setup();}});
  this.turn=new RoundButton(againIcon(),swatch.blue,50,()=>{if(this.waiting||!this.parcelArt)return;this.turns=(this.turns+1)%4;this.parcelArt.rotation=this.turns*Math.PI/2;sfx.tick();});
  this.undo=new RoundButton(arrowIcon(-1),swatch.white,50,()=>{if(this.waiting)return;this.berries=Math.max(this.round.already,this.berries-1);this.drawBerries();});
  this.submit=new RoundButton(arrowIcon(1),swatch.yellow,50,()=>{
   if(this.waiting)return;if(this.step===1){if(this.seats.every(s=>s.filled))this.win();else this.miss('tricks.places-hint');}
   if(this.step===2){if(this.berries===this.plan.total)this.win();else this.miss('tricks.berries-hint');}
  });
  this.berry=new RoundButton(new Graphics().circle(0,0,24).fill(swatch.red.fill).ellipse(6,-24,15,6).fill(swatch.green.line),swatch.white,52,()=>{if(this.waiting)return;this.berries=Math.min(this.plan.total+2,this.berries+1);sfx.pop(6);this.drawBerries();});
  ctx.stage.addChild(this.next,this.turn,this.undo,this.submit,this.berry);
 }
 start(){this.setup();}
 private clear(){for(const d of this.drags)d.destroy();this.drags=[];for(const c of this.layer.removeChildren())c.destroy({children:true});this.parcel=this.parcelArt=null;this.bowl=null;this.seats.length=0;}
 private setup(){
  this.clear();this.waiting=false;this.wrong=0;this.glow.clear();
  if(this.step===0){
   const slot=parcel(this.plan.shape);slot.tint=swatch.purple.line;slot.alpha=.3;slot.rotation=this.round.turn*Math.PI/2;slot.label='slot';this.layer.addChild(slot);
   const n=new Container(),art=parcel(this.plan.shape);n.addChild(art);n.hitArea=new Circle(0,0,95);this.layer.addChild(n);this.parcel=n;this.parcelArt=art;
   const d=draggable(n,this.ctx.tw,{onPick:()=>sfx.tick(),onDrop:(x,y)=>{
    if(this.waiting)return false;if(Math.hypot(x-this.target.x,y-this.target.y)>115)return false;
    if(fitsParcel(this.plan.shape,this.turns,this.round.turn)){n.position.set(this.target.x,this.target.y);d.enabled=false;this.win();return true;}
    this.miss('tricks.parcel-hint');return false;
   }});this.drags.push(d);void this.ctx.instruct('tricks.parcel');
  }else if(this.step===1){
   for(let i=0;i<this.plan.friends;i++){const node=new Container();const face=new Graphics().circle(0,-85,42).fill(swatch.pink.fill).circle(-13,-90,5).circle(13,-90,5).fill(swatch.purple.line);face.moveTo(-14,-68).quadraticCurveTo(0,-54,14,-68).stroke({width:4,color:swatch.purple.line});node.addChild(face,new Graphics().ellipse(0,0,62,38).fill(cream).stroke({width:4,color:swatch.brown.line}));const filled=i<this.round.set;if(filled)node.addChild(bowl());this.layer.addChild(node);this.seats.push({node,filled});}
   const n=new Container();n.addChild(bowl());n.hitArea=new Circle(0,0,65);this.layer.addChild(n);this.bowl=n;
   this.drags.push(draggable(n,this.ctx.tw,{onPick:()=>sfx.tick(),onDrop:(x,y)=>{
    if(this.waiting)return false;const s=this.seats.find(s=>Math.hypot(x-s.node.x,y-s.node.y)<76);
    if(s&&!s.filled){s.filled=true;s.node.addChild(bowl());sfx.bell(6,.2);this.drawGlow();if(this.seats.every(s=>s.filled))this.win();}return false;
   }}));void this.ctx.instruct('tricks.places');
  }else{this.berries=this.round.already;void this.ctx.instruct('tricks.berries',{n:this.plan.total});}
  this.resize(this.view);
 }
 private miss(line:'tricks.parcel-hint'|'tricks.places-hint'|'tricks.berries-hint'){
  this.misses++;this.wrong++;if(this.wrong===2)this.hints++;sfx.boing();void this.ctx.say(line,{n:this.plan.total});this.drawGlow();
 }
 private win(){this.waiting=true;this.drags.forEach(d=>d.enabled=false);this.next.visible=true;this.submit.visible=false;this.glow.clear();sfx.sparkle();void this.ctx.say('tricks.encore-yes');}
 private drawBerries(){
  for(const c of this.berryPicture.removeChildren())c.destroy({children:true});if(this.step!==2)return;
  const n=label(String(this.plan.total),44);n.position.set(0,-160);this.berryPicture.addChild(n);
  for(let i=0;i<Math.max(this.plan.total,this.berries);i++){const g=new Graphics().circle(0,0,28).fill(i<this.berries?swatch.red.fill:cream).stroke({width:5,color:i<this.berries?swatch.red.line:swatch.brown.line});g.position.set((i%4-1.5)*85,Math.floor(i/4)*85);this.berryPicture.addChild(g);}
  this.drawGlow();
 }
 private drawGlow(){
  this.glow.clear();if(this.wrong<2||this.waiting)return;
  if(this.step===0){this.glow.circle(this.target.x,this.target.y,125).stroke({width:8,color:swatch.yellow.line});this.glow.circle(this.turn.x,this.turn.y,65).stroke({width:8,color:swatch.yellow.line});}
  if(this.step===1){const s=this.seats.find(s=>!s.filled);if(s)this.glow.circle(s.node.x,s.node.y,75).stroke({width:8,color:swatch.yellow.line});}
  if(this.step===2){const b=this.berries>this.plan.total?this.undo:this.berry;this.glow.circle(b.x,b.y,65).stroke({width:8,color:swatch.yellow.line});}
 }
 resize(v:View){
  this.view=v;
  this.bg.clear().rect(0,0,v.w,v.h).fill(cream).rect(0,0,110,v.h).fill(swatch.red.light).rect(v.w-110,0,110,v.h).fill(swatch.red.light);
  this.next.position.set(v.w-80,v.h-80);this.next.visible=this.waiting;this.submit.position.set(v.w-80,80);this.submit.visible=this.step>0&&!this.waiting;
  this.turn.position.set(v.w*.3,v.h-100);this.turn.visible=this.step===0;this.undo.position.set(v.w*.65,v.h-100);this.undo.visible=this.step===2;
  this.berry.position.set(v.w*.4,v.h-100);this.berry.visible=this.step===2;
  this.target={x:v.w*.68,y:v.h*.45};const slot=this.layer.children.find(c=>c.label==='slot');slot?.position.set(this.target.x,this.target.y);
  if(this.parcel){const home={x:v.w*.3,y:v.h*.45};this.drags[0].home=home;if(!this.drags[0].dragging)this.parcel.position.set(this.waiting?this.target.x:home.x,this.waiting?this.target.y:home.y);}
  const xs=spread(this.seats.length,180,v.w-100,190);this.seats.forEach((s,i)=>s.node.position.set(xs[i],v.h*.45));
  if(this.bowl){this.drags[0].home={x:v.w/2,y:v.h-100};if(!this.drags[0].dragging)this.bowl.position.set(v.w/2,v.h-100);}
  this.berryPicture.position.set(v.w/2,v.h*.45);this.drawBerries();this.drawGlow();
 }
 /** The ghost finger: turn the parcel and carry it to its slot, a bowl to each empty place, the berries asked for and then submit, and the arrow after each step. */
 autotouch():TouchIntent|null{
  if(this.finished)return null;
  const m=encoreMove(this.plan,this.round,{step:this.step as 0|1|2,waiting:this.waiting,turns:this.turns,seats:this.seats.map(s=>s.filled),berries:this.berries});
  switch(m?.do){
   case 'next':return {tap:{on:this.next}};
   case 'turn':return {tap:{on:this.turn}};
   case 'parcel':return this.parcel?{drag:{on:this.parcel},to:{on:this.layer,x:this.target.x,y:this.target.y}}:null;
   case 'bowl':return this.bowl?{drag:{on:this.bowl},to:{on:this.seats[m.seat].node}}:null;
   case 'berry':return {tap:{on:this.berry}};
   case 'undo':return {tap:{on:this.undo}};
   case 'submit':return {tap:{on:this.submit}};
   default:return null;
  }
 }
 update(dt:number){this.clock+=dt;this.glow.alpha=.7+.3*Math.sin(this.clock*4);if(this.waiting&&this.step===0&&this.parcel)this.parcel.scale.set(1+.04*Math.sin(this.clock*8));}
 destroy(){this.clear();}
}
