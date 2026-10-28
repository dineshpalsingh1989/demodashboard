// The film: a 1920×1080 canvas animation drawn purely from the time t, so it can play live or be
// rendered frame by frame into an MP4 with WebCodecs (smooth on any machine).

const FW = 1920, FH = 1080, FPS = 30;
const FONT = 'Inter, "Segoe UI", system-ui, sans-serif';
const INK = '#1d1d1f', MUTED = '#6e6e73', ACCENT = '#f56300';

const SCENES = [
  { d: 4.5, img: 'front', cam: [500, 470, 1.05], layout: 'hero', kicker: 'Cytron Technologies · IR4.0', title: 'IRIV PiControl', body: 'An industrial controller with a Raspberry Pi inside.' },
  { d: 5.5, img: 'front', cam: [520, 600, 1.45], layout: 'top', kicker: 'Front panel', title: 'Every connection. One face.', body: '32 push-in terminals, two Ethernet ports, status LEDs and built-in Wi-Fi.',
    all: { power: ['t', 50], rs485: ['t', 110], do: ['t', 50], di: ['t', 110], an: ['t', 50], lan: ['t', 50], rs232: ['b', 50], status: ['b', 50], wifi: ['s', 0] } },
  { d: 4.2, g: 'power', cam: [362, 660, 3.6] },
  { d: 4.2, g: 'rs485', cam: [392, 655, 3.6] },
  { d: 4.2, g: 'rs232', cam: [392, 662, 3.6] },
  { d: 4.5, g: 'do', cam: [446, 659, 3.4] },
  { d: 4.5, g: 'di', cam: [527, 659, 3.4] },
  { d: 4.8, g: 'an', cam: [593, 659, 3.4] },
  { d: 4.5, g: 'lan', cam: [730, 655, 2.8] },
  { d: 4.8, g: 'status', cam: [300, 680, 3.8] },
  { d: 4.5, g: 'wifi', cam: [190, 470, 1.2] },
  { d: 4.8, g: 'usb', cam: [420, 735, 2.3], kicker: 'Side panel' },
  { d: 4.8, g: 'usbc', cam: [560, 715, 1.8], kicker: 'Side panel' },
  { d: 4.5, img: 'inside', cam: [510, 560, 1.3], layout: 'side', kicker: 'Inside', title: 'Open it up.', body: 'Expansion sockets, a display and security hardware inside a fanless metal case.',
    all: { oled: ['t', 50], expand: ['t', 50], rtc: ['b', 50] } },
  { d: 4.5, g: 'oled', cam: [241, 500, 2.6], kicker: 'Inside' },
  { d: 4.8, g: 'expand', cam: [560, 535, 2.5], kicker: 'Inside' },
  { d: 4.8, g: 'rtc', cam: [440, 515, 2.4], kicker: 'Inside' },
  { d: 5.5, layout: 'specs', kicker: 'The brains', title: 'Raspberry Pi CM4 or CM5.' },
  { d: 5, img: 'front', cam: [500, 470, 1.05], layout: 'hero', kicker: 'Built for the field', title: 'IRIV PiControl', body: 'Python · Node-RED · Grafana · CODESYS · Ignition', foot: 'cytron.io' }
].map(s => {
  if (!s.g) return s;
  const g = G[s.g];
  return { img: g.img, layout: 'side', kicker: s.kicker || 'Front panel', title: g.title, body: g.body, chips: g.chips, ...s };
});
let acc = 0;
SCENES.forEach(s => { s.t0 = acc; acc += s.d; });
const TOTAL = acc;
const VIEW = { hero: [960, 640], top: [960, 720], side: [1260, 560] };

const IMGS = {};
const filmReady = Promise.all([
  ...Object.entries(IMG).map(([k, src]) => new Promise((res, rej) => { const im = new Image(); im.onload = () => { IMGS[k] = im; res(); }; im.onerror = rej; im.src = src; })),
  document.fonts ? Promise.all(['400', '600', '700', '800'].map(w => document.fonts.load(`${w} 40px Inter`))).catch(() => {}) : null
]);

const clamp = v => Math.max(0, Math.min(1, v));
const ease = v => { v = clamp(v); return v < .5 ? 4 * v * v * v : 1 - Math.pow(-2 * v + 2, 3) / 2; };
const lerp = (a, b, p) => a + (b - a) * p;
const sceneAt = t => { let i = SCENES.length - 1; while (i > 0 && SCENES[i].t0 > t) i--; return i; };

