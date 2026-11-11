// Live demo: two simulated IO Controller MQTT jobs drawn on a canvas, each a pure function of time t,
// so the same scene plays on the page and inside the exported film.
//   pump():    a float switch (DI0) asks for water, the dashboard starts the pump (DO0), pressure rises on AN0.
//   machine(): cycle pulses are counted on DI0, a guard-door stop on DI2 lights the stack lamp on DO1.
// All readings, topics and payloads are simulated for demonstration.

const DEMO_FONT = 'Inter, "Segoe UI", system-ui, sans-serif', MONO = 'ui-monospace, Consolas, monospace';
const DC = { bg0: '#0b1220', bg1: '#141d2e', panel: '#1a2435', line: '#344052', text: '#e8edf5', dim: '#8a94a6', ok: '#30d158', bad: '#ff453a', ai: '#0a84ff', amber: '#ffd60a' };
const sm = n => { n = Math.max(0, Math.min(1, n)); return n * n * (3 - 2 * n); };
const BASE = 'iriv/CB62/';

function dRR(c, x, y, w, h, r) { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }
function dText(c, text, x, y, font, color, align = 'left', family = DEMO_FONT) { c.font = font + ' ' + family; c.fillStyle = color; c.textAlign = align; c.fillText(text, x, y); }

// Every demo draws in a 1600 × 900 space, scaled uniformly and centred.
function demoStage(c, W, H, title, draw, summary) {
  const s = Math.min(W / 1600, H / 900), bg = c.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, DC.bg0); bg.addColorStop(1, DC.bg1); c.fillStyle = bg; c.fillRect(0, 0, W, H);
  c.save(); c.translate((W - 1600 * s) / 2, (H - 900 * s) / 2); c.scale(s, s); c.textBaseline = 'alphabetic';
  dText(c, title, 40, 58, '700 30px', DC.text);
  dText(c, 'SIMULATION · ILLUSTRATIVE VALUES', 1560, 57, '600 22px', '#d2d9e5', 'right');
  draw();
  dText(c, summary, 800, 862, '600 27px', DC.text, 'center');
  c.restore();
}
function panel(c, x, y, w, h, title) { dRR(c, x, y, w, h, 18); c.fillStyle = DC.panel; c.fill(); dText(c, title, x + 24, y + 42, '700 22px', DC.dim); }

// The controller's channel lamps, as on its front panel: 11 inputs, 4 outputs, 2 analog values.
function mimic(c, x, y, di, dout, an) {
  panel(c, x, y, 470, 600, 'IO CONTROLLER MQTT');
  const lamps = (label, n, on, ly, col) => {
    dText(c, label, x + 24, ly, '600 20px', DC.dim);
    for (let i = 0; i < n; i++) {
      const lx = x + 24 + (i % 6) * 71, lyy = ly + 16 + Math.floor(i / 6) * 58, lit = on.includes(i);
      dRR(c, lx, lyy, 62, 46, 10); c.fillStyle = lit ? col + '33' : 'rgba(255,255,255,.05)'; c.fill(); c.strokeStyle = lit ? col : DC.line; c.lineWidth = lit ? 2.5 : 1; c.stroke();
      c.beginPath(); c.arc(lx + 15, lyy + 23, 6, 0, 7); c.fillStyle = lit ? col : '#3a4253'; c.fill();
      dText(c, String(i), lx + 30, lyy + 31, '700 21px', lit ? DC.text : DC.dim);
    }
  };
  lamps('DIGITAL INPUTS · DI0–DI10', 11, di, y + 84, DC.ok);
  lamps('DIGITAL OUTPUTS · DO0–DO3', 4, dout, y + 246, DC.amber);
  dText(c, 'ANALOG INPUTS', x + 24, y + 350, '600 20px', DC.dim);
  an.forEach((v, i) => { dRR(c, x + 24 + i * 214, y + 366, 204, 62, 12); c.fillStyle = 'rgba(142,68,173,.2)'; c.fill(); dText(c, 'AN' + i, x + 40 + i * 214, y + 406, '700 21px', DC.dim); dText(c, v, x + 212 + i * 214, y + 407, '800 26px', DC.text, 'right'); });
  dRR(c, x + 24, y + 456, 422, 118, 14); c.fillStyle = 'rgba(10,132,255,.14)'; c.fill();
  dText(c, 'Ethernet → MQTT broker', x + 44, y + 500, '700 23px', DC.text); dText(c, 'Publishes only what changed', x + 44, y + 540, '600 20px', DC.dim);
}
// MQTT messages so far: [time, topic, value, direction]
function feed(c, x, y, w, h, u, msgs) {
  panel(c, x, y, w, h, 'MQTT MESSAGES');
  const seen = msgs.filter(m => u >= m[0]).slice(-8);
  seen.forEach((m, i) => {
    const ry = y + 66 + i * 64, fresh = u - m[0] < .8, out = m[3] !== 'in';
    dRR(c, x + 18, ry, w - 36, 54, 10); c.fillStyle = fresh ? (out ? 'rgba(10,132,255,.3)' : 'rgba(255,214,10,.22)') : 'rgba(255,255,255,.05)'; c.fill();
    dText(c, out ? '↑' : '↓', x + 34, ry + 36, '800 24px', out ? DC.ai : DC.amber);
    dText(c, BASE + m[1], x + 66, ry + 35, '600 21px', DC.text, 'left', MONO); dText(c, m[2], x + w - 36, ry + 35, '700 21px', out ? DC.text : DC.amber, 'right', MONO);
  });
  if (!seen.length) dText(c, 'Nothing changed, nothing sent.', x + 24, y + 100, '600 22px', DC.dim);
}

