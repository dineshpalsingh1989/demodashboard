// Lag check for the 3D map and Warehouse Command 3D: node tools/check-performance.cjs
// Opens both pages in headless Chrome on the real GPU and measures how fast they open and how smooth they run.
// Prints a report, compares it with the previous run, appends it to .tmp/perf/history.jsonl,
// and exits 1 if any budget is missed. SOFTWARE=1 uses software rendering (slower; for machines without a GPU).
const { spawn } = require('node:child_process'), fs = require('node:fs'), path = require('node:path');
const { pathToFileURL } = require('node:url');

const root = path.resolve(__dirname, '..'), out = path.join(root, '.tmp', 'perf');
const CHROME = process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe', PORT = 9243;
const GPU = process.env.SOFTWARE ? ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] : ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist'];
const sleep = ms => new Promise(r => setTimeout(r, ms));
fs.mkdirSync(out, { recursive: true });

// budgets: opening must be fast, running must be smooth
const BUDGET = {
  'map.ready_ms': ['≤', 2000, '3D map visible after the page starts loading'],
  'map.longest_task_ms': ['≤', 250, 'longest freeze while the map opens'],
  'map.fps': ['≥', 30, 'frames per second, map idle'],
  'map.worst_frame_ms': ['≤', 100, 'slowest frame, map idle'],
  'map.fly_fps': ['≥', 30, 'frames per second while the camera flies to the airport'],
  'warehouse.first_frame_ms': ['≤', 1500, 'warehouse first frame after the page starts loading'],
  'warehouse.longest_task_ms': ['≤', 250, 'longest freeze while the warehouse opens'],
  'warehouse.fps': ['≥', 30, 'frames per second, warehouse at 1×'],
  'warehouse.worst_frame_ms': ['≤', 100, 'slowest frame, warehouse at 1×'],
  'warehouse.switch_ms': ['≤', 1500, 'switching warehouse site, fully built']
};

