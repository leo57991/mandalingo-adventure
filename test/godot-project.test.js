import { existsSync, readFileSync, statSync } from "node:fs";
import test from "node:test";
import assert from "node:assert/strict";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("Godot uses a real object scene for every South Gate element", () => {
  const blockers = ["wall_segment", "gatehouse", "stele", "lantern", "bamboo_cluster", "scholar_rock"];
  for (const name of blockers) {
    const scene = read(`godot/scenes/props/${name}.tscn`);
    assert.match(scene, /type="StaticBody2D"/, `${name} needs its own body`);
    assert.match(scene, /type="CollisionShape2D"/, `${name} needs its own collision`);
  }

  const gate = read("godot/scenes/props/gatehouse.tscn");
  assert.match(gate, /name="LeftPillar"/);
  assert.match(gate, /name="RightPillar"/);
});

test("context discoveries are recorded without grading the player's guess", () => {
  const game = read("godot/scripts/main.gd");
  assert.match(game, /notebook\[word\]\["count"\] \+= 1/);
  assert.match(game, /notebook\[last_word\]\["guess"\] = guess/);
  assert.doesNotMatch(game, /correct|incorrect|score|grade/i);
});

test("the deployable Godot Web build is present", () => {
  for (const file of ["index.html", "index.js", "index.pck", "index.wasm"]) {
    const path = new URL(`../godot-web/${file}`, import.meta.url);
    assert.ok(existsSync(path), `${file} must be exported`);
    assert.ok(statSync(path).size > 0, `${file} must not be empty`);
  }
});
