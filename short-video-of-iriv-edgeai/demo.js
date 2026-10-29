// Live AI demo: two simulated EdgeAI jobs drawn on a canvas, each a pure function of time t,
// so the same scene plays on the page and inside the exported film.
//   factory(): a photoelectric trigger (DI0) fires the camera (MIPI0) and light (L0); the AI checks
//              each bottle and the reject jet (DO0) blows faulty ones into the bin.
//   gate():    an IP camera (ETH0) tracks cars and people, reads plates and opens the barrier (DO0).
// All readings are simulated for demonstration.

const DEMO_FONT = 'Inter, "Segoe UI", system-ui, sans-serif';
const hash = n => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const DC = { bg0: '#0b1220', bg1: '#141d2e', line: '#2b3445', text: '#e8edf5', dim: '#8a94a6', ok: '#30d158', bad: '#ff453a', ai: '#0a84ff', amber: '#ffd60a' };

function dRR(c, x, y, w, h, r) { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }
function dPill(c, x, y, text, bg, fg, s) {
  c.font = `700 ${s}px ${DEMO_FONT}`;
  const w = c.measureText(text).width + s * 1.1, h = s * 1.7;
  dRR(c, x - w / 2, y - h / 2, w, h, h / 2); c.fillStyle = bg; c.fill();
  c.fillStyle = fg; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(text, x, y + s * .05);
}
const clock = t => { const s = Math.floor(36000 + 7 * 60 + t); return [Math.floor(s / 3600), Math.floor(s / 60) % 60, s % 60].map(v => String(v).padStart(2, '0')).join(':'); };

// Shared chrome: dark monitor background, I/O lamps and counters.
function demoFrame(c, W, H, title, port) {
  const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, DC.bg0); g.addColorStop(1, DC.bg1);
  c.fillStyle = g; c.fillRect(0, 0, W, H);
  const s = W / 1600;
  c.font = `700 ${22 * s}px ${DEMO_FONT}`; c.fillStyle = DC.text; c.textAlign = 'left'; c.textBaseline = 'alphabetic'; c.fillText(title, 40 * s, 52 * s);
  c.font = `600 ${16 * s}px ${DEMO_FONT}`; c.fillStyle = DC.dim; c.fillText(port, 40 * s, 80 * s);
  c.textAlign = 'right'; c.font = `500 ${14 * s}px ${DEMO_FONT}`; c.fillText('Simulation · illustrative values', W - 40 * s, H - 24 * s);
}
function lamps(c, W, H, items) {   // [label, port, on, color]
  const s = W / 1600, x0 = 40 * s, y = H - 120 * s;
  items.forEach(([label, port, on, col], i) => {
    const x = x0 + i * 190 * s;
    dRR(c, x, y, 176 * s, 74 * s, 16 * s); c.fillStyle = on ? 'rgba(255,255,255,.1)' : 'rgba(255,255,255,.04)'; c.fill();
    c.beginPath(); c.arc(x + 26 * s, y + 37 * s, 10 * s, 0, 7); c.fillStyle = on ? col : '#3a4253'; c.fill();
    if (on) { c.beginPath(); c.arc(x + 26 * s, y + 37 * s, 18 * s, 0, 7); c.fillStyle = col + '33'; c.fill(); }
    c.textAlign = 'left'; c.textBaseline = 'alphabetic';
    c.font = `700 ${17 * s}px ${DEMO_FONT}`; c.fillStyle = DC.text; c.fillText(label, x + 48 * s, y + 33 * s);
    c.font = `600 ${13 * s}px ${DEMO_FONT}`; c.fillStyle = DC.dim; c.fillText(port, x + 48 * s, y + 54 * s);
  });
}
function counters(c, W, H, items) {   // [label, value, color]
  const s = W / 1600, w = 150 * s, x0 = W - 40 * s - items.length * (w + 10 * s) + 10 * s, y = H - 120 * s;
  items.forEach(([label, value, col], i) => {
    const x = x0 + i * (w + 10 * s);
    dRR(c, x, y, w, 74 * s, 16 * s); c.fillStyle = 'rgba(255,255,255,.06)'; c.fill();
    c.textAlign = 'left'; c.textBaseline = 'alphabetic';
    c.font = `800 ${28 * s}px ${DEMO_FONT}`; c.fillStyle = col || DC.text; c.fillText(value, x + 16 * s, y + 38 * s);
    c.font = `600 ${13 * s}px ${DEMO_FONT}`; c.fillStyle = DC.dim; c.fillText(label, x + 16 * s, y + 60 * s);
  });
}
function eventLog(c, W, lines) {
  const s = W / 1600;
  c.textAlign = 'left'; c.textBaseline = 'alphabetic'; c.font = `500 ${14 * s}px ui-monospace, Consolas, monospace`;
  lines.slice(-4).forEach((l, i, a) => { c.fillStyle = i === a.length - 1 ? DC.text : DC.dim; c.fillText(l, 40 * s, (120 + i * 22) * s); });
}

