import { Circle, Container, Graphics } from 'pixi.js';
import { cream, swatch } from '../../art/palette';
import { STYLES } from '../../audio/music';
import { sfx } from '../../audio/sfx';
import { draggable, type DragHandle } from '../../engine/drag';
import { Rng } from '../../engine/random';
import { spread, type View } from '../../engine/view';
import { RoundButton } from '../../ui/buttons';
import { againIcon, arrowIcon } from '../../ui/icons';
import { label } from '../../ui/text';
import { WigglyIcon } from '../shared';
import type { Game, GameContext, GameModule, TouchIntent } from '../types';
import { doubled, fair, ingredientHint, kitchenTouch, nextPlate, planFor, recipe } from './logic';

function sandwich(parts = 1) {
  const g = new Graphics(), w=parts===2?90:parts===4?62:135, h=parts===2?48:parts===4?62:110;
  g.roundRect(-w/2,-h/2,w,h,10).fill(swatch.brown.fill).stroke({width:5,color:swatch.brown.line});
  g.roundRect(-w/2+7,-h/2+7,w-14,h-14,7).fill(cream);
  g.moveTo(-w/2+10,0).lineTo(w/2-10,0).stroke({width:6,color:swatch.green.fill});
  return g;
}
function fruit(which: number, size = 24) {
  const s=which?swatch.green:swatch.red, g=new Graphics();
  g.circle(0,0,size).fill(s.fill).stroke({width:3,color:s.line});
  g.ellipse(9,-size,11,5).fill(swatch.green.line);
  if (!which) for(const [x,y] of [[-7,-4],[7,-4],[0,8]]) g.circle(x,y,2).fill(swatch.yellow.fill);
  return g;
}
interface Piece { node: Container; drag: DragHandle; plate: number }
class PetKitchen implements Game {
 private view: View;
  readonly plan;
  readonly base;
  readonly pieces: Piece[] = [];
  readonly plates: Container[] = [];
  readonly cuts: RoundButton[] = [];
  readonly ingredients: RoundButton[] = [];
  readonly serve: RoundButton;
  readonly undo: RoundButton;
  readonly recut: RoundButton;
  readonly made = [0,0];
  private readonly additions: number[] = [];
  private readonly background = new Graphics();
  private readonly food = new Container();
  private readonly recipeCard = new Container();
  private readonly glow = new Graphics();
  private readonly pieceLayer = new Container();
  private readonly meal = new Container();
  private split = 0;
  misses = 0; hints = 0; done = false;
  private wrong = 0;
  private assisted = false;
  private clock = 0;
  constructor(private readonly ctx: GameContext) {
    this.view = ctx.view;
    this.plan=planFor(ctx.level); this.base=recipe(ctx.level,ctx.rng);
    ctx.stage.addChild(this.background,this.food,this.recipeCard,this.meal,this.glow,this.pieceLayer); this.glow.eventMode='none';
    this.serve=new RoundButton(arrowIcon(1),swatch.green,48,()=>this.check());
    this.undo=new RoundButton(arrowIcon(-1),swatch.white,48,()=>{
      const last=this.additions.pop(); if(last!==undefined) {this.made[last]--;this.drawMeal();this.drawHint();}
    });
    this.recut=new RoundButton(againIcon(),swatch.white,48,()=>{if(this.done)return;this.clearPieces();this.split=0;this.resize(this.view);this.instruction();});
    ctx.stage.addChild(this.serve,this.undo,this.recut);
    if(this.plan.mode==='share') {
      for(let i=0;i<this.plan.friends;i++) {
        const p=new Container();
        p.addChild(new Graphics().circle(0,0,76).fill(swatch.white.fill).stroke({width:6,color:swatch.blue.line}));
        // A friendly face above each plate makes the recipient visible without reading.
        const face=new Graphics().circle(0,-105,29).fill(swatch.pink.fill).circle(-9,-108,3).circle(9,-108,3).fill(swatch.purple.line);
        face.moveTo(-9,-96).quadraticCurveTo(0,-87,9,-96).stroke({width:3,color:swatch.purple.line});
        p.addChild(face);ctx.stage.addChildAt(p,1);this.plates.push(p);
      }
      for(const parts of this.plan.cuts) {
        const icon=new Graphics().roundRect(-28,-25,56,50,7).fill(cream).stroke({width:3,color:swatch.brown.line});
        icon.moveTo(0,-25).lineTo(0,25).stroke({width:4,color:swatch.brown.line});
        if(parts===4) icon.moveTo(-28,0).lineTo(28,0).stroke({width:4,color:swatch.brown.line});
        const b=new RoundButton(icon,swatch.yellow,52,()=>this.cut(parts));ctx.stage.addChild(b);this.cuts.push(b);
      }
    } else {
      for(let i=0;i<2;i++) {
        const b=new RoundButton(fruit(i,30),swatch.white,55,()=>{
          if(this.done)return;
          if(this.made[i]>=6){void ctx.say('kitchen.undo');return;}
          this.made[i]++;this.additions.push(i);sfx.pop(5+i*2);this.drawMeal();this.drawHint();
        });ctx.stage.addChild(b);this.ingredients.push(b);
      }
      this.recipeCard.addChild(new Graphics().roundRect(-235,-60,470,120,20).fill(cream).stroke({width:5,color:swatch.brown.line}));
      this.base.forEach((n,i)=>{ for(let j=0;j<n;j++){const f=fruit(i);f.position.set(-150+i*170+j*52,0);this.recipeCard.addChild(f);} });
      const times=label('× 2',36);times.position.set(175,0);this.recipeCard.addChild(times);
    }
  }
  private counts(){return this.plates.map((_,i)=>this.pieces.filter(p=>p.plate===i).length);}
  private clearPieces(){for(const p of this.pieces){p.drag.destroy();p.node.destroy({children:true});}this.pieces.length=0;}
  private cut(parts:number){
    if(this.done||this.split)return;
    this.split=parts;sfx.squish();
    for(let i=0;i<parts*this.plan.wholes;i++) {
      const node=new Container();node.addChild(sandwich(parts));node.hitArea=new Circle(0,0,55);this.pieceLayer.addChild(node);
      const piece:Piece={node,plate:-1,drag:null!};
      piece.drag=draggable(node,this.ctx.tw,{
        onPick:()=>sfx.tick(),
        onDrop:(x,y)=>{
          if(this.done)return false;
          let nearest=-1, distance=88;
          this.plates.forEach((p,i)=>{const d=Math.hypot(x-p.x,y-p.y);if(d<distance){distance=d;nearest=i;}});
          // Moving food back to the tray is also an undo. No exploratory move counts as wrong.
          if(nearest<0 && y<this.view.h-260)return false;
          piece.plate=nearest;this.layoutPieces();this.drawHint();sfx.bell(5,0.2);return true;
        },
      });this.pieces.push(piece);
    }
    this.resize(this.view);void this.ctx.instruct('kitchen.share',{n:this.plan.friends});
  }
  private check(){
    if(this.done)return;
    const ok=this.plan.mode==='share'?fair(this.counts(),this.pieces.length):doubled(this.base,this.made);
    if(ok){this.done=true;this.pieces.forEach(p=>p.drag.enabled=false);this.glow.clear();sfx.sparkle();void this.ctx.say('kitchen.done');void this.ctx.tw.wait(1.1).then(()=>this.ctx.finish({misses:this.misses,hints:this.hints}));return;}
    this.misses++;this.wrong++;sfx.boing();
    void this.ctx.say(this.plan.mode==='share'?'kitchen.fair':'kitchen.double-hint');
    if(this.wrong===2){this.assisted=true;this.hints++;}this.drawHint();
  }
  private drawHint(){
    this.glow.clear();if(!this.assisted||this.done)return;
    if(this.plan.mode==='share') {
      if(this.pieces.length<this.plates.length){this.glow.circle(this.recut.x,this.recut.y,62).stroke({width:8,color:swatch.yellow.line});void this.ctx.say('kitchen.recut');return;}
      const p=this.plates[nextPlate(this.counts())];this.glow.circle(p.x,p.y,84).stroke({width:8,color:swatch.yellow.line});
    } else {
      const i=ingredientHint(this.base,this.made);if(i<0)return;
      const b=this.made[i]>this.base[i]*2?this.undo:this.ingredients[i];this.glow.circle(b.x,b.y,65).stroke({width:8,color:swatch.yellow.line});
    }
  }
  private layoutPieces(){
    const v=this.view, offsets=this.plates.map(()=>0);
    const xs=spread(4,200,v.w-80,145);
    this.pieces.forEach((p,i)=>{
      const slot=p.plate<0?i:offsets[p.plate]++, plate=this.plates[p.plate];
      const home=p.plate<0?{x:xs[i%4],y:v.h-90-Math.floor(i/4)*125}:{x:plate.x+(slot%2?32:-32),y:plate.y+(Math.floor(slot/2)%2?30:-24)};
      p.drag.home=home;if(!p.drag.dragging){this.ctx.tw.kill(p.node);p.node.position.set(home.x,home.y);}
    });
  }
  private drawMeal(){
    for(const c of this.meal.removeChildren())c.destroy({children:true});
    this.made.forEach((n,i)=>{for(let j=0;j<n;j++){const f=fruit(i);f.position.set(-140+i*170+(j%3)*45,Math.floor(j/3)*55);this.meal.addChild(f);}});
  }
  private instruction(){void this.ctx.instruct(this.plan.mode==='recipe'?'kitchen.double':this.split?'kitchen.share':'kitchen.cut',{n:this.plan.friends});}
  start(){this.instruction();}
  resize(v:View){
  this.view=v;
    this.background.clear().rect(0,0,v.w,v.h).fill(swatch.orange.light).roundRect(165,v.h-260,v.w-190,245,30).fill(cream);
    this.serve.position.set(v.w-75,65);this.undo.position.set(v.w-75,v.h-80);this.recut.position.set(205,65);
    this.undo.visible=this.plan.mode==='recipe';this.recut.visible=this.plan.mode==='share'&&this.split>0;
    const px=spread(this.plates.length,180,v.w-50,185);
    this.plates.forEach((p,i)=>{p.position.set(px[i],Math.max(310,v.h*0.36));p.visible=this.split>0;});
    for(const c of this.food.removeChildren())c.destroy({children:true});
    if(!this.split&&this.plan.mode==='share')for(let i=0;i<this.plan.wholes;i++){const f=sandwich();f.scale.set(1.5);f.position.set(v.w/2+(i-(this.plan.wholes-1)/2)*240,v.h*0.4);this.food.addChild(f);}
    const xs=spread(this.cuts.length,250,v.w-180,200);this.cuts.forEach((b,i)=>{b.position.set(xs[i],v.h-110);b.visible=!this.split;});
    this.recipeCard.position.set(v.w/2,215);this.meal.position.set(v.w/2,v.h*0.5);
    this.ingredients.forEach((b,i)=>b.position.set(v.w/2+(i?110:-110),v.h-95));
    if(this.plan.mode==='recipe')this.background.ellipse(v.w/2,v.h*0.5+30,245,110).fill(swatch.white.fill).stroke({width:7,color:swatch.blue.line});
    this.layoutPieces();this.drawHint();
  }
  update(dt:number){this.clock+=dt;this.glow.alpha=0.7+0.3*Math.sin(this.clock*3);if(this.done)this.meal.rotation=Math.sin(this.clock*7)*0.04;}
  /** Cut for an equal share, fill the least-full plate, or double the pictured ingredients exactly. */
  autotouch():TouchIntent|null{
    if(this.done)return null;
    const move=kitchenTouch(this.plan,this.split,this.pieces.map(p=>p.plate),this.base,this.made);
    if(!move)return null;
    if(move.kind==='cut')return {tap:{on:this.cuts[this.plan.cuts.findIndex((parts:number)=>parts===move.parts)]}};
    if(move.kind==='piece')return {drag:{on:this.pieces[move.piece].node},to:{on:this.plates[move.plate]}};
    if(move.kind==='ingredient')return {tap:{on:this.ingredients[move.ingredient]}};
    if(move.kind==='undo')return {tap:{on:this.undo}};
    return {tap:{on:this.serve}};
  }
  destroy(){this.clearPieces();}
}
export const petKitchen:GameModule={
  id:'pet-kitchen',name:'Pet Kitchen',titleLine:'game.pet-kitchen',region:'counting-cove',
  skills:['equal-shares','fractions','doubling'],bands:['toddler','preschool','prek','school'],
  levels:b=>b==='school'?{min:5,max:6}:b==='toddler'?{min:1,max:1}:b==='preschool'?{min:1,max:4}:{min:3,max:6},
  describeLevel:l=>planFor(l).name,music:STYLES.paint,touchDemo:true,
  coplayHint:'Cut the sandwich together. Help {name} give a piece to each friend, then serve it.',
  offScreen:'Share a sandwich or paper circle in equal parts. Put every piece back together to see the whole.',
  hubIcon:()=>{const c=new Container();const f=sandwich();f.y=-75;c.addChild(f);return new WigglyIcon(c);},
  sticker:seed=>{const c=new Container();c.addChild(sandwich());const f=fruit(new Rng(seed).int(0,1));f.position.set(50,-60);c.addChild(f);return c;},
  create:ctx=>new PetKitchen(ctx),
};
