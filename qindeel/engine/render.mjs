// Renders an episode to a 1080x1920 30fps MP4.
//   node engine/render.mjs ep01            -> out/ep01.mp4 (muxes out/ep01.wav if present)
//   node engine/render.mjs ep01 --stills 1,5,10   -> out/ep01_t1.jpg ... (preview frames)
import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ep = process.argv[2] || 'ep01';
const stillsArg = process.argv.indexOf('--stills');
const FPS = 30;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
await page.goto(pathToFileURL(path.join(root, 'engine/scene.html')).href + '?ep=' + ep);
await page.waitForFunction('window.READY === true');
const duration = await page.evaluate('window.EPISODE.duration');

if (stillsArg > -1) {
  for (const t of process.argv[stillsArg + 1].split(',').map(Number)) {
    await page.evaluate(t => window.renderAt(t), t);
    await page.screenshot({ path: path.join(root, `out/${ep}_t${t}.jpg`), type: 'jpeg', quality: 88 });
  }
  await browser.close();
  process.exit(0);
}

const wav = path.join(root, `out/${ep}.wav`);
const hasAudio = existsSync(wav);
const args = ['-y', '-v', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-',
  ...(hasAudio ? ['-i', wav] : []),
  '-c:v', 'libx264', '-preset', 'slow', '-crf', '17', '-pix_fmt', 'yuv420p', '-r', String(FPS),
  ...(hasAudio ? ['-c:a', 'aac', '-b:a', '192k', '-shortest'] : []),
  '-movflags', '+faststart', path.join(root, `out/${ep}.mp4`)];
const ff = spawn('ffmpeg', args, { stdio: ['pipe', 'inherit', 'inherit'] });
const frames = Math.round(duration * FPS);
for (let i = 0; i < frames; i++) {
  await page.evaluate(t => window.renderAt(t), i / FPS);
  const buf = await page.screenshot({ type: 'jpeg', quality: 96 });
  if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
  if (i % 150 === 0) console.log(`frame ${i}/${frames}`);
}
ff.stdin.end();
await new Promise(r => ff.on('close', r));
await browser.close();
console.log('done', `out/${ep}.mp4`, hasAudio ? '(with audio)' : '(silent)');
