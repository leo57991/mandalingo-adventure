import { cp, mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

if (process.platform !== 'win32') throw new Error('Build this Windows preview on Windows.');
const require = createRequire(import.meta.url);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const electronExe = require('electron');
const stamp = new Date().toISOString().replace(/[-:TZ.]/g, '').slice(0,14);
const output = path.join(root, 'dist', `Mandalingo-3D-Windows-${stamp}`);
const appRoot = path.join(output, 'resources', 'app');
await mkdir(appRoot, { recursive: true });
await cp(path.dirname(electronExe), output, { recursive: true });
await rename(path.join(output, 'electron.exe'), path.join(output, 'Mandalingo.exe'));
for (const entry of ['index.html', 'styles.css', 'src', 'assets', 'desktop']) {
  await cp(path.join(root, entry), path.join(appRoot, entry), { recursive: true });
}
const pkg = JSON.parse(await readFile(path.join(root, 'package.json'), 'utf8'));
await writeFile(path.join(appRoot, 'package.json'), JSON.stringify({ name: 'mandalingo', productName: 'Mandalingo', version: pkg.version, main: 'desktop/main.cjs' }, null, 2));
await cp(path.join(root, 'desktop', 'PLAY.md'), path.join(output, 'PLAY.md'));
await writeFile(path.join(root, 'dist', 'latest-build.json'), JSON.stringify({ output, executable: path.join(output, 'Mandalingo.exe'), electron: require('electron/package.json').version }, null, 2));
console.log(`Windows preview: ${output}`);
