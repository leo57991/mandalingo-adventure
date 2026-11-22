import * as T from "./vendor/three.module.js";
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
const skin = 0xc79e7b;
const materials = new Map();

function piece(parent, geometry, color, x = 0, y = 0, z = 0) {
  if (!materials.has(color)) materials.set(color, new T.MeshStandardMaterial({ color, roughness: .92 }));
  const mesh = new T.Mesh(geometry, materials.get(color));
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
  const geometry = new T.LatheGeometry(profile.map(([r, y]) => new T.Vector2(r, y)), 28);
  const vertices = geometry.attributes.position;
  for (let i = 0; i < vertices.count; i++) {
    const x = vertices.getX(i), y = vertices.getY(i), z = vertices.getZ(i);
    const angle = Math.atan2(z, x), ripple = 1 + folds * Math.sin(angle * 7 + y * 3) + folds * .6 * Math.sin(angle * 11 - y * 6);
    vertices.setXYZ(i, x * ripple, y, z * depth * ripple);
  }
  geometry.computeVertexNormals();
  piece(parent, geometry, color);
}

function sculptHead(head, style, trim) {
  oval(head, skin, 0, -.016, 0, .124, .153, .105);
  oval(head, skin, 0, -.093, .026, .093, .066, .087);
  oval(head, skin, 0, -.041, .102, .027, .049, .036);
  oval(head, 0x815c51, 0, -.099, .11, .031, .005, .006);
  for (const sign of [-1, 1]) {
    oval(head, 0xb3846c, sign * .119, -.041, .001, .029, .047, .019);
    oval(head, 0xa67966, sign * .05, -.016, .096, .028, .013, .012);
    oval(head, ink, sign * .048, -.017, .107, .018, .0045, .005);
    tube(head, ink, .0045, [[sign * .024,.011,.101],[sign * .047,.016,.105],[sign * .072,.008,.094]]);
  }
  // The cap geometry stays open below the hairline, leaving the face unobscured.
  const hair = piece(head, new T.SphereGeometry(.132, 20, 12, 0, Math.PI * 2, 0, Math.PI * .53), ink, 0, .012, -.014);
  hair.scale.set(1.03, 1.05, .9);
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
  sculptHead(head, hair, trim);
  tailorsKit(body, role, costume);

  const limbs = {};
  for (const sign of [-1, 1]) {
    const side = sign < 0 ? "left" : "right";
    const arm = part(body, sign * .23, 1.013);
    const articulated = role === "traveller";
    const cuff = articulated ? -.227 : -.294;
    cloth(arm, outer, [[.001,cuff],[.089,cuff],[.091,cuff+.083],[.088,-.132],[.101,-.053],[.096,.017],[.043,.055],[.001,.057]], .91, .045);
    const wrist = articulated ? part(arm, 0, -.222, 0) : arm;
    const wristY = articulated ? -.196 : cuff;
    if (articulated) {
      cloth(wrist, outer, [[.001,wristY],[.076,wristY],[.079,-.089],[.085,-.013],[.001,.026]], .9, .045);
      limbs[side + "Forearm"] = wrist;
    }
    cloth(wrist, trim, [[.001,wristY-.024],[.074,wristY-.023],[.08,wristY+.008],[.001,wristY+.008]], .94, .025);
    oval(wrist, skin, 0, wristY - .054, .01, .048, .066, .039);
    oval(wrist, skin, -sign * .035, wristY - .045, .031, .024, .033, .021);

    const leg = part(root, sign * .106, .45);
    cloth(leg, 0x48463f, [[.001,-.358],[.062,-.358],[.069,-.24],[.078,-.12],[.087,.01],[.001,.02]], .93, .04);
    oval(leg, ink, 0, -.384, .042, .075, .061, .132);
    oval(leg, leather, 0, -.425, .054, .075, .024, .126);
    limbs[side + "Arm"] = arm;
    limbs[side + "Leg"] = leg;
  }
  assembleJoint(root);
  return { root, body, head, ...limbs };
}