function camOf(s) { const v = VIEW[s.layout] || VIEW.side; return { img: s.img, cx: s.cam[0], cy: s.cam[1], z: s.cam[2], vx: v[0], vy: v[1] }; }
const toScreen = (c, x, y) => [c.vx + (x - c.cx) * c.z, c.vy + (y - c.cy) * c.z];

function drawImage(ctx, c, alpha) {
  if (!c.img || !IMGS[c.img] || alpha <= 0) return;
  ctx.save(); ctx.globalAlpha = alpha; ctx.imageSmoothingQuality = 'high';
  ctx.translate(c.vx, c.vy); ctx.scale(c.z, c.z); ctx.translate(-c.cx, -c.cy);
  ctx.drawImage(IMGS[c.img], 0, 0);
  ctx.restore();
}

function rr(ctx, x, y, w, h, r) { ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }

function pill(ctx, x, y, text, bg, fg = '#fff', size = 22) {
  ctx.font = `700 ${size}px ${FONT}`;
  const w = ctx.measureText(text).width + size * 1.1, h = size * 1.75;
  ctx.beginPath(); rr(ctx, x - w / 2, y - h / 2, w, h, h / 2); ctx.fillStyle = bg; ctx.fill();
  ctx.fillStyle = fg; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(text, x, y + 1);
  return [w, h];
}

// Highlight one group: dim everything else, outline its area, ring each pin and label it.
function drawGroup(ctx, c, g, a, t) {
  if (a <= 0) return;
  const rects = g.rects.map(([x0, y0, x1, y1]) => { const [a0, b0] = toScreen(c, x0, y0), [a1, b1] = toScreen(c, x1, y1); return [a0, b0, a1 - a0, b1 - b0]; });
  ctx.save();
  ctx.beginPath(); ctx.rect(0, 0, FW, FH); rects.forEach(([x, y, w, h]) => rr(ctx, x - 6, y - 6, w + 12, h + 12, 14));
  ctx.fillStyle = `rgba(255,255,255,${.62 * a})`; ctx.fill('evenodd');
  ctx.globalAlpha = a; ctx.strokeStyle = g.color; ctx.lineWidth = 3.5; ctx.shadowColor = g.color; ctx.shadowBlur = 22;
  rects.forEach(([x, y, w, h]) => { ctx.beginPath(); rr(ctx, x - 6, y - 6, w + 12, h + 12, 14); ctx.stroke(); });
  ctx.shadowBlur = 0;
  const pulse = .5 + .5 * Math.sin(t * 5);
  (g.pins || []).forEach(p => (p.pair || [p.x]).forEach(px => {
    const [sx, sy] = toScreen(c, px, p.y);
    ctx.beginPath(); ctx.arc(sx, sy, 7 * c.z, 0, 7); ctx.lineWidth = 3; ctx.strokeStyle = g.color; ctx.stroke();
    ctx.fillStyle = g.color + Math.round(40 + 50 * pulse).toString(16).padStart(2, '0'); ctx.fill();
  }));
  const labels = g.pins || g.labels || [];
  let lastX = { top: -1e9, bottom: -1e9 }, lift = { top: 0, bottom: 0 };
  labels.forEach(p => {
    const [sx, sy] = toScreen(c, p.x, p.y);
    if (p.row === 'side') {
      const lx = sx + 120;
      ctx.strokeStyle = g.color; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(sx + 20, sy); ctx.lineTo(lx - 40, sy); ctx.stroke();
      ctx.font = `700 24px ${FONT}`; const w = ctx.measureText(p.label).width + 26; pill(ctx, lx - 40 + w / 2, sy, p.label, g.color, '#fff', 24);
      return;
    }
    const dir = p.row === 'top' ? -1 : 1;
    lift[p.row] = sx - lastX[p.row] < 110 ? (lift[p.row] ? 0 : 56) : 0; lastX[p.row] = sx;
    const off = (p.up || p.down || 70) + lift[p.row], r = (p.pair ? 7 : 7) * c.z, ly = sy + dir * off;
    ctx.strokeStyle = g.color; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(sx, sy + dir * (r + 4)); ctx.lineTo(sx, ly - dir * 18); ctx.stroke();
    pill(ctx, sx, ly, p.label, g.color, '#fff', 22);
  });
  ctx.restore();
}

