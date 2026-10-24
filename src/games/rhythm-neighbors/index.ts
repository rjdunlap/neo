import { Circle, Container, Graphics, Rectangle } from 'pixi.js';
import { entryId } from '../../content/journal';
import { cream, swatch } from '../../art/palette';
import { musicNote } from '../../art/shapes';
import { STYLES, silenced } from '../../audio/music';
import { sfx } from '../../audio/sfx';
import { idle, type CouchControls } from '../../engine/controller';
import { onTap } from '../../engine/input';
import { Rng } from '../../engine/random';
import type { View } from '../../engine/view';
import { rangeFor, type BandLevels } from '../../progress/difficulty';
import { RoundButton } from '../../ui/buttons';
import { arrowIcon, againIcon } from '../../ui/icons';
import { WigglyIcon } from '../shared';
import type { Game,GameContext,GameModule,TouchIntent } from '../types';
import { BOT_CALLS, CALL_MAX, CALL_ROUNDS, FREE_TAPS, IDLE_WIGGLE, KNOCKS, KNOCK_ANSWER, KNOCK_FINALE, PAUSE_SECONDS, accepts, answerDelay, callEnded, callPhrase, finaleEvents, makePhrases, nextNote, planFor, schedule } from './logic';

const LEVELS: BandLevels = {
 lap: { min: 1, max: 7, order: [7, 1, 2] },
 toddler: { min: 2, max: 9, order: [2, 8, 9, 3] },
 preschool: { min: 3, max: 9, order: [9, 3, 4] },
 prek: { min: 4, max: 6 },
 school: { min: 5, max: 6 },
};

