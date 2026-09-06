import {readFile, mkdir, rm, stat, createWriteStream} from 'node:fs';
import {promises as fs} from 'node:fs';
import {dirname} from 'node:path';
import {Readable} from 'node:stream';
import {pipeline} from 'node:stream/promises';
import {execFileSync} from 'node:child_process';

const projects = JSON.parse(await fs.readFile('src/projects.json', 'utf8'));
const sources = JSON.parse(await fs.readFile('scripts/drive-projects.json', 'utf8'));
const outputRoot = 'public/assets/projects';

await fs.rm(outputRoot, {recursive:true, force:true});
await fs.mkdir(outputRoot, {recursive:true});

async function downloadDriveFile(id, target) {
  const urls = [
    `https://drive.usercontent.google.com/download?id=${id}&export=download&confirm=t`,
    `https://drive.google.com/uc?export=download&id=${id}&confirm=t`,
  ];

  let lastError;
  for (const url of urls) {
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const response = await fetch(url, {
          redirect:'follow',
          headers:{'user-agent':'Mozilla/5.0'},
          signal:AbortSignal.timeout(240000),
        });
        if (!response.ok || !response.body) throw new Error(`HTTP ${response.status}`);

        const contentType = response.headers.get('content-type') || '';
        if (contentType.includes('text/html')) throw new Error('Drive returned an HTML page instead of an image');

        await pipeline(Readable.fromWeb(response.body), createWriteStream(target));
        const info = await fs.stat(target);
        if (info.size < 100000) throw new Error(`download too small (${info.size} bytes)`);
        return;
      } catch (error) {
        lastError = error;
        await fs.rm(target, {force:true});
        if (attempt < 3) await new Promise(resolve => setTimeout(resolve, attempt * 1500));
      }
    }
  }
  throw lastError || new Error(`Could not download ${id}`);
}

function makeWebp(source, target, maxSize, quality) {
  execFileSync('ffmpeg', [
    '-hide_banner','-loglevel','error','-y',
    '-i', source,
    '-vf', `scale=${maxSize}:${maxSize}:force_original_aspect_ratio=decrease`,
    '-frames:v','1',
    '-c:v','libwebp',
    '-q:v', String(quality),
    '-compression_level','4',
    target,
  ], {stdio:'inherit'});
}

let sourceCount = 0;
for (const project of projects) {
  const ids = sources[String(project.id)];
  if (!ids || ids.length !== project.images.length) {
    throw new Error(`Volume ${project.id}: source count ${ids?.length || 0}, expected ${project.images.length}`);
  }

  console.log(`Volume ${String(project.id).padStart(2,'0')} — ${ids.length} originals`);
  for (let i = 0; i < ids.length; i++) {
    const image = project.images[i];
    const temp = `/tmp/tcl-project-${project.id}-${i + 1}`;
    const full = `public/${image.src}`;
    const thumb = `public/${image.thumb}`;

    await fs.mkdir(dirname(full), {recursive:true});
    await fs.mkdir(dirname(thumb), {recursive:true});
    await downloadDriveFile(ids[i], temp);

    makeWebp(temp, full, 1800, 84);
    makeWebp(temp, thumb, 720, 76);
    await fs.rm(temp, {force:true});

    sourceCount++;
    console.log(`  ${String(i + 1).padStart(2,'0')}/${ids.length} ✓`);
  }
}

const expectedDerivatives = projects.reduce((sum, project) => sum + project.images.length * 2, 0);
console.log(`Generated ${expectedDerivatives} WebP derivatives from ${sourceCount} Drive originals.`);
