import { readFile, mkdir, writeFile, readdir } from 'node:fs/promises';
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
const filmParts = (await readdir(new URL('media/', root))).filter(name => /^walkthrough\.tar\.gz\.part\d{2}$/.test(name)).sort();
if (!filmParts.length) throw new Error('Walkthrough archive is missing');
const filmTar = gunzipSync(Buffer.concat(await Promise.all(filmParts.map(name => readFile(new URL('media/'+name, root))))));
let sheets = 0;
for (let offset = 0; offset + 512 <= filmTar.length;) {
  const header = filmTar.subarray(offset, offset + 512);
  if (header.every(byte => byte === 0)) break;
  const name = header.subarray(0,100).toString().replace(/\0.*$/s,'');
  const size = parseInt(header.subarray(124,136).toString().replace(/\0.*$/s,'').trim(),8) || 0;
  const type = header[156]; offset += 512;
  if (type === 0 || type === 48) {
    if (!/^assets\/walkthrough\/(desktop|mobile)\/sheet-\d{3}\.webp$/.test(name)) throw new Error('Unexpected walkthrough path: '+name);
    const target = new URL('public/'+name, root);
    await mkdir(new URL('./', target), {recursive:true});
    await writeFile(target, filmTar.subarray(offset,offset+size)); sheets++;
  }
  offset += Math.ceil(size/512)*512;
}
if (sheets !== 166) throw new Error(`Expected 166 walkthrough sheets; extracted ${sheets}`);
console.log(`Prepared ${sheets} walkthrough sheets.`);
