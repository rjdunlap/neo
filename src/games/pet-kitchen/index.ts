import { Circle, Container, Graphics } from 'pixi.js';
import { Critter, CRITTERS } from '../../art/critter';
import { cream, swatch } from '../../art/palette';
import { STYLES } from '../../audio/music';
import { sfx } from '../../audio/sfx';
import { draggable, type DragHandle } from '../../engine/drag';
import { onTap } from '../../engine/input';
import { Rng } from '../../engine/random';
import { spread, type View } from '../../engine/view';
import { RoundButton } from '../../ui/buttons';
import { againIcon, arrowIcon } from '../../ui/icons';
import { label } from '../../ui/text';
import { WigglyIcon } from '../shared';
import type { Game, GameContext, GameModule, TouchIntent } from '../types';
import { countAloud, dealCut, dealFriends, dealTo, DEAL_LEVEL, doubled, fair, fairCut, fractionCut, fractionRequest, fruitPair, halfIngredientHint, halved, ingredientHint, nextPlate, planFor, plateAt, recipe, servesFraction, serveTrouble, wholeFor, type FractionRequest, type Whole } from './logic';
import { rangeFor, type BandLevels } from '../../progress/difficulty';

function sandwich(parts = 1) {
  if (parts === 3) {
    const g = new Graphics();
    g.moveTo(0, 0).arc(0, 0, 43, -Math.PI / 3, Math.PI / 3).closePath().fill(cream).stroke({width:5,color:swatch.brown.line});
    for (const [x,y] of [[18,-13],[29,0],[18,13]]) g.circle(x,y,4).fill(swatch.red.fill).stroke({width:1,color:swatch.red.line});
    return g;
  }
  const g = new Graphics(), w=parts===2?90:parts===4?62:135, h=parts===2?48:parts===4?62:110;
  g.roundRect(-w/2,-h/2,w,h,10).fill(swatch.brown.fill).stroke({width:5,color:swatch.brown.line});
  g.roundRect(-w/2+7,-h/2+7,w-14,h-14,7).fill(cream);
  g.moveTo(-w/2+10,0).lineTo(w/2-10,0).stroke({width:6,color:swatch.green.fill});
  return g;
}
function pizza() {
  const g=new Graphics();
  g.circle(0,0,82).fill(swatch.brown.fill).stroke({width:7,color:swatch.brown.line});
  g.circle(0,0,70).fill(swatch.yellow.light).stroke({width:3,color:swatch.yellow.line});
  for(const a of [-Math.PI/2,Math.PI/6,5*Math.PI/6]) g.moveTo(0,0).lineTo(Math.cos(a)*70,Math.sin(a)*70).stroke({width:5,color:swatch.brown.line});
  for(const [x,y] of [[0,-34],[30,17],[-30,17]]) g.circle(x,y,6).fill(swatch.red.fill).stroke({width:2,color:swatch.red.line});
  return g;
}
/** A round pie: a crimped rim and a lattice of two crossing strokes. */
function pie() {
  const g=new Graphics();
  g.circle(0,0,82).fill(swatch.brown.fill).stroke({width:7,color:swatch.brown.line});
  for(let i=0;i<12;i++){const a=i*Math.PI/6;g.circle(Math.cos(a)*78,Math.sin(a)*78,5).fill(swatch.brown.light).stroke({width:2,color:swatch.brown.line});}
  g.circle(0,0,66).fill(swatch.yellow.light).stroke({width:3,color:swatch.yellow.line});
  g.moveTo(-46,-46).lineTo(46,46).moveTo(46,-46).lineTo(-46,46).stroke({width:6,color:swatch.brown.line});
  return g;
}
/** One cut piece of a pie (half or quarter), drawn with its middle at the origin so a drag holds it by the body. */
function pieSlice(parts: number) {
  const r=50, a=Math.PI*2/parts, g=new Graphics();
  g.moveTo(0,0).arc(0,0,r,-a/2,a/2).closePath().fill(swatch.yellow.light).stroke({width:5,color:swatch.brown.line});
  g.moveTo(0,0).arc(0,0,r,-a/2,a/2).stroke({width:8,color:swatch.brown.fill});
  g.position.x=-(4*r*Math.sin(a/2))/(3*a);
  const c=new Container();c.addChild(g);return c;
}
function wholeOf(kind: Whole, level: number) { return level===9?pizza():kind==='pie'?pie():sandwich(); }
function pieceOf(kind: Whole, parts: number) { return kind==='pie'&&parts!==3?pieSlice(parts):sandwich(parts); }
/** 0 berry, 1 apple, 2 banana. */
function fruit(which: number, size = 24) {
  const g=new Graphics();
  if (which===2) {
    g.moveTo(-size,-size*0.2).quadraticCurveTo(0,size*1.2,size,-size*0.6).quadraticCurveTo(size*0.1,size*0.5,-size,-size*0.2).closePath().fill(swatch.yellow.fill).stroke({width:3,color:swatch.yellow.line});
    g.rect(size-3,-size*0.8,6,8).fill(swatch.brown.line);
    return g;
  }
  const s=which?swatch.green:swatch.red;
  g.circle(0,0,size).fill(s.fill).stroke({width:3,color:s.line});
  g.ellipse(9,-size,11,5).fill(swatch.green.line);
  if (!which) for(const [x,y] of [[-7,-4],[7,-4],[0,8]]) g.circle(x,y,2).fill(swatch.yellow.fill);
  return g;
}
/** The asked amount as a picture: a sandwich with the asked part shaded, in a speech bubble. */
function askBubble(request: FractionRequest) {
  const c=new Container(), w=64, h=50;
  c.addChild(new Graphics().circle(0,0,56).fill(swatch.white.fill).stroke({width:5,color:swatch.blue.line}));
  const g=new Graphics();
  g.roundRect(-w/2,-h/2,w,h,6).fill(cream);
  const shade=(x:number,y:number,ww:number,hh:number)=>g.rect(x,y,ww,hh).fill(swatch.yellow.fill);
  if (request.id==='half') shade(-w/2,-h/2,w/2,h);
  else { shade(-w/2,-h/2,w/2,h/2); if (request.id==='three-quarters') { shade(w/2-w/2,-h/2,w/2,h/2); shade(-w/2,0,w/2,h/2); } }
  g.moveTo(0,-h/2).lineTo(0,h/2);
  if (request.denominator===4) g.moveTo(-w/2,0).lineTo(w/2,0);
  g.stroke({width:3,color:swatch.brown.line}).roundRect(-w/2,-h/2,w,h,6).stroke({width:4,color:swatch.brown.line});
  c.addChild(g);return c;
}
interface Piece { node: Container; drag: DragHandle | null; plate: number }
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
  private readonly request;
  private readonly whole: Whole;
  /** The two fruits this round's recipe uses (0 berry, 1 apple, 2 banana). */
  readonly kinds: [number, number];
  private readonly friends: Critter[] = [];
  private readonly bubble = new Container();
  private readonly dealCut: 2 | 4;
  private readonly tapDeal: boolean;
  misses = 0; hints = 0; done = false;
  private wrong = 0;
  private assisted = false;
  private clock = 0;
  /** Seconds since the last touch while the food waits uncut; at six the cut buttons bounce. */
  private idle = 0;
  private lastPoke = -Infinity;
  constructor(private readonly ctx: GameContext) {
    this.view = ctx.view;
    this.plan=planFor(ctx.level); this.base=recipe(ctx.level,ctx.rng); this.request=fractionRequest(ctx.rng);
    this.whole=wholeFor(ctx.level,ctx.rng); this.kinds=fruitPair(ctx.rng); this.dealCut=dealCut(ctx.rng);
    this.tapDeal=this.plan.mode==='deal';
    ctx.stage.addChild(this.background,this.food,this.recipeCard,this.meal,this.glow,this.pieceLayer,this.bubble); this.glow.eventMode='none';
    // Any touch on the counter counts as someone playing, so the cut buttons only bounce after real quiet.
    this.background.eventMode='static';this.background.on('pointerdown',(e)=>{this.idle=0;if(this.tapDeal&&!this.done){const at=ctx.stage.toLocal(e.global);this.wiggleNearest(at.x,at.y);}});
    this.serve=new RoundButton(arrowIcon(1),swatch.green,48,()=>this.check());
    this.undo=new RoundButton(arrowIcon(-1),swatch.white,48,()=>{
      const last=this.additions.pop(); if(last!==undefined) {this.made[last]--;this.drawMeal();this.drawHint();}
    });
    this.recut=new RoundButton(againIcon(),swatch.white,48,()=>{if(this.done)return;this.clearPieces();this.split=0;this.idle=0;this.resize(this.view);this.instruction();});
    ctx.stage.addChild(this.serve,this.undo,this.recut);
    if(this.plan.mode==='share'||this.plan.mode==='fraction'||this.tapDeal) {
      const names=dealFriends(ctx.rng,this.plan.friends);
      for(let i=0;i<this.plan.friends;i++) {
        const p=new Container();
        p.addChild(new Graphics().circle(0,0,76).fill(swatch.white.fill).stroke({width:6,color:swatch.blue.line}));
        // A friend above each plate makes the recipient visible without reading; calm until fed, then happy.
        const friend=new Critter(CRITTERS[names[i]]);friend.scale.set(0.45);friend.position.set(0,-62);friend.setMood('calm');
        friend.eventMode='none';p.addChild(friend);ctx.track(friend);this.friends.push(friend);
        ctx.stage.addChildAt(p,1);this.plates.push(p);
      }
      if(this.plan.mode==='fraction') {
        this.bubble.addChild(askBubble(this.request));
        onTap(this.bubble,()=>{this.idle=0;void ctx.say('kitchen.fraction-ask',{amount:this.request.name});},{radius:60});
      }
      if(!this.tapDeal) for(const parts of this.plan.cuts) {
        const round=this.whole==='pie'||ctx.level===9;
        const icon=new Graphics();
        if(round) {
          icon.circle(0,0,26).fill(cream).stroke({width:3,color:swatch.brown.line});
          const lines=parts===3?[-Math.PI/2,Math.PI/6,5*Math.PI/6]:parts===4?[0,Math.PI/2]:[Math.PI/2];
          for(const a of lines) { icon.moveTo(0,0).lineTo(Math.cos(a)*26,Math.sin(a)*26); if(parts!==3) icon.lineTo(-Math.cos(a)*26,-Math.sin(a)*26); }
          icon.stroke({width:4,color:swatch.brown.line});
        } else {
          icon.roundRect(-28,-25,56,50,7).fill(cream).stroke({width:3,color:swatch.brown.line});
          icon.moveTo(0,-25).lineTo(0,25).stroke({width:4,color:swatch.brown.line});
          if(parts===4) icon.moveTo(-28,0).lineTo(28,0).stroke({width:4,color:swatch.brown.line});
        }
        const b=new RoundButton(icon,swatch.yellow,52,()=>this.cut(parts));ctx.stage.addChild(b);this.cuts.push(b);
      }
      if(this.tapDeal) this.cut(this.dealCut,true);
    } else {
      for(let i=0;i<2;i++) {
        const b=new RoundButton(fruit(this.kinds[i],30),swatch.white,55,()=>{
          if(this.done)return;
          if(this.made[i]>=6){void ctx.say('kitchen.undo');return;}
          this.made[i]++;this.additions.push(i);sfx.pop(5+i*2);this.drawMeal();this.drawHint();
        });ctx.stage.addChild(b);this.ingredients.push(b);
      }
      this.recipeCard.addChild(new Graphics().roundRect(-235,-60,470,120,20).fill(cream).stroke({width:5,color:swatch.brown.line}));
      this.base.forEach((n,i)=>{ for(let j=0;j<n;j++){const f=fruit(this.kinds[i]);f.position.set(-150+i*170+j*52,0);this.recipeCard.addChild(f);} });
      const times=label(this.plan.mode==='half-recipe'?'÷ 2':'× 2',36);times.position.set(175,0);this.recipeCard.addChild(times);
    }
  }
  private counts(){return this.plates.map((_,i)=>this.pieces.filter(p=>p.plate===i).length);}
  private clearPieces(){for(const p of this.pieces){p.drag?.destroy();p.node.destroy({children:true});}this.pieces.length=0;}
  private cut(parts:number,quiet=false){
    if(this.done||this.split)return;
    this.split=parts;sfx.squish();
    for(const b of this.cuts){this.ctx.tw.kill(b.scale);b.scale.set(1);}
    for(let i=0;i<parts*this.plan.wholes;i++) {
      const node=new Container();node.addChild(pieceOf(this.whole,parts));this.pieceLayer.addChild(node);
      const piece:Piece={node,plate:-1,drag:null};
      if(this.tapDeal){
        // The lap rung: no cut, no drag. Any touch on a piece deals it to the friend with fewer.
        onTap(node,()=>this.deal(piece),{radius:75});this.pieces.push(piece);continue;
      }
      node.hitArea=new Circle(0,0,55);
      piece.drag=draggable(node,this.ctx.tw,{
        onPick:()=>sfx.tick(),
        onDrop:(x,y)=>{
          if(this.done)return false;
          const nearest=plateAt(this.plates,x,y);
          // Moving food back to the tray is also an undo. No exploratory move counts as wrong.
          if(nearest<0 && y<this.view.h-260)return false;
          piece.plate=nearest;this.layoutPieces();this.drawHint();sfx.bell(5,0.2);return true;
        },
      });this.pieces.push(piece);
    }
    this.resize(this.view);
    if(quiet)return;
    if(this.ctx.level===9) void this.ctx.instruct('kitchen.thirds-share');
    else void this.ctx.instruct(this.plan.mode==='fraction'?'kitchen.fraction-share':'kitchen.share',this.plan.mode==='fraction'?{amount:this.request.name}:{n:this.plan.friends});
  }
  /** A tap on a tray piece sends it to the plate with the fewest; nothing a touch can do here is wrong. */
  private deal(piece:Piece){
    if(this.done)return;
    this.idle=0;
    if(piece.plate>=0){this.wiggle(piece.node);return;}
    piece.plate=dealTo(this.counts());sfx.bell(5+piece.plate*2,0.3);
    this.layoutPieces(true);
    if(this.pieces.every(p=>p.plate>=0)){
      this.done=true;
      void this.eat().then(()=>this.ctx.say('kitchen.done')).then(()=>this.ctx.tw.wait(0.4)).then(()=>this.ctx.finish({misses:0,hints:0}));
    }
  }
  private wiggle(f:Container){
    this.ctx.tw.kill(f);f.rotation=0;
    void this.ctx.tw.to(f,{rotation:0.14},{duration:0.08}).then(()=>this.ctx.tw.to(f,{rotation:-0.14},{duration:0.12})).then(()=>this.ctx.tw.to(f,{rotation:0},{duration:0.1}));
  }
  /** The nearest tray piece to a touch anywhere else wiggles, so an empty-handed touch still answers. */
  private wiggleNearest(x:number,y:number){
    let best:Piece|undefined,d=Infinity;
    for(const p of this.pieces)if(p.plate<0){const e=Math.hypot(p.node.x-x,p.node.y-y);if(e<d){d=e;best=p;}}
    if(best)this.wiggle(best.node);
  }
  /** The served pieces slide to the friends' mouths and the friends chew (three munches), then are glad. */
  private async eat(){
    const tw=this.ctx.tw;
    for(const p of this.pieces){
      const plate=this.plates[p.plate];if(!plate)continue;
      void tw.to(p.node,{x:plate.x,y:plate.y-100},{duration:0.5}).then(()=>tw.to(p.node.scale,{x:0.1,y:0.1},{duration:0.15})).then(()=>{p.node.visible=false;});
    }
    await tw.wait(0.75);
    for(const f of this.friends){f.setMood('happy');f.hop(1);}
    for(let i=0;i<3;i++){
      sfx.munch();
      for(const f of this.friends)void tw.to(f.scale,{y:0.38},{duration:0.1}).then(()=>tw.to(f.scale,{y:0.45},{duration:0.1}));
      await tw.wait(0.3);
    }
  }
  private check(){
    if(this.done)return;
    const ok=this.plan.mode==='share'?fair(this.counts(),this.pieces.length):this.plan.mode==='fraction'?servesFraction(this.request,this.split,this.counts()[0]):this.plan.mode==='half-recipe'?halved(this.base,this.made):doubled(this.base,this.made);
    if(ok){
      this.done=true;this.pieces.forEach(p=>{if(p.drag)p.drag.enabled=false;});this.glow.clear();sfx.sparkle();
      const finish=()=>this.ctx.finish({misses:this.misses,hints:this.hints});
      if(this.plan.mode==='fraction'){
        // Count the served pieces aloud, each one hopping as it is named: "one quarter, two quarters: one half".
        const served=this.pieces.filter(p=>p.plate===0);
        served.forEach((p,i)=>void this.ctx.tw.wait(0.15+i*0.55).then(()=>{sfx.pop(4+i);return this.ctx.tw.to(p.node.scale,{x:1.2,y:1.2},{duration:0.15});}).then(()=>this.ctx.tw.to(p.node.scale,{x:1,y:1},{duration:0.2})));
        void this.ctx.say('kitchen.fraction-count',{count:countAloud(this.split,served.length),amount:this.request.name}).then(()=>this.eat()).then(()=>this.ctx.tw.wait(0.3)).then(finish);
      } else if(this.plan.mode==='share'){
        void this.eat().then(()=>this.ctx.say('kitchen.done')).then(()=>this.ctx.tw.wait(0.4)).then(finish);
      } else {void this.ctx.say('kitchen.done');void this.ctx.tw.wait(1.1).then(finish);}
      return;
    }
    this.misses++;this.wrong++;sfx.boing();
    if(this.wrong===2){this.assisted=true;this.hints++;}
    if(this.plan.mode==='share'||this.plan.mode==='fraction'){
      const trouble=serveTrouble(this.counts(),this.pieces.length);
      if(trouble==='uncut')this.instruction();
      else if(trouble==='empty')void this.ctx.say('kitchen.empty');
      // The glow that comes with a second miss says the recut line itself.
      else if(trouble==='short'){if(!this.assisted||this.wrong!==2)void this.ctx.say('kitchen.short');}
      else void this.ctx.say(this.plan.mode==='share'?'kitchen.fair':'kitchen.fraction-hint');
    } else void this.ctx.say(this.plan.mode==='half-recipe'?'kitchen.half-hint':'kitchen.double-hint');
    this.drawHint();
  }
  private drawHint(){
    this.glow.clear();if(!this.assisted||this.done)return;
    if(this.plan.mode==='share'||this.plan.mode==='fraction') {
      if(!this.split){
        // Nothing cut yet: glow the cut that works, not the hidden round arrow.
        const wanted=this.plan.mode==='fraction'?fractionCut(this.request,this.plan.cuts):fairCut(this.plan);
        const b=this.cuts[Math.max(0,(this.plan.cuts as readonly number[]).indexOf(wanted!))];
        this.glow.circle(b.x,b.y,62).stroke({width:8,color:swatch.yellow.line});return;
      }
      if(this.plan.mode==='fraction'&&!fractionCut(this.request,[this.split])){this.glow.circle(this.recut.x,this.recut.y,62).stroke({width:8,color:swatch.yellow.line});void this.ctx.say('kitchen.recut');return;}
      if(this.pieces.length<this.plates.length){this.glow.circle(this.recut.x,this.recut.y,62).stroke({width:8,color:swatch.yellow.line});void this.ctx.say('kitchen.recut');return;}
      const p=this.plates[nextPlate(this.counts())];this.glow.circle(p.x,p.y,84).stroke({width:8,color:swatch.yellow.line});
    } else {
      const i=this.plan.mode==='half-recipe'?halfIngredientHint(this.base,this.made):ingredientHint(this.base,this.made);if(i<0)return;
      const wanted=this.plan.mode==='half-recipe'?this.base[i]/2:this.base[i]*2;
      const b=this.made[i]>wanted?this.undo:this.ingredients[i];this.glow.circle(b.x,b.y,65).stroke({width:8,color:swatch.yellow.line});
    }
  }
  private layoutPieces(animate=false){
    const v=this.view, offsets=this.plates.map(()=>0);
    const xs=spread(4,200,v.w-80,145);
    this.pieces.forEach((p,i)=>{
      const slot=p.plate<0?i:offsets[p.plate]++, plate=this.plates[p.plate];
      const home=p.plate<0?{x:xs[i%4],y:v.h-90-Math.floor(i/4)*125}:{x:plate.x+(slot%2?32:-32),y:plate.y+(Math.floor(slot/2)%2?30:-24)};
      if(!p.drag){
        if(animate&&p.node.x+p.node.y!==0&&(p.node.x!==home.x||p.node.y!==home.y))void this.ctx.tw.to(p.node,{x:home.x,y:home.y},{duration:0.28});
        else{this.ctx.tw.kill(p.node);p.node.position.set(home.x,home.y);}
        return;
      }
      p.drag.home=home;if(!p.drag.dragging){this.ctx.tw.kill(p.node);p.node.position.set(home.x,home.y);}
    });
  }
  private drawMeal(){
    for(const c of this.meal.removeChildren())c.destroy({children:true});
    this.made.forEach((n,i)=>{for(let j=0;j<n;j++){const f=fruit(this.kinds[i]);f.position.set(-140+i*170+(j%3)*45,Math.floor(j/3)*55);this.meal.addChild(f);}});
  }
  private instruction(){
    if(this.tapDeal){void this.ctx.instruct('kitchen.deal');return;}
    if(this.ctx.level===9) { void this.ctx.instruct(this.split?'kitchen.thirds-share':'kitchen.thirds-cut'); return; }
    if(this.plan.mode==='half-recipe')void this.ctx.instruct('kitchen.half');
    else if(this.plan.mode==='recipe')void this.ctx.instruct('kitchen.double');
    else if(this.plan.mode==='fraction')void this.ctx.instruct(this.split?'kitchen.fraction-share':'kitchen.fraction',{amount:this.request.name});
    else void this.ctx.instruct(this.split?'kitchen.share':'kitchen.cut',{n:this.plan.friends});
  }
  /** A touch on the uncut food: it wiggles and the cut instruction comes again. Free, never a miss. */
  private poke(f:Container){
    if(this.done||this.split)return;
    this.idle=0;sfx.squish();this.ctx.tw.kill(f);f.rotation=0;
    void this.ctx.tw.to(f,{rotation:0.12},{duration:0.08}).then(()=>this.ctx.tw.to(f,{rotation:-0.12},{duration:0.12})).then(()=>this.ctx.tw.to(f,{rotation:0},{duration:0.1}));
    if(this.clock-this.lastPoke>3){this.lastPoke=this.clock;this.instruction();}
  }
  start(){this.instruction();}
  resize(v:View){
  this.view=v;
    this.background.clear().rect(0,0,v.w,v.h).fill(swatch.orange.light).roundRect(165,v.h-260,v.w-190,245,30).fill(cream);
    this.serve.position.set(v.w-75,65);this.undo.position.set(v.w-75,v.h-80);this.recut.position.set(205,65);
    this.serve.visible=!this.tapDeal;this.undo.visible=this.plan.mode==='recipe'||this.plan.mode==='half-recipe';this.recut.visible=(this.plan.mode==='share'||this.plan.mode==='fraction')&&this.split>0;
    const px=spread(this.plates.length,180,v.w-50,185);
    this.plates.forEach((p,i)=>{p.position.set(px[i],Math.max(310,v.h*0.36));p.visible=this.split>0;});
    this.bubble.position.set(px[0]+125,Math.max(310,v.h*0.36)-150);
    for(const c of this.food.removeChildren()){this.ctx.tw.kill(c);c.destroy({children:true});}
    if(!this.split&&(this.plan.mode==='share'||this.plan.mode==='fraction'))for(let i=0;i<this.plan.wholes;i++){const f=wholeOf(this.whole,this.ctx.level);f.scale.set(1.2);f.position.set(v.w/2+(i-(this.plan.wholes-1)/2)*240,v.h*0.4);onTap(f,()=>this.poke(f),{radius:90});this.food.addChild(f);}
    const xs=spread(this.cuts.length,250,v.w-180,200);this.cuts.forEach((b,i)=>{b.position.set(xs[i],v.h-110);b.visible=!this.split;});
    this.recipeCard.position.set(v.w/2,215);this.meal.position.set(v.w/2,v.h*0.5);
    this.ingredients.forEach((b,i)=>b.position.set(v.w/2+(i?110:-110),v.h-95));
    if(this.plan.mode==='recipe'||this.plan.mode==='half-recipe')this.background.ellipse(v.w/2,v.h*0.5+30,245,110).fill(swatch.white.fill).stroke({width:7,color:swatch.blue.line});
    this.layoutPieces();this.drawHint();
  }
  update(dt:number){
    this.clock+=dt;
    if(this.tapDeal&&!this.done&&(this.idle+=dt)>=6){
      this.idle=0;this.instruction();
      const loose=this.pieces.find(p=>p.plate<0);if(loose)this.wiggle(loose.node);
    }
    if(!this.done&&!this.split&&this.cuts.length&&(this.idle+=dt)>=6){
      this.idle=0;
      this.cuts.forEach((b,i)=>void this.ctx.tw.to(b.scale,{x:1.18,y:1.18},{duration:0.18,delay:i*0.12}).then(()=>this.ctx.tw.to(b.scale,{x:1,y:1},{duration:0.25})));
    }
    this.glow.alpha=0.7+0.3*Math.sin(this.clock*3);if(this.done)this.meal.rotation=Math.sin(this.clock*7)*0.04;}
  /** The ghost finger on the how-to card: cut fairly, give each plate a piece in turn, serve; or add fruit until the recipe is doubled, serve. */
  autotouch():TouchIntent|null{
    if(this.done)return null;
    if(this.tapDeal){const loose=this.pieces.find(p=>p.plate<0);return loose?{tap:{on:loose.node}}:null;}
    if(this.plan.mode==='recipe'||this.plan.mode==='half-recipe'){
      const i=this.plan.mode==='half-recipe'?halfIngredientHint(this.base,this.made):ingredientHint(this.base,this.made);
      return i>=0?{tap:{on:this.ingredients[i]}}:{tap:{on:this.serve}};
    }
    if(!this.split){
      const wanted=this.plan.mode==='fraction'?fractionCut(this.request,this.plan.cuts):fairCut(this.plan);
      const cut=this.cuts[(this.plan.cuts as readonly number[]).indexOf(wanted!)];
      return cut?{tap:{on:cut}}:null;
    }
    if(this.pieces.some(p=>p.drag?.dragging))return null;
    const needed=this.plan.mode==='fraction'?this.split*this.request.numerator/this.request.denominator:Infinity;
    const loose=this.pieces.find(p=>p.plate<0&&this.counts()[0]<needed);
    if(loose)return {drag:{on:loose.node},to:{on:this.plates[nextPlate(this.counts())]}};
    return {tap:{on:this.serve}};
  }
  destroy(){this.clearPieces();}
}
/** Level 10 (tap dealing) is the lap band's only level and toddler's first; it steps to the cutting levels after two smooth rounds. */
const LEVELS:BandLevels={lap:{min:10,max:10},toddler:{min:1,max:10,order:[10,1]},preschool:{min:1,max:4},prek:{min:3,max:6},school:{min:5,max:9}};
export const petKitchen:GameModule={
  id:'pet-kitchen',name:'Pet Kitchen',titleLine:'game.pet-kitchen',region:'counting-cove',
  skills:['equal-shares','fractions','doubling'],bands:['lap','toddler','preschool','prek','school'],
  levels:b=>rangeFor(LEVELS,b),entryLevels:[DEAL_LEVEL],
  describeLevel:l=>planFor(l).name,music:STYLES.paint,touchDemo:true,
  coplayHint:'Share the food together. Help {name} give a piece to each friend, then serve it.',
  offScreen:'Share a sandwich or paper circle in equal parts. Put every piece back together to see the whole.',
  hubIcon:()=>{const c=new Container();const f=sandwich();f.y=-75;c.addChild(f);return new WigglyIcon(c);},
  sticker:seed=>{const c=new Container();c.addChild(sandwich());const f=fruit(new Rng(seed).int(0,1));f.position.set(50,-60);c.addChild(f);return c;},
  create:ctx=>new PetKitchen(ctx),
};
