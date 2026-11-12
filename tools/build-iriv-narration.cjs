// Generate narration with a Microsoft neural voice (edge-tts), decode it in Chrome, then build timing and captions.
// node tools/build-iriv-narration.cjs [--only=pi|edge|hub|smarthub|ioc|iocvib]   Needs `python -m pip install edge-tts` and internet. Output stays in this checkout.
const fs = require('node:fs'), path = require('node:path'), assert = require('node:assert/strict');
const { spawn, spawnSync } = require('node:child_process');
const root = path.resolve(__dirname, '..'), out = path.join(root, '.tmp/video-build'), rate = 22050, port = 9259;
const VOICE = process.env.IRIV_VOICE || 'en-US-AriaNeural', RATE = '+10%';   // neural voices read slower than SAPI; the inspection scene must fit 18 s
const only = process.argv.find(x => x.startsWith('--only='))?.split('=')[1];
const tours = [['pi', 'short-video-of-iriv-pi'], ['edge', 'short-video-of-iriv-edgeai'], ['hub', 'short-video-of-iriv-hub'], ['smarthub', 'short-video-of-iriv-smarthub'], ['ioc', 'short-video-of-iriv-ioc'], ['iocvib', 'short-video-of-iriv-ioc-vibration']].filter(([key]) => !only || only === key);
const sleep = ms => new Promise(r => setTimeout(r, ms));
let chrome, ws, seq = 0; const pending = new Map();
const cdp = (method, params = {}) => new Promise((resolve, reject) => { const id = ++seq; pending.set(id, { resolve, reject }); ws.send(JSON.stringify({ id, method, params })); });
async function ev(expression) { const r = await cdp('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true }); if (r.exceptionDetails) throw Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text); return r.result.value; }
function wave(pcm) {
  const h = Buffer.alloc(44); h.write('RIFF'); h.writeUInt32LE(36 + pcm.length, 4); h.write('WAVEfmt ', 8); h.writeUInt32LE(16, 16); h.writeUInt16LE(1, 20); h.writeUInt16LE(1, 22); h.writeUInt32LE(rate, 24); h.writeUInt32LE(rate * 2, 28); h.writeUInt16LE(2, 32); h.writeUInt16LE(16, 34); h.write('data', 36); h.writeUInt32LE(pcm.length, 40); return Buffer.concat([h, pcm]);
}
async function main() {
  const clips = [];
  for (const [, folder] of tours) {
    const config = JSON.parse(fs.readFileSync(path.join(root, folder, 'narration.json'), 'utf8')), dir = path.join(out, folder);
    fs.mkdirSync(dir, { recursive: true });
    config.scenes.forEach((scene, i) => (scene.segments || [{ text: scene.text }]).forEach((seg, j) => {
      const file = path.join(dir, `${i}-${j}.mp3`);
      const r = spawnSync('python', ['-m', 'edge_tts', '--voice', VOICE, `--rate=${RATE}`, '--text', seg.text, '--write-media', file], { stdio: 'inherit' });
      assert(r.status === 0 && fs.statSync(file).size > 0, `Speech failed for ${folder} scene ${i}.${j}`);
      clips.push(file);
    }));
    console.log(`Speech generated (${VOICE}): ${folder}`);
  }
  chrome = spawn(process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe', ['--headless=new', '--no-first-run', '--no-sandbox', `--remote-debugging-port=${port}`, '--user-data-dir=' + path.join(out, 'chrome-audio'), 'about:blank'], { stdio: 'ignore', windowsHide: true });
  let page; for (let i = 0; i < 100 && !page; i++) { try { page = (await fetch(`http://127.0.0.1:${port}/json`).then(r => r.json())).find(p => p.type === 'page'); } catch { } await sleep(100); }
  assert(page, 'Chrome did not start');
  ws = new WebSocket(page.webSocketDebuggerUrl);
  ws.onmessage = ({ data }) => { const m = JSON.parse(data), p = pending.get(m.id); if (p) { pending.delete(m.id); m.error ? p.reject(Error(m.error.message)) : p.resolve(m.result); } };
  await new Promise((r, j) => { ws.onopen = r; ws.onerror = j; }); await cdp('Runtime.enable');
  for (const file of clips) {
    const b64 = fs.readFileSync(file).toString('base64');
    const pcm = await ev(`(async () => {
      const bytes = Uint8Array.from(atob('${b64}'), c => c.charCodeAt(0));
      const audio = await new OfflineAudioContext(1, ${rate}, ${rate}).decodeAudioData(bytes.buffer), d = audio.getChannelData(0), s = new Int16Array(d.length);
      for (let i = 0; i < d.length; i++) s[i] = Math.max(-32768, Math.min(32767, Math.round(d[i] * 32767)));
      const u = new Uint8Array(s.buffer); let t = ''; for (let i = 0; i < u.length; i += 8192) t += String.fromCharCode.apply(null, u.subarray(i, i + 8192)); return btoa(t);
    })()`);
    fs.writeFileSync(file.replace(/\.mp3$/, '.wav'), wave(Buffer.from(pcm, 'base64')));
  }
  console.log(`Decoded ${clips.length} clips to ${rate} Hz WAV`);
  const r = spawnSync('node', [path.join(__dirname, 'prepare-iriv-audio.cjs'), ...tours.map(([, folder]) => folder)], { stdio: 'inherit' });
  assert(r.status === 0, 'Audio preparation failed');
}
main().then(() => { chrome?.kill(); process.exit(0); }, e => { console.error(e); chrome?.kill(); process.exit(1); });
