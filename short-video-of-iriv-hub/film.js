// The IRIV Edge dashboard film: recorded screens of this demo with a slow camera move and a caption
// card, drawn purely from the time t so it can play live or be rendered frame by frame into an MP4.
// The screens come from tools/capture-iriv-hub-shots.cjs. All readings are simulated.

const FW = 1920, FH = 1080, FPS = 30;
const FONT = 'Inter, "Segoe UI", system-ui, sans-serif';
const INK = '#1d1d1f', MUTED = '#6e6e73', ACCENT = '#0277bd';

const IMG = Object.fromEntries(['city', 'airport', 'find', 'wiring', 'rules', 'mqtt', 'failover', 'camera', 'control'].map(k => [k, `images/${k}.jpg`]));
// cam: [x, y, zoom, screen x, screen y]: the image point (x, y) is drawn at the screen point. Panel scenes keep the side panel in view.
const MAP = [960, 540, 1, 960, 540], PANEL = (y) => [1690, y, 1.9, 1500, 540];
const SCENES = [
  { id: 'intro', img: 'city', cam: MAP, kicker: 'IRIV Edge · in this demo', title: 'One screen for every unit.', body: 'Controllers, cameras and sensors in one live view.' },
  { id: 'map', img: 'airport', cam: MAP, kicker: 'The map', title: 'Every unit, where it is installed.', body: 'Here is the airport.' },
  { id: 'find', img: 'find', cam: [960, 540, 1.3, 1220, 540], kicker: 'Find units', title: 'Find any IRIV unit.', body: 'One button lists them all. Click a row and the map flies to it.' },
  { id: 'wiring', img: 'wiring', cam: PANEL(420), kicker: 'Wiring', title: 'What it is wired to.', body: 'Sensors, relays and the network, with live states.' },
  { id: 'rules', img: 'rules', cam: PANEL(450), kicker: 'Rules', title: 'The rules it runs.', body: 'Each rule shows its live reading and whether it is firing.' },
  { id: 'mqtt', img: 'mqtt', cam: PANEL(470), kicker: 'MQTT', title: 'Every change, published.', body: 'Topic and payload for each message.' },
  { id: 'failover', img: 'failover', cam: PANEL(290), kicker: 'Offline', title: 'Cut the network.', body: 'The unit keeps running its own rules and buffers its messages.' },
  { id: 'camera', img: 'camera', cam: PANEL(780), kicker: 'Camera', title: 'The video stays on the device.', body: 'Edge AI units open with a live camera view. Only the results are sent.' },
  { id: 'control', img: 'control', cam: MAP, cardX: 1060, kicker: 'Control centre', title: 'One wall for the airport.', body: 'Cameras, flights, passengers and the car park together.' },
  { id: 'outro', layout: 'outro', kicker: 'Explore', title: 'See it live.', body: 'Press IRIV units, then click any unit.' }
].map((s, i) => {
  const voice = NARRATION.scenes[i];
  if (!voice) throw Error('SCENES and NARRATION.scenes differ in length: regenerate narration.js');
  return { ...s, d: voice.duration, ...(voice.display ? { body: voice.display } : {}) };
});
let acc = 0;
SCENES.forEach(s => { s.t0 = acc; acc += s.d; });
const TOTAL = acc;

const IMGS = {};
const filmReady = Promise.all([
  ...Object.entries(IMG).map(([k, src]) => new Promise((res, rej) => { const im = new Image(); im.onload = () => { IMGS[k] = im; res(); }; im.onerror = rej; im.src = src; })),
  document.fonts ? Promise.all(['400', '600', '700', '800'].map(w => document.fonts.load(`${w} 40px Inter`))).catch(() => {}) : null
]);

const clamp = v => Math.max(0, Math.min(1, v));
const ease = v => { v = clamp(v); return v < .5 ? 4 * v * v * v : 1 - Math.pow(-2 * v + 2, 3) / 2; };
const sceneAt = t => { let i = SCENES.length - 1; while (i > 0 && SCENES[i].t0 > t) i--; return i; };

function drawShot(ctx, s, u, alpha) {
  const im = IMGS[s.img]; if (!im || alpha <= 0) return;
  const [cx, cy, z0, vx, vy] = s.cam, z = z0 * (1 + .035 * clamp(u / s.d));   // slow push-in
  ctx.save(); ctx.globalAlpha = alpha; ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(im, vx - cx * z, vy - cy * z, FW * z, FH * z);   // shots are 2× the frame size
  ctx.restore();
}

