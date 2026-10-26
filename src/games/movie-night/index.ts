import {Container,Graphics,Rectangle,Text,type FederatedPointerEvent} from 'pixi.js';
import {frogArt} from '../../art/animals';
import {Critter,CRITTERS} from '../../art/critter';
import {cream,ink,swatch,wood} from '../../art/palette';
import {silenced,STYLES} from '../../audio/music';
import {sfx} from '../../audio/sfx';
import {voice} from '../../audio/voice';
import type {LineId} from '../../content/voice-script';
import {draggable,type DragHandle} from '../../engine/drag';
import {onTap} from '../../engine/input';
import type {View} from '../../engine/view';
import {rangeFor,type BandLevels} from '../../progress/difficulty';
import {WigglyIcon} from '../shared';
import type {Game,GameContext,GameModule,TouchIntent} from '../types';
import {Round,unmet,type Pad,type Match} from './logic';
import {layout,type Box} from './layout';
import {glyph,footage,emblem} from './art';
const LEVELS:BandLevels={preschool:{min:1,max:1},prek:{min:1,max:3},school:{min:2,max:3}};
const padLines:Record<Pad,LineId>={splash:'mn.splash',boing:'mn.boing',whoosh:'mn.whoosh',bell:'mn.bell',knock:'mn.knock',hello:'mn.hello'};
const names:Record<Pad,string>={splash:'Splash',boing:'Boing',whoosh:'Whoosh',bell:'Bell',knock:'Knock',hello:'Hello'};
function label(text:string,y:number,size=21){const t=new Text({text,style:{fontFamily:'Nunito, sans-serif',fontSize:size,fontWeight:'800',fill:ink,align:'center'}});t.anchor.set(.5);t.y=y;t.eventMode='none';return t;}
class Button extends Container {
  readonly face=new Container();readonly rim=new Graphics();readonly caption:Text;readonly bg=new Graphics();
  constructor(public w:number,public h:number,text:string,fn:()=>void){super();this.caption=label(text,27);this.addChild(this.bg,this.face,this.caption,this.rim);this.size(w,h);this.rim.eventMode='none';this.face.eventMode='none';this.hitArea=new Rectangle(-w/2,-h/2,w,h);onTap(this,()=>{this.alpha=.72;fn();});}
  size(w:number,h:number){this.w=w;this.h=h;this.bg.clear().roundRect(-w/2,-h/2,w,h,18).fill(cream).stroke({color:wood.line,width:4});this.hitArea=new Rectangle(-w/2,-h/2,w,h);}
  outline(on:boolean){this.rim.clear();if(on)this.rim.roundRect(-this.w/2+3,-this.h/2+3,this.w-6,this.h-6,16).stroke({color:swatch.yellow.line,width:7});}
}
interface Playback {kind:'watch'|'premiere'|'audition'|'model';slot:number;elapsed:number;cued:boolean;lastFrame:number}
export class MovieNight implements Game {
  readonly round:Round;readonly plan;
  readonly root=new Container();readonly background=new Graphics();readonly slots:Button[]=[];
  readonly trays=new Map<Pad,Button>();readonly handles:DragHandle[]=[];
  readonly request=new Container();readonly audience:Container[]=[];readonly screen=new Container();readonly screenFrame=new Graphics();
  readonly watchButton:Button;readonly premiereButton:Button;readonly undoButton:Button;readonly removeButton:Button;
  selectedPad:Pad|null=null;selectedSocket:number|null=null;hover:number|null=null;
  reaction:Match|undefined;destroyed=false;finished=false;opening=false;
  hintLabel='Show me';
  askForHint?:()=>void;
  private run:Playback|null=null;private boxes;private cancelled=false;
  private secondTone=-1;private pendingLabel:{line:LineId;time:number}|null=null;
  get busy(){return this.round.busy||this.opening;}
  get misses(){return this.round.misses;} get hints(){return this.round.hints;}
  // Pixi can dispatch a captured up before later window-capture listeners run.
  // Register this on the object before the shared drag's release handler.
  private readonly guardRelease=(e:FederatedPointerEvent)=>{
    const p=this.root.toLocal(e.global);
    if(!this.background.hitArea?.contains(p.x,p.y))this.cancelled=true;
  };
  private readonly cancelDrag=()=>{this.cancelled=true;this.hover=null;this.handles.forEach(h=>{if(h.dragging)void h.floatHome();});};
  private readonly outsideUp=(e:PointerEvent)=>{
    if(!(e.target instanceof HTMLCanvasElement)){this.cancelDrag();return;}
    const r=e.target.getBoundingClientRect();
    if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)this.cancelDrag();
  };
  constructor(private readonly ctx:GameContext){
    this.round=new Round(ctx.level);this.plan=this.round.plan;if(this.plan.level>1)this.askForHint=()=>this.help();this.boxes=layout(ctx.view,this.plan.shots.length);
    ctx.stage.addChild(this.root);this.root.addChild(this.background,this.request);
    onTap(this.background,()=>{if(!this.busy){this.selectedPad=null;this.selectedSocket=null;this.draw();}});
    for(let i=0;i<this.plan.shots.length;i++){
      const b=this.boxes.slots[i];const socket=new Button(b.w,b.h,'',()=>this.selectSocket(i));
      const image=footage(this.plan.shots[i]);image.scale.set(this.boxes.tall?.5:.38);image.y=-10;socket.face.addChild(image);
      for(let dot=0;dot<=i;dot++)socket.face.addChild(new Graphics().circle((dot-i/2)*11,-b.h/2+10,3).fill(ink));
      this.root.addChild(socket);this.slots.push(socket);
      socket.on('pointerup',this.guardRelease);socket.on('pointerupoutside',this.guardRelease);
      const h=draggable(socket,ctx.tw,{onPick:()=>{this.cancelled=false;},onDrop:()=>{
        const remove=!this.cancelled&&!this.busy&&this.round.strip[i]!==null&&this.boxes.tray.some(b=>Math.abs(socket.x-b.x)<b.w/2&&Math.abs(socket.y-b.y)<b.h/2);
        if(remove)this.edit(i,null);return false;
      }});this.handles.push(h);
    }
    this.plan.pads.forEach(pad=>{
      const button=new Button(120,110,names[pad],()=>{
        if(this.busy||this.finished)return;
        this.selectedPad=pad;this.selectedSocket=null;this.audition(pad);this.pendingLabel={line:padLines[pad],time:.65};this.draw();
      });const pic=glyph(pad);pic.y=-13;button.face.addChild(pic);this.trays.set(pad,button);this.root.addChild(button);
      button.on('pointerup',this.guardRelease);button.on('pointerupoutside',this.guardRelease);
      const h=draggable(button,ctx.tw,{
        onPick:()=>{this.cancelled=false;},
        onMove:(x,y)=>{this.hover=this.nearest(x,y);this.drawOutlines();},
        onDrop:(x,y)=>{const target=this.nearest(x,y);this.hover=null;if(!this.cancelled&&!this.busy&&target!==null)this.edit(target,pad);this.drawOutlines();return false;},
      });this.handles.push(h);
    });
    this.watchButton=new Button(120,100,'Watch',()=>{if(this.run)this.stop();else this.play('watch');});
    this.premiereButton=new Button(120,100,'Premiere',()=>{if(this.round.qualified)this.bow();else if(this.plan.level>1)this.play('premiere');});
    this.undoButton=new Button(120,100,'Undo',()=>{if(!this.busy&&this.round.undo()){this.reaction=undefined;void ctx.say('mn.undo');this.draw();}});
    this.removeButton=new Button(120,100,'Return',()=>{if(!this.busy&&this.selectedSocket!==null){this.edit(this.selectedSocket,null);void ctx.say('mn.return');}});
    this.root.addChild(this.watchButton,this.premiereButton,this.undoButton,this.removeButton);
    // Large pictures plus labels: reading is never required to choose these actions.
    this.watchButton.face.addChild(new Graphics().poly([-17,-32,19,-13,-17,6]).fill(ink));
    this.undoButton.face.addChild(new Graphics().moveTo(25,-8).bezierCurveTo(20,-40,-22,-40,-23,-12).lineTo(-34,-23).moveTo(-23,-12).lineTo(-9,-23).stroke({color:ink,width:5}));
    this.removeButton.face.addChild(new Graphics().roundRect(-32,-13,64,19,4).stroke({color:ink,width:4}).moveTo(0,-40).lineTo(0,-13).lineTo(-9,-23).moveTo(0,-13).lineTo(9,-23).stroke({color:ink,width:4}));
    for(const kind of ['frog','bear','bunny'] as const){const c=kind==='frog'?frogArt():new Critter(CRITTERS[kind]);c.scale.set(kind==='frog'?.6:.25);c.eventMode='none';this.audience.push(c);this.root.addChild(c);if(c instanceof Critter)ctx.track(c);}
    this.root.addChild(this.screenFrame,this.screen);this.screen.eventMode='none';this.screenFrame.eventMode='none';
    window.addEventListener('pointercancel',this.cancelDrag,true);window.addEventListener('pointerup',this.outsideUp,true);window.addEventListener('blur',this.cancelDrag);
    this.resize(ctx.view);
  }
  start(){
    const instruction=this.plan.level===1?'mn.instruction1':this.plan.level===2?'mn.instruction2':'mn.instruction3';
    this.opening=this.plan.level===1&&!this.ctx.demo;this.refreshEnabled();
    void this.ctx.instruct(instruction).then(()=>{
      if(this.destroyed)return;
      if(this.opening){this.opening=false;this.play('model',0);}else this.refreshEnabled();
    });
  }
  private nearest(x:number,y:number){let best:number|null=null,d=Infinity;this.boxes.slots.forEach((b,i)=>{const dist=Math.hypot(x-b.x,y-b.y);if(Math.abs(x-b.x)<=b.w/2&&Math.abs(y-b.y)<=b.h/2&&dist<d){best=i;d=dist;}});return best;}
  private selectSocket(i:number){if(this.busy||this.finished)return;if(this.selectedPad)this.edit(i,this.selectedPad);else{this.selectedSocket=i;this.draw();}}
  private edit(i:number,pad:Pad|null){if(this.round.edit(i,pad)){this.reaction=undefined;this.selectedPad=null;this.draw();}}
  private audition(pad:Pad){
    voice.stop();this.pendingLabel=null;this.secondTone=-1;
    if(pad==='hello'){sfx.bell(7);this.secondTone=.15;}else if(pad==='bell')sfx.bell(7);else sfx[pad]();
  }
  private play(kind:Playback['kind'],slot=0){
    if(this.opening||!this.round.begin(kind))return;
    voice.stop();this.pendingLabel=null;this.secondTone=-1;this.run={kind,slot,elapsed:0,cued:false,lastFrame:-1};this.reaction=undefined;
    this.draw();this.drawScreen();
  }
  stop(){this.run=null;this.round.stop();this.secondTone=-1;this.pendingLabel=null;this.draw();}
  private bow(){const result=this.round.bow();if(!result)return;this.finished=true;this.ctx.finish(result);}
  private help(){
    if(this.busy||this.finished||this.plan.level===1)return;
    const r=this.round.help();
    if(!r){void this.ctx.say('mn.showFriends');return;}
    this.selectedPad=null;this.selectedSocket=r.slot;this.reaction=r;this.draw();
    // Speech finishes before the shot audition; Stop/resize/destroy invalidate the continuation.
    this.play('audition',r.slot);const run=this.run;
    if(run)run.elapsed=-1000;
    void this.ctx.say(r.line).then(()=>{if(!this.destroyed&&this.run===run&&run)run.elapsed=0;});
  }
  private refreshEnabled(){
    this.handles.forEach(h=>h.enabled=!this.busy&&!this.finished);
    this.slots.forEach(s=>s.eventMode=this.busy?'none':'static');this.trays.forEach(s=>s.eventMode=this.busy?'none':'static');
    this.watchButton.eventMode=this.opening?'none':'static';
    this.premiereButton.eventMode=this.busy||this.plan.level===1&&!this.round.qualified?'none':'static';
    this.undoButton.eventMode=this.busy?'none':'static';this.removeButton.eventMode=this.busy?'none':'static';
    this.premiereButton.alpha=this.busy||this.plan.level===1&&!this.round.qualified?.4:1;
    this.undoButton.alpha=this.busy||!this.round.history.length?.4:1;this.removeButton.alpha=this.busy||this.selectedSocket===null?.4:1;
  }
  private clear(c:Container){for(const child of c.removeChildren())child.destroy({children:true});}
  private draw(){
    this.slots.forEach((s,i)=>{
      // Keep the pictured action; only the installed sound chip is replaced.
      const old=s.getChildByLabel('chip');if(old){s.removeChild(old);old.destroy({children:true});}
      const pad=this.round.strip[i];if(pad){const chip=new Container();chip.label='chip';chip.eventMode='none';const pic=glyph(pad,17);pic.position.set(s.w/2-25,s.h/2-25);chip.addChild(pic);s.addChild(chip);}
    });
    this.drawOutlines();this.drawRequest();
    this.watchButton.caption.text=this.run?'Stop':'Watch';
    this.clear(this.watchButton.face);this.watchButton.face.addChild(this.run?new Graphics().rect(-17,-31,34,34).fill(ink):new Graphics().poly([-17,-32,19,-13,-17,6]).fill(ink));
    this.premiereButton.caption.text=this.round.qualified||this.plan.level===1?'Bow':'Premiere';
    this.clear(this.premiereButton.face);
    if(this.round.qualified||this.plan.level===1)this.premiereButton.face.addChild(new Graphics().circle(0,-34,7).fill(ink).moveTo(0,-27).lineTo(13,-10).lineTo(30,-21).moveTo(13,-10).lineTo(-18,-4).moveTo(13,-10).lineTo(8,6).stroke({color:ink,width:5}));
    else for(const x of [-25,0,25])this.premiereButton.face.addChild(new Graphics().circle(x,-30,8).fill(ink).roundRect(x-10,-20,20,23,5).fill(ink));
    this.background.tint=this.run?0xbba8c4:0xffffff;
    this.screen.visible=this.screenFrame.visible=!!this.run;
    this.slots.forEach(s=>s.visible=!this.run);this.trays.forEach(s=>s.visible=!this.run);
    this.refreshEnabled();
  }
  private drawOutlines(){
    const r=this.round.automaticHint?unmet(this.plan.level,this.round.strip)[0]:undefined;
    this.slots.forEach((s,i)=>s.outline(this.hover===i||this.selectedSocket===i||r?.slot===i));
    this.trays.forEach((b,p)=>b.outline(this.selectedPad===p||r?.pad===p));
  }
  private drawRequest(){
    this.clear(this.request);const r=this.reaction??unmet(this.plan.level,this.round.strip)[0]??this.plan.requirements[0];
    const x=this.boxes.request.x,y=this.boxes.request.y;
    if(r){const pic=footage(this.plan.shots[r.slot]);pic.scale.set(.36);pic.position.set(x+70,y+10);this.request.addChild(pic);
      const sound=glyph(r.pad,25);sound.position.set(x-75,y+5);this.request.addChild(sound,new Graphics().moveTo(x-35,y+5).lineTo(x-5,y+5).lineTo(x-15,y-5).moveTo(x-5,y+5).lineTo(x-15,y+15).stroke({color:ink,width:4}));
      for(let i=0;i<=r.slot;i++)this.request.addChild(new Graphics().circle(x+53+i*11-r.slot*5.5,y-35,3).fill(ink));
      if(this.round.qualified){const check=label('✓',0,36);check.position.set(x+190,y);this.request.addChild(check);}
    }else{const t=label('Your sound show',0,25);t.position.set(x+60,y);this.request.addChild(t);}
    this.audience.forEach((a,i)=>{a.position.set(x-310+i*62,y+45);if(a instanceof Critter)a.setMood(this.round.qualified?'happy':'calm');});
    // Requesting friend points at the actual requested moment; audience decoration takes no taps.
    if(r)this.request.addChild(new Graphics().moveTo(x-190,y+10).lineTo(x-130,y+5).stroke({color:wood.line,width:5}));
  }
  private drawScreen(){
    const run=this.run;if(!run)return;this.clear(this.screen);
    const art=footage(this.plan.shots[run.slot],Math.max(0,run.elapsed));art.scale.set(this.boxes.screen.w/320);this.screen.addChild(art);
    if(run.cued){const p=run.kind==='model'?'boing':this.round.strip[run.slot];if(p){const pulse=glyph(p,34+Math.sin(run.elapsed*12)*3);pulse.position.set(this.boxes.screen.w/2-55,this.boxes.screen.h/2-50);this.screen.addChild(pulse);}}
  }
  update(dt:number){
    if(this.destroyed)return;
    if(this.secondTone>=0){this.secondTone-=dt;if(this.secondTone<0)sfx.bell(9);}
    if(this.pendingLabel){this.pendingLabel.time-=dt;if(this.pendingLabel.time<=0){const line=this.pendingLabel.line;this.pendingLabel=null;void this.ctx.say(line);}}
    for(const b of [...this.slots,...this.trays.values(),this.watchButton])b.alpha=Math.min(1,b.alpha+dt*3);
    const run=this.run;if(!run||run.elapsed<0)return;
    run.elapsed+=dt;
    if(!run.cued&&run.elapsed>=this.plan.shots[run.slot].cue){run.cued=true;const pad=run.kind==='model'?'boing':this.round.strip[run.slot];if(pad)this.audition(pad);}
    const frame=Math.floor(run.elapsed*15);if(frame!==run.lastFrame){run.lastFrame=frame;this.drawScreen();}
    if(run.elapsed<2)return;
    if(run.kind!=='audition'&&run.kind!=='model'&&run.slot<this.plan.shots.length-1){run.slot++;run.elapsed=0;run.cued=false;run.lastFrame=-1;return;}
    this.run=null;const result=this.round.complete();this.secondTone=-1;this.draw();
    if(run.kind==='model'){void this.ctx.say('mn.yourTurn');return;}
    if(result?.kind==='premiere'){
      this.reaction=result.request;this.drawRequest();
      if(result.ok)void this.ctx.say('mn.success');else{if(this.round.failures>=2)sfx.boing();void this.ctx.say(result.request!.line);}
    }else if(result?.kind==='watch'&&this.plan.level===1)void this.ctx.say(this.round.qualified?'mn.ack':'mn.empty');
  }
  resize(view:View){
    this.cancelDrag();this.run=null;this.round.stop();this.secondTone=-1;this.pendingLabel=null;
    this.boxes=layout(view,this.plan.shots.length);const l=this.boxes;
    this.background.clear().rect(0,0,view.w,view.h).fill(swatch.pink.light);this.background.hitArea=new Rectangle(0,0,view.w,view.h);
    // The strip remains in fixed reading order; dots and arrows carry it without text.
    l.slots.forEach((b,i)=>{if(i===l.slots.length-1)return;const next=l.slots[i+1];const g=this.background;
      if(!l.tall||i%2===0){const x=(b.x+next.x)/2,y=b.y;g.moveTo(x-10,y).lineTo(x+10,y).lineTo(x+2,y-8).moveTo(x+10,y).lineTo(x+2,y+8).stroke({color:wood.line,width:4});}
      else{const x=l.slots[0].x-150;g.moveTo(b.x,b.y+b.h/2+16).lineTo(x,b.y+b.h/2+16).lineTo(x,next.y).lineTo(next.x-next.w/2-14,next.y).stroke({color:wood.line,width:3});g.moveTo(next.x-next.w/2-23,next.y-8).lineTo(next.x-next.w/2-14,next.y).lineTo(next.x-next.w/2-23,next.y+8).stroke({color:wood.line,width:3});}
    });
    const put=(obj:Container,b:Box)=>obj.position.set(b.x,b.y);
    this.slots.forEach((s,i)=>{
      // Both orientations use a full-size target; the visible frame follows its target.
      const b=l.slots[i];s.size(b.w,b.h);put(s,b);const image=s.face.children[0];image.scale.set(l.tall?.5:.38);
      for(const dot of s.face.removeChildren(1))dot.destroy();
      for(let dot=0;dot<=i;dot++)s.face.addChild(new Graphics().circle((dot-i/2)*11,-b.h/2+10,3).fill(ink));
      this.ctx.tw.kill(s);Object.assign(this.handles[i].home,{x:s.x,y:s.y});
    });
    this.plan.pads.forEach((p,i)=>{const b=this.trays.get(p)!;this.ctx.tw.kill(b);put(b,l.tray[i]);Object.assign(this.handles[this.slots.length+i].home,{x:b.x,y:b.y});});
    [this.watchButton,this.premiereButton,this.undoButton,this.removeButton].forEach((b,i)=>put(b,l.controls[i]));
    this.screen.position.set(l.screen.x,l.screen.y);this.screenFrame.clear().roundRect(l.screen.x-l.screen.w/2-12,l.screen.y-l.screen.h/2-12,l.screen.w+24,l.screen.h+24,20).fill(ink);
    this.draw();
  }
  autotouch():TouchIntent|null {
    if(this.busy||this.finished)return null;
    if(this.round.qualified)return {tap:{on:this.premiereButton}};
    if(this.plan.level===1){if(!this.round.strip.some(Boolean))return {drag:{on:this.trays.get('boing')!},to:{on:this.slots[0]}};return {tap:{on:this.watchButton}};}
    const r=unmet(this.plan.level,this.round.strip)[0];if(r)return {drag:{on:this.trays.get(r.pad)!},to:{on:this.slots[r.slot]}};
    return {tap:{on:this.premiereButton}};
  }
  destroy(){this.destroyed=true;this.run=null;this.round.destroy();this.secondTone=-1;this.pendingLabel=null;window.removeEventListener('pointercancel',this.cancelDrag,true);window.removeEventListener('pointerup',this.outsideUp,true);window.removeEventListener('blur',this.cancelDrag);this.handles.forEach(h=>h.destroy());this.audience.forEach(a=>{if(a instanceof Critter)this.ctx.untrack(a);});}
}
export const movieNight:GameModule={id:'movie-night',name:'Movie Night',titleLine:'mn.title',region:'treehouse',skills:['combining pictures and sound','matching sound to a pictured event','revision'],bands:['preschool','prek','school'],levels:b=>rangeFor(LEVELS,b),describeLevel:l=>['Sound for the show: any sound on any picture','Right on time: splash on Duck’s landing','Two moments: knock on the door tap, hello on the wave'][planIndex(l)],music:silenced(STYLES.quiet),touchDemo:true,coplayHint:'One person places sounds; the other watches, then swap. A grown-up can look away until the premiere and say what they heard.',hubIcon:()=>new WigglyIcon(emblem()),sticker:()=>emblem(),create:ctx=>new MovieNight(ctx)};
function planIndex(l:number){return Math.max(0,Math.min(2,Math.floor(l)-1));}
