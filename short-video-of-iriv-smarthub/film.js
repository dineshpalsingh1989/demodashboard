// The film: a 1920×1080 canvas animation drawn purely from the time t, so it can play live or be
// rendered frame by frame into an MP4 with WebCodecs (smooth on any machine).

const FW = 1920, FH = 1080, FPS = 30;
const FONT = 'Inter, "Segoe UI", system-ui, sans-serif';
const INK = '#1d1d1f', MUTED = '#6e6e73', ACCENT = '#f56300';
// The demo scenes draw with DEMOS from demo.js, which loads before this file.

const SCENES = [
  { d: 6, img: 'hero', cam: [500, 520, .95], layout: 'side', big: true, kicker: 'Cytron Technologies · IR4.0', title: 'IRIV SmartHub CM5', body: 'A fanless industrial computer, built on Raspberry Pi CM5.' },
  { d: 6, layout: 'specs', kicker: 'One box', title: 'Computes. Connects. Displays.', cards: [
    { title: 'Computes', color: ACCENT, rows: [['Processor', 'Raspberry Pi CM5'], ['Memory', 'Up to 16 GB'], ['Storage', 'eMMC + NVMe SSD']] },
    { title: 'Connects', color: '#8e44ad', rows: [['Wired', 'Gigabit Ethernet'], ['Wireless', 'Wi-Fi 5, Bluetooth 5.0'], ['USB', '2× USB 3.0, 2× USB 2.0']] },
    { title: 'Displays', color: '#0071e3', rows: [['Screens', '2× HDMI 2.0'], ['Resolution', '4K at 60 Hz each'], ['Touch', 'Over USB']] }] },
  { d: 15, layout: 'demo', demo: 'pos', at: 0, kicker: 'See it work', title: 'Scan. Pay. Restock.' },
  { d: 6, img: 'rear', cam: [505, 505, 1.75], layout: 'top', kicker: 'Rear panel', title: 'Everything plugs in at the back.', body: 'Gigabit Ethernet, USB 2.0, two HDMI ports and two ways to power it.',
    all: { lan: ['t', 60], usb2: ['t', 120], hdmi: ['t', 60], usbc: ['t', 150], power: ['t', 120] } },
  { d: 4.5, g: 'lan', cam: [238, 515, 2.6], kicker: 'Rear panel' },
  { d: 5, g: 'usb2', cam: [365, 505, 2.6], kicker: 'Rear panel' },
  { d: 6, g: 'hdmi', cam: [527, 500, 2.6], kicker: 'Rear panel' },
  { d: 5, g: 'usbc', cam: [668, 548, 2.6], kicker: 'Rear panel' },
  { d: 5, g: 'power', cam: [795, 522, 2.6], kicker: 'Rear panel' },
  { d: 5, g: 'usb3', cam: [263, 505, 2.6] },
  { d: 5, g: 'buttons', cam: [415, 560, 2.6] },
  { d: 5.5, g: 'leds', cam: [600, 545, 2.6] },
  { d: 5.5, g: 'wifi', cam: [790, 470, 2.6] },
  { d: 5, g: 'cell', cam: [655, 528, 2.2] },
  { d: 9, layout: 'demo', demo: 'signage', at: 2, kicker: 'On the wall', title: 'Two screens. One box.' },
  { d: 9, layout: 'demo', demo: 'mes', at: 4, kicker: 'On the factory floor', title: 'Every job, live.' },
  { d: 7.5, layout: 'specs', kicker: 'The brains', title: 'Raspberry Pi CM5 inside.', foot2: 'Metal, fanless  ·  147 × 94 × 35.7 mm  ·  DC 10–30 V or USB-C', cards: [
    { title: 'Compute', color: ACCENT, rows: [['CPU', 'Quad-core Cortex-A76, 2.4 GHz'], ['RAM', '2, 4, 8 or 16 GB'], ['eMMC', '16, 32 or 64 GB']] },
    { title: 'Built in', color: INK, rows: [['Expansion', 'M.2 NVMe, mini PCIe (USB 2.0)'], ['Clock', 'RTC with coin cell'], ['Signals', 'Buzzer, 2 LEDs, USER button']] }] },
  { d: 5.5, g: 'mount', cam: [421, 620, 1], kicker: 'Top' },
  { d: 7, layout: 'hero', kicker: 'Tested by Cytron', title: '84 days. No restart.', body: 'Uptime recorded in Cytron’s own long-run test.' },
  { d: 8, img: 'hero', cam: [500, 520, .95], layout: 'side', big: true, kicker: 'Built to stay on', title: 'IRIV SmartHub CM5', body: 'Checkouts · signage · dashboards · production tracking. From RM925 at cytron.io.' }
].map((s, i) => {
  const voice = NARRATION.scenes[i];
  if (!voice) throw Error('SCENES and NARRATION.scenes differ in length: regenerate narration.js');
  s = { ...s, d: voice.duration, ...(voice.display ? { body: voice.display } : {}) };
  if (i === NARRATION.scenes.length - 1) return { ...s, layout: "outro", img: undefined };
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
  ctx.drawImage(IMGS[c.img], 0, 0, 1000, 1000);   // photos are stored larger than the 1000-unit space the hotspots use
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
  ctx.fillStyle = `rgba(255,255,255,${.16 * a})`; ctx.fill('evenodd');
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
    ctx.letterSpacing = '0px'; ctx.font = `500 36px ${FONT}`; ctx.fillStyle = MUTED;
    y += 6; for (const l of wrap(ctx, s.body, 600)) { ctx.fillText(l, x, y); y += 48; }
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
  const x = 250, y = 215, w = 1420, h = 740;
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
  if (s.layout === 'outro') { drawTourEnd(ctx, u); drawTourFooter(ctx, i, t); return; }
  if (s.g) { drawTourDetail(ctx, s, u, t); drawTourFooter(ctx, i, t); return; }
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
  drawTourFooter(ctx, i, t);
}

/* ---------- export ---------- */
const exportVideo = exportNarratedTour;
