// Verify the install manifest and an offline dashboard launch: node tools/check-pwa.cjs
const { spawn } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');

const root = path.resolve(__dirname, '..');
const profile = path.join(root, '.tmp', 'pwa-profile');
const webPort = 8096, debugPort = 9260;
fs.mkdirSync(path.dirname(profile), { recursive: true });
const server = spawn(process.execPath, [path.join(root, 'serve.js')], {
  env: { ...process.env, PORT: String(webPort) }, stdio: 'ignore', windowsHide: true
});
const chrome = spawn(process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe', [
  '--headless=new', '--no-sandbox', '--no-first-run',
  `--remote-debugging-port=${debugPort}`, `--user-data-dir=${profile}`, 'about:blank'
], { stdio: 'ignore', windowsHide: true });
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
let ws, seq = 0;
const pending = new Map();
const cdp = (method, params = {}) => new Promise((resolve, reject) => {
  const id = ++seq;
  const timer = setTimeout(() => { pending.delete(id); reject(new Error(`Timeout: ${method}`)); }, 20000);
  pending.set(id, { resolve, reject, timer });
  ws.send(JSON.stringify({ id, method, params }));
});
async function ev(expression) {
  const result = await cdp('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text);
  return result.result.value;
}
async function waitFor(expression, label) {
  for (let i = 0; i < 150; i++) {
    if (await ev(expression)) return;
    await sleep(100);
  }
  throw new Error(`Timed out waiting for ${label}`);
}

(async () => {
  let pages;
  for (let i = 0; i < 80; i++) {
    try {
      pages = (await fetch(`http://localhost:${debugPort}/json`).then(r => r.json())).filter(p => p.type === 'page');
      if (pages.length) break;
    } catch { /* Chrome is starting. */ }
    await sleep(150);
  }
  assert(pages?.length, 'Chrome did not start');
  ws = new WebSocket(pages[0].webSocketDebuggerUrl);
  ws.onmessage = ({ data }) => {
    const message = JSON.parse(data);
    const entry = pending.get(message.id);
    if (!entry) return;
    clearTimeout(entry.timer);
    pending.delete(message.id);
    message.error ? entry.reject(new Error(message.error.message)) : entry.resolve(message.result);
  };
  await new Promise((resolve, reject) => { ws.onopen = resolve; ws.onerror = reject; });
  await cdp('Runtime.enable');
  await cdp('Page.enable');
  await cdp('Network.enable');
  await cdp('Storage.clearDataForOrigin', { origin: `http://localhost:${webPort}`, storageTypes: 'all' });
  await cdp('Page.navigate', { url: `http://localhost:${webPort}/` });
  await waitFor("typeof TOTAL_DEVICES !== 'undefined'", 'dashboard');
  await waitFor('!!navigator.serviceWorker?.controller', 'service worker control');

  const manifest = await cdp('Page.getAppManifest');
  assert.deepEqual(manifest.errors, [], 'manifest errors');
  const data = JSON.parse(manifest.data);
  assert.equal(data.display, 'standalone');
  assert.equal(data.start_url, './');
  assert(data.icons.some(icon => icon.sizes === '192x192'));
  assert(data.icons.some(icon => icon.sizes === '512x512'));
  console.log('PASS Install manifest and service worker');

  await cdp('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  assert.equal(await ev("getComputedStyle(document.getElementById('bInstall')).display"), 'flex');
  console.log('PASS Install button is visible on phones');

  await cdp('Network.emulateNetworkConditions', { offline: true, latency: 0, downloadThroughput: 0, uploadThroughput: 0 });
  await cdp('Page.reload', { ignoreCache: true });
  await waitFor("typeof TOTAL_DEVICES !== 'undefined'", 'offline dashboard');
  assert.equal(await ev('document.getElementById("bInstall") !== null'), true);
  console.log('PASS Dashboard launches offline');
})().catch(error => { console.error('FAIL', error.message); process.exitCode = 1; })
  .finally(() => { ws?.close(); chrome.kill(); server.kill(); });
