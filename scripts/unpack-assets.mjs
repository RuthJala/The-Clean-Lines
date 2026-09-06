import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { gunzipSync } from 'node:zlib';
import { join } from 'node:path';
const root = new URL('../', import.meta.url);
const parts = await Promise.all([1,2].map(i => readFile(new URL(`media/projects.tar.gz.part${i}`, root))));
const tar = gunzipSync(Buffer.concat(parts));
let count = 0;
for (let offset = 0; offset + 512 <= tar.length;) {
  const header = tar.subarray(offset, offset + 512);
  if (header.every(byte => byte === 0)) break;
  const name = header.subarray(0,100).toString().replace(/\0.*$/s,'');
  const size = parseInt(header.subarray(124,136).toString().replace(/\0.*$/s,'').trim(),8) || 0;
  const type = header[156];
  offset += 512;
  if (type === 0 || type === 48) {
    if (!/^assets\/projects\/vol-\d-\d{2}(?:-sm)?\.webp$/.test(name)) throw new Error('Unexpected media path: '+name);
    const target = new URL('public/'+name, root);
    await mkdir(new URL('./', target), {recursive:true});
    await writeFile(target, tar.subarray(offset,offset+size));
    count++;
  }
  offset += Math.ceil(size/512)*512;
}
if (count !== 260) throw new Error(`Expected 260 image derivatives; extracted ${count}`);
console.log(`Prepared ${count} project images from the bundled source archive.`);