/* ---------- pump station ---------- */
const PUMP_CYCLE = 15;
const PUMP_MSGS = [[3, 'di/0', '1'], [3.8, 'do/0', '1', 'in'], [4.3, 'di/1', '1'], [6, 'an/0', '8.4 mA'], [8, 'an/0', '11.2 mA'], [10, 'an/0', '13.6 mA'], [11, 'di/0', '0'], [11.6, 'do/0', '0', 'in'], [12.1, 'di/1', '0']];
function pump(c, t, W, H) {
  const u = ((t % PUMP_CYCLE) + PUMP_CYCLE) % PUMP_CYCLE, low = u >= 3 && u < 11, cmd = u >= 3.8 && u < 11.6, run = u >= 4.3 && u < 12.1;
  const level = u < 4.3 ? .62 - .42 * (u / 4.3) : u < 12.1 ? .2 + .62 * sm((u - 4.3) / 7.8) : .82 - .2 * ((u - 12.1) / 2.9);
  const ma = run ? 6 + 8 * sm((u - 4.3) / 6) : 4.1;
  demoStage(c, W, H, 'PUMP STATION · SIGNALS IN, MESSAGES OUT', () => {
    panel(c, 40, 100, 470, 600, 'WATER TANK');
    dRR(c, 110, 170, 250, 420, 16); c.strokeStyle = '#647084'; c.lineWidth = 4; c.stroke();
    c.save(); dRR(c, 112, 172, 246, 416, 14); c.clip(); c.fillStyle = '#1f6fd0'; c.fillRect(112, 588 - 416 * level, 246, 416 * level);
    c.fillStyle = 'rgba(255,255,255,.14)'; c.fillRect(112, 588 - 416 * level, 246, 8); c.restore();
    c.setLineDash([8, 7]); c.strokeStyle = low ? DC.ok : '#576479'; c.lineWidth = 2.5; c.beginPath(); c.moveTo(100, 588 - 416 * .24); c.lineTo(400, 588 - 416 * .24); c.stroke(); c.setLineDash([]);
    dText(c, 'Float · DI0', 376, 588 - 416 * .24 - 12, '700 20px', low ? DC.ok : DC.dim, 'left');
    dText(c, Math.round(level * 100) + '%', 235, 400, '800 54px', '#fff', 'center');
    c.beginPath(); c.arc(430, 640, 34, 0, 7); c.fillStyle = run ? 'rgba(48,209,88,.25)' : '#283344'; c.fill(); c.strokeStyle = run ? DC.ok : '#576479'; c.lineWidth = 4; c.stroke();
    const a = run ? t * 6 : 0; c.beginPath(); for (let k = 0; k < 3; k++) { c.moveTo(430, 640); c.lineTo(430 + 26 * Math.cos(a + k * 2.094), 640 + 26 * Math.sin(a + k * 2.094)); } c.stroke();
    dText(c, run ? 'Pump running · DO0' : 'Pump off · DO0', 70, 652, '700 22px', run ? DC.ok : DC.dim);
    mimic(c, 550, 100, [...(low ? [0] : []), ...(run ? [1] : [])], cmd ? [0] : [], [ma.toFixed(1) + ' mA', '0.0 V']);
    feed(c, 1060, 100, 500, 600, u, PUMP_MSGS);
  }, run ? 'Pressure on AN0 is published each time it changes.' : low ? 'Low water: DI0 turns on and one message goes out.' : 'Nothing changes, so nothing is sent.');
}