function frog(which:number,r=65){const s=which?swatch.teal:swatch.green,g=new Graphics();g.ellipse(0,10,r,r*0.65).fill(s.fill).stroke({width:5,color:s.line});for(const x of [-r*.5,r*.5])g.circle(x,-r*.35,r*.28).fill(s.fill).stroke({width:4,color:s.line}).circle(x,-r*.36,r*.13).fill(swatch.white.fill).circle(x,-r*.36,r*.06).fill(swatch.purple.line);g.moveTo(-r*.4,12).quadraticCurveTo(0,35,r*.4,12).stroke({width:4,color:s.line});return g;}
/** Level 7's big tree: trunk, leafy crown and the woodpecker, drawn around (0, 0) on the trunk. */
function tree(){
 const g=new Graphics().roundRect(-85,-120,170,400,30).fill(swatch.brown.fill).stroke({width:6,color:swatch.brown.line});
 for(const [x,y,r] of [[-110,-150,110],[110,-150,110],[0,-230,130],[0,-120,120]])g.circle(x,y,r).fill(swatch.green.fill);
 g.roundRect(-85,-120,170,400,30).fill(swatch.brown.fill).stroke({width:6,color:swatch.brown.line});
 const b=bird();b.scale.set(0.55);b.position.set(0,60);const c=new Container();c.addChild(g,b);return c;
}
/** The journal picture: the woodpecker and the frog that answers it. */
export function neighborsJournalPicture(){const c=new Container(),b=bird();b.scale.set(0.8);b.position.set(-100,0);const f=frog(0,80);f.position.set(90,60);c.addChild(b,f);return c;}
function bird(){const g=new Graphics().roundRect(-35,-100,70,180,20).fill(swatch.brown.fill).stroke({width:5,color:swatch.brown.line});g.ellipse(12,-45,35,48).fill(swatch.orange.fill).circle(15,-91,30).fill(swatch.red.fill).poly([35,-98,70,-87,35,-82]).fill(swatch.yellow.fill).circle(26,-98,5).fill(swatch.purple.line);return g;}
class RhythmNeighbors implements Game{
 private view: View;
 readonly plan;readonly phrases;phrase=0;readonly taps:{voice:number;at:number}[]=[];
 readonly frogs:Container[]=[];readonly bird=new Container();readonly submit:RoundButton;readonly replay:RoundButton;readonly help:RoundButton;
 private readonly bg=new Graphics();private readonly score=new Container();private readonly glow=new Graphics();
 private clock=0;private events:{at:number;voice:number;note:number}[]=[];private busyUntil=0;private wrong=0;private guided=false;private plays=0;
 private lastTouch=0;private wiggled=false;private wiggle=0;private wiggleFrog=0;
 /** Level 7: knocks so far. Level 8: the bird has called and the frog waits for her tap. */
 private knocks=0;waiting=false;
 /** Level 9: the times of her knocks in the call she is knocking now. */
 readonly callTimes:number[]=[];private readonly ripples:{x:number;y:number;t:number}[]=[];private readonly pond=new Graphics();
 /** A node's resting scale (the tree and the big frog are not 1). */
 private readonly base=new Map<Container,number>();
 /** Levels 7 and 9 put a big tree on the left and one big frog on the pond. */
 private get tree(){return !!(this.plan.knock||this.plan.call);}
 private bump(node:Container|undefined,k:number){node?.scale.set((this.base.get(node)??1)*k);}
 /** The ending song is playing: frog taps sound along and nothing is judged. */
 finale=false;
 busy=false;done=false;misses=0;hints=0;
 private botPlan:{at:number;voice:number}[]=[];private botSubmitAt=0;
 get finished(){return this.done;}
 constructor(private readonly ctx:GameContext){
  this.view = ctx.view;
  this.plan=planFor(ctx.level);this.phrases=makePhrases(ctx.level,ctx.rng);
  ctx.stage.addChild(this.bg,this.pond,this.bird,this.score,this.glow);this.glow.eventMode='none';this.pond.eventMode='none';
  if(this.plan.knock||this.plan.call){this.bird.addChild(tree());this.bird.hitArea=new Rectangle(-215,-360,430,640);}
  else {this.bird.addChild(bird());this.bird.hitArea=new Circle(0,-30,110);}
  onTap(this.bird,()=>{if(this.done)return;this.touched();if(this.plan.knock){this.knock();return;}if(this.plan.call){this.callKnock();return;}this.bump(this.bird,1.08);this.demonstrate();});
  for(let i=0;i<this.plan.voices;i++){
   const node=new Container();node.addChild(frog(i));onTap(node,()=>this.play(i),{radius:100});ctx.stage.addChild(node);this.frogs.push(node);
  }
  this.submit=new RoundButton(arrowIcon(1),swatch.green,50,()=>this.check());
  this.replay=new RoundButton(againIcon(),swatch.white,50,()=>this.demonstrate());
  this.help=new RoundButton(musicNote(new Graphics(),40,swatch.orange.line),swatch.yellow,50,()=>{
   if(this.busy||this.done)return;if(!this.guided){this.hints++;this.guided=true;}this.taps.length=0;void ctx.say('neighbors.help');this.drawScore();
  });ctx.stage.addChild(this.submit,this.replay,this.help);
 }
 sound(voice:number){if(voice<0){sfx.knock();this.bump(this.bird,1.08);}else {if(voice===0)sfx.croak();else sfx.ribbit();this.bump(this.frogs[voice],1.12);if(this.tree&&this.frogs[voice])this.ripples.push({x:this.frogs[voice].x,y:this.frogs[voice].y+30,t:0});}}
 private touched(){this.lastTouch=this.clock;this.wiggled=false;}
 /** Level 7: a knock anywhere on the tree gets exactly one croak a beat later; nothing is judged. */
 private knock(){
  if(this.knocks>=KNOCKS)return;
  this.knocks++;sfx.knock();this.bump(this.bird,1.04);
  this.events.push({at:this.clock+KNOCK_ANSWER,voice:0,note:-1});this.events.sort((a,b)=>a.at-b.at);
  if(this.knocks===KNOCKS)void this.ctx.tw.wait(KNOCK_ANSWER+0.5).then(()=>this.finish());
 }
 /** Level 9: a knock joins her call; during the frog's answer it is heard and not recorded. */
 private callKnock(){
  sfx.knock();this.bump(this.bird,1.04);
  if(this.busy||this.callTimes.length>=CALL_MAX)return;
  this.callTimes.push(this.clock);
 }
 /** Level 9: her call has ended, so the frog answers it with the gaps turned around, on the scene clock. */
 private answerCall(){
  const p=callPhrase(this.callTimes),start=this.clock+answerDelay(this.callTimes.length);
  this.callTimes.length=0;this.phrases.push(p);this.busy=true;
  const times=schedule(p.gaps,start);this.events=times.map((at,i)=>({at,voice:0,note:i}));this.busyUntil=times.at(-1)!+0.6;
 }
 private demonstrate(){
  if(this.busy||this.done||this.tree)return; // Levels 7 and 9 have no bird call of their own.this.taps.length=0;this.busy=true;this.waiting=false;
  const p=this.phrases[this.phrase];
  const call=schedule(p.call,this.clock+0.3);this.events=call.map(at=>({at,voice:-1,note:-1}));
  if(this.plan.turn){this.busyUntil=call.at(-1)!+0.6;this.drawScore();return;} // Level 8: the call alone, then the frog waits.
  const response=schedule(p.gaps,call.at(-1)!+0.9);
  this.events.push(...response.map((at,i)=>({at,voice:p.voices[i],note:i})));
  this.busyUntil=response.at(-1)!+0.8;this.drawScore();
 }
 private play(voice:number){
  if(this.done&&!this.finale)return;this.touched();this.sound(voice);
  if(this.done)return; // Joining the ending song: heard, never judged.
  if(this.tree)return; // The frog's own tap croaks; only knocks on the tree count.
  if(this.plan.turn){
   if(this.busy||!this.waiting)return; // A tap during the call croaks and is not counted.
   this.waiting=false;this.phrase++;this.bump(this.bird,1.15);sfx.sparkle();this.drawScore();
   if(this.phrase===this.phrases.length)this.finish();else void this.ctx.tw.wait(1).then(()=>this.demonstrate());
   return;
  }
  if(this.plan.free){this.plays++;this.submit.visible=true;if(this.plays>=FREE_TAPS)this.finish();return;}
  if(this.busy)return; // Hearing and exploring during the demonstration is welcome.
  this.pause();
  if(this.taps.length>=this.phrases[this.phrase].voices.length)return; // An extra tap croaks but is not recorded.
  this.taps.push({voice,at:this.clock});this.drawScore();
 }
 /** A long stop in the middle of a timed reply is thinking, not a mistake: the reply empties and starts again, with no miss. */
 private pause(){
  const last=this.taps.at(-1);
  if(!this.plan.timing||this.guided||this.busy||this.done||!last||this.taps.length>=this.phrases[this.phrase].voices.length||this.clock-last.at<=PAUSE_SECONDS)return;
  this.taps.length=0;void this.ctx.say('neighbors.pause');this.drawScore();
 }
 private check(){
  if(this.busy||this.done||this.plan.turn||this.tree)return;
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
  if(this.done)return;this.done=true;this.finale=true;this.glow.clear();this.drawScore();void this.ctx.say('neighbors.duet');
  // The ending song: the bird calls and every frog plays the last reply together, on the scene clock; her taps join in.
  const {events,end}=finaleEvents(this.phrases[Math.min(this.phrase,this.phrases.length-1)]??KNOCK_FINALE,this.frogs.length,this.clock);
  this.events=events.flatMap(e=>e.voices.map(voice=>({at:e.at,voice,note:-1})));
  void this.ctx.tw.wait(end-this.clock).then(()=>{this.finale=false;this.ctx.finish({misses:this.misses,hints:this.hints,discoveries:this.plan.free?[]:[entryId('rhythm-neighbors','frogs-answer')]});});
 }
 private drawScore(active=-1){
  for(const c of this.score.removeChildren())c.destroy({children:true});this.glow.clear();
  if(this.plan.turn){ // The frog glows only while it is her turn.
   const f=this.frogs[0];if(this.waiting&&!this.done)this.glow.circle(f.x,f.y,106).stroke({width:9,color:swatch.yellow.line});
   return;
  }
  if(this.plan.free||this.done||this.tree)return;
  const p=this.phrases[this.phrase],times=schedule(p.gaps),end=times.at(-1)||1;
  p.voices.forEach((v,i)=>{
   const node=new Container();node.addChild(new Graphics().circle(0,0,43).fill(i<this.taps.length?swatch.yellow.light:cream).stroke({width:i===active?8:4,color:swatch[v?'teal':'green'].line}),frog(v,27));
   node.position.set(250+times[i]/end*(this.view.w-370),0);this.score.addChild(node);
  });
  if(this.guided){const voice=p.voices[Math.min(this.taps.length,p.voices.length-1)],f=this.frogs[voice];this.glow.circle(f.x,f.y,106).stroke({width:9,color:swatch.yellow.line});}
 }
 /** Couch play: left and right are the two frogs, the bottom button sends the answer, the left button replays the call. */
 control(input:CouchControls){
  for(const p of input.players){
   if(p.undo)this.demonstrate();
   if(p.action)this.check();
   if(p.direction===0||p.direction===2)this.play(this.frogs.length===1||p.direction===2?0:1);
  }
 }
 /** The "watch me" demo: wait out the call and the sample reply, then play the reply back on the beat and send it. */
 autoplay(_dt:number):CouchControls{
  const out=idle();out.players[0].active=true;
  if(this.done||this.tree)return out;
  if(this.busy){this.botPlan=[];this.botSubmitAt=0;return out;}
  if(!this.taps.length&&!this.botPlan.length&&!this.botSubmitAt){
   const p=this.phrases[this.phrase],times=schedule(p.gaps,this.clock+0.7);
   this.botPlan=times.map((at,i)=>({at,voice:p.voices[i]}));this.botSubmitAt=times.at(-1)!+0.9;
  }
  const next=this.botPlan[0];
  if(next&&this.clock>=next.at){this.botPlan.shift();out.players[0].direction=this.frogs.length===1||!next.voice?2:0;}
  else if(!this.botPlan.length&&this.botSubmitAt&&this.clock>=this.botSubmitAt){this.botSubmitAt=0;out.players[0].action=true;}
  return out;
 }
 /** The ghost finger on the how-to card: after the bird, tap the frogs of the reply, resting longer where the gap is long, then send it. Free levels: each frog once, then send. */
 autotouch():TouchIntent|null{
  if(this.done)return null;
  if(this.plan.knock)return this.knocks<KNOCKS?{tap:{on:this.bird},pause:0.5}:null;
  if(this.busy)return null;
  if(this.plan.call){ // Three or four knocks with short and long rests, then a quiet spell for the frog.
   const rests=BOT_CALLS[this.phrase%BOT_CALLS.length];
   return this.callTimes.length<=rests.length?{tap:{on:this.bird},pause:rests[this.callTimes.length]??0.5}:null;
  }
  if(this.plan.turn)return this.waiting?{tap:{on:this.frogs[0]},pause:0.4}:null;
  if(this.plan.free){
   if(this.plays<this.frogs.length)return {tap:{on:this.frogs[this.plays]},pause:0.4};
   return this.submit.visible?{tap:{on:this.submit}}:null;
  }
  const move=nextNote(this.phrases[this.phrase],this.taps.length);
  return 'send' in move?{tap:{on:this.submit}}:{tap:{on:this.frogs[move.voice]},pause:move.rest};
 }
 start(){void this.ctx.instruct(this.plan.knock?'neighbors.knock':this.plan.call?'neighbors.call':this.plan.turn?'neighbors.take':this.plan.free?'neighbors.free':this.plan.timing?'neighbors.rhythm':'neighbors.turns');if(!this.plan.free&&!this.tree)this.demonstrate();}
 resize(v:View){
  this.view=v;
  this.bg.clear().rect(0,0,v.w,v.h).fill(swatch.green.light).ellipse(v.w/2,v.h-160,Math.min(400,v.w*.4),130).fill(swatch.blue.light);
  this.bird.position.set(155,300);this.score.y=290;
  this.frogs.forEach((f,i)=>f.position.set(v.w/2+(this.frogs.length===1?0:i?160:-160),v.h-180));
  if(this.tree){ // A big tree on the left half, one large frog on the pond; no buttons.
   const s=Math.min(1,(v.h-260)/640);this.base.set(this.bird,s);this.bird.scale.set(s);this.bird.position.set(v.w*0.27,v.h/2+50);
   this.frogs[0].position.set(v.w*0.7,v.h-190);this.base.set(this.frogs[0],1.5);this.frogs[0].scale.set(1.5);
  }
  this.submit.position.set(v.w-80,65);this.submit.visible=!this.tree&&!this.plan.turn&&(!this.plan.free||this.plays>0);
  this.replay.position.set(220,65);this.help.position.set(360,65);this.help.visible=!this.plan.free&&!this.plan.turn&&!this.tree;this.replay.visible=!this.tree;
  this.drawScore();
 }
 update(dt:number){
  this.clock+=dt;for(const node of [this.bird,...this.frogs]){const b=this.base.get(node)??1;node.scale.set(b*(1+(node.scale.x/b-1)*Math.exp(-8*dt)));}
  this.pond.clear();for(const rp of this.ripples){rp.t+=dt;this.pond.ellipse(rp.x,rp.y,60+rp.t*140,(60+rp.t*140)*.35).stroke({width:5,color:swatch.blue.line,alpha:Math.max(0,1-rp.t/1.2)});}
  while(this.ripples.length&&this.ripples[0].t>1.2)this.ripples.shift();
  this.pause();
  // Free play: after a quiet spell a frog wiggles and croaks once, an invitation that is never a hint and never counted.
  if(this.plan.call&&!this.busy&&!this.done&&callEnded(this.callTimes,this.clock))this.answerCall();
  if((this.plan.free||this.waiting||(this.plan.call&&!this.callTimes.length))&&!this.done&&!this.busy&&!this.wiggled&&this.clock-this.lastTouch>IDLE_WIGGLE){
   this.wiggled=true;this.wiggle=0.6;this.wiggleFrog=(this.wiggleFrog+1)%this.frogs.length;this.sound(this.wiggleFrog);
  }
  if(this.wiggle>0){this.wiggle=Math.max(0,this.wiggle-dt);this.frogs[this.wiggleFrog].rotation=Math.sin(this.wiggle*40)*0.2*this.wiggle/0.6;}
  while(this.events.length&&this.events[0].at<=this.clock){const e=this.events.shift()!;this.sound(e.voice);this.drawScore(e.note);}
  if(this.busy&&this.clock>=this.busyUntil&&this.plan.call){ // Her call was answered: the next one, or the ending song after three.
   this.busy=false;this.phrase++;this.lastTouch=this.clock;this.wiggled=false;
   if(this.phrase>=CALL_ROUNDS)this.finish();else void this.ctx.say('neighbors.call-again');
  }
  if(this.busy&&this.clock>=this.busyUntil){this.busy=false;if(this.plan.turn){this.waiting=true;this.lastTouch=this.clock;this.wiggled=false;}this.drawScore();if(!this.plan.free)void this.ctx.say(this.plan.turn?'neighbors.my-turn':this.guided?'neighbors.help':'neighbors.your-turn');}
 }
 destroy(){this.events=[];this.done=true;this.finale=false;}
}
export const rhythmNeighbors:GameModule={
 id:'rhythm-neighbors',liveController: true,name:'Rhythm Neighbors',titleLine:'game.rhythm-neighbors',region:'music-mountain',skills:['turn-taking','rhythm','musical-expression'],bands:['lap','toddler','preschool','prek','school'],
 levels:b=>rangeFor(LEVELS,b),describeLevel:l=>planFor(l).name,
 music:silenced(STYLES.jelly),coplayHint:'Let {name} answer the woodpecker with a frog. Any timing is welcome in the first turns.',offScreen:'Take turns knocking on a table. Try a short question and a different answering rhythm.',
 entryLevels:[7,9],hubIcon:()=>{const c=new Container();const f=frog(0);f.y=-35;c.addChild(f);return new WigglyIcon(c);},touchDemo:true,sticker:seed=>frog(new Rng(seed).int(0,1),80),create:ctx=>new RhythmNeighbors(ctx),
};
