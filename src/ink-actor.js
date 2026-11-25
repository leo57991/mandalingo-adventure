import * as T from "./vendor/three.module.js";
import { LEG } from "./actor-motion.js?v=ink-world-v2";
import { mergeGeometries } from "./vendor/BufferGeometryUtils.js";

const costumes = {
  player:           { outer: 0x335f64, trim: 0xd6c1a0, leather: 0x755542, height: 1, width: 1, hair: "tie", kit: "satchel" },
  gatekeeper:       { outer: 0x354c4f, trim: 0x9e8056, leather: 0x263436, height: 1.07, width: 1.12, hair: "guard", kit: "armor" },
  clerk:            { outer: 0x74785e, trim: 0xd6c5a5, leather: 0x585045, height: .99, width: .96, hair: "cap", kit: "brush" },
  traveller:        { outer: 0x796450, trim: 0xb7a482, leather: 0x655243, height: 1, width: .92, hair: "straw", kit: "wrap" },
  "weapons-vendor": { outer: 0x5c5650, trim: 0xa68d6f, leather: 0x64483b, height: 1.03, width: 1.15, hair: "band", kit: "apron" },
  "grocer-vendor":  { outer: 0x82563e, trim: 0xd3aa79, leather: 0x675141, height: .97, width: 1.05, hair: "scarf", kit: "apron" },
  "books-vendor":   { outer: 0x505d68, trim: 0xcbcabe, leather: 0x474140, height: 1.04, width: .93, hair: "cap", kit: "books" },
  "market-walker":  { outer: 0x9a7850, trim: 0xe4c5a0, leather: 0x665648, height: .96, width: .95, hair: "bun", kit: "satchel" },
  "town-walker":    { outer: 0x536755, trim: 0xadad8e, leather: 0x60463d, height: 1.02, width: .98, hair: "tie", kit: "wrap" },
};
const ink = 0x292829;
const faces = {
  player:           { tone: 0xc79c7b, jaw: .92, brow: .021, nose: .98, age: 0 },
  gatekeeper:       { tone: 0xb68767, jaw: 1.08, brow: .015, nose: 1.15, age: .8, beard: true },
  clerk:            { tone: 0xcfac8a, jaw: .95, brow: .022, nose: .92, age: .3 },
  traveller:        { tone: 0xb88c74, jaw: .88, brow: .022, nose: 1.12, age: 1, beard: true },
  "weapons-vendor": { tone: 0xa97d60, jaw: 1.1, brow: .016, nose: 1.16, age: .7, beard: true },
  "grocer-vendor":  { tone: 0xbc8d77, jaw: 1.03, brow: .026, nose: .92, age: .45 },
  "books-vendor":   { tone: 0xceaa88, jaw: .87, brow: .025, nose: 1.2, age: .6 },
  "market-walker":  { tone: 0xcfa18a, jaw: .84, brow: .027, nose: .85, age: 0 },
  "town-walker":    { tone: 0xb88e6f, jaw: 1.02, brow: .018, nose: 1.08, age: .2 },
};
const materials = new Map();

function piece(parent, geometry, color, x = 0, y = 0, z = 0) {
  const vertexColors = geometry.hasAttribute("color");
  const key = color * 2 + Number(vertexColors);
  if (!materials.has(key)) materials.set(key, new T.MeshStandardMaterial({ color, vertexColors, roughness: .92 }));
  const mesh = new T.Mesh(geometry, materials.get(key));
  mesh.position.set(x, y, z);
  parent.add(mesh);
  return mesh;
}

function part(parent, x, y, z = 0) {
  const node = new T.Group();
  node.position.set(x, y, z);
  parent.add(node);
  return node;
}

function oval(parent, color, x, y, z, a, b, c) {
  const mesh = piece(parent, new T.SphereGeometry(1, 14, 10), color, x, y, z);
  mesh.scale.set(a, b, c);
  return mesh;
}

function tube(parent, color, radius, points) {
  const curve = new T.CatmullRomCurve3(points.map(p => new T.Vector3(...p)));
  return piece(parent, new T.TubeGeometry(curve, points.length * 4, radius, 5, false), color);
}

