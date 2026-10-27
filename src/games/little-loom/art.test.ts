import {it,expect} from 'vitest';
import {clothArt} from './art';
import {pictureBoard,BOARD} from '../../ui/creation-art';
import {type ClothCreation} from '../../content/creations';
it('rectangular cloth preserves six by eight aspect and fits the picture board without stretching',()=>{
 const cloth:ClothCreation={kind:'picture',medium:'cloth',version:1,cols:6,rows:8,cells:Array.from({length:48},(_,i)=>i%4)};
 const art=clothArt(cloth.cells,20),b=art.getLocalBounds();expect(b.width).toBeCloseTo(119);expect(b.height).toBeCloseTo(159);art.destroy();
 const board=pictureBoard(cloth),woven=board.children[1],bounds=woven.getBounds();expect(bounds.width/bounds.height).toBeCloseTo(6/8,1);expect(bounds.width).toBeLessThan(BOARD.w-28);expect(bounds.height).toBeLessThan(BOARD.h-28);expect(woven.eventMode).toBe('none');board.destroy({children:true});
});
