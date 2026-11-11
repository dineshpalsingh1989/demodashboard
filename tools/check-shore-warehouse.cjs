// Browser regression check for shoreline rendering and warehouse exploration.
// Run: node tools/check-shore-warehouse.cjs. Requires local Chrome; screenshots go to .tmp/shore-warehouse.
const { spawn } = require('node:child_process');
const fs = require('node:fs'), path = require('node:path'), assert = require('node:assert/strict');
const { pathToFileURL } = require('node:url');
const root = path.resolve(__dirname, '..'), out = path.join(root, '.tmp', 'shore-warehouse'), port = 9251;
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
  await ev(`(()=>{const p=City3D._cam();p.ctl.dispatchEvent({type:'start'});p.ctl.enableDamping=false;p.ctl.target.set(${x},0,${y});p.camera.position.set(${x-d*.8},${d*.65},${y+d});p.ctl.update();City3D.render();})()`);
}
async function ready(expression) {
  for(let i=0;i<200;i++){if(await ev(expression))return;await sleep(100);}
  throw Error('Not ready: '+expression);
}
(async()=>{
  let target;
  for(let i=0;i<100&&!target;i++) {
    try{target=(await(await fetch(`http://127.0.0.1:${port}/json`)).json()).find(t=>t.type==='page');}catch{}
    if(!target)await sleep(150);
  }
  assert(target,'Chrome started');ws=new WebSocket(target.webSocketDebuggerUrl);await new Promise(r=>ws.onopen=r);
  ws.onmessage=e=>{
    const m=JSON.parse(e.data);
    if(m.id&&pending.has(m.id)){const p=pending.get(m.id);clearTimeout(p.timer);pending.delete(m.id);m.error?p.reject(Error(m.error.message)):p.resolve(m.result);}
    else if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails.exception?.description||m.params.exceptionDetails.text);
    else if(m.method==='Log.entryAdded'&&m.params.entry.level==='error')errors.push(m.params.entry.text);
  };
  await cdp('Runtime.enable');await cdp('Log.enable');await cdp('Page.enable');
  await cdp('Emulation.setDeviceMetricsOverride',{width:1600,height:1000,deviceScaleFactor:1,mobile:false});
  await cdp('Page.navigate',{url:pathToFileURL(path.join(root,'index.html')).href});
  await ready('!!window.City3D?.ready');
  await ev(`autoRot=false;rotHold=true;voiceOn=false;WX.manual='clear';WX.k=0;night=nightTarget=0;
    document.getElementById('bScenic').click();City3D.render();window.requestAnimationFrame=()=>0;`);
  await sleep(100);
  assert(await ev('City3D.detailStats.shoreline.vertices>1000 && City3D.detailStats.shoreline.beachSegments>10'),'coastal mesh includes exposed sandy beach');
  await focus(26,await ev('LAND_Y+2'),20);await ev('time=10;City3D.render();');await shot('beach-swash');
  const before=(await cdp('Page.captureScreenshot',{format:'png',clip:{x:500,y:300,width:600,height:400,scale:1}})).data;
  await ev('time=12.5;City3D.render();');await shot('beach-receding');
  const after=(await cdp('Page.captureScreenshot',{format:'png',clip:{x:500,y:300,width:600,height:400,scale:1}})).data;
  assert.notEqual(before,after,'shoreline animation changes the rendered frame');
  if(process.argv.includes('--record-beach')) {
    const video=await ev(`new Promise(resolve=>{
      const stream=document.getElementById('city3d').captureStream(20), chunks=[];
      const recorder=new MediaRecorder(stream,{mimeType:'video/webm',videoBitsPerSecond:5000000});
      recorder.ondataavailable=e=>{if(e.data.size)chunks.push(e.data);};
      recorder.onstop=()=>{stream.getTracks().forEach(t=>t.stop());const reader=new FileReader();reader.onload=()=>resolve(reader.result.split(',')[1]);reader.readAsDataURL(new Blob(chunks,{type:'video/webm'}));};
      const start=performance.now();recorder.start();
      const timer=setInterval(()=>{time=10+(performance.now()-start)/1000;City3D.render();if(performance.now()-start>6500){clearInterval(timer);recorder.stop();}},50);
    })`);
    fs.writeFileSync(path.join(out,'beach-waves.webm'),Buffer.from(video,'base64'));
  }
  await ev('WX.manual="storm";WX.k=1;City3D.render();');await shot('beach-storm');
  await ev('WX.manual="clear";WX.k=0;night=nightTarget=1;City3D.render();');await shot('beach-night');
  console.log('PASS beach geometry, moving surf, storm and night rendering');
  if(process.argv.includes('--beach-only')) {assert.deepEqual(errors,[],'no shader errors');return;}

  await cdp('Page.navigate',{url:pathToFileURL(path.join(root,'warehouse-3d','index.html')).href});
  await ready("performance.getEntriesByName('wh:first-frame').length>0");
  await sleep(300);await shot('warehouse-overview');
  assert(await ev('WH.S.sensors.length===30 && !WH.S.overhead.visible'),'all 30 sensors remain and cutaway is default');
  await ev('document.getElementById("bClean").click()');
  assert(await ev('document.body.classList.contains("clean-view") && WH.S.sensors.every(s=>{let visible=false;s.g.traverse(o=>{if(o.userData.sensorIcon&&o.visible)visible=true;});return !visible;})'),'scenic view hides sensor icons');
  for(const view of ['aisles','docks','cold']) {
    await ev(`document.getElementById('cameraView').value='${view}';document.getElementById('cameraView').dispatchEvent(new Event('change'));`);
    await sleep(1800);await shot('warehouse-'+view);
  }
  await ev('document.getElementById("bStructure").click();document.getElementById("bNight").click();');
  await sleep(1600);await shot('warehouse-night');
  assert(await ev('WH.S.overhead.visible'),'roof frame toggle works');
  await ev('document.getElementById("bClean").click();');
  assert(await ev('!document.body.classList.contains("clean-view") && showSensors'),'scenic view restores panels and sensor preference');
  for(const site of [1,2,0]) {
    await ev(`WH.switchSite(${site})`);
    assert(await ev(`WH.S.site===WH.SITES[${site}] && WH.S.sensors.length===24+WH.S.docks.length && WH.S.overhead.visible`),'site switch preserves controls and sensors');
  }
  await ev('document.getElementById("bNight").click();document.getElementById("bStructure").click();document.getElementById("bView").click();');
  await cdp('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});
  await sleep(300);await shot('warehouse-mobile');
  assert(await ev('document.documentElement.scrollWidth<=innerWidth'),'mobile has no page overflow');
  assert(await ev('(()=>{const a=document.getElementById("cmd").getBoundingClientRect();return a.left>=0&&a.right<=innerWidth;})()'),'mobile controls stay in viewport');
  assert.deepEqual(errors,[],'no browser or shader errors');
  console.log('PASS warehouse views, roof frame, scenic mode, all three sites, installed sensors and mobile layout');
  console.log('Screenshots: .tmp/shore-warehouse');
})().then(()=>{chrome.kill();process.exit(0);}).catch(e=>{console.error('FAIL',e);chrome.kill();process.exit(1);});
