import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const index = JSON.parse(await readFile(path.join(root, 'dist/payloads.json'), 'utf8'));
let checked = 0;
async function list(dir, prefix = '') {
  const result = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) result.push(...await list(path.join(dir, entry.name), prefix + entry.name + '/'));
    else result.push(prefix + entry.name);
  }
  return result.sort();
}
for (const [id, entry] of Object.entries(index.plugins)) {
  const bytes = await readFile(path.join(root, 'dist', entry.asset));
  assert.equal(bytes.length, entry.bytes);
  assert.equal(createHash('sha256').update(bytes).digest('hex'), entry.sha256);
  const payload = JSON.parse(bytes);
  assert.equal(payload.name, id);
  assert.equal(payload.version, entry.version);
  const source = path.join(root, 'marketplace/plugins', id);
  assert.deepEqual(payload.files.map(f => f.path).sort(), await list(source));
  assert.deepEqual(entry.directories, [...new Set(payload.files.filter(f => f.path.includes("/")).map(f => f.path.split("/")[0]))].sort());
  assert.deepEqual(Object.keys(entry.fileSha256).sort(), payload.files.map(f => f.path).sort());
  for (const file of payload.files) {
    assert.equal(entry.fileSha256[file.path], createHash("sha256").update(Buffer.from(file.content, "base64")).digest("hex"));
    assert.deepEqual(Buffer.from(file.content, 'base64'), await readFile(path.join(source, file.path)));
    assert.equal(file.executable, Boolean((await stat(path.join(source, file.path))).mode & 0o111));
    checked++;
  }
}
console.log(`Verified ${checked} files across ${Object.keys(index.plugins).length} payloads byte-for-byte`);
