import { createHash } from 'node:crypto';
import { mkdir, readdir, readFile, writeFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const output = path.join(root, 'dist');
const catalog = JSON.parse(await readFile(path.join(root, 'marketplace/catalog.json'), 'utf8'));
const index = { schemaVersion: 1, plugins: {} };
await mkdir(output, { recursive: true });

async function filesUnder(directory, prefix = '') {
  const files = [];
  for (const entry of (await readdir(directory, { withFileTypes: true })).sort((a, b) => a.name.localeCompare(b.name, 'en'))) {
    const relative = prefix + entry.name;
    const full = path.join(directory, entry.name);
    if (entry.isSymbolicLink()) throw new Error(`Payload symlink is not supported: ${full}`);
    if (entry.isDirectory()) files.push(...await filesUnder(full, relative + '/'));
    else if (entry.isFile()) files.push({ path: relative, executable: Boolean((await stat(full)).mode & 0o111), content: (await readFile(full)).toString('base64') });
    else throw new Error(`Unsupported payload entry: ${full}`);
  }
  return files;
}

for (const plugin of catalog.plugins) {
  if (!/^[a-z0-9][a-z0-9._-]*$/.test(plugin.name)) throw new Error('Invalid plugin name');
  const files = await filesUnder(path.join(root, 'marketplace/plugins', plugin.name));
  const bytes = Buffer.from(JSON.stringify({ schemaVersion: 1, name: plugin.name, version: plugin.version, files }) + '\n');
  const sha256 = createHash('sha256').update(bytes).digest('hex');
  const asset = `${plugin.name}-${sha256}.json`;
  await writeFile(path.join(output, asset), bytes);
  index.plugins[plugin.name] = { version: plugin.version, sha256, bytes: bytes.length, fileSha256: Object.fromEntries(files.map(file => [file.path, createHash("sha256").update(Buffer.from(file.content, "base64")).digest("hex")])), directories: [...new Set(files.filter(file => file.path.includes("/")).map(file => file.path.split("/")[0]))].sort(), asset };
}
await writeFile(path.join(output, 'payloads.json'), JSON.stringify(index, null, 2) + '\n');
console.log(`Packaged ${Object.keys(index.plugins).length} immutable plugin payloads`);
