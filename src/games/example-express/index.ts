import {Container,Graphics,Rectangle,Text} from 'pixi.js';
import {cream,ink,swatch} from '../../art/palette';
import {STYLES} from '../../audio/music';
import {sfx} from '../../audio/sfx';
import {voice} from '../../audio/voice';
import type {LineId} from '../../content/voice-script';
import {onTap} from '../../engine/input';
import type {View} from '../../engine/view';
import {rangeFor,type BandLevels} from '../../progress/difficulty';
import {finish} from '../../ui/buttons';
import {WigglyIcon} from '../shared';
import type {Game,GameContext,GameModule,TouchIntent} from '../types';
import {Round,PARCELS,RULES,SHELF,requested,predict,solution,type Dock,type Trace,type Action} from './logic';
import {layout,type Box} from './layout';
import {dockArt,parcelArt,ruleArt,featureArt,emblem} from './art';
const LEVELS:BandLevels={school:{min:1,max:2}};
function text(value:string,size=23){const t=new Text({text:value,style:{fontFamily:'Nunito, sans-serif',fontSize:size,fontWeight:'800',fill:ink,align:'center'}});t.anchor.set(.5);t.eventMode='none';return t;}
function clear(c:Container){for(const n of c.removeChildren())n.destroy({children:true});}
class Button extends Container {
 readonly face=new Container();readonly pic=new Container();readonly caption:Text;readonly ring=new Graphics();
 constructor(label:string,fn:()=>void,w=140,h=100){super();this.addChild(finish({w,h,corner:18},swatch.blue,cream),this.face,this.ring);this.caption=text(label,21);this.caption.y=h/2-22;this.face.addChild(this.pic,this.caption);this.pic.y=-15;this.hitArea=new Rectangle(-w/2,-h/2,w,h);onTap(this,()=>{this.face.y=4;fn();});this.ring.eventMode='none';this.face.eventMode='none';}
 outline(on:boolean){this.ring.clear();if(on){const r=this.hitArea as Rectangle;this.ring.roundRect(r.x+3,r.y+3,r.width-6,r.height-6,16).stroke({color:swatch.orange.line,width:6});}}
}
type Panel='main'|'shelf'|'tray'|'tools';
interface Run {kind:'test'|'check'|'intro';traces:Trace[];index:number;time:number;speaking:boolean}
export class ExampleExpress implements Game {
 readonly round:Round;readonly root=new Container();readonly background=new Graphics();readonly pictures=new Container();
 readonly slots:Button[]=[];readonly shelf:Button[]=[];readonly docks:Button[]=[];readonly all:Button[]=[];
 readonly testButton:Button;readonly checkButton:Button;readonly examplesButton:Button;readonly toolsButton:Button;readonly helpButton:Button;
 readonly undoButton:Button;readonly resetButton:Button;readonly removeButton:Button;readonly backButton:Button;readonly sendButton:Button;readonly prevButton:Button;readonly nextButton:Button;readonly replayButton:Button;
 readonly finger=new Graphics();readonly mover=new Container();
 readonly hintLabel='Show me';readonly askForHint=()=>this.help();
 panel:Panel='main';selectedSlot:number|null=null;selectedParcel:number|null=null;testIndex=0;
 run:Run|null=null;helpRun:{action:Action;time:number;speaking:boolean}|null=null;opening=false;destroyed=false;finished=false;reaction:Trace|null=null;
 private boxes;private demoReplayed=false;
 get busy(){return this.opening||!!this.run||!!this.helpRun;}get misses(){return this.round.misses;}get hints(){return this.round.hints;}
 private readonly cancel=()=>this.stop();
 constructor(private ctx:GameContext){
  this.round=new Round(ctx.level);this.boxes=layout(ctx.view);ctx.stage.addChild(this.root);this.root.addChild(this.background,this.pictures);
  const button=(caption:string,fn:()=>void,w=140,h=100)=>{const b=new Button(caption,fn,w,h);this.all.push(b);this.root.addChild(b);return b;};
  for(let i=0;i<4;i++)this.slots.push(button('',()=>this.slot(i),136,128));
  for(const id of SHELF)this.shelf.push(button('',()=>{if(this.busy)return;this.selectedParcel=id;this.panel='main';void ctx.say('ee.placeExample');this.draw();},136,128));
  for(const dock of ['tree','house'] as const)this.docks.push(button(dock==='tree'?'Tree dock':'House dock',()=>this.label(dock),144,112));
  this.testButton=button('Test',()=>{if(!this.busy){if(!this.round.surpriseSeen)this.play('intro');else{this.panel='tray';this.reaction=null;void ctx.say('ee.test');this.draw();}}});
  this.checkButton=button('Check',()=>{if(this.round.qualified)this.delivered();else this.play('check');});
  this.examplesButton=button('Examples',()=>{if(!this.busy&&this.round.surpriseSeen){this.panel='shelf';this.selectedSlot=null;this.draw();void ctx.say('ee.shelf');}});
  this.toolsButton=button('Change',()=>{if(!this.busy){this.panel='tools';this.draw();void ctx.say('ee.tools');}});
  this.helpButton=button('Show me',()=>this.help());
  this.undoButton=button('Undo',()=>{if(!this.busy&&this.round.undo())this.edited('ee.undo');});
  this.resetButton=button('Reset',()=>{if(!this.busy&&this.round.reset())this.edited('ee.reset');});
  this.removeButton=button('Remove',()=>{if(!this.busy&&this.selectedSlot!==null&&this.round.level===2&&this.round.edit({slot:this.selectedSlot,example:null}))this.edited('ee.remove');});
  this.backButton=button('Back',()=>{if(!this.busy){this.panel='main';this.selectedParcel=null;this.draw();void ctx.say('ee.back');}});
  this.sendButton=button('Send',()=>{if(this.busy)this.stop();else this.play(this.round.surpriseSeen?'test':'intro');});
  this.prevButton=button('Previous',()=>this.browse(-1),100,100);this.nextButton=button('Next',()=>this.browse(1),100,100);
  this.replayButton=button('Hear rule',()=>this.speakRule(),100,100);
  this.root.addChild(this.mover,this.finger);this.mover.eventMode=this.finger.eventMode='none';
  window.addEventListener('pointercancel',this.cancel,true);window.addEventListener('blur',this.cancel);
  this.resize(ctx.view);
 }
 start(){this.opening=true;this.draw();void this.ctx.instruct(this.round.level===1?'ee.instruction1':'ee.instruction2').then(()=>{if(this.destroyed)return;this.opening=false;if(!this.round.surpriseSeen)this.play('intro');else this.draw();});}
 private speakRule(){const r=this.round.rule;void this.ctx.say(r===null?'ee.needs':`ee.rule${r}` as LineId);}
 private slot(i:number){
  if(this.busy||!this.round.surpriseSeen)return;
  if(i<2){void this.ctx.say('ee.locked');return;}
  if(this.round.level===2&&this.selectedParcel!==null){const id=this.selectedParcel;if(this.round.edit({slot:i,example:{id,dock:requested(id)}}))this.edited();return;}
  this.selectedSlot=i;this.selectedParcel=null;this.draw();void this.ctx.say(this.round.level===1?'ee.chooseDock':'ee.selected');
 }
 private label(dock:Dock){
  if(this.busy)return;
  if(this.panel==='tray'){void this.ctx.say(dock==='tree'?'ee.tree':'ee.house');return;}
  if(this.round.level!==1||this.selectedSlot===null){void this.ctx.say(dock==='tree'?'ee.tree':'ee.house');return;}
  const e=this.round.board[this.selectedSlot];if(e&&this.round.edit({slot:this.selectedSlot,example:{id:e.id,dock}}))this.edited();
 }
 private edited(line?:LineId){this.selectedSlot=null;this.selectedParcel=null;this.reaction=null;this.panel='main';this.draw();if(line)void this.ctx.say(line);else this.speakRule();}
 private browse(delta:number){if(this.busy)return;this.testIndex=(this.testIndex+delta+this.testTray.length)%this.testTray.length;this.reaction=null;this.draw();void this.ctx.say('ee.parcel',{color:PARCELS[this.testTray[this.testIndex]].color,shape:PARCELS[this.testTray[this.testIndex]].shape,stamp:PARCELS[this.testTray[this.testIndex]].stamp});}
 get testTray(){return this.round.level===1?[1,3]:[4,3,1,6];}
 private play(kind:Run['kind']){
  if(this.busy)return;
  const traces=this.round.begin(kind,kind==='intro'?4:this.testTray[this.testIndex]);if(!traces)return;
  voice.stop();this.reaction=null;this.panel='tray';this.run={kind,traces,index:0,time:0,speaking:false};this.draw();
 }
 stop(){
  if(this.run||this.helpRun)voice.stop();this.run=null;this.helpRun=null;this.round.stop();this.mover.visible=false;this.finger.visible=false;
  if(!this.destroyed)this.draw();
 }
 private help(){
  if(this.busy||this.finished)return;
  if(!this.round.surpriseSeen){this.play('intro');return;}
  const a=solution(this.round.level,this.round.board)[0];if(!a){void this.ctx.say('ee.checkNow');return;}
  this.helpRun={action:a,time:0,speaking:true};this.panel=this.round.level===2?'shelf':'main';this.selectedSlot=this.round.level===1?a.slot:null;this.draw();
  const help=this.helpRun,e=a.example!;void this.ctx.say(this.round.level===1?'ee.helpLabel':'ee.helpInsert',{color:PARCELS[e.id].color,shape:PARCELS[e.id].shape,stamp:PARCELS[e.id].stamp,dock:e.dock!}).then(()=>{if(!this.destroyed&&this.helpRun===help)help.speaking=false;});
 }
 private delivered(){if(this.busy)return;const result=this.round.finish();if(result){this.finished=true;this.ctx.finish(result);}}
 private missingSpeech(){const e=this.round.board.find(e=>e?.dock===null);return e?this.ctx.say('ee.missing',{color:PARCELS[e.id].color,shape:PARCELS[e.id].shape,stamp:PARCELS[e.id].stamp}):this.ctx.say('ee.needs');}
 private routeSpeech(t:Trace,failed=false){if(t.actual===null){return this.missingSpeech();}
  const p=PARCELS[t.id];return this.ctx.say(failed?'ee.failed':'ee.route',{color:p.color,shape:p.shape,stamp:p.stamp,actual:t.actual,required:t.required});}
 private put(b:Button,box:Box){b.position.set(box.x,box.y);}
 private icon(b:Button,kind:string){clear(b.pic);const g=new Graphics();const stroke={color:ink,width:4};
  if(kind==='test'||kind==='send')g.poly([-20,-19,22,0,-20,19]).fill(ink);
  else if(kind==='stop')g.rect(-18,-18,36,36).fill(ink);
  else if(kind==='check')g.rect(-27,-25,54,48).stroke(stroke).moveTo(-14,0).lineTo(-3,12).lineTo(20,-13).stroke(stroke);
  else if(kind==='finish')g.moveTo(-26,0).lineTo(-5,20).lineTo(28,-20).stroke({color:swatch.green.line,width:7});
  else if(kind==='back'||kind==='prev')g.moveTo(22,0).lineTo(-22,0).lineTo(-5,-18).moveTo(-22,0).lineTo(-5,18).stroke(stroke);
  else if(kind==='next')g.moveTo(-22,0).lineTo(22,0).lineTo(5,-18).moveTo(22,0).lineTo(5,18).stroke(stroke);
  else if(kind==='undo'||kind==='reset')g.arc(0,0,25,.4,5.1).lineTo(0,-24).moveTo(10,-23).lineTo(12,-7).stroke(stroke);
  else if(kind==='remove')g.rect(-24,-6,48,24).stroke(stroke).moveTo(0,5).lineTo(0,-26).lineTo(-10,-16).moveTo(0,-26).lineTo(10,-16).stroke(stroke);
  else if(kind==='help')g.circle(0,-14,8).fill(ink).moveTo(0,-5).lineTo(0,20).moveTo(-14,5).lineTo(0,14).lineTo(16,-2).stroke(stroke);
  else if(kind==='sound')g.poly([-25,-9,-12,-9,0,-22,0,22,-12,9,-25,9]).fill(ink).moveTo(10,-16).quadraticCurveTo(30,0,10,16).stroke(stroke);
  else for(const x of [-23,0,23])g.roundRect(x-7,-17,14,34,4).stroke(stroke);
  b.pic.addChild(g);
 }
 private draw(){
  if(this.destroyed)return;const l=this.boxes;this.all.forEach(b=>{b.visible=false;b.eventMode='none';b.outline(false);});clear(this.pictures);
  const show=(b:Button,box:Box,enabled=true)=>{this.put(b,box);b.visible=true;b.eventMode=enabled?'static':'none';b.alpha=enabled?1:.5;};
  const req=text('Request: circles to the tree • squares to the house',25);req.position.set(l.request.x,l.request.y-47);this.pictures.addChild(req);
  for(const [i,shape] of ['circle','square'].entries()){
   const x=l.request.x+(i?140:-140),s=featureArt('shape',shape,18),d=dockArt(i?'house':'tree',20);s.position.set(x-45,l.request.y);d.position.set(x+45,l.request.y);this.pictures.addChild(s,d,new Graphics().moveTo(x-15,l.request.y).lineTo(x+15,l.request.y).stroke({color:ink,width:3}));
  }
  const r=this.round.rule,cap=text(r===null?'Needs examples':`Sorter used ${RULES[r][0]}`,22);cap.position.set(l.rule.x,l.rule.y-45);this.pictures.addChild(cap);
  if(r!==null){const art=ruleArt(r);art.position.set(l.rule.x,l.rule.y);this.pictures.addChild(art);}
  show(this.replayButton,l.replay,!this.busy);this.icon(this.replayButton,'sound');
  if(this.panel==='main'){
   this.slots.forEach((b,i)=>{
    show(b,l.slots[i],!this.busy);clear(b.pic);const e=this.round.board[i];b.caption.text=i<2?'Fixed':e?.dock===null?'Choose dock':e?'Example':'Open slot';
    if(e){const p=parcelArt(e.id,27);p.x=-23;b.pic.addChild(p);if(e.dock){const d=dockArt(e.dock,19);d.position.set(35,8);b.pic.addChild(d);}else{const q=text('?',29);q.x=37;b.pic.addChild(q);}if(e.dock!==null&&r!==null&&predict(r,e.id)!==e.dock){const warn=text('↔',25);warn.position.set(0,-42);b.pic.addChild(warn);}}
    b.outline(this.selectedSlot===i||this.round.glow?.slot===i);
   });
   if(this.round.level===1)this.docks.forEach((b,i)=>{show(b,l.docks[i],!this.busy);clear(b.pic);b.pic.addChild(dockArt(i?'house':'tree'));});
   else{show(this.examplesButton,l.docks[0],!this.busy&&this.round.surpriseSeen);this.icon(this.examplesButton,'examples');if(this.selectedParcel!==null){const p=parcelArt(this.selectedParcel,34);p.position.set(l.docks[1].x,l.docks[1].y);this.pictures.addChild(p);const caption=text('Tap an open slot',21);caption.position.set(l.docks[1].x,l.docks[1].y+60);this.pictures.addChild(caption);}}
   [this.testButton,this.checkButton,this.toolsButton,this.helpButton].forEach((b,i)=>show(b,l.controls[i],!this.busy&&(i!==1||this.round.surpriseSeen)));
   this.checkButton.caption.text=this.round.qualified?'All delivered':'Check';this.icon(this.testButton,'test');this.icon(this.checkButton,this.round.qualified?'finish':'check');this.icon(this.toolsButton,'tools');this.icon(this.helpButton,'help');
  }else if(this.panel==='shelf'){
   this.shelf.forEach((b,i)=>{const id=SHELF[i],used=this.round.board.some(e=>e?.id===id);show(b,l.shelf[i],!this.busy&&!used);clear(b.pic);const p=parcelArt(id,28);p.x=-22;const d=dockArt(requested(id),20);d.position.set(35,8);b.pic.addChild(p,d);b.caption.text=used?'In lesson':'Add example';b.outline(this.round.glow?.example?.id===id);});
   const caption=text('Choose an example, then a slot',25);caption.position.set(l.request.x,l.docks[0].y);this.pictures.addChild(caption);show(this.backButton,l.controls[2],!this.busy);this.icon(this.backButton,'back');
  }else if(this.panel==='tools'){
   [this.undoButton,this.resetButton,this.removeButton,this.backButton].forEach((b,i)=>show(b,l.tools[i],!this.busy));
   this.removeButton.eventMode=this.round.level===2&&this.selectedSlot!==null?'static':'none';this.removeButton.alpha=this.removeButton.eventMode==='none'?.4:1;
   this.icon(this.undoButton,'undo');this.icon(this.resetButton,'reset');this.icon(this.removeButton,'remove');this.icon(this.backButton,'back');
  }else{
   const trace=this.run?.traces[this.run.index]??this.reaction;const id=trace?.id??this.testTray[this.testIndex];
   if(!this.run){const p=parcelArt(id,45);p.position.set(l.parcel.x,l.parcel.y);this.pictures.addChild(p);}
   this.docks.forEach((b,i)=>{show(b,l.docks[i],!this.busy);clear(b.pic);b.pic.addChild(dockArt(i?'house':'tree',30));b.outline(trace?.actual===(i?'house':'tree'));});
   if(trace){const status=text(trace.actual===null?'An example needs a dock':`Sorter → ${trace.actual} • Request → ${trace.required}`,23);status.position.set(l.parcel.x,l.docks[0].y+86);this.pictures.addChild(status);
    const required=dockArt(trace.required,16);required.position.set(l.parcel.x,l.docks[0].y+45);this.pictures.addChild(required);}
   this.testTray.forEach((_,i)=>this.pictures.addChild(new Graphics().circle(l.parcel.x+(i-(this.testTray.length-1)/2)*22,l.parcel.y+88,5).fill(i===(this.run?.index??this.testIndex)?ink:swatch.blue.fill)));
   show(this.prevButton,l.prev,!this.busy&&this.round.surpriseSeen);show(this.nextButton,l.next,!this.busy&&this.round.surpriseSeen);this.icon(this.prevButton,'prev');this.icon(this.nextButton,'next');
   show(this.sendButton,l.controls[1],!this.opening);show(this.backButton,l.controls[2],!this.busy);this.sendButton.caption.text=this.busy?'Stop':'Send';this.icon(this.sendButton,this.busy?'stop':'send');this.icon(this.backButton,'back');
  }
  this.mover.visible=!!this.run;this.finger.visible=!!this.helpRun;
  if(this.helpRun){this.checkButton.visible=false;show(this.sendButton,l.controls[1]);this.sendButton.caption.text='Stop';this.icon(this.sendButton,'stop');}
 }
 update(dt:number){
  if(this.destroyed)return;for(const b of this.all)b.face.y=Math.max(0,b.face.y-dt*25);
  if(this.helpRun){const h=this.helpRun;h.time+=dt;const a=h.action,e=a.example!,l=this.boxes;
   if(this.round.level===2&&h.time>=.8&&this.panel==='shelf'){this.panel='main';this.selectedParcel=e.id;this.draw();}
   const start=this.round.level===1?l.slots[a.slot]:l.shelf[SHELF.indexOf(e.id as typeof SHELF[number])];
   const end=this.round.level===1?l.docks[e.dock==='tree'?0:1]:l.slots[a.slot];const t=Math.min(1,Math.max(0,(h.time-.7)/1.1));
   this.finger.clear().circle(start.x+(end.x-start.x)*t,start.y+(end.y-start.y)*t,17).fill({color:cream,alpha:.9}).stroke({color:ink,width:4});
   if(h.time>=2.5&&!h.speaking){this.helpRun=null;this.round.help();this.edited();}return;
  }
  const run=this.run;if(!run)return;run.time+=dt;const trace=run.traces[run.index],l=this.boxes;
  clear(this.mover);const p=parcelArt(trace.id,40);this.mover.addChild(p);
  const end=trace.actual===null?l.parcel:l.docks[trace.actual==='tree'?0:1],t=Math.min(1,run.time/1.1);
  this.mover.position.set(l.parcel.x+(end.x-l.parcel.x)*t,l.parcel.y+(end.y-l.parcel.y)*t);
  if(run.time-dt<1.1&&run.time>=1.1){this.reaction=trace;this.draw();run.speaking=true;void this.routeSpeech(trace).then(()=>{if(!this.destroyed&&this.run===run)run.speaking=false;});}
  if(run.time<3||run.speaking)return;
  if(run.index<run.traces.length-1){run.index++;run.time=0;this.draw();return;}
  this.run=null;const result=this.round.complete();this.draw();
  if(result?.kind==='check'){
   if(result.ok){void this.ctx.say('ee.success');}
   else{this.reaction=result.first;sfx.boing();this.draw();if(result.first)void this.routeSpeech(result.first,true);else{this.panel='main';this.selectedSlot=this.round.board.findIndex(e=>e?.dock===null);this.draw();void this.missingSpeech();}}
  }else if(result?.kind==='intro')void this.ctx.say('ee.surprise');
 }
 resize(view:View){this.stop();this.boxes=layout(view);this.background.clear().rect(0,0,view.w,view.h).fill(swatch.teal.light);this.draw();}
 autotouch():TouchIntent|null {
  if(this.busy||this.finished)return null;
  if(!this.round.surpriseSeen)return {tap:{on:this.testButton}};
  if(this.round.qualified){if(this.panel!=='main')return {tap:{on:this.backButton}};return {tap:{on:this.checkButton}};}
  const action=this.round.level===2&&this.round.board.slice(2).every(e=>e===null)?{slot:2,example:{id:4,dock:requested(4)}}:solution(this.round.level,this.round.board)[0];
  if(action){
   if(this.round.level===1){if(this.panel!=='main')return {tap:{on:this.backButton}};if(this.selectedSlot!==action.slot)return {tap:{on:this.slots[action.slot]}};return {tap:{on:this.docks[action.example!.dock==='tree'?0:1]}};}
   if(this.selectedParcel===action.example!.id)return {tap:{on:this.slots[action.slot]}};
   if(this.panel==='shelf')return {tap:{on:this.shelf[SHELF.indexOf(action.example!.id as typeof SHELF[number])]}};
   if(this.panel!=='main')return {tap:{on:this.backButton}};return {tap:{on:this.examplesButton}};
  }
  if(this.round.level===2&&!this.demoReplayed){if(this.panel!=='tray')return {tap:{on:this.testButton}};if(this.round.tests===0)return {tap:{on:this.sendButton}};this.demoReplayed=true;return {tap:{on:this.backButton}};}
  if(this.panel!=='main')return {tap:{on:this.backButton}};return {tap:{on:this.checkButton}};
 }
 destroy(){this.destroyed=true;this.round.destroy();this.run=null;this.helpRun=null;window.removeEventListener('pointercancel',this.cancel,true);window.removeEventListener('blur',this.cancel);}
}
export const exampleExpress:GameModule={id:'example-express',name:'Example Express',titleLine:'ee.title',region:'tinker-lab',skills:['changing labelled examples','observing a fitted rule','testing and revising'],bands:['school'],levels:b=>rangeFor(LEVELS,b),describeLevel:l=>l<=1?'Show, then send: label two examples and check fresh parcels':'A surprising parcel: repair a color rule with examples',music:STYLES.quiet,touchDemo:true,coplayHint:'One person chooses an example, the other chooses a practice parcel. Watch the route, then swap.',hubIcon:()=>new WigglyIcon(emblem()),sticker:()=>emblem(),create:ctx=>new ExampleExpress(ctx)};