// Overview: outline every group in its colour with its name.
function drawAll(ctx, c, map, a) {
  if (a <= 0) return;
  ctx.save(); ctx.globalAlpha = a;
  for (const [id, [side, off]] of Object.entries(map)) {
    const g = G[id];
    let bx0 = 1e9, by0 = 1e9, bx1 = -1e9, by1 = -1e9;
    g.rects.forEach(([x0, y0, x1, y1]) => {
      const [a0, b0] = toScreen(c, x0, y0), [a1, b1] = toScreen(c, x1, y1);
      ctx.beginPath(); rr(ctx, a0 - 4, b0 - 4, a1 - a0 + 8, b1 - b0 + 8, 9); ctx.strokeStyle = g.color; ctx.lineWidth = 3; ctx.stroke();
      ctx.fillStyle = g.color + '14'; ctx.fill();
      bx0 = Math.min(bx0, a0); by0 = Math.min(by0, b0); bx1 = Math.max(bx1, a1); by1 = Math.max(by1, b1);
    });
    ctx.strokeStyle = g.color; ctx.lineWidth = 2;
    if (side === 's') {
      const y = (by0 + by1) / 2; ctx.beginPath(); ctx.moveTo(bx1 + 6, y); ctx.lineTo(bx1 + 40, y); ctx.stroke();
      ctx.font = `700 20px ${FONT}`; const w = ctx.measureText(g.name).width + 22; pill(ctx, bx1 + 40 + w / 2, y, g.name, g.color, '#fff', 20);
    } else {
      const x = (bx0 + bx1) / 2, y0 = side === 't' ? by0 - 6 : by1 + 6, y = side === 't' ? by0 - off : by1 + off;
      ctx.beginPath(); ctx.moveTo(x, y0); ctx.lineTo(x, y); ctx.stroke();
      pill(ctx, x, y, g.name, g.color, '#fff', 20);
    }
  }
  ctx.restore();
}

function wrap(ctx, text, maxW) {
  const words = text.split(' '), lines = []; let line = '';
  for (const w of words) { const test = line ? line + ' ' + w : w; if (ctx.measureText(test).width > maxW && line) { lines.push(line); line = w; } else line = test; }
  if (line) lines.push(line);
  return lines;
}

function drawText(ctx, s, a, i) {
  if (a <= 0) return;
  const dy = (1 - a) * 26;
  ctx.save(); ctx.globalAlpha = a; ctx.textBaseline = 'alphabetic';
  if (s.layout === 'hero' || s.layout === 'top' || s.layout === 'specs') {
    const hero = s.layout === 'hero';
    ctx.textAlign = 'center';
    ctx.font = `600 ${hero ? 30 : 26}px ${FONT}`; ctx.fillStyle = ACCENT; ctx.fillText(s.kicker, 960, (hero ? 170 : 140) + dy);
    ctx.font = `800 ${hero ? 128 : 80}px ${FONT}`; ctx.fillStyle = INK; ctx.letterSpacing = hero ? '-4px' : '-2px';
    ctx.fillText(s.title, 960, (hero ? 300 : 232) + dy); ctx.letterSpacing = '0px';
    if (s.body) { ctx.font = `500 ${hero ? 40 : 32}px ${FONT}`; ctx.fillStyle = MUTED; ctx.fillText(s.body, 960, (hero ? 368 : 292) + dy); }
    if (s.foot) { ctx.font = `700 30px ${FONT}`; ctx.fillStyle = INK; ctx.fillText(s.foot, 960, 990 + dy); }
  } else {
    ctx.textAlign = 'left';
    const x = 150; let y = 360 + dy;
    ctx.font = `600 26px ${FONT}`; ctx.fillStyle = s.g ? G[s.g].color : ACCENT; ctx.fillText(s.g ? `${s.kicker} · ${G[s.g].name}` : s.kicker, x, y);
    ctx.font = `800 70px ${FONT}`; ctx.fillStyle = INK; ctx.letterSpacing = '-2px';
    y += 84; for (const l of wrap(ctx, s.title, 640)) { ctx.fillText(l, x, y); y += 78; }
    ctx.letterSpacing = '0px'; ctx.font = `500 30px ${FONT}`; ctx.fillStyle = MUTED;
    y += 6; for (const l of wrap(ctx, s.body, 600)) { ctx.fillText(l, x, y); y += 44; }
    if (s.chips) {
      y += 26; let cx = x; ctx.font = `600 22px ${FONT}`;
      for (const ch of s.chips) {
        const w = ctx.measureText(ch).width + 30;
        if (cx + w > x + 640) { cx = x; y += 52; }
        ctx.beginPath(); rr(ctx, cx, y - 30, w, 42, 21); ctx.strokeStyle = s.g ? G[s.g].color : INK; ctx.lineWidth = 2; ctx.stroke();
        ctx.fillStyle = INK; ctx.textAlign = 'left'; ctx.fillText(ch, cx + 15, y - 1); cx += w + 10;
      }
    }
  }
  ctx.restore();
}

