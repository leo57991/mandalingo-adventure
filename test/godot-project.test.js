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

test("the project bundles a Traditional Chinese font for Web exports", () => {
  const project = read("godot/project.godot");
  const theme = read("godot/assets/fonts/mandalingo_theme.tres");
  const font = new URL("../godot/assets/fonts/NotoSansCJKtc-Regular.otf", import.meta.url);

  assert.match(project, /theme\/custom="res:\/\/assets\/fonts\/mandalingo_theme\.tres"/);
  assert.match(theme, /NotoSansCJKtc-Regular\.otf/);
  assert.ok(existsSync(font));
  assert.ok(statSync(font).size > 10_000_000, "the full CJK font must be bundled, not a Latin-only subset");
});

test("the opening limits Chinese to the required contextual phrases", () => {
  const game = read("godot/scripts/main.gd");
  const mainScene = read("godot/scenes/main.tscn");
  const stele = read("godot/scenes/props/stele.tscn");
  const gatekeeper = read("godot/scenes/props/gatekeeper.tscn");
  const project = read("godot/project.godot");
  const learnerFacingText = [game, mainScene, stele, gatekeeper, project].join("\n");
  const hanzi = learnerFacingText.match(/[\u3400-\u9fff]/g) ?? [];

  const allowed = new Set(["你", "是", "誰", "這", "裡", "水", "鎮"]);
  assert.ok(hanzi.length > 0);
  assert.ok(hanzi.every((character) => allowed.has(character)));
  assert.match(stele, /name="Inscription"[\s\S]*text = "水"/);
  assert.match(game, /\[font_size=72\]/);
  assert.match(mainScene, /name="DialogueText" type="RichTextLabel"/);
  assert.match(gatekeeper, /sequence_lines = PackedStringArray\("你是誰", "這裡是水鎮"\)/);
  assert.match(gatekeeper, /sequence_contexts = PackedStringArray\("The gatekeeper points directly at you\./);
});

test("Water Ward curriculum leads into contextual water spells", () => {
  const curriculum = JSON.parse(read("godot/data/water_curriculum.json"));
  assert.equal(curriculum.theme, "water");
  assert.equal(curriculum.first_target, "水");
  assert.equal(curriculum.minimum_contexts_before_spell_insight, 2);
  assert.deepEqual(curriculum.opening_dialogue_targets, ["你", "水"]);
  assert.ok(curriculum.future_spell_path.some(({ target }) => target === "引"));
  assert.ok(curriculum.future_spell_path.some(({ target }) => target === "止"));
});

test("dialogues close with Escape and the notebook has a clickable toggle", () => {
  const game = read("godot/scripts/main.gd");
  const mainScene = read("godot/scenes/main.tscn");

  assert.match(game, /event\.is_action_pressed\("ui_cancel"\)/);
  assert.match(game, /dialogue_panel\.hide\(\)/);
  assert.match(game, /notebook_button\.pressed\.connect\(_toggle_notebook\)/);
  assert.match(mainScene, /name="NotebookButton" type="Button"/);
});

test("the widened town has seamless walls, open exploration, and overlap-based occlusion", () => {
  const mainScene = read("godot/scenes/main.tscn");
  const playerScene = read("godot/scenes/player.tscn");
  const wall = read("godot/scenes/props/wall_segment.tscn");
  const gate = read("godot/scenes/props/gatehouse.tscn");

  assert.match(mainScene, /size = Vector2\(3200, 80\)/);
  assert.match(playerScene, /limit_right = 3200/);
  assert.doesNotMatch(mainScene, /CourtyardRails|LeftRail|RightRail|BottomRail/);
  assert.match(mainScene, /name="MidLeftWall"[\s\S]*position = Vector2\(545, 330\)/);
  assert.match(mainScene, /name="MidRightWall"[\s\S]*position = Vector2\(2655, 330\)/);
  assert.match(wall, /name="Sprite2D"[\s\S]*z_index = 8/);
  assert.match(gate, /name="Sprite2D"[\s\S]*z_index = 8/);
});

test("holding Shift makes the player run without changing exploration speed", () => {
  const player = read("godot/scripts/player.gd");
  const game = read("godot/scripts/main.gd");

  assert.match(player, /@export var walk_speed := 145\.0/);
  assert.match(player, /@export var run_speed := 235\.0/);
  assert.match(player, /Input\.is_physical_key_pressed\(KEY_SHIFT\)/);
  assert.match(player, /run_speed if is_running else walk_speed/);
  assert.match(game, /Shift Run/);
});