const chrome = spawn(CHROME, ['--headless=new', '--no-first-run', ...GPU, `--remote-debugging-port=${PORT}`, '--user-data-dir=' + path.join(out, 'profile'), 'about:blank'], { stdio: 'ignore', windowsHide: true });
let ws, seq = 0;
const pending = new Map(), errors = [];
const cdp = (method, params = {}) => new Promise((resolve, reject) => {
  const id = ++seq, timer = setTimeout(() => { pending.delete(id); reject(new Error('Timeout ' + method)); }, 30000);
  pending.set(id, { resolve, reject, timer }); ws.send(JSON.stringify({ id, method, params }));
});
async function ev(expression) {
  const r = await cdp('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
  if (r.exceptionDetails) throw new Error(expression.slice(0, 80) + '\n' + (r.exceptionDetails.exception?.description || r.exceptionDetails.text));
  return r.result.value;
}
async function waitFor(expression, what, ms = 20000) { for (let t = 0; t < ms; t += 100) { if (await ev(expression)) return; await sleep(100); } throw new Error('Timed out waiting for ' + what); }
// frames per second and the slowest frame over a window of time
const FPS = ms => `new Promise(r => { let n = 0, worst = 0, last = performance.now(); const t0 = last;
  function f(t) { n++; worst = Math.max(worst, t - last); last = t; if (t - t0 < ${ms}) requestAnimationFrame(f); else r({ fps: Math.round(n / ((t - t0) / 1000)), worst: Math.round(worst) }); }
  requestAnimationFrame(f); })`;
const LONGEST = "Math.round(Math.max(0, ...(window.__lt || []).map(e => e.duration)))";
// every freeze over 100 ms as "start+duration" (ms from page start), to line up with the phase marks
const TASKS = "(window.__lt || []).filter(e => e.duration > 100).map(e => Math.round(e.startTime) + '+' + Math.round(e.duration)).join(' ')";
async function open(url) {
  await cdp('Page.navigate', { url });
  await waitFor("document.readyState === 'complete'", 'page load');
}

(async () => {
  let target;
  for (let i = 0; i < 60 && !target; i++) { try { target = (await (await fetch(`http://127.0.0.1:${PORT}/json`)).json()).find(t => t.type === 'page'); } catch {} if (!target) await sleep(200); }
  ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise(r => ws.onopen = r);
  ws.onmessage = e => {
    const m = JSON.parse(e.data);
    if (m.id && pending.has(m.id)) { const p = pending.get(m.id); clearTimeout(p.timer); pending.delete(m.id); m.error ? p.reject(new Error(m.error.message)) : p.resolve(m.result); }
    else if (m.method === 'Runtime.exceptionThrown') errors.push(m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text);
  };
  await cdp('Runtime.enable'); await cdp('Page.enable');
  await cdp('Emulation.setDeviceMetricsOverride', { width: 1600, height: 900, deviceScaleFactor: 1, mobile: false });
  await cdp('Page.addScriptToEvaluateOnNewDocument', { source: "window.__lt = []; try { new PerformanceObserver(l => window.__lt.push(...l.getEntries())).observe({ type: 'longtask', buffered: true }); } catch (e) {}" });
  const R = { when: new Date().toISOString(), gpu: '', map: {}, warehouse: {} };

  // the 3D map
  await open(pathToFileURL(path.join(root, 'index.html')).href);
  await waitFor('typeof City3D === "object" && (City3D.ready || City3D.failed)', '3D map', 30000);
  if (await ev('City3D.failed')) throw new Error('three.js did not load: the 3D map needs an internet connection');
  R.gpu = await ev("(() => { const g = document.createElement('canvas').getContext('webgl'), e = g && g.getExtension('WEBGL_debug_renderer_info'); return e ? g.getParameter(e.UNMASKED_RENDERER_WEBGL) : 'unknown'; })()");
  const mk = await ev("Object.fromEntries(performance.getEntriesByType('mark').filter(m => m.name.startsWith('3d:')).map(m => [m.name.slice(3), Math.round(m.startTime)]))");
  Object.assign(R.map, { ready_ms: mk.ready, page_load_ms: await ev("Math.round(performance.getEntriesByType('navigation')[0].loadEventEnd)"),
    phases_ms: { download: mk.lib, ground: mk.bake - mk.init, scenery: mk.scenery - mk.bake, build: mk.built - mk.scenery, shaders: mk.compiled - mk.built } });
  await sleep(500);
  R.map.longest_task_ms = await ev(LONGEST);
  R.map.long_tasks = await ev(TASKS);
  let f = await ev(FPS(4000)); R.map.fps = f.fps; R.map.worst_frame_ms = f.worst;
  Object.assign(R.map, await ev('City3D.stats'));
  await ev("show('airport')"); f = await ev(FPS(2500)); R.map.fly_fps = f.fps; R.map.fly_worst_ms = f.worst;

  // Warehouse Command 3D
  await open(pathToFileURL(path.join(root, 'warehouse-3d', 'index.html')).href);
  await waitFor("performance.getEntriesByName('wh:first-frame').length > 0", 'warehouse first frame', 30000);
  R.warehouse.first_frame_ms = await ev("Math.round(performance.getEntriesByName('wh:first-frame')[0].startTime)");
  await sleep(500);
  R.warehouse.longest_task_ms = await ev(LONGEST);
  R.warehouse.long_tasks = await ev(TASKS);
  f = await ev(FPS(4000)); R.warehouse.fps = f.fps; R.warehouse.worst_frame_ms = f.worst;
  R.warehouse.calls = await ev('renderer.info.render.calls'); R.warehouse.triangles = await ev('renderer.info.render.triangles');
  R.warehouse.switch_ms = await ev('(async () => { const t = performance.now(); await WH.switchSite(1); return Math.round(performance.now() - t); })()');
  await ev('window.__lt.length = 0; new Promise(r => setTimeout(r, 300))');
  R.errors = errors.slice();

  // report
  const hist = path.join(out, 'history.jsonl'), prev = fs.existsSync(hist) ? JSON.parse(fs.readFileSync(hist, 'utf8').trim().split('\n').pop() || 'null') : null;
  const get = (o, k) => k.split('.').reduce((a, p) => a && a[p], o);
  console.log(`Lag check · ${R.when} · ${R.gpu}`);
  console.log(`3D map phases (ms): ${JSON.stringify(R.map.phases_ms)} · draw calls ${R.map.calls} · warehouse draw calls ${R.warehouse.calls}`);
  console.log(`Freezes over 100 ms (start+ms) · map: ${R.map.long_tasks || 'none'} (3D build starts at ${R.map.phases_ms.download}) · warehouse: ${R.warehouse.long_tasks || 'none'}`);
  let fail = 0;
  for (const [k, [op, lim, what]] of Object.entries(BUDGET)) {
    const v = get(R, k), ok = v !== undefined && (op === '≤' ? v <= lim : v >= lim), p = prev && get(prev, k);
    if (!ok) fail++;
    console.log(`${ok ? 'PASS' : 'FAIL'}  ${k.padEnd(28)} ${String(v).padStart(6)}  (budget ${op} ${lim})${p !== undefined && p !== null ? '  was ' + p : ''}  · ${what}`);
  }
  if (errors.length) { fail++; console.log('FAIL  page errors:\n' + errors.join('\n')); }
  fs.appendFileSync(hist, JSON.stringify(R) + '\n');
  console.log(fail ? `${fail} budget(s) missed.` : 'All budgets met.');
  chrome.kill(); process.exit(fail ? 1 : 0);
})().catch(e => { console.error('FAIL', e.message); chrome.kill(); process.exit(2); });