function block(parent, color, x, y, z, w, h, d) {
  return piece(parent, new T.BoxGeometry(w, h, d), color, x, y, z);
}

// Profiles run from hem to collar. Taper and asymmetric pleats keep the robes
// legible from above, and the same geometry wraps all the way around the back.
function cloth(parent, color, profile, depth = .78, folds = .04) {
  const sections = [];
  for (let i = 0; i < profile.length - 1; i++) {
    const [r, y] = profile[i], [nextR, nextY] = profile[i + 1];
    const steps = Math.max(1, Math.ceil(Math.abs(nextY - y) * 22));
    for (let step = 0; step < steps; step++) {
      const t = step / steps;
      sections.push(new T.Vector2(r + (nextR - r) * t, y + (nextY - y) * t));
    }
  }
  sections.push(new T.Vector2(...profile.at(-1)));
  const geometry = new T.LatheGeometry(sections, 42);
  const vertices = geometry.attributes.position, colors = [];
  for (let i = 0; i < vertices.count; i++) {
    const x = vertices.getX(i), y = vertices.getY(i), z = vertices.getZ(i);
    const angle = Math.atan2(z, x), length = Math.hypot(x, z);
    const crease = Math.sin(angle * 7 + y * 6) * .62 + Math.sin(angle * 13 - y * 12) * .32;
    const ripple = 1 + folds * crease;
    const shade = .91 + crease * .14 + .028 * Math.sin(angle * 21 + y * 73);
    vertices.setXYZ(i, x * ripple, y + length * folds * .57 * Math.sin(3 * angle + y * 6), z * depth * ripple);
    colors.push(shade, shade * 1.006, shade * 1.018);
  }
  geometry.setAttribute("color", new T.Float32BufferAttribute(colors, 3));
  geometry.computeVertexNormals();
  piece(parent, geometry, color);
}

const gaussian = (x, y, sx, sy) => Math.exp(-((x / sx) ** 2 + (y / sy) ** 2));

function faceVolume(head, shape) {
  const geometry = new T.SphereGeometry(1, 52, 42);
  const positions = geometry.attributes.position, colors = [];
  for (let i = 0; i < positions.count; i++) {
    const vertical = positions.getY(i);
    const jaw = 1 + (shape.jaw - 1) * Math.max(0, -vertical) - .11 * Math.max(0, -vertical);
    const x = positions.getX(i) * .124 * jaw;
    const y = vertical * .153 - .016;
    const z = positions.getZ(i);
    const front = Math.max(0, z) ** .65;
    const cheeks = gaussian(Math.abs(x) - .065, y + .038, .025, .036);
    const sockets = gaussian(Math.abs(x) - .049, y + .011, .029, .02);
    const bridge = gaussian(x, y + .025, .014, .056);
    const tip = gaussian(x, y + .048, .021, .021);
    const chin = gaussian(x, y + .121, .06, .026);
    const lower = gaussian(x, y + .081, .055, .025);
    const depth = z * .105 + front * (.019 * cheeks - .015 * sockets
      + shape.nose * (.023 * bridge + .023 * tip) + .016 * chin + .017 * lower);
    positions.setXYZ(i, x, y, depth);
    const shade = .88 + .09 * z + front * (cheeks * .066 - sockets * .115);
    const beard = shape.beard ? front * gaussian(x, y + .116, .087, .04) : 0;
    colors.push(shade + cheeks * .037, shade - .035 * beard, shade - .064 * cheeks + .033 * beard);
  }
  geometry.setAttribute("color", new T.Float32BufferAttribute(colors, 3));
  geometry.computeVertexNormals();
  piece(head, geometry, shape.tone);
}

