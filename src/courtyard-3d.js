import * as T from "./vendor/three.module.js";
import { mergeGeometries } from "./vendor/BufferGeometryUtils.js";
import {
  COLLIDERS,
  NPCS,
  RENDER_OBJECTS,
} from "./lessons.js?v=courtyard-vfx-v1";

// Authored x/y collisions map directly to x/z; height belongs to the renderer.
export const worldPoint = (x, y) => [(x - 800) / 100, 0, (y - 450) / 100];
export function setGateOpening(doors, progress) {
  const angle = T.MathUtils.clamp(progress, 0, 1) * Math.PI * 0.48;
  doors[0].rotation.y = -angle;
  doors[1].rotation.y = angle;
}
export function frameCamera(camera, width, height, focus) {
  const portrait = width / height < 1,
    span = portrait ? 7.4 : Math.max(8.1, 14 / (width / height));
  camera.left = (-span * width) / height / 2;
  camera.right = (span * width) / height / 2;
  camera.top = span / 2;
  camera.bottom = -span / 2;
  camera.updateProjectionMatrix();
  const [x, , z] = worldPoint(focus.x, focus.y),
    target = new T.Vector3(
      portrait ? T.MathUtils.clamp(x, -3.5, 3.5) : 0,
      0.35,
      portrait ? z : 0,
    );
  camera.position.copy(target).add(new T.Vector3(0, 10, 11));
  camera.lookAt(target);
  camera.updateMatrixWorld();
}
const P = {
  plaster: 0xd8cbb1,
  stone: 0x929990,
  dark: 0x263b3b,
  roof: 0x315459,
  wood: 0x593b30,
  gold: 0xc59d54,
  skin: 0xd9ad83,
  ivory: 0xf2dfb8,
  water: 0x3e9eaa,
};
const materials = new Map();
function material(color, extras = {}) {
  const key = color + JSON.stringify(extras);
  if (!materials.has(key))
    materials.set(
      key,
      new T.MeshStandardMaterial({ color, roughness: 0.85, ...extras }),
    );
  return materials.get(key);
}
function mesh(parent, geo, color, x = 0, y = 0, z = 0, extras = {}) {
  const m = new T.Mesh(geo, material(color, extras));
  m.position.set(x, y, z);
  m.castShadow = true;
  m.receiveShadow = true;
  parent.add(m);
  return m;
}
const box = (p, w, h, d, c, x = 0, y = 0, z = 0) =>
  mesh(p, new T.BoxGeometry(w, h, d), c, x, y, z);
const cylinder = (p, t, b, h, c, x = 0, y = 0, z = 0, n = 12) =>
  mesh(p, new T.CylinderGeometry(t, b, h, n), c, x, y, z);
