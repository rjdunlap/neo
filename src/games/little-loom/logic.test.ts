import {describe,it,expect} from 'vitest';
import {Round,PEDALS,rejection,drawdown} from './logic';
const bits=(s:string)=>[...s].map(c=>c==='1');
describe('island loom holding rules',()=>{
  it('exhausts all first-row masks against independent run specification',()=>{
    for(let n=0;n<64;n++){const s=n.toString(2).padStart(6,'0');const want=n===0||n===63?'all-together':/0000|1111/.test(s)?'long-float':null;expect(rejection([],bits(s))).toBe(want);}
    for(const bad of [null,[],[1,0,1,0,1,0],[true,false,true,false,true],new Array(6)])expect(rejection([],bad)).toBe('malformed');
  });
  it('checks committed vertical runs without wrapping and repeat precedence',()=>{
    expect(rejection([],bits('111000'))).toBeNull();
    const h=['101010','100101','101001'].map(bits);
    expect(rejection(h.slice(0,2),h[2])).toBeNull();expect(rejection(h,bits('100110'))).toBe('long-float');
    expect(rejection([PEDALS[0]],PEDALS[0])).toBe('repeat');
    for(const a of [0,1])for(const b of [0,1])expect(rejection([PEDALS[a]],PEDALS[b])).toBe(a===b?'repeat':null);
  });
  it('all 256 pedal plans yield exactly two complete unassisted plans',()=>{
    let complete=0;for(let n=0;n<256;n++){const r=new Round(3);let valid=true;for(let i=0;i<8;i++){r.select((n>>i&1) as 0|1);if(r.begin()!=='throw')valid=false;r.settle();}if(valid){complete++;expect(r.finished).toBe(true);expect(r.creation()?.cells).toHaveLength(48);}}
    expect(complete).toBe(2);
  });
  it('every 3^8 free yarn schedule finishes with unchanged structural validity',()=>{
    for(let n=0;n<6561;n++){const r=new Round(2);let x=n;for(let i=0;i<8;i++){r.choose(x%3);x=Math.floor(x/3);expect(r.begin()).toBe('throw');expect(r.settle()).toBe('commit');}expect(r.finished).toBe(true);expect(r.misses+r.hints).toBe(0);}
  });
  it('drawdown retains left-to-right indices, including equal yarns',()=>{
    expect(drawdown([3,3,3,3,3,3],0,PEDALS[0])).toEqual([3,0,3,0,3,0]);expect(drawdown([3,3,3,3,3,3],0,PEDALS[1])).toEqual([0,3,0,3,0,3]);expect(drawdown([3,3,3,3,3,3],3,PEDALS[0])).toEqual([3,3,3,3,3,3]);
  });
  it('transactions snapshot, reject repeated submissions without altering history and cap help by row',()=>{
    const r=new Round(3);expect(r.begin()).toBe('choose');expect(r.misses+r.hints).toBe(0);
    r.select(0);r.begin();r.select(1);expect(r.begin()).toBe('ignored');r.settle();expect(r.rows).toBe(1);
    const before=JSON.stringify([r.lifts,r.yarns]);for(let i=0;i<2;i++){r.select(0);r.begin();r.settle();expect(JSON.stringify([r.lifts,r.yarns])).toBe(before);}
    expect(r.misses).toBe(2);expect(r.hints).toBe(1);r.help();r.select(0);r.help();expect(r.hints).toBe(1);expect(r.next).toBe(1);
    r.select(1);r.begin();r.settle();expect(r.rows).toBe(2);r.help();r.help();expect(r.hints).toBe(2);
  });
  it('settles exactly once, never settles after destruction, offers no partial creation',()=>{
    const r=new Round(1);r.begin();expect(r.creation()).toBeNull();r.settle();expect(r.settle()).toBeNull();expect(r.rows).toBe(1);r.begin();r.destroy();expect(r.settle()).toBeNull();expect(r.rows).toBe(1);expect(r.begin()).toBe('ignored');
  });
});
