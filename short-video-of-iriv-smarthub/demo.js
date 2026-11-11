// Live demo: three simulated SmartHub jobs drawn on a canvas, each a pure function of time t,
// so the same scene plays on the page and inside the exported film.
//   pos():     a shop checkout: USB scanner, cashier screen (HDMI0), customer display (HDMI1), receipt, stock over MQTT.
//   signage(): two 4K screens showing a scheduled playlist.
//   mes():     a production tracker fed by machine signals over MQTT.
// All readings are simulated for demonstration.

const DEMO_FONT = 'Inter, "Segoe UI", system-ui, sans-serif';
const DC = { bg0: '#0b1220', bg1: '#141d2e', panel: '#1a2435', line: '#344052', text: '#e8edf5', dim: '#8a94a6', ok: '#30d158', bad: '#ff453a', ai: '#0a84ff', amber: '#ffd60a' };
const sm = n => { n = Math.max(0, Math.min(1, n)); return n * n * (3 - 2 * n); };

function dRR(c, x, y, w, h, r) { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }
function dPill(c, x, y, text, bg, fg, s) {
  c.font = `700 ${s}px ${DEMO_FONT}`;
  const w = c.measureText(text).width + s * 1.1, h = s * 1.7;
  dRR(c, x - w / 2, y - h / 2, w, h, h / 2); c.fillStyle = bg; c.fill();
  c.fillStyle = fg; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(text, x, y + s * .05); c.textBaseline = 'alphabetic';
}
function dText(c, text, x, y, font, color, align = 'left') { c.font = font + ' ' + DEMO_FONT; c.fillStyle = color; c.textAlign = align; c.fillText(text, x, y); }

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
// A monitor with a title bar; body(x, y, w, h) draws inside it.
function screen(c, x, y, w, h, label, port, body) {
  dRR(c, x, y, w, h, 18); c.fillStyle = '#05080f'; c.fill(); c.strokeStyle = DC.line; c.lineWidth = 3; c.stroke();
  c.fillStyle = '#283344'; c.fillRect(x + w / 2 - 60, y + h, 120, 14); c.fillRect(x + w / 2 - 110, y + h + 14, 220, 8);
  dText(c, label, x + 22, y + 38, '700 22px', DC.text); dText(c, port, x + w - 22, y + 38, '600 20px', DC.dim, 'right');
  c.save(); dRR(c, x + 12, y + 54, w - 24, h - 66, 10); c.clip(); body(x + 12, y + 54, w - 24, h - 66); c.restore();
}
// The row of port → device chips under each demo.
function flow(c, steps) {
  const w = 1520 / steps.length;
  steps.forEach(([label, port, on, col], i) => {
    const x = 40 + i * w;
    dRR(c, x, 716, w - 14, 86, 16); c.fillStyle = on ? col + '26' : DC.panel; c.fill(); c.strokeStyle = on ? col : DC.line; c.lineWidth = on ? 3 : 1; c.stroke();
    c.beginPath(); c.arc(x + 30, 759, 10, 0, 7); c.fillStyle = on ? col : '#3a4253'; c.fill();
    dText(c, label, x + 54, 752, '700 23px', DC.text); dText(c, port, x + 54, 782, '600 19px', DC.dim);
  });
}