/* ---------- factory inspection ---------- */
const FX_GAP = 1.7, FX_V = .15, FX_CAM = .42, FX_SENS = .36, FX_REJ = .72, FX_X0 = -.08;
const DEFECTS = [null, 'NO CAP', 'NO LABEL', 'LOW FILL'];
const part = i => ({ i, t0: i * FX_GAP + hash(i) * .25, defect: hash(i + .5) < .22 ? DEFECTS[1 + Math.floor(hash(i + .9) * 3)] : null, conf: 93 + Math.floor(hash(i + .3) * 6), ms: (6.4 + hash(i + .7) * 2.6).toFixed(1) });
const tCam = p => p.t0 + (FX_CAM - FX_X0) / FX_V, tRej = p => p.t0 + (FX_REJ - FX_X0) / FX_V;

function bottle(c, x, yb, w, h, p, alpha = 1) {
  c.save(); c.globalAlpha *= alpha;
  const bw = w, bh = h * .72, nw = w * .42, nh = h * .14;
  dRR(c, x - bw / 2, yb - bh, bw, bh, bw * .18); c.fillStyle = 'rgba(120,180,255,.22)'; c.fill(); c.strokeStyle = 'rgba(160,205,255,.7)'; c.lineWidth = Math.max(1, w * .04); c.stroke();
  const fill = p.defect === 'LOW FILL' ? .32 : .78;
  c.save(); dRR(c, x - bw / 2, yb - bh, bw, bh, bw * .18); c.clip(); c.fillStyle = '#4aa3ff'; c.fillRect(x - bw / 2, yb - bh * fill, bw, bh * fill); c.restore();
  c.fillStyle = 'rgba(160,205,255,.5)'; c.fillRect(x - nw / 2, yb - bh - nh, nw, nh);
  if (p.defect !== 'NO CAP') { c.fillStyle = '#ff6b3d'; dRR(c, x - nw * .62, yb - bh - nh - h * .09, nw * 1.24, h * .1, w * .05); c.fill(); }
  if (p.defect !== 'NO LABEL') { c.fillStyle = '#f5f5f7'; c.fillRect(x - bw / 2, yb - bh * .62, bw, bh * .3); c.fillStyle = '#f56300'; c.fillRect(x - bw / 2, yb - bh * .52, bw, bh * .09); }
  c.restore();
}

