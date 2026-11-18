// Designed cover for an episode in the traveler theme: a clean scene frame with the title set large.
//   node engine/cover.mjs ep14 <time> "<title line 1>" "<gold line 2>" "<small line>"  -> post-kit/<ep>/cover.jpg
// The title sits in the middle of the frame so it survives Instagram's square/4:5 grid crop.
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const [ep, time, l1, l2, l3] = process.argv.slice(2);
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
await page.goto(pathToFileURL(path.join(root, 'engine', 'scene.html')).href + '?ep=' + ep);
await page.waitForFunction('window.READY === true');
await page.evaluate(([t, l1, l2, l3]) => {
  window.renderAt(t);
  const cv = document.getElementById('c'); cv.style.transform = 'translateY(230px)'; document.getElementById('stage').style.background = document.body.style.background = '#0A0C2B';
  for (const id of ['cues', 'subs']) document.getElementById(id).style.display = 'none';
  const b = document.getElementById('brand'); b.style.opacity = 0.95; b.style.top = '500px'; b.style.transform = 'scale(1.25)';
  const d = document.createElement('div');
  d.style.cssText = 'position:absolute;left:0;right:0;top:0;height:1920px;direction:rtl;text-align:center;pointer-events:none';
  d.innerHTML = `<div style="position:absolute;left:0;right:0;top:0;height:560px;background:linear-gradient(#0A0C2B 0,#0A0C2B 236px,rgba(10,12,43,0) 100%)"></div><div style="position:absolute;inset:0;background:radial-gradient(ellipse 80% 30% at 50% 39%,rgba(5,8,33,.72),rgba(5,8,33,0) 100%)"></div>
    <div style="position:absolute;left:60px;right:60px;top:580px;font:700 104px/1.35 Messiri;color:#FFF4DC;text-shadow:0 6px 40px rgba(5,8,33,.9)">${l1}</div>
    <div style="position:absolute;left:60px;right:60px;top:730px;font:700 124px/1.35 Messiri;color:#F7C56B;text-shadow:0 6px 40px rgba(5,8,33,.9)">${l2}</div>
    <div style="position:absolute;left:50%;top:925px;width:150px;margin-left:-75px;height:3px;background:linear-gradient(90deg,transparent,#F7C56B,transparent)"></div>
    <div style="position:absolute;left:60px;right:60px;top:950px;font:500 44px/1.5 Plex;color:#FFF4DC;opacity:.92;text-shadow:0 3px 20px rgba(5,8,33,.9)">${l3}</div>`;
  document.getElementById('stage').appendChild(d);
}, [parseFloat(time), l1, l2, l3 || '']);
await page.screenshot({ path: path.join(root, `post-kit/${ep}/cover.jpg`), type: 'jpeg', quality: 93 });
await browser.close();
