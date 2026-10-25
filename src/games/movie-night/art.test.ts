import {it,expect} from 'vitest';
import {footage} from './art';
import {POND,DOOR} from './logic';
it('keeps every authored action inside the film frame, including Bunny’s ears',()=>{
 for(const shot of [...POND,...DOOR])for(const time of [0,.79,.8,1,1.99]){
  const picture=footage(shot,time),b=picture.getLocalBounds();
  expect(b.x,`${shot.id}@${time} left`).toBeGreaterThanOrEqual(-161);
  expect(b.y,`${shot.id}@${time} top`).toBeGreaterThanOrEqual(-91);
  expect(b.x+b.width,`${shot.id}@${time} right`).toBeLessThanOrEqual(161);
  expect(b.y+b.height,`${shot.id}@${time} bottom`).toBeLessThanOrEqual(91);
  picture.destroy({children:true});
 }
});
