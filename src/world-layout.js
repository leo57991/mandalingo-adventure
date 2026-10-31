import {ROOM,COLLIDERS} from './lessons.js?v=wuyin-world-v1';
import {isTownWalkable} from './town-layout.js?v=wuyin-world-v1';
import {isGateWalkable} from './gate-geometry.js?v=wuyin-world-v1';
export const TOWN_WORLD_OFFSET=Object.freeze({x:-900,y:-2635});
export const CITY_WALL_EXTENSIONS=Object.freeze([[-720,247,975,38],[1345,247,775,38]]);
export const toTownPoint=p=>({...p,x:p.x-TOWN_WORLD_OFFSET.x,y:p.y-TOWN_WORLD_OFFSET.y});
export const fromTownPoint=p=>({...p,x:p.x+TOWN_WORLD_OFFSET.x,y:p.y+TOWN_WORLD_OFFSET.y});
export const worldPlayerPoint=game=>game.location==='town'?fromTownPoint(game.player):game.player;
const inside=(x,y,[a,b,w,h])=>x>=a&&x<=a+w&&y>=b&&y<=b+h;
export function isConnectedWalkable(x,y,radius,gateProgress,courtyardColliders=COLLIDERS,extraTown=[]){
 if(!isGateWalkable(x,y,radius,gateProgress))return false;
 const samples=[[0,0],[radius,0],[-radius,0],[0,radius],[0,-radius],[radius*.7,radius*.7],[-radius*.7,radius*.7],[radius*.7,-radius*.7],[-radius*.7,-radius*.7]];
 return samples.every(([dx,dy])=>{const xx=x+dx,yy=y+dy,t=toTownPoint({x:xx,y:yy});
  if(!inside(xx,yy,ROOM.walkableBounds)&&!isTownWalkable(t.x,t.y,0,extraTown))return false;
  if(CITY_WALL_EXTENSIONS.some(r=>inside(xx,yy,r)))return false;
  return !courtyardColliders.some(e=>{const c=e.collider;return e.id!=='gate'&&c&&xx>=e.x+c.x&&xx<=e.x+c.x+c.width&&yy>=e.y+c.y&&yy<=e.y+c.y+c.height;});
 });
}
