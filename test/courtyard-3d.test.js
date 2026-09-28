import test from "node:test";
import assert from "node:assert/strict";
import {
  worldPoint,
  buildCourtyard,
  createActor,
  poseActor,
  setGateOpening,
  frameCamera,
} from "../src/courtyard-3d.js";
import {
  Group,
  OrthographicCamera,
  Vector3,
} from "../src/vendor/three.module.js";
test("logical feet map to the ground plane without changing collision coordinates", () => {
  assert.deepEqual(worldPoint(800, 450), [0, 0, 0]);
  assert.deepEqual(worldPoint(1215, 515), [4.15, 0, 0.65]);
});
test("door opening rotates around opposite hinges and clamps restored progress", () => {
  const doors = [new Group(), new Group()];
  doors[0].position.x = -0.9;
  doors[1].position.x = 0.9;
  setGateOpening(doors, 0.5);
  assert.ok(doors[0].rotation.y < 0);
  assert.equal(doors[0].rotation.y, -doors[1].rotation.y);
  setGateOpening(doors, 2);
  assert.equal(doors[1].rotation.y, Math.PI * 0.48);
  assert.equal(doors[0].position.x, -0.9);
  setGateOpening(doors, -1);
  assert.equal(doors[1].rotation.y, 0);
});
test("portrait camera keeps both feet and head visible at each courtyard edge", () => {
  const camera = new OrthographicCamera(-8, 8, 5, -5, 0.1, 80);
  for (const [x, y] of [
    [320, 310],
    [1280, 310],
    [320, 670],
    [1280, 670],
    [800, 505],
  ]) {
    frameCamera(camera, 390, 638, { x, y });
    for (const height of [0, 1.55]) {
      const p = new Vector3(...worldPoint(x, y));
      p.y = height;
      p.project(camera);
      assert.ok(
        Math.abs(p.x) < 0.95 && Math.abs(p.y) < 0.95,
        `${x},${y},${height}`,
      );
    }
  }
});
test("walking articulates opposite legs while feet root stays on the collision plane", () => {
  const actor = createActor(0x427e81);
  actor.root.position.set(...worldPoint(920, 530));
  poseActor(actor, { moving: true, stride: Math.PI / 2 });
  assert.ok(actor.leftLeg.rotation.x > 0);
  assert.equal(actor.leftLeg.rotation.x, -actor.rightLeg.rotation.x);
  assert.deepEqual(actor.root.position.toArray(), [1.2, 0, 0.8]);
  poseActor(actor, { moving: false, stride: Math.PI / 2 });
  assert.equal(actor.leftLeg.rotation.x, 0);
  assert.equal(actor.body.position.y, 0);
});
test("holding, drinking, self-reference and reduced motion preserve readable cues", () => {
  const actor = createActor(0x427e81);
  poseActor(actor, { carrying: true, emptyBowl: true });
  assert.equal(actor.bowl.visible, true);
  const heldHeight = actor.bowl.position.y;
  poseActor(actor, { pose: "drink-water" });
  assert.ok(actor.bowl.position.y > heldHeight);
  assert.ok(actor.rightArm.rotation.x < -1.5);
  poseActor(actor, { pose: "point-self" });
  assert.ok(actor.rightArm.rotation.z < 0);
  assert.equal(actor.bowl.visible, false);
  poseActor(actor, {
    moving: true,
    stride: Math.PI / 2,
    reducedMotion: true,
    pose: "nod",
    time: 1,
  });
  assert.equal(actor.leftLeg.rotation.x, 0);
  assert.equal(actor.head.rotation.x, 0);
});
test("courtyard contains articulated actors and separately hinged dimensional doors", () => {
  const world = buildCourtyard();
  assert.equal(world.actors.size, 4);
  const player = world.actors.get("player");
  assert.ok(player.leftLeg.isObject3D && player.rightArm.isObject3D);
  assert.equal(world.doors.length, 2);
  assert.ok(world.doors.every((door) => door.children[0].isMesh));
  assert.notEqual(world.doors[0].position.x, world.doors[1].position.x);
});
