import { Container, Graphics, Rectangle, Text } from 'pixi.js';
import { Critter, CRITTERS } from '../../art/critter';
import { cream, grass, ink, swatch, wood } from '../../art/palette';
import { STYLES } from '../../audio/music';
import { sfx } from '../../audio/sfx';
import type { LineId } from '../../content/voice-script';
import { draggable, type DragHandle } from '../../engine/drag';
import { onTap } from '../../engine/input';
import type { View } from '../../engine/view';
import { rangeFor, type BandLevels } from '../../progress/difficulty';
import { WigglyIcon } from '../shared';
import type { Game, GameContext, GameModule, TouchIntent } from '../types';
import { compatible, copy, evaluate, parts, planFor, presentation, repair, Round, type Part, type Repair, type Result, type Visitor } from './logic';
import { layout, type Box } from './layout';
const LEVELS: BandLevels = { toddler:{min:1,max:2},preschool:{min:1,max:3},prek:{min:2,max:4},school:{min:3,max:4} };
const names: Record<Part,string>={gentle:'Ramp',step:'Step',narrow:'Narrow door',wide:'Wide door'};
const lines: Record<Part,LineId>={gentle:'ww.partRamp',step:'ww.partStep',narrow:'ww.partNarrow',wide:'ww.partWide'};
function label(text:string,y:number,size=23) { const t=new Text({text,style:{fontFamily:'Nunito, sans-serif',fontSize:size,fontWeight:'800',fill:ink,align:'center'}}); t.anchor.set(.5); t.y=y; t.eventMode='none'; return t; }
function partArt(part:Part, width=112, rise=44):Graphics {
  const g=new Graphics(); g.eventMode='none';
  if(part==='gentle') g.poly([-width/2,rise/2,width/2,-rise/2,width/2,rise/2]).fill(wood.fill).stroke({width:5,color:wood.line,join:'round'});
  else if(part==='step') g.rect(-width/2,-rise/2,width,rise).fill(wood.fill).stroke({width:5,color:wood.line});
  else { const aperture=part==='wide'?96:50; g.roundRect(-60,-48,120,96,12).fill(wood.fill).stroke({width:4,color:wood.line}); g.rect(-aperture/2,-38,aperture,86).fill(ink); }
  return g;
}
function visitor(kind:Visitor):Critter { const c=new Critter(kind==='roly'?{color:'teal',ears:'none',belly:true}:CRITTERS[kind]); c.scale.set(kind==='bear'?.4:.29,kind==='bear'?.34:.29); c.eventMode='none'; return c; }
class Pad extends Container {
  readonly face=new Container();
  readonly rim=new Graphics();
  constructor(readonly w:number,readonly h:number, text:string, fn:()=>void, background=true) {
    super(); const bg=new Graphics().roundRect(-w/2,-h/2,w,h,22).fill(cream).stroke({width:4,color:wood.line}); bg.eventMode='none'; bg.visible=background; this.addChild(bg,this.face,this.rim); this.rim.eventMode='none';
    if(text) this.face.addChild(label(text,0));
    this.hitArea=new Rectangle(-w/2,-h/2,w,h);
    onTap(this,()=>{ this.alpha=.72; fn(); });
  }
  outline(on:boolean,color=swatch.yellow.fill) { this.rim.clear(); if(on) this.rim.roundRect(-this.w/2+3,-this.h/2+3,this.w-6,this.h-6,20).stroke({width:7,color}); }
}
export class WelcomeWays implements Game {
  readonly plan;
  readonly round;
  readonly root=new Container();
  readonly scenery=new Graphics();
  readonly boardArt=new Graphics();
  readonly slots:Pad[]=[];
  readonly trays=new Map<Part,Pad>();
  readonly handles:DragHandle[]=[];
  readonly visitors:Pad[]=[];
  readonly actors:Critter[]=[];
  readonly waves:Graphics[]=[];
  readonly tryButton:Pad;
  readonly undoButton:Pad;
  readonly removeButton:Pad;
  readonly hintButton:Pad;
  readonly choices:Part[];
  selectedPart:Part|null=null;
  selectedSocket:number|null=null;
  suggestion:Repair|null=null;
  stopSocket:number|null=null;
  busy=false;
  destroyed=false;
  finished=false;
  tries=0;
  private cancelled=false;
  private run:{ result:Result; snapshot:ReturnType<typeof copy>; elapsed:number; duration:number; end:number; phase:'walk'|'pause'|'finish' }|null=null;
  private boxes:ReturnType<typeof layout>;
  private demonstrated=false;
  private clock=0;
  constructor(private ctx:GameContext) {
    this.plan=planFor(ctx.level); this.round=new Round(this.plan); this.choices=presentation(this.plan,ctx.rng); this.boxes=layout(ctx.view,this.plan.rises,this.choices.length,this.plan.visitors.length);
    ctx.stage.addChild(this.root); this.root.addChild(this.scenery,this.boardArt);
    this.scenery.eventMode='static'; this.scenery.hitArea=new Rectangle(0,0,ctx.view.w,ctx.view.h);
    onTap(this.scenery,()=>{ if(!this.busy) { this.selectedPart=null;this.selectedSocket=null;this.draw(); } });
    for(let i=0;i<=this.plan.rises;i++) { const slot=new Pad(i===this.plan.rises?144:160,i===this.plan.rises?200:160,'',()=>this.tapSocket(i),false); this.slots.push(slot); this.root.addChild(slot); }
    for(const part of this.choices) {
      const pad=new Pad(144,144,'',()=>{}); pad.removeAllListeners();
      const art=partArt(part); art.y=-12; pad.face.addChild(art,label(names[part],51,21)); this.root.addChild(pad); this.trays.set(part,pad);
      const handle=draggable(pad,ctx.tw,{
        onPick:()=>{this.cancelled=false;this.selectedPart=part;this.selectedSocket=null;void ctx.say(lines[part]);this.draw();},
        onDrop:(x,y)=>{
          const cancelled=this.cancelled;this.cancelled=false;
          if(!cancelled&&!this.busy&&!this.destroyed) {
            const targets=this.boxes.sockets.map((b,socket)=>({b,socket,d:Math.hypot(x-b.x,y-b.y)})).filter(t=>compatible(this.plan,t.socket,part)&&Math.abs(x-t.b.x)<=t.b.w/2+32&&Math.abs(y-t.b.y)<=t.b.h/2+32).sort((a,b)=>a.d-b.d);
            if(targets[0]) this.edit(targets[0].socket,part);
          }
          return false;
        },
      }); this.handles.push(handle);
    }
    this.plan.visitors.forEach(kind=>{
      const card=new Pad(144,144,'',()=>{if(!this.busy) void ctx.say(`ww.${kind}`);});
      const toy=visitor(kind);toy.position.set(0,33);card.face.addChild(toy,label(kind==='roly'?'Roly':kind==='bunny'?'Bunny':'Bear',57,20));
      // Need pictograms remain visible without reading or colour: ramp, step+ramp, wide aperture.
      const need=partArt(kind==='bear'?'wide':'gentle',55,22); need.scale.set(.35);need.position.set(45,-43);card.face.addChild(need);
      if(kind==='bunny'){const step=partArt('step',55,22);step.scale.set(.35);step.position.set(22,-43);card.face.addChild(step);}
      this.visitors.push(card);this.root.addChild(card);
      const actor=ctx.track(visitor(kind));this.actors.push(actor);this.root.addChild(actor);
      const wave=new Graphics().moveTo(0,0).lineTo(12,-20).stroke({width:9,color:actor.sw.line,cap:'round'}).circle(12,-22,8).fill(actor.sw.fill);wave.eventMode='none';wave.visible=false;this.waves.push(wave);this.root.addChild(wave);
    });
    this.tryButton=new Pad(144,144,'Try  ▶',()=>this.try());
    this.undoButton=new Pad(120,120,'↶ Undo',()=>{if(!this.busy){this.round.undo();this.clearEvidence();this.draw();void ctx.say('ww.undo');}});
    this.removeButton=new Pad(120,120,'− Out',()=>{if(!this.busy&&this.selectedSocket!==null) this.edit(this.selectedSocket,null);});
    this.hintButton=new Pad(120,120,'',()=>this.askForHint());
    this.hintButton.face.addChild(new Graphics().circle(0,-18,18).fill(swatch.yellow.fill).stroke({width:4,color:ink}).rect(-9,0,18,10).fill(ink),label('Show me',34,20));
    this.root.addChild(this.tryButton,this.undoButton,this.removeButton,this.hintButton);
    window.addEventListener('pointercancel',this.cancelDrag,true);
    window.addEventListener('blur',this.cancelDrag);
    this.resize(ctx.view);this.draw();
  }
  private cancelDrag=()=>{this.cancelled=true;};
  start(){void this.ctx.instruct((['ww.one','ww.two','ww.three','ww.four'] as const)[this.plan.level-1]);}
  private clearEvidence(){this.suggestion=null;this.stopSocket=null;this.actors.forEach(a=>a.visible=false);this.waves.forEach(a=>a.visible=false);}
  private edit(socket:number,part:Part|null){ if(this.busy||this.destroyed)return; if(this.round.edit(socket,part)){this.clearEvidence();sfx.pluck(3,.15);} this.selectedSocket=socket;this.selectedPart=null;this.draw(); }
  private tapSocket(socket:number){
    if(this.busy||this.destroyed)return;
    if(this.selectedPart&&compatible(this.plan,socket,this.selectedPart)) this.edit(socket,this.selectedPart);
    else {this.selectedSocket=socket;this.selectedPart=null; if(parts(this.round.design)[socket]&&(socket<this.plan.rises||this.plan.doorEditable)) void this.ctx.say('ww.remove');this.draw();}
  }
  hintLabel='Show me';
  askForHint(){if(this.busy||this.finished||this.destroyed)return;this.showSuggestion(this.round.help());}
  private showSuggestion(r:Repair|null){this.suggestion=r;this.draw();void this.ctx.say(!r?'ww.ready':r.part==='gentle'?'ww.hintRamp':'ww.hintDoor');}
  try(){
    if(this.busy||this.finished||this.destroyed||this.handles.some(h=>h.dragging))return;
    this.clearEvidence();this.selectedPart=null;this.selectedSocket=null;this.busy=true;this.tries++;void this.ctx.say('ww.try');
    this.handles.forEach(h=>h.enabled=false);
    const snapshot=copy(this.round.design),result=evaluate(this.plan,snapshot);
    const count=result.stop?result.arrived.length+1:this.plan.visitors.length;
    this.run={snapshot,result,elapsed:0,duration:1.6*count,end:count,phase:'walk'};
    this.draw();this.positionActors();
  }
  private positionActors(){
    const run=this.run;if(!run)return;
    const l=this.boxes;const start=l.sockets[0].x-155;const ground=l.boardY+70;
    this.actors.forEach((actor,i)=>{
      const t=Math.max(0,Math.min(1,(run.elapsed-i*1.6)/1.6));actor.visible=i<run.end&&run.elapsed>=i*1.6;
      const stopped=run.result.stop&&i===run.result.arrived.length;
      const end=stopped?l.sockets[run.result.stop!.socket].x-(run.result.stop!.socket===this.plan.rises?65:75):l.left+865+i*27;
      const x=start+(end-start)*t;let rise=0;
      run.snapshot.rises.forEach((part,j)=>{const left=l.sockets[j].x-80; if(x>=left)rise+=part==='gentle'?44*Math.min(1,(x-left)/160):part==='step'?44:0;});
      const kind=this.plan.visitors[i];const motion=t>0&&t<1?(kind==='bunny'?-Math.abs(Math.sin(t*Math.PI*5))*24:Math.sin(t*Math.PI*8)*3):0;
      const inWindow=t===1&&!stopped;
      actor.position.set(inWindow?l.left+875+i*75:x,inWindow?ground-44*this.plan.rises-62:ground-rise+motion);
      const wave=this.waves[i];wave.visible=actor.visible&&inWindow;wave.position.set(actor.x+28,actor.y-30);wave.rotation=Math.sin(this.clock*7)*.3;
    });
  }
  update(dt:number){
    if(this.destroyed)return;this.clock+=dt;
    for(const pad of [...this.slots,...this.trays.values(),...this.visitors,this.tryButton,this.undoButton,this.removeButton,this.hintButton]) pad.alpha=Math.min(1,pad.alpha+dt*2);
    const pulse=.65+.35*Math.sin(this.clock*5); if(this.suggestion){this.slots[this.suggestion.socket].rim.alpha=pulse;this.trays.get(this.suggestion.part)!.rim.alpha=pulse;} if(this.stopSocket!==null)this.slots[this.stopSocket].rim.alpha=pulse;
    const run=this.run;if(!run)return;
    if(run.phase==='walk'){
      run.elapsed=Math.min(run.duration,run.elapsed+dt);this.positionActors();
      if(run.elapsed>=run.duration){
        if(run.result.stop){run.phase='pause';this.stopSocket=run.result.stop.socket;sfx.boing();this.draw();
          const reason=run.result.stop.reason;
          void this.ctx.say(({gap:'ww.gap',needsRamp:'ww.ramp',needsDoor:'ww.door',needsWide:'ww.wide'} as const)[reason]).then(()=>{if(!this.destroyed&&this.run===run)run.phase='finish';});
        } else {run.phase='pause';sfx.bell(7,.2);void this.ctx.say('ww.done').then(()=>{if(!this.destroyed&&this.run===run)run.phase='finish';});}
      }
    }
    this.positionActors();
    if(run.phase==='finish'){
      const outcome=this.round.complete(run.result);this.run=null;this.busy=false;this.handles.forEach(h=>h.enabled=true);
      if(outcome.finish){this.finished=true;this.ctx.finish({misses:0,hints:this.round.hints});}
      else {this.actors.forEach(a=>a.visible=false);this.waves.forEach(a=>a.visible=false);if(outcome.suggestion)this.showSuggestion(outcome.suggestion);this.draw();}
    }
  }
  private draw(){
    const l=this.boxes;this.boardArt.clear();this.boardArt.eventMode='none';
    const ground=l.boardY+70,doorBase=ground-44*this.plan.rises;
    this.boardArt.roundRect(l.left+690,doorBase-182,315,182,14).fill(swatch.yellow.light).stroke({width:5,color:wood.line});
    this.boardArt.roundRect(l.left+810,doorBase-175,190,105,10).fill(swatch.blue.fill).stroke({width:5,color:wood.line});
    this.boardArt.poly([l.left+670,doorBase-180,l.left+845,doorBase-265,l.left+1020,doorBase-180]).fill(swatch.orange.fill).stroke({width:5,color:wood.line});
    // The frame stays at the final height; a landing connects the last rise to it.
    const end=l.sockets[this.plan.rises-1].x+80;
    this.boardArt.rect(end,doorBase,l.left+950-end,12).fill(wood.fill);
    this.slots.forEach((slot,i)=>{
      for(const c of slot.face.removeChildren())c.destroy();
      const part=parts(this.round.design)[i];
      if(i<this.plan.rises){
        // Remove the flat card fill: wood geometry itself carries the rise; dotted cells show the footprint.
        const y=ground-44*i-slot.y;
        const area=new Graphics().rect(-80,y-88,160,88).fill({color:swatch.blue.light,alpha:.35}).stroke({width:2,color:swatch.blue.line});area.eventMode='none';slot.face.addChild(area);
        if(part){const art=partArt(part,160,44);art.y=y-22;slot.face.addChild(art);}
        else slot.face.addChild(label('+',y-38,38));
      }else{
        const y=doorBase-slot.y; const frame=new Graphics().roundRect(-64,y-128,128,128,10).fill(wood.light).stroke({width:4,color:wood.line});frame.eventMode='none';slot.face.addChild(frame);
        if(part){const opening=new Graphics().rect(part==='wide'?-55:-25,y-120,part==='wide'?110:50,120).fill(ink);opening.eventMode='none';slot.face.addChild(opening);}
        else slot.face.addChild(label('+',y-60,38));
      }
      slot.outline((this.plan.level===1&&i===0&&!this.round.design.rises[0])||this.selectedSocket===i||this.suggestion?.socket===i||this.stopSocket===i,this.stopSocket===i?swatch.orange.fill:swatch.yellow.fill);
      slot.alpha=this.selectedPart&&!compatible(this.plan,i,this.selectedPart)?.5:1;
      if(this.selectedPart&&compatible(this.plan,i,this.selectedPart))slot.outline(true,swatch.teal.line);
    });
    for(const [part,pad] of this.trays)pad.outline(this.selectedPart===part||this.suggestion?.part===part);
    this.removeButton.visible=this.selectedSocket!==null&&!!parts(this.round.design)[this.selectedSocket]&&(this.selectedSocket<this.plan.rises||this.plan.doorEditable);
    this.undoButton.visible=!!this.round.previous;
  }
  resize(view:View){
    // End a held drag without applying it; its old parent coordinates no longer describe a drop.
    this.cancelled=true;
    this.boxes=layout(view,this.plan.rises,this.choices.length,this.plan.visitors.length);const l=this.boxes;
    this.scenery.clear().rect(0,0,view.w,view.h).fill(swatch.blue.light).rect(0,l.boardY+82,view.w,view.h-l.boardY-82).fill(grass);this.scenery.hitArea=new Rectangle(0,0,view.w,view.h);
    const place=(obj:Container,b:Box)=>obj.position.set(b.x,b.y);
    this.slots.forEach((s,i)=>place(s,l.sockets[i]));this.choices.forEach((part,i)=>{const pad=this.trays.get(part)!;this.ctx.tw.kill(pad);place(pad,l.tray[i]);Object.assign(this.handles[i].home,{x:pad.x,y:pad.y});});
    this.visitors.forEach((c,i)=>place(c,l.visitors[i]));place(this.tryButton,l.try);place(this.undoButton,l.undo);place(this.removeButton,l.remove);place(this.hintButton,l.help);
    this.draw();this.positionActors();
  }
  autotouch():TouchIntent|null{
    if(this.busy||this.finished||this.destroyed)return null;
    if(this.ctx.demo&&!this.demonstrated&&(this.plan.level===3||this.plan.level===4)){
      if(this.tries===0){
        const target=this.plan.level===3?{socket:0,part:'step' as const}:repair(this.plan,{...this.round.design,door:'wide'});
        if(target&&parts(this.round.design)[target.socket]!==target.part)return this.botPlace(target);
        return {tap:{on:this.tryButton}};
      }
      this.demonstrated=true;
    }
    const next=repair(this.plan,this.round.design);return next?this.botPlace(next):{tap:{on:this.tryButton}};
  }
  private botPlace(r:Repair):TouchIntent{ return this.selectedPart===r.part?{tap:{on:this.slots[r.socket]}}:{tap:{on:this.trays.get(r.part)!}}; }
  destroy(){this.destroyed=true;this.run=null;window.removeEventListener('pointercancel',this.cancelDrag,true);window.removeEventListener('blur',this.cancelDrag);this.handles.forEach(h=>h.destroy());this.actors.forEach(a=>this.ctx.untrack(a));}
}
function emblem(){const c=new Container();c.addChild(new Graphics().poly([-75,0,-75,-60,75,-110,75,0]).fill(wood.fill).stroke({width:6,color:wood.line}));return c;}
export const welcomeWays:GameModule={
  id:'welcome-ways',name:'Welcome Ways',titleLine:'ww.title',region:'tinker-lab',skills:['engineering design','testing and revision','considering different needs'],bands:['toddler','preschool','prek','school'],levels:band=>rangeFor(LEVELS,band),
  describeLevel:level=>['Place a ramp for Roly','Try a step or a ramp','One entrance for Bunny and Roly','Two ramps and a wide door for Roly and Bear'][planFor(level).level-1],music:STYLES.quiet,touchDemo:true,
  coplayHint:'Voice a visitor’s pictured need while {name} builds, then swap.',
  offScreen:'For preschool and older: with large toy blocks, make an entrance for two toys that move differently. Let each toy try it.',
  hubIcon:()=>new WigglyIcon(emblem()),sticker:()=>emblem(),create:ctx=>new WelcomeWays(ctx),
};
