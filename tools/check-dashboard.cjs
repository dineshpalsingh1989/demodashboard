// Smoke test for the smart city dashboard: node tools/check-dashboard.cjs
// Opens index.html in headless Chrome, drives the main features, checks traffic and layout,
// and fails on any page error. Screenshots go to .tmp/check/ (ignored by git).
const { spawn } = require('node:child_process'), fs = require('node:fs'), path = require('node:path'), assert = require('node:assert/strict');
const { pathToFileURL } = require('node:url');

const root = path.resolve(__dirname, '..'), out = path.join(root, '.tmp', 'check');
const CHROME = process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe', PORT = 9241;
const sleep = ms => new Promise(r => setTimeout(r, ms));
fs.mkdirSync(out, { recursive: true });

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
async function shot(name) { const r = await cdp('Page.captureScreenshot', { format: 'png' }); fs.writeFileSync(path.join(out, name + '.png'), Buffer.from(r.data, 'base64')); }
async function viewport(width, height) { await cdp('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: width < 600 }); await waitFor(`W===${width} && H===${height}`, `viewport ${width}×${height}`); await sleep(150); }
const step = async (name, fn) => { await fn(); console.log('PASS', name); };

async function layoutCheck(width, height) {
  await viewport(width, height);
  const r = await ev(`(()=>{const box=s=>{const r=document.querySelector(s).getBoundingClientRect();return {s,l:r.left,r:r.right,t:r.top,b:r.bottom}};
    return {overflow:document.documentElement.scrollWidth>innerWidth,bars:['.view-tools','.map-tools'].map(box),
      small:[...document.querySelectorAll('.view-tools button,.map-tools button')].filter(b=>b.offsetParent&&b.getBoundingClientRect().width<32).map(b=>b.id)}})()`);
  assert.equal(r.overflow, false, `horizontal scroll at ${width}px`);
  const [a, b] = r.bars;
  assert(!(a.l < b.r && a.r > b.l && a.t < b.b && a.b > b.t), `toolbars overlap at ${width}px`);
  assert.deepEqual(r.small, [], `buttons narrower than 32px at ${width}px`);
  await shot(`layout-${width}`);
}

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
  await viewport(1440, 1000).catch(() => {});
  await cdp('Page.navigate', { url: pathToFileURL(path.join(root, 'index.html')).href });
  await waitFor("typeof TOTAL_DEVICES!=='undefined' && typeof cars!=='undefined'", 'the dashboard to load');
  await viewport(1440, 1000);

  await step('Districts, devices and the project panel open', async () => {
    await ev("show('mobility')"); await waitFor("document.body.classList.contains('panel-open')", 'panel to open');
    await ev("showDevice('jn-ai')"); assert.equal(await ev('selDev'), 'jn-ai');
    await ev('showProject()'); await sleep(300); await ev('closePanel()');
  });
  await step('Search directory opens and lists results', async () => {
    await ev("document.getElementById('bSearch').click()"); await waitFor("document.getElementById('searchDialog').open", 'search to open');
    assert(await ev("document.getElementById('searchResults').children.length > 0"), 'no search results');
    await ev("document.getElementById('searchClose').click()"); await waitFor("!document.getElementById('searchDialog').open", 'search to close');
  });
  await step('Guided tour starts and stops', async () => {
    await ev("document.getElementById('bTour').click()"); await waitFor('!!tourList', 'tour to start');
    await ev('stopTour()'); assert.equal(await ev('tourList'), null);
  });
  await step('Every scenario starts and stops', async () => {
    for (const id of await ev('Object.keys(SCENARIOS)')) { await ev(`runScenario(${JSON.stringify(id)})`); await sleep(150); assert(await ev('!!SC'), 'scenario ' + id); await ev('stopScenario(true)'); }
  });
  await step('Walk mode enters and exits', async () => {
    await ev('startWalk()'); await waitFor('WALK.on', 'walk mode'); await sleep(300); await shot('walk');
    await ev('exitWalk()'); assert.equal(await ev('WALK.on'), false);
  });
  await step('Traffic flows: cars move, never overlap, and the flow layer toggles', async () => {
    await ev("resetCityView(); document.getElementById('bFlow').click()"); assert.equal(await ev('showFlow'), true);
    await sleep(4000);
    const t = await ev("({moving:cars.filter(c=>c.v>.2).length,n:cars.length,overlap:cars.filter(c=>cars.some(o=>o!==c&&o.ax===c.ax&&o.lane===c.lane&&Math.abs(o.pos-c.pos)<(c.len+o.len)/2)).length,bad:cars.filter(c=>!(c.v>=0)).length})");
    assert(t.moving > 0, 'no cars moving'); assert.equal(t.overlap, 0, 'cars overlap'); assert.equal(t.bad, 0, 'invalid car speed');
    await shot('traffic'); await ev("document.getElementById('bFlow').click()");
  });
  await step('Night mode and zoom controls respond', async () => {
    const z = await ev('cam.tz'); await ev('zoomMap(1.2)'); assert(await ev('cam.tz') > z);
    await ev("document.getElementById('bNight').click()"); assert.equal(await ev('nightTarget'), 1);
    await ev("document.getElementById('bNight').click()");
  });
  await step('Layout holds at desktop, laptop and phone widths', async () => {
    await ev('resetCityView()');
    for (const [w, h] of [[1440, 1000], [1024, 768], [390, 844]]) await layoutCheck(w, h);
  });

  assert.deepEqual(errors, [], 'page errors:\n' + errors.join('\n'));
  console.log('PASS No page errors. Screenshots in .tmp/check/');
  chrome.kill(); process.exit(0);
})().catch(e => { console.error('FAIL', e.message); if (errors.length) console.error('Page errors:\n' + errors.join('\n')); chrome.kill(); process.exit(1); });
