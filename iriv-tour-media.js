// Shared presentation and build helpers for both IRIV tours.
function drawTourFooter(ctx, i, t) {
  ctx.save(); ctx.font = `600 22px ${FONT}`; ctx.fillStyle = '#646469'; ctx.textBaseline = 'alphabetic';
  ctx.textAlign = 'left'; ctx.fillText(NARRATION.product, 120, 1010);
  ctx.textAlign = 'right'; ctx.fillText(`${String(i + 1).padStart(2, '0')} / ${SCENES.length}`, 1800, 1010);
  ctx.fillStyle = '#e8e8ed'; ctx.fillRect(120, 1030, 1680, 4); ctx.fillStyle = ACCENT; ctx.fillRect(120, 1030, 1680 * Math.min(1, t / TOTAL), 4);
  ctx.restore();
}

function drawTourEnd(ctx, u) {
  const a = ease(u / .6);
  ctx.save(); ctx.globalAlpha = a; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = ACCENT; ctx.font = `700 30px ${FONT}`; ctx.fillText(NARRATION.product, 960, 190);
  ctx.fillStyle = INK; ctx.font = `800 88px ${FONT}`; ctx.fillText('Build your next system.', 960, 315);
  ctx.font = `500 40px ${FONT}`; ctx.fillStyle = '#515159';
  ctx.fillText('Explore connections and compatible accessories.', 960, 405);
  const steps = ['Explore every port', 'Choose compatible parts', 'Compare both controllers'];
  steps.forEach((label, i) => {
    const x = 180 + i * 540;
    ctx.beginPath(); rr(ctx, x, 490, 500, 150, 24); ctx.fillStyle = '#f5f5f7'; ctx.fill();
    ctx.fillStyle = ACCENT; ctx.font = `800 32px ${FONT}`; ctx.fillText(String(i + 1).padStart(2, '0'), x + 250, 543);
    ctx.fillStyle = INK; ctx.font = `700 28px ${FONT}`; ctx.fillText(label, x + 250, 595);
  });
  ctx.fillStyle = '#1d1d1f'; ctx.beginPath(); rr(ctx, 300, 715, 1320, 125, 26); ctx.fill();
  ctx.fillStyle = '#fff'; ctx.font = `700 36px ${FONT}`; ctx.fillText('dineshpalsingh1989.github.io/demodashboard', 960, 768);
  ctx.fillStyle = '#e3e3e8'; ctx.font = `500 27px ${FONT}`; ctx.fillText('Open “IRIV controllers” in the demo', 960, 811);
  ctx.restore();
}

function drawTerminalDetail(ctx, s, a) {
  const pins = TERMINALS.filter(p => p.group === s.g);
  if (!pins.length) return false;
  const g = G[s.g], xs = [...new Set(pins.map(p => p.x))].sort((a,b)=>a-b);
  const rows = [...new Set(pins.map(p=>p.row))], two = rows.length === 2;
  ctx.save(); ctx.globalAlpha = a;
  ctx.beginPath(); rr(ctx, 870, 230, 930, 590, 32); ctx.fillStyle = '#f5f5f7'; ctx.fill();
  ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic'; ctx.fillStyle = g.color; ctx.font = `700 25px ${FONT}`;
  ctx.fillText('FRONT PANEL · CONNECTOR DETAIL', 915, 290);
  const cellW = Math.min(180, 800 / xs.length), start = 1335 - (xs.length - 1) * cellW / 2;
  pins.forEach(p => {
    const x = start + xs.indexOf(p.x) * cellW, y = two ? (p.row === 'top' ? 450 : 650) : 535;
    ctx.beginPath(); rr(ctx, x - cellW * .43, y - 66, cellW * .86, 125, 14); ctx.fillStyle = '#26282d'; ctx.fill();
    ctx.fillStyle = '#f58a38'; ctx.fillRect(x - cellW * .26, y - 54, cellW * .52, 15);
    ctx.beginPath(); ctx.arc(x, y + 6, 25, 0, Math.PI * 2); ctx.fillStyle = '#090b10'; ctx.fill(); ctx.strokeStyle = '#6b707b'; ctx.lineWidth = 3; ctx.stroke();
    ctx.fillStyle = g.color; ctx.textAlign = 'center'; ctx.font = `700 26px ${FONT}`;
    ctx.fillText(p.name.replace('RS485 ', '').replace('RS232 ', ''), x, y + 105);
  });
  ctx.textAlign = 'center'; ctx.font = `500 25px ${FONT}`; ctx.fillStyle = '#555560';
  ctx.fillText(two ? 'Top and bottom rows · viewed from the front' : `${rows[0] === 'top' ? 'Top' : 'Bottom'} row · left to right`, 1335, 785);
  ctx.restore(); return true;
}

function drawTourDetail(ctx, s, u, t) {
  const a = ease(u / .55);
  if (!drawTerminalDetail(ctx, s, a)) {
    // Keep the photograph near native resolution and outside the text column.
    const g = G[s.g], x0 = Math.min(...g.rects.map(r=>r[0])), y0 = Math.min(...g.rects.map(r=>r[1])), x1 = Math.max(...g.rects.map(r=>r[2])), y1 = Math.max(...g.rects.map(r=>r[3]));
    const z = Math.min(1.7, 760 / (x1 - x0 + 140), 600 / (y1 - y0 + 140));
    const camera = { img: s.img, cx: (x0+x1)/2, cy: (y0+y1)/2, z, vx: 1335, vy: 540 };
    ctx.save(); ctx.beginPath(); ctx.rect(850, 180, 990, 730); ctx.clip();
    drawImage(ctx, camera, a); drawGroup(ctx, camera, g, a, t); ctx.restore();
  }
  drawText(ctx, s, a, sceneAt(t));
}

