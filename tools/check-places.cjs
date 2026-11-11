// Visits every place on the 3D map with real mouse clicks, like a visitor: node tools/check-places.cjs
// For each place: find it in the search and click the result, click its building (rooms must open, other places must open their panel), click its pin,
// and for every room: click each device icon (its panel must open), check the connection lines, then click
// "Back to city". Also checks that every connection line on the map is sound.
// Writes .tmp/places/report.json and a screenshot per room to .tmp/places/, prints one line per place,
// and exits 1 on any problem. ONLY=airport,warehouse limits the run to those places.
const { spawn } = require('node:child_process'), fs = require('node:fs'), path = require('node:path');

const root = path.resolve(__dirname, '..'), out = path.join(root, '.tmp', 'places');
const CHROME = process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe', PORT = 9245;
const GPU = process.env.SOFTWARE ? ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] : ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist'];
const sleep = ms => new Promise(r => setTimeout(r, ms));
fs.mkdirSync(out, { recursive: true });

// served over http like a real visit (serve.js on its own port), so the embedded warehouse is the same site as the map
const WEB = 8095, server = spawn(process.execPath, [path.join(root, 'serve.js')], { env: { ...process.env, PORT: String(WEB) }, stdio: 'ignore', windowsHide: true });
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
async function waitFor(expression, ms = 4000) { for (let t = 0; t < ms; t += 100) { if (await ev(expression)) return true; await sleep(100); } return false; }
async function shot(name) { const r = await cdp('Page.captureScreenshot', { format: 'png' }); fs.writeFileSync(path.join(out, name + '.png'), Buffer.from(r.data, 'base64')); }
// a real mouse click; returns what was under the pointer (the 3D map canvas, or a piece of the interface covering it)
async function click(x, y) {
  const under = await ev(`(() => { const e = document.elementFromPoint(${x}, ${y}); return e ? (e.id || e.className || e.tagName).toString().slice(0, 40) : 'nothing'; })()`);
  await cdp('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y });
  await cdp('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', clickCount: 1 });
  await cdp('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', clickCount: 1 });
  return under;
}
// wait until the camera has stopped moving (flights take about a second, then the damping settles)
// centre of the first element with this class, also inside frames (the embedded warehouse), in page pixels
async function boxOf(cls) {
  const { root } = await cdp('DOM.getDocument', { depth: -1, pierce: true });
  const find = n => { if (!n) return null; const at = n.attributes || []; for (let i = 0; i < at.length; i += 2) if (at[i] === 'class' && at[i + 1].split(' ').includes(cls)) return n; for (const c of [...(n.children || []), n.contentDocument].filter(Boolean)) { const f = find(c); if (f) return f; } return null; };
  const node = find(root); if (!node) return null;
  const { model } = await cdp('DOM.getBoxModel', { backendNodeId: node.backendNodeId }); const q = model.content;
  return [Math.round((q[0] + q[4]) / 2), Math.round((q[1] + q[5]) / 2)];
}
async function settle() { await sleep(600); let last = ''; for (let i = 0; i < 60; i++) { const v = await ev('City3D.view'); const k = JSON.stringify([v.target, v.dist]); if (v.anim >= 1 && k === last) return; last = k; await sleep(120); } }
const titleIs = t => `document.body.classList.contains('panel-open') && document.getElementById('panelTitle').textContent === ${JSON.stringify(t)}`;
const home = async () => { await ev("if (scene === 'inside') leaveNow(); if (document.body.classList.contains('in-warehouse')) document.getElementById('whBack').click(); closePanel(); selDev = null"); await sleep(150); };
// open the place like a visitor (its panel stays open; closing it flies the camera back out), then wait for the camera
const goTo = async z => { await home(); await ev(`show('${z}', false, true)`); await settle(); };

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
  await cdp('Page.navigate', { url: `http://localhost:${WEB}/` });
  if (!await waitFor('typeof City3D === "object" && (City3D.ready || City3D.failed)', 30000) || await ev('City3D.failed')) throw new Error('the 3D map did not open (offline?)');
  await ev('autoRot = false; voiceOn = false; if (window.speechSynthesis) speechSynthesis.cancel()');

  const lines = await ev('City3D.lines');
  const only = process.env.ONLY ? process.env.ONLY.split(',') : null;
  const zones = (await ev('Object.keys(ZINFO).filter(z => TOPICS[z])')).filter(z => !only || only.includes(z));
  const rows = [];
  const report = r => { rows.push(r); process.stdout.write(`${r.issues.length ? 'FAIL' : 'ok  '} ${r.zone.padEnd(13)} ${r.title.slice(0, 26).padEnd(26)} search: ${String(r.search).padEnd(3)} building: ${String(r.building).padEnd(12)} pin: ${String(r.pin).padEnd(4)} inside: ${String(r.inside).padEnd(10)} ${r.devices}${r.issues.length ? '  <- ' + r.issues.join('; ') : ''}\n`); };
  for (const z of zones) {
    const T = await ev(`({ title: TOPICS['${z}'].title, room: !!SCENES['${z}'] })`);
    const r = { zone: z, title: T.title, search: '', building: '', pin: '', inside: '', devices: '', back: '', issues: [] };
    // 0. find it in the search ("Where would you like to go?") by its name, and click the result
    await home();
    const sb = await ev("(() => { const q = document.getElementById('bSearch').getBoundingClientRect(); return [Math.round(q.x + q.width / 2), Math.round(q.y + q.height / 2)]; })()");
    await click(sb[0], sb[1]); await waitFor("document.getElementById('searchDialog').open", 1500);
    await cdp('Input.insertText', { text: T.title });
    await sleep(250);
    const hitPx = await ev(`(() => { const b = [...document.querySelectorAll('#searchResults .search-result')].find(b => b.querySelector('b').textContent === ${JSON.stringify(T.title)}); if (!b) return null; b.scrollIntoView({ block: 'center' }); const q = b.getBoundingClientRect(); return [Math.round(q.x + q.width / 2), Math.round(q.y + q.height / 2)]; })()`);
    if (!hitPx) { r.search = 'NO'; r.issues.push('not found in the search'); await ev("document.getElementById('searchDialog').close()"); }
    else { await ev('sel = null'); await click(hitPx[0], hitPx[1]); r.search = await waitFor(`sel === '${z}' && document.body.classList.contains('panel-open')`, 2500) ? 'ok' : 'NO'; if (r.search !== 'ok') r.issues.push('search result did not open the place'); }
    // 1. fly there, then click the building itself: a room must open, otherwise the place's panel
    await goTo(z);
    const px = await ev(`City3D.zoneTarget('${z}')`);
    if (!px) r.building = 'none';
    else {
      await ev('sel = null');   // so only this click can select the place again
      const under = await click(px[0], px[1]);
      if (under !== 'city3d') { r.building = 'covered'; r.issues.push(`building is covered by ${under}`); }
      else if (T.room) { const ok = await waitFor(z === 'warehouse' ? "document.body.classList.contains('in-warehouse')" : "scene === 'inside'", 2500); r.building = ok ? 'goes inside' : 'NO'; if (!ok) r.issues.push('clicking the building did not go inside'); }
      else { const ok = await waitFor(`sel === '${z}' && document.body.classList.contains('panel-open')`, 3500); r.building = ok ? 'opens panel' : 'NO'; if (!ok) r.issues.push('clicking the building opened: ' + await ev("(scene === 'inside' ? 'room ' + curZone : '') + ' panel ' + (document.getElementById('panelTitle') || {}).textContent + ' sel ' + sel")); }
    }
    // 2. the pin opens the place's panel
    await goTo(z);
    const pin = await ev(`City3D.pinCentre('${z}')`);
    if (!pin) { r.pin = 'none'; r.issues.push('no pin on the map'); }
    else {
      await ev("sel = null");   // so only the click can select the place again
      const under = await click(pin[0], pin[1]), ok = await waitFor(`sel === '${z}' && document.body.classList.contains('panel-open')`, 2500);
      r.pin = under !== 'city3d' ? 'covered' : ok ? 'ok' : 'NO';
      if (r.pin !== 'ok') r.issues.push(r.pin === 'covered' ? `pin is covered by ${under}` : 'pin click did not open the panel');
    }
    // 3. the panel's "Go inside" button (a room of its own, or the room this place links to)
    if (!await ev(titleIs(T.title))) { await ev(`show('${z}', false, true)`); await sleep(400); }
    const btn = await ev(`(() => { const b = document.querySelector('#panel [data-act="enter"], #panel [data-room]'); if (!b) return null; b.scrollIntoView({ block: 'center' }); const q = b.getBoundingClientRect(); return [Math.round(q.x + q.width / 2), Math.round(q.y + q.height / 2), b.dataset.room || '${z}'] })()`);
    if (!btn) { r.inside = T.room ? 'NO button' : 'no room'; if (T.room) r.issues.push('panel has no "Go inside" button'); report(r); continue; }
    await click(btn[0], btn[1]);
    if (btn[2] === 'warehouse') {   // the Logistics Hub opens the real Warehouse Command 3D inside the dashboard
      const open = await waitFor("document.body.classList.contains('in-warehouse')", 3000); await sleep(3500); await shot('room-warehouse');
      r.inside = open ? 'ok (Warehouse Command 3D)' : 'NO'; if (!open) r.issues.push('the warehouse did not open');
      const b = await boxOf('back-city');   // the warehouse's own "Back to city" button, inside its frame
      if (!b) r.issues.push('no "Back to city" button in the warehouse'); else await click(b[0], b[1]); r.back = await waitFor("!document.body.classList.contains('in-warehouse')", 2000) ? 'ok' : 'NO'; if (r.back !== 'ok') r.issues.push('"Back to city" did not close the warehouse');
      report(r); continue;
    }
    const inside = await waitFor(`scene === 'inside' && City3D.room && City3D.room.zone === curZone && City3D.room.things > 0`, 4000);
    r.inside = inside ? (btn[2] === z ? 'ok' : 'ok:' + btn[2]) : 'NO';
    if (!inside) { r.issues.push('"Go inside" did not open the 3D room'); report(r); continue; }
    await settle();
    const room = await ev('City3D.room'), want = await ev('curInt.devs.length');
    if (room.devices < want) r.issues.push(`only ${room.devices} of ${want} devices shown`);
    if (want && room.links < want) r.issues.push(`${room.links} connection lines for ${want} devices`);
    if (await ev('City3D.lines.roomBroken')) r.issues.push('a room connection line is broken');
    await shot('room-' + z);
    // 4. click every device icon in the room, one by one
    const all = await ev('City3D.roomDevices()'), inRoom = await ev('curInt.devs.map(p => p.id)');
    const devs = all.filter(d => inRoom.includes(d.id)), badges = all.filter(d => !inRoom.includes(d.id));
    let opened = 0, covered = 0; const wrong = [];
    for (const d of devs) {
      if (d.x < 0 || d.y < 0 || d.x > 1600 || d.y > 900) { covered++; continue; }
      const under = await click(d.x, d.y);
      if (under !== 'city3d') { covered++; continue; }
      if (await waitFor(`selDev === ${JSON.stringify(d.id)}`, 1500)) opened++; else wrong.push(d.id);
    }
    r.devices = `devices ${opened}/${devs.length} open` + (covered ? ` (${covered} hidden)` : '') + (badges.length ? `, badges ${badges.map(b => b.id).join('+')}` : '');
    if (wrong.length) r.issues.push('device click did not open: ' + wrong.join(', '));
    if (devs.length && opened === 0) r.issues.push('no device in the room could be clicked');
    // 5. back to the city with the real button
    const back = await ev("(() => { const b = document.getElementById('bBack'); if (!b || b.hidden) return null; const q = b.getBoundingClientRect(); return [Math.round(q.x + q.width / 2), Math.round(q.y + q.height / 2)]; })()");
    if (back) { await click(back[0], back[1]); r.back = await waitFor("scene === 'city'", 2500) ? 'ok' : 'NO'; } else r.back = 'NO button';
    if (r.back !== 'ok') r.issues.push('"Back to city" did not work');
    // 6. a gateway or IRIV Edge badge takes you outside to that device on the map
    if (badges.length) {
      await ev(`enterInside('${btn[2]}')`); await waitFor("scene === 'inside' && City3D.room && City3D.room.things > 0", 4000); await settle();
      const b = (await ev('City3D.roomDevices()')).find(d => !inRoom.includes(d.id));
      if (b && await click(b.x, b.y) === 'city3d') { const ok = await waitFor(`scene === 'city' && selDev === ${JSON.stringify(b.id)}`, 4000); if (!ok) r.issues.push(`the ${b.id} badge did not show that device on the map`); }
    }
    report(r);
  }
  const failed = rows.filter(r => r.issues.length);
  const rep = { when: new Date().toISOString(), lines, places: rows.length, rooms: rows.filter(r => r.inside.startsWith('ok')).length, failed: failed.map(r => ({ zone: r.zone, issues: r.issues })), errors, rows };
  fs.writeFileSync(path.join(out, 'report.json'), JSON.stringify(rep, null, 1));
  console.log(`\nConnections: ${lines.links} device links (${lines.offline} offline), ${lines.routes} power and water routes, ${lines.broken} broken.`);
  console.log(`${rows.length} places, ${rep.rooms} rooms entered in 3D, ${failed.length} with problems.`);
  if (errors.length) console.log('Page errors:\n' + errors.join('\n'));
  chrome.kill(); server.kill(); process.exit(failed.length || errors.length || lines.broken ? 1 : 0);
})().catch(e => { console.error('FAIL', e.message); chrome.kill(); server.kill(); process.exit(2); });
