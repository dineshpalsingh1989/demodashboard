// Captures the dashboard screens used in the IRIV Edge dashboard film: node tools/capture-iriv-hub-shots.cjs
// Needs Chrome. Output: short-video-of-iriv-hub/images/*.jpg (3840×2160, drawn at 1920×1080 so panels stay sharp when the film zooms).
const { spawn } = require('node:child_process'), fs = require('node:fs'), path = require('node:path'), assert = require('node:assert/strict');
const { pathToFileURL } = require('node:url');

const root = path.resolve(__dirname, '..'), out = path.join(root, '.tmp', 'hub'), dir = path.join(root, 'short-video-of-iriv-hub', 'images');
const CHROME = process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe', PORT = 9243;
const sleep = ms => new Promise(r => setTimeout(r, ms));
fs.mkdirSync(out, { recursive: true }); fs.mkdirSync(dir, { recursive: true });

const chrome = spawn(CHROME, ['--headless=new', '--no-sandbox', '--no-first-run', `--remote-debugging-port=${PORT}`, '--user-data-dir=' + path.join(out, 'profile'), 'about:blank'], { stdio: 'ignore', windowsHide: true });
let ws, seq = 0;
const pending = new Map(), errors = [];
const cdp = (method, params = {}) => new Promise((resolve, reject) => {
  const id = ++seq, timer = setTimeout(() => { pending.delete(id); reject(new Error('Timeout ' + method)); }, 20000);
  pending.set(id, { resolve, reject, timer }); ws.send(JSON.stringify({ id, method, params }));
});
async function ev(expression) {
  const r = await cdp('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
  if (r.exceptionDetails) throw new Error(expression + '\n' + (r.exceptionDetails.exception?.description || r.exceptionDetails.text));
  return r.result.value;
}
async function waitFor(expression, what = expression) { for (let i = 0; i < 150; i++) { if (await ev(expression)) return; await sleep(100); } throw new Error('Timed out waiting for ' + what); }
async function jpg(name) { const r = await cdp('Page.captureScreenshot', { format: 'jpeg', quality: 90 }); fs.writeFileSync(path.join(dir, name + '.jpg'), Buffer.from(r.data, 'base64')); console.log('saved', name); }
const scrollTo = text => ev(`(() => { const p = document.getElementById('panel'); const h = [...p.querySelectorAll('h3')].find(x => x.textContent.includes(${JSON.stringify(text)})); if (h) p.scrollTop = h.offsetTop - 60; return !!h; })()`);
const clickNet = () => ev(`document.querySelector('[data-act="insnet"]').click()`);

(async () => {
  let pages;
  for (let i = 0; i < 80; i++) { try { pages = (await fetch(`http://localhost:${PORT}/json`).then(r => r.json())).filter(p => p.type === 'page'); if (pages.length) break; } catch { } await sleep(150); }
  assert(pages?.length, 'Chrome did not start');
  ws = new WebSocket(pages[0].webSocketDebuggerUrl);
  ws.onmessage = ({ data }) => {
    const m = JSON.parse(data);
    if (m.id) { const p = pending.get(m.id); if (p) { clearTimeout(p.timer); pending.delete(m.id); m.error ? p.reject(new Error(m.error.message)) : p.resolve(m.result); } }
    else if (m.method === 'Runtime.exceptionThrown') errors.push(m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text);
  };
  await new Promise((r, j) => { ws.onopen = r; ws.onerror = j; });
  await cdp('Runtime.enable'); await cdp('Page.enable');
  await cdp('Emulation.setDeviceMetricsOverride', { width: 1920, height: 1080, deviceScaleFactor: 2, mobile: false });
  await cdp('Page.navigate', { url: pathToFileURL(path.join(root, 'index.html')).href });
  await waitFor("typeof TOTAL_DEVICES!=='undefined' && typeof cars!=='undefined'", 'the dashboard to load');
  await waitFor('W===1920 && H===1080', 'viewport'); await sleep(400);

  await ev('resetCityView()'); await ev('time = 20'); await sleep(2500); await jpg('city');
  await ev(`document.getElementById('bIriv').click()`); await sleep(600); await jpg('find'); await ev(`document.getElementById('searchClose').click()`); await sleep(500);
  await ev(`showDevice('air-sub-pic')`); await sleep(3500);
  assert(await scrollTo('Connected to'), 'wiring section'); await sleep(600); await jpg('wiring');
  assert(await scrollTo('Automation rules'), 'rules section'); await sleep(600); await jpg('rules');
  assert(await scrollTo('Live MQTT'), 'mqtt section'); await sleep(900); await jpg('mqtt');
  await clickNet(); await sleep(1500); assert(await scrollTo('Network failover'), 'failover section'); await sleep(600); await jpg('failover');
  await clickNet(); await ev('closePanel()'); await sleep(400);
  await ev(`showDevice('air-ai')`); await sleep(3500); await ev(`document.getElementById('panel').scrollTop = 0`); await sleep(500); await jpg('camera');
  await ev('closePanel()'); await ev(`enterInside('aircontrol')`); await sleep(2500); await ev('cam.tz = 3.4'); await sleep(2500); await jpg('control');
  await ev('leaveNow()'); await ev(`show('airport')`); await sleep(3500); await jpg('airport');
  assert.deepEqual(errors, [], 'page errors:\n' + errors.join('\n'));
  chrome.kill(); process.exit(0);
})().catch(e => { console.error('FAIL', e.message); if (errors.length) console.error('Page errors:\n' + errors.join('\n')); chrome.kill(); process.exit(1); });
