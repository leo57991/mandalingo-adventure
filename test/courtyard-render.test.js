import test from 'node:test';
import assert from 'node:assert/strict';
import { getCourtyardOcclusion } from '../src/courtyard-art.js';

test('south parapet becomes translucent when the player walks behind it', () => {
  assert.equal(getCourtyardOcclusion({ x: 450, y: 505 }), 1);
  assert.equal(getCourtyardOcclusion({ x: 450, y: 660 }), .32);
  assert.equal(getCourtyardOcclusion({ x: 800, y: 660 }), 1);
});