function wrap(ctx, text, x, y, width, lh) {
  let line = '', yy = y;
  for (const w of text.split(' ')) { const t = line ? line + ' ' + w : w; if (ctx.measureText(t).width > width && line) { ctx.fillText(line, x, yy); line = w; yy += lh; } else line = t; }
  ctx.fillText(line, x, yy); return yy;
}
function drawCard(ctx, s, a, i) {
  ctx.save(); ctx.globalAlpha = a; ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
  const x = s.cardX ?? 80, y = 600 + (1 - ease(a)) * 24, w = 780, h = 290;
  ctx.shadowColor = 'rgba(15,23,36,.18)'; ctx.shadowBlur = 40; ctx.shadowOffsetY = 12;
  ctx.fillStyle = 'rgba(255,255,255,.96)'; ctx.beginPath(); ctx.roundRect(x, y, w, h, 28); ctx.fill(); ctx.shadowColor = 'transparent';
  ctx.fillStyle = ACCENT; ctx.font = `700 26px ${FONT}`; ctx.fillText(s.kicker.toUpperCase(), x + 44, y + 70);
  ctx.fillStyle = INK; ctx.font = `800 58px ${FONT}`; const end = wrap(ctx, s.title, x + 44, y + 145, w - 88, 66);
  ctx.fillStyle = '#515159'; ctx.font = `500 32px ${FONT}`; wrap(ctx, s.body, x + 44, end + 62, w - 88, 42);
  ctx.restore();
}
function drawOutro(ctx, u) {
  const a = ease(u / .6);
  ctx.save(); ctx.globalAlpha = a; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = ACCENT; ctx.font = `700 30px ${FONT}`; ctx.fillText(NARRATION.product, 960, 250);
  ctx.fillStyle = INK; ctx.font = `800 96px ${FONT}`; ctx.fillText('See it live.', 960, 380);
  ctx.fillStyle = '#515159'; ctx.font = `500 40px ${FONT}`; ctx.fillText('Press “IRIV units”, then click any unit.', 960, 470);
  ctx.fillStyle = '#1d1d1f'; ctx.beginPath(); ctx.roundRect(300, 580, 1320, 125, 26); ctx.fill();
  ctx.fillStyle = '#fff'; ctx.font = `700 36px ${FONT}`; ctx.fillText('dineshpalsingh1989.github.io/demodashboard', 960, 633);
  ctx.fillStyle = '#e3e3e8'; ctx.font = `500 27px ${FONT}`; ctx.fillText('Open “IRIV films” for the EdgeAI and PiControl tours', 960, 676);
  ctx.restore();
}

function render(ctx, t, k = 1) {
  t = Math.max(0, Math.min(TOTAL - 1e-3, t));
  const i = sceneAt(t), s = SCENES[i], prev = SCENES[i - 1], u = t - s.t0;
  ctx.setTransform(k, 0, 0, k, 0, 0);
  ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, FW, FH);
  if (s.layout === 'outro') drawOutro(ctx, u);
  else {
    const f = ease(u / .8);
    if (prev && prev.img) drawShot(ctx, prev, prev.d, 1 - f);
    drawShot(ctx, s, u, prev && prev.img ? f : 1);
    const gr = ctx.createLinearGradient(0, 960, 0, 1080); gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(.5, 'rgba(255,255,255,.92)'); gr.addColorStop(1, '#fff');
    ctx.fillStyle = gr; ctx.fillRect(0, 960, FW, 120);
    drawCard(ctx, s, ease((u - .25) / .6) * (1 - clamp((u - (s.d - .4)) / .4)), i);
    ctx.save(); ctx.font = `700 22px ${FONT}`; const label = 'SIMULATED DEMO DATA', w = ctx.measureText(label).width + 40;
    ctx.fillStyle = 'rgba(15,23,36,.82)'; ctx.beginPath(); ctx.roundRect(340, 120, w, 44, 22); ctx.fill(); ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(label, 340 + w / 2, 143); ctx.restore();
  }
  drawTourFooter(ctx, i, t);
}

const exportVideo = exportNarratedTour;