function sculptHead(head, style, trim, shape) {
  const tone = shape.tone;
  const shadow = new T.Color(tone).multiplyScalar(.64).getHex();
  const warm = new T.Color(tone).lerp(new T.Color(0xa46a58), .42).getHex();
  faceVolume(head, shape);
  for (const sign of [-1, 1]) {
    const eye = [[sign * .025, -.011, .1], [sign * .047, -.004, .099], [sign * .071, -.009, .091]];
    oval(head, tone, sign * .117, -.038, -.003, .023, .037, .015);
    oval(head, shadow, sign * .123, -.038, .01, .013, .019, .006);
    tube(head, tone, .007, [[sign*.114,-.067,.009],[sign*.134,-.046,.01],[sign*.135,-.025,.01],[sign*.121,-.011,.012]]);
    oval(head, tone, sign * .017, -.05, .116 + .008 * shape.nose, .012, .013, .014);
    oval(head, shadow, sign * .014, -.058, .124, .0065, .0035, .007);
    oval(head, 0xc8b6a0, sign * .046, -.011, .0935, .022, .008, .008);
    oval(head, 0x332b28, sign * .046, -.011, .100, .0085, .0075, .003);
    tube(head, 0x43332f, .0029, eye);
    tube(head, warm, .0025, [[sign*.025,-.012,.1],[sign*.046,-.017,.1],[sign*.071,-.009,.091]]);
    tube(head, ink, .0042, [[sign*.024,shape.brow-.004,.105],[sign*.047,shape.brow,.105],[sign*.076,shape.brow-.012,.094]]);
    if (shape.age > .4) {
      tube(head, warm, .0018, [[sign*.068,-.018,.096],[sign*.081,-.022,.09],[sign*.087,-.027,.085]]);
      tube(head, warm, .002, [[sign*.031,-.056,.109],[sign*.038,-.073,.105],[sign*.046,-.088,.092]]);
    }
  }
  tube(head, warm, .0034, [[-.034,-.087,.096],[-.016,-.084,.109],[0,-.086,.115],[.015,-.084,.11],[.034,-.088,.096]]);
  tube(head, shadow, .0021, [[-.031,-.089,.096],[0,-.091,.114],[.031,-.089,.096]]);
  if (shape.beard) {
    tube(head, 0x4a3e36, .01, [[-.044,-.09,.105],[-.033,-.073,.114],[-.009,-.074,.118]]);
    tube(head, 0x4a3e36, .01, [[.044,-.091,.105],[.033,-.073,.114],[.009,-.074,.118]]);
    oval(head, 0x51453b, 0, -.139, .078, .046, .029 + shape.age * .009, .022);
  }
  // The cap geometry stays open below the hairline, leaving the face unobscured.
  const hair = piece(head, new T.SphereGeometry(.132, 20, 12, 0, Math.PI * 2, 0, Math.PI * .53), ink, 0, .012, -.014);
  hair.scale.set(1.03, 1.05, .96);
  for (let i = -3; i <= 3; i++) {
    const x = i * .027;
    tube(head, 0x343232, .0035, [[x,.078,.095],[x*.95,.122,.058],[x*.78,.15,-.009],[x*.62,.133,-.066]]);
  }
  oval(head, ink, 0, .033, -.065, .121, .119, .067);
  if (style === "straw") {
    cloth(head, 0xa98758, [[.013,.255],[.073,.234],[.15,.17],[.295,.08],[.296,.091],[.15,.183],[.02,.262],[.013,.255]], 1, .014);
    cloth(head, 0x755a43, [[.255,.099],[.265,.105],[.25,.119]], 1, .008);
    cloth(head, 0xc4a273, [[.182,.143],[.19,.15],[.177,.164]], 1, .01);
  } else if (style === "guard" || style === "cap") {
    cloth(head, style === "guard" ? 0x293638 : ink, [[.002,.104],[.166,.104],[.166,.13],[.138,.154],[.119,.238],[.06,.26],[.001,.25]], .92, .018);
    cloth(head, trim, [[.156,.114],[.161,.123],[.154,.133]], .93, 0);
    if (style === "guard") {
      for (const sign of [-1, 1]) oval(head, ink, sign * .129, .035, -.04, .027, .101, .087);
    }
  } else if (style === "band" || style === "scarf") {
    cloth(head, trim, [[.127,.046],[.138,.051],[.131,.10],[.103,.132]], .9, .018);
    oval(head, trim, -.071, .087, -.10, .053, .041, .059);
  } else {
    oval(head, ink, 0, .098, -.139, .06, .064, .053);
    oval(head, trim, 0, .107, -.178, .044, .048, .013);
    if (style === "tie") oval(head, ink, .024, -.018, -.141, .047, .13, .036);
    if (style === "bun") {
      const pin = block(head, trim, 0, .139, -.154, .22, .012, .012);
      pin.rotation.z = .16;
    }
  }
}