function factory(c, t, W, H) {
  const s = W / 1600, belt = H * .66, bw = W * .042, bh = H * .2;
  demoFrame(c, W, H, 'Bottle inspection line', 'MIPI0 camera · DI0 trigger · L0 light · DO0 reject jet');
  // conveyor
  c.fillStyle = DC.line; dRR(c, W * .03, belt, W * .94, H * .03, H * .015); c.fill();
  c.strokeStyle = 'rgba(255,255,255,.12)'; c.lineWidth = 2 * s;
  const off = (t * FX_V * W) % (40 * s);
  for (let x = W * .04 + off; x < W * .96; x += 40 * s) { c.beginPath(); c.moveTo(x, belt + H * .006); c.lineTo(x - 10 * s, belt + H * .024); c.stroke(); }
  for (const x of [.08, .3, .52, .74, .92]) { c.fillStyle = '#1c2433'; c.fillRect(W * x - 6 * s, belt + H * .03, 12 * s, H * .1); }
  // reject bin
  c.fillStyle = '#1c2433'; dRR(c, W * (FX_REJ - .05), H * .76, W * .1, H * .1, 10 * s); c.fill();
  c.font = `600 ${13 * s}px ${DEMO_FONT}`; c.fillStyle = DC.dim; c.textAlign = 'center'; c.fillText('REJECT BIN', W * FX_REJ, H * .815);

  const first = Math.max(0, Math.floor((t - 9) / FX_GAP)), last = Math.floor(t / FX_GAP) + 1, parts = [];
  for (let i = first; i <= last; i++) parts.push(part(i));
  let di = false, light = false, jet = false, mqtt = false, lastCap = null;
  for (const p of parts) {
    const x = FX_X0 + (t - p.t0) * FX_V, tc = tCam(p), tr = tRej(p);
    if (t < p.t0) continue;
    if (Math.abs(x - FX_SENS) < .022) di = true;
    if (t >= tc && t < tc + .14) light = true;
    if (t >= tc && t < tc + .5) mqtt = true;
    if (t >= tc) lastCap = p;
    let px = x, yb = belt, alpha = 1;
    if (p.defect && t >= tr) {   // blown off the belt into the bin
      const f = Math.min(1, (t - tr) / .5); px = FX_REJ + f * .015; yb = belt + f * H * .17; alpha = 1 - Math.max(0, (t - tr - .5) / .3);
      if (t < tr + .3) jet = true;
      if (alpha <= 0) continue;
    }
    if (px > 1.05) continue;
    bottle(c, W * px, yb, bw, bh, p, alpha);
    if (t >= tc && px > FX_CAM - .07 && px < FX_REJ + .02 && yb === belt) {   // AI result rides with the bottle
      const col = p.defect ? DC.bad : DC.ok, bx = W * px - bw * .8, by = belt - bh * 1.12;
      c.strokeStyle = col; c.lineWidth = 3 * s; dRR(c, bx, by, bw * 1.6, bh * 1.12, 6 * s); c.stroke();
      dPill(c, W * px, by - 18 * s, p.defect ? `${p.defect} ${p.conf}%` : `OK ${p.conf}%`, col, '#fff', 15 * s);
    }
  }
  // photoelectric sensor (DI0)
  const sy = belt - bh * .45;
  c.fillStyle = '#3a4253'; c.fillRect(W * FX_SENS - 8 * s, sy - 30 * s, 16 * s, 30 * s);
  c.setLineDash([8 * s, 6 * s]); c.strokeStyle = di ? DC.ok : 'rgba(255,69,58,.6)'; c.lineWidth = 2 * s;
  c.beginPath(); c.moveTo(W * FX_SENS, sy); c.lineTo(W * FX_SENS, belt); c.stroke(); c.setLineDash([]);
  // camera with ring light (MIPI0 + L0)
  const cx = W * FX_CAM, cy = H * .2;
  c.fillStyle = '#3a4253'; c.fillRect(cx - 4 * s, 0, 8 * s, cy - 30 * s);
  const cone = c.createLinearGradient(0, cy, 0, belt); cone.addColorStop(0, light ? 'rgba(255,214,10,.35)' : 'rgba(10,132,255,.18)'); cone.addColorStop(1, 'rgba(10,132,255,0)');
  c.fillStyle = cone; c.beginPath(); c.moveTo(cx - 18 * s, cy + 20 * s); c.lineTo(cx + 18 * s, cy + 20 * s); c.lineTo(cx + W * .065, belt); c.lineTo(cx - W * .065, belt); c.closePath(); c.fill();
  dRR(c, cx - 34 * s, cy - 34 * s, 68 * s, 54 * s, 10 * s); c.fillStyle = '#20293a'; c.fill();
  c.beginPath(); c.arc(cx, cy + 20 * s, 26 * s, 0, Math.PI); c.strokeStyle = light ? DC.amber : '#4b5468'; c.lineWidth = 7 * s; c.stroke();
  c.beginPath(); c.arc(cx, cy + 8 * s, 12 * s, 0, 7); c.fillStyle = '#0a84ff'; c.fill();
  dPill(c, cx, cy - 52 * s, 'CAM 1 · MIPI0', 'rgba(255,255,255,.1)', DC.text, 13 * s);
  // reject air jet (DO0)
  const jx = W * FX_REJ;
  c.fillStyle = '#3a4253'; c.fillRect(jx - 5 * s, H * .44, 10 * s, belt - bh * 1.15 - H * .44);
  if (jet) { c.fillStyle = 'rgba(255,214,10,.3)'; c.beginPath(); c.moveTo(jx - 6 * s, belt - bh * 1.15); c.lineTo(jx + 6 * s, belt - bh * 1.15); c.lineTo(jx + 30 * s, belt - bh * .2); c.lineTo(jx - 30 * s, belt - bh * .2); c.closePath(); c.fill(); }
  dPill(c, jx, H * .44 - 18 * s, 'REJECT JET · DO0', jet ? DC.bad : 'rgba(255,255,255,.1)', DC.text, 13 * s);
  // inset: what the camera saw
  const ix = W * .66, iy = H * .07, iw = W * .3, ih = H * .3;
  dRR(c, ix, iy, iw, ih, 14 * s); c.fillStyle = '#05080f'; c.fill(); c.strokeStyle = 'rgba(255,255,255,.12)'; c.lineWidth = 1.5 * s; c.stroke();
  c.textAlign = 'left'; c.font = `600 ${13 * s}px ${DEMO_FONT}`; c.fillStyle = DC.dim; c.fillText('LAST CAPTURE · 1456×1088', ix + 14 * s, iy + 24 * s);
  if (lastCap) {
    const col = lastCap.defect ? DC.bad : DC.ok, flash = Math.max(0, 1 - (t - tCam(lastCap)) / .25);
    bottle(c, ix + iw * .2, iy + ih * .9, bw * 1.5, bh * 1.05, lastCap);
    c.strokeStyle = col; c.lineWidth = 3 * s; dRR(c, ix + iw * .2 - bw * 1.05, iy + ih * .2, bw * 2.1, ih * .74, 8 * s); c.stroke();
    if (flash > 0) { c.fillStyle = `rgba(255,255,255,${.5 * flash})`; dRR(c, ix, iy, iw, ih, 14 * s); c.fill(); }
    c.font = `800 ${30 * s}px ${DEMO_FONT}`; c.fillStyle = col; c.fillText(lastCap.defect || 'PASS', ix + iw * .42, iy + ih * .45);
    c.font = `600 ${15 * s}px ${DEMO_FONT}`; c.fillStyle = DC.text; c.fillText(`Bottle #${1000 + lastCap.i} · ${lastCap.conf}% sure`, ix + iw * .42, iy + ih * .6);
    c.fillStyle = DC.dim; c.fillText(`AI inference ${lastCap.ms} ms`, ix + iw * .42, iy + ih * .72);
  } else { c.font = `600 ${16 * s}px ${DEMO_FONT}`; c.fillStyle = DC.dim; c.fillText('Waiting for the DI0 trigger…', ix + 14 * s, iy + ih * .55); }
  // log and counters
  let inspected = 0, bad = 0;
  const all = []; for (let i = 0; i <= last; i++) { const p = part(i); if (tCam(p) <= t) { inspected++; if (p.defect) bad++; all.push(p); } }
  eventLog(c, W, all.slice(-4).map(p => `${clock(tCam(p))}  #${1000 + p.i}  ${(p.defect || 'OK').padEnd(8)} ${p.ms} ms  → MQTT`));
  lamps(c, W, H, [['Trigger', 'DI0', di, DC.ok], ['Light', 'L0', light, DC.amber], ['Reject', 'DO0', jet, DC.bad], ['Publish', 'ETH1 · MQTT', mqtt, DC.ai]]);
  counters(c, W, H, [['Inspected', String(inspected)], ['Passed', String(inspected - bad), DC.ok], ['Rejected', String(bad), DC.bad], ['Yield', inspected ? Math.round((inspected - bad) / inspected * 100) + '%' : '—']]);
}

