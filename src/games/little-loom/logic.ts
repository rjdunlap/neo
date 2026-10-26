import type { ClothCreation } from '../../content/creations';
export const COLS=6, ROWS=8;
export const PEDALS=[ [true,false,true,false,true,false], [false,true,false,true,false,true] ] as const;
export type Pedal=0|1;
export type Lift=readonly boolean[];
export type Rejection='malformed'|'all-together'|'repeat'|'long-float';
export function rejection(history:readonly Lift[],row:unknown):Rejection|null {
  if(!Array.isArray(row)||row.length!==COLS||Array.from(row).some(v=>typeof v!=='boolean'))return 'malformed';
  if(row.every(Boolean)||row.every(v=>!v))return 'all-together';
  if(history.at(-1)?.every((v,i)=>v===row[i]))return 'repeat';
  const run=(xs:readonly boolean[])=>{let n=0,last:boolean|undefined;for(const v of xs){n=v===last?n+1:1;last=v;if(n>3)return true;}return false;};
  const all=[...history,row];
  if(all.some(run)||Array.from({length:COLS},(_,c)=>all.map(r=>r[c])).some(run))return 'long-float';
  return null;
}
export const drawdown=(warp:readonly number[],weft:number,lift:Lift)=>lift.map((up,c)=>up?warp[c]:weft);
/** Transactions snapshot selection. Only settle can change committed rows, yarn or direction. */
export class Round {
  readonly level:number;
  readonly lifts:boolean[][]=[];readonly yarns:number[]=[];
  selected:Pedal|null=null;yarn=0;misses=0;hints=0;failures=0;helped=false;destroyed=false;
  pending:{pedal:Pedal;yarn:number;error:Rejection|null}|null=null;
  constructor(level:number){this.level=Math.max(1,Math.min(3,Math.floor(level)));}
  get rows(){return this.lifts.length;}
  get finished(){return this.rows===ROWS;}
  get busy(){return !!this.pending;}
  get next():Pedal{return this.lifts.at(-1)?.[0]?1:0;}
  select(p:Pedal){if(!this.busy&&!this.finished&&!this.destroyed)this.selected=p;}
  choose(y:number){if(this.level===2&&!this.busy&&!this.finished&&!this.destroyed&&Number.isInteger(y)&&y>=0&&y<3)this.yarn=y;}
  begin(){
    if(this.busy||this.finished||this.destroyed)return 'ignored';
    if(this.level===3&&this.selected===null)return 'choose';
    const pedal=this.level===3?this.selected!:this.next;
    this.pending={pedal,yarn:this.yarn,error:rejection(this.lifts,PEDALS[pedal])};
    return this.pending.error?'slip':'throw';
  }
  help(){if(this.level!==3||this.finished||this.destroyed||this.helped)return false;this.helped=true;this.hints++;return true;}
  settle(){
    const p=this.pending;if(!p||this.destroyed)return null;this.pending=null;this.selected=null;
    if(p.error){this.misses++;this.failures++;if(this.failures>=2)this.help();return 'slip';}
    this.lifts.push([...PEDALS[p.pedal]]);this.yarns.push(p.yarn);this.failures=0;this.helped=false;return 'commit';
  }
  creation():ClothCreation|null {
    return this.finished?{kind:'picture',medium:'cloth',version:1,cols:6,rows:8,cells:this.lifts.flatMap((r,i)=>drawdown([3,3,3,3,3,3],this.yarns[i],r))}:null;
  }
  destroy(){this.destroyed=true;this.pending=null;}
}