/* ---------- machine monitor ---------- */
const MC_CYCLE = 16;
// One message per cycle pulse (the dashboard does the counting), plus the stop and the lamp command.
const MC_MSGS = [...Array.from({ length: 17 }, (_, k) => { const w = (k + 1) * .8; return [w < 7 ? w : w + 2.5, 'di/0', 'pulse']; }), [7, 'di/2', '1'], [7.6, 'do/1', '1', 'in'], [9.5, 'di/2', '0'], [10.1, 'do/1', '0', 'in']]
  .filter(m => m[0] < MC_CYCLE).sort((x, y) => x[0] - y[0]);
function machine(c, t, W, H) {
  const u = ((t % MC_CYCLE) + MC_CYCLE) % MC_CYCLE, stop = u >= 7 && u < 9.5, lamp = u >= 7.6 && u < 10.1;
  const worked = u < 7 ? u : u < 9.5 ? 7 : u - 2.5, count = 126 + Math.floor(worked / .8), stroke = stop ? 0 : Math.abs(Math.sin(worked / .8 * Math.PI)), pulse = !stop && (worked / .8) % 1 < .3;
  demoStage(c, W, H, 'MACHINE MONITOR · COUNT CYCLES, CATCH STOPS', () => {
    panel(c, 40, 100, 470, 600, 'PRESS 3');
    dRR(c, 120, 200, 240, 330, 14); c.fillStyle = '#283344'; c.fill();
    c.fillStyle = '#647084'; c.fillRect(220, 200, 40, 60 + 150 * stroke); dRR(c, 170, 250 + 150 * stroke, 140, 34, 8); c.fillStyle = stop ? DC.bad : '#9aa3b2'; c.fill();
    c.fillStyle = '#3a4253'; c.fillRect(150, 480, 180, 26);
    for (const [k, col, on] of [[0, DC.bad, lamp], [1, DC.ok, !stop]]) { dRR(c, 410, 210 + k * 62, 52, 54, 10); c.fillStyle = on ? col : '#283344'; c.fill(); }
    dText(c, 'Lamp · DO1', 436, 364, '600 18px', DC.dim, 'center');
    dText(c, String(count), 70, 630, '800 76px', DC.text); dText(c, 'cycles · counted from DI0 pulses', 70, 668, '600 21px', DC.dim);
    dText(c, stop ? 'STOPPED · guard open (DI2)' : 'RUNNING', 486, 142, '800 22px', stop ? DC.bad : DC.ok, 'right');
    mimic(c, 550, 100, [...(pulse ? [0] : []), ...(stop ? [2] : [])], lamp ? [1] : [], ['0.0 V', '0.0 V']);
    feed(c, 1060, 100, 500, 600, u, MC_MSGS);
  }, stop ? 'The stop is reported the moment the guard opens.' : 'Each cycle is a pulse on DI0, published as it happens.');
}

const DEMOS = { pump, machine };