/* ---------- CCTV & ANPR gate ---------- */
const GT_GAP = 3.4, GT_V = .13, GT_READ = .42, GT_BAR = .6, GT_X0 = -.12;
const LET = 'ABCDJKMNPQRSTVWY';
const plate = i => `${'WJBPAKN'[Math.floor(hash(i + .1) * 7)]}${LET[Math.floor(hash(i + .2) * 16)]}${LET[Math.floor(hash(i + .4) * 16)]} ${1000 + Math.floor(hash(i + .6) * 8999)}`;
const CAR_COL = ['#e5383b', '#f5f5f7', '#0a84ff', '#30d158', '#ffd60a', '#8e8e93', '#bf5af2'];
const car = i => ({ i, t0: i * GT_GAP + hash(i + 2) * .6, col: CAR_COL[Math.floor(hash(i + 3) * CAR_COL.length)], plate: plate(i), conf: 95 + Math.floor(hash(i + 4) * 5), ms: (8 + hash(i + 5) * 4).toFixed(1) });
const person = i => ({ i, t0: i * 3.4 + hash(i + 7) * .8, v: .04 + hash(i + 8) * .025, col: ['#ff9f0a', '#64d2ff', '#ff375f', '#30d158'][i % 4], conf: 90 + Math.floor(hash(i + 9) * 9) });
const tRead = cr => cr.t0 + (GT_READ - GT_X0) / GT_V;

