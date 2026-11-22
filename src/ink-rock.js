import * as T from "./vendor/three.module.js";

const stone = new T.MeshStandardMaterial({ vertexColors: true, roughness: .97 });
const profile = [[.02, 0], [.96, .02], [1, .1], [.88, .24], [.78, .34], [.83, .43], [.65, .55], [.65, .64], [.51, .76], [.43, .84], [.31, .93], [.15, .98], [.001, 1]];

// The same cross section creates river stones and the slate ridges behind town.
// Each ring shifts sideways and follows the ribs of the one below it.
export function inkRock(color, seed = 0) {
  const segments = 16;
  const geometry = new T.BufferGeometry();
  const positions = [], colors = [], indices = [], base = new T.Color(color), shade = new T.Color();
  for (const [index, [radius, height]] of profile.entries()) {
    for (let i = 0; i < segments; i++) {
      const angle = i * Math.PI * 2 / segments;
      const rib = Math.sin(angle * 5 + seed) * .14 + Math.sin(angle * 3 - seed) * .13;
      const ledge = Math.sin(i * 8.12 + index * 1.52 + seed) * .055;
      const r = radius * (1 + rib + ledge);
      positions.push(
        Math.cos(angle) * r + Math.sin(seed) * height * .24,
        height + Math.sin(angle * 3 + seed + height * 3) * radius * .026 * Math.sin(height * Math.PI),
        Math.sin(angle) * r + Math.cos(seed) * height * .14,
      );
      shade.copy(base).multiplyScalar(.83 + height * .17 + rib * .63 + ledge + (index % 4 === 1 ? -.09 : 0));
      colors.push(shade.r, shade.g, shade.b);
      if (index < profile.length - 1) {
        const a = index * segments + i, b = index * segments + (i + 1) % segments;
        indices.push(a, a + segments, b, b, a + segments, b + segments);
      }
    }
  }
  geometry.setAttribute("position", new T.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("color", new T.Float32BufferAttribute(colors, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  const rock = new T.Mesh(geometry, stone);
  rock.castShadow = rock.receiveShadow = true;
  return rock;
}