/* ---------- shop checkout ---------- */
const POS_CYCLE = 15;
const POS_ITEMS = [['Mineral water 1.5 L', 2.5, 1], ['Bread loaf', 4.2, 2.5], ['Instant noodles × 5', 6.9, 4], ['AA batteries × 4', 12.9, 5.5]];
const posMoney = v => 'RM ' + v.toFixed(2);
function pos(c, t, W, H) {
  const u = ((t % POS_CYCLE) + POS_CYCLE) % POS_CYCLE, scanned = POS_ITEMS.filter(i => u >= i[2]), total = scanned.reduce((s, i) => s + i[1], 0);
  const paid = u >= 8, printing = u >= 8.4 && u < 10.6, stock = u >= 10.6, reorder = u >= 12, beep = POS_ITEMS.some(i => u >= i[2] && u < i[2] + .35);
  demoStage(c, W, H, 'SHOP CHECKOUT · ONE SMARTHUB, TWO SCREENS', () => {
    screen(c, 40, 100, 900, 540, 'Cashier screen', 'HDMI0', (x, y, w, h) => {
      c.fillStyle = '#0d1524'; c.fillRect(x, y, w, h);
      dText(c, 'Sale 0142', x + 24, y + 44, '700 26px', DC.dim);
      POS_ITEMS.forEach((item, i) => {
        const a = sm((u - item[2]) / .3); if (a <= 0) return;
        c.globalAlpha = a; const ry = y + 74 + i * 62;
        dRR(c, x + 20, ry, w - 40, 52, 10); c.fillStyle = u < item[2] + .6 ? 'rgba(10,132,255,.28)' : 'rgba(255,255,255,.06)'; c.fill();
        dText(c, item[0], x + 40, ry + 35, '600 26px', DC.text); dText(c, posMoney(item[1]), x + w - 40, ry + 35, '700 26px', DC.text, 'right'); c.globalAlpha = 1;
      });
      c.fillStyle = paid ? 'rgba(48,209,88,.16)' : 'rgba(255,255,255,.06)'; c.fillRect(x, y + h - 110, w, 110);
      dText(c, paid ? 'PAID · card' : scanned.length ? 'TOTAL' : 'Scan the first item', x + 30, y + h - 44, '700 30px', paid ? DC.ok : DC.dim);
      dText(c, posMoney(total), x + w - 30, y + h - 36, '800 60px', paid ? DC.ok : DC.text, 'right');
    });
    screen(c, 990, 100, 570, 330, 'Customer display', 'HDMI1', (x, y, w, h) => {
      c.fillStyle = paid ? '#0c2a17' : '#101a2c'; c.fillRect(x, y, w, h);
      dText(c, paid ? 'Thank you!' : scanned.length ? scanned[scanned.length - 1][0] : 'Welcome', x + w / 2, y + 86, '700 34px', DC.text, 'center');
      dText(c, posMoney(total), x + w / 2, y + 186, '800 84px', paid ? DC.ok : DC.text, 'center');
      dText(c, paid ? (printing ? 'Receipt printing' : 'Paid by card') : 'Total to pay', x + w / 2, y + 232, '600 24px', DC.dim, 'center');
    });
    // receipt printer and stock card
    dRR(c, 990, 470, 270, 170, 16); c.fillStyle = DC.panel; c.fill();
    dText(c, 'Receipt printer', 1010, 506, '700 22px', DC.text); dText(c, 'USB 2.0', 1010, 534, '600 19px', DC.dim);
    const paper = 70 * sm((u - 8.4) / 2); c.fillStyle = '#f5f5f7'; c.fillRect(1085, 632 - paper, 80, paper);
    c.fillStyle = '#9aa3b2'; for (let k = 0; k < Math.floor(paper / 12); k++) c.fillRect(1095, 628 - paper + 8 + k * 12, 60, 3);
    dRR(c, 1290, 470, 270, 170, 16); c.fillStyle = reorder ? 'rgba(255,214,10,.14)' : DC.panel; c.fill();
    dText(c, 'Stock · AA batteries', 1310, 506, '700 22px', DC.text);
    dText(c, String(stock ? 3 : 4), 1310, 590, '800 70px', reorder ? DC.amber : DC.text); dText(c, 'left', 1362, 590, '600 24px', DC.dim);
    dText(c, reorder ? 'Reorder sent' : stock ? 'Updated' : 'Reorder at 3', 1310, 624, '600 20px', reorder ? DC.amber : DC.dim);
    flow(c, [['Barcode scanner', 'USB 2.0', beep, DC.ai], ['Two screens', 'HDMI0 · HDMI1', scanned.length > 0, DC.ai], ['Receipt', 'USB 2.0', printing, DC.ok], ['Stock update', 'Ethernet · MQTT', stock && u < 12, DC.amber], ['Reorder', 'Node-RED rule', reorder, DC.amber]]);
  }, reorder ? 'Stock is low, so the reorder goes out on its own.' : stock ? 'Every sale updates the stock over MQTT.' : paid ? 'Paid. The receipt prints from a USB port.' : 'Each scan appears on both screens at once.');
}

/* ---------- digital signage ---------- */
const SLIDE = 4;
const MENU = [['Nasi lemak', 'RM 6.90'], ['Chicken rice', 'RM 8.50'], ['Teh tarik', 'RM 2.80'], ['Iced coffee', 'RM 3.50']];
const PROMOS = [['#f56300', 'Lunch set', 'Rice + drink', 'RM 9.90'], ['#0a84ff', 'Now serving', 'Queue number', 'A 047'], ['#30d158', 'New today', 'Fresh pandan cake', 'RM 4.50']];
function signage(c, t, W, H) {
  const k = Math.floor(t / SLIDE), f = sm((t - k * SLIDE) / .6), hi = k % MENU.length;
  demoStage(c, W, H, 'DIGITAL SIGNAGE · TWO 4K SCREENS FROM ONE BOX', () => {
    screen(c, 40, 100, 740, 540, 'Screen 1 · menu board', 'HDMI0 · 4K', (x, y, w, h) => {
      c.fillStyle = '#12100c'; c.fillRect(x, y, w, h);
      dText(c, 'Today’s menu', x + 34, y + 70, '800 46px', '#ffd9a8');
      MENU.forEach((m, i) => {
        const ry = y + 110 + i * 84, on = i === hi;
        dRR(c, x + 24, ry, w - 48, 70, 12); c.fillStyle = on ? `rgba(245,99,0,${.14 + .2 * f})` : 'rgba(255,255,255,.05)'; c.fill();
        dText(c, m[0], x + 48, ry + 46, '700 32px', DC.text); dText(c, m[1], x + w - 48, ry + 46, '800 32px', on ? '#ffb070' : DC.text, 'right');
      });
    });
    screen(c, 820, 100, 740, 540, 'Screen 2 · promotions', 'HDMI1 · 4K', (x, y, w, h) => {
      for (const [idx, a] of [[k - 1, 1 - f], [k, f]]) {
        const p = PROMOS[((idx % PROMOS.length) + PROMOS.length) % PROMOS.length];
        c.globalAlpha = a; c.fillStyle = p[0]; c.fillRect(x, y, w, h);
        c.fillStyle = 'rgba(0,0,0,.22)'; c.fillRect(x, y + h - 150, w, 150);
        dText(c, p[1], x + 44, y + 110, '800 68px', '#fff'); dText(c, p[2], x + 44, y + 168, '600 34px', 'rgba(255,255,255,.9)');
        dText(c, p[3], x + 44, y + h - 46, '800 86px', '#fff');
      }
      c.globalAlpha = 1;
    });
    flow(c, [['Playlist', 'Ethernet / Wi-Fi', t % 20 < 1.2, DC.ai], ['Screen 1', 'HDMI0 · 4K @ 60 Hz', true, DC.ok], ['Screen 2', 'HDMI1 · 4K @ 60 Hz', true, DC.ok], ['Schedule', 'Built-in clock (RTC)', true, DC.amber]]);
  }, 'One SmartHub plays a different playlist on each screen.');
}

