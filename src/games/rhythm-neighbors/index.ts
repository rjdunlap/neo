import { Circle, Container, Graphics } from 'pixi.js';
import { cream, swatch } from '../../art/palette';
import { musicNote } from '../../art/shapes';
import { STYLES } from '../../audio/music';
import { sfx } from '../../audio/sfx';
import { onTap } from '../../engine/input';
import { Rng } from '../../engine/random';
import type { View } from '../../engine/view';
import { RoundButton } from '../../ui/buttons';
import { arrowIcon, againIcon } from '../../ui/icons';
import { WigglyIcon } from '../shared';
import type { Game,GameContext,GameModule } from '../types';
import { accepts, makePhrases, planFor, schedule } from './logic';

function frog(which:number,r=65){const s=which?swatch.teal:swatch.green,g=new Graphics();g.ellipse(0,10,r,r*0.65).fill(s.fill).stroke({width:5,color:s.line});for(const x of [-r*.5,r*.5])g.circle(x,-r*.35,r*.28).fill(s.fill).stroke({width:4,color:s.line}).circle(x,-r*.36,r*.13).fill(swatch.white.fill).circle(x,-r*.36,r*.06).fill(swatch.purple.line);g.moveTo(-r*.4,12).quadraticCurveTo(0,35,r*.4,12).stroke({width:4,color:s.line});return g;}
function bird(){const g=new Graphics().roundRect(-35,-100,70,180,20).fill(swatch.brown.fill).stroke({width:5,color:swatch.brown.line});g.ellipse(12,-45,35,48).fill(swatch.orange.fill).circle(15,-91,30).fill(swatch.red.fill).poly([35,-98,70,-87,35,-82]).fill(swatch.yellow.fill).circle(26,-98,5).fill(swatch.purple.line);return g;}
class RhythmNeighbors implements Game{
 private view: View;
 readonly plan;readonly phrases;phrase=0;readonly taps:{voice:number;at:number}[]=[];
 readonly frogs:Container[]=[];readonly bird=new Container();readonly submit:RoundButton;readonly replay:RoundButton;readonly help:RoundButton;
 private readonly bg=new Graphics();private readonly score=new Container();private readonly glow=new Graphics();
 private clock=0;private events:{at:number;voice:number;note:number}[]=[];private busyUntil=0;private wrong=0;private guided=false;private plays=0;
 busy=false;done=false;misses=0;hints=0;
 constructor(private readonly ctx:GameContext){
  this.view = ctx.view;
  this.plan=planFor(ctx.level);this.phrases=makePhrases(ctx.level,ctx.rng);
  ctx.stage.addChild(this.bg,this.bird,this.score,this.glow);this.glow.eventMode='none';this.bird.addChild(bird());this.bird.hitArea=new Circle(0,-30,110);
  onTap(this.bird,()=>{if(this.done)return;this.bird.scale.set(1.08);this.demonstrate();});
  for(let i=0;i<this.plan.voices;i++){
   const node=new Container();node.addChild(frog(i));onTap(node,()=>this.play(i),{radius:100});ctx.stage.addChild(node);this.frogs.push(node);
  }
  this.submit=new RoundButton(arrowIcon(1),swatch.green,50,()=>this.check());
  this.replay=new RoundButton(againIcon(),swatch.white,50,()=>this.demonstrate());
  this.help=new RoundButton(musicNote(new Graphics(),40,swatch.orange.line),swatch.yellow,50,()=>{
   if(this.busy||this.done)return;if(!this.guided){this.hints++;this.guided=true;}this.taps.length=0;void ctx.say('neighbors.help');this.drawScore();
  });ctx.stage.addChild(this.submit,this.replay,this.help);
 }
 private sound(voice:number){if(voice<0){sfx.knock();this.bird.scale.set(1.08);}else {if(voice===0)sfx.croak();else sfx.bell(4,0.35);this.frogs[voice]?.scale.set(1.12);}}
 private demonstrate(){
  if(this.busy||this.done)return;this.taps.length=0;this.busy=true;
  const p=this.phrases[this.phrase];
  const call=schedule(p.call,this.clock+0.3);this.events=call.map(at=>({at,voice:-1,note:-1}));
  const response=schedule(p.gaps,call.at(-1)!+0.9);
  this.events.push(...response.map((at,i)=>({at,voice:p.voices[i],note:i})));
  this.busyUntil=response.at(-1)!+0.8;this.drawScore();
 }
 private play(voice:number){
  if(this.done)return;this.sound(voice);
  if(this.plan.free){this.plays++;this.submit.visible=true;return;}
  if(this.busy)return; // Hearing and exploring during the demonstration is welcome.
  if(this.taps.length>=this.phrases[this.phrase].voices.length+1)return;
  this.taps.push({voice,at:this.clock});this.drawScore();
 }
 private check(){
  if(this.busy||this.done)return;
  if(this.plan.free){if(this.plays>0)this.finish();return;}
  const p=this.phrases[this.phrase];
  if(!accepts(p,this.taps,this.plan.timing,this.guided)){
   this.misses++;this.wrong++;sfx.boing();void this.ctx.say('neighbors.again');
   if(this.wrong===2&&!this.guided){this.guided=true;this.hints++;}
   this.demonstrate();return;
  }
  sfx.sparkle();this.phrase++;this.taps.length=0;this.wrong=0;this.guided=false;
  if(this.phrase===this.phrases.length){this.finish();return;}
  this.drawScore();this.demonstrate();
 }
 private finish(){
  if(this.done)return;this.done=true;this.events=[];this.glow.clear();void this.ctx.say('neighbors.done');
  // A short performed ending alternates bird and chorus, using the scene clock.
  this.events=[0,0.35,0.7,1.2].map((t,i)=>({at:this.clock+t,voice:i%2?-1:0,note:-1}));
  void this.ctx.tw.wait(1.7).then(()=>this.ctx.finish({misses:this.misses,hints:this.hints}));
 }
 private drawScore(active=-1){
  for(const c of this.score.removeChildren())c.destroy({children:true});this.glow.clear();
  if(this.plan.free||this.done)return;
  const p=this.phrases[this.phrase],times=schedule(p.gaps),end=times.at(-1)||1;
  p.voices.forEach((v,i)=>{
   const node=new Container();node.addChild(new Graphics().circle(0,0,43).fill(i<this.taps.length?swatch.yellow.light:cream).stroke({width:i===active?8:4,color:swatch[v?'teal':'green'].line}),frog(v,27));
   node.position.set(250+times[i]/end*(this.view.w-370),0);this.score.addChild(node);
  });
  if(this.guided){const voice=p.voices[Math.min(this.taps.length,p.voices.length-1)],f=this.frogs[voice];this.glow.circle(f.x,f.y,106).stroke({width:9,color:swatch.yellow.line});}
 }
 start(){void this.ctx.instruct(this.plan.free?'neighbors.free':this.plan.timing?'neighbors.rhythm':'neighbors.turns');if(!this.plan.free)this.demonstrate();}
 resize(v:View){
  this.view=v;
  this.bg.clear().rect(0,0,v.w,v.h).fill(swatch.green.light).ellipse(v.w/2,v.h-160,Math.min(400,v.w*.4),130).fill(swatch.blue.light);
  this.bird.position.set(155,300);this.score.y=290;
  this.frogs.forEach((f,i)=>f.position.set(v.w/2+(this.frogs.length===1?0:i?160:-160),v.h-180));
  this.submit.position.set(v.w-80,65);this.submit.visible=!this.plan.free||this.plays>0;
  this.replay.position.set(220,65);this.help.position.set(360,65);this.help.visible=!this.plan.free;
  this.drawScore();
 }
 update(dt:number){
  this.clock+=dt;for(const node of [this.bird,...this.frogs])node.scale.set(1+(node.scale.x-1)*Math.exp(-8*dt));
  while(this.events.length&&this.events[0].at<=this.clock){const e=this.events.shift()!;this.sound(e.voice);this.drawScore(e.note);}
  if(this.busy&&this.clock>=this.busyUntil){this.busy=false;this.drawScore();if(!this.plan.free)void this.ctx.say(this.guided?'neighbors.help':'neighbors.your-turn');}
 }
 destroy(){this.events=[];this.done=true;}
}
export const rhythmNeighbors:GameModule={
 id:'rhythm-neighbors',name:'Rhythm Neighbors',titleLine:'game.rhythm-neighbors',region:'music-mountain',skills:['turn-taking','rhythm','musical-expression'],bands:['lap','toddler','preschool','prek'],
 levels:b=>b==='lap'?{min:1,max:2}:b==='toddler'?{min:2,max:3}:b==='preschool'?{min:3,max:4}:{min:4,max:6},describeLevel:l=>planFor(l).name,
 music:{...STYLES.jelly,shaker:false,volume:0.15},coplayHint:'Let {name} answer the woodpecker with a frog. Any timing is welcome in the first turns.',offScreen:'Take turns knocking on a table. Try a short question and a different answering rhythm.',
 hubIcon:()=>{const c=new Container();const f=frog(0);f.y=-35;c.addChild(f);return new WigglyIcon(c);},sticker:seed=>frog(new Rng(seed).int(0,1),80),create:ctx=>new RhythmNeighbors(ctx),
};
