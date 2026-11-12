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
    const type = text => ev(`(()=>{const i=document.getElementById('citySearch'); i.value='${text}'; i.dispatchEvent(new Event('input'))})()`);
    await type('werehouse'); await sleep(200);
    assert(await ev("document.querySelector('#searchResults .search-result b')?.textContent.includes('Logistics Hub')"), 'typo "werehouse" should find the Airport Logistics Hub first');
    await type('');
    await ev("document.getElementById('searchClose').click()"); await waitFor("!document.getElementById('searchDialog').open", 'search to close');
  });
  await step('IRIV units button lists only IRIV devices, including the village', async () => {
    await ev("document.getElementById('bIriv').click()"); await waitFor("document.getElementById('searchDialog').open", 'IRIV list to open');
    const r = await ev("(()=>{const t=[...document.querySelectorAll('#searchResults .search-result b')].map(b=>b.textContent);return {n:t.length,bad:t.filter(x=>!x.startsWith('IRIV')),vil:t.some(x=>/Solar Pump/.test(x))}})()");
    assert(r.n >= 30 && !r.bad.length && r.vil, 'IRIV filter wrong: ' + JSON.stringify(r));
    await ev("document.getElementById('searchClose').click()"); await waitFor("!document.getElementById('searchDialog').open", 'IRIV list to close');
    for (const id of ['vil-pic', 'vil-ai', 'vil-ioc', 'bus-ai', 'bus-vs']) { await ev(`showDevice('${id}')`); await sleep(1200); assert(await ev("document.getElementById('panel').classList.contains('open')"), 'panel for ' + id); if (id === 'vil-pic') await shot('village'); }
    await ev("showDevice('vil-pic')"); await sleep(600); assert(await ev("!!document.querySelector('#panel .ins-film')"), 'tour film link missing'); await shot('film-link');
    await ev('enterInside("satvschool")'); await sleep(1500); assert.equal(await ev('scene'), 'inside'); await shot('village-school-inside');
    await ev('closePanel()');
    assert.equal(await ev("objs.filter(o => o.t === 'busstop').length"), 5, 'five bus stops');
    await ev("showDevice('bus-ai')"); await sleep(1500); await shot('bus-stop');
    await ev('closePanel()');
  });
  await step('Airport and Metro Loop: zones open, train runs, devices open', async () => {
    for (const z of ['airport', 'airstation', 'rail']) { await ev(`show('${z}')`); await sleep(500); assert(await ev("document.getElementById('panel').classList.contains('open')"), 'panel for ' + z); }
    const before = await ev('JSON.stringify(RAIL.cars[2])'); await ev('time += 11'); await sleep(900); assert.notEqual(await ev('JSON.stringify(RAIL.cars[2])'), before, 'the train moves'); await ev('closePanel()');
    for (const id of ['air-ai', 'apron-ai', 'air-pic', 'air-ioc', 'rail-pic', 'rail-ai', 'air-pos', 'food-pos', 'air-edge', 'acp-anpr', 'acp-ioc', 'sec-ioc', 'sec-vs', 'claim-ioc', 'arr-vs', 'air-sub-pic', 'air-sub-ct', 'town-sub-ioc', 'vil-sub-ct', 'farm-sub-ct', 'fer-ai', 'fer-ioc', 'fer-vs']) { await ev(`showDevice('${id}')`); await sleep(900); assert(await ev("document.getElementById('panel').classList.contains('open')"), 'panel for ' + id); }
    await ev('closePanel()');
    await ev("show('ferry')"); await sleep(3000); const fy = await ev('FERRY.y'); await ev('FERRY.t += 12'); await sleep(900); assert.notEqual(await ev('FERRY.y'), fy, 'the ferry sails'); await shot('ferry');
    await ev('show("airport")'); await sleep(2500); await shot('airport');
    await ev("showDevice('rail-pic')"); await sleep(2500); await shot('airport-station');
    for (const z of ['airarrival', 'airsecurity', 'airterminal', 'airfood', 'airgate', 'aircontrol']) { await ev(`enterInside('${z}')`); await sleep(1500); assert.equal(await ev('scene'), 'inside', 'inside ' + z); await shot('inside-' + z); await ev('leaveNow()'); await sleep(800); }
    await ev("show('aircarpark')"); await sleep(6000); assert(await ev('ACP.entries > 1086 || ACP.log.length > 6'), 'cars enter the car park'); await shot('airport-carpark');
    const seen = new Set(); for (let i = 0; i < 40; i++) { await ev('FLT += 3'); await sleep(40); seen.add(await ev('FL.info(0).status')); } assert(seen.size >= 5, 'flight statuses cycle: ' + [...seen]);
    await ev('FLT = 52'); await sleep(600); await shot('airport-live');
    await ev("WX.manual = 'storm'"); await sleep(2500); const f0 = await ev('FLT'); await sleep(1200);
    assert.equal(await ev('FLT'), f0, 'flight clock stops in a storm'); assert(await ev("AIRFX.runway.startsWith('Closed') && FL.board().some(r => /Delayed/.test(r.dep))"), 'runway closed, flights delayed'); await shot('storm');
    await ev("WX.manual = 'clear'"); await sleep(1200); assert((await ev('FLT')) > f0, 'flights resume'); await ev('WX.manual = null');
    await ev('startWalk(70, 26.5)'); await sleep(1500); assert(await ev('WALK.on'), 'walk mode at the airport'); await shot('airport-walk'); await ev('exitWalk()'); await sleep(500);
    assert(await ev("FL.rows().length === 4 && [0, 1, 2, 3].every(g => { planeState(g, 105); return true; })"), 'flight rows');
    const names = await ev('RAIL.st.map(s => s.name).join()'); assert.equal(names.split(',').length, 5);
    assert(await ev('RAIL.cars.length === 5 && RAIL.Tc > 60'), 'train schedule');
    await ev('closePanel()');
  });
  await step('Regional grid, ride the train, and frame times', async () => {
    await ev("show('regionalgrid')"); await sleep(3000); assert(Math.abs(await ev('cam.tx') - 61) < 10, 'camera flies to the airport substation'); await shot('grid-airport');
    assert(await ev("objs.filter(o => o.t === 'pylon' && o.zone === 'regionalgrid').length >= 18"), 'regional pylons');
    assert(await ev('GRIDR.total() > 5'), 'grid load');
    await ev("show('rail')"); await sleep(400); await ev("document.querySelector('[data-ride]').click()"); await sleep(2500); assert(await ev('RIDE'), 'ride starts'); await shot('ride-train');
    await cdp('Input.dispatchMouseEvent', { type: 'mousePressed', x: 400, y: 500, button: 'left', clickCount: 1 }); await cdp('Input.dispatchMouseEvent', { type: 'mouseReleased', x: 400, y: 500, button: 'left', clickCount: 1 }); assert.equal(await ev('RIDE'), false, 'click stops the ride');
    const fps = () => ev("new Promise(r => { let n = 0; const t0 = performance.now(); (function f() { if (++n < 12) requestAnimationFrame(f); else r((performance.now() - t0) / 12); })(); })");
    await ev('resetCityView()'); await sleep(800); const city = await fps();
    await ev("show('airport')"); await sleep(1500); const air = await fps();
    await ev("enterInside('airterminal')"); await sleep(1800); const hall = await fps(); await ev('leaveNow()'); await sleep(500);
    console.log('frame ms · city ' + city.toFixed(1) + ' · airport ' + air.toFixed(1) + ' · terminal ' + hall.toFixed(1));
    assert(city < 1500 && air < 1500 && hall < 1500, 'frame time regressed badly (headless software rendering is slow; this only catches big jumps)');
  });
  await step('IRIV films button lists all tours', async () => {
    await ev("document.getElementById('bFilms').click()"); await sleep(500);
    assert.equal(await ev("document.querySelectorAll('#panel .ins-film').length"), 8, 'six films, the compare page and Warehouse Command 3D');
    assert.deepEqual(await ev("[...document.querySelectorAll('#panel .ins-film')].map(a => a.getAttribute('href'))"), ['short-video-of-iriv-edgeai/', 'short-video-of-iriv-pi/', 'short-video-of-iriv-smarthub/', 'short-video-of-iriv-ioc/', 'short-video-of-iriv-ioc-vibration/', 'short-video-of-iriv-hub/', 'iriv-controllers/', 'warehouse-3d/']);
    await shot('films'); await ev('closePanel()');
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
  await step('The map is 3D: opens by default, rooms are 3D, connections and traffic flow show (2D fallback offline)', async () => {
    await waitFor('City3D.ready || City3D.failed', '3D map');
    if (await ev('City3D.failed')) { console.log('SKIP 3D map: three.js could not load (offline?), 2D fallback in use'); assert.equal(await ev("document.body.classList.contains('boot3d')"), false); return; }
    const shown = "document.getElementById('city3d').style.display";
    await ev('resetCityView()'); await sleep(800); assert.equal(await ev(shown), 'block'); await shot('view3d');
    assert.equal(await ev("getComputedStyle(document.getElementById('city')).visibility"), 'visible', '2D canvas must be usable for interiors');
    assert(await ev("cars.length > 0 && City3D.view.dist > 0"), '3D camera not set');
    await waitFor('City3D.detailStats?.street?.ready', 'street life (entrances, signs, people) to finish building');
    assert(await ev('City3D.detailStats.street.entrances > 10 && City3D.detailStats.street.stops > 0'), 'street life built but found no entrances or bus stops');
    await ev("show('warehouse')"); await waitFor("document.body.classList.contains('panel-open')", 'logistics panel');
    assert(await ev("!!document.querySelector('#panel a[href=\"warehouse-3d/\"]')"), 'warehouse link in the panel');
    await ev("closePanel(); enterInside('command')"); await waitFor("scene === 'inside'", 'interior'); await sleep(300);
    assert.equal(await ev(shown), 'block', 'rooms are drawn in 3D'); await shot('room3d');
    assert(await ev('City3D.view.dist < 40'), '3D camera should frame the room');
    await ev('leaveNow()'); await sleep(300); assert.equal(await ev(shown), 'block');
    await ev("document.getElementById('bFlow').click()"); await sleep(400); await shot('flow3d'); await ev("document.getElementById('bFlow').click()");
  });
  await step('Layout holds at desktop, laptop and phone widths', async () => {
    await ev('resetCityView()');
    for (const [w, h] of [[1440, 1000], [1024, 768], [390, 844]]) await layoutCheck(w, h);
  });

  assert.deepEqual(errors, [], 'page errors:\n' + errors.join('\n'));
  console.log('PASS No page errors. Screenshots in .tmp/check/');
  chrome.kill(); process.exit(0);
})().catch(e => { console.error('FAIL', e.message); if (errors.length) console.error('Page errors:\n' + errors.join('\n')); chrome.kill(); process.exit(1); });
