import test from 'node:test';
import assert from 'node:assert/strict';
import { courtyardCamera } from '../src/scene-layout.js';
test('portrait view keeps a readable actor and follows both sides of the courtyard without exposing outside pixels', () => {
  for (const x of [350,800,1250]) {
    const c = courtyardCamera(390,570,{x,y:505});
    assert.ok(176*c.scale >= 100, 'actor must not shrink to a 43px figure');
    assert.ok((x-c.x)*c.scale > 35 && (x-c.x)*c.scale < 355);
    assert.ok(c.x >= 0 && c.x+390/c.scale <= 1600.01);
    assert.ok(c.y >= 0 && c.y+570/c.scale <= 900.01);
  }
});
test('wide screen retains the complete courtyard at its native aspect', () => {
  assert.deepEqual(courtyardCamera(1600,900,{x:800,y:505}),{x:0,y:0,scale:1});
});