/* ---------- production tracker ---------- */
const MES_CYCLE = 16;
const JOBS = [['Job 2041 · Bottle caps', 500, 0, '#0a84ff'], ['Job 2042 · Labels', 300, 5, '#30d158'], ['Job 2043 · Cartons', 200, 10, '#ffd60a']];
function mes(c, t, W, H) {
  const u = ((t % MES_CYCLE) + MES_CYCLE) % MES_CYCLE, stop = u >= 7 && u < 9.5, pulse = !stop && (u * 3) % 1 < .35;
  let made = 0;
  demoStage(c, W, H, 'PRODUCTION TRACKER · NODE-RED ON THE SMARTHUB', () => {
    screen(c, 40, 100, 1040, 540, 'Jobs today', 'HDMI0', (x, y, w, h) => {
      c.fillStyle = '#0d1524'; c.fillRect(x, y, w, h);
      JOBS.forEach((j, i) => {
        const run = Math.max(0, Math.min(5, u - j[2] - (j[2] < 7 && u > 7 ? Math.min(2.5, u - 7) : 0))), p = Math.min(1, run / 5), n = Math.round(j[1] * p); made += n;
        const state = p >= 1 ? 'Done' : u < j[2] ? 'Waiting' : stop ? 'Stopped' : 'Running', col = state === 'Done' ? DC.ok : state === 'Stopped' ? DC.bad : state === 'Running' ? j[3] : DC.dim, ry = y + 34 + i * 150;
        dText(c, j[0], x + 30, ry + 34, '700 30px', DC.text); dPill(c, x + w - 110, ry + 24, state, col + '33', col, 22);
        dRR(c, x + 30, ry + 56, w - 60, 30, 15); c.fillStyle = 'rgba(255,255,255,.08)'; c.fill();
        if (p > 0) { dRR(c, x + 30, ry + 56, Math.max(30, (w - 60) * p), 30, 15); c.fillStyle = col; c.fill(); }
        dText(c, `${n} / ${j[1]} units`, x + 30, ry + 122, '600 24px', DC.dim);
      });
    });
    dRR(c, 1120, 100, 440, 255, 18); c.fillStyle = DC.panel; c.fill();
    dText(c, 'Units made', 1150, 150, '700 24px', DC.dim); dText(c, String(made), 1150, 250, '800 96px', DC.text);
    dText(c, 'counted from machine pulses', 1150, 300, '600 22px', DC.dim);
    dRR(c, 1120, 385, 440, 255, 18); c.fillStyle = stop ? 'rgba(255,69,58,.16)' : DC.panel; c.fill(); c.strokeStyle = stop ? DC.bad : 'transparent'; c.lineWidth = 3; c.stroke();
    dText(c, 'Line 1', 1150, 435, '700 24px', DC.dim); dText(c, stop ? 'STOPPED' : 'RUNNING', 1150, 520, '800 64px', stop ? DC.bad : DC.ok);
    dText(c, stop ? 'Guard door open · 2.5 min lost' : 'No stoppage', 1150, 572, '600 22px', stop ? DC.text : DC.dim);
    flow(c, [['Machine signals', 'IO Controller MQTT', pulse, DC.ai], ['Broker', 'Ethernet · MQTT', pulse, DC.ai], ['Node-RED', 'On the SmartHub', true, DC.ok], ['Dashboard', 'HDMI0 · browser', true, DC.ok], ['Stoppage alert', 'Buzzer + LED', stop, DC.bad]]);
  }, stop ? 'A stoppage shows on the screen the moment it happens.' : 'Machine pulses arrive over MQTT and fill each job.');
}

const DEMOS = { pos, signage, mes };
