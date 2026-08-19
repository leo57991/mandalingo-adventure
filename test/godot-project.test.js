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

test("the first town isolates one large Chinese learning target", () => {
  const game = read("godot/scripts/main.gd");
  const mainScene = read("godot/scenes/main.tscn");
  const stele = read("godot/scenes/props/stele.tscn");
  const gatekeeper = read("godot/scenes/props/gatekeeper.tscn");
  const project = read("godot/project.godot");
  const learnerFacingText = [game, mainScene, stele, gatekeeper, project].join("\n");
  const hanzi = learnerFacingText.match(/[\u3400-\u9fff]/g) ?? [];

  assert.deepEqual([...new Set(hanzi)], ["水"]);
  assert.match(stele, /name="Inscription"[\s\S]*text = "水"/);
  assert.match(game, /\[font_size=72\]/);
  assert.match(mainScene, /name="DialogueText" type="RichTextLabel"/);
});

test("Water Ward curriculum leads into contextual water spells", () => {
  const curriculum = JSON.parse(read("godot/data/water_curriculum.json"));
  assert.equal(curriculum.theme, "water");
  assert.equal(curriculum.first_target, "水");
  assert.equal(curriculum.minimum_contexts_before_spell_insight, 2);
  assert.ok(curriculum.future_spell_path.some(({ target }) => target === "引"));
  assert.ok(curriculum.future_spell_path.some(({ target }) => target === "止"));
});
