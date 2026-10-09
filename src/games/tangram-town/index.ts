import { Circle, Container, Graphics } from 'pixi.js';
import { cream, swatch, type ColorName } from '../../art/palette';
import { STYLES } from '../../audio/music';
import { sfx } from '../../audio/sfx';
import { draggable, type DragHandle } from '../../engine/drag';
import { Rng } from '../../engine/random';
import { spread, type View } from '../../engine/view';
import { RoundButton } from '../../ui/buttons';
import { againIcon } from '../../ui/icons';
import { WigglyIcon } from '../shared';
import type { Game,GameContext,GameModule,TouchIntent } from '../types';
import { hintFor, makePieces, planFor, tangramTouch, targetFor, VERTICES, type Piece, type Shape } from './logic';

function shape(shape:Shape,color:ColorName,outline=true){return new Graphics().poly(VERTICES[shape]).fill(swatch[color].fill).stroke({width:outline?5:0,color:swatch[color].line,join:'round'});}
interface Choice {piece:Piece;node:Container;art:Graphics;drag:DragHandle;placed:boolean}
class TangramTown implements Game {
 readonly plan; readonly pieces:Choice[]=[]; readonly filled:boolean[]; readonly board=new Container();
 readonly turn:RoundButton; readonly help:RoundButton;
 private readonly bg=new Graphics();private readonly outlines=new Container();private readonly glow=new Graphics();private readonly paletteGlow=new Graphics();
 private selected:Choice|null=null;private wrong=0;private assisted=false;private clock=0;
 misses=0;hints=0;done=false;
 constructor(private readonly ctx:GameContext){
  this.plan=planFor(ctx.level);this.filled=this.plan.targets.map(()=>false);
  ctx.stage.addChild(this.bg,this.board,this.paletteGlow);this.board.addChild(this.outlines,this.glow);this.glow.eventMode=this.paletteGlow.eventMode='none';
  this.turn=new RoundButton(againIcon(),swatch.blue,50,()=>{
    if(!this.selected||this.done||this.selected.placed)return;
    this.selected.piece.turns=(this.selected.piece.turns+1)%4;this.selected.art.rotation=this.selected.piece.turns*Math.PI/2;sfx.tick();this.drawHint();
  });
  const hand=new Graphics().circle(0,0,20).fill(swatch.yellow.fill).moveTo(0,-35).lineTo(0,35).stroke({width:5,color:swatch.orange.line});
  this.help=new RoundButton(hand,swatch.yellow,50,()=>{
    if(this.done)return; if(!this.assisted){this.assisted=true;this.hints++;}
    if(!this.selected||this.selected.placed)this.selected=this.pieces.find(p=>!p.placed)??null;
    if(this.selected){const i=hintFor(this.selected.piece,this.plan.targets,this.filled);if(i>=0){this.selected.piece.turns=this.plan.targets[i].turns;this.selected.art.rotation=this.selected.piece.turns*Math.PI/2;}}
    void ctx.say('tangram.help');this.drawHint();
  });ctx.stage.addChild(this.turn,this.help);
  const colors:ColorName[]=['pink','teal','yellow','purple'];
  for(const [i,piece] of makePieces(ctx.level,ctx.rng).entries()){
    const node=new Container(),art=shape(piece.shape,colors[i%colors.length]);art.rotation=piece.turns*Math.PI/2;node.addChild(art);node.hitArea=new Circle(0,0,75);ctx.stage.addChild(node);
    const c:Choice={piece,node,art,drag:null!,placed:false};
    c.drag=draggable(node,ctx.tw,{
      onPick:()=>{this.selected=c;sfx.tick();this.drawHint();},
      onDrop:(x,y)=>{
        if(this.done)return false;
        const local={x:x-this.board.x,y:y-this.board.y};
        const target=targetFor(piece,local.x,local.y,this.plan.targets,this.filled);
        if(target>=0){
          this.filled[target]=true;c.placed=true;c.drag.enabled=false;
          const t=this.plan.targets[target];c.drag.home={x:this.board.x+t.x,y:this.board.y+t.y};node.position.set(c.drag.home.x,c.drag.home.y);sfx.bell(5+target,0.3);
          this.wrong=0;this.assisted=false;this.selected=this.pieces.find(p=>!p.placed)??null;
          if(this.filled.every(Boolean)){this.done=true;void ctx.say('tangram.done',{picture:this.plan.picture});void ctx.tw.wait(1.2).then(()=>ctx.finish({misses:this.misses,hints:this.hints}));}
          this.drawHint();return true;
        }
        if(this.plan.targets.some((t,i)=>!this.filled[i]&&Math.hypot(t.x-local.x,t.y-local.y)<105)){
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
  this.plan.targets.forEach(t=>{const g=shape(t.shape,'white',this.plan.outlines||this.assisted);g.tint=swatch.blue.line;g.alpha=0.22;g.position.set(t.x,t.y);g.rotation=t.turns*Math.PI/2;this.outlines.addChild(g);});
  this.glow.clear();this.paletteGlow.clear();
  if(this.selected&&!this.selected.placed){
    const c=this.selected;this.paletteGlow.circle(c.drag.home.x,c.drag.home.y,88).stroke({width:5,color:swatch.blue.line});
    if(this.assisted){const i=hintFor(c.piece,this.plan.targets,this.filled);if(i>=0){const t=this.plan.targets[i];this.glow.circle(t.x,t.y,86).stroke({width:7,color:swatch.yellow.line});}}
  }
 }
 start(){void this.ctx.instruct(this.plan.rotate?'tangram.turn':'tangram.fit',{picture:this.plan.picture});}
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
 /** Turn the selected piece with the real turn button, then carry it into its matching open outline. */
 autotouch():TouchIntent|null{
  if(this.done)return null;
  if(!this.selected||this.selected.placed)this.selected=this.pieces.find(p=>!p.placed)??null;
  if(!this.selected)return null;
  const move=tangramTouch(this.selected.piece,this.plan.targets,this.filled);if(!move)return null;
  if(move.kind==='turn')return {tap:{on:this.turn}};
  const target=this.plan.targets[move.target];
  return {drag:{on:this.selected.node},to:{on:this.board,x:target.x,y:target.y}};
 }
 destroy(){this.pieces.forEach(p=>p.drag.destroy());}
}
export const tangramTown:GameModule={
 id:'tangram-town',name:'Tangram Town',titleLine:'game.tangram-town',region:'rainbow-meadow',skills:['shape-composition','rotation','spatial-reasoning'],bands:['toddler','preschool','prek','school'],
 levels:b=>b==='school'?{min:5,max:6}:b==='toddler'?{min:1,max:2}:b==='preschool'?{min:2,max:4}:{min:3,max:6},describeLevel:l=>planFor(l).name,music:STYLES.paint,touchDemo:true,
 coplayHint:'Move the big shapes together. Let {name} try turning a roof before helping.',offScreen:'Cut a paper square diagonally. Turn the two triangles into different pictures.',
 hubIcon:()=>{const c=new Container(),a=shape('square','teal'),b=shape('roof','pink');a.scale.set(0.6);a.y=-42;b.scale.set(0.6);b.y=-120;c.addChild(a,b);return new WigglyIcon(c);},
 sticker:seed=>{const g=shape(new Rng(seed).pick(['square','roof','triangle'] as const),'purple');g.scale.set(0.8);return g;},create:ctx=>new TangramTown(ctx),
};