function initTourPlayer() {
  const video = document.getElementById('tour-video'), chapters = document.getElementById('chapters');
  const fmt = s => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
  const playAt = time => { video.currentTime = time; video.play().catch(()=>{}); };
  chapters.innerHTML = SCENES.map((s, i) => `<button data-i="${i}" aria-label="${s.title}, ${fmt(s.t0)}">${s.g ? G[s.g].name : i === 0 ? 'Intro' : i === SCENES.length - 1 ? 'Explore more' : s.kicker}</button>`).join('');
  chapters.addEventListener('click', e => { const b = e.target.closest('[data-i]'); if (b) playAt(SCENES[+b.dataset.i].t0); });
  video.addEventListener('timeupdate', () => { const current = sceneAt(video.currentTime); chapters.querySelectorAll('button').forEach((b,i)=>{b.classList.toggle('on', i===current); if(i===current)b.setAttribute('aria-current','true');else b.removeAttribute('aria-current');}); });
  video.addEventListener('play', () => document.querySelectorAll('video').forEach(other => { if(other!==video)other.pause(); }));
  video.addEventListener('ended', () => document.getElementById('film-next').classList.add('finished'));
  video.addEventListener('seeking', () => { if (video.currentTime < video.duration - .25) document.getElementById('film-next').classList.remove('finished'); });
  const transcript = document.getElementById('tour-transcript');
  NARRATION.scenes.forEach((s,i)=>{ const p=document.createElement('p'),b=document.createElement('button');b.type='button';b.textContent=fmt(s.start);b.setAttribute('aria-label',`Jump to ${SCENES[i].title}`);b.onclick=()=>playAt(s.start);p.append(b,document.createTextNode(s.text));transcript.append(p); });
  video.addEventListener('error', () => { document.getElementById('film-status').textContent='The film could not load. Try the MP4 download below.'; });
}

// Build-time encoder. The published player uses the completed MP4 in every browser.
async function exportNarratedTour(onProgress = () => {}) {
  await filmReady;
  if (!window.Mp4Muxer) await new Promise((resolve,reject)=>{const script=document.createElement('script');script.src='../tools/vendor/mp4-muxer.js';script.onload=resolve;script.onerror=reject;document.head.appendChild(script);});
  const audioConfig = { codec:'mp4a.40.2',sampleRate:48000,numberOfChannels:1,bitrate:96000 };
  if (!window.AudioEncoder || !(await AudioEncoder.isConfigSupported(audioConfig)).supported) throw Error('AAC encoding is unavailable. Use Chrome on Windows to build the narrated MP4.');
  let codec;
  for (const candidate of ['avc1.640028','avc1.4d0028','avc1.42e028']) if ((await VideoEncoder.isConfigSupported({codec:candidate,width:FW,height:FH,bitrate:5e6,framerate:FPS})).supported) {codec=candidate;break;}
  if (!codec) throw Error('H.264 encoding is unavailable.');
  const response=await fetch(NARRATION.audio); if(!response.ok)throw Error('Narration audio is missing');
  const audioContext=new OfflineAudioContext(1,48000,48000), buffer=await audioContext.decodeAudioData(await response.arrayBuffer()), samples=buffer.getChannelData(0);if(buffer.numberOfChannels!==1||Math.abs(buffer.duration-TOTAL)>1)throw Error('Narration must be mono and match the film length ('+TOTAL.toFixed(1)+' s), got '+buffer.numberOfChannels+' ch / '+buffer.duration.toFixed(1)+' s');
  const muxer=new Mp4Muxer.Muxer({target:new Mp4Muxer.ArrayBufferTarget(),video:{codec:'avc',width:FW,height:FH,frameRate:FPS},audio:{codec:'aac',sampleRate:48000,numberOfChannels:1},fastStart:'in-memory',firstTimestampBehavior:'offset'});
  let failure;
  const aenc=new AudioEncoder({output:(chunk,meta)=>muxer.addAudioChunk(chunk,meta),error:e=>{failure=e;}});
  const venc=new VideoEncoder({output:(chunk,meta)=>muxer.addVideoChunk(chunk,meta),error:e=>{failure=e;}});
  try {
    aenc.configure(audioConfig);
    for(let i=0;i<samples.length;i+=1024){const data=samples.slice(i,Math.min(samples.length,i+1024));const frame=new AudioData({format:'f32',sampleRate:48000,numberOfFrames:data.length,numberOfChannels:1,timestamp:Math.round(i/48000*1e6),data});aenc.encode(frame);frame.close();if(aenc.encodeQueueSize>20)await aenc.flush();if(failure)throw failure;}
    await aenc.flush();
    const cv=document.createElement('canvas');cv.width=FW;cv.height=FH;const ctx=cv.getContext('2d');
    venc.configure({codec,width:FW,height:FH,bitrate:5e6,framerate:FPS});
    const count=Math.round(TOTAL*FPS);
    for(let i=0;i<count;i++){
      if(failure)throw failure;render(ctx,i/FPS);
      const frame=new VideoFrame(cv,{timestamp:Math.round(i/FPS*1e6),duration:Math.round(1e6/FPS)});
      venc.encode(frame,{keyFrame:i%(FPS*2)===0});frame.close();
      while(venc.encodeQueueSize>8)await new Promise(r=>setTimeout(r,2));
      if(i%30===0){onProgress(i/count);await new Promise(r=>setTimeout(r,0));}
    }
    await venc.flush();if(failure)throw failure;muxer.finalize();onProgress(1);
    return new Blob([muxer.target.buffer],{type:'video/mp4'});
  } finally { if(aenc.state!=='closed')aenc.close();if(venc.state!=='closed')venc.close(); }
}