function group(p, x = 0, y = 0, z = 0) {
  const g = new T.Group();
  g.position.set(x, y, z);
  p.add(g);
  return g;
}
function beam(p, a, b, r, c) {
  const av = new T.Vector3(...a),
    bv = new T.Vector3(...b),
    mid = av.clone().add(bv).multiplyScalar(0.5);
  const m = cylinder(p, r, r, av.distanceTo(bv), c, ...mid.toArray(), 8);
  m.quaternion.setFromUnitVectors(
    new T.Vector3(0, 1, 0),
    bv.sub(av).normalize(),
  );
  return m;
}
function roof(p, w, d, h) {
  for (const s of [-1, 1]) {
    for (let row = 0; row < 5; row++) {
      const f = (row + 0.5) / 5,
        slab = box(
          p,
          w + 0.24 + f * 0.38,
          0.11,
          d / 10 + 0.075,
          P.roof,
          0,
          h + 0.48 * (1 - f),
          (s * f * d) / 2,
        );
      slab.rotation.x = s * 0.25;
      for (let col = 0; col < Math.ceil(w / 0.23); col++) {
        const tile = cylinder(
          p,
          0.023,
          0.023,
          d / 10 + 0.09,
          0x45666a,
          -w / 2 + col * 0.23,
          h + 0.48 * (1 - f) + 0.064,
          (s * f * d) / 2,
          6,
        );
        tile.rotation.x = Math.PI / 2 + s * 0.25;
      }
    }
    beam(
      p,
      [-w / 2 - 0.25, h + 0.05, (s * d) / 2],
      [w / 2 + 0.25, h + 0.05, (s * d) / 2],
      0.065,
      P.dark,
    );
  }
  cylinder(p, 0.085, 0.085, w + 0.35, P.gold, 0, h + 0.52, 0, 8).rotation.z =
    Math.PI / 2;
  for (const s of [-1, 1])
    beam(
      p,
      [(s * w) / 2, h + 0.5, 0],
      [s * (w / 2 + 0.28), h + 0.7, 0],
      0.055,
      P.dark,
    );
}
function bowl(p, x, y, z, water = true) {
  const b = group(p, x, y, z);
  cylinder(b, 0.16, 0.085, 0.12, P.ivory);
  cylinder(b, 0.14, 0.14, 0.014, water ? P.water : P.wood, 0, 0.062);
  return b;
}
export function createActor(color, role = "player") {
  const root = new T.Group(),
    body = group(root);
  mesh(body, new T.CylinderGeometry(0.19, 0.27, 0.49, 8), color, 0, 0.51);
  box(body, 0.39, 0.4, 0.23, color, 0, 0.88);
  box(body, 0.405, 0.065, 0.25, P.gold, 0, 0.69);
  box(body, 0.075, 0.32, 0.025, P.ivory, 0.045, 0.95, 0.13).rotation.z = -0.33;
  const head = group(body, 0, 1.25);
  mesh(head, new T.SphereGeometry(0.18, 12, 10), P.skin).scale.set(
    0.85,
    1,
    0.88,
  );
  mesh(
    head,
    new T.SphereGeometry(0.18, 12, 8),
    0x272929,
    0,
    0.075,
    -0.035,
  ).scale.set(0.92, 0.66, 0.85);
  cylinder(head, 0.075, 0.09, 0.11, 0x272929, 0, 0.22, -0.035);
  for (const s of [-1, 1])
    mesh(
      head,
      new T.SphereGeometry(0.013, 6, 4),
      0x302c28,
      s * 0.057,
      0,
      0.151,
    );
  if (role === "gatekeeper") {
    cylinder(head, 0.23, 0.23, 0.04, P.dark, 0, 0.14);
    cylinder(head, 0.12, 0.18, 0.16, P.dark, 0, 0.23);
  }
  if (role === "traveller")
    cylinder(head, 0.02, 0.33, 0.12, 0xb99759, 0, 0.17).rotation.z = 0.13;
  const limbs = {};
  for (const s of [-1, 1]) {
    const arm = group(body, s * 0.26, 1.02);
    box(arm, 0.16, 0.34, 0.18, color, 0, -0.13);
    mesh(arm, new T.SphereGeometry(0.075, 8, 6), P.skin, 0, -0.34);
    const leg = group(root, s * 0.105, 0.45);
    box(leg, 0.13, 0.31, 0.14, 0x3a3b36, 0, -0.15);
    box(leg, 0.15, 0.11, 0.24, P.dark, 0, -0.39, 0.045);
    limbs[s < 0 ? "leftArm" : "rightArm"] = arm;
    limbs[s < 0 ? "leftLeg" : "rightLeg"] = leg;
  }
  const carried = bowl(body, 0, 0.78, 0.37);
  carried.visible = false;
  if (role === "player") {
    box(body, 0.25, 0.29, 0.13, 0x9b7850, 0, 0.9, -0.2);
    beam(body, [-0.17, 1.08, -0.08], [0.15, 0.69, 0.14], 0.025, P.ivory);
  }
  return { root, body, head, bowl: carried, ...limbs };
}
export function poseActor(
  a,
  {
    stride = 0,
    moving = false,
    carrying = false,
    emptyBowl = false,
    pose = "idle",
    time = 0,
    reducedMotion = false,
  } = {},
) {
  const swing = moving && !reducedMotion ? Math.sin(stride) * 0.48 : 0;
  a.leftLeg.rotation.x = swing;
  a.rightLeg.rotation.x = -swing;
  a.leftArm.rotation.x = -swing * 0.7;
  a.rightArm.rotation.x = swing * 0.7;
  a.leftArm.rotation.z = 0;
  a.rightArm.rotation.z = 0;
  a.body.position.y =
    moving && !reducedMotion ? Math.abs(Math.sin(stride)) * 0.025 : 0;
  a.head.rotation.x =
    pose === "nod" && !reducedMotion ? Math.sin(time * 5) * 0.1 : 0;
  a.bowl.visible = carrying || pose === "drink-water";
  a.bowl.position.set(
    0,
    pose === "drink-water" ? 1.14 : 0.78,
    pose === "drink-water" ? 0.23 : 0.37,
  );
  a.bowl.children[1].material = material(emptyBowl ? P.wood : P.water);
  if (carrying || pose === "drink-water")
    a.leftArm.rotation.x = a.rightArm.rotation.x =
      pose === "drink-water" ? -1.8 : -1.05;
  if (pose === "point-third" || pose === "point-player")
    a.rightArm.rotation.x = -1.4;
  if (pose === "point-self") {
    a.rightArm.rotation.x = -1.05;
    a.rightArm.rotation.z = -0.75;
  }
  if (pose === "question" || pose === "confused") {
    a.leftArm.rotation.x = -0.85;
    a.leftArm.rotation.z = -0.3;
  }
}

