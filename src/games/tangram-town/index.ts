import { Circle, Container, Graphics } from 'pixi.js';
import { cream, swatch, type ColorName } from '../../art/palette';
import { STYLES } from '../../audio/music';
import { sfx } from '../../audio/sfx';
import type { LineId } from '../../content/voice-script';
import { draggable, type DragHandle } from '../../engine/drag';
import { onTap } from '../../engine/input';
import { Rng } from '../../engine/random';
import { spread, type View } from '../../engine/view';
import { RoundButton } from '../../ui/buttons';
import { againIcon, checkIcon } from '../../ui/icons';
import { WigglyIcon } from '../shared';
import type { Game,GameContext,GameModule,TouchIntent } from '../types';
import { makeRepair, repairAction, repairMismatches, bestTarget, buildFor, completedCover, coverHint, unavailableSlots, viableCovers, hintFor, makePieces, planFor, targetFor, VERTICES, type Piece, type Shape } from './logic';

function shape(shape:Shape,color:ColorName,outline=true){return new Graphics().poly(VERTICES[shape]).fill(swatch[color].fill).stroke({width:outline?5:0,color:swatch[color].line,join:'round'});}
/** Name the geometry, even when the picture uses a triangle as a roof or a trapezoid as a hull. */
const SHAPE_LINES = { square:'tangram.square', roof:'tangram.triangle', triangle:'tangram.triangle', rectangle:'tangram.rectangle', hull:'tangram.trapezoid' } as const satisfies Record<Shape, LineId>;
interface Choice {piece:Piece;node:Container;art:Graphics;drag:DragHandle;placed:boolean;named:boolean}
class TangramTown implements Game {
 readonly plan; readonly pieces:Choice[]=[]; readonly filled:boolean[]; readonly board=new Container();
 readonly turn:RoundButton; readonly help:RoundButton;
 private readonly bg=new Graphics();private readonly outlines=new Container();private readonly glow=new Graphics();private readonly paletteGlow=new Graphics();
 private selected:Choice|null=null;private wrong=0;private assisted=false;private clock=0;
 misses=0;hints=0;done=false;
 constructor(private readonly ctx:GameContext){
  this.plan=buildFor(ctx.level,ctx.rng);this.filled=this.plan.targets.map(()=>false);
  ctx.stage.addChild(this.bg,this.board,this.paletteGlow);this.board.addChild(this.outlines,this.glow);this.glow.eventMode=this.paletteGlow.eventMode='none';
  this.turn=new RoundButton(againIcon(),swatch.blue,50,()=>{
    if(!this.selected||this.done||this.selected.placed)return;
    this.selected.piece.turns=(this.selected.piece.turns+1)%4;this.selected.art.rotation=this.selected.piece.turns*Math.PI/2;sfx.tick();this.drawHint();
  });
  const hand=new Graphics().circle(0,0,20).fill(swatch.yellow.fill).moveTo(0,-35).lineTo(0,35).stroke({width:5,color:swatch.orange.line});
  this.help=new RoundButton(hand,swatch.yellow,50,()=>{
    if(this.done)return; if(!this.assisted){this.assisted=true;this.hints++;}
    if(this.plan.covers){const i=coverHint(this.plan,this.filled);this.selected=this.pieces.find(p=>!p.placed&&p.piece.shape===this.plan.targets[i]?.shape)??null;}
    else if(!this.selected||this.selected.placed)this.selected=this.pieces.find(p=>!p.placed)??null;
    if(this.selected){const i=hintFor(this.selected.piece,this.plan.targets,unavailableSlots(this.plan,this.filled));if(i>=0){this.selected.piece.turns=this.plan.targets[i].turns;this.selected.art.rotation=this.selected.piece.turns*Math.PI/2;}}
    void ctx.say('tangram.help');this.drawHint();
  });ctx.stage.addChild(this.turn,this.help);
  const colors:ColorName[]=['pink','teal','yellow','purple'];
  for(const [i,piece] of makePieces(this.plan,ctx.rng).entries()){
    const node=new Container(),art=shape(piece.shape,colors[i%colors.length]);art.rotation=piece.turns*Math.PI/2;node.addChild(art);node.hitArea=new Circle(0,0,75);ctx.stage.addChild(node);
    const c:Choice={piece,node,art,drag:null!,placed:false,named:false};
    c.drag=draggable(node,ctx.tw,{
      onPick:()=>{
        this.selected=c;sfx.tick();this.drawHint();
        if(!c.named && (ctx.band==='toddler'||ctx.band==='preschool'||ctx.band==='prek')){
          c.named=true;void ctx.say(SHAPE_LINES[piece.shape]);
        }
      },
      onDrop:(x,y)=>{
        if(this.done)return false;
        const local={x:x-this.board.x,y:y-this.board.y};
        const target=targetFor(piece,local.x,local.y,this.plan.targets,unavailableSlots(this.plan,this.filled));
        if(target>=0){
          this.filled[target]=true;c.placed=true;c.drag.enabled=false;
          const t=this.plan.targets[target];c.drag.home={x:this.board.x+t.x,y:this.board.y+t.y};node.position.set(c.drag.home.x,c.drag.home.y);sfx.bell(5+target,0.3);
          this.wrong=0;this.assisted=false;this.selected=this.pieces.find(p=>!p.placed)??null;
          const cover=completedCover(this.plan,this.filled);
          if(cover){this.done=true;void ctx.say(this.plan.covers?'tangram.cover-done':'tangram.done',{picture:this.plan.picture,count:cover.length});void ctx.tw.wait(1.2).then(()=>ctx.finish({misses:this.misses,hints:this.hints}));}
          this.drawHint();return true;
        }
        if(this.plan.covers&&!this.plan.targets.some((t,i)=>!unavailableSlots(this.plan,this.filled)[i]&&t.shape===piece.shape)){void ctx.say('tangram.covered');return false;}
        if(this.plan.targets.some((t,i)=>!unavailableSlots(this.plan,this.filled)[i]&&Math.hypot(t.x-local.x,t.y-local.y)<105)){
          this.misses++;this.wrong++;sfx.boing();void ctx.say('tangram.try');
          if(this.wrong===2){this.assisted=true;this.hints++;}
        }this.drawHint();return false;
      },
    });this.pieces.push(c);
  }
  this.selected=this.pieces[0];
 }
 private drawHint(){
  for(const c of this.outlines.removeChildren())c.destroy();
  const cover=this.plan.covers?(this.assisted?[...viableCovers(this.plan,this.filled)].sort((a,b)=>a.length-b.length)[0]:[0,1]):null;
  this.plan.targets.forEach((t,i)=>{if(cover&&!cover.includes(i))return;const g=shape(t.shape,'white',this.plan.outlines||this.assisted);g.tint=swatch.blue.line;g.alpha=0.22;g.position.set(t.x,t.y);g.rotation=t.turns*Math.PI/2;this.outlines.addChild(g);});
  this.glow.clear();this.paletteGlow.clear();
  if(this.selected&&!this.selected.placed){
    const c=this.selected;this.paletteGlow.circle(c.drag.home.x,c.drag.home.y,88).stroke({width:5,color:swatch.blue.line});
    if(this.assisted){const i=hintFor(c.piece,this.plan.targets,unavailableSlots(this.plan,this.filled));if(i>=0){const t=this.plan.targets[i];this.glow.circle(t.x,t.y,86).stroke({width:7,color:swatch.yellow.line});}}
  }
 }
 start(){void this.ctx.instruct(this.plan.covers?'tangram.covers':this.plan.rotate?'tangram.turn':'tangram.fit',{picture:this.plan.picture});}
 resize(v:View){
  this.bg.clear().rect(0,0,v.w,v.h).fill(swatch.blue.light).roundRect(175,v.h-190,v.w-205,170,25).fill(cream);
  this.board.position.set(v.w/2,Math.max(340,v.h*0.40));
  this.turn.position.set(v.w-85,250);this.turn.visible=this.plan.rotate;this.help.position.set(v.w-85,390);
  const xs=spread(this.pieces.length,200,v.w-65,205);
  // A placed piece stays at its chosen target when rotating the device.
  this.pieces.forEach((c,i)=>{
    if(c.placed){const t=this.plan.targets.find((t,k)=>this.filled[k]&&Math.abs(c.drag.home.x-this.previousBoard.x-t.x)<1&&Math.abs(c.drag.home.y-this.previousBoard.y-t.y)<1);if(t)c.drag.home={x:this.board.x+t.x,y:this.board.y+t.y};}
    else c.drag.home={x:xs[i],y:v.h-100};
    if(!c.drag.dragging){this.ctx.tw.kill(c.node);c.node.position.set(c.drag.home.x,c.drag.home.y);}
  });
  this.previousBoard={x:this.board.x,y:this.board.y};this.drawHint();
 }
 private previousBoard={x:0,y:0};
 update(dt:number){this.clock+=dt;this.glow.alpha=0.7+0.3*Math.sin(this.clock*3);if(this.done)for(const c of this.pieces)c.node.y=c.drag.home.y+Math.sin(this.clock*5)*5;}
 /** The ghost finger on the how-to card: turn the piece in hand until it fits its place (the turn button, never the help hand), then carry it there. */
 autotouch():TouchIntent|null{
  if(this.done)return null;
  const hint=this.plan.covers?coverHint(this.plan,this.filled):-1;
  const c=this.pieces.find(p=>!p.placed&&(!this.plan.covers||p.piece.shape===this.plan.targets[hint]?.shape));
  if(!c||c.drag.dragging)return null;
  const goal=bestTarget(c.piece,this.plan.targets,unavailableSlots(this.plan,this.filled));
  if(!goal)return null;
  // The turn button turns the piece picked up last; the first in the tray is already in hand, so this only takes a touch if it is not.
  if(this.selected!==c)return {tap:{on:c.node}};
  if(goal.turns>0)return {tap:{on:this.turn}};
  const t=this.plan.targets[goal.index];
  return {drag:{on:c.node},to:{on:this.board,x:t.x,y:t.y}};
 }
 destroy(){this.pieces.forEach(p=>p.drag.destroy());}
}
/** A completed picture can be revised by turning pieces freely, then checking against its outline. */
class TangramRepair implements Game {
 readonly plan; readonly pieces:Piece[]; readonly nodes:Container[]=[]; readonly arts:Graphics[]=[];
 readonly board=new Container(); readonly turn:RoundButton; readonly help:RoundButton; readonly check:RoundButton;
 private readonly bg=new Graphics();private readonly glow=new Graphics();private readonly ring=new Graphics();
 selected:number|null=null;misses=0;hints=0;done=false;private wrong=0;private assisted=false;private clock=0;
 constructor(private readonly ctx:GameContext){
  this.plan=buildFor(ctx.level,ctx.rng);this.pieces=makeRepair(this.plan,ctx.rng);
  ctx.stage.addChild(this.bg,this.board);this.glow.eventMode=this.ring.eventMode='none';
  const colors:ColorName[]=['pink','teal','yellow','purple'];
  this.plan.targets.forEach((t,i)=>{
   const outline=shape(t.shape,'blue');outline.alpha=0.28;outline.rotation=t.turns*Math.PI/2;outline.position.set(t.x,t.y);outline.eventMode='none';this.board.addChild(outline);
   const n=new Container(),a=shape(t.shape,colors[i]);a.rotation=this.pieces[i].turns*Math.PI/2;n.position.set(t.x,t.y);n.addChild(a);this.board.addChild(n);this.nodes.push(n);this.arts.push(a);
   onTap(n,()=>{if(this.done)return;this.selected=i;sfx.tick();this.draw();},{radius:75});
  });
  this.board.addChild(this.glow,this.ring);
  this.turn=new RoundButton(againIcon(),swatch.blue,50,()=>{
   if(this.done||this.selected===null)return;
   const i=this.selected;this.pieces[i].turns=(this.pieces[i].turns+1)%4;this.arts[i].rotation=this.pieces[i].turns*Math.PI/2;sfx.tick();this.draw();
  });
  const hand=new Graphics().circle(0,0,20).fill(swatch.yellow.fill).moveTo(0,-35).lineTo(0,35).stroke({width:5,color:swatch.orange.line});
  this.help=new RoundButton(hand,swatch.yellow,50,()=>{if(this.done)return;const i=repairMismatches(this.plan.targets,this.pieces)[0];if(i===undefined){void ctx.say('tangram.repair-check');return;}this.support();this.selected=i;void ctx.say('tangram.repair-hint');this.draw();});
  this.check=new RoundButton(checkIcon(),swatch.green,50,()=>{
   if(this.done)return;
   if(repairMismatches(this.plan.targets,this.pieces).length){this.misses++;this.wrong++;sfx.boing();void ctx.say('tangram.repair-try');if(this.wrong>=2)this.support();this.draw();return;}
   this.done=true;sfx.bell(7,0.4);void ctx.say('tangram.repaired',{picture:this.plan.picture});void ctx.tw.wait(1.2).then(()=>ctx.finish({misses:this.misses,hints:this.hints}));
  });ctx.stage.addChild(this.turn,this.help,this.check);
 }
 private support(){if(!this.assisted){this.assisted=true;this.hints++;}}
 private draw(){
  this.ring.clear();this.glow.clear();
  if(this.selected!==null){const t=this.plan.targets[this.selected];this.ring.circle(t.x,t.y,85).stroke({width:5,color:swatch.blue.line});}
  const i=repairMismatches(this.plan.targets,this.pieces)[0];
  if(this.assisted&&i!==undefined){const t=this.plan.targets[i];this.glow.circle(t.x,t.y,88).stroke({width:7,color:swatch.yellow.line});}
 }
 start(){void this.ctx.instruct('tangram.repair');}
 resize(v:View){this.bg.clear().rect(0,0,v.w,v.h).fill(swatch.blue.light);this.board.position.set(v.w/2,Math.max(340,v.h*0.4));this.turn.position.set(v.w-85,250);this.help.position.set(v.w-85,390);this.check.position.set(v.w-85,530);this.draw();}
 update(dt:number){this.clock+=dt;this.glow.alpha=0.7+0.3*Math.sin(this.clock*3);}
 autotouch():TouchIntent|null{if(this.done)return null;const a=repairAction(this.plan.targets,this.pieces,this.selected);return 'pick'in a?{tap:{on:this.nodes[a.pick]}}:'turn'in a?{tap:{on:this.turn}}:{tap:{on:this.check}};}
 destroy(){}
}
export const tangramTown:GameModule={
 id:'tangram-town',name:'Tangram Town',titleLine:'game.tangram-town',region:'rainbow-meadow',skills:['shape-composition','rotation','spatial-reasoning'],bands:['toddler','preschool','prek','school'],
 levels:b=>b==='school'?{min:5,max:8}:b==='toddler'?{min:1,max:2}:b==='preschool'?{min:2,max:4}:{min:3,max:6},describeLevel:l=>planFor(l).name,music:STYLES.paint,touchDemo:true,
 coplayHint:'Move the big shapes together. Let {name} try turning a roof before helping.',offScreen:'Cut a paper square diagonally. Turn the two triangles into different pictures.',
 hubIcon:()=>{const c=new Container(),a=shape('square','teal'),b=shape('roof','pink');a.scale.set(0.6);a.y=-42;b.scale.set(0.6);b.y=-120;c.addChild(a,b);return new WigglyIcon(c);},
 sticker:seed=>{const g=shape(new Rng(seed).pick(['square','roof','triangle'] as const),'purple');g.scale.set(0.8);return g;},create:ctx=>planFor(ctx.level).repair?new TangramRepair(ctx):new TangramTown(ctx),
};