// Spec scene: CM4 and CM5 side by side, then the enclosure.
function drawSpecs(ctx, a, u) {
  if (a <= 0) return;
  ctx.save();
  const cols = [['CM4', 1], ['CM5', 2]];
  cols.forEach(([name, k], j) => {
    const p = ease((u - .5 - j * .25) / .7) * a, x = 300 + j * 690, y = 360 + (1 - p) * 40, w = 630, h = 470;
    ctx.globalAlpha = p;
    ctx.beginPath(); rr(ctx, x, y, w, h, 34); ctx.fillStyle = '#f5f5f7'; ctx.fill();
    ctx.textAlign = 'left'; ctx.font = `800 64px ${FONT}`; ctx.fillStyle = j ? ACCENT : INK; ctx.fillText(name, x + 50, y + 110);
    SPECS.slice(1).forEach(([label, ...v], r) => {
      ctx.font = `600 22px ${FONT}`; ctx.fillStyle = MUTED; ctx.fillText(label, x + 50, y + 180 + r * 76);
      ctx.font = `700 30px ${FONT}`; ctx.fillStyle = INK; ctx.fillText(v[k - 1], x + 50, y + 216 + r * 76);
    });
  });
  const p = ease((u - 1.3) / .7) * a;
  ctx.globalAlpha = p; ctx.textAlign = 'center'; ctx.font = `600 30px ${FONT}`; ctx.fillStyle = INK;
  ctx.fillText('Metal, fanless, DIN-rail mount  ·  141.2 × 83.5 × 39.5 mm  ·  DC 10–30 V', 960, 920);
  ctx.restore();
}