// Bake static meshes by material once. Moving bodies and door pivots stay independent.
function batchScenery(scene, doors) {
  scene.updateMatrixWorld(true);
  const batches = new Map(),
    originals = [];
  scene.traverse((object) => {
    if (!object.isMesh || object.isInstancedMesh) return;
    for (let p = object; p; p = p.parent) if (doors.includes(p)) return;
    const geometry = object.geometry.index
      ? object.geometry.toNonIndexed()
      : object.geometry.clone();
    geometry.applyMatrix4(object.matrixWorld);
    if (!batches.has(object.material)) batches.set(object.material, []);
    batches.get(object.material).push(geometry);
    originals.push(object);
  });
  for (const object of originals) {
    object.removeFromParent();
    object.geometry.dispose();
  }
  for (const [mat, geometries] of batches) {
    const m = new T.Mesh(mergeGeometries(geometries), mat);
    m.castShadow = true;
    m.receiveShadow = true;
    scene.add(m);
    for (const geometry of geometries) geometry.dispose();
  }
}
export function buildCourtyard() {
  const scene = new T.Scene();
  scene.background = new T.Color(0xb4c4bf);
  scene.fog = new T.Fog(0xb4c4bf, 23, 48);
  scene.add(new T.HemisphereLight(0xe7f1e5, 0x64756c, 2.4));
  const sun = new T.DirectionalLight(0xffe1ac, 3.3);
  sun.position.set(-5, 10, 6);
  sun.castShadow = true;
  Object.assign(sun.shadow.camera, {
    left: -10,
    right: 10,
    top: 9,
    bottom: -9,
    near: 0.1,
    far: 35,
  });
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.bias = -0.0005;
  sun.shadow.normalBias = 0.025;
  scene.add(sun);
  box(scene, 200, 0.2, 200, 0x81978c, 0, -0.85);
  box(scene, 11.5, 0.65, 6.5, 0x62756f, 0, -0.45, 0.35);
  box(scene, 11.3, 0.15, 6.3, 0xb4b29c, 0, -0.09, 0.35);
  const paving = new T.InstancedMesh(
      new T.BoxGeometry(0.485, 0.045, 0.385),
      material(0xb7b5a0),
      330,
    ),
    dummy = new T.Object3D();
  let index = 0;
  for (let row = 0; row < 15; row++)
    for (let col = 0; col < 22; col++) {
      dummy.position.set(
        -5.25 + col * 0.5 + (row % 2) * 0.055,
        -0.015,
        -2.4 + row * 0.4,
      );
      dummy.updateMatrix();
      paving.setMatrixAt(index, dummy.matrix);
      paving.setColorAt(
        index++,
        new T.Color().setHSL(
          0.12,
          0.09,
          0.56 + ((row * 17 + col * 13) % 11) * 0.012,
        ),
      );
    }
  paving.receiveShadow = true;
  scene.add(paving);
  for (const x of [-1.15, 1.15])
    box(scene, 0.07, 0.015, 5.5, P.gold, x, 0.015, 0.15);
  for (let i = 0; i < 9; i++)
    box(scene, 1.95, 0.045, 0.49, 0xbfc2b4, 0, 0.014, -1.6 + i * 0.55);
  for (const s of [-1, 1]) {
    const wall = group(scene, s * 3.25, 0, -1.88);
    box(wall, 4.4, 1.6, 0.32, P.plaster, 0, 0.8);
    box(wall, 4.45, 0.22, 0.4, P.stone, 0, 0.12);
    roof(wall, 4.5, 0.67, 1.6);
    for (let i = 0; i < 5; i++)
      box(wall, 0.075, 1.4, 0.35, 0xb6a887, -1.8 + i * 0.9, 0.92, 0.02);
    const side = group(scene, s * 5.32, 0, 0.4);
    box(side, 0.3, 0.8, 4.5, P.plaster, 0, 0.4);
    box(side, 0.42, 0.13, 4.65, P.dark, 0, 0.86);
    box(scene, 3.65, 0.32, 0.35, P.plaster, s * 3.3, 0.16, 2.57);
    box(scene, 3.75, 0.09, 0.44, P.dark, s * 3.3, 0.36, 2.57);
  }
  const gatehouse = group(scene, 0, 0, -1.8);
  for (const s of [-1, 1]) {
    box(gatehouse, 0.25, 2.25, 0.4, P.wood, s * 1.08, 1.125);
    box(gatehouse, 0.4, 0.2, 0.55, P.stone, s * 1.08, 0.1);
  }
  box(gatehouse, 2.7, 0.27, 0.5, P.wood, 0, 2.02);
  roof(gatehouse, 3, 1.7, 2.28);
  box(gatehouse, 0.9, 0.32, 0.075, P.dark, 0, 2.06, 0.3);
  box(gatehouse, 0.65, 0.045, 0.08, P.gold, 0, 2.06, 0.35);
  const doors = [];
  for (const s of [-1, 1]) {
    const hinge = group(scene, s * 0.9, 0, -1.62);
    doors.push(hinge);
    box(hinge, 0.9, 1.76, 0.12, P.wood, -s * 0.45, 0.9);
    for (let i = 0; i < 5; i++)
      box(
        hinge,
        0.017,
        1.7,
        0.025,
        0x967052,
        -s * (0.09 + i * 0.18),
        0.9,
        0.073,
      );
    for (const y of [0.32, 1.4])
      box(hinge, 0.87, 0.09, 0.16, P.dark, -s * 0.45, y);
    mesh(
      hinge,
      new T.TorusGeometry(0.07, 0.018, 6, 14),
      P.gold,
      -s * 0.76,
      0.95,
      0.1,
    );
  }
  box(scene, 2.1, 0.03, 12, 0xb1b3a0, 0, -0.15, -8);
  for (let i = 0; i < 6; i++) {
    const g = group(
      scene,
      (i % 2 ? 1 : -1) * (5 + i * 0.6),
      -0.3,
      -6 - i * 1.7,
    );
    box(g, 2.8, 1.8, 2.3, 0x9daba0, 0, 0.9);
    roof(g, 3, 2.6, 1.8);
  }
  const props = new Map();
  for (const item of RENDER_OBJECTS.filter(
    (o) =>
      o.type !== "structure" &&
      o.type !== "npc" &&
      o.type !== "effect" &&
      o.id !== "gate",
  )) {
    const [x, , z] = worldPoint(item.x, item.y),
      g = group(scene, x, 0, z - 0.15);
    props.set(item.id, g);
    if (item.id === "water-jar") {
      mesh(
        g,
        new T.LatheGeometry(
          [
            new T.Vector2(0.22, 0),
            new T.Vector2(0.35, 0.12),
            new T.Vector2(0.39, 0.4),
            new T.Vector2(0.32, 0.63),
            new T.Vector2(0.3, 0.68),
            new T.Vector2(0.26, 0.67),
            new T.Vector2(0.27, 0.58),
          ],
          24,
        ),
        0x34747b,
      );
      cylinder(g, 0.269, 0.269, 0.015, P.water, 0, 0.6, 0, 32);
      mesh(
        g,
        new T.TorusGeometry(0.285, 0.035, 8, 32),
        0x92aaa0,
        0,
        0.67,
      ).rotation.x = Math.PI / 2;
      beam(g, [-0.25, 0.74, 0.05], [0.46, 0.8, 0.05], 0.025, P.wood);
      bowl(g, 0.43, 0.78, 0.05);
      cylinder(g, 0.43, 0.46, 0.05, P.stone, 0, 0.025);
    } else if (item.id === "work-table") {
      box(g, 1.6, 0.11, 0.5, P.wood, 0, 0.72);
      for (const a of [-0.67, 0.67])
        for (const b of [-0.17, 0.17])
          box(g, 0.09, 0.7, 0.09, P.wood, a, 0.35, b);
      box(g, 0.53, 0.018, 0.33, P.ivory, -0.25, 0.787);
      box(g, 0.2, 0.08, 0.24, 0x49626b, 0.4, 0.8);
      cylinder(g, 0.065, 0.06, 0.15, P.dark, 0.62, 0.84);
    } else if (item.id === "notice-board") {
      for (const s of [-1, 1]) box(g, 0.09, 1.4, 0.11, P.wood, s * 0.58, 0.7);
      box(g, 1.5, 0.88, 0.12, P.wood, 0, 1.06);
      box(g, 1.28, 0.7, 0.015, P.ivory, 0, 1.06, 0.07);
      roof(g, 1.65, 0.5, 1.53);
    } else if (item.id === "mirror") {
      box(g, 0.5, 0.13, 0.3, P.wood, 0, 0.07);
      box(g, 0.09, 1.06, 0.09, P.wood, 0, 0.53);
      mesh(
        g,
        new T.CylinderGeometry(0.28, 0.28, 0.055, 32),
        0x9bac99,
        0,
        0.97,
        0,
        { metalness: 0.75, roughness: 0.23 },
      ).rotation.x = Math.PI / 2;
      mesh(g, new T.TorusGeometry(0.285, 0.035, 8, 32), P.gold, 0, 0.97, 0.025);
    } else if (item.id.startsWith("lantern")) {
      cylinder(g, 0.13, 0.16, 0.12, P.stone, 0, 0.06);
      box(g, 0.065, 1.55, 0.065, P.wood, 0, 0.8);
      beam(g, [0, 1.58, 0], [0.28, 1.58, 0], 0.035, P.wood);
      mesh(
        g,
        new T.CylinderGeometry(0.15, 0.14, 0.3, 8),
        0xffce7c,
        0.25,
        1.32,
        0,
        { emissive: 0xe68a39, emissiveIntensity: 0.5 },
      );
      for (const y of [1.16, 1.48]) box(g, 0.34, 0.045, 0.32, P.dark, 0.25, y);
    } else if (item.id === "weapon-rack") {
      for (const s of [-1, 1])
        box(g, 0.075, 1.06, 0.08, P.wood, s * 0.38, 0.53);
      box(g, 0.87, 0.08, 0.08, P.wood, 0, 0.74);
      for (let i = 0; i < 3; i++) {
        beam(
          g,
          [-0.27 + i * 0.26, 0.06, 0.12],
          [-0.19 + i * 0.26, 1.45, 0],
          0.024,
          P.wood,
        );
        mesh(
          g,
          new T.ConeGeometry(0.07, 0.23, 4),
          0xc0c8be,
          -0.19 + i * 0.26,
          1.55,
        );
      }
    } else if (item.id === "chair") {
      box(g, 0.42, 0.08, 0.36, P.wood, 0, 0.38);
      box(g, 0.42, 0.52, 0.075, P.wood, 0, 0.66, -0.15);
      for (const s of [-1, 1]) box(g, 0.06, 0.36, 0.32, P.wood, s * 0.16, 0.18);
    } else if (item.id === "crate") {
      box(g, 0.62, 0.48, 0.43, 0x906d48, 0, 0.24);
      for (const y of [0.06, 0.42]) box(g, 0.65, 0.05, 0.45, P.dark, 0, y);
    } else if (item.id === "water-bucket") {
      cylinder(g, 0.2, 0.16, 0.28, 0x816344, 0, 0.14);
      cylinder(g, 0.18, 0.18, 0.015, P.dark, 0, 0.285);
    } else if (item.id === "rock-right")
      mesh(g, new T.DodecahedronGeometry(0.36, 0), P.stone, 0, 0.35).scale.set(
        0.8,
        1.6,
        0.7,
      );
    else if (item.id === "bamboo-left")
      for (let i = 0; i < 5; i++) {
        beam(
          g,
          [i * 0.09 - 0.2, 0, 0],
          [i * 0.13 - 0.2, 1.7 + i * 0.1, 0],
          0.025,
          0x5d7952,
        );
        for (let j = 0; j < 3; j++)
          mesh(
            g,
            new T.SphereGeometry(0.13, 5, 3),
            0x668254,
            i * 0.13 - 0.3,
            j * 0.3 + 1,
            0.03,
          ).scale.set(2, 0.3, 0.6);
      }
  }
  for (const [x, z, scale] of [
    [-6.2, -1.2, 1],
    [6.3, -2, 1.1],
    [-6.1, 2.8, 0.8],
    [6.4, 3, 0.75],
  ]) {
    const tree = group(scene, x, 0, z);
    tree.scale.setScalar(scale);
    beam(tree, [0, 0, 0], [0.13, 2.5, 0], 0.12, 0x68503a);
    for (let i = 0; i < 8; i++) {
      const a = i * 2.4,
        r = 0.5 + (i % 3) * 0.2,
        px = Math.cos(a) * r,
        pz = Math.sin(a) * r;
      beam(tree, [0, 1.6, 0], [px, 2.6, pz], 0.055, 0x68503a);
      mesh(
        tree,
        new T.IcosahedronGeometry(0.69, 1),
        [0xc58a38, 0xd3a34c, 0xb96735][i % 3],
        px,
        2.5 + (i % 3) * 0.23,
        pz,
      ).scale.y = 0.7;
    }
  }
  const leaves = new T.InstancedMesh(
    new T.OctahedronGeometry(0.065, 0),
    material(0xbd8742),
    100,
  );
  for (let i = 0; i < 100; i++) {
    dummy.position.set(
      Math.sin(i * 63.7) * 4.9,
      0.04,
      Math.cos(i * 24.3) * 2.05 + 0.4,
    );
    dummy.rotation.set(0, i, 0);
    dummy.scale.set(1, 0.13, 0.5);
    dummy.updateMatrix();
    leaves.setMatrixAt(i, dummy.matrix);
  }
  scene.add(leaves);
  batchScenery(scene, doors);
  const actors = new Map();
  for (const [id, color, role] of [
    ["player", 0x427e81, "player"],
    ["gatekeeper", 0x744d3c, "gatekeeper"],
    ["clerk", 0x647386, "clerk"],
    ["thirsty-traveller", 0x9a8063, "traveller"],
  ]) {
    const actor = createActor(color, role);
    actors.set(id, actor);
    scene.add(actor.root);
  }
  const marker = mesh(
    scene,
    new T.RingGeometry(0.32, 0.36, 48),
    P.gold,
    0,
    0.045,
    0,
    { side: T.DoubleSide, emissive: P.gold, emissiveIntensity: 0.25 },
  );
  marker.rotation.x = -Math.PI / 2;
  marker.castShadow = false;
  const collisionDebug = new T.Group();
  scene.add(collisionDebug);
  for (const item of COLLIDERS) {
    const c = item.collider,
      m = new T.Mesh(
        new T.BoxGeometry(c.width / 100, 0.06, c.height / 100),
        new T.MeshBasicMaterial({ color: 0xff3c88, wireframe: true }),
      );
    m.userData.entity = item;
    collisionDebug.add(m);
  }
  collisionDebug.visible = false;
  return { scene, actors, doors, props, marker, sun, collisionDebug };
}

