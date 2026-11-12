// Rebuild both narrated MP4s with Chrome/WebCodecs. No npm installation required.
// Use --preview to inspect scene frames without encoding. Generated previews live in .tmp/.
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {spawn}=require('node:child_process');
const root=path.resolve(__dirname,'..'),out=path.join(root,'.tmp/video-build'),port=9258;
fs.mkdirSync(out,{recursive:true});
const preview=process.argv.includes('--preview'), check=process.argv.includes('--check'), only=process.argv.find(x=>x.startsWith('--only='))?.split('=')[1];
let chrome,ws,server,seq=0;const pending=new Map(),errors=[];
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const cdp=(method,params={})=>new Promise((resolve,reject)=>{const id=++seq,timer=setTimeout(()=>{pending.delete(id);reject(Error('Timeout '+method));},45000);pending.set(id,{resolve,reject,timer});ws.send(JSON.stringify({id,method,params}));});
async function ev(expression){const r=await cdp('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(r.exceptionDetails.exception?.description||r.exceptionDetails.text);return r.result.value;}
async function waitFor(expression){for(let i=0;i<300;i++){if(await ev(expression))return;await sleep(100);}throw Error('Timed out: '+expression);}
const tours=[['pi','short-video-of-iriv-pi','IRIV-PiControl-tour'],['edge','short-video-of-iriv-edgeai','IRIV-EdgeAI-CM5-tour'],['hub','short-video-of-iriv-hub','IRIV-Edge-dashboard-tour'],['smarthub','short-video-of-iriv-smarthub','IRIV-SmartHub-CM5-tour'],['ioc','short-video-of-iriv-ioc','IRIV-IO-Controller-MQTT-tour'],['iocvib','short-video-of-iriv-ioc-vibration','IRIV-IOC-883M-vibration-tour']].filter(([key])=>!only||only===key);
async function main(){
 const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.mp4':'video/mp4','.wav':'audio/wav','.vtt':'text/vtt; charset=utf-8','.png':'image/png','.webp':'image/webp','.jpg':'image/jpeg','.json':'application/json'};
 server=http.createServer((req,res)=>{
  const write=tours.find(([key])=>req.method==='POST'&&req.url===`/__build/${key}`);
  if(write){const stream=fs.createWriteStream(path.join(out,write[2]+'.mp4'));req.pipe(stream);stream.on('finish',()=>res.end('saved'));stream.on('error',()=>{res.writeHead(500);res.end();});return;}
  const rel=decodeURIComponent(req.url.split('?')[0]),file=path.resolve(root,'.'+(rel.endsWith('/')?rel+'index.html':rel));
  if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404);return res.end();}
  const size=fs.statSync(file).size,range=req.headers.range?.match(/^bytes=(\d+)-(\d*)$/);
  res.setHeader('Content-Type',types[path.extname(file)]||'application/octet-stream');res.setHeader('Cache-Control','no-store');res.setHeader('Accept-Ranges','bytes');
  if(range){const start=Number(range[1]),end=range[2]?Math.min(Number(range[2]),size-1):size-1;if(start>=size){res.writeHead(416);return res.end();}res.writeHead(206,{'Content-Range':`bytes ${start}-${end}/${size}`,'Content-Length':end-start+1});fs.createReadStream(file,{start,end}).pipe(res);}
  else{res.setHeader('Content-Length',size);fs.createReadStream(file).pipe(res);}
 });
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const url=`http://127.0.0.1:${server.address().port}`;
 chrome=spawn(process.env.CHROME||'C:/Program Files/Google/Chrome/Application/chrome.exe',['--headless=new','--no-first-run','--no-sandbox','--disable-background-networking','--autoplay-policy=no-user-gesture-required',`--remote-debugging-port=${port}`,'--user-data-dir='+path.join(out,'chrome'),'about:blank'],{stdio:'ignore',windowsHide:true});
 let page;for(let i=0;i<100;i++){try{page=(await fetch(`http://127.0.0.1:${port}/json`).then(r=>r.json())).find(p=>p.type==='page');if(page)break;}catch{}await sleep(100);}assert(page,'Chrome did not start');
 ws=new WebSocket(page.webSocketDebuggerUrl);ws.onmessage=({data})=>{const m=JSON.parse(data),p=pending.get(m.id);if(p){clearTimeout(p.timer);pending.delete(m.id);m.error?p.reject(Error(m.error.message)):p.resolve(m.result);}else if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails.exception?.description||m.params.exceptionDetails.text);};
 await new Promise((r,j)=>{ws.onopen=r;ws.onerror=j;});await cdp('Runtime.enable');await cdp('Page.enable');
 for(const [key,folder,base] of tours){
  await cdp('Page.navigate',{url:`${url}/${folder}/`});await waitFor("typeof SCENES !== 'undefined' && typeof filmReady !== 'undefined'");await ev('filmReady.then(()=>true)');
  assert.deepEqual(errors,[],'Page errors');
  const info=await ev('({duration:TOTAL,scenes:SCENES.map(s=>({title:s.title,start:s.t0,duration:s.d}))})');
  console.log(key,`${info.duration.toFixed(2)} seconds; ${info.scenes.length} scenes`);
  if(check){await checkTour(key,folder,url);continue;}
  await ev("window.reviewCanvas=document.createElement('canvas');reviewCanvas.width=1920;reviewCanvas.height=1080;window.reviewContext=reviewCanvas.getContext('2d');");
  const frames=key==='iocvib'?[2,SCENE_TIME('chain',3),SCENE_TIME('chain',12),SCENE_TIME('sensor',4),SCENE_TIME('rs485',4),SCENE_TIME('setup',4),SCENE_TIME('viking',5),SCENE_TIME('do',4),SCENE_TIME('alarm',6),SCENE_TIME('alarm',12),SCENE_TIME('rule',5),SCENE_TIME('outro',4)]:key==='ioc'?[2,SCENE_TIME('pump',6),SCENE_TIME('pump',12),SCENE_TIME('front',4),SCENE_TIME('rs485',3),SCENE_TIME('di',3),SCENE_TIME('do',3),SCENE_TIME('status',3),SCENE_TIME('switches',3),SCENE_TIME('machine',6),SCENE_TIME('setup',4),SCENE_TIME('din',3)]:key==='smarthub'?[2,SCENE_TIME('pos',4),SCENE_TIME('pos',12),SCENE_TIME('rear',3),SCENE_TIME('hdmi',3),SCENE_TIME('leds',3),SCENE_TIME('cell',3),SCENE_TIME('signage',5),SCENE_TIME('mes',6),SCENE_TIME('mount',3),SCENE_TIME('proof',3)]:key==='hub'?[2,SCENE_TIME('find',3),SCENE_TIME('rules',3),SCENE_TIME('failover',3),SCENE_TIME('control',3),SCENE_TIME('outro',3)]:key==='edge'?[2,SCENE_TIME('inspection',3),SCENE_TIME('inspection',8),SCENE_TIME('inspection',16),SCENE_TIME('power',3),SCENE_TIME('di',3),SCENE_TIME('cams',3),SCENE_TIME('outro',3)]:[2,SCENE_TIME('power',3),SCENE_TIME('di',3),SCENE_TIME('usb',3),SCENE_TIME('expand',3),SCENE_TIME('outro',3)];
  for(let i=0;i<frames.length;i++){
   const time=typeof frames[i]==='number'?frames[i]:await ev(frames[i]);
   const data=await ev(`render(reviewContext,${time});reviewCanvas.toDataURL('image/png').split(',')[1]`);
   fs.writeFileSync(path.join(out,`${key}-frame-${i}.png`),Buffer.from(data,'base64'));
  }
  const poster=await ev("render(reviewContext,2.2);reviewCanvas.toDataURL('image/jpeg',.93).split(',')[1]");
  fs.writeFileSync(path.join(root,folder,'images/tour-poster.jpg'),Buffer.from(poster,'base64'));
  const comparePoster={pi:'poster-picontrol.jpg',edge:'poster-edgeai.jpg'}[key];if(comparePoster)fs.writeFileSync(path.join(root,'iriv-controllers/images',comparePoster),Buffer.from(poster,'base64'));
  if(!preview){
   await ev(`window.buildState={progress:0};exportVideo(p=>{buildState.progress=p;}).then(async blob=>{const r=await fetch('/__build/${key}',{method:'POST',body:blob});if(!r.ok)throw Error('Saving MP4 failed');buildState.done=true;buildState.bytes=blob.size;}).catch(e=>{buildState.error=e.message;});true`);
   let last=-1;for(let i=0;i<1800;i++){const state=await ev('buildState');if(state.error)throw Error(state.error);if(state.done){console.log('ENCODED',key,state.bytes);break;}const pct=Math.floor(state.progress*10)*10;if(pct!==last){console.log('ENCODING',key,pct+'%');last=pct;}if(i===1799)throw Error('Export timeout');await sleep(1000);}
   // Validate the exported file before replacing the previous deliverable.
   const file=path.join(out,base+'.mp4'),data=fs.readFileSync(file);assert(data.length>100000);assert(data.includes(Buffer.from('soun')),'Missing audio track');assert(data.includes(Buffer.from('vide')),'Missing video track');
   fs.copyFileSync(file,path.join(root,folder,base+'.mp4'));
   console.log('SAVED',folder+'/'+base+'.mp4');
  }
 }
 if(check){
  await cdp('Page.navigate',{url:url+'/iriv-controllers/'});await waitFor('document.querySelectorAll("video").length===2');
  await ev("Promise.all([...document.querySelectorAll('video')].map(v=>new Promise(r=>{if(v.readyState>=1)r();else v.onloadedmetadata=r;})))");
  const durations=await ev("[...document.querySelectorAll('video')].map(v=>({duration:v.duration,tracks:v.textTracks.length}))");
  assert(durations.every(v=>v.duration>100&&v.tracks===1),'Comparison videos must use narrated exports and captions');
  for(const width of [1440,390]){await cdp('Emulation.setDeviceMetricsOverride',{width,height:1000,deviceScaleFactor:1,mobile:width<600});assert(await ev('document.documentElement.scrollWidth<=innerWidth'),'Comparison page horizontal overflow');}
  console.log('PASS controller comparison video sources and responsive layout');
 }
 assert.deepEqual(errors,[],'Page errors');
 console.log('PASS scene rendering and page initialization');
}
async function checkTour(key,folder,url){
 if(key==='iocvib'){
  await ev("document.querySelector('[data-wire=alarm]').click()");
  assert(await ev("document.querySelector('[data-path=alarm]').classList.contains('active') && !document.querySelector('[data-path=power]').classList.contains('active')"),'Wiring selection');
  await ev("document.querySelector('[data-view=spectrum]').click();document.getElementById('sample-level').value='1.5';document.getElementById('sample-level').dispatchEvent(new Event('input'))");
  assert(await ev("document.getElementById('sample-scope').getAttribute('aria-label').includes('1.5') && document.getElementById('sample-scope').getAttribute('aria-label').includes('spectrum')"),'Sample spectrum and amplitude');
  await ev("document.querySelector('[data-step=\"3\"]').click()");
  assert(await ev("document.getElementById('setup-next').disabled && document.getElementById('setup-title').textContent==='Test the alarm'"),'Guided setup final step');
  await ev("document.getElementById('setup-prev').click()");
  assert(await ev("document.getElementById('setup-title').textContent==='Configure the gateway'"),'Guided setup previous');
  console.log('PASS interactive wiring, sample charts and guided setup');
 }
 await waitFor("document.getElementById('tour-video').readyState>=2");
 const meta=await ev("(()=>{const v=document.getElementById('tour-video');return {duration:v.duration,width:v.videoWidth,height:v.videoHeight,controls:v.controls,muted:v.muted,tracks:v.textTracks.length}})()");
 const total=await ev('TOTAL');assert(Math.abs(meta.duration-total)<.15,'Audio/video duration mismatch');assert.equal(meta.width,1920);assert.equal(meta.height,1080);assert(meta.controls&&!meta.muted&&meta.tracks===1);
 await waitFor("document.getElementById('tour-video').textTracks[0].cues?.length>0");
 const cues=await ev("[...document.getElementById('tour-video').textTracks[0].cues].map(c=>({start:c.startTime,end:c.endTime,text:c.text}))");
 assert(cues.every((c,i)=>c.end>c.start&&c.end<=total&&(!i||c.start>=cues[i-1].end)),'Caption timing');
 assert(cues.every(c=>c.text.split(/\s+/).length<=8),'Captions should be short');
 await ev("document.getElementById('tour-video').currentTime=.6;document.getElementById('tour-video').play()");await sleep(1300);
 const playback=await ev("(()=>{const v=document.getElementById('tour-video');v.pause();return {time:v.currentTime,audio:v.webkitAudioDecodedByteCount,frames:v.getVideoPlaybackQuality().totalVideoFrames}})()");
 assert(playback.time>1&&playback.audio>0&&playback.frames>0,'Narrated MP4 must decode audio and video');
 await ev("document.querySelector('#chapters button[data-i=\"4\"]').click()");await sleep(300);
 assert(await ev("Math.abs(document.getElementById('tour-video').currentTime-SCENES[4].t0)<1"),'Chapter seeking');
 await ev("document.getElementById('tour-video').pause();document.querySelector('.transcript').open=true;document.querySelector('#tour-transcript button').click()");await sleep(200);
 assert(await ev("document.getElementById('tour-video').currentTime<1"),'Transcript seeking');await ev("document.getElementById('tour-video').pause();document.querySelector('.transcript').open=false");
 await ev("document.getElementById('tour-video').currentTime=TOTAL-.25;document.getElementById('tour-video').play()");await waitFor("document.getElementById('film-next').classList.contains('finished')");
 assert.equal(await ev("document.querySelector('#film-next a').hash"),'#connect');
 // Seek to representative captions, verify end-card and phone presentation.
 await ev("document.getElementById('tour-video').currentTime=NARRATION.scenes[2].start+1.5");await sleep(250);
 for(const width of [1440,390]){
  await cdp('Emulation.setDeviceMetricsOverride',{width,height:1000,deviceScaleFactor:1,mobile:width<600});
  if(key==='iocvib'){
   await ev('window.scrollTo({top:0,behavior:"instant"})');await sleep(200);
   const hero=await cdp('Page.captureScreenshot',{format:'png'});fs.writeFileSync(path.join(out,`${key}-hero-${width}.png`),Buffer.from(hero.data,'base64'));
  }
  await ev("document.getElementById('screen').scrollIntoView({block:'center',behavior:'instant'})");await sleep(250);
  assert(await ev('document.documentElement.scrollWidth<=innerWidth'),key+' horizontal overflow');
  const image=await cdp('Page.captureScreenshot',{format:'png'});fs.writeFileSync(path.join(out,`${key}-player-${width}.png`),Buffer.from(image.data,'base64'));
  if(key==='iocvib'){
   await ev("document.getElementById('connect').scrollIntoView({block:'start',behavior:'instant'})");await sleep(180);
   const wiring=await cdp('Page.captureScreenshot',{format:'png'});fs.writeFileSync(path.join(out,`${key}-wiring-${width}.png`),Buffer.from(wiring.data,'base64'));
   await ev("document.getElementById('measurements').scrollIntoView({block:'start',behavior:'instant'})");await sleep(180);
   const scope=await cdp('Page.captureScreenshot',{format:'png'});fs.writeFileSync(path.join(out,`${key}-scope-${width}.png`),Buffer.from(scope.data,'base64'));
  }
 }
 if(key==='edge'){
  await cdp('Emulation.setDeviceMetricsOverride',{width:1440,height:1000,deviceScaleFactor:1,mobile:false});
  await ev("document.getElementById('demo-canvas').scrollIntoView({block:'center',behavior:'instant'});demoPaused=true;syncPause()");await sleep(250);
  for(let phase=0;phase<3;phase++){
   await ev(`document.querySelector('[data-phase="${phase}"]').click()`);await sleep(150);
   assert(await ev(`demoPaused&&inspectionState(demoT).phase===${phase}`),'Stage control '+phase);
   assert(await ev(`document.querySelector('[data-phase="${phase}"]').getAttribute('aria-pressed')==='true'`),'Stage button state');
  }
  const pausedAt=await ev('demoT');await sleep(250);assert.equal(await ev('demoT'),pausedAt,'Pause must stop the sequence');
  await ev("document.getElementById('demo-replay').click()");assert(await ev('demoT<.3&&!demoPaused'),'Replay must restart and play');
  await sleep(200);assert(await ev('demoT>0&&!demoPaused'));
  await ev("document.getElementById('demo-pause').click();document.querySelector('[data-demo=gate]').click()");await sleep(150);
  assert(await ev("demoMode==='gate'&&document.getElementById('inspection-controls').hidden"),'Gate demo switching');
  await ev("document.querySelector('[data-demo=factory]').click();document.querySelector('[data-phase=\"1\"]').click()");await sleep(150);
  for(const width of [1440,390]){
   await cdp('Emulation.setDeviceMetricsOverride',{width,height:1000,deviceScaleFactor:1,mobile:width<600});await ev("document.getElementById('demo-canvas').scrollIntoView({block:'center',behavior:'instant'})");await sleep(250);
   assert(await ev('document.documentElement.scrollWidth<=innerWidth'),'Demo horizontal overflow');const image=await cdp('Page.captureScreenshot',{format:'png'});fs.writeFileSync(path.join(out,`edge-demo-${width}.png`),Buffer.from(image.data,'base64'));
  }
  await cdp('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});await cdp('Page.reload');await waitFor("typeof demoPaused!=='undefined'");assert(await ev('demoPaused'),'Reduced-motion preference must pause the live demo');await cdp('Emulation.setEmulatedMedia',{features:[]});
 }
 console.log('PASS',key,'audio/video decode, captions, seeking, end-card links and desktop/mobile controls',JSON.stringify(meta));
}
function SCENE_TIME(id,offset){return `NARRATION.scenes.find(s=>s.id===${JSON.stringify(id)}).start+${offset}`;}
main().then(()=>{ws?.close();chrome?.kill();server?.close();}).catch(e=>{console.error(e);if(errors.length)console.error(errors);ws?.close();chrome?.kill();server?.close();process.exitCode=1;});
