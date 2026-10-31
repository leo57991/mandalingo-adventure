import test from 'node:test';
import assert from 'node:assert/strict';
import * as layout from '../src/town-layout.js';
import {createTownWorld} from '../src/town-3d.js';
import {createActor} from '../src/courtyard-3d.js';
import * as T from '../src/vendor/three.module.js';

test('new shop and rest props are solid while leaving room to pass around them',()=>{
 const props=layout.TOWN_PROPS??[];
 for(const type of ['forge','weapon-rack','produce','scrolls','bench'])assert.ok(props.some(p=>p.type===type),`missing ${type}`);
 for(const p of props){
  assert.equal(layout.isTownWalkable(p.x,p.y),false,`${p.id} must block its footprint`);
  assert.ok([[0,p.depth/2+45],[0,-p.depth/2-45],[p.width/2+45,0],[-p.width/2-45,0]].some(([dx,dy])=>layout.isTownWalkable(p.x+dx,p.y+dy)),`${p.id} has an accessible approach`);
 }
});

test('authored solid prop dimensions enclose their rendered geometry',()=>{
 const world=createTownWorld(createActor,()=>{});
 for(const p of layout.TOWN_PROPS??[]){
  const root=world.scene.getObjectByName(p.id);assert.ok(root,`${p.id} has real scene geometry`);
  root.updateWorldMatrix(true,true);const b=new T.Box3().setFromObject(root);
  const cx=(p.x-1600)/100,cz=(p.y-1600)/100;
  assert.ok(b.min.x>=cx-p.width/200-.005&&b.max.x<=cx+p.width/200+.005,`${p.id} x footprint`);
  assert.ok(b.min.z>=cz-p.depth/200-.005&&b.max.z<=cz+p.depth/200+.005,`${p.id} z footprint`);
  assert.ok(Math.abs(b.min.y-layout.townElevation(p.x,p.y))<.025,`${p.id} rests on the terrain`);
 }
 assert.ok((layout.TOWN_PROPS??[]).length>=7);
});

test('shop-side displays remain visible from the fixed playing camera',()=>{
 const world=createTownWorld(createActor,()=>{});world.scene.updateMatrixWorld(true);
 for(const [id,x,y,h] of [['smith-forge',390,1550,.65],['market-produce',370,2390,.78],['books-scroll-display',2790,1580,.78],['garden-jade-lantern',2350,1790,1.24]]){
  const target=new T.Vector3((x-1600)/100,h,(y-1600)/100),direction=new T.Vector3(0,-11,-12).normalize();
  const ray=new T.Raycaster(target.clone().addScaledVector(direction,-18),direction,0,18.1);
  const first=ray.intersectObjects(world.scene.children,true)[0]?.object;
  let belongs=false;for(let o=first;o;o=o.parent)if(o.name===id)belongs=true;
  assert.ok(belongs,`${id} is hidden by foreground scenery`);
 }
});
