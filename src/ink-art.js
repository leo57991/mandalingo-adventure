import * as T from "./vendor/three.module.js";

// The scene geometry still owns depth, collision and animation. These maps give
// its most visible surfaces the same material language as the painted key art.
const SURFACES = {
  stone: "assets/ink-materials/weathered-stone-v1.jpg",
  roof: "assets/ink-materials/blue-ceramic-v1.jpg",
  plaster: "assets/ink-materials/aged-plaster-v1.jpg",
  earth: "assets/ink-materials/mossy-earth-v1.jpg",
};
const STONE = new Set([0x718887, 0x829795, 0x9aa59c, 0x9ba89e, 0x8d9890]);
const ROOF = new Set([
  0x204c59, 0x45666a, 0x503f38, 0x405b50, 0x315459,
  0x4b5c57, 0x465a52, 0x4d6661, 0x435d59, 0x314e52,
]);
const textureCache = new Map();
const loader = typeof document === "undefined" ? null : new T.TextureLoader();

function loadTexture(path) {
  if (!loader) return null;
  if (!textureCache.has(path)) {
    let resolve;
    const ready = new Promise((done) => { resolve = done; });
    const texture = loader.load(path, () => resolve(texture), undefined, () => resolve(null));
    texture.colorSpace = T.SRGBColorSpace;
    texture.anisotropy = 4;
    if (path === SURFACES.earth) {
      texture.wrapS = texture.wrapT = T.RepeatWrapping;
      texture.repeat.set(20, 20);
    }
    textureCache.set(path, { texture, ready });
  }
  return textureCache.get(path);
}

export function inkSurface(color) {
  const kind = color === 0xbfc0ae ? "plaster" : STONE.has(color) ? "stone" : ROOF.has(color) ? "roof" : color === 0x536b70 || color === 0x839b91 ? "earth" : null;
  if (!kind) return null;
  const entry = loadTexture(SURFACES[kind]);
  if (!entry) return null;
  return {
    map: entry.texture,
    color: kind === "roof" || kind === "earth" ? 0xffffff : kind === "stone" ? 0xd9ddd4 : 0xe7e5dc,
    ...(kind === "roof" ? { emissive: 0x263a42, emissiveIntensity: 0.3 } : {}),
  };
}

export function waitForInkSurfaces() {
  return Promise.all(Object.values(SURFACES).map((path) => loadTexture(path)?.ready));
}
