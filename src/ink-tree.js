import * as T from "./vendor/three.module.js";
import { mergeGeometries } from "./vendor/BufferGeometryUtils.js";

const bark = new T.MeshStandardMaterial({ vertexColors: true, roughness: .96 });
const foliage = new T.MeshStandardMaterial({ roughness: .89 });
const dummy = new T.Object3D();

function random(seed) {
  const x = Math.sin(seed * 127.1 + 78.23) * 43758.5453;
  return x - Math.floor(x);
}

function leafGeometry() {
  const outline = [
    [0,.18,.018], [-.034,.077,.008], [-.082,.1,.014], [-.074,.012,-.006],
    [-.097,-.048,.006], [-.038,-.058,-.01], [0,-.131,-.018],
    [.036,-.056,-.005], [.09,-.041,.006], [.068,.012,-.002],
    [.066,.087,.017], [.03,.082,.012],
  ];
  const points = [...outline, [0,.017,.025], [0,.017,-.009]];
  const indices = [];
  for (let i = 0; i < outline.length; i++) {
    const next = (i + 1) % outline.length;
    indices.push(12, i, next, 13, next, i);
  }
  const geometry = new T.BufferGeometry();
  geometry.setAttribute("position", new T.Float32BufferAttribute(points.flat(), 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

// A short shoot carries several solid leaves. The sprigs are repeated with
// independent color and orientation so the canopy has gaps and lit edges.
function sprigGeometry(pine) {
  const blades = [], count = pine ? 6 : 3;
  for (let i = 0; i < count; i++) {
    const blade = pine ? new T.ConeGeometry(.018, .285, 4, 1).translate(0, .115, 0) : leafGeometry();
    blade.rotateX(pine ? .55 + i * .075 : .26 + (i % 3) * .28);
    blade.rotateZ(Math.PI * 2 * i / count);
    blade.translate(Math.sin(i * 2.4) * .033, Math.cos(i * 2.4) * .043, i * .013);
    blades.push(blade.index ? blade.toNonIndexed() : blade);
    if (blade.index) blade.dispose();
  }
  const sprig = mergeGeometries(blades);
  for (const blade of blades) blade.dispose();
  return sprig;
}

const mapleShoot = sprigGeometry(false);
const pineShoot = sprigGeometry(true);

// Tapered sections follow a curved centreline. Color and radius share the
// grooves, so bark reads under moving light with no painted surface.
function timber(points, radii, { seed, pine, root = false }) {
  const curve = new T.CatmullRomCurve3(points);
  const rings = root ? 19 : 8, sides = root ? 16 : 8;
  const frames = curve.computeFrenetFrames(rings, false);
  const position = [], color = [], indices = [];
  const centre = new T.Vector3(), vertex = new T.Vector3();
  const shade = new T.Color(), base = new T.Color(pine ? 0x51463e : 0x615044);
  const moss = new T.Color(0x575e48);
  for (let ring = 0; ring <= rings; ring++) {
    const t = ring / rings, k = t * (radii.length - 1), index = Math.min(Math.floor(k), radii.length - 2);
    const radius = T.MathUtils.lerp(radii[index], radii[index + 1], k - index);
    curve.getPointAt(t, centre);
    for (let side = 0; side < sides; side++) {
      const angle = side * Math.PI * 2 / sides;
      const ridge = Math.sin(angle * 5 + t * 4.4 + seed) * .1 + Math.cos(angle * 3 - t * 3.3) * .09;
      const width = radius * (1 + ridge);
      vertex.copy(centre).addScaledVector(frames.normals[ring], Math.cos(angle) * width)
        .addScaledVector(frames.binormals[ring], Math.sin(angle) * width);
      position.push(vertex.x, vertex.y, vertex.z);
      shade.copy(base).lerp(moss, Math.max(0, .6 - t * 1.4) * (root ? .75 : .28));
      shade.multiplyScalar(.88 + ridge * 1.3 + .095 * random(side + ring * .32 + seed));
      color.push(shade.r, shade.g, shade.b);
      if (ring < rings) {
        const a = ring * sides + side, b = ring * sides + (side + 1) % sides;
        indices.push(a, b, a + sides, b, b + sides, a + sides);
      }
    }
  }
  const mesh = new T.BufferGeometry();
  mesh.setAttribute("position", new T.Float32BufferAttribute(position, 3));
  mesh.setAttribute("color", new T.Float32BufferAttribute(color, 3));
  mesh.setIndex(indices);
  mesh.computeVertexNormals();
  return mesh;
}

function instance(mesh, index, point, rotation, scale, color) {
  dummy.position.copy(point);
  dummy.rotation.set(...rotation);
  dummy.scale.set(...scale);
  dummy.updateMatrix();
  mesh.setMatrixAt(index, dummy.matrix);
  mesh.setColorAt(index, color);
}

export function addInkTree(parent, { pine = false, color = 0xbb8954, seed = 0 } = {}) {
  const group = new T.Group();
  group.name = pine ? "Mountain pine" : "Autumn maple";
  parent.add(group);
  const trunk = [
    new T.Vector3(0, -.045, 0), new T.Vector3(.03, .48, -.035),
    new T.Vector3(-.05, 1.17, .034), new T.Vector3(.085, 1.95, -.04),
    new T.Vector3(pine ? .24 : .09, pine ? 2.75 : 2.88, -.068),
  ];
  const wood = [timber(trunk, [.223, .138, .106, .069, .011], { seed, pine, root: true })];
  for (let i = 0; i < 5; i++) {
    const angle = i * 2.4 + seed, x = Math.cos(angle), z = Math.sin(angle);
    wood.push(timber([new T.Vector3(0,.31,0), new T.Vector3(x*.21,.15,z*.21), new T.Vector3(x*.4,-.03,z*.4)],
      [.091, .054, .009], { seed: seed + i, pine }));
  }
  const canopy = [], forks = pine ? 10 : 12;
  for (let i = 0; i < forks; i++) {
    const angle = i * 2.399 + seed * .31, tier = i / (forks - 1);
    const span = (pine ? 1.37 - .98 * tier : .68 + .49 * Math.sin(tier * Math.PI)) * (.87 + random(seed + i) * .25);
    const base = trunk[2].clone().lerp(trunk[3], tier);
    if (pine) base.y -= .44 * (1 - tier);
    const x = Math.cos(angle), z = Math.sin(angle);
    const position = new T.Vector3(x * span + base.x, pine ? 1.16 + tier * 1.6 : 1.6 + tier * 1.15, z * span + base.z);
    const elbow = base.clone().lerp(position, .57);
    elbow.y += pine ? -.11 : .115;
    wood.push(timber([base, elbow, position], [.071 - tier * .035, .039 - tier * .018, .006], { seed: seed + i, pine }));
    for (let fork = -1; fork <= 1; fork++) {
      const forkAngle = angle + fork * .63;
      const tip = position.clone().add(new T.Vector3(Math.cos(forkAngle) * .19, pine ? .13 : .32 - Math.abs(fork) * .06, Math.sin(forkAngle) * .19));
      const branch = elbow.clone().lerp(position, .49 + Math.abs(fork) * .14);
      wood.push(timber([branch, branch.clone().lerp(tip,.55), tip], [.026, .015, .003], { seed: seed + fork, pine }));
      canopy.push({ tip, angle: forkAngle });
    }
  }
  // Merge the branches into a single mesh; the world batcher handles the rest.
  const branches = mergeGeometries(wood);
  for (const geometry of wood) geometry.dispose();
  const tree = new T.Mesh(branches, bark);
  tree.castShadow = tree.receiveShadow = true;
  group.add(tree);

  const leaves = new T.InstancedMesh(pine ? pineShoot : mapleShoot, foliage, canopy.length * 8);
  const base = new T.Color(pine ? 0x465a4c : color);
  const sun = new T.Color(pine ? 0x8b9a63 : 0xe0af65), shadow = new T.Color(pine ? 0x283f3f : 0x784b40);
  const tint = new T.Color(), point = new T.Vector3();
  for (let i = 0; i < leaves.count; i++) {
    const { tip, angle } = canopy[i % canopy.length], key = i * 7.42 + seed;
    const spread = random(key + 3) * .26;
    const a = angle + random(key) * Math.PI * 2;
    const height = (random(key + 1) - .38) * (pine ? .19 : .34);
    point.set(tip.x + Math.cos(a) * spread, tip.y + height, tip.z + Math.sin(a) * spread);
    tint.copy(base).lerp(height > 0 ? sun : shadow, random(key + 4) * .63)
      .multiplyScalar(.79 + random(key + 6) * .36 + height * .22);
    const size = .54 + random(key + 2) * .64;
    instance(leaves, i, point, [-1.15 + random(key + 7) * 1.2, a, angle + i], [size, size, size], tint);
  }
  leaves.castShadow = leaves.receiveShadow = true;
  group.add(leaves);
  return group;
}

// Bundles of solid, bent blades soften the soil line on river and garden edges.
export function addBankGrass(parent, sites) {
  const blade = new T.BufferGeometry();
  blade.setAttribute("position", new T.Float32BufferAttribute([
    -.025,0,0, .025,0,0, -.014,.19,.035, .014,.19,.035, 0,.34,.112, 0,0,-.017, 0,.19,.023,
  ], 3));
  blade.setIndex([0,1,2,1,3,2,2,3,4,5,0,6,0,2,6,6,2,4,1,5,6,3,1,6,3,6,4,0,5,1]);
  blade.computeVertexNormals();
  const grass = new T.InstancedMesh(blade, foliage, sites.length * 8);
  const shade = new T.Color(), base = new T.Color(0x75846a), gold = new T.Color(0xb8a47b);
  const origin = new T.Vector3();
  for (const [index, [x, y, z]] of sites.entries()) {
    for (let i = 0; i < 8; i++) {
      const seed = index * 21 + i, angle = i * 2.4 + index;
      const size = .45 + .75 * random(seed);
      origin.set(x + Math.sin(angle)*.08, y, z + Math.cos(angle)*.08);
      instance(grass, index * 8 + i, origin, [random(seed + 1) * .34,angle,0],
        [size,size,size], shade.copy(base).lerp(gold, random(seed + 4)*.75));
    }
  }
  grass.receiveShadow = true;
  parent.add(grass);
}