function tailorsKit(body, role, costume) {
  const { trim, leather, kit } = costume;
  if (kit === "satchel") {
    tube(body, leather, .023, [[-.19,1.025,.091],[-.115,.991,.153],[.025,.845,.153],[.158,.718,.109]]);
    tube(body, leather, .018, [[-.19,1.025,.091],[-.177,1.03,-.118],[-.08,.93,-.177],[.12,.75,-.175]]);
    oval(body, leather, .095, .745, -.167, .153, .164, .083);
    oval(body, 0x9e7956, .095, .829, -.217, .132, .055, .04);
    block(body, trim, .095, .788, -.25, .038, .043, .012);
  } else if (kit === "armor") {
    oval(body, leather, 0, .894, .111, .194, .216, .073);
    for (const sign of [-1, 1]) {
      oval(body, leather, sign * .222, .998, .012, .089, .061, .117);
      for (let i = 0; i < 4; i++) {
        const y = .71 + i * .076;
        tube(body, trim, .009, [[sign*.017,y,.185],[sign*.116,y+.019,.176],[sign*.182,y+.03,.13]]);
      }
    }
  } else if (kit === "apron") {
    oval(body, leather, 0, .721, .137, .164, .24, .042);
    tube(body, trim, .012, [[-.13,.58,.151],[-.143,.73,.166],[-.11,.951,.147],[.125,.954,.149],[.148,.735,.164],[.128,.58,.151]]);
    if (role === "grocer-vendor") {
      oval(body, trim, -.099, .699, .181, .063, .069, .026);
    } else {
      block(body, trim, .107, .732, .181, .053, .048, .019);
    }
  } else if (kit === "brush" || kit === "books") {
    const document = part(body, .145, .733, .124);
    document.rotation.set(.13, -.42, -.16);
    block(document, leather, 0, 0, 0, .135, .192, .042);
    block(document, trim, 0, 0, .017, .118, .171, .018);
    block(document, leather, 0, 0, .026, .139, .16, .012);
    if (kit === "brush") tube(body, trim, .01, [[.138,.67,.134],[.182,.799,.171],[.204,.882,.155]]);
  } else {
    tube(body, trim, .026, [[-.18,.98,-.005],[-.115,.925,.131],[.064,.82,.16],[.185,.758,.097]]);
    oval(body, leather, -.042, .874, -.167, .16, .117, .073);
  }
}

// Still parts of each joint use one mesh per material, so added detail does not
// turn every seam or button into a separate draw call.
function assembleJoint(joint) {
  const batches = new Map();
  for (const mesh of joint.children.filter(child => child.isMesh)) {
    mesh.updateMatrix();
    const geometry = mesh.geometry.index ? mesh.geometry.toNonIndexed() : mesh.geometry.clone();
    geometry.applyMatrix4(mesh.matrix);
    if (!batches.has(mesh.material)) batches.set(mesh.material, []);
    batches.get(mesh.material).push(geometry);
    mesh.removeFromParent();
    mesh.geometry.dispose();
  }
  for (const [material, geometries] of batches) {
    const mesh = new T.Mesh(mergeGeometries(geometries), material);
    mesh.castShadow = mesh.receiveShadow = true;
    joint.add(mesh);
    for (const geometry of geometries) geometry.dispose();
  }
  for (const subgroup of joint.children.filter(child => child.isGroup)) assembleJoint(subgroup);
}

