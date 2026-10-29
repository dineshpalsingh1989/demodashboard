// The film: a 1920×1080 canvas animation drawn purely from the time t, so it can play live or be
// rendered frame by frame into an MP4 with WebCodecs (smooth on any machine).

const FW = 1920, FH = 1080, FPS = 30;
const FONT = 'Inter, "Segoe UI", system-ui, sans-serif';
const INK = '#1d1d1f', MUTED = '#6e6e73', ACCENT = '#f56300';
// The demo scenes draw with DEMOS from demo.js, which loads before this file.

const SCENES = [
  { d: 5, img: 'iso', cam: [430, 470, 1.15], layout: 'side', big: true, kicker: 'Cytron Technologies · IR4.0', title: 'IRIV EdgeAI CM5', body: 'An industrial AI controller that sees, thinks and acts.' },
  { d: 5.5, layout: 'specs', kicker: 'One box', title: 'Sees. Thinks. Acts.', cards: [
    { title: 'Sees', color: '#0071e3', rows: [['Cameras', '2× MIPI CSI'], ['USB 3.0', 'Industrial cameras'], ['Ethernet', 'IP and CCTV cameras']] },
    { title: 'Thinks', color: ACCENT, rows: [['AI accelerator', 'Up to 26 TOPS'], ['Processor', 'Raspberry Pi CM5'], ['Memory', 'Up to 16 GB']] },
    { title: 'Acts', color: '#1a9e45', rows: [['Outputs', '2 dry contacts'], ['Lights', '2 drivers, 2 A each'], ['Network', 'RS485 and 2× Gigabit']] }] },
  { d: 8, layout: 'demo', demo: 'factory', at: 6, kicker: 'See it work', title: 'Check every bottle.' },
  { d: 5.5, img: 'front', cam: [470, 560, 2.0], layout: 'top', kicker: 'Front panel', title: 'Everything wires in at the front.', body: '16 push-in terminals, two Gigabit ports, status LEDs and Wi-Fi.',
    all: { power: ['t', 60], rs485: ['t', 120], do: ['t', 60], led: ['t', 120], lan: ['t', 60], di: ['b', 60], status: ['b', 60], boot: ['b', 60] } },
  { d: 4.2, g: 'power', cam: [372, 560, 3.8] },
  { d: 4.2, g: 'rs485', cam: [402, 553, 3.8] },
  { d: 4.6, g: 'di', cam: [402, 567, 3.8] },
  { d: 4.5, g: 'do', cam: [440, 560, 3.8] },
  { d: 4.6, g: 'led', cam: [468, 560, 3.8] },
  { d: 4.5, g: 'lan', cam: [578, 553, 2.6] },
  { d: 4.8, g: 'status', cam: [268, 580, 3.1] },
  { d: 3.8, g: 'boot', cam: [705, 575, 2.8] },
  { d: 4.2, g: 'wifi', cam: [150, 380, 1.25] },
  { d: 5, g: 'cams', cam: [655, 592, 2.9], kicker: 'Side panel' },
  { d: 4.8, g: 'usb', cam: [560, 650, 2.6], kicker: 'Side panel' },
  { d: 4.5, g: 'cell', cam: [675, 595, 3.0], kicker: 'Side panel' },
  { d: 7.5, layout: 'demo', demo: 'gate', at: 9, kicker: 'Or watch the gate', title: 'Read every plate.' },
  { d: 5.5, layout: 'specs', kicker: 'The brains', title: 'Up to 26 TOPS of AI.', foot2: 'Metal, fanless, DIN rail  ·  139 × 88 × 38 mm  ·  −20 to 60 °C  ·  11 W max', cards: [
    { title: '13 TOPS', color: INK, rows: SPECS.slice(1).map(r => [r[0], r[1]]) }, { title: '26 TOPS', color: ACCENT, rows: SPECS.slice(1).map(r => [r[0], r[2]]) }] },
  { d: 4.2, g: 'din', cam: [330, 560, 1.7], kicker: 'Back' },
  { d: 5, img: 'iso', cam: [430, 470, 1.15], layout: 'side', big: true, kicker: 'Built for the line', title: 'IRIV EdgeAI CM5', body: 'Defect detection · OCR · counting · ANPR · CCTV analytics. From RM2,487 at cytron.io.' }
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
  // glow drawn as wide translucent strokes: canvas shadowBlur is far slower to draw
  ctx.strokeStyle = g.color;
  for (const [lw, al] of [[16, .12], [9, .2], [3.5, 1]]) {
    ctx.globalAlpha = a * al; ctx.lineWidth = lw;
    rects.forEach(([x, y, w, h]) => { ctx.beginPath(); rr(ctx, x - 6, y - 6, w + 12, h + 12, 14); ctx.stroke(); });
  }
  ctx.globalAlpha = a;
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
  if (s.layout === 'demo') {
    ctx.textAlign = 'center';
    ctx.font = `600 24px ${FONT}`; ctx.fillStyle = ACCENT; ctx.fillText(s.kicker, 960, 100 + dy);
    ctx.font = `800 64px ${FONT}`; ctx.fillStyle = INK; ctx.letterSpacing = '-2px'; ctx.fillText(s.title, 960, 172 + dy); ctx.letterSpacing = '0px';
  } else if (s.layout === 'hero' || s.layout === 'top' || s.layout === 'specs') {
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
    const ts = s.big ? 100 : 70;
    ctx.font = `800 ${ts}px ${FONT}`; ctx.fillStyle = INK; ctx.letterSpacing = s.big ? '-3px' : '-2px';
    y += ts * 1.2; for (const l of wrap(ctx, s.title, s.big ? 680 : 640)) { ctx.fillText(l, x, y); y += ts * 1.1; }
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

// Card scene: two or three cards of label / value rows, with an optional line underneath.
function drawSpecs(ctx, s, a, u) {
  if (a <= 0) return;
  ctx.save();
  const n = s.cards.length, gap = 40, w = (1320 - gap * (n - 1)) / n, rows = Math.max(...s.cards.map(c => c.rows.length)), h = 170 + rows * 76;
  s.cards.forEach((card, j) => {
    const p = ease((u - .5 - j * .25) / .7) * a, x = 300 + j * (w + gap), y = 340 + (1 - p) * 40;
    ctx.globalAlpha = p;
    ctx.beginPath(); rr(ctx, x, y, w, h, 34); ctx.fillStyle = '#f5f5f7'; ctx.fill();
    ctx.textAlign = 'left'; ctx.font = `800 ${n > 2 ? 56 : 64}px ${FONT}`; ctx.fillStyle = card.color; ctx.fillText(card.title, x + 46, y + 100);
    card.rows.forEach(([label, v], r) => {
      ctx.font = `600 22px ${FONT}`; ctx.fillStyle = MUTED; ctx.fillText(label, x + 46, y + 166 + r * 76);
      ctx.font = `700 ${n > 2 ? 28 : 30}px ${FONT}`; ctx.fillStyle = INK; ctx.fillText(v, x + 46, y + 202 + r * 76);
    });
  });
  if (s.foot2) { const p = ease((u - 1.3) / .7) * a; ctx.globalAlpha = p; ctx.textAlign = 'center'; ctx.font = `600 30px ${FONT}`; ctx.fillStyle = INK; ctx.fillText(s.foot2, 960, 930); }
  ctx.restore();
}

// Demo scene: the live AI simulation inside a rounded screen.
function drawDemoScene(ctx, s, a, u) {
  const x = 250, y = 215, w = 1420, h = 1420 * 9 / 16 * .98;
  ctx.save(); ctx.globalAlpha = ease(u / .6) * a;
  ctx.beginPath(); rr(ctx, x, y, w, h, 28); ctx.clip();
  ctx.translate(x, y); DEMOS[s.demo](ctx, s.at + u, w, h);
  ctx.restore();
}

// k scales the 1920×1080 frame to the canvas size (the player canvas matches its on-screen size).
function render(ctx, t, k = 1) {
  t = Math.max(0, Math.min(TOTAL - 1e-3, t));
  const i = sceneAt(t), s = SCENES[i], prev = SCENES[i - 1], u = t - s.t0;
  ctx.setTransform(k, 0, 0, k, 0, 0);
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
  if (s.layout === 'specs') drawSpecs(ctx, s, out, u);
  if (s.layout === 'demo') drawDemoScene(ctx, s, out, u);
  drawText(ctx, s, ease((u - .25) / .6) * out, i);
  if (s.layout !== 'hero') {   // chapter footer
    ctx.save(); ctx.globalAlpha = .9; ctx.font = `600 20px ${FONT}`; ctx.fillStyle = '#86868b';
    ctx.textAlign = 'left'; ctx.fillText(PRODUCT, 150, 1030);
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
