import { readdir, mkdir, cp, readFile, writeFile, lstat, rm } from 'node:fs/promises';
import { dirname, resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const destination = resolve(root, '_site');
// Rebuild only this script's generated directory, never a caller-supplied path.
if (destination !== join(root, '_site')) throw new Error('Invalid publication directory');
const existing = await lstat(destination).catch(error => {
  if (error.code !== 'ENOENT') throw error;
});
if (existing?.isSymbolicLink()) throw new Error('_site must not be a symbolic link');
if (existing) await rm(destination, { recursive: true });
await mkdir(destination, { recursive: true });
const files = (await readdir(root)).filter(name => name === 'index.html' || /\.(js|css)$/.test(name));
for (const name of files) await cp(join(root, name), join(destination, name));
await cp(join(root, 'assets'), join(destination, 'assets'), { recursive: true });
await writeFile(join(destination, '.nojekyll'), '');
const index = await readFile(join(destination, 'index.html'), 'utf8');
for (const match of index.matchAll(/(?:src|href)="([^"?#]+)(?:[?#][^"]*)?"/g)) {
  if (/^(https?:|data:|#)/.test(match[1])) continue;
  await lstat(resolve(destination, match[1]));
}
console.log(`Prepared ${files.length} page files and assets in ${destination}`);