function drawCar(c, x, yb, w, h, col) {
  c.fillStyle = col; dRR(c, x - w / 2, yb - h * .55, w, h * .42, h * .12); c.fill();
  c.beginPath(); c.moveTo(x - w * .3, yb - h * .55); c.lineTo(x - w * .16, yb - h * .9); c.lineTo(x + w * .18, yb - h * .9); c.lineTo(x + w * .34, yb - h * .55); c.closePath(); c.fill();
  c.fillStyle = 'rgba(10,20,40,.75)'; c.beginPath(); c.moveTo(x - w * .24, yb - h * .58); c.lineTo(x - w * .13, yb - h * .84); c.lineTo(x + w * .15, yb - h * .84); c.lineTo(x + w * .27, yb - h * .58); c.closePath(); c.fill();
  c.fillStyle = '#0b0f17'; for (const k of [-.3, .3]) { c.beginPath(); c.arc(x + w * k, yb - h * .12, h * .14, 0, 7); c.fill(); }
  c.fillStyle = '#ffd60a'; c.fillRect(x + w * .44, yb - h * .45, w * .05, h * .08);
}
function drawPerson(c, x, yb, h, col, t) {
  const sw = Math.sin(t * 6) * h * .08;
  c.strokeStyle = col; c.lineWidth = h * .09; c.lineCap = 'round';
  c.beginPath(); c.moveTo(x, yb - h * .45); c.lineTo(x - sw, yb); c.moveTo(x, yb - h * .45); c.lineTo(x + sw, yb); c.moveTo(x, yb - h * .45); c.lineTo(x, yb - h * .8); c.stroke();
  c.beginPath(); c.arc(x, yb - h * .9, h * .1, 0, 7); c.fillStyle = col; c.fill(); c.lineCap = 'butt';
}

