import {Container,Graphics,Rectangle,type FederatedPointerEvent} from 'pixi.js';
import {cream,ink,swatch,wood} from '../../art/palette';
import {STYLES} from '../../audio/music';
import {sfx} from '../../audio/sfx';
import {CLOTH_PALETTE,CLOTH_COLORS} from '../../content/creations';
import {onTap,palmOnGlass} from '../../engine/input';
import type {View} from '../../engine/view';
import {rangeFor,type BandLevels} from '../../progress/difficulty';
import {finish} from '../../ui/buttons';
import {WigglyIcon} from '../shared';
import type {Game,GameContext,GameModule,TouchIntent} from '../types';
import {clothArt,emblem,yarnMark} from './art';
import {Round,drawdown,PEDALS,type Pedal} from './logic';
import {layout} from './layout';
const LEVELS:BandLevels={toddler:{min:1,max:2},preschool:{min:2,max:3},prek:{min:3,max:3}};
class Pad extends Container {
  readonly face=new Container();readonly rim=new Graphics();
  constructor(w:number,h:number){super();this.hitArea=new Rectangle(-w/2,-h/2,w,h);this.addChild(finish({w,h,corner:20},swatch.brown,cream),this.face,this.rim);this.face.eventMode=this.rim.eventMode='none';}
}
export class LittleLoom implements Game {
  readonly root=new Container();readonly sceneArt=new Container();readonly warp=new Graphics();readonly cloth=new Container();readonly shuttleArt=new Graphics();readonly beater=new Graphics();
  readonly free=new Container();readonly shuttle=new Pad(180,120);readonly pots=[0,1,2].map(()=>new Pad(120,120));readonly pedals=[0,1].map(()=>new Pad(140,120));
  readonly round:Round;readonly companion;boxes;elapsed=0;finishing=0;finished=false;destroyed=false;readonly spoken=new Set<number>();hintLabel='Show a hint';askForHint?:()=>void;
  private preview:Pedal|null=null;
  private held:{node:Container;id:number;action:()=>void}|null=null;
  get misses(){return this.round.misses;} get hints(){return this.round.hints;}
  private cancel=()=>{if(this.held)this.held.node.alpha=1;this.held=null;const had=this.preview!==null;this.preview=null;if(had&&!this.destroyed)this.draw();};
  private outside=(e:PointerEvent)=>{if(!(e.target instanceof HTMLCanvasElement)){this.cancel();return;}const b=e.target.getBoundingClientRect();if(e.clientX<b.left||e.clientX>b.right||e.clientY<b.top||e.clientY>b.bottom)this.cancel();};
  constructor(private ctx:GameContext){
    this.round=new Round(ctx.level);this.boxes=layout(ctx.view);ctx.stage.addChild(this.root);this.root.addChild(this.sceneArt,this.free,this.shuttle,...this.pots,...this.pedals);this.sceneArt.eventMode='none';this.sceneArt.addChild(this.warp,this.cloth,this.shuttleArt,this.beater);
    this.companion=ctx.companion();this.companion.scale.set(.32);this.companion.eventMode='none';ctx.track(this.companion);this.sceneArt.addChild(this.companion);this.companion.visible=false;
    this.bind(this.free,()=>this.throw());this.bind(this.shuttle,()=>this.throw());
    this.pots.forEach((p,i)=>{yarnMark(p.face.addChild(new Graphics().circle(0,0,39).fill(CLOTH_COLORS[i]).stroke({color:ink,width:3})),i,0,0,46);this.bind(p,()=>{this.round.choose(i);if(!this.spoken.has(i)){this.spoken.add(i);void ctx.say('loom.color',{color:CLOTH_PALETTE[i]});}this.draw();});});
    this.pedals.forEach((p,i)=>{const g=new Graphics();PEDALS[i].forEach((up,c)=>g.moveTo(-48+c*19,up?-29:0).lineTo(-48+c*19,up?0:29).stroke({color:ink,width:up?8:3}));p.face.addChild(g);this.bind(p,()=>{this.round.select(i as Pedal);void ctx.instruct('loom.send');this.draw();},i as Pedal);});
    this.shuttle.face.addChild(new Graphics().poly([-55,0,-25,-22,27,-22,55,0,27,22,-25,22]).fill(wood.fill).stroke({color:wood.line,width:4}));
    if(this.round.level===3)this.askForHint=()=>{if(this.destroyed||this.finished||this.round.busy)return;this.round.help();this.draw();void ctx.say('loom.help');};
    window.addEventListener('pointercancel',this.cancel,true);window.addEventListener('pointerup',this.outside,true);window.addEventListener('blur',this.cancel);this.resize(ctx.view);
  }
  private bind(node:Container,action:()=>void,preview?:Pedal){
    onTap(node,e=>{if(this.destroyed||this.finished||this.round.busy||this.held)return;node.alpha=.65;this.held={node,id:e.pointerId,action};if(preview!==undefined){this.preview=preview;this.draw();}},{cooldown:0});
    const up=(e:FederatedPointerEvent)=>{const h=this.held;if(!h||h.node!==node||h.id!==e.pointerId)return;const p=node.toLocal(e.global);const inside=node.hitArea?.contains(p.x,p.y);this.cancel();if(inside&&!palmOnGlass()&&!this.round.busy&&!this.destroyed&&!this.finished)h.action();};
    node.on('pointerup',up);node.on('pointerupoutside',()=>this.cancel());node.on('pointerout',()=>this.cancel());
  }
  start(){void this.ctx.instruct(this.round.level===1?'loom.zoom':this.round.level===2?'loom.yarn':'loom.pedals');}
  private throw(){const r=this.round.begin();if(r==='choose'){void this.ctx.instruct('loom.choose-pedal');return;}if(r==='ignored')return;this.elapsed=0;this.draw();}
  private draw(){
    const r=this.round,l=this.boxes,a=l.loom;const g=this.warp.clear();
    g.roundRect(a.x-30,a.y-35,6*a.cell+60,8*a.cell+65,18).fill(wood.light).stroke({color:wood.line,width:10});
    for(let c=0;c<6;c++){const x=a.x+(c+.5)*a.cell;g.moveTo(x,a.y-25).lineTo(x,a.y+8*a.cell+20).stroke({color:ink,width:8});g.moveTo(x,a.y-25).lineTo(x,a.y+8*a.cell+20).stroke({color:swatch.white.fill,width:(this.preview??r.selected)!==null&&PEDALS[(this.preview??r.selected)!][c]?6:4});}
    for(const child of this.cloth.removeChildren())child.destroy();
    const cells=r.lifts.flatMap((row,i)=>drawdown([3,3,3,3,3,3],r.yarns[i],row));this.cloth.addChild(clothArt(cells,a.cell,r.lifts));this.cloth.position.set(a.x,a.y);
    this.pots.forEach((p,i)=>{p.rim.clear();if(i===r.yarn)p.rim.roundRect(-55,-55,110,110,16).stroke({color:ink,width:5});});
    this.pedals.forEach((p,i)=>{p.face.y=(this.preview??r.selected)===i?8:0;p.rim.clear();if(r.selected===i)p.rim.roundRect(-64,-54,128,108,16).stroke({color:ink,width:5});if(r.helped&&r.next===i)p.rim.roundRect(-68,-58,136,116,18).stroke({color:swatch.yellow.fill,width:6});});
    const dir=r.rows%2===0?1:-1;const arrow=this.shuttle.rim.clear();arrow.moveTo(-dir*22,40).lineTo(dir*25,40).lineTo(dir*12,31).moveTo(dir*25,40).lineTo(dir*12,49).stroke({color:ink,width:5});
    this.animate();
  }
  private animate(){
    const r=this.round,a=this.boxes.loom,p=r.pending;const t=Math.min(1,this.elapsed/.55);const dir=r.rows%2===0?1:-1;
    const start=dir===1?a.x-45:a.x+6*a.cell+45,end=dir===1?a.x+6*a.cell+45:a.x-45;
    const slip=!!p?.error;const progress=slip&&this.elapsed>.55?Math.max(0,1-(this.elapsed-.55)/.45):t;
    const x=p?start+(end-start)*progress:start,y=a.y+Math.min(7,r.rows)*a.cell+a.cell/2;
    const g=this.shuttleArt.clear();
    if(p){g.moveTo(start,y).lineTo(x,y+(slip?Math.sin(progress*Math.PI)*26:0)).stroke({color:CLOTH_COLORS[p.yarn],width:12});}
    g.poly([x-35,y,x-15,y-15,x+20,y-15,x+38,y,x+20,y+15,x-15,y+15]).fill(wood.fill).stroke({color:wood.line,width:3});
    yarnMark(g,p?.yarn??r.yarn,x,y,16);
    const beat=this.beater.clear();if(p&&!slip&&this.elapsed>.55){const by=y-35+Math.sin(Math.min(1,(this.elapsed-.55)/.45)*Math.PI)*33;beat.roundRect(a.x-20,by,a.cell*6+40,12,4).fill(wood.line);}
  }
  update(dt:number){if(this.destroyed)return;if(this.finishing>0){this.finishing-=dt;if(this.finishing<=0)this.ctx.finish({misses:this.round.misses,hints:this.round.hints,creation:this.round.creation()!});return;}if(!this.round.busy)return;this.elapsed+=dt;this.animate();if(this.elapsed<1)return;const result=this.round.settle();if(result==='slip'){sfx.boing();void this.ctx.instruct('loom.slip-repeat');}else{sfx.marimba([0,2,4,7,9][this.round.rows%5]);if(this.round.level===3)void this.ctx.instruct('loom.choose-pedal');}this.draw();if(this.round.finished&&!this.finished){this.finished=true;this.companion.visible=true;this.cloth.position.set(this.boxes.companion.x-135,this.boxes.companion.y-180);this.cloth.scale.set(.5);this.finishing=1.3;void this.ctx.say('loom.done');}}
  resize(v:View){this.cancel();this.boxes=layout(v);const l=this.boxes;const put=(n:Container,b:{x:number;y:number})=>n.position.set(b.x,b.y);put(this.shuttle,l.shuttle);this.pots.forEach((p,i)=>{put(p,l.pots[i]);p.visible=this.round.level===2;});this.pedals.forEach((p,i)=>{put(p,l.pedals[i]);p.visible=this.round.level===3;});this.shuttle.visible=this.round.level!==1;this.free.visible=this.round.level===1;this.free.hitArea=new Rectangle(l.free.x,l.free.y,l.free.w,l.free.h);this.companion.position.set(l.companion.x,l.companion.y);this.draw();}
  autotouch():TouchIntent|null {const r=this.round;if(this.destroyed||this.finished||r.busy)return null;if(r.level===1)return {tap:{on:this.free,x:this.boxes.loom.x+100,y:this.boxes.loom.y+100},receiver:this.free};if(r.level===2){const yarn=r.rows<2?0:r.rows<5?1:2;if(r.yarn!==yarn)return {tap:{on:this.pots[yarn]}};}if(r.level===3&&r.selected!==r.next)return {tap:{on:this.pedals[r.next]}};return {tap:{on:this.shuttle}};}
  destroy(){this.cancel();this.destroyed=true;this.round.destroy();window.removeEventListener('pointercancel',this.cancel,true);window.removeEventListener('pointerup',this.outside,true);window.removeEventListener('blur',this.cancel);this.ctx.untrack(this.companion);}
}
export const littleLoom:GameModule={id:'little-loom',name:'Little Loom',titleLine:'loom.title',region:'treehouse',skills:['over and under','free stripe choices','alternating lifts'],bands:['toddler','preschool','prek'],levels:b=>rangeFor(LEVELS,b),describeLevel:l=>['Zoom the shuttle: eight rows with automatic lifts','Pick the yarn: freely choose each stripe','Two pedals: alternate lifts before each row'][Math.max(0,Math.min(2,l-1))],music:STYLES.quiet,touchDemo:true,coplayHint:'Take turns choosing yarn or pressing a pedal and sending the shuttle. Find a stripe on your clothes together.',hubIcon:()=>new WigglyIcon(emblem()),sticker:()=>emblem(),create:ctx=>new LittleLoom(ctx)};
