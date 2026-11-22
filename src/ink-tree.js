import * as T from "./vendor/three.module.js";

// Every visible part is volume geometry. The small leaves have a raised midrib and a solid underside,
// instanced to keep the town affordable to render from any camera angle.
const bark = new T.MeshStandardMaterial({ color: 0x5b463b, roughness: 1 });
const darkBark = new T.MeshStandardMaterial({ color: 0x392f2b, roughness: 1 });
const crownMaterials = new Map();
const leafGeometry = (() => {
  const outline = [
    [0,.18,0], [-.047,.061,0], [-.13,.085,0], [-.075,-.038,0],
    [-.037,-.077,0], [0,-.15,0], [.037,-.077,0], [.075,-.038,0],
    [.13,.085,0], [.047,.061,0],
  ];
  const points = [...outline, [0,.027,.023], [0,.027,-.01]];
  const triangles = [];
  for (let i = 0; i < outline.length; i++) {
    const next = (i + 1) % outline.length;
    triangles.push(10, i, next, 11, next, i);
  }
  const geometry = new T.BufferGeometry();
  geometry.setAttribute("position", new T.Float32BufferAttribute(points.flat(), 3));
  geometry.setIndex(triangles);
  geometry.computeVertexNormals();
  return geometry;
})();
const needleGeometry = new T.ConeGeometry(.055, .34, 5);

function crownGeometry(seed) {
  const geometry = new T.SphereGeometry(1, 16, 12);
  const positions = geometry.attributes.position;
  for (let i = 0; i < positions.count; i++) {
    const x = positions.getX(i), y = positions.getY(i), z = positions.getZ(i);
    const swell = .98 + .12 * Math.sin(9 * x + 7 * y + seed) * Math.cos(8 * z - 4 * y)
      + .08 * Math.cos(11 * z + seed) * Math.sin(11 * y - 5 * x);
    positions.setXYZ(i, x * swell, y * swell, z * swell);
  }
  geometry.computeVertexNormals();
  return geometry;
}

function tint(color) {
  if (!crownMaterials.has(color)) crownMaterials.set(color, new T.MeshStandardMaterial({ color, roughness: .94, side: T.DoubleSide }));
  return crownMaterials.get(color);
}
function rand(seed) {
  const x = Math.sin(seed * 127.1 + 78.23) * 43758.5453;
  return x - Math.floor(x);
}
function branch(parent, from, to, bottom, top, material = bark) {
  const a = new T.Vector3(...from), b = new T.Vector3(...to);
  const mesh = new T.Mesh(new T.CylinderGeometry(top, bottom, a.distanceTo(b), 8, 1), material);
  mesh.position.copy(a).add(b).multiplyScalar(.5);
  mesh.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), b.sub(a).normalize());
  mesh.castShadow = true;
  parent.add(mesh);
}

export function addInkTree(parent, { pine = false, color = 0xbb8954, seed = 0 } = {}) {
  const g = new T.Group();
  parent.add(g);
  branch(g, [0, 0, 0], [.055, 2.62, -.035], .17, .045);
  for (let i = 0; i < 5; i++) {
    const a = i * 2.41 + seed, r = .18 + i * .075;
    branch(g, [0, .19, 0], [Math.cos(a) * r, .73 + i * .12, Math.sin(a) * r], .065, .018, darkBark);
  }
  const base = new T.Color(color), ochre = new T.Color(0xd3a064), green = new T.Color(0x687b5f);
  const clusters = [];
  const count = pine ? 11 : 12;
  for (let i = 0; i < count; i++) {
    const a = i * 2.399 + seed * .37;
    const tier = Math.floor(i / 4), radius = pine ? 1.1 - tier * .27 : .52 + (i % 4) * .16;
    const point = [Math.cos(a) * radius, pine ? 1.22 + tier * .5 : 2.06 + tier * .23, Math.sin(a) * radius];
    branch(g, [.025, 1.25 + tier * .24, 0], point, .07 - tier * .009, .012);
    clusters.push(point);
    const mass = new T.Mesh(crownGeometry(seed + i), tint(pine ? 0x4d6253 : color));
    mass.position.set(...point);
    mass.scale.set((pine ? .43 : .35) + rand(i + seed) * .08, pine ? .15 : .27, .31 + rand(i + seed + 1) * .09);
    mass.rotation.y = a;
    mass.castShadow = mass.receiveShadow = true;
    g.add(mass);
  }
  const leaves = new T.InstancedMesh(pine ? needleGeometry : leafGeometry, tint(0xffffff), pine ? 320 : 390);
  const dummy = new T.Object3D();
  const leafColor = new T.Color(), tips = new T.Color(0x9caa78);
  for (let i = 0; i < leaves.count; i++) {
    const centre = clusters[i % clusters.length], a = rand(i * 3 + seed) * Math.PI * 2, h = rand(i * 3 + seed + 1) * 2 - 1;
    const r = Math.sqrt(1 - h * h) * (.14 + rand(i * 3 + seed + 2) * (pine ? .28 : .31));
    dummy.position.set(centre[0] + Math.cos(a) * r, centre[1] + h * (pine ? .18 : .29), centre[2] + Math.sin(a) * r);
    dummy.rotation.set(a, rand(i + seed + 8) * Math.PI * 2, h * 2.2);
    dummy.scale.setScalar((pine ? .38 : .35) + rand(i + seed + 13) * .36);
    dummy.updateMatrix();
    leaves.setMatrixAt(i, dummy.matrix);
    if (pine) leafColor.copy(green).lerp(tips, rand(i + seed + 24) * .35);
    else leafColor.copy(base).lerp(i % 6 === 0 ? green : ochre, rand(i + seed + 24) * .54);
    leaves.setColorAt(i, leafColor);
  }
  leaves.castShadow = leaves.receiveShadow = true;
  leaves.instanceMatrix.needsUpdate = true;
  leaves.instanceColor.needsUpdate = true;
  g.add(leaves);
  return g;
}