// Fixed-size presentation pool: clues never own inventory, guesses or quest state.
export class EvidenceVFX {
  constructor(scene) {
    this.slots = Array.from({length:4},()=>{
      const root=new T.Group(); scene.add(root);
      const material=new T.MeshBasicMaterial({color:0x72e4ed,transparent:true,opacity:.8,depthWrite:false});
      const rings=Array.from({length:3},()=>{const m=new T.Mesh(new T.TorusGeometry(1,.025,6,48),material);m.rotation.x=-Math.PI/2;root.add(m);return m;});
      const beads=Array.from({length:16},()=>{const m=new T.Mesh(new T.SphereGeometry(.035,6,4),material);root.add(m);return m;});
      return {root,material,rings,beads};
    });
    this.a=new T.Vector3();this.b=new T.Vector3();
  }
  anchor(id,world,bowl=false) {
    const a=world.actors.get(id);
    if(a){ if(bowl) return a.bowl.getWorldPosition(new T.Vector3()); return a.root.position.clone().add(new T.Vector3(0,1,0)); }
    if(id==='water-jar') return new T.Vector3(4.15,.64,.5);
    if(id==='gate') return new T.Vector3(0,1.15,-1.61);
    return null;
  }
  render(game,world) {
    world.scene.updateMatrixWorld(true);
    this.slots.forEach((slot,index)=>{
      const effect=game.evidence?.active[index];slot.root.visible=!!effect;if(!effect)return;
      const water=['water-surface','water-fill','drink'].includes(effect.kind);
      slot.material.color.setHex(water?0x72e4ed:0xffd58a);
      const p=Math.min(1,(game.evidence.time-effect.startedAt)/effect.duration);
      slot.material.opacity=Math.sin(Math.PI*p)*.85;
      const bowl=['empty-bowl','water-fill','drink'].includes(effect.kind);
      const a=this.anchor(effect.sourceId,world,effect.kind==='drink'||effect.kind==='empty-bowl');
      const b=this.anchor(effect.targetId,world,bowl);if(!a||!b){slot.root.visible=false;return;}
      const flow=['reference','water-fill','drink'].includes(effect.kind);
      if(effect.kind==='drink')b.y+=.35;
      slot.rings.forEach((ring,i)=>{
        ring.visible=i===0||(!game.reducedMotion&&effect.kind==='water-surface');
        ring.position.copy(b);const radius=effect.kind==='empty-bowl'?.19:effect.kind==='water-surface'?.15+.16*((p*2+i/3)%1):.32+.18*p;
        ring.scale.setScalar(radius);ring.rotation.x=effect.kind==='gate-release'?0:-Math.PI/2;
      });
      slot.beads.forEach((bead,i)=>{
        bead.visible=!game.reducedMotion&&effect.kind!=='empty-bowl';
        const t=(p*2+i/16)%1;
        if(flow){bead.position.lerpVectors(a,b,t);bead.position.y+=Math.sin(t*Math.PI)*.3;}
        else{const angle=i*Math.PI*2/16+p*2;bead.position.copy(b);bead.position.x+=Math.cos(angle)*.3;bead.position.z+=Math.sin(angle)*.3;bead.position.y+=t*.48;}
      });
    });
  }
}

