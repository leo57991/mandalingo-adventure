import test from "node:test";
import assert from "node:assert/strict";
import { createActor, poseActor } from "../src/courtyard-3d.js";

test("the visible rig crosses the angle boundary along the short arc at both refresh rates", () => {
  const start = Math.PI - .3, aim = -Math.PI + .3;
  const renderAt = hz => {
    const actor = createActor(0x427e81, "player");
    poseActor(actor, { heading: start, time: 0 });
    poseActor(actor, { heading: aim, time: 1 / hz, moving: true });
    const first = actor.root.rotation.y;
    assert.ok(first > start && first < Math.PI + .3);
    for (let frame = 2; frame <= hz; frame++) {
      poseActor(actor, { heading: aim, time: frame / hz, moving: true, stride: frame / hz * 8 });
    }
    return actor.root.rotation.y;
  };
  assert.ok(Math.abs(renderAt(30) - renderAt(120)) < .001);
  assert.ok(Math.abs(renderAt(60) - (Math.PI + .3)) < .001);
});

test("the rendered run settles gradually at rest without moving the collision root", () => {
  const actor = createActor(0x427e81, "player");
  const frames = (from, to, moving) => {
    for (let frame = from; frame <= to; frame++) {
      poseActor(actor, {
        heading: 0, time: frame / 60, running: moving, moving,
        stride: Math.min(frame, 24) * .17,
      });
    }
  };
  frames(0, 24, true);
  const runningLean = actor.body.rotation.x;
  assert.ok(runningLean > .1);
  assert.ok(Math.max(actor.leftKnee.rotation.x, actor.rightKnee.rotation.x) > .5);
  frames(25, 25, false);
  assert.ok(actor.body.rotation.x > 0 && actor.body.rotation.x < runningLean);
  frames(26, 85, false);
  assert.ok(actor.body.rotation.x < .001);
  assert.deepEqual(actor.root.position.toArray(), [0, 0, 0]);
  poseActor(actor, { heading: Math.PI, time: 86 / 60, moving: true, reducedMotion: true });
  assert.equal(actor.root.rotation.y, Math.PI);
  assert.equal(actor.leftKnee.rotation.x, 0);
});