export function modelInkActor(color, role) {
  const costume = costumes[role] ?? { ...costumes.clerk, outer: color };
  const { outer, trim, leather, height, width, hair } = costume;
  const face = faces[role] ?? faces.clerk;
  const skin = face.tone;
  const root = new T.Group();
  root.name = role;
  root.scale.set(width, height, width);
  const body = part(root, 0, 0);
  const hem = role === "traveller" || role === "weapons-vendor" ? .36 : .255;
  cloth(body, outer, [[.001,hem],[.224,hem],[.227,hem+.029],[.213,.51],[.177,.678],[.172,.755],[.185,.92],[.205,1.01],[.171,1.066],[.087,1.1],[.001,1.1]], .75, .052);
  cloth(body, leather, [[.225,hem],[.228,hem+.015],[.224,hem+.034]], .752, .053);
  cloth(body, leather, [[.181,.677],[.184,.692],[.181,.74],[.178,.75]], .8, .016);
  tube(body, trim, .014, [[-.148,1.061,.073],[-.077,1.012,.126],[.012,.941,.145],[.134,.775,.126]]);
  tube(body, trim, .012, [[.116,1.066,.074],[.064,1.011,.13],[-.013,.948,.151]]);
  oval(body, trim, -.032, .715, .147, .049, .035, .024);
  oval(body, skin, 0, 1.114, 0, .069, .085, .07);
  const head = part(body, 0, 1.233);
  sculptHead(head, hair, trim, face);
  tailorsKit(body, role, costume);
  // Raised bindings continue around the robe and tighten at the sash.
  cloth(body, trim, [[.176,.683],[.186,.689],[.186,.701],[.179,.707]], .81, .024);
  const split = [[.12,.68,.112],[.112,.58,.137],[.095,hem+.105,.163],[.09,hem+.025,.16]];
  tube(body, trim, .006, split);
  tube(body, leather, .009, split.map(([x, y, z]) => [x-.016, y, z-.003]));
  for (const sign of [-1, 1]) {
    tube(body, leather, .005, [[sign*.17,1.038,-.02],[sign*.151,.985,-.115],[sign*.112,.887,-.13],[sign*.082,.765,-.133]]);
  }

  const limbs = {};
  for (const sign of [-1, 1]) {
    const side = sign < 0 ? "left" : "right";
    const arm = part(body, sign * .23, 1.013);
    const upperArm = role === "traveller" ? .222 : .19;
    const cuff = role === "traveller" ? -.196 : -.137;
    cloth(arm, outer, [[.001,-upperArm-.025],[.088,-upperArm-.025],[.094,-.13],[.104,-.058],[.092,.022],[.044,.057],[.001,.057]], .89, .058);
    const wrist = part(arm, 0, -upperArm, 0);
    cloth(wrist, outer, [[.001,cuff],[.071,cuff],[.074,cuff+.05],[.083,-.04],[.08,.021],[.001,.034]], .88, .058);
    cloth(wrist, trim, [[.001,cuff-.018],[.073,cuff-.018],[.077,cuff+.007],[.001,cuff+.007]], .9, .024);
    cloth(wrist, leather, [[.068,cuff+.015],[.077,cuff+.019],[.068,cuff+.025]], .91, .014);
    oval(wrist, skin, 0, cuff - .043, .01, .039, .047, .029);
    oval(wrist, skin, -sign * .031, cuff - .043, .027, .015, .03, .014);
    for (let finger = 0; finger < 4; finger++) {
      const x = sign * (finger - 1.5) * .014;
      oval(wrist, skin, x, cuff - .075 + Math.abs(finger - 1) * .003, .012, .011, .022, .016);
    }
    limbs[side + "Forearm"] = wrist;

    const leg = part(root, sign * .106, LEG.hip);
    const knee = part(leg, 0, -LEG.upper);
    const boot = part(knee, 0, -LEG.lower);
    cloth(leg, 0x494743, [[.001,-.247],[.059,-.247],[.071,-.19],[.079,-.11],[.087,.012],[.001,.022]], .94, .052);
    cloth(knee, 0x494743, [[.001,-.162],[.05,-.162],[.061,-.11],[.066,-.035],[.058,.036],[.001,.046]], .93, .04);
    cloth(knee, leather, [[.052,-.185],[.061,-.158],[.062,-.124],[.056,-.115]], .93, .018);
    oval(boot, ink, 0, .021, .042, .071, .045, .118);
    oval(boot, leather, 0, -.012, .053, .071, .018, .112);
    tube(boot, trim, .0035, [[-.049,.033,.086],[0,.048,.115],[.049,.033,.086]]);
    limbs[side + "Knee"] = knee;
    limbs[side + "Boot"] = boot;
    limbs[side + "Arm"] = arm;
    limbs[side + "Leg"] = leg;
  }
  assembleJoint(root);
  return { root, body, head, ...limbs };
}
