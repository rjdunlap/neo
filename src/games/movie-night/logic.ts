/** Fixed authored footage: no shot ordering or inferred pixel facts. */
export type Pad = 'splash' | 'boing' | 'whoosh' | 'bell' | 'knock' | 'hello';
export type Strip = (Pad | null)[];
export interface Shot { id: string; facts: readonly string[]; event: string; cue: number }
export const POND: readonly Shot[] = [
  { id:'P0',facts:['who:duck','where:pond','event:waddles'],event:'waddles',cue:.8 },
  { id:'P1',facts:['who:duck','where:pond','event:jumps'],event:'jumps',cue:.8 },
  { id:'P2',facts:['who:duck','where:pond','event:lands-in-water'],event:'lands-in-water',cue:.8 },
];
export const DOOR: readonly Shot[] = [
  { id:'D0',facts:['who:bunny','where:door','event:arrives'],event:'arrives',cue:.8 },
  { id:'D1',facts:['who:bunny','where:door','event:knocks'],event:'knocks',cue:.8 },
  { id:'D2',facts:['who:bear','where:door','event:opens'],event:'opens',cue:.8 },
  { id:'D3',facts:['who:bear','who:bunny','where:door','event:greets'],event:'greets',cue:.8 },
];
export interface Match { slot: number; pad: Pad; event: string; line: 'mn.splashRequest'|'mn.knockRequest'|'mn.helloRequest' }
export function planFor(level: number) {
  const n = Math.max(1,Math.min(3,Math.floor(level)));
  return { level:n, shots:n===3?DOOR:POND,
    pads:(n===3?['knock','hello','boing','bell']:['splash','boing','whoosh','bell']) as Pad[],
    requirements:(n===1?[]:n===2?[{slot:2,pad:'splash',event:'lands-in-water',line:'mn.splashRequest'}]:[
      {slot:1,pad:'knock',event:'knocks',line:'mn.knockRequest'},
      {slot:3,pad:'hello',event:'greets',line:'mn.helloRequest'},
    ]) as Match[] };
}
export function unmet(level:number, strip:Strip):Match[] {
  return planFor(level).requirements.filter(r=>strip[r.slot]!==r.pad);
}
export function accepted(level:number, strip:Strip):boolean {
  const p=planFor(level);
  return strip.length===p.shots.length && strip.every(s=>s===null||p.pads.includes(s)) &&
    (p.level===1?strip.some(Boolean):unmet(level,strip).length===0);
}
/** All accounting is round-wide; board history never contains support or submission counters. */
export class Round {
  readonly plan;
  strip:Strip;
  readonly history:Strip[]=[];
  misses=0; hints=0; failures=0; automaticHint=false;
  qualified=false; finished=false; destroyed=false;
  private run:{kind:'watch'|'premiere'|'audition'|'model'; strip:Strip}|null=null;
  constructor(level:number){this.plan=planFor(level);this.strip=this.plan.shots.map(()=>null);}
  get busy(){return this.run!==null;}
  edit(slot:number,pad:Pad|null){
    if(this.busy||this.finished||this.destroyed||slot<0||slot>=this.strip.length||this.strip[slot]===pad||pad!==null&&!this.plan.pads.includes(pad))return false;
    this.history.push([...this.strip]);this.strip[slot]=pad;this.qualified=false;return true;
  }
  undo(){if(this.busy||this.finished||this.destroyed||!this.history.length)return false;this.strip=this.history.pop()!;this.qualified=false;return true;}
  help():Match|undefined {
    if(this.busy||this.finished||this.destroyed||this.plan.level===1)return;
    const r=unmet(this.plan.level,this.strip)[0];
    if(r){this.edit(r.slot,r.pad);this.hints++;}return r;
  }
  begin(kind:'watch'|'premiere'|'audition'|'model'){
    if(this.busy||this.finished||this.destroyed||kind==='premiere'&&this.plan.level===1)return false;
    this.run={kind,strip:[...this.strip]};return true;
  }
  complete(){
    const run=this.run;if(!run||this.destroyed)return null;this.run=null;
    if(run.kind==='audition'||run.kind==='model')return null;
    if(run.kind==='watch'){
      if(this.plan.level===1)this.qualified=accepted(1,run.strip);
      return {kind:run.kind,ok:this.qualified,request:undefined};
    }
    const ok=accepted(this.plan.level,run.strip);this.qualified=ok;
    const request=unmet(this.plan.level,run.strip)[0];
    if(!ok){this.failures++;if(this.failures>=2)this.misses++;if(this.failures===2){this.hints++;this.automaticHint=true;}}
    return {kind:run.kind,ok,request};
  }
  stop(){this.run=null;}
  bow(){if(this.busy||!this.qualified||this.finished||this.destroyed)return null;this.finished=true;return {misses:this.misses,hints:this.hints};}
  destroy(){this.destroyed=true;this.stop();}
}