export class Courtyard3D {
  constructor(canvas) {
    try {
      this.renderer = new T.WebGLRenderer({
        canvas,
        antialias: true,
        alpha: false,
        powerPreference: "high-performance",
      });
    } catch {
      this.showFailure(canvas);
      return;
    }
    this.world = buildCourtyard();
    this.evidenceVFX = new EvidenceVFX(this.world.scene);
    canvas.addEventListener("webglcontextlost", (event) => {
      event.preventDefault();
      this.showFailure(canvas);
    });
    this.renderer.setPixelRatio(
      Math.min(globalThis.devicePixelRatio || 1, 1.75),
    );
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = T.PCFShadowMap;
    this.renderer.toneMapping = T.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 0.95;
    this.camera = new T.OrthographicCamera(-8, 8, 5, -5, 0.1, 80);
    this.target = new T.Vector3();
    this.width = 0;
    this.height = 0;
    this.label = document.createElement("div");
    this.label.className = "scene-speech-3d";
    this.label.hidden = true;
    canvas.parentElement.append(this.label);
    const c = document.createElement("canvas");
    c.width = 256;
    c.height = 192;
    const ctx = c.getContext("2d");
    ctx.fillStyle = "#efdfb9";
    ctx.fillRect(0, 0, 256, 192);
    ctx.fillStyle = "#34413b";
    ctx.font = "100px serif";
    ctx.textAlign = "center";
    ctx.fillText("水", 128, 126);
    const texture = new T.CanvasTexture(c);
    texture.colorSpace = T.SRGBColorSpace;
    const sign = new T.Mesh(
      new T.PlaneGeometry(1.22, 0.66),
      new T.MeshBasicMaterial({ map: texture }),
    );
    sign.position.set(0, 1.06, 0.083);
    this.world.props.get("notice-board").add(sign);
  }
  showFailure(canvas) {
    if (this.failed) return;
    this.failed = true;
    const panel = document.createElement("section");
    panel.className = "render-failure";
    panel.setAttribute("role", "alert");
    const heading = document.createElement("h1");
    heading.textContent = "The 3D courtyard could not start";
    const detail = document.createElement("p");
    detail.textContent =
      "This scene needs WebGL 2. Enable graphics acceleration or try another browser. Your saved journey is still on this device.";
    const retry = document.createElement("button");
    retry.textContent = "Reload the courtyard";
    retry.onclick = () => location.reload();
    panel.append(heading, detail, retry);
    canvas.parentElement.append(panel);
    retry.focus();
  }
  render(game) {
    if (this.failed) {
      game.setInputEnabled(false);
      return;
    }
    const { renderer, camera, world } = this,
      w = Math.max(1, game.viewWidth),
      h = Math.max(1, game.viewHeight);
    if (this.width !== w || this.height !== h) {
      renderer.setSize(w, h, false);
      this.width = w;
      this.height = h;
    }
    const focus =
      game.resolution && !game.resolutionCompleted
        ? game.actorPositions["thirsty-traveller"]
        : game.dialogueActor || game.player;
    frameCamera(camera, w, h, focus);
    for (const [id, a] of world.actors) {
      const player = id === "player",
        npc = NPCS.find((n) => n.id === id),
        position = player ? game.player : game.actorPositions[id] || npc,
        cue = game.actorCues[id] || {};
      a.root.position.set(...worldPoint(position.x, position.y));
      if (player)
        a.root.rotation.y = Math.atan2(game.player.lookX, game.player.lookY);
      else if (id === "thirsty-traveller")
        a.root.rotation.y =
          game.resolutionPhase === "walk" ? 1.91 : game.questResolved ? 0 : 1.2;
      else a.root.rotation.y = 0;
      if (
        !player &&
        (cue.gestureTarget === "player" || cue.gestureTarget === "gatekeeper")
      ) {
        const target =
          cue.gestureTarget === "player"
            ? game.player
            : game.actorPositions.gatekeeper;
        a.root.rotation.y = Math.atan2(
          target.x - position.x,
          target.y - position.y,
        );
      }
      poseActor(a, {
        stride: player ? game.stride : game.time * 6,
        moving: player
          ? game.moving
          : id === "thirsty-traveller" && game.resolutionPhase === "walk",
        carrying: player ? game.carryingWater && !game.resolution : !!cue.prop,
        emptyBowl: cue.prop === "empty-bowl",
        pose: cue.pose,
        time: game.time,
        reducedMotion: game.reducedMotion,
      });
    }
    setGateOpening(world.doors, game.gateOpenProgress);
    world.marker.visible = !!game.nearby && game.inputEnabled;
    if (game.nearby) {
      const [x, , z] = worldPoint(game.nearby.x, game.nearby.y);
      world.marker.position.set(x, 0.045, z);
    }
    world.collisionDebug.visible = game.debugCollisions;
    if (game.debugCollisions)
      for (const m of world.collisionDebug.children) {
        const e = game.worldEntity(m.userData.entity),
          c = e.collider;
        m.position.set(
          ...worldPoint(e.x + c.x + c.width / 2, e.y + c.y + c.height / 2),
        );
        m.position.y = 0.06;
        m.visible = e.id !== "gate" || !game.questResolved;
      }
    let speaker = game.dialogueActor,
      text = game.dialogueText;
    if (game.resolutionPhase === "plead") {
      speaker = game.actorPositions["thirsty-traveller"];
      text = "我……水……";
    }
    this.label.hidden = !speaker || !text;
    if (speaker && text) {
      const p = new T.Vector3(...worldPoint(speaker.x, speaker.y));
      p.y = 1.65;
      p.project(camera);
      this.label.textContent = text;
      this.label.style.left = `${(p.x * 0.5 + 0.5) * w}px`;
      this.label.style.top = `${(-p.y * 0.5 + 0.5) * h + game.canvas.offsetTop}px`;
    }
    this.evidenceVFX.render(game, world);
    renderer.render(world.scene, camera);
    if (!this.acknowledged) {
      this.acknowledged = true;
      window.mandalingoDesktop?.rendered();
    }
  }
}
