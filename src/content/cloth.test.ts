import {it,expect} from 'vitest';
import {cleanPicture,cleanCreations,emptyCreations,keepCreation,undoCreation,takeDownCreation,type ClothCreation} from './creations';
import {migrate,defaults} from '../progress/save';
const cloth:ClothCreation={kind:'picture',medium:'cloth',version:1,cols:6,rows:8,cells:Array.from({length:48},(_,i)=>i%4)};
it('cloth rejects whole malformed variants and unknown versions without falling through',()=>{
 expect(cleanPicture(cloth)).toEqual(cloth); const {medium: _medium,...missingMedium}=cloth; expect(cleanPicture(missingMedium)).toBeNull();
 for(const bad of [{version:2},{medium:'rug'},{cols:8},{rows:6},{cells:cloth.cells.slice(1)},{cells:[...cloth.cells,1]},{cells:[...cloth.cells.slice(1),4]},{cells:[...cloth.cells.slice(1),1.5]},{cells:new Array(48)}])expect(cleanPicture({...cloth,...bad,stamps:[{kind:'cat',color:'red',x:.5,y:.5}]})).toBeNull();
});
it('cloth shares reversible picture ownership without altering valid tune/previous picture',()=>{
 const stamp={kind:'picture' as const,stamps:[{kind:'cat' as const,color:'red' as const,x:.5,y:.5,size:1,turns:0}]};
 const tune={kind:'tune' as const,cols:4,rows:3,notes:[{col:0,row:0},{col:1,row:1}]};
 let save=keepCreation(keepCreation(emptyCreations(),stamp),tune);save=keepCreation(save,cloth);expect(save.picture.previous).toEqual(stamp);expect(keepCreation(save,cloth)).toBe(save);expect(undoCreation(save,'picture').picture.current).toEqual(stamp);expect(takeDownCreation(save,'picture').picture.previous).toEqual(cloth);
 const repaired=cleanCreations({...save,picture:{current:{...cloth,version:99},previous:stamp}});expect(repaired.picture.current).toBeNull();expect(repaired.picture.previous).toEqual(stamp);expect(repaired.tune.current).toEqual(tune);
});
it('current save JSON roundtrip retains exact dimensions/cells and repaired save remains bounded',()=>{
 const save=defaults();save.creations=keepCreation(save.creations,cloth);expect(migrate(JSON.parse(JSON.stringify(save))).creations.picture.current).toEqual(cloth);
});
