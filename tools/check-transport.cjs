// Browser regression check for native transport, bridge clearance, scenic mode and weather.
// Run: node tools/check-transport.cjs. Requires local Chrome; screenshots go to .tmp/transport.
const { spawn } = require('node:child_process');
const fs = require('node:fs'), path = require('node:path'), assert = require('node:assert/strict');
const { pathToFileURL } = require('node:url');
const root = path.resolve(__dirname, '..'), out = path.join(root, '.tmp', 'transport'), port = 9249;
fs.mkdirSync(out, { recursive: true });
const chrome = spawn(process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  ['--headless=new', '--no-first-run', '--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist',
    '--remote-debugging-port=' + port, '--user-data-dir=' + path.join(out, 'profile'), 'about:blank'],
  { stdio: 'ignore', windowsHide: true });
let ws, seq = 0;
const pending = new Map(), errors = [], sleep = ms => new Promise(r => setTimeout(r, ms));
function cdp(method, params = {}) {
  return new Promise((resolve, reject) => {
    const id = ++seq, timer = setTimeout(() => { pending.delete(id); reject(Error('Timeout: ' + method)); }, 30000);
    pending.set(id, { resolve, reject, timer }); ws.send(JSON.stringify({ id, method, params }));
  });
}
async function ev(expression) {
  const r = await cdp('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
  if (r.exceptionDetails) throw Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text);
  return r.result.value;
}
async function shot(name) {
  const r = await cdp('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(out, name + '.png'), Buffer.from(r.data, 'base64'));
}
async function focus(x,y,d) {
  await ev(`(()=>{const p=City3D._cam();p.ctl.target.set(${x},0,${y});p.camera.position.set(${x-d*.8},${d*.65},${y+d});p.ctl.update();City3D.render();})()`);
}
(async () => {
  let target;
  for (let i=0;i<100&&!target;i++) {
    try { target=(await(await fetch(`http://127.0.0.1:${port}/json`)).json()).find(t=>t.type==='page'); } catch {}
    if (!target) await sleep(150);
  }
  assert(target, 'Chrome started'); ws=new WebSocket(target.webSocketDebuggerUrl); await new Promise(r=>ws.onopen=r);
  ws.onmessage=e=>{
    const m=JSON.parse(e.data);
    if(m.id&&pending.has(m.id)){const p=pending.get(m.id);clearTimeout(p.timer);pending.delete(m.id);m.error?p.reject(Error(m.error.message)):p.resolve(m.result);}
    else if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails.exception?.description||m.params.exceptionDetails.text);
    else if(m.method==='Log.entryAdded'&&m.params.entry.level==='error')errors.push(m.params.entry.text);
  };
  await cdp('Runtime.enable'); await cdp('Log.enable'); await cdp('Page.enable');
  await cdp('Emulation.setDeviceMetricsOverride',{width:1600,height:1000,deviceScaleFactor:1,mobile:false});
  await cdp('Page.navigate',{url:pathToFileURL(path.join(root,'index.html')).href});
  let ready=false;
  for(let i=0;i<200;i++){if(await ev('!!window.City3D?.ready')){ready=true;break;}await sleep(150);}
  assert(ready,'3D map loads'); await sleep(1200);
  // Freeze the existing simulation only in this test tab for deterministic flight and ferry phases.
  await ev('autoRot=false;rotHold=true;voiceOn=false;window.requestAnimationFrame=()=>0;'); await sleep(150);
  await ev('WX.manual="clear";night=nightTarget=0;City3D.render();');
  let stats=await ev('City3D.detailStats');
  for(const k of ['car','suv','van','cab','trailer','plane','ferry'])assert(stats.models[k]>0,k+' is rendered');
  assert(stats.bridgeClearance>.4,'ferry has clearance beneath the bridge');
  console.log('PASS native vehicles, aircraft and bridge clearance');
  const continuity=await ev(`(()=>{const d=CityDetails(THREE,new THREE.Scene(),s=>new THREE.Color(s));
    return [10,13,30,33].map(t=>{const a=d.dockPose(t-.0001),b=d.dockPose(t+.0001);
      return {distance:Math.hypot(a.x-b.x,a.y-b.y),angle:Math.abs(Math.atan2(Math.sin(a.yaw-b.yaw),Math.cos(a.yaw-b.yaw)))};});})()`);
  for(const p of continuity){assert(p.distance<.01,'truck path is continuous');assert(p.angle<.02,'truck heading is continuous');}
  assert(await ev('(()=>{const d=CityDetails(THREE,new THREE.Scene(),s=>new THREE.Color(s)); return d.dockPose(4).y-45.45>.6 && d.dockPose(36).y-45.45>.6;})()'),'through lane clears the parked cabs');
  console.log('PASS smooth docking position and heading at phase boundaries');
  await ev('document.getElementById("bScenic").click();City3D.render();');
  assert(await ev('document.getElementById("bScenic").getAttribute("aria-pressed")==="true" && getComputedStyle(document.querySelector(".welcome")).display==="none"'),'scenic view hides overlays');
  await ev('FERRY.at=-1;FERRY.y=30.5;FERRY.dir=1;City3D.render();');
  assert(await ev('City3D.detailStats.wakeVisible'),'wake while sailing');
  await focus(-11,30.5,14); await shot('bridge-clearance');
  await ev('WX.manual="storm";WX.k=1;City3D.render();');
  assert(!(await ev('City3D.detailStats.wakeVisible')),'no wake while storm service is suspended');
  await ev('WX.manual="clear";WX.k=0;FERRY.at=0;City3D.render();');
  assert(!(await ev('City3D.detailStats.wakeVisible')),'no wake at the quay');
  console.log('PASS ferry wake, docking and storm behavior');
  await ev('FLT=105;updateAirfield();City3D.render();');
  assert(await ev('City3D.detailStats.models.tug>0'),'pushback tug follows flight schedule');
  await focus(89,13,26);await shot('airport-day');
  await ev('night=nightTarget=1;City3D.render();');await shot('airport-night');
  await ev('night=nightTarget=0;time=19;City3D.render();');await focus(75.2,44.5,10);await shot('loading-docks');
  await focus(28,30,11);await shot('street-vehicles');
  await ev('document.getElementById("bScenic").click();City3D.render();');
  assert(await ev('document.getElementById("bScenic").getAttribute("aria-pressed")==="false"'),'scenic mode restores controls');
  await ev('document.getElementById("bScenic").click();document.getElementById("bDev").click();City3D.render();');
  assert(await ev('showDev && !document.body.classList.contains("scenic-view")'),'Devices leaves scenic mode and reveals sensors');
  await cdp('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});
  await ev('City3D.render();');await shot('mobile');
  assert(await ev('(()=>{const r=document.querySelector(".view-tools").getBoundingClientRect();return r.left>=0&&r.right<=innerWidth;})()'),'mobile toolbar stays inside viewport');
  console.log('PASS pushback, night rendering, scenic toggle and mobile layout');
  assert.deepEqual(errors,[],'no browser or shader errors');
  console.log('Transport checks passed. Screenshots: .tmp/transport');
})().then(()=>{chrome.kill();process.exit(0);}).catch(e=>{console.error('FAIL',e);chrome.kill();process.exit(1);});