function gate(c, t, W, H) {
  const s = W / 1600, road = H * .77, walk = H * .46;
  demoFrame(c, W, H, 'Car park gate · CCTV & ANPR', 'IP camera on ETH0 · loop detector DI0 · barrier DO0');
  c.fillStyle = '#1a2231'; c.fillRect(0, walk, W, H * .05);
  c.fillStyle = '#222b3b'; c.fillRect(0, road - H * .12, W, H * .14);
  c.setLineDash([30 * s, 24 * s]); c.strokeStyle = 'rgba(255,255,255,.25)'; c.lineWidth = 3 * s; c.beginPath(); c.moveTo(0, road - H * .05); c.lineTo(W, road - H * .05); c.stroke();
  c.setLineDash([6 * s, 6 * s]); c.strokeStyle = 'rgba(10,132,255,.6)'; c.beginPath(); c.moveTo(W * GT_READ, road - H * .2); c.lineTo(W * GT_READ, road + H * .02); c.stroke(); c.setLineDash([]);
  dPill(c, W * GT_READ, road + H * .05, 'COUNT + READ LINE', 'rgba(10,132,255,.25)', DC.text, 12 * s);
  // people on the walkway
  let people = 0;
  for (let i = Math.max(0, Math.floor((t - 30) / 3.4)); i <= Math.floor(t / 3.4) + 1; i++) {
    const p = person(i), x = 1.05 - (t - p.t0) * p.v;
    if (t < p.t0 || x < -.05) continue;
    const ph = H * .11, px = W * x, py = walk + H * .03;
    drawPerson(c, px, py, ph, p.col, t + i);
    if (x > .05 && x < .95) { people++; c.strokeStyle = DC.amber; c.lineWidth = 2 * s; dRR(c, px - ph * .3, py - ph * 1.05, ph * .6, ph * 1.1, 4 * s); c.stroke(); dPill(c, px, py - ph * 1.05 - 12 * s, `person ${p.conf}%`, DC.amber, '#000', 12 * s); }
  }
  // cars
  const cw = W * .13, ch = H * .17;
  let barrier = 0, loop = false, mqtt = false, lastRead = null, vehicles = 0;
  const first = Math.max(0, Math.floor((t - 12) / GT_GAP)), last = Math.floor(t / GT_GAP) + 1;
  for (let i = 0; i <= last; i++) { const cr = car(i); if (tRead(cr) <= t) { vehicles++; lastRead = cr; } }
  for (let i = first; i <= last; i++) {
    const cr = car(i), x = GT_X0 + (t - cr.t0) * GT_V, tr = tRead(cr);
    if (t < cr.t0 || x > 1.15) continue;
    if (x > GT_BAR - .14 && x < GT_BAR + .08) loop = true;
    if (t >= tr && x < GT_BAR + .1) barrier = Math.max(barrier, Math.min(1, (t - tr) / .5));
    if (t >= tr && t < tr + .6) mqtt = true;
    drawCar(c, W * x, road, cw, ch, cr.col);
    if (x > .02 && x < .98) {
      const read = t >= tr, col = read ? DC.ok : DC.ai;
      c.strokeStyle = col; c.lineWidth = 3 * s; dRR(c, W * x - cw * .55, road - ch * 1.02, cw * 1.1, ch * 1.02, 6 * s); c.stroke();
      dPill(c, W * x, road - ch * 1.02 - 16 * s, read ? `${cr.plate} · car ${cr.conf}%` : `car ${cr.conf}%`, col, '#fff', 14 * s);
    }
  }
  // barrier (DO0)
  const bx = W * GT_BAR, by = road - H * .2, ang = -barrier * Math.PI * .45;
  c.fillStyle = '#3a4253'; c.fillRect(bx - 10 * s, by, 20 * s, H * .2);
  c.save(); c.translate(bx, by + 10 * s); c.rotate(ang);
  for (let k = 0; k < 6; k++) { c.fillStyle = k % 2 ? '#f5f5f7' : DC.bad; c.fillRect(k * W * .022, -5 * s, W * .022, 10 * s); }
  c.restore();
  dPill(c, bx, by - 22 * s, barrier > .5 ? 'BARRIER OPEN · DO0' : 'BARRIER · DO0', barrier > .5 ? DC.ok : 'rgba(255,255,255,.1)', DC.text, 13 * s);
  // inset: plate read
  const ix = W * .66, iy = H * .07, iw = W * .3, ih = H * .25;
  dRR(c, ix, iy, iw, ih, 14 * s); c.fillStyle = '#05080f'; c.fill(); c.strokeStyle = 'rgba(255,255,255,.12)'; c.lineWidth = 1.5 * s; c.stroke();
  c.textAlign = 'left'; c.font = `600 ${13 * s}px ${DEMO_FONT}`; c.fillStyle = DC.dim; c.fillText('ANPR · IP CAMERA ON ETH0 (RTSP)', ix + 14 * s, iy + 24 * s);
  if (lastRead) {
    dRR(c, ix + 20 * s, iy + ih * .28, iw * .52, ih * .32, 10 * s); c.fillStyle = '#111'; c.fill(); c.strokeStyle = '#f5f5f7'; c.lineWidth = 3 * s; c.stroke();
    c.font = `800 ${34 * s}px ${DEMO_FONT}`; c.fillStyle = '#f5f5f7'; c.textAlign = 'center'; c.fillText(lastRead.plate, ix + 20 * s + iw * .26, iy + ih * .5);
    c.textAlign = 'left'; c.font = `700 ${16 * s}px ${DEMO_FONT}`; c.fillStyle = DC.ok; c.fillText('✓ Paid · barrier opened', ix + 20 * s, iy + ih * .78);
    c.font = `600 ${14 * s}px ${DEMO_FONT}`; c.fillStyle = DC.dim; c.fillText(`${lastRead.conf}% sure · ${lastRead.ms} ms`, ix + 20 * s, iy + ih * .9);
  } else { c.font = `600 ${16 * s}px ${DEMO_FONT}`; c.fillStyle = DC.dim; c.fillText('Waiting for a vehicle…', ix + 14 * s, iy + ih * .55); }
  const reads = []; for (let i = Math.max(0, last - 5); i <= last; i++) { const cr = car(i); if (tRead(cr) <= t) reads.push(cr); }
  eventLog(c, W, reads.map(cr => `${clock(tRead(cr))}  ${cr.plate.padEnd(9)} car ${cr.conf}%  ${cr.ms} ms  → MQTT`));
  lamps(c, W, H, [['Stream', 'ETH0 · RTSP', true, DC.ai], ['Loop', 'DI0', loop, DC.ok], ['Barrier', 'DO0', barrier > .05, DC.amber], ['Publish', 'ETH1 · MQTT', mqtt, DC.ai]]);
  counters(c, W, H, [['Vehicles today', String(212 + vehicles)], ['Plates read', String(209 + vehicles), DC.ok], ['People in view', String(people), DC.amber], ['Avg inference', '9.6 ms']]);
}

const DEMOS = { factory, gate };
