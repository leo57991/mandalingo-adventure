import test from 'node:test';
import assert from 'node:assert/strict';
import {createActor,poseActor} from '../src/courtyard-3d.js';
const plea=(actor,time,extra={})=>poseActor(actor,{kneeling:1,carrying:true,emptyBowl:true,pleading:true,time,...extra});
test('weak bowl request visibly reaches outward and holds its open empty bowl with articulated hands',()=>{
 const a=createActor(0xb99759,'traveller');plea(a,0);const resting=a.bowl.position.z;
 plea(a,2);assert.ok(a.bowl.position.z-resting>.2);
 assert.ok(a.bowl.rotation.x>.15,'opening faces the recipient');
 assert.ok(a.leftForearm?.isObject3D&&a.rightForearm?.isObject3D);
 assert.ok(a.bowl.visible);assert.ok(a.bowl.scale.x>1);
 const empty=a.bowl.children[1].material;plea(a,4.8);assert.equal(a.bowl.children[1].material,empty);
 assert.ok(a.bowl.position.z<resting+.05,'arm tires and bowl withdraws');
});
test('reduced motion holds the plea still and drinking/recovery clear every extra pose transform',()=>{
 const a=createActor(0xb99759,'traveller');const snapshot=()=>[...a.body.position.toArray(),...a.body.rotation.toArray(),...a.bowl.position.toArray(),...a.bowl.rotation.toArray()];
 plea(a,0,{reducedMotion:true});const held=snapshot();plea(a,12,{reducedMotion:true});assert.deepEqual(snapshot(),held);
 plea(a,2,{pose:'drink-water'});assert.equal(a.bowl.scale.x,1);assert.equal(a.bowl.rotation.x,0);
 poseActor(a,{kneeling:0});assert.equal(a.body.rotation.z,0);assert.equal(a.bowl.rotation.z,0);assert.equal(a.bowl.scale.x,1);assert.equal(a.leftForearm?.rotation.x,0);
});