function render(ctx, t) {
  t = Math.max(0, Math.min(TOTAL - 1e-3, t));
  const i = sceneAt(t), s = SCENES[i], prev = SCENES[i - 1], u = t - s.t0;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, FW, FH);
  const out = 1 - clamp((u - (s.d - .4)) / .4), p = ease(u / 1.1);
  let cam = s.img ? camOf(s) : null;
  if (cam && prev && prev.img === s.img) {
    const a = camOf(prev);
    cam = { img: s.img, cx: lerp(a.cx, cam.cx, p), cy: lerp(a.cy, cam.cy, p), z: a.z * Math.pow(cam.z / a.z, p), vx: lerp(a.vx, cam.vx, p), vy: lerp(a.vy, cam.vy, p) };
    drawImage(ctx, cam, 1);
  } else {
    const f = ease(u / .8);
    if (prev && prev.img) { const a = camOf(prev); a.z *= 1 + .06 * f; drawImage(ctx, a, 1 - f); }
    if (cam) { cam = { ...cam, z: cam.z * (.94 + .06 * f) }; drawImage(ctx, cam, f); }
  }
  const ha = ease((u - .9) / .5) * out;
  if (cam && s.g) drawGroup(ctx, cam, G[s.g], ha, t);
  if (cam && s.all) drawAll(ctx, cam, s.all, ha);
  if (s.layout === 'side' && s.img) {   // soft white fade behind the text column
    const gr = ctx.createLinearGradient(0, 0, 820, 0);
    gr.addColorStop(0, 'rgba(255,255,255,.96)'); gr.addColorStop(.78, 'rgba(255,255,255,.9)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = gr; ctx.fillRect(0, 0, 820, FH);
  }
  if (s.layout === 'top' && s.img) {   // fade the top of the photo under the headline
    const gr = ctx.createLinearGradient(0, 0, 0, 380);
    gr.addColorStop(0, 'rgba(255,255,255,.97)'); gr.addColorStop(.75, 'rgba(255,255,255,.9)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = gr; ctx.fillRect(0, 0, FW, 380);
  }
  if (s.layout !== 'hero') {   // and the bottom under the chapter footer
    const gr = ctx.createLinearGradient(0, 970, 0, 1080);
    gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(.5, 'rgba(255,255,255,.92)'); gr.addColorStop(1, '#fff');
    ctx.fillStyle = gr; ctx.fillRect(0, 970, FW, 110);
  }
  if (s.layout === 'specs') drawSpecs(ctx, out, u);
  drawText(ctx, s, ease((u - .25) / .6) * out, i);
  if (s.layout !== 'hero') {   // chapter footer
    ctx.save(); ctx.globalAlpha = .9; ctx.font = `600 20px ${FONT}`; ctx.fillStyle = '#86868b';
    ctx.textAlign = 'left'; ctx.fillText('IRIV PiControl', 150, 1030);
    ctx.textAlign = 'right'; ctx.fillText(`${String(i).padStart(2, '0')} / ${SCENES.length - 2}  ·  ${s.g ? G[s.g].name : s.kicker}`, 1770, 1030);
    ctx.fillStyle = '#e8e8ed'; ctx.fillRect(150, 1046, 1620, 3); ctx.fillStyle = ACCENT; ctx.fillRect(150, 1046, 1620 * t / TOTAL, 3);
    ctx.restore();
  }
}

/* ---------- export ---------- */
const loadScript = src => new Promise((res, rej) => { const s = document.createElement('script'); s.src = src; s.onload = res; s.onerror = () => rej(new Error('Could not load ' + src)); document.head.appendChild(s); });

// Frame-by-frame MP4 with WebCodecs; falls back to a real-time recording where WebCodecs is missing.
async function exportVideo(onProgress = () => {}) {
  await filmReady;
  const cv = document.createElement('canvas'); cv.width = FW; cv.height = FH;
  const ctx = cv.getContext('2d');
  let codec = null;
  if ('VideoEncoder' in window) for (const c of ['avc1.640028', 'avc1.4d0028', 'avc1.42e028'])
    if ((await VideoEncoder.isConfigSupported({ codec: c, width: FW, height: FH, bitrate: 5e6, framerate: FPS })).supported) { codec = c; break; }
  if (!codec) return recordRealtime(cv, ctx, onProgress);
  if (!window.Mp4Muxer) await loadScript('https://cdn.jsdelivr.net/npm/mp4-muxer@5.1.3/build/mp4-muxer.min.js');
  const muxer = new Mp4Muxer.Muxer({ target: new Mp4Muxer.ArrayBufferTarget(), video: { codec: 'avc', width: FW, height: FH, frameRate: FPS }, fastStart: 'in-memory' });
  let failed = null;
  const enc = new VideoEncoder({ output: (chunk, meta) => muxer.addVideoChunk(chunk, meta), error: e => { failed = e; } });
  enc.configure({ codec, width: FW, height: FH, bitrate: 5e6, framerate: FPS });
  const n = Math.round(TOTAL * FPS);
  for (let k = 0; k < n; k++) {
    if (failed) throw failed;
    render(ctx, k / FPS);
    const frame = new VideoFrame(cv, { timestamp: Math.round(k * 1e6 / FPS), duration: Math.round(1e6 / FPS) });
    enc.encode(frame, { keyFrame: k % (FPS * 2) === 0 }); frame.close();
    while (enc.encodeQueueSize > 8) await new Promise(r => setTimeout(r, 2));
    if (k % 10 === 0) { onProgress(k / n); await new Promise(r => setTimeout(r)); }
  }
  await enc.flush(); muxer.finalize();
  onProgress(1);
  return new Blob([muxer.target.buffer], { type: 'video/mp4' });
}

function recordRealtime(cv, ctx, onProgress) {
  const type = ['video/mp4', 'video/webm;codecs=vp9', 'video/webm'].find(t => window.MediaRecorder && MediaRecorder.isTypeSupported(t));
  if (!type) return Promise.reject(new Error('This browser cannot record video.'));
  return new Promise(res => {
    const rec = new MediaRecorder(cv.captureStream(FPS), { mimeType: type, videoBitsPerSecond: 10e6 }), parts = [];
    rec.ondataavailable = e => parts.push(e.data);
    rec.onstop = () => res(new Blob(parts, { type: type.split(';')[0] }));
    const start = performance.now();
    rec.start();
    (function tick() {
      const t = (performance.now() - start) / 1000;
      render(ctx, t); onProgress(t / TOTAL);
      if (t < TOTAL) requestAnimationFrame(tick); else rec.stop();
    })();
  });
}
